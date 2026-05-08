'use client';
import { useEffect, useState } from 'react';
import { RotateCcw, ChevronDown, ChevronUp, Loader2, StickyNote, Trash2, RefreshCw, ArrowLeftRight } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const STATUS_OPTIONS = ['REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED', 'EXCHANGED'];
const STATUS_LABEL = {
  REQUESTED: 'Solicitado',
  APPROVED:  'Aprovado',
  REJECTED:  'Rejeitado',
  RECEIVED:  'Recebido',
  REFUNDED:  'Reembolsado',
  EXCHANGED: 'Troca enviada',
};
const STATUS_COLOR = {
  REQUESTED: 'bg-yellow-100 text-yellow-700',
  APPROVED:  'bg-blue-100 text-blue-700',
  REJECTED:  'bg-red-100 text-red-700',
  RECEIVED:  'bg-purple-100 text-purple-700',
  REFUNDED:  'bg-green-100 text-green-700',
  EXCHANGED: 'bg-teal-100 text-teal-700',
};

const TYPE_LABEL = { REFUND: 'Devolução', EXCHANGE: 'Troca' };
const TYPE_COLOR = { REFUND: 'bg-orange-100 text-orange-700', EXCHANGE: 'bg-indigo-100 text-indigo-700' };

function NoteField({ returnId, initialNote, onSaved }) {
  const [note, setNote] = useState(initialNote || '');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await api.put(`/returns/admin/${returnId}`, { adminNote: note });
      toast.success('Nota salva');
      onSaved(note);
    } catch {
      toast.error('Erro ao salvar nota');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t" onClick={e => e.stopPropagation()}>
      <p className="text-xs font-semibold text-gray-500 flex items-center gap-1 mb-1.5">
        <StickyNote size={12} /> Nota interna
      </p>
      <div className="flex gap-2">
        <textarea
          className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500 bg-yellow-50"
          rows={2}
          placeholder="Observações internas sobre esta solicitação..."
          value={note}
          onChange={e => setNote(e.target.value)}
        />
        <button
          onClick={save}
          disabled={saving || note === (initialNote || '')}
          className="shrink-0 text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 rounded-lg disabled:opacity-40 transition-colors self-end pb-1"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : 'Salvar'}
        </button>
      </div>
    </div>
  );
}

function RefundField({ returnId, initialAmount, onSaved }) {
  const [amount, setAmount] = useState(initialAmount !== null && initialAmount !== undefined ? String(initialAmount) : '');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await api.put(`/returns/admin/${returnId}`, { refundAmount: amount });
      toast.success('Valor de reembolso atualizado');
      onSaved(amount ? Number(amount) : null);
    } catch {
      toast.error('Erro ao salvar valor');
    } finally {
      setSaving(false);
    }
  }

  const originalAmount = initialAmount !== null && initialAmount !== undefined ? String(initialAmount) : '';

  return (
    <div className="mt-3 pt-3 border-t" onClick={e => e.stopPropagation()}>
      <p className="text-xs font-semibold text-gray-500 mb-1.5">Valor do reembolso (R$)</p>
      <div className="flex gap-2 items-center">
        <input
          type="number"
          min="0"
          step="0.01"
          className="w-36 text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500 bg-gray-50"
          placeholder="0,00"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
        <button
          onClick={save}
          disabled={saving || amount === originalAmount}
          className="shrink-0 text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-40 transition-colors"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : 'Salvar'}
        </button>
      </div>
    </div>
  );
}

