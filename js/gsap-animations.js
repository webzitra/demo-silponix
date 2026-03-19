// ==================== GSAP ANIMATIONS ====================
(function () {
    'use strict';

    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);
    if (typeof SplitText  !== 'undefined') gsap.registerPlugin(SplitText);
    if (typeof Flip       !== 'undefined') gsap.registerPlugin(Flip);
    if (typeof Observer   !== 'undefined') gsap.registerPlugin(Observer);

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    // --- 1. Lenis smooth scroll ---
    var lenis;
    if (typeof Lenis !== 'undefined') {
        lenis = new Lenis({ lerp: 0.09, smoothWheel: true, syncTouch: false });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
    }

    // --- 2. Hero title word split ---
    var heroTitle = document.querySelector('.hero-slide.active .hero-title');
    if (heroTitle && typeof SplitText !== 'undefined') {
        var split = new SplitText(heroTitle, { type: 'words', wordsClass: 'word-wrap' });
        gsap.set(split.words, { opacity: 0, y: 40, filter: 'blur(6px)' });
        gsap.to(split.words, {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 0.8,
            stagger: 0.08,
            ease: 'power3.out',
            delay: 0.3
        });
    }

    // Section titles are inside [data-animate] containers — handled by IntersectionObserver in main.js.
    // GSAP clip-path would conflict (sets opacity:0 while CSS already animates parent to opacity:1).

    // --- 3. Section badge stagger ---
    gsap.utils.toArray('.section-badge').forEach(function (badge) {
        gsap.from(badge, {
            opacity: 0, y: -12, scale: 0.9,
            duration: 0.5,
            ease: 'back.out(1.5)',
            scrollTrigger: {
                trigger: badge,
                start: 'top 88%',
                once: true
            }
        });
    });

    // --- 4. Hero parallax ---
    gsap.utils.toArray('.hero-slide-bg').forEach(function (bg) {
        gsap.to(bg, {
            yPercent: -20,
            ease: 'none',
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: 1.5
            }
        });
    });

    // NOTE: service-card, process-step, testimonial-card are handled by [data-animate]
    // IntersectionObserver in main.js — do NOT animate them here (double-animation conflict).

    // [data-count] count-up is handled by quantum-ui.js and main.js — skip here to avoid triple conflict.

    // --- 6. Footer reveal ---
    gsap.from('footer .container > *', {
        y: 30, opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
            trigger: 'footer',
            start: 'top 90%',
            once: true
        }
    });

    // ScrollTrigger refresh on resize
    window.addEventListener('resize', function () {
        ScrollTrigger.refresh();
    }, { passive: true });

    // Observer tilt removed — skewY on cards with existing CSS transforms causes jitter.

})();
