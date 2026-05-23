'use client';
import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, DollarSign, AlertCircle, Calendar } from 'lucide-react';
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

          {/* Valor total em vendas */}
          <div className="card p-6">
            <h2 className="font-black text-sm text-gray-500 uppercase tracking-wide mb-4">Valor total em vendas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-50 text-green-500"><DollarSign size={22} /></div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Receita bruta de vendas</p>
                  <p className="text-2xl font-black text-green-600">R$ {fmt(data.totalReceitaReal)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">pedidos pagos · sem frete</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-red-50 text-red-500"><DollarSign size={22} /></div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Custo dos produtos vendidos</p>
                  <p className="text-2xl font-black text-red-500">R$ {fmt(data.totalCustoVendas ?? 0)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {semCusto > 0 ? `${semCusto} produto(s) sem custo cadastrado` : 'baseado nos custos cadastrados'}
                  </p>
                </div>
              </div>
            </div>
            {data.totalCustoVendas > 0 && (
              <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Lucro real estimado</p>
                  <p className={`text-lg font-black ${data.totalLucroReal >= 0 ? 'text-primary-500' : 'text-red-500'}`}>
                    R$ {fmt(data.totalLucroReal)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Margem sobre vendas</p>
                  <p className="text-lg font-black text-gray-700">
                    {data.totalReceitaReal > 0
                      ? `${((data.totalLucroReal / data.totalReceitaReal) * 100).toFixed(1)}%`
                      : '—'}
                  </p>
                </div>
              </div>
            )}
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

        </>
      )}
    </div>
  );
}
