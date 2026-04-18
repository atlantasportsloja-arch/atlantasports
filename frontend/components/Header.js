'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ShoppingCart, User, Menu, X, Search } from 'lucide-react';
import { useAuthStore, useCartStore } from '@/lib/store';
import api from '@/lib/api';

export default function Header() {
  const { user, token, init, logout } = useAuthStore();
  const { setCart, count } = useCartStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { init(); }, []);

  useEffect(() => {
    if (!token) return;
    api.get('/cart').then(r => setCart(r.data.items, r.data.total)).catch(() => {});
  }, [token]);

  const cartCount = count();

  return (
    <header className="bg-gray-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16 gap-4">
        <Link href="/" className="text-xl font-black tracking-tight text-primary-500">
          ATLANTA<span className="text-white">SPORTS</span>
        </Link>

        <form
          className="hidden md:flex flex-1 max-w-md"
          onSubmit={(e) => { e.preventDefault(); window.location.href = `/busca?q=${search}`; }}
        >
          <div className="relative w-full">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar produtos..."
              className="w-full rounded-lg pl-4 pr-10 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
              <Search size={18} />
            </button>
          </div>
        </form>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/categoria/camisas" className="hover:text-primary-500 transition-colors">Camisas</Link>
          <Link href="/categoria/tenis" className="hover:text-primary-500 transition-colors">Tênis</Link>
          <Link href="/categoria/acessorios" className="hover:text-primary-500 transition-colors">Acessórios</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/carrinho" className="relative">
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative group">
              <button className="flex items-center gap-1 hover:text-primary-500">
                <User size={22} />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white text-gray-900 rounded-xl shadow-lg border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                <Link href="/minha-conta" className="block px-4 py-3 hover:bg-gray-50 rounded-t-xl text-sm">Minha Conta</Link>
                <Link href="/minha-conta/pedidos" className="block px-4 py-3 hover:bg-gray-50 text-sm">Meus Pedidos</Link>
                {user.role === 'ADMIN' && (
                  <Link href="/admin" className="block px-4 py-3 hover:bg-gray-50 text-sm text-primary-500 font-semibold">Painel Admin</Link>
                )}
                <button onClick={logout} className="block w-full text-left px-4 py-3 hover:bg-gray-50 rounded-b-xl text-sm text-red-500">
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <Link href="/login" className="text-sm font-semibold hover:text-primary-500">
              Entrar
            </Link>
          )}

          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-gray-800 px-4 py-4 flex flex-col gap-4 text-sm font-medium">
          <Link href="/categoria/camisas" onClick={() => setMenuOpen(false)}>Camisas</Link>
          <Link href="/categoria/tenis" onClick={() => setMenuOpen(false)}>Tênis</Link>
          <Link href="/categoria/acessorios" onClick={() => setMenuOpen(false)}>Acessórios</Link>
        </div>
      )}
    </header>
  );
}
