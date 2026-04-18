'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ShoppingCart, Star, Truck, RotateCcw, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore, useCartStore } from '@/lib/store';

export default function ProdutoPage({ params }) {
  const { token } = useAuthStore();
  const { setCart } = useCartStore();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/products/${params.slug}`).then(r => setProduct(r.data)).catch(() => {});
  }, [params.slug]);

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

  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-400">
      <div className="animate-spin text-4xl">⏳</div>
    </div>
  );

  const avgRating = product.reviews?.length
    ? (product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length).toFixed(1)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-10">
        {/* IMAGENS */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
            {product.images?.[activeImg] ? (
              <Image src={product.images[activeImg]} alt={product.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl">👕</div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === activeImg ? 'border-primary-500' : 'border-transparent'
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
            <p className="text-sm text-primary-500 font-semibold uppercase">{product.category?.name}</p>
            <h1 className="text-3xl font-black mt-1">{product.name}</h1>
          </div>

          {avgRating && (
            <div className="flex items-center gap-2">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={16} className={s <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
              ))}
              <span className="text-sm text-gray-500">{avgRating} ({product.reviews.length} avaliações)</span>
            </div>
          )}

          <div>
            <p className="text-4xl font-black text-gray-900">
              R$ {product.price.toFixed(2).replace('.', ',')}
            </p>
            {product.comparePrice && (
              <p className="text-gray-400 line-through text-sm">
                R$ {product.comparePrice.toFixed(2).replace('.', ',')}
              </p>
            )}
            <p className="text-sm text-green-600 font-medium mt-1">
              ou 12x de R$ {(product.price / 12).toFixed(2).replace('.', ',')} sem juros
            </p>
          </div>

          <p className="text-gray-600 leading-relaxed">{product.description}</p>

          <div className="flex items-center gap-4">
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                className="px-3 py-3 hover:bg-gray-100 transition-colors font-bold"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
              >−</button>
              <span className="px-4 font-semibold">{quantity}</span>
              <button
                className="px-3 py-3 hover:bg-gray-100 transition-colors font-bold"
                onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
              >+</button>
            </div>
            <span className="text-sm text-gray-400">{product.stock} em estoque</span>
          </div>

          <button
            onClick={addToCart}
            disabled={loading || product.stock === 0}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <ShoppingCart size={20} />
            {product.stock === 0 ? 'Sem estoque' : loading ? 'Adicionando...' : 'Adicionar ao carrinho'}
          </button>

          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: <Truck size={18} />, text: 'Frete grátis acima de R$ 299' },
              { icon: <RotateCcw size={18} />, text: 'Troca em 30 dias' },
              { icon: <Shield size={18} />, text: 'Compra segura' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-1 text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
                <span className="text-primary-500">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AVALIAÇÕES */}
      {product.reviews?.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-black mb-6">Avaliações ({product.reviews.length})</h2>
          <div className="space-y-4">
            {product.reviews.map(r => (
              <div key={r.id} className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {r.user.name[0].toUpperCase()}
                  </div>
                  <span className="font-semibold text-sm">{r.user.name}</span>
                  <div className="flex ml-auto">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={12} className={s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                    ))}
                  </div>
                </div>
                {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
