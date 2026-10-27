# CODIK DESIGN — Redesign editorial interativo

Site do estúdio de **Isaías, Rodrigo e Nicolas**. A coleção reúne **18 demos em seis segmentos**, com busca, filtros e capturas reais dos sites. O formulário de contato continua integrado ao Formspree.

## Usar no VS Code

```bash
npm install
npm run dev
```

Abra o link local mostrado no terminal. Teste no celular e no desktop.

## Redesign experimental

Portagem da referência `CODIK-REDESIGN.md` para React/Vite. O trabalho continua na branch `design-experimental`, preparada para este teste. A branch `versao-atual` preserva a versão anterior; o experimento não modifica a `main`.

- Bricolage Grotesque variável, Instrument Serif, composição editorial e acento laranja `#ff4a1c`.
- Abertura de aproximadamente 3,9 segundos a cada carregamento ou recarregamento da página; clique ou Escape para pular, botão para repetir e desativação com movimento reduzido. Links para seções mantêm o destino após a abertura.
- Sensibilidade da fonte ao cursor somente no título de abertura da página e nos títulos principais das seções. Nomes dos modelos, nomes da equipe, títulos de etapas e títulos secundários das abas têm peso fixo. Quebra por palavras e leitura acessível preservadas; cursor personalizado e links magnéticos funcionam apenas com ponteiro fino. Posições das letras armazenadas e loop pausado quando estabiliza.
- Na seção do estúdio, “Diferentes ideias.” e “O mesmo cuidado.” têm maior destaque. A animação consulta a posição da janela uma vez por quadro e compartilha pesos próximos da fonte em passos de 10, preservando a interpolação e evitando recálculos e variantes de fonte desnecessários.
- Tema claro/escuro conforme o sistema, com escolha manual persistida quando o armazenamento está disponível.
- Lista editorial das 18 demos, filtros, busca sem acentos, links reais e captura do site seguindo o cursor. O cartão flutuante respeita os limites da tela e a área das ações. A prévia interativa em desktop e celular reserva espaço para os botões, inclusive em telas baixas.
- Confete com Web Animations API, relógio de São Paulo e faixa animada. Campos de formulário, seleção de texto e movimento reduzido não geram confete.
- Cards dos três sócios clicáveis, abrindo seus perfis reais do GitHub em nova aba: Isaías (`Is-Lucas`), Rodrigo (`Skyyyzz`) e Nicolas (`niczinzx`). Composições tipográficas provisórias até receber fotos e funções.
- Contatos, formulário Formspree, demos, favicon, título e descrição preservados. Nenhuma dependência nova.

### Arquivos do redesign

| Arquivo                     | Responsabilidade                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/main.jsx`              | Entrada React.                                                                                   |
| `src/Redesign.jsx`          | Abertura, navegação, tema, título, trabalhos, prévias, equipe, chamada de contato e rodapé.      |
| `src/experience.js`         | Armazenamento protegido, preferências, cursor, magnetismo, confete e seleção de modelo.          |
| `src/InteractiveText.jsx` | Texto com letras interativas, largura reservada, quebra por palavras e alternativa acessível. |
| `src/redesign.css`          | Tokens, temas, tipografia, layouts, animações e regras responsivas.                              |
| `src/Sections.jsx`          | Conteúdos preservados de tipos de site, processo, FAQ e formulário; abas acessíveis por teclado. |
| `src/content.js`            | Conteúdos reais, contatos, modelos e campos para fotos e funções da equipe.                      |
| `index.html`                | Fontes, tema inicial e alternativa sem JavaScript, mantendo SEO e favicon.                       |
| `scripts/browser-check.mjs` | Verificação no Chrome e capturas de revisão.                                                     |

### Pendências

- **TODO:** preencher `studio.equipe[].foto` e `studio.equipe[].funcao` em `src/content.js` com fotos reais e funções aprovadas de Isaías, Rodrigo e Nicolas. Enquanto faltarem, aparecem monogramas e o rótulo neutro “Equipe Codik Design”. Não são usadas fotos fictícias.
- **Formspree:** o envio real depende do ID previsto em `VITE_FORMSPREE_FORM_ID`. Sem ID, o site informa a indisponibilidade e oferece o e-mail real. Os testes não enviam mensagens reais.
- WhatsApp e Instagram continuam opcionais, conforme os campos existentes de `studio`; não foram inventados contatos.

## Formulário (Vercel)

1. Crie ou escolha um formulário em https://formspree.io/ (painel privado: _Submissions_).
2. Copie o ID de `https://formspree.io/f/SEU_ID`.
3. Vercel → projeto → Settings → Environment Variables: `VITE_FORMSPREE_FORM_ID` = `SEU_ID`.
4. Faça um **Redeploy** para a variável ser incluída na compilação do Vite. O ID não é senha.
5. Teste um envio real: preencha um e-mail seu, aceite os termos e confira no painel do Formspree. Ative notificações no painel do Formspree, se desejar.
6. Configure `studio.whatsapp`, se quiser botão de WhatsApp alternativo, em `src/content.js`.

**Importante:** o formulário não guarda dados no projeto React ou diretamente na Vercel. Os envios são recebidos no Formspree. Sem ID configurado, o site informa que os pedidos estão indisponíveis — não confirma um envio falso. Isso também vale para executar localmente sem arquivo `.env.local`.

## Coleção de demos

