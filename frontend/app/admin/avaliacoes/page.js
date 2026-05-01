'use client';
import { useEffect, useState } from 'react';
import { Star, Trash2, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={13} className={n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </div>
  );
}

export default function AdminAvaliacoes() {
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState('');
  const [starFilter, setStarFilter] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/reviews');
      setReviews(data);
    } catch {
      toast.error('Erro ao carregar avaliações');
    } finally {
      setLoading(false);
    }
  }

  async function remove(id) {
    if (!confirm('Remover esta avaliação?')) return;
    try {
      await api.delete(`/reviews/admin/${id}`);
      setReviews(r => r.filter(rv => rv.id !== id));
      toast.success('Avaliação removida');
    } catch {
      toast.error('Erro ao remover avaliação');
    }
  }

  const filtered = reviews.filter(r => {
    if (starFilter && r.rating !== starFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return r.user?.name?.toLowerCase().includes(q)
        || r.product?.name?.toLowerCase().includes(q)
        || r.comment?.toLowerCase().includes(q);
    }
    return true;
  });

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—';
  const dist = [5, 4, 3, 2, 1].map(n => ({ n, count: reviews.filter(r => r.rating === n).length }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black">Avaliações ({filtered.length}{filtered.length !== reviews.length ? ` de ${reviews.length}` : ''})</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            {[0, 5, 4, 3, 2, 1].map(n => (
              <button
                key={n}
                onClick={() => setStarFilter(n)}
                className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
                  starFilter === n
                    ? 'bg-yellow-400 text-white border-yellow-400'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {n === 0 ? 'Todas' : <><Star size={11} className="fill-current" />{n}</>}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="border border-gray-300 rounded-lg pl-8 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-56"
              placeholder="Buscar produto, cliente..."
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
      </div>

      {/* Resumo */}
      {reviews.length > 0 && (
        <div className="card p-5 flex items-center gap-8 flex-wrap">
          <div className="text-center">
            <p className="text-4xl font-black text-yellow-500">{avg}</p>
            <Stars rating={Math.round(Number(avg))} />
            <p className="text-xs text-gray-400 mt-1">{reviews.length} avaliações</p>
          </div>
          <div className="flex-1 space-y-1.5 min-w-[160px]">
            {dist.map(({ n, count }) => (
              <div key={n} className="flex items-center gap-2 text-xs">
                <span className="w-4 text-right font-semibold text-gray-600">{n}</span>
                <Star size={11} className="text-yellow-400 fill-yellow-400 shrink-0" />
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all"
                    style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
                  />
                </div>
                <span className="w-6 text-gray-400">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="card p-12 text-center text-gray-400 animate-pulse">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          {search ? `Nenhuma avaliação encontrada para "${search}"` : 'Nenhuma avaliação ainda'}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>{['Produto', 'Cliente', 'Nota', 'Comentário', 'Data', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium max-w-[180px] truncate">{r.product?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{r.user?.name || '—'}</td>
                    <td className="px-4 py-3"><Stars rating={r.rating} /></td>
                    <td className="px-4 py-3 text-gray-500 max-w-[260px]">
                      {r.comment ? (
                        <p className="line-clamp-2 text-xs">{r.comment}</p>
                      ) : (
                        <span className="text-gray-300 text-xs italic">sem comentário</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => remove(r.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title="Remover avaliação"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y">
            {filtered.map(r => (
              <div key={r.id} className="p-4 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{r.product?.name || '—'}</p>
                    <p className="text-xs text-gray-400">{r.user?.name || '—'} · {new Date(r.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <button onClick={() => remove(r.id)} className="text-red-400 hover:text-red-600 shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
                <Stars rating={r.rating} />
                {r.comment && <p className="text-xs text-gray-500 line-clamp-2">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
