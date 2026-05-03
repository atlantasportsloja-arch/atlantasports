const API = process.env.NEXT_PUBLIC_API_URL;

export const metadata = {
  title: 'Termos de Uso — Atlanta Sports',
  description: 'Termos e condições de uso da loja Atlanta Sports.',
};

async function getTerms() {
  try {
    const res = await fetch(`${API}/config`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.termsContent || null;
  } catch {
    return null;
  }
}

const DEFAULT_TERMS = `
<h2>1. Aceitação dos Termos</h2>
<p>Ao acessar ou utilizar o site da Atlanta Sports, você concorda com estes Termos de Uso. Se não concordar com qualquer parte, por favor, não utilize nosso site.</p>

<h2>2. Sobre a Atlanta Sports</h2>
<p>A Atlanta Sports é uma loja virtual especializada em moda e equipamentos esportivos, com atendimento via e-mail e WhatsApp. Nosso objetivo é oferecer produtos de qualidade com uma experiência de compra segura e prática.</p>

<h2>3. Cadastro e Conta</h2>
<p>Para realizar compras, é necessário criar uma conta com informações verdadeiras e atualizadas. Você é responsável pela segurança de sua senha e por todas as atividades realizadas em sua conta. Em caso de uso não autorizado, entre em contato conosco imediatamente.</p>

<h2>4. Produtos e Preços</h2>
<p>Nos reservamos o direito de alterar preços, descrições e disponibilidade de produtos a qualquer momento, sem aviso prévio. Os preços exibidos são válidos no momento da finalização do pedido.</p>

<h2>5. Pedidos e Pagamento</h2>
<p>Após a confirmação do pagamento, o pedido é processado e encaminhado para expedição. O pedido só é confirmado após a compensação do pagamento.</p>

<h2>6. Entrega e Frete</h2>
<p>Os prazos de entrega são estimados e podem variar conforme a região e a transportadora. O frete é calculado no checkout conforme o CEP de destino.</p>

<h2>7. Trocas e Devoluções</h2>
<p>Conforme o Código de Defesa do Consumidor (Lei 8.078/90), o cliente tem até <strong>7 dias corridos</strong> após o recebimento para solicitar a devolução por arrependimento. Para trocas por defeito, o prazo é de <strong>30 dias</strong>.</p>

<h2>8. Privacidade e Dados</h2>
<p>Coletamos apenas os dados necessários para processar seus pedidos. Não compartilhamos suas informações com terceiros, exceto para fins de entrega e processamento de pagamento.</p>

<h2>9. Contato</h2>
<p>Dúvidas? Entre em contato pelo e-mail <a href="mailto:atlantasportsloja@gmail.com">atlantasportsloja@gmail.com</a> ou via WhatsApp.</p>
`;

export default async function TermosPage() {
  const termsContent = await getTerms();
  const content = termsContent && termsContent.trim() ? termsContent : DEFAULT_TERMS;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black mb-2">Termos de Uso</h1>
      <p className="text-sm text-gray-400 mb-10">
        Última atualização: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
      </p>

      <div
        className="prose prose-gray max-w-none text-gray-700 leading-relaxed
          [&_h2]:text-lg [&_h2]:font-black [&_h2]:text-gray-900 [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:first:mt-0
          [&_p]:mb-4
          [&_strong]:font-bold [&_strong]:text-gray-900
          [&_a]:text-orange-500 [&_a]:font-semibold [&_a]:hover:underline
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ul_li]:mb-1
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_ol_li]:mb-1"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
