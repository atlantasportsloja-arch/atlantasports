const express = require('express');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  const { productId, rating, comment } = req.body;

  if (!productId || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }

  try {
    // Verifica se comprou o produto
    const purchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: { userId: req.user.id, status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
      },
    });

    if (!purchased) {
      return res.status(403).json({ error: 'Você precisa comprar o produto para avaliá-lo' });
    }

    const review = await prisma.review.upsert({
      where: { userId_productId: { userId: req.user.id, productId } },
      update: { rating, comment },
      create: { userId: req.user.id, productId, rating, comment },
      include: { user: { select: { name: true } } },
    });

    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar avaliação' });
  }
});

router.delete('/:productId', authMiddleware, async (req, res) => {
  try {
    await prisma.review.delete({
      where: { userId_productId: { userId: req.user.id, productId: req.params.productId } },
    });
    res.json({ message: 'Avaliação removida' });
  } catch {
    res.status(500).json({ error: 'Erro ao remover avaliação' });
  }
});

module.exports = router;
