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
  var L = document.documentElement.lang || 'ar';
  var M = {
    ar: { hint: function (n) { return 'اكتب كلمة أو أكثر للبحث في ' + n + ' عنصرًا (صفحات وبرامج ولوائح وسياسات).'; }, count: 'عدد النتائج: ', none: 'لا توجد نتائج مطابقة، جرّب كلمة أخرى.' },
    en: { hint: function (n) { return 'Type one or more words to search ' + n + ' items (pages, programs and document titles).'; }, count: 'Results: ', none: 'No matching results. Try another word.' },
    ur: { hint: function (n) { return 'تلاش کے لیے ایک یا زیادہ الفاظ لکھیں (' + n + ' صفحات، پروگرام اور دستاویزات کے عنوانات)۔'; }, count: 'نتائج کی تعداد: ', none: 'کوئی نتیجہ نہیں ملا، کوئی اور لفظ آزمائیں۔' }
  }[L] || null;
  var first = document.querySelector('#sf button');
  var filter = first ? first.dataset.f : 'الكل', ALL = filter;
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
    if (!terms.length) { res.innerHTML = ''; cnt.textContent = M.hint(IDX.length); return; }
    var hits = [];
    IDX.forEach(function (it) {
      if (filter !== ALL && it.c !== filter) return;
      var score = 0, all = true;
      terms.forEach(function (t) {
        var inT = it._t.indexOf(t) >= 0, inX = it._x.indexOf(t) >= 0;
        if (!inT && !inX) all = false;
        score += (inT ? 10 : 0) + (inX ? 1 + (it._x.split(t).length - 2) * 0.2 : 0);
      });
      if (all) hits.push({ it: it, s: score });
    });
    hits.sort(function (a, b) { return b.s - a.s; });
    cnt.textContent = hits.length ? (M.count + hits.length) : M.none;
    res.innerHTML = hits.slice(0, 40).map(function (h) {
      var it = h.it, doc = /^(\.\.\/)?(docs|kits)\//.test(it.u) || /\/file\/[a-f0-9]{24}$/.test(it.u);
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

  // الوثائق المضافة أو المعدّلة من لوحة التحكم (صفحة الحوكمة): تحل محل قائمة الوثائق المبنية مع الموقع
  // chat-config.js loads after this file: read the platform address once the page is parsed
  function live() {
  var API = (window.TNS_API || window.TNS_CHAT_URL || '').replace(/\/+$/, '');
  if (!API || !window.fetch) return;
  var PRE = L === 'ar' ? '' : '../';
  function tx(o) { return o ? (typeof o === 'string' ? o : (o[L] || o.ar || '')) : ''; }
  function link(r) {
    if (/^f:[a-f0-9]{24}$/.test(r)) return API + '/file/' + r.slice(2);
    if (/^i:[a-f0-9]{24}$/.test(r)) return API + '/img/' + r.slice(2);
    if (/^https:\/\//.test(r) || /^[a-z-]+\.html/.test(r)) return r;
    return PRE + r;
  }
  fetch(API + '/api/search-docs').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
    if (!d || !Array.isArray(d.items)) return;
    var isDoc = function (u) { return /^(\.\.\/)?docs\//.test(u); };
    var old = {}; IDX.forEach(function (it) { if (isDoc(it.u)) old[it.u] = it.x; });
    var keep = IDX.filter(function (it) { return !isDoc(it.u); });
    d.items.forEach(function (it) {
      var u = link(it.u);
      keep.push({ t: tx(it.t), u: u, c: tx(it.c), p: '', x: (L === 'ar' ? it.x : tx(it.xt) || '') || old[u] || it.x || '' , live: true });
    });
    IDX.length = 0; keep.forEach(function (it) { it._t = norm(it.t); it._x = norm(it.x); IDX.push(it); });
    run();
  }).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', live); else live();
})();
