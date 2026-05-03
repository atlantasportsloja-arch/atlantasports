'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Truck, RotateCcw, Shield, ChevronRight, Loader2, Heart, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore, useCartStore } from '@/lib/store';
import { useConfig, pixPrice, fmt } from '@/lib/useConfig';
import { sortSizes } from '@/lib/sortSizes';
import ProductCard from '@/components/ProductCard';

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
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

      <div className="grid md:grid-cols-2 gap-10">
        {/* IMAGENS */}
        <div className="space-y-3">
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
        <div className="space-y-5">
          <div>
            <h1 className="text-3xl font-black leading-tight">{product.name}</h1>
          </div>

          {product.availability && (
            <div>
              <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full ${product.availability === 'encomenda' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                {product.availability === 'encomenda' ? '🕐 Sob Encomenda' : '✅ Pronta Entrega'}
              </span>
            </div>
          )}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1">
            <p className="text-4xl font-black text-gray-900">
              R$ {product.price.toFixed(2).replace('.', ',')}
            </p>
            {product.comparePrice && (
              <p className="text-gray-400 line-through text-sm">
                De R$ {product.comparePrice.toFixed(2).replace('.', ',')}
              </p>
            )}

            {pixPrice(product.price, pixDiscount) && (
              <div className="mt-2 pt-2 border-t border-gray-200 flex items-center gap-2">
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded">PIX</span>
                <span className="text-green-700 font-black text-xl">
                  R$ {fmt(pixPrice(product.price, pixDiscount))}
                </span>
                <span className="text-green-600 text-xs font-semibold">
                  ({pixDiscount}% off)
                </span>
              </div>
            )}

          </div>

          <p className="text-gray-600 leading-relaxed">{product.description}</p>

          {sizes.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2">Tamanho</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map(s => {
                  const variant = product.variants.find(v => v.size === s);
                  const unavailable = variant?.stock === 0;
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={unavailable}
                      onClick={() => setSelectedSize(s === selectedSize ? null : s)}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-colors ${
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

          <div className="flex items-center gap-4">
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                className="px-3 py-3 hover:bg-gray-100 transition-colors font-bold text-lg"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
              >−</button>
              <span className="px-5 font-semibold">{quantity}</span>
              <button
                className="px-3 py-3 hover:bg-gray-100 transition-colors font-bold text-lg"
                onClick={() => setQuantity(q => Math.min(Math.max(effectiveStock, 1), q + 1))}
              >+</button>
            </div>
            {lowStock && <span className="text-xs text-orange-500 font-semibold">⚠️ Apenas {effectiveStock} em estoque</span>}
          </div>

          <div className="space-y-2">
            <button
              onClick={buyNow}
              disabled={buyingNow || outOfStock}
              className="w-full flex items-center justify-center gap-2 py-4 text-base font-bold rounded-xl bg-gray-900 hover:bg-gray-800 text-white transition-colors disabled:opacity-50"
            >
              {buyingNow
                ? <><Loader2 size={20} className="animate-spin" /> Processando...</>
                : <><Zap size={20} /> Comprar agora</>
              }
            </button>
            <div className="flex gap-2">
              <button
                onClick={addToCart}
                disabled={loading || outOfStock}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-sm"
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> Adicionando...</>
                  : <><ShoppingCart size={16} /> Adicionar ao carrinho</>
                }
              </button>
              <button
                onClick={toggleWishlist}
                disabled={wishlistLoading}
                className={`p-3 rounded-lg border-2 transition-all ${
                  wishlisted
                    ? 'border-red-400 bg-red-50 text-red-500'
                    : 'border-gray-300 text-gray-400 hover:border-red-300 hover:text-red-400'
                }`}
                title={wishlisted ? 'Remover da lista de desejos' : 'Salvar na lista de desejos'}
              >
                <Heart size={20} className={wishlisted ? 'fill-current' : ''} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Truck size={18} />, text: 'Frete grátis acima de R$ 299' },
              { icon: <RotateCcw size={18} />, text: 'Troca em 30 dias' },
              { icon: <Shield size={18} />, text: 'Compra 100% segura' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-1.5 text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
                <span className="text-primary-500">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* PRODUTOS RELACIONADOS */}
      {related.length > 0 && (
        <section className="mt-14 border-t pt-10">
          <h2 className="text-xl font-black mb-6">Você também pode gostar</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
