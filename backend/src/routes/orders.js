const express = require('express');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { sendMail } = require('../lib/mailer');
const { orderConfirmationHtml, orderShippedHtml } = require('../lib/emails');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  const { shippingAddress, shippingCost = 0, couponCode, paymentMethod } = req.body;

  if (!shippingAddress) return res.status(400).json({ error: 'Endereço de entrega obrigatório' });

  try {
    const cartItems = await prisma.cart.findMany({
      where: { userId: req.user.id },
      include: { product: true, variant: true },
    });

    if (cartItems.length === 0) return res.status(400).json({ error: 'Carrinho vazio' });

    for (const item of cartItems) {
      const availableStock = item.variant ? item.variant.stock : item.product.stock;
      if (availableStock < item.quantity) {
        return res.status(400).json({ error: `Estoque insuficiente: ${item.product.name}` });
      }
    }

    const itemPrice = (i) => i.variant?.price ?? i.product.price;

    let discount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
      if (coupon && coupon.active) {
        const subtotal = cartItems.reduce((s, i) => s + itemPrice(i) * i.quantity, 0);
        if (subtotal >= coupon.minValue) {
          discount = coupon.type === 'percentage'
            ? subtotal * (coupon.discount / 100)
            : coupon.discount;
          await prisma.coupon.update({ where: { code: couponCode }, data: { usedCount: { increment: 1 } } });
          if (coupon.onePerUser) {
            await prisma.couponUsage.upsert({
              where: { couponId_userId: { couponId: coupon.id, userId: req.user.id } },
              create: { couponId: coupon.id, userId: req.user.id },
              update: {},
            });
          }
        }
      }
    }

    const subtotal = cartItems.reduce((s, i) => s + itemPrice(i) * i.quantity, 0);

    let pixDiscountAmount = 0;
    if (paymentMethod === 'pix') {
      const [cfg] = await prisma.$queryRaw`SELECT "pixDiscount" FROM store_config WHERE id = 'default' LIMIT 1`;
      const pct = Number(cfg?.pixDiscount || 0);
      if (pct > 0) pixDiscountAmount = (subtotal - discount) * (pct / 100);
    }

    const total = subtotal - discount - pixDiscountAmount + Number(shippingCost);

    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        total,
        shippingAddress,
        shippingCost: Number(shippingCost),
        paymentMethod,
        items: {
          create: cartItems.map(i => ({
            productId: i.productId,
            variantId: i.variantId || undefined,
            quantity: i.quantity,
            price: itemPrice(i),
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    // Atribuir número sequencial com advisory lock para evitar duplicatas em pedidos simultâneos
    let orderNumber;
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(20250428)`;
      const [{ next }] = await tx.$queryRaw`SELECT COALESCE(MAX("orderNumber"), 999) + 1 AS next FROM orders WHERE id != ${order.id}`;
      orderNumber = Number(next);
      await tx.$executeRaw`UPDATE orders SET "orderNumber" = ${orderNumber} WHERE id = ${order.id}`;
    });
    order.orderNumber = orderNumber;

    for (const item of cartItems) {
      if (item.variantId) {
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      } else {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    await prisma.cart.deleteMany({ where: { userId: req.user.id } });

    res.status(201).json(order);

    // E-mail de confirmação (não bloqueia a resposta)
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true, email: true } });
    sendMail({
      to: user.email,
      subject: `Pedido confirmado — #${orderNumber} ✅`,
      html: orderConfirmationHtml({ userName: user.name.split(' ')[0], order }),
    }).catch(err => console.error('[OrderMail] Erro ao enviar confirmação:', err.message));
  } catch (err) {
    console.error('Erro ao criar pedido:', err?.message || err);
    res.status(500).json({ error: err?.message || 'Erro ao criar pedido' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: { include: { product: true, variant: true } } },
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
      include: { items: { include: { product: true, variant: true } } },
    });
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.json(order);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar pedido' });
  }
});

