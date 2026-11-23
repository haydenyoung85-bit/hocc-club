# Writes the HTML page shells. Content is filled in by site.js from content/site.json.
# Run from the site folder:  python3 tools/build-pages.py
NAV = [("index.html", "Home"), ("about.html", "About"), ("events.html", "Events"), ("car-show.html", "Car Show"),
       ("gallery.html", "Photos"), ("for-sale.html", "For Sale"), ("apparel.html", "Apparel"), ("contact.html", "Contact")]
MENU_EXTRA = [("membership.html", "Membership"), ("charities.html", "Charities & Sponsors")]
DESC = "Heart of Oklahoma Corvette Club (HOCC): a not-for-profit Oklahoma Corvette club. Events, the Height of Summer Corvette Show, photos, for sale listings and membership."

def head(title, desc=DESC, extra=""):
    t = title + " | Heart of Oklahoma Corvette Club" if title != "Home" else "Heart of Oklahoma Corvette Club"
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{t}</title>
<meta name="description" content="{desc}">
<meta property="og:title" content="{t}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="images/42bc1aed-CS-1.jpg">
<meta property="og:type" content="website">
<link rel="icon" href="images/1b97d2c0-HOCC-Logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Caveat:wght@700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">{extra}
</head>
'''

def header(cur):
    def li(h, l):
        a = ' aria-current="page"' if h == cur else ''
        return f'<li><a href="{h}"{a}>{l}</a></li>'
    nav = "".join(li(h, l) for h, l in NAV)
    menu = "".join(li(h, l) for h, l in NAV + MENU_EXTRA)
    return f'''<a class="skip" href="#main">Skip to main content</a>
<header class="site-header">
  <div class="wrap header-top">
    <a class="brand" href="index.html"><img src="images/1b97d2c0-HOCC-Logo.png" alt="Heart of Oklahoma Corvette Club logo"><span>Heart of Oklahoma Corvette Club</span></a>
    <a class="join-btn" href="car-show.html" data-href="settings.headerButtonLink"><span class="l-full" data-t="settings.headerButtonText">2027 Car Show</span><span class="l-short" data-t="settings.headerButtonShort">Car Show</span></a>
    <details class="menu"><summary>Menu</summary><ul>{menu}</ul></details>
  </div>
  <nav class="nav" aria-label="Main"><div class="wrap"><ul>{nav}</ul></div></nav>
</header>
'''

FOOTER = '''<footer class="site-footer">
  <div class="wrap">
    <div class="foot-grid">
      <div>
        <h2>Heart of Oklahoma Corvette Club</h2>
        <p>Email: <a href="mailto:hoccclub@gmail.com" data-mail="settings.email">hoccclub@gmail.com</a></p>
        <p data-phone hidden>Phone: <a href="#"></a></p>
        <address data-t="settings.address">17118 N. County Rd. 3197<br>Pauls Valley, OK 73075</address>
        <p><a href="https://www.facebook.com/groups/1453977328508756" data-href="settings.facebook" data-hide-empty>Our Facebook group</a></p>
      </div>
      <div>
        <h2>More</h2>
        <ul class="foot-links">
          <li><a href="membership.html">Membership</a></li>
          <li><a href="charities.html">Charities &amp; Sponsors</a></li>
          <li><a href="for-sale.html">For Sale</a></li>
          <li><a href="apparel.html">Apparel</a></li>
        </ul>
      </div>
    </div>
    <p class="fine"><span data-t="settings.footerFine">Incorporated in Oklahoma as a Not For Profit Corporation on June 12, 2023. 501(c)(3). EIN 93-1833147.</span> <a class="admin-link" href="admin/">Club admin</a></p>
  </div>
