// مساعد المحادثة الذكي لجمعية تيسير النسك (يعمل عبر وسيط Cloudflare يحفظ مفتاح الواجهة البرمجية)
(function () {
  var URL_ = window.TNS_CHAT_URL;
  if (!URL_) return; // لا تظهر النافذة قبل ربط الوسيط
  var L = document.documentElement.lang || 'ar';
  var T = {
    ar: { open: 'اسأل مُيسِّر', title: 'مُيسِّر · المساعد الذكي', hello: 'السلام عليكم ومرحبًا بك! أنا «مُيسِّر»، المساعد الذكي لجمعية تيسير النسك. اسألني عن برامج الجمعية، أو التطوع، أو الشراكات، أو الحوكمة.', ph: 'اكتب سؤالك هنا...', send: 'إرسال', note: 'مساعد آلي قد يخطئ، وللتأكيد تواصل مع الجمعية على 0546684628. لا تُدخل بيانات شخصية.', err: 'تعذّر الاتصال الآن، حاول بعد قليل أو تواصل معنا على 0546684628.', typing: 'يكتب...', clear: 'محادثة جديدة', close: 'إغلاق' },
    en: { open: 'Ask Muyassir', title: 'Muyassir · Smart assistant', hello: 'Peace be upon you, and welcome! I am Muyassir, the smart assistant of Tayseer Al-Nusuk. Ask me about our programs, volunteering, partnerships or governance.', ph: 'Type your question...', send: 'Send', note: 'An automated assistant that may make mistakes. To confirm, call the association on 0546684628. Please do not enter personal data.', err: 'Could not connect right now. Please try again shortly or call us on 0546684628.', typing: 'Typing...', clear: 'New chat', close: 'Close' },
    ur: { open: 'مُیسِّر سے پوچھیں', title: 'مُیسِّر · اسمارٹ مددگار', hello: 'السلام علیکم اور خوش آمدید! میں «مُیسِّر» ہوں، تیسیر النسک کا اسمارٹ مددگار۔ تنظیم کے پروگراموں، رضاکاری، شراکت یا گورننس کے بارے میں پوچھیں۔', ph: 'اپنا سوال یہاں لکھیں...', send: 'بھیجیں', note: 'یہ خودکار مددگار ہے جو غلطی کر سکتا ہے، تصدیق کے لیے 0546684628 پر رابطہ کریں۔ ذاتی معلومات درج نہ کریں۔', err: 'ابھی رابطہ نہیں ہو سکا، تھوڑی دیر بعد کوشش کریں یا 0546684628 پر رابطہ کریں۔', typing: 'لکھ رہا ہے...', clear: 'نئی گفتگو', close: 'بند کریں' }
  }[L] || null;
  var KEY = 'tns-chat-' + L, hist = [];
  try { hist = JSON.parse(sessionStorage.getItem(KEY) || '[]'); } catch (e) { hist = []; }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(hist.slice(-20))); } catch (e) {} }

  var ico = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/></svg>';
  var AV = ((document.currentScript && document.currentScript.src) || '').replace(/js\/chat\.js.*$/, 'img/muyassir.svg');
  var av = function (c) { return '<img class="' + c + '" src="' + AV + '" alt="" aria-hidden="true">'; };
  var btn = document.createElement('button');
  btn.className = 'tchat-btn'; btn.type = 'button'; btn.setAttribute('aria-label', T.open);
  btn.innerHTML = (AV ? av('tc-av') : ico) + '<span>' + T.open + '</span>';
  var box = document.createElement('div');
  box.className = 'tchat'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', T.title);
  box.innerHTML = '<div class="tc-head"><b>' + (AV ? av('tc-hav') : '') + T.title + '</b><span><button type="button" class="tc-new">' + T.clear + '</button><button type="button" class="tc-x" aria-label="' + T.close + '">×</button></span></div>' +
    '<div class="tc-log" aria-live="polite"></div><p class="tc-note">' + T.note + '</p>' +
    '<form><textarea rows="1" maxlength="800" placeholder="' + T.ph + '" aria-label="' + T.ph + '"></textarea><button type="submit">' + T.send + '</button></form>';
  document.body.appendChild(btn); document.body.appendChild(box);
  var log = box.querySelector('.tc-log'), form = box.querySelector('form'), ta = box.querySelector('textarea');

  function bubble(role, text) {
    var d = document.createElement('div'); d.className = 'tc-m ' + (role === 'user' ? 'u' : 'a');
    d.textContent = text; if (role !== 'user' && AV) d.insertAdjacentHTML('afterbegin', av('tc-mav')); log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  }
  function render() { log.innerHTML = ''; bubble('assistant', T.hello); hist.forEach(function (m) { bubble(m.role, m.content); }); }
  render();
  btn.addEventListener('click', function () { box.hidden = !box.hidden; btn.classList.toggle('on', !box.hidden); if (!box.hidden) ta.focus(); });
  box.querySelector('.tc-x').addEventListener('click', function () { box.hidden = true; btn.classList.remove('on'); });
  box.querySelector('.tc-new').addEventListener('click', function () { hist = []; save(); render(); });
  ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });

  var busy = false;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = ta.value.trim(); if (!q || busy) return;
    busy = true; ta.value = '';
    hist.push({ role: 'user', content: q }); bubble('user', q);
    var wait = bubble('assistant', T.typing); wait.classList.add('wait');
    fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang: L, messages: hist.slice(-12) }) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.reply) throw new Error(j.error || r.status); return j.reply; }); })
      .then(function (reply) { wait.remove(); hist.push({ role: 'assistant', content: reply }); bubble('assistant', reply); save(); })
      .catch(function () { wait.remove(); hist.pop(); save(); bubble('assistant', T.err); })
      .then(function () { busy = false; });
  });
})();
