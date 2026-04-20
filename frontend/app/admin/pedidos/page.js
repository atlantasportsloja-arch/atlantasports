'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Truck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const STATUS_OPTIONS = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const STATUS_LABEL = { PENDING: 'Pendente', PAID: 'Pago', PROCESSING: 'Processando', SHIPPED: 'Enviado', DELIVERED: 'Entregue', CANCELLED: 'Cancelado' };
const STATUS_COLOR = { PENDING: 'bg-yellow-100 text-yellow-700', PAID: 'bg-blue-100 text-blue-700', PROCESSING: 'bg-purple-100 text-purple-700', SHIPPED: 'bg-orange-100 text-orange-700', DELIVERED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700' };

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
  const [expanded, setExpanded] = useState(null);
  const [trackingModal, setTrackingModal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [filter]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/orders/admin/all', { params: { status: filter || undefined, limit: 50 } });
      setOrders(data.orders);
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

  function handleStatusChange(order, newStatus) {
    if (newStatus === 'SHIPPED') {
      setTrackingModal(order);
      return;
    }
    updateStatus(order.id, newStatus);
  }

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
        <div className="flex items-center gap-3">
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="">Todos os status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <span className="text-sm text-gray-400">{orders.length} pedidos</span>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-400 animate-pulse">Carregando...</div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">Nenhum pedido encontrado</div>
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
                {orders.map(o => (
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
                          className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                          value={o.status}
                          onChange={e => handleStatusChange(o, e.target.value)}
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                        </select>
                      </td>
                    </tr>
                    {expanded === o.id && (
                      <tr>
                        <td colSpan={6} className="bg-gray-50 px-6 py-4">
                          <p className="text-xs font-semibold text-gray-500 mb-2">ITENS DO PEDIDO</p>
                          <div className="space-y-1">
                            {o.items.map(item => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-gray-700">{item.product?.name || '—'} × {item.quantity}</span>
                                <span className="font-semibold">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                              </div>
                            ))}
                          </div>
                          {o.shippingAddress && (
                            <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                              <span className="font-semibold">Entrega: </span>
                              {o.shippingAddress.street}, {o.shippingAddress.number} — {o.shippingAddress.city}/{o.shippingAddress.state} · CEP {o.shippingAddress.zip}
                            </div>
                          )}
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
            {orders.map(o => (
              <div key={o.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
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
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
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
