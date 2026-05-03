'use client';
import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, DollarSign, AlertCircle, ArrowUpDown, Download, Calendar } from 'lucide-react';
import api from '@/lib/api';

function fmt(v) { return Number(v).toFixed(2).replace('.', ','); }

function Card({ icon, label, value, sub, color = 'text-gray-900' }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-gray-100 ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className={`text-xl font-black ${color}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

const SORT_OPTS = [
  { key: 'receitaVendas', label: 'Receita' },
  { key: 'qtdVendida', label: 'Qtd. vendida' },
  { key: 'lucroVendas', label: 'Lucro' },
  { key: 'margem', label: 'Margem %' },
  { key: 'estoqueEfetivo', label: 'Estoque' },
];

const PERIODS = [
  { key: 'tudo', label: 'Todo período' },
  { key: 'hoje', label: 'Hoje' },
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: 'mes', label: 'Este mês' },
  { key: 'mes_anterior', label: 'Mês anterior' },
  { key: 'custom', label: 'Personalizado' },
];

export default function FinanceiroPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('receitaVendas');
  const [sortDir, setSortDir] = useState('desc');
  const [period, setPeriod] = useState('tudo');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const fetchData = useCallback(async (p, from, to) => {
    setLoading(true);
    try {
      const params = p !== 'tudo' && p !== 'custom' ? { period: p } : {};
      if (p === 'custom') {
        if (from) params.from = from;
        if (to) params.to = to;
      }
      const r = await api.get('/products/admin/financeiro', { params });
      setData(r.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period, customFrom, customTo);
  }, [period, fetchData]);

  function applyCustom() {
    fetchData('custom', customFrom, customTo);
  }

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const sortedProducts = data ? [...data.products].sort((a, b) => {
    const va = a[sortKey] ?? -Infinity;
    const vb = b[sortKey] ?? -Infinity;
    return sortDir === 'desc' ? vb - va : va - vb;
  }) : [];

  const byCategory = data ? (() => {
    const map = {};
    data.products.forEach(p => {
      const cats = p.categories?.length ? p.categories : [{ id: '__sem__', name: 'Sem categoria' }];
      cats.forEach(c => {
        if (!map[c.id]) map[c.id] = { name: c.name, receita: 0, lucro: 0, qtd: 0, count: 0 };
        map[c.id].receita += p.receitaVendas || 0;
        map[c.id].lucro += p.lucroVendas || 0;
        map[c.id].qtd += p.qtdVendida || 0;
        map[c.id].count += 1;
      });
    });
    return Object.values(map).sort((a, b) => b.receita - a.receita);
  })() : [];

  const semCusto = data ? data.products.filter(p => p.costPrice == null).length : 0;
  const comCusto = data ? data.products.length - semCusto : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black">📊 Painel Financeiro</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {semCusto > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-xs px-3 py-2 rounded-lg">
              <AlertCircle size={14} />
              {semCusto} produto(s) sem preço de custo
            </div>
          )}
        </div>
      </div>

      {/* Seletor de período */}
      <div className="card p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Calendar size={16} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-600">Período:</span>
          <div className="flex flex-wrap gap-1.5">
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                  period === p.key
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {period === 'custom' && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <input
              type="date"
              className="input text-sm py-1.5 w-auto"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
            />
            <span className="text-gray-400 text-sm">até</span>
            <input
              type="date"
              className="input text-sm py-1.5 w-auto"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
            />
            <button
              onClick={applyCustom}
              className="btn-primary text-sm py-1.5 px-4"
            >
              Aplicar
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-gray-400 animate-pulse p-8 text-center">Carregando...</div>
      ) : !data ? (
        <div className="text-red-500 p-8">Erro ao carregar dados.</div>
      ) : (
        <>
          {/* Receita real */}
          <div className="grid grid-cols-2 gap-4">
            <Card icon={<DollarSign size={20} />} label="Receita real (pedidos pagos)" value={`R$ ${fmt(data.totalReceitaReal)}`} sub="vendas confirmadas" color="text-green-600" />
            <Card icon={<TrendingUp size={20} />} label="Lucro real estimado" value={semCusto > 0 ? `R$ ${fmt(data.totalLucroReal)}` : `R$ ${fmt(data.totalLucroReal)}`} sub={semCusto > 0 ? `${semCusto} prod. sem custo` : 'baseado nos custos cadastrados'} color="text-primary-500" />
          </div>

          {/* Valor total em estoque — apenas em "todo período" */}
          {period === 'tudo' && (
            <div className="card p-6">
              <h2 className="font-black text-sm text-gray-500 uppercase tracking-wide mb-4">Valor total em estoque</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-red-50 text-red-500"><DollarSign size={22} /></div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Valor de custo investido</p>
                    <p className="text-2xl font-black text-red-500">R$ {fmt(data.totalCusto ?? 0)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {comCusto > 0
                        ? `baseado em ${comCusto} produto(s) com custo cadastrado`
                        : 'nenhum produto com custo cadastrado'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-50 text-blue-500"><DollarSign size={22} /></div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Valor para venda (todos os produtos)</p>
                    <p className="text-2xl font-black text-blue-600">R$ {fmt(data.totalVendaEstoque ?? 0)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{data.products.length} produto(s) · se vender tudo em estoque</p>
                  </div>
                </div>
              </div>
              {data.totalCusto > 0 && (
                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Lucro potencial</p>
                    <p className={`text-lg font-black ${data.totalLucro >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      R$ {fmt(data.totalLucro)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Margem média</p>
                    <p className="text-lg font-black text-primary-500">{data.margemMedia ? `${data.margemMedia}%` : '—'}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Resumo por categoria */}
          {byCategory.length > 0 && byCategory.some(c => c.receita > 0) && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="font-black text-sm">Receita por categoria</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {['Categoria', 'Produtos', 'Qtd. vendida', 'Receita', 'Lucro estimado'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-semibold text-gray-500 text-xs whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {byCategory.map(c => (
                      <tr key={c.name} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold">{c.name}</td>
                        <td className="px-4 py-3 text-gray-500">{c.count}</td>
                        <td className="px-4 py-3">{c.qtd}</td>
                        <td className="px-4 py-3 font-semibold text-green-600">{c.receita > 0 ? `R$ ${fmt(c.receita)}` : '—'}</td>
                        <td className="px-4 py-3 text-primary-600">{c.lucro > 0 ? `R$ ${fmt(c.lucro)}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tabela por produto */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between flex-wrap gap-3">
              <h2 className="font-black text-sm">Desempenho por produto</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const rows = [['Produto', 'Vendidos', 'Receita (R$)', 'Custo/un. (R$)', 'Lucro/un. (R$)', 'Margem (%)', 'Estoque']];
                    sortedProducts.forEach(p => rows.push([
                      p.name,
                      p.qtdVendida || 0,
                      (p.receitaVendas || 0).toFixed(2).replace('.', ','),
                      p.costPrice != null ? p.costPrice.toFixed(2).replace('.', ',') : '',
                      p.lucro != null ? p.lucro.toFixed(2).replace('.', ',') : '',
                      p.margem != null ? p.margem : '',
                      p.estoqueEfetivo,
                    ]));
                    const periodLabel = PERIODS.find(p => p.key === period)?.label || period;
                    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
                    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `financeiro-${periodLabel}-${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-300 hover:border-gray-400 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Download size={13} /> CSV
                </button>
                {SORT_OPTS.map(o => (
                  <button
                    key={o.key}
                    onClick={() => toggleSort(o.key)}
                    className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                      sortKey === o.key
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {o.label}
                    {sortKey === o.key && <ArrowUpDown size={10} className="opacity-70" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Produto', 'Vendidos', 'Receita', 'Custo/un.', 'Lucro/un.', 'Margem', 'Estoque'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-gray-500 text-xs whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sortedProducts.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {p.images?.[0] && (
                            <img src={p.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                          )}
                          <span className="font-medium truncate max-w-[160px]">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold">{p.qtdVendida || 0}</td>
                      <td className="px-4 py-3 font-semibold text-green-600">
                        {p.receitaVendas > 0 ? `R$ ${fmt(p.receitaVendas)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {p.costPrice != null ? `R$ ${fmt(p.costPrice)}` : <span className="text-orange-400 text-xs">sem custo</span>}
                      </td>
                      <td className="px-4 py-3">
                        {p.lucro != null
                          ? <span className={p.lucro >= 0 ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>R$ {fmt(p.lucro)}</span>
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {p.margem != null
                          ? <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${p.margem >= 30 ? 'bg-green-100 text-green-700' : p.margem >= 10 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>{p.margem}%</span>
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${p.estoqueEfetivo === 0 ? 'text-red-500' : p.estoqueEfetivo <= 5 ? 'text-orange-500' : 'text-gray-700'}`}>
                          {p.estoqueEfetivo}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
