'use client';
import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Copy, Check, X, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const EMPTY = { code: '', discount: '', type: 'percentage', minValue: '0', maxUses: '', expiresAt: '', onePerUser: false };

function couponStatus(c) {
  if (c.expiresAt && new Date() > new Date(c.expiresAt)) return 'expired';
  if (c.maxUses && c.usedCount >= c.maxUses) return 'exhausted';
  if (!c.active) return 'inactive';
  return 'active';
}

const STATUS_CONFIG = {
  active:    { label: 'Ativo',    color: 'bg-green-100 text-green-700' },
  inactive:  { label: 'Inativo',  color: 'bg-gray-100 text-gray-500' },
  expired:   { label: 'Expirado', color: 'bg-red-100 text-red-600' },
  exhausted: { label: 'Esgotado', color: 'bg-orange-100 text-orange-600' },
};

function expiringIn(c) {
  if (!c.expiresAt || couponStatus(c) !== 'active') return null;
  const days = Math.ceil((new Date(c.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
  return days <= 7 ? days : null;
}

function UsageBar({ used, max }) {
  if (!max) return <span className="text-gray-500">{used} usos</span>;
  const pct = Math.min((used / max) * 100, 100);
  const color = pct >= 90 ? 'bg-red-400' : pct >= 60 ? 'bg-orange-400' : 'bg-green-400';
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{used}/{max}</p>
      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CopyButton({ code }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button onClick={copy} className="text-gray-400 hover:text-gray-600 transition-colors" title="Copiar código">
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  );
}

function CouponForm({ initial = EMPTY, onSubmit, onCancel, saving, title }) {
  const [form, setForm] = useState(initial);
  const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      ...form,
      code: form.code.toUpperCase().trim(),
      discount: Number(form.discount),
      minValue: Number(form.minValue) || 0,
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      expiresAt: form.expiresAt || null,
      onePerUser: Boolean(form.onePerUser),
    });
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-black">{title}</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Código</label>
          <input className="input uppercase" placeholder="PROMO10" value={form.code} onChange={f('code')} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tipo</label>
          <select className="input" value={form.type} onChange={f('type')}>
            <option value="percentage">Porcentagem (%)</option>
            <option value="fixed">Valor fixo (R$)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Desconto {form.type === 'percentage' ? '(%)' : '(R$)'}
          </label>
          <input className="input" type="number" step="0.01" min="0"
            placeholder={form.type === 'percentage' ? '10' : '25.00'}
            value={form.discount} onChange={f('discount')} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Pedido mínimo (R$)</label>
          <input className="input" type="number" step="0.01" min="0" value={form.minValue} onChange={f('minValue')} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Limite de usos <span className="text-gray-400 font-normal">(opcional)</span></label>
          <input className="input" type="number" min="1" placeholder="100" value={form.maxUses} onChange={f('maxUses')} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Data de expiração <span className="text-gray-400 font-normal">(opcional)</span></label>
          <input className="input" type="date" value={form.expiresAt ? form.expiresAt.slice(0, 10) : ''} onChange={f('expiresAt')} />
        </div>
        <div className="col-span-2">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setForm(prev => ({ ...prev, onePerUser: !prev.onePerUser }))}
              className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.onePerUser ? 'bg-primary-500' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${form.onePerUser ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm font-medium">
              Limitar 1 uso por usuário
            </span>
          </label>
          <p className="text-xs text-gray-400 mt-1 ml-[52px]">Cada cliente só poderá usar este cupom uma vez</p>
        </div>
        <div className="col-span-2 flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving && <Loader2 size={15} className="animate-spin" />}
            {title}
          </button>
          <button type="button" onClick={onCancel} className="btn-outline">Cancelar</button>
        </div>
      </form>
    </div>
  );
}

