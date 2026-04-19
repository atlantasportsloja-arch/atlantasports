const express = require('express');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

router.post('/create', authMiddleware, async (req, res) => {
  const { orderId } = req.body;

  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user.id },
      include: { items: { include: { product: true } } },
    });

    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

    const preference = new Preference(mp);
    const result = await preference.create({
      body: {
        items: order.items.map(item => ({
          id: item.productId,
          title: item.product.name,
          quantity: item.quantity,
          unit_price: item.price,
          currency_id: 'BRL',
        })),
        back_urls: {
          success: `${process.env.FRONTEND_URL}/pedido/${orderId}/sucesso`,
          failure: `${process.env.FRONTEND_URL}/pedido/${orderId}/erro`,
          pending: `${process.env.FRONTEND_URL}/pedido/${orderId}/pendente`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.BACKEND_URL}/payment/webhook`,
        external_reference: orderId,
        payment_methods: {
          excluded_payment_types: [],
          installments: 12,
        },
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentId: result.id },
    });

    res.json({
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar pagamento' });
  }
});

router.post('/webhook', async (req, res) => {
  const body = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString()) : req.body;
  const { type, data } = body;

  try {
    if (type === 'payment') {
      const payment = new Payment(mp);
      const paymentData = await payment.get({ id: data.id });

      const orderId = paymentData.external_reference;
      const status = paymentData.status;

      let orderStatus = 'PENDING';
      let paymentStatus = 'pending';

      if (status === 'approved') {
        orderStatus = 'PAID';
        paymentStatus = 'approved';
      } else if (status === 'rejected') {
        paymentStatus = 'rejected';
      }

      await prisma.order.update({
        where: { id: orderId },
        data: { status: orderStatus, paymentStatus },
      });
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

module.exports = router;
