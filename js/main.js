/* ============================================================
   SILPONIX DEMO — MAIN.JS
   Core functionality: theme, menu, navbar, animations, forms, cookies
   ============================================================ */

(function () {
    'use strict';

    /* ==================== DOM REFERENCES ==================== */
    var navbar = document.getElementById('navbar');
    var navbarMenu = document.getElementById('navbarMenu');
    var navbarHamburger = document.getElementById('navbarHamburger');
    var themeToggle = document.getElementById('themeToggle');
    var cookieBanner = document.getElementById('cookieBanner');
    var cookieAccept = document.getElementById('cookieAccept');
    var cookieDecline = document.getElementById('cookieDecline');
    var contactForm = document.querySelector('[data-wz-contact]');
    var navbarLinks = document.querySelectorAll('.navbar-link');

    /* ==================== THEME TOGGLE ==================== */
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    function toggleTheme() {
        var current = document.documentElement.getAttribute('data-theme') || 'dark';
        setTheme(current === 'dark' ? 'light' : 'dark');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });

    /* ==================== MOBILE MENU ==================== */
    function openMenu() {
        if (!navbarMenu || !navbarHamburger) return;
        navbarMenu.classList.add('open');
        navbarHamburger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        if (!navbarMenu || !navbarHamburger) return;
        navbarMenu.classList.remove('open');
        navbarHamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    function toggleMenu() {
        if (navbarMenu && navbarMenu.classList.contains('open')) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    if (navbarHamburger) {
        navbarHamburger.addEventListener('click', toggleMenu);
    }

    navbarLinks.forEach(function (link) {
        link.addEventListener('click', function () {
            if (navbarMenu && navbarMenu.classList.contains('open')) closeMenu();
        });
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && navbarMenu && navbarMenu.classList.contains('open')) {
            closeMenu();
            if (navbarHamburger) navbarHamburger.focus();
        }
    });

    document.addEventListener('click', function (e) {
        if (navbarMenu && navbarMenu.classList.contains('open') &&
            !navbarMenu.contains(e.target) &&
            navbarHamburger && !navbarHamburger.contains(e.target)) {
            closeMenu();
        }
    });

    // Close menu on resize past breakpoint
    window.addEventListener('resize', function () {
        if (window.innerWidth > 1024 && navbarMenu && navbarMenu.classList.contains('open')) {
            closeMenu();
        }
    });

    // Swipe to close
    (function () {
        var startX = 0, startY = 0, threshold = 80;
        if (!navbarMenu) return;
        navbarMenu.addEventListener('touchstart', function (e) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });
        navbarMenu.addEventListener('touchend', function (e) {
            var diffX = e.changedTouches[0].clientX - startX;
            var diffY = Math.abs(e.changedTouches[0].clientY - startY);
            if (diffX > threshold && diffY < 100) closeMenu();
        }, { passive: true });
    })();

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

// ==================== SMOKE / AMBIENT PARTICLES ====================
(function () {
    'use strict';
    var canvas = document.getElementById('smokeCanvas');
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var ctx = canvas.getContext('2d');
    var W, H;
    var particles = [];

    // Two tiers: 'bg' = large, slow, very faint; 'fg' = medium, slightly faster
    var TIERS = [
        { count: 12, rMin: 90,  rMax: 200, dyMin: 0.08, dyMax: 0.22, opMin: 0.04, opMax: 0.09,  lifeMin: 400, lifeMax: 700 },
        { count: 18, rMin: 40,  rMax: 100, dyMin: 0.18, dyMax: 0.50, opMin: 0.07, opMax: 0.18,  lifeMin: 200, lifeMax: 380 }
    ];

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    function rand(a, b) { return Math.random() * (b - a) + a; }

    function createParticle(tier) {
        var r = rand(tier.rMin, tier.rMax);
        return {
            tier:       tier,
            x:          rand(0, W),
            y:          rand(H * 0.3, H + r),
            r:          r,
            baseX:      0,            // set after creation
            sway:       rand(0.004, 0.012),   // sine frequency
            swayAmp:    rand(18, 55),          // sine amplitude px
            swayOff:    rand(0, Math.PI * 2),  // phase offset
            opacity:    0,
            maxOpacity: rand(tier.opMin, tier.opMax),
            phase:      'fadein',
            life:       0,
            maxLife:    rand(tier.lifeMin, tier.lifeMax),
            dy:         -rand(tier.dyMin, tier.dyMax),
            // Near-white with subtle warm/cool variation
            cr:         Math.floor(rand(220, 245)),
            cg:         Math.floor(rand(220, 240)),
            cb:         Math.floor(rand(225, 245))
        };
    }

    function spawnParticle(tier, spreadY) {
        var p = createParticle(tier);
        p.baseX = p.x;
        if (spreadY) p.y = rand(0, H);
        return p;
    }

    // Initial spawn — spread across full height
    TIERS.forEach(function (tier) {
        for (var i = 0; i < tier.count; i++) {
            var p = spawnParticle(tier, true);
            p.life = Math.floor(rand(0, p.maxLife * 0.7));
            // Pre-advance opacity based on life stage
            if (p.life < p.maxLife * 0.2) {
                p.opacity = p.maxOpacity * (p.life / (p.maxLife * 0.2));
                p.phase = 'fadein';
            } else if (p.life < p.maxLife * 0.6) {
                p.opacity = p.maxOpacity;
                p.phase = 'hold';
            } else {
                p.opacity = p.maxOpacity * (1 - (p.life - p.maxLife * 0.6) / (p.maxLife * 0.4));
                p.phase = 'fadeout';
            }
            particles.push(p);
        }
    });

    function drawParticle(p) {
        // Soft outer glow ring
        var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        grad.addColorStop(0,    'rgba(' + p.cr + ',' + p.cg + ',' + p.cb + ',' + (p.opacity * 0.9) + ')');
        grad.addColorStop(0.35, 'rgba(' + p.cr + ',' + p.cg + ',' + p.cb + ',' + (p.opacity * 0.55) + ')');
        grad.addColorStop(0.65, 'rgba(' + p.cr + ',' + p.cg + ',' + p.cb + ',' + (p.opacity * 0.2) + ')');
        grad.addColorStop(1,    'rgba(' + p.cr + ',' + p.cg + ',' + p.cb + ',0)');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
    }

    var frame = 0;
    function update() {
        ctx.clearRect(0, 0, W, H);
        frame++;

        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];

            // Sinusoidal horizontal sway
            p.x = p.baseX + Math.sin(frame * p.sway + p.swayOff) * p.swayAmp;
            p.baseX += 0; // no horizontal drift of base
            p.y += p.dy;
            p.life++;

            var fadeInFrames  = p.maxLife * 0.2;
            var holdFrames    = p.maxLife * 0.6;

            if (p.phase === 'fadein') {
                p.opacity = Math.min(p.maxOpacity, p.maxOpacity * (p.life / fadeInFrames));
                if (p.life >= fadeInFrames) p.phase = 'hold';
            }
            if (p.phase === 'hold' && p.life >= holdFrames) {
                p.phase = 'fadeout';
            }
            if (p.phase === 'fadeout') {
                var remaining = p.maxLife - p.life;
                var fadeOutFrames = p.maxLife - holdFrames;
                p.opacity = p.maxOpacity * Math.max(0, remaining / fadeOutFrames);
                if (p.opacity <= 0 || p.y + p.r < 0) {
                    particles[i] = spawnParticle(p.tier, false);
                    continue;
                }
            }

            drawParticle(p);
        }

        requestAnimationFrame(update);
    }
    update();
})();

