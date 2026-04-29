const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const prisma = require('../lib/prisma');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Apenas imagens'));
  },
});

router.get('/', async (req, res) => {
  try {
    const config = await prisma.$queryRaw`SELECT * FROM "store_config" WHERE id = 'default' LIMIT 1`;
    res.json(config[0] || {});
  } catch {
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

router.put('/', adminMiddleware, async (req, res) => {
  const {
    storeName, storeSlogan, heroBadge, heroTitle, heroSubtitle,
    heroBtnPrimary, heroBtnPrimaryLink, heroBtnSecondary, heroBtnSecondaryLink,
    benefit1, benefit2, benefit3, benefit4,
    sectionCategories, sectionFeatured,
    whatsapp, footerEmail, footerHours, footerDesc,
    pixDiscount, pixKey, pixMessage, parceladoMessage,
    freeShippingThreshold, shippingZones,
  } = req.body;

  try {
    const zonesJson = JSON.stringify(Array.isArray(shippingZones) ? shippingZones : []);
    await prisma.$executeRaw`
      UPDATE "store_config" SET
        "storeName" = ${storeName},
        "storeSlogan" = ${storeSlogan},
        "heroBadge" = ${heroBadge},
        "heroTitle" = ${heroTitle},
        "heroSubtitle" = ${heroSubtitle},
        "heroBtnPrimary" = ${heroBtnPrimary},
        "heroBtnPrimaryLink" = ${heroBtnPrimaryLink},
        "heroBtnSecondary" = ${heroBtnSecondary},
        "heroBtnSecondaryLink" = ${heroBtnSecondaryLink},
        "benefit1" = ${benefit1},
        "benefit2" = ${benefit2},
        "benefit3" = ${benefit3},
        "benefit4" = ${benefit4},
        "sectionCategories" = ${sectionCategories},
        "sectionFeatured" = ${sectionFeatured},
        "whatsapp" = ${whatsapp},
        "footerEmail" = ${footerEmail},
        "footerHours" = ${footerHours},
        "footerDesc" = ${footerDesc},
        "pixDiscount" = ${Number(pixDiscount) || 0},
        "pixKey" = ${pixKey || ''},
        "pixMessage" = ${pixMessage || ''},
        "parceladoMessage" = ${parceladoMessage || ''},
        "freeShippingThreshold" = ${Number(freeShippingThreshold) || 299},
        "shippingZones" = ${zonesJson}::jsonb,
        "updatedAt" = NOW()
      WHERE id = 'default'
    `;
    res.json({ message: 'Configurações salvas' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
});

router.post('/banner', adminMiddleware, upload.single('banner'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Imagem obrigatória' });
    const url = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'atlanta-sports/banners', quality: 'auto', fetch_format: 'auto' },
        (err, result) => err ? reject(err) : resolve(result.secure_url)
      );
      stream.end(req.file.buffer);
    });
    const config = await prisma.$queryRaw`SELECT banners FROM "store_config" WHERE id = 'default'`;
    const newBanners = [...(config[0]?.banners || []), url];
    await prisma.$executeRaw`UPDATE "store_config" SET "banners" = ${newBanners}, "updatedAt" = NOW() WHERE id = 'default'`;
    res.json({ url, banners: newBanners });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao enviar banner' });
  }
});

router.delete('/banner', adminMiddleware, async (req, res) => {
  const { url } = req.body;
  try {
    const config = await prisma.$queryRaw`SELECT banners FROM "store_config" WHERE id = 'default'`;
    const newBanners = (config[0]?.banners || []).filter(b => b !== url);
    await prisma.$executeRaw`UPDATE "store_config" SET "banners" = ${newBanners}, "updatedAt" = NOW() WHERE id = 'default'`;
    res.json({ banners: newBanners });
  } catch {
    res.status(500).json({ error: 'Erro ao remover banner' });
  }
});

router.post('/banner/restore', adminMiddleware, async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'atlanta-sports/banners',
      max_results: 50,
    });
    const urls = result.resources.map(r => r.secure_url);
    await prisma.$executeRaw`UPDATE "store_config" SET "banners" = ${urls}, "updatedAt" = NOW() WHERE id = 'default'`;
    res.json({ restored: urls.length, banners: urls });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao restaurar banners' });
  }
});

module.exports = router;
