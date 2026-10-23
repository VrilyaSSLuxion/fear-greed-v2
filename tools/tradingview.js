// TradingView-Skripte: Gruppen, Einzelliste (alle) und versteckte Skripte – als Liste oder Kacheln. Daten aus tradingview.json
// (s.id = Skript-Kennung, n = Name, c = erstellt (UTC), t = i/s, h = von TradingView versteckt, b = Original-Autor,
//  g = Gruppe, q = Quellcode liegt als quellcode/tv/<id>.txt bei, l = Lizenz laut Quellcode).
window.TVV = (() => {
  const KEY = 'tt_tv_ansicht', STEP = 100;
  const SIZES = { aus: 0, klein: 80, mittel: 128, gross: 208 };
  const TILE = { aus: 260, klein: 230, mittel: 300, gross: 400 };   // Kachelbreite je Bildgröße
  let DATA = null, GROUPS = [], shown = STEP, getQuery = () => '';
  const open = new Set();
  const ui = Object.assign({ view: 'gruppen', sort: 'az', size: 'mittel', hint: true, typ: 'alle', layout: 'liste' }, (() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; }
  })());
  // Link mit ?ansicht=…&bilder=…&sortierung=…&offen=…&typ=…&darstellung=… öffnet direkt diese Ansicht
  const P = new URLSearchParams(location.search);
  if (/^(gruppen|liste|versteckt)$/.test(P.get('ansicht'))) ui.view = P.get('ansicht');
  if (P.get('bilder') in SIZES) ui.size = P.get('bilder');
  if (/^(az|za|neu|alt|typ|typ2)$/.test(P.get('sortierung'))) ui.sort = P.get('sortierung');
  if (/^(alle|i|s)$/.test(P.get('typ'))) ui.typ = P.get('typ');
  if (/^(liste|kacheln)$/.test(P.get('darstellung'))) ui.layout = P.get('darstellung');
  if (P.get('offen')) open.add(P.get('offen'));
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(ui)); } catch (e) { } };

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tz = { timeZone: 'Europe/Berlin' };
  const day = iso => new Date(iso).toLocaleDateString('de-DE', { ...tz, day: '2-digit', month: '2-digit', year: 'numeric' });
  const dayTime = iso => new Date(iso).toLocaleString('de-DE', { ...tz, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const img = (s, big) => `https://s3.tradingview.com/${s.id[0].toLowerCase()}/${s.id}_${big ? 'big' : 'mid'}.png`;
  const link = s => `https://de.tradingview.com/script/${s.id}${s.s || ''}/`;
  const codeUrl = s => `quellcode/tv/${s.id}.txt`;
  const fileName = s => (s.n.replace(/[^\w\-. äöüÄÖÜß+&()]/g, '').replace(/\s+/g, ' ').trim() || s.id) + '.pine';
  // zum Sortieren Vorsilben wie "-VrilyaSS-" weglassen, damit nicht alles unter "-" landet
  const sortName = n => n.replace(/^[^a-z0-9äöü]*(vrilyass)?[^a-z0-9äöü]*/i, '').toLowerCase();
  const byName = (a, b) => sortName(a.n).localeCompare(sortName(b.n), 'de');
  const byNew = (a, b) => b.c.localeCompare(a.c);
  const SORTS = {
    az: byName, za: (a, b) => byName(b, a), neu: byNew, alt: (a, b) => a.c.localeCompare(b.c),
    typ: (a, b) => a.t.localeCompare(b.t) || byNew(a, b), typ2: (a, b) => b.t.localeCompare(a.t) || byNew(a, b),
  };
  const hit = (s, q) => !q || q.split(/\s+/).every(w => (s.n + ' ' + (s.b || '')).toLowerCase().includes(w));
  const typOk = s => ui.typ === 'alle' || s.t === ui.typ;

  function init(d) {
    DATA = d;
    const byg = {};
    for (const s of d.scripts) (byg[s.g] ||= []).push(s);
    GROUPS = d.groups.map(g => {
      const all = (byg[g.id] || []).slice().sort(byNew), vis = all.filter(s => !s.h);
      return { ...g, all, hidden: all.length - vis.length, newest: vis[0] || all[0], oldest: all[all.length - 1] };
    }).filter(g => g.all.length);
  }

  const scriptsOf = view => DATA.scripts.filter(s => view === 'versteckt' ? s.h : true);

  function thumb(s, cls = 'tvthumb') {
    if (!SIZES[ui.size]) return '';
    return `<button class="${cls}" data-big="${esc(img(s, true))}" title="Vorschau vergrößern"><img loading="lazy" src="${esc(img(s))}" alt=""></button>`;
  }
  const typ = s => s.t === 's' ? '<span class="badge st">Strategie</span>' : '<span class="badge in">Indikator</span>';
  const basis = s => ui.hint && s.b ? `<span class="basis">Beruht auf einem Skript von ${esc(s.b)}${s.l ? ` · Lizenz ${esc(s.l)}` : ''}</span>` : '';
  const hiddenTag = s => s.h ? '<span class="hidtag" title="Von TradingView versteckt – der Link öffnet nur, wenn du angemeldet bist">versteckt</span>' : '';

  function actions(s) {
    return `<span class="acts">
      <a class="tvbtn${s.h ? ' off' : ''}" href="${esc(link(s))}" target="_blank" rel="noopener" title="${s.h ? 'Versteckt – öffnet nur, wenn du bei TradingView angemeldet bist' : 'Skript-Seite auf TradingView'}">Skript-Seite ↗</a>
      ${s.q ? `<a class="tvbtn sec" href="code.html?id=${encodeURIComponent(s.id)}" target="_blank" rel="noopener" title="Quellcode im Browser ansehen">Quellcode</a>
        <a class="tvbtn sec dl" href="${esc(codeUrl(s))}" download="${esc(fileName(s))}" title="Quellcode als Datei speichern (.pine)">⬇</a>` : ''}
    </span>`;
  }

  // ---------- Einzel-Skripte als Tabellenzeilen oder Kacheln ----------
  function row(s) {
    return `<div class="tvrow${s.h ? ' hid' : ''}">
      ${SIZES[ui.size] ? `<span class="c-img">${thumb(s)}</span>` : ''}
      <span class="c-nm"><span class="n" title="${esc(s.n)}">${esc(s.n)}</span>${basis(s)}</span>
      <span class="c-ty">${typ(s)}${hiddenTag(s)}</span>
      <span class="c-d" title="Erstellt am ${esc(dayTime(s.c))} Uhr">${esc(dayTime(s.c))}</span>
      <span class="c-act">${actions(s)}</span>
    </div>`;
  }
  function tile(s) {
    return `<div class="tvtile${s.h ? ' hid' : ''}">
      ${SIZES[ui.size] ? thumb(s, 'tvthumb t') : ''}
      <div class="tt-body"><span class="n" title="${esc(s.n)}">${esc(s.n)}</span>${basis(s)}
        <span class="tt-meta">${typ(s)}${hiddenTag(s)}<span class="c-d">${esc(dayTime(s.c))}</span></span>
        ${actions(s)}</div>
    </div>`;
  }
  function head() {
    const arrow = (a, b) => ui.sort === a ? ' ▲' : ui.sort === b ? ' ▼' : ' ▲▼';
    return `<div class="tvhead">${SIZES[ui.size] ? '<span class="c-img">Bild</span>' : ''}
      <button data-hsort="name" class="c-nm${/az|za/.test(ui.sort) ? ' on' : ''}">Name${arrow('az', 'za')}</button>
      <button data-hsort="typ" class="c-ty${/typ/.test(ui.sort) ? ' on' : ''}" title="Sortieren: Indikatoren / Strategien zuerst">Typ${arrow('typ', 'typ2')}</button>
      <button data-hsort="date" class="c-d${/neu|alt/.test(ui.sort) ? ' on' : ''}">Erstellt${arrow('alt', 'neu')}</button>
      <span class="c-act">Links</span></div>`;
  }
  function list(arr, inner) {
    const part = arr.slice(0, shown);
    const more = arr.length > shown ? `<button class="tvmore" data-more>Weitere ${Math.min(STEP, arr.length - shown)} anzeigen · noch ${arr.length - shown}</button>` : '';
    if (ui.layout === 'kacheln') return `<div class="tvgrid" style="--tile:${TILE[ui.size]}px">${part.map(tile).join('')}</div>${more}`;
    return `<div class="tvlist${inner ? ' inner' : ''}">${head()}${part.map(row).join('')}</div>${more}`;
  }

  // ---------- Gruppen als Kacheln oder Liste ----------
  function groupInfo(g, vers) {
    const n = vers.length;
    const range = day(g.oldest.c) !== day(g.newest.c) ? `${day(g.oldest.c)} – ${day(g.newest.c)}` : day(g.newest.c);
    const authors = ui.hint ? [...new Set(vers.map(s => s.b).filter(Boolean))] : [];
    return { n, range, authors, label: `${n} ${n === 1 ? 'Version' : 'Versionen'}` };
  }
  function groupCard(g, q) {
    const vers = g.all.filter(s => hit(s, q) && typOk(s)).sort(SORTS[ui.sort]);
    if (!vers.length) return '';
    const isOpen = open.has(g.id) || !!q, gi = groupInfo(g, vers), hid = vers.filter(s => s.h).length;
    const toggle = `<button data-toggle="${esc(g.id)}" class="gtog${isOpen ? ' is-open' : ''}">${isOpen ? '▾ Versionen zuklappen' : `▸ Alle ${gi.label}`}</button>`;
    const openBtn = `<a class="tvbtn" href="${esc(link(g.newest))}" target="_blank" rel="noopener">Neueste öffnen ↗</a>`;
    const authorsLine = gi.authors.length ? `<span class="basis">Beruht auf Skripten von ${esc(gi.authors.slice(0, 6).join(', '))}${gi.authors.length > 6 ? ' …' : ''}</span>` : '';
    const inner = isOpen ? `<div class="vers">${list(vers, true)}</div>` : '';
    if (ui.layout === 'liste') {
      return `<div class="grow${isOpen ? ' open' : ''}">
        <div class="grow-row">${SIZES[ui.size] ? `<span class="c-img">${thumb(g.newest)}</span>` : ''}
          <span class="c-nm"><span class="n">${esc(g.name)}</span>${authorsLine}</span>
          <span class="c-cnt">${gi.label}${hid ? `<small>${hid} versteckt</small>` : ''}</span>
          <span class="c-rng">${gi.range}</span>
          <span class="c-new" title="${esc(g.newest.n)}"><b>${esc(g.newest.n)}</b><small>${esc(dayTime(g.newest.c))}</small></span>
          <span class="c-act">${toggle}${openBtn}</span></div>
        ${inner}</div>`;
    }
    return `<div class="gcard${isOpen ? ' open' : ''}">
      <div class="gtop">${thumb(g.newest, 'tvthumb g')}
        <div class="ginfo"><h3>${esc(g.name)}</h3>
          <div class="gmeta">${gi.label} · ${gi.range}${hid ? ` · ${hid} versteckt` : ''}</div>
          <div class="gnew">Neueste: <b>${esc(g.newest.n)}</b> · ${esc(dayTime(g.newest.c))}</div>${authorsLine}
        </div></div>
      ${inner}
      <div class="gfoot">${toggle}${openBtn}</div>
    </div>`;
  }
  function groupHead() {
    return `<div class="tvhead g">${SIZES[ui.size] ? '<span class="c-img">Bild</span>' : ''}<span class="c-nm">Gruppe</span><span class="c-cnt">Versionen</span>
      <span class="c-rng">Zeitraum</span><span class="c-new">Neueste Version</span><span class="c-act"></span></div>`;
  }

  function body(q) {
    if (ui.view !== 'gruppen') {
      const arr = scriptsOf(ui.view).filter(s => hit(s, q) && typOk(s)).sort(SORTS[ui.sort]);
      const note = ui.view === 'versteckt' ? `<div class="note">Diese ${scriptsOf('versteckt').length} Skripte hat TradingView versteckt. Die Skript-Seite öffnet nur, wenn du selbst bei TradingView angemeldet bist – andere sehen „Publication not found“. Der Quellcode funktioniert trotzdem.</div>` : '';
      return note + (arr.length ? list(arr) : '<p class="nohit">Keine Treffer.</p>');
    }
    const gsort = /neu/.test(ui.sort) ? (a, b) => b.newest.c.localeCompare(a.newest.c)
      : /alt/.test(ui.sort) ? (a, b) => a.oldest.c.localeCompare(b.oldest.c)
      : ui.sort === 'za' ? (a, b) => b.name.localeCompare(a.name, 'de') : (a, b) => a.name.localeCompare(b.name, 'de');
    const cards = GROUPS.slice().sort(gsort).map(g => groupCard(g, q)).filter(Boolean);
    if (!cards.length) return '<p class="nohit">Keine Treffer.</p>';
    return ui.layout === 'liste' ? `<div class="glist">${groupHead()}${cards.join('')}</div>` : `<div class="groups">${cards.join('')}</div>`;
  }

  function html(q) {
    const b = (attr, v, label, on, extra = '') => `<button data-${attr}="${v}" class="${on ? 'on' : ''}" ${extra}>${label}</button>`;
    const nT = t => DATA.scripts.filter(s => s.t === t).length;
    return `<div class="tv size-${ui.size}${SIZES[ui.size] ? '' : ' noimg'}" style="--tw:${SIZES[ui.size]}px">
      <div class="tvbar">
        <div class="seg box">${b('view', 'gruppen', `Gruppen<small>${GROUPS.length}</small>`, ui.view === 'gruppen')}${b('view', 'liste', `Einzelliste<small>${DATA.scripts.length}</small>`, ui.view === 'liste')}${b('view', 'versteckt', `Versteckt<small>${scriptsOf('versteckt').length}</small>`, ui.view === 'versteckt')}</div>
        <div class="optbox"><span class="lbl">Typ</span>${b('typ', 'alle', 'Alle', ui.typ === 'alle')}${b('typ', 'i', `Indikatoren<small>${nT('i')}</small>`, ui.typ === 'i')}${b('typ', 's', `Strategien<small>${nT('s')}</small>`, ui.typ === 's')}</div>
        <div class="optbox"><span class="lbl">Darstellung</span>${b('layout', 'liste', '☰ Liste', ui.layout === 'liste')}${b('layout', 'kacheln', '▦ Kacheln', ui.layout === 'kacheln')}</div>
      </div>
      <div class="tvbar">
        <div class="optbox"><span class="lbl">Sortieren</span>${b('sort', 'az', ui.sort === 'za' ? 'Z–A' : 'A–Z', /az|za/.test(ui.sort))}${b('sort', 'neu', 'Neueste zuerst', ui.sort === 'neu')}${b('sort', 'alt', 'Älteste zuerst', ui.sort === 'alt')}${b('sort', 'typ', ui.sort === 'typ2' ? 'Strategien zuerst' : 'Indikatoren zuerst', /typ/.test(ui.sort))}</div>
        <div class="optbox" title="Größe der Vorschaubilder"><span class="lbl">Bilder</span>${b('size', 'aus', 'Aus', ui.size === 'aus')}${b('size', 'klein', 'Klein', ui.size === 'klein')}${b('size', 'mittel', 'Mittel', ui.size === 'mittel')}${b('size', 'gross', 'Groß', ui.size === 'gross')}</div>
        <label class="optbox hintsw"><input type="checkbox" data-hint ${ui.hint ? 'checked' : ''}> Hinweis auf Original-Autor</label>
      </div>
      <div class="tvbody">${body(q)}</div>
      <p class="tvstand">Stand der Liste: ${esc(day(DATA.stand + 'T12:00:00Z'))} · alle Uhrzeiten in deutscher Zeit · <a href="${esc(DATA.profile)}" target="_blank" rel="noopener">Profil auf TradingView ↗</a></p>
    </div>`;
  }

  function rerender() { const box = document.getElementById('tvbox'); if (box) box.innerHTML = html(getQuery()); }

  function bind(gq) {
    getQuery = gq;
    const box = document.getElementById('tvbox');
    if (!box || box.dataset.bound) return;
    box.dataset.bound = '1';
    box.addEventListener('click', e => {
      const t = e.target.closest('button');
      if (!t) return;
      if (t.dataset.view) { ui.view = t.dataset.view; shown = STEP; }
      else if (t.dataset.sort) ui.sort = t.dataset.sort === 'az' && ui.sort === 'az' ? 'za' : t.dataset.sort === 'typ' && ui.sort === 'typ' ? 'typ2' : t.dataset.sort;
      else if (t.dataset.typ) { ui.typ = t.dataset.typ; shown = STEP; }
      else if (t.dataset.layout) ui.layout = t.dataset.layout;
      else if (t.dataset.size) ui.size = t.dataset.size;
      else if (t.dataset.hsort === 'name') ui.sort = ui.sort === 'az' ? 'za' : 'az';
      else if (t.dataset.hsort === 'typ') ui.sort = ui.sort === 'typ' ? 'typ2' : 'typ';
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

  return { init, html, bind, ready: () => !!DATA, count: () => DATA.scripts.length, data: () => DATA };
})();
