// TradingView-Skripte: Gruppen-Ansicht, Einzelliste und versteckte Skripte. Daten aus tradingview.json
// (s.id = Skript-Kennung, n = Name, c = erstellt (UTC), t = i/s, h = von TradingView versteckt, b = Original-Autor, g = Gruppe).
window.TVV = (() => {
  const KEY = 'tt_tv_ansicht', STEP = 100;
  const SIZES = { aus: 0, klein: 80, mittel: 128, gross: 208 };
  let DATA = null, GROUPS = [], BYG = {}, shown = STEP, getQuery = () => '';
  const open = new Set();
  const ui = Object.assign({ view: 'gruppen', sort: 'az', size: 'mittel', hint: true }, (() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; }
  })());
  // Link mit ?ansicht=gruppen|liste|versteckt (und &bilder=aus|klein|mittel|gross) öffnet direkt diese Ansicht
  const P = new URLSearchParams(location.search);
  if (/^(gruppen|liste|versteckt)$/.test(P.get('ansicht'))) ui.view = P.get('ansicht');
  if (P.get('bilder') in SIZES) ui.size = P.get('bilder');
  if (/^(az|za|neu|alt)$/.test(P.get('sortierung'))) ui.sort = P.get('sortierung');
  if (P.get('offen')) open.add(P.get('offen'));
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(ui)); } catch (e) { } };

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tz = { timeZone: 'Europe/Berlin' };
  const day = iso => new Date(iso).toLocaleDateString('de-DE', { ...tz, day: '2-digit', month: '2-digit', year: 'numeric' });
  const dayTime = iso => new Date(iso).toLocaleString('de-DE', { ...tz, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const img = (s, big) => `https://s3.tradingview.com/${s.id[0].toLowerCase()}/${s.id}_${big ? 'big' : 'mid'}.png`;
  const link = s => `https://de.tradingview.com/script/${s.id}${s.s || ''}/`;
  // zum Sortieren Vorsilben wie "-VrilyaSS-" weglassen, damit nicht alles unter "-" landet
  const sortName = n => n.replace(/^[^a-z0-9äöü]*(vrilyass)?[^a-z0-9äöü]*/i, '').toLowerCase();
  const byName = (a, b) => sortName(a.n).localeCompare(sortName(b.n), 'de');
  const SORTS = {
    az: (a, b) => byName(a, b), za: (a, b) => byName(b, a),
    neu: (a, b) => b.c.localeCompare(a.c), alt: (a, b) => a.c.localeCompare(b.c),
  };
  const hit = (s, q) => !q || q.split(/\s+/).every(w => (s.n + ' ' + (s.b || '')).toLowerCase().includes(w));

  function init(d) {
    DATA = d;
    for (const s of d.scripts) (BYG[s.g] ||= []).push(s);
    GROUPS = d.groups.map(g => {
      const all = BYG[g.id] || [], vis = all.filter(s => !s.h).sort(SORTS.neu);
      return { ...g, vis, hidden: all.length - vis.length, newest: vis[0], oldest: vis[vis.length - 1] };
    }).filter(g => g.vis.length);
  }

  const visible = () => DATA.scripts.filter(s => !s.h);
  const hiddenList = () => DATA.scripts.filter(s => s.h);

  function thumb(s, cls = 'tvthumb') {
    if (!SIZES[ui.size]) return '';
    return `<button class="${cls}" data-big="${esc(img(s, true))}" title="Vorschau vergrößern"><img loading="lazy" src="${esc(img(s))}" alt=""></button>`;
  }
  const typ = s => s.t === 's' ? '<span class="badge st">Strategie</span>' : '<span class="badge">Indikator</span>';
  const basis = s => ui.hint && s.b ? `<span class="basis">Beruht auf einem Skript von ${esc(s.b)}</span>` : '';

  function row(s) {
    return `<div class="tvrow${s.h ? ' hid' : ''}">
      ${thumb(s)}
      <span class="nm"><span class="n" title="${esc(s.n)}">${esc(s.n)}</span>${basis(s)}</span>
      <span class="ty">${typ(s)}</span>
      <span class="d" title="Erstellt am ${esc(dayTime(s.c))} Uhr">${esc(dayTime(s.c))}</span>
      <a class="tvbtn${s.h ? ' off' : ''}" href="${esc(link(s))}" target="_blank" rel="noopener">${s.h ? 'Nur für dich' : 'Öffnen'} ↗</a>
    </div>`;
  }

  function head() {
    const arrow = (a, b) => ui.sort === a ? ' ▲' : ui.sort === b ? ' ▼' : ' ▲▼';
    return `<div class="tvhead">${SIZES[ui.size] ? '<span></span>' : ''}
      <button data-hsort="name" class="${/az|za/.test(ui.sort) ? 'on' : ''}">Name${arrow('az', 'za')}</button>
      <span>Typ</span>
      <button data-hsort="date" class="${/neu|alt/.test(ui.sort) ? 'on' : ''}">Erstellt${arrow('alt', 'neu')}</button>
      <span></span></div>`;
  }

  function list(arr) {
    const part = arr.slice(0, shown);
    return `<div class="tvlist">${head()}${part.map(row).join('')}</div>
      ${arr.length > shown ? `<button class="tvmore" data-more>Weitere ${Math.min(STEP, arr.length - shown)} anzeigen · noch ${arr.length - shown}</button>` : ''}`;
  }

  function groupCard(g, q) {
    const isOpen = open.has(g.id) || !!q;
    const vers = g.vis.filter(s => hit(s, q)).sort(SORTS[ui.sort]);
    const n = g.vis.length;
    const range = day(g.oldest.c) !== day(g.newest.c) ? `${day(g.oldest.c)} – ${day(g.newest.c)}` : day(g.newest.c);
    const authors = ui.hint ? [...new Set(g.vis.map(s => s.b).filter(Boolean))] : [];
    return `<div class="gcard${isOpen ? ' open' : ''}">
      <div class="gtop">${thumb(g.newest, 'tvthumb g')}
        <div class="ginfo"><h3>${esc(g.name)}</h3>
          <div class="gmeta">${n} ${n === 1 ? 'Version' : 'Versionen'} · ${range}${g.hidden ? ` · ${g.hidden} versteckt` : ''}</div>
          <div class="gnew">Neueste: <b>${esc(g.newest.n)}</b> · ${esc(dayTime(g.newest.c))}</div>
          ${authors.length ? `<div class="basis">Beruht auf Skripten von ${esc(authors.slice(0, 6).join(', '))}${authors.length > 6 ? ' …' : ''}</div>` : ''}
        </div></div>
      ${isOpen ? `<div class="vers">${list(vers).replace('class="tvlist"', 'class="tvlist inner"')}</div>` : ''}
      <div class="gfoot"><button data-toggle="${esc(g.id)}" class="${isOpen ? 'is-open' : ''}">${isOpen ? '▾ Versionen zuklappen' : `▸ Alle ${n} ${n === 1 ? 'Version' : 'Versionen'}`}</button>
        <a class="tvbtn" href="${esc(link(g.newest))}" target="_blank" rel="noopener">${isOpen ? 'Neueste öffnen' : 'Öffnen'} ↗</a></div>
    </div>`;
  }

  function body(q) {
    if (ui.view === 'liste') {
      const arr = visible().filter(s => hit(s, q)).sort(SORTS[ui.sort]);
      return arr.length ? list(arr) : '<p class="nohit">Keine Treffer.</p>';
    }
    if (ui.view === 'versteckt') {
      const arr = hiddenList().filter(s => hit(s, q)).sort(SORTS[ui.sort]);
      return `<div class="note">Diese ${hiddenList().length} Skripte hat TradingView versteckt. Die Links öffnen nur, wenn du selbst bei TradingView angemeldet bist – andere sehen „Publication not found“.</div>
        ${arr.length ? list(arr) : '<p class="nohit">Keine Treffer.</p>'}`;
    }
    const gs = GROUPS.filter(g => !q || hit({ n: g.name }, q) || g.vis.some(s => hit(s, q)))
      .sort(ui.sort === 'neu' ? (a, b) => b.newest.c.localeCompare(a.newest.c)
        : ui.sort === 'alt' ? (a, b) => a.oldest.c.localeCompare(b.oldest.c)
        : ui.sort === 'za' ? (a, b) => b.name.localeCompare(a.name, 'de') : (a, b) => a.name.localeCompare(b.name, 'de'));
    return gs.length ? `<div class="groups">${gs.map(g => groupCard(g, q)).join('')}</div>` : '<p class="nohit">Keine Treffer.</p>';
  }

  function html(q) {
    const tab = (v, label, n) => `<button data-view="${v}" class="${ui.view === v ? 'on' : ''}">${label}<small>${n}</small></button>`;
    const sb = (v, label) => `<button data-sort="${v}" class="${ui.sort === v || (v === 'az' && ui.sort === 'za') ? 'on' : ''}">${label}</button>`;
    const sz = (v, label) => `<button data-size="${v}" class="${ui.size === v ? 'on' : ''}">${label}</button>`;
    return `<div class="tv size-${ui.size}${SIZES[ui.size] ? '' : ' noimg'}" style="--tw:${SIZES[ui.size]}px">
      <div class="tvbar">
        <div class="seg">${tab('gruppen', 'Gruppen', GROUPS.length)}${tab('liste', 'Einzelliste', visible().length)}${tab('versteckt', 'Versteckt', hiddenList().length)}</div>
        <div class="tvopts">
          <div class="sorts">${sb('az', ui.sort === 'za' ? 'Z–A' : 'A–Z')}${sb('neu', 'Neueste zuerst')}${sb('alt', 'Älteste zuerst')}</div>
          <div class="sizes" title="Größe der Vorschaubilder"><span>Bilder</span>${sz('aus', 'Aus')}${sz('klein', 'Klein')}${sz('mittel', 'Mittel')}${sz('gross', 'Groß')}</div>
          <label class="hintsw"><input type="checkbox" data-hint ${ui.hint ? 'checked' : ''}> Hinweis auf Original-Autor</label>
        </div>
      </div>
      <div class="tvbody">${body(q)}</div>
      <p class="tvstand">Stand der Liste: ${esc(day(DATA.stand + 'T12:00:00Z'))} · alle Uhrzeiten in deutscher Zeit · <a href="${esc(DATA.profile)}" target="_blank" rel="noopener">Profil auf TradingView ↗</a></p>
    </div>`;
  }

  function rerender() { const box = document.getElementById('tvbox'); if (box) { box.innerHTML = html(getQuery()); } }

  function bind(gq) {
    getQuery = gq;
    const box = document.getElementById('tvbox');
    if (!box || box.dataset.bound) return;
    box.dataset.bound = '1';
    box.addEventListener('click', e => {
      const t = e.target.closest('button,[data-hint]');
      if (!t) return;
      if (t.dataset.view) { ui.view = t.dataset.view; shown = STEP; }
      else if (t.dataset.sort) { ui.sort = t.dataset.sort === 'az' && ui.sort === 'az' ? 'za' : t.dataset.sort; }
      else if (t.dataset.size) ui.size = t.dataset.size;
      else if (t.dataset.hsort === 'name') ui.sort = ui.sort === 'az' ? 'za' : 'az';
      else if (t.dataset.hsort === 'date') ui.sort = ui.sort === 'neu' ? 'alt' : 'neu';
      else if (t.dataset.toggle) { open.has(t.dataset.toggle) ? open.delete(t.dataset.toggle) : open.add(t.dataset.toggle); }
      else if (t.hasAttribute('data-more')) shown += STEP;
      else if (t.dataset.big) {
        const lb = document.getElementById('lightbox');
        if (lb) { lb.querySelector('img').src = t.dataset.big; lb.classList.remove('hidden'); }
        return;
      } else return;
      save(); rerender();
    });
    box.addEventListener('change', e => { if (e.target.matches('[data-hint]')) { ui.hint = e.target.checked; save(); rerender(); } });
  }

  return { init, html, bind, ready: () => !!DATA, count: () => visible().length };
})();
