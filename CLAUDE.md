# CLAUDE.md — Heart of Oklahoma Corvette Club (HOCC) website

Read this before changing anything. This is a live club website edited by two kinds of people:
the club (through the admin panel) and developers/Claude (through git). Don't break the admin.

## What this is
- Static site, vanilla HTML/CSS/JS. **No build step, no npm, no framework.** Keep it that way.
- Hosted free on GitHub Pages from `main` (repo `haydenyoung85-bit/hocc-club`).
- Live: https://haydenyoung85-bit.github.io/hocc-club/ — admin: `/admin/`. Future domain: https://hocc.club
- All internal links and asset paths are **relative** (`about.html`, `images/x.jpg`), so the site works both under `/hocc-club/` and at a domain root. Never use leading-slash paths.

## Layout
| Path | What it is |
|---|---|
| `content/site.json` | **ALL site content** (text, events, officers, sponsors, hotels, QR codes, for-sale listings, prices, links, registration settings, every heading under `text`). Edited by the admin panel. |
| `site.js` | Reads `content/site.json` and renders every page (one renderer per `body[data-page]`). Escapes all text. |
| `style.css` | All public styles. Mobile rules in `@media (max-width: 700px)`. |
| `*.html` | Page shells (header, nav, footer, empty containers with ids). **Generated** by `tools/build-pages.py`. |
| `tools/build-pages.py` | Writes the HTML shells. Auto-tags static headings/buttons with `data-t="text.<Page>: <text>"` and adds any new keys to `content/site.json` → `text` (never overwrites existing values). |
| `tools/seed-content.py` | One-time seed used at launch. **Do not run again** — it would wipe the club's edits. |
| `tools/make-login.mjs` | Creates/updates `admin/login.json` (encrypted admin login). |
| `admin/` | Admin panel: `index.html`, `admin.js` (logic), `schema.js` (which fields of site.json are editable and how), `admin.css`, `config.js` (repo/branch/paths). |
| `admin/login.json` | Encrypted GitHub token per editor (AES-GCM, PBKDF2 600k). One editor today: username `HOCCadmin` (case-insensitive). The JSON field is still called `email` but holds the username. **Never edit, regenerate, or delete it.** Editors change passwords/add editors in the admin. |
| `images/` | Original photos. `images/uploads/` = photos uploaded by the admin. Don't rename or delete files referenced in site.json. |
| `files/` | Downloads (membership application). |
| `car-show-2026.html` | Redirect to `car-show.html` (old link). |

