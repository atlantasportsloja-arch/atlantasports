'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Package, ShoppingBag, Users, Tag, Settings, Menu, X, ChevronRight, FolderOpen } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

const links = [
  { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { href: '/admin/produtos', label: 'Produtos', icon: <Package size={18} /> },
  { href: '/admin/categorias', label: 'Categorias', icon: <FolderOpen size={18} /> },
  { href: '/admin/pedidos', label: 'Pedidos', icon: <ShoppingBag size={18} /> },
  { href: '/admin/usuarios', label: 'Usuários', icon: <Users size={18} /> },
  { href: '/admin/cupons', label: 'Cupons', icon: <Tag size={18} /> },
  { href: '/admin/configuracoes', label: 'Configurações', icon: <Settings size={18} /> },
];

export default function AdminLayout({ children }) {
  const { user, init } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { init(); }, []);
  useEffect(() => {
    if (user && user.role !== 'ADMIN') router.push('/');
  }, [user]);

  const currentLabel = links.find(l => l.href === pathname)?.label || 'Admin';

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-56 bg-gray-900 text-white flex flex-col transform transition-transform duration-200 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-primary-500">ATLANTA SPORTS</p>
            <p className="text-xs text-gray-400">Painel Admin</p>
          </div>
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === l.href
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {l.icon} {l.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800 space-y-2">
          <Link href="/" className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
            ← Voltar à loja
          </Link>
          {user && (
            <p className="text-xs text-gray-600 truncate">{user.email}</p>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar mobile */}
        <header className="lg:hidden bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:text-gray-900">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <span className="text-primary-500 font-bold">Admin</span>
            <ChevronRight size={14} />
            <span className="font-semibold text-gray-800">{currentLabel}</span>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
