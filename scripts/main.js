/**
 * main.js — Rothschild Brothers Mafiathon Trilogy
 *
 * Responsibilities:
 *   1. Navbar scroll behaviour
 *   2. Scroll-reveal IntersectionObserver
 *   3. Particle canvas (hero background)
 *   4. Countdown timer
 *   5. Music toggle
 *   6. RSVP + Attendance Tracker
 *      → Tries Supabase if configured, falls back to localStorage
 *
 * HOW TO CONFIGURE:
 *   • Set EVENT_DATE to your actual meetup date (ISO format).
 *   • Fill SUPABASE_URL and SUPABASE_ANON_KEY for a shared live tracker.
 *   • Leave both as '' to use localStorage (device-local only).
 *   • See README.md for full Supabase setup steps.
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   CONFIGURATION — edit these three values
   ───────────────────────────────────────────────────────────── */

/** ISO date string for the event — e.g. '2025-08-11T12:00:00+08:00' */
const EVENT_DATE = '2025-05-25T12:00:00+08:00';

/** Supabase project URL — leave '' to use localStorage fallback */
const SUPABASE_URL = 'https://vqrxuzzwhhxncdwaoaqz.supabase.co';

/** Supabase anon/public key — leave '' to use localStorage fallback */
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxcnh1enp3aGh4bmNkd2FvYXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NDQ0NzgsImV4cCI6MjA5NTAyMDQ3OH0.TVSEtbPLWrS-_-RAQnhTWhtQqs6zGwcBbyywhG6RW74';

/** Supabase table name (must exist — see README) */
const SUPABASE_TABLE = 'rsvps';


/* ─────────────────────────────────────────────────────────────
   UTILITY HELPERS
   ───────────────────────────────────────────────────────────── */

/** Pad a number to two digits */
function pad(n) {
  return String(n).padStart(2, '0');
}

/** Sanitise user-supplied text to prevent XSS */
function sanitise(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/** Map RSVP status to emoji badge */
function statusBadge(status) {
  const map = { attending: '✅', maybe: '🤔', absent: '💀' };
  return map[status] ?? '❔';
}


/* ─────────────────────────────────────────────────────────────
   1. NAVBAR — adds .navbar--scrolled when user scrolls
   ───────────────────────────────────────────────────────────── */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  function onScroll() {
    navbar.classList.toggle('navbar--scrolled', window.scrollY > 60);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}());


/* ─────────────────────────────────────────────────────────────
   2. SCROLL REVEAL — IntersectionObserver triggers .in-view
   ───────────────────────────────────────────────────────────── */
(function initReveal() {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  targets.forEach((el) => observer.observe(el));
}());


/* ─────────────────────────────────────────────────────────────
   3. PARTICLE CANVAS — floating blue particles in hero
   ───────────────────────────────────────────────────────────── */
