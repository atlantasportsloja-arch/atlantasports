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
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { init(); }, []);

  useEffect(() => {
    if (!token) return;
    api.get('/cart').then(r => setCart(r.data.items, r.data.total)).catch(() => {});
  }, [token]);

  const cartCount = count();

  function handleSearch(e) {
    e.preventDefault();
    if (!search.trim()) return;
    window.location.href = `/busca?q=${encodeURIComponent(search.trim())}`;
  }

  return (
    <header className="bg-gray-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16 gap-4">
        <Link href="/" className="text-xl font-black tracking-tight text-primary-500 flex-shrink-0">
          ATLANTA<span className="text-white">SPORTS</span>
        </Link>

        {/* Busca desktop */}
        <form className="hidden md:flex flex-1 max-w-md" onSubmit={handleSearch}>
          <div className="relative w-full">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar produtos..."
              className="w-full rounded-lg pl-4 pr-10 py-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <Search size={18} />
            </button>
          </div>
        </form>


        <div className="flex items-center gap-3">
          {/* Busca mobile */}
          <button
            className="md:hidden text-gray-300 hover:text-white transition-colors"
            onClick={() => { setSearchOpen(s => !s); setMenuOpen(false); }}
          >
            <Search size={22} />
          </button>

          {/* Carrinho */}
          <Link href="/carrinho" className="relative text-gray-300 hover:text-white transition-colors">
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>

          {/* Usuário */}
          {user ? (
            <div className="relative group hidden md:block">
              <button className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-sm font-bold">
                  {user.name?.[0]?.toUpperCase() || <User size={16} />}
                </div>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white text-gray-900 rounded-xl shadow-xl border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-sm truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <Link href="/minha-conta" className="block px-4 py-2.5 hover:bg-gray-50 text-sm">👤 Minha Conta</Link>
                <Link href="/minha-conta/pedidos" className="block px-4 py-2.5 hover:bg-gray-50 text-sm">🛒 Meus Pedidos</Link>
                <Link href="/lista-desejos" className="block px-4 py-2.5 hover:bg-gray-50 text-sm">❤️ Lista de Desejos</Link>
                {user.role === 'ADMIN' && (
                  <Link href="/admin" className="block px-4 py-2.5 hover:bg-gray-50 text-sm text-primary-500 font-semibold">Painel Admin</Link>
                )}
                <button onClick={logout} className="block w-full text-left px-4 py-2.5 hover:bg-gray-50 rounded-b-xl text-sm text-red-500 border-t border-gray-100">
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <Link href="/login" className="hidden md:block text-sm font-semibold text-gray-300 hover:text-white transition-colors">
              Entrar
            </Link>
          )}

          {/* Hamburguer mobile */}
          <button className="md:hidden text-gray-300 hover:text-white transition-colors" onClick={() => { setMenuOpen(m => !m); setSearchOpen(false); }}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Busca mobile expandida */}
      {searchOpen && (
        <div className="md:hidden bg-gray-800 px-4 py-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar produtos..."
                className="w-full rounded-lg pl-4 pr-10 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={18} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Menu mobile */}
      {menuOpen && (
        <div className="md:hidden bg-gray-800 px-4 py-4 flex flex-col gap-1 text-sm font-medium">
          <div className="border-t border-gray-700 mt-2 pt-2">
            {user ? (
              <>
                <Link href="/minha-conta" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-primary-400">👤 Minha Conta</Link>
                <Link href="/minha-conta/pedidos" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-primary-400">🛒 Meus Pedidos</Link>
                <Link href="/lista-desejos" onClick={() => setMenuOpen(false)} className="block py-2 hover:text-primary-400">❤️ Lista de Desejos</Link>
                {user.role === 'ADMIN' && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)} className="block py-2 text-primary-400 font-semibold">Painel Admin</Link>
                )}
                <button onClick={() => { logout(); setMenuOpen(false); }} className="block py-2 text-red-400">Sair</button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMenuOpen(false)} className="block py-2 text-primary-400 font-semibold">Entrar / Cadastrar</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
