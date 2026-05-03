const cron = require('node-cron');
const prisma = require('../lib/prisma');
const { sendMail } = require('../lib/mailer');

function reviewEmailHtml({ userName, products, frontendUrl }) {
  const productCards = products.map(p => `
    <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:12px;display:flex;align-items:center;gap:16px;">
      ${p.images?.[0] ? `<img src="${p.images[0]}" width="64" height="64" style="border-radius:8px;object-fit:cover;" />` : ''}
      <div style="flex:1;">
        <p style="margin:0;font-weight:700;color:#111;">${p.name}</p>
        <a href="${frontendUrl}/produto/${p.slug}"
           style="display:inline-block;margin-top:8px;background:#f97316;color:#fff;padding:6px 16px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">
          ⭐ Avaliar produto
        </a>
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f9fafb;font-family:sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <div style="background:#111827;padding:24px;text-align:center;">
          <span style="color:#f97316;font-size:22px;font-weight:900;letter-spacing:-0.5px;">ATLANTA</span>
          <span style="color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">SPORTS</span>
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 8px;color:#111;">Olá, ${userName}! 👋</h2>
          <p style="color:#6b7280;margin:0 0 24px;line-height:1.6;">
            Já faz 3 dias desde sua compra. O que você achou dos produtos?<br>
            Sua opinião ajuda outros clientes e melhora nossa loja!
          </p>

          ${productCards}

          <p style="color:#9ca3af;font-size:13px;margin-top:24px;text-align:center;">
            Obrigado por comprar na Atlanta Sports! 🏆
          </p>
        </div>
        <div style="background:#f3f4f6;padding:16px;text-align:center;">
          <a href="${frontendUrl}" style="color:#f97316;font-size:13px;text-decoration:none;">
            Visitar a loja →
          </a>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function runReviewReminder() {
  const frontendUrl = process.env.FRONTEND_URL || 'https://www.atlantasports.com.br';

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const start = new Date(threeDaysAgo);
  start.setHours(0, 0, 0, 0);
  const end = new Date(threeDaysAgo);
  end.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: start, lte: end },
      status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
    },
    include: {
      user: true,
      items: { include: { product: true } },
    },
  });

  console.log(`[ReviewReminder] ${orders.length} pedido(s) com 3 dias encontrado(s).`);

  for (const order of orders) {
    const existingReviews = await prisma.review.findMany({
      where: { userId: order.userId },
      select: { productId: true },
    });
    const reviewed = new Set(existingReviews.map(r => r.productId));

    const toReview = order.items
      .map(i => i.product)
      .filter(p => p && !reviewed.has(p.id));

    if (toReview.length === 0) continue;

    try {
      await sendMail({
        to: order.user.email,
        subject: `Como foi sua compra? Avalie seu pedido #${order.orderNumber ?? order.id.slice(0, 8).toUpperCase()} ⭐`,
        html: reviewEmailHtml({
          userName: order.user.name.split(' ')[0],
          products: toReview,
          frontendUrl,
        }),
      });
      console.log(`[ReviewReminder] E-mail enviado para ${order.user.email}`);
    } catch (err) {
      console.error(`[ReviewReminder] Erro ao enviar para ${order.user.email}:`, err.message);
    }
  }
}

function startReviewReminderJob() {
  // Roda todo dia às 9h da manhã
  cron.schedule('0 9 * * *', () => {
    console.log('[ReviewReminder] Iniciando verificação de lembretes...');
    runReviewReminder().catch(err => console.error('[ReviewReminder] Erro:', err.message));
  }, { timezone: 'America/Sao_Paulo' });

  console.log('[ReviewReminder] Job agendado para 9h todos os dias.');
}

module.exports = { startReviewReminderJob, runReviewReminder };
