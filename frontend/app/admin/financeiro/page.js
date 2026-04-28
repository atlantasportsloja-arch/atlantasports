'use client';
import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Package, AlertCircle } from 'lucide-react';
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

function MargemBadge({ margem }) {
  if (margem == null) return <span className="text-gray-300 text-xs">—</span>;
  const color = margem >= 40 ? 'bg-green-100 text-green-700'
    : margem >= 20 ? 'bg-yellow-100 text-yellow-700'
    : 'bg-red-100 text-red-700';
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{margem}%</span>;
}

export default function FinanceiroPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('lucro');

  useEffect(() => {
    api.get('/products/admin/financeiro')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 animate-pulse p-8">Carregando...</div>;
  if (!data) return <div className="text-red-500 p-8">Erro ao carregar dados.</div>;

  const { products, totalCusto, totalReceita, totalLucro, margemMedia, totalReceitaReal, totalLucroReal } = data;
  const semCusto = products.filter(p => p.costPrice == null).length;

  const sorted = [...products].sort((a, b) => {
    if (sort === 'lucro') return (b.lucro ?? -Infinity) - (a.lucro ?? -Infinity);
    if (sort === 'margem') return (b.margem ?? -Infinity) - (a.margem ?? -Infinity);
    if (sort === 'preco') return b.price - a.price;
    if (sort === 'vendas') return (b.qtdVendida ?? 0) - (a.qtdVendida ?? 0);
    return a.name.localeCompare(b.name);
  });

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

      {/* Cards potencial de estoque */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={<DollarSign size={20} />} label="Custo total em estoque" value={`R$ ${fmt(totalCusto)}`} sub="valor investido" color="text-red-500" />
        <Card icon={<DollarSign size={20} />} label="Receita potencial" value={`R$ ${fmt(totalReceita)}`} sub="se vender tudo" color="text-blue-500" />
        <Card icon={<TrendingUp size={20} />} label="Lucro potencial" value={`R$ ${fmt(totalLucro)}`} sub="receita − custo" color="text-green-600" />
        <Card icon={<Package size={20} />} label="Margem média" value={margemMedia ? `${margemMedia}%` : '—'} sub="sobre o preço de venda" color="text-primary-500" />
      </div>

      {/* Tabela por produto */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-black">Produtos</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Ordenar por:</span>
            <select className="border border-gray-300 rounded-lg px-2 py-1 text-sm" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="lucro">Maior lucro</option>
              <option value="margem">Maior margem</option>
              <option value="preco">Maior preço</option>
              <option value="vendas">Mais vendidos</option>
              <option value="nome">Nome A–Z</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Produto', 'Categoria', 'Preço venda', 'Preço custo', 'Lucro unit.', 'Margem', 'Estoque', 'Lucro total', 'Qtd vendida', 'Receita vendas'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-500 whitespace-nowrap text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {sorted.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium max-w-[180px] truncate">{p.name}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.category?.name || '—'}</td>
                  <td className="px-4 py-3 font-bold text-blue-600">R$ {fmt(p.price)}</td>
                  <td className="px-4 py-3 text-red-500">
                    {p.costPrice != null ? `R$ ${fmt(p.costPrice)}` : <span className="text-gray-300 text-xs">não informado</span>}
                  </td>
                  <td className="px-4 py-3 font-bold text-green-600">
                    {p.lucro != null ? `R$ ${fmt(p.lucro)}` : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3"><MargemBadge margem={p.margem} /></td>
                  <td className="px-4 py-3 text-gray-500">{p.stock}</td>
                  <td className="px-4 py-3 font-black text-green-700">
                    {p.lucro != null ? `R$ ${fmt(p.lucro * p.stock)}` : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-700">{p.qtdVendida ?? 0} un.</td>
                  <td className="px-4 py-3 font-bold text-primary-600">
                    {p.receitaVendas > 0 ? `R$ ${fmt(p.receitaVendas)}` : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t text-xs text-gray-400">
          {products.length} produtos · Valores baseados no estoque atual
        </div>
      </div>

      {/* Legenda margens */}
      <div className="card p-4 flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="font-semibold">Legenda de margem:</span>
        <span className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">≥ 40% Ótima</span>
        <span className="bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-full">20–39% Boa</span>
        <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">&lt; 20% Baixa</span>
      </div>
    </div>
  );
}
