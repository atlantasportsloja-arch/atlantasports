'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/ProductCard';
import api from '@/lib/api';

const DEFAULT_CONFIG = {
  storeName: 'Atlanta Sports', heroBadge: 'Nova coleção 2025',
  heroTitle: 'Veste quem joga de verdade', heroSubtitle: 'Camisas oficiais, tênis e acessórios fitness.',
  heroBtnPrimary: 'Ver coleção', heroBtnPrimaryLink: '/categoria/camisas',
  heroBtnSecondary: 'Ver tênis', heroBtnSecondaryLink: '/categoria/tenis',
  benefit1: '🚚 Frete grátis acima de R$ 299', benefit2: '🔒 Pagamento 100% seguro',
  benefit3: '↩️ Troca em 30 dias', benefit4: '⭐ +5.000 clientes satisfeitos',
  sectionCategories: 'Categorias', sectionFeatured: 'Produtos em destaque',
  banners: [],
};

export default function HomePage() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    api.get('/config').then(r => setConfig({ ...DEFAULT_CONFIG, ...r.data })).catch(() => {});
    api.get('/products', { params: { limit: 8 } }).then(r => setFeatured(r.data.products)).catch(() => {});
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!config.banners?.length || config.banners.length <= 1) return;
    const interval = setInterval(() => setActiveBanner(i => (i + 1) % config.banners.length), 4000);
    return () => clearInterval(interval);
  }, [config.banners]);

  return (
    <div>
      {/* BANNER / HERO */}
      {config.banners?.length > 0 ? (
        <section className="relative w-full overflow-hidden bg-gray-900" style={{ height: '420px' }}>
          {config.banners.map((url, i) => (
            <div key={i} className={`absolute inset-0 transition-opacity duration-700 ${i === activeBanner ? 'opacity-100' : 'opacity-0'}`}>
              <Image src={url} alt={`Banner ${i + 1}`} fill className="object-cover" priority={i === 0} />
            </div>
          ))}
          {config.banners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {config.banners.map((_, i) => (
                <button key={i} onClick={() => setActiveBanner(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${i === activeBanner ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-6">
              <span className="text-primary-500 font-semibold uppercase tracking-widest text-sm">
                {config.heroBadge}
              </span>
              <h1 className="text-5xl md:text-6xl font-black leading-tight">
                {config.heroTitle?.split(' ').slice(0, -2).join(' ')}<br />
                <span className="text-primary-500">{config.heroTitle?.split(' ').slice(-2).join(' ')}</span>
              </h1>
              <p className="text-gray-300 text-lg max-w-md">{config.heroSubtitle}</p>
              <div className="flex gap-4 flex-wrap">
                <Link href={config.heroBtnPrimaryLink || '/'} className="btn-primary">{config.heroBtnPrimary}</Link>
                <Link href={config.heroBtnSecondaryLink || '/'} className="btn-outline border-white text-white hover:bg-white hover:text-gray-900">
                  {config.heroBtnSecondary}
                </Link>
              </div>
            </div>
            <div className="text-[120px] select-none">⚽</div>
          </div>
        </section>
      )}

      {/* BENEFÍCIOS */}
      <section className="bg-primary-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm font-medium">
          <div>{config.benefit1}</div>
          <div>{config.benefit2}</div>
          <div>{config.benefit3}</div>
          <div>{config.benefit4}</div>
        </div>
      </section>

      {/* CATEGORIAS */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-black mb-6">{config.sectionCategories}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map(cat => (
              <Link key={cat.id} href={`/categoria/${cat.slug}`} className="card p-6 text-center hover:shadow-md transition-shadow group">
                <div className="text-4xl mb-2">
                  {cat.slug === 'camisas' ? '👕' : cat.slug === 'tenis' ? '👟' : cat.slug === 'fitness' ? '🏋️' : '🎽'}
                </div>
                <p className="font-semibold group-hover:text-primary-500 transition-colors">{cat.name}</p>
                <p className="text-xs text-gray-400">{cat._count?.products} produtos</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* PRODUTOS */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black">{config.sectionFeatured}</h2>
            <Link href="/busca" className="text-primary-500 text-sm font-semibold hover:underline">Ver todos</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* WHATSAPP FLUTUANTE */}
      {config.whatsapp && (
        <a
          href={`https://wa.me/${config.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-colors z-50 text-2xl"
          title="Falar no WhatsApp"
        >
          💬
        </a>
      )}
    </div>
  );
}
