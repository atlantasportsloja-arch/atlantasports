'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingBag, Users, Tag, Settings } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

const links = [
  { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { href: '/admin/produtos', label: 'Produtos', icon: <Package size={18} /> },
  { href: '/admin/pedidos', label: 'Pedidos', icon: <ShoppingBag size={18} /> },
  { href: '/admin/usuarios', label: 'Usuários', icon: <Users size={18} /> },
  { href: '/admin/cupons', label: 'Cupons', icon: <Tag size={18} /> },
  { href: '/admin/configuracoes', label: 'Configurações', icon: <Settings size={18} /> },
];

export default function AdminLayout({ children }) {
  const { user, init } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') router.push('/');
  }, [user]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <p className="text-sm font-black text-primary-500">ATLANTA SPORTS</p>
          <p className="text-xs text-gray-400">Painel Admin</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === l.href ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {l.icon} {l.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <Link href="/" className="text-xs text-gray-500 hover:text-white">← Voltar à loja</Link>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
