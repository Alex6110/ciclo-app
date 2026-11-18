'use strict';
const SB = 'https://fwcxhbcyrcujcccwnvee.supabase.co';
const PK = 'sb_publishable_2dX2Ahy1W-OLwocWYumtCw_KJoemZCn';
const $ = (s, e = document) => e.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const FLUSSO = ['Nessuno', 'Leggero', 'Medio', 'Abbondante'];
const SINT = ['Crampi', 'Mal di testa', 'Gonfiore', 'Stanchezza', 'Acne', 'Mal di schiena', 'Nausea', 'Voglie'];
const UMORI = ['Bene', 'Neutro', 'Triste', 'Irritabile', 'Ansiosa'];

let S, sess = null, K = null, remoto = null, sync = '', msg = '';
let auth = { step: 'email', email: '' }, tab = 'oggi', sel, sett, editMest = false, calDa = 18, scrollCal = false;
let mese = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

/* ---------- archivio locale (IndexedDB) ---------- */
const idb = () => new Promise((res, rej) => {
  const r = indexedDB.open('ciclo', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('kv');
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
});
const kvGet = async k => { const d = await idb(); return new Promise((res, rej) => { const q = d.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); };
const kvSet = async (k, v) => { const d = await idb(); return new Promise((res, rej) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); };
const kvDel = async k => { const d = await idb(); return new Promise((res, rej) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').delete(k); t.oncomplete = res; t.onerror = () => rej(t.error); }); };
const load = async () => { const s = (await kvGet('state')) || {}; return { days: s.days || {}, cfg: { cycle: 28, period: 5, ...s.cfg }, updated: s.updated }; };
async function commit() { S.updated = new Date().toISOString(); await kvSet('state', S); render(); spingi(); }

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
  return { p, L, cycle, sd, period };
}
function predici(st) {
  if (!st.p.length) return null;
  const last = st.p[st.p.length - 1], cyc = Math.round(st.cycle), pl = Math.round(st.period), list = [];
  for (let k = 1; k <= 4; k++) { const s = add(last.start, cyc * k); list.push({ s, e: add(s, pl - 1), o: add(s, -14) }); }
  return { last, cyc, pl, list, next: list[0] };
}

/* ---------- viste ---------- */
const mondayOf = s => add(s, -((parse(s).getDay() + 6) % 7));
const IC = {
  gear: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  cal: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/></svg>',
  back: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  drop: '<svg viewBox="0 0 24 24"><path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  mood: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 14c1 1.5 2.5 2 4 2s3-.5 4-2M9 9.5v.5M15 9.5v.5"/></svg>',
  note: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>'
};

function classi(d, pr) {
  const e = S.days[d], c = [], t = oggi();
  if (e && e.flow > 0) c.push('p');
  else if (pr && d > pr.last.end) {
    if (d >= t && d <= add(pr.last.start, pr.pl - 1)) c.push('pp');
    for (const x of pr.list) {
      if (d >= x.s && d <= x.e) c.push('pp');
      if (d === x.o) c.push('o'); else if (d >= add(x.o, -5) && d <= add(x.o, 1)) c.push('f');
    }
  }
  if (e && (e.sym?.length || e.mood || e.note)) c.push('n');
  return c;
}

function infoGiorno(sel, st, pr) {
  let start, end;
  if (sel > oggi() && sel >= pr.next.s) {
    start = add(pr.last.start, pr.cyc * Math.floor(diff(sel, pr.last.start) / pr.cyc)); end = add(start, pr.pl - 1);
  } else {
    const prev = st.p.filter(x => x.start <= sel).pop();
    if (!prev) return null;
    start = prev.start;
    const fine = add(prev.start, pr.pl - 1);
    end = prev === st.p[st.p.length - 1] && fine > prev.end ? fine : prev.end;
  }
  return { start, end, cd: diff(sel, start) + 1, o: add(start, pr.cyc - 14), next: add(start, pr.cyc) };
}

function ring(cyc, cd, pl) {
  const R = 78, C = 2 * Math.PI * R, o = cyc - 14, c = Math.min(cd, cyc);
  const arc = (a, b, col) => {
    a = Math.max(0, a); b = Math.min(cyc - 1, b);
    return `<circle cx="100" cy="100" r="${R}" fill="none" stroke="${col}" stroke-width="14" stroke-dasharray="${(b - a + 1) / cyc * C} ${C}" stroke-dashoffset="${-a / cyc * C}" transform="rotate(-90 100 100)"/>`;
  };
  const ang = (c - .5) / cyc * 2 * Math.PI - Math.PI / 2;
  return `<svg class="ring" width="200" height="200" viewBox="0 0 200 200" role="img" aria-label="Giorno ${cd} del ciclo">
    <circle cx="100" cy="100" r="${R}" fill="none" stroke="var(--line)" stroke-width="14"/>
    ${arc(0, pl - 1, 'var(--per)')}${arc(o - 5, o + 1, 'var(--fer)')}
    <circle cx="${100 + R * Math.cos(ang)}" cy="${100 + R * Math.sin(ang)}" r="11" fill="var(--bg)" stroke="var(--ink)" stroke-width="3"/>
    <text x="100" y="112" text-anchor="middle" font-size="46" font-family="ui-serif,'New York',Georgia,serif" font-weight="600" fill="var(--ink)">${cd}</text>
    <text x="100" y="134" text-anchor="middle" font-size="12" fill="var(--mut)">giorno del ciclo</text></svg>`;
}

function ripulisci(d) {
  const e = S.days[d];
  if (e && !e.flow && !(e.sym || []).length && !e.mood && !e.note) delete S.days[d];
}
// Segna (v = 1-3) o toglie (v = 0) la mestruazione. Al primo giorno di un nuovo periodo
// segna in automatico anche i giorni successivi, fino alla durata media o a oggi.
function setFlow(d, v) {
  if (!v) { if (S.days[d]) { S.days[d] = { ...S.days[d], flow: 0 }; ripulisci(d); } return; }
  const nuovo = !(S.days[add(d, -1)]?.flow > 0) && !(S.days[d]?.flow > 0);
  const n = nuovo ? Math.round(stats().period) : 1, t = oggi();
  for (let i = 0; i < n; i++) {
    const x = add(d, i);
    if (i && x > t) break;
    if (i && S.days[x]?.flow > 0) continue;
    S.days[x] = { ...S.days[x], flow: v };
  }
}

function eventi(pr, t) {
  const ev = [];
  for (const x of pr.list) ev.push({ d: add(x.o, -5), n: 'Inizio finestra fertile' }, { d: x.o, n: 'Ovulazione' }, { d: x.s, n: 'Mestruazione' });
  return ev.filter(e => e.d >= t).sort((a, b) => a.d < b.d ? -1 : 1).slice(0, 3);
}
function cardsOggi(st, pr, t) {
  const rel = n => n === 0 ? 'oggi' : n === 1 ? 'domani' : `tra ${n} giorni`;
  const ev = eventi(pr, t).map(e => `<div class="kv"><span>${e.n}<br><small class="mut">${rel(diff(e.d, t))}</small></span><b>${dm(e.d)}</b></div>`).join('');
  const reg = st.sd <= 2 ? 'molto regolare' : st.sd <= 4 ? 'abbastanza regolare' : 'variabile';
  return `<div class="box"><b>In arrivo</b>${ev}</div>
    ${st.L.length ? `<div class="box"><b>Il tuo ciclo</b>
      <div class="kv"><span>Durata media del ciclo</span><b>${st.cycle.toFixed(0)} giorni</b></div>
      <div class="kv"><span>Durata media mestruazione</span><b>${st.period.toFixed(0)} giorni</b></div>
      ${st.L.length > 2 ? `<div class="kv"><span>Regolarità</span><b>${reg}</b></div>` : ''}
      <div class="bars">${st.L.slice(-6).map(n => `<div style="height:${Math.min(100, n * 2)}px"><span>${n}</span></div>`).join('')}</div>
      <p class="mut cen">Giorni degli ultimi cicli</p></div>` : ''}`;
}

function viewOggi() {
  const st = stats(), pr = predici(st), t = oggi();
  const giorni = Array.from({ length: 7 }, (_, i) => add(sett, i));
  const strip = `<div class="strip" id="strip">${giorni.map((d, i) => `<button class="wd${d === sel ? ' sel' : ''}${d === t ? ' td' : ''}" data-sel="${d}"><span>${d === t ? 'OGGI' : 'LMMGVSD'[i]}</span><i class="${classi(d, pr).join(' ')}">${parse(d).getDate()}</i></button>`).join('')}</div>`;
  const info = pr && infoGiorno(sel, st, pr);
  let hero;
  if (!info) hero = `<div class="box"><p><b>Si parte dal passato.</b></p><p class="mut">Tocca «Mestruazioni» per registrare l'ultima, oppure apri il calendario in alto a destra e segna quelle passate. Con tre o quattro cicli le previsioni diventano affidabili.</p></div>`;
  else {
    const { cd, o, next, start, end } = info, g = n => `${n} ${n === 1 ? 'giorno' : 'giorni'}`;
    let a, b;
    if (sel >= start && sel <= end) { a = 'Mestruazione'; b = `giorno ${cd}`; }
    else if (sel <= o) { const n = diff(o, sel); a = n ? 'Ovulazione tra' : 'Ovulazione'; b = n ? g(n) : (sel === t ? 'oggi' : 'in questo giorno'); }
    else { const n = diff(next, sel); a = n > 0 ? 'Mestruazione tra' : n === 0 ? 'Mestruazione' : 'Mestruazione in ritardo di'; b = n > 0 ? g(n) : n === 0 ? 'attesa' : g(-n); }
    const dist = diff(sel, o), inP = sel >= start && sel <= end;
    const fert = inP ? 'bassa' : dist >= -2 && dist <= 0 ? 'alta' : (dist >= -5 && dist <= 1) ? 'media' : 'bassa';
    const r = Math.round(st.sd);
    hero = `<div class="hero">${ring(pr.cyc, cd, pr.pl)}<p class="lead">${a}</p><p class="bigv">${b}</p>
      <p class="mut">Probabilità di concepimento stimata: ${fert}</p>
      ${st.sd >= 1.5 && a.startsWith('Mestruazione tra') ? `<p class="mut">Probabile tra il ${dm(add(next, -r))} e il ${dm(add(next, r))}</p>` : ''}</div>`;
  }
  const e = S.days[sel] || {};
  const act = (s, ic, lab, on, main) => `<button class="act${main ? ' main' : ''}${on ? ' on' : ''}" data-s="${s}"><b>${IC[ic]}</b>${lab}</button>`;
  return `${strip}${hero}
    <div class="acts">${act('flusso', 'drop', 'Mestruazioni', e.flow > 0, true)}${act('sintomi', 'plus', 'Sintomi', e.sym?.length)}${act('umore', 'mood', 'Umore', e.mood)}${act('note', 'note', 'Note', e.note)}</div>
    ${sel !== t ? `<button class="link cen" data-sel="${t}">Torna a oggi</button>` : ''}${pr ? cardsOggi(st, pr, t) : ''}`;
}

function viewCal() {
  const st = stats(), pr = predici(st), t = oggi(), now = new Date();
  let h = `<div class="calhead"><div class="grid">${['L', 'M', 'M', 'G', 'V', 'S', 'D'].map(x => `<span class="dw">${x}</span>`).join('')}</div>
    <p class="leg2">${editMest ? 'Tocca i giorni per aggiungere o togliere la mestruazione' : '<i class="lg p"></i>Mestruazione<i class="lg pp"></i>Prevista<i class="lg f"></i>Fertile<i class="lg o"></i>Ovulazione'}</p></div>
    <button class="link cen" data-act="piu">Mostra mesi precedenti</button>`;
  for (let k = -calDa; k <= 6; k++) {
    const m0 = new Date(now.getFullYear(), now.getMonth() + k, 1), n = new Date(m0.getFullYear(), m0.getMonth() + 1, 0).getDate();
    const nome = m0.toLocaleDateString('it-IT', { month: 'long' }) + (m0.getFullYear() !== now.getFullYear() ? ' ' + m0.getFullYear() : '');
    let cells = '<span class="d x"></span>'.repeat((m0.getDay() + 6) % 7);
    for (let i = 1; i <= n; i++) {
      const d = iso(new Date(m0.getFullYear(), m0.getMonth(), i)), c = ['d', ...classi(d, pr)];
      if (d === t) c.push('t');
      cells += `<button class="${c.join(' ')}" data-d="${d}">${i}</button>`;
    }
    h += `<h3 class="mh"${k === 0 ? ' id="mcur"' : ''}>${nome}</h3><div class="grid mg">${cells}</div>`;
  }
  return h + `<div style="height:96px"></div><button class="fab" data-act="edit">${editMest ? 'Fine' : 'Modifica mestruazioni'}</button>`;
}

function boxAccount() {
  const er = `<p class="mut" id="er">${esc(msg)}</p>`;
  if (!sess) return auth.step === 'code'
    ? `<div class="box"><b>Account</b><p class="mut">Abbiamo inviato un codice a ${esc(auth.email)}. Inseriscilo qui sotto.</p><input id="cd" class="tx" inputmode="numeric" autocomplete="one-time-code" placeholder="Codice"><button class="btn" data-act="verifica">Accedi</button><button class="link" data-act="cambia">Usa un'altra email</button>${er}</div>`
    : `<div class="box"><b>Account e backup</b><p class="mut">Accedi con la tua email per salvare i dati cifrati e ritrovarli se cambi telefono.</p><input id="em" class="tx" type="email" autocomplete="email" placeholder="Email" value="${esc(auth.email)}"><button class="btn" data-act="invia">Invia codice</button>${er}</div>`;
  if (!K) return `<div class="box"><b>Passphrase</b><p class="mut">${remoto ? 'Inserisci la passphrase per sbloccare il backup.' : 'Scegli una passphrase: cifra i dati prima che lascino il telefono. Se la perdi, il backup non è recuperabile.'}</p><input id="p1" class="tx" type="password" autocomplete="${remoto ? 'current-password' : 'new-password'}" placeholder="Passphrase">${remoto ? '' : '<input id="p2" class="tx" type="password" autocomplete="new-password" placeholder="Ripeti la passphrase">'}<button class="btn" data-act="sblocca">${remoto ? 'Sblocca' : 'Crea backup'}</button><button class="link" data-act="esci">Esci</button>${er}</div>`;
  return `<div class="box"><b>Account</b><p class="mut">${esc(sess.email || '')}</p><p class="mut" id="sy">${esc(sync)}</p><div class="row"><button class="btn alt" data-act="sync">Sincronizza</button><button class="btn alt" data-act="esci">Esci</button></div></div>`;
}

function viewImp() {
  return `<h2>Impostazioni</h2>${boxAccount()}
    <div class="box"><b>Valori di partenza</b><p class="mut">Usati finché non ci sono almeno due cicli registrati.</p>
    <label class="f">Durata del ciclo (giorni)<input type="number" min="15" max="60" value="${S.cfg.cycle}" data-cfg="cycle"></label>
    <label class="f">Durata mestruazione (giorni)<input type="number" min="1" max="12" value="${S.cfg.period}" data-cfg="period"></label></div>
    <div class="box"><b>Copia dei dati</b><p class="mut">Esporta un file di riserva o ripristina da uno già esportato.</p>
    <div class="row"><button class="btn alt" data-act="exp">Esporta</button><button class="btn alt" data-act="imp">Importa</button></div>
    <input type="file" id="fi" accept="application/json" hidden></div>
    <p class="mut">Le previsioni sono stime basate sui cicli registrati: non sono uno strumento contraccettivo né diagnostico.</p>`;
}

function render() {
  const v = $('#v');
  v.innerHTML = { oggi: viewOggi, cal: viewCal, imp: viewImp }[tab]();
  v.classList.toggle('cal', tab === 'cal');
  $('#hl').innerHTML = tab === 'oggi' ? IC.gear : IC.back;
  $('#hl').setAttribute('aria-label', tab === 'oggi' ? 'Impostazioni' : 'Indietro');
  $('#hr').innerHTML = IC.cal;
  $('#hr').style.visibility = tab === 'oggi' ? 'visible' : 'hidden';
  if (tab === 'cal' && scrollCal) {
    scrollCal = false;
    const c = $('#mcur'), hd = $('.calhead');
    if (c) v.scrollTop = c.offsetTop - (hd ? hd.offsetHeight : 0) - 8;
  }
}

/* ---------- inserimento giorno (salvataggio immediato) ---------- */
function apriGiorno(d, sez = ['flusso', 'sintomi', 'umore', 'note']) {
  const dl = $('#dlg'), pl = Math.round(+S.cfg.period), get = () => S.days[d] || {};
  const salva = async patch => {
    const e = { ...get(), ...patch };
    if (!e.flow && !(e.sym || []).length && !e.mood && !e.note) delete S.days[d]; else S.days[d] = e;
    await commit();
  };
  const chips = (k, arr, on, val = x => x) => `<div class="chips" data-k="${k}">${arr.map(x => `<button class="chip${on(x) ? ' on' : ''}" data-v="${esc(val(x))}">${x}</button>`).join('')}</div>`;
  const parti = {
    flusso: () => `<h3>Mestruazione</h3>${chips('flow', FLUSSO.slice(1), x => get().flow === FLUSSO.indexOf(x), x => FLUSSO.indexOf(x))}`,
    sintomi: () => `<h3>Sintomi</h3>${chips('sym', SINT, x => (get().sym || []).includes(x))}`,
    umore: () => `<h3>Umore</h3>${chips('mood', UMORI, x => get().mood === x)}`,
    note: () => `<h3>Note</h3><textarea id="nt" rows="3">${esc(get().note || '')}</textarea>`
  };
  dl.innerHTML = `<h2>${parse(d).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>${sez.map(k => parti[k]()).join('')}<button class="btn" id="ok">Fatto</button>`;
  dl.onclick = async e => {
    if (e.target === dl) return dl.close();
    const b = e.target.closest('.chip,#ok'); if (!b) return;
    if (b.id === 'ok') return dl.close();
    const k = b.parentElement.dataset.k, v = b.dataset.v, was = b.classList.contains('on');
    if (k === 'sym') b.classList.toggle('on');
    else { [...b.parentElement.children].forEach(c => c.classList.remove('on')); if (!was) b.classList.add('on'); }
    if (k === 'flow') { setFlow(d, was ? 0 : +v); await commit(); }
    if (k === 'mood') await salva({ mood: was ? '' : v });
    if (k === 'sym') { const s = new Set(get().sym || []); s.has(v) ? s.delete(v) : s.add(v); await salva({ sym: [...s] }); }
  };
  dl.onclose = () => { const t = $('#nt'); if (t && t.value.trim() !== (get().note || '')) salva({ note: t.value.trim() }); };
  dl.showModal();
}

/* ---------- cifratura ---------- */
const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = u => { u = new Uint8Array(u); let s = ''; for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); };
const ub64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function chiave(pass, salt) {
  const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function cifra() {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, K.k, enc.encode(JSON.stringify(S)));
  return { salt: K.salt, iv: b64(iv), data: b64(ct) };
}
const decifra = async (k, r) => JSON.parse(dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ub64(r.iv) }, k, ub64(r.data))));

