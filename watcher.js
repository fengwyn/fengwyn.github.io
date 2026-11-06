/* Watcher: a pixel-art eye scanning over dithered mountains, under the same sky as the hero.
   window.WatcherArt.create(canvas, { wrap, palette, glitch, trackCursor, resolution })

   Extracted from Watcher/WatcherBanner.dc.html so index.html and the standalone
   preview share one copy. The drawing is unchanged; only prop/ref access differs,
   plus an IntersectionObserver so the per-pixel loop idles while off screen. */
(() => {
  const PAL = {
    'Cobalt': ['#000000', '#1f3bff', '#e8e2cf', '#e8e2cf', '#1f3bff', '#e8e2cf', '#1f3bff', '#e0303a', '#6e0f17'],
    'Signal red': ['#000000', '#76111a', '#e0303a', '#e0303a', '#76111a', '#e0303a', '#76111a', '#ff4a4f', '#76111a'],
    'Cobalt + red eye': ['#000000', '#1f3bff', '#e8e2cf', '#e0303a', '#8c1620', '#e0303a', '#8c1620', '#e0303a', '#6e0f17'],
  };
  const RES = { Coarse: 320, Native: 430, Fine: 540 };

  class Watcher {
    constructor(canvas, o) {
      this.cv = canvas; this.o = o || {}; this.wrap = this.o.wrap || canvas.parentNode;
      this.rm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      this.t = 0; this.last = performance.now(); this.lastDraw = 0;
      this.ptr = { x: 0, y: 0, t: -99 };
      this.vis = true;
      this.onPtr = (e) => { this.ptr.x = e.clientX; this.ptr.y = e.clientY; this.ptr.t = this.t; };
      window.addEventListener('pointermove', this.onPtr, { passive: true });
      if (window.ResizeObserver && this.wrap) { this.ro = new ResizeObserver(() => this.fit()); this.ro.observe(this.wrap); }
      // the per-pixel loop is expensive; idle it whenever the scene is off screen
      if (window.IntersectionObserver && this.wrap) {
        this.io = new IntersectionObserver((es) => { this.vis = es[0].isIntersecting; }, { rootMargin: '240px' });
        this.io.observe(this.wrap);
      }
      this.setup();
      const loop = (now) => { this.raf = requestAnimationFrame(loop); this.frame(now); };
      this.raf = requestAnimationFrame(loop);
    }
    setOpts(o) {
      const prev = this.o.resolution;
      Object.assign(this.o, o || {});
      if (this.o.resolution !== prev) this.setup();
    }
    destroy() {
      this.dead = true;
      cancelAnimationFrame(this.raf);
      window.removeEventListener('pointermove', this.onPtr);
      if (this.ro) this.ro.disconnect();
      if (this.io) this.io.disconnect();
    }

    h(x, y, s) { let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16; return (n >>> 0) / 4294967296; }

    setup() {
      this.W = RES[this.o.resolution] || 430; this.H = Math.round(this.W * 18 / 43);
      this.build();
      this.off = document.createElement('canvas'); this.off.width = this.W; this.off.height = this.H;
      this.octx = this.off.getContext('2d'); this.img = this.octx.createImageData(this.W, this.H); this.u32 = new Uint32Array(this.img.data.buffer);
      const N = this.W * this.H; this.buf = new Uint8Array(N); this.tmp = new Uint8Array(N); this.reg = new Uint8Array(N);
      const t = this.t;
      this.gz = { yaw: 0, pitch: 0, fy: 0, fp: 0, ty: 0, tp: 0, t0: t, dur: 0.01, ease: 0, holdUntil: t + 1.2, focus: 0, tracking: false };
      this.bl = { next: t + 2.5 + Math.random() * 3, start: -9, dur: 0.2 };
      this.gl = { next: t + 1.6, active: false, end: 0, nextStep: 0, ops: [], eyeDx: 0, dyaw: 0, dpitch: 0, pupilScale: 1, ghost: null, phiJ: 0 };
      this.parts = []; this.emitAcc = 0; this._palName = null; this.lastDraw = 0;
      this.fit();
    }

    fit() {
      const c = this.cv, w = this.wrap; if (!c || !w || !this.W) return;
      const px = Math.max(1, w.clientWidth * (window.devicePixelRatio || 1));
      const m = Math.max(1, Math.min(Math.ceil(px / this.W), Math.floor(4096 / this.W)));
      if (c.width !== this.W * m || c.height !== this.H * m) { c.width = this.W * m; c.height = this.H * m; }
      this.m = m; this.ctx = c.getContext('2d'); this.lastDraw = 0;
    }

    build() {
      const W = this.W, H = this.H, N = W * H, s = W / 430, k = 430 / W, h = this.h;
      const vn = (x, y, sd) => { const xi = Math.floor(x), yi = Math.floor(y); let u = x - xi, v = y - yi; u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v); const a = h(xi, yi, sd), b = h(xi + 1, yi, sd), c = h(xi, yi + 1, sd), d = h(xi + 1, yi + 1, sd); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
      const fbm = (x, y, sd) => { let t = 0, am = 0.5, f = 1; for (let o = 0; o < 4; o++) { t += am * vn(x * f, y * f, sd + o * 31); am *= 0.5; f *= 2; } return t / 0.9375; };
      const con = (v, c) => Math.min(1, Math.max(0, (v - 0.5) * c + 0.5));
      const sm = (e0, e1, v) => { const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
      const BY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
      const B = this.B = (x, y) => (BY[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
      const PK = [[0.015, 0.62, 0.07], [0.1, 0.555, 0.1], [0.215, 0.5, 0.12], [0.33, 0.57, 0.09], [0.435, 0.64, 0.08], [0.53, 0.62, 0.09], [0.635, 0.59, 0.08], [0.83, 0.3, 0.135], [0.97, 0.6, 0.07]];
      const BIG = 7, VB = 0.745, VF = 0.775, AX = 0.83 * W;
      const ridge = new Float32Array(W), rid = new Int8Array(W), front = new Float32Array(W), top = new Float32Array(W);
      const bumps = [];
      for (let u = -0.02, j = 0; u < 1.05; j++) { bumps.push([u, 0.665 + h(j, 1, 13) * 0.08, 0.01 + h(j, 2, 13) * 0.03]); u += 0.014 + h(j, 3, 13) * 0.05; }
      for (let x = 0; x < W; x++) {
        const u = (x + 0.5) / W; let best = 9, id = -1;
        for (let i = 0; i < PK.length; i++) { const p = PK[i], v = p[1] + (VB - p[1]) * Math.abs(u - p[0]) / p[2]; if (v < best) { best = v; id = i; } }
        const jag = (fbm(u * 36, 0.5, 11) - 0.5) * (id === BIG ? 0.05 : 0.065) + (h(x, 0, 12) - 0.5) * 0.01;
        ridge[x] = Math.min(best + jag, VB + 0.03) * H; rid[x] = best < VB ? id : -1;
        let fb = VF; for (const b of bumps) { const v = b[1] + (VF - b[1]) * Math.abs(u - b[0]) / b[2]; if (v < fb) fb = v; }
        front[x] = (fb + (fbm(u * 110, 3.5, 14) - 0.5) * 0.05 + (h(x, 5, 15) - 0.5) * 0.008) * H;
        top[x] = Math.min(ridge[x], front[x]);
      }
      const base = new Uint8Array(N), fgV = new Float32Array(N), fgLo = new Float32Array(N), fgHi = new Float32Array(N), fgPh = new Float32Array(N), fgL = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x, yc = y + 0.5, r = ridge[x], f = front[x];
        if (yc < r && yc < f) {
          const du = Math.abs((x + 0.5) / W - 0.83);
          if (du < 0.17) {
            const da = (r - yc) * k, hi = 1 - Math.min(1, Math.max(0, (r / H - 0.3) / 0.35));
            const p = (0.36 * Math.exp(-da / 2.2) + 0.022 * Math.exp(-da / 15)) * (0.2 + 0.8 * hi) * (rid[x] === BIG ? 1 : 0.2);
            if (h(x, y, 30) < p) base[i] = h(x, y, 31) < 0.8 ? 1 : 2;
          }
          continue;
        }
        if (yc >= f) {
          const dd = (yc - f) / Math.max(1, H - f), n1 = con(fbm(x * 0.075 * k, y * 0.6 * k, 40), 1.8);
          const v = n1 * 0.72 + h(x, y, 41) * 0.28 + Math.max(0, 1 - (yc - f) / (3 * s)) * 0.25 - dd * 0.05;
          const lo = 0.33 + dd * 0.15, hi = 0.55 + dd * 0.06;
          base[i] = v > hi ? 2 : v > lo ? 1 : 0;
          fgV[i] = v; fgLo[i] = lo; fgHi[i] = hi; fgPh[i] = h(x, y, 42) * 3.8 - x * 0.12 * k; fgL.push(i);
          continue;
        }
        const d = yc - r;
        if (rid[x] === BIG) {
          const n = con(fbm(x * 0.5 * k, y * 0.075 * k, 50), 1.7);
          const v = n * 0.74 + h(x, y, 51) * 0.26 + ((x + 0.5) < AX ? 0.09 : -0.07) - sm(0, H * 0.45, d) * 0.1;
          let idx = v > 0.6 ? 2 : v > 0.36 ? 1 : 0;
          if (d < 3 * s && h(x, y, 52) < 0.45) idx = h(x, y, 53) < 0.55 ? 0 : 1;
          base[i] = idx; continue;
        }
        if (d < 1) { base[i] = 1; continue; }
        const sl = (ridge[Math.min(W - 1, x + 2)] - ridge[Math.max(0, x - 2)]) / 4, lit = Math.max(-1, Math.min(1, -sl * 1.1));
        const dens = 0.42 + 0.18 * lit + 0.42 * sm(H * 0.02, H * 0.17, d) + (fbm(x * 0.05 * k, y * 0.05 * k, 60) - 0.5) * 0.4;
        let idx = dens > B(x, y) ? 1 : 0;
        if (lit > 0.2 && d < H * 0.12 && (x + y) % Math.max(5, Math.round(9 * s)) === 0 && fbm(x * 0.08 * k, y * 0.08 * k, 61) > 0.47) idx = 2;
        else if (h(x, y, 62) < 0.008 * (1 + lit)) idx = 2;
        base[i] = idx;
      }
      const stars = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (y + 4 >= top[x] || h(x, y, 70) >= 0.0017 * k * k) continue;
        stars.push([x, y, h(x, y, 71) < 0.74 ? 1 : 2, h(x, y, 72) < 0.08 && x + 1 < W ? 1 : 0, h(x, y, 73) * 6.283, 0.3 + h(x, y, 74) * 1.6]);
      }
      const emit = []; for (let x = 0; x < W; x++) if (rid[x] === BIG && ridge[x] < H * 0.55) emit.push(x);
      Object.assign(this, { base, ridge, front, top, fgV, fgLo, fgHi, fgPh, fgL: Int32Array.from(fgL), stars, emit });
      this.eye = { cx: Math.round(W / 2), cy: Math.round(H * 0.335), a: Math.round(W * 0.165), b: Math.round(W * 0.165 / 2.25) };
    }

    frame(now) {
      let dt = (now - this.last) / 1000; this.last = now;
      if (!(dt > 0)) dt = 0; if (dt > 0.1) dt = 0.1;
      if (!this.vis || !this.W || !this.ctx) return;
      this.t += dt;
      const bl = this.bl;
      if (this.t > bl.start + bl.dur && this.t >= bl.next) { bl.start = this.t; bl.dur = 0.16 + Math.random() * 0.08; bl.next = this.t + (Math.random() < 0.2 ? bl.dur + 0.14 : 4.5 + Math.random() * 8); }
      this.updGaze(dt); this.updGlitch(); this.updParts(dt);
      this.phi = (this.phi || 0) + dt * (this.rm ? 0.15 : 0.45 + 1.1 * this.gz.focus);
      if (now - this.lastDraw < 31) return;
      this.lastDraw = now;
      this.draw();
    }

    updGaze(dt) {
      const g = this.gz, t = this.t;
      const tr = this.o.trackCursor !== false && t - this.ptr.t < 2.6 ? this.ptrTarget() : null;
      if (tr) {
        const kf = 1 - Math.exp(-dt * 7);
        g.yaw += (tr[0] - g.yaw) * kf; g.pitch += (tr[1] - g.pitch) * kf;
        g.focus += (0.8 - g.focus) * (1 - Math.exp(-dt * 4)); g.tracking = true; return;
      }
      if (g.tracking) { g.tracking = false; g.fy = g.ty = g.yaw; g.fp = g.tp = g.pitch; g.t0 = t; g.dur = 0.01; g.holdUntil = t + 0.8; }
      g.focus *= Math.exp(-dt / 0.7);
      const e = Math.min(1, (t - g.t0) / g.dur);
      const ee = g.ease === 1 ? 0.5 - 0.5 * Math.cos(Math.PI * e) : 1 - Math.pow(1 - e, 3);
      g.yaw = g.fy + (g.ty - g.fy) * ee; g.pitch = g.fp + (g.tp - g.fp) * ee;
      if (e < 1) return;
      if (t >= g.holdUntil) this.planGaze();
      else if (Math.random() < dt * 0.9) { g.fy = g.yaw; g.fp = g.pitch; g.ty = g.yaw + (Math.random() - 0.5) * 0.07; g.tp = g.pitch + (Math.random() - 0.5) * 0.05; g.t0 = t; g.dur = 0.07; g.ease = 0; }
    }

    planGaze() {
      const g = this.gz, t = this.t, R = Math.random;
      g.fy = g.yaw; g.fp = g.pitch; g.t0 = t;
      if (R() < 0.36) {
        const dir = g.yaw > 0.05 ? -1 : g.yaw < -0.05 ? 1 : (R() < 0.5 ? -1 : 1);
        g.ty = dir * (0.45 + R() * 0.3); g.tp = -0.05 - R() * 0.2; g.dur = 2.4 + R() * 1.6; g.ease = 1;
      } else {
        g.ty = (R() * 2 - 1) * 0.72; g.tp = (R() * 2 - 1) * 0.26 - 0.04;
        g.dur = 0.11 + Math.hypot(g.ty - g.fy, g.tp - g.fp) * 0.12; g.ease = 0; g.focus = 1;
      }
      if (this.rm) g.dur *= 3;
      g.holdUntil = t + g.dur + (g.ease === 1 ? 0.3 + R() * 0.9 : 0.6 + R() * 1.9);
    }

    ptrTarget() {
      const w = this.wrap; if (!w) return null;
      const r = w.getBoundingClientRect(); if (!r.width) return null;
      const ex = r.left + r.width * (this.eye.cx / this.W), ey = r.top + r.height * (this.eye.cy / this.H);
      return [0.78 * Math.tanh((this.ptr.x - ex) / r.width * 2.4), -0.36 * Math.tanh((this.ptr.y - ey) / r.width * 3.2)];
    }

    updGlitch() {
      const gl = this.gl, t = this.t, mode = this.rm ? 'Off' : (this.o.glitch || 'Occasional');
      if (mode === 'Off') { gl.active = false; return; }
      const rng = { Rare: [6, 11], Occasional: [2, 4.6], Constant: [0.2, 0.9] }[mode] || [2, 4.6];
      if (!gl.active) {
        if (t < gl.next) return;
        gl.active = true; gl.lite = mode === 'Constant' && Math.random() < 0.7;
        gl.end = t + (gl.lite ? 0.08 + Math.random() * 0.12 : 0.14 + Math.random() * 0.34); gl.nextStep = 0;
      }
      if (t >= gl.end) { gl.active = false; gl.ops = []; gl.ghost = null; gl.eyeDx = gl.dyaw = gl.dpitch = 0; gl.pupilScale = 1; gl.phiJ = 0; gl.next = t + rng[0] + Math.random() * (rng[1] - rng[0]); return; }
      if (t >= gl.nextStep) { this.makeOps(); gl.nextStep = t + 0.035 + Math.random() * 0.06; }
    }

    makeOps() {
      const gl = this.gl, W = this.W, H = this.H, E = this.eye, R = Math.random, s = W / 430, lite = gl.lite;
      const ri = (a, b) => Math.floor(a + R() * (b - a + 1)), eyeY = () => ri(E.cy - E.b - 4, E.cy + E.b + 4), sg = () => (R() < 0.5 ? -1 : 1);
      const ops = [];
      for (let j = 0, n = lite ? 1 : ri(1, 4); j < n; j++) ops.push({ k: 'slice', y: R() < 0.78 ? eyeY() : ri(0, H - 1), h: ri(1, Math.max(1, Math.round((lite ? 2 : 6) * s))), dx: sg() * ri(2, Math.round((lite ? 6 : 16) * s)) });
      if (!lite && R() < 0.35) for (let j = 0, n = ri(1, 3); j < n; j++) { const w = ri(4, Math.round(26 * s)), hh = ri(1, Math.round(7 * s)); ops.push({ k: 'block', x: ri(E.cx - E.a - 20, E.cx + E.a + 20 - w), y: eyeY(), w, h: hh, m: ri(0, 2), sx: ri(0, W - w), sy: ri(0, H - hh) }); }
      if (!lite && R() < 0.2) ops.push({ k: 'swap', y: eyeY(), h: ri(2, Math.round(8 * s)) });
      if (!lite && R() < 0.1) ops.push({ k: 'drop', y: ri(0, H - 1), h: ri(1, Math.round(3 * s)) });
      gl.ops = ops;
      gl.eyeDx = !lite && R() < 0.3 ? sg() * ri(1, Math.round(4 * s)) : 0;
      gl.ghost = !lite && R() < 0.5 ? { dx: sg() * ri(2, Math.round(7 * s)), dy: R() < 0.3 ? ri(-2, 2) : 0 } : null;
      if (!lite && R() < 0.3) { gl.dyaw = (R() - 0.5) * 0.7; gl.dpitch = (R() - 0.5) * 0.3; } else { gl.dyaw = gl.dpitch = 0; }
      gl.pupilScale = !lite && R() < 0.2 ? 0.55 + R() * 0.9 : 1;
      gl.phiJ = !lite && R() < 0.4 ? R() * 2 : 0;
    }

    updParts(dt) {
      if (this.rm || !this.emit.length) return;
      const P = this.parts, s = this.W / 430;
      this.emitAcc += dt * 7;
      while (this.emitAcc > 1) {
        this.emitAcc -= 1;
        const x = this.emit[(Math.random() * this.emit.length) | 0];
        P.push({ x: x + Math.random(), y: this.ridge[x] - 1 - Math.random() * 3 * s, vx: (Math.random() - 0.5) * 2.2 * s, vy: -(1.2 + Math.random() * 4) * s, age: 0, life: 1.4 + Math.random() * 3.8, c: Math.random() < 0.78 ? 1 : 2 });
      }
      for (let j = P.length - 1; j >= 0; j--) { const p = P[j]; p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.age > p.life) P.splice(j, 1); }
      if (P.length > 120) P.splice(0, P.length - 120);
    }

    openness() { const bl = this.bl, p = (this.t - bl.start) / bl.dur; return p < 0 || p > 1 ? 1 : 1 - Math.pow(Math.sin(Math.PI * p), 0.6); }

    pp(c) {
      if (c.length < 3) return c;
      const out = [c[0]];
      for (let i = 1; i < c.length - 1; i++) {
        const p = out[out.length - 1], q = c[i], n = c[i + 1];
        if ((p[0] === q[0] || p[1] === q[1]) && (n[0] === q[0] || n[1] === q[1]) && p[0] !== n[0] && p[1] !== n[1]) continue;
        out.push(q);
      }
      out.push(c[c.length - 1]);
      return out;
    }

    pal32() {
      const name = this.o.palette || 'Cobalt';
      if (this._palName === name) return this._pal;
      const P = PAL[name] || PAL['Cobalt'], out = new Uint32Array(12);
      const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }, srgb = (v) => Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055));
      const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }, pack = (c) => ((255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0;
      P.forEach((hex, i) => { out[i] = pack(rgb(hex)); });
      const A = rgb(P[4]).map(lin), Z = rgb(P[7]).map(lin);
      [0.25, 0.5, 0.75].forEach((m, j) => { out[9 + j] = pack(A.map((v, c) => srgb(v + (Z[c] - v) * m))); });
      this._pal = out; this._palName = name; return out;
    }

    draw() {
      const W = this.W, H = this.H, buf = this.buf, t = this.t, ts = Math.floor(t * 10) / 10;
      buf.set(this.base);
      const L = this.fgL, fv = this.fgV, lo = this.fgLo, hi = this.fgHi, ph = this.fgPh;
      for (let j = 0; j < L.length; j++) { const i = L[j], v = fv[i] + 0.035 * Math.sin(ts * 1.4 + ph[i]); buf[i] = v > hi[i] ? 2 : v > lo[i] ? 1 : 0; }
      for (const st of this.stars) {
        if (Math.sin(ts * st[5] + st[4]) < -0.86) continue;
        const i = st[1] * W + st[0]; buf[i] = st[2];
        if (st[3]) { buf[i + 1] = st[2]; if (st[1] + 1 < H) { buf[i + W] = st[2]; buf[i + W + 1] = st[2]; } }
      }
      const blink = ((t * 10) | 0) & 1;
      for (const p of this.parts) {
        const x = Math.floor(p.x), y = Math.floor(p.y);
        if (x < 0 || x >= W || y < 0 || y >= this.top[x]) continue;
        if (p.life - p.age < 0.5 && blink) continue;
        buf[y * W + x] = p.c;
      }
      this.drawEye(buf);
      this.applyGlitch(buf);
      const pal = this.pal32(), u32 = this.u32;
      for (let i = 0; i < W * H; i++) u32[i] = pal[buf[i]];
      this.octx.putImageData(this.img, 0, 0);
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.drawImage(this.off, 0, 0, W * this.m, H * this.m);
    }

    drawEye(buf) {
      const W = this.W, H = this.H, t = this.t, E = this.eye, g = this.gz, gl = this.gl, reg = this.reg, s = W / 430, B = this.B;
      const cx = E.cx + (gl.active ? gl.eyeDx : 0), cy = E.cy, a = E.a, b = E.b;
      const bo = Math.round(b * this.openness() * 2) / 2, closed = bo < 1.5, HALO = 12 * s;
      const yaw = g.yaw + (gl.active ? gl.dyaw : 0), pitch = g.pitch + (gl.active ? gl.dpitch : 0);
      const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const x0 = Math.max(0, Math.floor(cx - a - HALO)), x1 = Math.min(W - 1, Math.ceil(cx + a + HALO));
      const y0 = Math.max(0, Math.floor(cy - b - HALO)), y1 = Math.min(H - 1, Math.ceil(cy + b + HALO));
      const breath = 0.75 + 0.25 * Math.sin(t * 0.8), a2 = a * a, b2 = bo * bo;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const i = y * W + x, dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        let d;
        if (closed) d = Math.abs(dx) <= a ? Math.abs(dy) - 1 : Math.hypot(Math.abs(dx) - a, dy) - 1;
        else { const F = Math.sqrt(dx * dx / a2 + dy * dy / b2); if (F < 0.5) d = -99; else { const gx = dx / a2, gy = dy / b2; d = (F - 1) * F / Math.sqrt(gx * gx + gy * gy); } }
        if (d < -2) { reg[i] = 1; buf[i] = 0; }
        else if (d < 0) { reg[i] = 2; buf[i] = 3; }
        else { reg[i] = 0; if (d < HALO && 0.24 * (1 - d / HALO) ** 2 * breath > B(x, y)) buf[i] = 6; }
      }
      if (closed) return;
      const rot = (lx, ly, lz) => { const y1 = ly * cp + lz * sp, z1 = lz * cp - ly * sp; return [lx * cyw + z1 * syw, y1, z1 * cyw - lx * syw]; };
      const lines = [], TM = 1.25;
      const run = (fn, n, lo, hi) => { let r = []; for (let j = 0; j <= n; j++) { const P = fn(lo + (hi - lo) * j / n); if (P[2] > 0.03) r.push(P); else if (r.length) { lines.push(r); r = []; } } if (r.length) lines.push(r); };
      const nm = Math.ceil((a + b) * 3);
      for (let q = 0; q < 16; q++) { const f = q * Math.PI / 8, sf = Math.sin(f), cf = Math.cos(f); run((th) => rot(Math.cos(th) * sf, Math.sin(th), Math.cos(th) * cf), nm, -TM, TM); }
      run((l) => rot(Math.sin(l), 0, Math.cos(l)), Math.ceil(a * 14), -Math.PI, Math.PI);
      const G = rot(0, 0, 1), pxc = cx + a * G[0], pyc = cy - b * G[1], gz = Math.max(0.3, G[2]);
      let ux = G[0], uy = -G[1]; const ul = Math.hypot(ux, uy); if (ul > 1e-4) { ux /= ul; uy /= ul; } else { ux = 1; uy = 0; }
      const rP = b * 0.46 * (1 + 0.03 * Math.sin(t * 0.9)) * (gl.active ? gl.pupilScale : 1), rG = rP + 2.2 * s;
      const FR = a * 0.6, ST = [4, 9, 10, 11, 7];
      for (const r of lines) {
        const cells = [];
        for (const P of r) { const x = Math.floor(cx + a * P[0]), y = Math.floor(cy - b * P[1]), Lc = cells[cells.length - 1]; if (!Lc || Lc[0] !== x || Lc[1] !== y) cells.push([x, y]); }
        for (const [x, y] of this.pp(cells)) {
          if (x < x0 || x > x1 || y < y0 || y > y1 || reg[y * W + x] !== 1) continue;
          const dx = x + 0.5 - pxc, dy = y + 0.5 - pyc, du = (dx * ux + dy * uy) / gz, dv = dy * ux - dx * uy;
          const tt = Math.max(0, 1 - (Math.sqrt(du * du + dv * dv) - rG) / FR), lv = tt * tt * 4 + B(x, y) - 0.5;
          buf[y * W + x] = ST[Math.max(0, Math.min(4, Math.round(lv)))];
        }
      }
      const LK = Math.log(0.7), ph = this.phi + (gl.active ? gl.phiJ : 0), SX = -Math.min(1, ul) * rP * 0.55, rim = 1 - 1.5 / rP;
      const qx0 = Math.max(x0, Math.floor(pxc - rG - 1)), qx1 = Math.min(x1, Math.ceil(pxc + rG + 1)), qy0 = Math.max(y0, Math.floor(pyc - rG - 1)), qy1 = Math.min(y1, Math.ceil(pyc + rG + 1));
      for (let y = qy0; y <= qy1; y++) for (let x = qx0; x <= qx1; x++) {
        const i = y * W + x; if (reg[i] !== 1) continue;
        const dx = x + 0.5 - pxc, dy = y + 0.5 - pyc, du = (dx * ux + dy * uy) / gz, dv = dy * ux - dx * uy, q = du * du + dv * dv;
        if (q > rG * rG) continue;
        if (q > rP * rP) { buf[i] = 0; continue; }
        let rho = Math.sqrt(q) / rP;
        if (rho >= rim) { buf[i] = 7; continue; }
        const ex = du - (1 - rho) * SX; rho = Math.sqrt(ex * ex + dv * dv) / rP;
        if (rho * rP * 0.3 < 1.2) { buf[i] = 0; continue; }
        const L = Math.log(rho) / LK, fr = L + ph - Math.floor(L + ph);
        buf[i] = fr < 0.5 ? (L < 1.4 + 0.8 * (B(x, y) - 0.5) ? 7 : 8) : 0;
      }
    }

    applyGlitch(buf) {
      const gl = this.gl; if (!gl.active) return;
      const W = this.W, H = this.H, tmp = this.tmp, E = this.eye;
      if (gl.ghost) {
        tmp.set(buf);
        const x0 = Math.max(0, E.cx - E.a - 6), x1 = Math.min(W - 1, E.cx + E.a + 6), y0 = Math.max(0, E.cy - E.b - 2), y1 = Math.min(H - 1, E.cy + E.b + 2);
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          const c = tmp[y * W + x]; if (c !== 3 && c !== 7) continue;
          const X = x + gl.ghost.dx, Y = y + gl.ghost.dy; if (X < 0 || X >= W || Y < 0 || Y >= H) continue;
          if (tmp[Y * W + X] === 0) buf[Y * W + X] = 4;
        }
      }
      const SW = [0, 2, 1, 4, 3, 4, 6, 8, 7, 11, 10, 9];
      for (const op of gl.ops) {
        if (op.k === 'slice') {
          for (let y = Math.max(0, op.y); y < Math.min(H, op.y + op.h); y++) { const row = y * W; for (let x = 0; x < W; x++) tmp[x] = buf[row + x]; for (let x = 0; x < W; x++) buf[row + x] = tmp[(((x - op.dx) % W) + W) % W]; }
        } else if (op.k === 'block') {
          for (let y = 0; y < op.h; y++) for (let x = 0; x < op.w; x++) {
            const X = op.x + x, Y = op.y + y; if (X < 0 || X >= W || Y < 0 || Y >= H) continue;
            buf[Y * W + X] = op.m === 0 ? (Math.random() < 0.5 ? 0 : Math.random() < 0.7 ? 1 : 2) : op.m === 1 ? buf[(op.sy + y) * W + op.sx + x] : ((y & 1) ? 0 : 1);
          }
        } else if (op.k === 'swap') {
          for (let y = Math.max(0, op.y); y < Math.min(H, op.y + op.h); y++) for (let x = 0; x < W; x++) buf[y * W + x] = SW[buf[y * W + x]];
        } else if (op.k === 'drop') {
          for (let y = Math.max(0, op.y); y < Math.min(H, op.y + op.h); y++) for (let x = 0; x < W; x++) buf[y * W + x] = Math.random() < 0.05 ? 2 : 0;
        }
      }
    }
  }

  window.WatcherArt = { create: (canvas, o) => new Watcher(canvas, o) };
})();
