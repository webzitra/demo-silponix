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
                    var eased    = 1 - Math.pow(1 - progress, 3);
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
