'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initBackground();
  initCursor();
  initNavigation();
  initHeroTypewriter();
  initScrollReveal();
  initProjectCards();
  initProjectFilters();
  initContactForm();
  initBackToTop();
  document.getElementById('currentYear').textContent = new Date().getFullYear();
});

/* ============================================================
   BACKGROUND — ambient drifting stars
   ============================================================ */
function initBackground() {
  const canvas = document.getElementById('neon-grid');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, stars = [], raf;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function makeStar() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      a: Math.random(),
      da: (Math.random() * 0.006 + 0.002) * (Math.random() < 0.5 ? 1 : -1),
    };
  }

  resize();
  window.addEventListener('resize', resize);

  const N = Math.min(Math.floor((W * H) / 14000), 120);
  for (let i = 0; i < N; i++) stars.push(makeStar());

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, W, H);

    for (const s of stars) {
      s.x += s.vx; s.y += s.vy;
      s.a += s.da;
      if (s.a > 0.55) { s.a = 0.55; s.da *= -1; }
      if (s.a < 0.05) { s.a = 0.05; s.da *= -1; }
      if (s.x < -2) s.x = W + 2;
      if (s.x > W + 2) s.x = -2;
      if (s.y < -2) s.y = H + 2;
      if (s.y > H + 2) s.y = -2;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,200,220,${s.a})`;
      ctx.fill();
    }
    raf = requestAnimationFrame(draw);
  }
  draw();
}

/* ============================================================
   CURSOR — smooth lag glow + snappy dot
   ============================================================ */
function initCursor() {
  const glow = document.getElementById('cursorGlow');
  const dot  = document.getElementById('cursorDot');
  if (!glow || !dot) return;

  // Don't run on touch devices
  if (window.matchMedia('(pointer: coarse)').matches) return;

  let mx = -999, my = -999;
  let gx = -999, gy = -999;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  // Expand dot on interactive elements
  document.querySelectorAll('a, button, .project-card, .skill-pill, .filter-btn').forEach(el => {
    el.addEventListener('mouseenter', () => dot.classList.add('expanded'));
    el.addEventListener('mouseleave', () => dot.classList.remove('expanded'));
  });

  (function lagGlow() {
    gx += (mx - gx) * 0.07;
    gy += (my - gy) * 0.07;
    glow.style.left = gx + 'px';
    glow.style.top  = gy + 'px';
    requestAnimationFrame(lagGlow);
  })();
}

/* ============================================================
   NAVIGATION — scroll shrink + active section highlight
   ============================================================ */
function initNavigation() {
  const navbar    = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navLinks  = document.getElementById('navLinks');
  const links     = document.querySelectorAll('.nav-link');
  const sections  = document.querySelectorAll('section[id]');

  // Scroll → shrink navbar + highlight active section
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
      highlightNav();
      ticking = false;
    });
  }, { passive: true });

  function highlightNav() {
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 110) current = sec.id;
    });
    links.forEach(l => l.classList.toggle('active', l.dataset.section === current));
  }

  // Mobile hamburger
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('active');
    navToggle.classList.toggle('active', open);
    navToggle.setAttribute('aria-expanded', open);
  });

  // Close mobile menu on link click
  links.forEach(l => l.addEventListener('click', closeMobileNav));

  // Close on outside click
  document.addEventListener('click', e => {
    if (!navbar.contains(e.target)) closeMobileNav();
  });

  function closeMobileNav() {
    navLinks.classList.remove('active');
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
  }
}

/* ============================================================
   SCROLL REVEAL — staggered fade-up as sections enter view
   ============================================================ */
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -48px 0px' });

  els.forEach(el => io.observe(el));
}

/* ============================================================
   PROJECT CARDS — 3-D tilt + mouse-spotlight
   ============================================================ */
function initProjectCards() {
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const x  = e.clientX - r.left;
      const y  = e.clientY - r.top;
      const cx = r.width  / 2;
      const cy = r.height / 2;

      // Spotlight CSS vars
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);

      // Gentle tilt — max ±5 deg
      const rx = ((y - cy) / cy) * -4;
      const ry = ((x - cx) / cx) *  4;
      card.style.transform =
        `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.015,1.015,1.015)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform =
        'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    });
  });
}

/* ============================================================
   PROJECT FILTERS — smooth show/hide with opacity transition
   ============================================================ */
function initProjectFilters() {
  const btns  = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.project-card');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        if (match) {
          card.style.display = '';
          requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          });
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.94)';
          setTimeout(() => {
            if (card.style.opacity === '0') card.style.display = 'none';
          }, 280);
        }
      });
    });
  });
}

/* ============================================================
   CONTACT FORM — Web3Forms submission
   ============================================================ */
