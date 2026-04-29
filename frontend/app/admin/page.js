'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ShoppingBag, Package, Users, DollarSign, Clock, Calendar, ArrowUp, ArrowDown, Minus, TrendingUp } from 'lucide-react';
import api from '@/lib/api';

const CHART_PERIODS = [
  { label: '7d', days: 7 },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
];

function SalesChart() {
  const [period, setPeriod] = useState(30);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    api.get('/admin/dashboard/chart', { params: { days: period } })
      .then(r => setChartData(r.data))
      .catch(() => setChartData([]))
      .finally(() => setLoading(false));
  }, [period]);

  const W = 600, H = 160, PAD_L = 52, PAD_R = 8, PAD_T = 12, PAD_B = 32;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  const maxRev = Math.max(...chartData.map(d => d.revenue), 1);
  const totalRev = chartData.reduce((s, d) => s + d.revenue, 0);
  const totalOrd = chartData.reduce((s, d) => s + d.orders, 0);

  const barW = Math.max(2, innerW / chartData.length - 2);
  const gap = innerW / chartData.length;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  function fmtR(v) { return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0); }
  function fmtDate(d) {
    const [, m, day] = d.split('-');
    return `${day}/${m}`;
  }

  const labelStep = period <= 7 ? 1 : period <= 14 ? 2 : 7;

  function handleMouseMove(e, i) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = rect.width / W;
    const x = (PAD_L + i * gap + gap / 2) * scaleX + rect.left;
    const y = rect.top;
    setTooltip({ i, x, y, d: chartData[i] });
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-primary-500" />
          <h2 className="font-black">Receita por dia</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400">Total no período</p>
            <p className="font-black text-primary-600">
              R$ {totalRev.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400">Pedidos</p>
            <p className="font-black">{totalOrd}</p>
          </div>
          <div className="flex gap-1">
            {CHART_PERIODS.map(p => (
              <button
                key={p.days}
                onClick={() => setPeriod(p.days)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  period === p.days
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-full h-32 bg-gray-100 rounded animate-pulse" />
        </div>
      ) : (
        <div className="relative" onMouseLeave={() => setTooltip(null)}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            style={{ height: 200 }}
          >
            {/* Grid lines + y labels */}
            {gridLines.map(pct => {
              const y = PAD_T + innerH * (1 - pct);
              return (
                <g key={pct}>
                  <line
                    x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}
                    stroke={pct === 0 ? '#d1d5db' : '#f3f4f6'}
                    strokeWidth={pct === 0 ? 1.5 : 1}
                  />
                  {pct > 0 && (
                    <text x={PAD_L - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#9ca3af">
                      {fmtR(maxRev * pct)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Bars */}
            {chartData.map((d, i) => {
              const barH = Math.max(d.revenue > 0 ? 2 : 0, (d.revenue / maxRev) * innerH);
              const x = PAD_L + i * gap + (gap - barW) / 2;
              const y = PAD_T + innerH - barH;
              const isHover = tooltip?.i === i;
              return (
                <rect
                  key={d.date}
                  x={x} y={y}
                  width={barW} height={barH}
                  rx={2}
                  fill={isHover ? '#d95e00' : '#f97316'}
                  opacity={d.revenue === 0 ? 0.25 : 1}
                  onMouseMove={e => handleMouseMove(e, i)}
                  style={{ cursor: 'pointer', transition: 'fill 0.1s' }}
                />
              );
            })}

            {/* X axis labels */}
            {chartData.map((d, i) => {
              if (i % labelStep !== 0 && i !== chartData.length - 1) return null;
              const x = PAD_L + i * gap + gap / 2;
              return (
                <text key={d.date} x={x} y={H - 4} textAnchor="middle" fontSize={9} fill="#9ca3af">
                  {fmtDate(d.date)}
                </text>
              );
            })}
          </svg>

          {/* Tooltip */}
          {tooltip && tooltip.d && (
            <div
              className="pointer-events-none fixed z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl -translate-x-1/2 -translate-y-full"
              style={{ left: tooltip.x, top: tooltip.y - 8 }}
            >
              <p className="font-bold mb-0.5">{fmtDate(tooltip.d.date)}</p>
              <p className="text-green-400 font-black">
                R$ {tooltip.d.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-gray-300">{tooltip.d.orders} pedido{tooltip.d.orders !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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

      {/* Gráfico de vendas */}
      <SalesChart />

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
