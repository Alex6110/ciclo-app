'use strict';
const $ = (s, e = document) => e.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const FLUSSO = ['Nessuno', 'Leggero', 'Medio', 'Abbondante'];
const SINT = ['Crampi', 'Mal di testa', 'Gonfiore', 'Stanchezza', 'Acne', 'Mal di schiena', 'Nausea', 'Voglie'];
const UMORI = ['Bene', 'Neutro', 'Triste', 'Irritabile', 'Ansiosa'];
const TITOLI = { oggi: 'Oggi', cal: 'Calendario', dati: 'Statistiche', imp: 'Impostazioni' };

let S, tab = 'oggi', mese = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

/* ---------- archivio locale (IndexedDB) ---------- */
const idb = () => new Promise((res, rej) => {
  const r = indexedDB.open('ciclo', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('kv');
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
});
async function kv(mode, fn) {
  const d = await idb();
  return new Promise((res, rej) => {
    const t = d.transaction('kv', mode), q = fn(t.objectStore('kv'));
    t.oncomplete = () => res(q && q.result);
    t.onerror = () => rej(t.error);
  });
}
const load = async () => (await kv('readonly', s => s.get('state'))) || { days: {}, cfg: { cycle: 28, period: 5 } };
const commit = async () => { await kv('readwrite', s => s.put(S, 'state')); render(); };

/* ---------- date ---------- */
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const add = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const diff = (a, b) => Math.round((parse(a) - parse(b)) / 864e5);
const dm = s => parse(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
const oggi = () => iso(new Date());

/* ---------- calcolo cicli e previsioni ---------- */
function periodi() {
  const ds = Object.keys(S.days).filter(k => S.days[k].flow > 0).sort(), out = [];
  for (const d of ds) {
    const l = out[out.length - 1];
    if (l && diff(d, l.end) <= 2) l.end = d; else out.push({ start: d, end: d });
  }
  return out;
}
function stats() {
  const p = periodi(), L = [];
  for (let i = 1; i < p.length; i++) { const n = diff(p[i].start, p[i - 1].start); if (n >= 15 && n <= 60) L.push(n); }
  const r = L.slice(-6); let w = 0, s = 0;
  r.forEach((n, i) => { w += i + 1; s += n * (i + 1); });
  const cycle = r.length ? s / w : +S.cfg.cycle;
  const sd = r.length > 2 ? Math.sqrt(r.reduce((a, n) => a + (n - cycle) ** 2, 0) / r.length) : 0;
  const pl = p.slice(-7, -1).map(x => diff(x.end, x.start) + 1);
  const period = pl.length ? pl.reduce((a, b) => a + b) / pl.length : +S.cfg.period;
  return { p, L, cycle, sd, period, n: r.length };
}
function predici(st) {
  if (!st.p.length) return null;
  const last = st.p[st.p.length - 1], cyc = Math.round(st.cycle), pl = Math.round(st.period), list = [];
  for (let k = 1; k <= 4; k++) { const s = add(last.start, cyc * k); list.push({ s, e: add(s, pl - 1), o: add(s, -14) }); }
  return { last, cyc, pl, list, next: list[0] };
}

/* ---------- viste ---------- */
function ring(cyc, cd, pl) {
  const R = 78, C = 2 * Math.PI * R, o = cyc - 14, c = Math.min(cd, cyc);
  const arc = (a, b, col) => {
    a = Math.max(0, a); b = Math.min(cyc - 1, b);
    return `<circle cx="100" cy="100" r="${R}" fill="none" stroke="${col}" stroke-width="14" stroke-dasharray="${(b - a + 1) / cyc * C} ${C}" stroke-dashoffset="${-a / cyc * C}" transform="rotate(-90 100 100)"/>`;
  };
  const ang = (c - .5) / cyc * 2 * Math.PI - Math.PI / 2;
  return `<svg class="ring" width="230" height="230" viewBox="0 0 200 200" role="img" aria-label="Giorno ${cd} del ciclo">
    <circle cx="100" cy="100" r="${R}" fill="none" stroke="var(--line)" stroke-width="14"/>
    ${arc(0, pl - 1, 'var(--per)')}${arc(o - 5, o + 1, 'var(--fer)')}
    <circle cx="${100 + R * Math.cos(ang)}" cy="${100 + R * Math.sin(ang)}" r="11" fill="var(--bg)" stroke="var(--ink)" stroke-width="3"/>
    <text x="100" y="112" text-anchor="middle" font-size="46" font-family="ui-serif,'New York',Georgia,serif" font-weight="600" fill="var(--ink)">${cd}</text>
    <text x="100" y="134" text-anchor="middle" font-size="12" fill="var(--mut)">giorno del ciclo</text></svg>`;
}

function viewOggi() {
  const st = stats(), pr = predici(st), t = oggi();
  if (!pr) return `<div class="box"><p><b>Si parte dal passato.</b></p><p class="mut">Apri il Calendario, torna indietro di qualche mese e tocca i giorni delle mestruazioni passate. Con tre o quattro cicli le previsioni iniziano a diventare affidabili.</p></div><button class="btn" data-d="${t}">Registra oggi</button>`;
  const cd = diff(t, pr.last.start) + 1, n = pr.next, fra = diff(n.s, t), o = n.o;
  let fase;
  if (cd <= diff(pr.last.end, pr.last.start) + 1) fase = 'Mestruazione';
  else if (t === o) fase = 'Ovulazione stimata';
  else if (t >= add(o, -5) && t <= add(o, 1)) fase = 'Finestra fertile';
  else fase = t < o ? 'Fase follicolare' : 'Fase luteale';
  const r = Math.round(st.sd);
  let prossima = fra > 0 ? `Prossima mestruazione tra <b>${fra} ${fra === 1 ? 'giorno' : 'giorni'}</b>` : fra === 0 ? '<b>Mestruazione attesa oggi</b>' : `Mestruazione in ritardo di <b>${-fra} ${fra === -1 ? 'giorno' : 'giorni'}</b>`;
  const e = S.days[t];
  const reg = e ? [e.flow ? 'flusso ' + FLUSSO[e.flow].toLowerCase() : '', ...(e.sym || []).map(x => x.toLowerCase()), e.mood ? e.mood.toLowerCase() : ''].filter(Boolean).join(', ') : '';
  return `<div class="hero">${ring(pr.cyc, cd, pr.pl)}<p class="ph">${fase}</p>
    <p>${prossima}</p>
    ${st.sd >= 1.5 ? `<p class="mut">Probabile tra il ${dm(add(n.s, -r))} e il ${dm(add(n.s, r))}</p>` : ''}
    <p class="mut">Finestra fertile stimata: ${dm(add(o, -5))} – ${dm(add(o, 1))}</p>
    ${reg ? `<p class="mut">Registrato oggi: ${esc(reg)}</p>` : ''}</div>
    <button class="btn" data-d="${t}">${e ? 'Modifica oggi' : 'Registra oggi'}</button>`;
}

function viewCal() {
  const st = stats(), pr = predici(st), t = oggi();
  const y = mese.getFullYear(), m = mese.getMonth(), n = new Date(y, m + 1, 0).getDate();
  const vuoti = (new Date(y, m, 1).getDay() + 6) % 7;
  let cells = '<span class="d x"></span>'.repeat(vuoti);
  for (let i = 1; i <= n; i++) {
    const d = iso(new Date(y, m, i)), e = S.days[d], c = ['d'];
    if (e && e.flow > 0) c.push('p');
    else if (pr && d > pr.last.end) for (const x of pr.list) {
      if (d >= x.s && d <= x.e) c.push('pp');
      if (d === x.o) c.push('o'); else if (d >= add(x.o, -5) && d <= add(x.o, 1)) c.push('f');
    }
    if (d === t) c.push('t');
    if (e && (e.sym?.length || e.mood || e.note)) c.push('n');
    cells += `<button class="${c.join(' ')}" data-d="${d}">${i}</button>`;
  }
  return `<div class="nav"><button data-m="-1" aria-label="Mese precedente">‹</button><b>${mese.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</b><button data-m="1" aria-label="Mese successivo">›</button></div>
    <div class="grid">${['L', 'M', 'M', 'G', 'V', 'S', 'D'].map(x => `<span class="dw">${x}</span>`).join('')}${cells}</div>
    <div class="leg"><span><i style="background:var(--per)"></i>Mestruazione</span><span><i style="box-shadow:inset 0 0 0 2px var(--per)"></i>Prevista</span><span><i style="background:color-mix(in srgb,var(--fer) 28%,transparent)"></i>Fertile</span><span><i style="box-shadow:inset 0 0 0 2px var(--fer)"></i>Ovulazione</span></div>
    <p class="mut">Tocca un giorno per registrare flusso, sintomi e umore. Per lo storico, torna indietro con la freccia e usa «Segna giorni da qui».</p>`;
}

function viewDati() {
  const st = stats();
  if (!st.p.length) return '<div class="box"><p class="mut">Nessun dato ancora. Registra le mestruazioni nel Calendario e qui compariranno le statistiche.</p></div>';
  const cnt = {};
  Object.values(S.days).forEach(e => (e.sym || []).forEach(x => cnt[x] = (cnt[x] || 0) + 1));
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const reg = st.n < 3 ? 'servono almeno 3 cicli' : st.sd <= 2 ? 'molto regolare' : st.sd <= 4 ? 'abbastanza regolare' : 'variabile';
  return `<div class="box">
    <div class="kv"><span>Durata media del ciclo</span><b>${st.cycle.toFixed(1)} giorni</b></div>
    <div class="kv"><span>Durata media mestruazione</span><b>${st.period.toFixed(1)} giorni</b></div>
    <div class="kv"><span>Cicli registrati</span><b>${st.L.length}</b></div>
    <div class="kv"><span>Regolarità</span><b>${reg}</b></div></div>
    ${st.L.length ? `<div class="box"><b>Ultimi cicli (giorni)</b><div class="bars">${st.L.slice(-8).map(n => `<div style="height:${Math.min(100, n * 2)}px"><span>${n}</span></div>`).join('')}</div></div>` : ''}
    ${top.length ? `<div class="box"><b>Sintomi più frequenti</b>${top.map(([k, v]) => `<div class="kv"><span>${esc(k)}</span><b>${v}×</b></div>`).join('')}</div>` : ''}`;
}

function viewImp() {
  return `<div class="box"><b>Valori di partenza</b><p class="mut">Usati finché non ci sono almeno due cicli registrati.</p>
    <label class="f">Durata del ciclo (giorni)<input type="number" min="15" max="60" value="${S.cfg.cycle}" data-cfg="cycle"></label>
    <label class="f">Durata mestruazione (giorni)<input type="number" min="1" max="12" value="${S.cfg.period}" data-cfg="period"></label></div>
    <div class="box"><b>Dati</b><p class="mut">I dati restano su questo telefono. Esporta una copia per sicurezza o per cambiare dispositivo.</p>
    <div class="row"><button class="btn alt" data-act="exp">Esporta</button><button class="btn alt" data-act="imp">Importa</button></div>
    <input type="file" id="fi" accept="application/json" hidden></div>
    <p class="mut">Le previsioni sono stime basate sui cicli registrati: non sono uno strumento contraccettivo né diagnostico.</p>`;
}

function render() {
  $('#ttl').textContent = TITOLI[tab];
  $('#v').innerHTML = { oggi: viewOggi, cal: viewCal, dati: viewDati, imp: viewImp }[tab]();
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
}

/* ---------- inserimento giorno ---------- */
function apriGiorno(d) {
  const cur = S.days[d] || {}, dl = $('#dlg'), sym = new Set(cur.sym || []);
  let flow = cur.flow || 0, mood = cur.mood || '';
  const pl = Math.round(+S.cfg.period);
  const chips = (arr, on, k) => arr.map((x, i) => `<button class="chip${on(x, i) ? ' on' : ''}" data-${k}="${i}">${x}</button>`).join('');
  dl.innerHTML = `<h2>${parse(d).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
    <h3>Flusso</h3><div class="chips" id="cf">${chips(FLUSSO, (x, i) => i === flow, 'i')}</div>
    <button class="link" id="bulk">Segna ${pl} giorni di mestruazione da qui</button>
    <h3>Sintomi</h3><div class="chips" id="cs">${chips(SINT, x => sym.has(x), 'i')}</div>
    <h3>Umore</h3><div class="chips" id="cm">${chips(UMORI, x => x === mood, 'i')}</div>
    <h3>Note</h3><textarea id="nt" rows="2">${esc(cur.note || '')}</textarea>
    <div class="row"><button class="btn alt" id="no">Annulla</button><button class="btn" id="sv">Salva</button></div>
    ${S.days[d] ? '<button class="link" id="del">Cancella questo giorno</button>' : ''}`;
  $('#cf').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; flow = +b.dataset.i; [...$('#cf').children].forEach((c, i) => c.classList.toggle('on', i === flow)); };
  $('#cs').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; const k = SINT[+b.dataset.i]; sym.has(k) ? sym.delete(k) : sym.add(k); b.classList.toggle('on'); };
  $('#cm').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; const k = UMORI[+b.dataset.i]; mood = mood === k ? '' : k; [...$('#cm').children].forEach((c, i) => c.classList.toggle('on', UMORI[i] === mood)); };
  $('#no').onclick = () => dl.close();
  $('#sv').onclick = async () => {
    const e = { flow, sym: [...sym], mood, note: $('#nt').value.trim() };
    if (!e.flow && !e.sym.length && !e.mood && !e.note) delete S.days[d]; else S.days[d] = e;
    dl.close(); await commit();
  };
  $('#bulk').onclick = async () => {
    for (let i = 0; i < pl; i++) { const x = add(d, i); S.days[x] = { ...S.days[x], flow: S.days[x]?.flow || 2 }; }
    dl.close(); await commit();
  };
  if ($('#del')) $('#del').onclick = async () => { delete S.days[d]; dl.close(); await commit(); };
  dl.showModal();
}

