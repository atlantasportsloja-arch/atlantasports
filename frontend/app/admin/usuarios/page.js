'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function AdminUsuarios() {
  const [users, setUsers] = useState([]);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await api.get('/admin/users');
    setUsers(data.users);
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
      <h1 className="text-2xl font-black">Usuários ({users.length})</h1>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Nome', 'Email', 'Telefone', 'Função', 'Cadastro', 'Ações'].map(h => (
              <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3 text-gray-500">{u.phone || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.role === 'ADMIN' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleRole(u.id, u.role)}
                    className="text-xs text-blue-500 hover:underline"
                  >
                    {u.role === 'ADMIN' ? 'Remover admin' : 'Tornar admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