export default function AdminCupons() {
  const [coupons, setCoupons] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await api.get('/coupons');
    setCoupons(data);
  }

  async function create(payload) {
    setSaving(true);
    try {
      await api.post('/coupons', payload);
      toast.success('Cupom criado');
      setShowCreate(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar');
    } finally {
      setSaving(false);
    }
  }

  async function update(id, payload) {
    setSaving(true);
    try {
      await api.put(`/coupons/${id}`, payload);
      toast.success('Cupom atualizado');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao atualizar');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    try {
      await api.delete(`/coupons/${id}`);
      toast.success('Cupom removido');
      setConfirmDelete(null);
      load();
    } catch {
      toast.error('Erro ao remover');
    }
  }

  async function toggle(id, active) {
    await api.put(`/coupons/${id}`, { active: !active });
    load();
  }

  const filtered = coupons.filter(c => {
    if (filter === 'all') return true;
    return couponStatus(c) === filter;
  });

  const counts = {
    all: coupons.length,
    active: coupons.filter(c => couponStatus(c) === 'active').length,
    inactive: coupons.filter(c => couponStatus(c) === 'inactive').length,
    expired: coupons.filter(c => couponStatus(c) === 'expired').length,
    exhausted: coupons.filter(c => couponStatus(c) === 'exhausted').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black">Cupons</h1>
        <button onClick={() => { setShowCreate(!showCreate); setEditing(null); }} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Novo cupom
        </button>
      </div>

      {showCreate && (
        <CouponForm
          title="Criar cupom"
          saving={saving}
          onSubmit={create}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'active', label: 'Ativos' },
          { key: 'inactive', label: 'Inativos' },
          { key: 'expired', label: 'Expirados' },
          { key: 'exhausted', label: 'Esgotados' },
        ].map(opt => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
              filter === opt.key
                ? 'bg-primary-500 text-white border-primary-500'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {opt.label}
            {counts[opt.key] > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filter === opt.key ? 'bg-white/20' : 'bg-gray-100'}`}>
                {counts[opt.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">Nenhum cupom encontrado</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const status = couponStatus(c);
            const cfg = STATUS_CONFIG[status];
            const expiring = expiringIn(c);
            const isEditing = editing?.id === c.id;

            if (isEditing) {
              return (
                <CouponForm
                  key={c.id}
                  title="Salvar alterações"
                  initial={{
                    code: c.code,
                    discount: String(c.discount),
                    type: c.type,
                    minValue: String(c.minValue),
                    maxUses: c.maxUses ? String(c.maxUses) : '',
                    expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
                    onePerUser: c.onePerUser || false,
                  }}
                  saving={saving}
                  onSubmit={(payload) => update(c.id, payload)}
                  onCancel={() => setEditing(null)}
                />
              );
            }

            return (
              <div key={c.id} className={`card p-5 ${status === 'expired' || status === 'exhausted' ? 'opacity-70' : ''}`}>
                <div className="flex items-start gap-4 flex-wrap">

                  {/* Código */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-black text-lg tracking-wide">{c.code}</span>
                    <CopyButton code={c.code} />
                  </div>

                  {/* Desconto */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl font-black text-primary-500">
                      {c.type === 'percentage' ? `${c.discount}%` : `R$ ${c.discount.toFixed(2).replace('.', ',')}`}
                    </span>
                    <span className="text-xs text-gray-400">{c.type === 'percentage' ? 'de desconto' : 'fixo'}</span>
                  </div>

                  {/* Status badge */}
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.color}`}>
                    {cfg.label}
                  </span>

                  {/* Badge 1 por usuário */}
                  {c.onePerUser && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
                      1 por usuário
                    </span>
                  )}

                  {/* Alerta expirando */}
                  {expiring !== null && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-1 rounded-lg">
                      <AlertTriangle size={12} />
                      Expira em {expiring === 0 ? 'hoje' : `${expiring} dia${expiring > 1 ? 's' : ''}`}
                    </span>
                  )}

                  {/* Ações */}
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => toggle(c.id, c.active)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                        c.active
                          ? 'border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500'
                          : 'border-green-200 text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {c.active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button onClick={() => { setEditing(c); setShowCreate(false); }} className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                      <Edit2 size={15} />
                    </button>
                    {confirmDelete === c.id ? (
                      <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                        <span className="text-xs text-red-600">Confirmar?</span>
                        <button onClick={() => remove(c.id)} className="text-xs bg-red-500 text-white px-2 py-0.5 rounded font-semibold hover:bg-red-600">Sim</button>
                        <button onClick={() => setConfirmDelete(null)} className="text-gray-400 hover:text-gray-600"><X size={13} /></button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(c.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Remover">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Detalhes */}
                <div className="flex gap-6 mt-3 pt-3 border-t text-sm flex-wrap">
                  <div>
                    <span className="text-xs text-gray-400 block">Pedido mínimo</span>
                    <span className="font-semibold">
                      {c.minValue > 0 ? `R$ ${c.minValue.toFixed(2).replace('.', ',')}` : 'Sem mínimo'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">Usos</span>
                    <UsageBar used={c.usedCount} max={c.maxUses} />
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">Expiração</span>
                    <span className={`font-semibold ${status === 'expired' ? 'text-red-500' : ''}`}>
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('pt-BR') : 'Sem prazo'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
