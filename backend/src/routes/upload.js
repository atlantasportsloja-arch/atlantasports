const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Apenas imagens são permitidas'));
    }
    cb(null, true);
  },
});

router.post('/produto', adminMiddleware, upload.array('images', 6), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    const urls = await Promise.all(req.files.map(file =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'atlanta-sports', quality: 'auto', fetch_format: 'auto' },
          (err, result) => err ? reject(err) : resolve(result.secure_url)
        );
        stream.end(file.buffer);
      })
    ));

    res.json({ urls });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao fazer upload' });
  }
});

router.delete('/produto', adminMiddleware, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL obrigatória' });
  try {
    const publicId = url.split('/').slice(-2).join('/').replace(/\.[^.]+$/, '');
    await cloudinary.uploader.destroy(publicId);
    res.json({ message: 'Imagem removida' });
  } catch {
    res.status(500).json({ error: 'Erro ao remover imagem' });
  }
});

module.exports = router;
