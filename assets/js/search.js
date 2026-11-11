// البحث في الموقع والوثائق (يعمل في المتصفح دون خادم)
(function () {
  var IDX = window.SEARCH_INDEX || [];
  function norm(s) {
    return (s || '').replace(/[ً-ٰٟـ]/g, '')
      .replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .toLowerCase();
  }
  IDX.forEach(function (it) { it._t = norm(it.t); it._x = norm(it.x); });
  var q = document.getElementById('sq'), res = document.getElementById('sres'), cnt = document.getElementById('scount');
  var filter = 'الكل';
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function snippet(it, terms) {
    var raw = it.x, n = norm(raw), pos = -1;
    terms.forEach(function (t) { var p = n.indexOf(t); if (p >= 0 && (pos < 0 || p < pos)) pos = p; });
    if (pos < 0) return esc(raw.slice(0, 180)) + '…';
    var start = Math.max(0, pos - 80), out = raw.slice(start, start + 220);
    var html = esc(out);
    terms.forEach(function (t) {
      // تمييز تقريبي للكلمة كما وردت في النص
      var nOut = norm(out), p = nOut.indexOf(t);
      if (p >= 0) { var w = out.substr(p, t.length); html = html.split(esc(w)).join('<mark>' + esc(w) + '</mark>'); }
    });
    return (start > 0 ? '…' : '') + html + '…';
  }
  function run() {
    var v = norm(q.value.trim());
    var terms = v.split(/\s+/).filter(function (t) { return t.length > 1; });
    if (!terms.length) { res.innerHTML = ''; cnt.textContent = 'اكتب كلمة أو أكثر للبحث في ' + IDX.length + ' عنصرًا (صفحات وبرامج ولوائح وسياسات).'; return; }
    var hits = [];
    IDX.forEach(function (it) {
      if (filter !== 'الكل' && it.c !== filter) return;
      var score = 0, all = true;
      terms.forEach(function (t) {
        var inT = it._t.indexOf(t) >= 0, inX = it._x.indexOf(t) >= 0;
        if (!inT && !inX) all = false;
        score += (inT ? 10 : 0) + (inX ? 1 + (it._x.split(t).length - 2) * 0.2 : 0);
      });
      if (all) hits.push({ it: it, s: score });
    });
    hits.sort(function (a, b) { return b.s - a.s; });
    cnt.textContent = hits.length ? ('عدد النتائج: ' + hits.length) : 'لا توجد نتائج مطابقة، جرّب كلمة أخرى.';
    res.innerHTML = hits.slice(0, 40).map(function (h) {
      var it = h.it, doc = it.u.indexOf('docs/') === 0;
      return '<a class="sr" href="' + encodeURI(it.u) + '"' + (doc ? ' target="_blank"' : '') + '>' +
        '<span class="sr-cat">' + esc(it.c) + (doc ? ' · PDF' : ' · ' + esc(it.p)) + '</span>' +
        '<b>' + esc(it.t) + '</b><span class="sr-x">' + snippet(it, terms) + '</span></a>';
    }).join('');
  }
  document.getElementById('sf').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return; filter = b.dataset.f; setTimeout(run, 0);
  });
  q.addEventListener('input', run);
  var init = new URLSearchParams(location.search).get('q'); if (init) q.value = init;
  run();
})();
