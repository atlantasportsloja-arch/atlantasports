const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

const DEFAULT_ZONES = [
  { label: 'SP Capital',  cepStart: '01', cepEnd: '09', pacPrice: 12.9, pacDays: 4, sedexPrice: 23.22, sedexDays: 2 },
  { label: 'SP Interior', cepStart: '10', cepEnd: '19', pacPrice: 15.9, pacDays: 5, sedexPrice: 28.62, sedexDays: 2 },
  { label: 'RJ',          cepStart: '20', cepEnd: '28', pacPrice: 17.9, pacDays: 5, sedexPrice: 32.22, sedexDays: 2 },
  { label: 'MG',          cepStart: '30', cepEnd: '39', pacPrice: 19.9, pacDays: 6, sedexPrice: 35.82, sedexDays: 3 },
  { label: 'BA',          cepStart: '40', cepEnd: '48', pacPrice: 22.9, pacDays: 7, sedexPrice: 41.22, sedexDays: 3 },
  { label: 'CE',          cepStart: '60', cepEnd: '63', pacPrice: 24.9, pacDays: 8, sedexPrice: 44.82, sedexDays: 4 },
  { label: 'DF',          cepStart: '70', cepEnd: '73', pacPrice: 19.9, pacDays: 6, sedexPrice: 35.82, sedexDays: 3 },
  { label: 'PR',          cepStart: '80', cepEnd: '87', pacPrice: 18.9, pacDays: 6, sedexPrice: 34.02, sedexDays: 3 },
  { label: 'SC',          cepStart: '88', cepEnd: '89', pacPrice: 19.9, pacDays: 6, sedexPrice: 35.82, sedexDays: 3 },
  { label: 'RS',          cepStart: '90', cepEnd: '99', pacPrice: 21.9, pacDays: 7, sedexPrice: 39.42, sedexDays: 4 },
  { label: 'Demais regiões', cepStart: '00', cepEnd: '99', pacPrice: 27.9, pacDays: 10, sedexPrice: 50.22, sedexDays: 5 },
];

// Multiplicador de peso: base 300g (1 produto), +12% por produto adicional, máx 2.5×
function weightMultiplier(totalItems) {
  const qty = Math.max(1, Math.round(totalItems) || 1);
  return Math.min(1 + (qty - 1) * 0.12, 2.5);
}

router.post('/calcular', async (req, res) => {
  const { cep, totalItems = 1 } = req.body;
  if (!cep) return res.status(400).json({ error: 'CEP obrigatório' });

  const cepNum = cep.replace(/\D/g, '');
  if (cepNum.length !== 8) return res.status(400).json({ error: 'CEP inválido' });

  try {
    const [cfg] = await prisma.$queryRaw`SELECT "shippingZones", "freeShippingThreshold" FROM "store_config" WHERE id = 'default' LIMIT 1`;
    const zones = (cfg?.shippingZones && cfg.shippingZones.length > 0) ? cfg.shippingZones : DEFAULT_ZONES;
    const freeThreshold = Number(cfg?.freeShippingThreshold || 299);

    const prefix = cepNum.substring(0, 2);
    const zone = zones.find(z => prefix >= z.cepStart && prefix <= z.cepEnd) || zones[zones.length - 1];

    const mult = weightMultiplier(totalItems);
    const totalWeight = Math.max(1, Math.round(totalItems)) * 300;

    res.json({
      freeShippingThreshold: freeThreshold,
      pesoTotal: totalWeight,
      opcoes: [
        {
          id: 'pac',
          servico: 'PAC',
          prazo: `${zone.pacDays} dias úteis`,
          preco: Number((zone.pacPrice * mult).toFixed(2)),
        },
        {
          id: 'sedex',
          servico: 'SEDEX',
          prazo: `${zone.sedexDays} dias úteis`,
          preco: Number((zone.sedexPrice * mult).toFixed(2)),
        },
      ],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao calcular frete' });
  }
});

module.exports = router;
