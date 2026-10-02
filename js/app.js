/* APT Advantage landing page — vanilla, no dependencies.
   Accordions, tap-advance carousel, form validation, sticky bar,
   click-to-load video and map facades. */
(function () {
  'use strict';

  /* Popup timing — tune here, nowhere else.
     POPUP_INITIAL_DELAY_MS: first automatic open, from when this script runs (about DOM ready).
     POPUP_REOPEN_MS: after any dismissal, the popup comes back this long later.
     Both stop for good once a lead is submitted (90-day flag below). */
  var POPUP_INITIAL_DELAY_MS = 0;
  var POPUP_REOPEN_MS = 15000;

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* Storage. Every access is guarded — private mode or blocked site data
     can make even reading the property throw, and that must never break the page. */
  var openStore = function (name) {
    try {
      var s = window[name];
      s.setItem('__apt', '1');
      s.removeItem('__apt');
      return s;
    } catch (e) { return null; }
  };
  var ss = openStore('sessionStorage');
  var ls = openStore('localStorage') || ss;   /* localStorage blocked: remember for this session only */

  var session = {
    get: function (k) { try { return !!ss && ss.getItem(k) === '1'; } catch (e) { return false; } },
    set: function (k) { try { if (ss) ss.setItem(k, '1'); } catch (e) { /* ignore */ } }
  };
  var FLAG_SUBMITTED = 'apt_lead_submitted';          /* sessionStorage — second layer */

  /* "Submitted" outlives the session: a timestamp in localStorage that ages
     out after 90 days. */
  var SUBMITTED_AT = 'apt_lead_submitted_at';
  var SUBMITTED_TTL = 90 * 24 * 60 * 60 * 1000;
  var markSubmitted = function () {
    var now = String(Date.now());
    try { if (ls) ls.setItem(SUBMITTED_AT, now); }
    catch (e) { try { if (ss) ss.setItem(SUBMITTED_AT, now); } catch (e2) { /* ignore */ } }
    session.set(FLAG_SUBMITTED);
  };
  var hasSubmitted = function () {
    if (session.get(FLAG_SUBMITTED)) return true;
    var fresh = false;
    [ls, ss].forEach(function (s) {
      if (!s || fresh) return;
      try {
        var at = parseInt(s.getItem(SUBMITTED_AT), 10);
        if (!at) return;
        if (Date.now() - at < SUBMITTED_TTL) fresh = true;
        else s.removeItem(SUBMITTED_AT);
      } catch (e) { /* ignore */ }
    });
    return fresh;
  };

  /* Set by the popup controller; called on any valid submit so no popup
     timer can fire while the native POST is leaving the page. */
  var stopAutoPopup = function () {};

  /* ------------------------------------------------------- Header condense */
  var header = $('.site-header');
  if (header) {
    var condense = function () { header.classList.toggle('is-stuck', window.scrollY > 24); };
    window.addEventListener('scroll', condense, { passive: true });
    condense();
  }

  /* ---------------------------------------------------------------- Accordions
     Each button owns exactly one panel, resolved inside its own card so a
     sibling card can never be toggled by proximity. */
  $$('.acc-btn').forEach(function (btn) {
    var scope = btn.closest('.course') || btn.closest('.faq-list') || document;
    var panel = scope.querySelector('#' + CSS.escape(btn.getAttribute('aria-controls'))) ||
                document.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.setAttribute('data-open', String(!open));
      if (!open && window.dataLayer) {
        window.dataLayer.push({
          event: btn.dataset.track === 'faq' ? 'faq_open' : 'course_accordion_open',
          label: btn.dataset.label || ''
        });
      }
    });
  });

  /* ------------------------------------------------------------------ Carousel */
  var car = $('.tcar');
  if (car) {
    var track = $('.ttrack', car);
    var slides = $$('.tslide', car);
    var out = $('.tcount', car);
    var i = 0;

    var perView = function () { return window.matchMedia('(min-width: 1024px)').matches ? 2 : 1; };
    var maxIndex = function () { return Math.max(0, slides.length - perView()); };

    function render() {
      if (i > maxIndex()) i = maxIndex();
      track.style.transform = 'translateX(' + (-i * (100 / perView())) + '%)';
      if (out) out.textContent = (i + 1) + ' / ' + (maxIndex() + 1);
      slides.forEach(function (s, n) {
        var visible = n >= i && n < i + perView();
        s.setAttribute('aria-hidden', String(!visible));
        $$('a, button', s).forEach(function (el) {
          if (visible) el.removeAttribute('tabindex'); else el.setAttribute('tabindex', '-1');
        });
      });
    }
    function go(step) { i = (i + step + maxIndex() + 1) % (maxIndex() + 1); render(); }

    var prev = $('[data-car="prev"]', car);
    var next = $('[data-car="next"]', car);
    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });

    /* Swipe, and tapping the card itself advances — no auto-rotate anywhere. */
    var x0 = null;
    track.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      x0 = null;
    }, { passive: true });

    window.addEventListener('resize', render);
    render();
  }

  /* ------------------------------------------------------ Mobile country code
     India keeps its original rule (10 digits starting 6-9) and posts the bare
     10 digits exactly as before. Any other country is checked against that
     country's mobile numbering plan (libphonenumber-js, mobile metadata) and
     posts in international format, e.g. +447911123456, so the lead shows the
     country. If the library fails to load, the picker stays India-only. */
  var PHONE = window.libphonenumber || null;
  var HOME = 'IN';
  var regionName = (function () {
    try {
      var dn = new Intl.DisplayNames(['en'], { type: 'region' });
      return function (c) { try { return dn.of(c) || c; } catch (e) { return c; } };
    } catch (e) { return function (c) { return c; }; }
  })();
  var dialCode = function (c) {
    if (!PHONE) return c === HOME ? '91' : '';
    try { return PHONE.getCountryCallingCode(c); } catch (e) { return ''; }
  };
  var countryOf = function (input) {
    var field = input.closest('.field');
    var sel = field ? $('.cc-select', field) : null;
    return sel && sel.value ? sel.value : HOME;
  };

  if (PHONE) {
    var countries = PHONE.getCountries()
      .filter(function (c) { return c !== HOME && dialCode(c); })
      .map(function (c) { return { code: c, name: regionName(c) }; })
      .sort(function (a, b) { return a.name.localeCompare(b.name); });
    $$('.cc-select').forEach(function (sel) {
      countries.forEach(function (c) {
        var o = document.createElement('option');
        o.value = c.code;
        o.textContent = c.name + ' (+' + dialCode(c.code) + ')';
        sel.appendChild(o);
      });
    });
  }

  $$('.cc-select').forEach(function (sel) {
    var field = sel.closest('.field');
    var input = $('input[type="tel"]', field);
    var face = $('.prefix', field);
    sel.addEventListener('change', function () {
      var home = sel.value === HOME;
      if (face) face.textContent = '+' + dialCode(sel.value);
      if (!input) return;
      input.maxLength = home ? 10 : 15;
      if (home) { input.minLength = 10; input.setAttribute('pattern', '^[6-9]\\d{9}$'); }
      else { input.removeAttribute('minlength'); input.removeAttribute('pattern'); }
      input.value = input.value.replace(/\D/g, '').slice(0, input.maxLength);
      if (input.value || field.classList.contains('has-error')) validateControl(input);
    });
  });

  /* ----------------------------------------------------------- Form validation */
  var RULES = {
    name: {
      test: function (v) { return v.trim().length >= 2 && /^[A-Za-z][A-Za-z .'-]*$/.test(v.trim()); },
      msg: 'Enter your full name (letters only).'
    },
    mobile: {
      test: function (v, input) {
        var c = input ? countryOf(input) : HOME;
        if (c === HOME) return /^[6-9]\d{9}$/.test(v.trim());
        if (!PHONE) return /^\d{6,15}$/.test(v.trim());
        try { return PHONE.isValidPhoneNumber(v.trim(), c); } catch (e) { return false; }
      },
      msg: function (input) {
        var c = input ? countryOf(input) : HOME;
        return c === HOME
          ? 'Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.'
          : 'Enter a valid ' + regionName(c) + ' mobile number.';
      }
    },
    age: {
      test: function (v) { var n = Number(v); return /^\d{1,2}$/.test(v.trim()) && n >= 17 && n <= 25; },
      msg: 'Enter an age between 17 and 25.'
    },
    email: {
      test: function (v) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim()); },
      msg: 'Enter a valid email address, for example name@gmail.com.'
    },
    qualification: {
      test: function (v) { return v !== ''; },
      msg: 'Choose your qualification.'
    }
  };

  function setError(field, message) {
    field.classList.add('has-error');
    var msg = $('.field-msg', field);
    if (msg) {
      var text = $('.msg-text', msg);
      if (text) text.textContent = message;
    }
    var input = $('input, select:not(.cc-select)', field);
    if (input) input.setAttribute('aria-invalid', 'true');
  }

  function clearError(field) {
    field.classList.remove('has-error');
    var input = $('input, select:not(.cc-select)', field);
    if (input) input.removeAttribute('aria-invalid');
  }

  function validateControl(input) {
    var field = input.closest('.field');
    if (!field) return true;
    var rule = RULES[input.name];
    if (!rule) return true;
    if (rule.test(input.value, input)) { clearError(field); return true; }
    setError(field, typeof rule.msg === 'function' ? rule.msg(input) : rule.msg);
    return false;
  }

  $$('form[data-lead-form]').forEach(function (form) {
    var controls = $$('.field input, .field select', form);

    controls.forEach(function (input) {
      /* Digits only where the backend expects digits only. */
      if (input.name === 'mobile' || input.name === 'age') {
        input.addEventListener('input', function () {
          var max = input.name === 'mobile' ? (input.maxLength > 0 ? input.maxLength : 10) : 2;
          var clean = input.value.replace(/\D/g, '').slice(0, max);
          if (clean !== input.value) input.value = clean;
        });
      }
      input.addEventListener('blur', function () { validateControl(input); });
      input.addEventListener('input', function () {
        var field = input.closest('.field');
        if (field && field.classList.contains('has-error')) validateControl(input);
      });
      if (input.tagName === 'SELECT') {
        input.addEventListener('change', function () { validateControl(input); });
      }
    });

    var consentBox = $('input[name="consent"]', form);
    var consentWrap = consentBox ? consentBox.closest('.consent') : null;
    if (consentBox && consentWrap) {
      consentBox.addEventListener('change', function () {
        if (consentBox.checked) consentWrap.classList.remove('has-error');
      });
    }

    form.addEventListener('submit', function (e) {
      /* Resolve everything from the form that fired — three forms share the
         same field names, so nothing here may reach outside this one. */
      var form = e.currentTarget.closest('form');
      var controls = $$('.field input, .field select', form);
      var consentBox = $('input[name="consent"]', form);
      var consentWrap = consentBox ? consentBox.closest('.consent') : null;

      if (form.dataset.submitting === '1') { e.preventDefault(); return; }

      var firstBad = null;
      controls.forEach(function (input) {
        if (!validateControl(input) && !firstBad) firstBad = input;
      });
      if (consentBox && !consentBox.checked) {
        consentWrap.classList.add('has-error');
        if (!firstBad) firstBad = consentBox;
      }

      if (firstBad) {
        e.preventDefault();
        firstBad.focus({ preventScroll: true });
        firstBad.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }

      /* Non-India numbers go out in international format (+447911123456);
         India still posts the bare 10 digits. */
      var tel = $('input[name="mobile"]', form);
      if (tel && PHONE && countryOf(tel) !== HOME) {
        try { tel.value = PHONE.parsePhoneNumber(tel.value.trim(), countryOf(tel)).number; } catch (e2) { /* keep as typed */ }
      }

      /* Valid. Record it now — the handler redirects server-side, so no
         script on this page runs after the POST leaves. */
      markSubmitted();
      stopAutoPopup();

      /* Valid — show the loading state and let the native POST proceed.
         The button is never disabled, so name="submit" stays in the payload. */
      form.dataset.submitting = '1';
      var btn = $('button[type="submit"]', form);
      if (btn) {
        btn.setAttribute('aria-busy', 'true');
        var label = $('.btn-label', btn);
        if (label) label.textContent = 'Sending…';
        var sp = document.createElement('span');
        sp.className = 'spinner';
        btn.insertBefore(sp, btn.firstChild);
      }
      if (window.dataLayer) {
        window.dataLayer.push({ event: 'lead_form_submit', form: form.dataset.leadForm });
        if (form.dataset.leadForm === 'popup') window.dataLayer.push({ event: 'popup_submit' });
      }
    });
  });

  /* --------------------------------------------------------- Sticky mobile bar */
  var mbar = $('.mbar');
  if (mbar) {
    document.body.classList.add('has-mbar');
    var show = function () {
      var on = window.scrollY > 400;
      mbar.classList.toggle('is-visible', on);
      document.body.classList.toggle('mbar-on', on);   /* lifts the call FAB */
    };
    window.addEventListener('scroll', show, { passive: true });
    show();
    /* Get out of the way while someone is typing. */
    document.addEventListener('focusin', function (e) {
      if (e.target.closest('form[data-lead-form]')) {
        mbar.classList.remove('is-visible');
        document.body.classList.remove('mbar-on');
      }
    });
    document.addEventListener('focusout', function () { setTimeout(show, 120); });
  }

  /* ------------------------------------------------ Call button vs lead forms
     The FAB tucks away whenever its box would overlap the hero or CTA form
     card, so it never covers an input, a typed value or an error message.
     Measured from the FAB's real position, so it follows the sticky-bar lift. */
  var fab = $('.fab-call');
  var fabForms = $$('form[data-lead-form="hero"], form[data-lead-form="cta-band"]').map(function (f) {
    return f.closest('.form-card') || f;
  });
  if (fab && fabForms.length) {
    var fabQueued = false;
    var fabCheck = function () {
      fabQueued = false;
      /* Layout box, not getBoundingClientRect: the tucked state is scaled
         down, and measuring that would make the button flicker at an edge. */
      var b = { left: fab.offsetLeft, top: fab.offsetTop };
      b.right = b.left + fab.offsetWidth;
      b.bottom = b.top + fab.offsetHeight;
      var pad = 8;
      var over = fabForms.some(function (card) {
        var r = card.getBoundingClientRect();
        return r.left < b.right + pad && r.right > b.left - pad && r.top < b.bottom + pad && r.bottom > b.top - pad;
      });
      fab.classList.toggle('is-tucked', over);
    };
    var fabSchedule = function () {
      if (fabQueued) return;
      fabQueued = true;
      requestAnimationFrame(fabCheck);
    };
    ['scroll', 'resize'].forEach(function (t) { window.addEventListener(t, fabSchedule, { passive: true }); });
    ['focusin', 'focusout'].forEach(function (t) { document.addEventListener(t, function () { setTimeout(fabSchedule, 140); }); });
    fab.addEventListener('transitionend', fabSchedule);     /* after the sticky-bar lift settles */
    fabCheck();
  }

  /* -------------------------------------------------- Video facade → modal */
  var modal = $('.vmodal');
  var frame = modal ? $('.vmodal-frame', modal) : null;
  var lastFocus = null;

  function closeVideo() {
    if (!modal) return;
    modal.classList.remove('is-open');
    if (frame) frame.innerHTML = '';
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  $$('.vfacade').forEach(function (fac) {
    fac.addEventListener('click', function () {
      var id = fac.dataset.video;
      if (!id || !modal || !frame) return;
      lastFocus = fac;
      frame.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) +
        '?autoplay=1&rel=0&playsinline=1" title="Student testimonial video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      var close = $('.vmodal-close', modal);
      if (close) close.focus();
      if (window.dataLayer) window.dataLayer.push({ event: 'video_play', label: id });
    });
  });

  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.closest('.vmodal-close')) closeVideo();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeVideo();
    });
  }

  /* ------------------------------------------------------------- Map facade */
  var map = $('.map-facade');
  if (map) {
    map.addEventListener('click', function () {
      if (map.classList.contains('is-loaded')) return;
      map.classList.add('is-loaded');
      map.innerHTML = '<iframe src="' + map.dataset.map + '" title="APT Advantage on Google Maps" ' +
        'loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>';
    });
  }

  /* --------------------------------------------------------- Popup lead form
     Opens by itself POPUP_INITIAL_DELAY_MS after load on every visit, and
     again POPUP_REOPEN_MS after every dismissal, indefinitely, until a lead
     is submitted (90-day flag). The Enquire buttons open it on demand.
     Exactly one timer exists at any moment: every open clears it, every
     dismissal clears it before setting the next, and a submit clears it. */
  var pop = $('#popup-lead');
  if (pop) {
    var card = $('.pmodal-card', pop);
    var firstField = $('#pf-name', pop);
    var returnTo = null;
    var downOnBackdrop = false;

    var trackEvent = function (event, extra) {
      if (!window.dataLayer) return;
      var payload = { event: event };
      for (var k in extra) payload[k] = extra[k];
      window.dataLayer.push(payload);
    };
    var isOpen = function () { return !pop.hidden; };

    var autoTimer = null;
    var clearAuto = function () {
      if (autoTimer !== null) { clearTimeout(autoTimer); autoTimer = null; }
    };
    var scheduleAuto = function (ms) {
      clearAuto();
      if (hasSubmitted()) return;
      autoTimer = setTimeout(function () {
        autoTimer = null;
        if (hasSubmitted() || isOpen()) return;
        openPopup('auto', null);
      }, ms);
    };
    stopAutoPopup = clearAuto;

    var openPopup = function (source, trigger) {
      if (isOpen()) return;
      clearAuto();                       /* a manual open resets the clock */
      returnTo = trigger || (document.activeElement !== document.body ? document.activeElement : null);
      pop.hidden = false;
      pop.classList.add('is-open');
      pop.setAttribute('data-popup-state', 'open');
      pop.setAttribute('data-popup-source', source);
      document.body.style.overflow = 'hidden';
      if (firstField) firstField.focus({ preventScroll: true });
      trackEvent('popup_open', { trigger: source });
    };

    var closePopup = function (method) {
      if (!isOpen()) return;
      pop.classList.remove('is-open');
      pop.hidden = true;
      pop.setAttribute('data-popup-state', 'closed');
      pop.setAttribute('data-popup-dismiss', method);
      document.body.style.overflow = '';
      if (returnTo && document.contains(returnTo)) returnTo.focus({ preventScroll: true });
      returnTo = null;
      trackEvent('popup_dismiss', { method: method });
      scheduleAuto(POPUP_REOPEN_MS);
    };

    /* Manual triggers — the visitor asked, so no suppression applies. */
    $$('[data-popup-open]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        openPopup(el.dataset.location || 'button', el);
      });
    });

    /* Dismiss: close button, ESC, backdrop. A drag that starts inside the
       card and ends on the backdrop is not a backdrop click. */
    $('.pmodal-close', pop).addEventListener('click', function () { closePopup('button'); });
    pop.addEventListener('mousedown', function (e) { downOnBackdrop = e.target === pop; });
    pop.addEventListener('click', function (e) {
      if (e.target === pop && downOnBackdrop) closePopup('backdrop');
      downOnBackdrop = false;
    });

    /* Focus trap. */
    document.addEventListener('keydown', function (e) {
      if (!isOpen()) return;
      if (e.key === 'Escape') { e.preventDefault(); closePopup('esc'); return; }
      if (e.key !== 'Tab') return;
      var items = $$('a[href], button, input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])', card)
        .filter(function (el) { return !el.disabled && el.offsetParent !== null; });
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (!card.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    /* ---- Automatic trigger ---- */
    scheduleAuto(POPUP_INITIAL_DELAY_MS);
  }

  /* ------------------------------------------- Smooth scroll to the hero form */
  $$('[data-scroll-to]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      var target = document.getElementById(el.dataset.scrollTo);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      var first = $('input, select', target);
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 420);
    });
  });
})();
