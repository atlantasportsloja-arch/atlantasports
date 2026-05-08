'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingCart, User } from 'lucide-react';
import { useCartStore, useAuthStore } from '@/lib/store';

export default function BottomNav() {
  const pathname = usePathname();
  const { count } = useCartStore();
  const { user } = useAuthStore();
  const cartCount = count();

  if (pathname?.startsWith('/admin')) return null;
  if (pathname?.startsWith('/checkout')) return null;

  const links = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/busca', label: 'Busca', icon: Search },
    {
      href: '/carrinho',
      label: 'Carrinho',
      icon: ShoppingCart,
      badge: cartCount > 0 ? cartCount : null,
    },
    {
      href: user ? '/minha-conta' : '/login',
      label: user ? 'Conta' : 'Entrar',
      icon: User,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around h-16 px-2">
        {links.map(link => {
          const Icon = link.icon;
          const isActive =
            link.href === '/'
              ? pathname === '/'
              : pathname?.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors rounded-xl ${
                isActive ? 'text-primary-500' : 'text-gray-400'
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {link.badge && (
                  <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {link.badge > 9 ? '9+' : link.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold leading-none ${isActive ? 'text-primary-500' : 'text-gray-400'}`}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
