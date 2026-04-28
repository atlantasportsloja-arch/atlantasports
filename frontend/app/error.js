'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6 select-none">🥅</div>

        <h1 className="text-4xl font-black text-gray-900 mb-2">Erro inesperado</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Algo deu errado no nosso lado. Já estamos de olho nisso. Tente novamente em instantes.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="btn-primary">
            Tentar novamente
          </button>
          <Link href="/" className="btn-outline">
            Voltar para a loja
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-8">
          <span className="font-black text-primary-500">ATLANTA</span>
          <span className="font-black text-gray-700">SPORTS</span>
        </p>
      </div>
    </div>
  );
}
