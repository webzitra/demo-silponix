# Silponix Quantum Rebirth — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing Silponix static site with Three.js metaballs hero, Bento Grid services, premium glassmorphism 2.0, typing/shimmer effects, and a Supabase-backed data layer with admin dashboard — all on Netlify, keeping the red/amber motorsport brand DNA.

**Architecture:** Additive upgrade strategy — never delete existing functionality, only layer on top. New JS modules (`js/three-engine.js`, `js/quantum-ui.js`) are loaded after `main.js` so they degrade gracefully. Supabase replaces hardcoded testimonials and stats via a single Netlify Function (`netlify/functions/quantum-data.js`). Admin at `/admin/quantum.html` reuses existing `admin-auth.js` for auth.

**Tech Stack:** Three.js **r151.3** (CDN — last version with `examples/js/` UMD builds needed for non-module `<script src>` loading), GSAP Flip + Observer (CDN), Supabase JS v2 (CDN), `@supabase/supabase-js` in Netlify Functions (npm, bundled via `node_bundler = "esbuild"` already in netlify.toml), vanilla JS (IIFE pattern), custom CSS (no Tailwind retrofit), Satoshi font (Bunny Fonts CDN), JetBrains Mono (Google Fonts CDN).

**⚠️ Three.js version lock:** Three.js r152+ removed `examples/js/` UMD builds — post-processing classes (EffectComposer, UnrealBloomPass etc.) are ES modules only from r152 onward. Using **r151.3** is intentional to keep the vanilla `<script src>` IIFE pattern. Do NOT upgrade to r158+ without migrating to `<script type="module">` + importmap.

**⚠️ Supabase npm:** `node_modules/` must be in `.gitignore`. The function bundler (`esbuild`) in `netlify.toml` handles `@supabase/supabase-js` at build time — do NOT commit `node_modules/` to git.

---

## File Map

```
MODIFY:
  index.html                          — CDN scripts, font imports, bento grid HTML, stat data-count attrs
  css/style.css                       — bento grid, glassmorphism 2.0 inner-glow, shimmer, typing, fonts
  js/gsap-animations.js               — add GSAP Flip + Observer animations

CREATE:
  js/three-engine.js                  — Three.js metaballs scene (GLSL shader, EffectComposer, cursor)
  js/quantum-ui.js                    — shimmer, typing effect, enhanced 50px magnetic pull
  netlify/functions/quantum-data.js   — GET testimonials + stats from Supabase
  netlify/functions/quantum-admin.js  — POST/PUT/DELETE CRUD (admin auth required)
  admin/quantum.html                  — Admin dashboard UI (testimonials + stats CRUD)
  admin/quantum.js                    — Admin dashboard JS logic
```

**Z-index stack (unchanged):**
- 1 → sections, hero
- 3 → smoke canvas
- 4 → Three.js metaballs canvas (new, behind smoke)
- 100 → navbar
- 99998 → loader
- 99999 → cursor

---

## Task 1: Three.js Metaballs Engine

**Files:** CREATE `js/three-engine.js`, MODIFY `index.html`

**What it does:** Renders 8 animated metaballs using a GLSL fragment shader on a full-screen quad inside the hero section. Post-processing: UnrealBloomPass (glow) + custom chromatic aberration. Cursor creates magnetic ripple. Degrades gracefully if WebGL unavailable.

- [ ] **Step 1: Add Three.js CDN scripts to index.html**

Find the script block (before `</body>`) and insert BEFORE the `gsap` CDN lines:
```html
    <!-- Three.js engine -->
    <script src="https://cdn.jsdelivr.net/npm/three@0.151.3/build/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.151.3/examples/js/postprocessing/EffectComposer.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.151.3/examples/js/postprocessing/RenderPass.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.151.3/examples/js/postprocessing/ShaderPass.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.151.3/examples/js/postprocessing/UnrealBloomPass.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.151.3/examples/js/shaders/CopyShader.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.151.3/examples/js/shaders/LuminosityHighPassShader.js"></script>
```

After `gsap-animations.js`, add:
```html
    <script src="/js/three-engine.js?v=12"></script>
    <script src="/js/quantum-ui.js?v=12"></script>
```

Also bump all v=11 → v=12 in index.html, sluzby.html, galerie.html, kontakt.html, o-nas.html.

- [ ] **Step 2: Add metaballs canvas to hero section**

In `index.html`, inside `.hero` section, after `<canvas id="smokeCanvas">`, add:
```html
        <canvas id="metaballsCanvas" aria-hidden="true"></canvas>
```

- [ ] **Step 3: Add CSS for metaballs canvas**

In `css/style.css`, near the `#smokeCanvas` rule, add:
```css
#metaballsCanvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 4;
    opacity: 0.55;
    mix-blend-mode: screen;
}
[data-theme="light"] #metaballsCanvas { opacity: 0.25; }
@media (prefers-reduced-motion: reduce) { #metaballsCanvas { display: none; } }
```

- [ ] **Step 4: Create js/three-engine.js**

