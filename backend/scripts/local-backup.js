require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { gzip } = require('zlib');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const gzipAsync = promisify(gzip);
const prisma = new PrismaClient();
const BACKUP_FILE = path.join('C:\\Users\\Casas Bahia\\Desktop', 'backup-atlantasports.json.gz');

async function run() {
  console.log('[Backup Local] Iniciando...');
  try {
    const [users, products, categories, orders, coupons, reviews, wishlists] =
      await Promise.all([
        prisma.user.findMany({ select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, updatedAt: true } }),
        prisma.product.findMany({ include: { variants: true } }),
        prisma.category.findMany(),
        prisma.order.findMany({ include: { items: true, user: { select: { id: true, name: true, email: true } } } }),
        prisma.coupon.findMany({ include: { usages: true } }),
        prisma.review.findMany(),
        prisma.wishlist.findMany(),
      ]);

    const backup = {
      version: '1.0',
      generatedAt: new Date().toISOString(),
      data: { users, products, categories, orders, coupons, reviews, wishlists },
    };

    const compressed = await gzipAsync(Buffer.from(JSON.stringify(backup, null, 2), 'utf-8'));
    fs.writeFileSync(BACKUP_FILE, compressed);

    console.log(`[Backup Local] Salvo em: ${BACKUP_FILE}`);
    console.log(`[Backup Local] Resumo: ${users.length} usuários, ${products.length} produtos, ${orders.length} pedidos`);
  } catch (err) {
    console.error('[Backup Local] Erro:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