## The golden rule: content goes in the data file, not the HTML
- To change words, events, prices, photos, sponsors, listings, links: **edit `content/site.json`**, not the HTML. Hardcoded content in HTML can't be changed by the club and will clash with the admin.
- When you add a NEW kind of content:
  1. add the data to `content/site.json` (merge in; don't reformat or drop existing keys),
  2. render it in `site.js` (use `esc()`, `para()`, `safeUrl()`, `img()` — never put raw strings into innerHTML),
  3. add it to `admin/schema.js` so the club can edit it (plain-English labels; field types: text, longtext, number, money, date, url, link, email, phone, image, file, toggle, bigswitch, select, list),
  4. if you changed page structure, edit `tools/build-pages.py` and run `python3 tools/build-pages.py`.
- The club may have saved edits since your last pull. **Always `git pull` first**, and only change the keys you mean to change. If you edit site.json, keep it valid JSON (`python3 -m json.tool content/site.json > /dev/null`). Formatting: 1-space indent, UTF-8, not ASCII-escaped.
- Empty values mean "hide it on the public site" (e.g. DRT link, PayPal links, club phone, dinner/T-shirt prices). Don't fill them with placeholders.

## Deploys
- Push to `main` → GitHub Pages republishes in about **1–2 minutes**. There is no staging; test locally first:
  `python3 -m http.server 8765` then open http://localhost:8765/ (check a 390px-wide phone view).
- The admin also commits to `main` (messages like "Website edit: Events (admin)" and "Website photo upload (admin)"). Expect those commits; rebase on them, never force-push.

## Rules
- **Mobile-first and compact.** Most visitors are on phones. Short scroll, no endless stacked sections; use horizontal strips, 2–3 column grids, accordions and "Read more" on phones. Check 390px width.
- **Look:** keep the hand-made, lively feel (red, white and blue club colors, Plus Jakarta Sans + the Caveat handwritten labels, red underline swashes, flag stripes, tilted photos). **No AI-SaaS look:** no dark-mode glows, no purple/neon gradients, no shimmer, no glassmorphism.
- **Show registration stays hidden** until the club flips the switch (`registration.enabled` in site.json, "Show Registration" in the admin). Never show registration, the countdown, waitlist or T-shirt pop-up while it's off. Don't change `enabled` yourself unless Hayden says so.
- **Payments are PayPal (the club's existing account). No Stripe.** Payment buttons are just PayPal links stored in site.json.
- Forms (membership, contact, for-sale submissions, registration) post to FormSubmit.co → `settings.email`. For Sale submissions are never auto-published; the admin approves them (`status: "approved"`).
- Membership stays discreet; the top-of-page gold button points to the Car Show page.
- Admin UI is for a 75-year-old: big text and buttons, plain words. Never show the words JSON, commit, repo, deploy or token in the admin UI.
- Accessibility: real labels on inputs, alt text, 48px+ tap targets, good contrast.
- **Never commit secrets** (tokens, passwords, `.env`, credential files). `admin/login.local.json` is git-ignored for local testing only. Don't touch `admin/login.json`.
- Never invent club facts (people, prices, dates, phone numbers). Ask Hayden.

## Turning on the hocc.club domain (later)
The domain stays registered at Squarespace; only DNS changes.
1. In Squarespace → Domains → hocc.club → DNS: remove the Squarespace site records, then add A records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (optionally AAAA `2606:50c0:8000::153` … `8003::153`), and a CNAME `www` → `haydenyoung85-bit.github.io`.
2. In this repo: Settings → Pages → Custom domain → `hocc.club` (this commits a `CNAME` file), wait for the DNS check, then tick **Enforce HTTPS**.
3. Nothing else changes (paths are relative; the admin moves to https://hocc.club/admin/). FormSubmit thank-you redirects are computed from the current address.

## Known limits
- No database: "spots left" for registration is a number the admin updates by hand; registrations/forms arrive as emails (FormSubmit needs a one-time activation click from hoccclub@gmail.com on first use).
- Still waiting on info: DRT shop link, dinner and T-shirt prices, PayPal links for membership/registration/apparel, club phone.

## Caching (important)
GitHub Pages tells browsers to cache files for 10 minutes. So:
- After changing `style.css` or `site.js`, run `python3 tools/build-pages.py` — it stamps `?v=<timestamp>` on them in every page.
- The admin (`admin/index.html`) always loads its CSS/JS with `?v=<now>` and fetches `login.json` / content with `cache: 'no-store'`, so it never runs stale code. Bump `ADMIN_VERSION` in `admin/admin.js` when you change the admin; it clears old login sessions.

## Colors
Club theme is red, white and blue: red `#C8102E` (main buttons), blue `#0A2463`, navy text `#0b1b3f`, white, warm off-white `#f8f5ef`. Flag stripes (hard color stops) under the header and above the footer are the only "gradient". (CSS variable names like `--teal`/`--gold` are legacy; their values are the blue/red.)

## Dates stay current by themselves
- site.js computes "today" in Central time (America/Chicago) on every page load.
- Events whose end date (or start date) is before today are dropped from the home page and Upcoming list and shown in a collapsed "Past events" list on events.html. If nothing is upcoming, `events.emptyText` is shown.
- `carShow.endDate`: after that day the car show page shows `pastLabel` / `pastNote` ("registration isn't open yet") and `hotelsPastNote` instead of the pre-show label and banner. Set a new endDate + dates when the next show is announced. Never invent dates.
