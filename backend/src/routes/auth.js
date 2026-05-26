const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');
const { sendMail } = require('../lib/mailer');
const { welcomeHtml, resetPasswordHtml } = require('../lib/emails');

const router = express.Router();

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Nome obrigatório'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha mínimo 6 caracteres'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password, phone } = req.body;
  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ error: 'Email já cadastrado' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, phone },
      select: { id: true, name: true, email: true, role: true },
    });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.status(201).json({ user, token });

    // E-mail de boas-vindas (não bloqueia a resposta)
    sendMail({
      to: email,
      subject: `Bem-vindo(a) à Atlanta Sports! 🏆`,
      html: welcomeHtml({ userName: name.split(' ')[0] }),
    }).catch(err => console.error('[WelcomeMail] Erro ao enviar:', err.message));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar conta' });
  }
});

router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });
    if (user.blocked) return res.status(403).json({ error: 'Conta bloqueada. Entre em contato com o suporte.' });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
    });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

router.put('/me', authMiddleware, [
  body('name').optional().trim().notEmpty().withMessage('Nome não pode ser vazio'),
  body('phone').optional().trim(),
  body('currentPassword').optional(),
  body('newPassword').optional().isLength({ min: 6 }).withMessage('Nova senha mínimo 6 caracteres'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, phone, currentPassword, newPassword } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const data = {};
    if (name) data.name = name;
    if (phone !== undefined) data.phone = phone;

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: 'Informe a senha atual para alterá-la' });
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(400).json({ error: 'Senha atual incorreta' });
      data.password = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, name: true, email: true, role: true, phone: true },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'E-mail obrigatório' });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ ok: true }); // não revelar se e-mail existe

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpires: expires },
    });

    sendMail({
      to: email,
      subject: 'Redefinição de senha — Atlanta Sports',
      html: resetPasswordHtml({ userName: user.name.split(' ')[0], token }),
    }).catch(err => console.error('[ResetMail]', err.message));

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Dados inválidos' });
  if (password.length < 6) return res.status(400).json({ error: 'Senha mínimo 6 caracteres' });

  try {
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpires: { gt: new Date() } },
    });
    if (!user) return res.status(400).json({ error: 'Link inválido ou expirado' });

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetTokenExpires: null },
    });

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
});

router.get('/me/last-address', authMiddleware, async (req, res) => {
  try {
    const order = await prisma.order.findFirst({
      where: { userId: req.user.id, shippingAddress: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: { shippingAddress: true },
    });
    res.json(order?.shippingAddress || null);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar endereço' });
  }
});

module.exports = router;
