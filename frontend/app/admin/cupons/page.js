'use client';
import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const EMPTY = { code: '', discount: '', type: 'percentage', minValue: '0', maxUses: '', expiresAt: '' };

export default function AdminCupons() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await api.get('/coupons');
    setCoupons(data);
  }

  async function submit(e) {
    e.preventDefault();
    try {
      await api.post('/coupons', {
        ...form,
        discount: Number(form.discount),
        minValue: Number(form.minValue),
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
        code: form.code.toUpperCase(),
      });
      toast.success('Cupom criado');
      setForm(EMPTY); setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro');
    }
  }

  async function remove(id) {
    if (!confirm('Deletar cupom?')) return;
    await api.delete(`/coupons/${id}`);
    toast.success('Cupom removido');
    load();
  }

  async function toggle(id, active) {
    await api.put(`/coupons/${id}`, { active: !active });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Cupons</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Novo cupom
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <h2 className="font-black mb-4">Novo cupom</h2>
          <form onSubmit={submit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código</label>
              <input className="input uppercase" placeholder="PROMO10" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="percentage">Porcentagem (%)</option>
                <option value="fixed">Valor fixo (R$)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Desconto</label>
              <input className="input" type="number" step="0.01" placeholder={form.type === 'percentage' ? '10' : '25'} value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Valor mínimo (R$)</label>
              <input className="input" type="number" step="0.01" value={form.minValue} onChange={e => setForm({ ...form, minValue: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Máximo de usos (opcional)</label>
              <input className="input" type="number" placeholder="100" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expira em (opcional)</label>
              <input className="input" type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">Criar cupom</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Código', 'Desconto', 'Tipo', 'Valor mín.', 'Usos', 'Expira', 'Status', 'Ações'].map(h => (
              <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y">
            {coupons.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-bold">{c.code}</td>
                <td className="px-4 py-3 font-semibold text-primary-500">
                  {c.type === 'percentage' ? `${c.discount}%` : `R$ ${c.discount.toFixed(2)}`}
                </td>
                <td className="px-4 py-3 text-gray-500">{c.type === 'percentage' ? 'Porcentagem' : 'Fixo'}</td>
                <td className="px-4 py-3 text-gray-500">R$ {c.minValue.toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-500">{c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('pt-BR') : '—'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggle(c.id, c.active)} className={`text-xs font-bold px-2 py-1 rounded-full ${c.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}>
                    {c.active ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => remove(c.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
