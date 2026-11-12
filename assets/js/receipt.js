/* سند القبض، بطاقة الإهداء، والتحقق من السند – جمعية تيسير النسك */
(function () {
  'use strict';
  var API = (window.TNS_API || window.TNS_CHAT_URL || '').replace(/\/+$/, '');
  var Q = new URLSearchParams(location.search);
  var box = document.getElementById('rcp');
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var num = function (n) { return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); };
  function dates(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    try {
      return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(d) +
        ' · ' + new Intl.DateTimeFormat('ar-EG-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(d) + 'م' +
        ' · ' + new Intl.DateTimeFormat('ar-EG-u-nu-latn', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Riyadh' }).format(d);
    } catch (e) { return iso.slice(0, 10); }
  }
  // تفقيط المبلغ بالعربية
  var ONES = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  var TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  var HUND = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
  function u999(n) {
    var h = Math.floor(n / 100), r = n % 100, out = [];
    if (h) out.push(HUND[h]);
    if (r) { if (r < 20) out.push(ONES[r]); else { var o = r % 10, t = Math.floor(r / 10); out.push(o ? ONES[o] + ' و' + TENS[t] : TENS[t]); } }
    return out.join(' و');
  }
  function scale(n, one, two, few, many) {
    if (!n) return '';
    if (n === 1) return one; if (n === 2) return two;
    if (n <= 10) return u999(n) + ' ' + few;
    return u999(n) + ' ' + many;
  }
  function words(x) {
    var n = Math.floor(x), hal = Math.round((x - n) * 100), parts = [];
    var m = Math.floor(n / 1e6), th = Math.floor((n % 1e6) / 1000), r = n % 1000;
    if (m) parts.push(scale(m, 'مليون', 'مليونان', 'ملايين', 'مليون'));
    if (th) parts.push(scale(th, 'ألف', 'ألفان', 'آلاف', 'ألف'));
    if (r) parts.push(u999(r));
    var s = (parts.join(' و') || 'صفر') + ' ريال سعودي';
    if (hal) s += ' و' + u999(hal) + ' هللة';
    return 'فقط ' + s + ' لا غير';
  }
  function get(path) {
    return fetch(API + path, { cache: 'no-store' }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw j; return j; }); });
  }
  function msg(title, text, cls) {
    box.innerHTML = '<div class="rcp-msg ' + (cls || '') + '"><h1>' + title + '</h1><p>' + text + '</p></div>';
  }
  var LOGO = 'assets/img/logo.svg';
  function qr(el, text) {
    function draw() { try { new window.QRCode(el, { text: text, width: 112, height: 112, colorDark: '#083530', colorLight: '#ffffff', correctLevel: window.QRCode.CorrectLevel.M }); } catch (e) {} }
    if (window.QRCode) return draw();
    var s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'; s.onload = draw; document.head.appendChild(s);
  }
  var here = location.origin + location.pathname;

  function receipt(r, extra) {
    if (r.status !== 'paid') {
      if (r.status === 'initiated') return msg('لم يكتمل الدفع بعد', 'لم تصلنا بعد نتيجة عملية الدفع. إذا أتممت الدفع فحدّث الصفحة بعد دقيقة، وإن لم تتمه فيمكنك <a href="donate.html">العودة إلى صفحة التبرع</a>.<br><br><button class="btn btn-gold" onclick="location.reload()">تحديث</button>', 'warn');
      if (r.status === 'refunded') return msg('أُعيد المبلغ', 'نعتذر، تُقبل التبرعات بالبطاقات الصادرة من بنوك داخل المملكة العربية السعودية فقط، وقد أُعيد المبلغ إلى بطاقتك.', 'warn');
      return msg('لم تتم عملية الدفع', 'لم يُخصم أي مبلغ. يمكنك <a href="donate.html">المحاولة مرة أخرى</a>، ولأي استفسار تواصل على <a href="tel:+966546684628" dir="ltr">0546684628</a>.', 'warn');
    }
    var proj = r.general ? 'تبرع عام غير مقيد' : (r.project && r.project.ar) || '';
    var method = { mada: 'مدى', visa: 'Visa', master: 'Mastercard', amex: 'American Express', applepay: 'Apple Pay', stcpay: 'STC Pay', creditcard: 'بطاقة' }[r.method] || r.method || '';
    var gift = r.gift ? here + '?' + r.gift.link : '';
    box.innerHTML = (extra || '') +
      '<article class="rcp-doc">' +
      '<header class="rcp-h"><img src="' + LOGO + '" alt="جمعية تيسير النسك"><div><h1>' + (r.waqf ? 'سند قبض تبرع وقفي' : 'سند قبض تبرع') + '</h1><span>' + (r.waqf ? 'Waqf Donation Receipt' : 'Donation Receipt') + '</span></div>' +
      '<dl class="rcp-no"><dt>رقم السند</dt><dd dir="ltr">' + esc(r.no) + '</dd></dl></header>' +
      '<div class="rcp-thanks">' + (r.waqf ? 'جزاك الله خيرًا، وجعله صدقة جارية لك. نشهد باستلام تبرعك الوقفي لصالح وقف جمعية تيسير النسك، ويُحفظ أصله ويُصرف ريعه في أعمال الجمعية.' : 'جزاك الله خيرًا، وتقبّل منك. نشهد باستلام تبرعك الكريم لصالح جمعية تيسير النسك.') + '</div>' +
      '<table class="rcp-t"><tbody>' +
      '<tr><th>استلمنا من</th><td>' + esc(r.donor) + '</td></tr>' +
      '<tr><th>رقم الجوال</th><td dir="ltr" class="ltr">' + esc(r.phone) + '</td></tr>' +
      '<tr><th>مبلغ وقدره</th><td><b class="rcp-amt">' + num(r.amount) + ' ريال</b><div class="rcp-w">' + words(r.amount) + '</div></td></tr>' +
      '<tr><th>وذلك عن</th><td>' + esc(proj) + (r.waqf ? ' <span class="rcp-tag">تبرع وقفي</span>' : '') + (r.monthly ? ' <span class="rcp-tag">تبرع شهري</span>' : '') + (r.gift ? ' <span class="rcp-tag">إهداء إلى: ' + esc(r.gift.to) + '</span>' : '') + '</td></tr>' +
      '<tr><th>التاريخ</th><td>' + dates(r.date) + '</td></tr>' +
      '<tr><th>طريقة الدفع</th><td>' + esc(method) + (r.last4 ? ' <span dir="ltr">•••• ' + esc(r.last4) + '</span>' : '') + ' عبر بوابة ميسّر</td></tr>' +
      (r.ref ? '<tr><th>مرجع العملية</th><td dir="ltr" class="ltr small">' + esc(r.ref) + '</td></tr>' : '') +
      '</tbody></table>' +
      '<footer class="rcp-f"><div class="rcp-qr" id="r-qr"></div><div><b>جمعية تيسير النسك</b><br>جمعية أهلية غير ربحية · مدينة الرياض' + (r.license ? '<br>رقم الترخيص لدى المركز الوطني لتنمية القطاع غير الربحي: ' + esc(r.license) : '') +
      '<br><span class="small">سند إلكتروني لا يحتاج إلى توقيع أو ختم. امسح الرمز للتحقق من صحته.</span></div></footer>' +
      '</article>' +
      (gift ? '<div class="rcp-gift-cta noprint"><b>بطاقة الإهداء جاهزة</b><p>أرسلها إلى ' + esc(r.gift.to) + ' عبر واتساب، أو افتحها لطباعتها.</p>' +
        '<a class="btn btn-gold" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent('أُهديك تبرعًا لصالح جمعية تيسير النسك 🌿\n' + gift) + '">مشاركة عبر واتساب</a> <a class="btn btn-outline" href="' + esc(gift) + '">عرض البطاقة</a></div>' : '');
    if (r.verify) qr(document.getElementById('r-qr'), here + '?no=' + encodeURIComponent(r.verify.no) + '&c=' + r.verify.c);
    document.title = 'سند قبض ' + r.no + ' | جمعية تيسير النسك';
  }

  function giftCard(g) {
    document.body.classList.add('gift-mode');
    var proj = g.general ? 'تبرع عام لأعمال الجمعية' : (g.project && g.project.ar) || '';
    box.innerHTML = '<article class="gcard"><img class="glogo" src="assets/img/logo-white.svg" alt="جمعية تيسير النسك">' +
      '<div class="gkick">بطاقة إهداء</div><h1>إلى ' + esc(g.to) + '</h1>' +
      '<p class="gtext">أُهدي إليك ' + (g.waqf ? 'تبرعًا وقفيًا صدقةً جارية' : 'تبرعًا') + ' في <b>' + esc(proj) + '</b>، لتيسير أداء المناسك لغير القادرين من ضيوف الرحمن، سائلًا الله أن يجعل أجره لك.</p>' +
      (g.msg ? '<blockquote>' + esc(g.msg) + '</blockquote>' : '') +
      '<div class="gfrom">من: ' + esc(g.from) + '</div><div class="gdate">' + dates(g.date).split(' · ').slice(0, 2).join(' · ') + '</div>' +
      '<div class="gfoot">جمعية تيسير النسك · مدينة الرياض</div></article>';
    document.title = 'بطاقة إهداء إلى ' + g.to + ' | جمعية تيسير النسك';
  }

  function verify(v) {
    if (!v.valid) return msg('لم نتمكن من التحقق من السند', 'لا يوجد سند صحيح بهذه البيانات. تأكد من مسح الرمز من السند الأصلي، ولأي استفسار تواصل على <a href="tel:+966546684628" dir="ltr">0546684628</a>.', 'bad');
    var proj = v.general ? 'تبرع عام غير مقيد' : (v.project && v.project.ar) || '';
    box.innerHTML = '<div class="rcp-msg good"><div class="vok">✓</div><h1>سند صحيح</h1><p>هذا السند صادر من جمعية تيسير النسك ومسجل في نظامها.</p>' +
      '<table class="rcp-t"><tbody><tr><th>رقم السند</th><td dir="ltr" class="ltr">' + esc(v.no) + '</td></tr><tr><th>المبلغ</th><td>' + num(v.amount) + ' ريال</td></tr>' +
      '<tr><th>المشروع</th><td>' + esc(proj) + (v.waqf ? ' <span class="rcp-tag">تبرع وقفي</span>' : '') + '</td></tr><tr><th>التاريخ</th><td>' + dates(v.date) + '</td></tr></tbody></table></div>';
  }

  function monthlyBanner(m) {
    if (!m) return '';
    if (m.status === 'active') return '<div class="rcp-banner noprint">تم تفعيل تبرعك الشهري بمبلغ <b>' + num(m.amount) + ' ريال</b>' + (m.card && m.card.last4 ? ' من البطاقة المنتهية بـ <span dir="ltr">' + esc(m.card.last4) + '</span>' : '') + '. الخصم القادم في ' + esc(m.next) + '. <button type="button" id="m-stop" class="lnk">إيقاف التبرع الشهري</button></div>';
    if (m.status === 'single') return '<div class="rcp-banner warn noprint">تم استلام تبرعك، لكن تعذر حفظ البطاقة للخصم الشهري. يمكنك التبرع مجددًا في أي وقت.</div>';
    if (m.status === 'canceled') return '<div class="rcp-banner warn noprint">تم إيقاف التبرع الشهري.</div>';
    return '';
  }

  document.getElementById('r-print').onclick = function () { window.print(); };
  if (!API) return msg('الخدمة غير متاحة', 'تعذر الاتصال بالنظام.', 'bad');
  var load;
  if (Q.get('no') && Q.get('c')) {
    document.body.classList.add('verify-mode');
    load = get('/api/verify?no=' + encodeURIComponent(Q.get('no')) + '&c=' + encodeURIComponent(Q.get('c'))).then(verify);
  } else if (Q.get('gift') && Q.get('g')) {
    load = get('/api/gift/' + encodeURIComponent(Q.get('gift')) + '?g=' + encodeURIComponent(Q.get('g'))).then(function (j) { giftCard(j.gift); });
  } else if (Q.get('m') && Q.get('t')) {
    var mid = Q.get('m'), mt = Q.get('t');
    load = get('/api/monthly/' + encodeURIComponent(mid) + '?t=' + encodeURIComponent(mt) + (Q.get('id') ? '&id=' + encodeURIComponent(Q.get('id')) : '')).then(function (j) {
      if (j.receipt) receipt(j.receipt, monthlyBanner(j.monthly));
      else if (j.monthly && j.monthly.status === 'pending') msg('لم يكتمل الدفع بعد', 'لم تصلنا نتيجة عملية الدفع. حدّث الصفحة بعد دقيقة.<br><br><button class="btn btn-gold" onclick="location.reload()">تحديث</button>', 'warn');
      else if (j.monthly && j.monthly.status === 'refused') msg('أُعيد المبلغ', 'تُقبل التبرعات بالبطاقات الصادرة من بنوك داخل المملكة فقط، وقد أُعيد المبلغ إلى بطاقتك.', 'warn');
      else msg('لم تتم عملية الدفع', 'لم يُخصم أي مبلغ. يمكنك <a href="donate.html">المحاولة مرة أخرى</a>.', 'warn');
      var stop = document.getElementById('m-stop');
      if (stop) stop.onclick = function () {
        if (!confirm('هل تريد إيقاف التبرع الشهري؟ لن يُخصم أي مبلغ بعد الآن.')) return;
        fetch(API + '/api/monthly/' + mid + '/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t: mt }) })
          .then(function () { location.reload(); });
      };
    });
  } else if (Q.get('d') && Q.get('t')) {
    load = get('/api/donation/' + encodeURIComponent(Q.get('d')) + '?t=' + encodeURIComponent(Q.get('t'))).then(function (j) { receipt(j.receipt); });
  } else {
    load = Promise.reject({ error: 'not_found' });
  }
  load.catch(function () { msg('الرابط غير صحيح', 'لم نجد بيانات بهذا الرابط. تأكد من فتح الرابط كاملًا، ولأي استفسار تواصل على <a href="tel:+966546684628" dir="ltr">0546684628</a>.', 'bad'); });
})();
