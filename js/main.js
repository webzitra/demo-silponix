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
