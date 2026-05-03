const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`ALTER TABLE store_config ADD COLUMN IF NOT EXISTS "pixHolder" TEXT DEFAULT ''`);
  console.log('Coluna pixHolder adicionada com sucesso');
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e.message); prisma.$disconnect(); });
