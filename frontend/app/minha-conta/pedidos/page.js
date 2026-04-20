'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const STATUS = {
  PENDING:    { label: 'Aguardando pagamento', color: 'bg-yellow-100 text-yellow-700', step: 0 },
  PAID:       { label: 'Pagamento aprovado',   color: 'bg-blue-100 text-blue-700',    step: 1 },
  PROCESSING: { label: 'Em separação',         color: 'bg-purple-100 text-purple-700', step: 2 },
  SHIPPED:    { label: 'Enviado',              color: 'bg-orange-100 text-orange-700', step: 3 },
  DELIVERED:  { label: 'Entregue',             color: 'bg-green-100 text-green-700',  step: 4 },
  CANCELLED:  { label: 'Cancelado',            color: 'bg-red-100 text-red-700',      step: -1 },
};

const STEPS = ['Pago', 'Em separação', 'Enviado', 'Entregue'];

function OrderProgress({ status }) {
  const info = STATUS[status] || STATUS.PENDING;
  if (info.step < 0) return null;

  return (
    <div className="flex items-center gap-0 mt-3">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i <= info.step - 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              {i < info.step - 1 ? '✓' : i + 1}
            </div>
            <span className="text-xs text-gray-400 mt-1 hidden sm:block whitespace-nowrap">{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 transition-colors ${i < info.step - 1 ? 'bg-primary-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function PedidosPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    api.get('/orders').then(r => setOrders(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-400">Carregando...</div>
  );

  if (orders.length === 0) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <Package size={56} className="mx-auto text-gray-200 mb-4" />
      <p className="text-xl font-semibold mb-2">Nenhum pedido ainda</p>
      <Link href="/" className="btn-primary">Começar a comprar</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black mb-6">Meus pedidos</h1>
      <div className="space-y-4">
        {orders.map(order => {
          const s = STATUS[order.status] || STATUS.PENDING;
          const isOpen = expanded === order.id;
          return (
            <div key={order.id} className="card overflow-hidden">
              <button
                className="w-full text-left p-5 hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(isOpen ? null : order.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-semibold text-sm font-mono">#{order.orderNumber ?? order.id.slice(0, 8).toUpperCase()}</p>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                    <OrderProgress status={order.status} />
                  </div>
                  <div className="text-right flex-shrink-0 flex items-start gap-3">
                    <p className="font-black text-lg">R$ {order.total.toFixed(2).replace('.', ',')}</p>
                    {isOpen ? <ChevronUp size={18} className="text-gray-400 mt-1" /> : <ChevronDown size={18} className="text-gray-400 mt-1" />}
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="border-t px-5 pb-5 pt-4 space-y-4">
                  {/* Itens */}
                  <div className="space-y-2">
                    {order.items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.product?.name || 'Produto'} × {item.quantity}</span>
                        <span className="font-semibold">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                      </div>
                    ))}
                  </div>

                  {/* Resumo de valores */}
                  <div className="border-t pt-3 space-y-1 text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span>Frete</span>
                      <span>{order.shippingCost === 0 ? 'Grátis' : `R$ ${order.shippingCost.toFixed(2).replace('.', ',')}`}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>R$ {order.total.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>

                  {/* Endereço */}
                  {order.shippingAddress && (
                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                      <p className="font-semibold text-gray-700 mb-1">Endereço de entrega</p>
                      <p>{order.shippingAddress.street}, {order.shippingAddress.number}{order.shippingAddress.complement ? ` — ${order.shippingAddress.complement}` : ''}</p>
                      <p>{order.shippingAddress.neighborhood} — {order.shippingAddress.city}/{order.shippingAddress.state}</p>
                      <p>CEP {order.shippingAddress.zip}</p>
                    </div>
                  )}

                  {/* Rastreio */}
                  {order.trackingCode && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <p className="font-semibold text-orange-800 text-sm mb-2">📦 Código de rastreio</p>
                      <div className="flex items-center gap-3">
                        <code className="font-mono text-base font-bold text-orange-700 bg-orange-100 px-3 py-1.5 rounded">
                          {order.trackingCode}
                        </code>
                        <a
                          href={`https://www.correios.com.br/rastreamento/busca?objetos=${order.trackingCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-800 font-semibold"
                        >
                          Rastrear <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
