'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Star, Loader2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore, useCartStore } from '@/lib/store';
import { useConfig, pixPrice, fmt } from '@/lib/useConfig';

export default function ProductCard({ product, priority = false }) {
  const { pixDiscount } = useConfig();
  const { token } = useAuthStore();
  const { setCart } = useCartStore();
  const [adding, setAdding] = useState(false);
  const [imgError, setImgError] = useState(false);

  async function addToCart(e) {
    e.preventDefault();
    if (!token) { toast.error('Faça login para adicionar ao carrinho'); return; }
    setAdding(true);
    try {
      await api.post('/cart', { productId: product.id, quantity: 1 });
      const { data } = await api.get('/cart');
      setCart(data.items, data.total);
      toast.success('Adicionado ao carrinho!');
    } catch {
      toast.error('Erro ao adicionar');
    } finally {
      setAdding(false);
    }
  }

  const avgRating = product.reviews?.length
    ? (product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length).toFixed(1)
    : null;

  const discount = product.comparePrice
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : null;

  return (
    <Link href={`/produto/${product.slug}`} className="card group overflow-hidden flex flex-col hover:shadow-md transition-all duration-200">
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {product.images?.[0] && !imgError ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={priority}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">👕</div>
        )}

        {discount && (
          <span className="absolute top-2 left-2 bg-primary-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{discount}%
          </span>
        )}

        {product.isNew && (
          <span className="absolute top-2 right-2 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded">
            NOVO
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3 className="font-semibold text-gray-900 line-clamp-2 leading-snug">{product.name}</h3>

        {avgRating && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Star size={12} className="fill-yellow-400 text-yellow-400" />
            <span>{avgRating}</span>
            <span>({product.reviews.length})</span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="min-w-0">
            {product.comparePrice && (
              <p className="text-xs text-gray-400 line-through">
                R$ {product.comparePrice.toFixed(2).replace('.', ',')}
              </p>
            )}
            <div className="flex items-baseline gap-2 flex-wrap">
              <p className="text-base font-black text-gray-900 whitespace-nowrap">
                R$ {product.price.toFixed(2).replace('.', ',')}
              </p>
              {pixPrice(product.price, pixDiscount) && (
                <p className="text-sm font-black text-green-600 whitespace-nowrap">
                  PIX R$ {fmt(pixPrice(product.price, pixDiscount))}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={addToCart}
            disabled={adding}
            className="p-2.5 rounded-lg transition-all flex-shrink-0 bg-primary-500 hover:bg-primary-600 text-white hover:scale-105 active:scale-95"
            title="Adicionar ao carrinho"
          >
            {adding ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />}
          </button>
        </div>
      </div>
    </Link>
  );
}