/* ---------- Supabase (REST diretta, senza librerie) ---------- */
async function api(path, opt = {}, token) {
  const r = await fetch(SB + path, { ...opt, headers: { apikey: PK, 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...opt.headers } });
  if (!r.ok) {
    let m = ''; try { const j = await r.json(); m = j.msg || j.message || j.error_description || ''; } catch { }
    throw Object.assign(new Error(m || 'Errore ' + r.status), { status: r.status });
  }
  return r.json().catch(() => null);
}
const salvaSess = j => { sess = { at: j.access_token, rt: j.refresh_token, exp: Date.now() + (j.expires_in - 30) * 1000, id: j.user?.id || sess?.id, email: j.user?.email || sess?.email }; return kvSet('sess', sess); };
async function token() {
  if (!sess) throw new Error('Accesso non effettuato');
  if (Date.now() > sess.exp) {
    try { await salvaSess(await api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: sess.rt }) })); }
    catch (e) { if (e.status >= 400 && e.status < 500) await esci(); throw e; }
  }
  return sess.at;
}
async function leggiRemoto() { const r = await api('/rest/v1/ciclo_backup?select=salt,iv,data,updated_at', {}, await token()); remoto = r && r[0] || null; }
const stato = m => { sync = m; const e = $('#sy'); if (e) e.textContent = m; };
let tm;
function spingi() { if (sess && K) { clearTimeout(tm); tm = setTimeout(() => spingiOra().catch(() => { }), 1500); } }
async function spingiOra() {
  stato('Sincronizzazione…');
  try {
    const c = await cifra();
    await api('/rest/v1/ciclo_backup', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ user_id: sess.id, ...c, updated_at: S.updated || new Date().toISOString() }) }, await token());
    stato('Sincronizzato alle ' + new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }));
  } catch (e) { stato('Sincronizzazione non riuscita: ' + e.message); throw e; }
}
async function tira() {
  if (!sess || !K) return;
  await leggiRemoto();
  if (!remoto) return spingiOra();
  const rt = new Date(remoto.updated_at), lt = new Date(S.updated || 0);
  if (rt > lt) { S = await decifra(K.k, remoto); await kvSet('state', S); render(); stato('Aggiornato dal backup'); }
  else if (lt > rt) await spingiOra();
  else stato('Sincronizzato');
}
async function esci() { sess = null; K = null; remoto = null; auth = { step: 'email', email: '' }; await kvDel('sess'); await kvDel('key'); }

