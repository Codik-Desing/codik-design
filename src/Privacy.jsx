import { useEffect } from "react";
import { openCookieSettings } from "./CookieBanner";

export default function Privacy() {
  useEffect(() => {
    document.title = "Privacidade — CODIK DESIGN";
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", "https://www.codik.com.br/privacidade");
  }, []);
  return (
    <main className="privacy-page">
      <a href="/">← Voltar à Codik</a>
      <p className="section-label">CODIK DESIGN / ATUALIZADO EM 29.10.2026</p>
      <h1>Política de privacidade</h1>
      <p>Esta página explica como a equipe Codik Design trata os dados enviados por este site. Para dúvidas ou pedidos sobre seus dados, escreva para <a href="mailto:codikdev@gmail.com">codikdev@gmail.com</a>.</p>
      <h2>Contato e orçamento</h2>
      <p>Quando você envia o formulário, recebemos nome, e-mail, WhatsApp, modelo escolhido e mensagem para responder ao pedido, conversar sobre o projeto e preparar uma proposta. Evite incluir senhas, documentos ou dados sensíveis na mensagem. O aceite de cookies de análise é independente do formulário.</p>
      <h2>Cookies e medição de visitas</h2>
      <p>O Google Analytics só é carregado depois de um aceite válido, quando a medição estiver configurada. Ele pode receber informações sobre páginas visitadas, dispositivo, navegador e interações para ajudar a entender o uso do site. Não enviamos os campos do formulário ao Analytics.</p>
      <p>Recusar mantém o Analytics desativado. Você pode mudar a escolha pelo botão abaixo ou no rodapé. Ao retirar o aceite, a medição é desativada e os cookies do Analytics acessíveis neste domínio são removidos. Isso não apaga automaticamente dados já enviados ao Google.</p>
      <button type="button" className="cookie-settings" onClick={openCookieSettings}>Preferências de cookies</button>
      <h2>Armazenamento e duração</h2>
      <p>A preferência de cookies fica neste navegador por até 180 dias; depois, pedimos uma nova escolha. Os cookies criados por esta integração têm duração de até 180 dias. A preferência de tema também fica no navegador até você apagá-la. Se o armazenamento estiver bloqueado, a escolha pode valer apenas enquanto a página estiver aberta.</p>
      <p>Os contatos são mantidos enquanto necessários para responder e acompanhar a solicitação. Se houver contratação, documentos necessários ao projeto e às obrigações aplicáveis podem ser conservados por mais tempo. Para saber o prazo de um registro específico ou pedir sua exclusão, fale com a equipe pelo e-mail acima.</p>
      <h2>Serviços utilizados</h2>
      <p>Usamos Vercel para hospedar o site, Formspree para receber os formulários e Google para a medição opcional de visitas. Esses provedores podem tratar dados técnicos necessários à prestação dos serviços, inclusive em outros países. A hospedagem pode processar registros técnicos de acesso e segurança mesmo quando os cookies de análise são recusados.</p>
      <h2>Seus pedidos</h2>
      <p>Você pode solicitar informações, acesso, correção e exclusão dos dados enviados, além de retirar o consentimento para medição. Envie o pedido para codikdev@gmail.com, indicando como podemos localizar seu contato. A equipe pode precisar confirmar sua identidade e informar eventuais motivos para conservar registros necessários.</p>
      <a href="/">Voltar ao site ↗</a>
    </main>
  );
}
