'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, ChevronDown, ChevronUp, ExternalLink, Star, Loader2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button" onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110">
          <Star size={20} className={s <= (hover || value) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ productId, productName, onDone }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!rating) { toast.error('Selecione uma nota'); return; }
    setLoading(true);
    try {
      await api.post('/reviews', { productId, rating, comment });
      toast.success('Depoimento enviado!');
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao enviar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3 space-y-2">
      <p className="text-sm font-semibold text-gray-700">Avaliar: <span className="text-primary-500">{productName}</span></p>
      <StarPicker value={rating} onChange={setRating} />
      <textarea className="input resize-none text-sm" rows={2} value={comment}
        onChange={e => setComment(e.target.value)} placeholder="Como foi o produto? (opcional)" />
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn-primary text-sm flex items-center gap-1.5 py-2">
          {loading ? <Loader2 size={14} className="animate-spin" /> : null} Enviar depoimento
        </button>
        <button type="button" onClick={onDone} className="btn-outline text-sm py-2">Cancelar</button>
      </div>
    </form>
  );
}

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
  const [reviewing, setReviewing] = useState(null);
  const [reordering, setReordering] = useState(null);

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    api.get('/orders').then(r => setOrders(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  async function reorder(order) {
    setReordering(order.id);
    try {
      let added = 0;
      for (const item of order.items) {
        if (!item.product) continue;
        try {
          await api.post('/cart', {
            productId: item.product.id,
            variantId: item.variantId || undefined,
            quantity: item.quantity,
          });
          added++;
        } catch {
          // ignora item sem estoque
        }
      }
      if (added === 0) {
        toast.error('Nenhum item disponível em estoque');
      } else {
        toast.success(`${added} item(s) adicionado(s) ao carrinho`);
        router.push('/carrinho');
      }
    } catch {
      toast.error('Erro ao repetir pedido');
    } finally {
      setReordering(null);
    }
  }

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
    <div className="max-w-3xl mx-auto px-2 md:px-4 py-4 md:py-8">
      <h1 className="text-lg md:text-2xl font-black mb-3 md:mb-6">Meus pedidos</h1>
      <div className="space-y-2 md:space-y-4">
        {orders.map(order => {
          const s = STATUS[order.status] || STATUS.PENDING;
          const isOpen = expanded === order.id;
          return (
            <div key={order.id} className="card overflow-hidden">
              <button
                className="w-full text-left p-3 md:p-5 hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(isOpen ? null : order.id)}
              >
                <div className="flex items-start justify-between gap-2 md:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm font-mono">#{order.orderNumber ?? order.id.slice(0, 8).toUpperCase()}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <OrderProgress status={order.status} />
                  </div>
                  <div className="text-right flex-shrink-0 flex items-start gap-2 md:gap-3">
                    <div>
                      <p className="font-black text-base md:text-lg">R$ {order.total.toFixed(2).replace('.', ',')}</p>
                      {['DELIVERED', 'CANCELLED'].includes(order.status) && (
                        <button
                          onClick={e => { e.stopPropagation(); reorder(order); }}
                          disabled={reordering === order.id}
                          className="mt-1 flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-800 hover:bg-primary-50 border border-primary-200 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {reordering === order.id
                            ? <Loader2 size={11} className="animate-spin" />
                            : <RotateCcw size={11} />}
                          Comprar novamente
                        </button>
                      )}
                    </div>
                    {isOpen ? <ChevronUp size={18} className="text-gray-400 mt-1" /> : <ChevronDown size={18} className="text-gray-400 mt-1" />}
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="border-t px-3 pb-3 pt-3 space-y-3 md:space-y-4">
                  {/* Itens */}
                  <div className="space-y-2">
                    {order.items.map(item => (
                      <div key={item.id}>
                        <div className="flex justify-between text-xs md:text-sm">
                          <span className="text-gray-600">
                            {item.product?.name || 'Produto'}
                            {(item.variant?.size || item.variant?.color) && (
                              <span className="text-gray-400 ml-1">
                                ({[item.variant.size, item.variant.color].filter(Boolean).join(' / ')})
                              </span>
                            )}
                            {' '}× {item.quantity}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                            {order.status === 'DELIVERED' && item.product && (
                              reviewing === item.id ? null : (
                                <button
                                  onClick={() => setReviewing(item.id)}
                                  className="text-xs text-yellow-600 hover:text-yellow-700 font-semibold border border-yellow-300 px-2 py-0.5 rounded-lg hover:bg-yellow-50 transition-colors flex-shrink-0"
                                >
                                  ⭐ Avaliar
                                </button>
                              )
                            )}
                          </div>
                        </div>
                        {reviewing === item.id && (
                          <ReviewForm
                            productId={item.product.id}
                            productName={item.product.name}
                            onDone={() => setReviewing(null)}
                          />
                        )}
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
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="font-semibold text-orange-800 text-xs md:text-sm mb-1.5">📦 Código de rastreio</p>
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
