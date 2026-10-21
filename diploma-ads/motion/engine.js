// Deterministic motion engine: every style is a function of t only.
const FPS = 30;
const E = {
  out: x => 1 - (1 - x) ** 3,
  io: x => (x < .5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2),
  back: x => 1 + 2.45 * (x - 1) ** 3 + 1.45 * (x - 1) ** 2,
  lin: x => x,
};
const cl = x => Math.max(0, Math.min(1, x));
const pr = (t, a, d, e = 'out') => E[e](cl((t - a) / d));
const L = (a, b, k) => a + (b - a) * k;

function st(el, { op = 1, x = 0, y = 0, s = 1, r = 0, b = 0 } = {}) {
  el.style.opacity = op;
  el.style.transform = `translate(-50%,-50%) translate(${x}px,${y}px) scale(${s}) rotate(${r}deg)`;
  el.style.filter = b > .05 ? `blur(${b}px)` : 'none';
}
// reveal: rise + unblur
function rv(el, t, a, { d = .6, dy = 46, dx = 0, s0 = .96, blur = 10, x = 0, y = 0 } = {}) {
  const k = pr(t, a, d);
  st(el, { op: cl(k * 1.4), x: x + (1 - k) * dx, y: y + (1 - k) * dy, s: L(s0, 1, k), b: (1 - k) * blur });
  return k;
}
function pop(el, t, a, { d = .55, s0 = .4, x = 0, y = 0, r = 0 } = {}) {
  const k = pr(t, a, d, 'back'), k2 = pr(t, a, d * .6);
  st(el, { op: k2, x, y, s: L(s0, 1, k), r: (1 - k2) * r });
  return k;
}
// word-by-word headline reveal; el contains .wd spans
function words(el, t, times, { d = .5, dy = 34 } = {}) {
  el.style.opacity = 1;
  el.style.transform = 'translate(-50%,-50%)';
  [...el.querySelectorAll('.wd')].forEach((w, i) => {
    const k = pr(t, times[Math.min(i, times.length - 1)], d);
    w.style.opacity = cl(k * 1.3);
    w.style.transform = `translateY(${(1 - k) * dy}px)`;
    w.style.filter = k < .95 ? `blur(${(1 - k) * 8}px)` : 'none';
  });
}
// split a string into word spans; `*word*` = green, `~word~` = warm
function W(text, cls = '') {
  return text.split(' ').map(w => {
    let c = '';
    if (/^\*.*\*$/.test(w)) { c = 'g'; w = w.slice(1, -1); }
    else if (/^~.*~$/.test(w)) { c = 'w'; w = w.slice(1, -1); }
    return `<span class="wd ${c} ${cls}">${w}</span>`;
  }).join(' ');
}
// spread n word times across [a,b]
const spread = (a, b, n) => Array.from({ length: n }, (_, i) => a + (b - a) * (n > 1 ? i / (n - 1) : 0));

const $ = (p, cls, html = '', css = {}) => {
  const e = document.createElement('div');
  if (cls) e.className = cls;
  e.innerHTML = html;
  Object.assign(e.style, css);
  p.appendChild(e);
  return e;
};
const A = (p, x, y, cls, html = '', css = {}) => $(p, 'a ' + cls, html, { left: x + 'px', top: y + 'px', ...css });

const I = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  book: '<path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14a5 5 0 0 1 6 5"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  play: '<path d="M7 4v16l13-8z"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  video: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4z"/>',
  slides: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  star: '<path d="m12 3 2.7 5.6 6.2.9-4.5 4.3 1.1 6.1L12 17l-5.5 2.9 1.1-6.1L3.1 9.5l6.2-.9z"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8c-2-4-6-4-6-1s4 1 6 1c2 0 6 2 6-1s-4-3-6 1"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/>',
  spark: '<path d="M12 2l2.2 6.3L20.5 10l-6.3 2.2L12 18.5l-2.2-6.3L3.5 10l6.3-1.7z"/>',
  send: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>',
  chef: '<path d="M6 13a4 4 0 0 1-.8-7.9A5 5 0 0 1 12 3a5 5 0 0 1 6.8 2.1A4 4 0 0 1 18 13v7H6z"/><path d="M6 17h12"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v4"/>',
  code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  live: '<circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19 5a10 10 0 0 1 0 14M5 19A10 10 0 0 1 5 5"/>',
  gauge: '<path d="M12 14l4-4"/><path d="M3.3 19a10 10 0 1 1 17.4 0"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  game: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 11v3M5.5 12.5h3M15 12h.01M18 13h.01"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
};
const svg = (k, extra = '') => `<svg viewBox="0 0 24 24" ${extra}>${I[k]}</svg>`;
const ic = (k, cls = '') => `<div class="ic ${cls}">${svg(k)}</div>`;

