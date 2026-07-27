document.addEventListener('DOMContentLoaded', () => {
    // ===== Cursor Glow =====
    initCursorGlow();
    
    // ===== Navigation =====
    initNavigation();
    
    // ===== Interactive Developer Terminal Deck =====
    initTerminalDeck();
    
    // ===== Stats Counter =====
    initStatsCounter();
    
    // ===== Scroll Animations =====
    initScrollAnimations();
    
    // ===== Skill Bars =====
    initSkillBars();
    
    // ===== Project Filters =====
    initProjectFilters();
    
    // ===== Contact Form =====
    initContactForm();
    
    // ===== Back to Top =====
    initBackToTop();
    
    // ===== Footer Year =====
    document.getElementById('currentYear').textContent = new Date().getFullYear();
});

// ===== AMBIENT CANVAS BACKGROUND =====
function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resize();
    window.addEventListener('resize', resize);
    
    class AmbientNode {
        constructor() {
            this.reset();
        }
        
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 1.8 + 0.8;
            this.speedX = (Math.random() - 0.5) * 0.3;
            this.speedY = (Math.random() - 0.5) * 0.3;
            this.opacity = Math.random() * 0.25 + 0.1;
        }
        
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            
            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(88, 166, 255, ${this.opacity})`;
            ctx.fill();
        }
    }
    
    const count = Math.min(Math.floor((canvas.width * canvas.height) / 18000), 60);
    for (let i = 0; i < count; i++) {
        particles.push(new AmbientNode());
    }
    
    function drawGridConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 120) {
                    const opacity = (1 - dist / 120) * 0.07;
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(88, 166, 255, ${opacity})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        drawGridConnections();
        requestAnimationFrame(animate);
    }
    
    animate();
}

// ===== INTERACTIVE TERMINAL DECK =====
function initTerminalDeck() {
    const output = document.getElementById('terminalOutput');
    const btns = document.querySelectorAll('.term-btn');
    if (!output) return;

    const commands = {
        whoami: `<div class="term-line prompt-line"><span class="term-user">khushal@analytics</span>:<span class="term-path">~</span>$ whoami</div>
                 <div class="term-line term-response"><p><strong>Sai Khushal</strong> — Data Analytics &amp; Machine Learning Specialist</p><p class="term-sub">Location: Bangalore, India | Edu: B.Tech CSE (Data Analytics)</p></div>`,
        
        skills: `<div class="term-line prompt-line"><span class="term-user">khushal@analytics</span>:<span class="term-path">~</span>$ stack --all</div>
                 <div class="term-line term-response">
                    <p><span class="term-accent">Languages:</span> Python, R, SQL, Java, C/C++</p>
                    <p><span class="term-accent">ML &amp; Analytics:</span> TensorFlow, Scikit-learn, Pandas, NumPy, Matplotlib, Seaborn</p>
                    <p><span class="term-accent">Tools &amp; OS:</span> Git, Linux, Jupyter, VS Code</p>
                 </div>`,

        projects: `<div class="term-line prompt-line"><span class="term-user">khushal@analytics</span>:<span class="term-path">~</span>$ ls -la ./projects</div>
                   <div class="term-line term-response">
                      <p>• <strong>Gesture Controlled Media Player</strong> [Python, MediaPipe, OpenCV]</p>
                      <p>• <strong>Flight Price Predictor</strong> [Python, Scikit-learn, ML]</p>
                      <p>• <strong>RAT (Remote Audit Tool)</strong> [PowerShell, Raspberry Pi]</p>
                      <p>• <strong>Checkstyle Open Source</strong> [Java, GSoC 2026, Git]</p>
                      <p>• <strong>Cloud & Data Analytics</strong> [GCP, Pandas, Seaborn]</p>
                   </div>`,

        contact: `<div class="term-line prompt-line"><span class="term-user">khushal@analytics</span>:<span class="term-path">~</span>$ cat ./contact.info</div>
                  <div class="term-line term-response">
                     <p>Email: <a href="mailto:khushalpsai@gmail.com" style="color:#58a6ff">khushalpsai@gmail.com</a></p>
                     <p>GitHub: <a href="https://github.com/Khushalpsai" target="_blank" style="color:#58a6ff">github.com/Khushalpsai</a></p>
                     <p>LinkedIn: <a href="https://www.linkedin.com/in/sai-khushal-477365318/" target="_blank" style="color:#58a6ff">linkedin.com/in/sai-khushal</a></p>
                  </div>`
    };

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const cmd = btn.getAttribute('data-cmd');
            if (cmd === 'clear') {
                output.innerHTML = '';
            } else if (commands[cmd]) {
                output.innerHTML += commands[cmd];
                output.scrollTop = output.scrollHeight;
            }
        });
    });
}

// ===== CURSOR GLOW =====
function initCursorGlow() {
    const glow = document.getElementById('cursorGlow');
    let mouseX = 0, mouseY = 0;
    let glowX = 0, glowY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    function updateGlow() {
        glowX += (mouseX - glowX) * 0.08;
        glowY += (mouseY - glowY) * 0.08;
        glow.style.left = glowX + 'px';
        glow.style.top = glowY + 'px';
        requestAnimationFrame(updateGlow);
    }
    
    updateGlow();
}

// ===== NAVIGATION =====
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    const links = document.querySelectorAll('.nav-link');
    
    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Active section highlighting
        const sections = document.querySelectorAll('section[id]');
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            if (window.scrollY >= sectionTop) {
                currentSection = section.getAttribute('id');
            }
        });
        
        links.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === currentSection) {
                link.classList.add('active');
            }
        });
    });
    
    // Mobile toggle
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
    });
    
    // Close mobile menu on link click
    links.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });
    
    // Close mobile menu on outside click
    document.addEventListener('click', (e) => {
        if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
            navToggle.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });
}

// ===== TYPEWRITER EFFECT =====
function initTypewriter() {
    const element = document.getElementById('typewriter');
    const roles = [
        'Data Analytics Specialist',
        'Machine Learning Engineer',
        'AI Enthusiast',
        'Data Scientist',
        'Python Developer'
    ];
    
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let isPaused = false;
    
    function type() {
        const currentRole = roles[roleIndex];
        
        if (isPaused) {
            isPaused = false;
            isDeleting = true;
            setTimeout(type, 800);
            return;
        }
        
        if (isDeleting) {
            element.textContent = currentRole.substring(0, charIndex - 1);
            charIndex--;
            
            if (charIndex === 0) {
                isDeleting = false;
                roleIndex = (roleIndex + 1) % roles.length;
                setTimeout(type, 300);
                return;
            }
            
            setTimeout(type, 30);
        } else {
            element.textContent = currentRole.substring(0, charIndex + 1);
            charIndex++;
            
            if (charIndex === currentRole.length) {
                isPaused = true;
                setTimeout(type, 2000);
                return;
            }
            
            setTimeout(type, 60 + Math.random() * 40);
        }
    }
    
    setTimeout(type, 1000);
}

// ===== STATS COUNTER =====
function initStatsCounter() {
    const statNumbers = document.querySelectorAll('.stat-number');
    let hasAnimated = false;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasAnimated) {
                hasAnimated = true;
                animateCounters();
            }
        });
    }, { threshold: 0.5 });
    
    const statsSection = document.querySelector('.hero-stats');
    if (statsSection) observer.observe(statsSection);
    
    function animateCounters() {
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-count'));
            const duration = 2000;
            const startTime = performance.now();
            
            function update(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease out cubic
                const easedProgress = 1 - Math.pow(1 - progress, 3);
                const currentValue = Math.round(easedProgress * target);
                
                stat.textContent = currentValue;
                
                if (progress < 1) {
                    requestAnimationFrame(update);
                }
            }
            
            requestAnimationFrame(update);
        });
    }
}

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
    // Add reveal class to elements
    const revealElements = document.querySelectorAll(
        '.section-header, .about-grid, .skill-category, .project-card, .contact-grid'
    );
    
    revealElements.forEach(el => el.classList.add('reveal'));
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'
    });
    
    revealElements.forEach(el => observer.observe(el));
}

// ===== SKILL BARS =====
function initSkillBars() {
    const skillCards = document.querySelectorAll('.skill-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Stagger the animation
                const cards = entry.target.closest('.skills-grid').querySelectorAll('.skill-card');
                cards.forEach((card, index) => {
                    setTimeout(() => {
                        card.classList.add('animate');
                    }, index * 100);
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    
    // Observe first card in each grid
    document.querySelectorAll('.skills-grid').forEach(grid => {
        const firstCard = grid.querySelector('.skill-card');
        if (firstCard) observer.observe(firstCard);
    });
}

// ===== PROJECT FILTERS =====
function initProjectFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.getAttribute('data-filter');
            
            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                
                if (filter === 'all' || category === filter) {
                    card.style.display = '';
                    // Trigger reflow then animate in
                    requestAnimationFrame(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    });
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.8)';
                    // Hide after transition completes
                    setTimeout(() => {
                        if (card.style.opacity === '0') {
                            card.style.display = 'none';
                        }
                    }, 400);
                }
            });
        });
    });
}

// ===== CONTACT FORM =====
function initContactForm() {
    const form = document.getElementById('contactForm');
    const submitBtn = document.getElementById('formSubmit');
    const statusEl = document.getElementById('formStatus');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Add loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        // Simulate form submission
        setTimeout(() => {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            
            // Show success message
            statusEl.className = 'form-status success';
            statusEl.textContent = '🎉 Message sent successfully! I\'ll get back to you soon.';
            
            // Reset form
            form.reset();
            
            // Hide status after 5 seconds
            setTimeout(() => {
                statusEl.className = 'form-status';
            }, 5000);
        }, 2000);
    });
    
    // Input animations
    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            input.parentElement.classList.remove('focused');
        });
    });
}

// ===== BACK TO TOP =====
function initBackToTop() {
    const btn = document.getElementById('backToTop');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });
    
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href && href.length > 1) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });
});


