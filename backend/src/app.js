const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

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

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'https://atlantasports.vercel.app',
  'https://atlanta-sports-loja.vercel.app',
  'https://www.atlantasports.com.br',
  'https://atlantasports.com.br',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Raw body for payment webhook (must come before express.json)
app.use('/payment/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/categories', categoryRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
app.use('/payment', paymentRoutes);
app.use('/admin', adminRoutes);
app.use('/coupons', couponRoutes);
app.use('/frete', freteRoutes);
app.use('/upload', uploadRoutes);
app.use('/config', configRoutes);
app.use('/reviews', reviewRoutes);
app.use('/wishlist', wishlistRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', app: 'Atlanta Sports API' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor' });
});

module.exports = app;
