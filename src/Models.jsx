import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, Code2, Dumbbell, Eye, Flower2, LayoutGrid, Monitor, Search, ShoppingBag, SlidersHorizontal, Smartphone, Sparkles, Utensils, X, Building2 } from 'lucide-react';
import { trabalhos, tiposDeSite, filtrosCategoria } from './content';
import './models.css';

const icons = { Todos: LayoutGrid, Gastronomia: Utensils, Beleza: Flower2, Arquitetura: Building2, Fitness: Dumbbell, Comércio: ShoppingBag, Tecnologia: Code2 };
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const demoUrl = (item) => `${base}${item.demo}`;
const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function chooseModel(item) {
  sessionStorage.setItem('modo3_modelo', item.slug);
  window.dispatchEvent(new CustomEvent('modo3:modelo', { detail: item.slug }));
}

function PreviewDialog({ item, onClose }) {
  const dialogRef = useRef(null);
  const viewportRef = useRef(null);
  const [device, setDevice] = useState('desktop');
  const [size, setSize] = useState({ width: 1000, height: 650 });
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(viewportRef.current);
    return () => { observer.disconnect(); document.body.style.overflow = previousOverflow; };
  }, []);
  const width = device === 'desktop' ? 1440 : 390;
  const scale = Math.min(1, size.width / width);
  return (
    <dialog ref={dialogRef} className="site-preview-dialog" aria-labelledby="preview-title" onCancel={onClose} onClick={(event) => { if (event.target === dialogRef.current) onClose(); }}>
      <div className="preview-dialog-content">
        <div className="preview-toolbar">
          <div><span className="preview-eyebrow">EXPLORE O MODELO</span><h3 id="preview-title">{item.nome} <span>{item.categoria}</span></h3></div>
          <div className="device-switch" aria-label="Formato da prévia">
            <button type="button" onClick={() => setDevice('desktop')} aria-pressed={device === 'desktop'} aria-label="Prévia no computador"><Monitor size={18} /><span>Desktop</span></button>
            <button type="button" onClick={() => setDevice('mobile')} aria-pressed={device === 'mobile'} aria-label="Prévia no celular"><Smartphone size={18} /><span>Celular</span></button>
          </div>
          <button className="preview-close" type="button" onClick={onClose} aria-label="Fechar prévia"><X size={22} /></button>
        </div>
        <div className="preview-live-stage" ref={viewportRef}>
          <div className="preview-live-frame" style={{ width: width * scale, height: size.height }}>
            <iframe key={`${item.slug}-${device}`} src={`${demoUrl(item)}?preview=1`} title={`Demonstração interativa: ${item.nome}`} style={{ width, height: size.height / scale, transform: `scale(${scale})` }} />
          </div>
        </div>
        <div className="preview-footer"><p>Modelo conceitual. A identidade final será a sua.</p><a href={demoUrl(item)} target="_blank" rel="noopener noreferrer">Abrir demo <ArrowUpRight size={16} /></a><a className="preview-select" href="#contato" onClick={() => { chooseModel(item); onClose(); }}>Quero esse estilo <ArrowRight size={16} /></a></div>
      </div>
    </dialog>
  );
}

