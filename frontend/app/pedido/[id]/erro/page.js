import Link from 'next/link';
import { XCircle } from 'lucide-react';

export const metadata = { title: 'Pagamento não aprovado' };

export default function PedidoErroPage({ params }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <XCircle size={64} className="mx-auto text-red-500 mb-6" />
        <h1 className="text-3xl font-black mb-2">Pagamento não aprovado</h1>
        <p className="text-gray-500 mb-8">
          Não conseguimos processar seu pagamento. Verifique os dados e tente novamente.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/carrinho" className="btn-primary">Tentar novamente</Link>
          <Link href="/" className="btn-outline">Voltar à loja</Link>
        </div>
      </div>
    </div>
  );
}
