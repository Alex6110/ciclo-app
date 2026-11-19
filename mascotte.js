/* Muudays: gamberetto Muu (generato) */
const SH = {"tail": "<ellipse cx=\"319.0\" cy=\"279.3\" rx=\"16\" ry=\"36\" transform=\"rotate(-16.0 319.0 279.3)\" fill=\"#ff7d9d\" stroke=\"#c93a68\" stroke-width=\"5\"/><ellipse cx=\"326.2\" cy=\"279.9\" rx=\"16\" ry=\"36\" transform=\"rotate(26.0 326.2 279.9)\" fill=\"#ff7d9d\" stroke=\"#c93a68\" stroke-width=\"5\"/><ellipse cx=\"331.1\" cy=\"285.1\" rx=\"16\" ry=\"36\" transform=\"rotate(68.0 331.1 285.1)\" fill=\"#ff7d9d\" stroke=\"#c93a68\" stroke-width=\"5\"/>", "legs": "<line x1=\"220.5\" y1=\"201.6\" x2=\"222.1\" y2=\"223.6\" stroke=\"#ffc2d0\" stroke-width=\"10\" stroke-linecap=\"round\"/><line x1=\"183.4\" y1=\"216.9\" x2=\"195.7\" y2=\"235.1\" stroke=\"#ffc2d0\" stroke-width=\"10\" stroke-linecap=\"round\"/><line x1=\"157.1\" y1=\"246.4\" x2=\"176.9\" y2=\"256.0\" stroke=\"#ffc2d0\" stroke-width=\"10\" stroke-linecap=\"round\"/><line x1=\"149.0\" y1=\"285.4\" x2=\"170.9\" y2=\"283.9\" stroke=\"#ffc2d0\" stroke-width=\"10\" stroke-linecap=\"round\"/><line x1=\"161.5\" y1=\"323.5\" x2=\"179.8\" y2=\"311.2\" stroke=\"#ffc2d0\" stroke-width=\"10\" stroke-linecap=\"round\"/><line x1=\"191.7\" y1=\"350.4\" x2=\"201.3\" y2=\"330.6\" stroke=\"#ffc2d0\" stroke-width=\"10\" stroke-linecap=\"round\"/><line x1=\"231.4\" y1=\"357.7\" x2=\"229.9\" y2=\"335.8\" stroke=\"#ffc2d0\" stroke-width=\"10\" stroke-linecap=\"round\"/><line x1=\"269.3\" y1=\"344.2\" x2=\"257.0\" y2=\"326.0\" stroke=\"#ffc2d0\" stroke-width=\"10\" stroke-linecap=\"round\"/>", "body": "<g class=\"sg\" style=\"--i:9\"><circle cx=\"306.9\" cy=\"319.5\" r=\"20.0\" fill=\"#ff6f91\" stroke=\"#c93a68\" stroke-width=\"5\"/><circle cx=\"315.0\" cy=\"323.4\" r=\"3.2\" fill=\"#ffd9e2\" opacity=\".8\"/></g><g class=\"sg\" style=\"--i:8\"><circle cx=\"278.8\" cy=\"358.3\" r=\"23.0\" fill=\"#ff7596\" stroke=\"#c93a68\" stroke-width=\"5\"/><circle cx=\"284.6\" cy=\"366.9\" r=\"3.7\" fill=\"#ffd9e2\" opacity=\".8\"/></g><g class=\"sg\" style=\"--i:7\"><circle cx=\"232.9\" cy=\"378.6\" r=\"27.0\" fill=\"#ff7b9b\" stroke=\"#c93a68\" stroke-width=\"5\"/><circle cx=\"233.7\" cy=\"390.8\" r=\"4.3\" fill=\"#ffd9e2\" opacity=\".8\"/></g><g class=\"sg\" style=\"--i:6\"><circle cx=\"180.7\" cy=\"372.9\" r=\"31.0\" fill=\"#ff82a0\" stroke=\"#c93a68\" stroke-width=\"5\"/><circle cx=\"174.6\" cy=\"385.4\" r=\"5.0\" fill=\"#ffd9e2\" opacity=\".8\"/></g><g class=\"sg\" style=\"--i:5\"><circle cx=\"136.6\" cy=\"340.3\" r=\"36.0\" fill=\"#ff88a5\" stroke=\"#c93a68\" stroke-width=\"5\"/><circle cx=\"123.2\" cy=\"349.3\" r=\"5.8\" fill=\"#ffd9e2\" opacity=\".8\"/></g><g class=\"sg\" style=\"--i:4\"><circle cx=\"114.1\" cy=\"287.8\" r=\"41.0\" fill=\"#ff8eaa\" stroke=\"#c93a68\" stroke-width=\"5\"/><circle cx=\"95.6\" cy=\"289.1\" r=\"6.6\" fill=\"#ffd9e2\" opacity=\".8\"/></g><g class=\"sg\" style=\"--i:3\"><circle cx=\"121.1\" cy=\"228.9\" r=\"46.0\" fill=\"#ff95af\" stroke=\"#c93a68\" stroke-width=\"5\"/><circle cx=\"102.5\" cy=\"219.8\" r=\"7.4\" fill=\"#ffd9e2\" opacity=\".8\"/></g><g class=\"sg\" style=\"--i:2\"><circle cx=\"158.3\" cy=\"179.6\" r=\"51.0\" fill=\"#ff9bb4\" stroke=\"#c93a68\" stroke-width=\"5\"/><circle cx=\"145.4\" cy=\"160.6\" r=\"8.2\" fill=\"#ffd9e2\" opacity=\".8\"/></g><g class=\"sg\" style=\"--i:1\"><circle cx=\"217.2\" cy=\"154.8\" r=\"53.0\" fill=\"#ffa1b9\" stroke=\"#c93a68\" stroke-width=\"5\"/><circle cx=\"215.6\" cy=\"131.0\" r=\"8.5\" fill=\"#ffd9e2\" opacity=\".8\"/></g>", "hx": 283.0, "hy": 163.2, "ang": 26.0, "ant": "<path d=\"M40 -28 Q112 -22 138 -104\" fill=\"none\" stroke=\"#ff8aa8\" stroke-width=\"8\" stroke-linecap=\"round\"/><circle cx=\"138\" cy=\"-104\" r=\"7\" fill=\"#ff8aa8\"/><path d=\"M44 -10 Q122 -4 150 -52\" fill=\"none\" stroke=\"#ff8aa8\" stroke-width=\"8\" stroke-linecap=\"round\"/><circle cx=\"150\" cy=\"-52\" r=\"7\" fill=\"#ff8aa8\"/>", "rostro": "<path d=\"M58 -24 L104 -46 L58 -2 Z\" fill=\"#ffa8be\" stroke=\"#c93a68\" stroke-width=\"5\" stroke-linejoin=\"round\"/>", "cap": "<ellipse cx=\"6\" cy=\"0\" rx=\"66\" ry=\"52\" fill=\"#ffa8be\" stroke=\"#c93a68\" stroke-width=\"5\"/>", "cheek": "<circle cx=\"38\" cy=\"17\" r=\"10\" fill=\"#ff5c85\" opacity=\".55\"/>", "smile": "<path d=\"M24 28 Q38 38 52 22\" fill=\"none\" stroke=\"#a3274f\" stroke-width=\"5\" stroke-linecap=\"round\"/>", "bb": [70.5, 99.0, 389.5, 309.5]};

