'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Truck, Loader2, Search, X, Mail, Download, StickyNote, ChevronLeft, ChevronRight, History, Trash2 } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const STATUS_OPTIONS = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const STATUS_LABEL = { PENDING: 'Pendente', PAID: 'Pago', PROCESSING: 'Processando', SHIPPED: 'Enviado', DELIVERED: 'Entregue', CANCELLED: 'Cancelado' };
const STATUS_COLOR = { PENDING: 'bg-yellow-100 text-yellow-700', PAID: 'bg-blue-100 text-blue-700', PROCESSING: 'bg-purple-100 text-purple-700', SHIPPED: 'bg-orange-100 text-orange-700', DELIVERED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700' };
const STATUS_BORDER = { PENDING: 'border-yellow-400', PAID: 'border-blue-400', PROCESSING: 'border-purple-400', SHIPPED: 'border-orange-400', DELIVERED: 'border-green-400', CANCELLED: 'border-red-400' };

function TrackingField({ orderId, initialCode }) {
  const [code, setCode] = useState(initialCode);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await api.put(`/orders/admin/${orderId}/tracking`, { trackingCode: code });
      toast.success('Código de rastreio atualizado');
    } catch {
      toast.error('Erro ao salvar rastreio');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t" onClick={e => e.stopPropagation()}>
      <p className="text-xs font-semibold text-gray-500 flex items-center gap-1 mb-1.5">
        <Truck size={12} /> Código de rastreio
      </p>
      <div className="flex gap-2">
        <input
          className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-primary-500 bg-gray-50"
          placeholder="Ex: BR123456789BR"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); save(); } }}
        />
        <button
          onClick={save}
          disabled={saving || code === initialCode}
          className="shrink-0 text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 rounded-lg disabled:opacity-40 transition-colors"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : 'Salvar'}
        </button>
      </div>
    </div>
  );
}

function NoteField({ orderId, initialNote }) {
  const [note, setNote] = useState(initialNote);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await api.put(`/orders/admin/${orderId}/note`, { note });
      toast.success('Nota salva');
    } catch {
      toast.error('Erro ao salvar nota');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t" onClick={e => e.stopPropagation()}>
      <p className="text-xs font-semibold text-gray-500 flex items-center gap-1 mb-1.5">
        <StickyNote size={12} /> Nota interna (visível só para admins)
      </p>
      <div className="flex gap-2">
        <textarea
          className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500 bg-yellow-50"
          rows={2}
          placeholder="Ex: cliente ligou pedindo troca, aguardar contato..."
          value={note}
          onChange={e => setNote(e.target.value)}
        />
        <button
          onClick={save}
          disabled={saving || note === initialNote}
          className="shrink-0 text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 rounded-lg disabled:opacity-40 transition-colors"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : 'Salvar'}
        </button>
      </div>
    </div>
  );
}

