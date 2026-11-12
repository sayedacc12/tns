// لوحة تحكم المحتوى لجمعية تيسير النسك (تتصل بوسيط Cloudflare نفسه الذي يشغّل المساعد الذكي)
(function () {
  if (window.top !== window.self) { try { window.top.location = window.self.location.href; } catch (e) { document.documentElement.innerHTML = ''; } return; }
  var API = (window.TNS_API || window.TNS_CHAT_URL || '').replace(/\/+$/, '');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var TK = 'tns-admin-token';
  var token = null, me = null, NEWS = [], PROJ = [], USERS = [];
  try { token = sessionStorage.getItem(TK); } catch (e) {}
  var SCENES = { haram: 'المسجد الحرام', arafat: 'عرفات', mina: 'منى', nabawi: 'المسجد النبوي', path: 'الطريق', skyline: 'أفق المدينة' };
  var ICON_NAMES = { kaaba: 'الكعبة', bus: 'النقل', medal: 'وسام', book: 'كتاب', hands: 'رعاية', users: 'أشخاص', shield: 'حماية', chart: 'مؤشرات', handshake: 'شراكة',
    eye: 'رؤية', target: 'هدف', clip: 'مستند', phone: 'جوال', mail: 'بريد', globe: 'عالمي', pin: 'موقع', star: 'تميّز', check: 'صح', heart: 'قلب', building: 'مبنى',
    grad: 'تدريب', search: 'بحث', clock: 'وقت', megaphone: 'إعلان' };
  var ST = { published: ['منشور', 'green'], pending: ['بانتظار الاعتماد', 'amber'], draft: ['مسودة', 'gray'] };
  var ERR = {
    bad_login: 'اسم المستخدم أو كلمة المرور غير صحيحة.', too_many: 'محاولات دخول كثيرة. حاول بعد 15 دقيقة.', auth: 'انتهت الجلسة، سجّل الدخول من جديد.',
    must_change: 'غيّر كلمة المرور المؤقتة أولًا.', forbidden: 'لا تملك صلاحية هذا الإجراء.', weak: 'كلمة المرور ضعيفة: 10 أحرف على الأقل بحروف وأرقام، وألا تكون كلمة شائعة أو مكررة الأحرف.',
    bad_old: 'كلمة المرور الحالية غير صحيحة.', exists: 'اسم المستخدم مستخدم من قبل.', username: 'اسم المستخدم بأحرف إنجليزية صغيرة (3 أحرف فأكثر) ويبدأ بحرف.',
    self: 'لا يمكن حذف حسابك أو آخر مدير، ولا إلغاء صلاحيته أو تعطيله.', title: 'عنوان الخبر بالعربية مطلوب.', name: 'اسم المشروع بالعربية مطلوب.',
    size: 'حجم الصورة كبير جدًا.', type: 'نوع الصورة غير مدعوم (JPG أو PNG أو WEBP).', image: 'تعذّرت قراءة الصورة.', not_found: 'العنصر غير موجود، ربما حُذف.',
    origin: 'هذا الموقع غير مسموح له بالاتصال بالمنصة (راجع ALLOWED_ORIGINS في إعدادات الوسيط).', no_db: 'المنصة غير مفعّلة بعد: أضف قاعدة بيانات KV باسم DB في إعدادات الوسيط.',
    network: 'تعذّر الاتصال بالمنصة. تحقق من الإنترنت ومن رابط الوسيط.', server: 'حدث خطأ في الخادم.',
    locked: 'هذا الحساب مقفل مؤقتًا 30 دقيقة بسبب محاولات دخول خاطئة متكررة. حاول لاحقًا أو اطلب من المدير التحقق.', too_large: 'حجم البيانات المرسلة كبير جدًا.', decision: 'اختر القرار.', note: 'اكتب سبب الإرجاع أو الرفض في الملاحظات.', goal: 'المستهدف المالي مطلوب عند النشر في المتجر.',
    min: 'الحد الأدنى للمشروع لا يقل عن الحد الأدنى العام في الإعدادات.', max: 'الحد الأعلى يجب أن يكون أكبر من الحد الأدنى.', not_approved: 'المشروع غير معتمد بعد.'
  };

  // ---------- أدوات ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var msgT;
  function say(t, err) { var m = $('#msg'); m.textContent = t; m.classList.toggle('bad', !!err); m.hidden = false; clearTimeout(msgT); msgT = setTimeout(function () { m.hidden = true; }, err ? 6000 : 3000); }
  function call(method, path, body) {
    var h = { 'Content-Type': 'application/json' };
    if (token) h.Authorization = 'Bearer ' + token;
    return fetch(API + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined })
      .catch(function () { throw { error: 'network' }; })
      .then(function (r) { return r.json().catch(function () { return { error: 'server' }; }).then(function (j) { if (!r.ok) throw j; if (method !== 'GET') { try { sessionStorage.removeItem('tns-public'); } catch (x) {} } return j; }); })
      .catch(function (e) {
        var code = (e && e.error) || 'server';
        if (code === 'auth') { logoutLocal(); }
        if (code === 'must_change') { view('pw'); }
        say(ERR[code] || ERR.server, true); throw e;
      });
  }
  function icon(name, size) {
    var I = window.TNS_ICONS || {};
    return '<svg width="' + (size || 22) + '" height="' + (size || 22) + '" viewBox="0 0 24 24" fill="none" stroke="#0D4842" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (I[name] || '') + '</svg>';
  }
  function fmt(iso) { if (!iso) return ''; try { return new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { dateStyle: 'medium' }).format(new Date(iso.length === 10 ? iso + 'T12:00:00Z' : iso)); } catch (e) { return iso; } }
  function fmtTime(iso) { try { return new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)); } catch (e) { return iso; } }
  function thumb(x) { return x.image ? API + '/img/' + x.image : 'assets/img/scenes/' + (x.scene || 'haram') + '.svg'; }
  var isAdmin = function () { return me && me.role === 'admin'; };

  // ---------- العروض ----------
  function view(v) {
    ['login', 'pw', 'app'].forEach(function (k) { $('#v-' + k).hidden = k !== v; });
    $('#who').hidden = v === 'login';
    if (v === 'pw') { $('#f-pw').reset(); $('#pw-cancel').hidden = !!(me && me.mustChange); $('#pw-note').textContent = me && me.mustChange ? 'هذا أول دخول لك بكلمة مرور مؤقتة: اختر كلمة مرور جديدة لا تقل عن 10 أحرف وتحتوي على حروف وأرقام.' : 'اختر كلمة مرور جديدة لا تقل عن 10 أحرف وتحتوي على حروف وأرقام.'; }
  }
  function pane(p) {
    $$('.pane').forEach(function (x) { x.hidden = x.id !== 'p-' + p; });
    var tab = { 'news-edit': 'news', 'proj-edit': 'projects', 'proj-review': 'projects' }[p] || p;
    $$('#tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === tab); });
    window.scrollTo(0, 0);
  }
  function setMe(u) {
    me = u;
    $('#who-name').textContent = u.name + ' (' + u.username + ')';
    $('#who-role').textContent = u.role === 'admin' ? 'مدير' : 'محرر';
    $$('[data-admin]').forEach(function (x) { x.hidden = !isAdmin(); });
    $$('[data-admin-only]').forEach(function (x) { x.hidden = !isAdmin(); });
    $('#news-hint').textContent = isAdmin() ? 'بصفتك مديرًا: تنشر الأخبار مباشرة، وتعتمد أخبار المحررين أو ترفضها.' :
      'بصفتك محررًا: تُرسل أخبارك للاعتماد ولا تظهر في الموقع حتى يعتمدها مدير. تعديل خبر منشور يعيده للاعتماد.';
  }
  function enter(u) {
    setMe(u);
    if (u.mustChange) { view('pw'); return; }
    view('app'); pane('news'); loadNews();
  }
  function logoutLocal() { token = null; me = null; try { sessionStorage.removeItem(TK); } catch (e) {} view('login'); }

  // ---------- الدخول وكلمة المرور ----------
  $('#f-login').addEventListener('submit', function (e) {
    e.preventDefault(); var f = e.target;
    call('POST', '/api/login', { username: f.username.value.trim(), password: f.password.value }).then(function (r) {
      token = r.token; try { sessionStorage.setItem(TK, token); } catch (x) {}
      f.reset(); enter(r.user);
    }).catch(function () {});
  });
  $('#btn-out').addEventListener('click', function () { call('POST', '/api/logout').catch(function () {}).then(logoutLocal); });
  $('#btn-pw').addEventListener('click', function () { view('pw'); });
  $('#pw-cancel').addEventListener('click', function () { view('app'); });
  $('#f-pw').addEventListener('submit', function (e) {
    e.preventDefault(); var f = e.target;
    if (f.new.value !== f.new2.value) { say('كلمتا المرور الجديدتان غير متطابقتين.', true); return; }
    call('POST', '/api/password', { old: f.old.value, new: f.new.value }).then(function (r) { say('تم تغيير كلمة المرور.'); enter(r.user); }).catch(function () {});
  });
  $('#tabs').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var t = b.dataset.tab; pane(t);
    var fn = ({ news: loadNews, projects: loadProjects, users: loadUsers, log: loadLog })[t] || (window.TNS_TABS || {})[t];
    if (fn) fn();
  });
  $$('[data-back]').forEach(function (b) { b.addEventListener('click', function () { pane(b.dataset.back); }); });

  // ---------- حقول متعددة اللغات ----------
  function mlForm(form) {
    var st = { lang: 'ar', data: {} };
    var tabs = $('[data-ltabs]', form);
    function keep() { $$('[data-ml]', form).forEach(function (i) { (st.data[i.dataset.ml] = st.data[i.dataset.ml] || {})[st.lang] = i.value; }); }
    function show() {
      $$('[data-ml]', form).forEach(function (i) { i.value = (st.data[i.dataset.ml] || {})[st.lang] || ''; i.dir = st.lang === 'en' ? 'ltr' : 'rtl'; });
      $$('button', tabs).forEach(function (b) {
        b.classList.toggle('on', b.dataset.l === st.lang);
        var l = b.dataset.l; b.classList.toggle('filled', Object.keys(st.data).some(function (k) { return st.data[k] && st.data[k][l]; }));
      });
      if (st.onLang) st.onLang();
    }
    tabs.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; keep(); st.lang = b.dataset.l; show(); });
    st.set = function (data) { st.data = JSON.parse(JSON.stringify(data || {})); st.lang = 'ar'; show(); };
    st.get = function () { keep(); return st.data; };
    return st;
  }
  function fillSelect(sel, opts) { sel.innerHTML = opts.map(function (o) { return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>'; }).join(''); }
  $$('[data-scenes]').forEach(function (s) { fillSelect(s, Object.keys(SCENES).map(function (k) { return [k, SCENES[k]]; })); });
  $$('[data-icons]').forEach(function (s) { fillSelect(s, Object.keys(ICON_NAMES).map(function (k) { return [k, ICON_NAMES[k]]; })); });
  $$('[data-kits]').forEach(function (s) {
    fillSelect(s, [['', 'بدون حقيبة']].concat((window.TNS_KITS || []).map(function (k) { return [k[0], k[1]]; })).concat([['url', 'رابط خارجي…']]));
    s.addEventListener('change', function () { $('[data-kiturl]').hidden = s.value !== 'url'; });
  });

  // ---------- الصور: تصغير في المتصفح ثم رفع ----------
  function shrink(file) {
    return new Promise(function (ok, bad) {
      if (!/^image\//.test(file.type)) return bad({ error: 'type' });
      var img = new Image(), u = URL.createObjectURL(file);
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight, max = 1600;
        if (w > max) { h = Math.round(h * max / w); w = max; }
        var c = document.createElement('canvas'); c.width = w; c.height = h;
        var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(u);
        var q = 0.85, d = c.toDataURL('image/jpeg', q);
        while (d.length * 0.75 > 1.3 * 1024 * 1024 && q > 0.4) { q -= 0.1; d = c.toDataURL('image/jpeg', q); }
        ok(d);
      };
      img.onerror = function () { bad({ error: 'image' }); };
      img.src = u;
    });
  }
  function imagePicker(fileSel, prevSel, noSel, getScene) {
    var st = { id: '' };
    function prev() { $(prevSel).style.backgroundImage = 'url("' + (st.id ? API + '/img/' + st.id : 'assets/img/scenes/' + getScene() + '.svg') + '")'; }
    $(fileSel).addEventListener('change', function (e) {
      var f = e.target.files[0]; if (!f) return;
      say('جارٍ رفع الصورة…');
      shrink(f).then(function (d) { return call('POST', '/api/admin/upload', { data: d }); })
        .then(function (r) { st.id = r.id; prev(); say('رُفعت الصورة.'); })
        .catch(function (x) { if (x && x.error && !ERR[x.error]) say(ERR.image, true); })
        .then(function () { e.target.value = ''; });
    });
    $(noSel).addEventListener('click', function () { st.id = ''; prev(); });
    st.set = function (id) { st.id = id || ''; prev(); };
    st.prev = prev;
    return st;
  }

  // ---------- الأخبار ----------
  var fN = $('#f-news'), nML = mlForm(fN), nImg = imagePicker('#ne-file', '#ne-prev', '#ne-noimg', function () { return fN.scene.value; }), nEdit = null, nFilter = '';
  fN.scene.addEventListener('change', function () { nImg.prev(); });
  function loadNews() {
    return call('GET', '/api/admin/news').then(function (r) { NEWS = r.news; renderNews(); }).catch(function () {});
  }
  function renderNews() {
    var pend = NEWS.filter(function (n) { return n.status === 'pending'; }).length;
    var c = $('#pending-cnt'); c.hidden = !(isAdmin() && pend); c.textContent = pend;
    var list = NEWS.filter(function (n) { return !nFilter || n.status === nFilter; });
    $('#news-list').innerHTML = list.length ? list.map(function (n) {
      var s = ST[n.status] || ST.draft, mine = n.createdBy === me.username;
      var acts = '';
      if (isAdmin() || mine) acts += '<button data-a="edit">تعديل</button>';
      if (isAdmin() && n.status !== 'published') acts += '<button class="go" data-a="publish">' + (n.status === 'pending' ? 'اعتماد ونشر' : 'نشر') + '</button>';
      if (isAdmin() && n.status === 'published') acts += '<button data-a="unpublish">إيقاف النشر</button>';
      if (isAdmin() && n.status === 'pending') acts += '<button data-a="reject">إرجاع كمسودة</button>';
      if (isAdmin() || (mine && n.status !== 'published')) acts += '<button class="danger" data-a="del">حذف</button>';
      return '<div class="item" data-id="' + esc(n.id) + '"><div class="th" style="background-image:url(\'' + esc(thumb(n)) + '\')"></div><div><h4>' + esc(n.title.ar) + '</h4>' +
        '<div class="meta"><span class="badge ' + s[1] + '">' + s[0] + '</span><span>' + esc(fmt(n.date)) + '</span>' + (n.ticker !== false ? '<span>· في الشريط الإخباري</span>' : '') +
        '<span>· أضافه ' + esc(n.createdBy) + (n.updatedBy && n.updatedBy !== n.createdBy ? '، عدّله ' + esc(n.updatedBy) : '') + '</span>' +
        (n.title.en || n.title.ur ? '<span>· ' + [n.title.en ? 'EN' : '', n.title.ur ? 'UR' : ''].filter(Boolean).join(' ') + '</span>' : '') + '</div></div>' +
        '<div class="acts">' + acts + '</div></div>';
    }).join('') : '<p class="muted">لا توجد أخبار في هذا التصنيف.</p>';
  }
  $('#news-filter').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    $$('#news-filter button').forEach(function (x) { x.classList.toggle('on', x === b); }); nFilter = b.dataset.f; renderNews();
  });
  function payloadNews(status) {
    return { title: nML.get().title, summary: nML.get().summary, body: nML.get().body, date: fN.date.value, ticker: fN.ticker.checked,
             image: nImg.id, scene: fN.scene.value, status: status };
  }
  function newsSave(status) {
    var p = payloadNews(status);
    if (!p.title || !p.title.ar) { say(ERR.title, true); return; }
    (nEdit ? call('PUT', '/api/admin/news/' + nEdit.id, p) : call('POST', '/api/admin/news', p)).then(function (r) {
      var st = r.item.status;
      say(st === 'published' ? 'حُفظ الخبر ونُشر في الموقع.' : st === 'pending' ? 'حُفظ الخبر وأُرسل للاعتماد.' : 'حُفظ الخبر كمسودة.');
      pane('news'); loadNews();
    }).catch(function () {});
  }
  function openNews(n) {
    nEdit = n || null;
    $('#ne-title').textContent = n ? 'تعديل خبر' : 'إضافة خبر';
    fN.reset();
    nML.set(n ? { title: n.title, summary: n.summary, body: n.body } : {});
    fN.date.value = n ? n.date : new Date().toISOString().slice(0, 10);
    fN.ticker.checked = n ? n.ticker !== false : true;
    fN.scene.value = n && n.scene ? n.scene : 'haram';
    fN.status.value = n ? n.status : 'published';
    nImg.set(n ? n.image : '');
    var save = $('[data-save]', fN), draft = $('[data-draft]', fN);
    save.textContent = isAdmin() ? 'حفظ' : 'إرسال للاعتماد'; draft.hidden = isAdmin();
    pane('news-edit');
  }
  $('#news-add').addEventListener('click', function () { openNews(null); });
  fN.addEventListener('submit', function (e) { e.preventDefault(); newsSave(isAdmin() ? fN.status.value : 'pending'); });
  $('[data-draft]', fN).addEventListener('click', function () { newsSave('draft'); });
  $('#news-list').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-a]'); if (!b) return;
    var id = b.closest('.item').dataset.id, n = NEWS.filter(function (x) { return x.id === id; })[0]; if (!n) return;
    var a = b.dataset.a;
    if (a === 'edit') return openNews(n);
    if (a === 'del') { if (!confirm('حذف الخبر «' + n.title.ar + '» نهائيًا؟')) return; return call('DELETE', '/api/admin/news/' + id).then(function () { say('حُذف الخبر.'); loadNews(); }).catch(function () {}); }
    var st = { publish: 'published', unpublish: 'draft', reject: 'draft' }[a];
    var body = { title: n.title, summary: n.summary, body: n.body, date: n.date, ticker: n.ticker, image: n.image, scene: n.scene, status: st };
    call('PUT', '/api/admin/news/' + id, body).then(function () { say(st === 'published' ? 'نُشر الخبر في الموقع.' : 'أُوقف نشر الخبر.'); loadNews(); }).catch(function () {});
  });

  // ---------- المشاريع ----------
  var fP = $('#f-proj'), pML = mlForm(fP), pImg = imagePicker('#pe-file', '#pe-prev', '#pe-noimg', function () { return fP.scene.value; }), pEdit = null, SVC = [];
  fP.scene.addEventListener('change', function () { pImg.prev(); });
  function renderSvc() {
    var l = pML.lang;
    $('#svc-rows').innerHTML = SVC.map(function (s, i) {
      return '<div class="svc-row" data-i="' + i + '"><label>الأيقونة<select data-k="icon">' + Object.keys(ICON_NAMES).map(function (k) { return '<option value="' + k + '"' + (s.icon === k ? ' selected' : '') + '>' + ICON_NAMES[k] + '</option>'; }).join('') + '</select></label>' +
        '<label>الخدمة<input data-k="title" value="' + esc((s.title || {})[l] || '') + '" maxlength="80"' + (l === 'en' ? ' dir="ltr"' : '') + '></label>' +
        '<label>الوصف<input data-k="text" value="' + esc((s.text || {})[l] || '') + '" maxlength="200"' + (l === 'en' ? ' dir="ltr"' : '') + '></label>' +
        '<button type="button" class="lnk" data-del>حذف</button></div>';
    }).join('');
  }
  pML.onLang = renderSvc;
  $('#svc-rows').addEventListener('input', function (e) {
    var row = e.target.closest('.svc-row'); if (!row) return; var s = SVC[+row.dataset.i], k = e.target.dataset.k;
    if (k === 'icon') s.icon = e.target.value; else { s[k] = s[k] || {}; s[k][pML.lang] = e.target.value; }
  });
  $('#svc-rows').addEventListener('change', function (e) { if (e.target.dataset.k === 'icon') { var row = e.target.closest('.svc-row'); SVC[+row.dataset.i].icon = e.target.value; } });
  $('#svc-rows').addEventListener('click', function (e) { if (!e.target.closest('[data-del]')) return; SVC.splice(+e.target.closest('.svc-row').dataset.i, 1); renderSvc(); });
  $('#svc-add').addEventListener('click', function () { SVC.push({ icon: 'check', title: {}, text: {} }); renderSvc(); });

  var num = function (n) { return Number(n || 0).toLocaleString('en-US'); };
  var PST = { approved: ['معتمد', 'green'], pending: ['بانتظار الاعتماد', 'amber'], draft: ['مسودة', 'gray'], rejected: ['مرفوض', 'red'] }, PF = '';
  function loadProjects() { return call('GET', '/api/admin/projects').then(function (r) { PROJ = r.projects; renderProjects(); }).catch(function () {}); }
  function canEdit(p) { return isAdmin() || (p.createdBy === me.username && p.status !== 'approved'); }
  function renderProjects() {
    var pend = PROJ.filter(function (p) { return p.status === 'pending'; }).length;
    var c = $('#proj-pending-cnt'); c.hidden = !(isAdmin() && pend); c.textContent = pend;
    $('#proj-hint').textContent = isAdmin() ? 'بصفتك مديرًا: تعتمد المشاريع أو ترجعها أو ترفضها، وتحدد عند الاعتماد هل يُنشر المشروع في المتجر وتستكمل بياناته. ترتيب المشاريع المعتمدة هو ترتيب ظهورها في الموقع.' :
      'بصفتك محررًا: تضيف المشاريع وترسلها للاعتماد، ولا تظهر في الموقع حتى يعتمدها مدير. تعديل مشروعك قبل اعتماده يعيده للاعتماد.';
    var F = [['', 'الكل'], ['pending', 'بانتظار الاعتماد'], ['approved', 'معتمد'], ['draft', 'مسودة'], ['rejected', 'مرفوض']];
    $('#proj-filter').innerHTML = F.map(function (f) { var n = f[0] ? PROJ.filter(function (p) { return p.status === f[0]; }).length : PROJ.length;
      return '<button type="button" data-f="' + f[0] + '" class="' + (PF === f[0] ? 'on' : '') + '">' + f[1] + ' <small>' + n + '</small></button>'; }).join('');
    var list = PROJ.filter(function (p) { return !PF || p.status === PF; });
    $('#proj-list').innerHTML = list.length ? list.map(function (p) {
      var i = PROJ.indexOf(p), st = PST[p.status] || PST.approved, s = p.store || {}, acts = '';
      if (isAdmin() && p.status !== 'approved') acts += '<button class="go" data-a="review">مراجعة واعتماد</button>';
      if (isAdmin() && p.status === 'approved') acts += '<button data-a="review">بيانات المتجر</button><button data-a="toggle">' + (p.published ? 'إخفاء' : 'إظهار') + '</button>';
      if (canEdit(p)) acts += '<button data-a="edit">تعديل</button><button class="danger" data-a="del">حذف</button>';
      if (!acts) acts = '<span class="muted small">عرض فقط</span>';
      var meta = '<span class="badge ' + st[1] + '">' + st[0] + '</span>';
      if (p.status === 'approved') meta += '<span class="badge ' + (p.published ? 'green' : 'gray') + '">' + (p.published ? 'معروض' : 'مخفي') + '</span>';
      if (p.status === 'approved' && s.on) meta += '<span class="badge gold">' + (s.kind === 'waqf' ? 'في المتجر · وقفي' : 'في المتجر') + '</span><span>' + (s.goal ? 'المستهدف ' + num(s.goal) + ' ريال' : 'دون مستهدف') + ' · ' + (s.min ? 'الحد الأدنى ' + num(s.min) + ' ريال' : 'الحد الأدنى العام') + '</span>';
      else if (p.status === 'approved') meta += '<span class="badge gray">خارج المتجر</span>';
      if (p.review && p.review.note && p.status !== 'approved') meta += '<span class="rnote">ملاحظة المدير: ' + esc(p.review.note) + '</span>';
      return '<div class="item" data-id="' + esc(p.id) + '"><div class="th" style="background-image:url(\'' + esc(thumb(p)) + '\')"></div><div><h4>' + icon(p.icon, 20) + ' ' + esc(p.name.ar) + '</h4>' +
        '<div class="meta">' + meta + '<span dir="ltr">#' + esc(p.id) + '</span>' + (p.createdBy && p.createdBy !== 'system' ? '<span>· أعدّه ' + esc(p.createdBy) + '</span>' : '') + '</div></div>' +
        '<div class="acts">' + (isAdmin() && !PF ? '<span class="ord"><button data-a="up" title="أعلى" ' + (i ? '' : 'disabled') + '>▲</button><button data-a="down" title="أسفل" ' + (i < PROJ.length - 1 ? '' : 'disabled') + '>▼</button></span>' : '') + acts + '</div></div>';
    }).join('') : '<p class="muted">لا توجد مشاريع في هذا التصنيف.</p>';
  }
  $('#proj-filter').addEventListener('click', function (e) { var b = e.target.closest('[data-f]'); if (!b) return; PF = b.dataset.f; renderProjects(); });
  function projPayload(p, over) {
    var d = p || {};
    return Object.assign({ name: d.name, tag: d.tag, summary: d.summary, about: d.about, audience: d.audience, when: d.when, slogan: d.slogan, points: d.points, tags: d.tags,
      icon: d.icon, scene: d.scene, image: d.image, kit: d.kit, services: d.services }, over || {});
  }
  function openProj(p) {
    pEdit = p || null;
    $('#pe-title').textContent = p ? 'تعديل مشروع' : 'إضافة مشروع';
    fP.reset();
    fP.id.value = p ? p.id : ''; fP.id.disabled = !!p;
    pML.set(p ? { name: p.name, tag: p.tag, summary: p.summary, about: p.about, audience: p.audience, when: p.when, slogan: p.slogan, points: p.points, tags: p.tags } : {});
    fP.icon.value = p ? p.icon : 'kaaba'; fP.scene.value = p ? p.scene : 'haram';
    var kits = (window.TNS_KITS || []).map(function (k) { return k[0]; });
    var kit = p ? p.kit : '';
    fP.kitsel.value = !kit ? '' : kits.indexOf(kit) >= 0 ? kit : 'url'; fP.kiturl.value = fP.kitsel.value === 'url' ? kit : '';
    $('[data-kiturl]').hidden = fP.kitsel.value !== 'url';
    var appr = isAdmin() && p && p.status === 'approved';
    $('#pe-send').textContent = appr ? 'حفظ التعديلات' : 'حفظ وإرسال للاعتماد'; $('#pe-draft').hidden = appr;
    $('#pe-note').textContent = appr ? 'المشروع معتمد، وتُحفظ تعديلاته مباشرة. لتغيير بيانات المتجر استخدم زر «بيانات المتجر» في القائمة.' :
      'يُحفظ المشروع ثم يُرسل للاعتماد. يحدد المدير عند الاعتماد هل يُنشر في المتجر، ويستكمل بياناته: المستهدف وحدود التبرع.';
    SVC = p ? JSON.parse(JSON.stringify(p.services || [])) : [];
    pImg.set(p ? p.image : ''); renderSvc();
    pane('proj-edit');
  }
  $('#proj-add').addEventListener('click', function () { openProj(null); });
  fP.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = pML.get(), st = e.submitter && e.submitter.value === 'draft' ? 'draft' : 'pending';
    if (!d.name || !d.name.ar) { say(ERR.name, true); return; }
    var body = projPayload(Object.assign({}, d, { icon: fP.icon.value, scene: fP.scene.value, image: pImg.id, status: st,
      kit: fP.kitsel.value === 'url' ? fP.kiturl.value.trim() : fP.kitsel.value, services: SVC.filter(function (s) { return s.title && s.title.ar; }) }));
    if (!pEdit) body.id = fP.id.value.trim();
    (pEdit ? call('PUT', '/api/admin/projects/' + pEdit.id, body) : call('POST', '/api/admin/projects', body)).then(function (r) {
      var s2 = r.item && r.item.status;
      say(s2 === 'approved' ? 'حُفظت تعديلات المشروع.' : s2 === 'pending' ? 'حُفظ المشروع وأُرسل للاعتماد.' : 'حُفظ المشروع كمسودة.'); pane('projects'); loadProjects();
    }).catch(function () {});
  });

  // ---------- اعتماد المشروع وبيانات المتجر ----------
  var fR = $('#f-review'), rEdit = null, GMIN = 20;
  function decSync() {
    var dec = fR.decision.value, on = fR.on.value === '1';
    $$('[data-when=approve]', fR).forEach(function (x) { x.hidden = dec !== 'approve'; });
    $('[data-when=note]', fR).hidden = dec === 'approve';
    $('[data-store]', fR).hidden = !on;
    $('#pr-go').textContent = dec === 'approve' ? (rEdit && rEdit.status === 'approved' ? 'حفظ' : 'اعتماد المشروع') : dec === 'return' ? 'إرجاع للتعديل' : 'رفض المشروع';
    $$('#pr-dec label, #pr-store label').forEach(function (l) { l.classList.toggle('on', l.querySelector('input').checked); });
  }
  fR.addEventListener('change', decSync);
  function openReview(p) {
    rEdit = p; fR.reset();
    var s = p.store || {}, appr = p.status === 'approved';
    $('#pr-title').textContent = appr ? 'بيانات المتجر: ' + p.name.ar : 'اعتماد مشروع: ' + p.name.ar;
    $('#pr-dec').hidden = appr;
    $('#pr-sum').innerHTML = '<div class="th" style="background-image:url(\'' + esc(thumb(p)) + '\')"></div><div><h3>' + icon(p.icon, 22) + ' ' + esc(p.name.ar) + '</h3><p>' + esc(p.summary.ar || p.tag.ar || '') + '</p>' +
      '<div class="meta"><span class="badge ' + (PST[p.status] || PST.approved)[1] + '">' + (PST[p.status] || PST.approved)[0] + '</span>' +
      (p.createdBy ? '<span>أعدّه: ' + esc(p.createdBy) + '</span>' : '') + (p.updatedAt ? '<span>آخر تعديل: ' + esc(fmtTime(p.updatedAt)) + '</span>' : '') +
      (p.kit ? '<a href="' + esc(/^https:/.test(p.kit) ? p.kit : p.kit) + '" target="_blank" rel="noopener">الحقيبة التعريفية</a>' : '') + '</div>' +
      (p.review && p.review.note ? '<p class="rnote">آخر ملاحظة: ' + esc(p.review.note) + '</p>' : '') + '</div>';
    fR.published.checked = appr ? p.published !== false : true;
    fR.on.value = s.on && (appr || s.goal) ? '1' : '0';
    fR.kind.value = s.kind || 'project'; fR.goal.value = s.goal || ''; fR.end.value = s.end || '';
    fR.max.value = s.max || ''; fR.presets.value = (s.presets || []).join(', ');
    fR.stop.checked = !!s.stop; fR.monthly.checked = s.monthly !== false; fR.gift.checked = s.gift !== false;
    call('GET', '/api/admin/settings').then(function (r) {
      GMIN = (r.settings && r.settings.donations && r.settings.donations.min) || r.donations && r.donations.min || 20;
    }).catch(function () {}).then(function () {
  if (window.top !== window.self) { try { window.top.location = window.self.location.href; } catch (e) { document.documentElement.innerHTML = ''; } return; }
      fR.min.min = GMIN; fR.min.value = s.min || GMIN;
      $('#pr-minnote').textContent = 'الحد الأدنى العام في الإعدادات ' + num(GMIN) + ' ريال، ولا يقل حد المشروع عنه. اترك المبالغ السريعة فارغة لاستخدام المبالغ العامة.';
    });
    decSync(); pane('proj-review');
  }
  fR.addEventListener('submit', function (e) {
    e.preventDefault();
    var dec = fR.decision.value, on = fR.on.value === '1';
    var body = { decision: dec, note: fR.note.value.trim(), published: fR.published.checked,
      store: { on: on, kind: fR.kind.value, goal: Number(fR.goal.value) || 0, min: Number(fR.min.value) || 0, max: Number(fR.max.value) || 0, end: fR.end.value,
        presets: fR.presets.value.split(/[,،\s]+/).map(Number).filter(function (v) { return v > 0; }), stop: fR.stop.checked, monthly: fR.monthly.checked, gift: fR.gift.checked } };
    if (dec !== 'approve' && !body.note) return say(ERR.note, true);
    if (dec === 'approve' && on) {
      if (!(body.store.goal > 0)) { fR.goal.focus(); return say(ERR.goal, true); }
      if (body.store.min < GMIN) { fR.min.focus(); return say(ERR.min, true); }
      if (body.store.max && body.store.max < body.store.min) { fR.max.focus(); return say(ERR.max, true); }
    }
    call('POST', '/api/admin/projects/' + rEdit.id + '/review', body).then(function (r) {
      var it = r.item;
      say(dec === 'approve' ? (rEdit.status === 'approved' ? 'حُفظت بيانات المتجر.' : 'اعتُمد المشروع' + (it.store.on ? ' ونُشر في المتجر.' : '، ولن يظهر في المتجر.')) : dec === 'return' ? 'أُرجع المشروع لمُعدّه للتعديل.' : 'رُفض المشروع.');
      pane('projects'); loadProjects();
    }).catch(function () {});
  });
  $('#proj-list').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-a]'); if (!b) return;
    var id = b.closest('.item').dataset.id, i = PROJ.findIndex(function (x) { return x.id === id; }), p = PROJ[i]; if (!p) return;
    var a = b.dataset.a;
    if (a === 'edit') return openProj(p);
    if (a === 'del') { if (!confirm('حذف المشروع «' + p.name.ar + '» نهائيًا من الموقع؟')) return; return call('DELETE', '/api/admin/projects/' + id).then(function () { say('حُذف المشروع.'); loadProjects(); }).catch(function () {}); }
    if (a === 'review') return openReview(p);
    if (a === 'toggle') return call('POST', '/api/admin/projects/' + id + '/visibility', { published: !p.published }).then(function () { say(p.published ? 'أُخفي المشروع من الموقع.' : 'أصبح المشروع معروضًا.'); loadProjects(); }).catch(function () {});
    if (a === 'up' || a === 'down') {
      var j = a === 'up' ? i - 1 : i + 1; if (j < 0 || j >= PROJ.length) return;
      var ids = PROJ.map(function (x) { return x.id; }); ids[i] = PROJ[j].id; ids[j] = id;
      call('POST', '/api/admin/projects/order', { ids: ids }).then(loadProjects).catch(function () {});
    }
  });

  // ---------- المستخدمون ----------
  var fU = $('#f-user'), uEdit = null;
  function loadUsers() { return call('GET', '/api/admin/users').then(function (r) { USERS = r.users; renderUsers(); }).catch(function () {}); }
  function renderUsers() {
    $('#user-list').innerHTML = USERS.map(function (u) {
      return '<div class="item simple" data-u="' + esc(u.username) + '"><div><h4>' + esc(u.name) + ' <span class="muted small" dir="ltr">(' + esc(u.username) + ')</span></h4><div class="meta">' +
        '<span class="badge ' + (u.role === 'admin' ? '' : 'gray') + '">' + (u.role === 'admin' ? 'مدير' : 'محرر') + '</span>' +
        (u.active ? '' : '<span class="badge red">معطّل</span>') + (u.mustChange ? '<span>· لم يغيّر كلمة المرور المؤقتة</span>' : '') +
        '<span>· آخر دخول: ' + (u.lastLogin ? esc(fmtTime(u.lastLogin)) : 'لم يدخل بعد') + '</span></div></div>' +
        '<div class="acts"><button data-a="edit">تعديل</button>' + (u.username !== me.username ? '<button class="danger" data-a="del">حذف</button>' : '') + '</div></div>';
    }).join('');
  }
  function genPw() {
    var c = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ', d = '23456789', a = new Uint32Array(10); crypto.getRandomValues(a);
    var s = ''; for (var i = 0; i < 10; i++) s += (i % 3 === 2 ? d : c)[a[i] % (i % 3 === 2 ? d : c).length]; return s;
  }
  $('#gen-pw').addEventListener('click', function () { fU.password.value = genPw(); });
  function openUser(u) {
    uEdit = u || null; fU.reset(); fU.hidden = false;
    $('#fu-title').textContent = u ? 'تعديل المستخدم ' + u.username : 'مستخدم جديد';
    fU.username.value = u ? u.username : ''; fU.username.disabled = !!u;
    fU.name.value = u ? u.name : ''; fU.role.value = u ? u.role : 'editor'; fU.active.checked = u ? u.active : true;
    fU.password.required = !u; fU.password.placeholder = u ? 'اتركها فارغة لعدم التغيير' : '';
    if (!u) fU.password.value = genPw();
    $$('[data-edit-only]', fU).forEach(function (x) { x.hidden = !u; });
    fU.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  $('#user-add').addEventListener('click', function () { openUser(null); });
  $('#fu-cancel').addEventListener('click', function () { fU.hidden = true; });
  fU.addEventListener('submit', function (e) {
    e.preventDefault();
    var pw = fU.password.value.trim();
    var body = { name: fU.name.value.trim(), role: fU.role.value, active: fU.active.checked };
    if (pw) body.password = pw;
    var req = uEdit ? call('PUT', '/api/admin/users/' + uEdit.username, body) : call('POST', '/api/admin/users', Object.assign(body, { username: fU.username.value.trim().toLowerCase() }));
    req.then(function () { say(pw ? 'حُفظ المستخدم. كلمة المرور المؤقتة: ' + pw : 'حُفظ المستخدم.'); fU.hidden = true; loadUsers(); }).catch(function () {});
  });
  $('#user-list').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-a]'); if (!b) return;
    var un = b.closest('.item').dataset.u, u = USERS.filter(function (x) { return x.username === un; })[0];
    if (b.dataset.a === 'edit') return openUser(u);
    if (b.dataset.a === 'del' && confirm('حذف المستخدم ' + un + '؟')) call('DELETE', '/api/admin/users/' + un).then(function () { say('حُذف المستخدم.'); loadUsers(); }).catch(function () {});
  });

  // ---------- السجل ----------
  function loadLog() {
    return call('GET', '/api/admin/log').then(function (r) {
      $('#log-list').innerHTML = r.log.length ? '<table class="log"><thead><tr><th>الوقت</th><th>المستخدم</th><th>الإجراء</th><th>العنصر</th></tr></thead><tbody>' +
        r.log.map(function (l) { return '<tr><td>' + esc(fmtTime(l.at)) + '</td><td dir="ltr">' + esc(l.user) + '</td><td>' + esc(l.action) + '</td><td>' + esc(l.target) + '</td></tr>'; }).join('') + '</tbody></table>' : '<p class="muted">لا يوجد نشاط بعد.</p>';
    }).catch(function () {});
  }

  // ---------- shared with admin-store.js ----------
  window.TNS_ADM = { call: call, say: say, pane: pane, esc: esc, fmt: fmt, fmtTime: fmtTime, API: API, isAdmin: function () { return isAdmin(); }, projects: function () { return PROJ; }, loadProjects: loadProjects };

  // ---------- البداية ----------
  if (!API) { view('login'); say('لم يُضبط رابط الوسيط في assets/js/chat-config.js.', true); return; }
  if (token) call('GET', '/api/me').then(function (r) { enter(r.user); }).catch(function () { logoutLocal(); });
  else view('login');
})();
