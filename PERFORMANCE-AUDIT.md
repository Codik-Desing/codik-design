# Auditoria de performance — CODIK

Data: 27/10/2026. Alterações locais, sem commit, push, publicação ou mudança de infraestrutura.

Atualização posterior a pedido do usuário: a sensibilidade da fonte ficou restrita ao `h1` e aos títulos `h2` das seções. Nomes dos modelos/equipe, etapas e títulos secundários das abas agora têm peso fixo. As medições da auditoria abaixo registram a otimização anterior a esse ajuste de escopo; não foram recalculadas nem atribuídas à versão nova.

Em um ajuste seguinte, “Diferentes ideias.” aumentou 20% e “O mesmo cuidado.” aproximadamente 19%, mantendo a primeira linha do título e as adaptações responsivas. O teste dirigido do hover revelou leituras de `scrollX`/`scrollY` entre escritas de peso das letras. Esses valores agora são lidos uma vez por quadro. A interpolação foi mantida, com pesos exibidos em passos de 10 e escritas no DOM somente quando o peso exibido muda, permitindo reaproveitar variantes próximas da fonte variável. Os resultados específicos desse ajuste ficam em `.qa/studio-before.json` e `.qa/studio-final.json`; não substituem a linha de base da auditoria original abaixo.

Nesse teste dirigido de 90 quadros de ponteiro sobre o título do estúdio, o tempo acumulado de layout antes → depois foi **7,52 → 0,64 s** em 1440 px, **3,77 → 0,38 s** em 768 px, **4,20 → 0,33 s** em 375 px e **4,05 → 0,40 s** em 320 px. O número de layouts no desktop caiu de **2.219 para 108**. O efeito permaneceu ativo e nenhuma dessas larguras apresentou rolagem horizontal. São observações locais em Chrome headless com ponteiro fino, inclusive nas larguras menores; não são medições de um telefone físico nem dados de campo. A regra de altura/largura das letras foi preservada: a correção final está no agrupamento das leituras e dos pesos, sem posicionamento absoluto dos glifos.

## A. Diagnóstico inicial

O diretório estava sem alterações no Git ao iniciar. A inspeção identificou:

- React/React DOM 18.3.1, JavaScript/JSX e CSS; renderização no cliente, sem SSR/hidratação.
- Vite instalado 6.4.4, plugin React 4.7.0, npm e `package-lock.json`.
- Entrada `index.html` → `src/main.jsx` → `Redesign.jsx`, com estilos em `redesign.css`.
- Página principal com catálogo, filtros, busca, temas, abertura, efeitos de ponteiro, prévia em iframe, equipe, abas, FAQ e formulário.
- 18 demos HTML: seis originais e 12 geradas a partir de `demo-models.js`. CSS/JavaScript compartilhados nas 12 novas demos.
- Sem back-end, banco, APIs de dados, vídeos ou biblioteca de animação. Animações usam CSS, RAF e Web Animations. Formspree é a integração de envio; Google Fonts fornece a tipografia.
- Lucide tem seus ícones selecionados pelo tree shaking. `react-router-dom` não participa da entrada atual; não foi removido por não haver custo no bundle dessa página.
- Sem scripts de lint, tipos ou testes unitários. Já existia uma suíte de navegador via Chrome/CDP, utilizada antes e depois.
- Sem configuração de hospedagem/CDN no repositório. O domínio público respondeu pela Vercel, mas contém uma versão diferente da local.

Problemas comprovados:

1. `usePointerExperience` media todas as 421 letras interativas em cada evento de rolagem. O cenário desktop realizou **50.520 leituras de posição**; o de 375 px realizou 50.941. O loop também percorria letras longe do ponteiro.
2. Alterar o trabalho em hover atualizava o estado da raiz e reexecutava os componentes de toda a página, incluindo catálogo, letras e formulário.
3. O cartão flutuante de até 260 px utilizava capturas de 1440 px. A primeira captura era solicitada mesmo com o cartão escondido. Brasa: 405.202 bytes; Vértice: 515.935 bytes.
4. A home importava todos os dados das demos, incluindo cardápios, preços e textos usados somente nos respectivos HTMLs.
5. As fotos eram JPEGs; havia conversões menores possíveis sem mudar resolução ou enquadramento. Algumas imagens das demos originais abaixo da primeira dobra não usavam lazy loading.
6. O favicon solicitava o logo de **2000 × 2000**, com 51.586 bytes.

A abertura de 3,9 s é parte do comportamento documentado, não um indicador real de carregamento. Sua duração, os efeitos de fonte, blur, transições, sombras, cores e tipografia foram preservados.