```js
// ==================== THREE.JS METABALLS ENGINE ====================
(function () {
    'use strict';

    if (typeof THREE === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var canvas = document.getElementById('metaballsCanvas');
    if (!canvas) return;

    // WebGL support check
    var testCtx;
    try { testCtx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl'); }
    catch (e) {}
    if (!testCtx) { canvas.style.display = 'none'; return; }

    // ---- Scene setup ----
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    var scene   = new THREE.Scene();
    var camera  = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    var W = 0, H = 0;

    function resize() {
        W = canvas.offsetWidth  || canvas.parentElement.offsetWidth;
        H = canvas.offsetHeight || canvas.parentElement.offsetHeight;
        renderer.setSize(W, H, false);
        if (composer) composer.setSize(W, H);
        if (uniforms) uniforms.u_resolution.value.set(W, H);
    }

    // ---- GLSL Shaders ----
    var vertexShader = [
        'void main() {',
        '  gl_Position = vec4(position, 1.0);',
        '}'
    ].join('\n');

    var fragmentShader = [
        'precision mediump float;',
        'uniform vec2  u_resolution;',
        'uniform float u_time;',
        'uniform vec2  u_balls[8];',
        'uniform float u_radii[8];',
        'uniform vec2  u_cursor;',
        'uniform float u_ripple;',

        'void main() {',
        '  vec2 uv = gl_FragCoord.xy / u_resolution;',
        '  float aspect = u_resolution.x / u_resolution.y;',
        '  vec2 p = uv;',
        '  p.x *= aspect;',

        '  float sum = 0.0;',
        '  for (int i = 0; i < 8; i++) {',
        '    vec2 bc = u_balls[i];',
        '    bc.x *= aspect;',
        '    float d = length(p - bc);',
        '    sum += u_radii[i] / (d * d + 0.0001);',
        '  }',

        // Cursor ripple
        '  vec2 cur = u_cursor;',
        '  cur.x *= aspect;',
        '  float cd = length(p - cur);',
        '  float ripple = u_ripple * 0.015 * sin(cd * 40.0 - u_time * 6.0) * exp(-cd * 6.0);',
        '  sum += ripple;',

        '  float edge = smoothstep(0.96, 1.04, sum);',
        '  float glow = smoothstep(0.4, 0.97, sum) * 0.35;',

        // Motorsport palette: primary red #bd141b → accent amber #f59e0b
        '  vec3 cInner = vec3(0.741, 0.078, 0.106);', // #bd141b
        '  vec3 cOuter  = vec3(0.961, 0.620, 0.043);', // #f59e0b
        '  vec3 cGlow   = vec3(0.85,  0.15,  0.05);',

        '  vec3 col = mix(cOuter, cInner, edge);',
        '  col     += cGlow * glow;',

        '  float alpha = max(edge, glow * 0.5);',
        '  gl_FragColor = vec4(col, alpha);',
        '}'
    ].join('\n');

    // ---- Chromatic aberration pass ----
    var chromaShader = {
        uniforms: {
            tDiffuse: { value: null },
            u_offset: { value: 0.003 }
        },
        vertexShader: [
            'varying vec2 vUv;',
            'void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }'
        ].join('\n'),
        fragmentShader: [
            'uniform sampler2D tDiffuse;',
            'uniform float u_offset;',
            'varying vec2 vUv;',
            'void main() {',
            '  float r = texture2D(tDiffuse, vUv + vec2(u_offset, 0.0)).r;',
            '  float g = texture2D(tDiffuse, vUv).g;',
            '  float b = texture2D(tDiffuse, vUv - vec2(u_offset, 0.0)).b;',
            '  float a = texture2D(tDiffuse, vUv).a;',
            '  gl_FragColor = vec4(r, g, b, a);',
            '}'
        ].join('\n')
    };

    // ---- Uniforms ----
    var uniforms = {
        u_resolution: { value: new THREE.Vector2() },
        u_time:       { value: 0.0 },
        u_balls:      { value: [] },  // filled below
        u_radii:      { value: new Float32Array(8) },
        u_cursor:     { value: new THREE.Vector2(0.5, 0.5) },
        u_ripple:     { value: 0.0 }
    };

    // ---- Metaball state ----
    var balls = [];
    var NUM  = 8;
    var ballPositions = new Array(NUM * 2); // flat [x0,y0, x1,y1 ...]

    for (var i = 0; i < NUM; i++) {
        balls.push({
            x:  Math.random(),
            y:  Math.random(),
            vx: (Math.random() - 0.5) * 0.0008,
            vy: (Math.random() - 0.5) * 0.0008,
            r:  0.025 + Math.random() * 0.040
        });
    }

    // Set radii uniform
    for (var j = 0; j < NUM; j++) uniforms.u_radii.value[j] = balls[j].r;

    // Build ball vec2 array for uniform
    var ballVec2 = [];
    for (var k = 0; k < NUM; k++) ballVec2.push(new THREE.Vector2(balls[k].x, balls[k].y));
    uniforms.u_balls.value = ballVec2;

    // ---- Mesh ----
    var geometry = new THREE.PlaneGeometry(2, 2);
    var material = new THREE.ShaderMaterial({
        vertexShader:   vertexShader,
        fragmentShader: fragmentShader,
        uniforms:       uniforms,
        transparent:    true,
        depthWrite:     false
    });
    scene.add(new THREE.Mesh(geometry, material));

    // ---- Post-processing ----
    var composer;
    if (typeof EffectComposer !== 'undefined' && typeof UnrealBloomPass !== 'undefined') {
        composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        var bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.6, 0.5, 0.7);
        composer.addPass(bloom);
        if (typeof ShaderPass !== 'undefined') {
            var chroma = new ShaderPass(chromaShader);
            chroma.renderToScreen = true;
            composer.addPass(chroma);
        }
    }

    // ---- Cursor tracking ----
    var mouseNorm = new THREE.Vector2(0.5, 0.5);
    var rippleDecay = 0;

    document.addEventListener('mousemove', function (e) {
        var rect = canvas.getBoundingClientRect();
        mouseNorm.x = (e.clientX - rect.left) / rect.width;
        mouseNorm.y = 1.0 - (e.clientY - rect.top)  / rect.height;
        uniforms.u_cursor.value.copy(mouseNorm);

        // Magnetic attraction: pull nearest ball toward cursor
        var nearest = 0, minD = Infinity;
        for (var n = 0; n < NUM; n++) {
            var dx = balls[n].x - mouseNorm.x;
            var dy = balls[n].y - mouseNorm.y;
            var d  = dx * dx + dy * dy;
            if (d < minD) { minD = d; nearest = n; }
        }
        if (minD < 0.08) {
            balls[nearest].vx += (mouseNorm.x - balls[nearest].x) * 0.00015;
            balls[nearest].vy += (mouseNorm.y - balls[nearest].y) * 0.00015;
        }
    }, { passive: true });

    document.addEventListener('click', function (e) {
        var hero = document.getElementById('hlavni');
        if (!hero || !hero.contains(e.target)) return;
        rippleDecay = 1.0;
    });

    // ---- Resize ----
    window.addEventListener('resize', resize, { passive: true });
    resize();

    // ---- Animation loop ----
    var clock = new THREE.Clock();
    function animate() {
        var dt = clock.getDelta();
        uniforms.u_time.value += dt;

        // Decay ripple
        if (rippleDecay > 0) {
            rippleDecay -= dt * 1.2;
            uniforms.u_ripple.value = Math.max(0, rippleDecay);
        }

        // Move balls
        for (var i = 0; i < NUM; i++) {
            var b = balls[i];
            b.x += b.vx;
            b.y += b.vy;
            // Soft boundary bounce
            if (b.x < 0.05 || b.x > 0.95) b.vx *= -1;
            if (b.y < 0.05 || b.y > 0.95) b.vy *= -1;
            b.vx *= 0.999;
            b.vy *= 0.999;
            // Tiny random drift
            b.vx += (Math.random() - 0.5) * 0.00004;
            b.vy += (Math.random() - 0.5) * 0.00004;
            uniforms.u_balls.value[i].set(b.x, b.y);
        }

        if (composer) { composer.render(); }
        else { renderer.render(scene, camera); }

        requestAnimationFrame(animate);
    }
    animate();

})();
```

- [ ] **Step 5: Verify WebGL fallback**

Open `index.html` in a browser with DevTools → Application → disable WebGL (or check in Firefox with `webgl.disabled=true` in about:config). Canvas should be hidden, site still fully functional.

