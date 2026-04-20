'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore, useCartStore } from '@/lib/store';

const WHATSAPP_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const STEPS = ['Endereço', 'Pagamento', 'Confirmar'];

export default function CheckoutPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { items, total, setCart, couponCode, discount, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('mercadopago');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [address, setAddress] = useState({
    zip: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
  });

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    api.get('/cart').then(r => setCart(r.data.items, r.data.total));
    api.get('/config').then(r => setWhatsappNumber(r.data?.whatsapp || '')).catch(() => {});
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

  function buildWhatsappUrl(orderId) {
    const codigo = `#${orderId.slice(0, 8).toUpperCase()}`;
    const totalFormatado = `R$ ${finalTotal.toFixed(2).replace('.', ',')}`;
    const mensagem = [
      'Olá, Atlanta Sports! 🏆',
      'Acabei de fazer um pedido e gostaria de finalizar pelo WhatsApp.',
      '',
      `*Código do pedido:* ${codigo}`,
      `*Total:* ${totalFormatado}`,
      '',
      'Podem me ajudar a fechar a compra?',
    ].join('\n');
    const numero = whatsappNumber.replace(/\D/g, '');
    return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
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
        paymentMethod,
      });
      clearCart();
      if (paymentMethod === 'whatsapp') {
        window.open(buildWhatsappUrl(order.id), '_blank');
        router.push(`/pedido/${order.id}/sucesso`);
      } else {
        const { data: payment } = await api.post('/payment/create', { orderId: order.id });
        window.location.href = payment.initPoint;
      }
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
            <h2 className="font-black mb-4">Forma de pagamento</h2>
            <div className="space-y-3">
              <label
                className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                  paymentMethod === 'mercadopago'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="mercadopago"
                  checked={paymentMethod === 'mercadopago'}
                  onChange={() => setPaymentMethod('mercadopago')}
                  className="sr-only"
                />
                <span className="text-2xl">💳</span>
                <div className="flex-1">
                  <p className="font-semibold">Mercado Pago</p>
                  <p className="text-xs text-gray-500">PIX, cartão ou boleto — 12x sem juros</p>
                </div>
                {paymentMethod === 'mercadopago' && (
                  <CheckCircle size={20} className="text-primary-500 shrink-0" />
                )}
              </label>

              {whatsappNumber && (
                <label
                  className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                    paymentMethod === 'whatsapp'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="whatsapp"
                    checked={paymentMethod === 'whatsapp'}
                    onChange={() => setPaymentMethod('whatsapp')}
                    className="sr-only"
                  />
                  <span className="text-green-500">{WHATSAPP_ICON}</span>
                  <div className="flex-1">
                    <p className="font-semibold">WhatsApp</p>
                    <p className="text-xs text-gray-500">Combine o pagamento diretamente com a loja</p>
                  </div>
                  {paymentMethod === 'whatsapp' && (
                    <CheckCircle size={20} className="text-green-500 shrink-0" />
                  )}
                </label>
              )}
            </div>
          </div>

          <button
            type="submit"
            className={`w-full flex items-center justify-center gap-2 text-base py-4 font-semibold rounded-xl transition-colors ${
              paymentMethod === 'whatsapp'
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'btn-primary'
            }`}
            disabled={loading}
          >
            {loading ? (
              <><Loader2 size={20} className="animate-spin" /> Processando...</>
            ) : paymentMethod === 'whatsapp' ? (
              <>{WHATSAPP_ICON} Finalizar e abrir WhatsApp</>
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
