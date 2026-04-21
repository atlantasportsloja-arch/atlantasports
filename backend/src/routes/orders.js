const express = require('express');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  const { shippingAddress, shippingCost = 0, couponCode, paymentMethod } = req.body;

  if (!shippingAddress) return res.status(400).json({ error: 'Endereço de entrega obrigatório' });

  try {
    const cartItems = await prisma.cart.findMany({
      where: { userId: req.user.id },
      include: { product: true },
    });

    if (cartItems.length === 0) return res.status(400).json({ error: 'Carrinho vazio' });

    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({ error: `Estoque insuficiente: ${item.product.name}` });
      }
    }

    let discount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
      if (coupon && coupon.active) {
        const subtotal = cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
        if (subtotal >= coupon.minValue) {
          discount = coupon.type === 'percentage'
            ? subtotal * (coupon.discount / 100)
            : coupon.discount;
          await prisma.coupon.update({ where: { code: couponCode }, data: { usedCount: { increment: 1 } } });
        }
      }
    }

    const subtotal = cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
    const total = subtotal - discount + Number(shippingCost);

    const [{ next }] = await prisma.$queryRaw`SELECT COALESCE(MAX("orderNumber"), 999) + 1 AS next FROM orders`;
    const orderNumber = Number(next);

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: req.user.id,
        total,
        shippingAddress,
        shippingCost: Number(shippingCost),
        paymentMethod,
        items: {
          create: cartItems.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.product.price,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    for (const item of cartItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    await prisma.cart.deleteMany({ where: { userId: req.user.id } });

    res.status(201).json(order);
  } catch (err) {
    console.error('Erro ao criar pedido:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Erro ao criar pedido' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: { include: { product: true } } },
      orderBy: { orderNumber: 'asc' },
    });
    res.json(orders);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { items: { include: { product: true } } },
    });
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.json(order);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar pedido' });
  }
});

router.get('/admin/all', adminMiddleware, async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where = status ? { status } : {};

  try {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { user: { select: { name: true, email: true } }, items: { include: { product: { select: { name: true } } } } },
        orderBy: { orderNumber: 'asc' },
        skip,
        take: Number(limit),
      }),
      prisma.order.count({ where }),
    ]);
    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

router.put('/admin/:id/status', adminMiddleware, async (req, res) => {
  const { status, trackingCode } = req.body;
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status, ...(trackingCode && { trackingCode }) },
    });
    res.json(order);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar pedido' });
  }
});

module.exports = router;
