import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import BannerSlider from '@/components/BannerSlider';

const DEFAULT_CONFIG = {
  storeName: 'Atlanta Sports', heroBadge: 'Nova coleção 2025',
  heroTitle: 'Veste quem joga de verdade', heroSubtitle: 'Camisas oficiais, tênis e acessórios fitness.',
  benefit1: '🚚 Frete Grátis acima R$ 299,00',
  benefit2: '🔒 Compra 100% Segura',
  benefit3: '📱 Atendimento diferenciado',
  benefit4: '⭐ Clientes Satisfeitos',
  sectionCategories: 'Categorias', sectionFeatured: 'Produtos em destaque',
  banners: [],
};

const CATEGORY_ICON = {
  masculino: '👨', feminino: '👩', infantil: '👦', calcados: '👟',
  esporte: '⚽', acessorio: '🎒', promocao: '🏷️', encomenda: '✈️',
};

const API = process.env.NEXT_PUBLIC_API_URL;

async function getData() {
  const [configRes, productsRes, categoriesRes] = await Promise.allSettled([
    fetch(`${API}/config`, { next: { revalidate: 300 } }),
    fetch(`${API}/products?limit=8`, { next: { revalidate: 60 } }),
    fetch(`${API}/categories`, { next: { revalidate: 30 } }),
  ]);

  const config = configRes.status === 'fulfilled' && configRes.value.ok
    ? await configRes.value.json() : {};
  const productsData = productsRes.status === 'fulfilled' && productsRes.value.ok
    ? await productsRes.value.json() : {};
  const categories = categoriesRes.status === 'fulfilled' && categoriesRes.value.ok
    ? await categoriesRes.value.json() : [];

  const merged = { ...DEFAULT_CONFIG, ...config };
  ['benefit1','benefit2','benefit3','benefit4'].forEach(k => {
    if (!merged[k]) merged[k] = DEFAULT_CONFIG[k];
  });

  return {
    config: merged,
    products: productsData.products || [],
    categories: Array.isArray(categories) ? categories : [],
  };
}

export default async function HomePage() {
  const { config, products, categories } = await getData();

  return (
    <div>
      {/* BANNER / HERO */}
      {config.banners?.length > 0 ? (
        <BannerSlider banners={config.banners} />
      ) : (
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <div className="max-w-7xl mx-auto px-4 py-10 md:py-28 flex flex-col md:flex-row items-center gap-6 md:gap-10 relative">
            <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black leading-tight">
                {config.heroTitle?.split(' ').slice(0, -2).join(' ')}{' '}
                <span className="text-primary-500">{config.heroTitle?.split(' ').slice(-2).join(' ')}</span>
              </h1>
              <p className="text-gray-300 text-base md:text-lg max-w-md leading-relaxed mx-auto md:mx-0">{config.heroSubtitle}</p>
            </div>
            <div className="text-[80px] md:text-[140px] select-none drop-shadow-2xl">⚽</div>
          </div>
        </section>
      )}

      {/* BENEFÍCIOS */}
      <section
        className="text-white relative z-10"
        style={{
          background: 'linear-gradient(to bottom, #fdab60 0%, #f07010 55%, #c2560a 100%)',
          boxShadow: '0 8px 20px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -2px 0 rgba(0,0,0,0.18)',
        }}
      >
        <div className="max-w-7xl mx-auto px-3 md:px-0">
          <div className="grid grid-cols-2 md:grid-cols-4 md:divide-x divide-white/20">
            {[config.benefit1, config.benefit2, config.benefit3, config.benefit4].map((b, i) => (
              <div key={i} className="flex flex-row items-center justify-center gap-1 md:gap-2 px-1 md:px-4 py-1 md:py-3.5">
                <span className="text-base md:text-xl leading-none shrink-0" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))' }}>
                  {b.match(/^\S+/)?.[0]}
                </span>
                <span className="text-[9px] md:text-sm font-bold uppercase leading-tight" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                  {b.replace(/^\S+\s*/, '')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <h2 className="text-xl md:text-2xl font-black mb-4 md:mb-6">{config.sectionCategories}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/categoria/${cat.slug}`}
                className="card p-4 md:p-6 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div className="text-4xl mb-3">{CATEGORY_ICON[cat.slug] || '🏆'}</div>
                <p className="font-semibold group-hover:text-primary-500 transition-colors">{cat.name}</p>
                <p className="text-xs text-gray-400 mt-1">{cat._count?.products || 0} produtos</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* PRODUTOS EM DESTAQUE */}
      <section className="max-w-7xl mx-auto px-4 py-6 pb-12 md:pb-16">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-black">{config.sectionFeatured}</h2>
          <Link href="/busca" className="text-primary-500 text-sm font-semibold hover:underline">Ver todos →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
        </div>
      </section>

      {/* WHATSAPP FLUTUANTE */}
      {config.whatsapp && (
        <a
          href={`https://wa.me/${config.whatsapp}?text=${encodeURIComponent('Olá Atlanta Sports\nVim do site e preciso tirar uma dúvida. Poderia me ajudar?')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 bg-green-500 text-white p-4 rounded-full shadow-xl hover:bg-green-600 hover:scale-105 transition-all z-50 text-2xl"
          title="Falar no WhatsApp"
        >
          💬
        </a>
      )}
    </div>
  );
}
