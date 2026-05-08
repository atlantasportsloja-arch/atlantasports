const express = require('express');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

// Cliente: cria solicitação de devolução/troca
router.post('/', authMiddleware, async (req, res) => {
  const { orderId, type = 'REFUND', reason, items } = req.body;

  if (!orderId || !reason?.trim() || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }
  if (!['REFUND', 'EXCHANGE'].includes(type)) {
    return res.status(400).json({ error: 'Tipo inválido' });
  }

  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user.id, status: 'DELIVERED' },
    });
    if (!order) return res.status(400).json({ error: 'Pedido não encontrado ou não elegível' });

    const existing = await prisma.return.findFirst({
      where: { orderId, status: { in: ['REQUESTED', 'APPROVED', 'RECEIVED'] } },
    });
    if (existing) return res.status(400).json({ error: 'Já existe uma solicitação ativa para este pedido' });

    const orderItemIds = items.map(i => i.orderItemId);
    const validItems = await prisma.orderItem.findMany({
      where: { orderId, id: { in: orderItemIds } },
    });
    if (validItems.length !== items.length) {
      return res.status(400).json({ error: 'Itens inválidos' });
    }

    const returnRequest = await prisma.return.create({
      data: {
        orderId,
        userId: req.user.id,
        type,
        reason: reason.trim(),
        items: {
          create: items.map(i => ({
            orderItemId: i.orderItemId,
            quantity: Number(i.quantity) || 1,
          })),
        },
      },
      include: {
        order: { select: { orderNumber: true } },
        items: true,
      },
    });

    res.status(201).json(returnRequest);
  } catch (err) {
    console.error('Erro ao criar devolução:', err?.message);
    res.status(500).json({ error: 'Erro ao criar solicitação' });
  }
});

// Cliente: lista suas próprias solicitações
router.get('/', authMiddleware, async (req, res) => {
  try {
    const returns = await prisma.return.findMany({
      where: { userId: req.user.id },
      include: {
        order: { select: { orderNumber: true, id: true } },
        items: {
          include: {
            orderItem: {
              include: {
                product: { select: { name: true, images: true } },
                variant: { select: { size: true, color: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(returns);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar solicitações' });
  }
});

// Admin: lista todas as solicitações
router.get('/admin/all', adminMiddleware, async (req, res) => {
  const { status, type, page = 1, limit = 20 } = req.query;
  const where = {};
  if (status) where.status = status;
  if (type) where.type = type;
  const skip = (Number(page) - 1) * Number(limit);

  try {
    const [returns, total] = await Promise.all([
      prisma.return.findMany({
        where,
        include: {
          order: { select: { orderNumber: true, id: true, total: true } },
          user: { select: { name: true, email: true } },
          items: {
            include: {
              orderItem: {
                include: {
                  product: { select: { name: true, images: true } },
                  variant: { select: { size: true, color: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.return.count({ where }),
    ]);

    res.json({ returns, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar devoluções' });
  }
});

// Admin: atualiza status, nota ou valor de reembolso
router.put('/admin/:id', adminMiddleware, async (req, res) => {
  const { status, adminNote, refundAmount } = req.body;
  const data = {};
  if (status) {
    const validStatuses = ['REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED', 'EXCHANGED'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Status inválido' });
    data.status = status;
  }
  if (adminNote !== undefined) data.adminNote = adminNote;
  if (refundAmount !== undefined) data.refundAmount = refundAmount !== '' && refundAmount !== null ? Number(refundAmount) : null;

  try {
    const updated = await prisma.return.update({
      where: { id: req.params.id },
      data,
      include: {
        order: { select: { orderNumber: true, id: true } },
        user: { select: { name: true, email: true } },
        items: {
          include: {
            orderItem: {
              include: {
                product: { select: { name: true, images: true } },
                variant: { select: { size: true, color: true } },
              },
            },
          },
        },
      },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar solicitação' });
  }
});

// Admin: exclui solicitação
router.delete('/admin/:id', adminMiddleware, async (req, res) => {
  try {
    await prisma.return.delete({ where: { id: req.params.id } });
    res.json({ message: 'Solicitação removida' });
  } catch {
    res.status(500).json({ error: 'Erro ao remover solicitação' });
  }
});

module.exports = router;
