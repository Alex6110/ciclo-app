'use strict';
const SB = 'https://fwcxhbcyrcujcccwnvee.supabase.co';
const PK = 'sb_publishable_2dX2Ahy1W-OLwocWYumtCw_KJoemZCn';
const $ = (s, e = document) => e.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const FLUSSO = ['Nessuno', 'Leggero', 'Medio', 'Abbondante'];
const SINT = ['Crampi', 'Mal di testa', 'Gonfiore', 'Stanchezza', 'Acne', 'Mal di schiena', 'Nausea', 'Voglie'];
const UMORI = ['Bene', 'Neutro', 'Triste', 'Irritabile', 'Ansiosa'];

let S, sess = null, K = null, remoto = null, sync = '', msg = '', spazio = null, snap = {}, codiceInvito = '', membriN = 0;
let auth = { step: 'email', email: '' }, tab = 'oggi', sel, sett, editMest = false, calDa = 18, scrollCal = '', calVista = 'mese', annoSel = new Date().getFullYear(), mIdx = 0, faseOggi = 'no', msgN = '', keyOk = null, guidaPasso = 0, installPrompt = null;
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
async function salvaChiave() { try { await kvSet('key', K); const v = await kvGet('key'); return !!(v && v.k); } catch { return false; } }
const kvDel = async k => { const d = await idb(); return new Promise((res, rej) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').delete(k); t.oncomplete = res; t.onerror = () => rej(t.error); }); };
const load = async () => { const s = (await kvGet('state')) || {}; return { days: s.days || {}, cfg: { cycle: 28, period: 5, ...s.cfg }, cfgU: s.cfgU || 0, updated: s.updated }; };

/* ---------- unione delle modifiche (due persone, due telefoni) ----------
   Ogni giorno ha l'istante dell'ultima modifica (u). Un giorno cancellato resta come {d:1,u} ("lapide"),
   così la cancellazione arriva anche all'altro telefono. Nell'unione vince, giorno per giorno, la modifica più recente. */
const vivo = e => !!e && (e.flow > 0 || (e.sym || []).length > 0 || !!e.mood || !!e.note);
const norm = e => vivo(e) ? JSON.stringify([e.flow || 0, e.sym || [], e.mood || '', e.note || '']) : null;
const costruisciSnap = () => { const o = {}; for (const d in S.days) o[d] = norm(S.days[d]); return o; };
function stampa() {
  const now = Date.now();
  for (const d of new Set([...Object.keys(S.days), ...Object.keys(snap)])) {
    const e = S.days[d], n = norm(e);
    if (n === (snap[d] ?? null)) continue;
    if (n === null) S.days[d] = { d: 1, u: now };
    else { const { d: _x, ...resto } = e; S.days[d] = { ...resto, u: now }; }
    snap[d] = n;
  }
}
function migra() { for (const e of Object.values(S.days)) if (!e.u) e.u = Date.now(); }
function unisci(loc, rem) {
  const out = { days: { ...loc.days }, cfg: { ...loc.cfg }, cfgU: loc.cfgU || 0 };
  for (const [d, e] of Object.entries(rem.days || {})) { const l = out.days[d]; if (!l || (e.u || 0) > (l.u || 0)) out.days[d] = e; }
  if ((rem.cfgU || 0) > out.cfgU) { out.cfg = { ...out.cfg, ...rem.cfg }; out.cfgU = rem.cfgU; }   // le impostazioni delle notifiche restano di ciascun telefono
  return out;
}
const canon = e => vivo(e) ? [e.flow || 0, e.sym || [], e.mood || '', e.note || '', e.u || 0] : [e.u || 0];
const ser = x => JSON.stringify([Object.keys(x.days).sort().map(d => [d, canon(x.days[d])]), +x.cfg?.cycle, +x.cfg?.period, x.cfgU || 0]);
const pubblico = () => ({ v: 2, days: S.days, cfg: { cycle: S.cfg.cycle, period: S.cfg.period }, cfgU: S.cfgU || 0 });
async function commit() { stampa(); S.updated = new Date().toISOString(); await kvSet('state', S); render(); sincronizzaSoon(); pianificaSoon(); }

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
  const sdEff = r.length >= 3 ? Math.max(sd, 1.5) : 3;   // con pochi cicli registrati l'incertezza resta alta
  const pl = p.slice(-7, -1).map(x => diff(x.end, x.start) + 1);
  const period = pl.length ? pl.reduce((a, b) => a + b) / pl.length : +S.cfg.period;
  // cicli già conclusi: l'ovulazione si ricostruisce a ritroso dalla mestruazione successiva (- 14 giorni)
  const pass = [];
  for (let i = 1; i < p.length; i++) {
    const n = diff(p[i].start, p[i - 1].start);
    if (n >= 15 && n <= 60) { const w = finestra(add(p[i].start, -14), 0, 0); pass.push({ da: w.da, a: w.a }); }
  }
  return { p, L, cycle, sd, sdEff, period, pass };
}

// Probabilità di concepimento per un rapporto in ciascun giorno rispetto all'ovulazione
// (valori medi di Wilcox 1995 e Dunson 2002). L'ovulazione non è nota con certezza: la stimiamo
// come "prossima mestruazione - 14 giorni" con un'incertezza che cresce con la variabilità dei
// cicli e con la distanza nel tempo, e sommiamo le due cose. Il picco è il massimo della curva.
const FR = { '-5': .10, '-4': .16, '-3': .14, '-2': .27, '-1': .31, '0': .33, '1': .08 };
function finestra(o, k, sdc) {
  const sg = Math.sqrt(k * sdc * sdc + 2.25), J = Math.ceil(2.5 * sg), P = {};
  let tot = 0; const w = [];
  for (let j = -J; j <= J; j++) { const x = Math.exp(-j * j / (2 * sg * sg)); w.push([j, x]); tot += x; }
  for (const [j, x] of w) for (let r = -5; r <= 1; r++) { const d = add(o, j + r); P[d] = (P[d] || 0) + x / tot * FR[r]; }
  let pk = o, mx = -1;
  for (const d in P) if (P[d] > mx + 1e-9 || (Math.abs(P[d] - mx) < 1e-9 && Math.abs(diff(d, o)) < Math.abs(diff(pk, o)))) { mx = P[d]; pk = d; }
  const days = Object.keys(P).filter(d => P[d] >= .4 * mx && Math.abs(diff(d, pk)) <= 7).sort();
  return { P, pk, mx, da: days[0], a: days[days.length - 1] };
}
function predici(st) {
  if (!st.p.length) return null;
  const last = st.p[st.p.length - 1], cyc = Math.round(st.cycle), pl = Math.round(st.period), list = [];
  const limite = `${new Date().getFullYear() + 1}-12-31`;
  for (let k = 1; k <= 40; k++) {
    const s = add(last.start, cyc * k); if (k > 1 && s > limite) break;
    const o = add(s, -14); list.push({ s, e: add(s, pl - 1), o, w: finestra(o, k, st.sdEff) });
  }
  return { last, cyc, pl, list, next: list[0], pass: st.pass };
}

/* ---------- viste ---------- */
const mondayOf = s => add(s, -((parse(s).getDay() + 6) % 7));
const ICS = 'fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
const IC = {
  gear: `<svg width="24" height="24" viewBox="0 0 24 24" ${ICS} stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>`,
  cal: `<svg width="26" height="26" viewBox="0 0 24 24" ${ICS} stroke-width="1.8"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/></svg>`,
  back: `<svg width="26" height="26" viewBox="0 0 24 24" ${ICS} stroke-width="2"><path d="M15 5l-7 7 7 7"/></svg>`,
  x: `<svg width="26" height="26" viewBox="0 0 24 24" ${ICS} stroke-width="2"><path d="M5 5l14 14M19 5L5 19"/></svg>`,
  trash: `<svg width="20" height="20" viewBox="0 0 24 24" ${ICS} stroke-width="1.9"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>`,
  drop: '<svg viewBox="0 0 24 24"><path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  mood: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 14c1 1.5 2.5 2 4 2s3-.5 4-2M9 9.5v.5M15 9.5v.5"/></svg>',
  note: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>'
};

function classi(d, pr) {
  const e = S.days[d], c = [], t = oggi();
  if (e && e.flow > 0) c.push('p');
  else if (pr) {
    for (const x of pr.pass) if (d >= x.da && d <= x.a) c.push('f');   // passato: solo numeri colorati, senza cerchio
    if (d > pr.last.end) {
      if (d >= t && d <= add(pr.last.start, pr.pl - 1)) c.push('pp');
      for (const x of pr.list) {
        if (d >= x.s && d <= x.e) c.push('pp');
        if (d === x.w.pk) c.push('o'); else if (d >= x.w.da && d <= x.w.a) c.push('f');   // previsione: cerchio tratteggiato solo sul giorno più fertile
      }
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
  const next = add(start, pr.cyc), k = Math.max(1, Math.round(diff(next, pr.last.start) / pr.cyc));
  return { start, end, cd: diff(sel, start) + 1, next, w: finestra(add(next, -14), k, st.sdEff) };
}
const nivello = (d, w, inP) => inP ? 'bassa' : d === w.pk ? 'massima' : (w.P[d] || 0) >= .6 * w.mx ? 'alta' : (w.P[d] || 0) >= .3 * w.mx ? 'media' : 'bassa';
const PROB = { bassa: 'Basse probabilità di rimanere incinta', media: 'Medie probabilità di rimanere incinta', alta: 'Alte probabilità di rimanere incinta', massima: 'Probabilità massima di rimanere incinta' };
const MSG = {
  no: ['Segna l\'ultima mestruazione e imparo a conoscerti.', 'Più cicli registri, più le previsioni migliorano.'],
  me: ['Oggi vai piano: te lo meriti.', 'Una borsa calda e un tè fanno miracoli.', 'Ascolta il tuo corpo, oggi viene prima di tutto.'],
  fo: ['L\'energia sta tornando: buon momento per iniziare qualcosa.', 'Una passeggiata oggi ti farà bene.', 'Giorni leggeri, approfittane!'],
  ov: ['Giorni pieni di energia!', 'Siamo nella finestra fertile.', 'Bevi tanta acqua oggi.'],
  lu: ['Se sei più stanca del solito è normale.', 'Dormire un po\' di più aiuta.', 'Concediti qualcosa di buono stasera.']
};

function ripulisci(d) {
  const e = S.days[d];
  if (e && !e.d && !vivo(e)) delete S.days[d];
}
// Segna (v = 1-3) o toglie (v = 0) la mestruazione.
// Segnare il primo giorno di un nuovo periodo segna anche i successivi (durata media, ma non oltre oggi).
// Togliere il primo giorno di un periodo toglie tutto il periodo; togliere un altro giorno solo quel giorno.
function setFlow(d, v) {
  if (!v) {
    const p = periodi().find(x => d >= x.start && d <= x.end), tutto = p && p.start === d;
    for (let x = d, fine = tutto ? p.end : d; x <= fine; x = add(x, 1)) if (S.days[x]) { S.days[x] = { ...S.days[x], flow: 0 }; ripulisci(x); }
    return;
  }
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
  for (const x of pr.list) ev.push({ k: 'ov', da: x.w.da, a: x.w.a, picco: x.w.pk }, { k: 'me', da: x.s, a: x.s });
  return ev.filter(e => e.a >= t).sort((a, b) => a.da < b.da ? -1 : 1).slice(0, 3);
}
function cardsOggi(st, pr, t) {
  const tra = n => n === 0 ? 'oggi' : n === 1 ? 'domani' : `tra ${n} giorni`;
  const righe = eventi(pr, t).map(e => e.k === 'me'
    ? `<div class="kv"><span>Mestruazione<br><small class="mut">${tra(diff(e.da, t))}</small></span><b>${dm(e.da)}</b></div>`
    : `<div class="kv"><span>Ovulazione<br><small class="mut">${e.da <= t ? 'in corso' : tra(diff(e.da, t))}</small>${e.picco >= t ? `<br><small class="mut">Probabilità massima: ${dm(e.picco)}</small>` : ''}</span><b>${dm(e.da)} – ${dm(e.a)}</b></div>`).join('');
  const reg = st.sd <= 2 ? 'molto regolare' : st.sd <= 4 ? 'abbastanza regolare' : 'variabile';
  return `<div class="box"><b>In arrivo</b>${righe}</div>
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
  const info = pr && infoGiorno(sel, st, pr), g = n => `${n} ${n === 1 ? 'giorno' : 'giorni'}`;
  let fase = 'no', a = '', b = '', prob = '', extra = '';
  if (info) {
    const { cd, next, start, end, w } = info, inP = sel >= start && sel <= end;
    fase = inP ? 'me' : sel < w.da ? 'fo' : sel <= w.a ? 'ov' : 'lu';
    if (inP) { a = 'Mestruazione'; b = `giorno ${cd}`; }
    else if (sel <= w.pk) { const n = diff(w.pk, sel); a = n ? 'Ovulazione tra' : 'Ovulazione'; b = n ? g(n) : (sel === t ? 'oggi' : 'in questo giorno'); }
    else { const n = diff(next, sel); a = n > 0 ? 'Mestruazione tra' : n === 0 ? 'Mestruazione' : 'Mestruazione in ritardo di'; b = n > 0 ? g(n) : n === 0 ? 'attesa' : g(-n); }
    prob = PROB[nivello(sel, w, inP)];
    const r = Math.round(st.sd);
    if (st.sd >= 1.5 && a.startsWith('Mestruazione tra')) extra = `Probabile tra il ${dm(add(next, -r))} e il ${dm(add(next, r))}`;
  }
  const sc = scena(sel), m = mIdx ? MSG[fase][(mIdx - 1) % MSG[fase].length] : 'Toccami ›';
  faseOggi = fase;
  const hero = info
    ? `<div class="hero"><p class="lead">${a}</p><p class="bigv">${b}</p>
        <p class="prob">${prob}<button class="info" data-act="info" aria-label="Come viene calcolata">i</button></p>${extra ? `<p class="mut">${extra}</p>` : ''}</div>`
    : `<div class="box"><p><b>Si parte dal passato.</b></p><p class="mut">Tocca «Mestruazioni» per registrare l'ultima, oppure apri il calendario in alto a destra e segna quelle passate. Con tre o quattro cicli le previsioni diventano affidabili.</p></div>`;
  const e = S.days[sel] || {};
  const act = (s, ic, lab, on, main) => `<button class="act${main ? ' main' : ''}${on ? ' on' : ''}" data-s="${s}"><b>${IC[ic]}</b>${lab}</button>`;
  return `${strip}<div class="scene s${sc.bg}" data-act="mascot">${sc.svg}<div class="bubble">${esc(m)}</div></div>${hero}
    <div class="acts">${act('flusso', 'drop', 'Mestruazioni', e.flow > 0, true)}${act('sintomi', 'plus', 'Sintomi', e.sym?.length)}${act('umore', 'mood', 'Umore', e.mood)}${act('note', 'note', 'Note', e.note)}</div>
    ${sel !== t ? `<button class="link cen" data-sel="${t}">Torna a oggi</button>` : ''}${pr ? cardsOggi(st, pr, t) : ''}`;
}

const idMese = (y, m) => `m${y}-${m}`;
function viewCal() {
  const st = stats(), pr = predici(st), t = oggi(), now = new Date();
  const cella = (d, i, attr) => `<button class="${['d', ...classi(d, pr), ...(d === t ? ['t'] : [])].join(' ')}" ${attr}>${i}</button>`;
  if (calVista === 'anno') {
    let h = `<div class="ynav"><button data-y="-1" aria-label="Anno precedente">‹</button><b>${annoSel}</b><button data-y="1" aria-label="Anno successivo">›</button></div><div class="yg">`;
    for (let m = 0; m < 12; m++) {
      const m0 = new Date(annoSel, m, 1), n = new Date(annoSel, m + 1, 0).getDate();
      let c = '<span class="d x"></span>'.repeat((m0.getDay() + 6) % 7);
      for (let i = 1; i <= n; i++) c += cella(iso(new Date(annoSel, m, i)), i, `data-ym="${annoSel}-${m}"`);
      h += `<div class="ym"><h4>${m0.toLocaleDateString('it-IT', { month: 'long' })}</h4><div class="grid">${c}</div></div>`;
    }
    return h + '</div>';
  }
  let h = `<div class="calhead"><div class="grid">${['L', 'M', 'M', 'G', 'V', 'S', 'D'].map(x => `<span class="dw">${x}</span>`).join('')}</div>${editMest ? '<p class="leg2">Tocca i giorni per aggiungere o togliere la mestruazione</p>' : ''}</div>
    <button class="link cen" data-act="piu">Mostra mesi precedenti</button>`;
  const avanti = (now.getFullYear() + 1) * 12 + 11 - (now.getFullYear() * 12 + now.getMonth());
  for (let k = -calDa; k <= avanti; k++) {
    const m0 = new Date(now.getFullYear(), now.getMonth() + k, 1), n = new Date(m0.getFullYear(), m0.getMonth() + 1, 0).getDate();
    const nome = m0.toLocaleDateString('it-IT', { month: 'long' }) + (m0.getFullYear() !== now.getFullYear() ? ' ' + m0.getFullYear() : '');
    let cells = '<span class="d x"></span>'.repeat((m0.getDay() + 6) % 7);
    for (let i = 1; i <= n; i++) { const d = iso(new Date(m0.getFullYear(), m0.getMonth(), i)); cells += cella(d, i, `data-d="${d}"`); }
    h += `<h3 class="mh" id="${idMese(m0.getFullYear(), m0.getMonth())}">${nome}</h3><div class="grid mg">${cells}</div>`;
  }
  return h + `<div style="height:96px"></div><button class="fab" data-act="edit">${editMest ? 'Fine' : 'Modifica mestruazioni'}</button>`;
}

function boxAccount() {
  const er = `<p class="mut" id="er">${esc(msg)}</p>`;
  if (!sess) return auth.step === 'code'
    ? `<div class="box"><b>Account</b><p class="mut">Abbiamo inviato un codice a ${esc(auth.email)}. Inseriscilo qui sotto.</p><input id="cd" class="tx" inputmode="numeric" autocomplete="one-time-code" placeholder="Codice"><button class="btn" data-act="verifica">Accedi</button><button class="link" data-act="cambia">Usa un'altra email</button>${er}</div>`
    : `<div class="box"><b>Account e backup</b><p class="mut">Accedi con la tua email per salvare i dati cifrati e ritrovarli se cambi telefono.</p><input id="em" class="tx" type="email" autocomplete="email" placeholder="Email" value="${esc(auth.email)}"><button class="btn" data-act="invia">Invia codice</button>${er}</div>`;
  if (!spazio) return `<div class="box"><b>Spazio condiviso</b><p class="mut">Se inizi tu, crea lo spazio e scegli la passphrase che userete in due. Se l'altra persona l'ha già creato, inserisci il suo codice di invito.</p>
    <input id="p1" class="tx" type="password" autocomplete="new-password" placeholder="Passphrase condivisa"><input id="p2" class="tx" type="password" autocomplete="new-password" placeholder="Ripeti la passphrase"><button class="btn" data-act="creaSpazio">Crea lo spazio</button>
    <p class="mut" style="margin-top:20px">Oppure entra con un codice di invito</p><input id="ci" class="tx" autocapitalize="characters" autocomplete="off" placeholder="Codice di invito"><button class="btn alt" data-act="entra">Entra nello spazio</button>
    <button class="link" data-act="esci">Esci</button>${er}</div>`;
  if (!K) return `<div class="box"><b>Passphrase</b><p class="mut">Inserisci la passphrase condivisa per sbloccare lo spazio.</p><input id="p1" class="tx" type="password" autocomplete="current-password" placeholder="Passphrase"><button class="btn" data-act="sblocca">Sblocca</button><button class="link" data-act="lascia">Lascia lo spazio</button><button class="link" data-act="esci">Esci</button>${er}</div>`;
  return `<div class="box"><b>Spazio condiviso</b><p class="mut">${esc(sess.email || '')} – ${membriN} ${membriN === 1 ? 'persona' : 'persone'}</p><p class="mut" id="sy">${esc(sync)}</p>
    ${codiceInvito ? `<div class="codice">${esc(codiceInvito)}</div><p class="mut">Valido 7 giorni, utilizzabile una volta. Mandalo a chi vuoi far entrare; la passphrase dagliela a voce, non per messaggio.</p><button class="btn" data-act="condividi">Condividi il codice</button>` : ''}
    <div class="row"><button class="btn alt" data-act="sync">Sincronizza</button><button class="btn alt" data-act="invita">Invita</button></div>
    <div class="row"><button class="btn alt" data-act="esci">Esci</button></div>
    <button class="link" data-act="lascia">Lascia lo spazio</button>${membriN > 1 ? '<button class="link" data-act="scollega">Rimuovi l\'altra persona</button>' : ''}${er}</div>`;
}

function viewImp() {
  return `<h2>Impostazioni</h2>${boxAccount()}${boxNotifiche()}
    <div class="box"><b>Valori di partenza</b><p class="mut">Usati finché non ci sono almeno due cicli registrati.</p>
    <label class="f">Durata del ciclo (giorni)<input type="number" min="15" max="60" value="${S.cfg.cycle}" data-cfg="cycle"></label>
    <label class="f">Durata mestruazione (giorni)<input type="number" min="1" max="12" value="${S.cfg.period}" data-cfg="period"></label></div>
    <div class="box"><b>Copia dei dati</b><p class="mut">Esporta un file di riserva o ripristina da uno già esportato.</p>
    <div class="row"><button class="btn alt" data-act="exp">Esporta</button><button class="btn alt" data-act="imp">Importa</button></div>
    <input type="file" id="fi" accept="application/json" hidden>
    <button class="link" data-act="guida">Rivedi la guida</button>
    <button class="link danger" data-act="cancellaLocale">Cancella i dati di questo telefono</button>
    <p class="mut">Se fai parte di uno spazio condiviso, i dati restano lì e si riscaricano alla prossima sincronizzazione. Per cancellare tutto, lascia prima lo spazio.</p></div>
    <p class="mut">Le previsioni sono stime basate sui cicli registrati: non sono uno strumento contraccettivo né diagnostico.</p>`;
}

const desk = () => matchMedia('(min-width: 1000px)').matches;
function viewCalDesk() {
  const st = stats(), pr = predici(st), t = oggi(), now = new Date();
  const cella = (d, i, attr, extra = '') => `<button class="${['d', ...classi(d, pr), ...(d === t ? ['t'] : []), ...(d === sel && extra !== 'y' ? ['sel'] : [])].join(' ')}" ${attr}>${i}</button>`;
  const seg = `<div class="seg"><button data-v="mese" class="${calVista === 'mese' ? 'on' : ''}">Mese</button><button data-v="anno" class="${calVista === 'anno' ? 'on' : ''}">Anno</button></div>`;
  if (calVista === 'anno') {
    let h = `<div class="dc-top"><h2>${annoSel}</h2><div class="dc-ctl"><button class="rnd" data-y="-1" aria-label="Anno precedente">‹</button><button class="rnd" data-y="1" aria-label="Anno successivo">›</button>${seg}</div></div><div class="yg yg3">`;
    for (let m = 0; m < 12; m++) {
      const m0 = new Date(annoSel, m, 1), n = new Date(annoSel, m + 1, 0).getDate();
      let c = '<span class="d x"></span>'.repeat((m0.getDay() + 6) % 7);
      for (let i = 1; i <= n; i++) c += cella(iso(new Date(annoSel, m, i)), i, `data-ym="${annoSel}-${m}"`, 'y');
      h += `<div class="ym"><h4>${m0.toLocaleDateString('it-IT', { month: 'long' })}</h4><div class="grid">${c}</div></div>`;
    }
    return h + '</div>';
  }
  const y = mese.getFullYear(), m = mese.getMonth(), n = new Date(y, m + 1, 0).getDate();
  let cells = '<span class="d x"></span>'.repeat((new Date(y, m, 1).getDay() + 6) % 7);
  for (let i = 1; i <= n; i++) { const d = iso(new Date(y, m, i)); cells += cella(d, i, `data-d="${d}"`); }
  return `<div class="dc-top"><h2>${mese.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</h2><div class="dc-ctl"><button class="rnd" data-m="-1" aria-label="Mese precedente">‹</button><button class="txt" data-mo="oggi">Oggi</button><button class="rnd" data-m="1" aria-label="Mese successivo">›</button>${seg}</div></div>
    <div class="grid dcg">${['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(x => `<span class="dw">${x}</span>`).join('')}${cells}</div>
    <div class="dc-foot"><button class="btn inl${editMest ? '' : ' alt'}" data-act="edit">${editMest ? 'Fine modifica' : 'Modifica mestruazioni'}</button>
    <div class="leg"><span><i class="lg p"></i>Mestruazione</span><span><i class="lg pp"></i>Prevista</span><span><i class="lg f"></i>Ovulazione</span><span><i class="lg o"></i>Più fertile</span></div></div>
    <p class="mut">${editMest ? 'Clicca i giorni per aggiungere o togliere la mestruazione.' : 'Clicca un giorno per vederlo a sinistra; doppio clic per modificarlo.'}</p>`;
}
function viewDesk() {
  const nav = `<aside class="dk-nav"><div class="dk-brand"><img src="icon-192.png" alt="" width="40" height="40"><span>Muudays</span></div>
    <button data-t="oggi" class="${tab !== 'imp' ? 'on' : ''}">${IC.cal}<span>Il mio ciclo</span></button>
    <button data-t="imp" class="${tab === 'imp' ? 'on' : ''}">${IC.gear}<span>Impostazioni</span></button>
    <div class="dk-foot">${sess ? `<b>${esc(sess.email || '')}</b><span>${esc(sync)}</span>` : '<span>Accesso non effettuato</span>'}</div></aside>`;
  if (tab === 'imp') return `<div class="dk">${nav}<section class="dk-imp">${viewImp()}</section></div>`;
  return `<div class="dk">${nav}<section class="dk-oggi">${viewOggi()}</section><section class="dk-cal">${viewCalDesk()}</section></div>`;
}
function render() {
  const v = $('#v'), hl = $('#hl'), hr = $('#hr'), hc = $('#hc');
  if (desk()) {
    if (tab === 'cal') tab = 'oggi';
    v.className = 'dkv'; v.innerHTML = viewDesk();
    const sc = $('.scene'); if (sc) scenaInit(sc);
    return;
  }
  v.classList.remove('dkv');
  v.innerHTML = { oggi: viewOggi, cal: viewCal, imp: viewImp }[tab]();
  v.classList.toggle('cal', tab === 'cal');
  hr.style.visibility = tab === 'imp' ? 'hidden' : 'visible';
  if (tab === 'oggi') {
    hl.innerHTML = IC.gear; hl.setAttribute('aria-label', 'Impostazioni');
    hc.innerHTML = '<h1>Muudays</h1>';
    hr.innerHTML = `<span>${parse(sel).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }).replace('.', '')}</span>${IC.cal}`; hr.setAttribute('aria-label', 'Calendario');
  } else if (tab === 'cal') {
    hl.innerHTML = IC.x; hl.setAttribute('aria-label', 'Chiudi');
    hc.innerHTML = `<div class="seg"><button data-v="mese" class="${calVista === 'mese' ? 'on' : ''}">Mese</button><button data-v="anno" class="${calVista === 'anno' ? 'on' : ''}">Anno</button></div>`;
    hr.innerHTML = IC.gear; hr.setAttribute('aria-label', 'Impostazioni');
  } else {
    hl.innerHTML = IC.back; hl.setAttribute('aria-label', 'Indietro');
    hc.innerHTML = '<h1>Muudays</h1>'; hr.innerHTML = '';
  }
  if (tab === 'oggi') { const sc = $('.scene'); if (sc) scenaInit(sc); }
  if (tab === 'cal' && scrollCal) {
    const c = $('#' + scrollCal), hd = $('.calhead'); scrollCal = '';
    if (c) v.scrollTop = c.offsetTop - (hd ? hd.offsetHeight : 0) - 8;
  }
}
const apriInfo = (titolo, testo) => {
  const dl = $('#dlg');
  dl.innerHTML = `<h2>${titolo}</h2><p class="mut">${testo}</p><button class="btn" id="ok">Ho capito</button>`;
  dl.onclick = e => { if (e.target === dl || e.target.id === 'ok') dl.close(); };
  dl.onclose = null; dl.showModal();
};

/* ---------- inserimento giorno (salvataggio immediato) ---------- */
function apriGiorno(d, sez = ['flusso', 'sintomi', 'umore', 'note']) {
  const dl = $('#dlg'), get = () => S.days[d] || {};
  const salva = async patch => {
    const e = { ...get(), ...patch };
    if (!e.flow && !(e.sym || []).length && !e.mood && !e.note) delete S.days[d]; else S.days[d] = e;
    await commit();
  };
  const chips = (k, arr, on, val = x => x) => `<div class="chips" data-k="${k}">${arr.map(x => `<button class="chip${on(x) ? ' on' : ''}" data-v="${esc(val(x))}">${x}</button>`).join('')}</div>`;
  const ciclo = () => get().flow > 0 && periodi().find(x => d >= x.start && d <= x.end);
  const riga = () => `${sez.includes('flusso') && ciclo() ? `<button class="btn danger" id="delc">${IC.trash}Elimina ciclo</button>` : ''}<button class="btn" id="ok">Fatto</button>`;
  const parti = {
    flusso: () => `<h3>Mestruazione</h3>${chips('flow', FLUSSO.slice(1), x => get().flow === FLUSSO.indexOf(x), x => FLUSSO.indexOf(x))}`,
    sintomi: () => `<h3>Sintomi</h3>${chips('sym', SINT, x => (get().sym || []).includes(x))}`,
    umore: () => `<h3>Umore</h3>${chips('mood', UMORI, x => get().mood === x)}`,
    note: () => `<h3>Note</h3><textarea id="nt" rows="3">${esc(get().note || '')}</textarea>`
  };
  dl.innerHTML = `<h2>${parse(d).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>${sez.map(k => parti[k]()).join('')}<div class="row" id="brow">${riga()}</div>`;
  dl.onclick = async e => {
    if (e.target === dl) return dl.close();
    const b = e.target.closest('.chip,#ok,#delc'); if (!b) return;
    if (b.id === 'ok') return dl.close();
    if (b.id === 'delc') {
      const p = ciclo();
      if (p && confirm(`Eliminare il ciclo dal ${dm(p.start)} al ${dm(p.end)}? Sintomi, umore e note restano.`)) {
        for (let x = p.start; x <= p.end; x = add(x, 1)) if (S.days[x]) { S.days[x] = { ...S.days[x], flow: 0 }; ripulisci(x); }
        await commit(); dl.close();
      }
      return;
    }
    const k = b.parentElement.dataset.k, v = b.dataset.v, was = b.classList.contains('on');
    if (k === 'sym') b.classList.toggle('on');
    else { [...b.parentElement.children].forEach(c => c.classList.remove('on')); if (!was) b.classList.add('on'); }
    if (k === 'flow') { setFlow(d, was ? 0 : +v); await commit(); $('#brow').innerHTML = riga(); }
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
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, K.k, enc.encode(JSON.stringify(pubblico())));
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
async function leggiSpazio() {
  const r = await api(`/rest/v1/membri?select=spazio_id,spazi(salt)&user_id=eq.${sess.id}`, {}, await token());
  spazio = r && r[0] ? { id: r[0].spazio_id, salt: r[0].spazi.salt } : null;
  await (spazio ? kvSet('spazio', spazio) : kvDel('spazio'));
}
async function leggiRemoto() {
  if (!spazio) { remoto = null; return; }
  const r = await api(`/rest/v1/ciclo_dati?select=iv,data,updated_at&spazio_id=eq.${spazio.id}`, {}, await token());
  remoto = r && r[0] || null;
}
async function leggiMembri() { try { const r = await api(`/rest/v1/membri?select=user_id&spazio_id=eq.${spazio.id}`, {}, await token()); membriN = r ? r.length : 0; } catch { } }
const stato = m => { sync = m; const e = $('#sy'); if (e) e.textContent = m; };
const ora = () => new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
let tm;
const sincronizzaSoon = () => { if (sess && K && spazio) { clearTimeout(tm); tm = setTimeout(() => sincronizza().catch(() => { }), 1500); } };
// Scrive solo se nessun altro ha scritto nel frattempo (confronto sull'istante dell'ultima scrittura); altrimenti riprova unendo.
async function spingiOra(ver) {
  const c = await cifra(), nuovo = new Date().toISOString(), tok = await token();
  if (!ver) {
    try { await api('/rest/v1/ciclo_dati', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ spazio_id: spazio.id, iv: c.iv, data: c.data, updated_at: nuovo }) }, tok); return true; }
    catch (e) { if (e.status === 409) return false; throw e; }
  }
  const r = await api(`/rest/v1/ciclo_dati?spazio_id=eq.${spazio.id}&updated_at=eq.${encodeURIComponent(ver)}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ iv: c.iv, data: c.data, updated_at: nuovo }) }, tok);
  return Array.isArray(r) && r.length > 0;
}
// una sola sincronizzazione alla volta su questo telefono (apertura, timer, modifica): evita che si scavalchino
let codaSinc = Promise.resolve();
const sincronizza = () => (codaSinc = codaSinc.catch(() => { }).then(sincronizzaOra));
async function sincronizzaOra() {
  if (!sess || !K || !spazio) return;
  stato('Sincronizzazione…');
  try {
    for (let i = 0; i < 4; i++) {
      await leggiRemoto();
      const ver = remoto ? remoto.updated_at : null, rem = remoto ? await decifra(K.k, remoto) : null;
      if (rem) {
        const m = unisci(S, rem);
        if (ser(m) !== ser(S)) { S.days = m.days; S.cfg = { ...S.cfg, ...m.cfg }; S.cfgU = m.cfgU; await kvSet('state', S); snap = costruisciSnap(); render(); pianificaSoon(); }
        if (ser(S) === ser(rem)) { stato('Sincronizzato alle ' + ora()); return; }
      }
      if (await spingiOra(ver)) { stato('Sincronizzato alle ' + ora()); return; }
    }
    stato('Sincronizzazione non completata, riprova tra poco');
  } catch (e) { stato('Sincronizzazione non riuscita: ' + (e.name === 'OperationError' ? 'la passphrase non corrisponde a quella dello spazio' : e.message)); throw e; }
}
async function esci(pulisci) {
  if (pulisci && nf().on) { try { await notifOff(true); } catch { } }
  sess = null; K = null; remoto = null; spazio = null; codiceInvito = ''; membriN = 0; auth = { step: 'email', email: '' };
  await kvDel('sess'); await kvDel('key'); await kvDel('spazio');
}

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
    await leggiSpazio(); await leggiRemoto(); if (spazio) await leggiMembri(); render();
  },
  async creaSpazio() {
    const pass = $('#p1').value; msg = '';
    if (pass.length < 8) throw new Error('La passphrase deve avere almeno 8 caratteri.');
    if (pass !== $('#p2').value) throw new Error('Le due passphrase non coincidono.');
    const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
    const id = await api('/rest/v1/rpc/crea_spazio', { method: 'POST', body: JSON.stringify({ p_salt: salt }) }, await token());
    spazio = { id, salt }; await kvSet('spazio', spazio);
    K = { k: await chiave(pass, ub64(salt)), salt }; keyOk = await salvaChiave();
    remoto = null; snap = {}; await commit();
    await sincronizza(); await leggiMembri(); render();
  },
  async entra() {
    const code = $('#ci').value.trim(); if (!code) return; msg = '';
    await api('/rest/v1/rpc/unisciti', { method: 'POST', body: JSON.stringify({ p_codice: code }) }, await token());
    await leggiSpazio(); await leggiRemoto(); await leggiMembri(); render();
  },
  async sblocca() {
    const pass = $('#p1').value; msg = '';
    if (!remoto) await leggiRemoto();
    if (!remoto) throw new Error('Lo spazio non contiene ancora dati: chi lo ha creato deve prima sincronizzare.');
    const k = await chiave(pass, ub64(spazio.salt)); let dati;
    try { dati = await decifra(k, remoto); } catch { throw new Error('Passphrase errata.'); }
    K = { k, salt: spazio.salt }; keyOk = await salvaChiave();
    if (Object.values(S.days).some(vivo) && !confirm('Questo telefono ha già dei dati. OK = uniscili a quelli dello spazio condiviso. Annulla = usa solo quelli dello spazio.')) { S.days = {}; S.cfgU = 0; }
    const m = unisci(S, dati); S.days = m.days; S.cfg = { ...S.cfg, ...m.cfg }; S.cfgU = m.cfgU;
    snap = costruisciSnap(); await kvSet('state', S);
    await sincronizza(); render();
  },
  async sync() { await sincronizza(); await leggiMembri(); render(); },
  async invita() { codiceInvito = await api('/rest/v1/rpc/crea_invito', { method: 'POST', body: '{}' }, await token()); msg = ''; render(); },
  async condividi() {
    const t = `Codice per entrare nello spazio Muudays: ${codiceInvito}`;
    if (navigator.share) { try { await navigator.share({ title: 'Muudays', text: t }); } catch { } }
    else { await navigator.clipboard.writeText(t); msg = 'Codice copiato.'; render(); }
  },
  async lascia() {
    if (!confirm('Lasciare lo spazio condiviso? Su questo telefono resta una copia dei dati, ma non verrà più sincronizzata.')) return;
    await api('/rest/v1/rpc/lascia_spazio', { method: 'POST', body: '{}' }, await token());
    spazio = null; K = null; remoto = null; codiceInvito = ''; membriN = 0; await kvDel('spazio'); await kvDel('key'); render();
  },
  async scollega() {
    if (!confirm('Rimuovere dallo spazio tutte le altre persone? Se conoscono la passphrase restano comunque in possesso dei dati che hanno già sul telefono.')) return;
    await api('/rest/v1/rpc/rimuovi_altri', { method: 'POST', body: '{}' }, await token());
    codiceInvito = ''; await leggiMembri(); render();
  },
  async esci() { await esci(true); msg = ''; render(); },
  exp() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ v: 1, esportato: new Date().toISOString(), ...S })], { type: 'application/json' }));
    a.download = `muudays-${oggi()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  },
  imp() { $('#fi').click(); },
  guida() { mostraGuida(0); },
  async cancellaLocale() {
    if (!confirm('Cancellare tutti i dati su questo telefono?')) return;
    await kvDel('state'); location.reload();
  },
  async notifOn() { msgN = ''; await notifOn(); msgN = 'Notifiche attivate.'; render(); },
  async notifOff() { await notifOff(); msgN = ''; render(); },
  async notifTest() { await notifTest(); msgN = 'Se vedi la notifica, tutto ok.'; $('#ne') && ($('#ne').textContent = msgN); },
  async notifProva() { await notifProva(); msgN = 'Prova programmata: arriva entro 15 minuti.'; render(); },
  mascot(e) {
    const z = scenaTocco(e); if (z === 'coccole') return;
    const gioco = { testa: ['Boop!', 'Hihi, che solletico!', 'Mi fai arrossire…', 'Ancora, ancora!'], coda: ['Ehi, il mio codino!', 'Splash!'], acqua: ['Bloop bloop!', 'Che belle bolle!'], festa: ['Sei la mia persona preferita!'] };
    const lista = z === 'corpo' ? MSG[faseOggi] : gioco[z];
    mIdx++; $('.bubble').textContent = lista[(mIdx - 1) % lista.length];
  },
  info() { apriInfo('Come viene calcolata', 'È una stima basata sulla durata dei tuoi cicli registrati e su dati medi di fertilità giorno per giorno. Più cicli registri e più è regolare il tuo ciclo, più diventa precisa. Non è un metodo contraccettivo né uno strumento diagnostico.'); },
  edit() { editMest = !editMest; render(); },
  piu() { const v = $('#v'), h = v.scrollHeight, y = v.scrollTop; calDa += 12; render(); v.scrollTop = y + v.scrollHeight - h; }
};

/* ---------- notifiche push ---------- */
// Il server conosce solo l'orario di invio: titolo e testo sono cifrati sul telefono con la chiave del backup
// e decifrati dal service worker quando la notifica arriva.
const NF0 = { on: false, mest: true, ovul: true, rit: true, pre: 2, ora: '09:00' };
const nf = () => ({ ...NF0, ...(S.cfg.notif || {}) });
const u8 = x => { const b = atob((x + '='.repeat((4 - x.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, c => c.charCodeAt(0)); };
function pushOk() {
  if ('serviceWorker' in navigator && 'Notification' in window && 'PushManager' in window) return 'ok';
  return navigator.standalone === false ? 'ios-home' : 'no';
}
function eventiNotifica() {
  const n = nf(); if (!n.on) return [];
  const pr = predici(stats()); if (!pr) return [];
  const [h, mi] = n.ora.split(':').map(Number), now = Date.now(), out = [];
  const fd = d => parse(d).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  const aggiungi = (d, t, b) => { const [y, m, g] = d.split('-').map(Number), dt = new Date(y, m - 1, g, h, mi, 0); if (dt.getTime() > now) out.push({ at: dt.toISOString(), t, b }); };
  pr.list.slice(0, 3).forEach((x, k) => {
    if (n.mest) {
      aggiungi(add(x.s, -n.pre), 'Ciclo in arrivo', `Tra ${n.pre} ${n.pre === 1 ? 'giorno' : 'giorni'}, ${fd(x.s)}, dovrebbe iniziare la mestruazione. Quando arriva, segna il primo giorno in Muudays: le previsioni diventano più precise.`);
      aggiungi(x.s, 'Mestruazione prevista oggi', 'Oggi dovrebbe iniziare il ciclo. Se è già arrivato, segnalo in Muudays; altrimenti ti avviso se tarda.');
    }
    if (n.ovul) {
      aggiungi(x.w.da, 'Inizia la finestra fertile', `Da oggi fino a ${fd(x.w.a)} le probabilità di concepimento sono più alte; il giorno più probabile è ${fd(x.w.pk)}. È una stima basata sui tuoi cicli.`);
      aggiungi(x.w.pk, 'Oggi è il giorno più fertile', 'Secondo le tue previsioni oggi la probabilità di rimanere incinta è la più alta di questo ciclo. È una stima, non un metodo contraccettivo.');
    }
    if (n.rit && k === 0) {
      aggiungi(add(x.s, 1), 'Ciclo in ritardo di 1 giorno', 'La mestruazione prevista per ieri non è ancora stata segnata. Se è già iniziata, aggiornala in Muudays.');
      aggiungi(add(x.s, 3), 'Ciclo in ritardo di 3 giorni', 'Sono passati 3 giorni dalla data prevista e non risulta ancora una mestruazione. Se è arrivata, segnala il primo giorno in Muudays.');
      aggiungi(add(x.s, 7), 'Ciclo in ritardo di una settimana', 'È passata una settimana dalla data prevista. Se il ritardo continua, può essere utile parlarne con il medico.');
    }
  });
  return out.sort((a, b) => a.at < b.at ? -1 : 1).slice(0, 24);
}
const cifraMsg = async (t, b) => { const iv = crypto.getRandomValues(new Uint8Array(12)); return { iv: b64(iv), data: b64(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, K.k, enc.encode(JSON.stringify({ t, b })))) }; };
let tn, coda = Promise.resolve();
const pianificaSoon = () => { if (nf().on && sess && K) { clearTimeout(tn); tn = setTimeout(() => pianifica().catch(() => { }), 3000); } };
const pianifica = () => (coda = coda.catch(() => { }).then(async () => {
  const tok = await token();
  await api(`/rest/v1/push_coda?user_id=eq.${sess.id}&inviata=eq.false&due_at=gt.${encodeURIComponent(new Date().toISOString())}`, { method: 'DELETE' }, tok);
  const righe = [];
  for (const e of eventiNotifica()) righe.push({ user_id: sess.id, due_at: e.at, ...await cifraMsg(e.t, e.b) });
  if (righe.length) await api('/rest/v1/push_coda', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(righe) }, tok);
}));
async function notifOn() {
  if (!CONFIG.VAPID_PUBLIC) throw new Error('Notifiche non ancora configurate: manca la chiave VAPID in config.js.');
  if (!sess || !K) throw new Error('Prima accedi con l\'email e sblocca il backup con la passphrase.');
  if (!(await salvaChiave())) throw new Error('Questo telefono non riesce a salvare la chiave di cifratura: le notifiche non potrebbero mostrare il testo. Esci, accedi di nuovo con la passphrase e riprova.');
  const st = pushOk();
  if (st === 'ios-home') throw new Error('Su iPhone aggiungi prima l\'app alla schermata Home e riaprila da lì.');
  if (st !== 'ok') throw new Error('Questo browser non supporta le notifiche push.');
  if (await Notification.requestPermission() !== 'granted') throw new Error('Permesso negato: attivalo da Impostazioni di iOS > Notifiche > Muudays.');
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: u8(CONFIG.VAPID_PUBLIC) });
  const j = sub.toJSON();
  await api('/rest/v1/push_sub', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ endpoint: j.endpoint, user_id: sess.id, p256dh: j.keys.p256dh, auth: j.keys.auth, updated_at: new Date().toISOString() }) }, await token());
  S.cfg.notif = { ...nf(), on: true };
  await commit(); await pianifica();
}
async function notifOff(remoto = true) {
  S.cfg.notif = { ...nf(), on: false };
  try {
    const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription();
    if (remoto && sess) {
      const tok = await token();
      await api(`/rest/v1/push_coda?user_id=eq.${sess.id}&inviata=eq.false`, { method: 'DELETE' }, tok);
      if (sub) await api(`/rest/v1/push_sub?endpoint=eq.${encodeURIComponent(sub.endpoint)}`, { method: 'DELETE' }, tok);
    }
    if (sub) await sub.unsubscribe();
  } catch { }
  await commit();
}
async function notifTest() {
  if (!('Notification' in window) || Notification.permission !== 'granted') throw new Error('Attiva prima le notifiche.');
  const reg = await navigator.serviceWorker.ready;
  await reg.showNotification('Muudays', { body: 'Prova riuscita: le notifiche funzionano.', icon: 'icon-192.png' });
}
async function notifProva() {
  if (!sess || !K) throw new Error('Serve l\'account sbloccato.');
  await api('/rest/v1/push_coda', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify([{ user_id: sess.id, due_at: new Date().toISOString(), ...await cifraMsg('Muudays', 'Prova dal server riuscita.') }]) }, await token());
}
function boxNotifiche() {
  const n = nf(), er = `<p class="mut" id="ne">${esc(msgN)}</p>`;
  if (!n.on) return `<div class="box"><b>Notifiche</b><p class="mut">Un avviso quando sta per arrivare il ciclo o inizia l'ovulazione. Serve l'account con il backup sbloccato${navigator.standalone === false ? ', e su iPhone l\'app deve essere aggiunta alla schermata Home' : ''}.</p><button class="btn" data-act="notifOn">Attiva notifiche</button>${er}</div>`;
  const sw = (k, lab) => `<label class="f">${lab}<input type="checkbox" data-nf="${k}" ${n[k] ? 'checked' : ''}></label>`;
  return `<div class="box"><b>Notifiche</b>
    ${sw('mest', 'Ciclo in arrivo e giorno previsto')}${sw('ovul', 'Finestra fertile e giorno più fertile')}${sw('rit', 'Ciclo in ritardo')}
    <label class="f">Giorni di preavviso per il ciclo<select data-nf="pre">${[1, 2, 3].map(x => `<option${x === n.pre ? ' selected' : ''}>${x}</option>`).join('')}</select></label>
    <label class="f">Orario<input type="time" data-nf="ora" value="${n.ora}"></label>
    <p class="mut">Chiave per il testo delle notifiche: ${keyOk === false ? 'non salvata (esci e riaccedi con la passphrase)' : 'salvata'}.</p>
    <div class="row"><button class="btn alt" data-act="notifTest">Prova qui</button><button class="btn alt" data-act="notifProva">Prova dal server</button></div>
    <button class="link" data-act="notifOff">Disattiva notifiche</button>${er}</div>`;
}