const azioni = {
  async invia() {
    const em = $('#em').value.trim(); if (!em) return;
    auth.email = em; msg = '';
    await api('/auth/v1/otp', { method: 'POST', body: JSON.stringify({ email: em, create_user: true }) });
    auth.step = 'code'; render();
  },
  cambia() { auth.step = 'email'; msg = ''; render(); },
  async verifica() {
    const code = $('#cd').value.trim(); if (!code) return;
    msg = ''; await salvaSess(await api('/auth/v1/verify', { method: 'POST', body: JSON.stringify({ type: 'email', email: auth.email, token: code }) }));
    await leggiRemoto(); render();
  },
  async sblocca() {
    const pass = $('#p1').value; msg = '';
    if (!remoto) {
      if (pass.length < 8) throw new Error('La passphrase deve avere almeno 8 caratteri.');
      if (pass !== $('#p2').value) throw new Error('Le due passphrase non coincidono.');
      const salt = crypto.getRandomValues(new Uint8Array(16));
      K = { k: await chiave(pass, salt), salt: b64(salt) };
      try { await kvSet('key', K); } catch { }
      await spingiOra();
    } else {
      const k = await chiave(pass, ub64(remoto.salt)); let dati;
      try { dati = await decifra(k, remoto); } catch { throw new Error('Passphrase errata.'); }
      K = { k, salt: remoto.salt };
      try { await kvSet('key', K); } catch { }
      if (Object.keys(S.days).length && !confirm('Sul server ci sono già dei dati. OK = usa quelli del server (i dati di questo telefono vengono sostituiti). Annulla = tieni quelli di questo telefono e sovrascrivi il server.')) await spingiOra();
      else { S = { days: dati.days || {}, cfg: { ...S.cfg, ...dati.cfg }, updated: dati.updated }; await kvSet('state', S); stato('Dati ripristinati dal backup'); }
    }
    render();
  },
  async sync() { await tira(); },
  async esci() { await esci(); msg = ''; render(); },
  exp() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ v: 1, esportato: new Date().toISOString(), ...S })], { type: 'application/json' }));
    a.download = `muudays-${oggi()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  },
  imp() { $('#fi').click(); },
  edit() { editMest = !editMest; render(); },
  piu() { const v = $('#v'), h = v.scrollHeight, y = v.scrollTop; calDa += 12; render(); v.scrollTop = y + v.scrollHeight - h; }
};

/* ---------- eventi ---------- */
$('#v').addEventListener('click', async e => {
  const b = e.target.closest('[data-d],[data-m],[data-act],[data-sel],[data-s]'); if (!b) return;
  if (b.dataset.d) {
    if (!editMest) return apriGiorno(b.dataset.d);
    setFlow(b.dataset.d, S.days[b.dataset.d]?.flow > 0 ? 0 : 2);
    return commit();
  }
  if (b.dataset.sel) { sel = b.dataset.sel; return render(); }
  if (b.dataset.s) return apriGiorno(sel, [b.dataset.s]);
  if (b.dataset.m) { mese = new Date(mese.getFullYear(), mese.getMonth() + +b.dataset.m, 1); return render(); }
  b.disabled = true;
  try { await azioni[b.dataset.act](); }
  catch (err) { msg = err.message; if (b.dataset.act === 'sync') stato('Sincronizzazione non riuscita: ' + err.message); else render(); }
  b.disabled = false;
});
$('#v').addEventListener('change', async e => {
  if (e.target.dataset.cfg) { S.cfg[e.target.dataset.cfg] = Math.max(1, +e.target.value || 1); return commit(); }
  if (e.target.id === 'fi' && e.target.files[0]) {
    try {
      const j = JSON.parse(await e.target.files[0].text());
      if (!j.days || typeof j.days !== 'object') throw 0;
      if (!confirm('Sostituire i dati attuali con quelli del file?')) return;
      S = { days: j.days, cfg: { ...S.cfg, ...j.cfg } }; await commit();
    } catch { alert('File non valido: scegli un file esportato da Muudays.'); }
  }
});
$('#hl').onclick = () => { tab = tab === 'oggi' ? 'imp' : 'oggi'; editMest = false; render(); };
$('#hr').onclick = () => { tab = 'cal'; scrollCal = true; editMest = false; render(); };
let tx0 = null;
$('#v').addEventListener('touchstart', e => { tx0 = e.target.closest('#strip') ? e.touches[0].clientX : null; }, { passive: true });
$('#v').addEventListener('touchend', e => {
  if (tx0 == null) return;
  const dx = e.changedTouches[0].clientX - tx0; tx0 = null;
  if (Math.abs(dx) > 50) { sett = add(sett, dx < 0 ? 7 : -7); render(); }
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) tira().catch(() => { }); });

(async () => {
  S = await load(); sess = await kvGet('sess'); K = await kvGet('key');
  sel = oggi(); sett = mondayOf(sel);
  navigator.storage?.persist?.();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
  render();
  if (sess && K) tira().catch(e => stato('Sincronizzazione non riuscita: ' + e.message));
  else if (sess) leggiRemoto().then(render).catch(() => { });
})();
