# CODIK DESIGN — Versão 6 (Vercel + Formspree)

Site do estúdio de **Isaías, Rodrigo e Nicolas**. Esta versão substitui a logo anterior pela logo CODIK enviada pela equipe, incorpora navegação animada, carrossel com os seis modelos e mantém o formulário Formspree.

## Usar no VS Code

```bash
npm install
npm run dev
```

Abra o link local mostrado no terminal. Teste no celular e no desktop.

## O que mudou

- Logo **CODIK DESIGN** em `public/codik-logo.png`, extraída do arquivo enviado pela equipe (sem redesenhar a arte).
- Menu com feedback visual ao selecionar seção, indicador da seção atual e abertura/fechamento animados no celular.
- Carrossel horizontal responsivo de projetos com setas, indicadores clicáveis, rolagem por toque e teclado, respeitando filtros.
- Catálogo e nomes mantidos; textos visíveis da marca alterados para CODIK DESIGN.
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
- As seis páginas demo são conceitos demonstrativos; algumas funcionalidades comerciais exigem personalização específica para cada cliente.
