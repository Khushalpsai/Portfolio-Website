'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initBackground();
  initCursor();
  initNavigation();
  initHeroTypewriter();
  initScrollReveal();
  initProjects();
  initProjectFilters();
  initContactForm();
  initBackToTop();
  document.getElementById('currentYear').textContent = new Date().getFullYear();
});

/* ============================================================
   BACKGROUND — React Bits: Antigravity WebGL2 Particle Field
   ============================================================ */
function initBackground() {
  const container = document.getElementById('antigravity-bg');
  if (container && window.Antigravity) {
    const instance = window.Antigravity.create(container, {
      colors: ['#7d93a8', '#38bdf8', '#818cf8', '#64748b'],
      colorMode: 'conic',
      particleShape: 'sphere',
      count: window.innerWidth < 768 ? 220 : 420,
      particleSize: 0.65,
      ringRadius: 10.5,
      magnetRadius: 11.5,
      waveSpeed: 0.16,
      waveAmplitude: 0.32,
      waveCount: 2,
      lerpSpeed: 0.035,
      clickBurst: true,
      autoAnimate: true,
      ambient: 0.12,
      opacity: 0.5
    });
    if (instance) return;
  }

  // Graceful fallback: 2D drifting ambient particles if WebGL2 is unavailable
  const fallbackCanvas = document.getElementById('antigravity-canvas') || document.getElementById('neon-grid');
  if (!fallbackCanvas) return;
  const ctx = fallbackCanvas.getContext('2d');
  if (!ctx) return;
  let W, H, stars = [], raf;

  function resize() {
    W = fallbackCanvas.width  = window.innerWidth;
    H = fallbackCanvas.height = window.innerHeight;
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
  function bindCursorHover(root = document) {
    root.querySelectorAll('a, button, .book-container, .book-action-btn, .book-tag, .skill-pill, .filter-btn').forEach(el => {
      el.addEventListener('mouseenter', () => dot.classList.add('expanded'));
      el.addEventListener('mouseleave', () => dot.classList.remove('expanded'));
    });
  }
  bindCursorHover();
  window.bindCursorHover = bindCursorHover;

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
   PROJECTS DATA & 3D ROTATING BOOKS COMPONENT
   ============================================================ */
const PORTFOLIO_PROJECTS = [
  {
    id: 'aegis-intelligence',
    title: 'Aegis Intelligence',
    tagline: 'Threat Actor De-Anonymization',
    category: 'ml',
    categoryLabel: 'Threat Intel & NLP',
    vol: 'VOL. 01',
    accentColor: '#38bdf8',
    iconSvg: `<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    summary: 'Autonomous stylometric attribution platform that ingests dark-web forum posts, extracts multi-dimensional linguistic fingerprints, and renders an interactive force-directed threat intelligence graph with analyst investigation workflows.',
    tags: ['Python', 'FastAPI', 'React 19', 'NLP', 'D3 Force Graph'],
    links: [
      { label: 'Source Code', url: 'https://github.com/Khushalpsai/aegis-intelligence', type: 'github' }
    ]
  },
  {
    id: 'gestmo',
    title: 'GestMo',
    tagline: 'Gesture Controlled Media Player',
    category: 'ml',
    categoryLabel: 'Gesture & Vision',
    vol: 'VOL. 02',
    accentColor: '#818cf8',
    iconSvg: `<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
    summary: 'Control Spotify, YouTube, VLC, and more using hand gestures — no keyboard, no mouse. Real-time hand landmark detection with debounce & stability filtering triggers system-wide media keys via pyautogui.',
    tags: ['Python', 'MediaPipe', 'OpenCV', 'Computer Vision'],
    links: [
      { label: 'Source Code', url: 'https://github.com/Khushalpsai/GestMo', type: 'github' }
    ]
  },
  {
    id: 'gazeboard-v2',
    title: 'GazeBoard V2',
    tagline: 'Eye-Tracking AAC Keyboard',
    category: 'ml',
    categoryLabel: 'Accessibility & Vision',
    vol: 'VOL. 03',
    accentColor: '#2dd4bf',
    iconSvg: `<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z"/></svg>`,
    summary: 'Hands-free eye-tracking communication system & Windows OS controller for individuals with severe motor impairments or ALS. Built with OpenCV, MediaPipe 1.0, Pygame-CE, and native Win32 APIs for full OS control via gaze.',
    tags: ['Python', 'OpenCV', 'MediaPipe', 'Pygame-CE', 'Win32 API'],
    links: [
      { label: 'Source Code', url: 'https://github.com/Khushalpsai/eye-track', type: 'github' }
    ]
  },
  {
    id: 'votewise',
    title: 'VoteWise',
    tagline: "India's Election Guide",
    category: 'viz',
    categoryLabel: 'Civic Tech & Web App',
    vol: 'VOL. 04',
    accentColor: '#a78bfa',
    iconSvg: `<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
    summary: 'Interactive civic education assistant helping Indian citizens understand the election process — from voter registration to result declaration. Deployed live on Firebase, making civic knowledge accessible and interactive for all.',
    tags: ['Firebase', 'JavaScript', 'Civic Tech', 'Web App'],
    links: [
      { label: 'Source Code', url: 'https://github.com/Khushalpsai/Election-Process-Assistant', type: 'github' },
      { label: 'Live Demo', url: 'https://votewise-1bfc7.web.app', type: 'demo' }
    ]
  },
  {
    id: 'flight-price-intelligence',
    title: 'Flight Price Intel',
    tagline: 'Predictive Domestic Fare Model',
    category: 'ml',
    categoryLabel: 'Predictive ML',
    vol: 'VOL. 05',
    accentColor: '#fbbf24',
    iconSvg: `<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
    summary: 'Predicts Indian domestic flight ticket prices and advises the optimal booking window using 10,661 flight records correlated with real-time crude oil prices using a Random Forest Regressor model to identify price trends.',
    tags: ['Python', 'Random Forest', 'Pandas', 'Scikit-learn'],
    links: [
      { label: 'Source Code', url: 'https://github.com/Khushalpsai/flight_price_analysis_model', type: 'github' }
    ]
  },
  {
    id: 'ps-audity',
    title: 'PS-Audity',
    tagline: 'Portable Forensic Auditor',
    category: 'analytics',
    categoryLabel: 'Forensics & Tooling',
    vol: 'VOL. 06',
    accentColor: '#f43f5e',
    iconSvg: `<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    summary: 'Portable PowerShell forensic suite deployed via Raspberry Pi USB Gadget. Auto-captures OS info, installed software, network history, active connections, USB registry via C# injection, and security logs on insertion.',
    tags: ['PowerShell', 'Raspberry Pi', 'C# Injection', 'Forensics'],
    links: [
      { label: 'Source Code', url: 'https://github.com/Khushalpsai/Remote-Audit-Tool', type: 'github' }
    ]
  },
  {
    id: 'checkstyle-gsoc',
    title: 'Checkstyle Open Source',
    tagline: 'Google Summer of Code 2026',
    category: 'analytics',
    categoryLabel: 'Static Analysis & AST',
    vol: 'VOL. 07',
    accentColor: '#60a5fa',
    iconSvg: `<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    summary: 'Merged 4 Pull Requests into Checkstyle Java code quality tool adhering to Google Java Style Guides. Contributed core AST checks including Java 25 "statements before super()" support, improving the tool for millions of Java developers.',
    tags: ['Java', 'GSoC 2026', 'Git / GitHub', 'Static Analysis'],
    links: [
      { label: 'Contributions', url: 'https://github.com/checkstyle/checkstyle', type: 'github' }
    ]
  }
];

/**
 * Render 3D book markup from project object
 */
function createBookHTML(project) {
  const linkBtns = project.links.map((link, idx) => {
    const isPrimary = idx === 0;
    const btnClass = isPrimary ? 'book-action-btn book-btn-primary' : 'book-action-btn book-btn-secondary';
    const iconSvg = link.type === 'demo'
      ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`
      : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;
    
    return `
      <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="${btnClass}" aria-label="${link.label} for ${project.title}">
        ${iconSvg}
        <span>${link.label}</span>
      </a>
    `;
  }).join('');

  const tagPills = project.tags.map(t => `<span class="book-tag">${t}</span>`).join('');

  return `
    <div class="book-container reveal" data-category="${project.category}" style="--book-accent: ${project.accentColor}" tabindex="0" role="region" aria-label="Book: ${project.title}">
      <div class="book">
        <!-- Layered paper thickness (right & bottom edges) -->
        <div class="book-pages-stack" aria-hidden="true"></div>

        <!-- Inside reading page (revealed when opened) -->
        <div class="book-inside">
          <div class="book-inside-content">
            <div class="book-page-header">
              <span class="book-page-vol">${project.vol} // DOSSIER</span>
              <span class="book-page-badge">${project.category.toUpperCase()}</span>
            </div>
            <h3 class="book-inside-title">${project.title}</h3>
            <p class="book-inside-desc">${project.summary}</p>
            
            <div class="book-inside-stack">
              <span class="book-section-label">TECH STACK</span>
              <div class="book-tags">
                ${tagPills}
              </div>
            </div>

            <div class="book-inside-actions">
              ${linkBtns}
            </div>
          </div>
        </div>

        <!-- 3D Swiveling Hardcover -->
        <div class="book-cover" role="button" aria-expanded="false" aria-label="Open ${project.title} cover">
          <!-- Front Cover Face -->
          <div class="book-cover-front">
            <div class="book-spine-crease" aria-hidden="true"></div>
            <div class="book-cover-content">
              <div class="book-cover-top">
                <span class="book-category-pill">${project.categoryLabel}</span>
                <span class="book-corner-decor" aria-hidden="true">✦</span>
              </div>
              
              <div class="book-cover-emblem" aria-hidden="true">
                ${project.iconSvg}
              </div>

              <div class="book-cover-meta">
                <h3 class="book-cover-title">${project.title}</h3>
                <p class="book-cover-tagline">${project.tagline}</p>
              </div>

              <div class="book-cover-footer">
                <span class="book-open-hint">
                  <span class="book-open-icon">📖</span>
                  <span>Hover or tap to read</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Inside Cover Lining / Endpaper (Faces viewer when cover opens at -135deg) -->
          <div class="book-cover-back" aria-hidden="true">
            <div class="book-lining-content">
              <div class="book-ex-libris">
                <span class="ex-libris-label">PORTFOLIO ARCHIVE</span>
                <span class="ex-libris-name">Sai Khushal</span>
                <span class="ex-libris-sub">Software &amp; Machine Learning</span>
              </div>
              <div class="book-ribbon-marker"></div>
            </div>
          </div>
        </div><!-- .book-cover -->
      </div><!-- .book -->
    </div><!-- .book-container -->
  `;
}

/**
 * Initialize 3D Rotating Bookshelf
 */
function initProjects() {
  const container = document.getElementById('projectsGrid');
  if (!container) return;

  // Render all projects from PORTFOLIO_PROJECTS
  container.innerHTML = PORTFOLIO_PROJECTS.map(createBookHTML).join('');

  // Attach tap / click interactions for mobile and desktop
  const bookContainers = container.querySelectorAll('.book-container');

  bookContainers.forEach(wrapper => {
    const book = wrapper.querySelector('.book');
    const cover = wrapper.querySelector('.book-cover');

    // Toggle on cover click/tap
    cover.addEventListener('click', e => {
      // Don't toggle if link was clicked
      if (e.target.closest('a')) return;
      e.stopPropagation();

      const isOpen = book.classList.contains('is-open');
      closeAllBooks();

      if (!isOpen) {
        book.classList.add('is-open');
        wrapper.classList.add('is-active');
        cover.setAttribute('aria-expanded', 'true');
      }
    });

    // Toggle on container click if tapping page outside interactive links
    wrapper.addEventListener('click', e => {
      if (e.target.closest('a')) return; // Allow normal link navigation
      if (book.classList.contains('is-open') && !e.target.closest('.book-cover')) {
        // Tapping inside the open page: keep open, or let user tap to focus
        return;
      }
    });

    // Keyboard accessibility: Enter or Space toggles cover
    wrapper.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('a')) return;
        e.preventDefault();
        const isOpen = book.classList.contains('is-open');
        closeAllBooks();
        if (!isOpen) {
          book.classList.add('is-open');
          wrapper.classList.add('is-active');
          cover.setAttribute('aria-expanded', 'true');
        }
      } else if (e.key === 'Escape') {
        closeAllBooks();
      }
    });
  });

  // Global outside-click to close open books
  document.addEventListener('click', e => {
    if (!e.target.closest('.book-container')) {
      closeAllBooks();
    }
  });

  function closeAllBooks() {
    bookContainers.forEach(w => {
      const b = w.querySelector('.book');
      const c = w.querySelector('.book-cover');
      if (b) b.classList.remove('is-open');
      if (w) w.classList.remove('is-active');
      if (c) c.setAttribute('aria-expanded', 'false');
    });
  }

  // Bind custom cursor to new interactive elements
  if (typeof window.bindCursorHover === 'function') {
    window.bindCursorHover(container);
  }

  // Trigger scroll reveal observer for newly created elements
  if (typeof initScrollReveal === 'function') {
    initScrollReveal();
  }
}

/* ============================================================
   PROJECT FILTERS — smooth category filter for 3D Books
   ============================================================ */
function initProjectFilters() {
  const btns  = document.querySelectorAll('.filter-btn');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      const containers = document.querySelectorAll('.book-container');

      // Close any open books when switching categories
      containers.forEach(w => {
        const b = w.querySelector('.book');
        const c = w.querySelector('.book-cover');
        if (b) b.classList.remove('is-open');
        if (w) w.classList.remove('is-active');
        if (c) c.setAttribute('aria-expanded', 'false');
      });

      containers.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        if (match) {
          card.style.display = '';
          requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          });
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.92)';
          setTimeout(() => {
            if (card.style.opacity === '0') card.style.display = 'none';
          }, 300);
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