</footer>
<noscript><p class="load-error">This website needs JavaScript turned on. You can always email the club at hoccclub@gmail.com.</p></noscript>
<script src="site.js" defer></script>
</body>
</html>
'''

import re, html as H, json
TEXT = {}
PAGE_NAMES = {"index.html": "Home", "about.html": "About", "events.html": "Events", "gallery.html": "Photos", "car-show.html": "Car Show",
  "apparel.html": "Apparel", "for-sale.html": "For Sale", "charities.html": "Charities", "contact.html": "Contact", "membership.html": "Membership",
  "thanks.html": "Thank-you page (membership)", "thanks-for-sale.html": "Thank-you page (for sale)", "thanks-contact.html": "Thank-you page (contact)",
  "thanks-registration.html": "Thank-you page (registration)"}
TAGRE = re.compile(r'<(h1|h2|h3|p|a|button|legend|summary)((?:\s[^>]*)?)>([^<>]{2,})</\1>')
def autotag(fn, body):
    pn = PAGE_NAMES.get(fn)
    if not pn: return body
    def rep(m):
        tag, attrs, txt = m.group(1), m.group(2) or '', m.group(3)
        if ' id=' in attrs or 'data-' in attrs: return m.group(0)
        if tag == 'p' and 'class="label"' not in attrs and 'lead' not in attrs and 'big-note' not in attrs and 'fine-print' not in attrs: return m.group(0)
        if tag == 'a' and 'class="btn' not in attrs: return m.group(0)
        val = H.unescape(txt).strip()
        key = (pn + ': ' + val).replace('.', '')[:70]
        TEXT[key] = val
        return '<%s%s data-t="text.%s">%s</%s>' % (tag, attrs, H.escape(key, quote=True), txt, tag)
    return TAGRE.sub(rep, body)

def page(fn, title, pageid, cur, body, desc=DESC):
    html = head(title, desc) + f'<body data-page="{pageid}">\n' + header(cur) + '\n<main id="main">\n' + autotag(fn, body.strip()) + '\n</main>\n\n' + FOOTER
    open(fn, "w").write(html)

def title_block(label, h1, sub_id=None, sub=""):
    s = f'<p id="{sub_id}">{sub}</p>' if sub_id else ""
    return f'<div class="page-title"><div class="wrap"><p class="label">{label}</p><h1>{h1}</h1>{s}</div></div>\n'

FS_HIDDEN = '<input type="hidden" name="_template" value="table"><input type="hidden" name="_next" value=""><input type="text" name="_honey" class="hidden" tabindex="-1" autocomplete="off" aria-hidden="true">'

pages = {}

page("index.html", "Home", "home", "index.html", '''
  <div class="hero">
    <img class="hero-img" id="hero-img" src="images/42bc1aed-CS-1.jpg" alt="Rows of Corvettes with hoods raised at the club car show">
    <div class="wrap hero-text">
      <p class="eyebrow hide-m" id="hero-eyebrow">Oklahoma Corvette club &middot; Not-For-Profit &middot; 501(c)(3)</p>
      <h1 id="hero-title">Corvette people, good company, and a hand for those in need.</h1>
      <p class="hide-m" id="hero-text"></p>
      <div class="btn-row">
        <a class="btn gold" id="hero-b1" href="car-show.html">Car Show info</a>
        <a class="btn light hide-m" id="hero-b2" href="events.html">Upcoming events</a>
      </div>
    </div>
  </div>

  <section class="band">
    <div class="wrap">
      <p class="label">On the calendar</p>
      <h2 class="hand-h">Coming up</h2>
      <div id="home-events"></div>
      <p><a class="btn dark" href="events.html">All upcoming events</a></p>
    </div>
  </section>

  <section>
    <div class="wrap two">
      <div>
        <p class="label">Our purpose</p>
        <h2>Why the club exists</h2>
        <div id="purpose"></div>
      </div>
      <div>
        <p class="label">Club officers</p>
        <h2>Who to look for</h2>
        <ul class="officer-mini" id="officer-mini"></ul>
        <p style="margin-top:.6rem"><a href="about.html#officers">Meet our club officers</a></p>
      </div>
    </div>
  </section>

  <section class="band">
    <div class="wrap">
      <p class="label">From our car show</p>
      <h2 class="hand-h" id="home-photos-title">A few photos</h2>
      <div id="home-photos"></div>
      <p style="margin-top:1rem"><a class="btn dark" href="gallery.html">See all photos</a></p>
    </div>
  </section>

  <section id="nm-sec"><div class="wrap" id="home-new-members" hidden></div></section>

  <section class="band-dark">
    <div class="wrap two">
      <div>
        <h2>Giving back</h2>
        <p id="home-giving"></p>
        <p><a href="charities.html">Our charities and sponsors</a></p>
      </div>
      <div class="join-quiet">
        <h2>Join the club</h2>
        <p id="home-join"></p>
        <p><a href="membership.html">Membership information</a></p>
      </div>
    </div>
  </section>

  <section class="sponsor-strip">
    <div class="wrap">
      <p class="label">With thanks</p>
      <h2>Our sponsors</h2>
      <div id="home-sponsors"></div>
    </div>
  </section>
