import Link from 'next/link';
import { Clock } from 'lucide-react';

export const metadata = { title: 'Pagamento pendente' };

export default async function PedidoPendentePage({ params }) {
  const { id } = await params;
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <Clock size={64} className="mx-auto text-yellow-500 mb-6" />
        <h1 className="text-3xl font-black mb-2">Pagamento pendente</h1>
        <p className="text-gray-500 mb-2">
          Seu pagamento está sendo processado. Pode levar alguns minutos para ser confirmado.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Pedido: <span className="font-mono font-bold">#{id.slice(0, 8).toUpperCase()}</span>
        </p>
        <Link href="/minha-conta/pedidos" className="btn-primary">Acompanhar pedido</Link>
      </div>
    </div>
  );
}
