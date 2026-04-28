'use client';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#f9fafb' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ fontSize: '72px', marginBottom: '24px' }}>🏟️</div>
            <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#111', margin: '0 0 8px' }}>
              Erro crítico
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '32px', lineHeight: '1.6' }}>
              Algo saiu muito errado. Recarregue a página para continuar.
            </p>
            <button
              onClick={reset}
              style={{ background: '#f97316', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}
            >
              Recarregar
            </button>
            <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '24px' }}>
              <strong style={{ color: '#f97316' }}>ATLANTA</strong>
              <strong style={{ color: '#374151' }}>SPORTS</strong>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