## B. Alterações realizadas

| Arquivos | Problema e solução | Benefício e impacto |
| --- | --- | --- |
| `src/experience.js` | Cache das posições em coordenadas do documento. Rolagem atualiza apenas limites do cartão. Redimensionamento, fontes, mudanças de conteúdo/tamanho e fim das transições continuam invalidando o cache. Letras agrupadas pela posição vertical; o RAF calcula as próximas ao ponteiro e as que ainda estão voltando ao peso original. | Menos leituras e cálculos, mantendo raio, pesos, interpolação e aparência do efeito. Novos RAFs são cancelados na limpeza do hook. |
| `src/Redesign.jsx` | Conteúdo da página isolado com `memo` e callbacks estáveis. Hover atualiza o cartão sem reexecutar todo o conteúdo. | Menor trabalho de React em uma interação frequente. Estados internos, filtros, abas, tema e formulário continuam atualizando normalmente. |
| `src/Redesign.jsx`, `src/experience.js`, `public/demos/previews/*-260.*`, `*-520.*` | Miniaturas WebP/JPEG de 260 e 520 px com seleção por densidade. Nenhuma captura é solicitada até o primeiro hover. Última captura permanece disponível durante o fade de saída. | Redução medida de bytes e tamanho de decodificação. Fallback JPEG mantido e testado; capturas completas preservadas. |
| `src/content.js`, `src/demo-catalog.js`, `scripts/generate-demos.mjs` | Catálogo compacto gerado somente com os campos usados pela home. A fonte editável continua sendo `demo-models.js`; dados completos continuam nas demos. | JavaScript inicial menor, sem carregamento assíncrono de conteúdo essencial e sem dados duplicados que precisem de manutenção manual. |
| `scripts/optimize-images.mjs`, `public/demos/image-manifest.json`, `public/demos/assets/*.webp` | Preparação de derivados com Chrome/canvas já disponível, dimensões originais e qualidade 0,90 nas fotos. Somente conversões menores são utilizadas. Hashes evitam reconversões. | 33 fotos com economia total de **1.591.390 bytes**; quatro fotos continuam JPEG porque WebP não trouxe economia. Nenhum original foi sobrescrito ou apagado. |
| `scripts/generate-demos.mjs`, 12 HTMLs gerados, `public/demos/collection.js` | `picture/source` com JPEG de fallback também nos detalhes e na sacola; dimensões explícitas nos elementos. | Formatos menores sem mudar conteúdo, funcionamento dos diálogos ou enquadramento. HTMLs alterados pelo gerador, sem edição manual dos arquivos gerados. |
| `public/demos/collection.css` | Seletores dos filhos de imagem adaptados aos elementos `picture`, com `display: contents`. Altura automática na regra base, preservando alturas específicas e `aspect-ratio` existentes. | Mantém os mesmos boxes e recortes. A comparação visual detectou e permitiu corrigir o esticamento causado inicialmente pelos atributos de dimensão. |
| `public/demos/brasa.html`, `morada.html`, `flora.html` | Fotos abaixo da dobra usam carregamento lazy, decodificação assíncrona, dimensões e WebP quando menor. Fundos elegíveis usam `image-set`, mantendo a declaração JPEG anterior como fallback. | Redução do carregamento inicial e de bytes. Gradientes, tamanho, posição e recortes dos fundos preservados. |
| Seis demos originais (`brasa`, `corte`, `morada`, `forma`, `flora`, `pixel`) | Preconnect para as duas origens das fontes. Fundos de Forma/Corte elegíveis também usam `image-set`. | Conexões podem começar antes. Mantidas as mesmas famílias, variantes e política de exibição. |
| `public/codik-icon.png`, `index.html`, seis HTMLs originais e gerador das demos | Favicon PNG de 64 px, derivado do mesmo logo, com proporção e composição preservadas. | **51.586 → 2.330 bytes**; logo original intacto. |
| `scripts/chrome-session.mjs`, `scripts/performance-check.mjs` | Cliente CDP e auditoria local reproduzível, sem pacote adicional. | Métricas, erros e capturas em `.qa/`, fora do bundle de produção. |
| `scripts/check-assets.mjs`, `scripts/browser-check.mjs`, `scripts/serve-preview.mjs` | Checagem de caminhos; testes de ausência de captura oculta, miniatura, fallback JPEG e recorte circular; MIME WebP/JSON na prévia local. | Detecta regressões da otimização e valida o pacote produzido. O servidor é apenas uma ferramenta local. |
| `package.json`, `README.md` | Comandos de preparação, auditoria e testes documentados. | Reprodução do processo sem dependências adicionais. |

