'use client';
import { useEffect, useState } from 'react';
import { ShoppingBag, Package, Users, DollarSign } from 'lucide-react';
import api from '@/lib/api';

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setData(r.data)).catch(() => {});
  }, []);

  if (!data) return <div className="text-gray-400">Carregando...</div>;

  const cards = [
    { label: 'Pedidos totais', value: data.totalOrders, icon: <ShoppingBag size={20} />, color: 'bg-blue-500' },
    { label: 'Receita (pago)', value: `R$ ${(data.totalRevenue || 0).toFixed(2).replace('.', ',')}`, icon: <DollarSign size={20} />, color: 'bg-green-500' },
    { label: 'Produtos ativos', value: data.totalProducts, icon: <Package size={20} />, color: 'bg-purple-500' },
    { label: 'Clientes', value: data.totalUsers, icon: <Users size={20} />, color: 'bg-orange-500' },
  ];

  const statusLabel = { PENDING: 'Pendente', PAID: 'Pago', PROCESSING: 'Processando', SHIPPED: 'Enviado', DELIVERED: 'Entregue', CANCELLED: 'Cancelado' };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.label} className="card p-5 flex items-center gap-4">
            <div className={`${card.color} text-white p-3 rounded-xl`}>{card.icon}</div>
            <div>
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className="text-xl font-black">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-black mb-4">Pedidos recentes</h2>
          <div className="space-y-3">
            {data.recentOrders.map(o => (
              <div key={o.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold">#{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-gray-400 text-xs">{o.user.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">R$ {o.total.toFixed(2).replace('.', ',')}</p>
                  <p className="text-xs text-gray-400">{statusLabel[o.status]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-black mb-4">Produtos mais vendidos</h2>
          <div className="space-y-3">
            {data.topProducts.map((tp, i) => (
              <div key={tp.productId} className="flex items-center gap-3 text-sm">
                <span className="text-gray-400 w-5">{i + 1}.</span>
                <p className="flex-1 truncate">{tp.product?.name || 'Produto'}</p>
                <span className="font-bold text-primary-500">{tp._sum.quantity} vendidos</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
