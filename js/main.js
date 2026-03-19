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

        function resetInterval() {
            clearInterval(autoTimer);
            autoTimer = setInterval(nextSlide, slideInterval);
        }

        var prevBtn = document.querySelector('.hero-prev');
        var nextBtn = document.querySelector('.hero-next');
        if (prevBtn) prevBtn.addEventListener('click', function () {
            var prev = (currentSlide - 1 + slides.length) % slides.length;
            goToSlide(prev);
            resetInterval();
        });
        if (nextBtn) nextBtn.addEventListener('click', function () {
            var next = (currentSlide + 1) % slides.length;
            goToSlide(next);
            resetInterval();
        });

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

// [data-count] counter handled by quantum-ui.js (typing cursor version)

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

// ==================== PAGE LOADER ====================
(function () {
    'use strict';
    var loader  = document.getElementById('pageLoader');
    var bar     = document.getElementById('loaderBar');
    if (!loader || !bar) return;

    var progress = 0;
    var interval = setInterval(function () {
        progress += Math.random() * 18 + 8;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            bar.style.width = '100%';
            setTimeout(function () {
                loader.classList.add('hidden');
                setTimeout(function () { loader.remove(); }, 800);
            }, 200);
        } else {
            bar.style.width = progress + '%';
        }
    }, 60);
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
