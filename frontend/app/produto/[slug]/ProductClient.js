'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Truck, Shield, ChevronRight, Loader2, Heart, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore, useCartStore } from '@/lib/store';
import { useConfig, pixPrice, fmt } from '@/lib/useConfig';
import { sortSizes } from '@/lib/sortSizes';
import ProductCard from '@/components/ProductCard';

const ESTADOS_BR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const WA_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

function ProductSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      <div className="flex gap-2 mb-6">
        <div className="h-4 w-12 bg-gray-200 rounded" />
        <div className="h-4 w-4 bg-gray-200 rounded" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="h-4 w-4 bg-gray-200 rounded" />
        <div className="h-4 w-32 bg-gray-200 rounded" />
      </div>
      <div className="grid md:grid-cols-2 gap-10">
        <div className="aspect-square bg-gray-200 rounded-xl" />
        <div className="space-y-4">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-8 w-3/4 bg-gray-200 rounded" />
          <div className="h-10 w-1/3 bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-5/6 bg-gray-200 rounded" />
          <div className="h-12 w-full bg-gray-200 rounded-lg mt-4" />
        </div>
      </div>
    </div>
  );
}


export default function ProdutoPage({ params }) {
  const router = useRouter();
  const { token } = useAuthStore();
  const { setCart } = useCartStore();
  const config = useConfig();
  const { pixDiscount } = config;
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [imgErrors, setImgErrors] = useState({});

  useEffect(() => {
    api.get(`/products/${params.slug}`).then(r => {
      setProduct(r.data);
      const cat = r.data.categories?.[0]?.slug;
      if (cat) {
        api.get(`/products?category=${cat}&limit=9`).then(res => {
          setRelated(res.data.products.filter(p => p.slug !== params.slug).slice(0, 4));
        }).catch(() => {});
      }
    }).catch(() => {});
  }, [params.slug]);

  useEffect(() => {
    if (!token || !product) return;
    api.get('/wishlist')
      .then(r => setWishlisted(r.data.some(w => w.productId === product.id)))
      .catch(() => {});
  }, [token, product?.id]);

  const sizes = product ? sortSizes([...new Set(product.variants?.filter(v => v.size && v.active !== false).map(v => v.size))]) : [];
  const hasVariants = sizes.length > 0;

  const selectedVariant = product?.variants?.find(v => v.size === selectedSize) || null;

  const effectiveStock = hasVariants
    ? (selectedVariant?.stock ?? 0)
    : product?.stock ?? 0;

  async function addToCart() {
    if (!token) { toast.error('Faça login para continuar'); return; }
    if (hasVariants && !selectedSize) { toast.error('Selecione um tamanho'); return; }
    setLoading(true);
    try {
      await api.post('/cart', { productId: product.id, variantId: selectedVariant?.id || null, quantity });
      const { data } = await api.get('/cart');
      setCart(data.items, data.total);
      toast.success('Adicionado ao carrinho!');
    } catch {
      toast.error('Erro ao adicionar ao carrinho');
    } finally {
      setLoading(false);
    }
  }

  async function buyNow() {
    if (!token) { toast.error('Faça login para continuar'); return; }
    if (hasVariants && !selectedSize) { toast.error('Selecione um tamanho'); return; }
    setBuyingNow(true);
    try {
      await api.post('/cart', { productId: product.id, variantId: selectedVariant?.id || null, quantity });
      const { data } = await api.get('/cart');
      setCart(data.items, data.total);
      router.push('/checkout');
    } catch {
      toast.error('Erro ao processar');
      setBuyingNow(false);
    }
  }

  async function toggleWishlist() {
    if (!token) { toast.error('Faça login para salvar'); return; }
    setWishlistLoading(true);
    try {
      const { data } = await api.post('/wishlist', { productId: product.id });
      setWishlisted(data.saved);
      toast.success(data.saved ? '❤️ Salvo na lista de desejos' : 'Removido da lista de desejos');
    } catch {
      toast.error('Erro ao atualizar lista de desejos');
    } finally {
      setWishlistLoading(false);
    }
  }

  if (!product) return <ProductSkeleton />;

  const outOfStock = effectiveStock === 0;
  const lowStock = effectiveStock > 0 && effectiveStock <= 5;
  const hasEstadoSigla = ESTADOS_BR.some(uf => product.name?.includes(`(${uf})`));
  const waNumero = (config.whatsapp || '').replace(/\D/g, '');
  const waUrl = `https://wa.me/${waNumero}?text=${encodeURIComponent(`Quero ver as fotos reais\nPoderia me enviar por favor? 📸\n\nhttps://www.atlantasports.com.br/produto/${product.slug}`)}`;

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-4 py-3 md:py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-gray-400 mb-2 md:mb-6 overflow-x-auto whitespace-nowrap pb-1">
        <Link href="/" className="hover:text-gray-600 transition-colors">Início</Link>
        <ChevronRight size={14} />
        {product.categories?.[0] && (
          <>
            <Link href={`/categoria/${product.categories[0].slug}`} className="hover:text-gray-600 transition-colors capitalize">
              {product.categories[0].name}
            </Link>
            <ChevronRight size={14} />
          </>
        )}
        <span className="text-gray-700 font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-4 md:gap-10">
        {/* IMAGENS */}
        <div className="space-y-2 md:space-y-3">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
            {product.images?.[activeImg] && !imgErrors[activeImg] ? (
              <Image
                src={product.images[activeImg]}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => setImgErrors(prev => ({ ...prev, [activeImg]: true }))}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl">👕</div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-colors ${
                    i === activeImg ? 'border-primary-500' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  {img && !imgErrors[i] ? (
                    <Image
                      src={img}
                      alt=""
                      fill
                      className="object-cover"
                      onError={() => setImgErrors(prev => ({ ...prev, [i]: true }))}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300 text-xl">👕</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* INFO */}
        <div className="space-y-2.5 md:space-y-5">
          <h1 className="text-xl md:text-3xl font-black leading-tight">{product.name}</h1>

          {product.availability && (
            <span className={`inline-flex items-center gap-1 text-xs md:text-sm font-semibold px-2.5 py-0.5 rounded-full ${product.availability === 'encomenda' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
              {product.availability === 'encomenda' ? '🕐 Sob Encomenda' : '✅ Pronta Entrega'}
            </span>
          )}

          <div className="bg-gray-50 rounded-xl p-2.5 md:p-4 space-y-1">
            <p className="text-2xl md:text-4xl font-black text-gray-900">
              R$ {product.price.toFixed(2).replace('.', ',')}
            </p>
            {product.comparePrice && (
              <p className="text-gray-400 line-through text-xs md:text-sm">
                De R$ {product.comparePrice.toFixed(2).replace('.', ',')}
              </p>
            )}
            {pixPrice(product.price, pixDiscount) && (
              <div className="pt-1.5 border-t border-gray-200 flex items-center gap-1.5">
                <span className="bg-green-100 text-green-700 text-xs font-bold px-1.5 py-0.5 rounded">PIX</span>
                <span className="text-green-700 font-black text-lg md:text-xl">
                  R$ {fmt(pixPrice(product.price, pixDiscount))}
                </span>
                <span className="text-green-600 text-xs font-semibold">({pixDiscount}% off)</span>
              </div>
            )}
          </div>

          <p className="text-sm md:text-base text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>

          {sizes.length > 0 && (
            <div>
              <p className="text-xs md:text-sm font-semibold mb-1.5">Tamanho</p>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {sizes.map(s => {
                  const variant = product.variants.find(v => v.size === s);
                  const unavailable = variant?.stock === 0;
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={unavailable}
                      onClick={() => setSelectedSize(s === selectedSize ? null : s)}
                      className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg border-2 text-xs md:text-sm font-semibold transition-colors ${
                        selectedSize === s
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : unavailable
                          ? 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button className="px-2.5 py-2 hover:bg-gray-100 transition-colors font-bold" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
              <span className="px-4 py-2 font-semibold text-sm border-x border-gray-300">{quantity}</span>
              <button className="px-2.5 py-2 hover:bg-gray-100 transition-colors font-bold" onClick={() => setQuantity(q => Math.min(Math.max(effectiveStock, 1), q + 1))}>+</button>
            </div>
            {lowStock && <span className="text-xs text-orange-500 font-semibold">⚠️ Apenas {effectiveStock} em estoque</span>}
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <button
              onClick={buyNow}
              disabled={buyingNow || outOfStock}
              className="w-full flex items-center justify-center gap-2 py-3 md:py-4 text-sm md:text-base font-bold rounded-xl bg-gray-900 hover:bg-gray-800 text-white transition-colors disabled:opacity-50"
            >
              {buyingNow
                ? <><Loader2 size={18} className="animate-spin" /> Processando...</>
                : <><Zap size={18} /> Comprar agora</>
              }
            </button>
            <div className="flex gap-2">
              <button
                onClick={addToCart}
                disabled={loading || outOfStock}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5 md:py-3 text-sm"
              >
                {loading
                  ? <><Loader2 size={15} className="animate-spin" /> Adicionando...</>
                  : <><ShoppingCart size={15} /> Adicionar ao carrinho</>
                }
              </button>
              <button
                onClick={toggleWishlist}
                disabled={wishlistLoading}
                className={`p-2.5 md:p-3 rounded-lg border-2 transition-all ${
                  wishlisted
                    ? 'border-red-400 bg-red-50 text-red-500'
                    : 'border-gray-300 text-gray-400 hover:border-red-300 hover:text-red-400'
                }`}
                title={wishlisted ? 'Remover da lista de desejos' : 'Salvar na lista de desejos'}
              >
                <Heart size={18} className={wishlisted ? 'fill-current' : ''} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 md:gap-3">
            <div className="flex flex-col items-center text-center gap-1 text-[10px] md:text-xs text-gray-500 p-2 md:p-3 bg-gray-50 rounded-lg">
              <span className="text-primary-500"><Truck size={15} /></span>
              Frete Grátis acima R$ 299
            </div>
            {hasEstadoSigla ? (
              <a href={waUrl} target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center text-center gap-1 text-[10px] md:text-xs font-bold text-white bg-green-500 hover:bg-green-600 p-2 md:p-3 rounded-lg transition-colors">
                {WA_ICON}
                Ver fotos reais
              </a>
            ) : (
              <div className="flex flex-col items-center text-center gap-1 text-[10px] md:text-xs text-gray-500 p-2 md:p-3 bg-gray-50 rounded-lg">
                <span className="text-primary-500"><Zap size={15} /></span>
                Envio Imediato
              </div>
            )}
            <div className="flex flex-col items-center text-center gap-1 text-[10px] md:text-xs text-gray-500 p-2 md:p-3 bg-gray-50 rounded-lg">
              <span className="text-primary-500"><Shield size={15} /></span>
              Compra 100% Segura
            </div>
          </div>
        </div>
      </div>


      {/* PRODUTOS RELACIONADOS */}
      {related.length > 0 && (
        <section className="mt-6 md:mt-14 border-t pt-5 md:pt-10">
          <h2 className="text-base md:text-xl font-black mb-3 md:mb-6">Você também pode gostar</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
