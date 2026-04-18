'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore, useCartStore } from '@/lib/store';

export default function CheckoutPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { items, total, setCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip: '',
  });

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    api.get('/cart').then(r => setCart(r.data.items, r.data.total));
  }, [token]);

  const shippingCost = total >= 299 ? 0 : 19.9;
  const finalTotal = total + shippingCost;

  async function handleSubmit(e) {
    e.preventDefault();
    if (items.length === 0) { toast.error('Carrinho vazio'); return; }
    setLoading(true);
    try {
      const { data: order } = await api.post('/orders', {
        shippingAddress: address,
        shippingCost,
        paymentMethod: 'mercadopago',
      });

      const { data: payment } = await api.post('/payment/create', { orderId: order.id });
      window.location.href = payment.initPoint;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao processar pedido');
    } finally {
      setLoading(false);
    }
  }

  const fieldLabels = {
    zip: 'CEP', street: 'Rua', number: 'Número', complement: 'Complemento',
    neighborhood: 'Bairro', city: 'Cidade', state: 'Estado',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black mb-8">Finalizar compra</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="md:col-span-2 space-y-4">
          <div className="card p-6">
            <h2 className="font-black mb-4">Endereço de entrega</h2>
            <div className="grid grid-cols-2 gap-4">
              {Object.keys(address).map(key => (
                <div key={key} className={key === 'street' || key === 'complement' ? 'col-span-2' : ''}>
                  <label className="block text-sm font-medium mb-1">{fieldLabels[key]}</label>
                  <input
                    className="input"
                    value={address[key]}
                    onChange={e => setAddress({ ...address, [key]: e.target.value })}
                    required={key !== 'complement'}
                    placeholder={key === 'zip' ? '00000-000' : key === 'state' ? 'SP' : ''}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-black mb-4">Pagamento</h2>
            <div className="flex items-center gap-3 p-4 border-2 border-primary-500 rounded-xl bg-primary-50">
              <span className="text-2xl">💳</span>
              <div>
                <p className="font-semibold">Mercado Pago</p>
                <p className="text-xs text-gray-500">PIX, cartão ou boleto — 12x sem juros</p>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Processando...' : 'Ir para pagamento'}
          </button>
        </form>

        <div className="card p-6 space-y-4 h-fit">
          <h2 className="font-black">Resumo do pedido</h2>
          {items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="truncate max-w-[65%]">{item.product.name} ×{item.quantity}</span>
              <span className="font-semibold">R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}</span>
            </div>
          ))}
          <div className="border-t pt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>R$ {total.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between">
              <span>Frete</span>
              <span className={shippingCost === 0 ? 'text-green-600 font-semibold' : ''}>
                {shippingCost === 0 ? 'Grátis' : `R$ ${shippingCost.toFixed(2).replace('.', ',')}`}
              </span>
            </div>
          </div>
          <div className="border-t pt-3 flex justify-between font-black text-lg">
            <span>Total</span>
            <span>R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
