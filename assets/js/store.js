/* متجر التبرعات – جمعية تيسير النسك */
(function () {
  'use strict';
  var API = (window.TNS_API || window.TNS_CHAT_URL || '').replace(/\/+$/, '');
  var LANG = document.documentElement.lang || 'ar';
  var PRE = LANG === 'ar' ? '' : '../';
  // Moyasar payment form (monthly donations only). Check the current version in Moyasar's docs before going live.
  var MOYASAR_JS = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.js', MOYASAR_CSS = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.css';
  var T = {
    ar: { sar: 'ريال', don: 'تبرع', give: 'تبرّع للمشروع', of: 'من', goal: 'المستهدف', done: 'اكتمل المستهدف', copied: 'تم نسخ رابط التبرع',
      phone: 'أدخل رقم جوال سعودي صحيحًا يبدأ بـ 05 ويتكون من 10 أرقام.', amount: 'أقل مبلغ للتبرع {min} ريال.', max: 'أعلى مبلغ للتبرع الواحد {max} ريال.',
      closed: 'التبرع الإلكتروني غير متاح حاليًا.', country: 'نعتذر، تُقبل التبرعات من داخل المملكة العربية السعودية فقط.', gateway: 'تعذر الاتصال ببوابة الدفع، حاول بعد قليل.',
      no_gateway: 'بوابة الدفع لم تُفعّل بعد.', rate: 'محاولات كثيرة، انتظر دقائق ثم حاول مجددًا.', net: 'تعذر الاتصال، تحقق من الإنترنت وحاول مجددًا.', project: 'هذا المشروع لا يستقبل تبرعات حاليًا.',
      wait: 'جارٍ التحويل إلى صفحة الدفع...', general: 'تبرع عام غير مقيد', other: 'مبلغ آخر', bank: 'البنك', bname: 'اسم الحساب', iban: 'الآيبان', acc: 'رقم الحساب', copy: 'نسخ', giftTo: 'أدخل اسم المُهدى إليه.',
      monthlyPay: 'أدخل بيانات البطاقة لتفعيل التبرع الشهري. يُخصم المبلغ الآن ثم في اليوم نفسه من كل شهر، ويمكنك إيقافه في أي وقت.', donors: 'تبرع' },
    en: { sar: 'SAR', don: 'donations', give: 'Donate to this project', of: 'of', goal: 'Goal', done: 'Goal reached', copied: 'Donation link copied',
      phone: 'Enter a valid Saudi mobile number starting with 05 (10 digits).', amount: 'The minimum donation is {min} SAR.', max: 'The maximum single donation is {max} SAR.',
      closed: 'Online donations are not available at the moment.', country: 'Sorry, donations are accepted from inside Saudi Arabia only.', gateway: 'Could not reach the payment gateway. Please try again shortly.',
      no_gateway: 'The payment gateway is not active yet.', rate: 'Too many attempts. Please wait a few minutes.', net: 'Connection failed. Check your internet and try again.', project: 'This project is not accepting donations at the moment.',
      wait: 'Taking you to the payment page...', general: 'General donation (unrestricted)', other: 'Other amount', bank: 'Bank', bname: 'Account name', iban: 'IBAN', acc: 'Account no.', copy: 'Copy', giftTo: 'Enter the recipient\'s name.',
      monthlyPay: 'Enter your card to start the monthly donation. The amount is charged now and on the same day every month; you can stop it at any time.', donors: 'donations' },
    ur: { sar: 'ریال', don: 'عطیات', give: 'اس منصوبے کے لیے عطیہ', of: 'میں سے', goal: 'ہدف', done: 'ہدف مکمل', copied: 'عطیہ کا لنک کاپی ہو گیا',
      phone: '05 سے شروع ہونے والا درست سعودی موبائل نمبر درج کریں (10 ہندسے)۔', amount: 'کم از کم عطیہ {min} ریال ہے۔', max: 'ایک عطیہ کی زیادہ سے زیادہ رقم {max} ریال ہے۔',
      closed: 'آن لائن عطیات فی الحال دستیاب نہیں۔', country: 'معذرت، عطیات صرف سعودی عرب کے اندر سے قبول کیے جاتے ہیں۔', gateway: 'ادائیگی گیٹ وے سے رابطہ نہیں ہو سکا، تھوڑی دیر بعد کوشش کریں۔',
      no_gateway: 'ادائیگی گیٹ وے ابھی فعال نہیں۔', rate: 'بہت زیادہ کوششیں، چند منٹ انتظار کریں۔', net: 'رابطہ ناکام، انٹرنیٹ چیک کر کے دوبارہ کوشش کریں۔', project: 'یہ منصوبہ فی الحال عطیات قبول نہیں کر رہا۔',
      wait: 'ادائیگی کے صفحے پر منتقل کیا جا رہا ہے...', general: 'عمومی عطیہ (غیر مخصوص)', other: 'دوسری رقم', bank: 'بینک', bname: 'اکاؤنٹ کا نام', iban: 'آئی بان', acc: 'اکاؤنٹ نمبر', copy: 'کاپی', giftTo: 'جسے تحفہ دیا جا رہا ہے اس کا نام درج کریں۔',
      monthlyPay: 'ماہانہ عطیہ شروع کرنے کے لیے کارڈ درج کریں۔ رقم ابھی اور ہر ماہ اسی دن کٹے گی؛ آپ کسی بھی وقت روک سکتے ہیں۔', donors: 'عطیات' }
  }[LANG] || {};
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var tx = function (o) { return o ? (o[LANG] || o.ar || '') : ''; };
  var num = function (n) { return Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 }); };
  var S = { enabled: false, min: 20, max: 100000, presets: [50, 100, 200, 500], totals: { all: { s: 0, c: 0 } }, banks: [], gift: true, monthly: false };
  var projects = null;

  function normPhone(v) {
    var p = String(v || '').replace(/[\s\-()]/g, '').replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); }).replace(/^(\+966|00966|966)/, '0');
    if (/^5\d{8}$/.test(p)) p = '0' + p;
    return /^05\d{8}$/.test(p) ? p : '';
  }
  function check(f, quick) {
    var a = Number(f.amount.value), ph = normPhone(f.phone.value);
    if (!(a >= S.min)) return T.amount.replace('{min}', S.min);
    if (a > S.max) return T.max.replace('{max}', num(S.max));
    if (!ph) return T.phone;
    if (!quick && f.gift && f.gift.checked && !f.gift_to.value.trim()) return T.giftTo;
    return '';
  }
  function err(f, m) { var e = $('.ferr', f); e.textContent = m || ''; e.classList.toggle('show', !!m); }
  function post(path, body) {
    return fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .catch(function () { throw { error: 'net' }; })
      .then(function (r) { return r.json().catch(function () { return { error: 'gateway' }; }).then(function (j) { if (!r.ok) throw j; return j; }); });
  }
  function fail(f, e, btn) {
    var c = (e && e.error) || 'gateway';
    err(f, c === 'amount' ? T.amount.replace('{min}', e.min || S.min) : (T[c] || T.gateway));
    if (btn) btn.disabled = false;
  }
  function go(f, body) {
    var btn = $('[type=submit]', f); btn.disabled = true; err(f, ''); var w = $('.dwait', f); if (w) w.hidden = false;
    post('/api/donate', body).then(function (r) { if (r.url) location.href = r.url; else fail(f, {}, btn); })
      .catch(function (e) { if (w) w.hidden = true; fail(f, e, btn); });
  }

  // ---------- amount presets ----------
  function presets(box, input) {
    if (!box) return;
    box.innerHTML = S.presets.map(function (v) { return '<button type="button" data-v="' + v + '">' + num(v) + '</button>'; }).join('') +
      '<button type="button" data-v="">' + T.other + '</button>';
    box.onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      $$('button', box).forEach(function (x) { x.classList.toggle('on', x === b); });
      input.value = b.dataset.v; if (!b.dataset.v) input.focus();
    };
    input.addEventListener('input', function () { $$('button', box).forEach(function (x) { x.classList.toggle('on', x.dataset.v === input.value); }); });
  }

  // ---------- quick donation ----------
  var q = $('#quick');
  if (q) {
    presets($('.chips', q), q.amount);
    q.addEventListener('submit', function (e) {
      e.preventDefault(); var m = check(q, true); if (m) return err(q, m);
      go(q, { quick: true, amount: Number(q.amount.value), phone: normPhone(q.phone.value) });
    });
  }

  // ---------- project dialog ----------
  var dlg = $('#ddlg'), df = $('#dform');
  function nameOf(id) {
    if (id === 'general') return T.general;
    var p = (projects || []).filter(function (x) { return x.id === id; })[0];
    if (p) return tx(p.name);
    var c = $('.dcard[data-p="' + id + '"] h3'); return c ? c.textContent : '';
  }
  function open(id) {
    if (!S.enabled || !dlg) return;
    df.reset(); err(df, ''); df.project.value = id; $('#d-title').textContent = nameOf(id);
    df.amount.min = S.min; df.amount.placeholder = S.min;
    $$('.chips button', df).forEach(function (x) { x.classList.remove('on'); });
    $('#d-gift').hidden = true; $('.giftrow', df).hidden = !S.gift; $('.freq', df).hidden = !S.monthly;
    $('#d-mysr').hidden = true; $('#d-fields').hidden = false;
    var b = $('[type=submit]', df); b.disabled = false; b.hidden = false;
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }
  if (dlg) {
    presets($('.chips', df), df.amount);
    $('.dx', df).onclick = function () { dlg.close ? dlg.close() : dlg.removeAttribute('open'); };
    dlg.addEventListener('click', function (e) { if (e.target === dlg) $('.dx', df).onclick(); });
    df.gift.addEventListener('change', function () { $('#d-gift').hidden = !df.gift.checked; });
    df.addEventListener('submit', function (e) {
      e.preventDefault(); var m = check(df, false); if (m) return err(df, m);
      var body = { project: df.project.value, amount: Number(df.amount.value), name: df.name.value.trim(), phone: normPhone(df.phone.value) };
      if (S.monthly && df.freq.value === 'monthly') return monthly(body);
      if (S.gift && df.gift.checked) body.gift = { to: df.gift_to.value.trim(), msg: df.gift_msg.value.trim() };
      go(df, body);
    });
  }
  function loadMoyasar(cb) {
    if (window.Moyasar) return cb();
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = MOYASAR_CSS; document.head.appendChild(l);
    var s = document.createElement('script'); s.src = MOYASAR_JS; s.onload = cb; s.onerror = function () { fail(df, { error: 'gateway' }, $('[type=submit]', df)); }; document.head.appendChild(s);
  }
  function monthly(body) {
    var btn = $('[type=submit]', df); btn.disabled = true; err(df, '');
    post('/api/monthly', body).then(function (r) {
      loadMoyasar(function () {
        $('#d-fields').hidden = true; btn.hidden = true; $('#d-mysr').hidden = false; $('#d-mysr p').textContent = T.monthlyPay;
        window.Moyasar.init({
          element: '.mysr-form', amount: r.amount, currency: 'SAR', description: r.description, publishable_api_key: r.key,
          callback_url: r.callback_url, methods: ['creditcard'], supported_networks: ['mada', 'visa', 'mastercard'],
          credit_card: { save_card: true }, metadata: { sub: r.id }, language: LANG === 'ar' ? 'ar' : 'en'
        });
      });
    }).catch(function (e) { fail(df, e, btn); });
  }

  // ---------- cards, counters, links ----------
  function meter(card, id, goal) {
    var t = S.totals[id] || { s: 0, c: 0 };
    var m = $('.dmeter', card); if (!m) return;
    var h = '<div class="dnums"><b>' + num(t.s) + '</b> ' + T.sar + (goal ? ' <span class="dof">' + T.of + ' ' + num(goal) + '</span>' : '') + '<span class="dcnt">' + num(t.c) + ' ' + T.donors + '</span></div>';
    if (goal) { var pc = Math.min(100, Math.round(t.s / goal * 100)); h += '<div class="dbar" role="progressbar" aria-valuenow="' + pc + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + pc + '%"></i></div><div class="dpc">' + (pc >= 100 ? T.done : pc + '%') + '</div>'; }
    m.innerHTML = h;
  }
  function render() {
    var list = $('#store-list'); if (!list) return;
    if (projects) {
      var gen = $('.dcard.general', list);
      var html = projects.filter(function (p) { return p.donate !== false; }).map(function (p) {
        var img = p.image ? API + '/img/' + p.image : PRE + 'assets/img/scenes/' + (p.scene || 'haram') + '.svg';
        return '<article class="dcard" data-p="' + esc(p.id) + '"><div class="dimg" style="background-image:url(' + esc(img) + ')"></div><div class="db"><h3>' + esc(tx(p.name)) + '</h3><p>' + esc(tx(p.summary)) + '</p>' +
          '<div class="dmeter"></div><div class="dacts"><button class="btn btn-gold" type="button" data-give="' + esc(p.id) + '">' + T.give + '</button>' +
          '<button class="dlink" type="button" data-copy="' + esc(p.id) + '">' + ($('.dlink', list) ? $('.dlink', list).innerHTML : T.copy) + '</button></div></div></article>';
      }).join('');
      list.innerHTML = ''; list.appendChild(gen); list.insertAdjacentHTML('beforeend', html);
    }
    var goals = {}; (projects || []).forEach(function (p) { goals[p.id] = p.goal || 0; });
    $$('.dcard', list).forEach(function (c) { meter(c, c.dataset.p, goals[c.dataset.p]); });
    $('#st-sum').textContent = num(S.totals.all.s); $('#st-cnt').textContent = num(S.totals.all.c);
    document.body.classList.toggle('store-on', !!S.enabled);
    $('#store-closed').hidden = !!S.enabled;
    var bl = $('#bank-list');
    if (bl) {
      $('#banks').hidden = !(S.enabled && S.banks.length);
      bl.innerHTML = S.banks.map(function (b) {
        return '<div class="bank"><b>' + esc(b.bank) + '</b>' + (b.name ? '<div><span>' + T.bname + '</span>' + esc(b.name) + '</div>' : '') +
          '<div><span>' + T.iban + '</span><bdi dir="ltr">' + esc(b.iban.replace(/(.{4})/g, '$1 ').trim()) + '</bdi><button type="button" data-cp="' + esc(b.iban) + '">' + T.copy + '</button></div>' +
          (b.account ? '<div><span>' + T.acc + '</span><bdi dir="ltr">' + esc(b.account) + '</bdi></div>' : '') + '</div>';
      }).join('');
    }
    var m = location.search.match(/[?&]p=([a-z0-9-]+)/);
    if (m && S.enabled && !render.opened) { render.opened = true; var c = $('.dcard[data-p="' + m[1] + '"]'); if (c) { c.scrollIntoView({ block: 'center' }); open(m[1]); } }
  }
  function toast(t) { var d = document.createElement('div'); d.className = 'dtoast'; d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 2200); }
  function copy(t) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast(T.copied); }).catch(function () { window.prompt('', t); }); }
  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-give]'); if (g) return open(g.dataset.give);
    var c = e.target.closest('[data-copy]'); if (c) return copy(location.origin + location.pathname + '?p=' + c.dataset.copy);
    var b = e.target.closest('[data-cp]'); if (b) { (navigator.clipboard ? navigator.clipboard.writeText(b.dataset.cp) : Promise.reject()).then(function () { b.textContent = '✓'; }).catch(function () {}); }
  });

  if (!API) { render(); return; }
  Promise.all([
    fetch(API + '/api/store', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
    fetch(API + '/api/public', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
  ]).then(function (r) {
    if (r[0]) { for (var k in r[0]) S[k] = r[0][k]; }
    if (r[1] && r[1].projects) projects = r[1].projects;
    presets(q && $('.chips', q), q && q.amount); if (df) presets($('.chips', df), df.amount);
    if (q) { q.amount.min = S.min; q.amount.placeholder = S.min; }
    render();
  });
})();
