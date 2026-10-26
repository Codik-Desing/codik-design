(() => {
  'use strict';
  const model = JSON.parse(document.getElementById('model-data').textContent);
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const money = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const isPreview = new URLSearchParams(location.search).has('preview');
  if (isPreview) {
    document.body.classList.add('embedded-preview');
    $$('a[href^="../../"]').forEach((a) => { a.target = '_top'; });
  }
  let toastTimer;
  function toast(text) {
    const target = $('[data-toast]');
    target.textContent = text;
    target.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => target.classList.remove('visible'), 3000);
  }

  const menuToggle = $('.menu-toggle');
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    $('.site-header').classList.toggle('menu-open', open);
  });
  function closeMenu() { menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.setAttribute('aria-label', 'Abrir menu'); $('.site-header').classList.remove('menu-open'); }
  $$('#demo-nav a').forEach((a) => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
  const headerObserver = new IntersectionObserver(([entry]) => $('.site-header').classList.toggle('scrolled', !entry.isIntersecting), { threshold: .3 });
  headerObserver.observe($('.hero'));

  // Reveals are progressive enhancement: the HTML remains visible without JS.
  if (!motion.matches && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('has-motion');
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: .06, rootMargin: '0px 0px -20px 0px' });
    $$('[data-reveal]').forEach((el) => observer.observe(el));
    motion.addEventListener('change', () => { if (motion.matches) document.documentElement.classList.remove('has-motion'); });
  }

  // CSS models have real perspective and layered geometry, controlled by the pointer.
  $$('[data-tilt]').forEach((el) => {
    let frame = 0;
    el.addEventListener('pointermove', (event) => {
      if (motion.matches || event.pointerType !== 'mouse') return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        el.style.setProperty('--rx', `${-y * 16}deg`);
        el.style.setProperty('--ry', `${x * 22}deg`);
        el.style.setProperty('--px', `${x * 16}px`);
        el.style.setProperty('--py', `${y * 16}px`);
      });
    });
    el.addEventListener('pointerleave', () => { cancelAnimationFrame(frame); ['--rx', '--ry'].forEach((p) => el.style.setProperty(p, '0deg')); ['--px', '--py'].forEach((p) => el.style.setProperty(p, '0px')); });
    el.addEventListener('keydown', (event) => {
      if (event.target !== el || !['ArrowLeft', 'ArrowRight'].includes(event.key) || motion.matches) return;
      event.preventDefault();
      const current = parseFloat(el.style.getPropertyValue('--ry')) || 0;
      el.style.setProperty('--ry', `${Math.max(-35, Math.min(35, current + (event.key === 'ArrowRight' ? 8 : -8)))}deg`);
    });
  });

  // Native dialogs provide focus trapping, Escape, and focus restoration.
  $$('dialog').forEach((dialog) => {
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    $$('[data-close]', dialog).forEach((b) => b.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
  });
  function openDialog(dialog) { if (!dialog.open) { dialog.showModal(); document.body.classList.add('dialog-open'); } }
  const bookingDialog = $('.booking-dialog');
  const bookingForm = $('[data-booking-form]');
  function openBooking(service) {
    bookingForm.hidden = false;
    $('.booking-result').hidden = true;
    if (service) {
      const select = $('#visitor-service');
      if (![...select.options].some((option) => option.value === service)) select.add(new Option(service, service));
      select.value = service;
    }
    openDialog(bookingDialog);
  }
  const dateInput = $('#visitor-date');
  if (dateInput) { const date = new Date(); const local = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; dateInput.min = local; dateInput.value = local; }
  $$('[data-booking]').forEach((b) => b.addEventListener('click', () => openBooking(b.dataset.service)));
  $$('[data-primary]').forEach((b) => b.addEventListener('click', () => {
    if (model.categoria === 'Comércio') { if (model.slug === 'cacau') $('#colecao').scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth' }); else openCart(); }
    else if (model.slug === 'orbit') $('#planos').scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth' });
    else openBooking();
  }));
  bookingForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!bookingForm.reportValidity()) return;
    const dateValue = bookingForm.elements.date?.value;
    if (dateInput && dateValue < dateInput.min) { dateInput.setCustomValidity('Escolha hoje ou uma data futura.'); dateInput.reportValidity(); return; }
    const result = $('.booking-result');
    result.innerHTML = '<span class="result-symbol">✓</span><h3>Assim seria o próximo passo.</h3><p>Você explorou o fluxo completo. Esta foi uma simulação: nenhum dado foi enviado e nenhum agendamento ou pedido foi realizado.</p><a class="action" href="../../?modelo=' + model.slug + '#contato">Quero essa experiência no meu site ↗</a>';
    bookingForm.hidden = true;
    result.hidden = false;
  });
  dateInput?.addEventListener('input', () => dateInput.setCustomValidity(''));

  $$('[data-filter]').forEach((button) => button.addEventListener('click', () => {
    $$('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
    $$('[data-category]').forEach((card) => { card.hidden = button.dataset.filter !== 'Todos' && card.dataset.category !== button.dataset.filter; });
  }));

  function showDetail(index) {
    const item = model.items[index];
    const content = $('[data-detail-content]');
    content.innerHTML = `${item.image ? `<img class="detail-image" src="assets/${item.image}.jpg" alt="${escape(item.name)}">` : ''}<span class="eyebrow">${escape(item.group)} / CONCEITO DEMONSTRATIVO</span><h2>${escape(item.name)}</h2><p>${escape(item.desc)}</p>${item.detail ? `<p>${escape(item.detail)}</p>` : ''}${item.price ? `<b class="detail-price">${money(item.price)}</b>` : ''}${model.categoria === 'Comércio' ? '<button class="action" type="button" data-detail-add>Adicionar à sacola ↗</button>' : ''}`;
    $('[data-detail-add]', content)?.addEventListener('click', () => { addItem(index); $('.detail-dialog').close(); });
    openDialog($('.detail-dialog'));
  }
  $$('[data-detail]').forEach((b) => b.addEventListener('click', () => showDetail(Number(b.dataset.detail))));

  let cart = {};
  function countItems() { return Object.values(cart).reduce((sum, qty) => sum + qty, 0); }
  function addItem(index) {
    cart[index] = Math.min(20, (cart[index] || 0) + 1);
    $$('[data-cart-count]').forEach((el) => { el.textContent = countItems(); });
    toast(`${model.items[index].name} adicionado à seleção.`);
  }
  $$('[data-add]').forEach((b) => b.addEventListener('click', () => addItem(Number(b.dataset.add))));
  function renderCart() {
    const entries = Object.entries(cart).filter(([, qty]) => qty > 0);
    $('[data-cart-items]').innerHTML = entries.length ? entries.map(([id, qty]) => {
      const item = model.items[id];
      return `<article class="cart-row"><img src="assets/${item.image}.jpg" alt="${escape(item.name)}"><div><h3>${escape(item.name)}</h3><span>${money(item.price)}</span><div class="cart-quantity"><button type="button" data-quantity="${id}" data-delta="-1" aria-label="Diminuir quantidade de ${escape(item.name)}">−</button><b>${qty}</b><button type="button" data-quantity="${id}" data-delta="1" aria-label="Aumentar quantidade de ${escape(item.name)}" ${qty >= 20 ? 'disabled' : ''}>+</button></div></div><b>${money(item.price * qty)}</b></article>`;
    }).join('') : '<div class="cart-empty">Sua seleção está começando.<br>Explore a coleção e adicione um favorito.</div>';
    $('[data-cart-total]').textContent = money(entries.reduce((sum, [id, qty]) => sum + model.items[id].price * qty, 0));
    $('[data-cart-checkout]').disabled = !entries.length;
    $$('[data-cart-count]').forEach((el) => { el.textContent = countItems(); });
    $$('[data-quantity]').forEach((b) => b.addEventListener('click', () => { cart[b.dataset.quantity] = Math.max(0, Math.min(20, cart[b.dataset.quantity] + Number(b.dataset.delta))); renderCart(); }));
  }
  function openCart() { renderCart(); $('[data-cart-feedback]').textContent = ''; openDialog($('.cart-dialog')); }
  $$('[data-cart-open]').forEach((b) => b.addEventListener('click', openCart));
  $('[data-cart-checkout]').addEventListener('click', () => { $('[data-cart-feedback]').textContent = 'Seleção concluída! Esta foi uma simulação. Nenhuma compra, pagamento ou encomenda foi realizada.'; });

  $$('[data-coffee]').forEach((b) => b.addEventListener('click', () => {
    const index = Number(b.dataset.coffee); const item = model.items[index];
    $$('[data-coffee]').forEach((el) => el.setAttribute('aria-pressed', String(el === b)));
    $('[data-coffee-name]').textContent = item.name;
    $('[data-coffee-desc]').textContent = item.desc;
    $('[data-coffee-price]').textContent = money(item.price);
    $('[data-coffee-meter]').style.width = `${[90, 40, 65][index]}%`;
  }));
  $$('[data-material]').forEach((b) => b.addEventListener('click', () => {
    $$('[data-material]').forEach((el) => el.setAttribute('aria-pressed', String(el === b)));
    $('.object-room').style.setProperty('--material', b.dataset.material);
  }));
  function schedule(day = 0) {
    const sets = [['Strength', 'Condition', 'Mobility'], ['Condition', 'Mobility', 'Strength'], ['Mobility', 'Strength', 'Condition'], ['Strength', 'Mobility', 'Condition'], ['Condition', 'Strength', 'Mobility']];
    const container = $('[data-schedule]'); if (!container) return;
    container.innerHTML = sets[day].map((name, i) => `<article><span>${['07:00', '12:30', '18:00'][i]}</span><div><h3>${name}</h3><small>${[50, 45, 40][i]} min · Turma demonstrativa</small></div><button type="button" data-schedule-book="${name}" aria-label="Experimentar ${name} às ${['07:00', '12:30', '18:00'][i]}">↗</button></article>`).join('');
    $$('[data-schedule-book]').forEach((b) => b.addEventListener('click', () => openBooking(b.dataset.scheduleBook)));
  }
  schedule();
  $$('[data-day]').forEach((b) => b.addEventListener('click', () => { $$('[data-day]').forEach((el) => el.setAttribute('aria-pressed', String(el === b))); schedule(Number(b.dataset.day)); }));
  let breathTimer;
  let breathing = false;
  const breathButton = $('[data-breath-toggle]');
  function stopBreathing() {
    clearInterval(breathTimer); breathing = false;
    $('.object-breath')?.classList.remove('breathing');
    if (breathButton) { breathButton.setAttribute('aria-pressed', 'false'); breathButton.innerHTML = 'Iniciar respiração <span>↗</span>'; $('[data-breath-label]').textContent = 'respire'; }
  }
  breathButton?.addEventListener('click', () => {
    if (breathing) return stopBreathing();
    breathing = true;
    breathButton.setAttribute('aria-pressed', 'true'); breathButton.innerHTML = 'Pausar respiração <span>↗</span>';
    $('.object-breath').classList.add('breathing'); $('[data-breath-label]').textContent = 'inspire';
    let inhale = true;
    breathTimer = setInterval(() => { inhale = !inhale; $('[data-breath-label]').textContent = inhale ? 'inspire' : 'expire'; }, 4000);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopBreathing(); });
  $$('[data-billing]').forEach((b) => b.addEventListener('click', () => {
    const annual = b.dataset.billing === 'yearly';
    $$('[data-billing]').forEach((el) => el.setAttribute('aria-pressed', String(el === b)));
    $$('[data-monthly]').forEach((el) => { el.textContent = (Number(el.dataset.monthly) * (annual ? .8 : 1)).toLocaleString('pt-BR', { maximumFractionDigits: 2 }); });
    $$('[data-billing-note]').forEach((el, index) => { const monthly = Number($$('[data-monthly]')[index].dataset.monthly); el.textContent = annual ? `${money(monthly * .8 * 12)} por ano · demonstração` : 'Cobrança mensal · demonstração'; });
  }));
  $$('[data-view]').forEach((b) => b.addEventListener('click', () => { $$('[data-view]').forEach((el) => el.setAttribute('aria-pressed', String(el === b))); $('[data-board]').classList.toggle('list-view', b.dataset.view === 'list'); }));
  $$('[data-solution]').forEach((b) => b.addEventListener('click', () => {
    const index = Number(b.dataset.solution); const item = model.items[index];
    $$('[data-solution]').forEach((el) => el.setAttribute('aria-pressed', String(el === b)));
    $('[data-solution-group]').textContent = item.group; $('[data-solution-name]').textContent = item.name;
    $('[data-solution-desc]').textContent = item.desc; $('[data-solution-flow]').textContent = item.detail;
    $('[data-solution-symbol]').textContent = ['produto', 'conexão', 'cloud'][index];
  }));
  $$('a[href*="?modelo="]').forEach((a) => a.addEventListener('click', () => sessionStorage.setItem('modo3_modelo', model.slug)));
})();
