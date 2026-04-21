'use client';
import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, X, Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const SUGESTOES = [
  { name: 'Masculino',     emoji: '👨' },
  { name: 'Feminino',      emoji: '👩' },
  { name: 'Infantil',      emoji: '👦' },
  { name: 'Calçados',      emoji: '👟' },
  { name: 'Esporte',       emoji: '⚽' },
  { name: 'Acessório',     emoji: '🎒' },
  { name: 'Promoção',      emoji: '🏷️' },
  { name: 'Atlanta Sports', emoji: '🏆' },
];

const EMPTY = { name: '', image: '' };

export default function CategoriasPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/categories');
      setCategories(data);
    } catch {
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/categories/${editing}`, { name: form.name, image: form.image });
        toast.success('Categoria atualizada!');
      } else {
        await api.post('/categories', { name: form.name, image: form.image });
        toast.success('Categoria criada!');
      }
      setForm(EMPTY);
      setEditing(null);
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Categoria removida');
      setConfirmDelete(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao remover');
    }
  }

  function startEdit(cat) {
    setForm({ name: cat.name, image: cat.image || '' });
    setEditing(cat.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openNew() {
    setForm(EMPTY);
    setEditing(null);
    setShowForm(true);
  }

  async function criarSugestao(s) {
    const jaExiste = categories.some(c => c.name.toLowerCase() === s.name.toLowerCase());
    if (jaExiste) { toast.error(`"${s.name}" já existe`); return; }
    try {
      await api.post('/categories', { name: s.name });
      toast.success(`${s.emoji} ${s.name} criada!`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar');
    }
  }

  const existentes = new Set(categories.map(c => c.name.toLowerCase()));

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Categorias</h1>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nova categoria
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black">{editing ? 'Editar categoria' : 'Nova categoria'}</h2>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY); }}
              className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome</label>
              <input
                className="input"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                placeholder="Ex: Camisas"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {editing ? 'Salvar alterações' : 'Criar categoria'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY); }}
                className="btn-outline">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Sugestões de 8 categorias */}
      <div className="card p-6">
        <h2 className="font-black mb-1">Categorias sugeridas</h2>
        <p className="text-sm text-gray-400 mb-4">Clique para adicionar as que ainda não existem.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SUGESTOES.map(s => {
            const existe = existentes.has(s.name.toLowerCase());
            return (
              <button
                key={s.name}
                onClick={() => !existe && criarSugestao(s)}
                disabled={existe}
                className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all text-sm font-semibold ${
                  existe
                    ? 'border-green-300 bg-green-50 text-green-700 cursor-default'
                    : 'border-dashed border-gray-300 hover:border-primary-500 hover:bg-primary-50 hover:text-primary-600 text-gray-500'
                }`}
              >
                <span className="text-2xl">{s.emoji}</span>
                {s.name}
                {existe && <span className="text-xs font-normal text-green-500">✓ criada</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de categorias */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="font-black">Categorias cadastradas</h2>
          <span className="text-sm text-gray-400">{categories.length} categorias</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 animate-pulse">Carregando...</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="font-medium">Nenhuma categoria cadastrada</p>
            <p className="text-sm mt-1">Use as sugestões acima ou crie uma nova.</p>
          </div>
        ) : (
          <div className="divide-y">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-semibold">{cat.name}</p>
                  <p className="text-xs text-gray-400">
                    slug: <span className="font-mono">{cat.slug}</span>
                    {' · '}
                    {cat._count?.products ?? 0} produtos
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {confirmDelete === cat.id ? (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 text-sm">
                      <span className="text-red-700 text-xs">Remover "{cat.name}"?</span>
                      <button onClick={() => remove(cat.id)} className="bg-red-500 text-white text-xs px-2 py-0.5 rounded font-semibold hover:bg-red-600">Sim</button>
                      <button onClick={() => setConfirmDelete(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => startEdit(cat)}
                        className="text-blue-500 hover:text-blue-700 p-1.5 rounded hover:bg-blue-50">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => setConfirmDelete(cat.id)}
                        className="text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
