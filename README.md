# CODIK DESIGN — Redesign editorial interativo

Site do estúdio de **Isaías, Rodrigo e Nicolas**. A coleção reúne **18 demos em seis segmentos**, com busca, filtros e capturas reais dos sites. O formulário de contato continua integrado ao Formspree.

## Usar no VS Code

```bash
npm ci
npm run dev
```

Abra o link local mostrado no terminal. Teste no celular e no desktop.

## Redesign experimental

Portagem da referência `CODIK-REDESIGN.md` para React/Vite. A branch padrão é `design-experimental`. A branch `versao-atual` preserva a versão anterior.

- Bricolage Grotesque variável, Instrument Serif, composição editorial e acento laranja `#ff4a1c`.
- Abertura de aproximadamente 3,9 segundos a cada carregamento ou recarregamento da página; clique ou Escape para pular, botão para repetir e desativação com movimento reduzido. Links para seções mantêm o destino após a abertura.
- Títulos principais, nomes dos modelos e nomes da equipe sensíveis ao cursor, com quebra por palavras e leitura acessível. O efeito acompanha filtros e trocas de abas; o cursor personalizado e os links magnéticos funcionam apenas com ponteiro fino. Posições das letras armazenadas e loop pausado quando estabiliza.
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

Os conteúdos dos novos modelos ficam em `src/demo-models.js`; o catálogo utiliza esses mesmos dados. `scripts/generate-demos.mjs` gera os HTMLs completos em `public/demos/`, com estrutura por segmento. Comportamentos e estilos ficam em `collection.js` e `collection.css`. Os HTMLs são regenerados automaticamente antes de `npm run build`.

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

## Privacidade

Os envios incluem nome, e-mail, WhatsApp, modelo e mensagem. Só ofereça aos devs autorizados acesso ao painel Formspree. Antes de aceitar clientes reais, documente retenção e política de privacidade dos contatos.

## Limitações

- Para **testar envio verdadeiro**, é obrigatório configurar um ID real do Formspree; sem ele não há salvamento.
- A prévia `PREVIA.html` é uma visualização estática antiga e **não deve ser usada** para testar o redesign ou o formulário. Teste com `npm run dev` ou na Vercel.
- As 18 páginas demo são conceitos demonstrativos; funcionalidades comerciais e integrações reais exigem personalização específica para cada cliente.


## Segurança e organização

- `src/`: componentes, conteúdo e estilos da aplicação.
- `public/demos/`: conceitos demonstrativos e seus arquivos estáticos.
- `scripts/`: geração das demos e ferramentas locais de revisão.
- `vercel.json`: build e cabeçalhos de segurança da produção.
- Variáveis com prefixo `VITE_` são públicas no navegador: nunca colocar senhas ou tokens nelas.
- Arquivos `.env*` (exceto `.env.example`), chaves e a pasta `.vercel/` são ignorados pelo Git. Isso não remove arquivos já rastreados ou presentes no histórico.
- Scripts da página e das demos usam arquivos locais; a política CSP não permite scripts inline ou `eval`.
- Revise alterações e dependências antes de publicar: `npm ci`, `npm audit` e `npm run build`.
- Conteúdo público continua protegido por direitos autorais; tornar o repositório público não adiciona uma licença de uso.