''')

page("about.html", "About & Officers", "about", "about.html", title_block("About the club", "About &amp; Officers") + '''
  <section id="purpose">
    <div class="wrap two">
      <div><h2>Our purpose</h2><div id="about-purpose"></div></div>
      <figure id="about-photo" style="margin:0"></figure>
    </div>
  </section>
  <section class="band" id="officers-sec">
    <div class="wrap">
      <p class="label">Leadership</p>
      <h2 id="officers-h">Meet The HOCC Officers</h2>
      <div class="officers" id="officers"></div>
    </div>
  </section>
  <section id="new-members-sec" hidden><div class="wrap" id="new-members"></div></section>
  <section id="faq">
    <div class="wrap narrow">
      <p class="label">Good to know</p>
      <h2>Frequently Asked Questions</h2>
      <div class="faq" id="faqs"></div>
    </div>
  </section>
''')

page("events.html", "Upcoming Events", "events", "events.html", title_block("On the calendar", "Upcoming Events", "events-intro") + '''
  <section><div class="wrap narrow" id="events-list"></div></section>
  <section class="band" id="meetings-sec">
    <div class="wrap">
      <p class="label">Where we meet</p>
      <h2>Meeting Locations</h2>
      <div class="cards" id="meetings"></div>
      <p style="margin-top:1.5rem">Questions about an event? Email <a href="mailto:hoccclub@gmail.com" data-mail="settings.email">hoccclub@gmail.com</a>.</p>
    </div>
  </section>
''')

page("gallery.html", "Photos", "gallery", "gallery.html", title_block("Photos", "Club Photos", "gallery-intro") + '''
  <section><div class="wrap" id="gallery"></div></section>
''')

page("car-show.html", "Car Show", "car-show", "car-show.html", '''
  <div class="page-title show-title"><div class="wrap">
    <p class="label" id="cs-label"></p>
    <h1 id="cs-title">Car Show</h1>
    <p id="cs-when"></p>
    <div id="cs-status"></div>
    <p><a class="btn gold" id="cs-register-top" href="#register-sec" hidden>Register for the show</a></p>
  </div></div>
  <section>
    <div class="wrap two">
      <div>
        <div id="cs-opening" hidden></div>
        <div id="cs-highlights" class="chips"></div>
        <h3>Show details</h3>
        <div id="cs-details"></div>
        <p id="cs-benefit"></p>
        <p><a class="btn dark" id="donate" href="#" hidden>Donate with PayPal</a></p>
      </div>
      <figure id="cs-image" class="tilt"></figure>
    </div>
  </section>
  <section class="band" id="register-sec" hidden></section>
  <section class="band" id="hotels-sec">
    <div class="wrap">
      <p class="label">Where to stay</p>
      <h2 class="hand-h">Hotels &amp; lodging</h2>
      <p>Use the group code when you call, or scan the QR code with your phone camera.</p>
      <ul class="hotels" id="cs-hotels"></ul>
    </div>
  </section>
  <section id="qrs-sec" hidden>
    <div class="wrap"><h2>QR codes</h2><ul class="qr-list" id="cs-qrs"></ul></div>
  </section>
  <section>
    <div class="wrap two">
      <details class="check" open><summary>Camper information</summary><div class="acc-body" id="cs-camper"></div></details>
      <details class="check" open><summary>Hotel shuttle</summary><div class="acc-body" id="cs-shuttle"></div></details>
    </div>
  </section>
  <section class="band" id="classes-sec">
    <div class="wrap">
      <details class="check open-d"><summary>Show classes</summary><div class="acc-body"><ul class="classes" id="cs-classes"></ul></div></details>
    </div>
  </section>
  <section>
    <div class="wrap"><ul class="logos" id="cs-partners"></ul>
    <p style="margin-top:1rem">Read about <a href="charities.html">our charities</a>.</p></div>
  </section>
