const express = require('express');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const items = await prisma.cart.findMany({
      where: { userId: req.user.id },
      include: { product: { include: { category: true } } },
    });
    const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    res.json({ items, total });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar carrinho' });
  }
});

router.post('/', async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId obrigatório' });

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.active) return res.status(404).json({ error: 'Produto não encontrado' });
    if (product.stock < quantity) return res.status(400).json({ error: 'Estoque insuficiente' });

    const item = await prisma.cart.upsert({
      where: { userId_productId: { userId: req.user.id, productId } },
      update: { quantity: { increment: quantity } },
      create: { userId: req.user.id, productId, quantity },
      include: { product: true },
    });

    res.json(item);
  } catch {
    res.status(500).json({ error: 'Erro ao adicionar ao carrinho' });
  }
});

router.put('/:productId', async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'Quantidade inválida' });

  try {
    const item = await prisma.cart.update({
      where: { userId_productId: { userId: req.user.id, productId: req.params.productId } },
      data: { quantity },
      include: { product: true },
    });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar carrinho' });
  }
});

router.delete('/:productId', async (req, res) => {
  try {
    await prisma.cart.delete({
      where: { userId_productId: { userId: req.user.id, productId: req.params.productId } },
    });
    res.json({ message: 'Item removido' });
  } catch {
    res.status(500).json({ error: 'Erro ao remover item' });
  }
});

router.delete('/', async (req, res) => {
  try {
    await prisma.cart.deleteMany({ where: { userId: req.user.id } });
    res.json({ message: 'Carrinho limpo' });
  } catch {
    res.status(500).json({ error: 'Erro ao limpar carrinho' });
  }
});

module.exports = router;
