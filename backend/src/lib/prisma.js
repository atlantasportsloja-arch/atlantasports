const { PrismaClient } = require('@prisma/client');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

// Limita conexões simultâneas ao Neon para evitar saturação sob alta carga
// Neon free tier suporta até ~20 conexões; 10 deixa margem para picos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: process.env.DB_POOL_MAX ? Number(process.env.DB_POOL_MAX) : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Sem esse listener, um erro assíncrono num client ocioso do pool (ex: Neon
// derrubando o socket) vira um evento 'error' sem handler e derruba o processo
// de forma abrupta e silenciosa.
pool.on('error', (err) => {
  console.error('[DB Pool] Erro em conexão ociosa:', err.message);
});

const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
