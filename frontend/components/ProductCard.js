'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore, useCartStore } from '@/lib/store';

export default function ProductCard({ product }) {
  const { token } = useAuthStore();
  const { setCart } = useCartStore();

  async function addToCart(e) {
    e.preventDefault();
    if (!token) { toast.error('Faça login para adicionar ao carrinho'); return; }
    try {
      await api.post('/cart', { productId: product.id, quantity: 1 });
      const { data } = await api.get('/cart');
      setCart(data.items, data.total);
      toast.success('Adicionado ao carrinho!');
    } catch {
      toast.error('Erro ao adicionar');
    }
  }

  const avgRating = product.reviews?.length
    ? (product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length).toFixed(1)
    : null;

  return (
    <Link href={`/produto/${product.slug}`} className="card group overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">👕</div>
        )}
        {product.comparePrice && (
          <span className="absolute top-2 left-2 bg-primary-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{Math.round((1 - product.price / product.comparePrice) * 100)}%
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1 gap-2">
        <p className="text-xs text-gray-400 uppercase tracking-wide">{product.category?.name}</p>
        <h3 className="font-semibold text-gray-900 line-clamp-2 leading-snug">{product.name}</h3>

        {avgRating && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Star size={12} className="fill-yellow-400 text-yellow-400" />
            <span>{avgRating}</span>
            <span>({product.reviews.length})</span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between">
          <div>
            <p className="text-lg font-black text-gray-900">
              R$ {product.price.toFixed(2).replace('.', ',')}
            </p>
            {product.comparePrice && (
              <p className="text-xs text-gray-400 line-through">
                R$ {product.comparePrice.toFixed(2).replace('.', ',')}
              </p>
            )}
          </div>
          <button
            onClick={addToCart}
            className="bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-lg transition-colors"
            title="Adicionar ao carrinho"
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </Link>
  );
}
