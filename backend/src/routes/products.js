const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const adminMiddleware = require('../middleware/admin');
const cache = require('../lib/cache');

const router = express.Router();
const PRODUCTS_TTL = 120; // 2 minutos

router.get('/', async (req, res) => {
  const { category, search, page = 1, limit = 20, sort } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  // Só usa cache em listagens simples sem busca por texto
  const cacheKey = search
    ? null
    : `products:list:${category || ''}:${sort || ''}:${page}:${limit}`;

  if (cacheKey) {
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);
  }

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
    const result = { products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
    if (cacheKey) cache.set(cacheKey, result, PRODUCTS_TTL);
    res.json(result);
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
    const { period, from, to } = req.query;
    const paidStatuses = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

    let dateFilter = {};
    const now = new Date();
    if (period === 'hoje') {
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      dateFilter = { gte: start };
    } else if (period === '7d') {
      const start = new Date(now); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0);
      dateFilter = { gte: start };
    } else if (period === '30d') {
      const start = new Date(now); start.setDate(start.getDate() - 29); start.setHours(0, 0, 0, 0);
      dateFilter = { gte: start };
    } else if (period === 'mes') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { gte: start };
    } else if (period === 'mes_anterior') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      dateFilter = { gte: start, lte: end };
    } else if (from || to) {
      if (from) dateFilter.gte = new Date(from);
      if (to) { const t = new Date(to); t.setHours(23, 59, 59, 999); dateFilter.lte = t; }
    }

    const orderWhere = {
      status: { in: paidStatuses },
      ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
    };

    const [products, salesData, ordersRevenue] = await Promise.all([
      prisma.product.findMany({
        where: { active: true },
        select: {
          id: true, name: true, price: true, costPrice: true,
          stock: true, images: true,
          categories: { select: { id: true, name: true } },
          variants: { where: { active: true }, select: { stock: true, price: true } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true, price: true },
        where: { order: orderWhere },
      }),
      prisma.order.aggregate({
        _sum: { total: true, shippingCost: true },
        where: orderWhere,
      }),
    ]);

    const salesMap = {};
    for (const s of salesData) {
      salesMap[s.productId] = { qtdVendida: s._sum.quantity || 0, receitaVendas: s._sum.price || 0 };
    }

    const data = products.map(p => {
      // estoque efetivo: soma das variantes se existirem, senão stock geral
      const estoqueEfetivo = p.variants?.length > 0
        ? p.variants.reduce((s, v) => s + (v.stock || 0), 0)
        : (p.stock || 0);

      const lucro = p.costPrice != null ? p.price - p.costPrice : null;
      const margem = p.costPrice != null && p.costPrice > 0
        ? ((lucro / p.price) * 100).toFixed(1) : null;
      const sale = salesMap[p.id] || { qtdVendida: 0, receitaVendas: 0 };
      const lucroVendas = p.costPrice != null ? sale.receitaVendas - p.costPrice * sale.qtdVendida : null;
      return {
        ...p, lucro, margem: margem ? Number(margem) : null,
        qtdVendida: sale.qtdVendida,
        receitaVendas: sale.receitaVendas,
        lucroVendas,
        estoqueEfetivo,
      };
    });

    const comCusto = data.filter(p => p.costPrice != null);
    const totalCusto = comCusto.reduce((s, p) => s + p.costPrice * p.estoqueEfetivo, 0);
    const totalReceita = comCusto.reduce((s, p) => s + p.price * p.estoqueEfetivo, 0);
    const totalLucro = totalReceita - totalCusto;
    const margemMedia = comCusto.length > 0
      ? (comCusto.reduce((s, p) => s + p.margem, 0) / comCusto.length).toFixed(1) : null;
    const totalReceitaReal = (ordersRevenue._sum.total || 0) - (ordersRevenue._sum.shippingCost || 0);
    const totalLucroReal = comCusto.reduce((s, p) => s + (p.lucroVendas ?? 0), 0);
    const totalVendaEstoque = data.reduce((s, p) => s + p.price * p.estoqueEfetivo, 0);

    res.json({
      products: data,
      totalProdutos: data.length,
      totalCusto, totalReceita, totalLucro, margemMedia,
      totalReceitaReal, totalLucroReal, totalVendaEstoque,
    });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar dados financeiros' });
  }
});

