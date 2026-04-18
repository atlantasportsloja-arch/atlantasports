const express = require('express');
const prisma = require('../lib/prisma');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
    });
    res.json(categories);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

router.post('/', adminMiddleware, async (req, res) => {
  const { name, image } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome obrigatório' });

  try {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const category = await prisma.category.create({ data: { name, slug, image } });
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Categoria já existe' });
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(category);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
});

router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ message: 'Categoria removida' });
  } catch {
    res.status(500).json({ error: 'Erro ao deletar categoria' });
  }
});

module.exports = router;
