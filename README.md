# Rothschild Brothers — Mafiathon Trilogy 🎬

> *"Every story has a final chapter. Every brotherhood deserves one last gathering."*

A cinematic, production-grade landing page for the Rothschild Brothers final meetup.
Built with vanilla HTML, CSS, and JavaScript — zero dependencies, zero frameworks.

---

## Quick Start (Local Preview)

You do **not** need Node, npm, or any build tool.

```bash
# 1. Clone or download this repository
git clone https://github.com/YOUR_USERNAME/mafiathon.git
cd mafiathon

# 2. Open in a browser
#    Option A — double-click index.html (works for everything except RSVP)
#    Option B — serve with any static server (recommended):
npx serve .          # Node must be installed
# or
python3 -m http.server 8080
# then open http://localhost:8080
```

---

## File Structure

```
landing-page/
│
├── index.html                 ← All page markup (semantic, no inline CSS/JS)
│
├── styles/
│   ├── main.css               ← :root theme variables + reset + layout
│   ├── components.css         ← Every component style (navbar, hero, cards…)
│   └── animations.css         ← All @keyframes + animation timing variables
│
├── scripts/
│   └── main.js                ← Navbar, particles, countdown, music, RSVP
│
├── assets/
│   ├── icons/
│   │   ├── music-on.svg
│   │   └── music-off.svg
│   ├── images/                ← Add your own background images here (optional)
│   └── audio/                 ← Place theme.mp3 here (see Music section below)
│
├── README.md
└── .gitignore
```

---

## Customisation Guide

### 1. Change the Event Date (Countdown Timer)

Open `scripts/main.js` and edit line 1 of the config block:

```js
const EVENT_DATE = '2025-08-11T12:00:00+08:00';
//                  YYYY-MM-DD  HH:MM:SS  timezone
```

Use ISO 8601 format. `+08:00` is Singapore Standard Time (SGT).

### 2. Change Colours / Fonts / Spacing

Open `styles/main.css`. The entire `:root` block at the top controls every
visual property on the site. Changing a single variable updates everywhere it's used.

```css
:root {
  --color-primary: #7ec8e3;   /* baby blue — change this for a different mood */
  --font-display:  'Cinzel Decorative', serif;
  --color-gold:    #c9a84c;
  /* … etc */
}
```

### 3. Add Background Music

1. Obtain a royalty-free cinematic/mafia instrumental (e.g. from Pixabay, Free Music Archive).
2. Save it as `assets/audio/theme.mp3`.
3. The music toggle button in the navbar will work automatically.

> The `assets/audio/` folder is listed in `.gitignore` to avoid committing large
> binary files. Host the audio separately (e.g. GitHub Releases, Cloudflare R2)
> or keep it local-only.

### 4. Removing or Adding Sections

Each `<section>` in `index.html` is fully independent. You can safely:
- Delete any `<section>` block — the layout will not break.
- Add a new section by copying an existing one and giving it a new `id`.
- Add a matching `.section--newname` in `components.css` if you need a unique background.

---

## Database Setup — Brotherhood Attendance Tracker

The RSVP tracker has two modes:

| Mode | Data stored | Shared between friends? |
|------|-------------|------------------------|
| **localStorage** (default) | In the visitor's browser | ❌ No |
| **Supabase** (recommended) | Cloud Postgres database | ✅ Yes |

Use **Supabase** so all your brothers see each other's RSVPs in real time.

### Step-by-Step: Supabase Setup

#### 1. Create a free Supabase project

1. Go to [https://supabase.com](https://supabase.com) and sign up (it's free).
2. Click **New Project**, pick a name (e.g. `mafiathon`), set a DB password, choose a region close to Singapore (e.g. Southeast Asia).
3. Wait ~2 minutes for the project to provision.

#### 2. Create the `rsvps` table

In Supabase dashboard → **SQL Editor** → **New Query**, paste and run:

```sql
create table public.rsvps (
  id         bigint generated always as identity primary key,
  name       text    not null,
  status     text    not null check (status in ('attending', 'maybe', 'absent')),
  created_at timestamptz not null default now(),
  unique (name)   -- one entry per person; re-submitting updates their status
);

-- Allow anyone with the anon key to read and insert (no login required)
alter table public.rsvps enable row level security;

create policy "Allow public read"
  on public.rsvps for select
  using (true);

create policy "Allow public insert/upsert"
  on public.rsvps for insert
  with check (true);

create policy "Allow public update"
  on public.rsvps for update
  using (true);
```

#### 3. Get your API credentials

In the Supabase dashboard → **Settings** → **API**:

- Copy **Project URL** (looks like `https://xxxx.supabase.co`)
- Copy **anon / public** key (the long JWT string)

#### 4. Paste credentials into main.js

Open `scripts/main.js` and fill in the config block:

```js
const SUPABASE_URL      = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
```

> ✅ The anon key is **safe to expose** in frontend code. It only grants access
> according to the Row Level Security policies you set above (read + insert only).
> Never paste your `service_role` key into frontend code.

#### 5. Test it

Open the site, enter a name, click Submit RSVP. Refresh on another device —
the entry should appear within 20 seconds (the polling interval).

---

## Deployment on GitHub Pages

GitHub Pages hosts static sites for free and gives you a shareable URL like:
`https://YOUR_USERNAME.github.io/mafiathon/`

### Step 1 — Create a GitHub repository

1. Go to [https://github.com/new](https://github.com/new).
2. Name it `mafiathon` (or anything you like).
3. Set it to **Public** (required for free GitHub Pages).
4. Do **not** initialise with a README — you already have one.
5. Click **Create repository**.

### Step 2 — Push your code

```bash
cd landing-page            # the folder with index.html

git init
git add .
git commit -m "Initial commit — Mafiathon Trilogy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mafiathon.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

### Step 3 — Enable GitHub Pages

1. In your GitHub repo, click **Settings** → **Pages** (left sidebar).
2. Under **Source**, select **Deploy from a branch**.
3. Branch: `main`, Folder: `/ (root)`.
4. Click **Save**.

GitHub will build and deploy. After ~60 seconds, your site is live at:

```
https://YOUR_USERNAME.github.io/mafiathon/
```

Copy that URL and share it with the brothers. ✅

### Step 4 — Update the site later

Any time you make changes:

```bash
git add .
git commit -m "Update event date / fix typo / etc"
git push
```

GitHub Pages automatically redeploys within ~60 seconds.

### Step 5 (Optional) — Custom domain

If you own a domain (e.g. `mafiathon.com`):
1. In GitHub Pages settings, enter your domain under **Custom domain**.
2. Add a `CNAME` record pointing to `YOUR_USERNAME.github.io` at your DNS provider.
3. Enable **Enforce HTTPS**.

---

## Frequently Asked Questions

**Q: Why isn't the countdown working?**
A: Make sure `EVENT_DATE` in `main.js` is a valid ISO 8601 date string in the future.

**Q: RSVPs aren't showing for other people.**
A: You're using localStorage mode. Follow the Supabase setup above to enable shared data.

**Q: The music button does nothing.**
A: Add `assets/audio/theme.mp3` — the button is wired up but needs the audio file.
Browsers also block autoplay until the user clicks something, which the button handles.

**Q: How do I change the meetup to a specific date?**
A: Set `EVENT_DATE = '2025-08-11T12:00:00+08:00'` in `main.js` with your real date.
Also update the `📅 Date` event card text in `index.html` (`#eventDateDisplay`).

---

## Credits

Designed and built for the Rothschild Brothers.

*— Nuclear Nadal aka Arham Ahmed*
