'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Copy, Package } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import WhatsAppOrderButton from '@/components/WhatsAppOrderButton';
import api from '@/lib/api';
import toast from 'react-hot-toast';

function SucessoContent({ id }) {
  const searchParams = useSearchParams();
  const via = searchParams?.get('via');
  const viaPix = via === 'pix';
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
    navigator.clipboard.writeText(pixKey).then(() => toast.success('Chave PIX copiada!')).catch(() => toast.error('Não foi possível copiar'));
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
        <h1 className="text-3xl font-black mb-1">Pedido registrado!</h1>
        <p className="text-sm text-gray-400">
          Código: <span className="font-mono font-bold text-gray-700">{codigo}</span>
        </p>
      </div>

      {/* PIX */}
      {viaPix && order && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 space-y-4">
          <p className="font-black text-green-800 text-center text-lg">⚡ Pague agora via PIX</p>
          <div className="bg-white rounded-xl border border-green-200 px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-500">Valor a pagar</span>
            <span className="text-2xl font-black text-green-700">{fmt(order.total)}</span>
          </div>
          {pixKey && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Chave PIX:</p>
              <div className="bg-white border border-green-200 rounded-xl p-3 flex items-center gap-2">
                <p className="font-mono font-bold text-gray-800 break-all text-sm flex-1">{pixKey}</p>
                <button
                  type="button"
                  onClick={copyPix}
                  className="flex items-center gap-1 text-xs bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg px-3 py-1.5 shrink-0 transition-colors"
                >
                  <Copy size={12} /> Copiar
                </button>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 text-center">
            Após realizar o pagamento, clique no botão abaixo para enviar o comprovante pelo WhatsApp.
          </p>
        </div>
      )}

      {/* Parcelado */}
      {!viaPix && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6">
          <p className="font-black text-green-800 text-center text-lg mb-2">Combine o parcelamento</p>
          <p className="text-sm text-gray-600 text-center">
            Clique no botão abaixo para falar com a loja no WhatsApp e acertar as condições de parcelamento.
          </p>
        </div>
      )}

      {/* Itens do pedido */}
      {order?.items?.length > 0 && (
        <div className="card p-5 mb-6">
          <h2 className="font-black mb-3 flex items-center gap-2 text-sm text-gray-700">
            <Package size={16} /> Itens do pedido
          </h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.product?.images?.[0] ? (
                    <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">👕</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{item.product?.name}</p>
                  {item.variant?.size && (
                    <p className="text-xs text-gray-400">Tamanho: {item.variant.size}</p>
                  )}
                  <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
                </div>
                <p className="text-sm font-bold shrink-0">{fmt(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="border-t mt-3 pt-3 flex justify-between font-black text-sm">
            <span>Total</span>
            <span className="text-primary-600">{fmt(order.total)}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <WhatsAppOrderButton
          orderId={id}
          orderNumber={order?.orderNumber}
          total={order?.total}
          via={viaPix ? 'pix' : 'parcelado'}
          className="w-full ring-2 ring-green-400 ring-offset-2"
        />
        <Link href="/minha-conta/pedidos" className="btn-primary text-center">Ver meus pedidos</Link>
        <Link href="/" className="btn-outline text-center">Continuar comprando</Link>
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
