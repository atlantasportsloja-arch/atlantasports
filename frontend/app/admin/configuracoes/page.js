'use client';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Save, ImagePlus, Trash2, RefreshCw, Plus, X, DatabaseBackup, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const DEFAULT = {
  storeName: 'Atlanta Sports', storeSlogan: 'Veste quem joga de verdade',
  heroBadge: 'Nova coleção 2025', heroTitle: 'Veste quem joga de verdade',
  heroSubtitle: 'Camisas oficiais, tênis de performance e acessórios fitness. Frete grátis acima de R$ 299.',
  heroBtnPrimary: 'Ver coleção', heroBtnPrimaryLink: '/categoria/camisas',
  heroBtnSecondary: 'Ver tênis', heroBtnSecondaryLink: '/categoria/tenis',
  benefit1: '🚚 Frete grátis acima de R$ 299', benefit2: '🔒 Pagamento 100% seguro',
  benefit3: '↩️ Troca em 30 dias', benefit4: '⭐ +5.000 clientes satisfeitos',
  sectionCategories: 'Categorias', sectionFeatured: 'Produtos em destaque',
  whatsapp: '', footerEmail: 'atlantasportsloja@gmail.com',
  footerHours: 'Seg–Sex 9h–18h', footerDesc: 'Equipamentos e moda esportiva de alta performance.',
  pixDiscount: 0, pixKey: '',
  banners: [],
  footerLinks: [],
};

