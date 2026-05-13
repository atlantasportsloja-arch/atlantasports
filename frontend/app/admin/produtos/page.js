'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Plus, Edit, Trash2, Search, X, Loader2, AlertTriangle, Copy, EyeOff, Eye, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import ImageUpload from '@/components/ImageUpload';
import { sortVariants } from '@/lib/sortSizes';

const EMPTY = { name: '', description: '', price: '', comparePrice: '', costPrice: '', availability: 'pronta_entrega', keywords: '', active: true, categoryIds: [], images: [], allowPersonalization: false, personalizationNameEnabled: false, personalizationNameMaxLength: 10, personalizationNamePrice: '', personalizationNumberEnabled: false, personalizationNumberMaxDigits: 3, personalizationNumberPrice: '' };
const EMPTY_VARIANT = { size: '', stock: '' };

function DeleteConfirm({ name, onConfirm, onCancel }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
      <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
      <span className="text-red-700 text-xs">Excluir "{name}"?</span>
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
  const [variantSize, setVariantSize] = useState('');
  const [variantStock, setVariantStock] = useState('');
  const [savingVariant, setSavingVariant] = useState(false);
  const [editingVariants, setEditingVariants] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    api.post('/products/admin/migrate-stock').catch(() => {});
    load();
    api.get('/categories').then(r => setCategories(r.data));
  }, []);

  async function load() {
    setLoading(true);
    setSelected(new Set());
    try {
      const { data } = await api.get('/products/admin/all');
      setProducts(data.products);
    } finally {
      setLoading(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (variantSize.trim()) {
      addNewVariantToLocal();
    }
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      stock: 0,
      comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
      costPrice: form.costPrice ? Number(form.costPrice) : null,
      images: form.images,
      categoryIds: form.categoryIds,
      availability: form.availability,
      keywords: form.keywords,
      active: form.active,
      allowPersonalization: form.allowPersonalization,
      personalizationNameEnabled: form.personalizationNameEnabled,
      personalizationNameMaxLength: Number(form.personalizationNameMaxLength) || 10,
      personalizationNamePrice: form.personalizationNamePrice ? Number(form.personalizationNamePrice) : 0,
      personalizationNumberEnabled: form.personalizationNumberEnabled,
      personalizationNumberMaxDigits: Number(form.personalizationNumberMaxDigits) || 3,
      personalizationNumberPrice: form.personalizationNumberPrice ? Number(form.personalizationNumberPrice) : 0,
    };
    try {
      if (editing) {
        await api.put(`/products/${editing}`, payload);
        toast.success('Produto atualizado');
      } else {
        const { data: created } = await api.post('/products', payload);
        await Promise.all(
          editingVariants.map(v =>
            api.post(`/products/${created.id}/variants`, { size: v.size, stock: v.stock })
          )
        );
        toast.success('Produto criado');
      }
      api.clearCache('/products');
      setForm(EMPTY); setEditing(null); setShowForm(false); setEditingVariants([]);
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
      window.location.reload();
    } catch {
      toast.error('Erro ao duplicar');
    }
  }

  async function remove(id) {
    try {
      await api.delete(`/products/${id}`);
      toast.success('Produto excluído');
      setConfirmDelete(null);
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao excluir');
      setConfirmDelete(null);
    }
  }

  async function toggleActive(p) {
    try {
      await api.patch(`/products/${p.id}/toggle`);
      toast.success(p.active ? 'Produto desativado' : 'Produto ativado');
      window.location.reload();
    } catch {
      toast.error('Erro ao atualizar produto');
    }
  }

  function edit(p) {
    setForm({ name: p.name, description: p.description, price: p.price, comparePrice: p.comparePrice || '', costPrice: p.costPrice || '', availability: p.availability || 'pronta_entrega', keywords: p.keywords || '', active: p.active !== false, categoryIds: (p.categories || []).map(c => c.id), images: p.images || [], allowPersonalization: p.allowPersonalization || false, personalizationNameEnabled: p.personalizationNameEnabled || false, personalizationNameMaxLength: p.personalizationNameMaxLength || 10, personalizationNamePrice: p.personalizationNamePrice || '', personalizationNumberEnabled: p.personalizationNumberEnabled || false, personalizationNumberMaxDigits: p.personalizationNumberMaxDigits || 3, personalizationNumberPrice: p.personalizationNumberPrice || '' });
    setEditing(p.id);
    setEditingVariants(p.variants || []);
    setVariantSize('');
    setVariantStock('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function addNewVariantToLocal() {
    if (!variantSize.trim()) return;
    const size = variantSize.trim().toUpperCase();
    const stock = Number(variantStock) || 0;
    const already = editingVariants.find(v => (v.size || '').toUpperCase() === size);
    if (already) { toast.error('Tamanho já adicionado'); return; }
    setEditingVariants(v => [...v, { id: `local-${size}-${Date.now()}`, size, stock }]);
    setVariantSize('');
    setVariantStock('');
  }

  async function addVariant() {
    if (!variantSize.trim()) { toast.error('Informe o tamanho'); return; }
    if (!editing) {
      addNewVariantToLocal();
      return;
    }
    setSavingVariant(true);
    try {
      const { data } = await api.post(`/products/${editing}/variants`, {
        size: variantSize.trim().toUpperCase(),
        stock: Number(variantStock) || 0,
      });
      setEditingVariants(v => [...v, data]);
      setProducts(ps => ps.map(p => p.id === editing ? { ...p, variants: [...(p.variants || []), data] } : p));
      setVariantSize('');
      setVariantStock('');
      toast.success('Tamanho adicionado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao adicionar tamanho');
    } finally {
      setSavingVariant(false);
    }
  }

  async function updateVariantField(variantId, field, rawValue) {
    const value = rawValue === '' ? (field === 'price' ? null : 0) : Number(rawValue);
    if (field !== 'price' && (isNaN(value) || value < 0)) return;
    setEditingVariants(v => v.map(x => x.id === variantId ? { ...x, [field]: value } : x));
    if (variantId.startsWith('local-')) return;
    try {
      await api.put(`/products/${editing}/variants/${variantId}`, { [field]: value });
      setProducts(ps => ps.map(p => p.id === editing
        ? { ...p, variants: (p.variants || []).map(v => v.id === variantId ? { ...v, [field]: value } : v) }
        : p
      ));
    } catch {
      toast.error('Erro ao atualizar variante');
    }
  }

  async function removeVariant(variantId) {
    if (variantId.startsWith('local-')) {
      setEditingVariants(v => v.filter(x => x.id !== variantId));
      return;
    }
    try {
      await api.delete(`/products/${editing}/variants/${variantId}`);
      setEditingVariants(v => v.filter(x => x.id !== variantId));
      setProducts(ps => ps.map(p => p.id === editing ? { ...p, variants: (p.variants || []).filter(v => v.id !== variantId) } : p));
      toast.success('Tamanho removido');
    } catch {
      toast.error('Erro ao remover tamanho');
    }
  }

  const filtered = products.filter(p =>
    (!search || p.name.toLowerCase().includes(search.toLowerCase())) &&
    (!categoryFilter || (p.categories || []).some(c => c.id === categoryFilter))
  );

  const allSelected = filtered.length > 0 && filtered.every(p => selected.has(p.id));
  const someSelected = filtered.some(p => selected.has(p.id));

  function toggleSelect(id) {
    setSelected(s => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(s => {
        const next = new Set(s);
        filtered.forEach(p => next.delete(p.id));
        return next;
      });
    } else {
      setSelected(s => {
        const next = new Set(s);
        filtered.forEach(p => next.add(p.id));
        return next;
      });
    }
  }

  async function bulkAction(action) {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (action === 'delete' && !confirm(`Excluir ${ids.length} produto(s)? Essa ação não pode ser desfeita.`)) return;
    setBulkLoading(true);
    try {
      await api.post('/products/admin/bulk', { ids, action });
      const labels = { activate: 'ativados', deactivate: 'desativados', delete: 'excluídos' };
      toast.success(`${ids.length} produto(s) ${labels[action]}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro na ação em massa');
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black">Produtos</h1>
        <button
          onClick={() => { setForm(EMPTY); setEditing(null); setEditingVariants([]); setVariantSize(''); setVariantStock(''); setShowForm(!showForm); }}
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
              <textarea className="input" rows={5} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required placeholder="Descreva o produto... (Enter para nova linha)" />
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
            {/* VARIAÇÕES */}
            <div className="md:col-span-2 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-sm text-gray-700">Variantes por tamanho</h3>

              {editingVariants.length > 0 && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {sortVariants(editingVariants).map(v => (
                      <div key={v.id} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm shadow-sm">
                        {v.size && <span className="font-bold text-gray-800">{v.size}</span>}
                        <span className="text-gray-300">|</span>
                        <input
                          type="number"
                          min="0"
                          title="Estoque"
                          className="w-12 text-center text-xs font-semibold text-gray-700 border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-400 bg-gray-50"
                          value={v.stock}
                          onChange={e => setEditingVariants(vs => vs.map(x => x.id === v.id ? { ...x, stock: e.target.value === '' ? '' : Number(e.target.value) } : x))}
                          onBlur={e => updateVariantField(v.id, 'stock', e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } }}
                        />
                        <span className="text-gray-400 text-xs">un.</span>
                        <span className="text-gray-200">|</span>
                        <span className="text-gray-400 text-xs">R$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          title="Preço específico desta variante (deixe vazio para usar o preço do produto)"
                          className="w-16 text-center text-xs font-semibold text-gray-700 border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-400 bg-gray-50"
                          value={v.price ?? ''}
                          placeholder="padrão"
                          onChange={e => setEditingVariants(vs => vs.map(x => x.id === v.id ? { ...x, price: e.target.value } : x))}
                          onBlur={e => updateVariantField(v.id, 'price', e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } }}
                        />
                        <button type="button" onClick={() => removeVariant(v.id)} className="text-red-400 hover:text-red-600 ml-1">
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-gray-500">
                    Estoque total: <span className="text-primary-600">{editingVariants.reduce((s, v) => s + (v.stock || 0), 0)} unidades</span>
                  </p>
                </div>
              )}

              {editingVariants.length === 0 && (
                <p className="text-xs text-gray-400">Nenhuma variante adicionada ainda.</p>
              )}

              <div className="flex gap-2 items-center flex-wrap">
                <input
                  type="text"
                  className="input text-sm py-2 w-28"
                  placeholder="Tamanho (P, M…)"
                  value={variantSize}
                  onChange={e => setVariantSize(e.target.value.toUpperCase())}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addVariant(); } }}
                />
                <input
                  type="number"
                  className="input text-sm py-2 w-24"
                  placeholder="Estoque"
                  min="0"
                  value={variantStock}
                  onChange={e => setVariantStock(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addVariant(); } }}
                />
                <button
                  type="button"
                  onClick={addVariant}
                  disabled={savingVariant}
                  className="btn-primary text-sm py-2 px-4 flex items-center gap-1"
                >
                  {savingVariant ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Adicionar
                </button>
              </div>
              <p className="text-xs text-gray-400">Ex: P, M, G, GG, 38, 40… Pressione Enter para adicionar rapidamente.</p>
            </div>

            {/* PERSONALIZAÇÃO */}
            <div className="md:col-span-2 bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-purple-800">Personalização</h3>
                  <p className="text-xs text-purple-500 mt-0.5">Permite que o cliente personalize o produto com nome e/ou número</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className={`w-10 h-5 rounded-full transition-colors relative ${form.allowPersonalization ? 'bg-purple-500' : 'bg-gray-300'}`} onClick={() => setForm({ ...form, allowPersonalization: !form.allowPersonalization })}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.allowPersonalization ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className={`text-sm font-semibold ${form.allowPersonalization ? 'text-purple-700' : 'text-gray-400'}`}>
                    {form.allowPersonalization ? 'Habilitada' : 'Desabilitada'}
                  </span>
                </label>
              </div>

              {form.allowPersonalization && (
                <div className="space-y-3 border-t border-purple-200 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Nome */}
                    <div className={`flex flex-col gap-3 p-3 rounded-xl border-2 transition-colors ${form.personalizationNameEnabled ? 'border-purple-400 bg-white' : 'border-gray-200 bg-white/60'}`}>
                      <label className="flex items-center gap-2 cursor-pointer" onClick={() => setForm({ ...form, personalizationNameEnabled: !form.personalizationNameEnabled })}>
                        <div className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${form.personalizationNameEnabled ? 'bg-purple-500' : 'bg-gray-300'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.personalizationNameEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </div>
                        <span className={`text-sm font-semibold ${form.personalizationNameEnabled ? 'text-purple-700' : 'text-gray-500'}`}>Nome</span>
                      </label>
                      {form.personalizationNameEnabled && (
                        <div className="flex flex-col gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Máximo de letras</label>
                            <input
                              className="input text-sm py-1.5 w-20 text-center"
                              type="number" min="1" max="30"
                              value={form.personalizationNameMaxLength}
                              onChange={e => setForm({ ...form, personalizationNameMaxLength: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Valor do nome (R$)</label>
                            <input
                              className="input text-sm py-1.5 w-28"
                              type="number" step="0.01" min="0"
                              placeholder="0.00"
                              value={form.personalizationNamePrice}
                              onChange={e => setForm({ ...form, personalizationNamePrice: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Número */}
                    <div className={`flex flex-col gap-3 p-3 rounded-xl border-2 transition-colors ${form.personalizationNumberEnabled ? 'border-purple-400 bg-white' : 'border-gray-200 bg-white/60'}`}>
                      <label className="flex items-center gap-2 cursor-pointer" onClick={() => setForm({ ...form, personalizationNumberEnabled: !form.personalizationNumberEnabled })}>
                        <div className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${form.personalizationNumberEnabled ? 'bg-purple-500' : 'bg-gray-300'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.personalizationNumberEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </div>
                        <span className={`text-sm font-semibold ${form.personalizationNumberEnabled ? 'text-purple-700' : 'text-gray-500'}`}>Número</span>
                      </label>
                      {form.personalizationNumberEnabled && (
                        <div className="flex flex-col gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Máximo de dígitos</label>
                            <input
                              className="input text-sm py-1.5 w-20 text-center"
                              type="number" min="1" max="10"
                              value={form.personalizationNumberMaxDigits}
                              onChange={e => setForm({ ...form, personalizationNumberMaxDigits: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Valor do número (R$)</label>
                            <input
                              className="input text-sm py-1.5 w-28"
                              type="number" step="0.01" min="0"
                              placeholder="0.00"
                              value={form.personalizationNumberPrice}
                              onChange={e => setForm({ ...form, personalizationNumberPrice: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Imagens</label>
              <ImageUpload images={form.images} onChange={imgs => setForm({ ...form, images: imgs })} maxImages={6} />
            </div>

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

      {/* Busca + barra de ações em massa */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9 max-w-sm"
            placeholder="Buscar produto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        {categories.length > 0 && (
          <select
            className="input py-2 text-sm pr-8"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="">Todas as categorias</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

        {selected.size > 0 && (
          <div className="flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-xl px-4 py-2 animate-in fade-in">
            <span className="text-sm font-semibold text-primary-700">
              {selected.size} selecionado{selected.size > 1 ? 's' : ''}
            </span>
            <div className="w-px h-4 bg-primary-200" />
            <button
              onClick={() => bulkAction('activate')}
              disabled={bulkLoading}
              className="text-xs font-semibold text-green-600 hover:text-green-800 hover:bg-green-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
            >
              ✓ Ativar
            </button>
            <button
              onClick={() => bulkAction('deactivate')}
              disabled={bulkLoading}
              className="text-xs font-semibold text-orange-600 hover:text-orange-800 hover:bg-orange-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
            >
              ✕ Desativar
            </button>
            <button
              onClick={() => bulkAction('delete')}
              disabled={bulkLoading}
              className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
            >
              🗑 Excluir
            </button>
            {bulkLoading && <Loader2 size={14} className="animate-spin text-primary-500" />}
            <button
              onClick={() => setSelected(new Set())}
              className="text-gray-400 hover:text-gray-600 ml-1"
            >
              <X size={14} />
            </button>
          </div>
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
                  <th className="px-4 py-3 w-10">
                    <button onClick={toggleAll} className="text-gray-400 hover:text-primary-500 transition-colors">
                      {allSelected
                        ? <CheckSquare size={16} className="text-primary-500" />
                        : someSelected
                          ? <CheckSquare size={16} className="text-primary-300" />
                          : <Square size={16} />}
                    </button>
                  </th>
                  {['', 'Produto', 'Categorias', 'Disponib.', 'Status', 'Preço', 'Estoque', 'Ações'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(p => (
                  <tr key={p.id} className={`hover:bg-gray-50 ${selected.has(p.id) ? 'bg-primary-50/50' : ''}`}>
                    <td className="px-4 py-3 w-10">
                      <button onClick={() => toggleSelect(p.id)} className="text-gray-400 hover:text-primary-500 transition-colors">
                        {selected.has(p.id)
                          ? <CheckSquare size={16} className="text-primary-500" />
                          : <Square size={16} />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {p.images?.[0] ? (
                          <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">📦</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium max-w-[200px]">
                      <p className="truncate">{p.name}</p>
                      {p.variants?.length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">{p.variants.length} tamanho{p.variants.length > 1 ? 's' : ''}</p>
                      )}
                    </td>
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
                      <span className={`font-semibold ${(p.variants?.length > 0 ? p.variants.reduce((s, v) => s + (v.stock || 0), 0) : p.stock) === 0 ? 'text-red-500' : 'text-gray-700'}`}>
                        {p.variants?.length > 0 ? p.variants.reduce((s, v) => s + (v.stock || 0), 0) : p.stock}
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
                          <button onClick={() => toggleActive(p)} title={p.active ? 'Desativar' : 'Ativar'} className={`p-1.5 rounded ${p.active ? 'text-orange-400 hover:text-orange-600 hover:bg-orange-50' : 'text-green-500 hover:text-green-700 hover:bg-green-50'}`}>
                            {p.active ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                          <button onClick={() => setConfirmDelete(p.id)} title="Excluir" className="text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50"><Trash2 size={15} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
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
