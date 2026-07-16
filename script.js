// Blek Code — interactive layer

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCoarse = window.matchMedia('(hover: none)').matches;

/* ---------- Year ---------- */
document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Sticky nav ---------- */
const nav = document.getElementById('nav');
const onScroll = () => {
  if (window.scrollY > 12) nav.classList.add('is-scrolled');
  else nav.classList.remove('is-scrolled');
  // Scroll progress
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
  scrollProgress.style.transform = `scaleX(${ratio})`;
};
const scrollProgress = document.getElementById('scrollProgress');
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Mobile menu ---------- */
const mobileToggle = document.querySelector('.nav__toggle');
mobileToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  mobileToggle.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('.nav__links a').forEach(a => {
  a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    mobileToggle.setAttribute('aria-expanded', 'false');
  });
});

/* ---------- Theme toggle (with view-transition circular reveal) ---------- */
const THEME_KEY = 'blekcode-theme';
const themeToggle = document.getElementById('themeToggle');

function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  const meta = document.getElementById('themeColorMeta');
  if (meta) meta.setAttribute('content', theme === 'light' ? '#ffffff' : '#000000');
}

themeToggle.addEventListener('click', (e) => {
  const current = root.getAttribute('data-theme') || 'dark';
  const next = current === 'light' ? 'dark' : 'light';

  // Anchor the reveal at the toggle button
  const r = themeToggle.getBoundingClientRect();
  root.style.setProperty('--reveal-x', (r.left + r.width / 2) + 'px');
  root.style.setProperty('--reveal-y', (r.top + r.height / 2) + 'px');

  if (document.startViewTransition && !reduceMotion) {
    document.startViewTransition(() => {
      applyTheme(next);
    });
  } else {
    // Fallback: smooth crossfade via class
    document.body.classList.add('theme-transition');
    applyTheme(next);
    setTimeout(() => document.body.classList.remove('theme-transition'), 400);
  }

  try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
});

/* ---------- Cursor-following spotlight ---------- */
const cursorGlow = document.querySelector('.cursor-glow');
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let glowX = mouseX;
let glowY = mouseY;

if (cursorGlow && !isCoarse) {
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorGlow.classList.add('is-visible');
  });
  window.addEventListener('mouseleave', () => cursorGlow.classList.remove('is-visible'));

  const lerpGlow = () => {
    glowX += (mouseX - glowX) * 0.12;
    glowY += (mouseY - glowY) * 0.12;
    cursorGlow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0)`;
    requestAnimationFrame(lerpGlow);
  };
  if (!reduceMotion) lerpGlow();

  // Hero parallax — orbs follow cursor lazily
  const orbA = document.querySelector('.hero__orb--a');
  const orbB = document.querySelector('.hero__orb--b');
  const hero = document.querySelector('.hero');
  if (orbA && orbB && hero && !reduceMotion) {
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      orbA.style.transform = `translate(${x * 40}px, ${y * 40}px)`;
      orbB.style.transform = `translate(${x * -50}px, ${y * -50}px)`;
    });
  }
}

/* ---------- Card spotlight tracking ---------- */
function trackSpotlight(selector) {
  document.querySelectorAll(selector).forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });
}
trackSpotlight('.service');
trackSpotlight('.process__step');
trackSpotlight('.work .work__cover');
trackSpotlight('.btn');

/* ---------- Magnetic buttons ---------- */
function magnetize(el, strength = 0.25) {
  if (isCoarse || reduceMotion) return;
  el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = '';
  });
}
document.querySelectorAll('.btn, .nav__cta, .theme-toggle').forEach((el) => magnetize(el, 0.22));

/* ---------- Work-card 3D tilt ---------- */
if (!isCoarse && !reduceMotion) {
  document.querySelectorAll('.work').forEach((card) => {
    let raf = null;
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      // also feed the cover spotlight
      card.querySelector('.work__cover').style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.querySelector('.work__cover').style.setProperty('--my', (e.clientY - r.top) + 'px');
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform = `translateY(-6px) rotateX(${y * -5}deg) rotateY(${x * 6}deg)`;
      });
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ---------- Hero title — word-by-word reveal ---------- */
(() => {
  const title = document.querySelector('.hero__title');
  if (!title) return;
  const html = title.innerHTML.split(/(<br\s*\/?>(?:\s|&nbsp;)*)/i).map((chunk) => {
    if (/<br/i.test(chunk)) return chunk;
    return chunk.split(/(\s+)/).map((part) => {
      if (/^\s+$/.test(part) || part === '') return part;
      return `<span class="word">${part}</span>`;
    }).join('');
  }).join('');
  title.innerHTML = html;
  title.querySelectorAll('.word').forEach((w, i) => {
    w.style.animationDelay = (0.06 * i + 0.1) + 's';
  });
})();

/* ---------- Counter animation on scroll-into-view ---------- */
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
function animateCount(el) {
  const target = parseFloat(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const dur = 1400;
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / dur);
    const v = target * easeOutCubic(t);
    el.textContent = (target % 1 === 0 ? Math.round(v) : v.toFixed(1)) + suffix;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const heroMeta = document.getElementById('heroMeta');
if (heroMeta) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('[data-count]').forEach((el) => animateCount(el));
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  obs.observe(heroMeta);
}

/* ---------- Reveal-on-scroll ---------- */
const reveals = document.querySelectorAll(
  '.section__head, .service, .process__step, .work, .about__copy, .about__facts, .contact__form'
);
reveals.forEach(el => el.classList.add('reveal'));

const io = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('is-in'), i * 60);
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

reveals.forEach(el => io.observe(el));

/* ---------- Contact form (demo — no backend) ---------- */
const form = document.getElementById('contactForm');
const sent = document.getElementById('contactSent');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  form.querySelectorAll('input, select, textarea, button').forEach(el => el.disabled = true);
  sent.hidden = false;
  sent.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

/* ---------- Konami easter egg: Press B-L-E-K to flip theme ---------- */
(() => {
  const seq = ['b', 'l', 'e', 'k'];
  let idx = 0;
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === seq[idx]) {
      idx++;
      if (idx === seq.length) {
        themeToggle.click();
        idx = 0;
      }
    } else {
      idx = k === seq[0] ? 1 : 0;
    }
  });
})();
