# Redesign interativo do codik.com.br — instruções para a IA

> Cole este arquivo na raiz do projeto e peça à IA (Copilot, Claude Code, Cursor etc.):
> **"Siga o arquivo CODIK-REDESIGN.md do começo ao fim, na ordem."**

---

## 1. Contexto

- **Codik Design®** é um estúdio independente de design e desenvolvimento web, em São Paulo, feito por **três pessoas jovens**.
- O site atual é visto pelos donos como **simples demais, genérico e com "cara de IA"**. Eles querem um site que cause impacto nos primeiros 3 segundos e **dê prazer de usar** (interação, movimento, personalidade).
- O site é o próprio portfólio do estúdio: a qualidade visual e a sensação de uso são o produto.

## 2. Como você deve trabalhar

1. **Explore antes de mexer.** Identifique a stack (HTML estático, React/Vite, Next.js, Astro, WordPress, outra), a estrutura de pastas, onde ficam CSS, fontes, componentes e rotas. Escreva um resumo de 5 a 10 linhas do que encontrou e do plano de portagem. Se algo essencial for ambíguo, pergunte antes de agir.
2. **Preserve o que já existe de real**: textos, projetos, links, contato, meta tags/SEO, analytics, formulários, favicon, domínio. Troque o **visual e o comportamento**, não o conteúdo. Não invente dados. Onde faltar informação, deixe um `TODO:` visível no código.
3. **Uma etapa por vez**, com commits pequenos e mensagens claras (se houver git, crie um branch `redesign-interativo`).
4. **A implementação de referência está no fim deste arquivo** (HTML único). Ela é a fonte de verdade do visual e do comportamento. **Porte para a stack do projeto; não cole cegamente** se isso quebrar a arquitetura existente.
5. Ao terminar, rode build, lint e testes (se existirem) e corrija o que quebrar.

## 3. Direção de design (não negociar)

**Estilo:** editorial ousado, com cara de estúdio jovem. Tipografia gigante, poucas cores, muito espaço, movimento com intenção.

**Tokens**

| Token | Claro | Escuro |
|---|---|---|
| `--bg` | `#f4f0e9` | `#141311` |
| `--fg` | `#141414` | `#f4f0e9` |
| `--ac` (acento, única cor viva) | `#ff4a1c` | `#ff4a1c` |
| `--mut` (texto secundário) | `#6b665c` | `#9b958a` |
| `--line` (bordas finas) | `#14141433` | `#f4f0e933` |

- **Fontes (Google Fonts):** *Bricolage Grotesque* (variável, `wght 200..800`) para tudo e *Instrument Serif* em itálico só para destaques. Use `display=swap` ou faça self-host.
- **Evitar de vez:** degradês, brilhos/glow, cantos muito arredondados, sombras suaves em cards, três cards iguais em fila, Inter/Poppins/Space Grotesk, emojis como ícones, frases genéricas ("soluções inovadoras", "leve seu negócio ao próximo nível").
- **Preferir:** bordas finas de 1px, grid assimétrico, títulos enormes, uma cor de acento usada com coragem.
- **Tema claro/escuro:** seguir `prefers-color-scheme` por padrão e ter botão para alternar (`data-theme="light|dark"` no `<html>`).

## 4. O que implementar (checklist com critérios de aceite)

### 4.1 Tokens, tipografia e base
- [ ] Variáveis CSS acima na raiz, com versão escura.
- [ ] Fontes carregadas com fallback decente (`system-ui`, `Georgia`).
- [ ] Título principal com `clamp()` (ex.: `clamp(3rem, 12vw, 11rem)`), `letter-spacing` negativo e `line-height` ~0.88.

