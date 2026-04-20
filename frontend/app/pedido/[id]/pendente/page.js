'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import WhatsAppOrderButton from '@/components/WhatsAppOrderButton';
import api from '@/lib/api';

export default function PedidoPendentePage({ params }) {
  const { id } = use(params);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/orders/${id}`).then(r => setOrder(r.data)).catch(() => {});
  }, [id]);

  const codigo = order?.orderNumber ? `#${order.orderNumber}` : `#${id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <Clock size={64} className="mx-auto text-yellow-500 mb-6" />
        <h1 className="text-3xl font-black mb-2">Pagamento pendente</h1>
        <p className="text-gray-500 mb-2">
          Seu pagamento está sendo processado. Pode levar alguns minutos para ser confirmado.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Pedido: <span className="font-mono font-bold">{codigo}</span>
        </p>

        <div className="flex flex-col gap-3 justify-center">
          <WhatsAppOrderButton orderId={id} orderNumber={order?.orderNumber} total={order?.total} className="w-full" />
          <Link href="/minha-conta/pedidos" className="btn-primary">Acompanhar pedido</Link>
          <Link href="/" className="btn-outline">Voltar à loja</Link>
        </div>
      </div>
    </div>
  );
}
