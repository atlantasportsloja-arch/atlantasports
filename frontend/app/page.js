import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import BannerSlider from '@/components/BannerSlider';

const DEFAULT_CONFIG = {
  storeName: 'Atlanta Sports', heroBadge: 'Nova coleção 2025',
  heroTitle: 'Veste quem joga de verdade', heroSubtitle: 'Camisas oficiais, tênis e acessórios fitness.',
  benefit1: '🚚 Frete Grátis\nacima R$ 299,00',
  benefit2: '🔒 Compra\n100% Segura',
  benefit3: '📱 Atendimento\nDiferenciado',
  benefit4: '⭐ Clientes\nSatisfeitos',
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
        <div className="max-w-7xl mx-auto px-0 md:px-0">
          <div className="grid grid-cols-4 divide-x divide-white/20">
            {[config.benefit1, config.benefit2, config.benefit3, config.benefit4].map((b, i) => {
              const emoji = b.match(/^\S+/)?.[0] ?? '';
              const text = b.replace(/^\S+\s*/, '');
              const [line1, line2] = text.split('\n');
              return (
                <div key={i} className="flex flex-row items-center justify-center gap-0.5 md:gap-2 px-0.5 md:px-4 py-1.5 md:py-3.5">
                  <span className="text-sm md:text-xl leading-none shrink-0" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))' }}>
                    {emoji}
                  </span>
                  <div className="flex flex-col items-center text-center">
                    <span className="text-[8px] md:text-sm font-bold uppercase leading-tight" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{line1}</span>
                    {line2 && <span className="text-[8px] md:text-sm font-bold uppercase leading-tight" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{line2}</span>}
                  </div>
                </div>
              );
            })}
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
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 bg-green-500 text-white p-3.5 rounded-full shadow-xl hover:bg-green-600 hover:scale-105 transition-all z-50"
          title="Falar no WhatsApp"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}
    </div>
  );
}