### 4.2 Animação de abertura (intro) — peça central
Sequência, em ~3,9 s no total:
1. Tela cheia na cor `--bg` com a palavra **"codik"** gigante (`clamp(5rem, 27vw, 24rem)`, peso 800).
2. As letras **sobem uma a uma** de dentro de uma máscara (`overflow:hidden`), com atraso de 80 ms entre elas, `cubic-bezier(.2,.9,.1,1)`.
3. O **®** em cor de acento aparece girando e escalando (de -90° e escala 0 para normal).
4. Um **contador 0 → 100%** no canto inferior direito, com easing (`1-(1-p)^3`) em ~1,9 s. No canto inferior esquerdo, a legenda "design e desenvolvimento web".
5. Em ~2,4 s as letras **saem para cima**; em ~2,9 s a tela inteira **sobe como cortina** (`translateY(-100%)`, 0,9 s, `cubic-bezier(.76,0,.24,1)`) com uma **borda de 8px na cor de acento** na base.
6. O hero é revelado: cada linha do título sobe de dentro da máscara, com atraso escalonado (0,2 s / 0,3 s / 0,4 s).

Regras importantes para o site real (diferente da demo):
- [ ] **Tocar a intro só na primeira visita da sessão** (`sessionStorage` dentro de `try/catch`). Nas demais navegações, ir direto ao conteúdo.
- [ ] **Permitir pular** (clique ou tecla `Esc`).
- [ ] **Respeitar `prefers-reduced-motion`**: sem intro, conteúdo direto.
- [ ] A intro é **um overlay**: o conteúdo real já está no HTML por baixo (SEO e acessibilidade). Nunca esconda o conteúdo atrás do JavaScript.
- [ ] Travar o scroll só enquanto a intro estiver visível.
- [ ] Manter o botão "↻" (rever abertura) no menu, ao menos em desenvolvimento.

### 4.3 Título que reage ao mouse
- [ ] Cada letra do título é um `<span>`; o `<h1>` recebe `aria-label` com o texto completo e os spans `aria-hidden="true"`.
- [ ] Letras perto do cursor **engordam** (peso 300 → 800 em até ~260px de distância, com suavização).
- [ ] **Só em dispositivos com ponteiro fino** (`(hover:hover) and (pointer:fine)`). Em touch, peso fixo 800.
- [ ] Performance: a referência chama `getBoundingClientRect()` por frame. Se houver lentidão, **guarde as posições** e recalcule em `resize`/`scroll`, e pause o loop quando o mouse estiver parado ou fora da janela.

### 4.4 Cursor customizado
- [ ] Bolinha de 16px, `mix-blend-mode: difference`, seguindo o mouse com suavização (lerp ~0,22).
- [ ] Cresce para 72px sobre links e botões.
- [ ] `cursor:none` **apenas** com ponteiro fino. Em touch, nada disso aparece.

### 4.5 Elementos magnéticos
- [ ] Links do menu e botão de contato se movem ~35% na direção do cursor enquanto ele está sobre eles, e voltam ao sair (`transition: transform .25s`).

### 4.6 Lista de trabalhos com pré-visualização
- [ ] Linhas em grid (`número | título | categoria | ano`), com borda de 1px.
- [ ] Hover: a linha desliza para a direita, o título vai para a cor de acento e **as outras linhas apagam** (opacity .3).
- [ ] Um **cartão de pré-visualização segue o cursor** (260×320, com atraso e inclinação proporcional à velocidade, limitada a ±14°).
- [ ] **No site real, use a imagem/thumbnail de cada projeto no cartão** (a referência usa blocos de cor com uma letra só como placeholder). Use os projetos reais já existentes no site.
- [ ] Em touch, o cartão não aparece e as linhas funcionam como links normais.
- [ ] Remover o `preventDefault` da referência: as linhas devem **levar à página/URL real** de cada projeto.

### 4.7 Confete nos cliques
- [ ] Clique em qualquer lugar solta ~9 quadradinhos (10px, cores `--ac` e `--fg`) que se espalham e somem em ~0,6–1,1 s, via Web Animations API. No botão de contato, ~26.
- [ ] Desativar com `prefers-reduced-motion`. Não disparar em campos de formulário nem ao selecionar texto.

