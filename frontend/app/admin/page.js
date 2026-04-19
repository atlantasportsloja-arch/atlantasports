'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Package, Users, DollarSign, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import api from '@/lib/api';

const STATUS_COLOR = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};
const STATUS_LABEL = { PENDING: 'Pendente', PAID: 'Pago', PROCESSING: 'Processando', SHIPPED: 'Enviado', DELIVERED: 'Entregue', CANCELLED: 'Cancelado' };

function SkeletonCard() {
  return <div className="card p-5 h-24 animate-pulse bg-gray-100" />;
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setData(r.data)).catch(() => {});
  }, []);

  if (!data) return (
    <div className="space-y-8">
      <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  const cards = [
    { label: 'Pedidos totais', value: data.totalOrders, icon: <ShoppingBag size={20} />, color: 'bg-blue-500', href: '/admin/pedidos' },
    { label: 'Receita confirmada', value: `R$ ${(data.totalRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: <DollarSign size={20} />, color: 'bg-green-500' },
    { label: 'Produtos ativos', value: data.totalProducts, icon: <Package size={20} />, color: 'bg-purple-500', href: '/admin/produtos' },
    { label: 'Clientes', value: data.totalUsers, icon: <Users size={20} />, color: 'bg-orange-500', href: '/admin/usuarios' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Dashboard</h1>
        <span className="text-sm text-gray-400">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
      </div>

      {/* Alertas */}
      {(data.pendingOrders > 0 || data.lowStockProducts?.length > 0) && (
        <div className="space-y-3">
          {data.pendingOrders > 0 && (
            <Link href="/admin/pedidos?status=PENDING" className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 hover:bg-yellow-100 transition-colors">
              <Clock size={20} className="text-yellow-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-yellow-800 text-sm">
                  {data.pendingOrders} {data.pendingOrders === 1 ? 'pedido aguardando' : 'pedidos aguardando'} pagamento
                </p>
                <p className="text-xs text-yellow-600">Clique para ver os pedidos pendentes</p>
              </div>
              <span className="text-yellow-600 text-xs font-semibold">Ver →</span>
            </Link>
          )}
          {data.lowStockProducts?.length > 0 && (
            <Link href="/admin/produtos" className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 hover:bg-red-100 transition-colors">
              <AlertTriangle size={20} className="text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-red-800 text-sm">
                  {data.lowStockProducts.length} {data.lowStockProducts.length === 1 ? 'produto com estoque baixo' : 'produtos com estoque baixo'}
                </p>
                <p className="text-xs text-red-600">
                  {data.lowStockProducts.slice(0, 3).map(p => p.name).join(', ')}{data.lowStockProducts.length > 3 ? '...' : ''}
                </p>
              </div>
              <span className="text-red-600 text-xs font-semibold">Ver →</span>
            </Link>
          )}
        </div>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(card => {
          const inner = (
            <div className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`${card.color} text-white p-3 rounded-xl flex-shrink-0`}>{card.icon}</div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{card.label}</p>
                <p className="text-xl font-black truncate">{card.value}</p>
              </div>
            </div>
          );
          return card.href
            ? <Link key={card.label} href={card.href}>{inner}</Link>
            : <div key={card.label}>{inner}</div>;
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Pedidos recentes */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black">Pedidos recentes</h2>
            <Link href="/admin/pedidos" className="text-xs text-primary-500 hover:underline font-semibold">Ver todos →</Link>
          </div>
          <div className="space-y-3">
            {data.recentOrders.map(o => (
              <div key={o.id} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm font-mono">#{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-gray-400 text-xs truncate max-w-[150px]">{o.user.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">R$ {o.total.toFixed(2).replace('.', ',')}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status]}`}>
                    {STATUS_LABEL[o.status]}
                  </span>
                </div>
              </div>
            ))}
            {data.recentOrders.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">Nenhum pedido ainda</p>
            )}
          </div>
        </div>

        {/* Produtos mais vendidos */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black">Mais vendidos</h2>
            <TrendingUp size={16} className="text-green-500" />
          </div>
          <div className="space-y-3">
            {data.topProducts.map((tp, i) => (
              <div key={tp.productId} className="flex items-center gap-3">
                <span className="text-gray-400 font-bold w-5 text-sm">{i + 1}</span>
                <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {tp.product?.images?.[0] ? (
                    <Image src={tp.product.images[0]} alt={tp.product.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm">📦</div>
                  )}
                </div>
                <p className="flex-1 text-sm truncate">{tp.product?.name || 'Produto'}</p>
                <span className="font-bold text-primary-500 text-sm flex-shrink-0">{tp._sum.quantity} un.</span>
              </div>
            ))}
            {data.topProducts.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">Sem dados de vendas</p>
            )}
          </div>
        </div>
      </div>

      {/* Estoque baixo */}
      {data.lowStockProducts?.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-red-500" />
            <h2 className="font-black">Estoque baixo</h2>
            <span className="ml-auto text-xs text-gray-400">≤ 5 unidades</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {data.lowStockProducts.map(p => (
              <div key={p.id} className="text-center">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                  {p.images?.[0] ? (
                    <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                  )}
                </div>
                <p className="text-xs font-medium truncate">{p.name}</p>
                <p className={`text-sm font-black ${p.stock === 0 ? 'text-red-600' : 'text-orange-500'}`}>
                  {p.stock === 0 ? 'Esgotado' : `${p.stock} restantes`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
