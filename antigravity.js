/**
 * React Bits — Antigravity Background (Vanilla JS / WebGL2 Port)
 * Component: @react-bits/Antigravity-JS-CSS
 * Source: https://reactbits.dev/animations/antigravity
 *
 * A 3D field of particles that lifts into a glowing ring around the cursor
 * and bursts outward on click, powered by raw WebGL2 instanced rendering.
 */

(function (global) {
  'use strict';

  const PIXEL_BUDGET = 2.4e6;
  const WORLD_HEIGHT = 31.5;
  const PALETTE_SIZE = 256;
  const DEFAULT_COLORS = ['#5227FF', '#FF9FFC', '#B497CF'];
  const SHAPES = { capsule: 0, sphere: 1, box: 2, tetrahedron: 3 };
  const COLOR_MODES = { conic: 0, radial: 1, random: 2 };

  const VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec4 aParticle;
layout(location = 2) in vec4 aSeed;
uniform vec2 uSize;
uniform float uPixel;
uniform vec2 uCursor;
uniform float uRing;
uniform float uBand;
uniform float uParticle;
uniform float uAmbient;
uniform float uTime;
uniform float uPulse;
uniform float uVariance;
uniform float uDepth;
uniform float uShape;
uniform float uColorMode;
uniform float uStops;
uniform float uHue;
uniform float uReveal;
uniform float uStreak;
uniform float uCharge;
out vec2 vLocal;
out vec2 vBounds;
out float vU;
out float vAlpha;
out float vSoft;

void main() {
  vec2 rel = aParticle.xy - uCursor;
  float dist = length(rel);
  vec2 radial = dist > 1e-3 ? rel / dist : vec2(1.0, 0.0);
  vec2 dir = radial;
  float speed = length(aParticle.zw);
  float streak = clamp(speed / uStreak, 0.0, 2.5);
  if (speed > 1e-3) {
    vec2 heading = aParticle.zw / speed * sign(dot(aParticle.zw, radial) + 1e-4);
    dir = normalize(mix(radial, heading, smoothstep(0.0, 1.0, streak)));
  }
  float ring = exp(-pow((dist - uRing) / uBand, 2.0));
  float z = aSeed.x;
  float depth = 1.0 + z * 0.32 * uDepth;
  float pulse = 1.0 + sin(uTime * uPulse + aSeed.y) * 0.22 * uVariance;
  float grow = uAmbient + (1.0 - uAmbient) * ring;
  float size = uParticle * depth * pulse * (0.85 + 0.3 * aSeed.w) * (1.0 + uCharge * 0.25 * ring);
  vec2 bounds;
  if (uShape < 0.5) {
    float width = size * 0.17 * mix(0.55, 1.0, ring);
    bounds = vec2(max(width, size * 0.5 * grow) * (1.0 + streak * 1.2), width);
  } else if (uShape < 1.5) {
    bounds = vec2(size * 0.22 * mix(0.45, 1.0, grow));
  } else {
    bounds = vec2(size * 0.26 * mix(0.45, 1.0, grow));
  }
  float soft = 1.0 + max(-z, 0.0) * 1.6 * uDepth;
  vec2 local = aCorner * (bounds + soft * 1.5 / uPixel);
  vec2 world = aParticle.xy + dir * local.x + vec2(-dir.y, dir.x) * local.y;
  gl_Position = vec4(world.x / uSize.x * 2.0 - 1.0, 1.0 - world.y / uSize.y * 2.0, 0.0, 1.0);
  vLocal = local * uPixel;
  vBounds = bounds * uPixel;
  vSoft = soft;
  if (uColorMode < 0.5) {
    vU = atan(radial.y, radial.x) / 6.28318530718 + uHue + (aSeed.z - 0.5) * 0.06;
  } else if (uColorMode < 1.5) {
    vU = clamp(dist / (uRing * 2.4), 0.0, 1.0) + (aSeed.z - 0.5) * 0.06;
  } else {
    vU = floor(aSeed.z * uStops) / max(uStops - 1.0, 1.0);
  }
  float fog = 1.0 - max(-z, 0.0) * 0.35 * uDepth;
  vAlpha = mix(uAmbient, 1.0, ring) * fog * uReveal;
}`;

  const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uPalette;
uniform float uShape;
uniform float uColorMode;
uniform float uOpacity;
in vec2 vLocal;
in vec2 vBounds;
in float vU;
in float vAlpha;
in float vSoft;
out vec4 fragColor;

void main() {
  vec2 p = vLocal;
  float d;
  if (uShape < 0.5) {
    float r = vBounds.y;
    d = length(vec2(max(abs(p.x) - max(vBounds.x - r, 0.0), 0.0), p.y)) - r;
  } else if (uShape < 1.5) {
    d = length(p) - vBounds.x;
  } else if (uShape < 2.5) {
    float r = vBounds.x * 0.28;
    vec2 q = abs(p) - (vBounds - r);
    d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  } else {
    float r = vBounds.x * 1.15;
    vec2 q = vec2(r * 0.5774 - p.x, abs(p.y));
    d = max(dot(q, vec2(0.5, 0.8660254)) - r * 0.5, -q.x - r * 0.5) * 1.2;
  }
  float alpha = clamp(0.5 - d / vSoft, 0.0, 1.0) * vAlpha * uOpacity;
  if (alpha < 0.002) discard;
  vec3 color = texture(uPalette, vec2(uColorMode < 0.5 ? fract(vU) : vU, uColorMode < 0.5 ? 0.25 : 0.75)).rgb;
  fragColor = vec4(color * alpha, alpha);
}`;

  const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

  function parseColor(val) {
    const text = String(val || '').trim();
    const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text);
    if (hex) {
      const full = hex[1].length === 3 ? hex[1].replace(/./g, d => d + d) : hex[1];
      return [0, 2, 4].map(idx => parseInt(full.slice(idx, idx + 2), 16) / 255);
    }
    const rgb = /^rgba?\(\s*([\d.]+)[\\s,]+([\d.]+)[\\s,]+([\d.]+)/i.exec(text);
    if (rgb) return [rgb[1], rgb[2], rgb[3]].map(ch => clamp(parseFloat(ch) / 255, 0, 1));
    return null;
  }

  const toLinear = ch => (ch <= 0.04045 ? ch / 12.92 : Math.pow((ch + 0.055) / 1.055, 2.4));
  const toSrgb = ch =>
    ch <= 0.0031308 ? ch * 12.92 : 1.055 * Math.pow(Math.max(ch, 0), 1 / 2.4) - 0.055;

  function toOklab(color) {
    const [r, g, b] = color.map(toLinear);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [
      0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
    ];
  }

  function fromOklab([L, a, b]) {
    const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
    const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
    const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
    ].map(ch => clamp(toSrgb(ch), 0, 1));
  }

  function buildPalette(colors, light) {
    const stops = [];
    colors.forEach(col => {
      const parsed = parseColor(col);
      if (!parsed) return;
      const lab = toOklab(parsed);
      const hue = (Math.atan2(lab[2], lab[1]) * 180) / Math.PI;
      const warmth = clamp(1 - Math.abs(hue - 85) / 40, 0, 1);
      const ceiling = 0.62 + 0.14 * warmth * warmth * (3 - 2 * warmth);
      if (light && lab[0] > ceiling) {
        const boost = 1 + (lab[0] - ceiling) * 1.6;
        stops.push([ceiling, lab[1] * boost, lab[2] * boost]);
      } else {
        stops.push(lab);
      }
    });
    if (!stops.length) stops.push(toOklab(light ? [0.1, 0.1, 0.12] : [1, 1, 1]));
    const data = new Uint8Array(PALETTE_SIZE * 2 * 4);
    const rows = [[...stops, stops[0]], stops.length > 1 ? stops : [stops[0], stops[0]]];
    rows.forEach((row, index) => {
      for (let x = 0; x < PALETTE_SIZE; x++) {
        const t = (x / (PALETTE_SIZE - (index === 0 ? 0 : 1))) * (row.length - 1);
        const from = Math.min(Math.floor(t), row.length - 2);
        const k = t - from;
        const eased = k * k * (3 - 2 * k);
        const start = row[from];
        const end = row[from + 1];
        const chroma = Math.hypot(start[1], start[2]) * (1 - eased) + Math.hypot(end[1], end[2]) * eased;
        const a = start[1] + (end[1] - start[1]) * eased;
        const b = start[2] + (end[2] - start[2]) * eased;
        const length = Math.hypot(a, b);
        const scale = length > 1e-4 ? chroma / length : 0;
        const color = fromOklab([start[0] + (end[0] - start[0]) * eased, a * scale, b * scale]);
        for (let channel = 0; channel < 3; channel++) {
          data[(index * PALETTE_SIZE + x) * 4 + channel] = Math.round(color[channel] * 255);
        }
        data[(index * PALETTE_SIZE + x) * 4 + 3] = 255;
      }
    });
    return data;
  }

  const random = seed => () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  function compile(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('Antigravity shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function link(gl) {
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = vertex && fragment ? gl.createProgram() : null;
    if (!vertex || !fragment || !program) {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
      return null;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('Antigravity program link error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    const uniforms = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(program, i);
      if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }
    return { program, uniforms };
  }

  function createAntigravity(container, options = {}) {
    if (!container) return null;

    let canvas = container.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'antigravity-canvas';
      container.appendChild(canvas);
    }

    const isMobile = window.innerWidth < 768;
    const defaultCount = isMobile ? 650 : 1300;

    const count = options.count ?? defaultCount;
    const magnetRadius = options.magnetRadius ?? 9;
    const ringRadius = options.ringRadius ?? 7.5;
    const waveSpeed = options.waveSpeed ?? 0.4;
    const waveAmplitude = options.waveAmplitude ?? 1;
    const waveCount = options.waveCount ?? 3;
    const particleSize = options.particleSize ?? 1.1;
    const lerpSpeed = options.lerpSpeed ?? 0.06;
    const colors = options.colors ?? DEFAULT_COLORS;
    const colorMode = options.colorMode ?? 'conic';
    const colorSpeed = options.colorSpeed ?? 0.05;
    const autoAnimate = options.autoAnimate ?? true;
    const particleVariance = options.particleVariance ?? 1;
    const rotationSpeed = options.rotationSpeed ?? 0;
    const depthFactor = options.depthFactor ?? 1;
    const pulseSpeed = options.pulseSpeed ?? 3;
    const particleShape = options.particleShape ?? 'capsule';
    const fieldStrength = options.fieldStrength ?? 10;
    const ambient = options.ambient ?? 0.28;
    const interactive = options.interactive ?? true;
    const clickBurst = options.clickBurst ?? true;
    const intro = options.intro ?? true;
    const lightMode = options.lightMode ?? false;
    const opacity = options.opacity ?? 0.95;
    const maxDevicePixelRatio = options.maxDevicePixelRatio ?? 2;

    const palette = options.color ? [options.color] : Array.isArray(colors) && colors.length ? colors : DEFAULT_COLORS;

    const settings = {
      count: clamp(Math.round(count), 1, 20000),
      magnet: Math.max(0, magnetRadius),
      ring: Math.max(0, ringRadius),
      waveSpeed,
      waveAmplitude: Math.max(0, waveAmplitude),
      waveCount: Math.max(0, Math.round(waveCount)),
      size: Math.max(0, particleSize),
      follow: clamp(lerpSpeed, 0.001, 1),
      palette,
      paletteKey: `${palette.join(',')}|${lightMode}`,
      colorMode: COLOR_MODES[colorMode] ?? COLOR_MODES.conic,
      colorSpeed,
      autoAnimate,
      variance: Math.max(0, particleVariance),
      rotation: rotationSpeed,
      depth: Math.max(0, depthFactor),
      pulse: pulseSpeed,
      shape: SHAPES[particleShape] ?? SHAPES.capsule,
      tightness: Math.max(0, fieldStrength),
      ambient: clamp(ambient, 0, 1),
      interactive,
      clickBurst,
      intro,
      light: lightMode,
      opacity: clamp(opacity, 0, 1),
      maxRatio: clamp(maxDevicePixelRatio, 0.5, 3)
    };

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance'
    });

    if (!gl) {
      console.warn('WebGL2 not supported for Antigravity; skipping WebGL background.');
      return null;
    }

    const shader = link(gl);
    if (!shader) return null;

    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const cornerBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const particleBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(1, 1);

    const seedBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, seedBuffer);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(2, 1);

    const paletteTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const size = { width: 1, height: 1, ratio: 1 };
    const cursor = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, ready: false };
    const pointer = { x: 0, y: 0, inside: false, down: false, moved: -Infinity };
    let field = null;
    let paletteKey = '';
    let time = 0;
    let hue = 0;
    let charge = 0;
    let introClock = settings.intro && !reduced ? 0 : Infinity;
    let raf = 0;
    let last = 0;
    let visible = true;
    let pageVisible = document.visibilityState !== 'hidden';
    let lost = false;

    function updatePalette(s) {
      if (s.paletteKey === paletteKey) return;
      paletteKey = s.paletteKey;
      gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA8,
        PALETTE_SIZE,
        2,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        buildPalette(s.palette, s.light)
      );
    }

    function buildField(total, width, height, previous) {
      const rand = random(1337);
      const margin = 0.06;
      const spanX = width * (1 + margin * 2);
      const spanY = height * (1 + margin * 2);
      const cols = Math.max(1, Math.ceil(Math.sqrt((total * spanX) / spanY)));
      const rows = Math.max(1, Math.ceil(total / cols));
      const cells = Array.from({ length: cols * rows }, (_, idx) => idx);
      for (let i = cells.length - 1; i > 0; i--) {
        const swap = Math.floor(rand() * (i + 1));
        [cells[i], cells[swap]] = [cells[swap], cells[i]];
      }
      const depths = Array.from({ length: total }, () => rand() * 2 - 1).sort((a, b) => a - b);
      const next = {
        total,
        width,
        height,
        homeX: new Float32Array(total),
        homeY: new Float32Array(total),
        band: new Float32Array(total),
        phase: new Float32Array(total),
        agility: new Float32Array(total),
        delay: new Float32Array(total),
        orbit: new Float32Array(total),
        x: new Float32Array(total),
        y: new Float32Array(total),
        vx: new Float32Array(total),
        vy: new Float32Array(total),
        particles: new Float32Array(total * 4),
        seeds: new Float32Array(total * 4)
      };

      for (let i = 0; i < total; i++) {
        const cell = cells[i];
        const hx = -width * margin + (((cell % cols) + 0.5 + (rand() - 0.5) * 0.85) / cols) * spanX;
        const hy = -height * margin + ((Math.floor(cell / cols) + 0.5 + (rand() - 0.5) * 0.85) / rows) * spanY;
        next.homeX[i] = hx;
        next.homeY[i] = hy;
        next.band[i] = rand() * 2 - 1;
        next.phase[i] = rand() * Math.PI * 2;
        next.agility[i] = 0.75 + rand() * 0.5;
        next.delay[i] = rand();
        if (previous && i < previous.total) {
          next.x[i] = (previous.x[i] / previous.width) * width;
          next.y[i] = (previous.y[i] / previous.height) * height;
          next.vx[i] = previous.vx[i];
          next.vy[i] = previous.vy[i];
          next.orbit[i] = previous.orbit[i];
        } else {
          next.x[i] = hx;
          next.y[i] = introClock === 0 ? hy + height * (0.45 + next.delay[i] * 0.4) : hy;
        }
        next.seeds[i * 4] = depths[i];
        next.seeds[i * 4 + 1] = next.phase[i];
        next.seeds[i * 4 + 2] = rand();
        next.seeds[i * 4 + 3] = rand();
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, seedBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, next.seeds, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, next.particles.byteLength, gl.DYNAMIC_DRAW);
      return next;
    }

    function resize() {
      const rect = container.getBoundingClientRect();
      const cssWidth = Math.max(1, rect.width || window.innerWidth);
      const cssHeight = Math.max(1, rect.height || window.innerHeight);
      const ratio = Math.min(
        window.devicePixelRatio || 1,
        settings.maxRatio,
        Math.sqrt(PIXEL_BUDGET / (cssWidth * cssHeight))
      );
      const width = Math.max(1, Math.round(cssWidth * ratio));
      const height = Math.max(1, Math.round(cssHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      size.width = cssWidth;
      size.height = cssHeight;
      size.ratio = width / cssWidth;
      if (!cursor.ready) {
        cursor.x = cursor.tx = cssWidth / 2;
        cursor.y = cursor.ty = cssHeight / 2;
        cursor.ready = true;
      }
      if (
        !field ||
        field.total !== settings.count ||
        Math.abs(field.width - cssWidth) > 0.5 ||
        Math.abs(field.height - cssHeight) > 0.5
      ) {
        field = buildField(settings.count, cssWidth, cssHeight, field);
      }
    }

    function simulate(s, dt) {
      if (!field) return;
      const unit = size.height / WORLD_HEIGHT;
      const ringPx = s.ring * unit * (1 - 0.38 * charge);
      const magnetPx = Math.max(s.magnet * unit, 1);
      const spread = (5 / (s.tightness + 0.1)) * unit;
      const wavePx = s.waveAmplitude * unit * 0.5;
      const omegaBase = 2.2 + s.follow * 80;
      const spinRate = (s.rotation + charge * 3) * (reduced ? 0.3 : 1);
      const centerX = size.width / 2;
      const centerY = size.height / 2;
      const edge = magnetPx * 0.18;
      const { homeX, homeY, band, phase, agility, delay, orbit, x, y, vx, vy, particles, seeds, total } = field;

      for (let i = 0; i < total; i++) {
        const parallax = 1 - seeds[i * 4] * 0.12 * s.depth;
        const cx = centerX + (cursor.x - centerX) * parallax;
        const cy = centerY + (cursor.y - centerY) * parallax;
        const hx = homeX[i];
        const hy = homeY[i] + Math.sin(time * 0.7 + phase[i]) * unit * 0.12 * s.waveAmplitude;
        const dx = hx - cx;
        const dy = hy - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const capture = 1 - clamp((dist - (magnetPx - edge)) / (edge * 2), 0, 1);
        const ease = capture * capture * (3 - 2 * capture);
        let turn = orbit[i] + spinRate * ease * dt;
        turn -= Math.atan2(Math.sin(turn), Math.cos(turn)) * (1 - ease) * Math.min(1, dt * 2.5);
        orbit[i] = turn;
        let tx = hx;
        let ty = hy;
        if (ease > 0 || Math.abs(turn) > 1e-4) {
          const angle = Math.atan2(dy, dx) + turn;
          const wave =
            wavePx *
            (0.6 * Math.sin(angle * s.waveCount - time * s.waveSpeed * 2) +
              0.4 * Math.sin(phase[i] + time * s.waveSpeed * 1.3));
          const radius = dist + (ringPx + wave + band[i] * spread - dist) * ease;
          tx = cx + Math.cos(angle) * radius;
          ty = cy + Math.sin(angle) * radius;
        }
        const omega = introClock < delay[i] * 0.9 ? 0 : omegaBase * agility[i];
        const damping = 1.64 * omega;
        const stiffness = omega * omega;
        const steps = Math.min(4, Math.max(1, Math.ceil(omega * dt * 2)));
        const h = dt / steps;
        for (let step = 0; step < steps; step++) {
          vx[i] += ((tx - x[i]) * stiffness - vx[i] * damping) * h;
          vy[i] += ((ty - y[i]) * stiffness - vy[i] * damping) * h;
          x[i] += vx[i] * h;
          y[i] += vy[i] * h;
        }
        particles[i * 4] = x[i];
        particles[i * 4 + 1] = y[i];
        particles[i * 4 + 2] = vx[i];
        particles[i * 4 + 3] = vy[i];
      }
    }

    function burst(s, strength) {
      if (!field) return;
      const unit = size.height / WORLD_HEIGHT;
      const reach = Math.max(s.magnet, s.ring) * unit * 1.8;
      const { x, y, vx, vy, agility, total } = field;
      for (let i = 0; i < total; i++) {
        const dx = x[i] - cursor.x;
        const dy = y[i] - cursor.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 1e-3;
        const kick = unit * 110 * strength * Math.exp(-Math.pow(dist / reach, 2)) * agility[i];
        vx[i] += (dx / dist) * kick;
        vy[i] += (dy / dist) * kick;
      }
    }

    function frame(now) {
      raf = 0;
      if (lost || !field) return;
      updatePalette(settings);
      const dt = clamp((now - last) / 1000 || 0, 0, 1 / 30);
      last = Math.max(last, now);
      const pace = reduced ? 0.3 : 1;
      time += dt * pace;
      hue += dt * settings.colorSpeed * pace;
      if (introClock < 3) introClock += dt;
      charge = pointer.down ? Math.min(1, charge + dt / 0.9) : Math.max(0, charge - dt * 4);

      const idle = performance.now() - pointer.moved > 2000 || !pointer.inside;
      if (settings.autoAnimate && !reduced && (idle || !settings.interactive)) {
        cursor.tx = size.width / 2 + Math.sin(time * 0.5) * (size.width / 4);
        cursor.ty = size.height / 2 + Math.cos(time) * (size.height / 4);
      } else if (settings.interactive && pointer.inside) {
        cursor.tx = pointer.x;
        cursor.ty = pointer.y;
      }
      cursor.vx += ((cursor.tx - cursor.x) * 49 - cursor.vx * 14) * dt;
      cursor.vy += ((cursor.ty - cursor.y) * 49 - cursor.vy * 14) * dt;
      cursor.x += cursor.vx * dt;
      cursor.y += cursor.vy * dt;

      simulate(settings, dt);

      const unit = size.height / WORLD_HEIGHT;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(shader.program);
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, particleBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, field.particles);

      const u = shader.uniforms;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
      gl.uniform1i(u.uPalette, 0);
      gl.uniform2f(u.uSize, size.width, size.height);
      gl.uniform1f(u.uPixel, size.ratio);
      gl.uniform2f(u.uCursor, cursor.x, cursor.y);
      gl.uniform1f(u.uRing, settings.ring * unit * (1 - 0.38 * charge));
      gl.uniform1f(u.uBand, Math.max(unit * 6, 1));
      gl.uniform1f(u.uParticle, settings.size * unit * 0.6);
      gl.uniform1f(u.uAmbient, settings.ambient);
      gl.uniform1f(u.uTime, time);
      gl.uniform1f(u.uPulse, settings.pulse);
      gl.uniform1f(u.uVariance, settings.variance);
      gl.uniform1f(u.uDepth, settings.depth);
      gl.uniform1f(u.uShape, settings.shape);
      gl.uniform1f(u.uColorMode, settings.colorMode);
      gl.uniform1f(u.uStops, settings.palette.length);
      gl.uniform1f(u.uHue, hue);
      gl.uniform1f(u.uReveal, introClock < 3 ? clamp(introClock / 0.6, 0, 1) : 1);
      gl.uniform1f(u.uStreak, unit * 30);
      gl.uniform1f(u.uCharge, charge);
      gl.uniform1f(u.uOpacity, settings.opacity);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, field.total);

      if (visible && pageVisible) raf = requestAnimationFrame(frame);
    }

    function wake() {
      if (raf || lost || !visible || !pageVisible) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function locate(e) {
      const rect = container.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        inside:
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
      };
    }

    function onPointerMove(e) {
      const spot = locate(e);
      pointer.inside = spot.inside;
      if (!spot.inside) return;
      pointer.x = spot.x;
      pointer.y = spot.y;
      pointer.moved = performance.now();
    }

    function onPointerDown(e) {
      const spot = locate(e);
      if (!spot.inside || !settings.interactive) return;
      pointer.x = spot.x;
      pointer.y = spot.y;
      pointer.inside = true;
      pointer.moved = performance.now();
      if (settings.clickBurst && !reduced) pointer.down = true;
    }

    function onPointerUp(e) {
      if (pointer.down) burst(settings, 0.45 + charge);
      pointer.down = false;
      if (e.pointerType !== 'mouse') pointer.inside = false;
    }

    function onLeave() {
      pointer.inside = false;
      pointer.down = false;
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);

    function onLost(e) {
      e.preventDefault();
      lost = true;
      cancelAnimationFrame(raf);
      raf = 0;
    }

    function onRestored() {
      lost = false;
      resize();
      wake();
    }

    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      wake();
    });
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      wake();
    });
    intersectionObserver.observe(container);

    function onVisibility() {
      pageVisible = document.visibilityState !== 'hidden';
      wake();
    }
    document.addEventListener('visibilitychange', onVisibility);

    resize();
    wake();

    return {
      destroy() {
        cancelAnimationFrame(raf);
        resizeObserver.disconnect();
        intersectionObserver.disconnect();
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
        document.documentElement.removeEventListener('pointerleave', onLeave);
        document.removeEventListener('visibilitychange', onVisibility);
        canvas.removeEventListener('webglcontextlost', onLost);
        canvas.removeEventListener('webglcontextrestored', onRestored);
        if (!gl.isContextLost()) {
          gl.deleteBuffer(cornerBuffer);
          gl.deleteBuffer(particleBuffer);
          gl.deleteBuffer(seedBuffer);
          gl.deleteTexture(paletteTexture);
          gl.deleteVertexArray(vao);
          gl.deleteProgram(shader.program);
        }
      }
    };
  }

  global.Antigravity = {
    create: createAntigravity
  };
})(window);
