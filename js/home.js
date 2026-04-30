/* ════════════════════════════════════════════════════════════
   Silponix homepage — Pitlane Editorial interactions
   ─ Section reveal observer (data-hc-reveal + data-section-head)
   ─ Sticky build cycle: active sector card synced to scroll
   ─ Telemetry HUD top-right: shows current section + lap time
   ════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    const reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ─── 1. Reveal observer (hero text already animates via CSS delay) ─ */
    const reveals = document.querySelectorAll('[data-hc-reveal], [data-section-head]');
    if ('IntersectionObserver' in window && reveals.length) {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-in');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -80px 0px' });
        reveals.forEach((el) => obs.observe(el));
    } else {
        reveals.forEach((el) => el.classList.add('is-in'));
    }

    /* ─── 2. Build cycle — active sector card synced ─ */
    const cycleSection = document.querySelector('.home-cycle');
    const cycleCards = cycleSection ? cycleSection.querySelectorAll('.home-cycle-card') : [];
    const pinSide = cycleSection ? cycleSection.querySelector('[data-pin-target]') : null;
    const pinNum = pinSide ? pinSide.querySelectorAll('[data-pin-num]') : [];
    const pinTitle = pinSide ? pinSide.querySelector('[data-pin-title]') : null;
    const pinDesc = pinSide ? pinSide.querySelector('[data-pin-desc]') : null;
    const progItems = pinSide ? pinSide.querySelectorAll('.home-cycle-prog-item') : [];

    function syncCycle() {
        if (!cycleCards.length || !pinSide) return;
        const vh = window.innerHeight;
        const target = vh * 0.5;
        let closest = null;
        let closestDist = Infinity;
        cycleCards.forEach((card) => {
            const rect = card.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > vh) return;
            const center = rect.top + rect.height / 2;
            const dist = Math.abs(center - target);
            if (dist < closestDist) {
                closestDist = dist;
                closest = card;
            }
        });
        if (!closest) return;
        const step = closest.dataset.step || '';
        cycleCards.forEach((c) => c.classList.toggle('is-active', c === closest));
        pinNum.forEach((el) => { el.textContent = step; });
        if (pinTitle) pinTitle.textContent = closest.dataset.title || '';
        if (pinDesc) pinDesc.textContent = closest.dataset.desc || '';
        progItems.forEach((p) => p.classList.toggle('is-active', p.dataset.step === step));
    }

    /* ─── 3. Telemetry HUD ─ */
    const hud = document.getElementById('homeHud');
    const hudPit = hud ? hud.querySelector('[data-hud-pit]') : null;
    const hudSection = hud ? hud.querySelector('[data-hud-section]') : null;
    const hudLap = hud ? hud.querySelector('[data-hud-lap]') : null;
    const sections = document.querySelectorAll('[data-hud]');

    let currentSection = null;
    function syncHud() {
        if (!hud || !sections.length) return;
        const vh = window.innerHeight;
        const target = vh * 0.4;
        let closest = null;
        let closestDist = Infinity;
        sections.forEach((sec) => {
            const rect = sec.getBoundingClientRect();
            if (rect.bottom < 0 || rect.top > vh) return;
            const center = rect.top + Math.min(rect.height, vh) / 2;
            const dist = Math.abs(center - target);
            if (dist < closestDist) {
                closestDist = dist;
                closest = sec;
            }
        });
        if (!closest || closest === currentSection) return;
        currentSection = closest;
        if (hudSection) hudSection.textContent = closest.dataset.hud || '—';
        if (hudPit) hudPit.textContent = 'PIT ' + (closest.dataset.pit || '01');

        // Show HUD only after first scroll past hero
        const heroBottom = sections[0].getBoundingClientRect().bottom;
        hud.classList.toggle('is-on', heroBottom < vh * 0.4);
    }

    /* Lap timer — slow virtual ticker, just visual feel */
    function startLapTimer() {
        if (!hudLap || reduceMotion) return;
        const start = performance.now();
        function tick(now) {
            const elapsed = (now - start) / 1000;
            const m = Math.floor(elapsed / 60);
            const s = Math.floor(elapsed % 60);
            const ms = Math.floor((elapsed * 100) % 100);
            hudLap.textContent =
                String(m).padStart(2, '0') + ':' +
                String(s).padStart(2, '0') + '.' +
                String(ms).padStart(2, '0');
            requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    /* ─── 4. Throttled scroll ─ */
    let ticking = false;
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            syncCycle();
            syncHud();
            ticking = false;
        });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
    startLapTimer();
})();
