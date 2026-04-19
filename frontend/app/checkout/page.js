'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore, useCartStore } from '@/lib/store';

const STEPS = ['Endereço', 'Pagamento', 'Confirmar'];

export default function CheckoutPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { items, total, setCart, couponCode, discount, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState({
    zip: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
  });

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    api.get('/cart').then(r => setCart(r.data.items, r.data.total));
  }, [token]);

  const shippingCost = total >= 299 ? 0 : 19.9;
  const finalTotal = total - discount + shippingCost;

  async function fetchCep(cep) {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) { toast.error('CEP não encontrado'); return; }
      setAddress(a => ({
        ...a,
        street: data.logradouro || a.street,
        neighborhood: data.bairro || a.neighborhood,
        city: data.localidade || a.city,
        state: data.uf || a.state,
      }));
    } catch {
      toast.error('Erro ao buscar CEP');
    } finally {
      setCepLoading(false);
    }
  }

  function handleZipChange(e) {
    let val = e.target.value.replace(/\D/g, '').slice(0, 8);
    const formatted = val.length > 5 ? `${val.slice(0, 5)}-${val.slice(5)}` : val;
    setAddress(a => ({ ...a, zip: formatted }));
    if (val.length === 8) fetchCep(val);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (items.length === 0) { toast.error('Carrinho vazio'); return; }
    setLoading(true);
    try {
      const { data: order } = await api.post('/orders', {
        shippingAddress: address,
        shippingCost,
        couponCode: couponCode || undefined,
        paymentMethod: 'mercadopago',
      });
      const { data: payment } = await api.post('/payment/create', { orderId: order.id });
      clearCart();
      window.location.href = payment.initPoint;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao processar pedido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black mb-6">Finalizar compra</h1>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              i < step ? 'bg-green-500 text-white' : i === step ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              {i < step ? <CheckCircle size={16} /> : i + 1}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${i === step ? 'text-gray-900' : 'text-gray-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 w-8 ${i < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="md:col-span-2 space-y-4">
          {/* Endereço */}
          <div className="card p-6">
            <h2 className="font-black mb-4">Endereço de entrega</h2>
            <div className="grid grid-cols-2 gap-4">
              {/* CEP */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium mb-1">CEP</label>
                <div className="relative">
                  <input
                    className="input pr-10"
                    value={address.zip}
                    onChange={handleZipChange}
                    placeholder="00000-000"
                    required
                    maxLength={9}
                  />
                  {cepLoading && (
                    <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />
                  )}
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Rua</label>
                <input className="input" value={address.street} onChange={e => setAddress(a => ({ ...a, street: e.target.value }))} required placeholder="Nome da rua" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Número</label>
                <input className="input" value={address.number} onChange={e => setAddress(a => ({ ...a, number: e.target.value }))} required placeholder="123" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Complemento <span className="text-gray-400 font-normal">(opcional)</span></label>
                <input className="input" value={address.complement} onChange={e => setAddress(a => ({ ...a, complement: e.target.value }))} placeholder="Apto, bloco..." />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Bairro</label>
                <input className="input" value={address.neighborhood} onChange={e => setAddress(a => ({ ...a, neighborhood: e.target.value }))} required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Cidade</label>
                <input className="input" value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} required />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium mb-1">Estado</label>
                <input className="input" value={address.state} onChange={e => setAddress(a => ({ ...a, state: e.target.value.toUpperCase().slice(0, 2) }))} required placeholder="SP" maxLength={2} />
              </div>
            </div>
          </div>

          {/* Pagamento */}
          <div className="card p-6">
            <h2 className="font-black mb-4">Pagamento</h2>
            <div className="flex items-center gap-3 p-4 border-2 border-primary-500 rounded-xl bg-primary-50">
              <span className="text-2xl">💳</span>
              <div>
                <p className="font-semibold">Mercado Pago</p>
                <p className="text-xs text-gray-500">PIX, cartão ou boleto — 12x sem juros</p>
              </div>
              <CheckCircle size={20} className="ml-auto text-primary-500" />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full flex items-center justify-center gap-2 text-base py-4"
            disabled={loading}
          >
            {loading ? (
              <><Loader2 size={20} className="animate-spin" /> Processando...</>
            ) : (
              '🔒 Ir para pagamento'
            )}
          </button>
        </form>

        {/* Resumo */}
        <div className="space-y-4">
          <div className="card p-6 space-y-4 h-fit sticky top-24">
            <h2 className="font-black">Resumo do pedido</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="truncate max-w-[65%] text-gray-600">{item.product.name} ×{item.quantity}</span>
                  <span className="font-semibold">R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Cupom ({couponCode})</span>
                  <span>− R$ {discount.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Frete</span>
                <span className={shippingCost === 0 ? 'text-green-600 font-semibold' : ''}>
                  {shippingCost === 0 ? '🎉 Grátis' : `R$ ${shippingCost.toFixed(2).replace('.', ',')}`}
                </span>
              </div>
            </div>
            <div className="border-t pt-3 flex justify-between font-black text-lg">
              <span>Total</span>
              <span className="text-primary-600">R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
            </div>

            {total < 299 && (
              <p className="text-xs text-gray-400 text-center">
                Faltam <span className="font-semibold text-primary-500">R$ {(299 - total).toFixed(2).replace('.', ',')}</span> para frete grátis
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
