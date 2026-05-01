const express = require('express');
const prisma = require('../lib/prisma');
const adminMiddleware = require('../middleware/admin');
const { runBackup, loadStatus } = require('../jobs/backupJob');

const router = express.Router();

router.use(adminMiddleware);

router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const paidStatuses = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

    const [
      totalOrders,
      totalRevenue,
      totalProducts,
      totalUsers,
      pendingOrders,
      recentOrders,
      topProducts,
      lowStockProducts,
      ordersToday,
      revenueToday,
      ordersThisMonth,
      revenueThisMonth,
      revenueLastMonth,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true, shippingCost: true }, where: { status: { in: paidStatuses } } }),
      prisma.product.count({ where: { active: true } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      prisma.product.findMany({
        where: { active: true, stock: { lte: 5 } },
        select: { id: true, name: true, stock: true, images: true },
        orderBy: { stock: 'asc' },
        take: 10,
      }),
      prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.order.aggregate({ _sum: { total: true, shippingCost: true }, where: { status: { in: paidStatuses }, createdAt: { gte: startOfToday } } }),
      prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.order.aggregate({ _sum: { total: true, shippingCost: true }, where: { status: { in: paidStatuses }, createdAt: { gte: startOfMonth } } }),
      prisma.order.aggregate({ _sum: { total: true, shippingCost: true }, where: { status: { in: paidStatuses }, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    ]);

    const topProductIds = topProducts.map(p => p.productId);
    const topProductDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, price: true, images: true },
    });

    const topProductsWithDetails = topProducts.map(tp => ({
      ...tp,
      product: topProductDetails.find(p => p.id === tp.productId),
    }));

    res.json({
      totalOrders,
      totalRevenue: (totalRevenue._sum.total || 0) - (totalRevenue._sum.shippingCost || 0),
      totalProducts,
      totalUsers,
      pendingOrders,
      recentOrders,
      topProducts: topProductsWithDetails,
      lowStockProducts,
      ordersToday,
      revenueToday: (revenueToday._sum.total || 0) - (revenueToday._sum.shippingCost || 0),
      ordersThisMonth,
      revenueThisMonth: (revenueThisMonth._sum.total || 0) - (revenueThisMonth._sum.shippingCost || 0),
      revenueLastMonth: (revenueLastMonth._sum.total || 0) - (revenueLastMonth._sum.shippingCost || 0),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar dashboard' });
  }
});

router.get('/dashboard/chart', async (req, res) => {
  const days = Math.min(Number(req.query.days) || 30, 90);
  const paidStatuses = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

  const since = new Date();
  since.setDate(since.getDate() - days + 1);
  since.setHours(0, 0, 0, 0);

  try {
    const orders = await prisma.order.findMany({
      where: { status: { in: paidStatuses }, createdAt: { gte: since } },
      select: { total: true, shippingCost: true, createdAt: true },
    });

    const buckets = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = { date: key, revenue: 0, orders: 0 };
    }

    for (const o of orders) {
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      if (buckets[key]) {
        buckets[key].revenue += Number(o.total) - Number(o.shippingCost || 0);
        buckets[key].orders += 1;
      }
    }

    res.json(Object.values(buckets));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar gráfico' });
  }
});

router.get('/users', async (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where = search.trim()
    ? { OR: [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { email: { contains: search.trim(), mode: 'insensitive' } },
      ] }
    : {};

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: Number(limit),
        where,
        select: {
          id: true, name: true, email: true, role: true, phone: true, createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ users, total });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

router.put('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!['ADMIN', 'CUSTOMER'].includes(role)) return res.status(400).json({ error: 'Role inválido' });

  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

router.get('/backup/status', (req, res) => {
  res.json(loadStatus());
});

router.post('/backup', async (req, res) => {
  try {
    const status = await runBackup();
    res.json({ ok: true, ...status });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao realizar backup: ' + err.message });
  }
});

module.exports = router;