As versões originais e modernas coexistem para manter fallback e os arquivos de origem. Portanto, o espaço total dos arquivos no repositório/dist aumenta; a economia medida está nos recursos selecionados e transferidos pelo navegador.

## C. Desempenho antes e depois

### Método

Build de produção servido em localhost. Chrome headless, CPU nativa, cache HTTP desabilitado, viewport de 1440 ou 375 px, DPR 1. Os cenários de desempenho comparam larguras; não representam um telefone físico nem um processador móvel. As fontes continuam dependendo da rede externa.

Foram auditadas home, Pixel, Brasa e Miso nas duas larguras. Depois de aguardar 4,3 s, a home executa 120 quadros de rolagem; no desktop, mais 120 quadros de ponteiro. O contador de leituras foi instrumentado em ambas as versões. Os tempos incluem essa instrumentação. O teste funcional separado também emula toque.

São medições de laboratório, uma linha de base e uma execução final comparável. Não são médias estatísticas, percentil 75 ou promessa de velocidade em produção. A soma de `transferSize` considera somente entradas expostas pela Resource Timing API e não inclui o HTML da navegação; não é a soma de todas as respostas capturadas por um proxy. O servidor local não comprime os arquivos; gzip abaixo é medido separadamente pelo Node/Vite.

| Recurso (bytes) | Antes | Depois | Ferramenta |
| --- | ---: | ---: | --- |
| JavaScript bruto | 203.294 | 190.898 | Vite + tamanho do arquivo |
| JavaScript gzip | 66.089 | 61.167 | Node zlib / Vite |
| CSS principal bruto | 37.203 | 37.203 | Vite; mesmo hash |
| CSS principal gzip | 8.145 | 8.145 | Node zlib |
| Prévia Brasa, DPR 1 | 405.202 | 30.104 | Arquivos originais/derivados |
| Prévia Brasa, DPR 2 | 405.202 | 88.458 | Arquivos originais/derivados |
| Favicon | 51.586 | 2.330 | Arquivos originais/derivados |
| Soma transferSize inicial home 1440 px | 699.435 | 232.281 | Resource Timing; veja limitações |

| Interação da home, 1440 px | Antes | Depois | Ferramenta |
| --- | ---: | ---: | --- |
| Leituras de posição das letras | 50.520 | 1.263 | Contador instrumentado |
| Execução JavaScript | 252,63 ms | 92,27 ms | CDP Performance |
| Cálculo de layout | 1.185,77 ms | 1.301,46 ms | CDP Performance |
| Tempo acumulado de tarefas | 1.719,22 ms | 1.679,88 ms | CDP Performance |

Redução determinística das leituras no cenário desktop: **97,5%**. O tempo de layout da execução final variou para cima em relação à linha de base, enquanto uma execução anterior da versão otimizada ficou próxima de 1,18 s. Isso reforça a limitação de comparar tempos nativos de uma única rodada. Não foi demonstrada uma redução consistente do custo de layout.

| Página / largura | FCP antes → depois (ms) | LCP observado antes → depois (ms) | Soma de deslocamentos antes → depois | TTFB local antes → depois (ms) |
| --- | ---: | ---: | ---: | ---: |
| / / 1440px | 492 → 444 | 492 → 444 | 0,00052 → 0,04620 | 27,4 → 13,9 |
| /demos/pixel.html / 1440px | 288 → 288 | 288 → 288 | 0,00379 → 0,00379 | 5,6 → 3,5 |
| /demos/brasa.html / 1440px | 120 → 124 | 156 → 176 | 0,03537 → 0,11682 | 3,7 → 2,9 |
| /demos/miso.html / 1440px | 164 → 188 | 164 → 188 | 0,00000 → 0,00000 | 3,8 → 4,2 |
| / / 375px | 280 → 276 | 280 → 276 | 0,00000 → 0,00000 | 3,4 → 4,6 |
| /demos/pixel.html / 375px | 124 → 144 | 124 → 144 | 0,00000 → 0,00000 | 4,3 → 4,4 |
| /demos/brasa.html / 375px | 116 → 112 | 168 → 164 | 0,00000 → 0,00000 | 3,3 → 3,1 |
| /demos/miso.html / 375px | 144 → 136 | 144 → 136 | 0,00000 → 0,00000 | 2,8 → 3 |