### 4.8 Faixa em movimento (marquee)
- [ ] "CODIK DESIGN® ✦" repetido, rolando em loop (22 s), entre o hero e os trabalhos. `aria-hidden="true"`; pausa com reduced-motion.

### 4.9 Aparecer ao rolar
- [ ] Seções entram com `opacity` + `translateY(30px)` quando 15% ficam visíveis (`IntersectionObserver`), uma vez só. Sem JS ou com reduced-motion, tudo visível.

### 4.10 Chamada final de contato
- [ ] Título "Bora fazer algo *fora do comum?*" (destaque em serifada itálica na cor de acento) e botão circular de acento (9,5rem), magnético.
- [ ] **TODO:** ligar o botão ao canal real (e-mail, WhatsApp ou formulário que já existe no site). Não invente e-mail.

### 4.11 Seção "Quem somos" (nova)
- [ ] Criar uma seção com **os três sócios**: foto real, nome e função, no mesmo estilo editorial (tipografia grande, grid assimétrico, hover com personalidade).
- [ ] **TODO:** nomes, funções e fotos reais virão dos donos. Deixe a estrutura pronta e os campos marcados com `TODO`.

### 4.12 Detalhes que dão personalidade
- [ ] Relógio ao vivo "São Paulo, HH:MM" (`Intl`/`toLocaleTimeString` com `timeZone:'America/Sao_Paulo'`).
- [ ] Selo "disponível para projetos" com ponto pulsando na cor de acento.
- [ ] Botão de alternar tema (◐) no menu.

## 5. Qualidade (vale para tudo)

- **Acessibilidade:** foco de teclado visível em todos os interativos, navegação por Tab funcionando, contraste mínimo AA, `aria-hidden` em elementos decorativos, `prefers-reduced-motion` respeitado em **todas** as animações.
- **Desempenho:** animar apenas `transform` e `opacity`; usar `requestAnimationFrame`; imagens otimizadas (`loading="lazy"`, dimensões definidas); nada que cause layout shift.
- **Responsivo:** testar em 375px, 768px e 1440px. No celular: sem cursor customizado, sem hover-preview, letras do título com peso fixo, lista de trabalhos em 3 colunas (esconder a categoria).
- **SEO:** um único `<h1>`, textos reais no HTML (SSR/SSG, se o framework tiver), manter `<title>`, `meta description`, `theme-color` (`#f4f0e9`) e Open Graph existentes.
- **Segurança de conteúdo:** ao usar bibliotecas externas, fixar versão exata. Preferir JS puro, como na referência (zero dependências).

## 6. Como portar, por stack

- **HTML/CSS/JS estático:** mover o CSS da referência para o arquivo de estilos do projeto, o JS para um arquivo próprio carregado com `defer`, e mesclar o HTML às páginas existentes preservando o conteúdo atual.
- **React / Next.js / Astro / Vue:** transformar cada bloco em componente (`Intro`, `SplitTitle`, `Cursor`, `Magnetic`, `WorkList`, `Marquee`, `Reveal`, `ThemeToggle`). Em Next, componentes com efeitos de navegador usam `'use client'`; evitar acessar `window`/`document` durante o render no servidor. Use CSS Modules, Tailwind ou o que o projeto já usa; não introduza uma nova lib de estilos nem GSAP/Framer Motion se o projeto ainda não os usa.
- **WordPress:** **não editar o tema pai.** Usar tema filho (ou plugin simples), enfileirar CSS/JS com `wp_enqueue_style/script`, e mapear as seções para os templates existentes.
- **Webflow/Wix/Squarespace (sem acesso ao código):** pare e avise; neste caso o caminho é injetar CSS/JS customizado pelo painel e a IA deve adaptar a referência a esse formato.

## 7. Entrega esperada