function initContactForm() {
  const form   = document.getElementById('contactForm');
  const submit = document.getElementById('formSubmit');
  const status = document.getElementById('formStatus');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    submit.classList.add('loading');
    submit.disabled = true;

    try {
      const res  = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: new FormData(form),
      });
      const data = await res.json();

      if (data.success) {
        showStatus('success', '✓ Message sent! I\'ll get back to you soon.');
        form.reset();
      } else {
        showStatus('error', '✕ Something went wrong. Please try again or email me directly.');
      }
    } catch {
      showStatus('error', '✕ Network error. Please email me directly.');
    } finally {
      submit.classList.remove('loading');
      submit.disabled = false;
    }
  });

  function showStatus(type, msg) {
    status.className = `form-status ${type}`;
    status.textContent = msg;
    setTimeout(() => { status.className = 'form-status'; }, 6000);
  }

  // Subtle focus-glow on inputs
  document.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('focus',  () => input.closest('.form-group').classList.add('focused'));
    input.addEventListener('blur',   () => input.closest('.form-group').classList.remove('focused'));
  });
}

/* ============================================================
   BACK TO TOP
   ============================================================ */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ============================================================
   SMOOTH ANCHOR SCROLL (for any <a href="#...">)
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id && id.length > 1) {
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });
});

/* ============================================================
   SCROLL REVEAL
   ============================================================ */
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('active'); io.unobserve(e.target); } });
  }, { threshold: 0.08, rootMargin: '0px 0px -48px 0px' });
  els.forEach(el => io.observe(el));
}

/* ============================================================
   PROJECT CARDS — 3D tilt + spotlight
   ============================================================ */
function initProjectCards() {
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const x  = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
      const rx = ((y - r.height/2) / r.height * 2) * -4;
      const ry = ((x - r.width/2)  / r.width  * 2) *  4;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.015,1.015,1.015)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(900px) rotateX(0) rotateY(0) scale3d(1,1,1)';
    });
  });
}

/* ============================================================
   PROJECT FILTERS
   ============================================================ */
function initProjectFilters() {
  const btns  = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.project-card');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      cards.forEach(card => {
        const show = f === 'all' || card.dataset.category === f;
        if (show) {
          card.style.display = '';
          requestAnimationFrame(() => { card.style.opacity = '1'; card.style.transform = ''; });
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.94)';
          setTimeout(() => { if (card.style.opacity === '0') card.style.display = 'none'; }, 280);
        }
      });
    });
  });
}

/* ============================================================
   CONTACT FORM
   ============================================================ */
function initContactForm() {
  const form   = document.getElementById('contactForm');
  const submit = document.getElementById('formSubmit');
  const status = document.getElementById('formStatus');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    submit.classList.add('loading'); submit.disabled = true;
    try {
      const res  = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: new FormData(form) });
      const data = await res.json();
      if (data.success) { showStatus('success', '✓ Message sent! I\'ll get back to you soon.'); form.reset(); }
      else showStatus('error', '✕ Something went wrong. Please try again.');
    } catch { showStatus('error', '✕ Network error. Please email me directly.'); }
    finally   { submit.classList.remove('loading'); submit.disabled = false; }
  });
  function showStatus(type, msg) {
    status.className = `form-status ${type}`; status.textContent = msg;
    setTimeout(() => { status.className = 'form-status'; }, 6000);
  }
  document.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('focus', () => input.closest('.form-group').classList.add('focused'));
    input.addEventListener('blur',  () => input.closest('.form-group').classList.remove('focused'));
  });
}

/* ============================================================
   BACK TO TOP
   ============================================================ */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 500), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ============================================================
   SMOOTH ANCHOR SCROLL
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id && id.length > 1) {
      const t = document.querySelector(id);
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }
  });
});

/* ============================================================
   HERO TYPEWRITER — fun rotating descriptors
   ============================================================ */
function initHeroTypewriter() {
  const el = document.getElementById('heroRoleText');
  if (!el) return;

  const roles = [
    'builder, not just a learner',
    'debugger of life choices',
    'Python enthusiast (it\'s a feature)',
    'ML tinkerer',
    'open source contributor',
    'breaker & fixer of things',
    'GSoC 2026 participant',
    'data nerd with a keyboard',
    'bug creator (and solver)',
  ];

  let ri = 0, ci = 0, deleting = false, pauseTimer = null;

  const TYPING_SPEED   = 55;
  const DELETING_SPEED = 28;
  const PAUSE_END      = 1800;
  const PAUSE_START    = 320;

  function tick() {
    const current = roles[ri];
    if (!deleting) {
      el.textContent = current.slice(0, ci + 1);
      ci++;
      if (ci === current.length) {
        deleting = true;
        pauseTimer = setTimeout(tick, PAUSE_END);
        return;
      }
      setTimeout(tick, TYPING_SPEED);
    } else {
      el.textContent = current.slice(0, ci - 1);
      ci--;
      if (ci === 0) {
        deleting = false;
        ri = (ri + 1) % roles.length;
        setTimeout(tick, PAUSE_START);
        return;
      }
      setTimeout(tick, DELETING_SPEED);
    }
  }

  setTimeout(tick, 900);
}
