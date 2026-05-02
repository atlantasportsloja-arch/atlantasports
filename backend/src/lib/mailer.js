const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  family: 4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

async function sendMail({ to, subject, html, attachments }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('[Mailer] E-mail não configurado, pulando envio para:', to);
    return;
  }
  await transporter.sendMail({
    from: `"Atlanta Sports" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    ...(attachments ? { attachments } : {}),
  });
}

module.exports = { sendMail };