- [ ] **Step 6: Commit**
```bash
cd "c:/2026/Webzitra0000/webzitra/.claude/worktrees/elegant-merkle/silponix-demo"
git add js/three-engine.js css/style.css index.html sluzby.html galerie.html kontakt.html o-nas.html
git commit -m "feat: Three.js metaballs hero — GLSL shader, UnrealBloom, chromatic aberration, cursor ripple"
```

---

## Task 2: GSAP Flip + Observer + Bento Grid

**Files:** MODIFY `js/gsap-animations.js`, MODIFY `index.html` (services section), MODIFY `css/style.css`

**What it does:** Adds GSAP Flip (smooth layout transitions) and Observer (scroll-velocity parallax) CDN. Refactors the 8 service cards into an asymmetrical Bento Grid — 2 featured (wide) + 6 standard — with GSAP-driven entrance using Flip.

- [ ] **Step 1: Add GSAP Flip + Observer CDN**

In `index.html`, in the GSAP CDN block, add after `SplitText.min.js`:
```html
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/Flip.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/Observer.min.js"></script>
```

- [ ] **Step 2: Register plugins in gsap-animations.js**

At the top of the IIFE in `js/gsap-animations.js`, after existing `registerPlugin` calls, add:
```js
    if (typeof Flip    !== 'undefined') gsap.registerPlugin(Flip);
    if (typeof Observer !== 'undefined') gsap.registerPlugin(Observer);
```

- [ ] **Step 3: Add Observer scroll-velocity parallax to gsap-animations.js**

Append inside the IIFE, after the footer reveal block:
```js
    // --- 10. Observer — scroll velocity tilt on cards ---
    if (typeof Observer !== 'undefined') {
        Observer.create({
            target: window,
            type: 'wheel,touch,scroll',
            onChangeY: function (self) {
                var vel = Math.min(Math.abs(self.velocityY) / 1500, 1);
                gsap.to('.service-card, .blog-card', {
                    skewY: self.velocityY > 0 ? vel * 1.5 : vel * -1.5,
                    duration: 0.4,
                    ease: 'power1.out',
                    overwrite: 'auto'
                });
            }
        });
    }
```

- [ ] **Step 4: Replace services-grid HTML with Bento Grid in index.html**

Find the `<div class="services-grid">` block (lines ~468–525). Replace the wrapper div with:
```html
            <div class="bento-grid" id="servicesGrid">
```
(closing `</div>` stays as is — just rename the class from `services-grid` to `bento-grid`)

Add bento size classes to specific service cards:
- Card 1 (Stavba závodních vozů): add `bento-featured` class to `.service-card`
- Card 4 (Ladění ECU Hondata): add `bento-featured` class to `.service-card`
- All others: keep as-is (they become `bento-standard`)

Final HTML structure:
```html
<div class="bento-grid" id="servicesGrid">
    <div class="service-card bento-featured" data-animate>...</div>  <!-- Stavba vozů -->
    <div class="service-card" data-animate data-delay="100">...</div>
    <div class="service-card" data-animate data-delay="200">...</div>
    <div class="service-card bento-featured" data-animate data-delay="300">...</div>  <!-- ECU Hondata -->
    <div class="service-card" data-animate data-delay="400">...</div>
    <div class="service-card" data-animate data-delay="500">...</div>
    <div class="service-card" data-animate data-delay="100">...</div>
    <div class="service-card" data-animate data-delay="200">...</div>
</div>
```

- [ ] **Step 5: Add Bento Grid CSS**

In `css/style.css`, find the existing `.services-grid` rule and ADD a new bento rule immediately after it:
```css
/* ==================== BENTO GRID ==================== */
.bento-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
    align-items: start;
}

.bento-grid .bento-featured {
    grid-column: span 2;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1.5rem;
    align-items: center;
}

.bento-grid .bento-featured .service-card-icon {
    width: 72px; height: 72px;
    flex-shrink: 0;
}

.bento-grid .bento-featured .service-card-title {
    font-size: clamp(1.25rem, 2vw, 1.625rem);
}

/* Depth layering for bento */
/* NOTE: .service-card already has `position: relative` in the base rule (line ~602 in style.css) */
/* z-index only works on positioned elements — no need to add it again here */
.bento-grid .service-card:nth-child(1) { z-index: 3; }
.bento-grid .service-card:nth-child(3) { z-index: 2; transform: translateY(8px); }
.bento-grid .service-card:nth-child(6) { z-index: 2; transform: translateY(-8px); }

@media (max-width: 900px) {
    .bento-grid { grid-template-columns: repeat(2, 1fr); }
    .bento-grid .bento-featured { grid-column: span 2; }
}
@media (max-width: 600px) {
    .bento-grid { grid-template-columns: 1fr; }
    .bento-grid .bento-featured { grid-column: span 1; grid-template-columns: 1fr; }
}
```

- [ ] **Step 6: Commit**
```bash
git add js/gsap-animations.js css/style.css index.html
git commit -m "feat: GSAP Flip + Observer, bento grid services (2 featured wide cards)"
```

---

## Task 3: Typography + Glassmorphism 2.0

**Files:** MODIFY `index.html` (font link), MODIFY `css/style.css`

**What it does:** Switches hero/heading font to **Satoshi** (Bunny Fonts), uses **JetBrains Mono** for technical stats. Updates glassmorphism to 2.0 — adds `box-shadow: inset 0 0 0 1px rgba(255,255,255,0.10)` inner-glow to all glass surfaces. Upgrades navbar to full glassmorphism.

- [ ] **Step 1: Add Satoshi + JetBrains Mono fonts to index.html**

Find the Google Fonts `<link rel="preload">` block in `<head>`. Add BEFORE it:
```html
    <!-- Satoshi (Bunny Fonts CDN) -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=satoshi:400,500,600,700,900&display=swap" rel="stylesheet">
```

In the existing Google Fonts URL, ADD `family=JetBrains+Mono:wght@400;500` to the request:
Change: `family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600`
To:     `family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500`

Do the same font additions in sluzby.html, galerie.html, kontakt.html, o-nas.html.

- [ ] **Step 2: Update CSS font variables**

In `css/style.css`, find the `:root` block and update font variables:
```css
    --font-heading: 'Satoshi', 'Space Grotesk', sans-serif;
    --font-body:    'Inter', sans-serif;
    --font-mono:    'JetBrains Mono', 'Geist Mono', monospace;
```

Apply mono font to hero stat numbers and technical data:
```css
.hero-stat-number,
.stat-number,
[data-count],
.tech-data { font-family: var(--font-mono); letter-spacing: -0.02em; }
```

- [ ] **Step 3: Glassmorphism 2.0 — inner-glow border on ALL glass surfaces**

