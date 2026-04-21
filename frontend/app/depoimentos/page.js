'use client';
import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import api from '@/lib/api';

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={16} className={s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
      ))}
    </div>
  );
}

export default function DepoimentosPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reviews').then(r => setReviews(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const total = reviews.length;
  const media = total > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : null;
  const dist = [5, 4, 3, 2, 1].map(n => ({ nota: n, count: reviews.filter(r => r.rating === n).length }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black mb-2">💬 Depoimentos de Clientes</h1>
        <p className="text-gray-500">Veja o que nossos clientes estão dizendo sobre a Atlanta Sports</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400 animate-pulse">Carregando depoimentos...</div>
      ) : total === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">⭐</div>
          <p className="text-xl font-semibold text-gray-700 mb-2">Seja o primeiro a avaliar!</p>
          <p className="text-gray-400">Compre um produto e deixe sua avaliação.</p>
        </div>
      ) : (
        <>
          {/* Resumo */}
          <div className="card p-6 mb-8 flex flex-col sm:flex-row items-center gap-8">
            <div className="text-center">
              <p className="text-6xl font-black text-primary-500">{media}</p>
              <Stars rating={Math.round(media)} />
              <p className="text-sm text-gray-400 mt-1">{total} avaliações</p>
            </div>
            <div className="flex-1 w-full space-y-2">
              {dist.map(({ nota, count }) => (
                <div key={nota} className="flex items-center gap-3 text-sm">
                  <span className="w-4 text-gray-500 font-semibold">{nota}</span>
                  <Star size={12} className="fill-yellow-400 text-yellow-400 flex-shrink-0" />
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 bg-yellow-400 rounded-full transition-all"
                      style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="w-6 text-gray-400 text-xs">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lista */}
          <div className="grid sm:grid-cols-2 gap-4">
            {reviews.map(r => (
              <div key={r.id} className="card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {r.user?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{r.user?.name || 'Cliente'}</p>
                    <Stars rating={r.rating} />
                  </div>
                </div>
                {r.comment && (
                  <p className="text-gray-600 text-sm leading-relaxed">"{r.comment}"</p>
                )}
                {r.product && (
                  <p className="text-xs text-gray-400 border-t pt-2">
                    Produto: <span className="font-medium text-gray-600">{r.product.name}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
