const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

router.get('/', async (req, res) => {
  const { category, search, page = 1, limit = 20, sort } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = { active: true };
  if (category) where.categories = { some: { slug: category } };
  if (search) where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { keywords: { contains: search, mode: 'insensitive' } },
  ];

  let orderBy = { createdAt: 'desc' };
  if (sort === 'price_asc') orderBy = { price: 'asc' };
  if (sort === 'price_desc') orderBy = { price: 'desc' };
  if (sort === 'name') orderBy = { name: 'asc' };

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, orderBy, skip, take: Number(limit),
        select: {
          id: true, name: true, slug: true, description: true,
          price: true, comparePrice: true, stock: true, images: true,
          availability: true, active: true, createdAt: true,
          categories: true,
          reviews: { select: { rating: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);
    res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

router.get('/admin/all', adminMiddleware, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { categories: true, variants: { where: { active: true }, orderBy: [{ size: 'asc' }] } },
    });
    res.json({ products });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

router.get('/admin/financeiro', adminMiddleware, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      select: {
        id: true, name: true, price: true, costPrice: true,
        stock: true, images: true,
        categories: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });

    const data = products.map(p => {
      const lucro = p.costPrice != null ? p.price - p.costPrice : null;
      const margem = p.costPrice != null && p.costPrice > 0
        ? ((lucro / p.price) * 100).toFixed(1) : null;
      return { ...p, lucro, margem: margem ? Number(margem) : null };
    });

    const comCusto = data.filter(p => p.costPrice != null);
    const totalCusto = comCusto.reduce((s, p) => s + p.costPrice * p.stock, 0);
    const totalReceita = comCusto.reduce((s, p) => s + p.price * p.stock, 0);
    const totalLucro = totalReceita - totalCusto;
    const margemMedia = comCusto.length > 0
      ? (comCusto.reduce((s, p) => s + p.margem, 0) / comCusto.length).toFixed(1) : null;

    res.json({ products: data, totalProdutos: data.length, totalCusto, totalReceita, totalLucro, margemMedia });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar dados financeiros' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      select: {
        id: true, name: true, slug: true, description: true,
        price: true, comparePrice: true, stock: true, images: true,
        availability: true, keywords: true, active: true, createdAt: true,
        categories: true,
        reviews: { include: { user: { select: { name: true } } } },
        variants: { where: { active: true }, orderBy: [{ size: 'asc' }] },
      },
    });
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(product);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

router.post('/:id/variants', adminMiddleware, async (req, res) => {
  const { size, stock } = req.body;
  if (!size) return res.status(400).json({ error: 'Informe o tamanho' });
  try {
    const variant = await prisma.productVariant.create({
      data: {
        productId: req.params.id,
        size: size.toString().toUpperCase(),
        stock: Number(stock) || 0,
      },
    });
    res.status(201).json(variant);
  } catch (err) {
    console.error('Erro ao criar variante:', err?.message);
    res.status(500).json({ error: 'Erro ao criar variante' });
  }
});

router.put('/:id/variants/:variantId', adminMiddleware, async (req, res) => {
  const { size, color, stock, price, active } = req.body;
  try {
    const variant = await prisma.productVariant.update({
      where: { id: req.params.variantId },
      data: {
        ...(size !== undefined && { size }),
        ...(color !== undefined && { color }),
        ...(stock !== undefined && { stock: Number(stock) }),
        ...(price !== undefined && { price: price ? Number(price) : null }),
        ...(active !== undefined && { active }),
      },
    });
    res.json(variant);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar variante' });
  }
});

router.delete('/:id/variants/:variantId', adminMiddleware, async (req, res) => {
  try {
    await prisma.productVariant.delete({ where: { id: req.params.variantId } });
    res.json({ message: 'Variante removida' });
  } catch {
    res.status(500).json({ error: 'Erro ao remover variante' });
  }
});

router.post('/', adminMiddleware, [
  body('name').trim().notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('stock').isInt({ min: 0 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description, price, comparePrice, costPrice, stock, images, categoryIds = [], availability = 'pronta_entrega', keywords = '' } = req.body;

  try {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const product = await prisma.product.create({
      data: {
        name, description, slug, availability, keywords,
        price: Number(price),
        comparePrice: comparePrice ? Number(comparePrice) : null,
        costPrice: costPrice ? Number(costPrice) : null,
        stock: Number(stock),
        images: images || [],
        categories: categoryIds.length > 0
          ? { connect: categoryIds.map(id => ({ id })) }
          : undefined,
      },
      include: { categories: true },
    });
    res.status(201).json(product);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Produto já existe' });
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

router.put('/:id', adminMiddleware, async (req, res) => {
  const { name, description, price, comparePrice, costPrice, stock, images, active, availability, keywords, categoryIds } = req.body;

  try {
    const data = {};
    if (name !== undefined) { data.name = name; data.slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''); }
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = Number(price);
    if (comparePrice !== undefined) data.comparePrice = comparePrice ? Number(comparePrice) : null;
    if (costPrice !== undefined) data.costPrice = costPrice ? Number(costPrice) : null;
    if (stock !== undefined) data.stock = Number(stock);
    if (images !== undefined) data.images = images;
    if (active !== undefined) data.active = active;
    if (availability !== undefined) data.availability = availability;
    if (keywords !== undefined) data.keywords = keywords;
    if (categoryIds !== undefined) {
      data.categories = { set: categoryIds.map(id => ({ id })) };
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data,
      include: { categories: true },
    });
    res.json(product);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

router.post('/:id/duplicate', adminMiddleware, async (req, res) => {
  try {
    const original = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { categories: true },
    });
    if (!original) return res.status(404).json({ error: 'Produto não encontrado' });

    const newName = `Cópia de ${original.name}`;
    const baseSlug = newName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const slug = `${baseSlug}-${Date.now()}`;

    const copy = await prisma.product.create({
      data: {
        name: newName, slug, description: original.description,
        price: original.price, comparePrice: original.comparePrice,
        costPrice: original.costPrice, stock: original.stock,
        images: original.images, availability: original.availability,
        keywords: original.keywords, active: false,
        categories: { connect: original.categories.map(c => ({ id: c.id })) },
      },
      include: { categories: true },
    });
    res.status(201).json(copy);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao duplicar produto' });
  }
});

router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { active: false } });
    res.json({ message: 'Produto desativado' });
  } catch {
    res.status(500).json({ error: 'Erro ao deletar produto' });
  }
});

module.exports = router;