// ---------- scenes ----------
// B = boundaries; scene i lives in [B[i], B[i+1]]; slide RTL (out → right, in ← left)
function grp(g, t, a, b, { din = .6, dout = .55, first = false, last = false, dist = 240 } = {}) {
  if (t < a - din * .5 || t > b + dout * .5) { g.style.display = 'none'; return false; }
  g.style.display = 'block';
  const ki = first ? 1 : pr(t, a - din * .5, din, 'io');
  const ko = last ? 0 : pr(t, b - dout * .5, dout, 'io');
  const k = Math.min(ki, 1 - ko);
  const x = (1 - ki) * -dist + ko * dist;
  g.style.opacity = cl(k * 1.15);
  g.style.transform = `translateX(${x}px) scale(${L(.97, 1, k)})`;
  g.style.filter = k < .97 ? `blur(${(1 - k) * 9}px)` : 'none';
  return true;
}
// dark amount for background: DARK = [[t, 0|1], ...] keyframes with .5s crossfades
function darkAt(t, keys) {
  let v = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [tk, val] = keys[i];
    const prev = keys[i - 1][1];
    const k = pr(t, tk - .25, .5, 'io');
    if (t >= tk - .25) v = L(prev, val, k);
  }
  return v;
}
const mix = (c1, c2, k) => {
  const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const a = p(c1), b = p(c2);
  return `rgb(${a.map((v, i) => Math.round(L(v, b[i], k))).join(',')})`;
};

// ---------- frame sequences (screen recordings) ----------
const PENDING = [];
function seq(img, clip, t, a) {
  const c = CLIPS[clip];
  const n = Math.round(c.dur * FPS);
  const i = Math.max(1, Math.min(n, Math.floor((t - a) * FPS) + 1));
  const src = `frames/${clip}/${String(i).padStart(4, '0')}.jpg`;
  if (img.dataset.src !== src) {
    img.dataset.src = src;
    img.src = src;
    PENDING.push(img.decode().catch(() => {}));
  }
}
function phone(p, x, y, scale = 1) {
  const e = A(p, x, y, 'phone', '<div class="scr"><img></div>');
  e._s = scale;
  return e;
}
function browser(p, x, y, w, h, url = 'withaiacademy.com') {
  return A(p, x, y, 'browser', `<div class="tb"><i></i><i></i><i></i><b>${url}</b></div><img style="height:${h - 64}px">`, { width: w + 'px' });
}

// ---------- shared chrome ----------
function chrome(stage) {
  const bgL = $(stage, 'bg', '', {}); bgL.id = 'bgL';
  const bgD = $(stage, 'bg', '', {}); bgD.id = 'bgD';
  const sqs = [[120, 420, 120, 18], [960, 300, 80, -14], [930, 1500, 140, 22], [140, 1560, 90, -8]]
    .map(([x, y, s, r]) => $(bgD, 'sq', '', { left: x + 'px', top: y + 'px', width: s + 'px', height: s + 'px', transform: `rotate(${r}deg)` }));
  const logo = $(stage, '', '<img src="assets/mark.png"><span>Smarter With <b>AI</b></span>');
  logo.id = 'logo';
  const prog = $(stage, ''); prog.id = 'prog';
  return { bgL, bgD, logo, prog, sqs };
}
function chromeAt(C, t, T, dark) {
  C.bgD.style.opacity = dark;
  C.sqs.forEach((s, i) => s.style.transform = `rotate(${[18, -14, 22, -8][i] + t * [6, -5, 4, -7][i]}deg)`);
  const sp = C.logo.querySelector('span');
  sp.style.color = mix('#1E2D44', '#FBF9F4', dark);
  sp.querySelector('b').style.color = '#92B43B';
  C.logo.style.opacity = pr(t, .1, .6);
  C.prog.style.width = (cl(t / T) * 1080) + 'px';
}