function StatusHistory({ orderId }) {
  const [history, setHistory] = useState(null);

  useEffect(() => {
    api.get(`/orders/admin/${orderId}/history`)
      .then(r => setHistory(r.data))
      .catch(() => setHistory([]));
  }, [orderId]);

  if (!history || history.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t" onClick={e => e.stopPropagation()}>
      <p className="text-xs font-semibold text-gray-500 flex items-center gap-1 mb-2">
        <History size={12} /> Histórico de status
      </p>
      <div className="space-y-1.5">
        {history.map((h, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
            <span className="text-gray-400 w-32 shrink-0">
              {new Date(h.changed_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
            {h.from_status && (
              <>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLOR[h.from_status]}`}>{STATUS_LABEL[h.from_status]}</span>
                <span className="text-gray-300">→</span>
              </>
            )}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLOR[h.to_status]}`}>{STATUS_LABEL[h.to_status]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrackingModal({ order, onClose, onSave }) {
  const [code, setCode] = useState(order.trackingCode || '');
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      await onSave(order.id, 'SHIPPED', code);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Truck size={20} className="text-orange-500" />
          <h3 className="font-black">Código de rastreio</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Pedido <span className="font-mono font-bold">#{order.orderNumber ?? order.id.slice(0, 8).toUpperCase()}</span>
        </p>
        <input
          autoFocus
          className="input mb-4"
          placeholder="Ex: BR123456789BR"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
        />
        <div className="flex gap-3">
          <button onClick={save} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Confirmar envio
          </button>
          <button onClick={onClose} className="btn-outline px-4">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function AdminPedidosInner() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState(searchParams.get('status') || '');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [trackingModal, setTrackingModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const PAGE_SIZE = 30;

  useEffect(() => { setPage(1); }, [filter, dateFrom, dateTo]);
  useEffect(() => { load(); }, [filter, dateFrom, dateTo, page]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/orders/admin/all', {
        params: {
          status: filter || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          limit: PAGE_SIZE,
          page,
        },
      });
      const sorted = [...(data.orders || [])].sort((a, b) => (b.orderNumber ?? 0) - (a.orderNumber ?? 0));
      setOrders(sorted);
      setTotalPages(data.pages || 1);
      setTotalOrders(data.total || 0);
    } catch {
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status, trackingCode) {
    try {
      await api.put(`/orders/admin/${id}/status`, { status, trackingCode });
      toast.success('Pedido atualizado');
      load();
    } catch {
      toast.error('Erro ao atualizar');
    }
  }

  async function resendEmail(id) {
    try {
      await api.post(`/orders/admin/${id}/resend-confirmation`);
      toast.success('E-mail de confirmação reenviado!');
    } catch {
      toast.error('Erro ao reenviar e-mail');
    }
  }

  async function resetAllOrders() {
    const confirmed = confirm(
      'ATENÇÃO: Isso vai APAGAR TODOS os pedidos permanentemente e a numeração vai reiniciar em #1000.\n\nEssa ação NÃO pode ser desfeita!\n\nDeseja continuar?'
    );
    if (!confirmed) return;
    const confirmed2 = confirm('Tem CERTEZA? Todos os pedidos serão deletados para sempre.');
    if (!confirmed2) return;
    try {
      await api.delete('/orders/admin/reset-all');
      toast.success('Todos os pedidos foram apagados. Próximo: #1000');
      setOrders([]);
      setTotalOrders(0);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao apagar pedidos');
    }
  }

  function exportCSV() {
    const rows = [
      ['Nº Pedido', 'Cliente', 'E-mail', 'Total (R$)', 'Frete (R$)', 'Status', 'Pagamento', 'Rastreio', 'Data', 'Itens', 'Endereço'],
    ];
    filtered.forEach(o => {
      const addr = o.shippingAddress
        ? `${o.shippingAddress.street}, ${o.shippingAddress.number} - ${o.shippingAddress.city}/${o.shippingAddress.state} CEP ${o.shippingAddress.zip}`
        : '';
      const items = (o.items || []).map(i => `${i.product?.name || ''}${i.variant?.size ? ` (${i.variant.size})` : ''} x${i.quantity}`).join(' | ');
      rows.push([
        `#${o.orderNumber ?? o.id.slice(0, 8).toUpperCase()}`,
        o.user.name,
        o.user.email,
        o.total.toFixed(2).replace('.', ','),
        (o.shippingCost || 0).toFixed(2).replace('.', ','),
        STATUS_LABEL[o.status],
        o.paymentMethod || '',
        o.trackingCode || '',
        new Date(o.createdAt).toLocaleDateString('pt-BR'),
        items,
        addr,
      ]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleStatusChange(order, newStatus) {
    if (newStatus === 'SHIPPED') {
      setTrackingModal(order);
      return;
    }
    if (newStatus === 'CANCELLED') {
      const num = `#${order.orderNumber ?? order.id.slice(0, 8).toUpperCase()}`;
      if (!confirm(`Cancelar pedido ${num}?\n\nO estoque de todos os itens será restaurado automaticamente.`)) return;
    }
    updateStatus(order.id, newStatus);
  }

  const filtered = (search.trim()
    ? orders.filter(o => {
        const q = search.toLowerCase();
        const num = String(o.orderNumber || '');
        return (
          o.user.name.toLowerCase().includes(q) ||
          o.user.email.toLowerCase().includes(q) ||
          num.includes(q) ||
          o.id.toLowerCase().includes(q)
        );
      })
    : orders
  ).slice().sort((a, b) => (b.orderNumber ?? 0) - (a.orderNumber ?? 0));

  return (
    <div className="space-y-6">
      {trackingModal && (
        <TrackingModal
          order={trackingModal}
          onClose={() => setTrackingModal(null)}
          onSave={updateStatus}
        />
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black">Pedidos</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="border border-gray-300 rounded-lg pl-8 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-52"
              placeholder="Buscar cliente ou nº pedido"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="">Todos os status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              title="Data inicial"
            />
            <span className="text-gray-400 text-xs">até</span>
            <input
              type="date"
              className="border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              title="Data final"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="text-gray-400 hover:text-gray-600 p-1"
                title="Limpar datas"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <span className="text-sm text-gray-400">{filtered.length} pedidos</span>
          {filtered.length > 0 && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
              title="Exportar lista atual como CSV"
            >
              <Download size={14} /> CSV
            </button>
          )}
          <button
            onClick={resetAllOrders}
            className="flex items-center gap-1.5 text-sm font-semibold text-red-600 border border-red-300 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
            title="Apagar todos os pedidos e reiniciar em #1000"
          >
            <Trash2 size={14} /> Apagar tudo
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-400 animate-pulse">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          {search ? `Nenhum pedido encontrado para "${search}"` : 'Nenhum pedido encontrado'}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>{['Pedido', 'Cliente', 'Total', 'Status', 'Data', 'Ações'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(o => (
                  <React.Fragment key={o.id}>
                    <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                      <td className="px-4 py-3 font-mono text-xs font-bold">#{o.orderNumber ?? o.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{o.user.name}</p>
                        <p className="text-gray-400 text-xs">{o.user.email}</p>
                      </td>
                      <td className="px-4 py-3 font-bold">R$ {o.total.toFixed(2).replace('.', ',')}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLOR[o.status]}`}>
                          {STATUS_LABEL[o.status]}
                        </span>
                        {o.trackingCode && (
                          <p className="text-xs text-gray-400 mt-1 font-mono">{o.trackingCode}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <select
                          className={`border-2 ${STATUS_BORDER[o.status]} rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white cursor-pointer`}
                          value={o.status}
                          onChange={e => handleStatusChange(o, e.target.value)}
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                        </select>
                      </td>
                    </tr>
                    {expanded === o.id && (
                      <tr>
                        <td colSpan={6} className="bg-gray-50 px-6 py-5">

                          {/* Itens para separação */}
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">📦 Itens para separação ({(o.items || []).length})</p>
                          <div className="space-y-2">
                            {(o.items || []).map((item, idx) => (
                              <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3">
                                <span className="text-gray-300 text-xs font-mono w-4 shrink-0">{idx + 1}</span>
                                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                                  {item.product?.images?.[0] ? (
                                    <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl">👕</div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm text-gray-900 leading-snug">{item.product?.name || '—'}</p>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                    {item.variant?.size && (
                                      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-md">
                                        Tamanho: {item.variant.size}
                                      </span>
                                    )}
                                    {item.variant?.color && (
                                      <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-md">
                                        Cor: {item.variant.color}
                                      </span>
                                    )}
                                    {!item.variant?.size && !item.variant?.color && (
                                      <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-md">Sem variante</span>
                                    )}
                                    <span className="bg-orange-100 text-orange-700 text-xs font-black px-2.5 py-0.5 rounded-md">
                                      Qtd: {item.quantity}
                                    </span>
                                    {item.personalization?.name && (
                                      <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 rounded-md">
                                        ✏️ Nome: {item.personalization.name}
                                      </span>
                                    )}
                                    {item.personalization?.number && (
                                      <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 rounded-md">
                                        🔢 Número: {item.personalization.number}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-xs text-gray-400">R$ {item.price.toFixed(2).replace('.', ',')} × {item.quantity}</p>
                                  <p className="font-black text-sm text-gray-900">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Totais */}
                          <div className="mt-3 flex justify-end gap-6 text-sm text-gray-600 pr-1">
                            {o.shippingCost > 0 && (
                              <span>Frete: <strong>R$ {o.shippingCost.toFixed(2).replace('.', ',')}</strong></span>
                            )}
                            <span>Total: <strong className="text-gray-900 text-base">R$ {o.total.toFixed(2).replace('.', ',')}</strong></span>
                          </div>

                          {/* Dados do cliente */}
                          <div className="mt-4 pt-3 border-t">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">👤 Dados do Cliente</p>
                            <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                              <div>
                                <span className="text-xs text-gray-400 block">Nome</span>
                                <span className="font-semibold text-gray-900">{o.user.name}</span>
                              </div>
                              <div>
                                <span className="text-xs text-gray-400 block">E-mail</span>
                                <span className="font-semibold text-gray-900">{o.user.email}</span>
                              </div>
                              {o.user.phone && (
                                <div>
                                  <span className="text-xs text-gray-400 block">Telefone / WhatsApp</span>
                                  <span className="font-semibold text-gray-900">{o.user.phone}</span>
                                </div>
                              )}
                              {o.shippingAddress && (
                                <div className="col-span-2">
                                  <span className="text-xs text-gray-400 block">Endereço de entrega</span>
                                  <span className="font-semibold text-gray-900">
                                    {o.shippingAddress.street}, {o.shippingAddress.number}
                                    {o.shippingAddress.complement ? `, ${o.shippingAddress.complement}` : ''}
                                    {o.shippingAddress.neighborhood ? ` — ${o.shippingAddress.neighborhood}` : ''}
                                  </span>
                                  <br />
                                  <span className="text-gray-700">{o.shippingAddress.city}/{o.shippingAddress.state} · CEP {o.shippingAddress.zip}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <TrackingField orderId={o.id} initialCode={o.trackingCode || ''} />
                          <div className="mt-3 pt-3 border-t flex items-start gap-4 flex-wrap">
                            <button
                              onClick={e => { e.stopPropagation(); resendEmail(o.id); }}
                              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary-600 transition-colors"
                            >
                              <Mail size={13} /> Reenviar e-mail de confirmação
                            </button>
                          </div>
                          <NoteField orderId={o.id} initialNote={o.adminNote || ''} />
                          <StatusHistory orderId={o.id} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y">
            {filtered.map(o => (
              <div key={o.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2" onClick={() => setExpanded(e => e === o.id ? null : o.id)}>
                  <div>
                    <p className="font-mono text-xs font-bold">#{o.orderNumber ?? o.id.slice(0, 8).toUpperCase()}</p>
                    <p className="font-medium text-sm">{o.user.name}</p>
                    <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black">R$ {o.total.toFixed(2).replace('.', ',')}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status]}`}>
                      {STATUS_LABEL[o.status]}
                    </span>
                  </div>
                </div>

                {expanded === o.id && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">📦 Itens para separação</p>
                    {(o.items || []).map((item, idx) => (
                      <div key={item.id} className="bg-gray-50 rounded-xl border border-gray-200 px-3 py-2.5 flex gap-3 items-start">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-200 shrink-0 border border-gray-200">
                          {item.product?.images?.[0] ? (
                            <Image src={item.product.images[0]} alt={item.product?.name || ''} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">👕</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-gray-900">{idx + 1}. {item.product?.name || '—'}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {item.variant?.size && (
                              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-md">Tamanho: {item.variant.size}</span>
                            )}
                            {item.variant?.color && (
                              <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-md">Cor: {item.variant.color}</span>
                            )}
                            <span className="bg-orange-100 text-orange-700 text-xs font-black px-2.5 py-0.5 rounded-md">Qtd: {item.quantity}</span>
                            {item.personalization?.name && (
                              <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 rounded-md">✏️ Nome: {item.personalization.name}</span>
                            )}
                            {item.personalization?.number && (
                              <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 rounded-md">🔢 Número: {item.personalization.number}</span>
                            )}
                            <span className="text-xs text-gray-500 self-center">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="bg-white rounded-xl border border-gray-200 px-3 py-2.5 space-y-1 text-xs">
                      <p className="font-bold text-gray-500 uppercase tracking-wide mb-1">👤 Dados do Cliente</p>
                      <p><span className="text-gray-400">Nome: </span><span className="font-semibold text-gray-900">{o.user.name}</span></p>
                      <p><span className="text-gray-400">E-mail: </span><span className="font-semibold text-gray-900">{o.user.email}</span></p>
                      {o.user.phone && (
                        <p><span className="text-gray-400">Telefone: </span><span className="font-semibold text-gray-900">{o.user.phone}</span></p>
                      )}
                      {o.shippingAddress && (
                        <p>
                          <span className="text-gray-400">📍 Endereço: </span>
                          <span className="font-semibold text-gray-900">
                            {o.shippingAddress.street}, {o.shippingAddress.number}
                            {o.shippingAddress.complement ? `, ${o.shippingAddress.complement}` : ''}{o.shippingAddress.neighborhood ? ` — ${o.shippingAddress.neighborhood}` : ''}, {o.shippingAddress.city}/{o.shippingAddress.state} · CEP {o.shippingAddress.zip}
                          </span>
                        </p>
                      )}
                    </div>
                    <TrackingField orderId={o.id} initialCode={o.trackingCode || ''} />
                    <NoteField orderId={o.id} initialNote={o.adminNote || ''} />
                    <StatusHistory orderId={o.id} />
                  </div>
                )}

                <select
                  className={`w-full border-2 ${STATUS_BORDER[o.status]} rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none`}
                  value={o.status}
                  onChange={e => handleStatusChange(o, e.target.value)}
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
                {o.trackingCode && (
                  <p className="text-xs text-gray-500">Rastreio: <span className="font-mono font-bold">{o.trackingCode}</span></p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-gray-500">
            Página {page} de {totalPages} — {totalOrders} pedidos no total
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={15} /> Anterior
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 text-sm rounded-lg font-semibold transition-colors ${p === page ? 'bg-primary-500 text-white' : 'border border-gray-300 hover:bg-gray-50 text-gray-600'}`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Próxima <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPedidos() {
  return (
    <Suspense fallback={<div className="text-gray-400">Carregando...</div>}>
      <AdminPedidosInner />
    </Suspense>
  );
}
