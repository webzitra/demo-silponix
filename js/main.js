/* ============================================================
   SILPONIX DEMO — MAIN.JS
   Core functionality: menu, navbar, animations, forms, cookies
   ============================================================ */

(function () {
    'use strict';

    /* ==================== DOM REFERENCES ==================== */
    var navbar = document.getElementById('navbar');
    var navbarMenu = document.getElementById('navbarMenu');
    var cookieBanner = document.getElementById('cookieBanner');
    var cookieAccept = document.getElementById('cookieAccept');
    var cookieDecline = document.getElementById('cookieDecline');
    var contactForm = document.querySelector('[data-wz-contact]');
    var navbarLinks = document.querySelectorAll('.navbar-link');

    /* ==================== STICKY NAVBAR ==================== */
    function handleNavbarScroll() {
        if (!navbar) return;
        var currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', handleNavbarScroll, { passive: true });
    handleNavbarScroll();

    /* ==================== NAV PILL — sliding active background ==================== */
    (function navPillActiveSlide() {
        var pill = document.querySelector('.nav-bar .nav-active-pill');
        var linksContainer = document.querySelector('.nav-bar .nav-links');
        if (!pill || !linksContainer) return;

        var links = linksContainer.querySelectorAll('.navbar-link');

        function moveTo(target) {
            if (!target) return;
            var containerRect = linksContainer.getBoundingClientRect();
            var rect = target.getBoundingClientRect();
            var x = rect.left - containerRect.left;
            var w = rect.width;
            pill.style.width = w + 'px';
            pill.style.transform = 'translate(' + x + 'px, -50%)';
        }

        function snapToActive() {
            var active = linksContainer.querySelector('.navbar-link.active') || links[0];
            moveTo(active);
            requestAnimationFrame(function () { pill.classList.add('ready'); });
        }

        // Initial
        if (document.readyState === 'complete') snapToActive();
        else window.addEventListener('load', snapToActive);

        // Hover slide
        links.forEach(function (link) {
            link.addEventListener('mouseenter', function () { moveTo(link); });
        });
        linksContainer.addEventListener('mouseleave', function () {
            var active = linksContainer.querySelector('.navbar-link.active') || links[0];
            moveTo(active);
        });

        // Re-snap on resize
        var resizeTimer = null;
        window.addEventListener('resize', function () {
            if (resizeTimer) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(snapToActive, 100);
        });
    })();



    /* ==================== SMOOTH SCROLL ==================== */
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#') return;
            var target = document.querySelector(targetId);
            if (!target) return;
            e.preventDefault();
            var navHeight = navbar ? navbar.offsetHeight : 0;
            var targetTop = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
            window.scrollTo({ top: targetTop, behavior: 'smooth' });
        });
    });

    /* ==================== SCROLL ANIMATIONS ==================== */
    function initAnimations() {
        var elements = document.querySelectorAll('[data-animate]');
        if (!elements.length) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            elements.forEach(function (el) { el.classList.add('animated'); });
            return;
        }
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        elements.forEach(function (el) { observer.observe(el); });

        // Auto-stagger for grid children
        var autoStaggerGrids = document.querySelectorAll('.blog-grid, .sponsors-grid, .about-stats');
        autoStaggerGrids.forEach(function(grid) {
            Array.from(grid.children).forEach(function(child, i) {
                if (!child.hasAttribute('data-animate')) {
                    child.setAttribute('data-animate', '');
                    child.style.transitionDelay = (i * 80) + 'ms';
                    observer.observe(child);
                }
            });
        });
    }

    initAnimations();

    /* ==================== LIT-CARD SCROLL-SPY ====================
       For each [data-spy-group]:
       1) On enter viewport: sequential reveal — each card lights up
          for 900ms with 220ms stagger, then dims.
       2) After reveal: keep one card lit at a time, switching every
          ~3.6s to a random sibling ("scanning lights" idle).
       3) :hover always overrides .lit (CSS hover wins visually).
       4) Reduced motion: skip the cycle, just static.
    ============================================================ */
    /* ───── Inject .ig-scan element into every animated card ─────
       Used by Silponix Ignition for telemetry scan-line sweep on hover/lit. */
    (function injectScanOverlays() {
        var selectors = [
            '.process-step', '.service-card', '.testimonial-card',
            '.blog-card', '.stat-card', '.product-card',
            '.hero-stat-card', '.gallery-item', '.faq-item', '.lit-card'
        ].join(',');
        var nodes = document.querySelectorAll(selectors);
        nodes.forEach(function (el) {
            if (el.querySelector(':scope > .ig-scan')) return;
            var scan = document.createElement('span');
            scan.className = 'ig-scan';
            scan.setAttribute('aria-hidden', 'true');
            el.insertBefore(scan, el.firstChild);
        });
    })();

    function initLitSpy() {
        var groups = document.querySelectorAll('[data-spy-group]');
        if (!groups.length) return;
        var prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        groups.forEach(function (group) {
            var cards = group.querySelectorAll('.lit-card');
            if (!cards.length) return;

            var revealed = false;
            var idleTimer = null;
            var currentLit = -1;

            function clearAllLit() {
                cards.forEach(function (c) { c.classList.remove('lit'); });
            }

            function pickNextLit() {
                if (cards.length < 2) {
                    currentLit = 0;
                    return 0;
                }
                var next;
                do { next = Math.floor(Math.random() * cards.length); }
                while (next === currentLit);
                currentLit = next;
                return next;
            }

            function startIdleCycle() {
                if (prefersReduce || idleTimer) return;
                idleTimer = setInterval(function () {
                    // Skip cycle if user is hovering any card (hover already overrides)
                    var hovering = group.querySelector('.lit-card:hover');
                    if (hovering) return;
                    clearAllLit();
                    var idx = pickNextLit();
                    cards[idx].classList.add('lit');
                }, 3600);
            }

            function stopIdleCycle() {
                if (idleTimer) { clearInterval(idleTimer); idleTimer = null; }
            }

            function sequentialReveal() {
                if (revealed) return;
                revealed = true;
                if (prefersReduce) {
                    cards[0].classList.add('lit');
                    currentLit = 0;
                    return;
                }
                // Phase 1: cascade flash — each card lights for ~900ms then dims
                cards.forEach(function (card, i) {
                    setTimeout(function () { card.classList.add('lit'); }, i * 220);
                    setTimeout(function () { card.classList.remove('lit'); }, i * 220 + 900);
                });
                // Phase 2: pick a single resting card + start idle cycle
                setTimeout(function () {
                    cards.forEach(function (c) { c.classList.remove('lit'); });
                    var idx = pickNextLit();
                    cards[idx].classList.add('lit');
                    startIdleCycle();
                }, cards.length * 220 + 1100);
            }

            // Visibility observer — reveal on enter, pause cycle on leave
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        sequentialReveal();
                        if (revealed) startIdleCycle();
                    } else {
                        stopIdleCycle();
                    }
                });
            }, { threshold: 0.25 });

            io.observe(group);

            // Pause idle cycle when tab is hidden (saves CPU)
            document.addEventListener('visibilitychange', function () {
                if (document.hidden) stopIdleCycle();
                else if (revealed) startIdleCycle();
            });
        });

        // Process-rail SVG fill animation when process grid enters viewport
        var processGrid = document.querySelector('.process-grid');
        if (processGrid) {
            var railIo = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        processGrid.classList.add('rail-active');
                        railIo.unobserve(processGrid);
                    }
                });
            }, { threshold: 0.3 });
            railIo.observe(processGrid);
        }
    }

    initLitSpy();

    /* ==================== CONTACT FORM ==================== */
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var form = this;
            var submitBtn = form.querySelector('button[type="submit"]');
            var btnText = form.querySelector('.btn-text');
            var btnLoading = form.querySelector('.btn-loading');
            var successMsg = form.querySelector('.form-success');
            var errorMsg = form.querySelector('.form-error');

            if (!form.checkValidity()) { form.reportValidity(); return; }

            if (submitBtn) submitBtn.disabled = true;
            if (btnText) btnText.hidden = true;
            if (btnLoading) btnLoading.hidden = false;
            if (successMsg) successMsg.hidden = true;
            if (errorMsg) errorMsg.hidden = true;

            var formData = {
                name: (form.querySelector('#name') || {}).value || '',
                email: (form.querySelector('#email') || {}).value || '',
                phone: (form.querySelector('#phone') || {}).value || '',
                subject: (form.querySelector('#subject') || {}).value || '',
                message: (form.querySelector('#message') || {}).value || ''
            };

            fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            }).then(function (r) { return r.json(); }).then(function (data) {
                if (submitBtn) submitBtn.disabled = false;
                if (btnText) btnText.hidden = false;
                if (btnLoading) btnLoading.hidden = true;
                if (data.ok) {
                    if (successMsg) successMsg.hidden = false;
                    form.reset();
                    setTimeout(function () { if (successMsg) successMsg.hidden = true; }, 5000);
                } else {
                    if (errorMsg) errorMsg.hidden = false;
                    setTimeout(function () { if (errorMsg) errorMsg.hidden = true; }, 5000);
                }
            }).catch(function () {
                if (submitBtn) submitBtn.disabled = false;
                if (btnText) btnText.hidden = false;
                if (btnLoading) btnLoading.hidden = true;
                if (errorMsg) errorMsg.hidden = false;
                setTimeout(function () { if (errorMsg) errorMsg.hidden = true; }, 5000);
            });
        });
    }

    /* ==================== COOKIE BANNER ==================== */
    function showCookieBanner() {
        if (cookieBanner && !localStorage.getItem('cookie-consent')) {
            cookieBanner.hidden = false;
        }
    }

    function hideCookieBanner(consent) {
        if (cookieBanner) {
            cookieBanner.hidden = true;
            localStorage.setItem('cookie-consent', consent);
        }
    }

    if (cookieAccept) cookieAccept.addEventListener('click', function () { hideCookieBanner('accepted'); });
    if (cookieDecline) cookieDecline.addEventListener('click', function () { hideCookieBanner('declined'); });

    setTimeout(showCookieBanner, 1000);

    /* ==================== HERO CAROUSEL ==================== */
    var heroCarousel = document.getElementById('heroCarousel');
    if (heroCarousel) {
        var slides = heroCarousel.querySelectorAll('.hero-slide');
        var currentSlide = 0;
        var slideInterval = 6000;
        var autoTimer = null;

        function goToSlide(index) {
            slides[currentSlide].classList.remove('active');
            currentSlide = index;
            slides[currentSlide].classList.add('active');
        }

        function nextSlide() {
            goToSlide((currentSlide + 1) % slides.length);
        }

        function startAutoplay() {
            stopAutoplay();
            autoTimer = setInterval(nextSlide, slideInterval);
        }

        function stopAutoplay() {
            if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
        }

        startAutoplay();

        heroCarousel.addEventListener('mouseenter', stopAutoplay);
        heroCarousel.addEventListener('mouseleave', startAutoplay);
    }

    /* ==================== E-SHOP SIDEBAR TOGGLE (mobile) ==================== */
    var filterToggle = document.getElementById('filterToggle');
    var eshopSidebar = document.getElementById('eshopSidebar');
    if (filterToggle && eshopSidebar) {
        filterToggle.addEventListener('click', function () {
            eshopSidebar.classList.toggle('open');
            filterToggle.textContent = eshopSidebar.classList.contains('open') ? 'Skrýt filtry' : 'Filtry';
        });
    }

})();

