'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore, useCartStore } from '@/lib/store';

export default function ListaDesejosPage() {
  const { token } = useAuthStore();
  const { setCart } = useCartStore();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    api.get('/wishlist')
      .then(r => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  async function remove(productId) {
    try {
      await api.delete(`/wishlist/${productId}`);
      setItems(prev => prev.filter(i => i.productId !== productId));
      toast.success('Removido da lista de desejos');
    } catch {
      toast.error('Erro ao remover');
    }
  }

  async function addToCart(productId) {
    try {
      await api.post('/cart', { productId, quantity: 1 });
      const { data } = await api.get('/cart');
      setCart(data.items, data.total);
      toast.success('Adicionado ao carrinho!');
    } catch {
      toast.error('Erro ao adicionar ao carrinho');
    }
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-20 text-center text-gray-400">Carregando...</div>
  );

  if (items.length === 0) return (
    <div className="max-w-5xl mx-auto px-4 py-20 text-center">
      <Heart size={56} className="mx-auto text-gray-200 mb-4" />
      <p className="text-xl font-semibold mb-2">Lista de desejos vazia</p>
      <p className="text-gray-400 mb-6 text-sm">Salve produtos para comprar depois</p>
      <Link href="/" className="btn-primary">Explorar produtos</Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black mb-8 flex items-center gap-2">
        <Heart size={24} className="text-red-500 fill-current" />
        Lista de desejos <span className="text-gray-400 font-normal text-lg">({items.length})</span>
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map(({ product, productId }) => (
          <div key={productId} className="card overflow-hidden group flex flex-col">
            <Link href={`/produto/${product.slug}`} className="relative aspect-square bg-gray-100 block overflow-hidden">
              {product.images?.[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">👕</div>
              )}
            </Link>

            <div className="p-3 flex flex-col flex-1 gap-2">
              <Link href={`/produto/${product.slug}`}>
                <p className="text-xs text-gray-400 uppercase">{product.categories?.[0]?.name}</p>
                <h3 className="font-semibold text-sm line-clamp-2 leading-snug hover:text-primary-500">{product.name}</h3>
              </Link>
              <p className="font-black text-gray-900">R$ {product.price.toFixed(2).replace('.', ',')}</p>

              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => addToCart(productId)}
                  disabled={product.stock === 0}
                  className="btn-primary flex-1 flex items-center justify-center gap-1 py-2 text-xs"
                >
                  <ShoppingCart size={14} />
                  {product.stock === 0 ? 'Indisponível' : 'Carrinho'}
                </button>
                <button
                  onClick={() => remove(productId)}
                  className="p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
