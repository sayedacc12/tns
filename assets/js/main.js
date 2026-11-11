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
  document.querySelectorAll('form[data-demo]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f.reportValidity()) return;
      var ok = f.querySelector('.ok'); if (ok) ok.classList.add('show');
      f.querySelectorAll('input:not([type=checkbox]),textarea').forEach(function (i) { if (!i.readOnly) i.value = ''; });
    });
  });
});

// صفحة البرامج: عرض برنامج واحد حسب الاختيار (الافتراضي: العمرة)
document.addEventListener('DOMContentLoaded', function () {
  var tabs = document.querySelector('.prog-tabs'); if (!tabs) return;
  var arts = document.querySelectorAll('article.prog'); if (!arts.length) return;
  document.documentElement.classList.add('tabs-on');
  function show(id, scroll) {
    var found = false;
    arts.forEach(function (a) { var on = a.id === id; a.classList.toggle('active', on); if (on) found = true; });
    if (!found) { id = 'umrah'; arts.forEach(function (a) { a.classList.toggle('active', a.id === id); }); }
    tabs.querySelectorAll('a').forEach(function (l) {
      var on = l.getAttribute('href') === '#' + id;
      l.classList.toggle('on', on); l.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (scroll) { var t = document.getElementById(id); if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 220, behavior: 'smooth' }); }
  }
  tabs.addEventListener('click', function (e) {
    var l = e.target.closest('a'); if (!l) return; e.preventDefault();
    var id = l.getAttribute('href').slice(1);
    history.replaceState(null, '', '#' + id); show(id, false);
  });
  window.addEventListener('hashchange', function () { show(location.hash.slice(1), true); });
  show(location.hash.slice(1) || 'umrah', !!location.hash);
});
