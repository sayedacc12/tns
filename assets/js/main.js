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