// ==================== ANIMATED COUNTERS ====================
(function() {
    'use strict';
    function animateCounter(el) {
        var target = parseInt(el.getAttribute('data-count'), 10);
        var suffix = el.getAttribute('data-suffix') || '';
        if (!target || el.dataset.counted) return;
        el.dataset.counted = '1';
        var duration = 1800;
        var start = null;
        function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
        function step(ts) {
            if (!start) start = ts;
            var progress = Math.min((ts - start) / duration, 1);
            var current = Math.floor(easeOutQuart(progress) * target);
            el.textContent = current + suffix;
            if (progress < 1) requestAnimationFrame(step);
            else el.textContent = target + suffix;
        }
        requestAnimationFrame(step);
    }

    var counterObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-count]').forEach(function(el) {
        counterObserver.observe(el);
    });
})();

// ==================== HERO CANVAS PARTICLES ====================
(function() {
    'use strict';
    var canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var particles = [];
    var W, H;
    var animFrame;

    function resize() {
        W = canvas.width = canvas.offsetWidth;
        H = canvas.height = canvas.offsetHeight;
    }

    function createParticle() {
        return {
            x: -20,
            y: Math.random() * H,
            length: Math.random() * 120 + 40,
            speed: Math.random() * 4 + 2,
            opacity: Math.random() * 0.5 + 0.1,
            width: Math.random() * 1.5 + 0.3
        };
    }

    function init() {
        particles = [];
        for (var i = 0; i < 25; i++) {
            var p = createParticle();
            p.x = Math.random() * W;
            particles.push(p);
        }
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(function(p, i) {
            ctx.save();
            var grad = ctx.createLinearGradient(p.x - p.length, p.y, p.x, p.y);
            grad.addColorStop(0, 'rgba(189, 20, 27, 0)');
            grad.addColorStop(0.5, 'rgba(189, 20, 27, ' + p.opacity + ')');
            grad.addColorStop(1, 'rgba(245, 158, 11, ' + (p.opacity * 0.6) + ')');
            ctx.strokeStyle = grad;
            ctx.lineWidth = p.width;
            ctx.beginPath();
            ctx.moveTo(p.x - p.length, p.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            ctx.restore();
            p.x += p.speed;
            if (p.x - p.length > W) {
                particles[i] = createParticle();
            }
        });
        animFrame = requestAnimationFrame(draw);
    }

    window.addEventListener('resize', function() {
        resize();
        init();
    });
    resize();
    init();

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        draw();
    }
})();

