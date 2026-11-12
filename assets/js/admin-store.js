/* لوحة أداء المتجر، تقرير التبرعات، والإعدادات – جمعية تيسير النسك */
(function () {
  'use strict';
  var A = window.TNS_ADM; if (!A) return;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = A.esc;
  var C1 = '#00897B', C2 = '#B9822A', MUTED = '#9AA9A5'; // validated pair (teal / gold) + muted comparison line
  var RAMP = ['#EEF6F4', '#C9E6E0', '#8FCBC0', '#3FA595', '#00796B', '#004D44'];
  var DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  var TYPES = { project: 'تبرع لمشروع', general: 'تبرع عام', quick: 'تبرع سريع', monthly: 'تبرع شهري', gift: 'تبرع إهدائي', waqf: 'تبرع وقفي' };
  var STATUS = { paid: ['مكتمل', 'green'], initiated: ['لم يكتمل', 'gray'], failed: ['فشل', 'red'], refunded: ['مُعاد (بطاقة أجنبية)', 'amber'], review: ['يحتاج مراجعة', 'amber'] };
  var METHOD = { mada: 'مدى', visa: 'Visa', master: 'Mastercard', amex: 'Amex', applepay: 'Apple Pay', stcpay: 'STC Pay', creditcard: 'بطاقة', '': 'غير محدد' };

  var DONS = null, SUBS = [], NAMES = { general: 'تبرع عام غير مقيد' }, GOALS = {}, LIVE = {};
  var F = { range: '30d', from: '', to: '', project: '', type: '', status: 'paid', q: '', compare: true };

  // ---------- numbers & dates ----------
  var n0 = function (x) { return Number(x || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }); };
  var n2 = function (x) { return Number(x || 0).toLocaleString('en-US', { maximumFractionDigits: 2 }); };
  var pct = function (x) { return (Math.round(x * 10) / 10).toLocaleString('en-US') + '%'; };
  function day0(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
  function addDays(d, k) { var x = new Date(d); x.setDate(x.getDate() + k); return x; }
  function hParts(d) {
    var o = {}; try { new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(d).forEach(function (p) { o[p.type] = parseInt(p.value, 10); }); } catch (e) {}
    return o;
  }
  function hijriBounds(d, unit) { // unit: 'month' | 'year'
    var p = hParts(d), a = day0(d), b = day0(d), key = function (x) { var q = hParts(x); return unit === 'year' ? q.year : q.year * 100 + q.month; }, k = key(a), i = 0;
    while (key(addDays(a, -1)) === k && i++ < 400) a = addDays(a, -1);
    i = 0; while (key(addDays(b, 1)) === k && i++ < 400) b = addDays(b, 1);
    return { from: a, to: addDays(b, 1), p: p };
  }
  var hFmt = function (d, o) { try { return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', o).format(d); } catch (e) { return ''; } };
  var gFmt = function (d, o) { try { return new Intl.DateTimeFormat('ar-EG-u-nu-latn', o).format(d); } catch (e) { return d.toISOString().slice(0, 10); } };
  var RANGES = [['today', 'اليوم'], ['yesterday', 'أمس'], ['7d', 'آخر 7 أيام'], ['30d', 'آخر 30 يومًا'], ['90d', 'آخر 90 يومًا'],
    ['mtd', 'هذا الشهر'], ['lastm', 'الشهر الماضي'], ['qtd', 'هذا الربع'], ['lastq', 'الربع الماضي'], ['ytd', 'هذه السنة الميلادية'], ['lasty', 'السنة الميلادية الماضية'],
    ['hm', 'هذا الشهر الهجري'], ['lasthm', 'الشهر الهجري الماضي'], ['hy', 'هذه السنة الهجرية'], ['lasthy', 'السنة الهجرية الماضية'], ['ramadan', 'رمضان الأخير'], ['all', 'كل الفترات'], ['custom', 'فترة مخصصة']];
  function range(key) {
    var now = new Date(), t0 = day0(now), r;
    switch (key) {
      case 'today': r = { from: t0, to: addDays(t0, 1) }; break;
      case 'yesterday': r = { from: addDays(t0, -1), to: t0 }; break;
      case '7d': r = { from: addDays(t0, -6), to: addDays(t0, 1) }; break;
      case '30d': r = { from: addDays(t0, -29), to: addDays(t0, 1) }; break;
      case '90d': r = { from: addDays(t0, -89), to: addDays(t0, 1) }; break;
      case 'mtd': r = { from: new Date(now.getFullYear(), now.getMonth(), 1), to: addDays(t0, 1), prev: { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate() + 1) } }; break;
      case 'lastm': r = { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 1), prev: { from: new Date(now.getFullYear(), now.getMonth() - 2, 1), to: new Date(now.getFullYear(), now.getMonth() - 1, 1) } }; break;
      case 'qtd': var q = Math.floor(now.getMonth() / 3) * 3; r = { from: new Date(now.getFullYear(), q, 1), to: addDays(t0, 1) }; break;
      case 'lastq': var q2 = Math.floor(now.getMonth() / 3) * 3; r = { from: new Date(now.getFullYear(), q2 - 3, 1), to: new Date(now.getFullYear(), q2, 1), prev: { from: new Date(now.getFullYear(), q2 - 6, 1), to: new Date(now.getFullYear(), q2 - 3, 1) } }; break;
      case 'ytd': r = { from: new Date(now.getFullYear(), 0, 1), to: addDays(t0, 1), prev: { from: new Date(now.getFullYear() - 1, 0, 1), to: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() + 1) } }; break;
      case 'lasty': r = { from: new Date(now.getFullYear() - 1, 0, 1), to: new Date(now.getFullYear(), 0, 1), prev: { from: new Date(now.getFullYear() - 2, 0, 1), to: new Date(now.getFullYear() - 1, 0, 1) } }; break;
      case 'hm': var hm = hijriBounds(now, 'month'); r = { from: hm.from, to: addDays(t0, 1), prev: (function () { var p = hijriBounds(addDays(hm.from, -1), 'month'); return { from: p.from, to: addDays(p.from, Math.round((addDays(t0, 1) - hm.from) / 864e5)) }; })() }; break;
      case 'lasthm': var lm = hijriBounds(addDays(hijriBounds(now, 'month').from, -1), 'month'); r = { from: lm.from, to: lm.to, prev: (function () { var p = hijriBounds(addDays(lm.from, -1), 'month'); return { from: p.from, to: p.to }; })() }; break;
      case 'hy': var hy = hijriBounds(now, 'year'); r = { from: hy.from, to: addDays(t0, 1), prev: (function () { var p = hijriBounds(addDays(hy.from, -1), 'year'); return { from: p.from, to: addDays(p.from, Math.round((addDays(t0, 1) - hy.from) / 864e5)) }; })() }; break;
      case 'lasthy': var ly = hijriBounds(addDays(hijriBounds(now, 'year').from, -1), 'year'); r = { from: ly.from, to: ly.to, prev: (function () { var p = hijriBounds(addDays(ly.from, -1), 'year'); return { from: p.from, to: p.to }; })() }; break;
      case 'ramadan': // the latest Ramadan (month 9) that has started
        var d = t0, i = 0; while (hParts(d).month !== 9 && i++ < 400) d = addDays(d, -1);
        var rb = hijriBounds(d, 'month'); r = { from: rb.from, to: rb.to < addDays(t0, 1) ? rb.to : addDays(t0, 1), prev: (function () { var x = addDays(rb.from, -300), j = 0; while (hParts(x).month !== 9 && j++ < 400) x = addDays(x, -1); var p = hijriBounds(x, 'month'); return { from: p.from, to: p.to }; })() }; break;
      case 'custom':
        var f = F.from ? new Date(F.from + 'T00:00:00') : addDays(t0, -29), to = F.to ? addDays(new Date(F.to + 'T00:00:00'), 1) : addDays(t0, 1);
        if (to <= f) to = addDays(f, 1); r = { from: f, to: to }; break;
      default: r = { from: new Date(2020, 0, 1), to: addDays(t0, 1), all: true };
    }
    if (!r.prev && !r.all) { var len = r.to - r.from; r.prev = { from: new Date(r.from - len), to: new Date(r.from) }; }
    return r;
  }
  function label(r) {
    var o = { day: 'numeric', month: 'long', year: 'numeric' }, last = addDays(r.to, -1);
    if (r.all) return 'كل الفترات';
    var g = gFmt(r.from, o) + (+day0(r.from) === +day0(last) ? '' : ' – ' + gFmt(last, o)) + 'م';
    var h = hFmt(r.from, o) + (+day0(r.from) === +day0(last) ? '' : ' – ' + hFmt(last, o));
    return 'الفترة: ' + g + ' (' + h + ')';
  }

  // ---------- data ----------
  var typeOf = function (d) { return d.mo ? 'monthly' : d.q ? 'quick' : d.p === 'general' ? 'general' : 'project'; };
  var when = function (d) { return new Date(d.pa || d.t); };
  function load() {
    var A1 = A.call('GET', '/api/admin/donations'), A2 = A.call('GET', '/api/admin/projects'), A3 = A.call('GET', '/api/admin/subscriptions').catch(function () { return { subscriptions: [] }; });
    return Promise.all([A1, A2, A3]).then(function (r) {
      DONS = r[0].donations || [];
      (r[1].projects || []).forEach(function (p) { NAMES[p.id] = p.name.ar; GOALS[p.id] = (p.store && p.store.on ? p.store.goal : p.goal) || 0; LIVE[p.id] = p.status === 'approved' && p.published && p.store && p.store.on; });
      SUBS = r[2].subscriptions || [];
    });
  }
  function pick(r, opts) {
    opts = opts || {};
    return (DONS || []).filter(function (d) {
      if ((opts.status || 'paid') !== 'all' && d.s !== (opts.status || 'paid')) return false;
      var w = when(d); if (w < r.from || w >= r.to) return false;
      if (F.project && (d.p || 'general') !== F.project) return false;
      if (F.type === 'gift' ? !d.g : F.type === 'waqf' ? !d.w : F.type && typeOf(d) !== F.type) return false;
      if (opts.q) { var q = opts.q.toLowerCase(); if ((d.n || '').toLowerCase().indexOf(q) < 0 && (d.ph || '').indexOf(q) < 0 && (d.r || '').toLowerCase().indexOf(q) < 0) return false; }
      return true;
    });
  }
  function stats(list, r) {
    var sum = 0, max = 0, donors = {}, byP = {}, byT = {}, byM = {}, firstEver = {};
    (DONS || []).forEach(function (d) { if (d.s === 'paid') { var w = when(d); if (!firstEver[d.ph] || w < firstEver[d.ph]) firstEver[d.ph] = w; } });
    list.forEach(function (d) {
      sum += d.a; if (d.a > max) max = d.a;
      donors[d.ph] = (donors[d.ph] || 0) + 1;
      var p = d.p || 'general'; byP[p] = byP[p] || { s: 0, c: 0 }; byP[p].s += d.a; byP[p].c++;
      var t = typeOf(d); byT[t] = byT[t] || { s: 0, c: 0 }; byT[t].s += d.a; byT[t].c++;
      if (d.g) { byT.gift = byT.gift || { s: 0, c: 0 }; byT.gift.s += d.a; byT.gift.c++; }
      if (d.w) { byT.waqf = byT.waqf || { s: 0, c: 0 }; byT.waqf.s += d.a; byT.waqf.c++; }
      var m = d.m || ''; byM[m] = byM[m] || { s: 0, c: 0 }; byM[m].s += d.a; byM[m].c++;
    });
    var ph = Object.keys(donors), repeat = ph.filter(function (k) { return donors[k] > 1; }).length, newD = ph.filter(function (k) { return firstEver[k] >= r.from; }).length;
    var attempts = (DONS || []).filter(function (d) { var w = new Date(d.t); return w >= r.from && w < r.to && (!F.project || (d.p || 'general') === F.project) && d.s !== 'review'; });
    var done = attempts.filter(function (d) { return d.s === 'paid'; }).length;
    return { sum: sum, count: list.length, avg: list.length ? sum / list.length : 0, max: max, donors: ph.length, repeat: repeat, newD: newD,
      conv: attempts.length ? done / attempts.length * 100 : null, attempts: attempts.length, byP: byP, byT: byT, byM: byM, list: list };
  }
  function delta(cur, prev, money, pp) {
    if (!F.compare || prev == null) return '';
    if (pp) { var dd = cur - prev, c2 = Math.abs(dd) < 0.5 ? 'flat' : dd > 0 ? 'up' : 'down'; return '<span class="dlt ' + c2 + '" title="الفترة السابقة: ' + pct(prev) + '">' + (c2 === 'up' ? '▲ ' : c2 === 'down' ? '▼ ' : '— ') + (Math.round(Math.abs(dd) * 10) / 10) + ' نقطة</span>'; }
    if (!prev) return cur ? '<span class="dlt up">▲ جديد</span>' : '<span class="dlt flat">— لا تغيير</span>';
    var x = (cur - prev) / prev * 100, cls = Math.abs(x) < 0.5 ? 'flat' : x > 0 ? 'up' : 'down';
    return '<span class="dlt ' + cls + '" title="الفترة السابقة: ' + (money ? n2(prev) + ' ريال' : n2(prev)) + '">' + (cls === 'up' ? '▲ ' : cls === 'down' ? '▼ ' : '— ') + pct(Math.abs(x)) + '</span>';
  }

  // ---------- filters ----------
  function filtersHtml(withStatus) {
    var projOpts = '<option value="">كل المشاريع</option>' + Object.keys(NAMES).map(function (k) { return '<option value="' + esc(k) + '"' + (F.project === k ? ' selected' : '') + '>' + esc(NAMES[k]) + '</option>'; }).join('');
    var typeOpts = '<option value="">كل الأنواع</option>' + Object.keys(TYPES).map(function (k) { return '<option value="' + k + '"' + (F.type === k ? ' selected' : '') + '>' + TYPES[k] + '</option>'; }).join('');
    var rangeOpts = RANGES.map(function (x) { return '<option value="' + x[0] + '"' + (F.range === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('');
    return '<div class="fq">' + ['today', '7d', '30d', 'mtd', 'hm', 'hy', 'all'].map(function (k) { var x = RANGES.filter(function (y) { return y[0] === k; })[0]; return '<button type="button" data-r="' + k + '"' + (F.range === k ? ' class="on"' : '') + '>' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="fr"><label>الفترة<select data-f="range">' + rangeOpts + '</select></label>' +
      '<label data-cust' + (F.range === 'custom' ? '' : ' hidden') + '>من<input type="date" data-f="from" value="' + esc(F.from) + '"></label><label data-cust' + (F.range === 'custom' ? '' : ' hidden') + '>إلى<input type="date" data-f="to" value="' + esc(F.to) + '"></label>' +
      '<label>المشروع<select data-f="project">' + projOpts + '</select></label><label>النوع<select data-f="type">' + typeOpts + '</select></label>' +
      (withStatus ? '<label>الحالة<select data-f="status"><option value="paid">مكتمل</option><option value="all">الكل</option><option value="initiated">لم يكتمل</option><option value="failed">فشل</option><option value="refunded">مُعاد</option><option value="review">يحتاج مراجعة</option></select></label><label class="grow">بحث<input type="search" data-f="q" placeholder="اسم أو جوال أو رقم سند" value="' + esc(F.q) + '"></label>'
        : '<label class="chk"><input type="checkbox" data-f="compare"' + (F.compare ? ' checked' : '') + '> مقارنة بالفترة السابقة</label>') + '</div>';
  }
  function bindFilters(box, redraw) {
    box.innerHTML = filtersHtml(box.id === 'dons-filters');
    var st = $('[data-f=status]', box); if (st) st.value = F.status;
    box.onclick = function (e) { var b = e.target.closest('[data-r]'); if (!b) return; F.range = b.dataset.r; bindFilters(box, redraw); redraw(); };
    box.onchange = box.oninput = function (e) {
      var k = e.target.dataset.f; if (!k) return;
      F[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      if (k === 'range') { bindFilters(box, redraw); }
      if (k === 'q' && e.type === 'change') return;
      redraw();
    };
  }

  // ---------- charts (plain SVG/HTML, hover tooltips) ----------
  var tip = document.createElement('div'); tip.className = 'ctip'; tip.hidden = true; document.body.appendChild(tip);
  function showTip(e, html) { tip.innerHTML = html; tip.hidden = false; var x = e.clientX + 14, y = e.clientY + 14; if (x + tip.offsetWidth > innerWidth - 8) x = e.clientX - tip.offsetWidth - 14; if (y + tip.offsetHeight > innerHeight - 8) y = e.clientY - tip.offsetHeight - 14; tip.style.left = x + 'px'; tip.style.top = y + 'px'; }
  document.addEventListener('mousemove', function (e) { var t = e.target.closest && e.target.closest('[data-tip]'); if (t) showTip(e, t.getAttribute('data-tip')); else tip.hidden = true; });

  function buckets(r) {
    var days = (r.to - r.from) / 864e5, unit = days <= 2 ? 'hour' : days <= 120 ? 'day' : 'month', out = [], d = new Date(r.from);
    if (r.all) { var first = (DONS || []).filter(function (x) { return x.s === 'paid'; }).reduce(function (m, x) { var w = when(x); return w < m ? w : m; }, new Date()); d = new Date(first.getFullYear(), first.getMonth(), 1); unit = 'month'; }
    if (unit === 'month') d = new Date(d.getFullYear(), d.getMonth(), 1);
    while (d < r.to && out.length < 400) {
      var nx = unit === 'hour' ? new Date(+d + 36e5) : unit === 'day' ? addDays(d, 1) : new Date(d.getFullYear(), d.getMonth() + 1, 1);
      out.push({ from: new Date(d), to: nx, s: 0, c: 0 }); d = nx;
    }
    return { unit: unit, list: out };
  }
  function fill(b, list) { list.forEach(function (x) { var w = when(x); for (var i = 0; i < b.length; i++) if (w >= b[i].from && w < b[i].to) { b[i].s += x.a; b[i].c++; break; } }); return b; }
  function bLabel(x, unit) { return unit === 'hour' ? gFmt(x.from, { hour: 'numeric' }) : unit === 'day' ? gFmt(x.from, { day: 'numeric', month: 'short' }) : gFmt(x.from, { month: 'short', year: 'numeric' }); }
  function trendSvg(cur, prev, unit) {
    var W = 860, H = 260, L = 56, R = 16, T = 16, B = 34, n = cur.length;
    var max = Math.max.apply(null, cur.map(function (x) { return x.s; }).concat(prev ? prev.map(function (x) { return x.s; }) : [0]).concat([1]));
    var nice = Math.pow(10, Math.floor(Math.log10(max))), top = Math.ceil(max / nice) * nice;
    var X = function (i) { return L + (n <= 1 ? (W - L - R) / 2 : i * (W - L - R) / (n - 1)); }, Y = function (v) { return T + (H - T - B) * (1 - v / top); };
    var path = function (arr) { return arr.map(function (x, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(x.s).toFixed(1); }).join(''); };
    var g = '';
    for (var k = 0; k <= 4; k++) { var v = top * k / 4; g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" class="grid"/><text x="' + (L - 8) + '" y="' + (Y(v) + 4) + '" class="ax" text-anchor="end">' + n0(v) + '</text>'; }
    var step = Math.max(1, Math.ceil(n / 8));
    cur.forEach(function (x, i) { if (i % step === 0 || (i === n - 1 && i % step >= step * 0.6)) g += '<text x="' + X(i) + '" y="' + (H - 10) + '" class="ax" text-anchor="middle">' + esc(bLabel(x, unit)) + '</text>'; });
    var area = '<path d="' + path(cur) + 'L' + X(n - 1) + ' ' + Y(0) + 'L' + X(0) + ' ' + Y(0) + 'Z" fill="' + C1 + '" opacity=".10"/>';
    var lines = (prev ? '<path d="' + path(prev.slice(0, n)) + '" fill="none" stroke="' + MUTED + '" stroke-width="2" stroke-dasharray="5 5"/>' : '') + '<path d="' + path(cur) + '" fill="none" stroke="' + C1 + '" stroke-width="2.4" stroke-linejoin="round"/>';
    var dots = n <= 45 ? cur.map(function (x, i) { return x.c ? '<circle cx="' + X(i) + '" cy="' + Y(x.s) + '" r="4" fill="' + C1 + '" stroke="#fff" stroke-width="2"/>' : ''; }).join('') : '';
    var hits = cur.map(function (x, i) {
      var w = (W - L - R) / Math.max(1, n - 1), p = prev && prev[i];
      var t = '<b>' + esc(bLabel(x, unit)) + '</b><br>' + n2(x.s) + ' ريال · ' + x.c + ' تبرع' + (p ? '<br><span class="mut">الفترة السابقة: ' + n2(p.s) + ' ريال</span>' : '');
      return '<rect x="' + (X(i) - w / 2) + '" y="' + T + '" width="' + w + '" height="' + (H - T - B) + '" fill="transparent" data-tip="' + esc(t) + '"/>';
    }).join('');
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" dir="ltr" role="img" aria-label="منحنى التبرعات">' + g + area + lines + dots + hits + '</svg>';
  }
  function barList(rows, opts) { // rows: [{label, value, sub, goal?}]
    var max = Math.max.apply(null, rows.map(function (x) { return x.value; }).concat([1]));
    return '<div class="blist">' + rows.map(function (x) {
      return '<div class="brow" data-tip="' + esc('<b>' + esc(x.label) + '</b><br>' + x.tip) + '"><span class="bl">' + esc(x.label) + '</span><span class="bt"><i style="width:' + Math.max(x.value ? 1.5 : 0, x.value / max * 100) + '%;background:' + (opts && opts.color || C1) + '"></i></span><span class="bv">' + x.text + '</span>' +
        (x.goal ? '<span class="bg"><span class="gbar"><i style="width:' + Math.min(100, x.goalPct) + '%"></i></span>' + pct(x.goalPct) + ' من المستهدف ' + n0(x.goal) + '</span>' : '') + '</div>';
    }).join('') + '</div>';
  }
  function heat(list) {
    var M = [], mx = 0; for (var d = 0; d < 7; d++) { M[d] = []; for (var h = 0; h < 24; h++) M[d][h] = { c: 0, s: 0 }; }
    list.forEach(function (x) { var w = when(x), c = M[w.getDay()][w.getHours()]; c.c++; c.s += x.a; if (c.c > mx) mx = c.c; });
    var order = [6, 0, 1, 2, 3, 4, 5]; // السبت أولًا
    var head = '<div class="hm-row hm-head"><span></span>' + [0, 3, 6, 9, 12, 15, 18, 21].map(function (h) { return '<span style="grid-column:span 3">' + (h === 0 ? '12ص' : h < 12 ? h + 'ص' : h === 12 ? '12م' : (h - 12) + 'م') + '</span>'; }).join('') + '</div>';
    return '<div class="hm" dir="ltr">' + head + order.map(function (d) {
      return '<div class="hm-row"><span class="hm-d">' + DAYS[d] + '</span>' + M[d].map(function (c, h) {
        var lv = c.c ? Math.min(5, 1 + Math.floor(c.c / Math.max(1, mx) * 4.999)) : 0;
        return '<i style="background:' + RAMP[lv] + '" data-tip="' + esc('<b>' + DAYS[d] + ' – الساعة ' + h + ':00</b><br>' + c.c + ' تبرع · ' + n2(c.s) + ' ريال') + '"></i>';
      }).join('') + '</div>';
    }).join('') + '<div class="hm-leg"><span>أقل</span>' + RAMP.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '<span>أكثر</span></div></div>';
  }
  function histo(list) {
    var B = [[20, 50], [50, 100], [100, 200], [200, 500], [500, 1000], [1000, 5000], [5000, Infinity]], lo = Math.min.apply(null, list.map(function (x) { return x.a; }).concat([20]));
    if (lo < 20) B.unshift([0, 20]);
    return barList(B.map(function (b) {
      var xs = list.filter(function (x) { return x.a >= b[0] && x.a < b[1]; }), s = xs.reduce(function (m, x) { return m + x.a; }, 0);
      var lab = b[1] === Infinity ? n0(b[0]) + ' فأكثر' : n0(b[0]) + ' – ' + n0(b[1] - 1);
      return { label: lab + ' ريال', value: xs.length, text: xs.length + ' تبرع', tip: xs.length + ' تبرع · ' + n2(s) + ' ريال' };
    }), { color: C2 });
  }

  // ---------- smart insights ----------
  function insights(S, P, r) {
    var out = [], up = function (a, b) { return b ? (a - b) / b * 100 : null; };
    if (!S.count) { out.push(['info', 'لا توجد تبرعات مكتملة في هذه الفترة' + (F.project || F.type ? ' بهذه التصفية' : '') + '.']); return out; }
    var g = P ? up(S.sum, P.sum) : null;
    if (g != null && F.compare) out.push([g >= 0 ? 'good' : 'bad', (g >= 0 ? 'ارتفع' : 'انخفض') + ' إجمالي التبرعات ' + pct(Math.abs(g)) + ' مقارنة بالفترة السابقة (' + n0(S.sum) + ' مقابل ' + n0(P.sum) + ' ريال).']);
    var ps = Object.keys(S.byP).sort(function (a, b) { return S.byP[b].s - S.byP[a].s; });
    if (ps.length > 1 && !F.project) out.push(['info', 'المشروع الأعلى تبرعًا: «' + (NAMES[ps[0]] || ps[0]) + '» بنسبة ' + pct(S.byP[ps[0]].s / S.sum * 100) + ' من الإجمالي.']);
    var zero = Object.keys(NAMES).filter(function (k) { return k !== 'general' && LIVE[k] && !S.byP[k]; });
    if (zero.length && !F.project && !F.type) out.push(['warn', 'مشاريع لم تتلقَّ أي تبرع في هذه الفترة: ' + zero.map(function (k) { return '«' + NAMES[k] + '»'; }).join('، ') + '. يمكن إبرازها في الصفحة الرئيسية أو مشاركة روابطها.']);
    Object.keys(GOALS).forEach(function (k) {
      if (!GOALS[k]) return; var tot = (DONS || []).filter(function (d) { return d.s === 'paid' && d.p === k; }).reduce(function (m, d) { return m + d.a; }, 0), p = tot / GOALS[k] * 100;
      if (p >= 100) out.push(['good', 'اكتمل مستهدف «' + NAMES[k] + '» (' + n0(tot) + ' من ' + n0(GOALS[k]) + ' ريال). يمكن رفع المستهدف أو إيقاف استقبال التبرعات له.']);
      else if (p >= 75) out.push(['info', '«' + NAMES[k] + '» قريب من مستهدفه: ' + pct(p) + ' (بقي ' + n0(GOALS[k] - tot) + ' ريال).']);
    });
    if (S.conv != null && S.attempts >= 5) out.push([S.conv < 60 ? 'warn' : 'good', 'نسبة إتمام الدفع ' + pct(S.conv) + ' من ' + S.attempts + ' محاولة.' + (S.conv < 60 ? ' نسبة منخفضة: راجع تجربة صفحة الدفع أو أسباب الرفض في لوحة «ميسّر».' : '')]);
    var hours = {}, days = {}; S.list.forEach(function (x) { var w = when(x); hours[w.getHours()] = (hours[w.getHours()] || 0) + x.a; days[w.getDay()] = (days[w.getDay()] || 0) + x.a; });
    var bh = Object.keys(hours).sort(function (a, b) { return hours[b] - hours[a]; })[0], bd = Object.keys(days).sort(function (a, b) { return days[b] - days[a]; })[0];
    if (S.count >= 10) out.push(['info', 'أفضل وقت للتبرع: يوم ' + DAYS[bd] + '، وأعلى ساعة نحو ' + bh + ':00. أنسب توقيت لنشر الأخبار وحملات التبرع.']);
    if (S.donors) out.push(['info', 'المتبرعون ' + S.donors + '، منهم ' + S.newD + ' جديد' + (S.repeat ? '، و' + S.repeat + ' تبرعوا أكثر من مرة (' + pct(S.repeat / S.donors * 100) + ')' : '') + '.']);
    if (P && P.avg && F.compare) { var a = up(S.avg, P.avg); if (Math.abs(a) >= 10) out.push([a > 0 ? 'good' : 'warn', 'متوسط التبرع ' + (a > 0 ? 'ارتفع' : 'انخفض') + ' إلى ' + n2(S.avg) + ' ريال (' + (a > 0 ? '+' : '−') + pct(Math.abs(a)) + ').']); }
    var wq = S.byT.waqf; if (wq && S.sum) out.push(['good', 'التبرعات الوقفية بلغت ' + n0(wq.s) + ' ريال (' + pct(wq.s / S.sum * 100) + ' من الإجمالي)، وهي أصل دائم يدعم الاستدامة المالية للجمعية.']);
    var q = S.byT.quick; if (q && S.count >= 5) out.push(['info', 'التبرع السريع يمثل ' + pct(q.c / S.count * 100) + ' من عدد التبرعات و' + pct(q.s / S.sum * 100) + ' من قيمتها.']);
    var act = SUBS.filter(function (s) { return s.s === 'active'; }); if (act.length) out.push(['good', 'التبرعات الشهرية النشطة: ' + act.length + ' متبرعًا بإيراد شهري متوقع ' + n0(act.reduce(function (m, s) { return m + s.a; }, 0)) + ' ريال.']);
    return out;
  }

  // ---------- dashboard ----------
  function drawDash() {
    if (!DONS) return;
    var r = range(F.range), list = pick(r), S = stats(list, r), P = r.prev && F.compare ? stats(pick(r.prev), r.prev) : null;
    $('#dash-period').textContent = label(r) + (P ? ' · مقارنة بـ ' + label(r.prev).replace('الفترة: ', '') : '');
    var act = SUBS.filter(function (s) { return s.s === 'active'; }), mrr = act.reduce(function (m, s) { return m + s.a; }, 0);
    var tiles = [
      ['إجمالي التبرعات', n2(S.sum) + ' <small>ريال</small>', delta(S.sum, P && P.sum, 1)],
      ['عدد التبرعات', n0(S.count), delta(S.count, P && P.count)],
      ['متوسط التبرع', n2(S.avg) + ' <small>ريال</small>', delta(S.avg, P && P.avg, 1)],
      ['عدد المتبرعين', n0(S.donors), delta(S.donors, P && P.donors)],
      ['متبرعون جدد', n0(S.newD), delta(S.newD, P && P.newD)],
      ['نسبة إتمام الدفع', S.conv == null ? '—' : pct(S.conv), S.conv != null && P && P.conv != null ? delta(S.conv, P.conv, 0, 1) : ''],
      ['أكبر تبرع', n2(S.max) + ' <small>ريال</small>', ''],
      ['التبرع الشهري النشط', n0(act.length) + ' <small>· ' + n0(mrr) + ' ريال/شهر</small>', '']
    ];
    var b = buckets(r), cur = fill(b.list, list), prev = null;
    if (P) { var pb = buckets(r.prev); prev = fill(pb.list, pick(r.prev)); }
    var prows = Object.keys(S.byP).sort(function (x, y) { return S.byP[y].s - S.byP[x].s; }).map(function (k) {
      var all = (DONS || []).filter(function (d) { return d.s === 'paid' && (d.p || 'general') === k; }).reduce(function (m, d) { return m + d.a; }, 0);
      return { label: NAMES[k] || k, value: S.byP[k].s, text: n0(S.byP[k].s) + ' ريال', tip: n2(S.byP[k].s) + ' ريال · ' + S.byP[k].c + ' تبرع · ' + pct(S.byP[k].s / S.sum * 100) + ' من الإجمالي', goal: GOALS[k] || 0, goalPct: GOALS[k] ? all / GOALS[k] * 100 : 0 };
    });
    var trows = ['project', 'general', 'quick', 'monthly', 'gift', 'waqf'].filter(function (k) { return S.byT[k]; }).map(function (k) { return { label: TYPES[k], value: S.byT[k].s, text: n0(S.byT[k].s) + ' ريال', tip: n2(S.byT[k].s) + ' ريال · ' + S.byT[k].c + ' تبرع' }; });
    var mrows = Object.keys(S.byM).sort(function (x, y) { return S.byM[y].c - S.byM[x].c; }).map(function (k) { return { label: METHOD[k] || k, value: S.byM[k].c, text: S.byM[k].c + ' (' + pct(S.byM[k].c / S.count * 100) + ')', tip: S.byM[k].c + ' تبرع · ' + n2(S.byM[k].s) + ' ريال' }; });
    var top = {}; list.forEach(function (d) { var t = top[d.ph] = top[d.ph] || { n: '', s: 0, c: 0 }; t.s += d.a; t.c++; if (d.n) t.n = d.n; });
    var tops = Object.keys(top).sort(function (x, y) { return top[y].s - top[x].s; }).slice(0, 10);
    var ins = insights(S, P, r);
    $('#dash-body').innerHTML =
      '<div class="kpis">' + tiles.map(function (t) { return '<div class="kpi"><span>' + t[0] + '</span><b>' + t[1] + '</b>' + (t[2] || '') + '</div>'; }).join('') + '</div>' +
      '<div class="dcard2 insights"><h3>قراءة ذكية للنتائج</h3><ul>' + ins.map(function (x) { return '<li class="' + x[0] + '"><i aria-hidden="true">' + { good: '▲', bad: '▼', warn: '!', info: '•' }[x[0]] + '</i>' + esc(x[1]) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="dcard2"><div class="ch-h"><h3>التبرعات عبر الزمن</h3><div class="leg"><span><i style="background:' + C1 + '"></i>الفترة الحالية</span>' + (prev ? '<span><i class="dash" style="border-color:' + MUTED + '"></i>الفترة السابقة</span>' : '') + '</div></div>' +
      (S.count || (P && P.count) ? trendSvg(cur, prev, b.unit) : '<p class="muted">لا توجد بيانات للرسم.</p>') + '</div>' +
      '<div class="dgrid2"><div class="dcard2"><h3>التبرعات حسب المشروع</h3>' + (prows.length ? barList(prows) : '<p class="muted">لا توجد بيانات.</p>') + '</div>' +
      '<div class="dcard2"><h3>حسب نوع التبرع</h3>' + (trows.length ? barList(trows) : '<p class="muted">لا توجد بيانات.</p>') + '<h3 style="margin-top:22px">وسيلة الدفع</h3>' + (mrows.length ? barList(mrows, { color: C2 }) : '<p class="muted">لا توجد بيانات.</p>') + '</div></div>' +
      '<div class="dgrid2"><div class="dcard2"><h3>أوقات التبرع (اليوم × الساعة)</h3>' + heat(list) + '</div>' +
      '<div class="dcard2"><h3>توزيع مبالغ التبرع</h3>' + (S.count ? histo(list) : '<p class="muted">لا توجد بيانات.</p>') + '</div></div>' +
      '<div class="dcard2"><h3>أعلى الداعمين في الفترة</h3>' + (tops.length ? '<table class="log"><thead><tr><th>#</th><th>الداعم</th><th>الجوال</th><th>عدد التبرعات</th><th>الإجمالي (ريال)</th></tr></thead><tbody>' +
        tops.map(function (k, i) { return '<tr><td>' + (i + 1) + '</td><td>' + esc(top[k].n || 'فاعل خير') + '</td><td dir="ltr">' + esc(k) + '</td><td>' + top[k].c + '</td><td>' + n2(top[k].s) + '</td></tr>'; }).join('') + '</tbody></table>' : '<p class="muted">لا توجد بيانات.</p>') + '</div>';
  }

  // ---------- donations report ----------
  function reportRows() { var r = range(F.range); return pick(r, { status: F.status, q: F.q }).sort(function (a, b) { return when(b) - when(a); }); }
  function drawDons() {
    if (!DONS) return;
    var r = range(F.range), rows = reportRows(), sum = rows.reduce(function (m, d) { return m + (d.s === 'paid' ? d.a : 0); }, 0);
    $('#dons-period').textContent = label(r);
    $('#dons-sum').innerHTML = '<span>عدد السجلات: <b>' + rows.length + '</b></span><span>إجمالي المكتمل: <b>' + n2(sum) + ' ريال</b></span>';
    $('#dons-table').innerHTML = rows.length ? '<div class="tscroll"><table class="log dons"><thead><tr><th>رقم السند</th><th>التاريخ</th><th>المبلغ (ريال)</th><th>المشروع</th><th>الداعم</th><th>الجوال</th><th>النوع</th><th>الحالة</th><th class="noprint"></th></tr></thead><tbody>' +
      rows.slice(0, 1000).map(function (d) {
        var st = STATUS[d.s] || [d.s, 'gray'];
        return '<tr data-id="' + d.id + '"><td dir="ltr">' + esc(d.r || '—') + '</td><td>' + esc(A.fmtTime(d.pa || d.t)) + '</td><td>' + n2(d.a) + '</td><td>' + esc(NAMES[d.p] || d.p) + '</td><td>' + esc(d.n || 'فاعل خير') + '</td><td dir="ltr">' + esc(d.ph) + '</td><td>' + TYPES[typeOf(d)] + (d.w ? ' · وقفي' : '') + (d.g ? ' · إهداء' : '') + '</td><td><span class="badge ' + st[1] + '">' + st[0] + '</span></td>' +
          '<td class="noprint acts2">' + (d.s === 'paid' ? '<button data-a="rcpt">السند</button>' : '') + (d.s === 'initiated' ? '<button data-a="verify">تحقق</button>' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>' + (rows.length > 1000 ? '<p class="muted small">يُعرض أول 1000 سجل، والتصدير يشمل الكل.</p>' : '') : '<p class="muted">لا توجد تبرعات بهذه التصفية.</p>';
    var SST = { active: ['نشط', 'green'], pending: ['بانتظار الدفع', 'gray'], paused: ['متوقف (تعذر الخصم)', 'amber'], canceled: ['ملغى', 'gray'], failed: ['فشل', 'red'], refused: ['مرفوض', 'red'], single: ['دفعة واحدة', 'gray'] };
    $('#subs-table').innerHTML = SUBS.length ? '<div class="tscroll"><table class="log"><thead><tr><th>الداعم</th><th>الجوال</th><th>المشروع</th><th>المبلغ الشهري</th><th>عدد الخصومات</th><th>الخصم القادم</th><th>الحالة</th><th class="noprint"></th></tr></thead><tbody>' +
      SUBS.map(function (x) { var st = SST[x.s] || [x.s, 'gray']; return '<tr data-sub="' + x.id + '"><td>' + esc(x.n || 'فاعل خير') + '</td><td dir="ltr">' + esc(x.ph) + '</td><td>' + esc(NAMES[x.p] || x.p) + '</td><td>' + n2(x.a) + '</td><td>' + (x.c || 0) + '</td><td>' + esc(x.next || '—') + '</td><td><span class="badge ' + st[1] + '">' + st[0] + '</span></td><td class="noprint acts2">' + (x.s === 'active' || x.s === 'paused' ? '<button data-a="subcancel" class="danger">إيقاف</button>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="muted">لا توجد تبرعات شهرية بعد.</p>';
  }
  $('#p-dons').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-a]'); if (!b) return;
    var tr = b.closest('tr');
    if (b.dataset.a === 'rcpt') { var w = window.open('about:blank'); A.call('GET', '/api/admin/donations/' + tr.dataset.id).then(function (r) { w.location = 'receipt.html?d=' + tr.dataset.id + '&t=' + r.token; }).catch(function () { w.close(); }); }
    if (b.dataset.a === 'verify') A.call('POST', '/api/admin/donations/' + tr.dataset.id + '/verify').then(function (r) { A.say(r.status === 'paid' ? 'تأكد الدفع وصدر السند ' + r.receiptNo : 'لم يكتمل الدفع بعد (' + r.status + ').'); return load().then(drawDons); }).catch(function () {});
    if (b.dataset.a === 'subcancel' && confirm('إيقاف التبرع الشهري لهذا الداعم؟ لن يُخصم منه أي مبلغ بعد الآن.')) A.call('POST', '/api/admin/subscriptions/' + tr.dataset.sub + '/cancel').then(function () { A.say('أُوقف التبرع الشهري.'); return load().then(drawDons); }).catch(function () {});
  });

  // ---------- export ----------
  function loadXlsx(cb) {
    if (window.XLSX) return cb();
    var s = document.createElement('script'); s.src = 'assets/js/vendor/xlsx-0.18.5.full.min.js'; s.onload = cb; s.onerror = function () { A.say('تعذر تحميل مكتبة Excel، تحقق من الاتصال.', true); }; document.head.appendChild(s);
  }
  function exportXlsx() {
    loadXlsx(function () {
      var X = window.XLSX, r = range(F.range), rows = reportRows(), list = pick(r), S = stats(list, r), wb = X.utils.book_new();
      var head = [['جمعية تيسير النسك – تقرير التبرعات'], [label(r)], ['تاريخ الإصدار: ' + A.fmtTime(new Date().toISOString())], []];
      var t1 = head.concat([['رقم السند', 'التاريخ', 'المبلغ (ريال)', 'المشروع', 'الداعم', 'الجوال', 'النوع', 'إهداء', 'وسيلة الدفع', 'الحالة']]).concat(rows.map(function (d) {
        return [d.r || '', (d.pa || d.t || '').replace('T', ' ').slice(0, 16), d.a, NAMES[d.p] || d.p, d.n || 'فاعل خير', d.ph, TYPES[typeOf(d)] + (d.w ? ' (وقفي)' : ''), d.g ? 'نعم' : '', METHOD[d.m || ''] || d.m, (STATUS[d.s] || [d.s])[0]];
      }));
      t1.push([]); t1.push(['الإجمالي المكتمل', '', rows.reduce(function (m, d) { return m + (d.s === 'paid' ? d.a : 0); }, 0)]);
      var s1 = X.utils.aoa_to_sheet(t1); s1['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 34 }, { wch: 24 }, { wch: 14 }, { wch: 14 }, { wch: 8 }, { wch: 14 }, { wch: 16 }];
      X.utils.book_append_sheet(wb, s1, 'التبرعات');
      var t2 = head.concat([['المشروع', 'المبلغ (ريال)', 'عدد التبرعات', 'النسبة من الإجمالي', 'المستهدف', 'المحقق من المستهدف (كل الفترات)']]).concat(Object.keys(S.byP).map(function (k) {
        var all = (DONS || []).filter(function (d) { return d.s === 'paid' && (d.p || 'general') === k; }).reduce(function (m, d) { return m + d.a; }, 0);
        return [NAMES[k] || k, S.byP[k].s, S.byP[k].c, S.sum ? Math.round(S.byP[k].s / S.sum * 1000) / 10 + '%' : '', GOALS[k] || '', GOALS[k] ? Math.round(all / GOALS[k] * 1000) / 10 + '%' : ''];
      }));
      var s2 = X.utils.aoa_to_sheet(t2); s2['!cols'] = [{ wch: 34 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 22 }];
      X.utils.book_append_sheet(wb, s2, 'حسب المشروع');
      var t3 = head.concat([['المؤشر', 'القيمة']], [['إجمالي التبرعات (ريال)', S.sum], ['عدد التبرعات', S.count], ['متوسط التبرع (ريال)', Math.round(S.avg * 100) / 100], ['عدد المتبرعين', S.donors], ['متبرعون جدد', S.newD], ['متبرعون متكررون', S.repeat], ['نسبة إتمام الدفع', S.conv == null ? '' : Math.round(S.conv * 10) / 10 + '%'], ['أكبر تبرع (ريال)', S.max]]);
      Object.keys(S.byT).forEach(function (k) { t3.push([TYPES[k] + ' (ريال)', S.byT[k].s]); });
      var s3 = X.utils.aoa_to_sheet(t3); s3['!cols'] = [{ wch: 30 }, { wch: 18 }];
      X.utils.book_append_sheet(wb, s3, 'المؤشرات');
      wb.Workbook = { Views: [{ RTL: true }] };
      X.writeFile(wb, 'تقرير_التبرعات_' + new Date().toISOString().slice(0, 10) + '.xlsx');
    });
  }
  function exportPdf(paneId) {
    document.body.setAttribute('data-print', paneId);
    var h = $('#print-head') || document.body.insertAdjacentElement('afterbegin', Object.assign(document.createElement('div'), { id: 'print-head' }));
    h.innerHTML = '<img src="assets/img/logo.svg" alt=""><div><b>جمعية تيسير النسك</b><span>' + (paneId === 'dash' ? 'تقرير أداء متجر التبرعات' : 'تقرير التبرعات') + ' · صدر في ' + esc(A.fmtTime(new Date().toISOString())) + '</span></div>';
    setTimeout(function () { window.print(); }, 50);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-export]'); if (!b) return;
    var paneId = b.closest('#p-dash') ? 'dash' : 'dons';
    if (b.dataset.export === 'xlsx') exportXlsx(); else exportPdf(paneId);
  });

  // ---------- settings ----------
  var fS = $('#f-set'), BANKS = [];
  function bankRows() {
    $('#bank-rows').innerHTML = BANKS.map(function (b, i) {
      return '<div class="bank-row" data-i="' + i + '"><label>البنك<input data-k="bank" value="' + esc(b.bank) + '" maxlength="80"></label><label>اسم الحساب<input data-k="name" value="' + esc(b.name) + '" maxlength="120"></label>' +
        '<label>الآيبان<input data-k="iban" dir="ltr" value="' + esc(b.iban) + '" maxlength="34" placeholder="SA00 0000 0000 0000 0000 0000"></label><label>رقم الحساب<input data-k="account" dir="ltr" value="' + esc(b.account) + '" maxlength="30"></label><button type="button" class="lnk danger" data-del="' + i + '">حذف</button></div>';
    }).join('') || '<p class="muted small">لا توجد حسابات بعد.</p>';
  }
  $('#bank-rows').addEventListener('input', function (e) { var k = e.target.dataset.k; if (!k) return; BANKS[+e.target.closest('.bank-row').dataset.i][k] = e.target.value; });
  $('#bank-rows').addEventListener('click', function (e) { var d = e.target.dataset.del; if (d == null) return; BANKS.splice(+d, 1); bankRows(); });
  $('#bank-add').addEventListener('click', function () { BANKS.push({ bank: '', name: 'جمعية تيسير النسك', iban: '', account: '' }); bankRows(); });
  function loadSettings() {
    return A.call('GET', '/api/admin/settings').then(function (r) {
      var s = r.settings; fS.enabled.checked = !!s.donations.enabled; fS.min.value = s.donations.min; fS.presets.value = (s.donations.presets || []).join(', ');
      fS.gift.checked = s.donations.gift !== false; fS.monthly.checked = !!s.donations.monthly; fS.license.value = s.receipt.license || '';
      BANKS = JSON.parse(JSON.stringify(s.banks || [])); bankRows(); $('#set-gw').hidden = !!r.gateway;
    }).catch(function () {});
  }
  fS.addEventListener('submit', function (e) {
    e.preventDefault();
    var min = Math.round(Number(fS.min.value));
    var presets = fS.presets.value.split(/[,،\s]+/).map(Number).filter(function (x) { return x > 0; });
    if (presets.some(function (x) { return x < min; })) { A.say('المبالغ السريعة يجب ألا تقل عن الحد الأدنى (' + min + ' ريال).', true); return; }
    var bad = BANKS.filter(function (b) { return (b.bank || b.iban) && !/^SA\d{2}[0-9A-Z]{20}$/.test((b.iban || '').replace(/\s+/g, '').toUpperCase()); });
    if (bad.length) { A.say('رقم الآيبان غير صحيح: يبدأ بـ SA ويتكون من 24 خانة.', true); return; }
    if (fS.enabled.checked && !confirm('سيُفتح باب التبرع للزوار في الموقع. هل صدر ترخيص الجمعية وفُعّل حساب بوابة الدفع؟')) return;
    A.call('PUT', '/api/admin/settings', { donations: { enabled: fS.enabled.checked, min: min, presets: presets, gift: fS.gift.checked, monthly: fS.monthly.checked }, banks: BANKS, receipt: { license: fS.license.value.trim() } })
      .then(function () { A.say('حُفظت الإعدادات.'); loadSettings(); }).catch(function (er) { if (er && er.error === 'iban') A.say('رقم الآيبان غير صحيح.', true); });
  });

  // ---------- tabs ----------
  function open(draw, boxId) { var box = $('#' + boxId); (DONS ? Promise.resolve() : load()).then(function () { bindFilters(box, draw); draw(); }).catch(function () { $('#dash-body').innerHTML = '<p class="muted">تعذر تحميل البيانات.</p>'; }); }
  window.TNS_TABS = {
    dash: function () { DONS = null; open(drawDash, 'dash-filters'); },
    dons: function () { DONS = null; open(drawDons, 'dons-filters'); },
    settings: loadSettings
  };
  window.addEventListener('afterprint', function () { document.body.removeAttribute('data-print'); });
})();
