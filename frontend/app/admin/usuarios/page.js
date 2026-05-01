'use client';
import { useEffect, useState } from 'react';
import { Search, X, ShoppingBag, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const STATUS_LABEL = { PENDING: 'Pendente', PAID: 'Pago', PROCESSING: 'Processando', SHIPPED: 'Enviado', DELIVERED: 'Entregue', CANCELLED: 'Cancelado' };
const STATUS_COLOR = { PENDING: 'bg-yellow-100 text-yellow-700', PAID: 'bg-blue-100 text-blue-700', PROCESSING: 'bg-purple-100 text-purple-700', SHIPPED: 'bg-orange-100 text-orange-700', DELIVERED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700' };

function UserOrders({ userId }) {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    api.get('/orders/admin/all', { params: { userId, limit: 50 } })
      .then(r => setOrders(r.data.orders))
      .catch(() => setOrders([]));
  }, [userId]);

  if (orders === null) return <p className="text-xs text-gray-400 py-2 animate-pulse">Carregando pedidos...</p>;
  if (orders.length === 0) return <p className="text-xs text-gray-400 py-2">Nenhum pedido encontrado.</p>;

  return (
    <div className="space-y-1.5">
      {orders.map(o => (
        <div key={o.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-gray-700">#{o.orderNumber ?? o.id.slice(0, 8).toUpperCase()}</span>
            <span className="text-gray-400">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</span>
            <span className={`px-2 py-0.5 rounded-full font-semibold ${STATUS_COLOR[o.status]}`}>{STATUS_LABEL[o.status]}</span>
          </div>
          <span className="font-bold text-gray-800">R$ {o.total.toFixed(2).replace('.', ',')}</span>
        </div>
      ))}
      <p className="text-xs text-gray-400 pt-1">
        {orders.length} pedido{orders.length !== 1 ? 's' : ''} · Total: R$ {orders.reduce((s, o) => s + o.total, 0).toFixed(2).replace('.', ',')}
      </p>
    </div>
  );
}

export default function AdminUsuarios() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { load(); }, [query]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { limit: 100, search: query } });
      setUsers(data.users);
      setTotal(data.total);
    } catch {
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }

  async function toggleRole(id, currentRole) {
    const newRole = currentRole === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';
    if (!confirm(`Alterar para ${newRole}?`)) return;
    try {
      await api.put(`/admin/users/${id}/role`, { role: newRole });
      toast.success('Função atualizada');
      load();
    } catch { toast.error('Erro ao atualizar'); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black">Usuários ({total})</h1>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="border border-gray-300 rounded-lg pl-8 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-56"
            placeholder="Buscar nome ou e-mail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-400 animate-pulse">Carregando...</div>
      ) : users.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          {search ? `Nenhum usuário encontrado para "${search}"` : 'Nenhum usuário cadastrado'}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>{['', 'Nome', 'E-mail', 'Telefone', 'Pedidos', 'Função', 'Cadastro', 'Ações'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y">
                {users.map(u => (
                  <>
                    <tr
                      key={u.id}
                      className={`hover:bg-gray-50 cursor-pointer ${expanded === u.id ? 'bg-gray-50' : ''}`}
                      onClick={() => setExpanded(expanded === u.id ? null : u.id)}
                    >
                      <td className="px-3 py-3 text-gray-400">
                        {expanded === u.id ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{u.name}</td>
                      <td className="px-4 py-3 text-gray-500">{u.email}</td>
                      <td className="px-4 py-3 text-gray-500">{u.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-gray-600">
                          <ShoppingBag size={13} className="text-gray-400" />
                          {u._count?.orders ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.role === 'ADMIN' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => toggleRole(u.id, u.role)}
                          className="text-xs text-blue-500 hover:underline whitespace-nowrap"
                        >
                          {u.role === 'ADMIN' ? 'Remover admin' : 'Tornar admin'}
                        </button>
                      </td>
                    </tr>
                    {expanded === u.id && (
                      <tr key={`${u.id}-orders`}>
                        <td colSpan={8} className="px-6 py-4 bg-gray-50 border-b">
                          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Pedidos de {u.name.split(' ')[0]}</p>
                          <UserOrders userId={u.id} />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
