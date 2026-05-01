'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, Package, ShoppingBag, Users, Tag, Settings, Menu, X, ChevronRight, FolderOpen, TrendingUp, MessageSquare, Truck, Bell, Clock, Star } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

export default function AdminLayout({ children }) {
  const { user, init } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => { init(); }, []);
  useEffect(() => {
    if (user && user.role !== 'ADMIN') router.push('/');
  }, [user]);

  useEffect(() => {
    function fetchNotifs() {
      api.get('/admin/dashboard').then(r => {
        setPendingOrders(r.data.pendingOrders || 0);
        setRecentOrders(r.data.recentOrders || []);
      }).catch(() => {});
    }
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const totalNotifs = pendingOrders;

  const links = [
    { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { href: '/admin/produtos', label: 'Produtos', icon: <Package size={18} /> },
    { href: '/admin/categorias', label: 'Categorias', icon: <FolderOpen size={18} /> },
    { href: '/admin/pedidos', label: 'Pedidos', icon: <ShoppingBag size={18} />, badge: pendingOrders || null, badgeColor: 'bg-red-500' },
    { href: '/admin/financeiro', label: 'Financeiro', icon: <TrendingUp size={18} /> },
    { href: '/admin/usuarios', label: 'Usuários', icon: <Users size={18} /> },
    { href: '/admin/avaliacoes', label: 'Avaliações', icon: <Star size={18} /> },
    { href: '/admin/cupons', label: 'Cupons', icon: <Tag size={18} /> },
    { href: '/admin/frete', label: 'Frete', icon: <Truck size={18} /> },
    { href: '/admin/mensagens', label: 'Mensagens', icon: <MessageSquare size={18} /> },
    { href: '/admin/configuracoes', label: 'Configurações', icon: <Settings size={18} /> },
  ];

  const currentLabel = links.find(l => l.href === pathname)?.label || 'Admin';

  return (
    <div className="flex min-h-screen bg-gray-50">
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
          <div className="flex items-center gap-2">
            {/* Sino de notificações */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotif(v => !v)}
                className="relative p-1.5 text-gray-400 hover:text-white transition-colors"
                title="Notificações"
              >
                <Bell size={17} />
                {totalNotifs > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {totalNotifs > 9 ? '9+' : totalNotifs}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="absolute left-0 top-full mt-2 w-72 bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                    <p className="text-sm font-black">Notificações</p>
                    {totalNotifs === 0 && <span className="text-xs text-gray-400">Tudo em ordem</span>}
                  </div>

                  {pendingOrders > 0 && (
                    <Link href="/admin/pedidos" onClick={() => setShowNotif(false)}>
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b">
                        <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                          <Clock size={15} className="text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-red-600">{pendingOrders} pedido{pendingOrders > 1 ? 's' : ''} pendente{pendingOrders > 1 ? 's' : ''}</p>
                          <p className="text-xs text-gray-400">Aguardando confirmação</p>
                        </div>
                      </div>
                    </Link>
                  )}

                  {totalNotifs === 0 && (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">
                      Nenhuma notificação
                    </div>
                  )}
                </div>
              )}
            </div>

            <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X size={18} />
            </button>
          </div>
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
              {l.icon}
              <span className="flex-1">{l.label}</span>
              {l.badge && (
                <span className={`text-white text-xs font-bold px-1.5 py-0.5 rounded-full ${l.badgeColor} min-w-[20px] text-center`}>
                  {l.badge}
                </span>
              )}
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
          <div className="flex items-center gap-1.5 text-sm text-gray-500 flex-1">
            <span className="text-primary-500 font-bold">Admin</span>
            <ChevronRight size={14} />
            <span className="font-semibold text-gray-800">{currentLabel}</span>
          </div>
          {totalNotifs > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {totalNotifs}
            </span>
          )}
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