function Field({ label, hint, value, onChange, textarea }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {textarea ? (
        <textarea className="input" rows={2} value={value || ''} onChange={e => onChange(e.target.value)} />
      ) : (
        <input className="input" value={value || ''} onChange={e => onChange(e.target.value)} />
      )}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card p-6 space-y-4">
      <h2 className="font-black text-base border-b pb-2">{title}</h2>
      {children}
    </div>
  );
}

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [backupStatus, setBackupStatus] = useState(null);
  const [runningBackup, setRunningBackup] = useState(false);
  const bannerRef = useRef();

  useEffect(() => {
    api.get('/config').then(r => setConfig({ ...DEFAULT, ...r.data })).catch(() => {});
    api.get('/admin/backup/status').then(r => setBackupStatus(r.data)).catch(() => {});
  }, []);

  function set(key) {
    return val => setConfig(c => ({ ...c, [key]: val }));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/config', config);
      toast.success('Configurações salvas!');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function uploadBanner(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('banner', file);
      const { data } = await api.post('/config/banner', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setConfig(c => ({ ...c, banners: data.banners }));
      toast.success('Banner adicionado!');
    } catch {
      toast.error('Erro ao enviar banner');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function removeBanner(url) {
    if (!confirm('Remover este banner?')) return;
    try {
      const { data } = await api.delete('/config/banner', { data: { url } });
      setConfig(c => ({ ...c, banners: data.banners }));
      toast.success('Banner removido');
    } catch {
      toast.error('Erro ao remover');
    }
  }

  async function restoreBanners() {
    if (!confirm('Restaurar banners do Cloudinary? Isso recupera todas as imagens já enviadas.')) return;
    try {
      const { data } = await api.post('/config/banner/restore');
      setConfig(c => ({ ...c, banners: data.banners }));
      toast.success(`${data.restored} banner(s) restaurado(s)!`);
    } catch {
      toast.error('Erro ao restaurar banners');
    }
  }

  async function triggerBackup() {
    if (!confirm('Iniciar backup manual agora? O arquivo será enviado por e-mail.')) return;
    setRunningBackup(true);
    try {
      const { data } = await api.post('/admin/backup');
      setBackupStatus({ lastBackupAt: data.lastBackupAt, lastBackupStatus: data.lastBackupStatus });
      toast.success('Backup realizado e enviado por e-mail!');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Erro ao realizar backup');
    } finally {
      setRunningBackup(false);
    }
  }

  function formatBackupDate(iso) {
    if (!iso) return null;
    return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  }

  return (
    <form onSubmit={save} className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Configurações da Loja</h1>
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          <Save size={18} />
          {saving ? 'Salvando...' : 'Salvar tudo'}
        </button>
      </div>

      {/* IDENTIDADE */}
      <Section title="🏪 Identidade da Loja">
        <Field label="Nome da loja" hint="Aparece no header e rodapé" value={config.storeName} onChange={set('storeName')} />
        <Field label="Descrição do rodapé" hint="Texto abaixo do nome no footer" value={config.footerDesc} onChange={set('footerDesc')} textarea />
      </Section>

      {/* HERO */}
      <Section title="🎯 Banner Principal (Hero)">
        <p className="text-xs text-gray-400 -mt-2">Aparece quando não há banners de promoção cadastrados</p>
        <Field label="Etiqueta do badge" hint='Ex: "Nova coleção 2025"' value={config.heroBadge} onChange={set('heroBadge')} />
        <Field label="Título principal" value={config.heroTitle} onChange={set('heroTitle')} />
        <Field label="Subtítulo / descrição" value={config.heroSubtitle} onChange={set('heroSubtitle')} textarea />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Botão 1 — texto" value={config.heroBtnPrimary} onChange={set('heroBtnPrimary')} />
          <Field label="Botão 1 — link" hint='Ex: /categoria/camisas' value={config.heroBtnPrimaryLink} onChange={set('heroBtnPrimaryLink')} />
          <Field label="Botão 2 — texto" value={config.heroBtnSecondary} onChange={set('heroBtnSecondary')} />
          <Field label="Botão 2 — link" hint='Ex: /categoria/tenis' value={config.heroBtnSecondaryLink} onChange={set('heroBtnSecondaryLink')} />
        </div>
      </Section>

      {/* BENEFÍCIOS */}
      <Section title="✅ Faixa de Benefícios">
        <p className="text-xs text-gray-400 -mt-2">4 itens que aparecem na faixa laranja abaixo do banner. Use emojis!</p>
        <Field label="Benefício 1" value={config.benefit1} onChange={set('benefit1')} />
        <Field label="Benefício 2" value={config.benefit2} onChange={set('benefit2')} />
        <Field label="Benefício 3" value={config.benefit3} onChange={set('benefit3')} />
        <Field label="Benefício 4" value={config.benefit4} onChange={set('benefit4')} />
      </Section>

      {/* SEÇÕES */}
      <Section title="📦 Títulos das Seções">
        <Field label="Título da seção de categorias" value={config.sectionCategories} onChange={set('sectionCategories')} />
        <Field label="Título da seção de produtos" value={config.sectionFeatured} onChange={set('sectionFeatured')} />
      </Section>

      {/* BANNERS */}
      <Section title="🖼️ Banners de Promoção">
        <div className="flex items-center justify-between -mt-2 flex-wrap gap-2">
          <p className="text-xs text-gray-400">Aparecem em carrossel automático na home. Tamanho ideal: <span className="font-semibold text-gray-600">1400 × 500px</span></p>
          <button type="button" onClick={restoreBanners} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
            <RefreshCw size={13} /> Restaurar do Cloudinary
          </button>
        </div>
        <div className="space-y-3">
          {config.banners?.map((url, i) => (
            <div key={i} className="relative rounded-xl overflow-hidden border border-gray-200 group">
              <div className="relative w-full h-36">
                <Image src={url} alt={`Banner ${i + 1}`} fill className="object-cover" />
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button type="button" onClick={() => removeBanner(url)} className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                  <Trash2 size={14} /> Remover banner {i + 1}
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => bannerRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl py-6 text-gray-400 hover:border-primary-500 hover:text-primary-500 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
          >
            <ImagePlus size={18} />
            {uploading ? 'Enviando...' : 'Adicionar banner de promoção'}
          </button>
          <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={uploadBanner} />
        </div>
      </Section>

      {/* PIX */}
      <Section title="⚡ Pagamento PIX">
        <p className="text-xs text-gray-400 -mt-2">
          Configure a chave PIX e o desconto. O desconto aparece nos produtos e é aplicado automaticamente no checkout.
        </p>
        <div>
          <label className="block text-sm font-medium mb-1">Chave PIX</label>
          <input
            className="input"
            value={config.pixKey || ''}
            onChange={e => setConfig(c => ({ ...c, pixKey: e.target.value }))}
            placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
          />
          <p className="text-xs text-gray-400 mt-1">Deixe em branco para não exibir a opção PIX no checkout.</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Desconto PIX (%)</label>
          <input
            className="input"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={config.pixDiscount ?? 0}
            onChange={e => setConfig(c => ({ ...c, pixDiscount: Number(e.target.value) }))}
            placeholder="Ex: 10 para 10% de desconto"
          />
          <p className="text-xs text-gray-400 mt-1">0 = sem desconto. O valor é descontado do subtotal do pedido.</p>
        </div>
        {config.pixKey && config.pixDiscount > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
            ⚡ Os produtos vão exibir: <strong>PIX R$ X ({config.pixDiscount}% off)</strong>
          </div>
        )}
      </Section>

      {/* CONTATO */}
      <Section title="📞 Contato e Rodapé">
        <Field label="WhatsApp" hint='Ex: 5511999999999 (com código do país, sem +)' value={config.whatsapp} onChange={set('whatsapp')} />
        <Field label="E-mail de atendimento" value={config.footerEmail} onChange={set('footerEmail')} />
        <Field label="Horário de atendimento" value={config.footerHours} onChange={set('footerHours')} />
      </Section>

      {/* LINKS DO RODAPÉ */}
      <Section title="🔗 Links da seção Loja no Rodapé">
        <p className="text-xs text-gray-400 -mt-2">Esses links aparecem na coluna "Loja" do rodapé da loja.</p>
        <div className="space-y-2">
          {(config.footerLinks || []).map((link, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                className="input flex-1"
                placeholder="Texto (ex: ✈️ Encomenda)"
                value={link.label}
                onChange={e => {
                  const links = [...(config.footerLinks || [])];
                  links[i] = { ...links[i], label: e.target.value };
                  setConfig(c => ({ ...c, footerLinks: links }));
                }}
              />
              <input
                className="input flex-1"
                placeholder="URL (ex: /categoria/encomenda)"
                value={link.url}
                onChange={e => {
                  const links = [...(config.footerLinks || [])];
                  links[i] = { ...links[i], url: e.target.value };
                  setConfig(c => ({ ...c, footerLinks: links }));
                }}
              />
              <button
                type="button"
                onClick={() => setConfig(c => ({ ...c, footerLinks: (c.footerLinks || []).filter((_, j) => j !== i) }))}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setConfig(c => ({ ...c, footerLinks: [...(c.footerLinks || []), { label: '', url: '' }] }))}
            className="flex items-center gap-2 text-sm text-primary-500 hover:text-primary-600 font-semibold"
          >
            <Plus size={15} /> Adicionar link
          </button>
        </div>
      </Section>

      {/* BACKUP */}
      <div className="card p-6 space-y-4">
        <h2 className="font-black text-base border-b pb-2">🗄️ Backup do Banco de Dados</h2>
        <p className="text-sm text-gray-500 -mt-1">
          O backup exporta todos os dados da loja (produtos, pedidos, usuários, cupons etc.) e envia por e-mail como arquivo comprimido.
          O backup automático roda <strong>todo dia às 06h</strong>.
        </p>

        {backupStatus?.lastBackupAt && (
          <div className={`flex items-start gap-3 rounded-xl p-4 text-sm ${backupStatus.lastBackupStatus === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {backupStatus.lastBackupStatus === 'success'
              ? <CheckCircle2 size={18} className="text-green-600 mt-0.5 shrink-0" />
              : <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />}
            <div>
              <p className={`font-semibold ${backupStatus.lastBackupStatus === 'success' ? 'text-green-700' : 'text-red-600'}`}>
                {backupStatus.lastBackupStatus === 'success' ? 'Último backup enviado com sucesso' : 'Último backup falhou'}
              </p>
              <p className="text-gray-500 flex items-center gap-1 mt-0.5">
                <Clock size={13} />
                {formatBackupDate(backupStatus.lastBackupAt)}
              </p>
            </div>
          </div>
        )}

        {!backupStatus?.lastBackupAt && (
          <div className="flex items-center gap-3 rounded-xl p-4 text-sm bg-gray-50 border border-gray-200">
            <DatabaseBackup size={18} className="text-gray-400 shrink-0" />
            <p className="text-gray-500">Nenhum backup registrado ainda. O próximo automático será às 06h.</p>
          </div>
        )}

        <button
          type="button"
          onClick={triggerBackup}
          disabled={runningBackup}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <DatabaseBackup size={18} />
          {runningBackup ? 'Gerando backup...' : 'Fazer backup agora'}
        </button>
      </div>

      <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 w-full justify-center">
        <Save size={18} />
        {saving ? 'Salvando...' : 'Salvar todas as configurações'}
      </button>
    </form>
  );
}
