'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import ImageUpload from '@/components/ImageUpload';

const EMPTY = { name: '', description: '', price: '', comparePrice: '', stock: '', categoryId: '', images: [] };

export default function AdminProdutos() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    load();
    api.get('/categories').then(r => setCategories(r.data));
  }, []);

  async function load() {
    const { data } = await api.get('/products', { params: { limit: 100 } });
    setProducts(data.products);
  }

  async function submit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
    };
    try {
      if (editing) {
        await api.put(`/products/${editing}`, payload);
        toast.success('Produto atualizado');
      } else {
        await api.post('/products', payload);
        toast.success('Produto criado');
      }
      setForm(EMPTY); setEditing(null); setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro');
    }
  }

  async function remove(id) {
    if (!confirm('Desativar produto?')) return;
    await api.delete(`/products/${id}`);
    toast.success('Produto desativado');
    load();
  }

  function edit(p) {
    setForm({ name: p.name, description: p.description, price: p.price, comparePrice: p.comparePrice || '', stock: p.stock, categoryId: p.categoryId, images: p.images || [] });
    setEditing(p.id); setShowForm(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Produtos</h1>
        <button onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(!showForm); }} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Novo produto
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <h2 className="font-black mb-4">{editing ? 'Editar' : 'Novo'} produto</h2>
          <form onSubmit={submit} className="grid grid-cols-2 gap-4">
            {[
              ['name', 'Nome', 'col-span-2'],
              ['description', 'Descrição', 'col-span-2'],
              ['price', 'Preço (R$)'],
              ['comparePrice', 'Preço original (opcional)'],
              ['stock', 'Estoque'],
            ].map(([key, label, cls]) => (
              <div key={key} className={cls || ''}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                {key === 'description' ? (
                  <textarea className="input" rows={3} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required />
                ) : (
                  <input className="input" type={['price','comparePrice','stock'].includes(key) ? 'number' : 'text'} step="0.01" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required={key !== 'comparePrice'} />
                )}
              </div>
            ))}
            <div className="col-span-2">
              <ImageUpload images={form.images} onChange={imgs => setForm({ ...form, images: imgs })} maxImages={6} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categoria</label>
              <select className="input" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} required>
                <option value="">Selecione...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">{editing ? 'Salvar' : 'Criar produto'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['', 'Produto', 'Categoria', 'Preço', 'Estoque', 'Ações'].map(h => (
              <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {p.images?.[0] ? (
                      <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">📦</div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium max-w-xs truncate">{p.name}</td>
                <td className="px-4 py-3 text-gray-500">{p.category?.name}</td>
                <td className="px-4 py-3 font-bold text-primary-500">R$ {p.price.toFixed(2).replace('.', ',')}</td>
                <td className="px-4 py-3">
                  <span className={`font-semibold ${p.stock === 0 ? 'text-red-500' : p.stock < 5 ? 'text-orange-500' : 'text-green-600'}`}>
                    {p.stock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => edit(p)} className="text-blue-500 hover:text-blue-700"><Edit size={16} /></button>
                    <button onClick={() => remove(p.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
