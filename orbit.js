/* Orbit: dithered night-side Earth limb, aurora, satellite downlink, reactive starfield.
   window.OrbitArt.create(canvas, { mood: 'calm' | 'intercept', hex, onFrame(f), onBurst(on, info) }) */
(() => {
  const B8 = [0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21];
  const THR = new Float32Array(64);
  for (let i = 0; i < 64; i++) THR[i] = (B8[i] + 0.5) / 64;
  const p32 = (r, g, b) => (0xff000000 | (b << 16) | (g << 8) | r) >>> 0;
  const K = p32(0, 0, 0), DEEP = p32(20, 30, 112), COB = p32(31, 59, 255), PERI = p32(168, 180, 245), BONE = p32(232, 226, 207), RED = p32(232, 52, 63);
  const RAMP = [K, DEEP, COB, BONE], LR = [DEEP, COB, PERI, BONE];
  const rank = (c) => (c === BONE ? 4 : c === PERI ? 3 : c === COB || c === RED ? 2 : c === DEEP ? 1 : 0);
  const TAU = Math.PI * 2, HALF = Math.PI / 2, PER = TAU / 3, LAT = 0.62, TW = 384, TH = 160;
  const ramp = (v, t) => { if (v <= 0) return K; if (v >= 1) return BONE; const s = v * 3, i = s | 0; return s - i > t ? RAMP[i + 1] : RAMP[i]; };
  const thr = (x, y) => THR[(x & 7) | ((y & 7) << 3)];
  const lramp = (v, t) => { if (v <= 0) return DEEP; if (v >= 1) return BONE; const s = v * 3, i = s | 0; return s - i > t ? LR[i + 1] : LR[i]; };

  const h3 = (x, y, z) => {
    let h = Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1) ^ Math.imul(z, 0x1b873593);
    h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const vn3 = (x, y, z) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    let u = x - xi, v = y - yi, w = z - zi;
    u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v); w = w * w * (3 - 2 * w);
    const a = h3(xi, yi, zi), b = h3(xi + 1, yi, zi), c = h3(xi, yi + 1, zi), d = h3(xi + 1, yi + 1, zi);
    const e = h3(xi, yi, zi + 1), f = h3(xi + 1, yi, zi + 1), g = h3(xi, yi + 1, zi + 1), k = h3(xi + 1, yi + 1, zi + 1);
    const ab = a + (b - a) * u, cd = c + (d - c) * u, ef = e + (f - e) * u, gk = g + (k - g) * u;
    const lo = ab + (cd - ab) * v, hi = ef + (gk - ef) * v;
    return lo + (hi - lo) * w;
  };
  const fbm = (x, y, z, o) => { let s = 0, a = 0.5, n = 0; for (let i = 0; i < o; i++) { s += a * vn3(x, y, z); n += a; a *= 0.5; x = x * 2.03 + 1.7; y = y * 2.03 + 9.2; z = z * 2.03 + 4.1; } return s / n; };
  const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const wrap = (L) => ((L % PER) + PER) % PER;

  const HEX = ['0A0A492062656C6965','766520696E206F6E65','20476F642C0A746865','204661746865722061','6C6D69676874792C0A','6D616B6572206F6620','68656176656E20616E','642065617274682C0A','6F6620616C6C207468','696E67732076697369','626C6520616E642069','6E76697369626C652E','0A0A492062656C6965','766520696E206F6E65','204C6F7264204A6573','757320436872697374','2C0A746865204F6E6C','79204265676F747465','6E20536F6E206F6620'].join('');
  const GS = { '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001', '5': '111100111001111', '6': '111100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001111', A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100' };
  const GL = {};
  for (const k in GS) { const s = GS[k], a = []; for (let i = 0; i < 15; i++) if (s[i] === '1') a.push(i % 3, (i / 3) | 0); GL[k] = a; }
  const SAT = ['.......b.......', 'ppppp.bbb.ppppp', 'PPPPP-bBb-PPPPP', 'ppppp.bbb.ppppp', '......b.b......'];

  let WORLD = window.__orbitWorld || null;
  const world = () => {
    if (WORLD) return WORLD;
    const land = new Float32Array(TW * TH), cloud = new Float32Array(TW * TH);
    for (let j = 0; j < TH; j++) {
      const la = -LAT + ((j + 0.5) / TH) * 2 * LAT, z = la * 3.7;
      for (let i = 0; i < TW; i++) {
        const a = ((i + 0.5) / TW) * TAU, ca = Math.cos(a), sa = Math.sin(a);
        land[j * TW + i] = fbm(ca * 1.35 + 11.1, sa * 1.35 + 3.7, z + 5.3, 5);
        cloud[j * TW + i] = fbm(ca * 2.6 + 40.2, sa * 2.6 + 17.9, z * 1.9 + 9.4, 4);
      }
    }
    const rowOf = (la) => { const j = Math.floor(((la + LAT) / (2 * LAT)) * TH); return j < 0 ? 0 : j >= TH ? TH - 1 : j; };
    const at = (L, la) => { let i = Math.floor((wrap(L) / PER) * TW); if (i >= TW) i = TW - 1; return land[rowOf(la) * TW + i]; };
    const r = rng(7331), cities = [];
    for (let g = 0; g < 60000 && cities.length < 190; g++) {
      const L = r() * PER, la = (r() * 2 - 1) * LAT * 0.97, v = at(L, la);
      if (v < 0.53) continue;
      const coast = Math.max(0, 1 - (v - 0.53) / 0.045), pop = vn3(L * 14 + 2.2, la * 14 + 5.1, 3.3);
      if (r() > 0.06 + coast * 0.5 + Math.max(0, pop - 0.5) * 1.6) continue;
      cities.push({ L, la, s: 2 + Math.floor(44 * Math.pow(r(), 3.2)) });
    }
    const out = [];
    const push = (L, la, b, f) => { out.push(wrap(L), Math.cos(la), Math.sin(la), b, f, rowOf(la)); };
    const gauss = () => { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * r()); };
    for (const c of cities) {
      const sg = 0.003 + 0.001 * Math.sqrt(c.s);
      push(c.L, c.la, 1, c.s > 16 ? 2 : 0);
      for (let k = 1; k < c.s; k++) push(c.L + gauss() * sg, c.la + gauss() * sg * 0.85, 0.42 + 0.5 * r(), 0);
    }
    const dL = (a, b) => { let d = (b - a) % PER; if (d > PER / 2) d -= PER; if (d < -PER / 2) d += PER; return d; };
    for (let a = 0; a < cities.length; a++) {
      const c = cities[a], near = [];
      for (let b = 0; b < cities.length; b++) { if (b === a) continue; const o = cities[b], d = Math.hypot(dL(c.L, o.L), o.la - c.la); if (d < 0.09) near.push([d, b]); }
      near.sort((p, q) => p[0] - q[0]);
      for (let n = 0; n < Math.min(2, near.length); n++) {
        const d = near[n][0], b = near[n][1];
        if (b < a) continue;
        const o = cities[b], ddl = dL(c.L, o.L);
        if (at(c.L + ddl / 2, (c.la + o.la) / 2) < 0.52) continue;
        const steps = Math.max(2, Math.floor(d / 0.0045));
        for (let s = 1; s < steps; s++) { const f = s / steps; push(c.L + ddl * f + (r() - 0.5) * 0.0012, c.la + (o.la - c.la) * f + (r() - 0.5) * 0.0012, 0.22 + 0.2 * r(), 0); }
      }
    }
    WORLD = window.__orbitWorld = { land, cloud, pts: new Float32Array(out) };
    return WORLD;
  };

  class Engine {
    constructor(canvas, o) {
      this.cv = canvas; this.host = canvas.parentElement; this.o = o || {};
      this.calm = this.o.mood !== 'intercept';
      this.ctx = canvas.getContext('2d');
      this.P = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, p: 0, on: false };
      this.reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
      this.hex = (this.o.hex || HEX).replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
      this.w = world();
      this.W = 0; this.H = 0; this.PX = 0; this.vis = true; this.hexI = 0;
      this.gap = this.o.gap || 32; this.noE = this.o.earth === false; this.force = false;
      this.burst = null; this.nextBurst = 6 + Math.random() * 3;
      this.scan = null; this.nextScan = 3.5;
      this.roll = null; this.nextRoll = 40 + Math.random() * 20;
      this.shoot = null; this.nextShoot = 5 + Math.random() * 6;
      this.resize();
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this.host);
      if (window.IntersectionObserver) { this.io = new IntersectionObserver((es) => { for (const e of es) this.vis = e.isIntersecting || !e.rootBounds || e.boundingClientRect.width === 0; }); this.io.observe(this.host); }
      this.t0 = performance.now(); this.last = -1;
      const loop = (now) => {
        if (this.dead) return;
        this.raf = requestAnimationFrame(loop);
        if (!this.vis) return;
        const t = Math.max(0, (now - this.t0) / 1000);
        if (t - this.last < (this.reduced ? 0.6 : 1 / 30)) return;
        this.last = t; this.frame(t);
      };
      this.raf = requestAnimationFrame(loop);
    }
    destroy() { this.dead = true; cancelAnimationFrame(this.raf); if (this.ro) this.ro.disconnect(); if (this.io) this.io.disconnect(); }
    setSat(x, y) { this.satCss = x == null ? null : { x, y }; }
    setGap(g) { this.gap = g || 32; if (this.t0) this.nextBurst = Math.min(this.nextBurst, (performance.now() - this.t0) / 1000 + this.gap); }
    setHex(h) { if (h) this.hex = h.replace(/[^0-9A-Fa-f]/g, '').toUpperCase(); }
    forceBurst() { this.force = true; if (this.burst) { this.burst.dur += 1.2; this.burst.strong = true; } else this.nextBurst = 0; }
    setHorizon(y) { if (y != null && this.hzCss != null && Math.abs(y - this.hzCss) < 3) return; this.hzCss = y; this.W = 0; this.resize(); }
    pointer(x, y) { const P = this.P; if (x == null) { P.on = false; return; } P.tx = x; P.ty = y; if (P.p < 0.05) { P.x = x; P.y = y; } P.on = true; }
    put(x, y, c) { if (x >= 0 && x < this.W && y >= 0 && y < this.H) this.buf[y * this.W + x] = c; }
    max(x, y, c) { if (x >= 0 && x < this.W && y >= 0 && y < this.H) { const i = y * this.W + x; if (rank(c) > rank(this.buf[i])) this.buf[i] = c; } }

    resize() {
      const cw = this.host.clientWidth, ch = this.host.clientHeight;
      if (!cw || !ch) return;
      const PX = Math.max(3, Math.round(cw / 380)), W = Math.ceil(cw / PX), H = Math.ceil(ch / PX);
      if (W === this.W && H === this.H && PX === this.PX) return;
      this.PX = PX; this.W = W; this.H = H;
      const cv = this.cv; cv.width = W; cv.height = H; cv.style.width = W * PX + 'px'; cv.style.height = H * PX + 'px';
      this.img = this.ctx.createImageData(W, H); this.buf = new Uint32Array(this.img.data.buffer);
      this.row = new Uint32Array(W); this.tmp = new Uint32Array(W * H);
      const pt = H > W * 1.05; this.pt = pt;
      const sc = Math.max(0.6, Math.min(W, H) / 225), defTop = H * (pt ? 0.77 : W / H > 1.75 ? 0.69 : 0.65);
      const top = this.noE ? H + 1e5 : Math.min(H * 0.86, Math.max(defTop, this.hzCss != null ? this.hzCss / PX + 10 * sc : 0));
      const R = W * (pt ? 1.3 : 1.1), cx = W * (pt ? 0.5 : 0.56), cy = top + R;
      Object.assign(this, { R, cx, cy, top, sc });
      const lim = new Float32Array(W);
      for (let x = 0; x < W; x++) { const dx = x + 0.5 - cx, q = R * R - dx * dx; lim[x] = q > 0 ? cy - Math.sqrt(q) : 1e9; }
      this.lim = lim;
      const y0 = Math.max(0, Math.floor(top)), cap = Math.max(1, (H - y0) * W);
      const di = new Int32Array(cap), dr = new Int32Array(cap), dp = new Float32Array(cap), dz = new Float32Array(cap), dt = new Float32Array(cap);
      let n = 0;
      for (let y = y0; y < H; y++) for (let x = 0; x < W; x++) {
        const nx = (x + 0.5 - cx) / R, ny = (y + 0.5 - cy) / R, q = 1 - nx * nx - ny * ny;
        if (q <= 0) continue;
        const nz = Math.sqrt(q), la = Math.asin(nx), ph = Math.atan2(ny, nz) + HALF;
        let j = Math.floor(((la + LAT) / (2 * LAT)) * TH); j = j < 0 ? 0 : j >= TH ? TH - 1 : j;
        di[n] = y * W + x; dr[n] = j * TW; dp[n] = (ph / PER) * TW; dz[n] = nz; dt[n] = thr(x, y); n++;
      }
      Object.assign(this, { dn: n, di, dr, dp, dz, dt });
      const r = rng(4242), st = [], cnt = Math.floor((W * H) / (this.noE ? 300 : 165));
      for (let k = 0; k < cnt; k++) {
        const x = Math.floor(r() * W), y = Math.floor(r() * H), b = Math.pow(r(), 2.3), ph = r() * TAU, rt = 0.5 + r() * 2.4;
        if (y >= lim[x] - 3) continue;
        st.push({ x, y, b, ph, rt });
      }
      this.st = st;
      const anc = [];
      for (let i = 0; i < st.length; i++) if (st[i].b > 0.28) anc.push(i);
      const D = 22 * this.sc + 6, cand = [];
      for (let a = 0; a < anc.length; a++) for (let b = a + 1; b < anc.length; b++) {
        const s = st[anc[a]], u = st[anc[b]], d = Math.hypot(s.x - u.x, s.y - u.y);
        if (d < D && d > 4) cand.push([d, anc[a], anc[b]]);
      }
      cand.sort((p, q) => p[0] - q[0]);
      const deg = new Uint8Array(st.length), pairs = [];
      for (const c of cand) { if (deg[c[1]] > 2 || deg[c[2]] > 2) continue; deg[c[1]]++; deg[c[2]]++; pairs.push(c[1], c[2]); }
      this.pairs = pairs;
      this.satB = pt ? { x: W * 0.72 - 7, y: top + Math.max(10, (H - top) * 0.28) } : { x: W * 0.8, y: H * 0.2 };
    }

    line(x0, y0, x1, y1, s) {
      const W = this.W, H = this.H, buf = this.buf, lim = this.lim, col = s > 0.5 ? PERI : COB;
      let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), err = dx + dy, k = 0;
      const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      for (;;) {
        if (x0 === x1 && y0 === y1) break;
        if (k > 1 && (k & 1) === 0 && x0 >= 0 && x0 < W && y0 >= 0 && y0 < H && y0 < lim[x0] - 3 && thr(x0, y0) < s * 1.6) buf[y0 * W + x0] = col;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
        k++;
      }
    }
    ellipse(x0, y0, rx, ry, c, every, soft) {
      const n = Math.max(12, Math.round((rx + ry) * 3.2)), lim = this.lim;
      for (let k = 0; k < n; k += every) {
        const a = (k / n) * TAU, x = Math.round(x0 + Math.cos(a) * rx), y = Math.round(y0 + Math.sin(a) * ry);
        if (x < 0 || x >= this.W || y < 0 || y >= this.H || y <= lim[x] + 1) continue;
        if (soft) this.max(x, y, c); else this.put(x, y, c);
      }
    }
    beam(x0, y0, x1, y1, t, on) {
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0))), pp = this.calm ? 3.2 : 2.2;
      for (let q = 3; q < n; q += 3) {
        if (on && Math.random() < 0.35) continue;
        const f = q / n;
        this.max(Math.round(x0 + (x1 - x0) * f), Math.round(y0 + (y1 - y0) * f), DEEP);
      }
      for (let k = 0; k < 2; k++) {
        const f = (t / pp + k / 2) % 1;
        for (let q = 0; q < 4; q++) {
          const ff = f - (q * 1.4) / n;
          if (ff < 0) continue;
          let x = Math.round(x0 + (x1 - x0) * ff);
          const y = Math.round(y0 + (y1 - y0) * ff);
          if (on) x += Math.round((Math.random() * 2 - 1) * 2);
          if (q === 0) this.put(x, y, on ? RED : BONE); else this.max(x, y, q === 1 ? PERI : COB);
        }
      }
    }
    sprite(x0, y0, on) {
      const rows = SAT.length, cols = SAT[0].length;
      const has = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols && SAT[r][c] !== '.';
      for (let r = -1; r <= rows; r++) for (let c = -1; c <= cols; c++) {
        if (has(r, c)) continue;
        if (has(r - 1, c) || has(r + 1, c) || has(r, c - 1) || has(r, c + 1)) this.put(x0 + c, y0 + r, K);
      }
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const ch = SAT[r][c];
        if (ch === '.') continue;
        let col = ch === 'p' || ch === 'B' ? COB : ch === 'P' || ch === '-' ? PERI : BONE;
        if (on && (ch === 'p' || ch === 'P') && Math.random() < 0.4) col = RED;
        this.put(x0 + c, y0 + r, col);
      }
    }

    updBurst(t) {
      if (this.calm || this.reduced) return null;
      let B = this.burst;
      if (B && t - B.t0 > B.dur) { this.burst = B = null; this.nextBurst = t + this.gap * (0.65 + Math.random() * 0.7); if (this.o.onBurst) this.o.onBurst(false); }
      if (!B && t > this.nextBurst) {
        const r = Math.random, W = this.W, H = this.H, sc = this.sc, F = this.force, strong = F || r() < 0.34;
        this.force = false;
        B = { t0: t, dur: F ? 1.6 : strong ? 0.5 + r() * 0.5 : 0.18 + r() * 0.3, strong, bands: [], blocks: [], iy: (r() * H * 0.7) | 0 };
        const nb = 2 + ((r() * (strong ? 6 : 3)) | 0);
        for (let k = 0; k < nb; k++) B.bands.push({ y: (r() * H) | 0, h: 1 + ((r() * 7 * sc) | 0), dx: Math.round((r() * 2 - 1) * 28 * sc), swap: r() < 0.45 });
        const nk = F ? 7 : 1 + ((r() * (strong ? 3 : 1.6)) | 0);
        for (let k = 0; k < nk; k++) {
          const cols = 4 + ((r() * 10) | 0), rows = 1 + ((r() * 2.2) | 0), bw = cols * 4 + 1, bh = rows * 6 + 1;
          B.blocks.push({ x: (r() * Math.max(1, W - bw)) | 0, y: (r() * Math.max(1, H - bh)) | 0, cols, rows, hx: this.hexI });
          this.hexI = (this.hexI + cols * rows) % this.hex.length;
        }
        this.burst = B;
        if (this.o.onBurst) this.o.onBurst(true, { strong });
      }
      return B;
    }

    post(t, B) {
      const W = this.W, H = this.H, N = W * H, buf = this.buf, row = this.row, r = Math.random;
      if (!this.reduced) {
        if (!this.scan && t > this.nextScan) this.scan = { t0: t, dur: 1.3 };
        const S = this.scan;
        if (S) {
          const e = (t - S.t0) / S.dur;
          if (e >= 1) { this.scan = null; this.nextScan = t + Math.max(9, this.gap * 0.5) + r() * 6; }
          else {
            const yy = Math.floor(e * (H + 12)) - 6;
            for (let y = Math.max(0, yy - 7); y <= Math.min(H - 1, yy + 1); y++) {
              const o = y * W;
              if (y < yy - 1) { const dx = (yy - y) & 1 ? 1 : 2; row.set(buf.subarray(o, o + W)); for (let x = 0; x < W; x++) buf[o + x] = row[(x - dx + W) % W]; continue; }
              for (let x = 0; x < W; x++) { const c = buf[o + x]; buf[o + x] = c === DEEP ? COB : c === COB ? PERI : c === PERI ? BONE : c === K && y === yy && (x & 1) === 0 ? DEEP : c; }
            }
          }
        }
        if (!this.roll && !B && t > this.nextRoll) this.roll = { t0: t, dur: 0.42 };
        const RL = this.roll;
        if (RL) {
          const e = (t - RL.t0) / RL.dur;
          if (e >= 1) { this.roll = null; this.nextRoll = t + this.gap * 2 + r() * this.gap; }
          else {
            const off = Math.floor(H * 0.6 * e) % H;
            this.tmp.set(buf);
            for (let y = 0; y < H; y++) { const s = (y + off) % H; buf.set(this.tmp.subarray(s * W, s * W + W), y * W); }
            const seam = (H - off) % H;
            for (let y = seam; y < Math.min(H, seam + 2); y++) for (let x = 0; x < W; x++) buf[y * W + x] = x % 3 === 0 ? DEEP : K;
          }
        }
      }
      const sn = (N * (t < 1.5 ? 0.06 * (1 - t / 1.5) : 0.0007)) | 0;
      for (let k = 0; k < sn; k++) buf[(r() * N) | 0] = r() < 0.7 ? DEEP : COB;
      if (!B) return;
      for (const b of B.bands) {
        const dx = b.dx + Math.round((r() * 2 - 1) * 2);
        for (let y = b.y; y < Math.min(H, b.y + b.h); y++) {
          const o = y * W;
          row.set(buf.subarray(o, o + W));
          for (let x = 0; x < W; x++) {
            let c = row[(((x - dx) % W) + W) % W];
            if (b.swap) c = c === COB ? RED : c === BONE ? PERI : c === PERI ? BONE : c === DEEP ? COB : c;
            buf[o + x] = c;
          }
        }
      }
      for (const k of B.blocks) {
        if (r() < 0.15) continue;
        const bw = k.cols * 4 + 1, bh = k.rows * 6 + 1;
        for (let y = k.y; y < Math.min(H, k.y + bh); y++) {
          for (let x = k.x; x < Math.min(W, k.x + bw); x++) buf[y * W + x] = K;
          if (k.x > 0) buf[y * W + k.x - 1] = RED;
        }
        let idx = k.hx;
        for (let rr = 0; rr < k.rows; rr++) for (let cc = 0; cc < k.cols; cc++) {
          const g = GL[this.hex[idx++ % this.hex.length]];
          if (!g) continue;
          const gx = k.x + 1 + cc * 4, gy = k.y + 1 + rr * 6, col = cc % 2 ? PERI : COB;
          for (let q = 0; q < g.length; q += 2) this.put(gx + g[q], gy + g[q + 1], col);
        }
      }
      if (B.strong && t - B.t0 < 0.08) {
        const y1 = Math.min(H, B.iy + ((H * 0.3) | 0));
        for (let i = B.iy * W; i < y1 * W; i++) { const c = buf[i]; buf[i] = c === K ? BONE : c === BONE ? K : c === DEEP ? PERI : c === PERI ? DEEP : c; }
      }
      const bs = (N * 0.008) | 0;
      for (let k = 0; k < bs; k++) buf[(r() * N) | 0] = r() < 0.5 ? COB : r() < 0.5 ? PERI : DEEP;
    }

    frame(t) {
      const W = this.W, H = this.H;
      if (!W) return;
      const buf = this.buf, w = this.w, calm = this.calm, sc = this.sc, lim = this.lim, R = this.R, cx = this.cx, cy = this.cy, P = this.P, PX = this.PX;
      P.x += (P.tx - P.x) * 0.3; P.y += (P.ty - P.y) * 0.3; P.p += ((P.on ? 1 : 0) - P.p) * 0.14;
      const B = this.updBurst(t), on = !!B;
      buf.fill(K);
      const theta = -t * (calm ? 0.0075 : 0.011), thN = (theta / PER) * TW, clN = ((theta * 1.3 - t * 0.0016) / PER) * TW;
      const land = w.land, cloud = w.cloud, di = this.di, dr = this.dr, dp = this.dp, dz = this.dz, dt = this.dt;
      for (let n = 0; n < this.dn; n++) {
        let u = (dp[n] + thN) % TW; if (u < 0) u += TW;
        let uc = (dp[n] + clN) % TW; if (uc < 0) uc += TW;
        const lv = land[dr[n] + (u | 0)], cl = cloud[dr[n] + (uc | 0)] - 0.56, e = 1 - dz[n], e2 = e * e, e5 = e2 * e2 * e;
        let v = lv > 0.53 ? 0.04 + (lv - 0.53) * 0.42 : 0.008;
        if (cl > 0) v += cl * 0.55;
        v += 0.36 * e5 * e5;
        buf[di[n]] = ramp(v, dt[n]);
      }
      const sb = this.satCss ? { x: this.satCss.x / PX - 7, y: this.satCss.y / PX - 2 } : this.satB;
      const sx = Math.round(sb.x + Math.sin(t * 0.05) * 3 * sc), sy = Math.round(sb.y + Math.sin(t * 0.083 + 1) * 2 * sc);
      const fx = Math.max(4, Math.min(W - 5, Math.round(sx + 7 - W * (this.pt ? 0.14 : 0.1))));
      const fy = Math.round(Math.max(lim[fx] + Math.max(8, H * 0.08), sy + 16)), frx = Math.max(10, W * (this.pt ? 0.14 : 0.075)), fry = Math.max(3, frx * 0.24);
      const pts = w.pts, np = this.noE ? 0 : pts.length;
      for (let k = 0; k < np; k += 6) {
        let ph = (pts[k] - theta) % PER; if (ph < 0) ph += PER;
        if (ph >= HALF) continue;
        const ca = pts[k + 1], nz = ca * Math.sin(ph);
        const y = Math.floor(cy - ca * Math.cos(ph) * R); if (y < 0 || y >= H) continue;
        const x = Math.floor(cx + pts[k + 2] * R); if (x < 0 || x >= W) continue;
        let uc = ((ph / PER) * TW + clN) % TW; if (uc < 0) uc += TW;
        const cv = cloud[pts[k + 5] * TW + (uc | 0)];
        const att = cv > 0.56 ? Math.max(0.12, 1 - (cv - 0.56) * 4.5) : 1, kk = k / 6;
        let vis = pts[k + 3] * att * (0.8 + 0.2 * Math.sin(t * (1.1 + (kk % 7) * 0.37) + kk)) * Math.min(1, 0.16 + nz * 2.3);
        const ex = (x - fx) / frx, ey = (y - fy) / fry;
        if (ex * ex + ey * ey < 1) vis = Math.min(1, vis * 1.45 + 0.12);
        const i = y * W + x, c = lramp(vis * 1.15, thr(x, y));
        if (rank(c) > rank(buf[i])) buf[i] = c;
        if (pts[k + 4] > 1 && vis > 0.45) {
          const hc = lramp(vis * 0.45, thr(x + 1, y));
          this.max(x - 1, y, hc); this.max(x + 1, y, hc); this.max(x, y - 1, hc); this.max(x, y + 1, hc);
        }
      }
      const px = P.x / PX, py = P.y / PX, pres = P.p, RC = 40 * sc + 10, st = this.st;
      for (let k = 0; k < st.length; k++) {
        const s = st[k];
        if (s.y >= lim[s.x] - 3) continue;
        let v = s.b * (0.68 + 0.32 * Math.sin(t * s.rt + s.ph));
        if (pres > 0.02) { const d = Math.hypot(s.x - px, s.y - py); if (d < RC) v = Math.min(1, v + (1 - d / RC) * pres * 0.55); }
        const c = v > 0.74 ? BONE : v > 0.48 ? PERI : v > 0.24 ? COB : v > 0.14 ? DEEP : K;
        if (c === K) continue;
        buf[s.y * W + s.x] = c;
        if (s.b > 0.93 && v > 0.8) { this.max(s.x - 1, s.y, COB); this.max(s.x + 1, s.y, COB); this.max(s.x, s.y - 1, COB); this.max(s.x, s.y + 1, COB); }
      }
      if (pres > 0.02) {
        const pr = this.pairs;
        let best = null, bd = 1e9;
        for (let k = 0; k < pr.length; k += 2) {
          const a = st[pr[k]], b = st[pr[k + 1]];
          if (a.y >= lim[a.x] - 3 || b.y >= lim[b.x] - 3) continue;
          const d = Math.hypot((a.x + b.x) / 2 - px, (a.y + b.y) / 2 - py);
          if (d > RC) continue;
          const s = (1 - d / RC) * pres;
          this.line(a.x, a.y, b.x, b.y, s);
          if (s > 0.25) { buf[a.y * W + a.x] = BONE; buf[b.y * W + b.x] = BONE; }
        }
        for (let k = 0; k < st.length; k++) { const s = st[k]; if (s.b < 0.28 || s.y >= lim[s.x] - 3) continue; const d = Math.hypot(s.x - px, s.y - py); if (d < bd) { bd = d; best = s; } }
        if (best && bd < RC * 0.6) { const c = pres > 0.5 ? PERI : COB; this.put(best.x - 3, best.y, c); this.put(best.x + 3, best.y, c); this.put(best.x, best.y - 3, c); this.put(best.x, best.y + 3, c); }
      }
      if (calm && !this.reduced) {
        if (!this.shoot && t > this.nextShoot) { const r = Math.random; this.shoot = { t0: t, x: W * (0.3 + r() * 0.65), y: H * (0.04 + r() * 0.28), vx: -(0.9 + r() * 0.6), vy: 0.35 + r() * 0.25 }; }
        const S = this.shoot;
        if (S) {
          const e = (t - S.t0) / 0.85;
          if (e >= 1) { this.shoot = null; this.nextShoot = t + 8 + Math.random() * 14; }
          else {
            const len = Math.hypot(S.vx, S.vy), ux = S.vx / len, uy = S.vy / len, hx = S.x + ux * e * 70 * sc, hy = S.y + uy * e * 70 * sc, n = Math.round(12 * sc), fade = Math.sin(Math.PI * e);
            for (let q = 0; q < n; q++) {
              const x = Math.round(hx - ux * q), y = Math.round(hy - uy * q);
              if (x < 0 || x >= W || y < 0 || y >= H || y >= lim[x] - 3) continue;
              this.max(x, y, ramp((0.3 + 0.75 * (1 - q / n)) * fade, thr(x, y)));
            }
          }
        }
      }
      const ax = W * (this.pt ? 0.36 : 0.3), aw = W * (this.pt ? 0.3 : 0.15), a2 = W * 0.72, aw2 = W * 0.06;
      for (let x = 0; x < W; x++) {
        const g = (x - ax) / aw, g2 = (x - a2) / aw2;
        const env = Math.exp(-g * g) * (0.8 + 0.2 * Math.sin(t * 0.11 + x * 0.013)) + 0.3 * Math.exp(-g2 * g2) * (0.55 + 0.45 * Math.sin(t * 0.07 + 2));
        if (env < 0.03) continue;
        const ly = lim[x];
        if (ly > H + 40) continue;
        const xs = x / sc;
        const base = ly - (4 + 5 * Math.sin(xs * 0.035 + t * 0.12) + 4 * vn3(xs * 0.07, t * 0.1, 1.7)) * sc;
        const hh = (14 + 26 * vn3(xs * 0.03 + 3.1, t * 0.045, 4.2)) * sc;
        const yt = Math.max(0, Math.floor(base - hh)), yb = Math.min(H - 1, Math.ceil(base + 1.5 * sc));
        for (let y = yt; y <= yb; y++) {
          const d = (base - y) / hh;
          let pf;
          if (d < 0) pf = 1 + (d * hh) / (1.5 * sc);
          else if (d < 0.08) pf = 0.75 + d * 3.1;
          else { const q = 1 - (d - 0.08) / 0.92; pf = q * Math.sqrt(q); }
          if (pf <= 0) continue;
          const rn = vn3((xs + (d * hh * 0.15) / sc) * 0.42 + t * 0.25, t * 0.15 + d * 0.6, 7.7), ray = rn < 0.38 ? 0 : (rn - 0.38) / 0.62;
          const v = env * pf * (d < 0.1 ? 0.8 + 0.5 * ray : 0.14 + ray * 1.2);
          if (v < 0.015) continue;
          const i = y * W + x, c = ramp(v, thr(x, y));
          if (rank(c) > rank(buf[i])) buf[i] = c;
        }
      }
      for (let x = 0; x < W; x++) {
        const ly = lim[x];
        if (ly > H + 8) continue;
        const ya = Math.max(0, Math.floor(ly - 7 * sc)), yb = Math.min(H - 1, Math.floor(ly));
        for (let y = ya; y <= yb; y++) {
          const d = ly - (y + 0.5), q = (d - 0.9 * sc) / (1.05 * sc);
          const v = 0.6 * Math.exp(-q * q) + 0.1 * Math.exp(-d / (3.4 * sc));
          if (v < 0.07) continue;
          const i = y * W + x, c = ramp(v, thr(x, y));
          if (rank(c) > rank(buf[i])) buf[i] = c;
        }
      }
      if (!this.noE) {
      this.beam(sx + 7, sy + 5, fx, fy, t, on);
      this.ellipse(fx, fy, frx, fry, on ? RED : COB, 2, false);
      const pp = calm ? 3.2 : 2.2, pe = ((t / pp) * 2) % 1;
      if (pe < 0.85) this.ellipse(fx, fy, frx * (0.2 + pe), fry * (0.2 + pe), pe < 0.3 ? PERI : pe < 0.6 ? COB : DEEP, 3, true);
      this.sprite(sx, sy, on);
      }
      if (!calm) this.post(t, B);
      if (t < 1.6) { const f = t / 1.6; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (thr(x, y) > f) buf[y * W + x] = K; }
      this.ctx.putImageData(this.img, 0, 0);
      if (this.o.onFrame) this.o.onFrame({ x: sx * PX, y: sy * PX, w: SAT[0].length * PX, h: SAT.length * PX, fx: fx * PX, fy: fy * PX, burst: on });
    }
  }

  window.OrbitArt = Object.assign(window.OrbitArt || {}, { create: (canvas, opts) => (window.OrbitArt.last = new Engine(canvas, opts)) });
})();
