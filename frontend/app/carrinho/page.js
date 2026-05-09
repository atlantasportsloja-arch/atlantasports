'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useCartStore, useAuthStore } from '@/lib/store';
import { useConfig, pixPrice, fmt, getBestInstallment, getAllInstallments } from '@/lib/useConfig';

export default function CarrinhoPage() {
  const { token } = useAuthStore();
  const { items, total, setCart, setCoupon: saveCoupon, clearCoupon, couponCode, discount } = useCartStore();
  const config = useConfig();
  const [coupon, setCoupon] = useState(couponCode || '');
  const [loading, setLoading] = useState(false);
  const [showInstallments, setShowInstallments] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.get('/cart').then(r => setCart(r.data.items, r.data.total));
  }, [token]);

  async function updateQty(id, quantity) {
    try {
      await api.put(`/cart/${id}`, { quantity });
      const { data } = await api.get('/cart');
      setCart(data.items, data.total);
    } catch { toast.error('Erro ao atualizar'); }
  }

  async function removeItem(id) {
    try {
      await api.delete(`/cart/${id}`);
      const { data } = await api.get('/cart');
      setCart(data.items, data.total);
      toast.success('Item removido');
    } catch { toast.error('Erro ao remover'); }
  }

  async function validateCoupon() {
    if (!coupon) return;
    try {
      const { data } = await api.post('/coupons/validate', { code: coupon, subtotal: total });
      saveCoupon(coupon, data.discount);
      toast.success(`Cupom aplicado! Desconto de R$ ${data.discount.toFixed(2).replace('.', ',')}`);
    } catch (err) {
      clearCoupon();
      toast.error(err.response?.data?.error || 'Cupom inválido');
    }
  }

  if (!token) return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <ShoppingBag size={40} className="mx-auto text-gray-300 mb-3" />
      <p className="text-lg font-semibold mb-4">Faça login para ver seu carrinho</p>
      <Link href="/login" className="btn-primary">Entrar</Link>
    </div>
  );

  if (items.length === 0) return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <ShoppingBag size={40} className="mx-auto text-gray-300 mb-3" />
      <p className="text-lg font-semibold mb-1">Carrinho vazio</p>
      <p className="text-gray-500 text-sm mb-5">Adicione produtos para continuar</p>
      <Link href="/" className="btn-primary">Continuar comprando</Link>
    </div>
  );

  const finalTotal = total - discount;

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-4 py-3 md:py-8">
      <h1 className="text-base md:text-2xl font-black mb-3 md:mb-8">
        Carrinho ({items.length} {items.length === 1 ? 'item' : 'itens'})
      </h1>

      <div className="grid md:grid-cols-3 gap-2 md:gap-8">

        {/* ITENS */}
        <div className="md:col-span-2 space-y-1.5 md:space-y-4">
          {items.map(item => (
            <div key={item.id} className="card p-2 md:p-4 flex gap-2 md:gap-4">
              <div className="relative w-14 h-14 md:w-20 md:h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {item.product.images?.[0] ? (
                  <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">👕</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs md:text-base leading-tight truncate">{item.product.name}</p>
                {item.variant?.size && (
                  <span className="inline-block text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium mt-0.5">
                    {item.variant.size}
                  </span>
                )}
                <p className="text-primary-500 font-bold text-xs md:text-sm mt-0.5">
                  R$ {(item.variant?.price ?? item.product.price).toFixed(2).replace('.', ',')}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center border border-gray-300 rounded overflow-hidden text-xs">
                    <button className="px-1.5 py-0.5 hover:bg-gray-100 font-bold" onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))}>−</button>
                    <span className="px-2 border-x border-gray-300">{item.quantity}</span>
                    <button className="px-1.5 py-0.5 hover:bg-gray-100 font-bold" onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="text-right flex-shrink-0 flex flex-col justify-between">
                <p className="font-black text-xs md:text-base">
                  R$ {((item.variant?.price ?? item.product.price) * item.quantity).toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* RESUMO + CUPOM */}
        <div className="space-y-2 md:space-y-4">

          {/* Cupom */}
          <div className="card p-2.5 md:p-4">
            <p className="font-semibold text-xs md:text-sm mb-1.5">Cupom de desconto</p>
            <div className="flex gap-1.5">
              <input
                value={coupon}
                onChange={e => setCoupon(e.target.value.toUpperCase())}
                placeholder="CODIGO"
                className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button onClick={validateCoupon} className="border border-primary-500 text-primary-500 hover:bg-primary-50 font-semibold px-3 py-1.5 rounded-lg text-xs md:text-sm transition-colors">
                Aplicar
              </button>
            </div>
          </div>

          {/* Resumo */}
          <div className="card p-2.5 md:p-6 space-y-2 md:space-y-4">
            <h2 className="font-black text-sm md:text-lg">Resumo do pedido</h2>

            <div className="space-y-1.5 text-xs md:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto cupom</span>
                  <span>− R$ {discount.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>Frete</span>
                <span>{total >= 299 ? '🎉 Grátis' : 'No checkout'}</span>
              </div>
            </div>

            <div className="border-t pt-2 flex justify-between font-black text-sm md:text-lg">
              <span>Total</span>
              <span>R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
            </div>

            {/* PIX */}
            {config?.pixKey && config?.pixDiscount > 0 && (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-2 py-1.5">
                <div className="flex items-center gap-1">
                  <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">PIX</span>
                  <span className="text-green-700 font-black text-xs md:text-sm">R$ {fmt(pixPrice(finalTotal, config.pixDiscount))}</span>
                </div>
                <span className="text-green-600 text-[10px] font-semibold">{config.pixDiscount}% off</span>
              </div>
            )}

            {/* Parcelamento */}
            {(() => {
              const best = getBestInstallment(finalTotal, config);
              if (!best) return null;
              const all = getAllInstallments(finalTotal, config);
              return (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setShowInstallments(v => !v)}
                    className="w-full flex items-center justify-between text-xs md:text-sm text-gray-600 hover:text-gray-800"
                  >
                    <span>
                      ou <span className="font-black text-gray-900">{best.n}x</span> de{' '}
                      <span className="text-primary-600 font-black">R$ {fmt(best.value)}</span>
                    </span>
                    <span className="text-[10px] text-primary-500 underline">
                      {showInstallments ? 'ocultar' : 'ver parcelas'}
                    </span>
                  </button>
                  {showInstallments && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-[10px] md:text-xs">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="text-left px-2 py-1.5 font-semibold text-gray-500">Parcelas</th>
                            <th className="text-right px-2 py-1.5 font-semibold text-gray-500">Valor</th>
                            <th className="text-right px-2 py-1.5 font-semibold text-gray-500">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {all.map(row => (
                            <tr key={row.n} className={row.n === best.n ? 'bg-primary-50' : 'hover:bg-gray-50'}>
                              <td className="px-2 py-1.5 font-bold text-gray-800">{row.n}x</td>
                              <td className="px-2 py-1.5 text-right font-black text-primary-600">R$ {fmt(row.value)}</td>
                              <td className="px-2 py-1.5 text-right text-gray-500">R$ {fmt(row.value * row.n)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}

            <Link href="/checkout" className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-4 py-2.5 md:py-3 rounded-lg transition-colors block text-center text-sm md:text-base">
              Finalizar compra
            </Link>
            <Link href="/" className="block text-center text-xs md:text-sm text-primary-500 hover:underline">
              Continuar comprando
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
