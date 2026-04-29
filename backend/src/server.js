require('dotenv').config();
const app = require('./app');
const prisma = require('./lib/prisma');
const { startReviewReminderJob } = require('./jobs/reviewReminder');

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
}

migrate().then(() => {
  app.listen(PORT, () => {
    console.log(`Atlanta Sports API rodando na porta ${PORT}`);
    startReviewReminderJob();
  });
});
