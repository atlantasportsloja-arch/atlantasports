const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.atlantasports.com.br';

function header() {
  return `
    <div style="background:#111827;padding:24px;text-align:center;">
      <span style="color:#f97316;font-size:22px;font-weight:900;letter-spacing:-0.5px;">ATLANTA</span>
      <span style="color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">SPORTS</span>
    </div>
  `;
}

function footer() {
  return `
    <div style="background:#f3f4f6;padding:16px;text-align:center;">
      <a href="${FRONTEND_URL}" style="color:#f97316;font-size:13px;text-decoration:none;">Visitar a loja →</a>
    </div>
  `;
}

function wrap(content) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f9fafb;font-family:sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        ${header()}
        <div style="padding:32px;">
          ${content}
        </div>
        ${footer()}
      </div>
    </body>
    </html>
  `;
}

function fmtPrice(v) {
  return `R$ ${Number(v).toFixed(2).replace('.', ',')}`;
}

function personalizationBadges(p) {
  if (!p || (!p.name && !p.number)) return '';
  const parts = [];
  if (p.name) parts.push(`<span style="display:inline-block;background:#f5f3ff;border:1px solid #c4b5fd;color:#6d28d9;font-size:11px;font-weight:700;padding:2px 7px;border-radius:5px;margin-right:4px;">✏️ Nome: ${p.name}</span>`);
  if (p.number) parts.push(`<span style="display:inline-block;background:#f5f3ff;border:1px solid #c4b5fd;color:#6d28d9;font-size:11px;font-weight:700;padding:2px 7px;border-radius:5px;">🔢 Número: ${p.number}</span>`);
  return `<p style="margin:4px 0 0;">${parts.join('')}</p>`;
}

function itemsTable(items) {
  return items.map(item => `
    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #f3f4f6;">
      ${item.product?.images?.[0] ? `<img src="${item.product.images[0]}" width="48" height="48" style="border-radius:8px;object-fit:cover;flex-shrink:0;" />` : ''}
      <div style="flex:1;min-width:0;">
        <p style="margin:0;font-weight:600;color:#111;font-size:14px;">${item.product?.name || 'Produto'}</p>
        ${item.variant?.size ? `<p style="margin:2px 0 0;color:#6b7280;font-size:12px;">Tamanho: ${item.variant.size}</p>` : ''}
        <p style="margin:2px 0 0;color:#6b7280;font-size:12px;">Qtd: ${item.quantity}</p>
        ${personalizationBadges(item.personalization)}
      </div>
      <p style="margin:0;font-weight:700;color:#111;font-size:14px;flex-shrink:0;">${fmtPrice(item.price * item.quantity)}</p>
    </div>
  `).join('');
}

function orderConfirmationHtml({ userName, order }) {
  const codigo = order.orderNumber ? `#${order.orderNumber}` : `#${order.id.slice(0, 8).toUpperCase()}`;
  const addr = order.shippingAddress;

  return wrap(`
    <h2 style="margin:0 0 4px;color:#111;font-size:20px;">Pedido confirmado! 🎉</h2>
    <p style="color:#6b7280;margin:0 0 24px;">Olá, ${userName}! Seu pedido foi registrado com sucesso.</p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin-bottom:24px;text-align:center;">
      <p style="margin:0;color:#15803d;font-size:13px;font-weight:600;">Código do pedido</p>
      <p style="margin:4px 0 0;color:#166534;font-size:24px;font-weight:900;font-family:monospace;">${codigo}</p>
    </div>

    <h3 style="margin:0 0 12px;color:#374151;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Itens</h3>
    ${itemsTable(order.items || [])}

    <div style="margin-top:16px;padding-top:16px;border-top:2px solid #f3f4f6;">
      ${order.shippingCost === 0
        ? `<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:#6b7280;font-size:13px;">Frete</span><span style="color:#16a34a;font-weight:600;font-size:13px;">Grátis</span></div>`
        : `<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:#6b7280;font-size:13px;">Frete</span><span style="color:#374151;font-size:13px;">${fmtPrice(order.shippingCost)}</span></div>`
      }
      <div style="display:flex;justify-content:space-between;">
        <span style="color:#111;font-weight:700;">Total</span>
        <span style="color:#f97316;font-weight:900;font-size:18px;">${fmtPrice(order.total)}</span>
      </div>
    </div>

    ${addr ? `
    <div style="margin-top:20px;background:#f9fafb;border-radius:10px;padding:14px;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#374151;">Endereço de entrega</p>
      <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
        ${addr.street}, ${addr.number}${addr.complement ? ` — ${addr.complement}` : ''}<br>
        ${addr.neighborhood} — ${addr.city}/${addr.state}<br>
        CEP ${addr.zip}
      </p>
    </div>
    ` : ''}

    <div style="margin-top:24px;text-align:center;">
      <a href="${FRONTEND_URL}/minha-conta/pedidos"
         style="display:inline-block;background:#111827;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">
        Ver meus pedidos →
      </a>
    </div>

    <p style="color:#9ca3af;font-size:12px;margin-top:24px;text-align:center;">
      Obrigado por comprar na Atlanta Sports! 🏆<br>
      Em caso de dúvidas, fale conosco pelo WhatsApp.
    </p>
  `);
}

function orderShippedHtml({ userName, order, trackingCode }) {
  const codigo = order.orderNumber ? `#${order.orderNumber}` : `#${order.id.slice(0, 8).toUpperCase()}`;

  return wrap(`
    <h2 style="margin:0 0 4px;color:#111;font-size:20px;">Seu pedido foi enviado! 📦</h2>
    <p style="color:#6b7280;margin:0 0 24px;">Olá, ${userName}! Seu pedido ${codigo} saiu para entrega.</p>

    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 8px;color:#c2410c;font-size:13px;font-weight:600;">Código de rastreio</p>
      <p style="margin:0 0 12px;color:#9a3412;font-size:22px;font-weight:900;font-family:monospace;letter-spacing:0.1em;">${trackingCode}</p>
      <a href="https://www.correios.com.br/rastreamento/busca?objetos=${trackingCode}"
         target="_blank"
         style="display:inline-block;background:#f97316;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;">
        Rastrear entrega →
      </a>
    </div>

    <h3 style="margin:0 0 12px;color:#374151;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Itens enviados</h3>
    ${itemsTable(order.items || [])}

    <div style="margin-top:24px;text-align:center;">
      <a href="${FRONTEND_URL}/minha-conta/pedidos"
         style="display:inline-block;background:#111827;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">
        Acompanhar pedido →
      </a>
    </div>

    <p style="color:#9ca3af;font-size:12px;margin-top:24px;text-align:center;">
      Boa entrega! Qualquer dúvida estamos à disposição. 🏆
    </p>
  `);
}

