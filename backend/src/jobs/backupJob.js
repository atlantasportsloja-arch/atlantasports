const cron = require('node-cron');
const { gzip } = require('zlib');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const prisma = require('../lib/prisma');
const { sendMail } = require('../lib/mailer');

const gzipAsync = promisify(gzip);
const STATUS_FILE = path.join(__dirname, '../../backup-status.json');

function loadStatus() {
  try {
    return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
  } catch {
    return { lastBackupAt: null, lastBackupStatus: null };
  }
}

function saveStatus(status) {
  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(status), 'utf-8');
  } catch (e) {
    console.warn('[Backup] Não foi possível salvar status:', e.message);
  }
}

function backupEmailHtml({ dateStr, counts }) {
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
          <h2 style="margin:0 0 8px;color:#111;">Backup Realizado com Sucesso ✅</h2>
          <p style="color:#6b7280;margin:0 0 24px;line-height:1.6;">
            O backup automático do banco de dados foi gerado em <strong>${dateStr}</strong>.<br>
            O arquivo está em anexo neste e-mail (formato .json.gz).
          </p>
          <div style="background:#f3f4f6;border-radius:12px;padding:20px;margin-bottom:24px;">
            <h3 style="margin:0 0 12px;color:#374151;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Resumo do Backup</h3>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:6px 0;color:#6b7280;">Usuários</td><td style="text-align:right;font-weight:700;color:#111;">${counts.users}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Produtos</td><td style="text-align:right;font-weight:700;color:#111;">${counts.products}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Pedidos</td><td style="text-align:right;font-weight:700;color:#111;">${counts.orders}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Categorias</td><td style="text-align:right;font-weight:700;color:#111;">${counts.categories}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Cupons</td><td style="text-align:right;font-weight:700;color:#111;">${counts.coupons}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Avaliações</td><td style="text-align:right;font-weight:700;color:#111;">${counts.reviews}</td></tr>
            </table>
          </div>
          <p style="color:#9ca3af;font-size:13px;margin:0;text-align:center;">
            Guarde este e-mail em local seguro. Ele contém todos os dados da loja.
          </p>
        </div>
        <div style="background:#f3f4f6;padding:16px;text-align:center;">
          <span style="color:#9ca3af;font-size:12px;">Backup automático — Atlanta Sports</span>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function runBackup() {
  const startedAt = new Date();
  console.log('[Backup] Iniciando backup do banco de dados...');

  try {
    const [users, products, categories, orders, coupons, reviews, wishlists, storeConfig] =
      await Promise.all([
        prisma.user.findMany({
          select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, updatedAt: true },
        }),
        prisma.product.findMany({ include: { variants: true } }),
        prisma.category.findMany(),
        prisma.order.findMany({
          include: {
            items: true,
            user: { select: { id: true, name: true, email: true } },
          },
        }),
        prisma.coupon.findMany({ include: { usages: true } }),
        prisma.review.findMany(),
        prisma.wishlist.findMany(),
        prisma.$queryRaw`SELECT * FROM store_config LIMIT 1`.catch(() => []),
      ]);

    const backup = {
      version: '1.0',
      generatedAt: startedAt.toISOString(),
      data: {
        users,
        products,
        categories,
        orders,
        coupons,
        reviews,
        wishlists,
        storeConfig,
      },
    };

    const json = JSON.stringify(backup, null, 2);
    const compressed = await gzipAsync(Buffer.from(json, 'utf-8'));
    const dateStr = startedAt.toISOString().slice(0, 10);
    const destEmail = process.env.BACKUP_EMAIL || process.env.EMAIL_USER;

    await sendMail({
      to: destEmail,
      subject: `[Atlanta Sports] Backup do banco de dados — ${dateStr}`,
      html: backupEmailHtml({
        dateStr,
        counts: {
          users: users.length,
          products: products.length,
          orders: orders.length,
          categories: categories.length,
          coupons: coupons.length,
          reviews: reviews.length,
        },
      }),
      attachments: [
        {
          filename: `backup-atlantasports-${dateStr}.json.gz`,
          content: compressed,
          contentType: 'application/gzip',
        },
      ],
    });

    const status = { lastBackupAt: startedAt.toISOString(), lastBackupStatus: 'success' };
    saveStatus(status);
    console.log(`[Backup] Backup concluído e enviado para ${destEmail}`);
    return status;
  } catch (err) {
    const status = { lastBackupAt: startedAt.toISOString(), lastBackupStatus: 'error' };
    saveStatus(status);
    console.error('[Backup] Erro ao realizar backup:', err.message);
    throw err;
  }
}

function startBackupJob() {
  cron.schedule('0 6 * * *', () => {
    console.log('[Backup] Iniciando backup automático das 06h...');
    runBackup().catch(err => console.error('[Backup] Erro:', err.message));
  }, { timezone: 'America/Sao_Paulo' });

  console.log('[Backup] Job agendado para 06h todos os dias.');
}

module.exports = { startBackupJob, runBackup, loadStatus };
