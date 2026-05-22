const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

// Peso estimado por item em gramas (roupa esportiva)
const PESO_POR_ITEM_G = 300;

// Mapa de prefixo de CEP (2 dígitos) → zona de entrega (1–7) a partir de SP
// Fonte: tabela oficial Correios 2024
const CEP_ZONA = {
  '01': 1, '02': 1, '03': 1, '04': 1, '05': 1, '06': 1, '07': 1, '08': 1, '09': 1, // SP Capital
  '10': 1, '11': 1, '12': 1, '13': 1, '14': 1, '15': 1, '16': 1, '17': 1, '18': 1, '19': 1, // SP Interior
  '20': 2, '21': 2, '22': 2, '23': 2, '24': 2, '25': 2, '26': 2, '27': 2, '28': 2, // RJ
  '29': 3,                                                                             // ES
  '30': 2, '31': 2, '32': 2, '33': 2, '34': 2, '35': 2, '36': 2, '37': 2, '38': 2, '39': 2, // MG
  '40': 4, '41': 4, '42': 4, '43': 4, '44': 4, '45': 4, '46': 4, '47': 4, '48': 4, // BA
  '49': 5,                                                                             // SE
  '50': 5, '51': 5, '52': 5, '53': 5, '54': 5, '55': 5, '56': 5,                   // PE
  '57': 5,                                                                             // AL
  '58': 5,                                                                             // PB
  '59': 5,                                                                             // RN
  '60': 5, '61': 5, '62': 5, '63': 5,                                                // CE
  '64': 6,                                                                             // PI
  '65': 6,                                                                             // MA
  '66': 6, '67': 6, '68': 6,                                                          // PA
  '69': 7,                                                                             // AM / RR / AC / AP
  '70': 3, '71': 3, '72': 3, '73': 3,                                                // DF / GO border
  '74': 3, '75': 3, '76': 3,                                                          // GO
  '77': 5,                                                                             // TO
  '78': 4,                                                                             // MT
  '79': 3,                                                                             // MS
  '80': 2, '81': 2, '82': 2, '83': 2, '84': 2, '85': 2, '86': 2, '87': 2,          // PR
  '88': 3, '89': 3,                                                                   // SC
  '90': 3, '91': 3, '92': 3, '93': 3, '94': 3, '95': 3, '96': 3, '97': 3, '98': 3, '99': 3, // RS
};

// Preços base (300g) e prazos por zona — tabela Correios vigente a partir de 12/04/2026
// Reajuste 2026: +4,2643% sobre tabela de abril/2025 (que já teve +9,6% sobre 2024)
// pacPreco e sedexPreco em R$, pacDias e sedexDias em dias úteis
const ZONA_CONFIG = {
  1: { label: 'São Paulo',                         pacPreco: 19.90, pacDias: 3,  sedexPreco: 26.50, sedexDias: 1 },
  2: { label: 'RJ / MG / PR',                      pacPreco: 24.90, pacDias: 5,  sedexPreco: 34.90, sedexDias: 2 },
  3: { label: 'ES / SC / RS / GO / DF / MS',       pacPreco: 28.50, pacDias: 6,  sedexPreco: 40.90, sedexDias: 2 },
  4: { label: 'BA / MT / SE',                      pacPreco: 32.90, pacDias: 8,  sedexPreco: 47.90, sedexDias: 3 },
  5: { label: 'PE / AL / PB / RN / CE / PI / TO', pacPreco: 37.90, pacDias: 10, sedexPreco: 56.90, sedexDias: 4 },
  6: { label: 'MA / PA / RO',                      pacPreco: 44.90, pacDias: 12, sedexPreco: 68.90, sedexDias: 5 },
  7: { label: 'AM / AC / RR / AP',                 pacPreco: 52.90, pacDias: 15, sedexPreco: 84.90, sedexDias: 6 },
};

// Multiplicador de preço por faixas de peso (Correios cobra por faixa)
function multiplicadorPeso(pesoG) {
  if (pesoG <=  300) return 1.00;
  if (pesoG <=  500) return 1.18;
  if (pesoG <=  750) return 1.35;
  if (pesoG <= 1000) return 1.55;
  if (pesoG <= 2000) return 2.00;
  if (pesoG <= 5000) return 3.10;
  return 4.20; // acima de 5kg
}

function calcularFrete(pesoG, zona) {
  const cfg  = ZONA_CONFIG[zona] || ZONA_CONFIG[7];
  const mult = multiplicadorPeso(pesoG);

  return {
    pac: {
      preco: Number((cfg.pacPreco * mult).toFixed(2)),
      dias:  cfg.pacDias,
    },
    sedex: {
      preco: Number((cfg.sedexPreco * mult).toFixed(2)),
      dias:  cfg.sedexDias,
    },
  };
}

router.post('/calcular', async (req, res) => {
  const { cep, totalItems = 1 } = req.body;
  if (!cep) return res.status(400).json({ error: 'CEP obrigatório' });

  const cepNum = cep.replace(/\D/g, '');
  if (cepNum.length !== 8) return res.status(400).json({ error: 'CEP inválido' });

  try {
    const [cfg] = await prisma.$queryRaw`
      SELECT "freeShippingThreshold"
      FROM "store_config" WHERE id = 'default' LIMIT 1
    `;
    const freeThreshold = Number(cfg?.freeShippingThreshold || 299);

    const qtd    = Math.max(1, Math.round(totalItems));
    const pesoG  = qtd * PESO_POR_ITEM_G;
    const prefix = cepNum.substring(0, 2);
    const zona   = CEP_ZONA[prefix] ?? 7; // fallback zona mais distante

    const { pac, sedex } = calcularFrete(pesoG, zona);

    res.json({
      freeShippingThreshold: freeThreshold,
      pesoTotal: pesoG,
      fonte: 'tabela_correios_2024',
      opcoes: [
        { id: 'pac',   servico: 'PAC',   prazo: `${pac.dias} dias úteis`,   preco: pac.preco },
        { id: 'sedex', servico: 'SEDEX', prazo: `${sedex.dias} dias úteis`, preco: sedex.preco },
      ],
    });
  } catch (err) {
    console.error('[Frete]', err.message);
    res.status(500).json({ error: 'Erro ao calcular frete' });
  }
});

module.exports = router;
