// Trading Tools – Übersicht und Detailansicht. Alle Einträge stehen in tools.json.
// Neue Einträge: dort ein Objekt ergänzen; sortiert wird automatisch alphabetisch.
const CATS = [
  { id: 'metatrader', title: 'MetaTrader', sub: 'Indikatoren und Expert Advisors für MT4 / MT5',
    empty: 'Hier kommen bald die MT4/MT5-Indikatoren und EAs – mit Download (.mq4 / .ex4 / ZIP) oder Link zum MQL5 Market.' },
  { id: 'tradingview', title: 'TradingView', sub: 'Pine-Script-Indikatoren und Strategien',
    empty: 'Die TradingView-Skripte werden hier nach und nach eingetragen – mit Vorschau und Link zur Veröffentlichung auf TradingView.' },
  { id: 'desktop', title: 'Desktop-Tools', sub: 'Programme für Windows', empty: 'Noch keine Programme.' },
  { id: 'geschuetzt', title: 'Geschützter Bereich', sub: 'nur mit Passwort · für später gemerkt', empty: '' },
];
// Platzhalter: Inhalte werden später verschlüsselt abgelegt (Passwort legt nur der Besitzer fest)
const LOCKED = `<div class="locked">
  <div class="lock-ico">🔒</div>
  <div class="lock-txt"><b>Für später gemerkt</b>
    <p>Hier kann später ein Bereich entstehen, den man nur mit Passwort öffnen kann – zum Beispiel für versteckte Skripte,
      Kopien anderer Autoren oder private Downloads. Der Inhalt wird dann verschlüsselt gespeichert; ohne Passwort kann ihn niemand lesen.</p>
    <div class="lock-form"><input type="password" placeholder="Passwort" disabled aria-label="Passwort (noch nicht eingerichtet)">
      <button disabled>Öffnen</button><span>Noch leer – noch kein Passwort festgelegt.</span></div>
  </div></div>`;
const STATUS = {
  download: ['Download', 'ok'], invite: ['Nur auf Einladung', 'inv'], market: ['MQL5 Market', 'mkt'],
  free: ['Kostenlos', 'ok'], soon: ['Bald verfügbar', 'soon'], private: ['Privat', 'soon'],
};
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '–';
const byName = (a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' });
const badge = key => { const s = STATUS[key]; return s ? `<span class="badge ${s[1]}">${s[0]}</span>` : ''; };
const latest = it => (it.versions || [])[0];
let ITEMS = [], QUERY = '';

function card(it) {
  const img = it.images?.[0]?.src;
  const v = latest(it);
  return `<a class="card" href="#/${encodeURIComponent(it.id)}">
    ${img ? `<div class="thumb" style="background-image:url('${esc(img)}')"></div>` : `<div class="thumb none">${esc(it.platform || '')}</div>`}
    <div class="card-body">
      <h3>${esc(it.name)}</h3>
      <p>${esc(it.short)}</p>
      <div class="meta">${it.platform ? `<span class="badge plat">${esc(it.platform)}</span>` : ''}${badge(it.status)}
        ${v ? `<span>V${esc(v.v)} · ${fmtDate(v.date)}</span>` : ''}</div>
    </div></a>`;
}

function matches(it) {
  if (!QUERY) return true;
  const hay = [it.name, it.short, it.platform, ...(it.features || []), ...(it.tags || [])].join(' ').toLowerCase();
  return QUERY.split(/\s+/).every(w => hay.includes(w));
}

function overview() {
  document.title = 'Trading Tools · VrilyaSS';
  const count = id => id === 'tradingview' && window.TVV?.ready() ? TVV.count() : ITEMS.filter(i => i.category === id).length;
  $('#app').innerHTML = `
    <div class="page">
      <div class="hero">
        <div><h1>Trading <span>Tools</span></h1>
          <p>Indikatoren, Expert Advisors und Programme, die ich für mein Trading gebaut habe – zum Anschauen, Testen und Herunterladen.</p></div>
        <label class="search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
          <input id="q" type="search" placeholder="Suchen, z. B. Fibonacci" value="${esc(QUERY)}" aria-label="Tools durchsuchen"></label>
      </div>
      <div class="catnav">${CATS.map(c => `<button data-go="${c.id}">${c.title} <b>${count(c.id)}</b></button>`).join('')}</div>
      <div id="cats"></div>
    </div>`;
  $('#q').addEventListener('input', e => { QUERY = e.target.value.trim().toLowerCase(); renderCats(); });
  document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => document.getElementById('cat-' + b.dataset.go)?.scrollIntoView());
  renderCats();
}

function renderCats() {
  $('#cats').innerHTML = `<div class="page">${CATS.map(c => {
    const all = ITEMS.filter(i => i.category === c.id).sort(byName);
    const hits = all.filter(matches);
    let body;
    // TradingView hat eine eigene Ansicht (Gruppen / Einzelliste / Versteckt) aus tradingview.json
    if (c.id === 'tradingview' && window.TVV?.ready()) body = `<div id="tvbox">${TVV.html(QUERY)}</div>`;
    else if (c.id === 'geschuetzt') body = LOCKED;
    else if (!all.length) body = `<div class="empty">${esc(c.empty)}</div>`;
    else if (!hits.length) body = `<p class="nohit">Keine Treffer in ${esc(c.title)}.</p>`;
    else body = `<div class="grid">${hits.map(card).join('')}</div>`;
    return `<section class="cat" id="cat-${c.id}"><div class="cat-head"><h2>${c.title}</h2><span>${esc(c.sub)}</span></div>${body}</section>`;
  }).join('')}</div>`;
  if (window.TVV?.ready()) TVV.bind(() => QUERY);
}

