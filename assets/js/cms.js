// المحتوى الديناميكي من منصة الجمعية: الشريط الإخباري، أخبار الرئيسية، صفحة الأخبار، البرامج والمشاريع.
// يبقى المحتوى الثابت المكتوب في الصفحة إذا تعذّر الاتصال بالمنصة.
(function () {
  var L = document.documentElement.lang || 'ar';
  var PRE = L === 'ar' ? '' : '../';
  var API = (window.TNS_API || window.TNS_CHAT_URL || '').replace(/\/+$/, '');
  var T = {
    ar: { more: 'اقرأ الخبر', back: 'العودة إلى الأخبار', none: 'لا توجد أخبار منشورة حاليًا.', when: 'التوقيت', kitBtn: 'الحقيبة التعريفية (PDF)',
          about: 'عن البرنامج', aud: 'المستفيدون', svc: 'ما يقدمه البرنامج', kitDl: 'تنزيل الحقيبة التعريفية للبرنامج', nf: 'لم يُعثر على الخبر.' },
    en: { more: 'Read more', back: 'Back to news', none: 'No news has been published yet.', when: 'Timing', kitBtn: 'Introductory kit (PDF, Arabic)',
          about: 'About the program', aud: 'Beneficiaries', svc: 'What the program provides', kitDl: 'Download the program’s introductory kit (Arabic)', nf: 'News item not found.' },
    ur: { more: 'مزید پڑھیں', back: 'خبروں پر واپس جائیں', none: 'ابھی کوئی خبر شائع نہیں ہوئی۔', when: 'اوقات', kitBtn: 'تعارفی کتابچہ (PDF، عربی)',
          about: 'پروگرام کے بارے میں', aud: 'مستفیدین', svc: 'پروگرام کیا فراہم کرتا ہے', kitDl: 'پروگرام کا تعارفی کتابچہ ڈاؤن لوڈ کریں (عربی)', nf: 'خبر نہیں ملی۔' }
  }[L] || {};
  var SCENES = ['haram', 'arafat', 'mina', 'nabawi', 'path', 'skyline'];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function tx(o) { return o ? (o[L] || o.ar || '') : ''; }
  function icon(name, size, color, sw) {
    var I = window.TNS_ICONS || {};
    return '<svg width="' + (size || 28) + '" height="' + (size || 28) + '" viewBox="0 0 24 24" fill="none" stroke="' + (color || '#0D4842') + '" stroke-width="' + (sw || 1.7) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (I[name] || I.check || '') + '</svg>';
  }
  function imgUrl(item, i) {
    if (item.image) return API + '/img/' + item.image;
    return PRE + 'assets/img/scenes/' + (item.scene || SCENES[(i || 0) % SCENES.length]) + '.svg';
  }
  function kitUrl(k) { return !k ? '' : /^https:/.test(k) ? k : PRE + k; }

  // التاريخ: هجري وميلادي
  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso + 'T12:00:00Z');
    try {
      if (L === 'ar') {
        var h = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d).replace(/\s?هـ$/, '');
        var g = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
        return h + 'هـ · ' + g + 'م';
      }
      return new Intl.DateTimeFormat(L === 'ur' ? 'ur-PK' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
    } catch (e) { return iso; }
  }
  function fillDates(root) { (root || document).querySelectorAll('time[datetime]').forEach(function (t) { if (!t.textContent) t.textContent = fmtDate(t.getAttribute('datetime')); }); }

  function card(n, i) {
    var u = 'news.html?id=' + encodeURIComponent(n.id);
    return '<article class="ncard" data-id="' + esc(n.id) + '"><a class="nimg" href="' + u + '" style="background-image:url(\'' + esc(imgUrl(n, i)) + '\')" aria-hidden="true" tabindex="-1"></a>' +
      '<div class="nb"><time datetime="' + esc(n.date) + '">' + esc(fmtDate(n.date)) + '</time><h3><a href="' + u + '">' + esc(tx(n.title)) + '</a></h3>' +
      '<p>' + esc(tx(n.summary)) + '</p><a class="more" href="' + u + '">' + T.more + ' ' + icon('arrow', 18) + '</a></div></article>';
  }
  function paras(s) { return String(s || '').split(/\n\s*\n|\n/).filter(function (x) { return x.trim(); }).map(function (x) { return '<p>' + esc(x.trim()) + '</p>'; }).join(''); }

  // الشريط الإخباري: حركة مستمرة، تتوقف عند المرور بالمؤشر
  function ticker(items) {
    var tr = document.getElementById('ticker'); if (!tr) return;
    if (items) tr.innerHTML = items.map(function (n) { return '<a href="' + PRE + (L === 'ar' ? '' : L + '/') + 'news.html?id=' + encodeURIComponent(n.id) + '">' + esc(tx(n.title)) + '</a>'; }).join('');
    var bar = tr.closest('.ticker');
    if (!tr.children.length) { if (bar) bar.hidden = true; return; }
    if (bar) bar.hidden = false;
    tr.classList.remove('run');
    tr.querySelectorAll('.dup').forEach(function (x) { x.remove(); });
    var base = Array.prototype.slice.call(tr.children), w = 0;
    base.forEach(function (a) { w += a.offsetWidth; });
    if (!w) return;
    var need = tr.parentNode.clientWidth + w, guard = 0;
    while (tr.scrollWidth < need && guard++ < 30) base.forEach(function (a) { var c = a.cloneNode(true); c.classList.add('dup'); c.setAttribute('aria-hidden', 'true'); c.tabIndex = -1; tr.appendChild(c); });
    tr.style.setProperty('--tk-shift', (document.documentElement.dir === 'ltr' ? -w : w) + 'px');
    tr.style.setProperty('--tk-dur', Math.max(16, w / 50) + 's');
    tr.classList.add('run');
  }

  function renderNews(news) {
    var home = document.getElementById('news-home');
    if (home) home.innerHTML = news.length ? news.slice(0, +home.dataset.limit || 3).map(card).join('') : '<p class="muted">' + T.none + '</p>';
    var list = document.getElementById('news-list');
    if (list) list.innerHTML = news.length ? news.map(card).join('') : '<p class="muted">' + T.none + '</p>';
  }
  function showItem(news) {
    var box = document.getElementById('news-item'), list = document.getElementById('news-list');
    if (!box || !list) return;
    var id = new URLSearchParams(location.search).get('id'); if (!id) return;
    var n = null;
    news.forEach(function (x) { if (x.id === id) n = x; });
    if (!n) { // بدون منصة: من النسخة الثابتة في الصفحة
      var a = list.querySelector('[data-id="' + CSS.escape(id) + '"]');
      if (a) n = { id: id, date: a.querySelector('time').getAttribute('datetime'), title: { ar: a.querySelector('h3').textContent }, html: a.querySelector('.nbody').innerHTML, img: a.querySelector('.nimg').style.backgroundImage };
    }
    list.hidden = true; box.hidden = false;
    if (!n) { box.innerHTML = '<p class="muted">' + T.nf + '</p><p><a class="btn btn-outline" href="news.html">' + T.back + '</a></p>'; return; }
    var img = n.img || "url('" + esc(imgUrl(n, news.indexOf(n))) + "')";
    box.innerHTML = '<div class="nf-img" style="background-image:' + img + '"></div><time datetime="' + esc(n.date) + '">' + esc(fmtDate(n.date)) + '</time>' +
      '<h2>' + esc(tx(n.title)) + '</h2>' + (n.html || ((n.summary && tx(n.summary) ? '<p class="lead-p">' + esc(tx(n.summary)) + '</p>' : '') + paras(tx(n.body)))) +
      '<p style="margin-top:28px"><a class="btn btn-outline" href="news.html">' + T.back + '</a></p>';
    document.title = tx(n.title) + ' | ' + document.title.split('|').pop().trim();
  }

  function renderProjects(ps) {
    var foot = document.getElementById('foot-progs');
    if (foot) foot.innerHTML = ps.map(function (p) { return '<li><a href="' + PRE + (L === 'ar' ? '' : L + '/') + 'programs.html#' + esc(p.id) + '">' + esc(tx(p.name)) + '</a></li>'; }).join('');
    var wrap = document.getElementById('prog-list'), tabs = document.getElementById('prog-tabs');
    if (!wrap || !tabs || !ps.length) return;
    tabs.innerHTML = ps.map(function (p) { return '<a href="#' + esc(p.id) + '">' + esc(tx(p.name)) + '</a>'; }).join('');
    wrap.innerHTML = ps.map(function (p, i) {
      var kit = kitUrl(p.kit);
      var svc = (p.services || []).map(function (s) { return '<div><b>' + icon(s.icon, 20) + esc(tx(s.title)) + '</b><span>' + esc(tx(s.text)) + '</span></div>'; }).join('');
      var pts = tx(p.points).split('\n').filter(function (x) { return x.trim(); });
      var tags = tx(p.tags).split(/\s+/).filter(Boolean);
      var mkt = (tx(p.slogan) || pts.length || tags.length || kit) ? '<div class="mkt">' + (tx(p.slogan) ? '<div class="slogan">«' + esc(tx(p.slogan)) + '»</div>' : '') +
        (pts.length ? '<ul class="ticks">' + pts.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
        (tags.length ? '<div class="tags">' + tags.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join(' ') + '</div>' : '') +
        (kit ? '<a class="kit-link" href="' + esc(kit) + '" target="_blank" rel="noopener">' + icon('clip', 16, '#C49A45') + ' ' + T.kitDl + '</a>' : '') + '</div>' : '';
      return '<article class="prog" id="' + esc(p.id) + '"><aside><div class="thumb" style="background-image:url(\'' + esc(imgUrl(p, i)) + '\')"></div><div class="ico">' + icon(p.icon, 30, '#C49A45') + '</div>' +
        '<h3>' + esc(tx(p.name)) + '</h3><div class="tag">' + esc(tx(p.tag)) + '</div>' +
        (tx(p.when) ? '<div class="meta"><div><span>' + T.when + '</span><b style="font-weight:normal">' + esc(tx(p.when)) + '</b></div></div>' : '') +
        (kit ? '<a class="btn btn-gold" style="margin-top:22px;width:calc(100% - 60px);justify-content:center" href="' + esc(kit) + '" target="_blank" rel="noopener">' + icon('clip', 18, '#fff', 2) + ' ' + T.kitBtn + '</a>' : '') +
        '</aside><div class="body"><h4 style="margin-top:0">' + T.about + '</h4><div style="font-size:18px">' + paras(tx(p.about) || tx(p.summary)) + '</div>' +
        (tx(p.audience) ? '<h4>' + T.aud + '</h4><p>' + esc(tx(p.audience)) + '</p>' : '') +
        (svc ? '<h4>' + T.svc + '</h4><div class="svc">' + svc + '</div>' : '') + mkt + '</div></article>';
    }).join('');
    if (window.TNS_initProgTabs) window.TNS_initProgTabs();
  }

  // ---------- الحوكمة والشفافية: تُرسم من بيانات لوحة التحكم (نفس هيكل الصفحة الثابتة في build_site.py) ----------
  function gref(r) {
    r = r || '';
    if (/^i:[a-f0-9]{24}$/.test(r)) return API + '/img/' + r.slice(2);
    if (/^f:[a-f0-9]{24}$/.test(r)) return API + '/file/' + r.slice(2);
    if (/^https:\/\//.test(r) || /^[a-z-]+\.html/.test(r)) return r; // a page link stays in the visitor's language
    return PRE + r;
  }
  function secHead(k, t, l, center) {
    return '<div class="sec-head' + (center ? ' center' : '') + '"><div class="kick">' + esc(k) + '</div><h2>' + esc(t) + '</h2>' + (l ? '<p>' + esc(l) + '</p>' : '') + '</div>';
  }
  function fileLink(ref, label, cls) {
    return '<a class="' + (cls || 'gold') + '" href="' + esc(gref(ref)) + '" target="_blank" rel="noopener">' + icon('clip', 16, '#C49A45') + ' ' + esc(label) + '</a>';
  }
  var GOV = {
    board: function (b) {
      var leaders = (b.leaders || []).map(function (x) {
        return '<div class="card leader"><div class="av">' + (x.photo ? '<img src="' + esc(gref(x.photo)) + '" alt="">' : icon('users', 34, '#C49A45')) + '</div><div class="role">' + esc(tx(x.role)) + '</div><h3>' + esc(tx(x.name)) + '</h3></div>';
      }).join('');
      var rows = (b.rows || []).map(function (r) { return '<tr><td>' + esc(tx(r.k)) + '</td><td>' + esc(tx(r.v)) + '</td></tr>'; }).join('');
      return secHead(tx(b.kick), tx(b.title), tx(b.lead), true) + '<div class="grid g3">' + leaders + '</div>' +
        (rows ? '<table style="margin-top:34px"><tr><th style="width:36%">' + esc(tx(b.thK)) + '</th><th>' + esc(tx(b.thV)) + '</th></tr>' + rows + '</table>' : '');
    },
    structure: function (s) {
      var chart;
      if (s.image) chart = '<figure class="org-img"><img src="' + esc(gref(s.image)) + '" alt="' + esc(tx(s.title)) + '"></figure>';
      else {
        var com = (s.committees || []).map(function (c) { return '<div class="org-n soft">' + esc(tx(c.name)) + '</div>'; }).join('');
        var units = (s.units || []).map(function (u) { return '<div class="org-n soft">' + esc(tx(u.name)) + '</div>'; }).join('');
        chart = '<div class="org">' + (tx(s.assembly) ? '<div class="org-n gold">' + esc(tx(s.assembly)) + '</div><i class="org-v"></i>' : '') +
          '<div class="org-mid"><span></span><div class="org-n main">' + esc(tx(s.board)) + '</div>' +
          (com ? '<div class="org-side"><span class="org-cap">' + esc(tx(s.committeesLabel)) + '</span><div class="org-row">' + com + '</div></div>' : '<span></span>') + '</div>' +
          (tx(s.ceo) ? '<i class="org-v"></i><div class="org-n dark">' + esc(tx(s.ceo)) + '</div>' : '') +
          (units ? '<i class="org-v"></i><div class="org-units">' + units + '</div>' : '') + '</div>';
      }
      return secHead(tx(s.kick), tx(s.title), tx(s.lead), true) + chart +
        (s.file ? '<p class="center" style="margin-top:22px"><a class="btn btn-outline" href="' + esc(gref(s.file)) + '" target="_blank" rel="noopener">' + icon('clip', 18) + ' ' + esc(tx(s.fileLabel)) + '</a></p>' : '') +
        (tx(s.note) ? '<p class="muted center">' + esc(tx(s.note)) + '</p>' : '');
    },
    disclose: function (d) {
      var cards = (d.items || []).map(function (x) {
        return '<div class="card" id="' + esc(x.id) + '"><div class="ico">' + icon(x.icon) + '</div><h3>' + esc(tx(x.title)) + '</h3><p>' + esc(tx(x.text)) + '</p><div class="gmeta">' +
          (tx(x.status) ? '<span class="pill">' + esc(tx(x.status)) + '</span>' : '') + (x.file ? fileLink(x.file, tx(d.fileLabel)) : '') + '</div></div>';
      }).join('');
      return secHead(tx(d.kick), tx(d.title), tx(d.lead), true) + '<div class="grid g3">' + cards + '</div>';
    },
    docs: function (dc) {
      var html = secHead(tx(dc.kick), tx(dc.title), tx(dc.lead));
      (dc.groups || []).forEach(function (g, i) {
        var rows = (g.items || []).map(function (x) {
          return '<tr><td style="width:90px">' + esc(tx(x.code)) + '</td><td>' + esc(tx(x.name)) + '</td><td style="width:130px">' + (x.file ? fileLink(x.file, tx(dc.view)) : '') + '</td></tr>';
        }).join('');
        html += '<h3 style="margin-top:' + (i ? 40 : 10) + 'px">' + esc(tx(g.title)) + '</h3><table><tr><th>' + esc(tx(dc.thCode)) + '</th><th>' + esc(tx(dc.thName)) + '</th><th>' + esc(tx(dc.thFile)) + '</th></tr>' + rows + '</table>';
      });
      if (tx(dc.note)) html += '<p class="muted" style="margin-top:16px">' + esc(tx(dc.note)) + '</p>';
      return html;
    }
  };
  function renderGov(g) {
    if (!g || !document.querySelector('[data-gov]')) return;
    var hero = document.querySelector('.page-hero');
    if (hero && g.hero) {
      if (tx(g.hero.title)) { hero.querySelector('h1').textContent = tx(g.hero.title); }
      var hp = hero.querySelector('p'); if (hp) hp.textContent = tx(g.hero.lead);
    }
    document.querySelectorAll('[data-gov]').forEach(function (sec) {
      var k = sec.getAttribute('data-gov'), d = g[k]; if (!d) return;
      sec.hidden = d.show === false;
      var w = sec.querySelector('.wrap');
      if (GOV[k]) { w.innerHTML = GOV[k](d); return; }
      if (k === 'satisfaction') {
        var t = sec.querySelector('[data-gt]'), p = sec.querySelector('[data-gp]');
        if (t) t.textContent = tx(d.title); if (p) p.textContent = tx(d.text);
      }
      if (k === 'band') {
        sec.querySelector('h2').textContent = tx(d.title); sec.querySelector('.band p').textContent = tx(d.text);
        sec.querySelector('.cta').innerHTML = (d.buttons || []).map(function (x, i) { return '<a class="btn ' + (i ? 'btn-ghost' : 'btn-gold') + '" href="' + esc(gref(x.href)) + '">' + esc(tx(x.label)) + '</a>'; }).join('');
      }
    });
    if (location.hash) { var el = document.getElementById(location.hash.slice(1)); if (el && !window.__govScrolled) { window.__govScrolled = 1; el.scrollIntoView(); } }
  }

  function apply(d) {
    var news = d.news || [];
    renderNews(news); showItem(news);
    ticker(news.filter(function (n) { return n.ticker !== false; }).slice(0, 10));
    renderProjects(d.projects || []);
    renderGov(d.gov);
  }

  function start() {
    fillDates();
    if (!API) { showItem([]); ticker(); return; }
    var KEY = 'tns-public', c = null;
    try { c = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (c && Date.now() - c.t < 60000) { apply(c.d); return; }
    fetch(API + '/api/public', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
      try { sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {}
      apply(d);
    }).catch(function () { showItem([]); ticker(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