Find each glassmorphism block in style.css and ADD `box-shadow: inset 0 0 0 1px rgba(255,255,255,0.10);` to:
- `.service-card` (already has backdrop-filter)
- `.blog-card`
- `.process-step`
- `.testimonial-card`
- `.hero-stat`

For the navbar, find `.navbar` and upgrade:
```css
.navbar {
    /* existing properties preserved, ADD: */
    background: rgba(var(--bg-rgb, 10, 10, 10), 0.65);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    box-shadow: inset 0 -1px 0 rgba(255,255,255,0.06), 0 4px 32px rgba(0,0,0,0.3);
}
[data-theme="light"] .navbar {
    background: rgba(255, 255, 255, 0.72);
    box-shadow: inset 0 -1px 0 rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.08);
}
```

- [ ] **Step 4: Commit**
```bash
git add css/style.css index.html sluzby.html galerie.html kontakt.html o-nas.html
git commit -m "feat: Satoshi + JetBrains Mono fonts, glassmorphism 2.0 inner-glow, navbar upgrade"
```

---

## Task 4: Shimmer + Typing + Enhanced Magnetic

**Files:** CREATE `js/quantum-ui.js`, MODIFY `css/style.css`

**What it does:** Shimmer sweep animation on `.btn-primary` and `.navbar-cta`. Typing counter effect on hero stats (replaces GSAP count-up with typewriter feel). Enhanced magnetic pull with 50px radius using CSS custom property `--mx`/`--my`.

- [ ] **Step 1: Add shimmer CSS to style.css**

Append to `css/style.css`:
```css
/* ==================== SHIMMER + QUANTUM UI ==================== */
@keyframes shimmer {
    0%   { transform: translateX(-120%) skewX(-15deg); }
    100% { transform: translateX(220%)  skewX(-15deg); }
}

/* Shimmer on btn-primary */
/* NOTE: .btn-primary must have position: relative for ::before to be scoped correctly */
.btn-primary { overflow: hidden; position: relative; }
.btn-primary::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 40%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
    transform: translateX(-120%) skewX(-15deg);
    pointer-events: none;
}
.btn-primary:hover::before {
    animation: shimmer 0.65s ease forwards;
}

/* Typing cursor blink on hero stats */
.hero-stat-number.typing::after {
    content: '|';
    animation: blink 0.7s step-end infinite;
    color: var(--primary);
    margin-left: 1px;
}
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

/* Enhanced magnetic — CSS custom property approach */
.btn-primary, .navbar-cta {
    --mx: 0px; --my: 0px;
    transform: translate(var(--mx), var(--my));
    transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1),
                background 0.2s ease, box-shadow 0.25s ease;
    will-change: transform;
}
```

- [ ] **Step 2: Create js/quantum-ui.js**

```js
// ==================== QUANTUM UI — SHIMMER + TYPING + MAGNETIC ====================
(function () {
    'use strict';

    // ---- 1. Enhanced Magnetic Pull (50px radius) ----
    var RADIUS = 50;
    var STRENGTH = 0.35;
    if (window.matchMedia('(hover: hover)').matches &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {

        document.querySelectorAll('.btn-primary, .navbar-cta').forEach(function (btn) {
            btn.addEventListener('mousemove', function (e) {
                var rect = btn.getBoundingClientRect();
                var cx   = rect.left + rect.width  / 2;
                var cy   = rect.top  + rect.height / 2;
                var dx   = e.clientX - cx;
                var dy   = e.clientY - cy;
                var dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < RADIUS) {
                    var pull = (1 - dist / RADIUS);
                    var mx   = dx * pull * STRENGTH;
                    var my   = dy * pull * STRENGTH;
                    btn.style.setProperty('--mx', mx.toFixed(2) + 'px');
                    btn.style.setProperty('--my', my.toFixed(2) + 'px');
                }
            }, { passive: true });

            btn.addEventListener('mouseleave', function () {
                btn.style.setProperty('--mx', '0px');
                btn.style.setProperty('--my', '0px');
            });
        });
    }

    // ---- 2. Typing Counter for hero stats ----
    // Replaces the plain number with a typewriter-style count-up
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var el     = entry.target;
                var target = parseInt(el.getAttribute('data-count'), 10);
                var suffix = el.getAttribute('data-suffix') || '';
                if (isNaN(target)) return;

                el.classList.add('typing');
                var start    = 0;
                var duration = 1800;
                var startTs  = null;

                function step(ts) {
                    if (!startTs) startTs = ts;
                    var progress = Math.min((ts - startTs) / duration, 1);
                    var eased    = 1 - Math.pow(1 - progress, 3); // easeOutCubic
                    var val      = Math.round(start + eased * (target - start));
                    el.textContent = val + suffix;
                    if (progress < 1) {
                        requestAnimationFrame(step);
                    } else {
                        el.textContent = target + suffix;
                        el.classList.remove('typing');
                    }
                }
                requestAnimationFrame(step);
                observer.unobserve(el);
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('[data-count]').forEach(function (el) {
            observer.observe(el);
        });
    }

    // ---- 3. Glassmorphism inner-glow on scroll (intensify on hero visibility) ----
    var heroSection = document.getElementById('hlavni');
    if (heroSection) {
        var heroObserver = new IntersectionObserver(function (entries) {
            var ratio = entries[0].intersectionRatio;
            document.querySelectorAll('.service-card, .blog-card, .process-step').forEach(function (card) {
                var glow = 'inset 0 0 0 1px rgba(255,255,255,' + (0.06 + ratio * 0.08) + ')';
                card.style.boxShadow = glow;
            });
        }, { threshold: Array.from({ length: 11 }, function (_, i) { return i / 10; }) });
        heroObserver.observe(heroSection);
    }

})();
```

- [ ] **Step 3: Remove the old magnetic IIFE from main.js**

Verify the exact location first:
```bash
grep -n "MAGNETIC BUTTONS" js/main.js
```
Expected: single match at ~line 711.

The IIFE to delete spans from the `// ==================== MAGNETIC BUTTONS ====================` comment through the closing `})();` — exactly this block (lines 711–730 in current file):
```
// ==================== MAGNETIC BUTTONS ====================
(function () {
    'use strict';
    if (!window.matchMedia('(hover: hover)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.querySelectorAll('.btn-primary, .navbar-cta').forEach(function (btn) {
        btn.addEventListener('mousemove', function (e) {
            var rect   = btn.getBoundingClientRect();
            var cx     = rect.left + rect.width  / 2;
            var cy     = rect.top  + rect.height / 2;
            var dx     = (e.clientX - cx) * 0.25;
            var dy     = (e.clientY - cy) * 0.25;
            btn.style.transform = 'translate(' + dx + 'px,' + dy + 'px) translateY(-2px)';
        }, { passive: true });
        btn.addEventListener('mouseleave', function () {
            btn.style.transform = '';
        });
    });
})();
```

