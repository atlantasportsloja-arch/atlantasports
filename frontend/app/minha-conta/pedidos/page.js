'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const statusLabel = {
  PENDING: { label: 'Aguardando pagamento', color: 'bg-yellow-100 text-yellow-700' },
  PAID: { label: 'Pago', color: 'bg-blue-100 text-blue-700' },
  PROCESSING: { label: 'Em processamento', color: 'bg-purple-100 text-purple-700' },
  SHIPPED: { label: 'Enviado', color: 'bg-orange-100 text-orange-700' },
  DELIVERED: { label: 'Entregue', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

export default function PedidosPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    api.get('/orders').then(r => setOrders(r.data)).catch(() => {});
  }, [token]);

  if (orders.length === 0) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">📦</div>
      <p className="text-xl font-semibold mb-2">Nenhum pedido ainda</p>
      <Link href="/" className="btn-primary">Começar a comprar</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black mb-6">Meus pedidos</h1>
      <div className="space-y-4">
        {orders.map(order => {
          const s = statusLabel[order.status] || statusLabel.PENDING;
          return (
            <div key={order.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-sm text-gray-500">Pedido #{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${s.color}`}>{s.label}</span>
              </div>
              <div className="space-y-1">
                {order.items.map(item => (
                  <p key={item.id} className="text-sm text-gray-600">
                    {item.product.name} × {item.quantity}
                  </p>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <p className="font-black text-lg">R$ {order.total.toFixed(2).replace('.', ',')}</p>
                {order.trackingCode && (
                  <p className="text-xs text-gray-500">Rastreio: <span className="font-mono font-semibold">{order.trackingCode}</span></p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
