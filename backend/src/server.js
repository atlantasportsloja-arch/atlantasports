require('dotenv').config();
require('dns').setDefaultResultOrder('ipv4first');
const app = require('./app');
const prisma = require('./lib/prisma');
const { startReviewReminderJob } = require('./jobs/reviewReminder');
const { startBackupJob } = require('./jobs/backupJob');

const PORT = process.env.PORT || 3001;

async function migrate() {
  const run = async (sql) => {
    try { await prisma.$executeRawUnsafe(sql); } catch (e) { console.warn('migrate:', e.message); }
  };

  await run(`
    CREATE TABLE IF NOT EXISTS "store_config" (
      id TEXT PRIMARY KEY,
      "storeName" TEXT DEFAULT 'Atlanta Sports',
      "storeSlogan" TEXT DEFAULT '',
      "heroBadge" TEXT DEFAULT '',
      "heroTitle" TEXT DEFAULT '',
      "heroSubtitle" TEXT DEFAULT '',
      "heroBtnPrimary" TEXT DEFAULT '',
      "heroBtnPrimaryLink" TEXT DEFAULT '',
      "heroBtnSecondary" TEXT DEFAULT '',
      "heroBtnSecondaryLink" TEXT DEFAULT '',
      "benefit1" TEXT DEFAULT '',
      "benefit2" TEXT DEFAULT '',
      "benefit3" TEXT DEFAULT '',
      "benefit4" TEXT DEFAULT '',
      "sectionCategories" TEXT DEFAULT '',
      "sectionFeatured" TEXT DEFAULT '',
      "whatsapp" TEXT DEFAULT '',
      "footerEmail" TEXT DEFAULT '',
      "footerHours" TEXT DEFAULT '',
      "footerDesc" TEXT DEFAULT '',
      "pixDiscount" FLOAT DEFAULT 0,
      "pixKey" TEXT DEFAULT '',
      "pixMessage" TEXT DEFAULT '',
      "parceladoMessage" TEXT DEFAULT '',
      "freeShippingThreshold" FLOAT DEFAULT 299,
      "shippingZones" JSONB DEFAULT '[]',
      "banners" TEXT[] DEFAULT '{}',
      "updatedAt" TIMESTAMP DEFAULT NOW()
    )
  `);
  await run(`INSERT INTO "store_config" (id) VALUES ('default') ON CONFLICT (id) DO NOTHING`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "storeSlogan" TEXT DEFAULT ''`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "heroBadge" TEXT DEFAULT ''`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "heroTitle" TEXT DEFAULT ''`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "heroSubtitle" TEXT DEFAULT ''`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "heroBtnPrimary" TEXT DEFAULT ''`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "heroBtnPrimaryLink" TEXT DEFAULT ''`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "heroBtnSecondary" TEXT DEFAULT ''`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "heroBtnSecondaryLink" TEXT DEFAULT ''`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "benefit1" TEXT DEFAULT ''`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "benefit2" TEXT DEFAULT ''`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "benefit3" TEXT DEFAULT ''`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "benefit4" TEXT DEFAULT ''`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "sectionCategories" TEXT DEFAULT ''`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "sectionFeatured" TEXT DEFAULT ''`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "whatsapp" TEXT DEFAULT ''`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "footerEmail" TEXT DEFAULT ''`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "footerHours" TEXT DEFAULT ''`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "footerDesc" TEXT DEFAULT ''`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "pixDiscount" FLOAT DEFAULT 0`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "pixKey" TEXT DEFAULT ''`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "pixMessage" TEXT DEFAULT ''`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "parceladoMessage" TEXT DEFAULT ''`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "freeShippingThreshold" FLOAT DEFAULT 299`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "shippingZones" JSONB DEFAULT '[]'`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "banners" TEXT[] DEFAULT '{}'`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "footerLinks" JSONB DEFAULT '[]'`);
  await run(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS "adminNote" TEXT DEFAULT ''`);
  await run(`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "cepOrigem" TEXT DEFAULT ''`);
  await run(`
    CREATE TABLE IF NOT EXISTS order_status_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      changed_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

migrate().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Atlanta Sports API rodando na porta ${PORT}`);
    startReviewReminderJob();
    startBackupJob();
  });

  // Graceful shutdown: Railway envia SIGTERM ao reiniciar/deploys
  // Aguarda requisições ativas terminarem antes de encerrar
  function shutdown(signal) {
    console.log(`[Shutdown] ${signal} recebido. Encerrando servidor...`);
    server.close(async () => {
      try {
        await prisma.$disconnect();
        console.log('[Shutdown] Conexão DB encerrada. Processo finalizado.');
      } catch (e) {
        console.error('[Shutdown] Erro ao desconectar DB:', e.message);
      }
      process.exit(0);
    });

    // Força encerramento após 15s se alguma requisição travar
    setTimeout(() => {
      console.error('[Shutdown] Timeout forçado após 15s.');
      process.exit(1);
    }, 15000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    console.error('[UncaughtException]', err);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[UnhandledRejection]', reason);
  });
});
