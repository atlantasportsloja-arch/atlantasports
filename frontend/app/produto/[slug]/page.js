'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Star, Truck, RotateCcw, Shield, ChevronRight, Loader2, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore, useCartStore } from '@/lib/store';
import { useConfig, pixPrice, fmt } from '@/lib/useConfig';

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

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={28}
            className={s <= (hover || value) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ productId, onReviewSaved }) {
  const { token } = useAuthStore();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!token) return (
    <div className="card p-6 text-center text-gray-500 text-sm">
      <Link href="/login" className="text-primary-500 font-semibold hover:underline">Faça login</Link> para avaliar este produto.
    </div>
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (rating === 0) { toast.error('Selecione uma nota'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/reviews', { productId, rating, comment });
      toast.success('Avaliação enviada!');
      setRating(0);
      setComment('');
      onReviewSaved(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao enviar avaliação');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <h3 className="font-bold text-lg">Deixe sua avaliação</h3>
      <div>
        <p className="text-sm text-gray-500 mb-2">Sua nota</p>
        <StarPicker value={rating} onChange={setRating} />
      </div>
      <div>
        <label className="block text-sm text-gray-500 mb-1">Comentário <span className="text-gray-300">(opcional)</span></label>
        <textarea
          className="input resize-none"
          rows={3}
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="O que você achou do produto?"
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
        {loading ? <><Loader2 size={16} className="animate-spin" /> Enviando...</> : 'Enviar avaliação'}
      </button>
    </form>
  );
}

export default function ProdutoPage({ params }) {
  const { token } = useAuthStore();
  const { setCart } = useCartStore();
  const { pixDiscount } = useConfig();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    api.get(`/products/${params.slug}`).then(r => setProduct(r.data)).catch(() => {});
  }, [params.slug]);

  useEffect(() => {
    if (!token || !product) return;
    api.get('/wishlist')
      .then(r => setWishlisted(r.data.some(w => w.productId === product.id)))
      .catch(() => {});
  }, [token, product?.id]);

  async function addToCart() {
    if (!token) { toast.error('Faça login para continuar'); return; }
    setLoading(true);
    try {
      await api.post('/cart', { productId: product.id, quantity });
      const { data } = await api.get('/cart');
      setCart(data.items, data.total);
      toast.success('Adicionado ao carrinho!');
    } catch {
      toast.error('Erro ao adicionar ao carrinho');
    } finally {
      setLoading(false);
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

  function handleReviewSaved(newReview) {
    setProduct(p => ({
      ...p,
      reviews: p.reviews.some(r => r.userId === newReview.userId)
        ? p.reviews.map(r => r.userId === newReview.userId ? newReview : r)
        : [newReview, ...p.reviews],
    }));
  }

  if (!product) return <ProductSkeleton />;

  const avgRating = product.reviews?.length
    ? (product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length).toFixed(1)
    : null;

  const outOfStock = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-gray-600 transition-colors">Início</Link>
        <ChevronRight size={14} />
        {product.category && (
          <>
            <Link href={`/categoria/${product.category.slug}`} className="hover:text-gray-600 transition-colors capitalize">
              {product.category.name}
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
            {product.images?.[activeImg] ? (
              <Image
                src={product.images[activeImg]}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl">👕</div>
            )}
            {outOfStock && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="bg-white text-gray-700 font-bold px-4 py-2 rounded-full">Sem estoque</span>
              </div>
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
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* INFO */}
        <div className="space-y-5">
          <div>
            {product.category && (
              <Link href={`/categoria/${product.category.slug}`} className="text-sm text-primary-500 font-semibold uppercase hover:underline">
                {product.category.name}
              </Link>
            )}
            <h1 className="text-3xl font-black mt-1 leading-tight">{product.name}</h1>
          </div>

          {avgRating && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={16} className={s <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                ))}
              </div>
              <span className="text-sm text-gray-500">{avgRating} <span className="text-gray-300">·</span> {product.reviews.length} avaliações</span>
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

          {!outOfStock && (
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  className="px-3 py-3 hover:bg-gray-100 transition-colors font-bold text-lg"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                >−</button>
                <span className="px-5 font-semibold">{quantity}</span>
                <button
                  className="px-3 py-3 hover:bg-gray-100 transition-colors font-bold text-lg"
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                >+</button>
              </div>
              <div>
                {lowStock && (
                  <p className="text-xs text-orange-500 font-semibold">⚠️ Apenas {product.stock} em estoque</p>
                )}
                {!lowStock && (
                  <p className="text-sm text-gray-400">{product.stock} disponíveis</p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={addToCart}
              disabled={loading || outOfStock}
              className="btn-primary flex-1 flex items-center justify-center gap-2 py-4 text-base"
            >
              {loading
                ? <><Loader2 size={20} className="animate-spin" /> Adicionando...</>
                : outOfStock
                ? 'Produto indisponível'
                : <><ShoppingCart size={20} /> Adicionar ao carrinho</>
              }
            </button>

            <button
              onClick={toggleWishlist}
              disabled={wishlistLoading}
              className={`p-4 rounded-lg border-2 transition-all ${
                wishlisted
                  ? 'border-red-400 bg-red-50 text-red-500'
                  : 'border-gray-300 text-gray-400 hover:border-red-300 hover:text-red-400'
              }`}
              title={wishlisted ? 'Remover da lista de desejos' : 'Salvar na lista de desejos'}
            >
              <Heart size={22} className={wishlisted ? 'fill-current' : ''} />
            </button>
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

      {/* AVALIAÇÕES */}
      <section className="mt-14 border-t pt-10">
        <h2 className="text-xl font-black mb-6">
          Avaliações{product.reviews?.length > 0 ? ` (${product.reviews.length})` : ''}
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            {product.reviews?.length > 0 ? (
              product.reviews.map(r => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {r.user.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{r.user.name}</p>
                      <div className="flex">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={11} className={s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                        ))}
                      </div>
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>}
                </div>
              ))
            ) : (
              <div className="card p-6 text-center text-gray-400">
                <p className="font-medium">Nenhuma avaliação ainda</p>
                <p className="text-sm mt-1">Seja o primeiro a avaliar!</p>
              </div>
            )}
          </div>

          <ReviewForm productId={product.id} onReviewSaved={handleReviewSaved} />
        </div>
      </section>
    </div>
  );
}
