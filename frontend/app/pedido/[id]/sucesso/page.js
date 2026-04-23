'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle, Copy } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import WhatsAppOrderButton from '@/components/WhatsAppOrderButton';
import api from '@/lib/api';
import toast from 'react-hot-toast';

function SucessoContent({ id }) {
  const searchParams = useSearchParams();
  const via = searchParams?.get('via');
  const viaPix = via === 'pix';
  const viaParcelado = via === 'parcelado';
  const [order, setOrder] = useState(null);
  const [pixKey, setPixKey] = useState('');

  useEffect(() => {
    api.get(`/orders/${id}`).then(r => setOrder(r.data)).catch(() => {});
    if (viaPix) {
      api.get('/config').then(r => setPixKey(r.data?.pixKey || '')).catch(() => {});
    }
  }, [id, viaPix]);

  const codigo = order?.orderNumber ? `#${order.orderNumber}` : `#${id.slice(0, 8).toUpperCase()}`;
  const fmt = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

  function copyPix() {
    navigator.clipboard.writeText(pixKey).then(() => toast.success('Chave PIX copiada!'));
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="text-center max-w-md w-full">
        <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
        <h1 className="text-3xl font-black mb-1">Pedido registrado!</h1>
        <p className="text-sm text-gray-400 mb-8">
          Pedido: <span className="font-mono font-bold">{codigo}</span>
        </p>

        {/* PIX */}
        {viaPix && order && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 text-left">
            <p className="font-black text-green-800 mb-4 text-center text-lg">⚡ Pague agora via PIX</p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between bg-white rounded-xl border border-green-200 px-4 py-3">
                <span className="text-gray-500">Valor a pagar</span>
                <span className="text-2xl font-black text-green-700">{fmt(order.total)}</span>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Chave PIX:</p>
                <div className="flex items-center gap-2 bg-white border border-green-200 rounded-xl p-3">
                  <p className="font-mono font-bold text-gray-800 break-all text-sm flex-1">{pixKey || '—'}</p>
                  {pixKey && (
                    <button type="button" onClick={copyPix} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-semibold border border-green-300 rounded-lg px-2 py-1 shrink-0">
                      <Copy size={11} /> Copiar
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center">
                Após pagar, envie o comprovante pelo WhatsApp para confirmar seu pedido.
              </p>
            </div>
          </div>
        )}

        {/* Parcelado */}
        {viaParcelado && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 text-left">
            <p className="font-black text-green-800 mb-2 text-center text-lg">Combine o parcelamento</p>
            <p className="text-sm text-gray-600 text-center">
              Clique no botão abaixo para falar com a loja no WhatsApp e acertar as condições de parcelamento.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <WhatsAppOrderButton
            orderId={id}
            orderNumber={order?.orderNumber}
            total={order?.total}
            className={`w-full ${viaPix || viaParcelado ? 'ring-2 ring-green-400 ring-offset-2' : ''}`}
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
