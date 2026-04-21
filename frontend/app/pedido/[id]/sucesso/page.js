'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import WhatsAppOrderButton from '@/components/WhatsAppOrderButton';
import api from '@/lib/api';

function SucessoContent({ id }) {
  const searchParams = useSearchParams();
  const via = searchParams?.get('via');
  const viaWhatsApp = via === 'whatsapp';
  const viaPix = via === 'pix';
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/orders/${id}`).then(r => setOrder(r.data)).catch(() => {});
  }, [id]);

  const codigo = order?.orderNumber ? `#${order.orderNumber}` : `#${id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        <CheckCircle size={64} className="mx-auto text-green-500 mb-6" />
        <h1 className="text-3xl font-black mb-2">Pedido registrado!</h1>
        <p className="text-sm text-gray-400 mb-6">
          Pedido: <span className="font-mono font-bold">{codigo}</span>
        </p>

        {viaPix && order && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6 text-left">
            <p className="font-black text-green-800 mb-3 text-center">⚡ Instruções de pagamento PIX</p>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600">Faça o PIX no valor de:</p>
              <p className="text-2xl font-black text-green-700">
                R$ {order.total.toFixed(2).replace('.', ',')}
              </p>
              <p className="text-gray-600 mt-3">Chave PIX:</p>
              <div className="bg-white border border-green-200 rounded-lg p-3">
                <p className="font-mono font-bold text-gray-800 break-all text-sm">{order.pixKey || '—'}</p>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Após o pagamento, envie o comprovante pelo WhatsApp para agilizar a confirmação.
              </p>
            </div>
          </div>
        )}

        {viaWhatsApp && (
          <p className="text-gray-500 mb-6">
            Seu pedido foi criado. Clique abaixo para falar com a gente no WhatsApp e fechar a compra.
          </p>
        )}

        {!viaPix && !viaWhatsApp && (
          <p className="text-gray-500 mb-6">
            Seu pagamento foi aprovado. Você receberá um e-mail de confirmação em breve.
          </p>
        )}

        <div className="flex flex-col gap-3 justify-center">
          <WhatsAppOrderButton
            orderId={id}
            orderNumber={order?.orderNumber}
            total={order?.total}
            className={`w-full ${viaWhatsApp || viaPix ? 'ring-2 ring-green-400 ring-offset-2' : ''}`}
          />
          <Link href="/minha-conta/pedidos" className="btn-primary">Ver meus pedidos</Link>
          <Link href="/" className="btn-outline">Continuar comprando</Link>
        </div>
      </div>
    </div>
  );
}

export default function PedidoSucessoPage({ params }) {
  const { id } = params;
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Carregando...</div>}>
      <SucessoContent id={id} />
    </Suspense>
  );
}