export default function DevolucoesPage() {
  const [returns, setReturns] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [deleting, setDeleting] = useState(null);

  async function load(p = page, st = filterStatus, tp = filterType) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (st) params.set('status', st);
      if (tp) params.set('type', tp);
      const { data } = await api.get(`/returns/admin/all?${params}`);
      setReturns(data.returns);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      toast.error('Erro ao carregar devoluções');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function applyFilters() {
    setPage(1);
    load(1, filterStatus, filterType);
  }

  function clearFilters() {
    setFilterStatus('');
    setFilterType('');
    setPage(1);
    load(1, '', '');
  }

  async function changeStatus(returnId, newStatus) {
    setUpdatingStatus(returnId);
    try {
      const { data } = await api.put(`/returns/admin/${returnId}`, { status: newStatus });
      setReturns(prev => prev.map(r => r.id === returnId ? { ...r, status: data.status } : r));
      toast.success('Status atualizado');
    } catch {
      toast.error('Erro ao atualizar status');
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function deleteReturn(returnId) {
    if (!confirm('Excluir esta solicitação?')) return;
    setDeleting(returnId);
    try {
      await api.delete(`/returns/admin/${returnId}`);
      setReturns(prev => prev.filter(r => r.id !== returnId));
      setTotal(t => t - 1);
      toast.success('Solicitação removida');
    } catch {
      toast.error('Erro ao remover');
    } finally {
      setDeleting(null);
    }
  }

  const counts = {
    total,
    pending: returns.filter(r => r.status === 'REQUESTED').length,
    active: returns.filter(r => ['APPROVED', 'RECEIVED'].includes(r.status)).length,
    done: returns.filter(r => ['REFUNDED', 'EXCHANGED'].includes(r.status)).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Devoluções e Trocas</h1>
          <p className="text-sm text-gray-500 mt-1">{total} solicitação{total !== 1 ? 'ões' : ''} no total</p>
        </div>
        <button onClick={() => load(page, filterStatus, filterType)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 border rounded-lg px-3 py-2 transition-colors">
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total',       value: total,          color: 'text-gray-800',    bg: 'bg-gray-50 border-gray-200' },
          { label: 'Pendentes',   value: counts.pending, color: 'text-yellow-700',  bg: 'bg-yellow-50 border-yellow-200' },
          { label: 'Em andamento',value: counts.active,  color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
          { label: 'Concluídas',  value: counts.done,    color: 'text-green-700',   bg: 'bg-green-50 border-green-200' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl border p-4 ${c.bg}`}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{c.label}</p>
            <p className={`text-3xl font-black mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
          <select className="input text-sm py-1.5" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Todos</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo</label>
          <select className="input text-sm py-1.5" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">Todos</option>
            <option value="REFUND">Devolução</option>
            <option value="EXCHANGE">Troca</option>
          </select>
        </div>
        <button onClick={applyFilters} className="btn-primary text-sm py-1.5 px-4">Filtrar</button>
        {(filterStatus || filterType) && (
          <button onClick={clearFilters} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">Limpar filtros</button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="animate-spin text-gray-300" />
        </div>
      ) : returns.length === 0 ? (
        <div className="bg-white rounded-xl border p-16 text-center">
          <RotateCcw size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 font-medium">Nenhuma solicitação encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map(ret => {
            const isOpen = expanded === ret.id;
            return (
              <div key={ret.id} className="bg-white rounded-xl border overflow-hidden">
                <button
                  className="w-full text-left p-5 hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : ret.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-sm font-mono">#{ret.returnNumber}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[ret.status]}`}>
                          {STATUS_LABEL[ret.status]}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLOR[ret.type]}`}>
                          {ret.type === 'EXCHANGE' ? <ArrowLeftRight size={10} className="inline mr-1" /> : <RotateCcw size={10} className="inline mr-1" />}
                          {TYPE_LABEL[ret.type]}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 mt-1">{ret.user?.name}</p>
                      <p className="text-xs text-gray-400">{ret.user?.email}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1 italic">"{ret.reason}"</p>
                    </div>
                    <div className="text-right flex-shrink-0 flex items-start gap-3">
                      <div>
                        <p className="text-xs text-gray-400">
                          {new Date(ret.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        {ret.order && (
                          <p className="text-xs text-gray-500 mt-0.5 font-mono">
                            Pedido #{ret.order.orderNumber ?? ret.order.id?.slice(0, 8).toUpperCase()}
                          </p>
                        )}
                        {ret.refundAmount != null && (
                          <p className="text-xs font-bold text-green-600 mt-0.5">
                            Reembolso: R$ {ret.refundAmount.toFixed(2).replace('.', ',')}
                          </p>
                        )}
                      </div>
                      {isOpen ? <ChevronUp size={18} className="text-gray-400 mt-1" /> : <ChevronDown size={18} className="text-gray-400 mt-1" />}
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t px-5 pb-5 pt-4 space-y-4" onClick={e => e.stopPropagation()}>
                    {/* Itens */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Itens solicitados</p>
                      <div className="space-y-2">
                        {ret.items.map(item => {
                          const product = item.orderItem?.product;
                          const variant = item.orderItem?.variant;
                          const img = product?.images?.[0];
                          return (
                            <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2.5">
                              {img && (
                                <Image src={img} alt={product.name} width={40} height={40} className="rounded-lg object-cover w-10 h-10 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{product?.name || 'Produto'}</p>
                                {(variant?.size || variant?.color) && (
                                  <p className="text-xs text-gray-400">{[variant.size, variant.color].filter(Boolean).join(' / ')}</p>
                                )}
                              </div>
                              <span className="text-sm font-semibold text-gray-600 flex-shrink-0">× {item.quantity}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Motivo completo */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Motivo</p>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{ret.reason}</p>
                    </div>

                    {/* Alterar status */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-xs font-semibold text-gray-500">Alterar status:</p>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.filter(s => s !== ret.status).map(s => (
                          <button
                            key={s}
                            onClick={() => changeStatus(ret.id, s)}
                            disabled={updatingStatus === ret.id}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all hover:opacity-80 disabled:opacity-40 ${STATUS_COLOR[s]} border-current`}
                          >
                            {updatingStatus === ret.id ? <Loader2 size={10} className="animate-spin inline" /> : STATUS_LABEL[s]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Valor de reembolso (só para REFUND) */}
                    {ret.type === 'REFUND' && (
                      <RefundField
                        returnId={ret.id}
                        initialAmount={ret.refundAmount}
                        onSaved={val => setReturns(prev => prev.map(r => r.id === ret.id ? { ...r, refundAmount: val } : r))}
                      />
                    )}

                    {/* Nota interna */}
                    <NoteField
                      returnId={ret.id}
                      initialNote={ret.adminNote}
                      onSaved={note => setReturns(prev => prev.map(r => r.id === ret.id ? { ...r, adminNote: note } : r))}
                    />

                    {/* Excluir */}
                    <div className="pt-2 border-t flex justify-end">
                      <button
                        onClick={() => deleteReturn(ret.id)}
                        disabled={deleting === ret.id}
                        className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                      >
                        {deleting === ret.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        Excluir solicitação
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Paginação */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => { const p = page - 1; setPage(p); load(p, filterStatus, filterType); }}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            ← Anterior
          </button>
          <span className="text-sm text-gray-500">Página {page} de {pages}</span>
          <button
            onClick={() => { const p = page + 1; setPage(p); load(p, filterStatus, filterType); }}
            disabled={page === pages}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
