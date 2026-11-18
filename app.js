'use strict';
const SB = 'https://fwcxhbcyrcujcccwnvee.supabase.co';
const PK = 'sb_publishable_2dX2Ahy1W-OLwocWYumtCw_KJoemZCn';
const $ = (s, e = document) => e.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const FLUSSO = ['Nessuno', 'Leggero', 'Medio', 'Abbondante'];
const SINT = ['Crampi', 'Mal di testa', 'Gonfiore', 'Stanchezza', 'Acne', 'Mal di schiena', 'Nausea', 'Voglie'];
const UMORI = ['Bene', 'Neutro', 'Triste', 'Irritabile', 'Ansiosa'];

let S, sess = null, K = null, remoto = null, sync = '', msg = '';
let auth = { step: 'email', email: '' }, tab = 'oggi';
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
  if (!pr) return `<div class="box"><p><b>Si parte dal passato.</b></p><p class="mut">Apri il Calendario, torna indietro di qualche mese e tocca i giorni delle mestruazioni passate. Con tre o quattro cicli le previsioni diventano affidabili.</p></div><button class="btn" data-d="${t}">Registra oggi</button>`;
  const cd = diff(t, pr.last.start) + 1, n = pr.next, fra = diff(n.s, t), o = n.o;
  let fase;
  if (cd <= diff(pr.last.end, pr.last.start) + 1) fase = 'Mestruazione';
  else if (t === o) fase = 'Ovulazione stimata';
  else if (t >= add(o, -5) && t <= add(o, 1)) fase = 'Finestra fertile';
  else fase = t < o ? 'Fase follicolare' : 'Fase luteale';
  const prossima = fra > 0 ? `Prossima mestruazione tra <b>${fra} ${fra === 1 ? 'giorno' : 'giorni'}</b>` : fra === 0 ? '<b>Mestruazione attesa oggi</b>' : `Mestruazione in ritardo di <b>${-fra} ${fra === -1 ? 'giorno' : 'giorni'}</b>`;
  const r = Math.round(st.sd), e = S.days[t];
  return `<div class="hero">${ring(pr.cyc, cd, pr.pl)}<p class="ph">${fase}</p>
    <p>${prossima}</p>
    ${st.sd >= 1.5 ? `<p class="mut">Probabile tra il ${dm(add(n.s, -r))} e il ${dm(add(n.s, r))}</p>` : ''}
    <p class="mut">Finestra fertile: ${dm(add(o, -5))} – ${dm(add(o, 1))}</p></div>
    <button class="btn" data-d="${t}">${e ? 'Modifica oggi' : 'Registra oggi'}</button>
    <p class="mut cen">In media il ciclo dura ${st.cycle.toFixed(0)} giorni e le mestruazioni ${st.period.toFixed(0)}.</p>`;
}

function viewCal() {
  const st = stats(), pr = predici(st), t = oggi();
  const y = mese.getFullYear(), m = mese.getMonth(), n = new Date(y, m + 1, 0).getDate();
  let cells = '<span class="d x"></span>'.repeat((new Date(y, m, 1).getDay() + 6) % 7);
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
    <div class="leg"><span><i style="background:var(--per)"></i>Mestruazione</span><span><i style="box-shadow:inset 0 0 0 2px var(--per)"></i>Prevista</span><span><i style="background:color-mix(in srgb,var(--fer) 28%,transparent)"></i>Fertile</span></div>
    <p class="mut">Tocca un giorno per registrarlo. Per lo storico, torna indietro nei mesi e usa «Segna giorni da qui».</p>`;
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
  $('#v').innerHTML = { oggi: viewOggi, cal: viewCal, imp: viewImp }[tab]();
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
  $('#gear').classList.toggle('on', tab === 'imp');
}

/* ---------- inserimento giorno ---------- */
function apriGiorno(d) {
  const cur = S.days[d] || {}, dl = $('#dlg'), sym = new Set(cur.sym || []), pl = Math.round(+S.cfg.period);
  let flow = cur.flow || 0, mood = cur.mood || '';
  const chips = (arr, on) => arr.map((x, i) => `<button class="chip${on(x, i) ? ' on' : ''}" data-i="${i}">${x}</button>`).join('');
  dl.innerHTML = `<h2>${parse(d).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
    <h3>Flusso</h3><div class="chips" id="cf">${chips(FLUSSO, (x, i) => i === flow)}</div>
    <button class="link" id="bulk">Segna ${pl} giorni di mestruazione da qui</button>
    <h3>Sintomi</h3><div class="chips" id="cs">${chips(SINT, x => sym.has(x))}</div>
    <h3>Umore</h3><div class="chips" id="cm">${chips(UMORI, x => x === mood)}</div>
    <h3>Note</h3><textarea id="nt" rows="2">${esc(cur.note || '')}</textarea>
    <div class="row"><button class="btn alt" id="no">Annulla</button><button class="btn" id="sv">Salva</button></div>
    ${S.days[d] ? '<button class="link" id="del">Cancella questo giorno</button>' : ''}`;
  const chip = (id, fn) => $(id).onclick = e => { const b = e.target.closest('.chip'); if (b) fn(+b.dataset.i, b); };
  chip('#cf', i => { flow = i; [...$('#cf').children].forEach((c, j) => c.classList.toggle('on', j === i)); });
  chip('#cs', (i, b) => { const k = SINT[i]; sym.has(k) ? sym.delete(k) : sym.add(k); b.classList.toggle('on'); });
  chip('#cm', i => { mood = mood === UMORI[i] ? '' : UMORI[i]; [...$('#cm').children].forEach((c, j) => c.classList.toggle('on', UMORI[j] === mood)); });
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
  imp() { $('#fi').click(); }
};

/* ---------- eventi ---------- */
$('#v').addEventListener('click', async e => {
  const b = e.target.closest('[data-d],[data-m],[data-act]'); if (!b) return;
  if (b.dataset.d) return apriGiorno(b.dataset.d);
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
$('#tabs').onclick = e => { const b = e.target.closest('button'); if (b) { tab = b.dataset.t; render(); } };
$('#gear').onclick = () => { tab = 'imp'; render(); };
document.addEventListener('visibilitychange', () => { if (!document.hidden) tira().catch(() => { }); });

(async () => {
  S = await load(); sess = await kvGet('sess'); K = await kvGet('key');
  navigator.storage?.persist?.();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
  render();
  if (sess && K) tira().catch(e => stato('Sincronizzazione non riuscita: ' + e.message));
  else if (sess) leggiRemoto().then(render).catch(() => { });
})();