Delete this entire block. The `// ==================== CUSTOM CURSOR + SCROLL PROGRESS ====================` IIFE immediately after must remain.

quantum-ui.js replaces this with the enhanced 50px CSS-custom-property version.

- [ ] **Step 4: Commit**
```bash
git add js/quantum-ui.js css/style.css js/main.js
git commit -m "feat: shimmer on buttons, typing counter, enhanced 50px magnetic pull (quantum-ui.js)"
```

---

## Task 5: Supabase Schema + Netlify Function

**Files:** CREATE `netlify/functions/quantum-data.js`

**What it does:** Single Netlify Function that fetches testimonials and site stats from Supabase. Supports `?type=testimonials`, `?type=stats`, `?type=all`. Used by the frontend to hydrate `#reference` section and hero stats.

**Prerequisites (manual setup — do once):**
1. Create Supabase project at supabase.com → get `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
2. Add both to Netlify env vars (Site settings → Environment variables)
3. Run the SQL schema below in Supabase SQL Editor

- [ ] **Step 1: Run Supabase SQL schema**

In Supabase SQL Editor, run:
```sql
-- Testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    company     TEXT,
    role        TEXT,
    text        TEXT NOT NULL,
    rating      INTEGER DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
    avatar_url  TEXT,
    active      BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default data
INSERT INTO testimonials (name, company, role, text, rating) VALUES
('Ondřej Mezihořák', 'Silponix Racing', 'Závodní jezdec', 'Spolupráce se Silponix je na profesionální úrovni. Stavba vozu proběhla přesně podle specifikací, výsledky na trati mluví za vše.', 5),
('Martin Hemerek', 'DHV Racing', 'Pilot rally', 'Pronájem závodního vozu Honda byl bezproblémový. Vůz byl perfektně připraven, tým vždy ochotný poradit.', 5),
('Václav Mudrák', 'Soukromý závodník', 'Navigátor', 'ECU tuning Hondata od Silponix posunul výkon vozu na úplně jinou úroveň. Doporučuji každému.', 5);

-- Site stats table
CREATE TABLE IF NOT EXISTS site_stats (
    id       SERIAL PRIMARY KEY,
    key      TEXT UNIQUE NOT NULL,
    value    INTEGER NOT NULL,
    suffix   TEXT DEFAULT '+',
    label_cs TEXT,
    label_en TEXT
);

-- Seed default stats
INSERT INTO site_stats (key, value, suffix, label_cs, label_en) VALUES
('race_parts',    500, '+',  'závodních dílů',  'racing parts'),
('race_cars',     20,  '+',  'závodních vozů',  'race cars built'),
('experience',    15,  ' let', 'zkušeností',   'years experience'),
('championships', 8,   'x',   'šampionáty',    'championships');

-- Enable Row Level Security (read-only public, write only via service role)
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_stats   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON testimonials FOR SELECT USING (active = true);
CREATE POLICY "Public read" ON site_stats   FOR SELECT USING (true);
```

- [ ] **Step 2: Install Supabase dependency**

```bash
cd "c:/2026/Webzitra0000/webzitra/.claude/worktrees/elegant-merkle/silponix-demo"
npm install @supabase/supabase-js
```

Verify `package.json` has `@supabase/supabase-js` in dependencies.

- [ ] **Step 3: Create netlify/functions/quantum-data.js**

```js
// netlify/functions/quantum-data.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL     = process.env.SUPABASE_URL;
const SUPABASE_KEY     = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CACHE_SECONDS    = 300; // 5 min cache

