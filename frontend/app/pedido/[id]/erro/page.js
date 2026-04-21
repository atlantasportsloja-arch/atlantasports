'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { XCircle } from 'lucide-react';
import WhatsAppOrderButton from '@/components/WhatsAppOrderButton';
import api from '@/lib/api';

export default function PedidoErroPage({ params }) {
  const { id } = use(params);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/orders/${id}`).then(r => setOrder(r.data)).catch(() => {});
  }, [id]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <XCircle size={64} className="mx-auto text-red-500 mb-6" />
        <h1 className="text-3xl font-black mb-2">Pagamento não aprovado</h1>
        <p className="text-gray-500 mb-4">
          Não conseguimos processar seu pagamento. Verifique os dados e tente novamente.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Prefere finalizar pelo WhatsApp? Fale com a gente:
        </p>
        <div className="flex flex-col gap-3 justify-center">
          <WhatsAppOrderButton orderId={id} orderNumber={order?.orderNumber} total={order?.total} className="w-full" />
          <Link href="/carrinho" className="btn-primary">Tentar novamente</Link>
          <Link href="/" className="btn-outline">Voltar à loja</Link>
        </div>
      </div>
    </div>
  );
}
