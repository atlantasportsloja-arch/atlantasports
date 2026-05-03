'use client';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Save, ImagePlus, Trash2, RefreshCw, Plus, X, DatabaseBackup, CheckCircle2, AlertCircle, Clock, FileText, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const DEFAULT_TERMS = `<h2>1. Aceitação dos Termos</h2>
<p>Ao acessar ou utilizar o site da Atlanta Sports, você concorda com estes Termos de Uso. Se não concordar com qualquer parte, por favor, não utilize nosso site.</p>

<h2>2. Sobre a Atlanta Sports</h2>
<p>A Atlanta Sports é uma loja virtual especializada em moda e equipamentos esportivos, com atendimento via e-mail e WhatsApp. Nosso objetivo é oferecer produtos de qualidade com uma experiência de compra segura e prática.</p>

<h2>3. Cadastro e Conta</h2>
<p>Para realizar compras, é necessário criar uma conta com informações verdadeiras e atualizadas. Você é responsável pela segurança de sua senha e por todas as atividades realizadas em sua conta. Em caso de uso não autorizado, entre em contato conosco imediatamente.</p>

<h2>4. Produtos e Preços</h2>
<p>Nos reservamos o direito de alterar preços, descrições e disponibilidade de produtos a qualquer momento, sem aviso prévio. Os preços exibidos são válidos no momento da finalização do pedido. Imagens dos produtos são meramente ilustrativas e podem variar levemente em relação ao produto real.</p>

<h2>5. Pedidos e Pagamento</h2>
<p>Após a confirmação do pagamento, o pedido é processado e encaminhado para expedição. Aceitamos pagamento via PIX e outros meios disponíveis no checkout. O pedido só é confirmado após a compensação do pagamento. Nos reservamos o direito de cancelar pedidos em casos de suspeita de fraude ou erro de precificação.</p>

<h2>6. Entrega e Frete</h2>
<p>Os prazos de entrega são estimados e podem variar conforme a região e a transportadora. Não nos responsabilizamos por atrasos causados por fatores externos, como greves ou condições climáticas. O frete é calculado no checkout conforme o CEP de destino.</p>

<h2>7. Trocas e Devoluções</h2>
<p>Conforme o Código de Defesa do Consumidor (Lei 8.078/90), o cliente tem até <strong>7 dias corridos</strong> após o recebimento para solicitar a devolução do produto por arrependimento, sem necessidade de justificativa. Para trocas por defeito ou produto errado, o prazo é de <strong>30 dias</strong>. Entre em contato com nosso suporte para iniciar o processo.</p>

<h2>8. Privacidade e Dados</h2>
<p>Coletamos apenas os dados necessários para processar seus pedidos (nome, e-mail, endereço, telefone). Não compartilhamos suas informações com terceiros, exceto para finalidade de entrega (transportadoras) e processamento de pagamento. Seus dados são armazenados de forma segura.</p>

<h2>9. Propriedade Intelectual</h2>
<p>Todo o conteúdo do site — incluindo textos, imagens, logotipos e layout — é de propriedade da Atlanta Sports ou de seus fornecedores e está protegido por direitos autorais. É proibida a reprodução sem autorização prévia por escrito.</p>

<h2>10. Alterações nos Termos</h2>
<p>Podemos atualizar estes Termos de Uso a qualquer momento. As alterações entram em vigor imediatamente após a publicação no site. O uso contínuo do site após as alterações implica na aceitação dos novos termos.</p>

<h2>11. Contato</h2>
<p>Dúvidas sobre estes termos? Entre em contato pelo e-mail <a href="mailto:atlantasportsloja@gmail.com">atlantasportsloja@gmail.com</a> ou via WhatsApp no horário de atendimento.</p>`;

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
  termsContent: DEFAULT_TERMS,
  installments: {
    active: false,
    maxDisplay: 6,
    rows: [
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
    ],
  },
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
  const [termsPreview, setTermsPreview] = useState(false);
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

      {/* PARCELAMENTO */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="font-black text-base">💳 Parcelamento</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm font-medium text-gray-600">Exibir nos produtos</span>
            <div
              className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${config.installments?.active ? 'bg-primary-500' : 'bg-gray-300'}`}
              onClick={() => setConfig(c => ({ ...c, installments: { ...(c.installments || {}), active: !c.installments?.active } }))}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${config.installments?.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </label>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium mb-1">Máx. parcelas exibidas no produto</label>
            <select
              className="input py-2 text-sm w-40"
              value={config.installments?.maxDisplay ?? 6}
              onChange={e => setConfig(c => ({ ...c, installments: { ...(c.installments || {}), maxDisplay: Number(e.target.value) } }))}
            >
              {[2,3,4,5,6,7,8,9,10,11,12].map(n => (
                <option key={n} value={n}>{n}x</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Parcelas acima desse limite não aparecem no produto.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-3 py-2.5 font-semibold text-gray-500 w-16">Parcelas</th>
                <th className="text-left px-3 py-2.5 font-semibold text-gray-500">Taxa (%&nbsp;a.m.)</th>
                <th className="text-left px-3 py-2.5 font-semibold text-gray-400 text-xs">Valor p/ R$&nbsp;100</th>
                <th className="text-left px-3 py-2.5 font-semibold text-gray-400 text-xs">Total p/ R$&nbsp;100</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(config.installments?.rows || []).map((row, i) => {
                const pmt = (100 * (1 + row.rate / 100)) / row.n;
                const total = pmt * row.n;
                const isDisplayed = row.n <= (config.installments?.maxDisplay ?? 6);
                return (
                  <tr key={row.n} className={isDisplayed ? '' : 'opacity-40'}>
                    <td className="px-3 py-2">
                      <span className="font-black text-gray-800">{row.n}x</span>
                      {!isDisplayed && <span className="ml-1 text-xs text-gray-400">(oculto)</span>}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          className="input text-sm py-1.5 w-24 text-right"
                          value={row.rate}
                          onChange={e => {
                            const rows = [...(config.installments?.rows || [])];
                            rows[i] = { ...rows[i], rate: Number(e.target.value) };
                            setConfig(c => ({ ...c, installments: { ...(c.installments || {}), rows } }));
                          }}
                        />
                        <span className="text-gray-400 text-xs">%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 font-semibold text-primary-600">R$&nbsp;{pmt.toFixed(2).replace('.', ',')}</td>
                    <td className="px-3 py-2 text-gray-500">R$&nbsp;{total.toFixed(2).replace('.', ',')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400">
          Fórmula: parcela = preço × (1 + taxa/100) ÷ nº parcelas. As linhas acinzentadas são exibidas apenas na tabela de parcelas expandida quando o máximo configurado for maior.
        </p>
      </div>

      {/* TERMOS DE USO */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="font-black text-base flex items-center gap-2">
            <FileText size={18} /> Termos de Uso
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTermsPreview(v => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-300 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors"
            >
              {termsPreview ? <><EyeOff size={13} /> Editar</> : <><Eye size={13} /> Preview</>}
            </button>
            <a
              href="/termos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-primary-500 hover:underline"
            >
              Ver página →
            </a>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Conteúdo exibido na página <span className="font-mono">/termos</span>. Use tags HTML básicas:{' '}
          <span className="font-mono bg-gray-100 px-1 rounded">&lt;h2&gt;</span>{' '}
          <span className="font-mono bg-gray-100 px-1 rounded">&lt;p&gt;</span>{' '}
          <span className="font-mono bg-gray-100 px-1 rounded">&lt;strong&gt;</span>{' '}
          <span className="font-mono bg-gray-100 px-1 rounded">&lt;a href=&quot;...&quot;&gt;</span>
        </p>

        {termsPreview ? (
          <div
            className="border border-gray-200 rounded-xl p-6 prose prose-gray max-w-none text-gray-700 leading-relaxed min-h-[300px] [&_h2]:text-lg [&_h2]:font-black [&_h2]:text-gray-900 [&_h2]:mb-2 [&_h2]:mt-6 [&_p]:mb-3 [&_a]:text-orange-500 [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: config.termsContent || '' }}
          />
        ) : (
          <textarea
            className="input font-mono text-xs leading-relaxed resize-y"
            rows={20}
            value={config.termsContent || ''}
            onChange={e => setConfig(c => ({ ...c, termsContent: e.target.value }))}
            placeholder="Cole ou escreva o conteúdo dos termos em HTML..."
            spellCheck={false}
          />
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (confirm('Restaurar os termos padrão? O conteúdo atual será sobrescrito.')) {
                setConfig(c => ({ ...c, termsContent: DEFAULT_TERMS }));
                setTermsPreview(false);
              }
            }}
            className="text-xs font-semibold text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            Restaurar padrão
          </button>
        </div>
      </div>

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
