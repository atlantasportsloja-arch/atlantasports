'use client';
import { useEffect, useState } from 'react';
import { Save, Plus, Trash2, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const DEFAULT_ZONES = [
  { label: 'SP Capital',     cepStart: '01', cepEnd: '09', pacPrice: 12.9,  pacDays: 4,  sedexPrice: 23.22, sedexDays: 2 },
  { label: 'SP Interior',    cepStart: '10', cepEnd: '19', pacPrice: 15.9,  pacDays: 5,  sedexPrice: 28.62, sedexDays: 2 },
  { label: 'RJ',             cepStart: '20', cepEnd: '28', pacPrice: 17.9,  pacDays: 5,  sedexPrice: 32.22, sedexDays: 2 },
  { label: 'MG',             cepStart: '30', cepEnd: '39', pacPrice: 19.9,  pacDays: 6,  sedexPrice: 35.82, sedexDays: 3 },
  { label: 'BA',             cepStart: '40', cepEnd: '48', pacPrice: 22.9,  pacDays: 7,  sedexPrice: 41.22, sedexDays: 3 },
  { label: 'CE',             cepStart: '60', cepEnd: '63', pacPrice: 24.9,  pacDays: 8,  sedexPrice: 44.82, sedexDays: 4 },
  { label: 'DF',             cepStart: '70', cepEnd: '73', pacPrice: 19.9,  pacDays: 6,  sedexPrice: 35.82, sedexDays: 3 },
  { label: 'PR',             cepStart: '80', cepEnd: '87', pacPrice: 18.9,  pacDays: 6,  sedexPrice: 34.02, sedexDays: 3 },
  { label: 'SC',             cepStart: '88', cepEnd: '89', pacPrice: 19.9,  pacDays: 6,  sedexPrice: 35.82, sedexDays: 3 },
  { label: 'RS',             cepStart: '90', cepEnd: '99', pacPrice: 21.9,  pacDays: 7,  sedexPrice: 39.42, sedexDays: 4 },
  { label: 'Demais regiões', cepStart: '00', cepEnd: '99', pacPrice: 27.9,  pacDays: 10, sedexPrice: 50.22, sedexDays: 5 },
];

const EMPTY_ZONE = { label: '', cepStart: '', cepEnd: '', pacPrice: '', pacDays: '', sedexPrice: '', sedexDays: '' };

function fmt(v) { return Number(v).toFixed(2).replace('.', ','); }

export default function AdminFretePage() {
  const [threshold, setThreshold] = useState(299);
  const [zones, setZones] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newZone, setNewZone] = useState(EMPTY_ZONE);
  const [editingIdx, setEditingIdx] = useState(null);

  useEffect(() => {
    api.get('/config').then(r => {
      setThreshold(Number(r.data.freeShippingThreshold || 299));
      setZones(r.data.shippingZones?.length ? r.data.shippingZones : DEFAULT_ZONES);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const full = await api.get('/config').then(r => r.data);
      await api.put('/config', { ...full, freeShippingThreshold: threshold, shippingZones: zones });
      toast.success('Configurações de frete salvas!');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  function addZone() {
    if (!newZone.label || !newZone.cepStart || !newZone.cepEnd || !newZone.pacPrice || !newZone.pacDays) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    setZones(z => [...z, {
      label: newZone.label,
      cepStart: newZone.cepStart.padStart(2, '0'),
      cepEnd: newZone.cepEnd.padStart(2, '0'),
      pacPrice: Number(newZone.pacPrice),
      pacDays: Number(newZone.pacDays),
      sedexPrice: newZone.sedexPrice ? Number(newZone.sedexPrice) : Number((Number(newZone.pacPrice) * 1.8).toFixed(2)),
      sedexDays: newZone.sedexDays ? Number(newZone.sedexDays) : Math.max(1, Number(newZone.pacDays) - 2),
    }]);
    setNewZone(EMPTY_ZONE);
    setShowAdd(false);
  }

  function removeZone(i) {
    setZones(z => z.filter((_, idx) => idx !== i));
  }

  function updateZone(i, field, value) {
    setZones(z => z.map((zone, idx) => idx === i ? { ...zone, [field]: value } : zone));
  }

  if (loading) return <div className="text-gray-400 animate-pulse p-8">Carregando...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black">🚚 Configurações de Frete</h1>
          <p className="text-sm text-gray-500 mt-1">Defina os preços e prazos por região do Brasil.</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Salvar frete
        </button>
      </div>

      {/* Frete grátis */}
      <div className="card p-6">
        <h2 className="font-black mb-4">Frete grátis</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium mb-1">Valor mínimo para frete grátis (R$)</label>
            <input
              type="number"
              min="0"
              step="1"
              className="input w-48"
              value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
            />
            <p className="text-xs text-gray-400 mt-1">
              Pedidos acima de <strong>R$ {fmt(threshold)}</strong> recebem frete grátis.
              {threshold === 0 && ' (Sempre grátis)'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabela de zonas */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-black">Tabela de zonas</h2>
            <p className="text-xs text-gray-400 mt-0.5">Baseada nos 2 primeiros dígitos do CEP. A última zona é o fallback para CEPs sem correspondência.</p>
          </div>
          <button onClick={() => { setShowAdd(!showAdd); setEditingIdx(null); }} className="flex items-center gap-2 text-sm btn-outline py-2">
            <Plus size={15} /> Adicionar zona
          </button>
        </div>

        {showAdd && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
            <h3 className="font-semibold text-sm mb-3 text-blue-800">Nova zona</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium mb-1">Nome da região <span className="text-red-400">*</span></label>
                <input className="input text-sm" placeholder="Ex: SP Capital" value={newZone.label} onChange={e => setNewZone(z => ({ ...z, label: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">CEP início (2 dígitos) <span className="text-red-400">*</span></label>
                <input className="input text-sm" placeholder="01" maxLength={2} value={newZone.cepStart} onChange={e => setNewZone(z => ({ ...z, cepStart: e.target.value.replace(/\D/g,'') }))} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">CEP fim (2 dígitos) <span className="text-red-400">*</span></label>
                <input className="input text-sm" placeholder="09" maxLength={2} value={newZone.cepEnd} onChange={e => setNewZone(z => ({ ...z, cepEnd: e.target.value.replace(/\D/g,'') }))} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">PAC — Preço R$ <span className="text-red-400">*</span></label>
                <input className="input text-sm" type="number" step="0.01" placeholder="19.90" value={newZone.pacPrice} onChange={e => setNewZone(z => ({ ...z, pacPrice: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">PAC — Dias úteis <span className="text-red-400">*</span></label>
                <input className="input text-sm" type="number" min="1" placeholder="5" value={newZone.pacDays} onChange={e => setNewZone(z => ({ ...z, pacDays: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">SEDEX — Preço R$ <span className="text-gray-400 font-normal">(auto)</span></label>
                <input className="input text-sm" type="number" step="0.01" placeholder="auto" value={newZone.sedexPrice} onChange={e => setNewZone(z => ({ ...z, sedexPrice: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">SEDEX — Dias úteis <span className="text-gray-400 font-normal">(auto)</span></label>
                <input className="input text-sm" type="number" min="1" placeholder="auto" value={newZone.sedexDays} onChange={e => setNewZone(z => ({ ...z, sedexDays: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-3">
              <button onClick={addZone} className="btn-primary text-sm py-2 flex items-center gap-1"><Plus size={14} /> Adicionar</button>
              <button onClick={() => setShowAdd(false)} className="btn-outline text-sm py-2 flex items-center gap-1"><X size={14} /> Cancelar</button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Região', 'CEP', 'PAC', 'Prazo PAC', 'SEDEX', 'Prazo SEDEX', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-500 text-xs whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {zones.map((z, i) => (
                <tr key={i} className={`hover:bg-gray-50 ${i === zones.length - 1 ? 'bg-gray-50/50' : ''}`}>
                  <td className="px-4 py-3">
                    {editingIdx === i ? (
                      <input className="input text-sm py-1 w-36" value={z.label} onChange={e => updateZone(i, 'label', e.target.value)} />
                    ) : (
                      <span className="font-medium">{z.label}</span>
                    )}
                    {i === zones.length - 1 && <span className="ml-1 text-xs text-gray-400">(fallback)</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {editingIdx === i ? (
                      <div className="flex items-center gap-1">
                        <input className="input text-sm py-1 w-14" maxLength={2} value={z.cepStart} onChange={e => updateZone(i, 'cepStart', e.target.value.replace(/\D/g,''))} />
                        <span>–</span>
                        <input className="input text-sm py-1 w-14" maxLength={2} value={z.cepEnd} onChange={e => updateZone(i, 'cepEnd', e.target.value.replace(/\D/g,''))} />
                      </div>
                    ) : (
                      `${z.cepStart}xxxx – ${z.cepEnd}xxxx`
                    )}
                  </td>
                  <td className="px-4 py-3 font-bold text-primary-600">
                    {editingIdx === i ? (
                      <input className="input text-sm py-1 w-24" type="number" step="0.01" value={z.pacPrice} onChange={e => updateZone(i, 'pacPrice', e.target.value)} />
                    ) : (
                      `R$ ${fmt(z.pacPrice)}`
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {editingIdx === i ? (
                      <input className="input text-sm py-1 w-20" type="number" min="1" value={z.pacDays} onChange={e => updateZone(i, 'pacDays', e.target.value)} />
                    ) : (
                      `${z.pacDays} d.u.`
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-orange-600">
                    {editingIdx === i ? (
                      <input className="input text-sm py-1 w-24" type="number" step="0.01" value={z.sedexPrice} onChange={e => updateZone(i, 'sedexPrice', e.target.value)} />
                    ) : (
                      `R$ ${fmt(z.sedexPrice)}`
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {editingIdx === i ? (
                      <input className="input text-sm py-1 w-20" type="number" min="1" value={z.sedexDays} onChange={e => updateZone(i, 'sedexDays', e.target.value)} />
                    ) : (
                      `${z.sedexDays} d.u.`
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {editingIdx === i ? (
                        <button onClick={() => setEditingIdx(null)} className="text-xs bg-green-500 text-white px-2 py-1 rounded font-semibold hover:bg-green-600">
                          OK
                        </button>
                      ) : (
                        <button onClick={() => { setEditingIdx(i); setShowAdd(false); }} className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 font-semibold">
                          Editar
                        </button>
                      )}
                      <button onClick={() => removeZone(i)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between text-xs text-gray-400">
          <span>{zones.length} zonas configuradas</span>
          <button onClick={() => { if (confirm('Restaurar zonas padrão?')) setZones(DEFAULT_ZONES); }} className="text-gray-400 hover:text-gray-600 underline">
            Restaurar padrão
          </button>
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2 w-full justify-center">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Salvar configurações de frete
      </button>
    </div>
  );
}
