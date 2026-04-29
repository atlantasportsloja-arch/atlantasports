const express = require('express');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

router.post('/validate', authMiddleware, async (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) return res.status(400).json({ error: 'Código obrigatório' });

  try {
    const coupon = await prisma.coupon.findUnique({ where: { code } });

    if (!coupon || !coupon.active) return res.status(404).json({ error: 'Cupom inválido' });
    if (coupon.expiresAt && new Date() > coupon.expiresAt) return res.status(400).json({ error: 'Cupom expirado' });
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return res.status(400).json({ error: 'Cupom esgotado' });
    if (subtotal < coupon.minValue) return res.status(400).json({ error: `Valor mínimo: R$ ${coupon.minValue}` });

    if (coupon.onePerUser) {
      const alreadyUsed = await prisma.couponUsage.findUnique({
        where: { couponId_userId: { couponId: coupon.id, userId: req.user.id } },
      });
      if (alreadyUsed) return res.status(400).json({ error: 'Você já usou este cupom' });
    }

    const discount = coupon.type === 'percentage'
      ? subtotal * (coupon.discount / 100)
      : coupon.discount;

    res.json({ valid: true, discount, coupon });
  } catch {
    res.status(500).json({ error: 'Erro ao validar cupom' });
  }
});

router.get('/', adminMiddleware, async (req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(coupons);
});

router.post('/', adminMiddleware, async (req, res) => {
  try {
    const coupon = await prisma.coupon.create({ data: req.body });
    res.status(201).json(coupon);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Código já existe' });
    res.status(500).json({ error: 'Erro ao criar cupom' });
  }
});

router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data: req.body });
    res.json(coupon);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar cupom' });
  }
});

router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ message: 'Cupom removido' });
  } catch {
    res.status(500).json({ error: 'Erro ao deletar cupom' });
  }
});

module.exports = router;
