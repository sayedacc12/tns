// قائمة الجوال
document.addEventListener('DOMContentLoaded', function () {
  var btn = document.querySelector('.menu-btn'), nav = document.querySelector('nav.main');
  if (btn && nav) btn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // أزرار اختيار المبلغ ونوع الدعم
  document.querySelectorAll('.chips').forEach(function (g) {
    g.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      e.preventDefault();
      g.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      var target = g.dataset.target && document.getElementById(g.dataset.target);
      if (target && b.dataset.v) target.value = b.dataset.v;
    });
  });

  // النماذج: نموذج عرض فقط إلى أن يُربط الموقع بنظام الجمعية بعد الترخيص
  document.addEventListener('change', function (e) {
    var g = e.target.closest('[data-min-one]'); if (g && g.querySelector('input:checked')) g.parentNode.classList.remove('invalid');
  });
  document.querySelectorAll('form[data-demo]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      f.querySelectorAll('[data-min-one]').forEach(function (g) {
        var ok = g.querySelector('input:checked'); g.parentNode.classList.toggle('invalid', !ok); if (!ok && !bad) bad = g;
      });
      if (bad) { bad.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      if (!f.reportValidity()) return;
      var ok = f.querySelector('.ok'); if (ok) ok.classList.add('show');
      f.querySelectorAll('input:not([type=checkbox]):not([type=radio]),textarea').forEach(function (i) { if (!i.readOnly) i.value = ''; }); if (ok) ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
});

// صفحة البرامج: عرض برنامج واحد حسب الاختيار (الافتراضي: أول برنامج). تُستدعى من جديد بعد تحميل البرامج من المنصة.
(function () {
  var bound = false;
  function first() { var a = document.querySelector('article.prog'); return a ? a.id : ''; }
  function show(id, scroll) {
    var tabs = document.querySelector('.prog-tabs'), arts = document.querySelectorAll('article.prog');
    if (!tabs || !arts.length) return;
    if (!document.getElementById(id) || !document.getElementById(id).matches('article.prog')) id = first();
    arts.forEach(function (a) { a.classList.toggle('active', a.id === id); });
    tabs.querySelectorAll('a').forEach(function (l) {
      var on = l.getAttribute('href') === '#' + id;
      l.classList.toggle('on', on); l.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (scroll) { var t = document.getElementById(id); if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 220, behavior: 'smooth' }); }
  }
  function init() {
    var tabs = document.querySelector('.prog-tabs'); if (!tabs || !document.querySelector('article.prog')) return;
    document.documentElement.classList.add('tabs-on');
    if (!bound) {
      bound = true;
      tabs.addEventListener('click', function (e) {
        var l = e.target.closest('a'); if (!l) return; e.preventDefault();
        var id = l.getAttribute('href').slice(1);
        history.replaceState(null, '', '#' + id); show(id, false);
      });
      window.addEventListener('hashchange', function () { show(location.hash.slice(1), true); });
    }
    show(location.hash.slice(1), false);
  }
  window.TNS_initProgTabs = init;
  document.addEventListener('DOMContentLoaded', function () { init(); if (location.hash) show(location.hash.slice(1), true); });
})();
// قائمة اللغات: إغلاق عند النقر خارجها
document.addEventListener('click', function (e) {
  document.querySelectorAll('details.langs[open]').forEach(function (d) { if (!d.contains(e.target)) d.removeAttribute('open'); });
});
// حقول الجوال: أرقام فقط بصيغة الجوال السعودي 05xxxxxxxx (تحويل الأرقام العربية والفارسية تلقائيًا)
(function () {
  var MSG = {
    ar: 'أدخل رقم جوال سعودي صحيحًا من 10 أرقام يبدأ بـ 05، مثل 0512345678.',
    en: 'Enter a valid Saudi mobile number: 10 digits starting with 05, e.g. 0512345678.',
    ur: 'درست سعودی موبائل نمبر درج کریں: 05 سے شروع ہونے والے 10 ہندسے، مثلاً 0512345678۔'
  }[document.documentElement.lang] || '';
  function norm(v) {
    return v.replace(/[٠-٩]/g, function (d) { return d.charCodeAt(0) - 1632; })
            .replace(/[۰-۹]/g, function (d) { return d.charCodeAt(0) - 1776; })
            .replace(/\D/g, '').slice(0, 10);
  }
  function check(el) {
    var v = el.value;
    el.setCustomValidity(v && !/^05[0-9]{8}$/.test(v) ? MSG : '');
  }
  document.querySelectorAll('input[data-sa-mobile]').forEach(function (el) {
    el.addEventListener('input', function () {
      var n = norm(el.value);
      if (n !== el.value) el.value = n;
      check(el);
    });
    el.addEventListener('keydown', function (e) {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !/[0-9٠-٩۰-۹]/.test(e.key)) e.preventDefault();
    });
    el.addEventListener('blur', function () { check(el); });
    check(el);
  });
})();
