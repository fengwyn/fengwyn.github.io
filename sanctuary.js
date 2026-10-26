/* Sanctuary sky: dithered deep space, faint Milky Way, floating hex glyphs, a cross constellation built by progress.
   window.SanctuaryArt.create(canvas, { hex, milky, shooting, glyphs, onLayout(stars) }) */
(() => {
  const B8 = [0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21];
  const THR = new Float32Array(64);
  for (let i = 0; i < 64; i++) THR[i] = (B8[i] + 0.5) / 64;
  const p32 = (r, g, b) => (0xff000000 | (b << 16) | (g << 8) | r) >>> 0;
  const K = p32(0, 0, 0), DEEP = p32(20, 30, 112), COB = p32(31, 59, 255), PERI = p32(168, 180, 245), BONE = p32(232, 226, 207);
  const rank = (c) => (c === BONE ? 4 : c === PERI ? 3 : c === COB ? 2 : c === DEEP ? 1 : 0);
  const RAMP = [K, DEEP, COB, BONE];
  const ramp = (v, t) => { if (v <= 0) return K; if (v >= 1) return BONE; const s = v * 3, i = s | 0; return s - i > t ? RAMP[i + 1] : RAMP[i]; };
  const thr = (x, y) => THR[(x & 7) | ((y & 7) << 3)];
  const TAU = Math.PI * 2;
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

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

  const GS = { '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001', '5': '111100111001111', '6': '111100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001111', A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', x: '000101010101000' };
  const GL = {};
  for (const k in GS) { const s = GS[k], a = []; for (let i = 0; i < 15; i++) if (s[i] === '1') a.push(i % 3, (i / 3) | 0); GL[k] = a; }

  // Cross nodes in unit space: u across (-0.5..0.5 of width), v down (0..1 of height). Slight jitter reads as a real constellation.
  const NODES = [[0, 0], [0, 0.29], [-0.5, 0.305], [-0.245, 0.285], [0.25, 0.3], [0.49, 0.287], [0.012, 0.525], [-0.008, 0.76], [0.004, 1]];
  const STROKES = [[0, 1, 0, 0.2], [1, 6, 0.2, 0.34], [6, 7, 0.34, 0.48], [7, 8, 0.48, 0.62], [1, 3, 0.62, 0.81], [3, 2, 0.81, 1], [1, 4, 0.62, 0.81], [4, 5, 0.81, 1]];
  const LIT = [0.004, 0.2, 1, 0.81, 0.81, 1, 0.34, 0.48, 0.62];

  class Sky {
    constructor(canvas, o) {
      this.cv = canvas; this.o = o || {}; this.ctx = canvas.getContext('2d');
      this.reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
      this.hex = (this.o.hex || '536F6C692044656F20676C6F726961').replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
      this.milky = this.o.milky !== false; this.shooting = this.o.shooting !== false; this.glyphsOn = this.o.glyphs !== false;
      this.P = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, p: 0, on: false };
      this.p = 0; this.pT = 0; this.hot = -1; this.crossCss = null; this.moving = 0;
      this.W = 0; this.H = 0; this.PX = 0;
      this.shoot = null; this.nextShoot = 12 + Math.random() * 14;
      this.resize();
      this.onResize = () => this.resize();
      window.addEventListener('resize', this.onResize);
      this.t0 = performance.now(); this.last = -1;
      const loop = (now) => {
        if (this.dead) return;
        this.raf = requestAnimationFrame(loop);
        const t = Math.max(0, (now - this.t0) / 1000);
        if (t - this.last < (this.reduced ? 0.1 : 1 / 30)) return;
        this.last = t; this.frame(t);
      };
      this.raf = requestAnimationFrame(loop);
    }
    destroy() { this.dead = true; cancelAnimationFrame(this.raf); window.removeEventListener('resize', this.onResize); }
    pointer(x, y) { const P = this.P; if (x == null) { P.on = false; return; } P.tx = x; P.ty = y; if (P.p < 0.05) { P.x = x; P.y = y; } P.on = true; }
    setProgress(p) { this.pT = clamp01(p); if (this.reduced) this.p = this.pT; }
    setHot(i) { this.hot = i == null ? -1 : i; }
    setOpts(o) {
      if ('milky' in o && o.milky !== this.milky) { this.milky = o.milky; this.buildStatic(); }
      if ('shooting' in o) this.shooting = o.shooting;
      if ('glyphs' in o) this.glyphsOn = o.glyphs;
    }
    setKeepOut(r) {
      const k = this.keepCss;
      if (!r) { if (k) { this.keepCss = null; this.buildGlyphs(); } return; }
      if (k && Math.abs(k.x - r.x) < 2 && Math.abs(k.y - r.y) < 2 && Math.abs(k.w - r.w) < 2 && Math.abs(k.h - r.h) < 2) return;
      this.keepCss = { x: r.x, y: r.y, w: r.w, h: r.h };
      if (this.W) this.buildGlyphs();
    }
    setCross(r) {
      const c = this.crossCss;
      if (c && Math.abs(c.x - r.x) < 1 && Math.abs(c.y - r.y) < 1 && Math.abs(c.w - r.w) < 1 && Math.abs(c.h - r.h) < 1) return;
      this.crossCss = { x: r.x, y: r.y, w: r.w, h: r.h };
      this.layoutCross();
    }
    put(x, y, c) { if (x >= 0 && x < this.W && y >= 0 && y < this.H) this.buf[y * this.W + x] = c; }
    max(x, y, c) { if (x >= 0 && x < this.W && y >= 0 && y < this.H) { const i = y * this.W + x; if (rank(c) > rank(this.buf[i])) this.buf[i] = c; } }

    resize() {
      const cw = window.innerWidth, ch = window.innerHeight;
      if (!cw || !ch) return;
      const PX = Math.max(3, Math.round(cw / 380)), W = Math.ceil(cw / PX), H = Math.ceil(ch / PX);
      if (PX === this.PX && W === this.W && H <= this.H && this.H - H < this.H * 0.25) return;
      this.PX = PX; this.W = W; this.H = H;
      const cv = this.cv; cv.width = W; cv.height = H; cv.style.width = W * PX + 'px'; cv.style.height = H * PX + 'px';
      this.img = this.ctx.createImageData(W, H); this.buf = new Uint32Array(this.img.data.buffer); this.base = new Uint32Array(W * H);
      this.sc = Math.max(0.7, Math.min(W, H) / 200);
      this.layoutCross();
    }

    layoutCross() {
      if (!this.W) return;
      const PX = this.PX, r = this.crossCss || { x: 0, y: 0, w: window.innerWidth / 2, h: window.innerHeight };
      const bw = r.w / PX, bh = r.h / PX, asp = Math.min(0.8, Math.max(0.6, (bw / bh) * 0.7));
      let chh = Math.min(bh, bw / asp);
      chh = Math.max(24, chh);
      const cww = chh * asp, cx = r.x / PX + bw / 2, y0 = r.y / PX + (bh - chh) / 2;
      this.nodes = NODES.map(([u, v]) => ({ x: Math.round(cx + u * cww), y: Math.round(y0 + v * chh) }));
      this.cbox = { x0: cx - cww / 2 - 8, x1: cx + cww / 2 + 8, y0: y0 - 8, y1: y0 + chh + 8 };
      this.buildStatic();
      this.buildGlyphs();
      if (this.o.onLayout) this.o.onLayout(this.nodes.map((n) => ({ x: (n.x + 0.5) * PX, y: (n.y + 0.5) * PX })));
    }

    buildStatic() {
      const W = this.W, H = this.H, base = this.base, nodes = this.nodes;
      if (!base || !nodes) return;
      const r = rng(9157);
      base.fill(K);
      const cb = this.cbox, a = -1.02, dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx, sg = Math.max(W, H) * 0.1;
      const C = { x: cb.x0 + (cb.x1 - cb.x0) * 0.5 - (cb.x1 - cb.x0) * 0.62, y: nodes[1].y };
      const near = (x, y, d) => { for (const n of nodes) if (Math.abs(n.x - x) <= d && Math.abs(n.y - y) <= d) return true; return false; };
      if (this.milky) {
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const ox = x - C.x, oy = y - C.y, d = ox * nx + oy * ny;
          const g = Math.exp(-(d * d) / (sg * sg));
          if (g < 0.04) continue;
          const s = ox * dx + oy * dy, m = fbm(x * 0.045 + 3.1, y * 0.045 + 7.7, 1.3, 4);
          const q = (d + sg * 0.12 + Math.sin(s * 0.03) * sg * 0.12) / (sg * 0.2);
          const rift = Math.exp(-q * q) * (0.5 + 0.5 * fbm(s * 0.05, d * 0.05, 9.1, 3));
          const dens = g * (0.25 + 0.95 * m * m) * (1 - 0.85 * rift);
          let qd = 1e9;
          for (const nd of nodes) { const ex = x - nd.x, ey = y - nd.y, dd = ex * ex + ey * ey; if (dd < qd) qd = dd; }
          const calm = Math.min(1, Math.sqrt(qd) / 9);
          const dv = dens * calm * calm;
          if (h3(x, y, 5) < dv * 0.05) base[y * W + x] = DEEP;
          const hh = h3(x, y, 77);
          if (hh < dv * 0.028) base[y * W + x] = hh < dv * 0.004 ? PERI : COB;
        }
      }
      const st = [], cnt = Math.floor((W * H) / 190);
      for (let k = 0; k < cnt; k++) {
        const x = Math.floor(r() * W), y = Math.floor(r() * H), b = Math.pow(r(), 2.6);
        if (near(x, y, 3)) continue;
        st.push({ x, y, b });
      }
      for (const s of st) {
        base[s.y * W + s.x] = s.b > 0.8 ? BONE : s.b > 0.5 ? PERI : s.b > 0.2 ? COB : DEEP;
        if (s.b > 0.94) for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const xx = s.x + ox, yy = s.y + oy;
          if (xx >= 0 && xx < W && yy >= 0 && yy < H && rank(base[yy * W + xx]) < 2) base[yy * W + xx] = COB;
        }
      }
      this.st = st;
      const anc = [];
      for (let i = 0; i < st.length; i++) if (st[i].b > 0.25) anc.push(i);
      const D = 20 * this.sc + 6, cand = [];
      for (let i = 0; i < anc.length; i++) for (let j = i + 1; j < anc.length; j++) {
        const s = st[anc[i]], u = st[anc[j]], d = Math.hypot(s.x - u.x, s.y - u.y);
        if (d < D && d > 4) cand.push([d, anc[i], anc[j]]);
      }
      cand.sort((p, q) => p[0] - q[0]);
      const deg = new Uint8Array(st.length), pairs = [];
      for (const c of cand) { if (deg[c[1]] > 2 || deg[c[2]] > 2) continue; deg[c[1]]++; deg[c[2]]++; pairs.push(c[1], c[2]); }
      this.pairs = pairs;
    }

    buildGlyphs() {
      const W = this.W, H = this.H, r = rng(3301), G = [], hx = this.hex, bytes = Math.max(1, hx.length >> 1), PX = this.PX, nodes = this.nodes;
      if (!nodes) return;
      const ko = this.keepCss ? { x0: this.keepCss.x / PX - 14, y0: this.keepCss.y / PX - 6, x1: (this.keepCss.x + this.keepCss.w) / PX + 4, y1: (this.keepCss.y + this.keepCss.h) / PX + 6 } : null;
      const pts = [];
      for (const [a, b] of STROKES) {
        const A = nodes[a], B = nodes[b], m = Math.max(1, Math.abs(B.x - A.x), Math.abs(B.y - A.y));
        for (let k = 0; k <= m; k += 2) pts.push(A.x + ((B.x - A.x) * k) / m, A.y + ((B.y - A.y) * k) / m);
      }
      for (const nd of nodes) pts.push(nd.x, nd.y);
      const n = Math.max(4, Math.min(8, Math.round((W * H) / 9000)));
      for (let tries = 0; G.length < n && tries < 1500; tries++) {
        const amp = 2 + r() * 4, dir = r() < 0.5 ? 0 : 1;
        const gx = 2 + Math.floor(r() * Math.max(1, W - 23)), gy = 2 + Math.floor(r() * Math.max(1, H - 13));
        const bx0 = gx - (dir ? 0 : amp) - 6, bx1 = gx + 19 + (dir ? 0 : amp) + 6, by0 = gy - (dir ? amp : 0) - 6, by1 = gy + 9 + (dir ? amp : 0) + 6;
        if (bx0 < 0 || by0 < 0 || bx1 > W || by1 > H) continue;
        if (ko && bx1 > ko.x0 && bx0 < ko.x1 && by1 > ko.y0 && by0 < ko.y1) continue;
        let hit = false;
        for (let q = 0; q < pts.length; q += 2) if (pts[q] > bx0 && pts[q] < bx1 && pts[q + 1] > by0 && pts[q + 1] < by1) { hit = true; break; }
        if (hit) continue;
        if (G.some((g) => Math.abs(g.x - gx) < 32 && Math.abs(g.y - gy) < 20)) continue;
        const bi = ((G.length * 23) % bytes) * 2;
        G.push({ x: gx, y: gy, dir, amp, sp: 0.04 + r() * 0.06, ph: r() * TAU, dp: 0.5 + r(), b: hx.substr(bi, 2), lo: G.length % 4 !== 1 });
      }
      this.glyphs = G;
    }

    glyph(g, x0, y0) {
      for (let x = 0; x < 19; x += 2) { this.max(x0 + x, y0, DEEP); this.max(x0 + x, y0 + 8, DEEP); }
      for (let y = 2; y < 8; y += 2) { this.max(x0, y0 + y, DEEP); this.max(x0 + 18, y0 + y, DEEP); }
      const s = '0x' + g.b;
      for (let i = 0; i < 4; i++) {
        const gl = GL[s[i]];
        if (!gl) continue;
        const col = i < 2 || g.lo ? DEEP : COB, gx = x0 + 2 + i * 4, gy = y0 + 2;
        for (let q = 0; q < gl.length; q += 2) this.max(gx + gl[q], gy + gl[q + 1], col);
      }
    }

    link(x0, y0, x1, y1, s) {
      const col = s > 0.5 ? PERI : COB;
      let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), err = dx + dy, k = 0;
      const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      for (;;) {
        if (x0 === x1 && y0 === y1) break;
        if (k > 1 && (k & 1) === 0 && thr(x0, y0) < s * 1.6) this.max(x0, y0, col);
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
        k++;
      }
    }

    stroke(A, B, f, px, py, pres, RC) {
      const n = Math.max(1, Math.abs(B.x - A.x), Math.abs(B.y - A.y)), gap = 3;
      const head = f > 0 && f < 1 && this.moving > 0.1 ? Math.round(f * n) : -1;
      for (let k = gap; k <= n - gap; k++) {
        const x = Math.round(A.x + ((B.x - A.x) * k) / n), y = Math.round(A.y + ((B.y - A.y) * k) / n);
        let near = 0;
        if (pres > 0.02) { const d = Math.hypot(x - px, y - py); if (d < RC) near = (1 - d / RC) * pres; }
        if (k / n <= f) { if ((k & 1) === 0) this.max(x, y, near > 0.45 ? BONE : k % 4 === 0 || near > 0.15 ? PERI : COB); }
        else if (k % 4 === 0) this.max(x, y, near > 0.3 ? COB : DEEP);
        if (k === head) this.put(x, y, BONE);
      }
    }

    ring(x0, y0, r, c) {
      const n = Math.max(12, Math.round(r * 6.3));
      for (let k = 0; k < n; k += 2) { const a = (k / n) * TAU; this.max(Math.round(x0 + Math.cos(a) * r), Math.round(y0 + Math.sin(a) * r), c); }
    }

    node(n, i, t, px, py, pres, RC) {
      const lit = this.p >= LIT[i], hot = i === this.hot;
      let near = 0;
      if (pres > 0.02) { const d = Math.hypot(n.x - px, n.y - py); if (d < RC) near = (1 - d / RC) * pres; }
      const tw = this.reduced ? 0 : Math.sin(t * 0.8 + i * 1.9);
      let arm = lit ? 2 : 1;
      if (lit && tw > 0.55) arm++;
      if (i === 1) arm++;
      if (near > 0.35) arm++;
      if (hot) arm += 2;
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) this.put(n.x + ox, n.y + oy, K);
      this.put(n.x, n.y, lit || hot || near > 0.5 ? BONE : PERI);
      for (let k = 1; k <= arm; k++) {
        const c = k === 1 ? (lit || hot ? PERI : COB) : k < arm ? COB : DEEP;
        this.max(n.x + k, n.y, c); this.max(n.x - k, n.y, c); this.max(n.x, n.y + k, c); this.max(n.x, n.y - k, c);
      }
      if ((lit && i === 1) || hot) { const c = hot ? PERI : COB; this.max(n.x + 1, n.y + 1, c); this.max(n.x - 1, n.y + 1, c); this.max(n.x + 1, n.y - 1, c); this.max(n.x - 1, n.y - 1, c); }
      if (hot) this.ring(n.x, n.y, Math.round(5 + 2 * this.sc), COB);
    }

    frame(t) {
      const W = this.W, H = this.H;
      if (!W || !this.nodes) return;
      const buf = this.buf, P = this.P, PX = this.PX, sc = this.sc, nodes = this.nodes;
      P.x += (P.tx - P.x) * 0.3; P.y += (P.ty - P.y) * 0.3; P.p += ((P.on ? 1 : 0) - P.p) * 0.14;
      const dp = this.pT - this.p;
      this.p += this.reduced ? dp : dp * 0.09;
      if (Math.abs(this.pT - this.p) < 0.0005) this.p = this.pT;
      this.moving = Math.abs(dp) > 0.002 ? 1 : Math.max(0, this.moving - 0.08);
      buf.set(this.base);
      const px = P.x / PX, py = P.y / PX, pres = P.p, RC = 34 * sc + 8;
      if (pres > 0.02) {
        const st = this.st, pr = this.pairs;
        for (let k = 0; k < pr.length; k += 2) {
          const a = st[pr[k]], b = st[pr[k + 1]], d = Math.hypot((a.x + b.x) / 2 - px, (a.y + b.y) / 2 - py);
          if (d > RC) continue;
          const s = (1 - d / RC) * pres;
          this.link(a.x, a.y, b.x, b.y, s);
          if (s > 0.25) { this.put(a.x, a.y, BONE); this.put(b.x, b.y, BONE); }
        }
        for (const s of st) {
          const d = Math.hypot(s.x - px, s.y - py);
          if (d >= RC) continue;
          const v = Math.min(1, s.b + (1 - d / RC) * pres * 0.6);
          this.max(s.x, s.y, v > 0.74 ? BONE : v > 0.48 ? PERI : v > 0.24 ? COB : DEEP);
        }
      }
      if (this.glyphsOn && this.glyphs) {
        const on = pres > 0.02, mx = on ? (px - W / 2) / (W / 2) : 0, my = on ? (py - H / 2) / (H / 2) : 0;
        for (const g of this.glyphs) {
          const o = this.reduced ? 0 : Math.sin(t * g.sp * TAU + g.ph) * g.amp;
          this.glyph(g, Math.round(g.x + (g.dir ? 0 : o) + mx * g.dp * 3 * pres), Math.round(g.y + (g.dir ? o : 0) + my * g.dp * 2 * pres));
        }
      }
      if (this.shooting && !this.reduced) {
        if (!this.shoot && t > this.nextShoot) { const r = Math.random; this.shoot = { t0: t, x: W * (0.15 + r() * 0.8), y: H * (0.04 + r() * 0.4), vx: (0.9 + r() * 0.6) * (r() < 0.5 ? -1 : 1), vy: 0.35 + r() * 0.25 }; }
        const S = this.shoot;
        if (S) {
          const e = (t - S.t0) / 0.9;
          if (e >= 1) { this.shoot = null; this.nextShoot = t + 24 + Math.random() * 30; }
          else {
            const len = Math.hypot(S.vx, S.vy), ux = S.vx / len, uy = S.vy / len, hx = S.x + ux * e * 70 * sc, hy = S.y + uy * e * 70 * sc, n = Math.round(12 * sc), fade = Math.sin(Math.PI * e);
            for (let q = 0; q < n; q++) {
              const x = Math.round(hx - ux * q), y = Math.round(hy - uy * q);
              if (x < 0 || x >= W || y < 0 || y >= H) continue;
              this.max(x, y, ramp((0.3 + 0.75 * (1 - q / n)) * fade, thr(x, y)));
            }
          }
        }
      }
      for (const [a, b, p0, p1] of STROKES) this.stroke(nodes[a], nodes[b], clamp01((this.p - p0) / (p1 - p0)), px, py, pres, RC);
      for (let i = 0; i < nodes.length; i++) this.node(nodes[i], i, t, px, py, pres, RC);
      if (t < 1.6) { const f = t / 1.6; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (thr(x, y) > f) buf[y * W + x] = K; }
      this.ctx.putImageData(this.img, 0, 0);
    }
  }

  window.SanctuaryArt = Object.assign(window.SanctuaryArt || {}, { create: (canvas, opts) => (window.SanctuaryArt.last = new Sky(canvas, opts)) });
})();
