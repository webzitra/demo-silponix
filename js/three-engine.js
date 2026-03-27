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

        '  vec2 cur = u_cursor;',
        '  cur.x *= aspect;',
        '  float cd = length(p - cur);',
        '  float ripple = u_ripple * 0.015 * sin(cd * 40.0 - u_time * 6.0) * exp(-cd * 6.0);',
        '  sum += ripple;',

        '  float edge = smoothstep(0.96, 1.04, sum);',
        '  float glow = smoothstep(0.4, 0.97, sum) * 0.35;',

        '  vec3 cInner = vec3(0.741, 0.078, 0.106);',
        '  vec3 cOuter  = vec3(0.961, 0.620, 0.043);',
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
        u_balls:      { value: [] },
        u_radii:      { value: new Float32Array(8) },
        u_cursor:     { value: new THREE.Vector2(0.5, 0.5) },
        u_ripple:     { value: 0.0 }
    };

    // ---- Metaball state ----
    var balls = [];
    var NUM  = 8;

    for (var i = 0; i < NUM; i++) {
        balls.push({
            x:  Math.random(),
            y:  Math.random(),
            vx: (Math.random() - 0.5) * 0.0008,
            vy: (Math.random() - 0.5) * 0.0008,
            r:  0.025 + Math.random() * 0.040
        });
    }

    for (var j = 0; j < NUM; j++) uniforms.u_radii.value[j] = balls[j].r;

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

        if (rippleDecay > 0) {
            rippleDecay -= dt * 1.2;
            uniforms.u_ripple.value = Math.max(0, rippleDecay);
        }

        for (var i = 0; i < NUM; i++) {
            var b = balls[i];
            b.x += b.vx;
            b.y += b.vy;
            if (b.x < 0.05 || b.x > 0.95) b.vx *= -1;
            if (b.y < 0.05 || b.y > 0.95) b.vy *= -1;
            b.vx *= 0.999;
            b.vy *= 0.999;
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
