import ProductCard from '@/components/ProductCard';
import api from '@/lib/api';

export const metadata = { title: 'Busca' };

async function search(q, sort, page = 1) {
  if (!q) return { products: [], total: 0, pages: 0 };
  try {
    const { data } = await api.get('/products', { params: { search: q, sort, page, limit: 20 } });
    return data;
  } catch { return { products: [], total: 0, pages: 0 }; }
}

export default async function BuscaPage({ searchParams }) {
  const { q, sort, page = 1 } = searchParams;
  const { products, total, pages } = await search(q, sort, page);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black mb-1">
        {q ? `Resultados para "${q}"` : 'Todos os produtos'}
      </h1>
      <p className="text-gray-500 text-sm mb-6">{total} produto(s) encontrado(s)</p>

      {products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-lg font-semibold">Nenhum resultado encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
