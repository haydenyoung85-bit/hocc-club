/* HOCC website: renders page content from content/site.json (edited in the admin panel). */
(function () {
  'use strict';
  var D = null;
  var page = document.body.getAttribute('data-page') || '';

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function safeUrl(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return ''; // block javascript: and friends
    return u.replace(/^\/+/, '');
  }
  function linkify(escaped) {
    return escaped.replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g, function (u) {
      return '<a href="' + u + '">' + u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') + '</a>';
    });
  }
  // plain text -> paragraphs; single newlines become <br>
  function para(s, cls) {
    s = String(s || '').trim();
    if (!s) return '';
    return s.split(/\n\s*\n/).map(function (p) {
      return '<p' + (cls ? ' class="' + cls + '"' : '') + '>' + linkify(esc(p)).replace(/\n/g, '<br>') + '</p>';
    }).join('');
  }
  function lines(s) {
    s = String(s || '').trim();
    if (!s) return '';
    return '<ul class="ticks">' + s.split('\n').filter(function (l) { return l.trim(); }).map(function (l) {
      return '<li>' + linkify(esc(l.trim())) + '</li>';
    }).join('') + '</ul>';
  }
  function br(s) { return esc(s).replace(/\n/g, '<br>'); }
  function shown(list) { return (list || []).filter(function (x) { return x && x.show !== false; }); }
  function img(src, alt, extra) {
    src = safeUrl(src);
    if (!src) return '';
    return '<img src="' + esc(src) + '" alt="' + esc(alt || '') + '" loading="lazy"' + (extra || '') + '>';
  }
  function money(v) {
    var n = parseFloat(String(v || '').replace(/[^0-9.]/g, ''));
    return isNaN(n) ? '' : '$' + (n % 1 ? n.toFixed(2) : String(n));
  }
  function num(v) { var n = parseFloat(String(v || '').replace(/[^0-9.]/g, '')); return isNaN(n) ? 0 : n; }
  function $(sel) { return document.querySelector(sel); }
  function fill(sel, html) { var el = $(sel); if (el) { el.innerHTML = html; el.hidden = !html; } return el; }
  function get(path) {
    return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, D);
  }
  function absUrl(file) { return new URL(file, location.href).href; }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function parseDate(s) { var p = String(s || '').split('-'); return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]) : null; }
  // "Today" in Oklahoma (Central time), no matter where the visitor is
  function todayStr() {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
    catch (e) { var n = new Date(); return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0'); }
  }
  function today() { return parseDate(todayStr()); }
  function isPast(dateStr) { return /^\d{4}-\d{2}-\d{2}$/.test(String(dateStr || '')) && String(dateStr) < todayStr(); }
  function eventLast(e) { return e.end || e.start || ''; }

  /* ---------- shared bits: header button, footer, bindings ---------- */
  function bindings() {
    document.querySelectorAll('[data-t]').forEach(function (el) {
      var v = get(el.getAttribute('data-t'));
      if (v == null || v === '') { if (el.hasAttribute('data-hide-empty') || (v === '' && /^text\./.test(el.getAttribute('data-t')))) el.hidden = true; return; }
      el.innerHTML = br(v);
    });
    document.querySelectorAll('[data-href]').forEach(function (el) {
      var v = safeUrl(get(el.getAttribute('data-href')));
      if (v) el.setAttribute('href', v); else if (el.hasAttribute('data-hide-empty')) el.hidden = true;
    });
    document.querySelectorAll('[data-mail]').forEach(function (el) {
      var v = get(el.getAttribute('data-mail'));
      if (v) { el.href = 'mailto:' + v; el.textContent = v; }
    });
    var ph = get('settings.phone');
    document.querySelectorAll('[data-phone]').forEach(function (el) {
      if (ph) { el.hidden = false; var a = el.querySelector('a') || el; a.textContent = ph; if (a.tagName === 'A') a.href = 'tel:' + ph.replace(/[^0-9+]/g, ''); }
      else el.hidden = true;
    });
  }

  function eventRow(e) {
    var s = parseDate(e.start), en = parseDate(e.end);
    var m = s ? MONTHS[s.getMonth()] : '', d = s ? String(s.getDate()) : '';
    if (s && en && en > s) {
      if (en.getMonth() === s.getMonth()) d += '–' + en.getDate();
      else { d += '–'; m += '/' + MONTHS[en.getMonth()]; d += en.getDate(); }
    }
    var where = [e.place, e.address].filter(Boolean).join(', ');
    return '<li class="event"><div class="date"><span class="m">' + esc(m) + '</span><span class="d">' + esc(d) + '</span></div><div>' +
      '<h3>' + esc(e.title) + '</h3>' + (where ? '<p>' + esc(where) + '</p>' : '') + (e.time ? '<p>' + esc(e.time) + '</p>' : '') +
      (e.details ? '<p class="ev-details">' + linkify(esc(e.details)) + '</p>' : '') + '</div>' +
      (e.photo ? '<div class="ev-photo">' + img(e.photo, e.title) + '</div>' : '') + '</li>';
  }
  function upcoming() {
    return shown(get('events.items')).filter(function (e) { return !isPast(eventLast(e)); })
      .sort(function (a, b) { return String(a.start || '9999').localeCompare(String(b.start || '9999')); });
  }
  function pastEvents() {
    return shown(get('events.items')).filter(function (e) { return isPast(eventLast(e)); })
      .sort(function (a, b) { return String(eventLast(b)).localeCompare(String(eventLast(a))); });
  }
  function noEvents() { return '<p class="no-events">' + esc(get('events.emptyText') || 'New dates coming soon. Check back!') + '</p>'; }
  function photoGrid(list, cls) {
    list = shown(list).filter(function (p) { return p.image; });
    if (!list.length) return '';
    return '<ul class="grid ' + (cls || '') + '">' + list.map(function (p) {
      return '<li><a href="' + esc(safeUrl(p.image)) + '">' + img(p.image, p.caption || 'Club photo') + (p.caption ? '<span class="cap">' + esc(p.caption) + '</span>' : '') + '</a></li>';
    }).join('') + '</ul>';
  }
  function newMembersHtml() {
    var nm = get('newMembers') || {}, items = shown(nm.items);
    if (!items.length) return '';
    return '<h2>' + esc(nm.title || 'New members') + '</h2>' + para(nm.intro) + '<ul class="members">' + items.map(function (m) {
      return '<li>' + (m.photo ? img(m.photo, m.name) : '<span class="m-initial" aria-hidden="true">' + esc((m.name || '?').charAt(0)) + '</span>') +
        '<span><strong>' + esc(m.name) + '</strong>' + (m.joined ? '<small>Joined ' + esc(m.joined) + '</small>' : '') + '</span></li>';
    }).join('') + '</ul>';
  }
  function sponsorsHtml(limit) {
    var items = shown(get('sponsors.items')).filter(function (s) { return s.logo || s.name; });
    if (limit) items = items.slice(0, limit);
    return '<ul class="logos">' + items.map(function (s) {
      var inner = s.logo ? img(s.logo, s.name) : '<span class="logo-name">' + esc(s.name) + '</span>';
      var l = safeUrl(s.link);
      return '<li' + (s.darkBg ? ' class="on-dark"' : '') + '>' + (l ? '<a href="' + esc(l) + '" title="' + esc(s.name) + '">' + inner + '</a>' : inner) + '</li>';
    }).join('') + '</ul>';
  }
  function moreText(html, id) {
    // collapses long text on phones
    return '<div class="more" id="' + id + '">' + html + '</div><button type="button" class="more-btn show-m" data-more="' + id + '">Read more</button>';
  }

  /* ---------- pages ---------- */
  var R = {};
  R.home = function () {
    var h = D.home;
    fill('#hero-eyebrow', esc(h.heroEyebrow));
    fill('#hero-title', esc(h.heroTitle));
    fill('#hero-text', esc(h.heroText));
    var hi = $('#hero-img'); if (hi && h.heroImage) hi.src = safeUrl(h.heroImage);
    var b1 = $('#hero-b1'); if (b1) { b1.textContent = h.heroButtonText || 'Car Show info'; b1.href = safeUrl(h.heroButtonLink) || 'car-show.html'; }
    var b2 = $('#hero-b2'); if (b2) { if (h.heroButton2Text) { b2.textContent = h.heroButton2Text; b2.href = safeUrl(h.heroButton2Link) || 'events.html'; } else b2.hidden = true; }
    var p = D.about.purpose || '';
    fill('#purpose', moreText('<p class="lead">' + esc(p) + '</p>', 'more-purpose'));
    fill('#officer-mini', shown(D.about.officers).map(function (o) { return '<li><strong>' + esc(o.name) + '</strong> ' + esc(o.role) + '</li>'; }).join(''));
    var ev = upcoming().slice(0, 3);
    fill('#home-events', ev.length ? '<ul class="events">' + ev.map(eventRow).join('') + '</ul>' : noEvents());
    fill('#home-photos', photoGrid(h.photos, 'strip-m'));
    fill('#home-photos-title', esc(h.photosTitle || 'A few photos'));
    fill('#home-new-members', newMembersHtml());
    fill('#home-join', esc(h.joinText));
    fill('#home-giving', esc(h.givingText));
    fill('#home-sponsors', sponsorsHtml(0));
  };
  R.about = function () {
    var a = D.about;
    fill('#about-purpose', '<p class="lead">' + esc(a.purpose) + '</p>');
    fill('#about-photo', a.photo ? img(a.photo, a.photoCaption || 'Club photo') + (a.photoCaption ? '<figcaption>' + esc(a.photoCaption) + '</figcaption>' : '') : '');
    fill('#officers', shown(a.officers).map(function (o) {
      return '<details class="officer-acc"><summary><span class="sum-name">' + esc(o.name) + '</span><span class="sum-role">' + esc(o.role) + '</span></summary><div class="officer-body">' +
        (o.photo ? img(o.photo, o.name + ', ' + o.role) : '') + '<div>' + para(o.bio) + '</div></div></details>';
    }).join(''));
    fill('#faqs', shown(a.faqs).map(function (f) {
      return '<details class="acc"><summary>' + esc(f.q) + '</summary><div class="acc-body">' + para(f.a) + '</div></details>';
    }).join(''));
    var nm = newMembersHtml();
    var sec = $('#new-members-sec'); if (sec) { sec.hidden = !nm; fill('#new-members', nm); }
  };
  R.events = function () {
    fill('#events-intro', esc(D.events.intro));
    var ev = upcoming();
    fill('#events-list', ev.length ? '<ul class="events">' + ev.map(eventRow).join('') + '</ul>' : noEvents());
    var past = pastEvents().slice(0, 12);
    fill('#past-events', past.length ? '<details class="check past"><summary>Past events (' + past.length + ')</summary><div class="acc-body"><ul class="events">' + past.map(eventRow).join('') + '</ul></div></details>' : '');
    fill('#meetings', (D.events.meetings || []).map(function (m) {
      return '<div class="card"><h3>' + esc(m.name) + '</h3><address>' + br(m.address) + (m.phone ? '<br>' + esc(m.phone) : '') + '</address></div>';
    }).join(''));
  };
  R.gallery = function () {
    fill('#gallery-intro', esc(D.gallery.intro));
    fill('#gallery', photoGrid(D.gallery.photos));
  };
  R.charities = function () {
    fill('#charities-intro', esc(D.charities.intro));
    fill('#charities', shown(D.charities.items).map(function (c, i) {
      var l = safeUrl(c.link);
      return '<div class="charity">' + img(c.logo, c.name + ' logo') + '<div><h3>' + esc(c.name) + '</h3>' + moreText(para(c.text), 'more-ch' + i) +
        (c.address ? '<address>' + br(c.address) + '</address>' : '') + (l ? '<p><a href="' + esc(l) + '">Visit their page</a></p>' : '') + '</div></div>';
    }).join(''));
    fill('#sponsors-intro', esc(D.sponsors.intro));
    fill('#sponsors', sponsorsHtml(0));
    fill('#trailer', D.sponsors.trailerPhoto ? img(D.sponsors.trailerPhoto, D.sponsors.trailerCaption) + '<figcaption>' + esc(D.sponsors.trailerCaption) + '</figcaption>' : '');
  };
  R.contact = function () {
    fill('#contact-intro', esc(D.contact.intro));
    var f = $('#contact-form'); if (f) {
      f.hidden = D.contact.formOn === false;
      f.action = 'https://formsubmit.co/' + get('settings.email');
      f.querySelector('[name=_next]').value = absUrl('thanks-contact.html');
    }
  };
  R.membership = function () {
    var m = D.membership;
    fill('#m-intro', esc(m.intro));
    fill('#m-renew', esc(m.renewNote));
    fill('#m-paynote', esc(m.payNote));
    document.querySelectorAll('[data-plan="single"]').forEach(function (el) { el.value = (m.singleLabel || 'Single') + ' ' + money(m.singlePrice); });
    document.querySelectorAll('[data-plan="family"]').forEach(function (el) { el.value = (m.familyLabel || 'Family') + ' ' + money(m.familyPrice); });
    fill('#plan-single-label', esc(m.singleLabel) + ' &mdash; ' + esc(money(m.singlePrice)));
    fill('#plan-family-label', esc(m.familyLabel) + ' &mdash; ' + esc(money(m.familyPrice)));
    var pays = [];
    if (safeUrl(m.paypalSingle)) pays.push('<a class="btn" href="' + esc(safeUrl(m.paypalSingle)) + '">Pay ' + esc(m.singleLabel) + ' Membership &mdash; ' + esc(money(m.singlePrice)) + '</a>');
    if (safeUrl(m.paypalFamily)) pays.push('<a class="btn" href="' + esc(safeUrl(m.paypalFamily)) + '">Pay ' + esc(m.familyLabel) + ' Membership &mdash; ' + esc(money(m.familyPrice)) + '</a>');
    document.querySelectorAll('.pay-buttons').forEach(function (el) { el.innerHTML = pays.join(''); el.hidden = !pays.length; });
    document.querySelectorAll('.pay-online').forEach(function (el) { el.hidden = !pays.length; });
    document.querySelectorAll('.check-text').forEach(function (el) { el.textContent = m.checkText || ''; });
    document.querySelectorAll('.check-address').forEach(function (el) { el.innerHTML = '<strong>HOCC</strong><br>' + br(get('settings.address')); });
    document.querySelectorAll('.app-file').forEach(function (el) { var u = safeUrl(m.applicationFile); if (u) el.href = u; else el.hidden = true; });
    fill('#m-photos', photoGrid(m.photos));
    var f = $('#membership-form'); if (f) {
      f.action = 'https://formsubmit.co/' + get('settings.email');
      f.querySelector('[name=_next]').value = absUrl('thanks.html');
    }
  };
  R.thanks = R.membership;
  R.apparel = function () {
    var a = D.apparel;
    fill('#apparel-intro', esc(a.intro));
    fill('#apparel', shown(a.items).map(function (it) {
      var l = safeUrl(it.buyLink);
      return '<li class="product">' + (it.image ? '<a href="' + esc(safeUrl(it.image)) + '">' + img(it.image, it.name) + '</a>' : '') + '<div class="p-body"><h3>' + esc(it.name) + '</h3>' +
        (money(it.price) ? '<p class="price">' + esc(money(it.price)) + '</p>' : '') + (it.sizes ? '<p class="sizes">Sizes: ' + esc(it.sizes) + '</p>' : '') + para(it.description) +
        (l ? '<a class="btn gold" href="' + esc(l) + '">Buy</a>' : '<a class="btn dark" href="mailto:' + esc(get('settings.email')) + '?subject=' + encodeURIComponent('Apparel: ' + it.name) + '">Ask us to order</a>') + '</div></li>';
    }).join(''));
    var drt = safeUrl(a.drtLink), card = $('#drt');
    if (card) {
      card.hidden = !drt;
      if (drt) { fill('#drt-title', esc(a.drtTitle || 'DRT Shop')); fill('#drt-text', esc(a.drtText)); $('#drt-link').href = drt; }
    }
  };
  R.forsale = function () {
    var f = D.forSale;
    fill('#fs-intro', esc(f.intro));
    var items = (f.listings || []).filter(function (l) { return l.status === 'approved'; });
    items.sort(function (a, b) { return (a.sold ? 1 : 0) - (b.sold ? 1 : 0); });
    fill('#listings', items.length ? items.map(function (l, i) {
      var ph = (l.photos || []).filter(function (p) { return p && p.image; });
      var contact = [l.contactName ? 'Contact ' + esc(l.contactName) : '', l.phone ? '<a href="tel:' + esc(String(l.phone).replace(/[^0-9+]/g, '')) + '">' + esc(l.phone) + '</a>' : '', l.email ? '<a href="mailto:' + esc(l.email) + '">' + esc(l.email) + '</a>' : ''].filter(Boolean).join(' &middot; ');
      return '<article class="listing' + (l.sold ? ' is-sold' : '') + '">' +
        (ph.length ? '<div class="l-photos">' + ph.map(function (p) { return '<a href="' + esc(safeUrl(p.image)) + '">' + img(p.image, l.title) + '</a>'; }).join('') + '</div>' : '') +
        '<div class="l-body"><h3>' + esc(l.title) + (l.sold ? ' <span class="tag sold">Sold</span>' : '') + '</h3>' + (l.price ? '<p class="price">' + esc(l.price) + '</p>' : '') +
        moreText(para(l.description), 'more-l' + i) + (contact ? '<p class="l-contact">' + contact + '</p>' : '') + '</div></article>';
    }).join('') : '<p class="no-events">Nothing listed right now. Have something to sell? Use the form below.</p>');
    var form = $('#sell-form'); if (form) {
      form.action = 'https://formsubmit.co/' + get('settings.email');
      form.querySelector('[name=_next]').value = absUrl('thanks-for-sale.html');
    }
  };

  /* ---------- car show + (hidden) registration ---------- */
  R.carshow = function () {
    var c = D.carShow;
    var over = isPast(c.endDate), regOpen = registrationOpen();
    fill('#cs-label', esc(over ? (c.pastLabel || 'Past show') : c.label));
    fill('#cs-title', esc(c.title));
    fill('#cs-when', esc([c.dates, c.venue].filter(Boolean).join(' · ')));
    // after the show: thank-you + "registration isn't open yet" instead of the old sold-out banner
    var status = over && !regOpen ? (c.pastNote || 'Thank you to everyone who came! Registration for the next show is not open yet. Check back soon.') : c.status;
    fill('#cs-status', status ? '<p class="status-note">' + esc(status) + '</p>' : '');
    fill('#cs-hotels-note', over && c.hotelsPastNote ? '<p class="big-note">' + esc(c.hotelsPastNote) + '</p>' : '');
    fill('#cs-opening', c.openingNote ? '<p class="big-note">' + esc(c.openingNote) + '</p>' : '');
    fill('#cs-highlights', lines(c.highlights));
    fill('#cs-details', lines(c.details));
    fill('#cs-image', c.image ? img(c.image, c.imageCaption || c.title) + (c.imageCaption ? '<figcaption>' + esc(c.imageCaption) + '</figcaption>' : '') : '');
    var hotels = shown(c.hotels);
    fill('#cs-hotels', hotels.map(function (h) {
      var l = safeUrl(h.link);
      return '<li class="hotel">' + (h.logo ? '<div class="h-logo">' + img(h.logo, h.name + ' logo') + '</div>' : '') + '<div class="h-body"><h3>' + esc(h.name) + '</h3>' +
        (h.rate ? '<p class="price">' + esc(h.rate) + '</p>' : '') + (h.code ? '<p><strong>' + esc(h.code) + '</strong></p>' : '') +
        (h.phone ? '<p><a href="tel:' + esc(String(h.phone).replace(/[^0-9+]/g, '').slice(0, 11)) + '">' + esc(h.phone) + '</a></p>' : '') + (h.notes ? '<p>' + esc(h.notes) + '</p>' : '') +
        (l ? '<a class="btn" href="' + esc(l) + '">Book this hotel</a>' : '') + '</div>' +
        (h.qr ? '<figure class="qr">' + img(h.qr, 'QR code to book ' + h.name) + '<figcaption>Scan to book</figcaption></figure>' : '') + '</li>';
    }).join(''));
    var secH = $('#hotels-sec'); if (secH) secH.hidden = !hotels.length;
    var qrs = shown(c.qrCodes).filter(function (q) { return q.image; });
    fill('#cs-qrs', qrs.map(function (q) {
      var inner = img(q.image, 'QR code: ' + (q.title || '')) + '<figcaption><strong>' + esc(q.title) + '</strong>' + (q.caption ? '<br>' + esc(q.caption) : '') + '</figcaption>';
      return '<li><figure class="qr">' + (safeUrl(q.link) ? '<a href="' + esc(safeUrl(q.link)) + '">' + inner + '</a>' : inner) + '</figure></li>';
    }).join(''));
    var secQ = $('#qrs-sec'); if (secQ) secQ.hidden = !qrs.length;
    fill('#cs-camper', lines(c.camper));
    fill('#cs-shuttle', (c.shuttleLogo ? '<div class="h-logo">' + img(c.shuttleLogo, 'Shuttle provider logo') + '</div>' : '') + lines(c.shuttle) + (safeUrl(c.shuttleLink) ? '<p><a href="' + esc(safeUrl(c.shuttleLink)) + '">' + esc(safeUrl(c.shuttleLink).replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')) + '</a></p>' : ''));
    fill('#cs-classes', (c.classes || []).map(function (k) { return '<li><strong>' + esc(k.name) + '</strong> ' + esc(k.desc) + '</li>'; }).join(''));
    var secC = $('#classes-sec'); if (secC) secC.hidden = !(c.classes || []).length;
    fill('#cs-partners', (c.partners || []).filter(function (p) { return p.image; }).map(function (p) {
      var inner = img(p.image, p.name); var l = safeUrl(p.link);
      return '<li>' + (l ? '<a href="' + esc(l) + '">' + inner + '</a>' : inner) + '</li>';
    }).join(''));
    fill('#cs-benefit', esc(c.benefitText));
    registration();
  };

  function registrationOpen() {
    var r = D.registration || {};
    if (r.enabled !== true) return false;
    var od = parseDate(r.openDate);
    return !od || today() >= od;  // Central time
  }
  function registration() {
    var sec = $('#register-sec');
    if (!sec) return;
    if (!registrationOpen()) { sec.hidden = true; sec.innerHTML = ''; return; } // completely hidden
    var r = D.registration, cap = num(r.cap) || 140, left = Math.max(0, Math.round(num(r.spotsLeft)));
    var full = left <= 0, fee = num(r.fee), dinner = num(r.dinnerPrice), shirt = num(r.shirtPrice);
    var sizes = String(r.shirtSizes || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var classes = (D.carShow.classes || []);
    function field(id, label, type, req, extra) {
      return '<div class="field"><label for="' + id + '">' + label + (req ? '' : ' <span class="opt">(optional)</span>') + '</label><input id="' + id + '" name="' + id + '" type="' + (type || 'text') + '"' + (req ? ' required' : '') + (extra || '') + '></div>';
    }
    var html = '<div class="wrap narrow"><h2>' + (full ? 'Join the waiting list' : 'Register for the show') + '</h2>' +
      '<p class="spots ' + (full ? 'full' : '') + '"><span class="spots-n">' + (full ? '0' : left) + '</span> of ' + cap + ' spots left</p>' +
      para(full ? r.waitlistText : r.intro) +
      (r.terms ? '<p class="fine-print">' + esc(r.terms) + '</p>' : '') +
      '<form id="reg-form" method="POST" action="https://formsubmit.co/' + esc(get('settings.email')) + '">' +
      '<input type="hidden" name="_subject" value="' + (full ? 'Car show WAITING LIST (website)' : 'Car show REGISTRATION (website)') + '">' +
      '<input type="hidden" name="_template" value="table"><input type="hidden" name="_next" value="">' +
      '<input type="hidden" name="total_due" value=""><input type="text" name="_honey" class="hidden" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<fieldset><legend>About you</legend>' + field('name', 'Full name', 'text', 1, ' autocomplete="name"') +
      field('street', 'Street address', 'text', 1, ' autocomplete="street-address"') +
      '<div class="row">' + field('city', 'City', 'text', 1) + field('state', 'State', 'text', 1) + field('zip', 'ZIP code', 'text', 1, ' inputmode="numeric"') + '</div>' +
      '<div class="row">' + field('phone', 'Phone', 'tel', 1) + field('email', 'Email', 'email', 1) + '</div></fieldset>' +
      '<fieldset><legend>Your Corvette</legend><div class="row">' + field('car_year', 'Year', 'text', 1, ' inputmode="numeric"') + field('car_model', 'Model / generation', 'text', 1) + field('car_color', 'Color', 'text', 1) + '</div>' +
      field('tag_number', 'License tag number', 'text', 1) +
      (classes.length ? '<div class="field"><label for="show_class">Show class</label><select id="show_class" name="show_class" required><option value="">Choose your class</option>' + classes.map(function (k) { var v = k.name + ' (' + k.desc + ')'; return '<option>' + esc(v) + '</option>'; }).join('') + '</select></div>' : '') +
      '</fieldset>' +
      (!full && (dinner || shirt) ? '<fieldset><legend>Extras</legend>' +
        (dinner ? '<div class="field"><label for="dinner_qty">Dinner tickets (' + esc(money(dinner)) + ' each)</label><input id="dinner_qty" name="dinner_qty" type="number" min="0" max="20" value="0" data-price="' + dinner + '"></div>' : '') +
        (shirt ? '<div class="row"><div class="field"><label for="shirt_qty">Show T-shirts (' + esc(money(shirt)) + ' each)</label><input id="shirt_qty" name="shirt_qty" type="number" min="0" max="20" value="0" data-price="' + shirt + '"></div>' +
          '<div class="field"><label for="shirt_sizes">Sizes <span class="opt">(e.g. 2 L, 1 XL)</span></label><input id="shirt_sizes" name="shirt_sizes" type="text" placeholder="' + esc(sizes.join(', ')) + '"></div></div>' : '') + '</fieldset>' : '') +
      '<div class="field"><label for="notes">Anything else? <span class="opt">(optional)</span></label><textarea id="notes" name="notes" rows="3"></textarea></div>' +
      (!full ? '<p class="total">Total: <strong id="reg-total">' + esc(money(fee) || '$0') + '</strong></p>' : '') +
      '<button class="btn gold big" type="submit">' + (full ? 'Join the waiting list' : 'Send my registration') + '</button>' +
      (!full && safeUrl(r.paypalLink) ? '<p class="fine-print">Next you will pay with PayPal. You do not need a PayPal account.</p>' : '') + '</form></div>';
    sec.innerHTML = html; sec.hidden = false;
    var form = $('#reg-form');
    function total() {
      var t = fee;
      form.querySelectorAll('[data-price]').forEach(function (i) { t += num(i.value) * num(i.getAttribute('data-price')); });
      return t;
    }
    form.addEventListener('input', function () { var el = $('#reg-total'); if (el) el.textContent = money(total()) || '$0'; });
    form.addEventListener('submit', function () {
      form.querySelector('[name=total_due]').value = full ? 'waiting list' : money(total());
      form.querySelector('[name=_next]').value = absUrl('thanks-registration.html' + (full ? '?w=1' : '?t=' + encodeURIComponent(total())));
    });
    // top-of-page registration button, and optional T-shirt pop-up
    var top = $('#cs-register-top');
    if (top) { top.hidden = false; top.textContent = full ? 'Join the waiting list' : 'Register for the show'; }
    if (!full && r.shirtPopup && shirt) {
      var shown1 = false;
      function popup(e) {
        if (shown1) return; shown1 = true;
        if (e) e.preventDefault();
        var m = document.createElement('div');
        m.className = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', 'Show T-shirt');
        m.innerHTML = '<div class="modal-card">' + (r.shirtImage ? img(r.shirtImage, 'Show T-shirt') : '') + '<h2>Want a show T-shirt?</h2><p>Add one to your registration for ' + esc(money(shirt)) + '.</p>' +
          '<div class="btn-row"><button type="button" class="btn gold" data-a="yes">Yes, add a T-shirt</button><button type="button" class="btn light-o" data-a="no">No thanks</button></div></div>';
        document.body.appendChild(m);
        m.querySelector('[data-a=yes]').focus();
        m.addEventListener('click', function (ev) {
          var a = ev.target.getAttribute('data-a');
          if (!a && ev.target !== m) return;
          if (a === 'yes') { var q = $('#shirt_qty'); if (q && !num(q.value)) { q.value = 1; form.dispatchEvent(new Event('input')); } }
          m.remove();
          sec.scrollIntoView({ behavior: 'smooth' });
          setTimeout(function () { var n = $('#name'); if (n) n.focus({ preventScroll: true }); }, 400);
        });
      }
      if (top) top.addEventListener('click', popup);
      form.addEventListener('focusin', function () { popup(); }, { once: true });
    }
  }
  R.thanksreg = function () {
    var r = D.registration || {}, q = new URLSearchParams(location.search);
    var w = q.get('w'), t = num(q.get('t'));
    fill('#tr-title', w ? 'You are on the waiting list.' : 'Thank you! Now please pay.');
    var l = safeUrl(r.paypalLink);
    fill('#tr-pay', w ? '<p class="lead">We will contact you if a spot opens up.</p>' :
      (t ? '<p class="big-note">Your total: <strong>' + esc(money(t)) + '</strong></p>' : '') +
      (l ? '<p><a class="btn gold big" href="' + esc(l) + '">Pay with PayPal</a></p><p>You do not need a PayPal account. You can pay with any credit or debit card.</p>' : '<p>The club will contact you about payment.</p>'));
  };

  /* ---------- run ---------- */
  function wireMore() {
    // long accordions start closed on phones to keep the page short
    if (window.matchMedia('(max-width: 700px)').matches) document.querySelectorAll('details.check[open]:not(.keep-open)').forEach(function (d) { d.open = false; });
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-more]');
      if (!b) return;
      var el = document.getElementById(b.getAttribute('data-more'));
      if (el) { el.classList.add('open'); b.remove(); }
    });
    // hide "Read more" when the text is short
    document.querySelectorAll('.more').forEach(function (el) {
      if (el.scrollHeight <= el.clientHeight + 4) { el.classList.add('open'); var b = el.nextElementSibling; if (b && b.hasAttribute('data-more')) b.remove(); }
    });
  }
  fetch('content/site.json?v=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      D = data;
      bindings();
      // Donate button: only on the Charities page and the home "Giving back" block
      var dn = safeUrl(get('settings.donateLink'));
      document.querySelectorAll('.donate-btn').forEach(function (a) { if (dn) a.href = dn; });
      document.querySelectorAll('.donate-box').forEach(function (b) { b.hidden = !dn; });
      var fn = R[page.replace(/-/g, '')];
      if (fn) fn();
      wireMore();
      document.body.classList.add('loaded');
    })
    .catch(function (err) {
      console.error('Could not load site content', err);
      var m = document.getElementById('main');
      if (m) m.insertAdjacentHTML('afterbegin', '<p class="load-error">Sorry, this page did not load. Please refresh, or email hoccclub@gmail.com.</p>');
    });
})();