/* ---------- guida alla prima apertura ---------- */
const piattaforma = () => {
  const ua = navigator.userAgent, ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return { ios, android: /Android/.test(ua), installata: navigator.standalone === true || matchMedia('(display-mode: standalone)').matches };
};
const legenda = (c, t) => `<li><i class="gl ${c}">${c === 'f' ? '12' : ''}</i>${t}</li>`;
function passiGuida() {
  const p = piattaforma();
  const install = p.installata
    ? '<p>Muudays è già installata su questo dispositivo: la trovi nell\'icona sulla schermata Home, e da lì funzionano anche le notifiche.</p>'
    : p.ios ? '<ol><li>Apri questo sito con <b>Safari</b> (con altri browser su iPhone non si può installare).</li><li>Tocca <b>Condividi</b>, il quadrato con la freccia verso l\'alto.</li><li>Scorri e tocca <b>Aggiungi alla schermata Home</b>, poi <b>Aggiungi</b>.</li><li>Da ora apri Muudays dalla sua icona: solo così funzionano le notifiche.</li></ol>'
    : p.android ? `<ol><li>Tocca il menu <b>⋮</b> del browser.</li><li>Scegli <b>Installa app</b> (o «Aggiungi a schermata Home»).</li></ol>${installPrompt ? '<button class="btn" data-g="installa">Installa ora</button>' : ''}`
    : `<ol><li>In <b>Chrome</b> o <b>Edge</b>: clicca l'icona <b>Installa</b> nella barra dell'indirizzo, oppure menu ⋮ → «Installa Muudays».</li><li>In <b>Safari</b> su Mac: menu File → <b>Aggiungi al Dock</b>.</li></ol>${installPrompt ? '<button class="btn" data-g="installa">Installa ora</button>' : ''}`;
  return [
    { t: 'Benvenuta in Muudays', h: '<p>Il tuo ciclo, senza pubblicità. In due minuti ti mostro come funziona.</p>', mascotte: true },
    { t: 'Installa l\'app', h: install, ic: 'cal' },
    { t: 'Registra il ciclo', h: '<p>Tocca <b>Mestruazioni</b> il primo giorno: l\'app segna da sola i giorni successivi, per la durata media.</p><p>Per correggere apri il calendario e usa <b>Modifica mestruazioni</b>. Se un ciclo è sbagliato, apri uno dei suoi giorni e tocca <b>Elimina ciclo</b>.</p>', ic: 'drop' },
    { t: 'Sintomi, umore e note', h: '<p>Da <b>Sintomi</b>, <b>Umore</b> e <b>Note</b> registri come stai giorno per giorno. Ogni scelta si salva appena la tocchi.</p>', ic: 'mood' },
    { t: 'Calendario e previsioni', h: `<ul class="gl-l">${legenda('p', 'Mestruazione registrata')}${legenda('pp', 'Mestruazione prevista')}${legenda('f', 'Numeri verdi: finestra fertile (ovulazione)')}${legenda('o', 'Cerchio verde: giorno più probabile')}</ul><p>Con <b>Anno</b> vedi tutto l'anno: le previsioni arrivano fino alla fine dell'anno prossimo e migliorano con ogni ciclo che registri.</p>`, ic: 'cal' },
    { t: 'Muu, la mascotte', h: '<p>Cambia ogni giorno. Toccala sulla testa, sul corpo, sulla coda o nell\'acqua: reagisce in modo diverso. Tienila premuta per le coccole; gli occhi seguono il dito.</p>', mascotte: true },
    { t: 'Notifiche', h: '<p>Muudays ti avvisa quando sta per arrivare il ciclo, quando inizia la finestra fertile, nel giorno più fertile e se il ciclo è in ritardo.</p><p>Si attivano da <b>Impostazioni → Notifiche</b>. Servono l\'account e, su iPhone, l\'app installata dalla Home.</p>', ic: 'plus' },
    { t: 'Account e spazio condiviso', h: '<p>Accedi dalle Impostazioni con la tua email: ti arriva un codice. Poi scegli una <b>passphrase</b>: cifra i dati sul telefono e nemmeno il server può leggerli. <b>Annotala</b>: se la perdi i dati nel cloud non si recuperano.</p><p>Per condividere il ciclo con una persona di fiducia usa <b>Invita</b>: genera un codice da inviare; l\'altra persona lo inserisce e usa la stessa passphrase. Le modifiche di entrambi si uniscono.</p>', ic: 'note' },
    { t: 'Tutto pronto', h: '<p>Puoi rivedere questa guida quando vuoi da <b>Impostazioni → Guida</b>.</p>', mascotte: true }
  ];
}
function mostraGuida(da = 0) {
  guidaPasso = da; $('#gd')?.remove();
  const passi = passiGuida(), p = passi[guidaPasso], ultimo = guidaPasso === passi.length - 1;
  const ill = p.mascotte ? `<div class="scene s${scena(oggi(), guidaPasso % 7).bg}">${scena(oggi(), guidaPasso === 0 ? 0 : guidaPasso === 5 ? 1 : 3).svg}</div>` : `<div class="gd-ic">${IC[p.ic]}</div>`;
  document.body.insertAdjacentHTML('beforeend', `<div class="gd" id="gd"><div class="gd-in">${ill}<h2>${p.t}</h2><div class="gd-body">${p.h}</div>
    <div class="gd-dots">${passi.map((_, i) => `<i class="${i === guidaPasso ? 'on' : ''}"></i>`).join('')}</div>
    <div class="gd-btns">${guidaPasso ? '<button class="btn alt" data-g="ind">Indietro</button>' : '<button class="btn alt" data-g="salta">Salta</button>'}<button class="btn" data-g="${ultimo ? 'fine' : 'avanti'}">${ultimo ? 'Inizia' : 'Avanti'}</button></div></div></div>`);
}
async function chiudiGuida() { $('#gd')?.remove(); await kvSet('guida', Date.now()); }
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-g]'); if (!b || !$('#gd')) return;
  const g = b.dataset.g;
  if (g === 'avanti') mostraGuida(guidaPasso + 1);
  else if (g === 'ind') mostraGuida(Math.max(0, guidaPasso - 1));
  else if (g === 'installa') { try { installPrompt.prompt(); await installPrompt.userChoice; } catch { } installPrompt = null; mostraGuida(guidaPasso); }
  else await chiudiGuida();
});
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; });

