require('dotenv').config();
const app = require('./app');
const prisma = require('./lib/prisma');
const { startReviewReminderJob } = require('./jobs/reviewReminder');

const PORT = process.env.PORT || 3001;

async function migrate() {
  try {
    await prisma.$executeRaw`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "pixMessage" TEXT DEFAULT ''`;
    await prisma.$executeRaw`ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "parceladoMessage" TEXT DEFAULT ''`;
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