''')

page("apparel.html", "Apparel", "apparel", "apparel.html", title_block("Club store", "Apparel", "apparel-intro") + '''
  <section>
    <div class="wrap">
      <div class="drt card" id="drt" hidden>
        <div><h2 id="drt-title">DRT Shop</h2><p id="drt-text"></p></div>
        <a class="btn gold" id="drt-link" href="#">Go to the DRT shop</a>
      </div>
      <ul class="products" id="apparel"></ul>
    </div>
  </section>
''')

page("for-sale.html", "For Sale", "for-sale", "for-sale.html", title_block("Member classifieds", "For Sale", "fs-intro") + f'''
  <section><div class="wrap" id="listings"></div></section>
  <section class="band" id="sell">
    <div class="wrap narrow">
      <h2>Sell your Corvette or parts</h2>
      <p class="big-note">The club reviews every listing before it goes on the website.</p>
      <form id="sell-form" method="POST" enctype="multipart/form-data" action="https://formsubmit.co/hoccclub@gmail.com">
        <input type="hidden" name="_subject" value="For Sale submission (website)">
        <input type="hidden" name="_captcha" value="true">{FS_HIDDEN}
        <fieldset><legend>About you</legend>
          <div class="field"><label for="s-name">Your name</label><input id="s-name" name="name" type="text" autocomplete="name" required></div>
          <div class="row">
            <div class="field"><label for="s-phone">Phone</label><input id="s-phone" name="phone" type="tel" autocomplete="tel" required></div>
            <div class="field"><label for="s-email">Email</label><input id="s-email" name="email" type="email" autocomplete="email" required></div>
          </div>
        </fieldset>
        <fieldset><legend>What are you selling?</legend>
          <div class="field"><label for="s-title">Title <span class="opt">(e.g. 1999 C5 Coupe, or C5 fender covers)</span></label><input id="s-title" name="title" type="text" required></div>
          <div class="field"><label for="s-price">Asking price</label><input id="s-price" name="price" type="text" required></div>
          <div class="field"><label for="s-desc">Description</label><textarea id="s-desc" name="description" rows="5" required></textarea></div>
          <div class="field"><label for="s-photo1">Photo 1</label><input id="s-photo1" name="attachment" type="file" accept="image/*"></div>
          <div class="field"><label for="s-photo2">Photo 2 <span class="opt">(optional)</span></label><input id="s-photo2" name="attachment2" type="file" accept="image/*"></div>
          <div class="field"><label for="s-photo3">Photo 3 <span class="opt">(optional)</span></label><input id="s-photo3" name="attachment3" type="file" accept="image/*"></div>
          <p class="fine-print">Keep photos under 5 MB in total. You can also email more photos to the club.</p>
        </fieldset>
        <button class="btn gold big" type="submit">Send my listing to the club</button>
      </form>
    </div>
  </section>
''')

page("charities.html", "Charities & Sponsors", "charities", "", title_block("Community", "Charities &amp; Sponsors", "charities-intro") + '''
  <section><div class="wrap"><h2>Our Charities</h2><div id="charities"></div>
    <p style="margin-top:1rem"><a class="btn dark" id="donate" href="#" hidden>Donate with PayPal</a></p></div></section>
  <section class="band">
    <div class="wrap">
      <p class="label">With thanks</p>
      <h2>Our Sponsors</h2>
      <p id="sponsors-intro"></p>
      <div id="sponsors"></div>
      <figure id="trailer" style="margin:2rem 0 0;max-width:600px"></figure>
    </div>
  </section>