export default function Models() {
  const [category, setCategory] = useState('Todos');
  const [type, setType] = useState('todos');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('destaques');
  const [preview, setPreview] = useState(null);
  const openerRef = useRef(null);
  const filtered = useMemo(() => trabalhos.filter((item) =>
    (category === 'Todos' || item.categoria === category) && (type === 'todos' || item.tipo === type) &&
    normalize(`${item.nome} ${item.categoria} ${item.descricao} ${item.resumo} ${item.tipoLabel}`).includes(normalize(search.trim())),
  ).sort((a, b) => sort === 'az' ? a.nome.localeCompare(b.nome, 'pt-BR') : Number(!!b.novo) - Number(!!a.novo)), [category, type, search, sort]);
  const hasFilters = category !== 'Todos' || type !== 'todos' || search !== '';
  const reset = () => { setCategory('Todos'); setType('todos'); setSearch(''); };
  const closePreview = () => { setPreview(null); requestAnimationFrame(() => openerRef.current?.focus()); };
  const openPreview = (item, event) => { openerRef.current = event.currentTarget; setPreview(item); };
  return (
    <section className="model-library" id="modelos" aria-labelledby="library-title">
      <div className="shell">
        <div className="library-heading" data-reveal>
          <div><span className="library-kicker"><span /> 02 / EXPLORE AS POSSIBILIDADES</span><h2 id="library-title">Seu próximo site<br />começa com <em>uma ideia.</em></h2></div>
          <div className="library-intro"><span className="collection-label"><Sparkles size={14} /> A coleção cresceu</span><p>{trabalhos.length} modelos. 6 segmentos. Muitas possibilidades para imaginar sua marca no ar.</p><span className="hover-hint"><Eye size={15} /> Passe o mouse para espiar. Clique para explorar.</span></div>
        </div>
        <div className="library-segments" role="group" aria-label="Filtrar por segmento">
          {filtrosCategoria.map((name) => { const Icon = icons[name]; return <button key={name} type="button" aria-pressed={category === name} onClick={() => setCategory(name)}><Icon size={16} /><span>{name === 'Todos' ? 'Todos os modelos' : name}</span><small>{name === 'Todos' ? trabalhos.length : trabalhos.filter((item) => item.categoria === name).length}</small></button>; })}
        </div>
        <div className="library-tools">
          <label className="library-search"><Search size={18} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Busque por nome, estilo ou negócio…" aria-label="Buscar modelos" />{search && <button type="button" onClick={() => setSearch('')} aria-label="Limpar busca"><X size={16} /></button>}</label>
          <label className="library-select"><SlidersHorizontal size={16} /><span className="sr-only">Tipo de site</span><select value={type} onChange={(event) => setType(event.target.value)}><option value="todos">Todos os tipos de site</option>{tiposDeSite.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
          <label className="library-sort"><span>Ordenar:</span><select aria-label="Ordenar modelos" value={sort} onChange={(event) => setSort(event.target.value)}><option value="destaques">Novidades primeiro</option><option value="az">Nome: A a Z</option></select></label>
        </div>
        <div className="library-results"><p role="status" aria-live="polite"><strong>{String(filtered.length).padStart(2, '0')}</strong> {filtered.length === 1 ? 'modelo para explorar' : 'modelos para explorar'}{category !== 'Todos' && <span> / {category}</span>}</p>{hasFilters ? <button type="button" onClick={reset}>Limpar filtros <X size={13} /></button> : <span className="library-concept-note">Conceitos criados pela Codik <span>↘</span></span>}</div>
        <div className="library-grid">
          {filtered.map((item, index) => <article key={item.slug} className="library-card" style={{ '--model-accent': item.accent || '#8e6ac0', '--model-order': Math.min(index, 5) }}>
            <button type="button" className="library-screenshot" onClick={(event) => openPreview(item, event)} aria-label={`Espiar o site ${item.nome}`}>
              <span className="browser-chrome" aria-hidden="true"><span className="browser-dots"><i /><i /><i /></span><span>{item.slug}.codik.design</span><ArrowUpRight size={12} /></span>
              <span className="screenshot-crop"><img src={`${base}/demos/previews/${item.slug}.jpg`} alt={`Captura real do site ${item.nome}`} loading="lazy" decoding="async" width="1440" height="3200" /><span className="screenshot-shade" /><span className="screenshot-explore"><Eye size={16} /> Espiar o site <ArrowUpRight size={15} /></span></span>
              {item.novo && <span className="new-model"><span /> NOVO MODELO</span>}
            </button>
            <div className="library-card-body"><div className="library-card-meta"><span>{item.categoria}</span><span>{item.tipoLabel}</span></div><div className="library-card-name"><h3>{item.nome}</h3><span aria-hidden="true">↗</span></div><p>{item.descricao}</p><div className="library-features">{(item.tags || ['Design responsivo', 'Identidade própria']).slice(0, 2).map((tag) => <span key={tag}><Check size={11} />{tag}</span>)}</div><div className="library-card-actions"><a href={demoUrl(item)} target="_blank" rel="noopener noreferrer">Explorar demo <ArrowUpRight size={15} /></a><a href="#contato" onClick={() => chooseModel(item)}>Quero esse estilo <ArrowRight size={14} /></a></div></div>
          </article>)}
        </div>
        {!filtered.length && <div className="library-empty"><Search size={30} /><h3>Vamos tentar outra combinação?</h3><p>Nenhum modelo corresponde à sua busca. Explore outros segmentos ou remova um filtro.</p><button type="button" onClick={reset}>Ver todos os modelos <ArrowRight size={16} /></button></div>}
        <div className="library-custom"><span className="custom-symbol" aria-hidden="true">✳</span><div><h3>Sua ideia não cabe em um modelo?</h3><p>A gente cria do zero, com a identidade e os detalhes da sua marca.</p></div><a href="#contato" onClick={() => { sessionStorage.removeItem('modo3_modelo'); window.dispatchEvent(new CustomEvent('modo3:modelo', { detail: 'personalizado' })); }}>Vamos criar algo seu <ArrowUpRight size={17} /></a></div>
      </div>
      {preview && <PreviewDialog item={preview} onClose={closePreview} />}
    </section>
  );
}
