'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import api from '@/lib/api';

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

  const sort = searchParams.get('sort') || '';
  const page = Number(searchParams.get('page') || 1);

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/products', { params: { category: slug, sort: sort || undefined, page, limit: 20 } })
      .then(r => {
        setProducts(r.data.products);
        setTotal(r.data.total);
        setPages(r.data.pages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, sort, page]);

  function handleSort(e) {
    const params = new URLSearchParams();
    if (e.target.value) params.set('sort', e.target.value);
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

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">🏃</div>
          <p className="text-lg font-semibold">Nenhum produto nesta categoria</p>
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
              onClick={() => router.push(`?page=${p}&sort=${sort}`)}
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
