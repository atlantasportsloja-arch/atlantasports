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
