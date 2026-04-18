import ProductCard from '@/components/ProductCard';
import api from '@/lib/api';

export async function generateMetadata({ params }) {
  return { title: params.slug.charAt(0).toUpperCase() + params.slug.slice(1) };
}

async function getProducts(slug, searchParams) {
  try {
    const { data } = await api.get('/products', {
      params: { category: slug, sort: searchParams.sort, page: searchParams.page || 1, limit: 20 },
    });
    return data;
  } catch { return { products: [], total: 0 } }
}

export default async function CategoriaPage({ params, searchParams }) {
  const { products, total, pages } = await getProducts(params.slug, searchParams);
  const currentPage = Number(searchParams.page || 1);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black capitalize">{params.slug.replace(/-/g, ' ')}</h1>
          <p className="text-gray-500 text-sm">{total} produtos</p>
        </div>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          defaultValue={searchParams.sort || ''}
          onChange={e => window.location.href = `?sort=${e.target.value}`}
        >
          <option value="">Mais recentes</option>
          <option value="price_asc">Menor preço</option>
          <option value="price_desc">Maior preço</option>
          <option value="name">A–Z</option>
        </select>
      </div>

      {products.length === 0 ? (
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
            <a
              key={p}
              href={`?page=${p}&sort=${searchParams.sort || ''}`}
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold transition-colors ${
                p === currentPage ? 'bg-primary-500 text-white' : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