/* ---------- eventi ---------- */
$('#v').addEventListener('click', e => {
  const b = e.target.closest('[data-d],[data-m],[data-act]'); if (!b) return;
  if (b.dataset.d) return apriGiorno(b.dataset.d);
  if (b.dataset.m) { mese = new Date(mese.getFullYear(), mese.getMonth() + +b.dataset.m, 1); return render(); }
  if (b.dataset.act === 'exp') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ v: 1, esportato: new Date().toISOString(), ...S })], { type: 'application/json' }));
    a.download = `ciclo-${oggi()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  if (b.dataset.act === 'imp') $('#fi').click();
});
$('#v').addEventListener('change', async e => {
  if (e.target.dataset.cfg) { S.cfg[e.target.dataset.cfg] = Math.max(1, +e.target.value || 1); return commit(); }
  if (e.target.id === 'fi' && e.target.files[0]) {
    try {
      const j = JSON.parse(await e.target.files[0].text());
      if (!j.days || typeof j.days !== 'object') throw 0;
      if (!confirm('Sostituire i dati attuali con quelli del file?')) return;
      S = { days: j.days, cfg: { ...S.cfg, ...j.cfg } }; await commit();
    } catch { alert('File non valido: scegli un export di questa app.'); }
  }
});
$('#tabs').onclick = e => { const b = e.target.closest('button'); if (b) { tab = b.dataset.t; render(); } };

(async () => {
  S = await load();
  navigator.storage?.persist?.();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
  render();
})();
