'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Loader2, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore, useCartStore } from '@/lib/store';

const WHATSAPP_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function CheckoutPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { items, total, setCart, couponCode, discount, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [storeConfig, setStoreConfig] = useState({});
  const [address, setAddress] = useState({
    zip: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
  });

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    api.get('/cart').then(r => setCart(r.data.items, r.data.total));
    api.get('/config').then(r => setStoreConfig(r.data || {})).catch(() => {});
  }, [token]);

  const whatsappNumber = storeConfig.whatsapp || '';
  const pixDiscount = Number(storeConfig.pixDiscount || 0);
  const pixKey = storeConfig.pixKey || '';

  const shippingCost = total >= 299 ? 0 : 19.9;
  const subtotalWithCoupon = total - discount;
  const pixDiscountAmount = paymentMethod === 'pix' && pixDiscount > 0
    ? subtotalWithCoupon * (pixDiscount / 100)
    : 0;
  const finalTotal = subtotalWithCoupon - pixDiscountAmount + shippingCost;

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
        paymentMethod,
      });
      clearCart();
      if (paymentMethod === 'pix') {
        router.push(`/pedido/${order.id}/sucesso?via=pix`);
      } else {
        router.push(`/pedido/${order.id}/sucesso?via=parcelado`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao processar pedido');
    } finally {
      setLoading(false);
    }
  }

  function copyPix() {
    navigator.clipboard.writeText(pixKey).then(() => toast.success('Chave PIX copiada!'));
  }

  const fmt = (v) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black mb-8">Finalizar compra</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="md:col-span-2 space-y-4">

          {/* Endereço */}
          <div className="card p-6">
            <h2 className="font-black mb-4">Endereço de entrega</h2>
            <div className="grid grid-cols-2 gap-4">
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

              {/* PIX */}
              {pixKey && (
                <label className={`block border-2 rounded-xl cursor-pointer transition-colors overflow-hidden ${
                  paymentMethod === 'pix' ? 'border-green-500' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input type="radio" name="payment" value="pix" checked={paymentMethod === 'pix'} onChange={() => setPaymentMethod('pix')} className="sr-only" />

                  <div className={`flex items-center gap-3 p-4 ${paymentMethod === 'pix' ? 'bg-green-50' : ''}`}>
                    <span className="text-2xl">⚡</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold">PIX</p>
                        {pixDiscount > 0 && (
                          <span className="text-xs font-bold bg-green-500 text-white px-2 py-0.5 rounded-full">
                            {pixDiscount}% de desconto
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Pagamento instantâneo e aprovação imediata</p>
                      {pixDiscount > 0 && (
                        <p className="text-sm font-bold text-green-600 mt-1">
                          Total com desconto: {fmt(subtotalWithCoupon * (1 - pixDiscount / 100) + shippingCost)}
                        </p>
                      )}
                    </div>
                    {paymentMethod === 'pix' && <CheckCircle size={20} className="text-green-500 shrink-0" />}
                  </div>

                  {paymentMethod === 'pix' && (
                    <div className="border-t border-green-200 bg-white px-4 py-3">
                      <p className="text-xs text-gray-500 mb-1">Chave PIX para pagamento:</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-bold text-gray-800 break-all text-sm flex-1">{pixKey}</p>
                        <button type="button" onClick={copyPix} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-semibold shrink-0 border border-green-300 rounded-lg px-2 py-1">
                          <Copy size={12} /> Copiar
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Após o pagamento, envie o comprovante pelo WhatsApp para confirmar seu pedido.</p>
                    </div>
                  )}
                </label>
              )}

              {/* Parcelado via WhatsApp */}
              {whatsappNumber && (
                <label className={`block border-2 rounded-xl cursor-pointer transition-colors overflow-hidden ${
                  paymentMethod === 'parcelado' ? 'border-green-500' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input type="radio" name="payment" value="parcelado" checked={paymentMethod === 'parcelado'} onChange={() => setPaymentMethod('parcelado')} className="sr-only" />

                  <div className={`flex items-center gap-3 p-4 ${paymentMethod === 'parcelado' ? 'bg-green-50' : ''}`}>
                    <span className="text-green-500 text-2xl flex items-center">{WHATSAPP_ICON}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold">Parcelado via WhatsApp</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Combine as parcelas diretamente com a loja</p>
                    </div>
                    {paymentMethod === 'parcelado' && <CheckCircle size={20} className="text-green-500 shrink-0" />}
                  </div>

                  {paymentMethod === 'parcelado' && (
                    <div className="border-t border-green-200 bg-white px-4 py-3">
                      <p className="text-xs text-gray-500">Após confirmar o pedido, você será redirecionado para o WhatsApp para combinar as condições de parcelamento.</p>
                    </div>
                  )}
                </label>
              )}
            </div>
          </div>

          {/* Botão de confirmação */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 text-base py-4 font-bold rounded-xl transition-colors text-white ${
              paymentMethod === 'pix'
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? (
              <><Loader2 size={20} className="animate-spin" /> Processando...</>
            ) : paymentMethod === 'pix' ? (
              <>⚡ Confirmar pedido e pagar com PIX</>
            ) : (
              <>{WHATSAPP_ICON} Confirmar pedido e combinar parcelamento</>
            )}
          </button>
        </form>

        {/* Resumo */}
        <div>
          <div className="card p-6 space-y-4 sticky top-24">
            <h2 className="font-black">Resumo</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="truncate max-w-[65%] text-gray-600">
                    {item.product.name}
                    {item.variant?.size && <span className="text-gray-400"> ({item.variant.size})</span>}
                    {' '}×{item.quantity}
                  </span>
                  <span className="font-semibold">{fmt((item.variant?.price ?? item.product.price) * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{fmt(total)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Cupom ({couponCode})</span>
                  <span>− {fmt(discount)}</span>
                </div>
              )}
              {pixDiscountAmount > 0 && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>⚡ Desconto PIX ({pixDiscount}%)</span>
                  <span>− {fmt(pixDiscountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Frete</span>
                <span className={shippingCost === 0 ? 'text-green-600 font-semibold' : ''}>
                  {shippingCost === 0 ? 'Grátis' : fmt(shippingCost)}
                </span>
              </div>
            </div>
            <div className="border-t pt-3 flex justify-between font-black text-lg">
              <span>Total</span>
              <span className="text-primary-600">{fmt(finalTotal)}</span>
            </div>
            {total < 299 && (
              <p className="text-xs text-gray-400 text-center">
                Faltam <span className="font-semibold text-primary-500">{fmt(299 - total)}</span> para frete grátis
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
