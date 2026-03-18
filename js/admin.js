/* ============================================================
   SILPONIX DEMO — ADMIN.JS
   Admin panel: API auth, products, blog, media, orders, analytics
   ============================================================ */

(function () {
    'use strict';

    var SESSION_KEY = 'silponix-session';
    var USER_KEY = 'silponix-user';
    var API = '/api';

    /* ==================== STATE ==================== */
    var state = {
        sessionToken: null,
        user: null,
        products: [],
        posts: [],
        media: [],
        orders: [],
        editingProductId: null,
        editingPostSlug: null,
        postCoverMediaId: null,
        postGalleryMediaIds: [],
        prodImageIds: []
    };

    /* ==================== QUILL EDITORS ==================== */
    var quillToolbar = [
        [{ 'header': [2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
    ];

    var postQuill = null;
    var prodQuill = null;
    var nlQuill = null;

    function initQuillEditors() {
        if (typeof Quill === 'undefined') return;
        var postEl = document.getElementById('postContentEditor');
        if (postEl && !postQuill) {
            postQuill = new Quill('#postContentEditor', { theme: 'snow', modules: { toolbar: quillToolbar }, placeholder: 'Obsah článku...' });
        }
        var prodEl = document.getElementById('prodDescLongEditor');
        if (prodEl && !prodQuill) {
            prodQuill = new Quill('#prodDescLongEditor', { theme: 'snow', modules: { toolbar: quillToolbar }, placeholder: 'Podrobný popis produktu...' });
        }
        var nlEl = document.getElementById('nlContentEditor');
        if (nlEl && !nlQuill) {
            nlQuill = new Quill('#nlContentEditor', { theme: 'snow', modules: { toolbar: quillToolbar }, placeholder: 'Obsah newsletteru...' });
        }
    }

    // Init after DOM ready
    setTimeout(initQuillEditors, 100);

    /* ==================== DOM ==================== */
    var loginScreen = document.getElementById('adminLogin');
    var dashboard = document.getElementById('adminDashboard');
    var loginForm = document.getElementById('loginForm');
    var loginError = document.getElementById('loginError');
    var loginBtn = document.getElementById('loginBtn');
    var logoutBtn = document.getElementById('logoutBtn');
    var adminUserName = document.getElementById('adminUserName');
    var tabs = document.querySelectorAll('.admin-tab');
    var panels = document.querySelectorAll('.admin-panel');

    /* ==================== HELPERS ==================== */
    function api(endpoint, data) {
        var body = Object.assign({}, data || {});
        if (state.sessionToken) body.sessionToken = state.sessionToken;
        return fetch(API + '/' + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }).then(function (r) { return r.json(); });
    }

    function formatPrice(n) {
        return (n || 0).toLocaleString('cs-CZ') + '\u00a0Kč';
    }

    function notify(msg, type) {
        var el = document.createElement('div');
        el.className = 'admin-notif' + (type === 'error' ? ' admin-notif-error' : '');
        el.textContent = msg;
        var container = document.getElementById('adminNotifications');
        if (container) container.appendChild(el);
        requestAnimationFrame(function () { el.classList.add('show'); });
        setTimeout(function () {
            el.classList.remove('show');
            setTimeout(function () { el.remove(); }, 300);
        }, 3000);
    }

    var CATEGORIES = {
        ecu: 'ECU & Elektronika', silentbloky: 'Silentbloky PU',
        motor: 'Motor & Převodovky', podvozek: 'Podvozek & Brzdy',
        karoserie: 'Karoserie & Výfuky', baterie: 'Baterie'
    };

    var STATUS_LABELS = { new: 'Nová', processing: 'Zpracovává se', shipped: 'Odesláno', completed: 'Dokončeno' };
    var STATUS_CLASSES = { new: 'status-new', processing: 'status-processing', shipped: 'status-shipped', completed: 'status-completed' };

    /* ==================== AUTH ==================== */
    function saveSession(token, user) {
        state.sessionToken = token;
        state.user = user;
        localStorage.setItem(SESSION_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    function clearSession() {
        state.sessionToken = null;
        state.user = null;
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(USER_KEY);
    }

    function showDashboard() {
        if (loginScreen) loginScreen.hidden = true;
        if (dashboard) dashboard.hidden = false;
        if (adminUserName && state.user) adminUserName.textContent = state.user.name || state.user.email;
        loadDashboardData();
    }

    function showLogin() {
        if (loginScreen) loginScreen.hidden = false;
        if (dashboard) dashboard.hidden = true;
    }

    // Try restore session
    var savedToken = localStorage.getItem(SESSION_KEY);
    var savedUser = localStorage.getItem(USER_KEY);
    if (savedToken && savedUser) {
        state.sessionToken = savedToken;
        try { state.user = JSON.parse(savedUser); } catch (e) { /* ignore */ }
        // Verify session is still valid
        api('auth', { sessionToken: savedToken }).then(function (data) {
            if (data.valid && data.user && data.user.role === 'admin') {
                state.user = data.user;
                localStorage.setItem(USER_KEY, JSON.stringify(data.user));
                showDashboard();
            } else {
                clearSession();
                showLogin();
            }
        }).catch(function () {
            // If API not available, show dashboard with cached data
            if (state.user && state.user.role === 'admin') {
                showDashboard();
            } else {
                clearSession();
                showLogin();
            }
        });
    }

    // Login
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var email = document.getElementById('admin-email');
            var password = document.getElementById('admin-password');
            if (!email || !password) return;

            if (loginBtn) { loginBtn.disabled = true; loginBtn.textContent = 'Přihlašuji...'; }
            if (loginError) loginError.hidden = true;

            api('auth', { email: email.value.trim(), password: password.value }).then(function (data) {
                if (loginBtn) { loginBtn.disabled = false; loginBtn.textContent = 'Přihlásit se'; }
                if (data.valid && data.user && data.user.role === 'admin') {
                    saveSession(data.sessionToken, data.user);
                    showDashboard();
                } else if (data.valid && data.user && data.user.role !== 'admin') {
                    if (loginError) { loginError.textContent = 'Tento účet nemá oprávnění administrátora.'; loginError.hidden = false; }
                } else {
                    if (loginError) { loginError.textContent = data.error || 'Neplatné přihlašovací údaje.'; loginError.hidden = false; }
                }
            }).catch(function () {
                if (loginBtn) { loginBtn.disabled = false; loginBtn.textContent = 'Přihlásit se'; }
                if (loginError) { loginError.textContent = 'Chyba serveru. Zkuste to znovu.'; loginError.hidden = false; }
            });
        });
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            clearSession();
            showLogin();
        });
    }

    /* ==================== TABS ==================== */
    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            var targetTab = this.getAttribute('data-tab');
            tabs.forEach(function (t) { t.classList.remove('active'); });
            this.classList.add('active');
            panels.forEach(function (p) {
                p.classList.toggle('active', p.id === 'panel-' + targetTab);
            });
        });
    });

    /* ==================== LOAD ALL DATA ==================== */
    function loadDashboardData() {
        loadAnalytics(7);
        loadProducts();
        loadPosts();
        loadMedia();
        loadOrders();
        loadSettings();
        loadNewsletterTab();
        loadMessages();
        loadCompanyInfo();
        loadAdminAccount();
    }

    /* ==================== ANALYTICS ==================== */
    function loadAnalytics(days) {
        api('analytics', { action: 'overview', period: days + 'd' }).then(function (data) {
            if (data.error) return;
            var s = document.getElementById('statProducts');
            var o = document.getElementById('statOrders');
            var r = document.getElementById('statRevenue');
            var c = document.getElementById('statCustomers');
            if (s) s.textContent = (data.products || 0).toString();
            if (o) o.textContent = (data.orders || 0).toString();
            if (r) r.textContent = formatPrice(data.revenue || 0);
            if (c) c.textContent = (data.users || 0).toString();

            // Render chart
            if (data.chartData && data.chartData.length) {
                renderChart(data.chartData);
            }
        }).catch(function () {
            // Fallback — try loading from products/orders directly
        });
    }

    function renderChart(chartData) {
        var barsEl = document.getElementById('viewsChartBars');
        var labelsEl = document.getElementById('viewsChartLabels');
        if (!barsEl || !labelsEl) return;

        var max = Math.max.apply(null, chartData.map(function (d) { return d.views || 0; }));
        if (max === 0) max = 1;

        barsEl.innerHTML = '';
        labelsEl.innerHTML = '';

        chartData.forEach(function (d) {
            var pct = Math.round(((d.views || 0) / max) * 100);
            var bar = document.createElement('div');
            bar.className = 'admin-chart-bar';
            bar.style.height = Math.max(pct, 2) + '%';
            bar.title = d.date + ': ' + (d.views || 0) + ' zobrazení';
            barsEl.appendChild(bar);

            var label = document.createElement('span');
            label.textContent = d.date ? d.date.slice(5) : '';
            labelsEl.appendChild(label);
        });
    }

    // Period buttons
    document.querySelectorAll('.admin-period-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.admin-period-btn').forEach(function (b) { b.classList.remove('active'); });
            this.classList.add('active');
            loadAnalytics(parseInt(this.getAttribute('data-period')) || 7);
        });
    });

    /* ==================== PRODUCTS ==================== */
    function loadProducts() {
        api('products', { action: 'list' }).then(function (data) {
            if (data.products) {
                state.products = data.products;
                renderProductsTable();
            }
        }).catch(function () {
            // Fallback to hardcoded
            if (window.SILPONIX_PRODUCTS) {
                state.products = window.SILPONIX_PRODUCTS;
                renderProductsTable();
            }
        });
    }

    function renderProductsTable() {
        var tbody = document.getElementById('productsTable');
        if (!tbody) return;
        tbody.innerHTML = '';
        state.products.forEach(function (p) {
            var tr = document.createElement('tr');
            var imgSrc = (p.images && p.images.length) ? p.images[0] : (p.image || '/img/products/placeholder.jpg');
            tr.innerHTML =
                '<td><div class="admin-table-img"><img src="' + imgSrc + '" alt="" width="40" height="40"></div></td>' +
                '<td><strong>' + (p.name || '') + '</strong></td>' +
                '<td>' + (CATEGORIES[p.category] || p.category || '') + '</td>' +
                '<td>' + formatPrice(p.price) + '</td>' +
                '<td>' + (p.stock || 0) + '\u00a0ks</td>' +
                '<td class="admin-actions-cell">' +
                    '<button class="btn btn-sm btn-outline edit-product-btn" data-id="' + p.id + '">Upravit</button>' +
                    '<button class="btn btn-sm btn-outline btn-danger delete-product-btn" data-id="' + p.id + '">Smazat</button>' +
                '</td>';
            tbody.appendChild(tr);
        });
    }

    // Add product
    var addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', function () {
            state.editingProductId = null;
            state.prodImageIds = [];
            var form = document.getElementById('productForm');
            if (form) form.reset();
            if (prodQuill) prodQuill.setContents([]);
            var preview = document.getElementById('prodImagePreview');
            if (preview) preview.innerHTML = '';
            var title = document.getElementById('productModalTitle');
            if (title) title.textContent = 'Přidat produkt';
            openModal('productModal');
        });
    }

    // Edit/delete product click
    document.addEventListener('click', function (e) {
        var editBtn = e.target.closest('.edit-product-btn');
        if (editBtn) {
            var id = editBtn.getAttribute('data-id');
            var product = state.products.find(function (p) { return p.id === id || p.id === parseInt(id); });
            if (product) {
                state.editingProductId = product.id;
                state.prodImageIds = [];
                document.getElementById('prodId').value = product.id;
                document.getElementById('prodName').value = product.name || '';
                document.getElementById('prodPrice').value = product.price || '';
                document.getElementById('prodCategory').value = product.category || 'ecu';
                document.getElementById('prodDesc').value = product.desc || '';
                if (prodQuill) prodQuill.root.innerHTML = product.desc_long || '';
                document.getElementById('prodStock').value = product.stock || 0;
                document.getElementById('prodBadge').value = product.badge || '';
                var preview = document.getElementById('prodImagePreview');
                if (preview) {
                    preview.innerHTML = '';
                    if (product.images && product.images.length) {
                        product.images.forEach(function (url) {
                            var img = document.createElement('img');
                            img.src = url;
                            img.className = 'admin-img-thumb';
                            preview.appendChild(img);
                        });
                    }
                }
                var title = document.getElementById('productModalTitle');
                if (title) title.textContent = 'Upravit produkt';
                openModal('productModal');
            }
        }

        var deleteBtn = e.target.closest('.delete-product-btn');
        if (deleteBtn) {
            var did = deleteBtn.getAttribute('data-id');
            if (confirm('Opravdu smazat tento produkt?')) {
                api('products', { action: 'delete', id: did }).then(function (data) {
                    if (data.ok) { notify('Produkt smazán'); loadProducts(); }
                    else notify(data.error || 'Chyba', 'error');
                });
            }
        }
    });

    // Product image upload
    var prodImageBtn = document.getElementById('prodImageBtn');
    var prodImageInput = document.getElementById('prodImageInput');
    if (prodImageBtn && prodImageInput) {
        prodImageBtn.addEventListener('click', function () { prodImageInput.click(); });
        prodImageInput.addEventListener('change', function () {
            Array.from(this.files).forEach(function (file) { uploadAndPreview(file, 'prodImagePreview', state.prodImageIds); });
            this.value = '';
        });
    }

    // Product form submit
    var productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var saveBtn = document.getElementById('productSaveBtn');
            if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Ukládám...'; }

            var productData = {
                name: document.getElementById('prodName').value.trim(),
                price: parseInt(document.getElementById('prodPrice').value) || 0,
                category: document.getElementById('prodCategory').value,
                desc: document.getElementById('prodDesc').value.trim(),
                desc_long: prodQuill ? prodQuill.root.innerHTML.replace(/^<p><br><\/p>$/, '') : '',
                stock: parseInt(document.getElementById('prodStock').value) || 0,
                badge: document.getElementById('prodBadge').value
            };

            if (state.prodImageIds.length) {
                productData.images = state.prodImageIds.map(function (id) { return '/api/media-serve?id=' + id; });
            }

            var action = state.editingProductId ? 'update' : 'create';
            if (state.editingProductId) productData.id = state.editingProductId;
            productData.action = action;

            api('products', productData).then(function (data) {
                if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Uložit'; }
                if (data.product || data.ok) {
                    notify(state.editingProductId ? 'Produkt upraven' : 'Produkt vytvořen');
                    closeModal('productModal');
                    loadProducts();
                } else {
                    notify(data.error || 'Chyba při ukládání', 'error');
                }
            }).catch(function () {
                if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Uložit'; }
                notify('Chyba serveru', 'error');
            });
        });
    }

    /* ==================== BLOG ==================== */
    function loadPosts() {
        api('posts', { action: 'list' }).then(function (data) {
            if (data.posts) {
                state.posts = data.posts;
                renderPostsTable();
            }
        }).catch(function () { /* no posts yet */ });
    }

    function renderPostsTable() {
        var tbody = document.getElementById('postsTable');
        if (!tbody) return;
        tbody.innerHTML = '';
        state.posts.forEach(function (p) {
            var tr = document.createElement('tr');
            var statusClass = p.published ? 'status-completed' : 'status-processing';
            var statusText = p.published ? 'Publikováno' : 'Koncept';
            tr.innerHTML =
                '<td><strong>' + (p.title || '') + '</strong></td>' +
                '<td>' + (p.category || '') + '</td>' +
                '<td>' + (p.date || '') + '</td>' +
                '<td><span class="status ' + statusClass + '">' + statusText + '</span></td>' +
                '<td class="admin-actions-cell">' +
                    '<button class="btn btn-sm btn-outline edit-post-btn" data-slug="' + (p.slug || '') + '">Upravit</button>' +
                    '<button class="btn btn-sm btn-outline btn-danger delete-post-btn" data-slug="' + (p.slug || '') + '">Smazat</button>' +
                '</td>';
            tbody.appendChild(tr);
        });
    }

    // Add post
    var addPostBtn = document.getElementById('addPostBtn');
    if (addPostBtn) {
        addPostBtn.addEventListener('click', function () {
            state.editingPostSlug = null;
            state.postCoverMediaId = null;
            state.postGalleryMediaIds = [];
            var form = document.getElementById('postForm');
            if (form) form.reset();
            if (postQuill) postQuill.setContents([]);
            document.getElementById('postCoverPreview').innerHTML = '';
            document.getElementById('postGalleryPreview').innerHTML = '';
            var title = document.getElementById('postModalTitle');
            if (title) title.textContent = 'Nový článek';
            openModal('postModal');
        });
    }

    // Edit/delete post
    document.addEventListener('click', function (e) {
        var editBtn = e.target.closest('.edit-post-btn');
        if (editBtn) {
            var slug = editBtn.getAttribute('data-slug');
            api('posts', { action: 'get', slug: slug }).then(function (data) {
                if (!data.post) return notify('Článek nenalezen', 'error');
                var p = data.post;
                state.editingPostSlug = p.slug;
                document.getElementById('postSlug').value = p.slug;
                document.getElementById('postTitle').value = p.title || '';
                document.getElementById('postCategory').value = p.category || 'Tuning';
                document.getElementById('postPublished').value = p.published ? '1' : '0';
                document.getElementById('postExcerpt').value = p.excerpt || '';
                if (postQuill) postQuill.root.innerHTML = p.content || '';
                var coverPreview = document.getElementById('postCoverPreview');
                coverPreview.innerHTML = '';
                if (p.coverImage) {
                    var img = document.createElement('img');
                    img.src = p.coverImage;
                    img.className = 'admin-img-thumb';
                    coverPreview.appendChild(img);
                }
                var galleryPreview = document.getElementById('postGalleryPreview');
                galleryPreview.innerHTML = '';
                if (p.galleryImages && p.galleryImages.length) {
                    p.galleryImages.forEach(function (url) {
                        var gi = document.createElement('img');
                        gi.src = url;
                        gi.className = 'admin-img-thumb';
                        galleryPreview.appendChild(gi);
                    });
                }
                var title = document.getElementById('postModalTitle');
                if (title) title.textContent = 'Upravit článek';
                openModal('postModal');
            });
        }

        var deleteBtn = e.target.closest('.delete-post-btn');
        if (deleteBtn) {
            var dslug = deleteBtn.getAttribute('data-slug');
            if (confirm('Opravdu smazat tento článek?')) {
                api('posts', { action: 'delete', slug: dslug }).then(function (data) {
                    if (data.ok) { notify('Článek smazán'); loadPosts(); }
                    else notify(data.error || 'Chyba', 'error');
                });
            }
        }
    });

    // Post cover image
    var postCoverBtn = document.getElementById('postCoverBtn');
    var postCoverInput = document.getElementById('postCoverInput');
    if (postCoverBtn && postCoverInput) {
        postCoverBtn.addEventListener('click', function () { postCoverInput.click(); });
        postCoverInput.addEventListener('change', function () {
            if (this.files[0]) {
                state.postCoverMediaId = null;
                uploadFile(this.files[0]).then(function (result) {
                    if (result && result.id) {
                        state.postCoverMediaId = result.id;
                        var preview = document.getElementById('postCoverPreview');
                        preview.innerHTML = '';
                        var img = document.createElement('img');
                        img.src = result.url;
                        img.className = 'admin-img-thumb';
                        preview.appendChild(img);
                    }
                });
            }
            this.value = '';
        });
    }

    // Post gallery images
    var postGalleryBtn = document.getElementById('postGalleryBtn');
    var postGalleryInput = document.getElementById('postGalleryInput');
    if (postGalleryBtn && postGalleryInput) {
        postGalleryBtn.addEventListener('click', function () { postGalleryInput.click(); });
        postGalleryInput.addEventListener('change', function () {
            Array.from(this.files).forEach(function (file) {
                uploadFile(file).then(function (result) {
                    if (result && result.id) {
                        state.postGalleryMediaIds.push(result.id);
                        var preview = document.getElementById('postGalleryPreview');
                        var img = document.createElement('img');
                        img.src = result.url;
                        img.className = 'admin-img-thumb';
                        preview.appendChild(img);
                    }
                });
            });
            this.value = '';
        });
    }

    // Post form submit
    var postForm = document.getElementById('postForm');
    if (postForm) {
        postForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var saveBtn = document.getElementById('postSaveBtn');
            if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Ukládám...'; }

            var postData = {
                title: document.getElementById('postTitle').value.trim(),
                category: document.getElementById('postCategory').value,
                published: document.getElementById('postPublished').value === '1',
                excerpt: document.getElementById('postExcerpt').value.trim(),
                content: postQuill ? postQuill.root.innerHTML.replace(/^<p><br><\/p>$/, '') : ''
            };

            if (state.postCoverMediaId) {
                postData.coverImage = '/api/media-serve?id=' + state.postCoverMediaId;
            }
            if (state.postGalleryMediaIds.length) {
                postData.galleryImages = state.postGalleryMediaIds.map(function (id) { return '/api/media-serve?id=' + id; });
            }

            var action = state.editingPostSlug ? 'update' : 'create';
            if (state.editingPostSlug) postData.slug = state.editingPostSlug;
            postData.action = action;

            api('posts', postData).then(function (data) {
                if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Uložit'; }
                if (data.post || data.ok) {
                    notify(state.editingPostSlug ? 'Článek upraven' : 'Článek vytvořen');
                    closeModal('postModal');
                    loadPosts();
                } else {
                    notify(data.error || 'Chyba při ukládání', 'error');
                }
            }).catch(function () {
                if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Uložit'; }
                notify('Chyba serveru', 'error');
            });
        });
    }

    /* ==================== MEDIA ==================== */
    function loadMedia() {
        api('media', { action: 'list' }).then(function (data) {
            if (data.media) {
                state.media = data.media;
                renderMediaGrid();
            }
        }).catch(function () { /* no media yet */ });
    }

    function renderMediaGrid() {
        var grid = document.getElementById('mediaGrid');
        if (!grid) return;
        grid.innerHTML = '';
        if (!state.media.length) {
            grid.innerHTML = '<p class="admin-empty">Zatím žádná média. Nahrajte první soubor.</p>';
            return;
        }
        state.media.forEach(function (m) {
            var card = document.createElement('div');
            card.className = 'admin-media-card';
            var isVideo = m.type && m.type.startsWith('video/');
            var imgUrl = m.static ? m.url : m.url;
            var staticBadge = m.static ? '<span class="admin-media-static">Statický</span>' : '';
            card.innerHTML =
                '<div class="admin-media-thumb">' +
                    (isVideo
                        ? '<video src="' + imgUrl + '" muted></video>'
                        : '<img src="' + imgUrl + '" alt="' + (m.alt || m.filename || '') + '">') +
                '</div>' +
                '<div class="admin-media-info">' +
                    '<span class="admin-media-name">' + (m.filename || 'media') + staticBadge + '</span>' +
                    '<div class="admin-media-actions">' +
                        '<button class="btn btn-sm btn-outline copy-media-url" data-url="' + imgUrl + '">URL</button>' +
                        (m.static
                            ? '<button class="btn btn-sm btn-outline" disabled title="Nelze smazat statický soubor">Statický</button>'
                            : '<button class="btn btn-sm btn-outline btn-danger delete-media-btn" data-id="' + m.id + '">Smazat</button>') +
                    '</div>' +
                '</div>';
            grid.appendChild(card);
        });
    }

    // Upload zone
    var uploadZone = document.getElementById('uploadZone');
    var uploadInput = document.getElementById('uploadInput');
    var uploadMediaBtn = document.getElementById('uploadMediaBtn');

    if (uploadZone && uploadInput) {
        uploadZone.addEventListener('click', function () { uploadInput.click(); });
        uploadZone.addEventListener('dragover', function (e) { e.preventDefault(); this.classList.add('dragover'); });
        uploadZone.addEventListener('dragleave', function () { this.classList.remove('dragover'); });
        uploadZone.addEventListener('drop', function (e) {
            e.preventDefault();
            this.classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        });
        uploadInput.addEventListener('change', function () {
            handleFiles(this.files);
            this.value = '';
        });
    }
    if (uploadMediaBtn) {
        uploadMediaBtn.addEventListener('click', function () { if (uploadInput) uploadInput.click(); });
    }

    function handleFiles(files) {
        var arr = Array.from(files);
        var total = arr.length;
        var done = 0;
        showUploadProgress(true);
        updateProgress(0, total);

        arr.reduce(function (chain, file) {
            return chain.then(function () {
                return uploadFile(file).then(function () {
                    done++;
                    updateProgress(done, total);
                });
            });
        }, Promise.resolve()).then(function () {
            showUploadProgress(false);
            notify(total + ' souborů nahráno');
            loadMedia();
        }).catch(function () {
            showUploadProgress(false);
            notify('Chyba při nahrávání', 'error');
        });
    }

    function showUploadProgress(show) {
        var el = document.getElementById('uploadProgress');
        if (el) el.hidden = !show;
    }

    function updateProgress(done, total) {
        var fill = document.getElementById('uploadProgressFill');
        var text = document.getElementById('uploadProgressText');
        var pct = total ? Math.round((done / total) * 100) : 0;
        if (fill) fill.style.width = pct + '%';
        if (text) text.textContent = 'Nahráno ' + done + ' / ' + total;
    }

    // Delete media
    document.addEventListener('click', function (e) {
        var delBtn = e.target.closest('.delete-media-btn');
        if (delBtn) {
            var id = delBtn.getAttribute('data-id');
            if (confirm('Smazat toto médium?')) {
                api('media', { action: 'delete', id: id }).then(function (data) {
                    if (data.ok) { notify('Smazáno'); loadMedia(); }
                    else notify(data.error || 'Chyba', 'error');
                });
            }
        }
        var copyBtn = e.target.closest('.copy-media-url');
        if (copyBtn) {
            var url = copyBtn.getAttribute('data-url');
            if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.origin + url).then(function () { notify('URL zkopírována'); });
            }
        }
    });

    /* ==================== IMAGE COMPRESSION + UPLOAD ==================== */
    function compressImage(file, maxWidth, quality) {
        maxWidth = maxWidth || 1200;
        quality = quality || 0.85;
        return new Promise(function (resolve) {
            if (!file.type.startsWith('image/')) { resolve(file); return; }
            var reader = new FileReader();
            reader.onload = function (e) {
                var img = new Image();
                img.onload = function () {
                    if (img.width <= maxWidth) {
                        resolve(file);
                        return;
                    }
                    var canvas = document.createElement('canvas');
                    var ratio = maxWidth / img.width;
                    canvas.width = maxWidth;
                    canvas.height = Math.round(img.height * ratio);
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob(function (blob) {
                        resolve(blob || file);
                    }, 'image/jpeg', quality);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function fileToBase64(fileOrBlob) {
        return new Promise(function (resolve) {
            var reader = new FileReader();
            reader.onload = function () { resolve(reader.result.split(',')[1]); };
            reader.readAsDataURL(fileOrBlob);
        });
    }

    function uploadFile(file) {
        var isImage = file.type.startsWith('image/');
        var chain = isImage ? compressImage(file) : Promise.resolve(file);

        return chain.then(function (processed) {
            return fileToBase64(processed);
        }).then(function (base64) {
            return api('media', {
                action: 'upload',
                data: base64,
                filename: file.name,
                type: file.type,
                alt: file.name.replace(/\.[^.]+$/, '')
            });
        });
    }

    function uploadAndPreview(file, previewId, idsArray) {
        uploadFile(file).then(function (result) {
            if (result && result.id) {
                idsArray.push(result.id);
                var preview = document.getElementById(previewId);
                if (preview) {
                    var img = document.createElement('img');
                    img.src = result.url;
                    img.className = 'admin-img-thumb';
                    preview.appendChild(img);
                }
            }
        });
    }

    /* ==================== ORDERS ==================== */
    function loadOrders() {
        api('orders', {}).then(function (data) {
            if (data.orders) {
                state.orders = data.orders;
                renderOrders('all');
                renderRecentOrders();
            }
        }).catch(function () { /* no orders */ });
    }

    function renderOrders(filter) {
        var tbody = document.getElementById('ordersTable');
        if (!tbody) return;
        var orders = state.orders;
        if (filter && filter !== 'all') {
            orders = orders.filter(function (o) { return o.status === filter; });
        }
        tbody.innerHTML = '';
        orders.forEach(function (o) {
            var tr = document.createElement('tr');
            var itemsText = (o.items || []).map(function (i) { return i.name || i.title; }).join(', ') || o.products || '—';
            tr.innerHTML =
                '<td>#' + (o.id || '').toString().slice(-4) + '</td>' +
                '<td><strong>' + (o.customer ? o.customer.name : (o.customerName || '—')) + '</strong></td>' +
                '<td>' + (o.customer ? o.customer.email : (o.email || '—')) + '</td>' +
                '<td>' + itemsText + '</td>' +
                '<td>' + formatPrice(o.total) + '</td>' +
                '<td><span class="status ' + (STATUS_CLASSES[o.status] || '') + '">' + (STATUS_LABELS[o.status] || o.status || 'Nová') + '</span></td>' +
                '<td>' + (o.createdAt ? o.createdAt.slice(0, 10) : (o.date || '—')) + '</td>' +
                '<td><button class="btn btn-sm btn-outline">Detail</button></td>';
            tbody.appendChild(tr);
        });
    }

    function renderRecentOrders() {
        var tbody = document.getElementById('recentOrders');
        if (!tbody) return;
        var recent = state.orders.slice(0, 5);
        tbody.innerHTML = '';
        recent.forEach(function (o) {
            var tr = document.createElement('tr');
            var itemsText = (o.items || []).map(function (i) { return i.name || i.title; }).join(', ') || o.products || '—';
            tr.innerHTML =
                '<td>#' + (o.id || '').toString().slice(-4) + '</td>' +
                '<td>' + (o.customer ? o.customer.name : (o.customerName || '—')) + '</td>' +
                '<td>' + itemsText + '</td>' +
                '<td>' + formatPrice(o.total) + '</td>' +
                '<td><span class="status ' + (STATUS_CLASSES[o.status] || '') + '">' + (STATUS_LABELS[o.status] || o.status || 'Nová') + '</span></td>' +
                '<td>' + (o.createdAt ? o.createdAt.slice(0, 10) : (o.date || '—')) + '</td>';
            tbody.appendChild(tr);
        });
    }

    // Order filter
    var orderFilter = document.getElementById('orderFilter');
    if (orderFilter) {
        orderFilter.addEventListener('change', function () { renderOrders(this.value); });
    }

    /* ==================== STATISTICS TAB ==================== */
    function loadStats(days) {
        api('analytics', { period: days + 'd' }).then(function (data) {
            if (data.error) return;
            // Summary cards
            var sv = document.getElementById('statsViews');
            var su = document.getElementById('statsUnique');
            var sa = document.getElementById('statsAvg');
            var sp = document.getElementById('statsTopPage');
            if (sv) sv.textContent = (data.totalViews || 0).toString();
            if (su) su.textContent = (data.totalUnique || 0).toString();
            if (sa) sa.textContent = days > 0 ? Math.round((data.totalViews || 0) / days).toString() : '0';
            if (sp && data.pageBreakdown && data.pageBreakdown.length) {
                sp.textContent = data.pageBreakdown[0].page || '/';
            } else if (sp) { sp.textContent = '—'; }

            // Chart
            if (data.chartData && data.chartData.length) {
                renderStatsChart(data.chartData);
            }

            // Top pages table
            var pagesBody = document.getElementById('statsPages');
            if (pagesBody) {
                pagesBody.innerHTML = '';
                (data.pageBreakdown || []).slice(0, 15).forEach(function (p) {
                    var tr = document.createElement('tr');
                    tr.innerHTML = '<td>' + (p.page || '/') + '</td><td>' + (p.views || 0) + '</td>';
                    pagesBody.appendChild(tr);
                });
                if (!data.pageBreakdown || !data.pageBreakdown.length) {
                    pagesBody.innerHTML = '<tr><td colspan="2" style="text-align:center;color:var(--text-muted);">Zatím žádná data</td></tr>';
                }
            }

            // Order stats
            if (data.orderStats) {
                var os = data.orderStats;
                setText('statsOrderNew', os.new || 0);
                setText('statsOrderProc', os.processing || 0);
                setText('statsOrderShip', os.shipped || 0);
                setText('statsOrderDone', os.completed || 0);
                var rt = document.getElementById('statsRevTotal');
                var ra = document.getElementById('statsRevAvg');
                if (rt) rt.textContent = formatPrice(os.totalRevenue || 0);
                if (ra) ra.textContent = formatPrice(os.avgOrder || 0);
            }
        }).catch(function () { /* stats not available */ });
    }

    function setText(id, val) {
        var el = document.getElementById(id);
        if (el) el.textContent = val.toString();
    }

    function renderStatsChart(chartData) {
        var barsEl = document.getElementById('statsChartBars');
        var labelsEl = document.getElementById('statsChartLabels');
        if (!barsEl || !labelsEl) return;

        var max = Math.max.apply(null, chartData.map(function (d) { return d.views || 0; }));
        if (max === 0) max = 1;

        barsEl.innerHTML = '';
        labelsEl.innerHTML = '';

        chartData.forEach(function (d) {
            var pct = Math.round(((d.views || 0) / max) * 100);
            var bar = document.createElement('div');
            bar.className = 'admin-chart-bar';
            bar.style.height = Math.max(pct, 2) + '%';
            bar.title = d.date + ': ' + (d.views || 0) + ' zobrazení';
            barsEl.appendChild(bar);

            var label = document.createElement('span');
            label.textContent = d.date ? d.date.slice(5) : '';
            labelsEl.appendChild(label);
        });
    }

    // Stats period buttons
    document.querySelectorAll('.stats-period-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.stats-period-btn').forEach(function (b) { b.classList.remove('active'); });
            this.classList.add('active');
            loadStats(parseInt(this.getAttribute('data-period')) || 7);
        });
    });

    // Load stats when stats tab is activated
    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            if (this.getAttribute('data-tab') === 'stats') {
                var activeBtn = document.querySelector('.stats-period-btn.active');
                loadStats(parseInt(activeBtn ? activeBtn.getAttribute('data-period') : 7));
            }
        });
    });

    /* ==================== SETTINGS ==================== */
    var currentSettings = {};

    function loadSettings() {
        api('settings', { action: 'get' }).then(function (data) {
            if (data.settings) {
                currentSettings = data.settings;
                var s = data.settings;
                setVal('settingShopName', s.shopName);
                setVal('settingFreeShipping', s.freeShippingFrom);
                setVal('settingEmail', s.email);
                setVal('settingPhone', s.phone);
                setVal('settingShipping', s.shippingPrice);
                setVal('settingCOD', s.codPrice);
                renderCategories(s);
                populateCategorySelects(s);
            }
        }).catch(function () { /* use defaults */ });
    }

    function setVal(id, val) {
        var el = document.getElementById(id);
        if (el && val !== undefined && val !== null) el.value = val;
    }

    // Default categories
    var DEFAULT_PRODUCT_CATS = [
        { id: 'ecu', name: 'ECU & Elektronika' },
        { id: 'silentbloky', name: 'Silentbloky PU' },
        { id: 'motor', name: 'Motor & Převodovky' },
        { id: 'podvozek', name: 'Podvozek & Brzdy' },
        { id: 'karoserie', name: 'Karoserie & Výfuky' },
        { id: 'baterie', name: 'Baterie' }
    ];
    var DEFAULT_POST_CATS = [
        { id: 'tuning', name: 'Tuning' },
        { id: 'motorsport', name: 'Motorsport' },
        { id: 'recenze', name: 'Recenze' },
        { id: 'navod', name: 'Návod' },
        { id: 'novinka', name: 'Novinka' }
    ];

    function renderCategories(settings) {
        var prodCats = settings.productCategories || DEFAULT_PRODUCT_CATS;
        var postCats = settings.postCategories || DEFAULT_POST_CATS;

        var prodList = document.getElementById('productCategoriesList');
        if (prodList) {
            prodList.innerHTML = '';
            prodCats.forEach(function (c) {
                var item = document.createElement('div');
                item.className = 'admin-category-item';
                item.innerHTML = '<span><strong>' + c.id + '</strong> — ' + c.name + '</span>' +
                    '<button class="btn btn-sm btn-outline btn-danger delete-prod-cat" data-id="' + c.id + '">&times;</button>';
                prodList.appendChild(item);
            });
        }

        var postList = document.getElementById('postCategoriesList');
        if (postList) {
            postList.innerHTML = '';
            postCats.forEach(function (c) {
                var item = document.createElement('div');
                item.className = 'admin-category-item';
                item.innerHTML = '<span>' + c.name + '</span>' +
                    '<button class="btn btn-sm btn-outline btn-danger delete-post-cat" data-id="' + c.id + '">&times;</button>';
                postList.appendChild(item);
            });
        }
    }

    function populateCategorySelects(settings) {
        var prodCats = settings.productCategories || DEFAULT_PRODUCT_CATS;
        var postCats = settings.postCategories || DEFAULT_POST_CATS;

        // Product category select
        var prodSelect = document.getElementById('prodCategory');
        if (prodSelect) {
            var currentVal = prodSelect.value;
            prodSelect.innerHTML = '';
            prodCats.forEach(function (c) {
                var opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.name;
                prodSelect.appendChild(opt);
            });
            if (currentVal) prodSelect.value = currentVal;
        }

        // Post category select
        var postSelect = document.getElementById('postCategory');
        if (postSelect) {
            var currentPostVal = postSelect.value;
            postSelect.innerHTML = '';
            postCats.forEach(function (c) {
                var opt = document.createElement('option');
                opt.value = c.name;
                opt.textContent = c.name;
                postSelect.appendChild(opt);
            });
            if (currentPostVal) postSelect.value = currentPostVal;
        }

        // Update CATEGORIES lookup
        CATEGORIES = {};
        prodCats.forEach(function (c) { CATEGORIES[c.id] = c.name; });
    }

    function saveCurrentSettings() {
        api('settings', { action: 'save', settings: currentSettings }).then(function (data) {
            if (data.ok) { notify('Uloženo'); renderCategories(currentSettings); populateCategorySelects(currentSettings); }
            else notify(data.error || 'Chyba', 'error');
        });
    }

    // Add product category
    var addProdCatBtn = document.getElementById('addProdCatBtn');
    if (addProdCatBtn) {
        addProdCatBtn.addEventListener('click', function () {
            var id = document.getElementById('newProdCatId').value.trim().toLowerCase();
            var name = document.getElementById('newProdCatName').value.trim();
            if (!id || !name) return notify('Vyplňte ID i název', 'error');
            if (!currentSettings.productCategories) currentSettings.productCategories = DEFAULT_PRODUCT_CATS.slice();
            if (currentSettings.productCategories.find(function (c) { return c.id === id; })) return notify('ID již existuje', 'error');
            currentSettings.productCategories.push({ id: id, name: name });
            document.getElementById('newProdCatId').value = '';
            document.getElementById('newProdCatName').value = '';
            saveCurrentSettings();
        });
    }

    // Add post category
    var addPostCatBtn = document.getElementById('addPostCatBtn');
    if (addPostCatBtn) {
        addPostCatBtn.addEventListener('click', function () {
            var name = document.getElementById('newPostCatName').value.trim();
            if (!name) return notify('Vyplňte název', 'error');
            if (!currentSettings.postCategories) currentSettings.postCategories = DEFAULT_POST_CATS.slice();
            var id = name.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (currentSettings.postCategories.find(function (c) { return c.id === id; })) return notify('Kategorie již existuje', 'error');
            currentSettings.postCategories.push({ id: id, name: name });
            document.getElementById('newPostCatName').value = '';
            saveCurrentSettings();
        });
    }

    // Delete category
    document.addEventListener('click', function (e) {
        var delProdCat = e.target.closest('.delete-prod-cat');
        if (delProdCat) {
            var id = delProdCat.getAttribute('data-id');
            if (!currentSettings.productCategories) currentSettings.productCategories = DEFAULT_PRODUCT_CATS.slice();
            currentSettings.productCategories = currentSettings.productCategories.filter(function (c) { return c.id !== id; });
            saveCurrentSettings();
        }
        var delPostCat = e.target.closest('.delete-post-cat');
        if (delPostCat) {
            var pid = delPostCat.getAttribute('data-id');
            if (!currentSettings.postCategories) currentSettings.postCategories = DEFAULT_POST_CATS.slice();
            currentSettings.postCategories = currentSettings.postCategories.filter(function (c) { return c.id !== pid; });
            saveCurrentSettings();
        }
    });

    var saveSettingsBtn = document.getElementById('saveSettings');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', function () {
            currentSettings.freeShippingFrom = parseInt(document.getElementById('settingFreeShipping').value) || 20000;
            currentSettings.email = document.getElementById('settingEmail').value;
            currentSettings.phone = document.getElementById('settingPhone').value;
            currentSettings.shippingPrice = parseInt(document.getElementById('settingShipping').value) || 149;
            currentSettings.codPrice = parseInt(document.getElementById('settingCOD').value) || 39;
            saveCurrentSettings();
        });
    }

    /* ==================== COMPANY INFO ==================== */

    function loadCompanyInfo() {
        api('settings', { action: 'get-company' }).then(function (data) {
            if (!data.company) return;
            var c = data.company;
            var el;
            el = document.getElementById('settingCompanyName'); if (el && c.companyName) el.value = c.companyName;
            el = document.getElementById('settingCompanyAddress'); if (el && c.companyAddress) el.value = c.companyAddress;
            el = document.getElementById('settingCompanyIco'); if (el && c.companyIco) el.value = c.companyIco;
            el = document.getElementById('settingCompanyEmail'); if (el && c.companyEmail) el.value = c.companyEmail;
            el = document.getElementById('settingCompanyPhone'); if (el && c.companyPhone) el.value = c.companyPhone;
            el = document.getElementById('settingCompanyHours'); if (el && c.companyHours) el.value = c.companyHours;
        }).catch(function () {});
    }

    var saveCompanyBtn = document.getElementById('saveCompanyInfo');
    if (saveCompanyBtn) {
        saveCompanyBtn.addEventListener('click', function () {
            api('settings', {
                action: 'save-company',
                companyName: document.getElementById('settingCompanyName').value,
                companyAddress: document.getElementById('settingCompanyAddress').value,
                companyIco: document.getElementById('settingCompanyIco').value,
                companyEmail: document.getElementById('settingCompanyEmail').value,
                companyPhone: document.getElementById('settingCompanyPhone').value,
                companyHours: document.getElementById('settingCompanyHours').value
            }).then(function (data) {
                if (data.ok) notify('Firemní údaje uloženy');
                else notify(data.error || 'Chyba', 'error');
            });
        });
    }

    /* ==================== ADMIN ACCOUNT ==================== */

    function loadAdminAccount() {
        if (state.user) {
            var nameEl = document.getElementById('settingAdminName');
            var emailEl = document.getElementById('settingAdminEmail');
            if (nameEl) nameEl.value = state.user.name || '';
            if (emailEl) emailEl.value = state.user.email || '';
        }
    }

    var saveAccountBtn = document.getElementById('saveAdminAccount');
    if (saveAccountBtn) {
        saveAccountBtn.addEventListener('click', function () {
            var newName = document.getElementById('settingAdminName').value.trim();
            var newEmail = document.getElementById('settingAdminEmail').value.trim();
            var currentPw = document.getElementById('settingCurrentPw').value;
            var newPw = document.getElementById('settingNewPw').value;

            var promises = [];

            // Update name if changed
            if (newName && newName !== (state.user.name || '')) {
                promises.push(api('auth', { action: 'update-profile', name: newName }).then(function (data) {
                    if (data.ok && data.user) {
                        state.user = data.user;
                        if (adminUserName) adminUserName.textContent = data.user.name || data.user.email;
                        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
                    }
                }));
            }

            // Change email if changed and password provided
            if (newEmail && newEmail !== (state.user.email || '') && currentPw) {
                promises.push(api('auth', { action: 'change-email', password: currentPw, newEmail: newEmail }).then(function (data) {
                    if (data.ok && data.user) {
                        state.user = data.user;
                        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
                    } else if (data.error) {
                        notify(data.error, 'error');
                    }
                }));
            }

            // Change password if provided
            if (currentPw && newPw) {
                promises.push(api('auth', { action: 'change-password', currentPassword: currentPw, newPassword: newPw }).then(function (data) {
                    if (data.ok) {
                        document.getElementById('settingCurrentPw').value = '';
                        document.getElementById('settingNewPw').value = '';
                    } else {
                        notify(data.error || 'Chyba při změně hesla', 'error');
                    }
                }));
            }

            if (!promises.length) {
                notify('Žádné změny k uložení');
                return;
            }

            Promise.all(promises).then(function () {
                notify('Účet aktualizován');
            });
        });
    }

    /* ==================== NEWSLETTER TAB ==================== */

    var nlSubscriberCount = 0;

    function loadNewsletterTab() {
        loadNlSubscribers();
        loadNlDrafts();
        loadNlHistory();
    }

    function loadNlSubscribers() {
        api('newsletter', { action: 'list' }).then(function (data) {
            var tbody = document.getElementById('nlSubscriberList');
            if (!tbody || !data.subscribers) return;
            nlSubscriberCount = data.subscribers.length;
            var countEl = document.getElementById('subscriberCount');
            if (countEl) countEl.textContent = '(' + nlSubscriberCount + ')';
            tbody.innerHTML = '';
            data.subscribers.forEach(function (s) {
                var tr = document.createElement('tr');
                tr.innerHTML =
                    '<td>' + (s.email || '') + '</td>' +
                    '<td>' + (s.subscribedAt ? s.subscribedAt.slice(0, 10) : '—') + '</td>' +
                    '<td><button class="btn btn-sm btn-outline btn-danger nl-unsub-btn" data-email="' + s.email + '">Odhlásit</button></td>';
                tbody.appendChild(tr);
            });
            if (!data.subscribers.length) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);">Zatím žádní odběratelé</td></tr>';
            }
        }).catch(function () {});
    }

    function loadNlDrafts() {
        api('newsletter', { action: 'get-drafts' }).then(function (data) {
            var tbody = document.getElementById('nlDraftsList');
            if (!tbody) return;
            tbody.innerHTML = '';
            if (!data.drafts || !data.drafts.length) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);">Žádné koncepty</td></tr>';
                return;
            }
            data.drafts.forEach(function (d) {
                var tr = document.createElement('tr');
                tr.innerHTML =
                    '<td>' + (d.subject || '(bez předmětu)') + '</td>' +
                    '<td>' + (d.updatedAt ? d.updatedAt.slice(0, 16).replace('T', ' ') : '—') + '</td>' +
                    '<td>' +
                    '<button class="btn btn-sm btn-outline nl-edit-draft" data-id="' + d.id + '">Upravit</button> ' +
                    '<button class="btn btn-sm btn-primary nl-send-draft" data-id="' + d.id + '" data-subject="' + (d.subject || '').replace(/"/g, '&quot;') + '">Odeslat</button> ' +
                    '<button class="btn btn-sm btn-outline btn-danger nl-delete-draft" data-id="' + d.id + '">Smazat</button>' +
                    '</td>';
                tbody.appendChild(tr);
            });
        }).catch(function () {});
    }

    function loadNlHistory() {
        api('newsletter', { action: 'get-history' }).then(function (data) {
            var tbody = document.getElementById('nlHistoryList');
            if (!tbody) return;
            tbody.innerHTML = '';
            if (!data.history || !data.history.length) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);">Zatím žádné odeslané</td></tr>';
                return;
            }
            data.history.forEach(function (h) {
                var tr = document.createElement('tr');
                tr.innerHTML =
                    '<td>' + (h.subject || '') + '</td>' +
                    '<td>' + (h.sentAt ? h.sentAt.slice(0, 16).replace('T', ' ') : '—') + '</td>' +
                    '<td>' + (h.recipientCount || 0) + '</td>';
                tbody.appendChild(tr);
            });
        }).catch(function () {});
    }

    // Open composer
    var btnNewNl = document.getElementById('btnNewNewsletter');
    if (btnNewNl) {
        btnNewNl.addEventListener('click', function () {
            document.getElementById('nlSubject').value = '';
            if (nlQuill) nlQuill.setContents([]);
            document.getElementById('nlDraftId').value = '';
            document.getElementById('nlPreviewWrap').style.display = 'none';
            document.getElementById('newsletterModalTitle').textContent = 'Nový newsletter';
            openModal('newsletterModal');
        });
    }

    // Edit draft
    document.addEventListener('click', function (e) {
        var editBtn = e.target.closest('.nl-edit-draft');
        if (editBtn) {
            var draftId = editBtn.getAttribute('data-id');
            api('newsletter', { action: 'get', id: draftId }).then(function (data) {
                if (!data.newsletter) return;
                document.getElementById('nlSubject').value = data.newsletter.subject || '';
                if (nlQuill) nlQuill.root.innerHTML = data.newsletter.content || '';
                document.getElementById('nlDraftId').value = data.newsletter.id;
                document.getElementById('nlPreviewWrap').style.display = 'none';
                document.getElementById('newsletterModalTitle').textContent = 'Upravit koncept';
                openModal('newsletterModal');
            });
        }
    });

    // Save draft
    var btnSaveDraft = document.getElementById('btnNlSaveDraft');
    if (btnSaveDraft) {
        btnSaveDraft.addEventListener('click', function () {
            var subject = document.getElementById('nlSubject').value.trim();
            if (!subject) { notify('Vyplňte předmět', 'error'); return; }
            var payload = {
                action: 'save-draft',
                subject: subject,
                content: nlQuill ? nlQuill.root.innerHTML : ''
            };
            var existingId = document.getElementById('nlDraftId').value;
            if (existingId) payload.id = existingId;
            api('newsletter', payload).then(function (data) {
                if (data.id) document.getElementById('nlDraftId').value = data.id;
                notify('Koncept uložen');
                loadNlDrafts();
            });
        });
    }

    // Preview
    var btnPreview = document.getElementById('btnNlPreview');
    if (btnPreview) {
        btnPreview.addEventListener('click', function () {
            var wrap = document.getElementById('nlPreviewWrap');
            var frame = document.getElementById('nlPreviewFrame');
            var content = nlQuill ? nlQuill.root.innerHTML : '';
            if (!content.trim()) { notify('Vyplňte obsah pro náhled', 'error'); return; }
            wrap.style.display = 'block';
            var doc = frame.contentDocument || frame.contentWindow.document;
            doc.open();
            doc.write('<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:20px;background:#1a1a1a;color:#e0e0e0;font-family:Arial,sans-serif;font-size:14px;line-height:1.6}a{color:#c0392b}h1,h2,h3{color:#fff}</style></head><body>' + content + '</body></html>');
            doc.close();
        });
    }

    // Send newsletter
    var btnSend = document.getElementById('btnNlSend');
    if (btnSend) {
        btnSend.addEventListener('click', function () {
            var subject = document.getElementById('nlSubject').value.trim();
            var content = nlQuill ? nlQuill.root.innerHTML.replace(/^<p><br><\/p>$/, '') : '';
            if (!subject || !content) { notify('Vyplňte předmět i obsah', 'error'); return; }
            var msg = 'Odeslat newsletter "' + subject + '" ' + nlSubscriberCount + ' odběratelům?';
            if (!confirm(msg)) return;
            btnSend.disabled = true;
            btnSend.textContent = 'Odesílám...';
            var payload = { action: 'send', subject: subject, content: content };
            var existingId = document.getElementById('nlDraftId').value;
            if (existingId) payload.id = existingId;
            api('newsletter', payload).then(function (data) {
                btnSend.disabled = false;
                btnSend.textContent = 'Odeslat';
                if (data.ok) {
                    notify('Odesláno ' + data.sent + ' příjemcům' + (data.failed ? ' (' + data.failed + ' selhalo)' : ''));
                    closeModal('newsletterModal');
                    loadNlDrafts();
                    loadNlHistory();
                } else {
                    notify(data.error || 'Chyba při odesílání', 'error');
                }
            }).catch(function () {
                btnSend.disabled = false;
                btnSend.textContent = 'Odeslat';
                notify('Chyba při odesílání', 'error');
            });
        });
    }

    // Send from drafts table
    document.addEventListener('click', function (e) {
        var sendBtn = e.target.closest('.nl-send-draft');
        if (sendBtn) {
            var draftId = sendBtn.getAttribute('data-id');
            api('newsletter', { action: 'get', id: draftId }).then(function (data) {
                if (!data.newsletter) return;
                document.getElementById('nlSubject').value = data.newsletter.subject || '';
                if (nlQuill) nlQuill.root.innerHTML = data.newsletter.content || '';
                document.getElementById('nlDraftId').value = data.newsletter.id;
                document.getElementById('nlPreviewWrap').style.display = 'none';
                document.getElementById('newsletterModalTitle').textContent = 'Odeslat newsletter';
                openModal('newsletterModal');
            });
        }
    });

    // Delete draft
    document.addEventListener('click', function (e) {
        var delBtn = e.target.closest('.nl-delete-draft');
        if (delBtn) {
            var draftId = delBtn.getAttribute('data-id');
            if (confirm('Smazat tento koncept?')) {
                api('newsletter', { action: 'delete-draft', id: draftId }).then(function () {
                    notify('Koncept smazán');
                    loadNlDrafts();
                });
            }
        }
    });

    // Unsubscribe from newsletter tab
    document.addEventListener('click', function (e) {
        var unsub = e.target.closest('.nl-unsub-btn');
        if (unsub) {
            var email = unsub.getAttribute('data-email');
            if (confirm('Odhlásit ' + email + ' z newsletteru?')) {
                api('newsletter', { action: 'unsubscribe', email: email }).then(function () {
                    notify('Odhlášeno');
                    loadNlSubscribers();
                });
            }
        }
    });

    // Newsletter image upload
    var btnNlImage = document.getElementById('btnNlImage');
    var nlImageUpload = document.getElementById('nlImageUpload');
    if (btnNlImage && nlImageUpload) {
        btnNlImage.addEventListener('click', function () { nlImageUpload.click(); });
        nlImageUpload.addEventListener('change', function () {
            if (!this.files[0]) return;
            var statusEl = document.getElementById('nlImageStatus');
            if (statusEl) statusEl.textContent = 'Nahrávám...';
            btnNlImage.disabled = true;
            uploadFile(this.files[0]).then(function (result) {
                btnNlImage.disabled = false;
                if (statusEl) statusEl.textContent = '';
                if (result && result.url && nlQuill) {
                    var range = nlQuill.getSelection(true);
                    nlQuill.insertEmbed(range ? range.index : 0, 'image', result.url);
                    notify('Obrázek vložen do obsahu');
                }
            }).catch(function () {
                btnNlImage.disabled = false;
                if (statusEl) statusEl.textContent = '';
                notify('Chyba při nahrávání', 'error');
            });
            this.value = '';
        });
    }

    /* ==================== MESSAGES ==================== */

    var currentMessageId = null;

    function loadMessages() {
        api('messages', { action: 'list' }).then(function (data) {
            var tbody = document.getElementById('messagesTable');
            if (!tbody || !data.messages) return;
            var countEl = document.getElementById('messagesCount');
            if (countEl) countEl.textContent = data.messages.length ? '(' + data.messages.length + ')' : '';
            tbody.innerHTML = '';
            if (!data.messages.length) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">Žádné zprávy</td></tr>';
                return;
            }
            data.messages.forEach(function (m) {
                var tr = document.createElement('tr');
                tr.innerHTML =
                    '<td>' + (m.name || '') + '</td>' +
                    '<td><a href="mailto:' + (m.email || '') + '">' + (m.email || '') + '</a></td>' +
                    '<td>' + (m.subject || '—') + '</td>' +
                    '<td>' + (m.createdAt ? m.createdAt.slice(0, 16).replace('T', ' ') : '—') + '</td>' +
                    '<td>' +
                    '<button class="btn btn-sm btn-outline msg-view-btn" data-id="' + m.id + '">Zobrazit</button> ' +
                    '<button class="btn btn-sm btn-outline btn-danger msg-delete-btn" data-id="' + m.id + '">Smazat</button>' +
                    '</td>';
                tbody.appendChild(tr);
            });
        }).catch(function () {});
    }

    // View message detail
    document.addEventListener('click', function (e) {
        var viewBtn = e.target.closest('.msg-view-btn');
        if (viewBtn) {
            var msgId = viewBtn.getAttribute('data-id');
            api('messages', { action: 'list' }).then(function (data) {
                if (!data.messages) return;
                var msg = data.messages.find(function (m) { return m.id === msgId; });
                if (!msg) return;
                currentMessageId = msg.id;
                var title = document.getElementById('messageModalTitle');
                var body = document.getElementById('messageModalBody');
                if (title) title.textContent = msg.subject || 'Zpráva od ' + msg.name;
                if (body) {
                    body.innerHTML =
                        '<div style="display:grid;gap:0.75rem;font-size:0.9rem">' +
                        '<div><strong>Jméno:</strong> ' + (msg.name || '') + '</div>' +
                        '<div><strong>E-mail:</strong> <a href="mailto:' + (msg.email || '') + '">' + (msg.email || '') + '</a></div>' +
                        (msg.phone ? '<div><strong>Telefon:</strong> <a href="tel:' + msg.phone + '">' + msg.phone + '</a></div>' : '') +
                        '<div><strong>Předmět:</strong> ' + (msg.subject || '—') + '</div>' +
                        '<div><strong>Datum:</strong> ' + (msg.createdAt ? msg.createdAt.slice(0, 16).replace('T', ' ') : '—') + '</div>' +
                        '<hr style="border:none;border-top:1px solid var(--surface-border);margin:0.5rem 0">' +
                        '<div style="white-space:pre-wrap;line-height:1.6">' + (msg.message || '') + '</div>' +
                        '</div>';
                }
                openModal('messageModal');
            });
        }
    });

    // Delete message from table
    document.addEventListener('click', function (e) {
        var delBtn = e.target.closest('.msg-delete-btn');
        if (delBtn) {
            var msgId = delBtn.getAttribute('data-id');
            if (confirm('Smazat tuto zprávu?')) {
                api('messages', { action: 'delete', id: msgId }).then(function () {
                    notify('Zpráva smazána');
                    loadMessages();
                });
            }
        }
    });

    // Delete from modal
    var btnDelMsg = document.getElementById('btnDeleteMessage');
    if (btnDelMsg) {
        btnDelMsg.addEventListener('click', function () {
            if (!currentMessageId) return;
            if (confirm('Smazat tuto zprávu?')) {
                api('messages', { action: 'delete', id: currentMessageId }).then(function () {
                    notify('Zpráva smazána');
                    closeModal('messageModal');
                    loadMessages();
                    currentMessageId = null;
                });
            }
        });
    }

    /* ==================== MODAL SYSTEM ==================== */
    function openModal(id) {
        var modal = document.getElementById(id);
        if (modal) { modal.hidden = false; document.body.style.overflow = 'hidden'; }
    }

    function closeModal(id) {
        var modal = document.getElementById(id);
        if (modal) { modal.hidden = true; document.body.style.overflow = ''; }
    }

    // Close buttons
    document.addEventListener('click', function (e) {
        var closeBtn = e.target.closest('[data-close-modal]');
        if (closeBtn) closeModal(closeBtn.getAttribute('data-close-modal'));
        // Overlay click
        var overlay = e.target.closest('.admin-modal-overlay');
        if (overlay) {
            var modal = overlay.closest('.admin-modal');
            if (modal) closeModal(modal.id);
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            var modals = document.querySelectorAll('.admin-modal:not([hidden])');
            modals.forEach(function (m) { closeModal(m.id); });
        }
    });

})();