router.get('/admin/all', adminMiddleware, async (req, res) => {
  const { status, page = 1, limit = 20, dateFrom, dateTo, userId } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where = {};
  if (status) where.status = status;
  if (userId) where.userId = userId;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  try {
    const [ordersRaw, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { user: { select: { name: true, email: true } }, items: { include: { product: { select: { name: true, images: true } }, variant: { select: { size: true, color: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.order.count({ where }),
    ]);
    const orders = ordersRaw.sort((a, b) => {
      if (a.orderNumber == null && b.orderNumber == null) return 0;
      if (a.orderNumber == null) return 1;
      if (b.orderNumber == null) return -1;
      return b.orderNumber - a.orderNumber;
    });

    // Inclui adminNote (coluna fora do schema Prisma)
    if (orders.length > 0) {
      try {
        const ids = orders.map(o => o.id);
        const notes = await prisma.$queryRawUnsafe(
          `SELECT id, "adminNote" FROM orders WHERE id = ANY($1::uuid[])`,
          ids
        );
        const noteMap = Object.fromEntries(notes.map(n => [n.id, n.adminNote || '']));
        orders.forEach(o => { o.adminNote = noteMap[o.id] ?? ''; });
      } catch (noteErr) {
        console.warn('[Orders] adminNote query falhou:', noteErr?.message);
        orders.forEach(o => { o.adminNote = ''; });
      }
    }

    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error('[Orders] Erro ao buscar pedidos:', err?.message || err);
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

router.put('/admin/:id/tracking', adminMiddleware, async (req, res) => {
  const { trackingCode } = req.body;
  try {
    await prisma.order.update({
      where: { id: req.params.id },
      data: { trackingCode: trackingCode || null },
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Erro ao salvar rastreio' });
  }
});

router.put('/admin/:id/note', adminMiddleware, async (req, res) => {
  const { note } = req.body;
  try {
    await prisma.$executeRaw`UPDATE orders SET "adminNote" = ${note || ''} WHERE id = ${req.params.id}::uuid`;
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Erro ao salvar nota' });
  }
});

router.put('/admin/:id/status', adminMiddleware, async (req, res) => {
  const { status, trackingCode } = req.body;
  try {
    const current = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });
    if (!current) return res.status(404).json({ error: 'Pedido não encontrado' });

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status, ...(trackingCode && { trackingCode }) },
      include: { user: true, items: { include: { product: true, variant: true } } },
    });

    // Restaura estoque ao cancelar (apenas se não estava cancelado antes)
    if (status === 'CANCELLED' && current.status !== 'CANCELLED') {
      for (const item of current.items) {
        if (item.variantId) {
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          }).catch(() => {});
        } else {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          }).catch(() => {});
        }
      }
      console.log(`[Orders] Estoque restaurado para pedido cancelado #${current.orderNumber ?? current.id.slice(0, 8)}`);
    }

    res.json(order);

    // E-mail de envio com rastreio
    if (status === 'SHIPPED' && trackingCode && order.user) {
      sendMail({
        to: order.user.email,
        subject: `Seu pedido foi enviado! 📦 Rastreie agora`,
        html: orderShippedHtml({
          userName: order.user.name.split(' ')[0],
          order,
          trackingCode,
        }),
      }).catch(err => console.error('[ShippedMail] Erro ao enviar:', err.message));
    }
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar pedido' });
  }
});

router.post('/admin/:id/resend-confirmation', adminMiddleware, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { user: true, items: { include: { product: true, variant: true } } },
    });
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

    await sendMail({
      to: order.user.email,
      subject: `Confirmação do pedido #${order.orderNumber ?? order.id.slice(0, 8).toUpperCase()} ✅`,
      html: orderConfirmationHtml({ userName: order.user.name.split(' ')[0], order }),
    });
    res.json({ message: 'E-mail reenviado' });
  } catch (err) {
    console.error('[ResendMail] Erro:', err.message);
    res.status(500).json({ error: 'Erro ao reenviar e-mail' });
  }
});

module.exports = router;
