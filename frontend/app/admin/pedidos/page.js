'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const STATUS_OPTIONS = ['PENDING','PAID','PROCESSING','SHIPPED','DELIVERED','CANCELLED'];
const STATUS_LABEL = { PENDING: 'Pendente', PAID: 'Pago', PROCESSING: 'Processando', SHIPPED: 'Enviado', DELIVERED: 'Entregue', CANCELLED: 'Cancelado' };
const STATUS_COLOR = { PENDING: 'bg-yellow-100 text-yellow-700', PAID: 'bg-blue-100 text-blue-700', PROCESSING: 'bg-purple-100 text-purple-700', SHIPPED: 'bg-orange-100 text-orange-700', DELIVERED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700' };

export default function AdminPedidos() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { load(); }, [filter]);

  async function load() {
    const { data } = await api.get('/orders/admin/all', { params: { status: filter || undefined, limit: 50 } });
    setOrders(data.orders);
  }

  async function updateStatus(id, status, trackingCode) {
    try {
      await api.put(`/orders/admin/${id}/status`, { status, trackingCode });
      toast.success('Pedido atualizado');
      load();
    } catch { toast.error('Erro ao atualizar'); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Pedidos</h1>
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">Todos</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Pedido', 'Cliente', 'Total', 'Status', 'Data', 'Ações'].map(h => (
              <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y">
            {orders.map(o => (
              <>
                <tr key={o.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                  <td className="px-4 py-3 font-mono text-xs">#{o.id.slice(0,8).toUpperCase()}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.user.name}</p>
                    <p className="text-gray-400 text-xs">{o.user.email}</p>
                  </td>
                  <td className="px-4 py-3 font-bold">R$ {o.total.toFixed(2).replace('.', ',')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLOR[o.status]}`}>
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3">
                    <select
                      className="border border-gray-300 rounded px-2 py-1 text-xs"
                      value={o.status}
                      onChange={e => { e.stopPropagation(); updateStatus(o.id, e.target.value); }}
                      onClick={e => e.stopPropagation()}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                  </td>
                </tr>
                {expanded === o.id && (
                  <tr>
                    <td colSpan={6} className="px-4 pb-4 bg-gray-50">
                      <div className="space-y-1 mt-2">
                        {o.items.map(item => (
                          <p key={item.id} className="text-sm text-gray-600">• {item.quantity}× produto (R$ {item.price.toFixed(2)})</p>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