function orderCancelledHtml({ userName, order }) {
  const codigo = order.orderNumber ? `#${order.orderNumber}` : `#${order.id.slice(0, 8).toUpperCase()}`;
  return wrap(`
    <h2 style="margin:0 0 4px;color:#111;font-size:20px;">Pedido cancelado</h2>
    <p style="color:#6b7280;margin:0 0 24px;">Olá, ${userName}! Seu pedido foi cancelado.</p>

    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;margin-bottom:24px;text-align:center;">
      <p style="margin:0;color:#dc2626;font-size:13px;font-weight:600;">Pedido cancelado</p>
      <p style="margin:4px 0 0;color:#991b1b;font-size:24px;font-weight:900;font-family:monospace;">${codigo}</p>
    </div>

    ${order.items?.length ? `
    <h3 style="margin:0 0 12px;color:#374151;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Itens cancelados</h3>
    ${itemsTable(order.items)}
    ` : ''}

    <p style="color:#6b7280;font-size:14px;margin-top:20px;line-height:1.6;">
      Se você realizou o pagamento, o estorno será processado conforme o método utilizado.
      Dúvidas? Fale conosco pelo WhatsApp.
    </p>

    <div style="margin-top:24px;text-align:center;">
      <a href="${FRONTEND_URL}"
         style="display:inline-block;background:#111827;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">
        Continuar comprando →
      </a>
    </div>

    <p style="color:#9ca3af;font-size:12px;margin-top:24px;text-align:center;">
      Atlanta Sports — Estamos aqui para ajudar. 🏆
    </p>
  `);
}

function orderDeliveredHtml({ userName, order }) {
  const codigo = order.orderNumber ? `#${order.orderNumber}` : `#${order.id.slice(0, 8).toUpperCase()}`;
  return wrap(`
    <h2 style="margin:0 0 4px;color:#111;font-size:20px;">Pedido entregue! 🎉</h2>
    <p style="color:#6b7280;margin:0 0 24px;">Olá, ${userName}! Seu pedido ${codigo} foi entregue com sucesso.</p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0;color:#15803d;font-size:36px;">✅</p>
      <p style="margin:8px 0 0;color:#166534;font-weight:700;font-size:15px;">Entregue com sucesso!</p>
    </div>

    ${order.items?.length ? `
    <h3 style="margin:0 0 12px;color:#374151;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Itens recebidos</h3>
    ${itemsTable(order.items)}
    ` : ''}

    <p style="color:#6b7280;font-size:14px;margin-top:20px;line-height:1.6;">
      Aproveite! Se quiser avaliar sua compra ou precisar de suporte, acesse sua conta.
    </p>

    <div style="margin-top:24px;text-align:center;">
      <a href="${FRONTEND_URL}/minha-conta/pedidos"
         style="display:inline-block;background:#16a34a;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">
        Avaliar minha compra →
      </a>
    </div>

    <p style="color:#9ca3af;font-size:12px;margin-top:24px;text-align:center;">
      Obrigado por comprar na Atlanta Sports! 🏆
    </p>
  `);
}

function welcomeHtml({ userName }) {
  return wrap(`
    <h2 style="margin:0 0 4px;color:#111;font-size:20px;">Bem-vindo(a) à Atlanta Sports! 🏆</h2>
    <p style="color:#6b7280;margin:0 0 24px;">Olá, ${userName}! Sua conta foi criada com sucesso.</p>

    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;color:#111;font-weight:700;">O que você encontra na nossa loja:</p>
      <ul style="margin:0;padding-left:20px;color:#6b7280;font-size:14px;line-height:2;">
        <li>👕 Camisas oficiais dos seus times favoritos</li>
        <li>👟 Tênis esportivos de alta performance</li>
        <li>💪 Acessórios fitness e treino</li>
        <li>🚚 Frete grátis acima de R$ 299</li>
        <li>⚡ Desconto especial no pagamento via PIX</li>
      </ul>
    </div>

    <div style="text-align:center;">
      <a href="${FRONTEND_URL}"
         style="display:inline-block;background:#f97316;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
        Explorar a loja →
      </a>
    </div>

    <p style="color:#9ca3af;font-size:12px;margin-top:24px;text-align:center;">
      Seja bem-vindo(a) à família Atlanta Sports! ⚽🏀🎽
    </p>
  `);
}

module.exports = { orderConfirmationHtml, orderShippedHtml, orderCancelledHtml, orderDeliveredHtml, welcomeHtml };
