'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Package, Users, DollarSign, Clock, Calendar, ArrowUp, ArrowDown, Minus } from 'lucide-react';
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

      {/* Métricas do mês */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-primary-500" />
          <h2 className="font-black">Este mês</h2>
          <span className="text-xs text-gray-400 ml-auto">
            {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Pedidos hoje</p>
            <p className="text-2xl font-black">{data.ordersToday}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Receita hoje</p>
            <p className="text-2xl font-black text-green-600">
              R$ {(data.revenueToday || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Pedidos no mês</p>
            <p className="text-2xl font-black">{data.ordersThisMonth}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Receita no mês</p>
            <p className="text-2xl font-black text-green-600">
              R$ {(data.revenueThisMonth || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            {data.revenueLastMonth > 0 && (() => {
              const diff = data.revenueThisMonth - data.revenueLastMonth;
              const pct = Math.abs((diff / data.revenueLastMonth) * 100).toFixed(0);
              return (
                <p className={`text-xs font-semibold flex items-center justify-center gap-0.5 mt-0.5 ${diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {diff > 0 ? <ArrowUp size={11} /> : diff < 0 ? <ArrowDown size={11} /> : <Minus size={11} />}
                  {diff !== 0 ? `${pct}% vs mês anterior` : 'igual ao mês anterior'}
                </p>
              );
            })()}
          </div>
        </div>
      </div>

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

    </div>
  );
}
