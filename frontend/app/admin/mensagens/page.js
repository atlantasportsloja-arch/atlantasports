'use client';
import { useEffect, useState } from 'react';
import { Save, Loader2, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const DEFAULT_PIX = `Olá Atlanta Sports 🏆, acabei de finalizar meu pedido na loja e estou enviando o comprovante de pagamento logo abaixo.

*Código do pedido:* {codigo}
*Valor total:* {total}
*Forma de pagamento:* PIX`;

const DEFAULT_PARCELADO = `Olá Atlanta Sports 🏆!
Acabei de finalizar um pedido na loja e gostaria de combinar o parcelamento pelo WhatsApp.

*Código do pedido:* {codigo}
*Valor total:* {total}
*Forma de pagamento:* Parcelado

Podem me ajudar a fechar a compra?`;

const VARS = [
  { var: '{codigo}', desc: 'Número do pedido (ex: #1001)' },
  { var: '{total}', desc: 'Valor total (ex: R$ 150,00)' },
];

function MessageEditor({ label, icon, value, onChange, defaultValue }) {
  return (
    <div className="card p-6 space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-black text-base">{label}</h2>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs font-semibold text-blue-700 mb-2">Variáveis disponíveis:</p>
        <div className="flex flex-wrap gap-2">
          {VARS.map(v => (
            <span key={v.var} className="text-xs bg-white border border-blue-200 rounded px-2 py-1">
              <code className="font-mono font-bold text-blue-600">{v.var}</code>
              <span className="text-gray-500 ml-1">→ {v.desc}</span>
            </span>
          ))}
        </div>
      </div>

      <textarea
        className="input font-mono text-sm"
        rows={8}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={defaultValue}
      />

      <button
        type="button"
        onClick={() => onChange(defaultValue)}
        className="text-xs text-gray-400 hover:text-gray-600 underline"
      >
        Restaurar mensagem padrão
      </button>
    </div>
  );
}

function Preview({ label, message, codigo = '#1001', total = 'R$ 150,00' }) {
  const text = message
    .replace(/\{codigo\}/g, codigo)
    .replace(/\{total\}/g, total);

  return (
    <div className="card p-4">
      <p className="text-xs font-semibold text-gray-500 mb-2">{label}</p>
      <div className="bg-[#e9fbe5] rounded-2xl rounded-tl-none p-3 max-w-xs">
        <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
          {text.split('\n').map((line, i) => {
            const bold = line.replace(/\*(.+?)\*/g, (_, m) => `<b>${m}</b>`);
            return <span key={i} dangerouslySetInnerHTML={{ __html: bold + (i < text.split('\n').length - 1 ? '<br/>' : '') }} />;
          })}
        </p>
      </div>
      <p className="text-xs text-gray-400 mt-2 italic">Preview da mensagem no WhatsApp</p>
    </div>
  );
}

export default function MensagensPage() {
  const [pixMessage, setPixMessage] = useState(DEFAULT_PIX);
  const [parceladoMessage, setParceladoMessage] = useState(DEFAULT_PARCELADO);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/config').then(r => {
      if (r.data.pixMessage) setPixMessage(r.data.pixMessage);
      if (r.data.parceladoMessage) setParceladoMessage(r.data.parceladoMessage);
    }).catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    try {
      const full = await api.get('/config').then(r => r.data);
      await api.put('/config', { ...full, pixMessage, parceladoMessage });
      toast.success('Mensagens salvas!');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black">Mensagens de finalização</h1>
          <p className="text-sm text-gray-500 mt-1">Edite o texto enviado pelo cliente no WhatsApp após a compra.</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Salvar mensagens
        </button>
      </div>

      <MessageEditor
        label="Mensagem — Pagamento via PIX"
        icon={<span className="text-xl">⚡</span>}
        value={pixMessage}
        onChange={setPixMessage}
        defaultValue={DEFAULT_PIX}
      />
      <Preview label="Preview PIX" message={pixMessage} />

      <MessageEditor
        label="Mensagem — Parcelado via WhatsApp"
        icon={<MessageSquare size={18} className="text-green-500" />}
        value={parceladoMessage}
        onChange={setParceladoMessage}
        defaultValue={DEFAULT_PARCELADO}
      />
      <Preview label="Preview Parcelado" message={parceladoMessage} />
    </div>
  );
}
