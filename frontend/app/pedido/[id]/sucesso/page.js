'use client';
import { use, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import WhatsAppOrderButton from '@/components/WhatsAppOrderButton';
import api from '@/lib/api';

function SucessoContent({ id }) {
  const searchParams = useSearchParams();
  const viaWhatsApp = searchParams?.get('via') === 'whatsapp';
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/orders/${id}`).then(r => setOrder(r.data)).catch(() => {});
  }, [id]);

  const codigo = order?.orderNumber ? `#${order.orderNumber}` : `#${id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <CheckCircle size={64} className="mx-auto text-green-500 mb-6" />
        <h1 className="text-3xl font-black mb-2">Pedido registrado!</h1>

        {viaWhatsApp ? (
          <p className="text-gray-500 mb-2">
            Seu pedido foi criado. Clique abaixo para falar com a gente no WhatsApp e fechar a compra.
          </p>
        ) : (
          <p className="text-gray-500 mb-2">
            Seu pagamento foi aprovado. Você receberá um e-mail de confirmação em breve.
          </p>
        )}

        <p className="text-sm text-gray-400 mb-8">
          Pedido: <span className="font-mono font-bold">{codigo}</span>
        </p>

        <div className="flex flex-col gap-3 justify-center">
          <WhatsAppOrderButton
            orderId={id}
            orderNumber={order?.orderNumber}
            total={order?.total}
            className={`w-full ${viaWhatsApp ? 'ring-2 ring-green-400 ring-offset-2' : ''}`}
          />
          <Link href="/minha-conta/pedidos" className="btn-primary">Ver meus pedidos</Link>
          <Link href="/" className="btn-outline">Continuar comprando</Link>
        </div>
      </div>
    </div>
  );
}

export default function PedidoSucessoPage({ params }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Carregando...</div>}>
      <SucessoContent id={id} />
    </Suspense>
  );
}
