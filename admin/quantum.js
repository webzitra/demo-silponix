// admin/quantum.js
(function () {
    'use strict';

    var token = '';
    var API   = '/.netlify/functions/quantum-admin';

    // ---- Auth ----
    document.getElementById('loginBtn').addEventListener('click', function () {
        token = document.getElementById('loginToken').value.trim();
        if (!token) return;
        apiCall('list', 'testimonials').then(function () {
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('dashboard').removeAttribute('hidden');
            loadAll();
        }).catch(function () {
            showToast('Špatný token', 'error');
        });
    });

    document.getElementById('loginToken').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') document.getElementById('loginBtn').click();
    });

    // ---- API ----
    function apiCall(action, table, data, id) {
        return fetch(API, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: action, table: table, data: data, id: id })
        }).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        });
    }

    // ---- Load ----
    function loadAll() { loadTestimonials(); loadStats(); }

    function loadTestimonials() {
        apiCall('list', 'testimonials').then(function (res) {
            var tbody = document.querySelector('#testimonialsTable tbody');
            tbody.innerHTML = '';
            (res.data || []).forEach(function (t) {
                var tr = document.createElement('tr');
                tr.innerHTML =
                    '<td>' + escapeHTML(t.name) + '</td>' +
                    '<td>' + escapeHTML(t.company || '—') + '</td>' +
                    '<td>' + '\u2605'.repeat(t.rating || 5) + '</td>' +
                    '<td>' + (t.active ? '\u2705' : '\u274C') + '</td>' +
                    '<td><button class="btn btn-sm" onclick="editTestimonial(' + t.id + ')">Upravit</button>' +
                        '<button class="btn btn-danger btn-sm" onclick="deleteRow(\'testimonials\',' + t.id + ')">Smazat</button></td>';
                tbody.appendChild(tr);
            });
            window._testimonials = res.data || [];
        });
    }

    function loadStats() {
        apiCall('list', 'site_stats').then(function (res) {
            var tbody = document.querySelector('#statsTable tbody');
            tbody.innerHTML = '';
            (res.data || []).forEach(function (s) {
                var tr = document.createElement('tr');
                tr.innerHTML =
                    '<td><code>' + escapeHTML(s.key) + '</code></td>' +
                    '<td><strong>' + s.value + '</strong></td>' +
                    '<td>' + escapeHTML(s.suffix || '') + '</td>' +
                    '<td>' + escapeHTML(s.label_cs || '') + '</td>' +
                    '<td><button class="btn btn-sm" onclick="editStat(' + s.id + ')">Upravit</button></td>';
                tbody.appendChild(tr);
            });
            window._stats = res.data || [];
        });
    }

    // ---- Sidebar nav ----
    document.querySelectorAll('.qa-nav-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.qa-nav-btn').forEach(function (b) { b.classList.remove('active'); });
            document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('active'); });
            btn.classList.add('active');
            document.getElementById(btn.getAttribute('data-panel')).classList.add('active');
        });
    });

    // ---- Add testimonial ----
    document.getElementById('addTestimonialBtn').addEventListener('click', function () {
        openModal('Přidat Testimonial', testimonialForm({}), function (data) {
            apiCall('upsert', 'testimonials', data).then(function () {
                showToast('Uloženo', 'success'); loadTestimonials();
            }).catch(function (e) { showToast(e.message, 'error'); });
        });
    });

    window.editTestimonial = function (id) {
        var t = (window._testimonials || []).find(function (x) { return x.id === id; }) || {};
        openModal('Upravit Testimonial', testimonialForm(t), function (data) {
            data.id = id;
            apiCall('upsert', 'testimonials', data).then(function () {
                showToast('Uloženo', 'success'); loadTestimonials();
            }).catch(function (e) { showToast(e.message, 'error'); });
        });
    };

    window.editStat = function (id) {
        var s = (window._stats || []).find(function (x) { return x.id === id; }) || {};
        openModal('Upravit Stat', statForm(s), function (data) {
            data.id = id;
            apiCall('upsert', 'site_stats', data).then(function () {
                showToast('Uloženo', 'success'); loadStats();
            }).catch(function (e) { showToast(e.message, 'error'); });
        });
    };

    window.deleteRow = function (table, id) {
        if (!confirm('Opravdu smazat?')) return;
        apiCall('delete', table, null, id).then(function () {
            showToast('Smazáno', 'success'); loadAll();
        }).catch(function (e) { showToast(e.message, 'error'); });
    };

    // ---- Forms ----
    function testimonialForm(t) {
        return '<div class="form-group"><label>Jméno *</label><input id="fName" value="' + escapeHTML(t.name||'') + '"></div>' +
               '<div class="form-group"><label>Firma</label><input id="fCompany" value="' + escapeHTML(t.company||'') + '"></div>' +
               '<div class="form-group"><label>Role</label><input id="fRole" value="' + escapeHTML(t.role||'') + '"></div>' +
               '<div class="form-group"><label>Text *</label><textarea id="fText">' + escapeHTML(t.text||'') + '</textarea></div>' +
               '<div class="form-group"><label>Hodnocení</label><select id="fRating">' +
                   [5,4,3,2,1].map(function(v){ return '<option value="'+v+'"' + (t.rating===v?' selected':'') + '>'+v+'\u2605</option>'; }).join('') +
               '</select></div>' +
               '<div class="form-group"><label><input type="checkbox" id="fActive"' + (t.active!==false?' checked':'') + '> Aktivní</label></div>';
    }

    function statForm(s) {
        return '<div class="form-group"><label>Klíč</label><input id="fKey" value="' + escapeHTML(s.key||'') + '" readonly></div>' +
               '<div class="form-group"><label>Hodnota *</label><input id="fValue" type="number" value="' + (s.value||0) + '"></div>' +
               '<div class="form-group"><label>Přípona</label><input id="fSuffix" value="' + escapeHTML(s.suffix||'') + '"></div>' +
               '<div class="form-group"><label>Popisek CZ</label><input id="fLabelCs" value="' + escapeHTML(s.label_cs||'') + '"></div>';
    }

    // ---- Modal ----
    var modalCallback = null;
    function openModal(title, bodyHTML, onSave) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = bodyHTML;
        modalCallback = onSave;
        document.getElementById('modalOverlay').classList.add('open');
    }
    document.getElementById('modalCancel').addEventListener('click', function () {
        document.getElementById('modalOverlay').classList.remove('open');
    });
    document.getElementById('modalSave').addEventListener('click', function () {
        var data = {};
        var fName = document.getElementById('fName');
        if (fName) {
            data.name    = fName.value.trim();
            data.company = (document.getElementById('fCompany')||{}).value || '';
            data.role    = (document.getElementById('fRole')||{}).value || '';
            data.text    = (document.getElementById('fText')||{}).value || '';
            data.rating  = parseInt((document.getElementById('fRating')||{}).value||'5', 10);
            data.active  = (document.getElementById('fActive')||{}).checked !== false;
        }
        var fValue = document.getElementById('fValue');
        if (fValue) {
            data.value    = parseInt(fValue.value, 10);
            data.suffix   = (document.getElementById('fSuffix')||{}).value || '';
            data.label_cs = (document.getElementById('fLabelCs')||{}).value || '';
        }
        if (typeof modalCallback === 'function') modalCallback(data);
        document.getElementById('modalOverlay').classList.remove('open');
    });

    // ---- Toast ----
    function showToast(msg, type) {
        var t = document.getElementById('toast');
        t.textContent = msg;
        t.className = 'toast ' + (type || '');
        requestAnimationFrame(function () {
            requestAnimationFrame(function () { t.classList.add('show'); });
        });
        setTimeout(function () { t.classList.remove('show'); }, 3000);
    }

    function escapeHTML(str) {
        var d = document.createElement('div');
        d.appendChild(document.createTextNode(str || ''));
        return d.innerHTML;
    }
})();
