const express = require('express');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const items = await prisma.wishlist.findMany({
      where: { userId: req.user.id },
      include: { product: { include: { categories: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar wishlist' });
  }
});

router.post('/', async (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId obrigatório' });

  try {
    const existing = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId: req.user.id, productId } },
    });

    if (existing) {
      await prisma.wishlist.delete({ where: { userId_productId: { userId: req.user.id, productId } } });
      return res.json({ saved: false });
    }

    await prisma.wishlist.create({ data: { userId: req.user.id, productId } });
    res.status(201).json({ saved: true });
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar wishlist' });
  }
});

router.delete('/:productId', async (req, res) => {
  try {
    await prisma.wishlist.delete({
      where: { userId_productId: { userId: req.user.id, productId: req.params.productId } },
    });
    res.json({ message: 'Removido da wishlist' });
  } catch {
    res.status(500).json({ error: 'Erro ao remover' });
  }
});

module.exports = router;
