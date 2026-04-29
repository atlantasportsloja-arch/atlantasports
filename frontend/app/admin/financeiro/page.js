'use client';
import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
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


export default function FinanceiroPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products/admin/financeiro')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 animate-pulse p-8">Carregando...</div>;
  if (!data) return <div className="text-red-500 p-8">Erro ao carregar dados.</div>;

  const { products, totalCusto, totalReceita, totalLucro, margemMedia, totalReceitaReal, totalLucroReal, totalVendaEstoque } = data;
  const semCusto = products.filter(p => p.costPrice == null).length;
  const comCusto = products.length - semCusto;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black">📊 Painel Financeiro</h1>
        {semCusto > 0 && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-xs px-3 py-2 rounded-lg">
            <AlertCircle size={14} />
            {semCusto} produto(s) sem preço de custo
          </div>
        )}
      </div>

      {/* Receita real */}
      <div className="grid grid-cols-2 gap-4">
        <Card icon={<DollarSign size={20} />} label="Receita real (pedidos pagos)" value={`R$ ${fmt(totalReceitaReal)}`} sub="vendas confirmadas" color="text-green-600" />
        <Card icon={<TrendingUp size={20} />} label="Lucro real estimado" value={semCusto > 0 ? `R$ ${fmt(totalLucroReal)}` : '—'} sub={semCusto > 0 ? `${semCusto} prod. sem custo` : 'baseado nos custos cadastrados'} color="text-primary-500" />
      </div>

      {/* Valor total em estoque */}
      <div className="card p-6">
        <h2 className="font-black text-sm text-gray-500 uppercase tracking-wide mb-4">Valor total em estoque</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-50 text-red-500"><DollarSign size={22} /></div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Valor de custo investido</p>
              <p className="text-2xl font-black text-red-500">R$ {fmt(totalCusto ?? 0)}</p>
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
              <p className="text-2xl font-black text-blue-600">R$ {fmt(totalVendaEstoque ?? 0)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{products.length} produto(s) · se vender tudo em estoque</p>
            </div>
          </div>
        </div>
        {totalCusto > 0 && (
          <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Lucro potencial</p>
              <p className={`text-lg font-black ${totalLucro >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                R$ {fmt(totalLucro)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Margem média</p>
              <p className="text-lg font-black text-primary-500">{margemMedia ? `${margemMedia}%` : '—'}</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
