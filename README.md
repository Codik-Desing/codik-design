# CODIK DESIGN — Coleção de modelos (Vercel + Formspree)

Site do estúdio de **Isaías, Rodrigo e Nicolas**. A coleção reúne **18 demos em seis segmentos**, com busca, filtros e capturas reais dos sites. O formulário de contato continua integrado ao Formspree.

## Usar no VS Code

```bash
npm install
npm run dev
```

Abra o link local mostrado no terminal. Teste no celular e no desktop.

## O que mudou

- Logo **CODIK DESIGN** em `public/codik-logo.png`, extraída do arquivo enviado pela equipe (sem redesenhar a arte).
- Menu com feedback visual ao selecionar seção, indicador da seção atual e abertura/fechamento animados no celular.
- Galeria responsiva com filtros por segmento e tipo de site, busca que reconhece palavras sem acentos e ordenação por novidades ou nome.
- Capturas reais em `public/demos/previews/`, com rolagem da imagem ao passar o mouse. O botão de prévia abre a demo interativa em desktop ou celular.
- Dois modelos novos por segmento, preservando os seis originais. Cada demo tem conteúdo próprio, botões animados, composição visual específica e interações relevantes ao negócio.
- Elementos com perspectiva e geometria 3D feitos com CSS, resposta ao cursor e navegação por teclado. Animações respeitam a preferência de movimento reduzido.
- Fotografias armazenadas no projeto em `public/demos/assets/`.
- Site de fundo claro e tonalidades discretas de roxo, com áreas escuras no FAQ e contato.
- Mantido formulário Formspree do pacote V5, com confirmação ou erro do servidor. **Não é painel administrativo próprio.**

## Formulário (Vercel)

1. Crie ou escolha um formulário em https://formspree.io/ (painel privado: _Submissions_).
2. Copie o ID de `https://formspree.io/f/SEU_ID`.
3. Vercel → projeto → Settings → Environment Variables: `VITE_FORMSPREE_FORM_ID` = `SEU_ID`.
4. Faça um **Redeploy** para a variável ser incluída na compilação do Vite. O ID não é senha.
5. Teste um envio real: preencha um e-mail seu, aceite os termos e confira no painel do Formspree. Ative notificações no painel do Formspree, se desejar.
6. Configure `studio.whatsapp`, se quiser botão de WhatsApp alternativo, em `src/content.js`.

**Importante:** o formulário não guarda dados no projeto React ou diretamente na Vercel. Os envios são recebidos no Formspree. Sem ID configurado, o site informa que os pedidos estão indisponíveis — não confirma um envio falso. Isso também vale para executar localmente sem arquivo `.env.local`.

## Coleção de demos

| Segmento | Original | Novos modelos |
| --- | --- | --- |
| Gastronomia | Brasa | Miso, Alba Café |
| Beleza | Corte 013 | Áurea Studio, Ritmo Club |
| Arquitetura | Morada | Lume Arquitetura, Vértice |
| Fitness | Forma | Pulse Training, Serena |
| Comércio | Flora | Objeto, Cacau & Afeto |
| Tecnologia | Pixelware | Orbit, Nexus Systems |

Os conteúdos dos novos modelos ficam em `src/demo-models.js`; o catálogo utiliza esses mesmos dados. `scripts/generate-demos.mjs` gera os HTMLs completos em `public/demos/`, com estrutura por segmento. Comportamentos e estilos ficam em `collection.js` e `collection.css`. Os HTMLs são regenerados automaticamente antes de `npm run build`.

```bash
npm run demos:generate
npm run build
node scripts/browser-check.mjs
```

O último comando usa o Google Chrome instalado no Windows, inicia uma prévia temporária, verifica navegação e interações e atualiza as 18 capturas reais. Verifica desktop, celular, larguras de 320 e 768 pixels, filtros, detalhes, sacola, simuladores, agendamento, prévia e seleção do modelo no contato. O relatório e capturas de revisão ficam em `.qa/` (ignorada pelo Git). Faça um novo build após atualizar as capturas para incluí-las na entrega.

Reservas, agendamentos, compras e planos nas demos são simulações locais identificadas na interface. Nenhum pagamento ou solicitação é enviado pelas marcas fictícias. O contato real continua na página principal da Codik.

## Atualizar o site publicado na Vercel

1. Extraia a pasta `codik-design` do ZIP.
2. Substitua os arquivos do repositório conectado à Vercel pela nova versão (faça backup antes).
3. Confira os contatos e conteúdos em `src/content.js`.
4. Faça `npm run build` antes de enviar.
5. Execute `git add .`, `git commit -m "Atualiza marca CODIK e carrossel"`, `git push`.
6. A Vercel fará deploy automático se o repositório estiver vinculado; verifique no painel **Deployments**.
7. Abra o domínio, teste menus, demos, filtros, carrossel e formulário real.

Configurações na Vercel: framework `Vite`, build `npm run build`, output `dist`.

## Privacidade

Os envios incluem nome, e-mail, WhatsApp, modelo e mensagem. Só ofereça aos devs autorizados acesso ao painel Formspree. Antes de aceitar clientes reais, documente retenção e política de privacidade dos contatos.

## Limitações

- Para **testar envio verdadeiro**, é obrigatório configurar um ID real do Formspree; sem ele não há salvamento.
- A prévia `PREVIA.html` é uma visualização estática antiga do projeto e **não deve ser usada** para testar o formulário ou o carrossel. Teste com `npm run dev` ou na Vercel.
- As 18 páginas demo são conceitos demonstrativos; funcionalidades comerciais e integrações reais exigem personalização específica para cada cliente.
