// ==================== GSAP ANIMATIONS ====================
(function () {
    'use strict';

    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);
    if (typeof SplitText !== 'undefined') gsap.registerPlugin(SplitText);

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

    // --- 3. Section title clip-path reveal on scroll ---
    gsap.utils.toArray('.section-title').forEach(function (el) {
        gsap.fromTo(el,
            { clipPath: 'inset(0 100% 0 0)', opacity: 0 },
            {
                clipPath: 'inset(0 0% 0 0)', opacity: 1,
                duration: 0.9,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    once: true
                }
            }
        );
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

    // --- 5. Service cards GSAP stagger ---
    var serviceCards = gsap.utils.toArray('.service-card, .service-detail');
    if (serviceCards.length) {
        gsap.from(serviceCards, {
            y: 60, opacity: 0, scale: 0.96,
            duration: 0.75,
            stagger: { each: 0.1, from: 'start' },
            ease: 'power3.out',
            scrollTrigger: {
                trigger: serviceCards[0].closest('section') || serviceCards[0],
                start: 'top 80%',
                once: true
            }
        });
    }

    // --- 6. Process steps stagger ---
    var processSteps = gsap.utils.toArray('.process-step');
    if (processSteps.length) {
        gsap.from(processSteps, {
            y: 50, opacity: 0,
            duration: 0.7,
            stagger: { each: 0.12 },
            ease: 'power2.out',
            scrollTrigger: {
                trigger: processSteps[0].closest('section') || processSteps[0],
                start: 'top 78%',
                once: true
            }
        });
    }

    // --- 7. Testimonial cards ---
    var testimonials = gsap.utils.toArray('.testimonial-card');
    if (testimonials.length) {
        gsap.from(testimonials, {
            y: 40, opacity: 0, rotateY: -5,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: testimonials[0].closest('section') || testimonials[0],
                start: 'top 82%',
                once: true
            }
        });
    }

    // --- 8. Stats count-up enhanced ---
    gsap.utils.toArray('[data-count]').forEach(function (el) {
        var target = parseInt(el.getAttribute('data-count'), 10);
        var suffix = el.getAttribute('data-suffix') || '';
        var obj = { val: 0 };
        ScrollTrigger.create({
            trigger: el,
            start: 'top 85%',
            once: true,
            onEnter: function () {
                gsap.to(obj, {
                    val: target,
                    duration: 1.8,
                    ease: 'power2.out',
                    onUpdate: function () {
                        el.textContent = Math.round(obj.val) + suffix;
                    }
                });
            }
        });
    });

    // --- 9. Footer reveal ---
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

})();
