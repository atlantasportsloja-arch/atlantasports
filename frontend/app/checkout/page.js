'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Loader2, Copy, Tag, X, ArrowLeft, Truck, ChevronRight, MapPin, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore, useCartStore } from '@/lib/store';

const WHATSAPP_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const STEPS = ['Carrinho', 'Dados', 'Revisão', 'Concluído'];

function StepBar({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i < current ? 'bg-primary-500 text-white' :
              i === current ? 'bg-gray-900 text-white' :
              'bg-gray-200 text-gray-400'
            }`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className={`text-xs mt-1 hidden sm:block ${i === current ? 'font-bold text-gray-900' : 'text-gray-400'}`}>{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-8 sm:w-16 h-0.5 mx-1 mb-4 sm:mb-0 transition-colors ${i < current ? 'bg-primary-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { items, total, setCart, couponCode, discount, setCoupon, clearCoupon, clearCart } = useCartStore();
  const [step, setStep] = useState(1); // 1=form, 2=review
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [storeConfig, setStoreConfig] = useState({});
  const [couponInput, setCouponInput] = useState(couponCode || '');
  const [errors, setErrors] = useState({});
  const [lastAddressUsed, setLastAddressUsed] = useState(false);
  const [freteOpcoes, setFreteOpcoes] = useState(null);
  const [freteSelecionado, setFreteSelecionado] = useState(null);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(299);
  const [address, setAddress] = useState({
    zip: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
  });

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    api.get('/cart').then(r => setCart(r.data.items, r.data.total));
    api.get('/config').then(r => {
      setStoreConfig(r.data || {});
      setFreeShippingThreshold(Number(r.data?.freeShippingThreshold || 299));
    }).catch(() => {});
    api.get('/auth/me/last-address').then(r => {
      if (r.data) { setAddress(r.data); setLastAddressUsed(true); }
    }).catch(() => {});
  }, [token]);

  const whatsappNumber = storeConfig.whatsapp || '';
  const pixDiscount = Number(storeConfig.pixDiscount || 0);
  const pixKey = storeConfig.pixKey || '';
  const subtotalWithCoupon = total - discount;
  const isFreeShipping = total >= freeShippingThreshold;
  const shippingCost = isFreeShipping ? 0 : (freteSelecionado?.preco ?? null);
  const pixDiscountAmount = paymentMethod === 'pix' && pixDiscount > 0
    ? subtotalWithCoupon * (pixDiscount / 100) : 0;
  const finalTotal = subtotalWithCoupon - pixDiscountAmount + (shippingCost ?? 0);

  const fmt = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;
  const inputClass = (field) =>
    `input ${errors[field] ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : ''}`;

  async function fetchCep(cep) {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const [viaCep, freteRes] = await Promise.allSettled([
        fetch(`https://viacep.com.br/ws/${digits}/json/`).then(r => r.json()),
        api.post('/frete/calcular', { cep: digits }),
      ]);
      if (viaCep.status === 'fulfilled' && !viaCep.value.erro) {
        const d = viaCep.value;
        setAddress(a => ({ ...a, street: d.logradouro || a.street, neighborhood: d.bairro || a.neighborhood, city: d.localidade || a.city, state: d.uf || a.state }));
      }
      setErrors(e => ({ ...e, zip: undefined }));
      if (freteRes.status === 'fulfilled') {
        const opcoes = freteRes.value.data.opcoes;
        setFreteOpcoes(opcoes);
        setFreteSelecionado(opcoes[0]);
      }
    } catch { toast.error('Erro ao buscar CEP'); }
    finally { setCepLoading(false); }
  }

  function handleZipChange(e) {
    let val = e.target.value.replace(/\D/g, '').slice(0, 8);
    const formatted = val.length > 5 ? `${val.slice(0, 5)}-${val.slice(5)}` : val;
    setAddress(a => ({ ...a, zip: formatted }));
    setErrors(e => ({ ...e, zip: undefined }));
    if (val.length === 8) fetchCep(val);
  }

  function fieldChange(field, value) {
    setAddress(a => ({ ...a, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  }

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await api.post('/coupons/validate', { code: couponInput.trim(), subtotal: total });
      setCoupon(couponInput.trim().toUpperCase(), data.discount);
      toast.success(`Cupom aplicado! −${fmt(data.discount)}`);
    } catch (err) {
      clearCoupon();
      toast.error(err.response?.data?.error || 'Cupom inválido');
    } finally { setCouponLoading(false); }
  }

  function validate() {
    const e = {};
    if (!address.zip || address.zip.replace(/\D/g, '').length !== 8) e.zip = 'CEP inválido';
    if (!address.street.trim()) e.street = 'Campo obrigatório';
    if (!address.number.trim()) e.number = 'Campo obrigatório';
    if (!address.neighborhood.trim()) e.neighborhood = 'Campo obrigatório';
    if (!address.city.trim()) e.city = 'Campo obrigatório';
    if (!address.state.trim() || address.state.length !== 2) e.state = 'UF inválida';
    return e;
  }

  function goToReview(e) {
    e.preventDefault();
    if (items.length === 0) { toast.error('Carrinho vazio'); return; }
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); toast.error('Preencha todos os campos obrigatórios'); return; }
    if (!isFreeShipping && !freteSelecionado) { toast.error('Preencha o CEP para calcular o frete'); return; }
    if (!pixKey && !whatsappNumber) { toast.error('Nenhuma forma de pagamento disponível'); return; }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function confirmOrder() {
    setLoading(true);
    try {
      const { data: order } = await api.post('/orders', {
        shippingAddress: address,
        shippingCost: isFreeShipping ? 0 : (freteSelecionado?.preco ?? 0),
        couponCode: couponCode || undefined,
        paymentMethod,
      });
      clearCart();
      router.push(`/pedido/${order.id}/sucesso?via=${paymentMethod}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao processar pedido');
      setStep(1);
    } finally { setLoading(false); }
  }

  function copyPix() {
    navigator.clipboard.writeText(pixKey).then(() => toast.success('Chave PIX copiada!'));
  }

  // ─── TELA DE REVISÃO ────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <StepBar current={2} />

        <h1 className="text-2xl font-black mb-6 text-center">Revise seu pedido</h1>

        <div className="space-y-4">
          {/* Itens */}
          <div className="card p-5">
            <h2 className="font-black mb-3 text-sm text-gray-500 uppercase tracking-wide">Itens ({items.length})</h2>
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.product?.images?.[0]
                      ? <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xl">👕</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.product.name}</p>
                    {item.variant?.size && <p className="text-xs text-gray-400">Tamanho: {item.variant.size}</p>}
                    <p className="text-xs text-gray-400">Qtd: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-sm shrink-0">{fmt((item.variant?.price ?? item.product.price) * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Endereço */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={16} className="text-primary-500" />
              <h2 className="font-black text-sm text-gray-500 uppercase tracking-wide">Entrega</h2>
              <button onClick={() => setStep(1)} className="ml-auto text-xs text-primary-500 hover:underline">Editar</button>
            </div>
            <p className="text-sm text-gray-700">
              {address.street}, {address.number}{address.complement ? ` — ${address.complement}` : ''}
            </p>
            <p className="text-sm text-gray-500">{address.neighborhood} · {address.city}/{address.state} · CEP {address.zip}</p>
            {freteSelecionado && !isFreeShipping && (
              <p className="text-sm text-primary-600 font-semibold mt-1">
                {freteSelecionado.servico} — {freteSelecionado.prazo} · {fmt(freteSelecionado.preco)}
              </p>
            )}
            {isFreeShipping && <p className="text-sm text-green-600 font-semibold mt-1">🎉 Frete grátis</p>}
          </div>

          {/* Pagamento */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard size={16} className="text-primary-500" />
              <h2 className="font-black text-sm text-gray-500 uppercase tracking-wide">Pagamento</h2>
              <button onClick={() => setStep(1)} className="ml-auto text-xs text-primary-500 hover:underline">Editar</button>
            </div>
            {paymentMethod === 'pix' ? (
              <div>
                <p className="font-bold">⚡ PIX{pixDiscount > 0 ? ` (${pixDiscount}% off)` : ''}</p>
                {pixKey && (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-mono text-sm text-gray-700 break-all">{pixKey}</p>
                    <button type="button" onClick={copyPix} className="flex items-center gap-1 text-xs text-green-600 border border-green-300 rounded px-2 py-0.5 font-semibold shrink-0">
                      <Copy size={11} /> Copiar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-green-500">{WHATSAPP_ICON}</span>
                <p className="font-bold">Parcelado via WhatsApp</p>
              </div>
            )}
          </div>

          {/* Totais */}
          <div className="card p-5 space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span><span>{fmt(total)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Cupom ({couponCode})</span><span>− {fmt(discount)}</span>
              </div>
            )}
            {pixDiscountAmount > 0 && (
              <div className="flex justify-between text-green-600 font-semibold">
                <span>⚡ Desconto PIX ({pixDiscount}%)</span><span>− {fmt(pixDiscountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500">
              <span>Frete</span>
              <span className={isFreeShipping ? 'text-green-600 font-semibold' : ''}>
                {isFreeShipping ? 'Grátis' : shippingCost !== null ? fmt(shippingCost) : '—'}
              </span>
            </div>
            <div className="border-t pt-3 flex justify-between font-black text-xl">
              <span>Total</span>
              <span className="text-primary-600">{fmt(finalTotal)}</span>
            </div>
          </div>

          {/* Botões */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={confirmOrder}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 text-base py-4 font-bold rounded-xl text-white transition-colors disabled:opacity-60 ${
                paymentMethod === 'pix' ? 'bg-green-500 hover:bg-green-600' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? (
                <><Loader2 size={20} className="animate-spin" /> Processando...</>
              ) : paymentMethod === 'pix' ? (
                <>⚡ Confirmar e pagar com PIX</>
              ) : (
                <>{WHATSAPP_ICON} Confirmar pedido</>
              )}
            </button>
            <button onClick={() => setStep(1)} className="btn-outline flex items-center justify-center gap-2">
              <ArrowLeft size={16} /> Voltar e editar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── TELA DE FORMULÁRIO ─────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <StepBar current={1} />

      <div className="grid md:grid-cols-3 gap-8">
        <form onSubmit={goToReview} className="md:col-span-2 space-y-4">

          {/* Endereço */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black">Endereço de entrega</h2>
              {lastAddressUsed && (
                <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-lg font-medium">
                  ✓ Último endereço usado
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium mb-1">CEP</label>
                <div className="relative">
                  <input className={inputClass('zip')} value={address.zip} onChange={handleZipChange} placeholder="00000-000" maxLength={9} />
                  {cepLoading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
                </div>
                {errors.zip && <p className="text-red-500 text-xs mt-1">{errors.zip}</p>}
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Rua</label>
                <input className={inputClass('street')} value={address.street} onChange={e => fieldChange('street', e.target.value)} placeholder="Nome da rua" />
                {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Número</label>
                <input className={inputClass('number')} value={address.number} onChange={e => fieldChange('number', e.target.value)} placeholder="123" />
                {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Complemento <span className="text-gray-400 font-normal">(opcional)</span></label>
                <input className="input" value={address.complement} onChange={e => fieldChange('complement', e.target.value)} placeholder="Apto, bloco..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bairro</label>
                <input className={inputClass('neighborhood')} value={address.neighborhood} onChange={e => fieldChange('neighborhood', e.target.value)} />
                {errors.neighborhood && <p className="text-red-500 text-xs mt-1">{errors.neighborhood}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cidade</label>
                <input className={inputClass('city')} value={address.city} onChange={e => fieldChange('city', e.target.value)} />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium mb-1">Estado (UF)</label>
                <input className={inputClass('state')} value={address.state} onChange={e => fieldChange('state', e.target.value.toUpperCase().slice(0, 2))} placeholder="SP" maxLength={2} />
                {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
              </div>
            </div>
          </div>

          {/* Frete */}
          <div className="card p-6">
            <h2 className="font-black mb-4 flex items-center gap-2">
              <Truck size={18} className="text-primary-500" /> Frete
            </h2>
            {isFreeShipping ? (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <span className="text-green-600 text-xl">🎉</span>
                <div>
                  <p className="font-bold text-green-700">Frete grátis!</p>
                  <p className="text-xs text-green-600">Pedido acima de {fmt(freeShippingThreshold)}</p>
                </div>
              </div>
            ) : freteOpcoes ? (
              <div className="space-y-2">
                {freteOpcoes.map(op => (
                  <label key={op.id} className={`flex items-center gap-3 border-2 rounded-xl p-3 cursor-pointer transition-colors ${freteSelecionado?.id === op.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="frete" className="sr-only" checked={freteSelecionado?.id === op.id} onChange={() => setFreteSelecionado(op)} />
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${freteSelecionado?.id === op.id ? 'border-primary-500' : 'border-gray-300'}`}>
                      {freteSelecionado?.id === op.id && <div className="w-2 h-2 rounded-full bg-primary-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{op.servico}</p>
                      <p className="text-xs text-gray-500">{op.prazo}</p>
                    </div>
                    <p className="font-black text-primary-600">{fmt(op.preco)}</p>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-2">Preencha o CEP para calcular o frete.</p>
            )}
          </div>

          {/* Cupom */}
          <div className="card p-6">
            <h2 className="font-black mb-4 flex items-center gap-2">
              <Tag size={18} className="text-primary-500" /> Cupom de desconto
            </h2>
            {couponCode ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <div>
                  <p className="font-bold text-green-700 font-mono">{couponCode}</p>
                  <p className="text-xs text-green-600">− {fmt(discount)} de desconto</p>
                </div>
                <button type="button" onClick={() => { clearCoupon(); setCouponInput(''); }} className="text-gray-400 hover:text-red-500">
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), applyCoupon())} placeholder="CÓDIGO DO CUPOM" className="input flex-1 text-sm" />
                <button type="button" onClick={applyCoupon} disabled={couponLoading || !couponInput.trim()} className="btn-outline py-2 px-4 text-sm flex items-center gap-1">
                  {couponLoading ? <Loader2 size={14} className="animate-spin" /> : 'Aplicar'}
                </button>
              </div>
            )}
          </div>

          {/* Pagamento */}
          <div className="card p-6">
            <h2 className="font-black mb-4">Forma de pagamento</h2>
            <div className="space-y-3">
              {pixKey && (
                <label className={`block border-2 rounded-xl cursor-pointer transition-colors overflow-hidden ${paymentMethod === 'pix' ? 'border-green-500' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="payment" value="pix" checked={paymentMethod === 'pix'} onChange={() => setPaymentMethod('pix')} className="sr-only" />
                  <div className={`flex items-center gap-3 p-4 ${paymentMethod === 'pix' ? 'bg-green-50' : ''}`}>
                    <span className="text-2xl">⚡</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold">PIX</p>
                        {pixDiscount > 0 && <span className="text-xs font-bold bg-green-500 text-white px-2 py-0.5 rounded-full">{pixDiscount}% off</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Pagamento instantâneo</p>
                    </div>
                    {paymentMethod === 'pix' && <CheckCircle size={20} className="text-green-500 shrink-0" />}
                  </div>
                  {paymentMethod === 'pix' && pixKey && (
                    <div className="border-t border-green-200 bg-white px-4 py-3">
                      <p className="text-xs text-gray-500 mb-1">Chave PIX:</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-bold text-gray-800 break-all text-sm flex-1">{pixKey}</p>
                        <button type="button" onClick={copyPix} className="flex items-center gap-1 text-xs text-green-600 border border-green-300 rounded-lg px-2 py-1 font-semibold shrink-0">
                          <Copy size={12} /> Copiar
                        </button>
                      </div>
                    </div>
                  )}
                </label>
              )}
              {whatsappNumber && (
                <label className={`block border-2 rounded-xl cursor-pointer transition-colors overflow-hidden ${paymentMethod === 'parcelado' ? 'border-green-500' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="payment" value="parcelado" checked={paymentMethod === 'parcelado'} onChange={() => setPaymentMethod('parcelado')} className="sr-only" />
                  <div className={`flex items-center gap-3 p-4 ${paymentMethod === 'parcelado' ? 'bg-green-50' : ''}`}>
                    <span className="text-green-500 flex items-center">{WHATSAPP_ICON}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold">Parcelado via WhatsApp</p>
                      <p className="text-xs text-gray-500 mt-0.5">Combine as parcelas com a loja</p>
                    </div>
                    {paymentMethod === 'parcelado' && <CheckCircle size={20} className="text-green-500 shrink-0" />}
                  </div>
                </label>
              )}
              {!pixKey && !whatsappNumber && (
                <p className="text-sm text-gray-500 text-center py-4">Nenhuma forma de pagamento disponível.</p>
              )}
            </div>
          </div>

          {/* Botão → revisão */}
          <button
            type="submit"
            disabled={!pixKey && !whatsappNumber}
            className="w-full flex items-center justify-center gap-2 text-base py-4 font-bold rounded-xl bg-gray-900 hover:bg-gray-800 text-white transition-colors disabled:opacity-60"
          >
            Revisar pedido <ChevronRight size={18} />
          </button>
        </form>

        {/* Resumo lateral */}
        <div>
          <div className="card p-6 space-y-4 sticky top-24">
            <h2 className="font-black">Resumo</h2>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm gap-2">
                  <span className="truncate text-gray-600 flex-1 min-w-0">
                    {item.product.name}
                    {item.variant?.size && <span className="text-gray-400"> ({item.variant.size})</span>}
                    {' '}×{item.quantity}
                  </span>
                  <span className="font-semibold shrink-0">{fmt((item.variant?.price ?? item.product.price) * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{fmt(total)}</span></div>
              {discount > 0 && <div className="flex justify-between text-green-600"><span>Cupom ({couponCode})</span><span>− {fmt(discount)}</span></div>}
              {pixDiscountAmount > 0 && <div className="flex justify-between text-green-600 font-semibold"><span>⚡ PIX ({pixDiscount}%)</span><span>− {fmt(pixDiscountAmount)}</span></div>}
              <div className="flex justify-between">
                <span>Frete{freteSelecionado && !isFreeShipping ? ` (${freteSelecionado.servico})` : ''}</span>
                <span className={isFreeShipping ? 'text-green-600 font-semibold' : shippingCost === null ? 'text-gray-400 text-xs' : ''}>
                  {isFreeShipping ? 'Grátis' : shippingCost === null ? 'a calcular' : fmt(shippingCost)}
                </span>
              </div>
            </div>
            <div className="border-t pt-3 flex justify-between font-black text-lg">
              <span>Total</span>
              <span className="text-primary-600">{shippingCost === null && !isFreeShipping ? '—' : fmt(finalTotal)}</span>
            </div>
            {!isFreeShipping && total < freeShippingThreshold && (
              <p className="text-xs text-gray-400 text-center">
                Faltam <span className="font-semibold text-primary-500">{fmt(freeShippingThreshold - total)}</span> para frete grátis
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
