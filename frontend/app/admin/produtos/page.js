'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Plus, Edit, Trash2, Search, X, Loader2, AlertTriangle, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import ImageUpload from '@/components/ImageUpload';

const EMPTY = { name: '', description: '', price: '', comparePrice: '', costPrice: '', stock: '', availability: 'pronta_entrega', keywords: '', active: true, categoryIds: [], images: [] };
const EMPTY_VARIANT = { size: '', color: '', stock: '', price: '' };

function DeleteConfirm({ name, onConfirm, onCancel }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
      <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
      <span className="text-red-700 text-xs">Desativar "{name}"?</span>
      <button onClick={onConfirm} className="bg-red-500 text-white text-xs px-2 py-0.5 rounded font-semibold hover:bg-red-600">Sim</button>
      <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
    </div>
  );
}

export default function AdminProdutos() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [variantForm, setVariantForm] = useState(EMPTY_VARIANT);
  const [savingVariant, setSavingVariant] = useState(false);
  const [editingVariants, setEditingVariants] = useState([]);

  useEffect(() => {
    load();
    api.get('/categories').then(r => setCategories(r.data));
  }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/products/admin/all');
      setProducts(data.products);
    } finally {
      setLoading(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
      costPrice: form.costPrice ? Number(form.costPrice) : null,
      images: form.images,
      categoryIds: form.categoryIds,
      availability: form.availability,
      keywords: form.keywords,
      active: form.active,
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
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function duplicate(p) {
    try {
      await api.post(`/products/${p.id}/duplicate`);
      toast.success(`"Cópia de ${p.name}" criada (inativa)`);
      load();
    } catch {
      toast.error('Erro ao duplicar');
    }
  }

  async function remove(id) {
    try {
      await api.delete(`/products/${id}`);
      toast.success('Produto desativado');
      setConfirmDelete(null);
      load();
    } catch {
      toast.error('Erro ao desativar');
    }
  }

  function edit(p) {
    setForm({ name: p.name, description: p.description, price: p.price, comparePrice: p.comparePrice || '', costPrice: p.costPrice || '', stock: p.stock, availability: p.availability || 'pronta_entrega', keywords: p.keywords || '', active: p.active !== false, categoryIds: (p.categories || []).map(c => c.id), images: p.images || [] });
    setEditing(p.id);
    setEditingVariants(p.variants || []);
    setVariantForm(EMPTY_VARIANT);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function addVariant(e) {
    e.preventDefault();
    if (!variantForm.size && !variantForm.color) { toast.error('Informe tamanho ou cor'); return; }
    setSavingVariant(true);
    try {
      const { data } = await api.post(`/products/${editing}/variants`, {
        size: variantForm.size || null,
        color: variantForm.color || null,
        stock: Number(variantForm.stock) || 0,
        price: variantForm.price ? Number(variantForm.price) : null,
      });
      setEditingVariants(v => [...v, data]);
      setVariantForm(EMPTY_VARIANT);
      toast.success('Variante adicionada');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao adicionar variante');
    } finally {
      setSavingVariant(false);
    }
  }

  async function removeVariant(variantId) {
    try {
      await api.delete(`/products/${editing}/variants/${variantId}`);
      setEditingVariants(v => v.filter(x => x.id !== variantId));
      toast.success('Variante removida');
    } catch {
      toast.error('Erro ao remover variante');
    }
  }

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black">Produtos</h1>
        <button
          onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(!showForm); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Novo produto
        </button>
      </div>

      {showForm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black">{editing ? 'Editar produto' : 'Novo produto'}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Nome</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Nome do produto" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required placeholder="Descreva o produto..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Preço (R$)</label>
              <input className="input" type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required placeholder="99.90" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Preço original <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input className="input" type="number" step="0.01" min="0" value={form.comparePrice} onChange={e => setForm({ ...form, comparePrice: e.target.value })} placeholder="129.90" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Preço de custo (R$)
                <span className="ml-2 text-xs font-normal text-orange-500 bg-orange-50 px-2 py-0.5 rounded">🔒 Só admin</span>
              </label>
              <input className="input border-orange-200 focus:ring-orange-400" type="number" step="0.01" min="0" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estoque</label>
              <input className="input" type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required placeholder="0" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Disponibilidade</label>
              <div className="flex gap-3">
                {[{ value: 'pronta_entrega', label: '✅ Pronta Entrega' }, { value: 'encomenda', label: '🕐 Encomenda' }].map(op => (
                  <label key={op.value} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer text-sm font-medium transition-colors ${form.availability === op.value ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="availability" value={op.value} checked={form.availability === op.value} onChange={() => setForm({ ...form, availability: op.value })} className="sr-only" />
                    {op.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <label className={`inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 cursor-pointer text-sm font-medium transition-colors ${form.active ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}>
                <div className={`w-10 h-5 rounded-full transition-colors relative ${form.active ? 'bg-green-500' : 'bg-gray-300'}`} onClick={() => setForm({ ...form, active: !form.active })}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                {form.active ? 'Produto ativo (visível na loja)' : 'Produto inativo (oculto)'}
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Categorias <span className="text-gray-400 font-normal text-xs">(selecione quantas quiser)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {categories.map(c => {
                  const checked = form.categoryIds.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors text-sm font-medium ${
                        checked ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => {
                          const ids = checked
                            ? form.categoryIds.filter(id => id !== c.id)
                            : [...form.categoryIds, c.id];
                          setForm({ ...form, categoryIds: ids });
                        }}
                      />
                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${checked ? 'border-primary-500 bg-primary-500' : 'border-gray-300'}`}>
                        {checked && <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </span>
                      {c.name}
                    </label>
                  );
                })}
              </div>
              {form.categoryIds.length === 0 && (
                <p className="text-xs text-orange-500 mt-1">Selecione ao menos uma categoria</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Palavras-chave <span className="text-gray-400 font-normal text-xs">(para busca)</span></label>
              <input className="input" value={form.keywords} onChange={e => setForm({ ...form, keywords: e.target.value })} placeholder="Ex: camisa flamengo vermelha time futebol" />
              <p className="text-xs text-gray-400 mt-1">Separe por espaço. Ajudam o cliente a encontrar o produto.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Imagens</label>
              <ImageUpload images={form.images} onChange={imgs => setForm({ ...form, images: imgs })} maxImages={6} />
            </div>

            {editing && (
              <div className="md:col-span-2 border border-gray-200 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-sm">Variações (tamanho / cor)</h3>

                {editingVariants.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editingVariants.map(v => (
                      <div key={v.id} className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-3 py-1.5 text-sm">
                        {v.size && <span className="font-semibold">{v.size}</span>}
                        {v.size && v.color && <span className="text-gray-400">/</span>}
                        {v.color && <span className="font-semibold">{v.color}</span>}
                        <span className="text-gray-500 text-xs">· {v.stock} un.</span>
                        {v.price && <span className="text-primary-500 text-xs font-semibold">· R$ {v.price.toFixed(2).replace('.', ',')}</span>}
                        <button type="button" onClick={() => removeVariant(v.id)} className="text-red-400 hover:text-red-600 ml-1">
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={addVariant} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input className="input text-sm py-2" placeholder="Tamanho (ex: M)" value={variantForm.size} onChange={e => setVariantForm({ ...variantForm, size: e.target.value })} />
                  <input className="input text-sm py-2" placeholder="Cor (ex: Vermelho)" value={variantForm.color} onChange={e => setVariantForm({ ...variantForm, color: e.target.value })} />
                  <input className="input text-sm py-2" type="number" min="0" placeholder="Estoque" value={variantForm.stock} onChange={e => setVariantForm({ ...variantForm, stock: e.target.value })} />
                  <input className="input text-sm py-2" type="number" step="0.01" min="0" placeholder="Preço (opcional)" value={variantForm.price} onChange={e => setVariantForm({ ...variantForm, price: e.target.value })} />
                  <button type="submit" disabled={savingVariant} className="sm:col-span-4 btn-outline text-sm py-2 flex items-center justify-center gap-2">
                    {savingVariant ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Adicionar variação
                  </button>
                </form>
              </div>
            )}

            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editing ? 'Salvar alterações' : 'Criar produto'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Busca */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9 max-w-sm"
          placeholder="Buscar por nome ou categoria..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-400 animate-pulse">Carregando produtos...</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['', 'Produto', 'Categorias', 'Disponib.', 'Status', 'Preço', 'Estoque', 'Ações'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(p => (
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
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{(p.categories || []).map(c => c.name).join(', ') || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.availability === 'encomenda' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {p.availability === 'encomenda' ? '🕐 Encomenda' : '✅ Pronta'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-primary-500 whitespace-nowrap">R$ {p.price.toFixed(2).replace('.', ',')}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${p.stock === 0 ? 'text-red-500' : p.stock <= 5 ? 'text-orange-500' : 'text-green-600'}`}>
                        {p.stock}
                        {p.stock <= 5 && p.stock > 0 && <span className="text-xs ml-1">⚠️</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {confirmDelete === p.id ? (
                        <DeleteConfirm
                          name={p.name}
                          onConfirm={() => remove(p.id)}
                          onCancel={() => setConfirmDelete(null)}
                        />
                      ) : (
                        <div className="flex gap-1">
                          <button onClick={() => edit(p)} title="Editar" className="text-blue-500 hover:text-blue-700 p-1.5 rounded hover:bg-blue-50"><Edit size={15} /></button>
                          <button onClick={() => duplicate(p)} title="Duplicar" className="text-gray-400 hover:text-gray-600 p-1.5 rounded hover:bg-gray-100"><Copy size={15} /></button>
                          <button onClick={() => setConfirmDelete(p.id)} title="Desativar" className="text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50"><Trash2 size={15} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                      {search ? `Nenhum produto encontrado para "${search}"` : 'Nenhum produto cadastrado'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t text-xs text-gray-400 bg-gray-50">
            {filtered.length} de {products.length} produtos
          </div>
        </div>
      )}
    </div>
  );
}