''')

page("contact.html", "Contact", "contact", "contact.html", title_block("Get in touch", "Contact", "contact-intro") + f'''
  <section>
    <div class="wrap two">
      <div class="contact-box">
        <h3>Email</h3>
        <p><a class="big-link" href="mailto:hoccclub@gmail.com" data-mail="settings.email">hoccclub@gmail.com</a></p>
        <div data-phone hidden><h3>Phone</h3><p><a class="big-link" href="#"></a></p></div>
        <h3>Mailing address</h3>
        <address>Heart of Oklahoma Corvette Club<br><span data-t="settings.address"></span></address>
        <p style="margin-top:1rem"><a href="https://www.facebook.com/groups/1453977328508756" data-href="settings.facebook" data-hide-empty>Our Facebook group</a></p>
      </div>
      <form id="contact-form" method="POST" action="https://formsubmit.co/hoccclub@gmail.com">
        <h2>Send us a message</h2>
        <input type="hidden" name="_subject" value="Message from the club website">{FS_HIDDEN}
        <div class="field"><label for="c-name">Name</label><input id="c-name" name="name" type="text" autocomplete="name" required></div>
        <div class="field"><label for="c-email">Email</label><input id="c-email" name="email" type="email" autocomplete="email" required></div>
        <div class="field"><label for="c-subject">Subject</label><input id="c-subject" name="subject" type="text"></div>
        <div class="field"><label for="c-msg">Message</label><textarea id="c-msg" name="message" rows="5" required></textarea></div>
        <button class="btn gold" type="submit">Send message</button>
      </form>
    </div>
  </section>
''')

PAY_BLOCK = '''
      <p class="big-note pay-online" id="m-paynote" hidden></p>
      <div class="pay pay-buttons" hidden></div>
      <details class="check keep-open" open>
        <summary>Pay by check</summary>
        <div class="acc-body">
          <p class="check-text">Download and print the application, then mail it with your check to:</p>
          <address class="check-address"></address>
          <p style="margin-top:1rem"><a class="btn dark app-file" href="files/HOCC-Application.docx">Download the application (Word file)</a></p>
        </div>
      </details>'''

page("membership.html", "Membership", "membership", "", title_block("Membership", "Join / Renew Membership", "m-intro") + f'''
  <section>
    <div class="wrap">
      <ol class="steps">
        <li><b>Fill in your info</b>Tell us who you are and which Corvette you drive.</li>
        <li><b>Pay</b>Pay online, or mail a check.</li>
        <li><b>Done</b>Your information is with the club.</li>
      </ol>
      <p><strong>Renewing?</strong> <span id="m-renew"></span></p>
    </div>
  </section>
  <section class="band" id="form">
    <div class="wrap narrow">
      <h2>Fill in your information</h2>
      <form id="membership-form" action="https://formsubmit.co/hoccclub@gmail.com" method="POST">
        <input type="hidden" name="_subject" value="New HOCC membership information (website form)">{FS_HIDDEN}
        <fieldset>
          <legend>Are you new or renewing?</legend>
          <label class="choice"><input type="radio" name="member_type" value="New Member" required> New Member</label>
          <label class="choice"><input type="radio" name="member_type" value="Renewing Member"> Renewing Member</label>
        </fieldset>
        <fieldset>
          <legend>Which membership?</legend>
          <label class="choice"><input type="radio" name="plan" value="Single $40" data-plan="single" required> <span id="plan-single-label">Single &mdash; $40</span></label>
          <label class="choice"><input type="radio" name="plan" value="Family $50" data-plan="family"> <span id="plan-family-label">Family &mdash; $50</span></label>
        </fieldset>
        <fieldset>
          <legend>About you</legend>
          <div class="field"><label for="name">Full name</label><input id="name" name="name" type="text" autocomplete="name" required></div>
          <div class="field"><label for="spouse">Spouse or companion name <span class="opt">(optional)</span></label><input id="spouse" name="spouse_companion" type="text"></div>
          <div class="field"><label for="street">Street address</label><input id="street" name="street" type="text" autocomplete="street-address" required></div>
          <div class="row">
            <div class="field"><label for="city">City</label><input id="city" name="city" type="text" autocomplete="address-level2" required></div>
            <div class="field"><label for="state">State</label><input id="state" name="state" type="text" autocomplete="address-level1" required></div>
            <div class="field"><label for="zip">ZIP code</label><input id="zip" name="zip" type="text" inputmode="numeric" autocomplete="postal-code" required></div>
          </div>
          <div class="row">
            <div class="field"><label for="phone">Phone</label><input id="phone" name="phone" type="tel" autocomplete="tel" required></div>
            <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required></div>
          </div>
        </fieldset>
        <fieldset>
          <legend>Your Corvette</legend>
          <div class="row">
            <div class="field"><label for="year">Year</label><input id="year" name="corvette_year" type="text" inputmode="numeric"></div>
            <div class="field"><label for="model">Model</label><input id="model" name="corvette_model" type="text"></div>
            <div class="field"><label for="color">Color</label><input id="color" name="corvette_color" type="text"></div>
          </div>
        </fieldset>
        <button class="btn" type="submit" style="font-size:1.3rem">Send my information</button>
      </form>
    </div>
  </section>
  <section id="pay">
    <div class="wrap narrow">
      <h2>Pay your dues</h2>{PAY_BLOCK}
    </div>
  </section>
  <section><div class="wrap" id="m-photos"></div></section>
