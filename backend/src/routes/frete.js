const express = require('express');
const router = express.Router();

// Cálculo de frete simplificado por CEP
// Para produção: integrar Melhor Envio API (https://melhorenvio.com.br)
router.post('/calcular', async (req, res) => {
  const { cep, peso = 0.5 } = req.body;

  if (!cep) return res.status(400).json({ error: 'CEP obrigatório' });

  const cepNum = cep.replace(/\D/g, '');
  if (cepNum.length !== 8) return res.status(400).json({ error: 'CEP inválido' });

  // Lógica de frete por região (simplificado)
  const regiao = cepNum.substring(0, 2);
  const regiaoNum = parseInt(regiao);

  let prazo, preco;

  if (regiaoNum >= 1 && regiaoNum <= 9) {
    // SP capital
    prazo = 2; preco = 12.9;
  } else if (regiaoNum >= 10 && regiaoNum <= 19) {
    // SP interior
    prazo = 3; preco = 15.9;
  } else if (regiaoNum >= 20 && regiaoNum <= 28) {
    // RJ
    prazo = 3; preco = 17.9;
  } else if (regiaoNum >= 30 && regiaoNum <= 39) {
    // MG
    prazo = 4; preco = 19.9;
  } else if (regiaoNum >= 40 && regiaoNum <= 48) {
    // BA
    prazo = 5; preco = 22.9;
  } else if (regiaoNum >= 60 && regiaoNum <= 63) {
    // CE
    prazo = 6; preco = 24.9;
  } else if (regiaoNum >= 70 && regiaoNum <= 73) {
    // DF
    prazo = 4; preco = 19.9;
  } else if (regiaoNum >= 80 && regiaoNum <= 87) {
    // PR
    prazo = 4; preco = 18.9;
  } else if (regiaoNum >= 88 && regiaoNum <= 89) {
    // SC
    prazo = 4; preco = 19.9;
  } else if (regiaoNum >= 90 && regiaoNum <= 99) {
    // RS
    prazo = 5; preco = 21.9;
  } else {
    prazo = 7; preco = 27.9;
  }

  // Ajuste por peso
  if (peso > 1) preco += (peso - 1) * 3;

  res.json({
    opcoes: [
      {
        servico: 'PAC',
        prazo: `${prazo + 2} dias úteis`,
        preco: Number(preco.toFixed(2)),
      },
      {
        servico: 'SEDEX',
        prazo: `${prazo} dias úteis`,
        preco: Number((preco * 1.8).toFixed(2)),
      },
    ],
  });
});

module.exports = router;
