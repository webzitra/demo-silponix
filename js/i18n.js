(function() {
    'use strict';

    var currentLang = localStorage.getItem('silponix-lang') || 'cs';
    var translations = {};
    var loaded = {};

    function loadTranslations(lang, callback) {
        if (loaded[lang]) { callback(translations[lang]); return; }
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/lang/' + lang + '.json', true);
        xhr.onload = function() {
            if (xhr.status === 200) {
                try {
                    translations[lang] = JSON.parse(xhr.responseText);
                    loaded[lang] = true;
                    callback(translations[lang]);
                } catch(e) { console.error('i18n: parse error', e); }
            }
        };
        xhr.onerror = function() { console.error('i18n: load error for ' + lang); };
        xhr.send();
    }

    function getNestedValue(obj, path) {
        if (!obj || !path) return null;
        var keys = path.split('.');
        var val = obj;
        for (var i = 0; i < keys.length; i++) {
            val = val[keys[i]];
            if (val === undefined || val === null) return null;
        }
        return val;
    }

    function applyTranslations(lang) {
        var data = translations[lang];
        if (!data) return;

        // textContent replacements
        var elements = document.querySelectorAll('[data-i18n]');
        for (var i = 0; i < elements.length; i++) {
            var key = elements[i].getAttribute('data-i18n');
            var val = getNestedValue(data, key);
            if (val !== null) elements[i].textContent = val;
        }

        // innerHTML replacements (for elements containing HTML like <br>)
        var htmlElements = document.querySelectorAll('[data-i18n-html]');
        for (var j = 0; j < htmlElements.length; j++) {
            var hkey = htmlElements[j].getAttribute('data-i18n-html');
            var hval = getNestedValue(data, hkey);
            if (hval !== null) htmlElements[j].innerHTML = hval;
        }

        // placeholder replacements
        var placeholders = document.querySelectorAll('[data-i18n-placeholder]');
        for (var k = 0; k < placeholders.length; k++) {
            var pkey = placeholders[k].getAttribute('data-i18n-placeholder');
            var pval = getNestedValue(data, pkey);
            if (pval !== null) placeholders[k].placeholder = pval;
        }

        // aria-label replacements
        var ariaElements = document.querySelectorAll('[data-i18n-aria]');
        for (var l = 0; l < ariaElements.length; l++) {
            var akey = ariaElements[l].getAttribute('data-i18n-aria');
            var aval = getNestedValue(data, akey);
            if (aval !== null) ariaElements[l].setAttribute('aria-label', aval);
        }

        // Update html lang attribute
        document.documentElement.lang = lang;
        currentLang = lang;
    }

    function switchLanguage(lang) {
        localStorage.setItem('silponix-lang', lang);
        loadTranslations(lang, function() {
            applyTranslations(lang);
            updateSwitcherUI(lang);
            // Dispatch event for other scripts (eshop.js etc.)
            window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
        });
    }

    function updateSwitcherUI(lang) {
        // Update dropdown buttons
        var btns = document.querySelectorAll('.lang-btn');
        for (var i = 0; i < btns.length; i++) {
            if (btns[i].getAttribute('data-lang') === lang) {
                btns[i].classList.add('active');
            } else {
                btns[i].classList.remove('active');
            }
        }
        // Update toggle flag to show current language
        var toggleFlag = document.getElementById('langToggleFlag');
        if (toggleFlag) {
            toggleFlag.src = '/img/flags/' + lang + '.svg';
            toggleFlag.alt = lang === 'cs' ? 'CZ' : 'EN';
        }
        // Close dropdown after selection
        var switcher = document.getElementById('langSwitcher');
        if (switcher) {
            switcher.classList.remove('open');
            var toggle = document.getElementById('langToggle');
            if (toggle) toggle.setAttribute('aria-expanded', 'false');
        }
    }

    // Translation helper function for dynamic content
    function t(key) {
        var data = translations[currentLang];
        if (!data) return key;
        var val = getNestedValue(data, key);
        return val !== null ? val : key;
    }

    // Initialize dropdown toggle
    function initLangDropdown() {
        var toggle = document.getElementById('langToggle');
        var switcher = document.getElementById('langSwitcher');
        if (!toggle || !switcher) return;

        toggle.addEventListener('click', function(e) {
            e.stopPropagation();
            var isOpen = switcher.classList.toggle('open');
            toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        // Close on click outside
        document.addEventListener('click', function(e) {
            if (!switcher.contains(e.target)) {
                switcher.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });

        // Language button clicks inside dropdown
        var btns = switcher.querySelectorAll('.lang-btn');
        for (var i = 0; i < btns.length; i++) {
            btns[i].addEventListener('click', function() {
                var lang = this.getAttribute('data-lang');
                if (lang) switchLanguage(lang);
            });
        }
    }

    // Initialize
    if (currentLang !== 'cs') {
        loadTranslations(currentLang, function() {
            applyTranslations(currentLang);
            updateSwitcherUI(currentLang);
        });
    }

    // Init dropdown when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLangDropdown);
    } else {
        initLangDropdown();
    }

    // Expose global API
    window.switchLanguage = switchLanguage;
    window.t = t;
    window.getCurrentLang = function() { return currentLang; };
})();