/* ---------- eventi ---------- */
$('#v').addEventListener('click', async e => {
  const b = e.target.closest('[data-d],[data-m],[data-act],[data-sel],[data-s],[data-ym],[data-y],[data-t],[data-v],[data-mo]'); if (!b) return;
  if (b.dataset.t) { tab = b.dataset.t; return render(); }
  if (b.dataset.v) { calVista = b.dataset.v; annoSel = mese.getFullYear(); return render(); }
  if (b.dataset.mo) { const n = new Date(); mese = new Date(n.getFullYear(), n.getMonth(), 1); sel = oggi(); sett = mondayOf(sel); return render(); }
  if (b.dataset.d) {
    if (!editMest && desk()) { sel = b.dataset.d; sett = mondayOf(sel); mIdx = 0; return render(); }
    if (!editMest) return apriGiorno(b.dataset.d);
    setFlow(b.dataset.d, S.days[b.dataset.d]?.flow > 0 ? 0 : 2);
    return commit();
  }
  if (b.dataset.sel) { sel = b.dataset.sel; mIdx = 0; return render(); }
  if (b.dataset.ym) {
    const [y, m] = b.dataset.ym.split('-').map(Number), now = new Date();
    calDa = Math.max(calDa, now.getFullYear() * 12 + now.getMonth() - (y * 12 + m) + 1);
    calVista = 'mese'; scrollCal = idMese(y, m); mese = new Date(y, m, 1); return render();
  }
  if (b.dataset.y) { annoSel = Math.min(new Date().getFullYear() + 1, Math.max(new Date().getFullYear() - 6, annoSel + +b.dataset.y)); return render(); }
  if (b.dataset.s) return apriGiorno(sel, [b.dataset.s]);
  if (b.dataset.m) { mese = new Date(mese.getFullYear(), mese.getMonth() + +b.dataset.m, 1); return render(); }
  b.disabled = true;
  try { await azioni[b.dataset.act](e); }
  catch (err) { if (b.dataset.act.startsWith('notif')) { msgN = err.message; render(); } else msg = err.message; if (b.dataset.act === 'sync') stato('Sincronizzazione non riuscita: ' + err.message); else render(); }
  b.disabled = false;
});
$('#v').addEventListener('change', async e => {
  if (e.target.dataset.nf) { const k = e.target.dataset.nf; S.cfg.notif = { ...nf(), [k]: e.target.type === 'checkbox' ? e.target.checked : k === 'pre' ? +e.target.value : e.target.value }; return commit(); }
  if (e.target.dataset.cfg) { S.cfg[e.target.dataset.cfg] = Math.max(1, +e.target.value || 1); S.cfgU = Date.now(); return commit(); }
  if (e.target.id === 'fi' && e.target.files[0]) {
    try {
      const j = JSON.parse(await e.target.files[0].text());
      if (!j.days || typeof j.days !== 'object') throw 0;
      if (!confirm('Sostituire i dati attuali con quelli del file?')) return;
      const { notif: _n, ...cfgImp } = j.cfg || {};
      S = { days: j.days, cfg: { ...S.cfg, ...cfgImp }, cfgU: Date.now() }; await commit();
    } catch { alert('File non valido: scegli un file esportato da Muudays.'); }
  }
});
const meseOggi = () => { const n = new Date(); return idMese(n.getFullYear(), n.getMonth()); };
$('#hl').onclick = () => { tab = tab === 'oggi' ? 'imp' : 'oggi'; editMest = false; render(); };
$('#hr').onclick = () => { if (tab === 'oggi') { tab = 'cal'; calVista = 'mese'; scrollCal = meseOggi(); } else tab = 'imp'; editMest = false; render(); };
$('#hc').onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; calVista = b.dataset.v; annoSel = new Date().getFullYear(); scrollCal = meseOggi(); editMest = false; render(); };
let tx0 = null;
$('#v').addEventListener('touchstart', e => { tx0 = e.target.closest('#strip') ? e.touches[0].clientX : null; }, { passive: true });
$('#v').addEventListener('touchend', e => {
  if (tx0 == null) return;
  const dx = e.changedTouches[0].clientX - tx0; tx0 = null;
  if (Math.abs(dx) > 50) { sett = add(sett, dx < 0 ? 7 : -7); render(); }
});
$('#v').addEventListener('dblclick', e => { const b = e.target.closest('[data-d]'); if (b && desk() && !editMest) apriGiorno(b.dataset.d); });
matchMedia('(min-width: 1000px)').addEventListener('change', () => render());
document.addEventListener('visibilitychange', () => { if (!document.hidden) sincronizza().catch(() => { }); });
setInterval(() => { if (!document.hidden) sincronizza().catch(() => { }); }, 45000);

(async () => {
  S = await load(); migra(); snap = costruisciSnap();
  sess = await kvGet('sess'); K = await kvGet('key'); spazio = await kvGet('spazio');
  sel = oggi(); sett = mondayOf(sel);
  navigator.storage?.persist?.();
  if ('serviceWorker' in navigator) {
    const aveva = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js');
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (aveva && !$('.upd')) document.body.insertAdjacentHTML('beforeend', '<div class="upd"><span>Aggiornamento disponibile</span><button onclick="location.reload()">Ricarica</button></div>');
    });
  }
  render();
  if (!(await kvGet('guida'))) mostraGuida(0);
  if (sess && !spazio) leggiSpazio().then(() => leggiRemoto()).then(() => { if (tab === 'imp') render(); }).catch(() => { });
  if (sess && spazio) {
    leggiMembri().then(() => { if (tab === 'imp') render(); });
    if (K) sincronizza().catch(() => { }); else leggiRemoto().catch(() => { });
  }
})();
