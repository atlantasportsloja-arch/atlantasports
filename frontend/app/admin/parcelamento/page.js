'use client';
import { useEffect, useState } from 'react';
import { Save, Loader2, CreditCard, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const DEFAULT_ROWS = [
  { n: 2,  rate: 2.01  },
  { n: 3,  rate: 3.02  },
  { n: 4,  rate: 4.03  },
  { n: 5,  rate: 5.04  },
  { n: 6,  rate: 6.06  },
  { n: 7,  rate: 9.60  },
  { n: 8,  rate: 10.65 },
  { n: 9,  rate: 11.72 },
  { n: 10, rate: 12.79 },
  { n: 11, rate: 13.87 },
  { n: 12, rate: 14.77 },
];

function calcPmt(price, rate, n) {
  return (price * (1 + rate / 100)) / n;
}

export default function ParcelamentoPage() {
  const [active, setActive]         = useState(false);
  const [maxDisplay, setMaxDisplay] = useState(6);
  const [rows, setRows]             = useState(DEFAULT_ROWS);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [preview, setPreview]       = useState(100);

  useEffect(() => {
    api.get('/config').then(r => {
      const cfg = r.data?.installments;
      if (cfg) {
        setActive(cfg.active ?? false);
        setMaxDisplay(cfg.maxDisplay ?? 6);
        setRows(cfg.rows?.length ? cfg.rows : DEFAULT_ROWS);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function setRate(i, value) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, rate: Number(value) } : r));
  }

  async function save() {
    setSaving(true);
    try {
      const { data: current } = await api.get('/config');
      await api.put('/config', { ...current, installments: { active, maxDisplay, rows } });
      toast.success('Parcelamento salvo!');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-gray-400 animate-pulse">Carregando...</div>;

  const displayedRows = rows.filter(r => r.n <= maxDisplay);
  const hiddenRows    = rows.filter(r => r.n > maxDisplay);
  const bestRow       = displayedRows[displayedRows.length - 1];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <CreditCard size={24} className="text-primary-500" />
          <h1 className="text-2xl font-black">Parcelamento</h1>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {/* Toggle principal */}
      <div className="card p-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-bold">Exibir parcelamento nos produtos</p>
          <p className="text-sm text-gray-400 mt-0.5">
            Quando ativo, aparece "ou {maxDisplay}x de R$ X,XX" abaixo do preço em cada produto.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActive(v => !v)}
          className={`w-12 h-6 rounded-full relative flex-shrink-0 transition-colors ${active ? 'bg-primary-500' : 'bg-gray-300'}`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${active ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Configuração geral */}
      <div className="card p-6 space-y-4">
        <h2 className="font-black border-b pb-2">Configurações gerais</h2>

        <div className="flex items-start gap-8 flex-wrap">
          <div>
            <label className="block text-sm font-medium mb-1">Máx. parcelas exibidas no produto</label>
            <select
              className="input py-2 text-sm w-44"
              value={maxDisplay}
              onChange={e => setMaxDisplay(Number(e.target.value))}
            >
              {[2,3,4,5,6,7,8,9,10,11,12].map(n => (
                <option key={n} value={n}>{n}x</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1.5">
              Parcelas acima desse limite ficam ocultas no produto.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Simular preço (R$)</label>
            <input
              type="number"
              min="1"
              step="0.01"
              className="input py-2 text-sm w-44"
              value={preview}
              onChange={e => setPreview(Number(e.target.value) || 100)}
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Veja o resultado dos cálculos na tabela abaixo.
            </p>
          </div>
        </div>

        {/* Preview do destaque no produto */}
        {active && bestRow && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Preview no produto (R$ {preview.toFixed(2).replace('.', ',')})</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-800 text-sm">
                ou <span className="font-black text-gray-900">{bestRow.n}x</span> de{' '}
                <span className="text-primary-600 font-black text-lg">
                  R$ {calcPmt(preview, bestRow.rate, bestRow.n).toFixed(2).replace('.', ',')}
                </span>
              </span>
              <span className="text-xs text-gray-400">({bestRow.rate}% a.m.)</span>
              <span className="text-xs text-primary-500 underline">ver parcelas</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabela de taxas */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex items-center gap-2">
          <h2 className="font-black text-sm flex-1">Taxas por número de parcelas</h2>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Info size={13} />
            Fórmula: parcela = preço × (1 + taxa%) ÷ n
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-5 py-3 font-semibold text-gray-500 w-28">Parcelas</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-500 w-44">Taxa (% a.m.)</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-500">Valor / parcela</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-500">Total pago</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-500">Juros</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row, i) => {
              const pmt       = calcPmt(preview, row.rate, row.n);
              const total     = pmt * row.n;
              const juros     = total - preview;
              const displayed = row.n <= maxDisplay;
              return (
                <tr key={row.n} className={displayed ? 'hover:bg-gray-50' : 'opacity-40 bg-gray-50'}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-gray-800 text-base">{row.n}x</span>
                      {displayed ? (
                        <span className="text-xs bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded">visível</span>
                      ) : (
                        <span className="text-xs bg-gray-200 text-gray-500 font-semibold px-1.5 py-0.5 rounded">oculto</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        className="input text-sm py-1.5 w-24 text-right font-mono"
                        value={row.rate}
                        onChange={e => setRate(i, e.target.value)}
                      />
                      <span className="text-gray-400 text-sm">%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-black text-primary-600">
                    R$ {pmt.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="px-5 py-3 font-semibold text-gray-700">
                    R$ {total.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {juros > 0
                      ? <span className="text-red-400 font-semibold">+ R$ {juros.toFixed(2).replace('.', ',')}</span>
                      : <span className="text-green-600 font-semibold">Sem juros</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {hiddenRows.length > 0 && (
          <div className="px-5 py-3 border-t bg-gray-50 text-xs text-gray-400">
            {hiddenRows.length} parcela(s) oculta(s) no produto (acima do máximo de {maxDisplay}x). As taxas ainda são salvas.
          </div>
        )}
      </div>
    </div>
  );
}
