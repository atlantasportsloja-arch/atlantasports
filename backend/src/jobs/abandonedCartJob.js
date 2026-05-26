const cron = require('node-cron');
const prisma = require('../lib/prisma');
const { sendMail } = require('../lib/mailer');
const { abandonedCartHtml } = require('../lib/emails');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.atlantasports.com.br';
const CART_URL = `${FRONTEND_URL}/carrinho`;

// Envia para quem tem itens no carrinho há mais de 2h e não recebeu o e-mail nas últimas 24h
async function runAbandonedCart() {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const usersWithCart = await prisma.user.findMany({
    where: {
      cart: { some: {} },
      OR: [
        { abandonedCartEmailSentAt: null },
        { abandonedCartEmailSentAt: { lt: oneDayAgo } },
      ],
      // Não tem pedido pago nas últimas 2 horas
      orders: {
        none: {
          createdAt: { gte: twoHoursAgo },
          status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        },
      },
    },
    select: {
      id: true, name: true, email: true, blocked: true,
      cart: {
        include: {
          product: { select: { name: true, price: true, images: true } },
          variant: { select: { size: true, price: true } },
        },
      },
    },
  });

  console.log(`[AbandonedCart] ${usersWithCart.length} usuário(s) com carrinho abandonado.`);

  for (const user of usersWithCart) {
    if (user.blocked || user.cart.length === 0) continue;

    try {
      await sendMail({
        to: user.email,
        subject: `Você esqueceu itens no carrinho! 🛒`,
        html: abandonedCartHtml({
          userName: user.name.split(' ')[0],
          items: user.cart,
          cartUrl: CART_URL,
        }),
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { abandonedCartEmailSentAt: new Date() },
      });

      console.log(`[AbandonedCart] E-mail enviado para ${user.email}`);
    } catch (err) {
      console.error(`[AbandonedCart] Erro ao enviar para ${user.email}:`, err.message);
    }
  }
}

function startAbandonedCartJob() {
  // Roda a cada 2 horas
  cron.schedule('0 */2 * * *', () => {
    console.log('[AbandonedCart] Verificando carrinhos abandonados...');
    runAbandonedCart().catch(err => console.error('[AbandonedCart] Erro:', err.message));
  }, { timezone: 'America/Sao_Paulo' });

  console.log('[AbandonedCart] Job agendado para rodar a cada 2 horas.');
}

module.exports = { startAbandonedCartJob, runAbandonedCart };
