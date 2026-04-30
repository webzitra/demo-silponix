/* ════════════════════════════════════════════════════════════
   Silponix homepage — cinematic interactions
   - Cursor-tracked hero spotlight (CSS variables)
   - Animated stats counters (rAF, IntersectionObserver)
   - Scroll-synced pinned process (active card → side update)
   ════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    const reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ─── 1. Hero cursor spotlight ──────────────────────────── */
    const hero = document.querySelector('.hero-cinema');
    if (hero && !reduceMotion) {
        let raf = null;
        const onMove = (e) => {
            if (raf) return;
            raf = requestAnimationFrame(() => {
                const rect = hero.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                hero.style.setProperty('--mx', x + '%');
                hero.style.setProperty('--my', y + '%');
                raf = null;
            });
        };
        hero.addEventListener('mousemove', onMove, { passive: true });
        hero.addEventListener('mouseleave', () => {
            hero.style.setProperty('--mx', '50%');
            hero.style.setProperty('--my', '50%');
        });
    }

    /* ─── 2. Stats counters ─────────────────────────────────── */
    const counters = document.querySelectorAll('[data-counter]');
    if (counters.length && 'IntersectionObserver' in window) {
        const animateCounter = (el) => {
            const target = Number(el.dataset.counter) || 0;
            const numEl = el.querySelector('.stat-counter-num');
            if (!numEl) return;
            if (reduceMotion) { numEl.textContent = target; return; }
            const duration = 1600;
            const start = performance.now();
            const tick = (now) => {
                const t = Math.min((now - start) / duration, 1);
                // ease-out cubic
                const eased = 1 - Math.pow(1 - t, 3);
                numEl.textContent = Math.round(target * eased);
                if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        };
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.4 });
        counters.forEach((c) => obs.observe(c));
    }

    /* ─── 3. Pinned process — active card sync ──────────────── */
    const pinnedCards = document.querySelectorAll('.process-pinned-card');
    const pinnedSide = document.querySelector('.process-pinned-side[data-pin-target]');
    const pinnedProgress = document.querySelectorAll('.process-pinned-progress-item');
    if (pinnedCards.length && pinnedSide && 'IntersectionObserver' in window) {
        const sideNum = pinnedSide.querySelector('[data-pin-num]');
        const sideTitle = pinnedSide.querySelector('[data-pin-title]');
        const sideDesc = pinnedSide.querySelector('[data-pin-desc]');

        const setActive = (card) => {
            pinnedCards.forEach((c) => c.classList.toggle('is-active', c === card));
            const step = card.dataset.step || '';
            if (sideNum) sideNum.textContent = step;
            if (sideTitle) sideTitle.textContent = card.dataset.title || '';
            if (sideDesc) sideDesc.textContent = card.dataset.desc || '';
            pinnedProgress.forEach((p) => {
                p.classList.toggle('is-active', p.dataset.step === step);
            });
        };

        // Activate the card whose center is closest to viewport center
        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const vh = window.innerHeight;
                const target = vh * 0.5;
                let closest = null;
                let closestDist = Infinity;
                pinnedCards.forEach((card) => {
                    const rect = card.getBoundingClientRect();
                    const center = rect.top + rect.height / 2;
                    const dist = Math.abs(center - target);
                    if (dist < closestDist && rect.bottom > 0 && rect.top < vh) {
                        closestDist = dist;
                        closest = card;
                    }
                });
                if (closest) setActive(closest);
                ticking = false;
            });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* Featured products are hydrated by eshop.js into #featuredProducts. */
})();
