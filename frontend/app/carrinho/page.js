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
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
      <p className="text-xl font-semibold mb-4">Faça login para ver seu carrinho</p>
      <Link href="/login" className="btn-primary">Entrar</Link>
    </div>
  );

  if (items.length === 0) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
      <p className="text-xl font-semibold mb-2">Carrinho vazio</p>
      <p className="text-gray-500 mb-6">Adicione produtos para continuar</p>
      <Link href="/" className="btn-primary">Continuar comprando</Link>
    </div>
  );

  const finalTotal = total - discount;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black mb-8">Meu carrinho ({items.length} {items.length === 1 ? 'item' : 'itens'})</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.id} className="card p-4 flex gap-4">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {item.product.images?.[0] ? (
                  <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">👕</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{item.product.name}</p>
                {item.variant?.size && (
                  <div className="flex gap-1.5 mt-0.5">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">{item.variant.size}</span>
                  </div>
                )}
                <p className="text-primary-500 font-bold mt-1">
                  R$ {(item.variant?.price ?? item.product.price).toFixed(2).replace('.', ',')}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden text-sm">
                    <button className="px-2 py-1 hover:bg-gray-100" onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))}>−</button>
                    <span className="px-3">{item.quantity}</span>
                    <button className="px-2 py-1 hover:bg-gray-100" onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-black">R$ {((item.variant?.price ?? item.product.price) * item.quantity).toFixed(2).replace('.', ',')}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="card p-6 space-y-4">
            <h2 className="font-black text-lg">Resumo</h2>
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>R$ {total.toFixed(2).replace('.', ',')}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Desconto cupom</span>
                <span>− R$ {discount.toFixed(2).replace('.', ',')}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-500">
              <span>Frete</span>
              <span>{total >= 299 ? 'Grátis' : 'Calculado no checkout'}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-black text-lg">
              <span>Total</span>
              <span>R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
            </div>

            {/* PIX */}
            {config?.pixKey && config?.pixDiscount > 0 && (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">PIX</span>
                  <span className="text-green-700 font-black">R$ {fmt(pixPrice(finalTotal, config.pixDiscount))}</span>
                </div>
                <span className="text-green-600 text-xs font-semibold">{config.pixDiscount}% off</span>
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
                    className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <span>
                      ou <span className="font-black text-gray-900">{best.n}x</span> de{' '}
                      <span className="text-primary-600 font-black">R$ {fmt(best.value)}</span>
                    </span>
                    <span className="text-xs text-primary-500 underline">
                      {showInstallments ? 'ocultar' : 'ver parcelas'}
                    </span>
                  </button>
                  {showInstallments && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="text-left px-3 py-2 font-semibold text-gray-500">Parcelas</th>
                            <th className="text-right px-3 py-2 font-semibold text-gray-500">Valor/parcela</th>
                            <th className="text-right px-3 py-2 font-semibold text-gray-500">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {all.map(row => (
                            <tr key={row.n} className={row.n === best.n ? 'bg-primary-50' : 'hover:bg-gray-50'}>
                              <td className="px-3 py-2 font-bold text-gray-800">{row.n}x</td>
                              <td className="px-3 py-2 text-right font-black text-primary-600">R$ {fmt(row.value)}</td>
                              <td className="px-3 py-2 text-right text-gray-500">R$ {fmt(row.value * row.n)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}

            <Link href="/checkout" className="btn-primary block text-center">
              Finalizar compra
            </Link>
            <Link href="/" className="block text-center text-sm text-primary-500 hover:underline">
              Continuar comprando
            </Link>
          </div>

          <div className="card p-4 space-y-2">
            <p className="font-semibold text-sm">Cupom de desconto</p>
            <div className="flex gap-2">
              <input
                value={coupon}
                onChange={e => setCoupon(e.target.value.toUpperCase())}
                placeholder="CODIGO"
                className="input flex-1 text-sm py-2"
              />
              <button onClick={validateCoupon} className="btn-outline py-2 px-4 text-sm">Aplicar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
