/* إدارة صفحة الحوكمة والشفافية من لوحة التحكم – جمعية تيسير النسك
   كل نص في الصفحة قابل للتعديل بالعربية والإنجليزية والأوردية، مع القوائم (القيادات، بيانات المجلس، اللجان، الوحدات، الإفصاح، اللوائح والسياسات)
   ورفع الملفات (PDF أو صور). يحفظ المدير فقط. */
(function () {
  'use strict';
  var A = window.TNS_ADM; if (!A) return;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = A.esc, API = A.API;
  var MAX_FILE = 8 * 1024 * 1024;
  var REF = /^(f:[a-f0-9]{24}|i:[a-f0-9]{24}|(docs|kits|assets)\/[^\s"'<>\\]{1,240}|https:\/\/[^\s"'<>\\]{4,400}|[a-z-]{2,30}\.html(#[\w-]{1,40})?)$/;

  // t = نص قصير، l = نص طويل، b = إظهار، img = صورة، ref = ملف أو رابط، icon = أيقونة، list = قائمة
  var SECS = [
    ['hero', 'رأس الصفحة', { title: ['t', 'عنوان الصفحة'], lead: ['l', 'النبذة تحت العنوان'] }],
    ['board', 'القيادات ومجلس الإدارة', {
      show: ['b', 'إظهار القسم'], kick: ['t', 'العنوان الصغير'], title: ['t', 'عنوان القسم'], lead: ['l', 'وصف القسم'],
      leaders: ['list', 'القيادات (رئيس المجلس، النائب، المدير التنفيذي…)', { role: ['t', 'المنصب'], name: ['t', 'الاسم'], photo: ['img', 'الصورة الشخصية (اختيارية)'] }, { add: '+ إضافة قيادي' }],
      thK: ['t', 'عنوان العمود الأول في الجدول'], thV: ['t', 'عنوان العمود الثاني'],
      rows: ['list', 'بنود جدول مجلس الإدارة', { k: ['t', 'البند'], v: ['l', 'البيان'] }, { add: '+ إضافة بند', compact: true }]
    }],
    ['structure', 'الهيكل التنظيمي', {
      show: ['b', 'إظهار القسم'], kick: ['t', 'العنوان الصغير'], title: ['t', 'عنوان القسم'], lead: ['l', 'وصف القسم'],
      assembly: ['t', 'المستوى الأعلى (الجمعية العمومية)'], board: ['t', 'مجلس الإدارة'], committeesLabel: ['t', 'عنوان مربع اللجان'],
      committees: ['list', 'لجان المجلس', { name: ['t', 'اسم اللجنة'] }, { add: '+ إضافة لجنة', compact: true }],
      ceo: ['t', 'الإدارة التنفيذية'],
      units: ['list', 'الوحدات والمسؤولون تحت الإدارة التنفيذية', { name: ['t', 'الوحدة أو المسؤول'] }, { add: '+ إضافة وحدة', compact: true }],
      image: ['img', 'صورة جاهزة للهيكل (اختيارية: إن رُفعت تحل محل الرسم أعلاه)'],
      file: ['ref', 'ملف الهيكل للتنزيل (اختياري)'], fileLabel: ['t', 'نص زر التنزيل'], note: ['l', 'ملاحظة أسفل الهيكل']
    }],
    ['disclose', 'الإفصاح', {
      show: ['b', 'إظهار القسم'], kick: ['t', 'العنوان الصغير'], title: ['t', 'عنوان القسم'], lead: ['l', 'وصف القسم'], fileLabel: ['t', 'نص رابط الملف في البطاقات'],
      items: ['list', 'بطاقات الإفصاح', { icon: ['icon', 'الأيقونة'], title: ['t', 'العنوان'], text: ['l', 'الوصف'], status: ['t', 'الحالة (شارة، اتركها فارغة لإخفائها)'], file: ['ref', 'الملف المنشور (شهادة، تقرير، قوائم مالية…)'] }, { add: '+ إضافة بطاقة' }]
    }],
    ['docs', 'السياسات واللوائح', {
      show: ['b', 'إظهار القسم'], kick: ['t', 'العنوان الصغير'], title: ['t', 'عنوان القسم'], lead: ['l', 'وصف القسم'],
      groups: ['list', 'مجموعات الوثائق', {
        title: ['t', 'عنوان المجموعة'],
        items: ['list', 'الوثائق', { code: ['t', 'الرمز'], name: ['t', 'اسم الوثيقة'], file: ['ref', 'الملف'] }, { add: '+ إضافة وثيقة', doc: true }]
      }, { add: '+ إضافة مجموعة' }],
      thCode: ['t', 'عنوان عمود الرمز'], thName: ['t', 'عنوان عمود الوثيقة'], thFile: ['t', 'عنوان عمود الملف'], view: ['t', 'نص رابط العرض'],
      note: ['l', 'ملاحظة أسفل القسم']
    }],
    ['satisfaction', 'قياس الرضا', { show: ['b', 'إظهار القسم'], title: ['t', 'العنوان'], text: ['l', 'النص'] }],
    ['band', 'الشكاوى والمقترحات (الشريط الختامي)', {
      show: ['b', 'إظهار القسم'], title: ['t', 'العنوان'], text: ['l', 'النص'],
      buttons: ['list', 'الأزرار', { label: ['t', 'نص الزر'], href: ['ref', 'الرابط أو الملف'] }, { add: '+ إضافة زر', max: 4 }]
    }]
  ];
  var MAX = { 'board.leaders': 12, 'board.rows': 30, 'structure.committees': 10, 'structure.units': 24, 'disclose.items': 24, 'docs.groups': 8, 'band.buttons': 4 };

  var G = null, LANG = 'ar', dirty = false;
  var pane = $('#p-gov'), box = $('#gov-body');

  // ---------- مسارات البيانات ----------
  function get(path) { return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, G); }
  function set(path, v) { var ks = path.split('.'), last = ks.pop(), o = get(ks.join('.')); if (o) o[last] = v; }
  function ml(o) { return o && typeof o === 'object' ? o : { ar: '', en: '', ur: '' }; }
  function url(ref) {
    if (!ref) return '';
    if (/^i:/.test(ref)) return API + '/img/' + ref.slice(2);
    if (/^f:/.test(ref)) return API + '/file/' + ref.slice(2);
    return ref;
  }
  function blank(spec) {
    var o = { id: 'n' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36) };
    Object.keys(spec).forEach(function (k) {
      var t = spec[k][0];
      o[k] = t === 't' || t === 'l' ? { ar: '', en: '', ur: '' } : t === 'list' ? [] : t === 'icon' ? 'clip' : t === 'b' ? true : '';
    });
    return o;
  }
  function mark() { dirty = true; $('#gov-dirty').hidden = false; }
  function clean() { dirty = false; $('#gov-dirty').hidden = true; }

  // ---------- الرسم ----------
  function fieldHTML(path, f) {
    var t = f[0], label = f[1], v = get(path);
    if (t === 't' || t === 'l') {
      var o = ml(v), val = o[LANG] || '', ph = LANG === 'ar' ? '' : (o.ar ? 'يظهر النص العربي إن تُرك فارغًا: ' + o.ar : '');
      var attrs = ' data-p="' + path + '" data-t="ml" dir="' + (LANG === 'en' ? 'ltr' : 'rtl') + '" placeholder="' + esc(ph.slice(0, 160)) + '"';
      return '<label>' + esc(label) + (t === 't' ? '<input' + attrs + ' maxlength="200" value="' + esc(val) + '">' : '<textarea' + attrs + ' rows="2" maxlength="1500">' + esc(val) + '</textarea>') + '</label>';
    }
    if (t === 'b') return '<label class="chk"><input type="checkbox" data-p="' + path + '" data-t="b"' + (v !== false ? ' checked' : '') + '> ' + esc(label) + '</label>';
    if (t === 'icon') {
      var names = Object.keys(window.TNS_ICONS || {}).sort();
      return '<label>' + esc(label) + '<span class="gicon"><select data-p="' + path + '" data-t="raw">' + names.map(function (n) { return '<option' + (n === v ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') +
        '</select><span class="gico" data-ico="' + path + '">' + A.icon(v, 22) + '</span></span></label>';
    }
    if (t === 'img') {
      return '<div class="gimg"><span class="glbl">' + esc(label) + '</span><div class="gimg-row"><span class="gthumb"' + (v ? ' style="background-image:url(\'' + esc(url(v)) + '\')"' : '') + '>' + (v ? '' : 'لا توجد صورة') + '</span>' +
        '<label class="btn btn-outline small">رفع صورة<input type="file" hidden accept="image/jpeg,image/png,image/webp" data-up="img" data-p="' + path + '"></label>' +
        (v ? '<button type="button" class="lnk danger" data-act="clear" data-p="' + path + '">إزالة</button>' : '') + '</div></div>';
    }
    if (t === 'ref') {
      return '<div class="fref"><span class="glbl">' + esc(label) + '</span><div class="fref-row"><input data-p="' + path + '" data-t="raw" dir="ltr" value="' + esc(v || '') + '" placeholder="ارفع ملفًا أو الصق رابطًا يبدأ بـ https://" maxlength="400">' +
        '<label class="btn btn-outline small">رفع ملف<input type="file" hidden accept="application/pdf,image/jpeg,image/png" data-up="file" data-p="' + path + '"></label>' +
        (v ? '<a class="lnk" href="' + esc(url(v)) + '" target="_blank" rel="noopener">عرض</a><button type="button" class="lnk danger" data-act="clear" data-p="' + path + '">إزالة</button>' : '') + '</div></div>';
    }
    if (t === 'list') return listHTML(path, f);
    return '';
  }
  function listHTML(path, f) {
    var spec = f[2], opt = f[3] || {}, arr = get(path) || [], max = MAX[path] || (opt.doc ? 80 : 50);
    var items = arr.map(function (x, i) {
      var p = path + '.' + i;
      var tools = '<div class="gtools"><span class="gnum">' + (i + 1) + '</span>' +
        '<button type="button" class="ib" title="أعلى" data-act="up" data-p="' + path + '" data-i="' + i + '"' + (i ? '' : ' disabled') + '>▲</button>' +
        '<button type="button" class="ib" title="أسفل" data-act="down" data-p="' + path + '" data-i="' + i + '"' + (i < arr.length - 1 ? '' : ' disabled') + '>▼</button>' +
        '<button type="button" class="ib danger" title="حذف" data-act="del" data-p="' + path + '" data-i="' + i + '">حذف</button></div>';
      var fields = Object.keys(spec).map(function (k) { return fieldHTML(p + '.' + k, spec[k]); }).join('');
      return '<div class="gitem' + (opt.compact ? ' compact' : '') + (opt.doc ? ' doc' : '') + '">' + tools + '<div class="gfields">' + fields + '</div></div>';
    }).join('');
    return '<div class="glist"><h4>' + esc(f[1]) + ' <span class="muted small">(' + arr.length + ')</span></h4>' + (items || '<p class="muted small">لا توجد عناصر.</p>') +
      (arr.length < max ? '<button type="button" class="btn btn-outline small" data-act="add" data-p="' + path + '">' + esc(opt.add || '+ إضافة') + '</button>' : '') + '</div>';
  }
  function render() {
    var y = window.scrollY;
    box.innerHTML = SECS.map(function (s) {
      var key = s[0], spec = s[2], d = G[key] || {};
      var hidden = spec.show && d.show === false;
      return '<section class="adm-card gsec" id="gs-' + key + '"><h3>' + esc(s[1]) + (hidden ? ' <span class="badge gray">مخفي</span>' : '') + '</h3>' +
        Object.keys(spec).map(function (k) { return fieldHTML(key + '.' + k, spec[k]); }).join('') + '</section>';
    }).join('');
    $$('#gov-ltabs button').forEach(function (b) {
      b.classList.toggle('on', b.dataset.l === LANG);
    });
    window.scrollTo(0, y);
  }

  // ---------- نص ملفات PDF (لتشملها نتائج البحث في الموقع) ----------
  var pdfLib = null;
  function loadPdf() {
    if (pdfLib) return pdfLib;
    pdfLib = new Promise(function (ok, bad) {
      var sc = document.createElement('script'); sc.src = 'assets/js/vendor/pdf-3.11.174.min.js';
      sc.onload = function () { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/js/vendor/pdf.worker-3.11.174.min.js'; ok(window.pdfjsLib); };
      sc.onerror = bad; document.head.appendChild(sc);
    });
    return pdfLib;
  }
  // تصحيح تفكك «ال» في النص المستخرج من ملفات PDF العربية (مثل: األنظمة ← الأنظمة)
  function fixAr(t) { return t.replace(/اإل/g, 'الإ').replace(/األ/g, 'الأ').replace(/اآل/g, 'الآ').replace(/اال/g, 'الا').replace(/اهلل/g, 'الله').replace(/\s+/g, ' ').trim(); }
  function pdfText(file) {
    return loadPdf().then(function (lib) { return file.arrayBuffer().then(function (buf) { return lib.getDocument({ data: buf }).promise; }); })
      .then(function (doc) {
        var n = Math.min(doc.numPages, 80), out = [], chain = Promise.resolve();
        for (var i = 1; i <= n; i++) (function (i) {
          chain = chain.then(function () { return doc.getPage(i); }).then(function (pg) { return pg.getTextContent(); })
            .then(function (c) { out.push(c.items.map(function (x) { return x.str; }).join(' ')); });
        })(i);
        return chain.then(function () { return fixAr(out.join(' ')).slice(0, 60000); });
      }).catch(function () { return ''; }); // the file is still uploaded if its text cannot be read
  }

  // ---------- التفاعل ----------
  box.addEventListener('input', function (e) {
    var el = e.target, p = el.dataset.p; if (!p) return;
    if (el.dataset.t === 'ml') { var o = ml(get(p)); o[LANG] = el.value; set(p, o); }
    else if (el.dataset.t === 'raw') {
      set(p, el.value.trim());
      if (el.closest('.fref')) el.classList.toggle('inv', !!el.value.trim() && !REF.test(el.value.trim())); var ic = $('[data-ico="' + p + '"]'); if (ic) ic.innerHTML = A.icon(el.value, 22); }
    else if (el.dataset.t === 'b') set(p, el.checked);
    mark();
  });
  box.addEventListener('change', function (e) {
    var el = e.target;
    if (el.dataset.t === 'b') { set(el.dataset.p, el.checked); mark(); render(); return; }
    if (!el.dataset.up) return;
    var f = el.files[0], p = el.dataset.p; if (!f) return;
    if (el.dataset.up === 'img') {
      A.say('جارٍ رفع الصورة…');
      A.shrink(f).then(function (d) { return A.call('POST', '/api/admin/upload', { data: d }); })
        .then(function (r) { set(p, 'i:' + r.id); mark(); render(); A.say('رُفعت الصورة. لا تنسَ حفظ التغييرات.'); }).catch(function () {});
      return;
    }
    if (f.size > MAX_FILE) { A.say('حجم الملف أكبر من 8 ميغابايت. صغّره ثم أعد المحاولة.', true); el.value = ''; return; }
    if (!/^(application\/pdf|image\/jpeg|image\/png)$/.test(f.type)) { A.say('نوع الملف غير مدعوم: ارفع PDF أو صورة JPG أو PNG.', true); el.value = ''; return; }
    var rd = new FileReader();
    rd.onload = function () {
      A.say(f.type === 'application/pdf' ? 'جارٍ قراءة نص الملف للبحث ثم رفعه…' : 'جارٍ رفع الملف…');
      (f.type === 'application/pdf' ? pdfText(f) : Promise.resolve(''))
        .then(function (text) { return A.call('POST', '/api/admin/files', { name: f.name, data: rd.result, text: text }); })
        .then(function (r) { set(p, r.ref); mark(); render(); A.say('رُفع الملف «' + r.name + '». لا تنسَ حفظ التغييرات.'); }).catch(function () {});
    };
    rd.readAsDataURL(f);
  });
  box.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var p = b.dataset.p, i = +b.dataset.i, act = b.dataset.act;
    if (act === 'clear') { set(p, ''); mark(); render(); return; }
    var arr = get(p); if (!Array.isArray(arr)) return;
    if (act === 'add') {
      var spec = specOf(p); arr.push(blank(spec));
      mark(); render();
      var items = $$('.gitem', b.parentNode); var last = items[items.length - 1];
      if (last) { var inp = $('input,textarea', last); if (inp) inp.focus(); }
      return;
    }
    if (act === 'del') { if (!confirm('حذف هذا العنصر؟')) return; arr.splice(i, 1); }
    if (act === 'up' && i > 0) arr.splice(i - 1, 0, arr.splice(i, 1)[0]);
    if (act === 'down' && i < arr.length - 1) arr.splice(i + 1, 0, arr.splice(i, 1)[0]);
    mark(); render();
  });
  // مواصفات عناصر القائمة من المسار (مثل docs.groups.0.items)
  function specOf(path) {
    var ks = path.split('.').filter(function (k) { return !/^\d+$/.test(k); });
    var spec = null;
    SECS.forEach(function (s) { if (s[0] === ks[0]) spec = s[2]; });
    for (var j = 1; j < ks.length; j++) spec = (j === ks.length - 1) ? spec[ks[j]][2] : spec[ks[j]][2];
    return spec;
  }
  $('#gov-ltabs').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; LANG = b.dataset.l; render(); });
  $('#gov-nav').addEventListener('click', function (e) { var a = e.target.closest('[data-go]'); if (!a) return; var el = $('#gs-' + a.dataset.go); if (el) el.scrollIntoView({ behavior: 'smooth' }); });
  $('#gov-save').addEventListener('click', function () {
    if (!G.hero || !ml(G.hero.title).ar.trim()) { A.say('عنوان الصفحة بالعربية مطلوب.', true); return; }
    var bad = $('.fref input.inv', box);
    if (bad) { bad.focus(); A.say('رابط غير صالح: الصق رابطًا يبدأ بـ https:// أو ارفع ملفًا.', true); return; }
    A.call('PUT', '/api/admin/gov', { gov: G }).then(function (r) { G = r.gov; clean(); render(); A.say('حُفظت صفحة الحوكمة والشفافية، وتظهر التعديلات في الموقع خلال دقيقة.'); }).catch(function () {});
  });
  $('#gov-reset').addEventListener('click', function () {
    if (!confirm('استعادة المحتوى الأصلي للصفحة؟ ستُحذف كل التعديلات المحفوظة (الملفات المرفوعة تبقى في المنصة).')) return;
    A.call('POST', '/api/admin/gov/reset').then(function (r) { G = r.gov; clean(); render(); A.say('استُعيد المحتوى الأصلي للصفحة.'); }).catch(function () {});
  });
  window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  function load() {
    if (dirty && G) { render(); return; }
    box.innerHTML = '<p class="muted">جارٍ التحميل…</p>';
    A.call('GET', '/api/admin/gov').then(function (r) { G = r.gov; LANG = 'ar'; clean(); render(); }).catch(function (e) {
      box.innerHTML = '<div class="adm-card"><p class="gwarn" style="margin:0">' + (e && e.error === 'not_found' ?
        'الوسيط (Worker) في Cloudflare ما زال على النسخة السابقة: الصق محتوى ملف worker.js الجديد في Cloudflare ثم اضغط Deploy، وبعدها حدّث هذه الصفحة.' :
        'تعذّر تحميل محتوى الصفحة. حدّث الصفحة وحاول مرة أخرى.') + '</p></div>';
    });
  }
  $('#gov-nav').innerHTML = SECS.map(function (s) { return '<button type="button" data-go="' + s[0] + '">' + esc(s[1]) + '</button>'; }).join('');
  window.TNS_TABS = window.TNS_TABS || {};
  window.TNS_TABS.gov = load;
})();
