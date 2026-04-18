const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

router.get('/', async (req, res) => {
  const { category, search, page = 1, limit = 20, sort } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = { active: true };
  if (category) where.category = { slug: category };
  if (search) where.name = { contains: search, mode: 'insensitive' };

  let orderBy = { createdAt: 'desc' };
  if (sort === 'price_asc') orderBy = { price: 'asc' };
  if (sort === 'price_desc') orderBy = { price: 'desc' };
  if (sort === 'name') orderBy = { name: 'asc' };

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: Number(limit),
        include: { category: true },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: true,
        reviews: { include: { user: { select: { name: true } } } },
      },
    });
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(product);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

router.post('/', adminMiddleware, [
  body('name').trim().notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('stock').isInt({ min: 0 }),
  body('categoryId').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const slug = req.body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const product = await prisma.product.create({ data: { ...req.body, slug } });
    res.status(201).json(product);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Slug já existe' });
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(product);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar produto' });
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
