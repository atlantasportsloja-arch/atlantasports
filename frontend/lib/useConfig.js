'use client';
import { useEffect, useState } from 'react';
import api from './api';

let cache = null;
let pending = null;

export function useConfig() {
  const [config, setConfig] = useState(cache || {});

  useEffect(() => {
    if (cache) { setConfig(cache); return; }
    if (!pending) {
      pending = api.get('/config').then(r => {
        cache = r.data;
        return r.data;
      }).catch(() => ({}));
    }
    pending.then(data => setConfig(data));
  }, []);

  return config;
}

export function pixPrice(price, pixDiscount) {
  if (!pixDiscount || pixDiscount <= 0) return null;
  return price * (1 - pixDiscount / 100);
}

export function fmt(value) {
  return Number(value).toFixed(2).replace('.', ',');
}

// Retorna { n, value, rate } para a parcela de destaque (até maxDisplay)
export function getBestInstallment(price, config) {
  const cfg = config?.installments;
  if (!cfg?.active || !cfg.rows?.length || price <= 0) return null;
  const max = Math.min(cfg.maxDisplay || 6, 12);
  const fixedFee = cfg.fixedFee ?? 0;
  const rows = cfg.rows.filter(r => r.n >= 2 && r.n <= max).sort((a, b) => b.n - a.n);
  const row = rows[0];
  if (!row) return null;
  const value = (price * (1 + row.rate / 100)) / row.n + fixedFee;
  return { n: row.n, value, rate: row.rate };
}

// Retorna array [{n, value, rate}] para exibir tabela completa até maxDisplay
export function getAllInstallments(price, config) {
  const cfg = config?.installments;
  if (!cfg?.active || !cfg.rows?.length || price <= 0) return [];
  const max = Math.min(cfg.maxDisplay || 6, 12);
  const fixedFee = cfg.fixedFee ?? 0;
  return cfg.rows
    .filter(r => r.n >= 2 && r.n <= max)
    .sort((a, b) => a.n - b.n)
    .map(r => ({ n: r.n, value: (price * (1 + r.rate / 100)) / r.n + fixedFee, rate: r.rate }));
}
