const express = require('express');
const prisma = require('../lib/prisma');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

router.use(adminMiddleware);

router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalOrders,
      totalRevenue,
      totalProducts,
      totalUsers,
      pendingOrders,
      recentOrders,
      topProducts,
      lowStockProducts,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } } }),
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
      totalRevenue: totalRevenue._sum.total || 0,
      totalProducts,
      totalUsers,
      pendingOrders,
      recentOrders,
      topProducts: topProductsWithDetails,
      lowStockProducts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar dashboard' });
  }
});

router.get('/users', async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: Number(limit),
        select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
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

module.exports = router;