As versões WebP de todas as 33 fotos convertidas somam 7.367.586 bytes contra 8.958.976 bytes dos respectivos JPEGs. Não são carregadas todas de uma vez. As 18 prévias completas somam 5.924.174 bytes; os derivados WebP de 260 px somam 425.082 bytes e os de 520 px, 1.180.102 bytes.

### Leitura correta dos indicadores

- A abertura continua limitando a disponibilidade da página por aproximadamente 3,9 s, exceto ao pular ou com movimento reduzido. O LCP observado da home pode corresponder à abertura; não mede o término dessa sequência ou a liberação da interação.
- FCP/LCP de poucos milissegundos de diferença variaram entre execuções e páginas; não demonstram, isoladamente, ganho ou regressão de produção.
- O custo de layout do efeito tipográfico continua relevante. A redução de leituras e de execução JavaScript não eliminou o layout exigido pela variação de peso das letras.
- O indicador de deslocamentos registrado soma entradas sem interação recente; não implementa a agregação por janelas de sessão do CLS de campo. Variou para cima no desktop da home, permanecendo abaixo de 0,1 nesta observação. Não há evidência suficiente para atribuir causalidade ou garantir estabilidade em campo a partir de uma rodada.
- Brasa registrou **0,11682** na execução final, acima da referência de 0,1. Por isso houve uma investigação adicional dos nós que se moveram e comparação alternada com o HTML original do Git. Em três carregamentos por versão, o original registrou **0,05351 / 0,02939 / 0,02939** e o otimizado **0,03410 / 0,03537 / 0,02939**. Os nós afetados foram o texto do hero e a navegação, também presentes na versão original. A repetição não confirmou uma regressão sistemática; o outlier foi mantido na tabela. A troca das fontes externas é uma hipótese compatível com esses deslocamentos e continua exigindo validação controlada. Dados dessa investigação: `.qa/shifts.json`.
- Lighthouse não estava instalado e não foi adicionada uma dependência apenas para gerar uma pontuação. INP real, Core Web Vitals no percentil 75, TTFB real e desempenho de CPU/rede de celulares não foram determinados. A medição local de TTFB está nos JSONs e não representa a hospedagem.

Medições brutas: `.qa/performance-before.json` e `.qa/performance-after.json`. As capturas `before-*`/`after-*` e os relatórios do navegador também estão em `.qa/`, ignorada pelo Git. Este documento mantém os resultados necessários para revisão mesmo sem esses artefatos.

## D. Testes

| Verificação | Resultado |
| --- | --- |
| `npm ls --depth=0` | Dependências instaladas verificadas; nenhuma instalada, removida ou atualizada. |
| `npm run build` antes e depois | Passou. Vite minifica e aplica tree shaking; nenhuma configuração de produção adicional foi necessária. |
| `node scripts/browser-check.mjs --no-captures` antes/depois | Passou: **19 páginas**, incluindo **18 demos**, zero exceções/requisições locais HTTP com erro e zero asserções falhando. |
| Larguras e interação | Home em 375/768/1440 px e toque; demos também verificadas em desktop/celular, com verificações adicionais de 320/768 nas novas demos; prévia em telas baixas. |
| `npm run test:assets` após o build final | Passou: **384 referências**, 19 HTMLs, nenhuma referência a arquivo ausente. Inclui fontes de imagens e manifestos. Não testa a disponibilidade dos destinos de links externos. |
| Validações novas | Passaram: nenhum download de captura antes de hover, miniatura em uso, fallback JPEG e recorte circular da foto do Miso. |
| `node --check` nos scripts alterados/novos | Passou. JSX validado pelo build. |
| `git diff --check` | Passou, sem erros de whitespace. |
| Auditoria CDP antes/depois | Oito cenários por versão; sem erros de recursos/execução registrados. |
| Investigação de deslocamentos no Brasa | Três pares alternados original/otimizado, com identificação dos nós afetados. Variação documentada acima; não tratada como ganho comprovado. |
| Inspeção de capturas | Inspecionadas home, cartão flutuante e Miso antes/depois em desktop/celular; o recorte do Miso foi corrigido e conferido novamente. Não foi feita revisão visual humana exaustiva de todas as seções das 19 páginas. |
| Lint, tipos, testes unitários de terceiros | Não existentes no projeto; não foram alegados como executados. |
| Formspree/contatos reais | Sem envios reais, pagamentos ou agendamentos. Não foi verificada entrega real no serviço externo nem seus estados de sucesso/erro remoto. |

