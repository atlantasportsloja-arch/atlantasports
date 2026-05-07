const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

const PAC_CODE   = '04510';
const SEDEX_CODE = '04014';

const DEFAULT_ZONES = [
  { label: 'SP Capital',     cepStart: '01', cepEnd: '09', pacPrice: 12.9,  pacDays: 4,  sedexPrice: 23.22, sedexDays: 2 },
  { label: 'SP Interior',    cepStart: '10', cepEnd: '19', pacPrice: 15.9,  pacDays: 5,  sedexPrice: 28.62, sedexDays: 2 },
  { label: 'RJ',             cepStart: '20', cepEnd: '28', pacPrice: 17.9,  pacDays: 5,  sedexPrice: 32.22, sedexDays: 2 },
  { label: 'MG',             cepStart: '30', cepEnd: '39', pacPrice: 19.9,  pacDays: 6,  sedexPrice: 35.82, sedexDays: 3 },
  { label: 'BA',             cepStart: '40', cepEnd: '48', pacPrice: 22.9,  pacDays: 7,  sedexPrice: 41.22, sedexDays: 3 },
  { label: 'CE',             cepStart: '60', cepEnd: '63', pacPrice: 24.9,  pacDays: 8,  sedexPrice: 44.82, sedexDays: 4 },
  { label: 'DF',             cepStart: '70', cepEnd: '73', pacPrice: 19.9,  pacDays: 6,  sedexPrice: 35.82, sedexDays: 3 },
  { label: 'PR',             cepStart: '80', cepEnd: '87', pacPrice: 18.9,  pacDays: 6,  sedexPrice: 34.02, sedexDays: 3 },
  { label: 'SC',             cepStart: '88', cepEnd: '89', pacPrice: 19.9,  pacDays: 6,  sedexPrice: 35.82, sedexDays: 3 },
  { label: 'RS',             cepStart: '90', cepEnd: '99', pacPrice: 21.9,  pacDays: 7,  sedexPrice: 39.42, sedexDays: 4 },
  { label: 'Demais regiões', cepStart: '00', cepEnd: '99', pacPrice: 27.9,  pacDays: 10, sedexPrice: 50.22, sedexDays: 5 },
];

// Chama o webservice dos Correios e retorna array com PAC e SEDEX (ou null em caso de falha)
async function calcularCorreios({ cepOrigem, cepDestino, totalItems }) {
  const qty    = Math.max(1, Math.round(totalItems));
  const pesoKg = (qty * 0.3).toFixed(3);
  // dimensões realistas para roupas esportivas dobradas
  const altura = Math.min(Math.max(2, qty * 3), 90); // 3cm por peça, máx 90cm

  const params = new URLSearchParams({
    nCdEmpresa:          '',
    sDsSenha:            '',
    nCdServico:          `${PAC_CODE},${SEDEX_CODE}`,
    sCepOrigem:          cepOrigem.replace(/\D/g, ''),
    sCepDestino:         cepDestino.replace(/\D/g, ''),
    nVlPeso:             pesoKg,
    nCdFormato:          '1',   // caixa/pacote
    nVlComprimento:      '30',  // cm
    nVlAltura:           String(altura),
    nVlLargura:          '20',  // cm
    nVlDiametro:         '0',
    sCdMaoPropria:       'n',
    nVlValorDeclarado:   '0',
    sCdAvisoRecebimento: 'n',
    StrRetorno:          'xml',
    nIndicaCalculo:      '3',
  });

  const url = `https://ws.correios.com.br/calculador/CalcPrecoPrazo.aspx?${params}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const res  = await fetch(url, { signal: controller.signal });
    const text = await res.text();
    clearTimeout(timer);

    const servicos = [];
    for (const [, bloco] of text.matchAll(/<cServico>([\s\S]*?)<\/cServico>/g)) {
      const get = tag => bloco.match(new RegExp(`<${tag}>(.*?)</${tag}>`))?.[1]?.trim() ?? '';
      if (get('Erro') !== '0') continue;
      const valor = parseFloat(get('Valor').replace(',', '.'));
      const prazo = parseInt(get('PrazoEntrega'), 10);
      if (!valor || !prazo) continue;
      servicos.push({ codigo: get('Codigo'), valor, prazo });
    }

    return servicos.length ? servicos : null;
  } catch {
    clearTimeout(timer);
    return null; // timeout ou erro de rede → fallback por zonas
  }
}

router.post('/calcular', async (req, res) => {
  const { cep, totalItems = 1 } = req.body;
  if (!cep) return res.status(400).json({ error: 'CEP obrigatório' });

  const cepNum = cep.replace(/\D/g, '');
  if (cepNum.length !== 8) return res.status(400).json({ error: 'CEP inválido' });

  try {
    const [cfg] = await prisma.$queryRaw`
      SELECT "shippingZones", "freeShippingThreshold", "cepOrigem"
      FROM "store_config" WHERE id = 'default' LIMIT 1
    `;
    const freeThreshold = Number(cfg?.freeShippingThreshold || 299);
    const pesoTotal = Math.max(1, Math.round(totalItems)) * 300; // gramas

    // ── Tenta Correios real se CEP de origem estiver configurado ──────────────
    const cepOrigem = (cfg?.cepOrigem || '').replace(/\D/g, '');
    if (cepOrigem.length === 8) {
      const correios = await calcularCorreios({ cepOrigem, cepDestino: cepNum, totalItems });

      if (correios) {
        const pac   = correios.find(s => s.codigo === PAC_CODE);
        const sedex = correios.find(s => s.codigo === SEDEX_CODE);
        const opcoes = [];
        if (pac)   opcoes.push({ id: 'pac',   servico: 'PAC',   prazo: `${pac.prazo} dias úteis`,   preco: pac.valor });
        if (sedex) opcoes.push({ id: 'sedex', servico: 'SEDEX', prazo: `${sedex.prazo} dias úteis`, preco: sedex.valor });

        if (opcoes.length) {
          return res.json({ freeShippingThreshold: freeThreshold, pesoTotal, fonte: 'correios', opcoes });
        }
      }
    }

    // ── Fallback: tabela de zonas ─────────────────────────────────────────────
    const zones  = (cfg?.shippingZones && cfg.shippingZones.length > 0) ? cfg.shippingZones : DEFAULT_ZONES;
    const prefix = cepNum.substring(0, 2);
    const zone   = zones.find(z => prefix >= z.cepStart && prefix <= z.cepEnd) || zones[zones.length - 1];

    // aplica multiplicador de peso: +12% por item adicional, máx 2.5×
    const mult = Math.min(1 + (Math.max(1, Math.round(totalItems)) - 1) * 0.12, 2.5);

    res.json({
      freeShippingThreshold: freeThreshold,
      pesoTotal,
      fonte: 'tabela',
      opcoes: [
        { id: 'pac',   servico: 'PAC',   prazo: `${zone.pacDays} dias úteis`,   preco: Number((zone.pacPrice   * mult).toFixed(2)) },
        { id: 'sedex', servico: 'SEDEX', prazo: `${zone.sedexDays} dias úteis`, preco: Number((zone.sedexPrice * mult).toFixed(2)) },
      ],
    });
  } catch (err) {
    console.error('[Frete]', err.message);
    res.status(500).json({ error: 'Erro ao calcular frete' });
  }
});

module.exports = router;
