/* ════════════════════════════════════════════════════════════
   Silponix homepage — MARQUE interactions
   ─ Custom cursor (desktop only)
   ─ Section reveals (data-m-reveal)
   ─ Animated counters (data-counter)
   ─ Horizontal sticky-scroll cycle (data-cycle-pin / track)
   ─ Voices rotator (data-voice prev/next + auto-cycle)
   ════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    const home = document.querySelector('.home[data-marque]');
    if (!home) return;

    const reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ─── Reveal observer ───────────────────────────────── */
    const reveals = home.querySelectorAll('[data-m-reveal]');
    if ('IntersectionObserver' in window && reveals.length) {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-in');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
        reveals.forEach((el) => obs.observe(el));
    } else {
        reveals.forEach((el) => el.classList.add('is-in'));
    }

    /* ─── 3. Animated counters ─────────────────────────────── */
    const counters = home.querySelectorAll('[data-counter]');
    if (counters.length && 'IntersectionObserver' in window) {
        const animate = (el) => {
            const target = Number(el.dataset.counter) || 0;
            const numEl = el.querySelector('[data-counter-num]');
            if (!numEl) return;
            if (reduceMotion) { numEl.textContent = target; return; }
            const duration = 1800;
            const start = performance.now();
            const tick = (now) => {
                const t = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - t, 3);
                numEl.textContent = Math.round(target * eased);
                if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        };
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animate(entry.target);
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        counters.forEach((c) => obs.observe(c));
    }

    /* ─── 4. Horizontal sticky-scroll cycle ────────────────── */
    const pin = home.querySelector('[data-cycle-pin]');
    const track = home.querySelector('[data-cycle-track]');
    const slides = track ? track.querySelectorAll('.home-cycle-slide') : [];
    const dots = home.querySelectorAll('[data-cycle-dot]');
    const counterEl = home.querySelector('[data-cycle-counter]');

    if (pin && track && slides.length && !reduceMotion && window.innerWidth >= 1024) {
        const totalSlides = slides.length;

        const updateCycle = () => {
            const rect = pin.getBoundingClientRect();
            const total = pin.offsetHeight - window.innerHeight;
            const scrolled = -rect.top;
            const progress = Math.max(0, Math.min(1, scrolled / total));
            const translate = -progress * (totalSlides - 1) * 100;
            track.style.transform = `translate3d(${translate}vw, 0, 0)`;

            const activeIndex = Math.round(progress * (totalSlides - 1));
            dots.forEach((d) => d.classList.toggle('is-active', Number(d.dataset.cycleDot) === activeIndex));
            if (counterEl) {
                counterEl.textContent = String(activeIndex + 1).padStart(2, '0') + ' / ' + String(totalSlides).padStart(2, '0');
            }
        };

        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => { updateCycle(); ticking = false; });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        updateCycle();
    }

    /* ─── 5. Voices rotator ────────────────────────────────── */
    const stage = home.querySelector('[data-voices-stage]');
    const voices = stage ? stage.querySelectorAll('.home-voice') : [];
    const voicePrev = home.querySelector('[data-voice-prev]');
    const voiceNext = home.querySelector('[data-voice-next]');
    const voiceCounter = home.querySelector('[data-voice-counter]');

    if (stage && voices.length) {
        let active = 0;
        let auto = null;

        const setActive = (idx) => {
            active = (idx + voices.length) % voices.length;
            voices.forEach((v, i) => v.classList.toggle('is-active', i === active));
            if (voiceCounter) {
                voiceCounter.textContent = String(active + 1).padStart(2, '0') + ' / ' +
                    String(voices.length).padStart(2, '0');
            }
        };

        const startAuto = () => {
            stopAuto();
            if (reduceMotion) return;
            auto = setInterval(() => setActive(active + 1), 6500);
        };
        const stopAuto = () => { if (auto) { clearInterval(auto); auto = null; } };

        if (voicePrev) voicePrev.addEventListener('click', () => { setActive(active - 1); startAuto(); });
        if (voiceNext) voiceNext.addEventListener('click', () => { setActive(active + 1); startAuto(); });
        stage.addEventListener('mouseenter', stopAuto);
        stage.addEventListener('mouseleave', startAuto);

        startAuto();
    }
})();
