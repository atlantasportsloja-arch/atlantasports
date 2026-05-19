'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import api from '@/lib/api';

const GENEROS = [
  { key: 'masculino', label: 'MASCULINO', icon: '👨' },
  { key: 'feminino',  label: 'FEMININO',  icon: '👩' },
  { key: 'infantil',  label: 'INFANTIL',  icon: '🧒' },
];

function ProductSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-6 bg-gray-200 rounded w-1/2 mt-2" />
      </div>
    </div>
  );
}

export default function CategoriaPage() {
  const { slug } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isEncomenda = slug === 'encomenda';
  const sort = searchParams.get('sort') || '';
  const page = Number(searchParams.get('page') || 1);
  const genero = isEncomenda ? (searchParams.get('genero') || '') : '';

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/products', {
      params: {
        category: slug,
        sort: sort || undefined,
        page,
        limit: 20,
        search: genero || undefined,
      },
    })
      .then(r => {
        setProducts(r.data.products);
        setTotal(r.data.total);
        setPages(r.data.pages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, sort, page, genero]);

  function handleSort(e) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) params.set('sort', e.target.value);
    else params.delete('sort');
    params.delete('page');
    router.push(`?${params.toString()}`);
  }

  function handleGenero(key) {
    const params = new URLSearchParams();
    if (sort) params.set('sort', sort);
    if (key && key !== genero) params.set('genero', key);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black capitalize">{String(slug).replace(/-/g, ' ')}</h1>
          <p className="text-gray-500 text-sm">{loading ? '...' : `${total} produtos`}</p>
        </div>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={sort}
          onChange={handleSort}
        >
          <option value="">Mais recentes</option>
          <option value="price_asc">Menor preço</option>
          <option value="price_desc">Maior preço</option>
          <option value="name">A–Z</option>
        </select>
      </div>

      {isEncomenda && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {GENEROS.map(g => {
            const ativo = genero === g.key;
            return (
              <button
                key={g.key}
                onClick={() => handleGenero(g.key)}
                className={`flex flex-col items-center justify-center gap-2 py-6 rounded-2xl border-2 font-black text-sm sm:text-base transition-all duration-200 ${
                  ativo
                    ? 'border-primary-500 bg-primary-500 text-white shadow-lg scale-[1.02]'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-primary-400 hover:bg-primary-50'
                }`}
              >
                <span className="text-3xl">{g.icon}</span>
                <span className="tracking-widest">{g.label}</span>
                {ativo && (
                  <span className="text-xs font-normal opacity-80">filtro ativo — clique para remover</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">🏃</div>
          <p className="text-lg font-semibold">Nenhum produto nesta categoria</p>
          {genero && (
            <button
              onClick={() => handleGenero('')}
              className="mt-4 text-sm text-primary-500 underline"
            >
              Remover filtro {genero}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('page', p);
                router.push(`?${params.toString()}`);
              }}
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold transition-colors ${
                p === page ? 'bg-primary-500 text-white' : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