1. Resumo da stack encontrada e do que foi alterado, arquivo por arquivo.
2. Lista de **TODOs** pendentes (fotos, nomes, links, e-mail, imagens dos projetos).
3. Como rodar localmente e como fazer o deploy.
4. O que **não** foi feito e por quê.

---

## 8. Implementação de referência (HTML único, sem dependências)

Esta é a versão aprovada pelos donos. Comportamento e visual são a meta.

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>CODIK DESIGN® — Design e desenvolvimento web</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@200..800&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
<style>
:root{--bg:#f4f0e9;--fg:#141414;--ac:#ff4a1c;--mut:#6b665c;--line:#14141433;color-scheme:light;
box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#141311;--fg:#f4f0e9;--mut:#9b958a;--line:#f4f0e933;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#141311;--fg:#f4f0e9;--mut:#9b958a;--line:#f4f0e933;color-scheme:dark}
html{scroll-padding-top:env(safe-area-inset-top,0px)}
*{box-sizing:border-box;margin:0}
body{background:var(--bg);color:var(--fg);font-family:"Bricolage Grotesque",system-ui,sans-serif;font-weight:500;overflow-x:hidden;transition:background .5s,color .5s}
body.loading{overflow:hidden}
a{color:inherit;text-decoration:none}
.serif{font-family:"Instrument Serif",Georgia,serif;font-style:italic;font-weight:400}

/* cursor */
.cur{position:fixed;top:0;left:0;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;background:#fff;mix-blend-mode:difference;pointer-events:none;z-index:100;display:none;transition:width .3s,height .3s,margin .3s}
.cur.big{width:72px;height:72px;margin:-36px 0 0 -36px}
@media (hover:hover) and (pointer:fine){.cur{display:block}body,a,button{cursor:none}}
.pt{position:fixed;width:10px;height:10px;z-index:90;pointer-events:none}

/* intro */
#intro{position:fixed;top:0;bottom:0;left:0;right:0;z-index:50;background:var(--bg);display:flex;align-items:center;justify-content:center;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);transition:transform .9s cubic-bezier(.76,0,.24,1)}
#intro[hidden]{display:none}
#intro::after{content:"";position:absolute;left:0;right:0;bottom:-8px;height:8px;background:var(--ac)}
#intro.out{transform:translateY(-100%)}
.word{display:flex;align-items:flex-start;overflow:hidden;padding:.04em .06em .14em;font-weight:800;font-size:clamp(5rem,27vw,24rem);line-height:.85;letter-spacing:-.05em}
.l{display:inline-block;transform:translateY(115%)}
.run .l{animation:up 1s cubic-bezier(.2,.9,.1,1) forwards;animation-delay:calc(var(--i)*.08s + .15s)}
.exit .l{animation:down .55s cubic-bezier(.7,0,.8,.2) forwards;animation-delay:calc(var(--i)*.04s)}
@keyframes up{to{transform:none}}
@keyframes down{from{transform:none}to{transform:translateY(-115%)}}
.r{font-size:.16em;color:var(--ac);margin:.5em 0 0 .15em;font-weight:800;opacity:0;letter-spacing:0}
.run .r{animation:pop .6s cubic-bezier(.3,1.6,.5,1) 1.1s forwards}
@keyframes pop{from{opacity:0;transform:scale(0) rotate(-90deg)}to{opacity:1;transform:none}}
.count,.tag{position:absolute;bottom:calc(1.5rem + env(safe-area-inset-bottom,0px));font-size:.8rem;letter-spacing:.08em;text-transform:uppercase}
.count{right:1.5rem;font-variant-numeric:tabular-nums}
.tag{left:1.5rem;color:var(--mut)}

/* nav + hero */
nav{position:absolute;top:env(safe-area-inset-top,0px);left:0;right:0;display:flex;justify-content:space-between;align-items:center;padding:1.5rem;font-size:.9rem;z-index:5}
nav b{font-weight:800;letter-spacing:-.02em;font-size:1.1rem}
nav div{display:flex;gap:1.5rem;align-items:center}
nav button{background:none;border:0;font:inherit;color:inherit}
nav a:hover,nav button:hover{color:var(--ac)}
[data-mag]{display:inline-block;transition:transform .25s ease-out}
main{min-height:100svh;display:flex;flex-direction:column;justify-content:flex-end;padding:7rem 1.5rem 1.5rem}
h1{font-weight:800;font-size:clamp(3rem,12vw,11rem);line-height:.88;letter-spacing:-.045em}
h1 em{color:var(--ac);font-size:1.05em;letter-spacing:-.02em}
.line{display:block;overflow:hidden;padding-bottom:.08em}
.line>span{display:block;transform:translateY(110%);transition:transform 1.1s cubic-bezier(.2,.9,.1,1) var(--d,0s)}
.ready .line>span{transform:none}
.ch{display:inline-block}
.fade{opacity:0;transform:translateY(12px);transition:all .9s ease 1s}
.ready .fade{opacity:1;transform:none}
.hint{font-size:.8rem;color:var(--mut);margin-top:1rem}
.meta{display:flex;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin:1.5rem 0;padding-top:1rem;border-top:1px solid var(--line);font-size:.95rem}
.meta p{max-width:34ch;color:var(--mut)}
.badge{display:inline-flex;gap:.5rem;align-items:center}
.badge::before{content:"";width:.6rem;height:.6rem;border-radius:50%;background:var(--ac);animation:blink 1.4s infinite}
@keyframes blink{50%{opacity:.2}}
.marq{overflow:hidden;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:.8rem 0;white-space:nowrap;font-weight:800;font-size:1.4rem;letter-spacing:-.02em}
.marq div{display:inline-block;animation:m 22s linear infinite}
.marq i{color:var(--ac);font-style:normal;margin:0 1.2rem}
@keyframes m{to{transform:translateX(-50%)}}

/* trabalhos */
section{padding:6rem 1.5rem}
h2{font-weight:800;font-size:clamp(2rem,7vw,5rem);letter-spacing:-.04em;margin-bottom:2.5rem}
h2 sup{font-size:.3em;color:var(--ac);margin-left:.4em;letter-spacing:0}
.row{display:grid;grid-template-columns:3rem 1fr auto auto;gap:1rem;align-items:baseline;padding:1.5rem 0;border-top:1px solid var(--line);transition:padding .35s cubic-bezier(.2,.9,.1,1),color .3s,opacity .3s}
.row:last-of-type{border-bottom:1px solid var(--line)}
.row b{font-weight:800;font-size:clamp(1.6rem,5vw,4rem);letter-spacing:-.04em;line-height:1}
.row span,.row i{font-size:.9rem;color:var(--mut);font-style:normal}
.list:hover .row:not(:hover){opacity:.3}
.row:hover{padding-left:1.5rem;color:var(--ac)}
.pv{position:fixed;top:0;left:0;width:260px;height:320px;z-index:40;pointer-events:none;display:flex;align-items:flex-end;padding:1rem;font-weight:800;font-size:5rem;line-height:.8;letter-spacing:-.05em;opacity:0;transition:opacity .25s;background:var(--ac);color:var(--bg)}
.pv.on{opacity:1}
@media (hover:none){.pv{display:none}}
@media (max-width:640px){.row{grid-template-columns:2rem 1fr auto}.row i{display:none}}

/* cta */
.cta{text-align:center;padding:8rem 1.5rem 5rem}
.cta h2{font-size:clamp(2.4rem,9vw,8rem);line-height:.92;margin:0 0 3rem}
.cta h2 em{color:var(--ac)}
.go{width:9.5rem;height:9.5rem;border-radius:50%;background:var(--ac);color:#141414;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:1.05rem;line-height:1.1;text-align:center;border:0}
footer{display:flex;justify-content:space-between;flex-wrap:wrap;gap:1rem;padding:1.5rem;border-top:1px solid var(--line);font-size:.85rem;color:var(--mut)}

.rv{opacity:0;transform:translateY(30px);transition:all .9s cubic-bezier(.2,.9,.1,1)}
.rv.in{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){.marq div,.badge::before{animation:none}.rv{opacity:1;transform:none}}
</style>
</head>
<body class="loading">

<div class="cur" id="cur"></div>

<div id="intro" aria-hidden="true">
  <div class="word"><span class="l">c</span><span class="l">o</span><span class="l">d</span><span class="l">i</span><span class="l">k</span><sup class="r">®</sup></div>
  <div class="tag">design e desenvolvimento web</div>
  <div class="count"><span id="n">0</span>%</div>
</div>

<nav>
  <b>CODIK®</b>
  <div><a href="#trabalhos" data-mag>Trabalhos</a><a href="#contato" data-mag>Contato</a><button id="tg" data-mag title="Alternar claro/escuro">◐</button><button id="replay" data-mag title="Rever a abertura">↻</button></div>
</nav>

<main>
  <h1>
    <span class="line"><span class="split" style="--d:.2s">Sites que</span></span>
    <span class="line"><span style="--d:.3s"><em class="serif">ninguém</em></span></span>
    <span class="line"><span class="split" style="--d:.4s">esquece.</span></span>
  </h1>
  <p class="hint fade">↑ passe o mouse sobre o título</p>
  <div class="meta fade">
    <p>Estúdio independente de design e desenvolvimento web, feito por três pessoas.</p>
    <span class="badge">disponível para projetos</span>
    <span>São Paulo, <span id="clock">--:--</span></span>
  </div>
</main>

<div class="marq" aria-hidden="true"><div id="mq"></div></div>

<section id="trabalhos">
  <h2 class="rv">Trabalhos<sup>04</sup></h2>
  <div class="list rv">
    <a class="row" href="#" data-c="#ff4a1c" data-f="#f4f0e9" data-t="S"><span>01</span><b>Studio Lume</b><i>Identidade e site</i><span>2026</span></a>
    <a class="row" href="#" data-c="#1d3fff" data-f="#f4f0e9" data-t="C"><span>02</span><b>Casa Norte</b><i>Site e e-commerce</i><span>2026</span></a>
    <a class="row" href="#" data-c="#141414" data-f="#f4f0e9" data-t="A"><span>03</span><b>Ateliê Vão</b><i>Portfólio</i><span>2025</span></a>
    <a class="row" href="#" data-c="#d9ff3f" data-f="#141414" data-t="F"><span>04</span><b>Ferro &amp; Flor</b><i>Landing page</i><span>2025</span></a>
  </div>
</section>
<div class="pv" id="pv"></div>

<section class="cta" id="contato">
  <h2 class="rv">Bora fazer algo <em class="serif">fora do comum?</em></h2>
  <a class="go rv" href="#" data-mag id="go">Falar com a gente</a>
</section>

<footer><span>CODIK DESIGN® 2026</span><span>feito em São Paulo, por três</span></footer>

<script>
(()=>{
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const intro=$('#intro'),n=$('#n'),b=document.body,cur=$('#cur'),pv=$('#pv');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
  $$('.l').forEach((e,i)=>e.style.setProperty('--i',i));
  $('#mq').innerHTML='CODIK DESIGN®<i>✦</i>'.repeat(12);

  // título interativo: cada letra engorda perto do cursor
  $$('.split').forEach(el=>{const t=el.textContent;el.textContent='';
    [...t].forEach(c=>{const s=document.createElement('span');s.className='ch';s.textContent=c===' '?'\u00a0':c;s._w=fine?300:800;s.style.fontWeight=s._w;el.appendChild(s)})});
  const chs=$$('.ch');

  // relógio
  const clock=$('#clock'),tick=()=>clock.textContent=new Date().toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'});
  tick();setInterval(tick,15000);

  // cursor, pré-visualização e letras (um loop só)
  let mx=-999,my=-999,cx=-999,cy=-999,px=0,py=0,rot=0;
  addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY});
  (function loop(){
    cx+=(mx-cx)*.22;cy+=(my-cy)*.22;
    cur.style.transform=`translate(${cx}px,${cy}px)`;
    const ox=px;px+=(mx-px)*.14;py+=(my-py)*.14;
    rot+=((px-ox)*.6-rot)*.2;
    pv.style.transform=`translate(${px+28}px,${py-160}px) rotate(${Math.max(-14,Math.min(14,rot))}deg)`;
    if(fine&&!reduce)chs.forEach(c=>{
      const r=c.getBoundingClientRect(),d=Math.hypot(mx-(r.left+r.width/2),my-(r.top+r.height/2));
      const t=300+500*Math.max(0,1-d/260);
      if(Math.abs(t-c._w)>.5){c._w+=(t-c._w)*.18;c.style.fontWeight=Math.round(c._w)}
    });
    requestAnimationFrame(loop);
  })();
  document.addEventListener('pointerover',e=>{cur.classList.toggle('big',!!e.target.closest('a,button'))});

  // links magnéticos
  $$('[data-mag]').forEach(el=>{
    el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();
      el.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.35}px,${(e.clientY-r.top-r.height/2)*.35}px)`});
    el.addEventListener('pointerleave',()=>el.style.transform='');
  });

  // lista de trabalhos
  $$('.row').forEach(r=>{
    r.addEventListener('pointerenter',()=>{pv.style.background=r.dataset.c;pv.style.color=r.dataset.f;pv.textContent=r.dataset.t;pv.classList.add('on')});
    r.addEventListener('pointerleave',()=>pv.classList.remove('on'));
  });

  // confete de quadradinhos
  function burst(x,y,k){for(let i=0;i<k;i++){const s=document.createElement('i');s.className='pt';s.style.left=x+'px';s.style.top=y+'px';
    s.style.background=i%3?'var(--ac)':'var(--fg)';document.body.appendChild(s);
    const a=Math.random()*6.28,d=50+Math.random()*130;
    s.animate([{transform:'translate(0,0) rotate(0)',opacity:1},{transform:`translate(${Math.cos(a)*d}px,${Math.sin(a)*d}px) rotate(${Math.random()*360}deg)`,opacity:0}],
      {duration:600+Math.random()*500,easing:'cubic-bezier(.2,.8,.2,1)'}).onfinish=()=>s.remove()}}
  addEventListener('click',e=>burst(e.clientX,e.clientY,9));
  $('#go').addEventListener('click',e=>{e.preventDefault();burst(e.clientX,e.clientY,26)});
  $$('.row').forEach(r=>r.addEventListener('click',e=>e.preventDefault()));

  // tema
  const root=document.documentElement;
  $('#tg').onclick=()=>{const dark=root.dataset.theme?root.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches;root.dataset.theme=dark?'light':'dark'};

  // aparecer ao rolar
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.15});
  $$('.rv').forEach(e=>io.observe(e));

  // intro
  let timers=[];
  function play(){
    timers.forEach(clearTimeout);timers=[];
    intro.className='';intro.hidden=false;b.classList.remove('ready');b.classList.add('loading');n.textContent='0';
    void intro.offsetWidth;intro.classList.add('run');
    const t0=performance.now(),D=1900;
    (function step(t){const p=Math.min((t-t0)/D,1);n.textContent=Math.round(100*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(step)})(t0);
    timers.push(setTimeout(()=>intro.classList.add('exit'),2400));
    timers.push(setTimeout(()=>{intro.classList.add('out');b.classList.remove('loading');b.classList.add('ready')},2900));
    timers.push(setTimeout(()=>{intro.hidden=true},3900));
  }
  if(reduce){intro.hidden=true;b.className='ready'}else play();
  $('#replay').onclick=play;
})();
</script>
</body>
</html>

```
