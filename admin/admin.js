/* HOCC website admin panel. Saves changes to the website's GitHub repository. */
(function () {
  'use strict';
  var CFG = window.HOCC_ADMIN_CONFIG, SCHEMA = window.HOCC_SCHEMA;
  var API = 'https://api.github.com/repos/' + CFG.owner + '/' + CFG.repo + '/contents/';
  var app = document.getElementById('app');
  var S = { token: null, email: null, data: null, sha: null, work: null, section: null, dirty: false };

  /* ---------- small helpers ---------- */
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c != null && c !== false) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function getPath(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function b64ToBytes(b) { var s = atob(b.replace(/\s/g, '')); var u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
  function bytesToB64(u) { var s = ''; for (var i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
  function textToB64(t) { return bytesToB64(new TextEncoder().encode(t)); }
  function b64ToText(b) { return new TextDecoder().decode(b64ToBytes(b)); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function siteUrl(p) { return p && !/^https?:/i.test(p) ? '../' + p : p; }
  function toast(msg, kind) {
    var t = h('div', { class: 'toast ' + (kind || 'ok'), role: 'status' }, [msg]);
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('gone'); }, kind === 'err' ? 7000 : 4500);
    setTimeout(function () { t.remove(); }, kind === 'err' ? 7600 : 5100);
  }
  function confirmBox(msg, yes) {
    return new Promise(function (res) {
      var m = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' }, [h('div', { class: 'modal-card' }, [
        h('p', { class: 'big', text: msg }),
        h('div', { class: 'row-btns' }, [
          h('button', { class: 'btn danger', type: 'button', onclick: function () { m.remove(); res(true); } }, [yes || 'Yes']),
          h('button', { class: 'btn plain', type: 'button', onclick: function () { m.remove(); res(false); } }, ['No, go back'])])])]);
      document.body.appendChild(m);
      m.querySelector('.plain').focus();
    });
  }

  /* ---------- encryption (same format as tools/make-login.mjs) ---------- */
  var ITER = 600000;
  function deriveKey(password, salt) {
    return crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']).then(function (base) {
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    });
  }
  function encryptToken(token, password) {
    var salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    return deriveKey(password, salt).then(function (key) {
      return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(token));
    }).then(function (ct) { return { salt: bytesToB64(salt), iv: bytesToB64(iv), data: bytesToB64(new Uint8Array(ct)) }; });
  }
  function decryptToken(entry, password) {
    return deriveKey(password, b64ToBytes(entry.salt)).then(function (key) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(entry.iv) }, key, b64ToBytes(entry.data));
    }).then(function (pt) { return new TextDecoder().decode(pt); });
  }

  /* ---------- GitHub ---------- */
  function gh(path, opts) {
    opts = opts || {};
    return fetch(API + path.split('/').map(encodeURIComponent).join('/') + (opts.method ? '' : '?ref=' + CFG.branch + '&t=' + Date.now()), {
      method: opts.method || 'GET', cache: 'no-store',
      headers: { 'Authorization': 'Bearer ' + S.token, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (r) {
      if (r.status === 404 && !opts.method) return null;
      if (!r.ok) { var e = new Error('GitHub ' + r.status); e.status = r.status; throw e; }
      return r.json();
    });
  }
  function readJson(path) {
    return gh(path).then(function (f) { return f ? { sha: f.sha, json: JSON.parse(b64ToText(f.content)) } : null; });
  }
  function writeFile(path, b64, message, sha) {
    var body = { message: message, content: b64, branch: CFG.branch };
    if (sha) body.sha = sha;
    return gh(path, { method: 'PUT', body: body });
  }
  function friendlyErr(e) {
    if (e && (e.status === 409 || e.status === 422)) return 'Someone else saved at the same time. Please make your change again.';
    if (e && (e.status === 401 || e.status === 403)) return 'The website key stopped working. Please contact ' + (getPath(S.data || {}, 'settings.helpName') || 'your website helper') + '.';
    return 'Could not save. Check your internet and try again.';
  }

  /* ---------- login ---------- */
  function loadLoginFile() {
    var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    var get = function (f) { return fetch(f + '?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); };
    return (local ? get('login.local.json') : Promise.resolve(null)).then(function (j) { return j || get('login.json'); });
  }
  function loginScreen(msg) {
    app.innerHTML = '';
    var email = h('input', { id: 'email', type: 'email', autocomplete: 'username', required: true });
    var pw = h('input', { id: 'pw', type: 'password', autocomplete: 'current-password', required: true });
    var show = h('label', { class: 'check-row' }, [h('input', { type: 'checkbox', onchange: function (e) { pw.type = e.target.checked ? 'text' : 'password'; } }), ' Show my password']);
    var err = h('p', { class: 'err', role: 'alert' }, [msg || '']);
    var btn = h('button', { class: 'btn go huge', type: 'submit' }, ['Log in']);
    var tries = 0;
    var form = h('form', { class: 'card login', onsubmit: function (e) {
      e.preventDefault(); err.textContent = ''; btn.disabled = true; btn.textContent = 'Checking…';
      var em = email.value.trim().toLowerCase();
      loadLoginFile().then(function (lf) {
        var users = (lf && lf.users) || [];
        if (!users.length) throw { notOn: true };
        var u = users.filter(function (x) { return String(x.email).trim().toLowerCase() === em; })[0];
        if (!u) throw { bad: true };
        return decryptToken(u, pw.value).catch(function () { throw { bad: true }; });
      }).then(function (token) {
        S.token = token; S.email = em;
        sessionStorage.setItem('hocc_admin', JSON.stringify({ t: token, e: em }));
        return start();
      }).catch(function (x) {
        tries++;
        return sleep(Math.min(tries * 700, 5000)).then(function () {
          btn.disabled = false; btn.textContent = 'Log in';
          if (x && x.notOn) err.textContent = 'The admin is not switched on yet. Please contact Hayden.';
          else if (x && x.bad) err.textContent = 'That email or password is not right. Try again.';
          else err.textContent = 'Something went wrong. Check your internet and try again.';
        });
      });
    } }, [
      h('img', { src: '../images/1b97d2c0-HOCC-Logo.png', alt: '', class: 'login-logo' }),
      h('h1', { text: 'Website admin' }),
      h('p', { text: 'Log in to change the club website.' }),
      h('label', { for: 'email', text: 'Email' }), email,
      h('label', { for: 'pw', text: 'Password' }), pw, show, err, btn,
      h('p', { class: 'small' }, ['Forgot your password? Ask your website helper to reset it.'])
    ]);
    app.appendChild(form);
    email.focus();
  }

  /* ---------- start / home ---------- */
  function start() {
    app.innerHTML = '<div class="card center"><p class="big">Opening the website…</p></div>';
    return readJson(CFG.contentPath).then(function (r) {
      if (!r) throw new Error('no content');
      S.data = r.json; S.sha = r.sha;
      home();
    }).catch(function (e) {
      if (e && (e.status === 401 || e.status === 403)) { logout(); loginScreen('The website key stopped working. Please contact Hayden.'); return; }
      app.innerHTML = '';
      app.appendChild(h('div', { class: 'card center' }, [h('p', { class: 'big', text: 'Could not open the website. Check your internet and try again.' }), h('button', { class: 'btn go', onclick: start }, ['Try again'])]));
    });
  }
  function topbar(title, back) {
    return h('header', { class: 'bar' }, [
      back ? h('button', { class: 'btn plain back', type: 'button', onclick: back }, ['← Back']) : h('span', { class: 'brand', text: 'HOCC Website' }),
      h('h1', { text: title }),
      h('a', { class: 'btn plain', href: '../index.html', target: '_blank', rel: 'noopener' }, ['View the website'])
    ]);
  }
  function badgeFor(sec) {
    if (sec.badge === 'pending') {
      var n = ((S.data.forSale || {}).listings || []).filter(function (l) { return l.status === 'pending'; }).length;
      return n ? h('span', { class: 'badge warn', text: n + ' waiting' }) : null;
    }
    if (sec.badge === 'regStatus') return h('span', { class: 'badge ' + (S.data.registration && S.data.registration.enabled ? 'on' : 'off'), text: S.data.registration && S.data.registration.enabled ? 'ON' : 'OFF' });
    return null;
  }
  function needsCount(sec) {
    if (!Array.isArray(sec.fields)) return 0;
    var o = getPath(S.data, sec.path) || {};
    return sec.fields.filter(function (f) { return f.needsInfo && !String(o[f.key] || '').trim(); }).length;
  }
  function home() {
    S.section = null; S.dirty = false;
    app.innerHTML = '';
    app.appendChild(topbar('Website admin'));
    var helper = getPath(S.data, 'settings.helpPhone');
    app.appendChild(h('div', { class: 'card help' }, [
      h('p', {}, [h('strong', { text: 'How it works: ' }), 'Tap a button below. Change the words or photos. Then tap the green "Save and put on website" button. Your change shows on the website in about 1 to 2 minutes.']),
      h('p', {}, ['Stuck? ', helper ? h('span', {}, ['Call or text ' + (getPath(S.data, 'settings.helpName') || 'your helper') + ' at ', h('a', { href: 'tel:' + helper.replace(/[^0-9+]/g, ''), text: helper }), '.']) : 'Call or text ' + (getPath(S.data, 'settings.helpName') || 'your website helper') + '.'])
    ]));
    var grid = h('div', { class: 'tiles' });
    SCHEMA.forEach(function (sec) {
      var n = needsCount(sec);
      grid.appendChild(h('button', { class: 'tile', type: 'button', onclick: function () { edit(sec); } }, [
        h('span', { class: 'ico', 'aria-hidden': 'true', text: sec.icon }), h('span', { class: 'tt', text: sec.title }), badgeFor(sec),
        n ? h('span', { class: 'badge need', text: 'Needs info' }) : null]));
    });
    grid.appendChild(h('button', { class: 'tile', type: 'button', onclick: settings }, [h('span', { class: 'ico', 'aria-hidden': 'true', text: '⚙️' }), h('span', { class: 'tt', text: 'Password & editors' })]));
    app.appendChild(grid);
    app.appendChild(h('p', { class: 'center' }, [h('button', { class: 'btn plain', type: 'button', onclick: function () { logout(); loginScreen('You are logged out.'); } }, ['Log out'])]));
    window.scrollTo(0, 0);
  }
  function logout() { sessionStorage.removeItem('hocc_admin'); S.token = null; S.data = null; }

  /* ---------- editor ---------- */
  function leave(go) {
    if (!S.dirty) return go();
    confirmBox('You have changes that are not saved. Leave without saving?', 'Yes, leave').then(function (ok) { if (ok) { S.dirty = false; go(); } });
  }
  function markDirty() { S.dirty = true; var b = document.querySelector('.savebar'); if (b) b.classList.add('dirty'); }
  function edit(sec) {
    S.section = sec;
    S.work = clone(getPath(S.data, sec.path) || {});
    S.dirty = false;
    app.innerHTML = '';
    app.appendChild(topbar(sec.icon + ' ' + sec.title, function () { leave(home); }));
    if (sec.help) app.appendChild(h('p', { class: 'card help', text: sec.help }));
    var box = h('div', { class: 'fields' });
    if (sec.fields === 'textmap') renderTextMap(box, S.work);
    else sec.fields.forEach(function (f) { box.appendChild(renderField(f, S.work)); });
    app.appendChild(box);
    app.appendChild(saveBar());
    window.scrollTo(0, 0);
  }
  function saveBar() {
    return h('div', { class: 'savebar' }, [
      h('button', { class: 'btn go huge', type: 'button', onclick: save }, ['💾 Save and put on website']),
      h('button', { class: 'btn plain', type: 'button', onclick: function () { leave(home); } }, ['Cancel'])]);
  }
  function save() {
    var sec = S.section, btn = document.querySelector('.savebar .go');
    btn.disabled = true; btn.textContent = 'Saving…';
    readJson(CFG.contentPath).then(function (latest) {
      var data = latest.json, target = getPath(data, sec.path);
      if (!target) { target = {}; data[sec.path] = target; }
      var keys = sec.fields === 'textmap' ? Object.keys(S.work) : sec.fields.map(function (f) { return f.key; });
      keys.forEach(function (k) { target[k] = S.work[k]; });
      return writeFile(CFG.contentPath, textToB64(JSON.stringify(data, null, 1) + '\n'), 'Website edit: ' + sec.title + ' (admin)', latest.sha)
        .then(function (res) { S.data = data; S.sha = res.content.sha; });
    }).then(function () {
      S.dirty = false;
      var b = document.querySelector('.savebar'); if (b) b.classList.remove('dirty');
      doneScreen(sec);
    }).catch(function (e) {
      btn.disabled = false; btn.textContent = '💾 Save and put on website';
      toast(friendlyErr(e), 'err');
    });
  }
  function doneScreen(sec) {
    app.innerHTML = '';
    app.appendChild(topbar('Saved'));
    app.appendChild(h('div', { class: 'card center done' }, [
      h('p', { class: 'ico-big', 'aria-hidden': 'true', text: '✅' }),
      h('h2', { text: 'Saved!' }),
      h('p', { class: 'big', text: 'Your change will be on the website in about 1 to 2 minutes.' }),
      h('div', { class: 'row-btns' }, [
        h('a', { class: 'btn go', href: '../index.html', target: '_blank', rel: 'noopener' }, ['View the website']),
        h('button', { class: 'btn plain', type: 'button', onclick: function () { edit(sec); } }, ['Keep editing ' + sec.title]),
        h('button', { class: 'btn plain', type: 'button', onclick: home }, ['Back to all buttons'])])]));
    window.scrollTo(0, 0);
  }

  /* ---------- fields ---------- */
  var uid = 0;
  function fieldWrap(f, obj, control, id) {
    var empty = !String(obj[f.key] == null ? '' : obj[f.key]).trim();
    return h('div', { class: 'field' + (f.needsInfo && empty ? ' needs' : '') }, [
      h('label', { for: id }, [f.label, f.needsInfo && empty ? h('span', { class: 'badge need', text: 'Needs info' }) : null]),
      f.help ? h('p', { class: 'hint', text: f.help }) : null, control]);
  }
  function renderField(f, obj) {
    var id = 'f' + (++uid), v = obj[f.key];
    var set = function (val) { obj[f.key] = val; markDirty(); };
    switch (f.type) {
      case 'text': case 'url': case 'email': case 'phone': case 'money': case 'number': {
        var types = { url: 'url', email: 'email', phone: 'tel', money: 'text', number: 'number', text: 'text' };
        var inp = h('input', { id: id, type: types[f.type], value: v == null ? '' : v, inputmode: f.type === 'money' ? 'decimal' : null,
          placeholder: f.type === 'url' ? 'https://…' : null,
          oninput: function (e) { set(f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value); } });
        return fieldWrap(f, obj, inp, id);
      }
      case 'longtext':
        return fieldWrap(f, obj, h('textarea', { id: id, rows: 4, oninput: function (e) { set(e.target.value); } }, [v || '']), id);
      case 'date':
        return fieldWrap(f, obj, h('div', { class: 'inline' }, [
          h('input', { id: id, type: 'date', value: v || '', oninput: function (e) { set(e.target.value); } }),
          h('button', { class: 'btn plain small', type: 'button', onclick: function (e) { var i = e.target.parentNode.querySelector('input'); i.value = ''; set(''); } }, ['Clear'])]), id);
      case 'toggle': {
        var cb = h('input', { id: id, type: 'checkbox', onchange: function (e) { set(e.target.checked); } });
        cb.checked = f.def ? v !== false : !!v;
        return h('div', { class: 'field' }, [h('label', { class: 'check-row big' }, [cb, ' ' + f.label])]);
      }
      case 'bigswitch': {
        var st = h('p', { class: 'switch-state' });
        var b = h('button', { id: id, type: 'button', class: 'bigswitch', role: 'switch' });
        var paint = function () {
          var on = obj[f.key] === true;
          b.setAttribute('aria-checked', on ? 'true' : 'false');
          b.className = 'bigswitch ' + (on ? 'on' : 'off');
          b.innerHTML = '<span class="knob"></span><span class="lbl">' + (on ? 'ON' : 'OFF') + '</span>';
          st.textContent = on ? f.on : f.off;
        };
        b.addEventListener('click', function () { set(!(obj[f.key] === true)); paint(); });
        paint();
        return h('div', { class: 'field switch-field' }, [h('label', { for: id, text: f.label }), b, st]);
      }
      case 'select': {
        var sel = h('select', { id: id, onchange: function (e) { set(e.target.value); } }, f.options.map(function (o) { var op = h('option', { value: o[0], text: o[1] }); if (o[0] === v) op.selected = true; return op; }));
        return fieldWrap(f, obj, sel, id);
      }
      case 'link': {
        var opts = window.HOCC_LINKS.slice();
        var known = opts.some(function (o) { return o[0] === v; });
        var other = h('input', { type: 'url', placeholder: 'https://…', value: known ? '' : (v || ''), oninput: function (e) { set(e.target.value); } });
        var sel2 = h('select', { id: id, onchange: function (e) { if (e.target.value === '__other') { other.hidden = false; other.focus(); } else { other.hidden = true; set(e.target.value); } } },
          opts.map(function (o) { var op = h('option', { value: o[0], text: o[1] }); if (o[0] === v) op.selected = true; return op; }).concat([h('option', { value: '__other', text: 'Another website…', selected: !known })]));
        other.hidden = known;
        return fieldWrap(f, obj, h('div', {}, [sel2, other]), id);
      }
      case 'image': return imageField(f, obj, id);
      case 'file': return fileField(f, obj, id);
      case 'list': return listField(f, obj);
    }
    return h('div');
  }
  function renderTextMap(box, obj) {
    var groups = {};
    Object.keys(obj).forEach(function (k) { var g = k.split(':')[0]; (groups[g] = groups[g] || []).push(k); });
    Object.keys(groups).forEach(function (g) {
      var d = h('details', { class: 'card group' }, [h('summary', { text: g })]);
      groups[g].forEach(function (k) { d.appendChild(renderField({ key: k, label: k.split(': ').slice(1).join(': '), type: 'text' }, obj)); });
      box.appendChild(d);
    });
  }

  /* images: resize in the browser, then upload */
  function resizeImage(file, keepPng) {
    return new Promise(function (res, rej) {
      if (/svg/i.test(file.type)) { file.arrayBuffer().then(function (b) { res({ bytes: new Uint8Array(b), ext: 'svg' }); }); return; }
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var png = keepPng && /png|gif|webp/i.test(file.type);
        var max = png ? 1200 : 1600, w = im.naturalWidth, hh = im.naturalHeight, sc = Math.min(1, max / Math.max(w, hh));
        var c = document.createElement('canvas'); c.width = Math.round(w * sc); c.height = Math.round(hh * sc);
        var ctx = c.getContext('2d');
        if (!png) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
        ctx.drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (blob) { blob.arrayBuffer().then(function (b) { res({ bytes: new Uint8Array(b), ext: png ? 'png' : 'jpg' }); }); }, png ? 'image/png' : 'image/jpeg', 0.82);
      };
      im.onerror = function () { URL.revokeObjectURL(url); rej(new Error('not an image')); };
      im.src = url;
    });
  }
  function safeName(n) { return String(n).toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'photo'; }
  function uploadBytes(bytes, name, ext) {
    var d = new Date(), stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    var path = CFG.uploadDir + '/' + stamp + '-' + Math.random().toString(36).slice(2, 8) + '-' + safeName(name) + '.' + ext;
    return writeFile(path, bytesToB64(bytes), 'Website photo upload (admin)').then(function () { return path; });
  }
  function uploadImage(file, keepPng) {
    return resizeImage(file, keepPng).then(function (r) { return uploadBytes(r.bytes, file.name, r.ext); });
  }
  function busy(msg) {
    var m = h('div', { class: 'modal', role: 'alert' }, [h('div', { class: 'modal-card' }, [h('div', { class: 'spinner' }), h('p', { class: 'big', text: msg })])]);
    document.body.appendChild(m);
    return { set: function (t) { m.querySelector('p').textContent = t; }, done: function () { m.remove(); } };
  }
  function imageField(f, obj, id) {
    var thumb = h('div', { class: 'thumb' });
    var paint = function () {
      thumb.innerHTML = '';
      if (obj[f.key]) thumb.appendChild(h('img', { src: siteUrl(obj[f.key]), alt: '' }));
      else thumb.appendChild(h('span', { class: 'nophoto', text: 'No photo' }));
    };
    var input = h('input', { type: 'file', accept: 'image/*', class: 'visually-hidden', id: id, onchange: function (e) {
      var file = e.target.files[0]; if (!file) return;
      var b = busy('Uploading photo… please wait');
      uploadImage(file, f.keepPng).then(function (path) { obj[f.key] = path; markDirty(); paint(); b.done(); toast('Photo added. Remember to tap Save.'); })
        .catch(function (err) { b.done(); toast(err.message === 'not an image' ? 'That file is not a photo. Please choose a photo.' : 'Could not upload the photo. Check your internet and try again.', 'err'); });
      e.target.value = '';
    } });
    paint();
    return h('div', { class: 'field' }, [h('span', { class: 'lab', text: f.label }), h('div', { class: 'imgrow' }, [thumb, h('div', { class: 'imgbtns' }, [
      h('label', { for: id, class: 'btn blue' }, ['📷 Choose a photo']), input,
      h('button', { class: 'btn plain small', type: 'button', onclick: function () { obj[f.key] = ''; markDirty(); paint(); } }, ['Remove photo'])])])]);
  }
  function fileField(f, obj, id) {
    var cur = h('p', { class: 'hint' });
    var paint = function () { cur.innerHTML = ''; cur.appendChild(obj[f.key] ? h('a', { href: siteUrl(obj[f.key]), target: '_blank', text: 'Current file: ' + String(obj[f.key]).split('/').pop() }) : document.createTextNode('No file')); };
    var input = h('input', { type: 'file', accept: '.pdf,.doc,.docx', class: 'visually-hidden', id: id, onchange: function (e) {
      var file = e.target.files[0]; if (!file) return;
      if (file.size > 20 * 1024 * 1024) { toast('That file is too big (over 20 MB).', 'err'); return; }
      var b = busy('Uploading file… please wait');
      file.arrayBuffer().then(function (buf) { var ext = (file.name.split('.').pop() || 'pdf').toLowerCase().replace(/[^a-z0-9]/g, ''); return uploadBytes(new Uint8Array(buf), file.name, ext); })
        .then(function (path) { obj[f.key] = path; markDirty(); paint(); b.done(); toast('File added. Remember to tap Save.'); })
        .catch(function () { b.done(); toast('Could not upload the file. Check your internet and try again.', 'err'); });
      e.target.value = '';
    } });
    paint();
    return h('div', { class: 'field' }, [h('span', { class: 'lab', text: f.label }), cur, h('label', { for: id, class: 'btn blue' }, ['📄 Choose a file']), input]);
  }

  /* lists */
  function itemTitle(f, it, i) {
    var t = f.itemTitle ? String(it[f.itemTitle] || '').trim() : '';
    return t || (f.photos ? 'Photo ' + (i + 1) : 'Item ' + (i + 1) + ' (no name yet)');
  }
  function listField(f, obj) {
    if (!Array.isArray(obj[f.key])) obj[f.key] = [];
    var arr = obj[f.key];
    var wrap = h('div', { class: 'field list' + (f.photos ? ' photolist' : '') });
    var openIdx = -1;
    function paint() {
      wrap.innerHTML = '';
      wrap.appendChild(h('h2', { class: 'list-h', text: f.label + ' (' + arr.length + ')' }));
      if (f.help) wrap.appendChild(h('p', { class: 'hint', text: f.help }));
      var order = arr.map(function (_, i) { return i; });
      if (f.statusKey) order.sort(function (a, b) { return (arr[a][f.statusKey] === 'pending' ? 0 : 1) - (arr[b][f.statusKey] === 'pending' ? 0 : 1); });
      order.forEach(function (i) {
        var it = arr[i];
        if (f.photos) { wrap.appendChild(photoCard(f, arr, i, paint)); return; }
        var body = h('div', { class: 'item-body' });
        f.item.forEach(function (sf) { body.appendChild(renderField(sf, it)); });
        if (f.approve && it[f.statusKey] === f.approve.from) {
          body.insertBefore(h('button', { class: 'btn go huge approve', type: 'button', onclick: function () { it[f.statusKey] = f.approve.value; markDirty(); paint(); toast('Approved. Now tap the green Save button to put it on the website.'); } }, [f.approve.label]), body.firstChild);
        }
        body.appendChild(h('div', { class: 'row-btns' }, [
          h('button', { class: 'btn plain small', type: 'button', disabled: i === 0 ? true : null, onclick: function () { move(i, -1); } }, ['⬆ Move up']),
          h('button', { class: 'btn plain small', type: 'button', disabled: i === arr.length - 1 ? true : null, onclick: function () { move(i, 1); } }, ['⬇ Move down']),
          h('button', { class: 'btn danger small', type: 'button', onclick: function () {
            confirmBox('Remove "' + itemTitle(f, it, i) + '"? Are you sure?', 'Yes, remove it').then(function (ok) { if (ok) { arr.splice(i, 1); markDirty(); paint(); } });
          } }, ['🗑 Remove'])]));
        var st = f.statusKey ? it[f.statusKey] : null;
        var hiddenFlag = it.show === false || st === 'hidden';
        var sub = f.itemSub && it[f.itemSub] ? h('span', { class: 'sub', text: it[f.itemSub] }) : null;
        var d = h('details', { class: 'item' + (st === 'pending' ? ' pending' : '') }, [h('summary', {}, [
          h('span', { class: 'it-t', text: itemTitle(f, it, i) }), sub,
          st === 'pending' ? h('span', { class: 'badge warn', text: 'Waiting for approval' }) : st === 'approved' ? h('span', { class: 'badge on', text: 'On the website' }) : null,
          hiddenFlag ? h('span', { class: 'badge off', text: 'Hidden' }) : null, it.sold ? h('span', { class: 'badge off', text: 'Sold' }) : null]), body]);
        if (i === openIdx) d.open = true;
        wrap.appendChild(d);
      });
      var addBtn = h('button', { class: 'btn blue', type: 'button', onclick: function () {
        arr.push(clone(f.newItem || {})); openIdx = arr.length - 1; markDirty(); paint();
        var last = wrap.querySelectorAll('.item, .pcard'); last = last[last.length - 1]; if (last) last.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } }, ['➕ ' + (f.addLabel || 'Add another')]);
      if (f.photos) {
        var mid = 'm' + (++uid);
        var multi = h('input', { type: 'file', accept: 'image/*', multiple: true, class: 'visually-hidden', id: mid, onchange: function (e) {
          var files = Array.prototype.slice.call(e.target.files); if (!files.length) return;
          var b = busy('Uploading photo 1 of ' + files.length + '…'), n = 0;
          files.reduce(function (p, file, k) {
            return p.then(function () { b.set('Uploading photo ' + (k + 1) + ' of ' + files.length + '…'); return uploadImage(file).then(function (path) { var ni = clone(f.newItem || {}); ni.image = path; arr.push(ni); n++; }).catch(function () {}); });
          }, Promise.resolve()).then(function () { b.done(); markDirty(); paint(); toast(n + ' photo' + (n === 1 ? '' : 's') + ' added. Remember to tap Save.', n ? 'ok' : 'err'); });
          e.target.value = '';
        } });
        wrap.appendChild(h('div', { class: 'row-btns' }, [h('label', { for: mid, class: 'btn blue' }, ['📷 Add photos']), multi]));
      } else wrap.appendChild(addBtn);
    }
    function move(i, d) { var j = i + d; if (j < 0 || j >= arr.length) return; var t = arr[i]; arr[i] = arr[j]; arr[j] = t; openIdx = j; markDirty(); paint(); }
    paint();
    return wrap;
  }
  function photoCard(f, arr, i, repaint) {
    var it = arr[i];
    var cap = f.item.filter(function (x) { return x.key === 'caption'; })[0];
    return h('div', { class: 'pcard' }, [
      it.image ? h('img', { src: siteUrl(it.image), alt: '', loading: 'lazy' }) : h('span', { class: 'nophoto', text: 'No photo' }),
      cap ? h('input', { type: 'text', placeholder: 'Caption (optional)', value: it.caption || '', 'aria-label': 'Caption', oninput: function (e) { it.caption = e.target.value; markDirty(); } }) : null,
      h('div', { class: 'pbtns' }, [
        h('button', { class: 'btn plain small', type: 'button', title: 'Move earlier', 'aria-label': 'Move earlier', disabled: i === 0 ? true : null, onclick: function () { var t = arr[i]; arr[i] = arr[i - 1]; arr[i - 1] = t; markDirty(); repaint(); } }, ['⬅']),
        h('button', { class: 'btn plain small', type: 'button', title: 'Move later', 'aria-label': 'Move later', disabled: i === arr.length - 1 ? true : null, onclick: function () { var t = arr[i]; arr[i] = arr[i + 1]; arr[i + 1] = t; markDirty(); repaint(); } }, ['➡']),
        h('button', { class: 'btn danger small', type: 'button', onclick: function () { confirmBox('Remove this photo? Are you sure?', 'Yes, remove it').then(function (ok) { if (ok) { arr.splice(i, 1); markDirty(); repaint(); } }); } }, ['🗑 Remove'])])]);
  }

  /* ---------- settings: password and editors ---------- */
  function readLogin() {
    return readJson(CFG.loginPath).then(function (r) { return r || { sha: null, json: { users: [] } }; });
  }
  function saveLogin(json, sha, msg) {
    return writeFile(CFG.loginPath, textToB64(JSON.stringify(json, null, 1) + '\n'), msg, sha);
  }
  function pwOk(p) { return p.length >= 12; }
  function settings() {
    app.innerHTML = '';
    app.appendChild(topbar('⚙️ Password & editors', home));
    var p1 = h('input', { type: 'password', id: 'np1', autocomplete: 'new-password' }), p2 = h('input', { type: 'password', id: 'np2', autocomplete: 'new-password' });
    var msg1 = h('p', { class: 'err', role: 'alert' });
    app.appendChild(h('div', { class: 'card' }, [
      h('h2', { text: 'Change my password' }),
      h('p', { class: 'hint', text: 'You are logged in as ' + S.email + '. Use at least 12 letters. Tip: use 3 words and a number, like Blue-Corvette-Sunday-58.' }),
      h('label', { for: 'np1', text: 'New password' }), p1, h('label', { for: 'np2', text: 'Type it again' }), p2, msg1,
      h('button', { class: 'btn go', type: 'button', onclick: function (e) {
        msg1.textContent = '';
        if (!pwOk(p1.value)) { msg1.textContent = 'Please use at least 12 letters.'; return; }
        if (p1.value !== p2.value) { msg1.textContent = 'The two passwords are not the same.'; return; }
        var b = busy('Saving your new password…');
        Promise.all([readLogin(), encryptToken(S.token, p1.value)]).then(function (r) {
          var lf = r[0], ent = r[1], users = lf.json.users || [];
          var u = users.filter(function (x) { return x.email.toLowerCase() === S.email; })[0];
          if (!u) { u = { email: S.email }; users.push(u); }
          u.salt = ent.salt; u.iv = ent.iv; u.data = ent.data;
          lf.json.users = users;
          return saveLogin(lf.json, lf.sha, 'Admin: password changed');
        }).then(function () { b.done(); p1.value = p2.value = ''; toast('Your password is changed. Use the new one next time.'); })
          .catch(function (er) { b.done(); toast(friendlyErr(er), 'err'); });
      } }, ['Save my new password'])]));

    var listBox = h('div');
    var ne = h('input', { type: 'email', id: 'ne' }), np = h('input', { type: 'password', id: 'np', autocomplete: 'new-password' });
    var msg2 = h('p', { class: 'err', role: 'alert' });
    app.appendChild(h('div', { class: 'card' }, [
      h('h2', { text: 'People who can edit the website' }), listBox,
      h('h3', { text: 'Add another editor' }),
      h('label', { for: 'ne', text: 'Their email' }), ne, h('label', { for: 'np', text: 'A password for them (at least 12 letters)' }), np, msg2,
      h('button', { class: 'btn blue', type: 'button', onclick: function () {
        msg2.textContent = '';
        var em = ne.value.trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { msg2.textContent = 'Please type their email.'; return; }
        if (!pwOk(np.value)) { msg2.textContent = 'Please use at least 12 letters for their password.'; return; }
        var b = busy('Adding the editor…');
        Promise.all([readLogin(), encryptToken(S.token, np.value)]).then(function (r) {
          var lf = r[0], ent = r[1];
          lf.json.users = (lf.json.users || []).filter(function (x) { return x.email.toLowerCase() !== em; });
          lf.json.users.push({ email: em, salt: ent.salt, iv: ent.iv, data: ent.data });
          return saveLogin(lf.json, lf.sha, 'Admin: editor added');
        }).then(function () { b.done(); ne.value = np.value = ''; toast('Editor added. Give them the email and password.'); paintUsers(); })
          .catch(function (er) { b.done(); toast(friendlyErr(er), 'err'); });
      } }, ['➕ Add this editor'])]));
    function paintUsers() {
      listBox.innerHTML = '<p class="hint">Loading…</p>';
      readLogin().then(function (lf) {
        listBox.innerHTML = '';
        (lf.json.users || []).forEach(function (u) {
          var me = u.email.toLowerCase() === S.email;
          listBox.appendChild(h('div', { class: 'user-row' }, [h('span', { text: u.email + (me ? ' (you)' : '') }), me ? null : h('button', { class: 'btn danger small', type: 'button', onclick: function () {
            confirmBox('Remove ' + u.email + '? They will not be able to edit the website.', 'Yes, remove').then(function (ok) {
              if (!ok) return;
              readLogin().then(function (l2) {
                l2.json.users = l2.json.users.filter(function (x) { return x.email.toLowerCase() !== u.email.toLowerCase(); });
                return saveLogin(l2.json, l2.sha, 'Admin: editor removed');
              }).then(function () { toast('Removed.'); paintUsers(); }).catch(function (er) { toast(friendlyErr(er), 'err'); });
            });
          } }, ['Remove'])]));
        });
      }).catch(function () { listBox.innerHTML = '<p class="err">Could not load the list.</p>'; });
    }
    paintUsers();
    window.scrollTo(0, 0);
  }

  /* ---------- boot ---------- */
  window.addEventListener('beforeunload', function (e) { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });
  var saved = null;
  try { saved = JSON.parse(sessionStorage.getItem('hocc_admin') || 'null'); } catch (e) { saved = null; }
  if (saved && saved.t) { S.token = saved.t; S.email = saved.e; start(); } else loginScreen();
  window.HOCC_ADMIN_TEST = { encryptToken: encryptToken, decryptToken: decryptToken };
})();
