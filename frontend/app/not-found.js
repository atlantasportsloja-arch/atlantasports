import Link from 'next/link';

export const metadata = { title: 'Página não encontrada' };

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6 select-none">⚽</div>

        <h1 className="text-6xl font-black text-gray-900 mb-2">404</h1>
        <p className="text-xl font-bold text-gray-700 mb-2">Página fora de campo</p>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Esta página saiu pela linha de fundo. Mas não se preocupe — temos muita coisa boa esperando por você.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary">
            Voltar para a loja
          </Link>
          <Link href="/busca" className="btn-outline">
            Buscar produtos
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
