'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, Package, Truck, CheckCircle, Clock, XCircle, Copy, ExternalLink, Loader2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { cldUrl } from '@/lib/cldUrl';

const STATUS_INFO = {
  PENDING:    { label: 'Aguardando pagamento', icon: Clock,        color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200',  step: -1 },
  PAID:       { label: 'Pagamento aprovado',   icon: CheckCircle,  color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',      step: 0  },
  PROCESSING: { label: 'Em separação',         icon: Package,      color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200',  step: 1  },
  SHIPPED:    { label: 'Enviado / A caminho',  icon: Truck,        color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200',  step: 2  },
  DELIVERED:  { label: 'Entregue',            icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50 border-green-200',    step: 3  },
  CANCELLED:  { label: 'Cancelado',           icon: XCircle,      color: 'text-red-500',    bg: 'bg-red-50 border-red-200',        step: -1 },
};

const STEPS = [
  { key: 'PAID',       label: 'Pagamento aprovado', icon: CheckCircle },
  { key: 'PROCESSING', label: 'Em separação',        icon: Package },
  { key: 'SHIPPED',    label: 'Enviado',             icon: Truck },
  { key: 'DELIVERED',  label: 'Entregue',            icon: MapPin },
];

function fmt(v) { return `R$ ${Number(v).toFixed(2).replace('.', ',')}` }

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Timeline({ status, history, createdAt }) {
  const info = STATUS_INFO[status] || STATUS_INFO.PENDING;
  const currentStep = info.step;

  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
        <XCircle size={24} className="text-red-500 shrink-0" />
        <div>
          <p className="font-bold text-red-700">Pedido cancelado</p>
          <p className="text-xs text-red-500 mt-0.5">Entre em contato com a loja para mais informações.</p>
        </div>
      </div>
    );
  }

  if (status === 'PENDING') {
    return (
      <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <Clock size={24} className="text-yellow-600 shrink-0 animate-pulse" />
        <div>
          <p className="font-bold text-yellow-800">Aguardando confirmação do pagamento</p>
          <p className="text-xs text-yellow-600 mt-0.5">Pedido criado em {fmtDate(createdAt)}</p>
        </div>
      </div>
    );
  }

  // Monta mapa de datas por status a partir do histórico
  const dateMap = {};
  (history || []).forEach(h => { dateMap[h.to_status] = h.changed_at; });

  return (
    <div className="space-y-0">
      {STEPS.map((step, i) => {
        const done = currentStep >= i;
        const active = currentStep === i;
        const Icon = step.icon;
        const date = dateMap[step.key];

        return (
          <div key={step.key} className="flex gap-4">
            {/* Linha vertical + círculo */}
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 shrink-0 transition-all ${
                done
                  ? active
                    ? 'bg-primary-500 border-primary-500 text-white shadow-md shadow-primary-200'
                    : 'bg-primary-500 border-primary-500 text-white'
                  : 'bg-white border-gray-200 text-gray-300'
              }`}>
                <Icon size={16} />
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-0.5 flex-1 my-1 min-h-[28px] ${done && currentStep > i ? 'bg-primary-500' : 'bg-gray-200'}`} />
              )}
            </div>

            {/* Conteúdo */}
            <div className={`pb-5 flex-1 ${i === STEPS.length - 1 ? 'pb-0' : ''}`}>
              <p className={`font-semibold text-sm ${done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
              {date ? (
                <p className="text-xs text-gray-400 mt-0.5">{fmtDate(date)}</p>
              ) : done ? (
                <p className="text-xs text-gray-400 mt-0.5">Concluído</p>
              ) : (
                <p className="text-xs text-gray-300 mt-0.5">Pendente</p>
              )}
              {active && (
                <span className="inline-block mt-1 text-[10px] font-bold bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full animate-pulse">
                  Status atual
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RastreioResult({ order }) {
  function copyCode() {
    navigator.clipboard.writeText(order.trackingCode)
      .then(() => toast.success('Código copiado!'))
      .catch(() => toast.error('Não foi possível copiar'));
  }

  return (
    <div className="space-y-4 mt-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs text-gray-400 font-mono">Pedido</p>
          <p className="text-2xl font-black">#{order.orderNumber}</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border font-semibold text-sm ${STATUS_INFO[order.status]?.bg}`}>
          <span className={STATUS_INFO[order.status]?.color}>{STATUS_INFO[order.status]?.label}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="card p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Acompanhamento</p>
        <Timeline status={order.status} history={order.history} createdAt={order.createdAt} />
      </div>

      {/* Código de rastreio */}
      {order.trackingCode && (
        <div className="card p-5 border-l-4 border-orange-400">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Truck size={14} /> Código de rastreio
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <code className="font-mono text-lg font-black text-orange-700 bg-orange-50 px-4 py-2 rounded-lg border border-orange-200">
              {order.trackingCode}
            </code>
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 border border-gray-300 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
            >
              <Copy size={14} /> Copiar
            </button>
            <a
              href={`https://www.correios.com.br/rastreamento/busca?objetos=${order.trackingCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-800 border border-orange-300 hover:bg-orange-50 px-3 py-2 rounded-lg transition-colors"
            >
              <ExternalLink size={14} /> Rastrear nos Correios
            </a>
          </div>
        </div>
      )}

      {/* Itens */}
      <div className="card p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Itens do pedido</p>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                {item.image ? (
                  <Image src={cldUrl(item.image, 96)} alt={item.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">👕</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{item.name}</p>
                {item.size && <p className="text-xs text-gray-400">Tamanho: {item.size}</p>}
                <p className="text-xs text-gray-400">Qtd: {item.quantity}</p>
              </div>
              <p className="text-sm font-bold shrink-0">{fmt(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>
        <div className="border-t mt-3 pt-3 flex justify-between text-sm">
          <span className="text-gray-500">Frete</span>
          <span>{order.shippingCost === 0 ? 'Grátis' : fmt(order.shippingCost)}</span>
        </div>
        <div className="flex justify-between font-black mt-1">
          <span>Total</span>
          <span className="text-primary-600">{fmt(order.total)}</span>
        </div>
      </div>
    </div>
  );
}

function RastreioInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [numero, setNumero] = useState(searchParams.get('numero') || '');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  async function buscar(e) {
    e?.preventDefault();
    if (!numero.trim() || !email.trim()) { setError('Preencha o número do pedido e o e-mail.'); return; }
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const { data } = await api.get('/orders/track', { params: { numero: numero.trim(), email: email.trim() } });
      setOrder(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Pedido não encontrado.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 md:py-14">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 rounded-2xl mb-4">
          <Truck size={28} className="text-primary-600" />
        </div>
        <h1 className="text-2xl md:text-3xl font-black mb-2">Rastrear pedido</h1>
        <p className="text-gray-500 text-sm">Informe o número do pedido e o e-mail usado na compra.</p>
      </div>

      <form onSubmit={buscar} className="card p-5 md:p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1.5">Número do pedido</label>
          <input
            className="input"
            placeholder="Ex: 1001"
            value={numero}
            onChange={e => setNumero(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1.5">E-mail da compra</label>
          <input
            className="input"
            type="email"
            placeholder="seuemail@exemplo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          {loading ? 'Buscando...' : 'Rastrear pedido'}
        </button>
      </form>

      {order && <RastreioResult order={order} />}
    </div>
  );
}

export default function RastreioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Carregando...</div>}>
      <RastreioInner />
    </Suspense>
  );
}
