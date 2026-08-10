'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initBackground();
  initCursor();
  initNavigation();
  initHeroTypewriter();
  initScrollReveal();
  initProjectCards();
  initProjectFilters();
  initAboutGame();
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
   HERO TYPEWRITER — professional roles
   ============================================================ */
function initHeroTypewriter() {
  const el = document.getElementById('heroRoleText');
  if (!el) return;

  const roles = [
    'AI/ML Engineer',
    'Data Analyst',
    'Data Scientist',
    'Backend Developer',
    'Open Source Contributor',
    'Computer Vision Engineer',
    'Python Developer',
    'GSoC 2026 Participant',
  ];

  let ri = 0, ci = 0, deleting = false;

  const TYPE_SPEED   = 60;
  const DELETE_SPEED = 30;
  const PAUSE_END    = 1800;
  const PAUSE_NEXT   = 280;

  function tick() {
    const current = roles[ri];
    if (!deleting) {
      el.textContent = current.slice(0, ci + 1);
      ci++;
      if (ci === current.length) { deleting = true; setTimeout(tick, PAUSE_END); return; }
      setTimeout(tick, TYPE_SPEED);
    } else {
      el.textContent = current.slice(0, ci - 1);
      ci--;
      if (ci === 0) { deleting = false; ri = (ri + 1) % roles.length; setTimeout(tick, PAUSE_NEXT); return; }
      setTimeout(tick, DELETE_SPEED);
    }
  }

  setTimeout(tick, 800);
}

/* ============================================================
   ABOUT GAME — "How well do you know Khushal?"
   ============================================================ */
function initAboutGame() {
  const wrap     = document.getElementById('aboutGame');
  const qNum     = document.getElementById('gameQNum');
  const qText    = document.getElementById('gameQText');
  const options  = document.getElementById('gameOptions');
  const feedback = document.getElementById('gameFeedback');
  const scoreVal = document.getElementById('gameScoreVal');
  const totalVal = document.getElementById('gameTotalVal');
  const qWrap    = document.getElementById('gameQuestionWrap');
  const result   = document.getElementById('gameResult');
  const reScore  = document.getElementById('gameResultScore');
  const reMsg    = document.getElementById('gameResultMsg');
  const restart  = document.getElementById('gameRestart');
  const progBar  = document.getElementById('gameProgressBar');
  if (!wrap) return;

  const questions = [
    {
      q: 'What programming language does Khushal reach for first when starting a new project?',
      options: ['JavaScript', 'Python', 'Java', 'C++'],
      answer: 1,
      right: '✓ Correct! Python is home base — clean, powerful, and just gets out of the way.',
      wrong: 'Python! It\'s the Swiss Army knife he can\'t put down.',
    },
    {
      q: 'Khushal got his code merged into which major open-source project via GSoC 2026?',
      options: ['ESLint', 'Checkstyle', 'SonarQube', 'PMD'],
      answer: 1,
      right: '✓ Yep! Checkstyle — the Java code quality tool used by Google, Apache, and thousands of teams.',
      wrong: 'It\'s Checkstyle — a Java static analysis tool. 4 PRs merged. Pretty proud of that one.',
    },
    {
      q: 'What did Khushal build that lets you control your media player without touching a keyboard?',
      options: ['A voice assistant', 'A smartwatch app', 'A hand gesture controller', 'A remote control app'],
      answer: 2,
      right: '✓ Exactly! Hand gestures via MediaPipe + OpenCV. Point, swipe, skip — no keyboard needed.',
      wrong: 'A gesture controller! Uses your webcam and hand landmarks to trigger media keys in real time.',
    },
    {
      q: 'Which forensic tool did Khushal build using a Raspberry Pi as a USB gadget?',
      options: ['NetSniffer', 'RAT (Remote Audit Tool)', 'KeyLogger Pro', 'DiskCloner'],
      answer: 1,
      right: '✓ RAT — Remote Audit Tool. Plug it in, it silently collects system/network/USB logs and outputs a clean HTML report.',
      wrong: 'RAT (Remote Audit Tool). Plug in the Pi like a USB drive — it gathers forensic data and generates a report. No install needed.',
    },
    {
      q: 'Where is Khushal based?',
      options: ['Mumbai', 'Hyderabad', 'Bangalore', 'Chennai'],
      answer: 2,
      right: '✓ Bangalore — India\'s tech capital. Where the coffee is strong and the deadlines are stronger.',
      wrong: 'Bangalore! The city that never sleeps (especially during hackathon season).',
    },
  ];

  const total = questions.length;
  totalVal.textContent = total;
  let current = 0, score = 0;

  function load(i) {
    const q = questions[i];
    qNum.textContent = `Question ${i + 1} of ${total}`;
    qText.textContent = q.q;
    feedback.textContent = '';
    feedback.className = 'game-feedback';
    progBar.style.width = `${(i / total) * 100}%`;

    options.innerHTML = '';
    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'game-option';
      btn.textContent = opt;
      btn.addEventListener('click', () => pick(idx, q, i));
      options.appendChild(btn);
    });
  }

  function pick(idx, q, qi) {
    const btns = options.querySelectorAll('.game-option');
    btns.forEach(b => b.disabled = true);

    const correct = idx === q.answer;
    btns[q.answer].classList.add('correct');
    if (!correct) btns[idx].classList.add('wrong');

    if (correct) {
      score++;
      scoreVal.textContent = score;
      feedback.textContent = q.right;
      feedback.className = 'game-feedback correct-fb';
    } else {
      feedback.textContent = q.wrong;
      feedback.className = 'game-feedback wrong-fb';
    }

    setTimeout(() => {
      if (qi + 1 < total) {
        current++;
        load(current);
      } else {
        showResult();
      }
    }, 1800);
  }

  function showResult() {
    progBar.style.width = '100%';
    qWrap.hidden = true;
    result.hidden = false;

    reScore.textContent = `${score}/${total}`;

    const msgs = [
      [0, 1, "You just met Khushal. That\'s okay — now you know. 👋"],
      [2, 2, "Not bad! You caught a few things. Stick around, it gets better. 🙂"],
      [3, 3, "Solid! You\'ve been paying attention. Khushal approves. 👍"],
      [4, 4, "Very impressive. Have you been stalking his GitHub? 👀"],
      [5, 5, "Perfect score. You basically ARE Khushal at this point. 🤝"],
    ];

    const [msg] = msgs.filter(([min, max]) => score >= min && score <= max);
    reMsg.textContent = msg[2];
  }

  function reset() {
    current = 0; score = 0;
    scoreVal.textContent = 0;
    qWrap.hidden = false;
    result.hidden = true;
    load(0);
  }

  restart.addEventListener('click', reset);
  load(0);
}