router.get('/:slug', async (req, res) => {
  const cacheKey = `products:slug:${req.params.slug}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

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
    cache.set(cacheKey, product, PRODUCTS_TTL);
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

  const { name, description, price, comparePrice, costPrice, stock, images, categoryIds = [], availability = 'pronta_entrega', keywords = '',
    allowPersonalization, personalizationNameEnabled, personalizationNameMaxLength, personalizationNamePrice,
    personalizationNumberEnabled, personalizationNumberMaxDigits, personalizationNumberPrice } = req.body;

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
        allowPersonalization: allowPersonalization || false,
        personalizationNameEnabled: personalizationNameEnabled || false,
        personalizationNameMaxLength: personalizationNameMaxLength ? Number(personalizationNameMaxLength) : 10,
        personalizationNamePrice: personalizationNamePrice ? Number(personalizationNamePrice) : 0,
        personalizationNumberEnabled: personalizationNumberEnabled || false,
        personalizationNumberMaxDigits: personalizationNumberMaxDigits ? Number(personalizationNumberMaxDigits) : 3,
        personalizationNumberPrice: personalizationNumberPrice ? Number(personalizationNumberPrice) : 0,
        categories: categoryIds.length > 0
          ? { connect: categoryIds.map(id => ({ id })) }
          : undefined,
      },
      include: { categories: true },
    });
    cache.delByPrefix('products:');
    res.status(201).json(product);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Produto já existe' });
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

router.put('/:id', adminMiddleware, async (req, res) => {
  const { name, description, price, comparePrice, costPrice, stock, images, active, availability, keywords, categoryIds,
    allowPersonalization, personalizationNameEnabled, personalizationNameMaxLength, personalizationNamePrice,
    personalizationNumberEnabled, personalizationNumberMaxDigits, personalizationNumberPrice } = req.body;

  try {
    const data = {};
    if (name !== undefined) { data.name = name; data.slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''); }
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = Number(price);
    if (comparePrice !== undefined) data.comparePrice = comparePrice ? Number(comparePrice) : null;
    if (costPrice !== undefined) data.costPrice = costPrice ? Number(costPrice) : null;
    if (images !== undefined) data.images = images;
    if (active !== undefined) data.active = active;
    if (availability !== undefined) data.availability = availability;
    if (keywords !== undefined) data.keywords = keywords;
    if (allowPersonalization !== undefined) data.allowPersonalization = allowPersonalization;
    if (personalizationNameEnabled !== undefined) data.personalizationNameEnabled = personalizationNameEnabled;
    if (personalizationNameMaxLength !== undefined) data.personalizationNameMaxLength = Number(personalizationNameMaxLength) || 10;
    if (personalizationNamePrice !== undefined) data.personalizationNamePrice = Number(personalizationNamePrice) || 0;
    if (personalizationNumberEnabled !== undefined) data.personalizationNumberEnabled = personalizationNumberEnabled;
    if (personalizationNumberMaxDigits !== undefined) data.personalizationNumberMaxDigits = Number(personalizationNumberMaxDigits) || 3;
    if (personalizationNumberPrice !== undefined) data.personalizationNumberPrice = Number(personalizationNumberPrice) || 0;
    if (categoryIds !== undefined) {
      data.categories = { set: categoryIds.map(id => ({ id })) };
    }

    const variantCount = await prisma.productVariant.count({ where: { productId: req.params.id, active: true } });
    data.stock = variantCount > 0 ? 0 : (stock !== undefined ? Number(stock) : undefined);
    if (data.stock === undefined) delete data.stock;

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data,
      include: { categories: true },
    });
    cache.delByPrefix('products:');
    res.json(product);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

router.post('/admin/migrate-stock', adminMiddleware, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { stock: { gt: 0 } },
      select: { id: true, _count: { select: { variants: { where: { active: true } } } } },
    });
    const toZero = products.filter(p => p._count.variants > 0).map(p => p.id);
    if (toZero.length > 0) {
      await prisma.product.updateMany({ where: { id: { in: toZero } }, data: { stock: 0 } });
    }
    res.json({ updated: toZero.length });
  } catch {
    res.status(500).json({ error: 'Erro na migração' });
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
        images: [], availability: original.availability,
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

router.patch('/:id/toggle', adminMiddleware, async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id }, select: { active: true } });
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: { active: !product.active },
      select: { id: true, active: true },
    });
    cache.delByPrefix('products:');
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

router.post('/admin/bulk', adminMiddleware, async (req, res) => {
  const { ids, action } = req.body;
  if (!Array.isArray(ids) || ids.length === 0)
    return res.status(400).json({ error: 'Nenhum produto selecionado' });
  if (!['activate', 'deactivate', 'delete'].includes(action))
    return res.status(400).json({ error: 'Ação inválida' });

  try {
    if (action === 'activate') {
      await prisma.product.updateMany({ where: { id: { in: ids } }, data: { active: true } });
    } else if (action === 'deactivate') {
      await prisma.product.updateMany({ where: { id: { in: ids } }, data: { active: false } });
    } else {
      for (const id of ids) {
        await prisma.cart.deleteMany({ where: { productId: id } });
        await prisma.wishlist.deleteMany({ where: { productId: id } });
        await prisma.review.deleteMany({ where: { productId: id } });
        await prisma.orderItem.deleteMany({ where: { productId: id } });
        await prisma.productVariant.deleteMany({ where: { productId: id } });
      }
      await prisma.product.deleteMany({ where: { id: { in: ids } } });
    }
    cache.delByPrefix('products:');
    res.json({ affected: ids.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro na ação em massa' });
  }
});

router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    await prisma.cart.deleteMany({ where: { productId: req.params.id } });
    await prisma.wishlist.deleteMany({ where: { productId: req.params.id } });
    await prisma.review.deleteMany({ where: { productId: req.params.id } });
    await prisma.orderItem.deleteMany({ where: { productId: req.params.id } });
    await prisma.productVariant.deleteMany({ where: { productId: req.params.id } });
    await prisma.product.delete({ where: { id: req.params.id } });
    cache.delByPrefix('products:');
    res.json({ message: 'Produto excluído' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir produto' });
  }
});

module.exports = router;