(function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let animFrameId;

  function resize() {
    const hero = document.getElementById('hero');
    canvas.width  = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  }

  function createParticle() {
    return {
      x:       Math.random() * canvas.width,
      y:       canvas.height + Math.random() * 40,
      radius:  Math.random() * 2 + 0.4,
      speedY:  -(Math.random() * 0.45 + 0.18),
      speedX:  (Math.random() - 0.5) * 0.22,
      opacity: Math.random() * 0.45 + 0.12,
      life:    0,
      maxLife: Math.random() * 300 + 180,
    };
  }

  function initPool() {
    const count = Math.floor(canvas.width / 13);
    particles = Array.from({ length: count }, () => {
      const p = createParticle();
      p.y    = Math.random() * canvas.height;
      p.life = Math.random() * p.maxLife;
      return p;
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p, i) => {
      const progress = p.life / p.maxLife;
      const alpha = progress < 0.1
        ? (progress / 0.1) * p.opacity
        : progress > 0.8
          ? ((1 - progress) / 0.2) * p.opacity
          : p.opacity;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(126, 200, 227, ${alpha})`;
      ctx.fill();

      p.x    += p.speedX;
      p.y    += p.speedY;
      p.life += 1;

      if (p.life >= p.maxLife) {
        particles[i] = createParticle();
      }
    });

    animFrameId = requestAnimationFrame(draw);
  }

  resize();
  initPool();
  draw();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      cancelAnimationFrame(animFrameId);
      resize();
      initPool();
      draw();
    }, 200);
  });
}());


/* ─────────────────────────────────────────────────────────────
   4. COUNTDOWN TIMER
   ───────────────────────────────────────────────────────────── */
(function initCountdown() {
  const target  = new Date(EVENT_DATE).getTime();
  const elDays  = document.getElementById('cdDays');
  const elHours = document.getElementById('cdHours');
  const elMins  = document.getElementById('cdMinutes');
  const elSecs  = document.getElementById('cdSeconds');
  const elTimer = document.querySelector('.countdown');
  const elPast  = document.getElementById('countdownExpired');

  if (!elDays) return;

  function tick(el, newVal) {
    if (el.textContent === newVal) return;
    el.classList.add('tick');
    setTimeout(() => {
      el.textContent = newVal;
      el.classList.remove('tick');
    }, 120);
  }

  function update() {
    const diff = target - Date.now();

    if (diff <= 0) {
      if (elTimer) elTimer.hidden = true;
      if (elPast)  elPast.hidden  = false;
      return;
    }

    const totalSecs = Math.floor(diff / 1000);
    tick(elDays,  pad(Math.floor(totalSecs / 86400)));
    tick(elHours, pad(Math.floor((totalSecs % 86400) / 3600)));
    tick(elMins,  pad(Math.floor((totalSecs % 3600)  / 60)));
    tick(elSecs,  pad(totalSecs % 60));
  }

  update();
  setInterval(update, 1000);
}());


/* ─────────────────────────────────────────────────────────────
   5. MUSIC TOGGLE
   ───────────────────────────────────────────────────────────── */
(function initMusic() {
  const btn   = document.getElementById('musicToggle');
  const audio = document.getElementById('bgMusic');
  const icon  = document.getElementById('musicIcon');
  const label = document.getElementById('musicLabel');

  if (!btn || !audio) return;

  let playing = false;

  btn.addEventListener('click', () => {
    if (playing) {
      audio.pause();
      if (icon)  icon.src = 'assets/icons/music-off.svg';
      if (label) label.textContent = 'Music';
      btn.setAttribute('aria-pressed', 'false');
    } else {
      audio.play().catch(() => {
        // Browser blocked autoplay — user already clicked, just ignore
      });
      if (icon)  icon.src = 'assets/icons/music-on.svg';
      if (label) label.textContent = 'Music On';
      btn.setAttribute('aria-pressed', 'true');
    }
    playing = !playing;
  });
}());


/* ─────────────────────────────────────────────────────────────
   6. RSVP + ATTENDANCE TRACKER
   ─────────────────────────────────────────────────────────────
   Two storage adapters share the same interface:
     load()        → Promise<Array<entry>>
     save(entry)   → Promise<{ success: true }>
   Active adapter chosen at init based on SUPABASE_URL config.
   ───────────────────────────────────────────────────────────── */

/* ── Adapter: localStorage (offline / no-config fallback) ── */
const LocalAdapter = {
  _key: 'rsvp_entries',

  async load() {
    try {
      return JSON.parse(localStorage.getItem(this._key) || '[]');
    } catch {
      return [];
    }
  },

  async save(entry) {
    const entries = await this.load();
    const idx = entries.findIndex(
      (e) => e.name.toLowerCase() === entry.name.toLowerCase()
    );
    if (idx >= 0) {
      entries[idx] = entry; // update existing
    } else {
      entries.push(entry);
    }
    localStorage.setItem(this._key, JSON.stringify(entries));
    return { success: true };
  },
};

/* ── Adapter: Supabase REST API (shared live database) ── */
const SupabaseAdapter = {
  get _url() {
    return `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`;
  },
  get _headers() {
    return {
      'Content-Type':  'application/json',
      'apikey':        SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    };
  },

  async load() {
    const res = await fetch(`${this._url}?select=*&order=created_at.asc`, {
      headers: this._headers,
    });
    if (!res.ok) throw new Error(`Supabase load error: ${res.status}`);
    return res.json();
  },

  async save(entry) {
    const res = await fetch(this._url, {
      method:  'POST',
      headers: {
        ...this._headers,
        'Prefer': 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error(`Supabase save error: ${res.status}`);
    return { success: true };
  },
};

/* Choose active adapter */
const adapter = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? SupabaseAdapter
  : LocalAdapter;

/* ── DOM refs ── */
const rsvpSubmit      = document.getElementById('rsvpSubmit');
const rsvpNameInput   = document.getElementById('rsvpName');
const rsvpFeedback    = document.getElementById('rsvpFeedback');
const attendanceList  = document.getElementById('attendanceList');
const attendanceEmpty = document.getElementById('attendanceEmpty');
const statYes         = document.getElementById('statYes');
const statMaybe       = document.getElementById('statMaybe');
const statNo          = document.getElementById('statNo');

/** Animate a stat count and update its text */
function updateStat(el, newVal) {
  if (!el || el.textContent === String(newVal)) return;
  el.textContent = String(newVal);
  el.classList.remove('bump');
  void el.offsetWidth; // force reflow to restart CSS animation
  el.classList.add('bump');
}

/** Re-render attendance list and update stat counters */
function renderAttendance(entries) {
  if (!attendanceList) return;

  const counts = { attending: 0, maybe: 0, absent: 0 };
  entries.forEach((e) => {
    if (e.status in counts) counts[e.status]++;
  });

  updateStat(statYes,   counts.attending);
  updateStat(statMaybe, counts.maybe);
  updateStat(statNo,    counts.absent);

  attendanceList.innerHTML = '';

  if (entries.length === 0) {
    if (attendanceEmpty) attendanceEmpty.hidden = false;
    return;
  }

  if (attendanceEmpty) attendanceEmpty.hidden = true;

  entries.forEach((entry) => {
    const li = document.createElement('li');
    li.className = 'rsvp-entry';
    li.innerHTML = `
      <span class="rsvp-entry__badge" aria-hidden="true">${statusBadge(entry.status)}</span>
      <span class="rsvp-entry__name">${sanitise(entry.name)}</span>
    `;
    attendanceList.appendChild(li);
  });
}

/** Set feedback text below the RSVP form */
function setFeedback(msg, isError = false) {
  if (!rsvpFeedback) return;
  rsvpFeedback.textContent = msg;
  rsvpFeedback.classList.toggle('rsvp-form__feedback--error', isError);
}

/** Load entries and refresh the UI */
async function refreshAttendance() {
  try {
    const entries = await adapter.load();
    renderAttendance(entries);
  } catch (err) {
    console.warn('Could not refresh attendance:', err);
  }
}

/** Submit RSVP form */
async function handleRsvp() {
  const name   = (rsvpNameInput?.value || '').trim();
  const status = document.querySelector('input[name="rsvpStatus"]:checked')?.value;

  if (!name) {
    setFeedback('Please enter your name, brother.', true);
    rsvpNameInput?.focus();
    return;
  }
  if (!status) {
    setFeedback('Please pick a status.', true);
    return;
  }

  if (rsvpSubmit) rsvpSubmit.disabled = true;
  setFeedback('Submitting…');

  const entry = {
    name,
    status,
    created_at: new Date().toISOString(),
  };

  try {
    await adapter.save(entry);

    const messages = {
      attending: '🎉 You\'re in, brother!',
      maybe:     '🤔 Got it — we\'ll hold a seat just in case.',
      absent:    '💀 Noted. We\'ll pour one out for you.',
    };
    setFeedback(messages[status] || 'RSVP saved!');

    if (rsvpNameInput) rsvpNameInput.value = '';
    await refreshAttendance();
  } catch (err) {
    console.error('RSVP failed:', err);
    setFeedback('Something went wrong. Try again.', true);
  } finally {
    if (rsvpSubmit) rsvpSubmit.disabled = false;
  }
}

/* ── Wire RSVP events and initial load ── */
(function initRsvp() {
  if (!rsvpSubmit) return;

  rsvpSubmit.addEventListener('click', handleRsvp);

  rsvpNameInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleRsvp();
  });

  refreshAttendance();

  // Poll every 20 s when Supabase is live — keeps all browsers in sync
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    setInterval(refreshAttendance, 20_000);
  }
}());