exports.handler = async function (event) {
    const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`,
        'Access-Control-Allow-Origin': '*',
    };

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Supabase not configured' }) };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const type     = (event.queryStringParameters || {}).type || 'all';

    try {
        const result = {};

        if (type === 'all' || type === 'testimonials') {
            const { data, error } = await supabase
                .from('testimonials')
                .select('id, name, company, role, text, rating, avatar_url')
                .eq('active', true)
                .order('id');
            if (error) throw error;
            result.testimonials = data;
        }

        if (type === 'all' || type === 'stats') {
            const { data, error } = await supabase
                .from('site_stats')
                .select('key, value, suffix, label_cs, label_en')
                .order('id');
            if (error) throw error;
            result.stats = data;
        }

        return { statusCode: 200, headers, body: JSON.stringify(result) };
    } catch (err) {
        console.error('quantum-data error:', err);
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
};
```

- [ ] **Step 4: Test the function locally**

```bash
cd "c:/2026/Webzitra0000/webzitra/.claude/worktrees/elegant-merkle/silponix-demo"
# Set env vars temporarily for test
SUPABASE_URL=<your-url> SUPABASE_SERVICE_ROLE_KEY=<your-key> netlify dev
# Visit: http://localhost:8888/.netlify/functions/quantum-data?type=all
# Expected: {"testimonials":[...],"stats":[...]}
```

- [ ] **Step 5: Commit**
```bash
git add netlify/functions/quantum-data.js package.json package-lock.json
git commit -m "feat: Netlify Function quantum-data — Supabase testimonials + stats endpoint"
```

---

## Task 6: Frontend Data Hydration

**Files:** MODIFY `index.html` (add fetch script, update testimonials HTML), MODIFY `css/style.css`

**What it does:** On DOMContentLoaded, fetches `/.netlify/functions/quantum-data?type=all`. Hydrates testimonial cards in `#reference` and updates `[data-count]` attributes in hero stats. Falls back gracefully if fetch fails (static content already in HTML).

- [ ] **Step 1: Update hero stats to use data from Supabase keys**

In `index.html`, find the `.hero-stat` elements with `data-count`. Add `data-stat-key` attribute matching Supabase `key` column:
```html
<span class="hero-stat-number" data-count="500" data-suffix="+" data-stat-key="race_parts">500+</span>
<span class="hero-stat-number" data-count="20"  data-suffix="+" data-stat-key="race_cars">20+</span>
<span class="hero-stat-number" data-count="15"  data-suffix=" let" data-stat-key="experience">15 let</span>
```

- [ ] **Step 2: Add hydration script to index.html**

Before `</body>` in `index.html`, add a small inline script AFTER all other scripts:
```html
    <script>
    // ==================== QUANTUM DATA HYDRATION ====================
    (function () {
        'use strict';
        fetch('/.netlify/functions/quantum-data?type=all')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                // Hydrate stats
                if (data.stats) {
                    data.stats.forEach(function (stat) {
                        var el = document.querySelector('[data-stat-key="' + stat.key + '"]');
                        if (el) {
                            el.setAttribute('data-count', stat.value);
                            el.setAttribute('data-suffix', stat.suffix || '');
                        }
                    });
                }
                // Hydrate testimonials
                if (data.testimonials && data.testimonials.length) {
                    var grid = document.querySelector('#reference .testimonials-grid, #reference .reference-grid, #reference .grid');
                    if (!grid) return;
                    grid.innerHTML = '';
                    data.testimonials.forEach(function (t) {
                        var stars = '';
                        for (var i = 0; i < (t.rating || 5); i++) stars += '★';
                        var card = document.createElement('div');
                        card.className = 'testimonial-card';
                        card.innerHTML =
                            '<div class="testimonial-stars"><span>' + stars + '</span></div>' +
                            '<p class="testimonial-text">\u201E' + escapeHTML(t.text) + '\u201C</p>' +
                            '<div class="testimonial-author">' +
                                '<strong class="testimonial-name">' + escapeHTML(t.name) + '</strong>' +
                                (t.company ? '<span class="testimonial-company">' + escapeHTML(t.company) + '</span>' : '') +
                            '</div>';
                        grid.appendChild(card);
                    });
                }
            })
            .catch(function () { /* silent fail — static content already visible */ });

        function escapeHTML(str) {
            var d = document.createElement('div');
            d.appendChild(document.createTextNode(str || ''));
            return d.innerHTML;
        }
    })();
    </script>
```

- [ ] **Step 3: Verify fallback**

Open index.html locally without a running function server. The static HTML testimonials/stats must still display correctly (hydration is additive, not destructive).

- [ ] **Step 4: Read the #reference section HTML to confirm the grid selector**

```bash
grep -n "reference\|testimonial\|grid" index.html | head -20
```

Update the `grid` selector in the hydration script to match exactly what is found.

- [ ] **Step 5: Commit**
```bash
git add index.html
git commit -m "feat: Supabase data hydration — live testimonials + stats from quantum-data function"
```

---

## Task 7: Admin Dashboard

**Files:** CREATE `admin/quantum.html`, CREATE `admin/quantum.js`, CREATE `netlify/functions/quantum-admin.js`

**What it does:** Minimal admin panel at `/admin/quantum.html` behind the existing admin auth (`window.SilponixAdmin` or existing admin-auth.js pattern). Lists and edits testimonials + stats via Netlify Functions.

**Prerequisites (manual setup — do once):**
1. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` must already be set (from Task 5)
2. Add `ADMIN_SECRET` to Netlify env vars — this is a **separate** secret from `TOKEN_SECRET`. Generate a strong random string (e.g. `openssl rand -hex 32`). The function falls back to `TOKEN_SECRET` if `ADMIN_SECRET` is not set, but setting it separately is recommended for security.
3. Note the value — the admin frontend (`quantum.js`) sends this as `Authorization: Bearer <ADMIN_SECRET>` header.

- [ ] **Step 1: Create netlify/functions/quantum-admin.js**

```js
// netlify/functions/quantum-admin.js
const { createClient } = require('@supabase/supabase-js');

// Reuse existing admin auth pattern
const ADMIN_TOKEN = process.env.ADMIN_SECRET || process.env.TOKEN_SECRET;

function authenticate(event) {
    const auth = (event.headers['authorization'] || '').replace('Bearer ', '');
    return auth === ADMIN_TOKEN;
}

exports.handler = async function (event) {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
    if (event.httpMethod !== 'POST')    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    if (!authenticate(event))           return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { action, table, id, data } = JSON.parse(event.body || '{}');

    const ALLOWED_TABLES = ['testimonials', 'site_stats'];
    if (!ALLOWED_TABLES.includes(table)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid table' }) };
    }

    try {
        let result;
        if (action === 'list') {
            result = await supabase.from(table).select('*').order('id');
        } else if (action === 'upsert') {
            result = await supabase.from(table).upsert(data).select();
        } else if (action === 'delete') {
            result = await supabase.from(table).delete().eq('id', id);
        } else {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action' }) };
        }
        if (result.error) throw result.error;
        return { statusCode: 200, headers, body: JSON.stringify({ data: result.data }) };
    } catch (err) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
};
```

- [ ] **Step 2: Create admin/quantum.html**

```html
<!DOCTYPE html>
<html lang="cs" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quantum Admin — Silponix</title>
    <meta name="robots" content="noindex, nofollow">
    <link href="https://fonts.bunny.net/css?family=satoshi:400,500,600,700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
            --bg: #050505; --surface: rgba(255,255,255,0.04);
            --border: rgba(255,255,255,0.08); --text: #e1e1e1; --muted: #888;
            --primary: #bd141b; --accent: #f59e0b;
            --font: 'Satoshi', sans-serif; --mono: 'JetBrains Mono', monospace;
            --radius: 12px;
        }
        [data-theme="light"] { --bg: #f8f8f8; --surface: rgba(0,0,0,0.03); --border: rgba(0,0,0,0.1); --text: #111; --muted: #666; }
        body { font-family: var(--font); background: var(--bg); color: var(--text); min-height: 100vh; }

        .qa-header { padding: 1.5rem 2rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 1rem; }
        .qa-header h1 { font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; }
        .qa-header .badge { font-family: var(--mono); font-size: 0.7rem; padding: 0.2rem 0.6rem; border-radius: 999px; background: var(--primary); color: #fff; }

        #loginScreen { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        .login-card { width: 320px; padding: 2rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
        .login-card h2 { font-size: 1.2rem; margin-bottom: 1.5rem; }

        .qa-layout { display: grid; grid-template-columns: 200px 1fr; min-height: calc(100vh - 65px); }
        .qa-sidebar { padding: 1.5rem 1rem; border-right: 1px solid var(--border); display: flex; flex-direction: column; gap: 0.4rem; }
        .qa-nav-btn { padding: 0.6rem 1rem; border-radius: 8px; border: none; cursor: pointer; text-align: left; font-family: var(--font); font-size: 0.875rem; background: transparent; color: var(--muted); transition: all 0.15s; }
        .qa-nav-btn.active, .qa-nav-btn:hover { background: var(--surface); color: var(--text); }
        .qa-content { padding: 2rem; }

        .panel { display: none; }
        .panel.active { display: block; }

        table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        th { text-align: left; padding: 0.6rem 1rem; border-bottom: 1px solid var(--border); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); }
        td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); vertical-align: top; max-width: 300px; }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: var(--surface); }

        .btn { padding: 0.5rem 1rem; border-radius: 8px; border: none; cursor: pointer; font-family: var(--font); font-size: 0.875rem; font-weight: 600; transition: all 0.15s; }
        .btn-primary { background: var(--primary); color: #fff; }
        .btn-danger  { background: rgba(239,68,68,0.15); color: #ef4444; }
        .btn-sm { padding: 0.3rem 0.75rem; font-size: 0.8rem; }
        .btn + .btn { margin-left: 0.5rem; }

        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.4rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; }
        input, textarea, select { width: 100%; padding: 0.6rem 0.875rem; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-family: var(--font); font-size: 0.9rem; }
        textarea { resize: vertical; min-height: 80px; }
        input:focus, textarea:focus { outline: 2px solid var(--primary); border-color: transparent; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: none; align-items: center; justify-content: center; z-index: 1000; }
        .modal-overlay.open { display: flex; }
        .modal { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; width: min(90vw, 480px); }
        .modal h3 { font-size: 1rem; font-weight: 700; margin-bottom: 1.25rem; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem; }

        .toast { position: fixed; bottom: 1.5rem; right: 1.5rem; padding: 0.75rem 1.25rem; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; transform: translateY(80px); opacity: 0; transition: all 0.3s; z-index: 9999; }
        .toast.show { transform: translateY(0); opacity: 1; }
        .toast.success { border-color: #22c55e; color: #22c55e; }
        .toast.error   { border-color: #ef4444; color: #ef4444; }
    </style>
</head>
<body>
    <!-- Login Screen -->
    <div id="loginScreen">
        <div class="login-card">
            <h2>Quantum Admin</h2>
            <div class="form-group">
                <label>Admin Token</label>
                <input type="password" id="loginToken" placeholder="Zadej admin token…">
            </div>
            <button class="btn btn-primary" id="loginBtn" style="width:100%">Přihlásit se</button>
        </div>
    </div>

    <!-- Dashboard (hidden until auth) -->
    <div id="dashboard" hidden>
        <header class="qa-header">
            <h1>Quantum Admin</h1>
            <span class="badge">SILPONIX</span>
        </header>
        <div class="qa-layout">
            <nav class="qa-sidebar">
                <button class="qa-nav-btn active" data-panel="panelTestimonials">Testimonials</button>
                <button class="qa-nav-btn" data-panel="panelStats">Site Stats</button>
            </nav>
            <main class="qa-content">
                <div id="panelTestimonials" class="panel active">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;">
                        <h2 style="font-size:1.1rem;font-weight:700">Testimonials</h2>
                        <button class="btn btn-primary btn-sm" id="addTestimonialBtn">+ Přidat</button>
                    </div>
                    <table id="testimonialsTable">
                        <thead><tr><th>Jméno</th><th>Firma</th><th>Hodnocení</th><th>Aktivní</th><th></th></tr></thead>
                        <tbody></tbody>
                    </table>
                </div>
                <div id="panelStats" class="panel">
                    <h2 style="font-size:1.1rem;font-weight:700;margin-bottom:1.25rem">Site Stats</h2>
                    <table id="statsTable">
                        <thead><tr><th>Klíč</th><th>Hodnota</th><th>Přípona</th><th>Popisek CZ</th><th></th></tr></thead>
                        <tbody></tbody>
                    </table>
                </div>
            </main>
        </div>
    </div>

    <!-- Modal -->
    <div class="modal-overlay" id="modalOverlay">
        <div class="modal">
            <h3 id="modalTitle">Editace</h3>
            <div id="modalBody"></div>
            <div class="modal-footer">
                <button class="btn" id="modalCancel">Zrušit</button>
                <button class="btn btn-primary" id="modalSave">Uložit</button>
            </div>
        </div>
    </div>

    <!-- Toast -->
    <div class="toast" id="toast"></div>

    <script src="/admin/quantum.js?v=12"></script>
</body>
</html>
```

- [ ] **Step 3: Create admin/quantum.js**

```js
// admin/quantum.js
(function () {
    'use strict';

    var token = '';
    var API   = '/.netlify/functions/quantum-admin';

    // ---- Auth ----
    document.getElementById('loginBtn').addEventListener('click', function () {
        token = document.getElementById('loginToken').value.trim();
        if (!token) return;
        apiCall('list', 'testimonials').then(function () {
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('dashboard').removeAttribute('hidden');
            loadAll();
        }).catch(function () {
            showToast('Špatný token', 'error');
        });
    });

    document.getElementById('loginToken').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') document.getElementById('loginBtn').click();
    });

    // ---- API ----
    function apiCall(action, table, data, id) {
        return fetch(API, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: action, table: table, data: data, id: id })
        }).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        });
    }

    // ---- Load ----
    function loadAll() { loadTestimonials(); loadStats(); }

    function loadTestimonials() {
        apiCall('list', 'testimonials').then(function (res) {
            var tbody = document.querySelector('#testimonialsTable tbody');
            tbody.innerHTML = '';
            (res.data || []).forEach(function (t) {
                var tr = document.createElement('tr');
                tr.innerHTML =
                    '<td>' + escapeHTML(t.name) + '</td>' +
                    '<td>' + escapeHTML(t.company || '—') + '</td>' +
                    '<td>' + '★'.repeat(t.rating || 5) + '</td>' +
                    '<td>' + (t.active ? '✅' : '❌') + '</td>' +
                    '<td><button class="btn btn-sm" onclick="editTestimonial(' + t.id + ')">Upravit</button>' +
                        '<button class="btn btn-danger btn-sm" onclick="deleteRow(\'testimonials\',' + t.id + ')">Smazat</button></td>';
                tbody.appendChild(tr);
            });
            window._testimonials = res.data || [];
        });
    }

    function loadStats() {
        apiCall('list', 'site_stats').then(function (res) {
            var tbody = document.querySelector('#statsTable tbody');
            tbody.innerHTML = '';
            (res.data || []).forEach(function (s) {
                var tr = document.createElement('tr');
                tr.innerHTML =
                    '<td><code>' + escapeHTML(s.key) + '</code></td>' +
                    '<td><strong>' + s.value + '</strong></td>' +
                    '<td>' + escapeHTML(s.suffix || '') + '</td>' +
                    '<td>' + escapeHTML(s.label_cs || '') + '</td>' +
                    '<td><button class="btn btn-sm" onclick="editStat(' + s.id + ')">Upravit</button></td>';
                tbody.appendChild(tr);
            });
            window._stats = res.data || [];
        });
    }

    // ---- Sidebar nav ----
    document.querySelectorAll('.qa-nav-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.qa-nav-btn').forEach(function (b) { b.classList.remove('active'); });
            document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('active'); });
            btn.classList.add('active');
            document.getElementById(btn.getAttribute('data-panel')).classList.add('active');
        });
    });

    // ---- Add testimonial ----
    document.getElementById('addTestimonialBtn').addEventListener('click', function () {
        openModal('Přidat Testimonial', testimonialForm({}), function (data) {
            apiCall('upsert', 'testimonials', data).then(function () {
                showToast('Uloženo', 'success'); loadTestimonials();
            }).catch(function (e) { showToast(e.message, 'error'); });
        });
    });

    window.editTestimonial = function (id) {
        var t = (window._testimonials || []).find(function (x) { return x.id === id; }) || {};
        openModal('Upravit Testimonial', testimonialForm(t), function (data) {
            data.id = id;
            apiCall('upsert', 'testimonials', data).then(function () {
                showToast('Uloženo', 'success'); loadTestimonials();
            }).catch(function (e) { showToast(e.message, 'error'); });
        });
    };

    window.editStat = function (id) {
        var s = (window._stats || []).find(function (x) { return x.id === id; }) || {};
        openModal('Upravit Stat', statForm(s), function (data) {
            data.id = id;
            apiCall('upsert', 'site_stats', data).then(function () {
                showToast('Uloženo', 'success'); loadStats();
            }).catch(function (e) { showToast(e.message, 'error'); });
        });
    };

    window.deleteRow = function (table, id) {
        if (!confirm('Opravdu smazat?')) return;
        apiCall('delete', table, null, id).then(function () {
            showToast('Smazáno', 'success'); loadAll();
        }).catch(function (e) { showToast(e.message, 'error'); });
    };

    // ---- Forms ----
    function testimonialForm(t) {
        return '<div class="form-group"><label>Jméno *</label><input id="fName" value="' + escapeHTML(t.name||'') + '"></div>' +
               '<div class="form-group"><label>Firma</label><input id="fCompany" value="' + escapeHTML(t.company||'') + '"></div>' +
               '<div class="form-group"><label>Role</label><input id="fRole" value="' + escapeHTML(t.role||'') + '"></div>' +
               '<div class="form-group"><label>Text *</label><textarea id="fText">' + escapeHTML(t.text||'') + '</textarea></div>' +
               '<div class="form-group"><label>Hodnocení</label><select id="fRating">' +
                   [5,4,3,2,1].map(function(v){ return '<option value="'+v+'"' + (t.rating===v?' selected':'') + '>'+v+'★</option>'; }).join('') +
               '</select></div>' +
               '<div class="form-group"><label><input type="checkbox" id="fActive"' + (t.active!==false?' checked':'') + '> Aktivní</label></div>';
    }

    function statForm(s) {
        return '<div class="form-group"><label>Klíč</label><input id="fKey" value="' + escapeHTML(s.key||'') + '" readonly></div>' +
               '<div class="form-group"><label>Hodnota *</label><input id="fValue" type="number" value="' + (s.value||0) + '"></div>' +
               '<div class="form-group"><label>Přípona</label><input id="fSuffix" value="' + escapeHTML(s.suffix||'') + '"></div>' +
               '<div class="form-group"><label>Popisek CZ</label><input id="fLabelCs" value="' + escapeHTML(s.label_cs||'') + '"></div>';
    }

    // ---- Modal ----
    var modalCallback = null;
    function openModal(title, bodyHTML, onSave) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = bodyHTML;
        modalCallback = onSave;
        document.getElementById('modalOverlay').classList.add('open');
    }
    document.getElementById('modalCancel').addEventListener('click', function () {
        document.getElementById('modalOverlay').classList.remove('open');
    });
    document.getElementById('modalSave').addEventListener('click', function () {
        var data = {};
        var fName = document.getElementById('fName');
        if (fName) {
            data.name    = fName.value.trim();
            data.company = (document.getElementById('fCompany')||{}).value || '';
            data.role    = (document.getElementById('fRole')||{}).value || '';
            data.text    = (document.getElementById('fText')||{}).value || '';
            data.rating  = parseInt((document.getElementById('fRating')||{}).value||'5', 10);
            data.active  = (document.getElementById('fActive')||{}).checked !== false;
        }
        var fValue = document.getElementById('fValue');
        if (fValue) {
            data.value    = parseInt(fValue.value, 10);
            data.suffix   = (document.getElementById('fSuffix')||{}).value || '';
            data.label_cs = (document.getElementById('fLabelCs')||{}).value || '';
        }
        if (typeof modalCallback === 'function') modalCallback(data);
        document.getElementById('modalOverlay').classList.remove('open');
    });

    // ---- Toast ----
    function showToast(msg, type) {
        var t = document.getElementById('toast');
        t.textContent = msg;
        t.className = 'toast ' + (type || '');
        requestAnimationFrame(function () {
            requestAnimationFrame(function () { t.classList.add('show'); });
        });
        setTimeout(function () { t.classList.remove('show'); }, 3000);
    }

    function escapeHTML(str) {
        var d = document.createElement('div');
        d.appendChild(document.createTextNode(str || ''));
        return d.innerHTML;
    }
})();
```

- [ ] **Step 4: Commit**
```bash
git add admin/quantum.html admin/quantum.js netlify/functions/quantum-admin.js
git commit -m "feat: Quantum Admin dashboard — testimonials + stats CRUD via Supabase"
```

---

## Task 8: Final Cache Bump + Deploy

- [ ] **Step 1: Bump all v=12 everywhere if not already done**

```bash
cd "c:/2026/Webzitra0000/webzitra/.claude/worktrees/elegant-merkle/silponix-demo"
grep -rl "v=11" *.html | xargs sed -i 's/v=11/v=12/g'
```

- [ ] **Step 2: Push + Deploy**
```bash
git add -A
git commit -m "chore: version bump v12, final cache bust"
git push origin matty/silponix-nextgen-visual
netlify deploy --prod --dir . --site d65cd28c-8c46-4fd9-998b-3c9ea250dbc4
```

- [ ] **Step 3: Verify live**

Check https://silponix-demo.netlify.app/:
- Three.js metaballs visible on hero (blended red/amber blobs)
- Shimmer on button hover
- Bento grid services layout
- JetBrains Mono on stat numbers
- Navbar glassmorphism
- Stats update from Supabase

---

## Verifikace checklisty

| Feature | Jak ověřit |
|---------|-----------|
| Three.js Metaballs | Hero sekce — barevné bloby se pohybují, přitahovány kurzorem |
| WebGL fallback | DevTools → disable WebGL → canvas hidden, vše ostatní funguje |
| UnrealBloom | Bloby mají glow halo efekt |
| Chromatic aberration | Hrany blob mají R/B color shift |
| Bento Grid | Services sekce — 2 karty wide (Stavba vozů + ECU Hondata) |
| Satoshi font | Headings mají nový font (inspect element) |
| JetBrains Mono | Stat čísla v hero + karty |
| Shimmer | Hover na btn-primary → sweep efekt |
| Typing counter | Scrolluj na hero stats → čísla se typují |
| 50px Magnetic | Kurzor přiblíž btn-primary → tlačítko "přitahuje" |
| Supabase hydration | Testimonials v #reference sekci z DB |
| Admin dashboard | /admin/quantum.html → přihlásit token → CRUD funguje |
