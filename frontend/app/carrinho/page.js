'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useCartStore, useAuthStore } from '@/lib/store';

export default function CarrinhoPage() {
  const { token } = useAuthStore();
  const { items, total, setCart, setCoupon: saveCoupon, clearCoupon, couponCode, discount } = useCartStore();
  const [coupon, setCoupon] = useState(couponCode || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.get('/cart').then(r => setCart(r.data.items, r.data.total));
  }, [token]);

  async function updateQty(productId, quantity) {
    try {
      await api.put(`/cart/${productId}`, { quantity });
      const { data } = await api.get('/cart');
      setCart(data.items, data.total);
    } catch { toast.error('Erro ao atualizar'); }
  }

  async function removeItem(productId) {
    try {
      await api.delete(`/cart/${productId}`);
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
                <p className="text-primary-500 font-bold mt-1">
                  R$ {item.product.price.toFixed(2).replace('.', ',')}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden text-sm">
                    <button className="px-2 py-1 hover:bg-gray-100" onClick={() => updateQty(item.productId, Math.max(1, item.quantity - 1))}>−</button>
                    <span className="px-3">{item.quantity}</span>
                    <button className="px-2 py-1 hover:bg-gray-100" onClick={() => updateQty(item.productId, item.quantity + 1)}>+</button>
                  </div>
                  <button onClick={() => removeItem(item.productId)} className="text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-black">R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}</p>
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