// ---------- CTA pieces ----------
function commentBox(p, x, y, word) {
  return A(p, x, y, 'cbox', `<div class="av">${svg('user')}</div><div class="tx"><span class="ph">اكتب كومنت…</span><span class="tw"></span><span class="cur"></span></div><div class="sd">${svg('send')}</div>`);
}
function commentAt(el, t, a, word, tType, tSend) {
  pop(el, t, a, { s0: .7 });
  const n = Math.round(word.length * pr(t, tType, .5, 'lin'));
  el.querySelector('.tw').textContent = word.slice(0, n);
  el.querySelector('.ph').style.display = n > 0 ? 'none' : 'inline';
  el.querySelector('.cur').style.opacity = (Math.floor(t * 2.4) % 2 === 0 && t < tSend) ? 1 : 0;
  const ks = pr(t, tSend, .35, 'back');
  el.querySelector('.sd').style.transform = `scale(${1 + .25 * Math.sin(Math.PI * cl((t - tSend) / .35))})`;
  return ks;
}
function replyBubble(p, x, y, text, sub) {
  return A(p, x, y, 'reply', `<img src="assets/mark.png"><div><div class="rs">${sub}</div><div class="rt">${text}</div></div>`);
}

// ---------- counter ----------
function countAt(el, t, a, d, to, prefix = '+') {
  const k = pr(t, a, d, 'out');
  el.textContent = prefix + Math.round(to * k);
}

window.render = async function (t) {
  PENDING.length = 0;
  frame(t);
  await Promise.all(PENDING);
  if (PENDING.length) await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
};

// ---------- captions ----------
// list: [[text, t0, t1], ...]; word highlight time spread by character length
function captions(stage, list) {
  const wrap = $(stage, ''); wrap.id = 'caps';
  return list.map(([text, a, b]) => {
    const el = $(wrap, 'cap');
    const ws = text.split(' ');
    el.innerHTML = ws.map(w => `<span class="cw">${w}</span>`).join(' ');
    const tot = ws.reduce((s, w) => s + w.length + 1, 0);
    let acc = 0;
    const times = ws.map(w => { const tt = a + (b - a) * acc / tot; acc += w.length + 1; return tt; });
    return { el, a, b, times, spans: [...el.querySelectorAll('.cw')] };
  });
}
function capsAt(caps, t) {
  caps.forEach((c, i) => {
    const next = caps[i + 1];
    const end = next ? Math.min(next.a, c.b + .5) : c.b + .8;
    if (t < c.a - .08 || t > end + .1) { c.el.style.opacity = 0; return; }
    const k = pr(t, c.a - .08, .18), ko = pr(t, end - .02, .12);
    c.el.style.opacity = Math.min(k, 1 - ko);
    c.el.style.transform = `translate(-50%,-50%) translateY(${(1 - k) * 16}px) scale(${L(.94, 1, k)})`;
    c.spans.forEach((s, j) => s.classList.toggle('on', t >= c.times[j] && (j === c.spans.length - 1 || t < c.times[j + 1] + .25)));
  });
}
// camera: apply translate/scale to a world container so point (fx,fy) is centered-ish
function cam(world, x, y, s, r = 0) {
  world.style.transformOrigin = '540px 960px';
  world.style.transform = `translate(${x}px,${y}px) scale(${s}) rotate(${r}deg)`;
}
// sample points from text drawn on a canvas (for particle shapes)
function textPoints(text, n, { size = 420, font = '900', w = 1000, h = 520 } = {}) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d');
  c.fillStyle = '#000'; c.font = `${font} ${size}px Cairo`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.direction = 'ltr'; c.fillText(text, w / 2, h / 2 + size * .05);
  const d = c.getImageData(0, 0, w, h).data, pts = [];
  for (let y = 0; y < h; y += 6) for (let x = 0; x < w; x += 6) if (d[(y * w + x) * 4 + 3] > 128) pts.push([x - w / 2, y - h / 2]);
  let s = 11; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pts[i], pts[j]] = [pts[j], pts[i]]; }
  return Array.from({ length: n }, (_, i) => pts[i % pts.length]);
}