/* ---------- mascotte: gamberetto Muu, una scena diversa ogni giorno ---------- */
const nGiorno = s => { const [y, m, d] = s.split('-').map(Number); return Math.floor(Date.UTC(y, m - 1, d) / 864e5); };
const VARIANTI = [
  { acc: 'sun', fx: 'bolle', an: 'bob', bg: 0 },
  { acc: 'hat', fx: 'coriandoli', an: 'hop', bg: 1 },
  { acc: 'crown', fx: 'scintille', an: 'sway', bg: 1 },
  { acc: 'love', fx: 'cuori', an: 'bob', bg: 1 },
  { acc: 'sleep', fx: 'stelle', an: 'float', bg: 2 },
  { acc: '', fx: 'bolle', an: 'wave', bg: 0 },
  { acc: 'sun', fx: 'scintille', an: 'hop', bg: 0 }
];
const EYE = {
  n: '<g class="eyeb"><circle cx="24" cy="-16" r="17" fill="#fff"/><g class="pup"><circle cx="29" cy="-16" r="10" fill="#271b3a"/><circle cx="33" cy="-22" r="3.6" fill="#fff"/></g></g>',
  love: '<g class="eyeb"><circle cx="24" cy="-16" r="17" fill="#fff"/><g class="pup"><path transform="translate(27 -14) scale(1.55)" d="M0 8 C-16 -4 -10 -18 0 -10 C10 -18 16 -4 0 8 Z" fill="#ff3d6e"/></g></g>'
};
EYE.sleep = '<g class="eclosed"><path d="M8 -16 Q24 -2 40 -16" fill="none" stroke="#271b3a" stroke-width="6" stroke-linecap="round"/></g><g class="eopen">' + EYE.n + '</g>';
const ACC = {
  sun: '<path d="M2 -20 L-52 -24" stroke="#271b3a" stroke-width="6" stroke-linecap="round"/><ellipse cx="27" cy="-16" rx="27" ry="21" fill="#3b2a6b" stroke="#150d2b" stroke-width="5"/><path d="M12 -26 Q18 -33 30 -31" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/><path d="M40 -8 L46 -12" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45"/><path d="M52 -20 L62 -24" stroke="#150d2b" stroke-width="5" stroke-linecap="round"/>',
  hat: '<path d="M-30 -44 L26 -52 L-4 -120 Z" fill="#ffcf5a" stroke="#d98f1c" stroke-width="5" stroke-linejoin="round"/><path d="M-20 -64 L16 -70" stroke="#ff6f91" stroke-width="7" stroke-linecap="round"/><path d="M-12 -86 L8 -90" stroke="#7fd6c8" stroke-width="7" stroke-linecap="round"/><circle cx="-4" cy="-122" r="10" fill="#ff6f91" stroke="#c93a68" stroke-width="4"/>',
  crown: '<path d="M-22 -44 L-28 -80 L-10 -64 L4 -92 L18 -64 L34 -80 L28 -46 Z" fill="#ffd35a" stroke="#c98a12" stroke-width="5" stroke-linejoin="round"/><circle cx="4" cy="-56" r="5" fill="#ff5c85"/><circle cx="-14" cy="-52" r="3.5" fill="#7fd6c8"/><circle cx="22" cy="-52" r="3.5" fill="#7fd6c8"/>'
};
const STAR = 'M0 -10 L2.5 -2.5 L10 0 L2.5 2.5 L0 10 L-2.5 2.5 L-10 0 L-2.5 -2.5Z';
const HEART = 'M0 7 C-14 -3 -9 -14 0 -8 C9 -14 14 -3 0 7Z';
function fxSvg(t) {
  const g = (x, y, inner) => `<g transform="translate(${x} ${y})">${inner}</g>`;
  if (t === 'bolle') return [[262, 190, 5, 0], [280, 215, 3.5, -1.4], [120, 235, 6, -2.6], [300, 240, 4, -3.3], [85, 200, 3, -.7], [335, 170, 5, -2]]
    .map(([x, y, r, d]) => g(x, y, `<circle class="fx bl" r="${r}" fill="rgba(255,255,255,.25)" stroke="#fff" stroke-width="1.8" style="animation-delay:${d}s"/>`)).join('');
  if (t === 'coriandoli') return ['#ff6f91', '#ffd35a', '#7fd6c8', '#b9aee3', '#ff9fb4', '#8ec5ff'].flatMap((c, i) => [i, i + 6]).map(i => g(22 + i * 30, 0, `<rect class="fx fl" width="7" height="11" rx="2" fill="${['#ff6f91', '#ffd35a', '#7fd6c8', '#b9aee3', '#ff9fb4', '#8ec5ff'][i % 6]}" style="animation-duration:${5 + i % 3}s;animation-delay:${-i * .7}s"/>`)).join('');
  if (t === 'scintille') return [[70, 120], [335, 95], [352, 190], [52, 200], [190, 70], [292, 62]].map(([x, y], i) => g(x, y, `<path class="fx sp" d="${STAR}" fill="#ffe9a8" style="animation-delay:${-i * .45}s"/>`)).join('');
  if (t === 'cuori') return [[90, 250], [140, 262], [300, 255], [340, 245], [250, 268], [58, 258]].map(([x, y], i) => g(x, y, `<path class="fx ht" d="${HEART}" fill="#ff6f91" style="animation-delay:${-i * .85}s"/>`)).join('');
  if (t === 'stelle') return g(335, 58, '<path d="M0 -16 A16 16 0 1 0 16 0 A12 12 0 1 1 0 -16Z" fill="#ffe9a8"/>') +
    [[40, 40], [90, 80], [150, 30], [215, 55], [270, 28], [372, 110], [30, 140], [120, 120], [350, 35], [305, 105]].map(([x, y], i) => g(x, y, `<circle class="fx tw" r="${1.5 + i % 3 * .7}" fill="#fff" style="animation-delay:${-i * .4}s"/>`)).join('') +
    [[246, 118, 16], [262, 96, 20], [281, 72, 24]].map(([x, y, s], i) => `<text class="fx zz" x="${x}" y="${y}" font-size="${s}" font-weight="700" fill="#cfc6ee" style="animation-delay:${-i * .9}s">z</text>`).join('');
  return '';
}
const ALGA = (x, h, d) => `<g class="alga" style="animation-delay:${d}s"><path d="M${x} 292 C${x - 14} ${292 - h * .25} ${x + 14} ${292 - h * .5} ${x} ${292 - h * .72} C${x - 8} ${292 - h * .88} ${x + 4} ${292 - h * .95} ${x + 2} ${292 - h}" fill="none" stroke="var(--alga)" stroke-width="11" stroke-linecap="round"/></g>`;
function scena(d, forza) {
  const n = nGiorno(d), v = VARIANTI[forza ?? (n * 3 + Math.floor(n / 7)) % VARIANTI.length];
  const sc = .6, tx = (400 - SH.bb[2] * sc) / 2 - SH.bb[0] * sc, ty = 88 - SH.bb[1] * sc;
  const occhio = v.acc === 'love' ? EYE.love : v.acc === 'sleep' ? EYE.sleep : EYE.n;
  const shr = `<g class="shr ${v.an}"><g class="tail">${SH.tail}</g><g class="zb">${SH.legs}${SH.body}</g><g transform="translate(${SH.hx} ${SH.hy}) rotate(${SH.ang})"><g class="zh"><g class="ant">${SH.ant}</g>${SH.rostro}${SH.cap}${occhio}${SH.cheek}${SH.smile}${ACC[v.acc] || ''}</g></g></g>`;
  const a = SH.ang * Math.PI / 180, gx = SH.hx + 24 * Math.cos(a) + 16 * Math.sin(a), gy = SH.hy + 24 * Math.sin(a) - 16 * Math.cos(a);
  const P = (x, y) => [(tx + sc * x).toFixed(1), (ty + sc * y).toFixed(1)], [ex, ey] = P(gx, gy), [hx, hy] = P(SH.hx, SH.hy);
  return {
    bg: v.bg,
    svg: `<svg class="scn" viewBox="0 0 400 310" role="img" aria-label="Il gamberetto Muu" data-ex="${ex}" data-ey="${ey}" data-hx="${hx}" data-hy="${hy}" data-ang="${SH.ang}">${ALGA(26, 120, 0)}${ALGA(52, 78, -1.3)}${ALGA(352, 112, -.6)}${ALGA(376, 70, -2)}
      <path d="M0 278 Q100 260 200 274 T400 268 V310 H0Z" fill="var(--sabbia)"/><circle cx="96" cy="292" r="7" fill="var(--alga)" opacity=".5"/><circle cx="318" cy="294" r="9" fill="var(--alga)" opacity=".5"/>
      <ellipse class="ombra" cx="200" cy="286" rx="80" ry="8" fill="rgba(0,0,0,.22)"/>
      <g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${sc})">${shr}</g>${fxSvg(v.fx)}</svg>`
  };
}

