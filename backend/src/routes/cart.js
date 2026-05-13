const express = require('express');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const items = await prisma.cart.findMany({
      where: { userId: req.user.id },
      include: {
        product: true,
        variant: true,
      },
    });
    const total = items.reduce((sum, i) => {
      const price = i.variant?.price ?? i.product.price;
      return sum + price * i.quantity;
    }, 0);
    res.json({ items, total });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar carrinho' });
  }
});

router.post('/', async (req, res) => {
  const { productId, variantId, quantity = 1, personalization } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId obrigatório' });

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.active) return res.status(404).json({ error: 'Produto não encontrado' });

    if (variantId) {
      const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
      if (!variant || !variant.active) return res.status(404).json({ error: 'Variante não encontrada' });
      if (variant.stock < quantity) return res.status(400).json({ error: 'Estoque insuficiente para esta variante' });
    } else {
      if (product.stock < quantity) return res.status(400).json({ error: 'Estoque insuficiente' });
    }

    // itens personalizados nunca agrupam — cada um é único
    const hasPersonalization = personalization && (personalization.name || personalization.number);

    let item;
    if (hasPersonalization) {
      item = await prisma.cart.create({
        data: { userId: req.user.id, productId, variantId: variantId || null, quantity, personalization },
        include: { product: true, variant: true },
      });
    } else {
      const existing = await prisma.cart.findFirst({
        where: { userId: req.user.id, productId, variantId: variantId || null, personalization: null },
      });
      if (existing) {
        item = await prisma.cart.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + quantity },
          include: { product: true, variant: true },
        });
      } else {
        item = await prisma.cart.create({
          data: { userId: req.user.id, productId, variantId: variantId || null, quantity },
          include: { product: true, variant: true },
        });
      }
    }

    res.json(item);
  } catch {
    res.status(500).json({ error: 'Erro ao adicionar ao carrinho' });
  }
});

router.put('/:id', async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'Quantidade inválida' });

  try {
    const item = await prisma.cart.update({
      where: { id: req.params.id },
      data: { quantity },
      include: { product: true, variant: true },
    });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar carrinho' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.cart.delete({ where: { id: req.params.id } });
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
