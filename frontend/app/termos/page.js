export const metadata = {
  title: 'Termos de Uso — Atlanta Sports',
  description: 'Termos e condições de uso da loja Atlanta Sports.',
};

export default function TermosPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black mb-2">Termos de Uso</h1>
      <p className="text-sm text-gray-400 mb-10">Última atualização: abril de 2025</p>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-lg font-black text-gray-900 mb-2">1. Aceitação dos Termos</h2>
          <p>
            Ao acessar ou utilizar o site da Atlanta Sports, você concorda com estes Termos de Uso.
            Se não concordar com qualquer parte, por favor, não utilize nosso site.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-gray-900 mb-2">2. Sobre a Atlanta Sports</h2>
          <p>
            A Atlanta Sports é uma loja virtual especializada em moda e equipamentos esportivos,
            com atendimento via e-mail e WhatsApp. Nosso objetivo é oferecer produtos de qualidade
            com uma experiência de compra segura e prática.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-gray-900 mb-2">3. Cadastro e Conta</h2>
          <p>
            Para realizar compras, é necessário criar uma conta com informações verdadeiras e atualizadas.
            Você é responsável pela segurança de sua senha e por todas as atividades realizadas em sua conta.
            Em caso de uso não autorizado, entre em contato conosco imediatamente.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-gray-900 mb-2">4. Produtos e Preços</h2>
          <p>
            Nos reservamos o direito de alterar preços, descrições e disponibilidade de produtos a qualquer momento,
            sem aviso prévio. Os preços exibidos são válidos no momento da finalização do pedido. Imagens dos produtos
            são meramente ilustrativas e podem variar levemente em relação ao produto real.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-gray-900 mb-2">5. Pedidos e Pagamento</h2>
          <p>
            Após a confirmação do pagamento, o pedido é processado e encaminhado para expedição.
            Aceitamos pagamento via PIX e outros meios disponíveis no checkout. O pedido só é
            confirmado após a compensação do pagamento. Nos reservamos o direito de cancelar
            pedidos em casos de suspeita de fraude ou erro de precificação.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-gray-900 mb-2">6. Entrega e Frete</h2>
          <p>
            Os prazos de entrega são estimados e podem variar conforme a região e a transportadora.
            Não nos responsabilizamos por atrasos causados por fatores externos, como greves ou
            condições climáticas. O frete é calculado no checkout conforme o CEP de destino.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-gray-900 mb-2">7. Trocas e Devoluções</h2>
          <p>
            Conforme o Código de Defesa do Consumidor (Lei 8.078/90), o cliente tem até <strong>7 dias corridos</strong> após
            o recebimento para solicitar a devolução do produto por arrependimento, sem necessidade de justificativa.
            Para trocas por defeito ou produto errado, o prazo é de <strong>30 dias</strong>. Entre em contato
            com nosso suporte para iniciar o processo.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-gray-900 mb-2">8. Privacidade e Dados</h2>
          <p>
            Coletamos apenas os dados necessários para processar seus pedidos (nome, e-mail, endereço, telefone).
            Não compartilhamos suas informações com terceiros, exceto para finalidade de entrega (transportadoras)
            e processamento de pagamento. Seus dados são armazenados de forma segura.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-gray-900 mb-2">9. Propriedade Intelectual</h2>
          <p>
            Todo o conteúdo do site — incluindo textos, imagens, logotipos e layout — é de propriedade
            da Atlanta Sports ou de seus fornecedores e está protegido por direitos autorais.
            É proibida a reprodução sem autorização prévia por escrito.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-gray-900 mb-2">10. Alterações nos Termos</h2>
          <p>
            Podemos atualizar estes Termos de Uso a qualquer momento. As alterações entram em vigor
            imediatamente após a publicação no site. O uso contínuo do site após as alterações
            implica na aceitação dos novos termos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-black text-gray-900 mb-2">11. Contato</h2>
          <p>
            Dúvidas sobre estes termos? Entre em contato pelo e-mail{' '}
            <a href="mailto:atlantasportsloja@gmail.com" className="text-primary-500 hover:underline font-semibold">
              atlantasportsloja@gmail.com
            </a>{' '}
            ou via WhatsApp no horário de atendimento.
          </p>
        </section>

      </div>
    </div>
  );
}