/* ---------- interazione: sguardo, tocchi, coccole ---------- */
const NS = 'http://www.w3.org/2000/svg';
let _look = 0, _hold = null, _pet = null, _held = false, _taps = [];
const ptScena = (svg, e) => { const r = svg.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 400, (e.clientY - r.top) / r.height * 310]; };
function guarda(svg, x, y, wander) {
  const p = svg.querySelector('.pup'); if (!p) return;
  const a = +svg.dataset.ang * Math.PI / 180, dx = x - +svg.dataset.ex, dy = y - +svg.dataset.ey, L = Math.hypot(dx, dy) || 1, m = Math.min(1, L / 50) * 6;
  const ux = dx / L * m, uy = dy / L * m;
  p.style.transform = `translate(${(ux * Math.cos(a) + uy * Math.sin(a)).toFixed(1)}px,${(-ux * Math.sin(a) + uy * Math.cos(a)).toFixed(1)}px)`;
  if (!wander) _look = Date.now();
}
function spawn(svg, tipo, x, y, extra) {
  if (svg.querySelectorAll('.tmp').length > 28) return;
  const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'tmp'); g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
  const el = document.createElementNS(NS, tipo === 'cuore' ? 'path' : tipo === 'coriandolo' ? 'rect' : 'circle');
  if (tipo === 'cuore') { el.setAttribute('d', HEART); el.setAttribute('fill', '#ff6f91'); el.setAttribute('class', 'fx ht2'); }
  else if (tipo === 'coriandolo') { el.setAttribute('width', 7); el.setAttribute('height', 11); el.setAttribute('rx', 2); el.setAttribute('fill', extra.c); el.setAttribute('class', 'fx bu'); el.style.setProperty('--dx', extra.dx + 'px'); el.style.setProperty('--dy', extra.dy + 'px'); }
  else { el.setAttribute('r', (3 + Math.random() * 4).toFixed(1)); el.setAttribute('fill', 'rgba(255,255,255,.25)'); el.setAttribute('stroke', '#fff'); el.setAttribute('stroke-width', 1.8); el.setAttribute('class', 'fx bl2'); }
  g.appendChild(el); svg.appendChild(g); setTimeout(() => g.remove(), 1900);
}
function anima(el, cl) { el.classList.remove(cl); void el.offsetWidth; el.classList.add(cl); setTimeout(() => el.classList.remove(cl), 1000); }
function festa(svg) {
  const x = +svg.dataset.hx, y = +svg.dataset.hy;
  for (let i = 0; i < 16; i++) { const a = Math.random() * 6.283, r = 60 + Math.random() * 90; spawn(svg, 'coriandolo', x, y, { c: ['#ff6f91', '#ffd35a', '#7fd6c8', '#b9aee3', '#8ec5ff'][i % 5], dx: Math.cos(a) * r, dy: Math.sin(a) * r - 30 }); }
}
function scenaInit(el) {
  const svg = el.querySelector('svg'); if (!svg) return;
  el.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || e.buttons) guarda(svg, ...ptScena(svg, e)); });
  el.addEventListener('pointerdown', e => {
    guarda(svg, ...ptScena(svg, e)); _held = false; clearTimeout(_hold);
    if (!e.target.closest('.shr')) return;
    _hold = setTimeout(() => {
      _held = true; el.classList.add('pet'); svg.classList.add('sveglia');
      const dai = () => { if (!document.contains(el)) return fine(); spawn(svg, 'cuore', +svg.dataset.hx + 10 + Math.random() * 50, +svg.dataset.hy - 20 - Math.random() * 14); };
      dai(); _pet = setInterval(dai, 320);
    }, 520);
  });
  const fine = () => { clearTimeout(_hold); clearInterval(_pet); el.classList.remove('pet'); setTimeout(() => svg.classList.remove('sveglia'), 2500); };
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => el.addEventListener(t, fine));
}
function scenaTocco(e) {
  const el = e.target.closest('.scene'), svg = el && el.querySelector('svg'); if (!svg) return 'acqua';
  if (_held) { _held = false; return 'coccole'; }
  const [x, y] = ptScena(svg, e), hx = +svg.dataset.hx, hy = +svg.dataset.hy;
  const z = e.target.closest('.zh') ? 'testa' : e.target.closest('.tail') ? 'coda' : e.target.closest('.zb') ? 'corpo' : 'acqua';
  guarda(svg, x, y);
  if (z !== 'acqua') { svg.classList.add('sveglia'); setTimeout(() => svg.classList.remove('sveglia'), 3500); }
  if (z === 'testa') {
    anima(el, 'boop'); for (let i = 0; i < 3; i++) spawn(svg, 'cuore', hx + 20 + i * 18, hy - 24 - i * 6);
    const n = Date.now(); _taps = _taps.filter(t => n - t < 4000); _taps.push(n);
    if (_taps.length >= 5) { _taps = []; festa(svg); return 'festa'; }
  } else if (z === 'coda') { anima(el, 'flick'); for (let i = 0; i < 3; i++) spawn(svg, 'bolla', x + i * 8 - 8, y - 6); }
  else if (z === 'corpo') { anima(el, 'squish'); anima(el, 'jump'); }
  else for (let i = 0; i < 4; i++) setTimeout(() => spawn(svg, 'bolla', x + (Math.random() - .5) * 26, y + (Math.random() - .5) * 10), i * 110);
  return z;
}
// lo sguardo vaga da solo quando nessuno tocca
setInterval(() => {
  const el = document.querySelector('.scene'), svg = el && el.querySelector('svg');
  if (!svg || Date.now() - _look < 2600) return;
  const a = Math.random() * 6.283, r = 25 + Math.random() * 70;
  guarda(svg, +svg.dataset.ex + Math.cos(a) * r, +svg.dataset.ey + Math.sin(a) * r, true);
}, 3300);