// ==================== CURSOR-TRACKING CARD GLOW ====================
(function() {
    'use strict';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover)').matches) return;

    var SELECTORS = ['.blog-card', '.service-card', '.testimonial-card', '.process-step', '.product-card'];

    function attachGlow(card) {
        card.addEventListener('mousemove', function(e) {
            var rect = card.getBoundingClientRect();
            var x = ((e.clientX - rect.left) / rect.width) * 100;
            var y = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty('--mouse-x', x.toFixed(1) + '%');
            card.style.setProperty('--mouse-y', y.toFixed(1) + '%');
        }, { passive: true });
    }

    SELECTORS.forEach(function(sel) {
        document.querySelectorAll(sel).forEach(attachGlow);
    });
})();

// ==================== CUSTOM CURSOR + SCROLL PROGRESS ====================
(function () {
    'use strict';
    // Touch device check
    if (!window.matchMedia('(hover: hover)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var cursor = document.getElementById('cursor');
    var dot    = document.getElementById('cursor-dot');
    var ring   = document.getElementById('cursor-ring');
    var progress = document.getElementById('scrollProgress');

    if (!cursor || !dot || !ring) return;

    var mouseX = 0, mouseY = 0;
    var ringX  = 0, ringY  = 0;

    // Smooth ring lag
    function animateCursor() {
        ringX += (mouseX - ringX) * 0.12;
        ringY += (mouseY - ringY) * 0.12;
        cursor.style.transform = 'translate(' + mouseX + 'px,' + mouseY + 'px)';
        ring.style.transform   = 'translate(' + (ringX - mouseX) + 'px,' + (ringY - mouseY) + 'px) translate(-50%,-50%)';
        dot.style.transform    = 'translate(-50%,-50%)';
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    document.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }, { passive: true });

    // Hover state
    var hoverEls = 'a, button, [role="button"], .btn, .card, .service-card, .blog-card, .process-step, .gallery-item, label, input, textarea, select';
    document.querySelectorAll(hoverEls).forEach(function (el) {
        el.addEventListener('mouseenter', function () { document.body.classList.add('cursor-hover'); });
        el.addEventListener('mouseleave', function () { document.body.classList.remove('cursor-hover'); });
    });
    document.addEventListener('mousedown', function () { document.body.classList.add('cursor-clicking'); });
    document.addEventListener('mouseup',   function () { document.body.classList.remove('cursor-clicking'); });

    // Scroll progress
    if (progress) {
        window.addEventListener('scroll', function () {
            var scrolled = document.documentElement.scrollTop || document.body.scrollTop;
            var total    = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            progress.style.width = (total > 0 ? (scrolled / total) * 100 : 0).toFixed(2) + '%';
        }, { passive: true });
    }
})();
