import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export const metadata = { title: 'Pedido confirmado' };

export default async function PedidoSucessoPage({ params }) {
  const { id } = await params;
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <CheckCircle size={64} className="mx-auto text-green-500 mb-6" />
        <h1 className="text-3xl font-black mb-2">Pedido confirmado!</h1>
        <p className="text-gray-500 mb-2">
          Seu pagamento foi aprovado. Você receberá um e-mail de confirmação em breve.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Pedido: <span className="font-mono font-bold">#{id.slice(0, 8).toUpperCase()}</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/minha-conta/pedidos" className="btn-primary">Ver meus pedidos</Link>
          <Link href="/" className="btn-outline">Continuar comprando</Link>
        </div>
      </div>
    </div>
  );
}