// ==================== FAQ ACCORDION ====================
(function() {
    'use strict';
    document.querySelectorAll('.faq-question').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var isOpen = btn.getAttribute('aria-expanded') === 'true';
            var answer = btn.nextElementSibling;
            // Close all others
            document.querySelectorAll('.faq-question[aria-expanded="true"]').forEach(function(openBtn) {
                if (openBtn !== btn) {
                    openBtn.setAttribute('aria-expanded', 'false');
                    openBtn.nextElementSibling.hidden = true;
                }
            });
            // Toggle this one
            btn.setAttribute('aria-expanded', String(!isOpen));
            answer.hidden = isOpen;
        });
    });
})();

// ==================== GALLERY LIGHTBOX & FILTERS ====================
(function() {
    'use strict';
    var lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    var lbImg = document.getElementById('lightboxImg');
    var lbCaption = document.getElementById('lightboxCaption');
    var lbClose = document.getElementById('lightboxClose');
    var lbBackdrop = document.getElementById('lightboxBackdrop');
    var lbPrev = document.getElementById('lightboxPrev');
    var lbNext = document.getElementById('lightboxNext');
    var allItems = [];
    var currentIndex = 0;

    function buildItemList() {
        allItems = Array.from(document.querySelectorAll('.gallery-item:not(.hidden) img'));
    }

    function openLightbox(index) {
        buildItemList();
        currentIndex = index;
        showImage(currentIndex);
        lightbox.hidden = false;
        document.body.style.overflow = 'hidden';
        lbClose.focus();
    }

    function closeLightbox() {
        lightbox.hidden = true;
        document.body.style.overflow = '';
    }

    function showImage(index) {
        var img = allItems[index];
        if (!img) return;
        lbImg.src = img.src;
        lbImg.alt = img.alt;
        lbCaption.textContent = img.alt;
    }

    function prevImage() {
        if (!allItems.length) return;
        currentIndex = (currentIndex - 1 + allItems.length) % allItems.length;
        showImage(currentIndex);
    }

    function nextImage() {
        if (!allItems.length) return;
        currentIndex = (currentIndex + 1) % allItems.length;
        showImage(currentIndex);
    }

    var grid = document.querySelector('.gallery-grid');
    if (grid) {
        grid.addEventListener('click', function(e) {
            var item = e.target.closest('.gallery-item');
            if (!item) return;
            buildItemList();
            var img = item.querySelector('img');
            var index = allItems.indexOf(img);
            if (index !== -1) openLightbox(index);
        });
    }

    lbClose.addEventListener('click', closeLightbox);
    lbBackdrop.addEventListener('click', closeLightbox);
    lbPrev.addEventListener('click', prevImage);
    lbNext.addEventListener('click', nextImage);

    document.addEventListener('keydown', function(e) {
        if (lightbox.hidden) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'ArrowRight') nextImage();
    });

    // GALLERY FILTERS
    var filterBtns = document.querySelectorAll('.gallery-filter-btn');
    if (filterBtns.length) {
        filterBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var filter = btn.getAttribute('data-filter');
                filterBtns.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                document.querySelectorAll('.gallery-item').forEach(function(item) {
                    if (filter === 'vse' || item.getAttribute('data-category') === filter) {
                        item.classList.remove('hidden');
                    } else {
                        item.classList.add('hidden');
                    }
                });
            });
        });
    }
})();