| Segmento    | Original  | Novos modelos             |
| ----------- | --------- | ------------------------- |
| Gastronomia | Brasa     | Miso, Alba Café           |
| Beleza      | Corte 013 | Áurea Studio, Ritmo Club  |
| Arquitetura | Morada    | Lume Arquitetura, Vértice |
| Fitness     | Forma     | Pulse Training, Serena    |
| Comércio    | Flora     | Objeto, Cacau & Afeto     |
| Tecnologia  | Pixelware | Orbit, Nexus Systems      |

Os conteúdos dos novos modelos ficam em `src/demo-models.js`; o catálogo utiliza esses mesmos dados. `scripts/generate-demos.mjs` gera os HTMLs completos em `public/demos/`, com estrutura por segmento, e o CSS de cores de cada modelo em `public/demos/styles/` (`aurea.css`, `cacau.css` etc.). Os estilos compartilhados ficam em `styles/collection.css` e os comportamentos em `collection.js`. Os HTMLs e os CSSs de cores são regenerados automaticamente antes de `npm run build`; altere os dados no arquivo de origem, não nos arquivos gerados.

Todos os CSSs das demos ficam em `public/demos/styles/`. As seis demos originais carregam `styles/demo-common.css` e seu CSS específico: `styles/brasa.css`, `styles/corte.css`, `styles/morada.css`, `styles/forma.css`, `styles/flora.css` e `styles/pixel.css`. Imagens referenciadas nesses CSSs usam caminhos relativos como `../assets/...`. A página React continua usando `src/redesign.css`; o fallback sem JavaScript usa `public/noscript.css` e a prévia antiga usa `PREVIA.css`. Blocos e atributos de CSS estático foram retirados dos HTMLs. Estilos calculados durante a execução, como escalas dos iframes, posições das partículas e índices de animação, continuam no JavaScript.

```bash
npm run demos:generate
npm run build
node scripts/browser-check.mjs
```

O último comando usa o Google Chrome instalado no Windows, inicia uma prévia temporária, verifica as 18 demos e atualiza suas capturas. Também verifica abertura a cada recarregamento, links para seções, temas, ponteiro, filtros, teclado, prévias, seleção de modelo, armazenamento bloqueado e movimento reduzido no redesign, em 375, 768 e 1440 pixels. Use `node scripts/browser-check.mjs --home-only` para verificar só a página principal, sem regenerar as capturas das demos. O relatório e capturas de revisão ficam em `.qa/` (ignorada pelo Git). Faça um novo build após atualizar as capturas para incluí-las na entrega.

Reservas, agendamentos, compras e planos nas demos são simulações locais identificadas na interface. Nenhum pagamento ou solicitação é enviado pelas marcas fictícias. O contato real continua na página principal da Codik.

## Testar a versão na Vercel

1. Trabalhe na branch `design-experimental`.
2. Confira os contatos em `src/content.js` e execute `npm run build`.
3. Envie os commits dessa branch ao GitHub.
4. Se o repositório estiver conectado à Vercel com previews habilitados, use a URL de preview da branch para revisar o redesign.
5. A publicação no domínio principal fica para depois da revisão e integração à branch de produção.

Configurações: framework `Vite`, build `npm run build`, output `dist`. O projeto não possui scripts de lint ou uma suíte de testes de terceiros; a validação usa o build e o roteiro de navegador acima.

## Performance e validação

O catálogo da página principal usa `src/demo-catalog.js`, gerado a partir de `src/demo-models.js` pelo mesmo comando que gera as demos. Os conteúdos completos das marcas continuam em seus HTMLs, sem entrar no JavaScript da home.

As fotos originais e capturas completas são preservadas. As demos usam WebP somente quando o arquivo é menor, com fallback JPEG. O cartão flutuante carrega miniaturas de 260/520 pixels apenas após o primeiro hover, com versões para telas de maior densidade.

Após substituir fotos ou regenerar as capturas das demos, prepare os derivados antes de compilar:

```bash
npm run images:optimize
npm run build
npm run test:assets
npm run test:browser
npm run audit:performance -- after
```

`images:optimize` utiliza o Chrome instalado, sem dependências adicionais. Um manifesto registra dimensões e hashes para evitar reconversões. Os derivados e o manifesto devem acompanhar os arquivos originais no repositório; o build não depende do Chrome. Os testes de navegador e a auditoria local também utilizam Chrome (Windows e Node recente; o auditor aceita `CHROME_PATH`). Não enviam o formulário real. A auditoria salva métricas e capturas em `.qa/`, sem simular uma pontuação Lighthouse ou dados de usuários reais.

Resultados, escopo e limitações estão em [PERFORMANCE-AUDIT.md](PERFORMANCE-AUDIT.md). A abertura, suas durações, fontes, blur e os demais efeitos visuais permanecem preservados.

## Privacidade

Os envios incluem nome, e-mail, WhatsApp, modelo e mensagem. Só ofereça aos devs autorizados acesso ao painel Formspree. Antes de aceitar clientes reais, documente retenção e política de privacidade dos contatos.

## Limitações

- Para **testar envio verdadeiro**, é obrigatório configurar um ID real do Formspree; sem ele não há salvamento.
- A prévia `PREVIA.html` é uma visualização estática antiga e **não deve ser usada** para testar o redesign ou o formulário. Teste com `npm run dev` ou na Vercel.
- As 18 páginas demo são conceitos demonstrativos; funcionalidades comerciais e integrações reais exigem personalização específica para cada cliente.