''')

page("thanks.html", "Thank you", "thanks", "", title_block("Step 1 is finished", "Thank you. Now please pay your dues.") + f'''
  <section id="pay"><div class="wrap narrow">{PAY_BLOCK}
    <p style="margin-top:1.5rem">Questions? Email <a href="mailto:hoccclub@gmail.com" data-mail="settings.email">hoccclub@gmail.com</a>.</p>
    <p><a class="btn dark" href="index.html">Back to the home page</a></p>
  </div></section>
''')

page("thanks-for-sale.html", "Listing sent", "thanks-fs", "", title_block("For Sale", "Thank you! Your listing was sent.") + '''
  <section><div class="wrap narrow">
    <p class="lead">The club will look it over. Once it is approved, it will show on the For Sale page.</p>
    <p><a class="btn dark" href="for-sale.html">Back to For Sale</a></p>
  </div></section>
''')

page("thanks-contact.html", "Message sent", "thanks-c", "", title_block("Contact", "Thank you! Your message was sent.") + '''
  <section><div class="wrap narrow">
    <p class="lead">Someone from the club will get back to you.</p>
    <p><a class="btn dark" href="index.html">Back to the home page</a></p>
  </div></section>
''')

page("thanks-registration.html", "Registration", "thanks-reg", "", '<div class="page-title"><div class="wrap"><p class="label">Car show</p><h1 id="tr-title">Thank you!</h1></div></div>' + '''
  <section><div class="wrap narrow" id="tr-pay"></div>
  <div class="wrap narrow"><p><a class="btn dark" href="car-show.html">Back to the car show page</a></p></div></section>
''')

open("car-show-2026.html", "w").write('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Car Show</title><meta http-equiv="refresh" content="0; url=car-show.html"><link rel="canonical" href="car-show.html"></head><body><p><a href="car-show.html">Go to the car show page</a></p></body></html>\n')
open("404.html", "w").write(head("Page not found") + '<body data-page="404">\n' + header("") + '\n<main id="main">' + title_block("Oops", "That page is not here") + '<section><div class="wrap"><p><a class="btn dark" href="index.html">Go to the home page</a></p></div></section></main>\n' + FOOTER.replace('src="site.js"', 'src="site.js"'))
# add any new page-text keys to the content file (never overwrites the club's edits)
c = json.load(open("content/site.json"))
t = c.setdefault("text", {})
added = 0
for k, v in TEXT.items():
    if k not in t: t[k] = v; added += 1
json.dump(c, open("content/site.json", "w"), indent=1, ensure_ascii=False)
print("pages written;", len(TEXT), "page-text keys,", added, "new")
