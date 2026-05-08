const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payment');
const adminRoutes = require('./routes/admin');
const couponRoutes = require('./routes/coupons');
const freteRoutes = require('./routes/frete');
const uploadRoutes = require('./routes/upload');
const configRoutes = require('./routes/config');
const reviewRoutes = require('./routes/reviews');
const wishlistRoutes = require('./routes/wishlist');
const returnsRoutes = require('./routes/returns');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'https://atlantasports.vercel.app',
  'https://atlanta-sports-loja.vercel.app',
  'https://www.atlantasports.com.br',
  'https://atlantasports.com.br',
].filter(Boolean);

// Segurança: headers HTTP contra XSS, clickjacking, etc.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Gerenciado pelo frontend Next.js
}));

// Compressão gzip em todas as respostas
app.use(compression());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Raw body para webhook de pagamento (deve vir antes de express.json)
app.use('/payment/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '2mb' }));

// Rate limiting diferenciado por tipo de rota
// Autenticação: mais restrito para evitar força bruta
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rotas públicas de leitura: mais permissivo (produtos, categorias, config)
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Muitas requisições. Tente novamente em instantes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method !== 'GET',
});

// Geral (fallback): proteção base para demais rotas
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Muitas requisições. Tente novamente em instantes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/auth', authLimiter, authRoutes);
app.use('/products', publicLimiter, productRoutes);
app.use('/categories', publicLimiter, categoryRoutes);
app.use('/config', publicLimiter, configRoutes);
app.use('/cart', generalLimiter, cartRoutes);
app.use('/orders', generalLimiter, orderRoutes);
app.use('/payment', generalLimiter, paymentRoutes);
app.use('/admin', generalLimiter, adminRoutes);
app.use('/coupons', generalLimiter, couponRoutes);
app.use('/frete', generalLimiter, freteRoutes);
app.use('/upload', generalLimiter, uploadRoutes);
app.use('/reviews', generalLimiter, reviewRoutes);
app.use('/wishlist', generalLimiter, wishlistRoutes);
app.use('/returns', generalLimiter, returnsRoutes);

const cache = require('./lib/cache');
app.get('/health', (req, res) => res.json({
  status: 'ok',
  app: 'Atlanta Sports API',
  cacheEntries: cache.size(),
  uptime: Math.floor(process.uptime()),
}));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor' });
});

module.exports = app;