function detail(it) {
  document.title = `${it.name} · Trading Tools`;
  const cat = CATS.find(c => c.id === it.category);
  const v = latest(it);
  const imgs = it.images || [];
  const dl = (it.downloads || []).map((d, i) => `<a class="btn${i === 0 ? ' primary' : ''}" href="${esc(d.url)}" rel="noopener">
      <span>⬇ ${esc(d.label)}</span><small>${esc(d.size || '')}</small></a>`).join('');
  const links = (it.links || []).map(l => `<a class="btn" href="${esc(l.url)}" target="_blank" rel="noopener"><span>${esc(l.label)} ↗</span><small>${esc(l.note || '')}</small></a>`).join('');
  $('#app').innerHTML = `
    <div class="page">
      <a class="back" href="#">← Alle Tools</a>
      <div class="detail">
        <div class="main-col">
          <div>
            <div class="meta" style="margin-bottom:8px"><span class="badge">${esc(cat?.title || '')}</span>${it.platform ? `<span class="badge plat">${esc(it.platform)}</span>` : ''}${badge(it.status)}</div>
            <h1>${esc(it.name)}</h1>
            <p style="color:var(--muted);margin-top:6px">${esc(it.short)}</p>
          </div>
          ${imgs.length ? `<div class="box gallery">
            <div class="main" id="gMain" role="img" aria-label="${esc(imgs[0].caption || it.name)}" style="background-image:url('${esc(imgs[0].src)}')"></div>
            <div class="cap" id="gCap">${esc(imgs[0].caption || '')}</div>
            ${imgs.length > 1 ? `<div class="thumbs">${imgs.map((im, i) => `<button class="${i ? '' : 'on'}" data-i="${i}" title="${esc(im.caption || '')}" style="background-image:url('${esc(im.src)}')"></button>`).join('')}</div>` : ''}
          </div>` : ''}
          ${(it.description || []).length ? `<div class="box desc"><h2>Beschreibung</h2>${it.description.map(p => `<p>${esc(p)}</p>`).join('')}</div>` : ''}
          ${(it.features || []).length ? `<div class="box"><h2>Funktionen</h2><ul class="feat">${it.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>` : ''}
        </div>
        <aside class="side">
          <div class="box"><h2>Überblick</h2><dl class="facts">
            <dt>Version</dt><dd>${v ? 'V' + esc(v.v) : '–'}</dd>
            <dt>Erstellt</dt><dd>${fmtDate(it.created)}</dd>
            <dt>Aktualisiert</dt><dd>${fmtDate(it.updated || v?.date)}</dd>
            ${it.platform ? `<dt>Plattform</dt><dd>${esc(it.platform)}</dd>` : ''}
            ${it.requires ? `<dt>Benötigt</dt><dd>${esc(it.requires)}</dd>` : ''}
          </dl></div>
          ${dl || links ? `<div class="box"><h2>${dl ? 'Download' : 'Links'}</h2><div class="actions">${dl}${links}</div></div>` : ''}
          ${(it.hints || []).length ? `<div class="box"><h2>Gut zu wissen</h2>${it.hints.map(h => `<div class="hint">${esc(h)}</div>`).join('')}</div>` : ''}
          ${(it.versions || []).length ? `<div class="box"><h2>Versionen</h2><div class="versions">${it.versions.map(x => `<div class="ver">
              <h3>Version ${esc(x.v)}<span>${fmtDate(x.date)}</span></h3>
              ${(x.notes || []).length ? `<ul>${x.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}</div>`).join('')}</div></div>` : ''}
        </aside>
      </div>
    </div>`;
  let cur = 0;
  document.querySelectorAll('.thumbs button').forEach(b => b.onclick = () => {
    cur = +b.dataset.i;
    $('#gMain').style.backgroundImage = `url('${imgs[cur].src}')`;
    $('#gMain').setAttribute('aria-label', imgs[cur].caption || it.name);
    $('#gCap').textContent = imgs[cur].caption || '';
    document.querySelectorAll('.thumbs button').forEach(x => x.classList.toggle('on', x === b));
  });
  $('#gMain')?.addEventListener('click', () => { const lb = $('#lightbox'); lb.querySelector('img').src = imgs[cur].src; lb.classList.remove('hidden'); });
  scrollTo(0, 0);
}

function route() {
  const m = location.hash.match(/^#\/(.+)$/);
  const it = m && ITEMS.find(i => i.id === decodeURIComponent(m[1]));
  if (it) detail(it); else overview();
}

$('#lightbox').onclick = () => $('#lightbox').classList.add('hidden');
addEventListener('keydown', e => { if (e.key === 'Escape') $('#lightbox').classList.add('hidden'); });
addEventListener('hashchange', route);
Promise.all([
  fetch('tools.json', { cache: 'no-store' }).then(r => r.json()),
  fetch('tradingview.json', { cache: 'no-store' }).then(r => r.json()).catch(() => null),
]).then(([j, tv]) => { ITEMS = j.items || []; if (tv && window.TVV) TVV.init(tv); route(); })
  .catch(() => { $('#app').innerHTML = '<p class="nohit">Die Liste konnte nicht geladen werden. Bitte Seite neu laden.</p>'; });
