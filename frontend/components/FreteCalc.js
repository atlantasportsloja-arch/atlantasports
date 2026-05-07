'use client';
import { useState } from 'react';
import { Truck } from 'lucide-react';
import api from '@/lib/api';

export default function FreteCalc({ onSelect, totalItems = 1 }) {
  const [cep, setCep] = useState('');
  const [opcoes, setOpcoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  async function calcular() {
    if (cep.replace(/\D/g, '').length !== 8) return;
    setLoading(true);
    try {
      const { data } = await api.post('/frete/calcular', { cep, totalItems });
      setOpcoes(data.opcoes);
    } catch {
      setOpcoes([]);
    } finally {
      setLoading(false);
    }
  }

  function escolher(op) {
    setSelected(op.servico);
    onSelect?.(op.preco);
  }

  return (
    <div className="space-y-3">
      <p className="font-semibold text-sm flex items-center gap-2">
        <Truck size={16} className="text-primary-500" /> Calcular frete
      </p>
      <div className="flex gap-2">
        <input
          value={cep}
          onChange={e => setCep(e.target.value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9))}
          placeholder="00000-000"
          className="input flex-1 text-sm py-2"
          maxLength={9}
        />
        <button onClick={calcular} disabled={loading} className="btn-primary py-2 px-4 text-sm">
          {loading ? '...' : 'OK'}
        </button>
      </div>

      {opcoes.length > 0 && (
        <div className="space-y-2">
          {opcoes.map(op => (
            <button
              key={op.servico}
              onClick={() => escolher(op)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border-2 text-sm transition-colors ${
                selected === op.servico ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-left">
                <p className="font-semibold">{op.servico}</p>
                <p className="text-gray-500 text-xs">{op.prazo}</p>
              </div>
              <p className="font-bold text-primary-500">
                {op.preco === 0 ? 'Grátis' : `R$ ${op.preco.toFixed(2).replace('.', ',')}`}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
