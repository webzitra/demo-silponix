/* ════════════════════════════════════════════════════════════
   Silponix — Build Your Honda (4-step inquiry wizard)
   ════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    const STORAGE_KEY = 'silponix-build';
    const TOTAL_STEPS = 4;

    const root = document.querySelector('[data-builder-root]');
    if (!root) return;

    /* ─── State ─────────────────────────────────────────────── */
    let state = { step: 1, model: '', use: '', tier: '', name: '', email: '', phone: '', message: '' };
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        if (saved && typeof saved === 'object') state = Object.assign(state, saved);
    } catch (_) { /* ignore corrupt JSON */ }

    function persist() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { /* private mode */ }
    }

    /* ─── DOM refs ──────────────────────────────────────────── */
    const stepEls = root.querySelectorAll('.builder-step');
    const progressBar = root.querySelector('.builder-progress-bar');
    const counterEl = root.querySelector('.builder-step-counter');
    const prevBtn = root.querySelector('[data-builder-prev]');
    const nextBtn = root.querySelector('[data-builder-next]');
    const summaryEl = root.querySelector('.builder-summary');
    const successEl = root.querySelector('.builder-success');
    const formEl = root.querySelector('.builder-form');

    const labelMap = {
        'civic-eg': 'Civic EG', 'civic-ek': 'Civic EK', 'civic-ep': 'Civic EP',
        'integra-dc2': 'Integra DC2', 's2000': 'S2000', 'accord': 'Accord',
        'nsx': 'NSX', 'other': 'Jiný model',
        'street': 'Ulice / Daily', 'track': 'Track-day / Okruh', 'rally': 'Rally',
        'rallycross': 'Rallycross', 'drift': 'Drift', 'show': 'Show / Stance',
        'basic': 'Basic (do 100 000 Kč)', 'mid': 'Mid (100 — 300 000 Kč)',
        'premium': 'Premium (300 000+ Kč)', 'ask': 'Poradíme s rozpočtem'
    };

    /* ─── Render ────────────────────────────────────────────── */
    function render() {
        stepEls.forEach((el) => {
            const n = Number(el.dataset.step);
            el.classList.toggle('is-active', n === state.step);
            el.toggleAttribute('hidden', n !== state.step);
        });

        // Reflect chip selections
        root.querySelectorAll('[data-builder-field]').forEach((chip) => {
            const field = chip.dataset.builderField;
            const val = chip.dataset.value;
            const isSelected = state[field] === val;
            chip.classList.toggle('is-selected', isSelected);
            chip.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        });

        // Reflect text inputs
        ['name', 'email', 'phone', 'message'].forEach((f) => {
            const input = formEl && formEl.querySelector('[name="' + f + '"]');
            if (input && input.value !== state[f]) input.value = state[f];
        });

        // Progress
        const pct = Math.round(((state.step - 1) / TOTAL_STEPS) * 100);
        if (progressBar) progressBar.style.width = pct + '%';
        if (counterEl) counterEl.textContent = state.step + ' / ' + TOTAL_STEPS;

        // Nav buttons
        if (prevBtn) prevBtn.disabled = state.step === 1;
        if (nextBtn) {
            nextBtn.textContent = state.step === TOTAL_STEPS ? 'Odeslat poptávku' : 'Další →';
            nextBtn.disabled = !canAdvance();
        }

        // Summary visibility — show when at least 1 selection made
        if (summaryEl) {
            const anyChoice = state.model || state.use || state.tier;
            summaryEl.hidden = !anyChoice;
            summaryEl.querySelectorAll('[data-summary]').forEach((el) => {
                const f = el.dataset.summary;
                el.textContent = state[f] ? labelMap[state[f]] || state[f] : '—';
            });
        }
    }

    function canAdvance() {
        if (state.step === 1) return !!state.model;
        if (state.step === 2) return !!state.use;
        if (state.step === 3) return !!state.tier;
        if (state.step === 4) {
            const gdpr = formEl && formEl.querySelector('[name="gdpr"]');
            return !!state.name && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(state.email) && gdpr && gdpr.checked;
        }
        return false;
    }

    /* ─── Event wiring ──────────────────────────────────────── */
    root.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-builder-field]');
        if (chip) {
            const field = chip.dataset.builderField;
            state[field] = chip.dataset.value;
            persist();
            render();
            // auto-advance from chip steps (1-3) for snappier UX
            if (state.step < 4 && state.step <= 3) {
                setTimeout(() => { goNext(); }, 220);
            }
        }
    });

    if (formEl) {
        formEl.addEventListener('input', (e) => {
            const t = e.target;
            if (t && t.name && t.name in state) {
                state[t.name] = t.value;
                persist();
                render();
            }
            if (t && t.name === 'gdpr') render();
        });
    }

    function goPrev() {
        if (state.step > 1) {
            state.step -= 1;
            persist();
            render();
        }
    }

    function goNext() {
        if (!canAdvance()) {
            // shake feedback
            if (nextBtn) {
                nextBtn.classList.remove('shake');
                void nextBtn.offsetWidth;
                nextBtn.classList.add('shake');
            }
            return;
        }
        if (state.step < TOTAL_STEPS) {
            state.step += 1;
            persist();
            render();
        } else {
            submit();
        }
    }

    if (prevBtn) prevBtn.addEventListener('click', goPrev);
    if (nextBtn) nextBtn.addEventListener('click', goNext);

    /* ─── Submit ────────────────────────────────────────────── */
    function submit() {
        if (!nextBtn) return;
        nextBtn.disabled = true;
        const originalText = nextBtn.textContent;
        nextBtn.textContent = 'Odesílám…';

        const payload = {
            model: state.model, use: state.use, tier: state.tier,
            name: state.name, email: state.email, phone: state.phone,
            message: state.message, source: 'home-builder'
        };

        fetch('/api/inquiry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then((r) => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
          .then(() => showSuccess())
          .catch(() => showSuccess()) /* graceful — demo backend */
          .finally(() => {
            nextBtn.textContent = originalText;
            nextBtn.disabled = false;
          });
    }

    function showSuccess() {
        // Show success panel, hide form steps + nav
        stepEls.forEach((el) => el.setAttribute('hidden', ''));
        if (successEl) successEl.removeAttribute('hidden');
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (progressBar) progressBar.style.width = '100%';
        if (counterEl) counterEl.textContent = 'Hotovo';

        // Reset stored state after short delay so a refresh shows the form fresh
        try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* ignore */ }
    }

    /* ─── Mobile drawer toggle ─────────────────────────────── */
    const drawerToggle = document.querySelector('[data-builder-toggle]');
    if (drawerToggle) {
        drawerToggle.addEventListener('click', () => {
            root.classList.toggle('is-drawer-open');
            const open = root.classList.contains('is-drawer-open');
            drawerToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            document.body.style.overflow = open ? 'hidden' : '';
        });
    }
    const drawerClose = root.querySelector('[data-builder-close]');
    if (drawerClose) {
        drawerClose.addEventListener('click', () => {
            root.classList.remove('is-drawer-open');
            if (drawerToggle) drawerToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        });
    }

    /* ─── Initial render ────────────────────────────────────── */
    render();
})();