O primeiro build no sandbox encontrou `spawn EPERM` no subprocesso do esbuild; a execução autorizada fora da restrição passou. A primeira versão do verificador de caminhos tinha um problema de separador no Windows, corrigido antes da execução final. A regressão visual de altura durante a implementação também foi corrigida; não há falha de teste final pendente.

## E. Funcionalidades preservadas

O roteiro do Chrome verificou abertura a cada carregamento, pular por Escape, replay, âncoras após abertura, temas, preferência do sistema, movimento reduzido, armazenamento indisponível, efeito das letras em vários títulos, filtros e busca sem acentos, abas por teclado, links reais do catálogo e equipe, prévias desktop/celular, botões acessíveis em telas baixas, seleção de modelo chegando ao formulário e validação dos campos obrigatórios.

Nas demos, verificou filtros, detalhes, sacola e quantidades, conclusão de compra simulada, reservas simuladas, seleção de café, materiais, planos anuais, agenda, respiração, visualização do dashboard, seletor de soluções e menus móveis quando aplicáveis. Os testes não enviam mensagens a outras pessoas.

Títulos, metadados, textos, alternativas de imagem, semântica, URLs de páginas, fontes, cores, layout, blur e durações não foram redesenhados. O CSS principal tem exatamente o mesmo conteúdo/hash de produção que a linha de base local. Não houve mudança em variáveis de ambiente, credenciais, Formspree ou políticas de segurança.

## F. Limitações restantes

1. **Produção é outra revisão.** O HTML público contém `theme-init.js`, canonical e outro hash de JS. O checkout local usa inicialização de tema inline e não contém esses mesmos ajustes. Não se deve tratar o dist local como idêntico ao publicado nem sobrescrever a revisão de produção sem reconciliar essas diferenças.
2. **Cache de produção.** Em consulta pública em 27/10/2026, o HTML e o bundle com hash responderam `Cache-Control: public, max-age=0, must-revalidate`. O JS respondeu com `Content-Encoding: gzip`. HTML revalidado é apropriado; o bundle versionado é candidato a cache mais longo. Não foi modificada configuração externa à árvore disponível.
3. **Fontes externas.** As famílias e variantes foram mantidas. Latência, cache externo e troca de fonte continuam podendo influenciar métricas e deslocamentos. Não foram introduzidos preloads indiscriminados ou novas fontes.
4. **Efeito de peso e abertura.** Continuam tendo seus custos e tempos originais. Reduziu-se o trabalho redundante, sem remover efeitos para aumentar artificialmente uma pontuação.
5. **Cobertura de laboratório.** Chrome local não substitui Safari, Firefox, aparelhos reais, CrUX/RUM ou conexões móveis. A ausência de erros nessa suíte não comprova todos os serviços externos ou equivalência visual pixel a pixel.
6. **Preparação dos derivados.** Fotos/capturas novas exigem `npm run images:optimize` antes de `npm run build`. O build comum usa os derivados versionados e não precisa de Chrome. O script de preparação e o auditor podem usar `CHROME_PATH`; o roteiro de navegador preexistente usa o caminho Windows documentado.

Capturas dos cabeçalhos/HTML públicos: `.qa/production-headers.txt`, `.qa/production-js-headers.txt`, `.qa/production.html`. Consulta somente de leitura. Nenhuma configuração da Vercel foi alterada.

## G. Próximas melhorias justificadas

- Reconciliar esta branch com a revisão atualmente publicada antes de qualquer publicação, preservando canonical, inicialização de tema e políticas já adotadas em produção.
- Quando houver acesso à configuração correta da hospedagem, ajustar cache longo somente de `/assets/*` com hash e validar invalidação. Manter HTML e arquivos sem versão com política apropriada; não aplicar `immutable` a todas as fotos, scripts compartilhados ou formulários.
- Executar Lighthouse/PageSpeed e medições em celulares reais na revisão consolidada. Obter dados suficientes para avaliar LCP/INP/CLS no percentil 75, distinguindo a abertura do carregamento efetivo do conteúdo.
- Se esses dados mostrarem gargalo de fontes, avaliar hospedagem local das mesmas famílias/variantes, com licenças, subset e comparação tipográfica. Acesso e validação dessas fontes não foram necessários para as economias comprovadas desta execução.

Referências técnicas usadas para orientar a análise: [otimização de LCP](https://web.dev/articles/optimize-lcp) e [tarefas longas na thread principal](https://web.dev/articles/optimize-long-tasks), documentação do Chrome/web.dev. A separação entre laboratório e campo segue essa orientação; as medições apresentadas acima pertencem ao projeto local.
