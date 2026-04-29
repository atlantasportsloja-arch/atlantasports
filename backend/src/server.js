require('dotenv').config();
const app = require('./app');
const prisma = require('./lib/prisma');
const { startReviewReminderJob } = require('./jobs/reviewReminder');

const PORT = process.env.PORT || 3001;

async function migrate() {
  try {
    // Garante que a tabela e linha padrão existem
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "store_config" (
        id TEXT PRIMARY KEY,
        "storeName" TEXT DEFAULT 'Atlanta Sports',
        "banners" TEXT[] DEFAULT '{}',
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `;
    await prisma.$executeRaw`
      INSERT INTO "store_config" (id) VALUES ('default') ON CONFLICT (id) DO NOTHING
    `;
    // Adiciona colunas novas sem apagar dados existentes
    await prisma.$executeRaw`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "banners" TEXT[] DEFAULT '{}'`;
    await prisma.$executeRaw`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "pixMessage" TEXT DEFAULT ''`;
    await prisma.$executeRaw`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "parceladoMessage" TEXT DEFAULT ''`;
    await prisma.$executeRaw`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "freeShippingThreshold" FLOAT DEFAULT 299`;
    await prisma.$executeRaw`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "shippingZones" JSONB DEFAULT '[]'::jsonb`;
  } catch (e) {
    console.warn('migrate:', e.message);
  }
}

migrate().then(() => {
  app.listen(PORT, () => {
    console.log(`Atlanta Sports API rodando na porta ${PORT}`);
    startReviewReminderJob();
  });
});
