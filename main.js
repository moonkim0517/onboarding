/* ============================================
   Propermarket Design Team Onboarding
   main.js — Core Interactions & Animations
   ============================================ */

(function () {
  'use strict';

  /* ----- DOM References ----- */
  const gnb          = document.getElementById('gnb');
  const gnbHamburger = document.getElementById('gnb-hamburger');
  const gnbLinks     = document.getElementById('gnb-links');
  const heroSection  = document.getElementById('home');
  const heroSearch   = document.getElementById('ai-input-wrap');
  const checklist    = document.getElementById('checklist');

  /* =============================================
     1. Scroll-based Fade-in (IntersectionObserver)
     ============================================= */
  const fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.fade-in').forEach((el) => fadeObserver.observe(el));

  /* =============================================
     2. GNB Scroll Behavior (hide on scroll down, show on scroll up)
     ============================================= */
  var lastScrollY = 0;
  window.addEventListener('scroll', () => {
    var currentY = window.scrollY;
    gnb.classList.toggle('scrolled', currentY > 50);

    if (currentY > lastScrollY && currentY > 80) {
      gnb.classList.add('gnb--hidden');
    } else {
      gnb.classList.remove('gnb--hidden');
    }
    lastScrollY = currentY;
  }, { passive: true });

  /* =============================================
     3. GNB Smooth Scroll & Active State
     ============================================= */
  const navLinks = gnbLinks.querySelectorAll('a');
  const sections = document.querySelectorAll('section[id]');

  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(link.getAttribute('href').substring(1));
      if (target) {
        window.scrollTo({ top: target.offsetTop - gnb.offsetHeight, behavior: 'smooth' });
      }
      gnbLinks.classList.remove('active');
      gnbHamburger.classList.remove('active');
    });
  });

  new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
        }
      });
    },
    { threshold: 0.3, rootMargin: '-64px 0px -50% 0px' }
  ).observe && sections.forEach((s) =>
    new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          const id = e.target.id;
          navLinks.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
        }
      }),
      { threshold: 0.3, rootMargin: '-64px 0px -50% 0px' }
    ).observe(s)
  );

  /* =============================================
     4. Hamburger Menu (Mobile)
     ============================================= */
  gnbHamburger.addEventListener('click', () => {
    gnbHamburger.classList.toggle('active');
    gnbLinks.classList.toggle('active');
  });

  /* =============================================
     5. AI Input (Hero Search Bar)
     ============================================= */
  var aiInput = document.getElementById('ai-input-text');
  var aiSendBtn = document.getElementById('ai-input-send');
  var aiBox = document.getElementById('ai-input-box');
  var aiPlaceholder = document.getElementById('ai-input-placeholder');
  var aiControls = document.getElementById('ai-input-controls');
  var aiPillThink = document.getElementById('ai-pill-think');
  var aiPillSearch = document.getElementById('ai-pill-search');
  var aiWrap = document.getElementById('ai-input-wrap');

  if (aiInput && aiSendBtn && aiBox) {
    var aiIsActive = false;

    /* --- Animated placeholder --- */
    var aiPlaceholders = [
      '만나서 반가워요.',
      '빠른 적응을 위해 온보딩을 도와드릴게요.',
      '무엇이든 물어보세요.'
    ];
    var aiPhIdx = 0;
    var aiPhInterval = null;
    var aiPhTimeout = null;

    function aiRenderPlaceholder(text, animate) {
      if (!aiPlaceholder) return;
      aiPlaceholder.innerHTML = '';
      text.split('').forEach(function (ch, i) {
        var span = document.createElement('span');
        span.textContent = ch === ' ' ? '\u00A0' : ch;
        aiPlaceholder.appendChild(span);
        if (animate) {
          setTimeout(function () { span.classList.add('visible'); }, i * 25);
        } else {
          span.classList.add('visible');
        }
      });
    }

    function aiExitPlaceholder(cb) {
      if (!aiPlaceholder) return;
      var spans = aiPlaceholder.querySelectorAll('span');
      spans.forEach(function (sp, i) {
        setTimeout(function () {
          sp.classList.remove('visible');
          sp.classList.add('exit');
        }, i * 15);
      });
      setTimeout(cb, spans.length * 15 + 300);
    }

    function aiCyclePlaceholder() {
      if (aiIsActive || aiInput.value) return;
      aiExitPlaceholder(function () {
        aiPhIdx = (aiPhIdx + 1) % aiPlaceholders.length;
        aiRenderPlaceholder(aiPlaceholders[aiPhIdx], true);
      });
    }

    function aiStartPlaceholderCycle() {
      aiStopPlaceholderCycle();
      aiPhInterval = setInterval(aiCyclePlaceholder, 5000);
    }

    function aiStopPlaceholderCycle() {
      clearInterval(aiPhInterval);
      aiPhInterval = null;
    }

    // Initial placeholder
    aiRenderPlaceholder(aiPlaceholders[0], true);
    aiStartPlaceholderCycle();

    /* --- Expand / Collapse --- */
    function aiExpand() {
      if (aiIsActive) return;
      aiIsActive = true;
      aiBox.classList.add('expanded');
      aiStopPlaceholderCycle();
      if (aiPlaceholder) aiPlaceholder.style.display = 'none';
      aiInput.placeholder = aiPlaceholders[aiPhIdx];
    }

    function aiCollapse() {
      if (aiInput.value) return;
      aiIsActive = false;
      aiBox.classList.remove('expanded');
      aiInput.placeholder = '';
      if (aiPlaceholder) {
        aiPlaceholder.style.display = '';
        aiRenderPlaceholder(aiPlaceholders[aiPhIdx], true);
      }
      aiStartPlaceholderCycle();
    }

    function aiSubmit() {
      var msg = aiInput.value.trim();
      if (!msg) return;
      aiInput.value = '';
      aiCollapse();
      document.dispatchEvent(new CustomEvent('openAISearch', { detail: { message: msg } }));
    }

    // Events
    aiBox.addEventListener('click', function () { aiExpand(); aiInput.focus(); });
    aiInput.addEventListener('focus', aiExpand);

    document.addEventListener('mousedown', function (e) {
      if (aiWrap && !aiWrap.contains(e.target)) aiCollapse();
    });

    aiInput.addEventListener('input', function () {
      if (aiPlaceholder) aiPlaceholder.style.display = aiInput.value ? 'none' : '';
    });

    aiInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); aiSubmit(); }
    });

    aiSendBtn.addEventListener('click', function (e) { e.stopPropagation(); aiSubmit(); });

    // Pill toggles
    if (aiPillThink) {
      aiPillThink.addEventListener('click', function (e) {
        e.stopPropagation();
        aiPillThink.classList.toggle('active');
      });
    }
    if (aiPillSearch) {
      aiPillSearch.addEventListener('click', function (e) {
        e.stopPropagation();
        aiPillSearch.classList.toggle('active');
      });
    }
  }

  /* =============================================
     6. Confetti Title (Section 02)
     ============================================= */
  var confettiWrap = document.getElementById('confetti-title-wrap');
  var confettiCanvas = document.getElementById('confetti-canvas');
  if (confettiWrap && confettiCanvas && typeof confetti !== 'undefined') {
    var confettiInstance = confetti.create(confettiCanvas, { resize: true, useWorker: true });
    var confettiFired = false;

    function fireConfetti() {
      confettiInstance({
        particleCount: 100,
        spread: 80,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#60a5fa', '#a78bfa', '#facc15', '#4ade80', '#fb923c', '#f472b6'],
        ticks: 200,
        gravity: 1.2,
        scalar: 1.1,
        drift: 0
      });
    }

    // Fire on scroll into view (once)
    new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !confettiFired) {
          confettiFired = true;
          fireConfetti();
        }
      });
    }, { threshold: 0.5 }).observe(confettiWrap);

    // Re-fire on mouse enter
    confettiWrap.addEventListener('mouseenter', function () {
      fireConfetti();
    });
  }

  /* =============================================
     6b. Sparkles Text (Section 04 title)
     ============================================= */
  var sparklesWrap = document.querySelector('.sparkles-text__inner');
  if (sparklesWrap) {
    var SPARKLE_COUNT = 10;
    var SPARKLE_COLORS = ['#9E7AFF', '#FE8BBB'];
    var sparklePath = 'M9.82531 0.843845C10.0553 0.215178 10.9446 0.215178 11.1746 0.843845L11.8618 2.72026C12.4006 4.19229 12.3916 6.39157 13.5 7.5C14.6084 8.60843 16.8077 8.59935 18.2797 9.13822L20.1561 9.82534C20.7858 10.0553 20.7858 10.9447 20.1561 11.1747L18.2797 11.8618C16.8077 12.4007 14.6084 12.3916 13.5 13.5C12.3916 14.6084 12.4006 16.8077 11.8618 18.2798L11.1746 20.1562C10.9446 20.7858 10.0553 20.7858 9.82531 20.1562L9.13819 18.2798C8.59932 16.8077 8.60843 14.6084 7.5 13.5C6.39157 12.3916 4.19225 12.4007 2.72023 11.8618L0.843814 11.1747C0.215148 10.9447 0.215148 10.0553 0.843814 9.82534L2.72023 9.13822C4.19225 8.59935 6.39157 8.60843 7.5 7.5C8.60843 6.39157 8.59932 4.19229 9.13819 2.72026L9.82531 0.843845Z';

    function createSparkle() {
      var ns = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('class', 'sparkle-svg');
      svg.setAttribute('width', '21');
      svg.setAttribute('height', '21');
      svg.setAttribute('viewBox', '0 0 21 21');
      var path = document.createElementNS(ns, 'path');
      path.setAttribute('d', sparklePath);
      path.setAttribute('fill', SPARKLE_COLORS[Math.random() > 0.5 ? 0 : 1]);
      svg.appendChild(path);

      var scale = (Math.random() * 1 + 0.3).toFixed(2);
      var delay = (Math.random() * 2).toFixed(2);
      svg.style.left = (Math.random() * 100).toFixed(1) + '%';
      svg.style.top = (Math.random() * 100).toFixed(1) + '%';
      svg.style.setProperty('--sparkle-scale', scale);
      svg.style.animationDelay = delay + 's';

      sparklesWrap.appendChild(svg);
      return svg;
    }

    for (var si = 0; si < SPARKLE_COUNT; si++) createSparkle();
  }

  /* =============================================
     7. Typewriter (Section 03 title)
     ============================================= */
  var twEl = document.getElementById('typewriter-text');
  var twTitle = document.getElementById('typewriter-title');
  if (twEl && twTitle) {
    var twTexts = ['우리가 일하는 방식'];
    var twSpeed = 100;
    var twDeleteSpeed = 50;
    var twDelay = 3000;
    var twLoop = true;
    var twArrayIdx = 0;
    var twCharIdx = 0;
    var twIsDeleting = false;
    var twStarted = false;
    var twTimerId = null;

    function twTick() {
      var current = twTexts[twArrayIdx];
      if (!twIsDeleting) {
        if (twCharIdx < current.length) {
          twEl.textContent = current.substring(0, twCharIdx + 1);
          twCharIdx++;
          twTimerId = setTimeout(twTick, twSpeed);
        } else if (twLoop) {
          twTimerId = setTimeout(function () {
            twIsDeleting = true;
            twTick();
          }, twDelay);
        }
      } else {
        if (twCharIdx > 0) {
          twCharIdx--;
          twEl.textContent = current.substring(0, twCharIdx);
          twTimerId = setTimeout(twTick, twDeleteSpeed);
        } else {
          twIsDeleting = false;
          twArrayIdx = (twArrayIdx + 1) % twTexts.length;
          twTimerId = setTimeout(twTick, twSpeed);
        }
      }
    }

    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !twStarted) {
          twStarted = true;
          twTick();
        }
      });
    }, { threshold: 0.3 }).observe(twTitle);
  }

  /* =============================================
     8. Sparkles Core (Section 03 — below loop text)
     ============================================= */
  var sparklesCoreEl = document.getElementById('sparkles-core');
  var sparklesCanvas = document.getElementById('sparkles-canvas');
  if (sparklesCoreEl && sparklesCanvas) {
    var sCtx = sparklesCanvas.getContext('2d');
    var sDPR = window.devicePixelRatio || 1;
    var sW = 0, sH = 0;
    var sparkleParticles = [];
    var SPARK_COUNT = 140;
    var SPARK_COLOR = [255, 255, 255]; // white particles on dark bg
    var sparklesMouse = { x: 0, y: 0 };
    var sparklesRunning = false;
    var sparklesRafId = null;

    function initSparklesCanvas() {
      sW = sparklesCoreEl.offsetWidth;
      sH = sparklesCoreEl.offsetHeight;
      sparklesCanvas.width = sW * sDPR;
      sparklesCanvas.height = sH * sDPR;
      sparklesCanvas.style.width = sW + 'px';
      sparklesCanvas.style.height = sH + 'px';
      sCtx.setTransform(sDPR, 0, 0, sDPR, 0, 0);
      sparkleParticles = [];
      for (var i = 0; i < SPARK_COUNT; i++) sparkleParticles.push(mkSparkle());
    }

    function mkSparkle() {
      return {
        x: Math.random() * sW,
        y: Math.random() * sH,
        tx: 0, ty: 0,
        size: Math.random() * 2 + 0.5,
        alpha: 0,
        targetAlpha: parseFloat((Math.random() * 0.8 + 0.1).toFixed(2)),
        dx: (Math.random() - 0.5) * 0.15,
        dy: (Math.random() - 0.5) * 0.15,
        mag: 0.1 + Math.random() * 4,
        // opacity animation
        opSpeed: (Math.random() * 3 + 1),
        opPhase: Math.random() * Math.PI * 2
      };
    }

    function drawSparkle(p, update) {
      sCtx.save();
      sCtx.translate(p.tx, p.ty);
      sCtx.beginPath();
      sCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      sCtx.fillStyle = 'rgba(' + SPARK_COLOR[0] + ',' + SPARK_COLOR[1] + ',' + SPARK_COLOR[2] + ',' + p.alpha + ')';
      sCtx.fill();
      sCtx.restore();
      if (!update) sparkleParticles.push(p);
    }

    var sparkleTime = 0;
    function animateSparkles() {
      if (!sparklesRunning) return;
      sCtx.clearRect(0, 0, sW, sH);
      sparkleTime += 0.016; // ~60fps

      var dead = [];
      sparkleParticles.forEach(function (p, i) {
        // Twinkling opacity
        var twinkle = (Math.sin(sparkleTime * p.opSpeed + p.opPhase) + 1) / 2;
        p.alpha = p.targetAlpha * twinkle;

        // Edge fade
        var edges = [p.x + p.tx - p.size, sW - p.x - p.tx - p.size, p.y + p.ty - p.size, sH - p.y - p.ty - p.size];
        var closest = Math.min.apply(null, edges);
        if (closest < 20) {
          var ef = Math.max(0, closest / 20);
          p.alpha *= ef;
        }

        // Movement
        p.x += p.dx;
        p.y += p.dy;

        // Mouse magnetism
        p.tx += (sparklesMouse.x / (50 / p.mag) - p.tx) / 80;
        p.ty += (sparklesMouse.y / (50 / p.mag) - p.ty) / 80;

        drawSparkle(p, true);

        if (p.x < -p.size || p.x > sW + p.size || p.y < -p.size || p.y > sH + p.size) {
          dead.push(i);
        }
      });

      for (var i = dead.length - 1; i >= 0; i--) {
        sparkleParticles.splice(dead[i], 1);
        var np = mkSparkle();
        sparkleParticles.push(np);
      }

      sparklesRafId = requestAnimationFrame(animateSparkles);
    }

    // Mouse tracking relative to sparkles canvas center
    window.addEventListener('mousemove', function (e) {
      var rect = sparklesCanvas.getBoundingClientRect();
      sparklesMouse.x = e.clientX - rect.left - sW / 2;
      sparklesMouse.y = e.clientY - rect.top - sH / 2;
    }, { passive: true });

    // Start/stop on visibility
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (!sparklesRunning) {
            sparklesRunning = true;
            initSparklesCanvas();
            animateSparkles();
          }
        } else {
          sparklesRunning = false;
          if (sparklesRafId) { cancelAnimationFrame(sparklesRafId); sparklesRafId = null; }
        }
      });
    }, { threshold: 0.1 }).observe(sparklesCoreEl);

    // Resize
    var sparklesResizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(sparklesResizeTimer);
      sparklesResizeTimer = setTimeout(function () {
        if (sparklesRunning) initSparklesCanvas();
      }, 200);
    }, { passive: true });
  }

  /* =============================================
     8. Loop Text Animation (Section 03)
     ============================================= */
  var loopTextEl = document.getElementById('loop-text');
  if (loopTextEl) {
    var loopItems = [
      '우리는 팀이에요. 커뮤니케이션이 가장 중요해요.',
      '일주일에 한 번 진행하고 있는 작업물 공유를 해요.',
      '서로서로 도와주면서 일해야 해요. 작은 배려가 더 큰 배려로 와요.',
      '어려울 때, 혼자 고민하지 말고 "집단지성"을 이용해 봐요.'
    ];
    var loopIndex = 0;
    var loopInterval = null;

    function loopNext() {
      /* exit current */
      loopTextEl.classList.remove('visible');
      loopTextEl.classList.add('exit');

      setTimeout(function () {
        loopIndex = (loopIndex + 1) % loopItems.length;
        loopTextEl.textContent = loopItems[loopIndex];
        loopTextEl.classList.remove('exit');
        loopTextEl.classList.add('enter');

        /* force reflow so enter class is applied before switching to visible */
        void loopTextEl.offsetWidth;

        loopTextEl.classList.remove('enter');
        loopTextEl.classList.add('visible');
      }, 300);
    }

    /* Initial state */
    loopTextEl.textContent = loopItems[0];
    loopTextEl.classList.add('visible');

    /* Start/stop on visibility */
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (!loopInterval) loopInterval = setInterval(loopNext, 3000);
        } else {
          clearInterval(loopInterval);
          loopInterval = null;
        }
      });
    }, { threshold: 0.2 }).observe(loopTextEl.parentElement);
  }

  /* =============================================
     8. Checklist with localStorage
     ============================================= */
  const CHECKLIST_KEY = 'pm_onboarding_checklist';

  function loadState() {
    try { return JSON.parse(localStorage.getItem(CHECKLIST_KEY)) || {}; } catch { return {}; }
  }
  function saveState(s) {
    try { localStorage.setItem(CHECKLIST_KEY, JSON.stringify(s)); } catch { /* silent */ }
  }

  if (checklist) {
    const state = loadState();
    checklist.querySelectorAll('.checklist-item').forEach((item) => {
      const key = item.getAttribute('data-key');
      const input = item.querySelector('.checklist-input');
      if (state[key]) input.checked = true;
      input.addEventListener('change', () => {
        const s = loadState();
        s[key] = input.checked;
        saveState(s);
      });
    });
  }

  /* =============================================
     9. Orbital Team (Section 02)
     ============================================= */
  var orbitalWrap = document.getElementById('orbital-wrap');
  if (orbitalWrap) {
    var orbitNodes   = Array.from(orbitalWrap.querySelectorAll('.orbital-node'));
    var orbitTotal   = orbitNodes.length;
    var orbitAngle   = 0;
    var orbitAuto    = false;
    var orbitRafId   = null;
    var activeNodeId = null;

    /* --- Position every node from current orbitAngle --- */
    function orbitPosition() {
      var wrapW = orbitalWrap.offsetWidth;
      var cx    = wrapW / 2;
      var cy    = orbitalWrap.offsetHeight / 2;
      var R     = wrapW * 0.357;
      orbitalWrap.style.setProperty('--orbit-r', R + 'px');

      orbitNodes.forEach(function (node, i) {
        var base = (i / orbitTotal) * 360;
        var deg  = ((base + orbitAngle) % 360 + 360) % 360;
        var rad  = deg * Math.PI / 180;

        /* translate(x, y) from centre — matches original exactly */
        var tx = R * Math.cos(rad);
        var ty = R * Math.sin(rad);
        node.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px)';

        /* depth: z-index + opacity — original formula */
        var zIdx    = Math.round(100 + 50 * Math.cos(rad));
        var opacity = Math.max(0.4, Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(rad)) / 2)));

        if (node.classList.contains('active')) {
          node.style.zIndex  = '200';
          node.style.opacity = '1';
        } else {
          node.style.zIndex  = String(zIdx);
          node.style.opacity = opacity.toFixed(2);
        }
      });
    }

    /* --- Enable smooth transition for snap, disable for RAF rotation --- */
    function enableSnap() {
      orbitNodes.forEach(function (n) { n.classList.add('snapping'); });
    }
    function disableSnap() {
      orbitNodes.forEach(function (n) { n.classList.remove('snapping'); });
    }

    /* --- Clear all states --- */
    function orbitClearAll() {
      orbitNodes.forEach(function (n) {
        n.classList.remove('active', 'pulsing');
      });
      activeNodeId = null;
    }

    /* --- Toggle a node (matches original toggleItem exactly) --- */
    function toggleNode(id) {
      var wasActive = (activeNodeId === id);

      /* Close everything first */
      orbitClearAll();

      if (!wasActive) {
        /* Expand this node */
        activeNodeId = id;
        orbitNodes[id].classList.add('active');

        /* Pulse all other nodes (related effect) */
        orbitNodes.forEach(function (n, i) {
          if (i !== id) n.classList.add('pulsing');
        });

        /* Stop auto-rotation */
        orbitAuto = false;

        /* Enable smooth transition for the snap animation */
        enableSnap();

        /* centerViewOnNode: snap so active node is at top (270°) */
        var targetAngle = (id / orbitTotal) * 360;
        orbitAngle = 270 - targetAngle;
        orbitPosition();
      } else {
        /* Collapse — remove snap transition, resume auto-rotate */
        disableSnap();
        orbitAuto = true;
      }
    }

    /* --- RAF loop: 0.3° per frame ≈ original setInterval(50ms) --- */
    function orbitTick() {
      if (orbitAuto) {
        orbitAngle = (orbitAngle + 0.3) % 360;
        orbitPosition();
      }
      orbitRafId = requestAnimationFrame(orbitTick);
    }

    /* --- Event: node click --- */
    orbitNodes.forEach(function (node, i) {
      node.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleNode(i);
      });
      node.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); node.click(); }
      });
    });

    /* --- Event: background click (dismiss) --- */
    orbitalWrap.addEventListener('click', function (e) {
      if (e.target === orbitalWrap || e.target.classList.contains('orbital-track')) {
        orbitClearAll();
        disableSnap();
        orbitAuto = true;
      }
    });

    /* --- Start/stop on visibility --- */
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          orbitAuto = (activeNodeId === null);
          if (!orbitRafId) { orbitPosition(); orbitTick(); }
        } else {
          orbitAuto = false;
        }
      });
    }, { threshold: 0.1 }).observe(orbitalWrap);

    /* --- Resize --- */
    var orbitResizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(orbitResizeTimer);
      orbitResizeTimer = setTimeout(orbitPosition, 200);
    }, { passive: true });
  }

  /* =============================================
     10. Hero Particles — MagicUI port (vanilla JS)
        Ported from @magicui/particles
     ============================================= */
  if (!heroSection || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* --- Config --- */
  const QUANTITY   = 250;
  const STATICITY  = 50;
  const EASE       = 80;
  const BASE_SIZE  = 0.4;
  const COLOR_HEX  = '#000000';
  const VX         = 0;
  const VY         = 0;

  /* --- Setup DOM --- */
  const container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');
  container.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:0;overflow:hidden;';

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%;';
  container.appendChild(canvas);
  heroSection.insertBefore(container, heroSection.firstChild);

  const ctx  = canvas.getContext('2d');
  const DPR  = window.devicePixelRatio || 1;

  let canvasW = 0;
  let canvasH = 0;
  let circles = [];
  const mouse = { x: 0, y: 0 };

  /* --- Helpers --- */
  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    const n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const [R, G, B] = hexToRgb(COLOR_HEX);

  function remapValue(v, s1, e1, s2, e2) {
    const r = ((v - s1) * (e2 - s2)) / (e1 - s1) + s2;
    return r > 0 ? r : 0;
  }

  /* --- Particle factory --- */
  function mkCircle() {
    return {
      x:          Math.floor(Math.random() * canvasW),
      y:          Math.floor(Math.random() * canvasH),
      translateX: 0,
      translateY: 0,
      size:       Math.floor(Math.random() * 2) + BASE_SIZE,
      alpha:      0,
      targetAlpha: parseFloat((Math.random() * 0.6 + 0.1).toFixed(1)),
      dx:         (Math.random() - 0.5) * 0.1,
      dy:         (Math.random() - 0.5) * 0.1,
      magnetism:  0.1 + Math.random() * 4,
    };
  }

  /* --- Draw one circle --- */
  function drawCircle(c, update) {
    ctx.save();
    ctx.translate(c.translateX, c.translateY);
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${R},${G},${B},${c.alpha})`;
    ctx.fill();
    ctx.restore();
    if (!update) circles.push(c);
  }

  /* --- (Re)initialise canvas --- */
  function initCanvas() {
    canvasW = container.offsetWidth;
    canvasH = container.offsetHeight;
    canvas.width  = canvasW * DPR;
    canvas.height = canvasH * DPR;
    canvas.style.width  = canvasW + 'px';
    canvas.style.height = canvasH + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    circles = [];
    for (let i = 0; i < QUANTITY; i++) drawCircle(mkCircle());
  }

  /* --- Animation loop --- */
  function animate() {
    ctx.clearRect(0, 0, canvasW, canvasH);

    const dead = [];

    circles.forEach((c, i) => {
      /* Edge-proximity alpha fade */
      const edges = [
        c.x + c.translateX - c.size,
        canvasW - c.x - c.translateX - c.size,
        c.y + c.translateY - c.size,
        canvasH - c.y - c.translateY - c.size,
      ];
      const closest = Math.min(...edges);
      const remap   = parseFloat(remapValue(closest, 0, 20, 0, 1).toFixed(2));

      if (remap > 1) {
        c.alpha = Math.min(c.alpha + 0.02, c.targetAlpha);
      } else {
        c.alpha = c.targetAlpha * remap;
      }

      /* Movement */
      c.x += c.dx + VX;
      c.y += c.dy + VY;

      /* Magnetism toward mouse (relative to canvas centre) */
      c.translateX += (mouse.x / (STATICITY / c.magnetism) - c.translateX) / EASE;
      c.translateY += (mouse.y / (STATICITY / c.magnetism) - c.translateY) / EASE;

      drawCircle(c, true);

      /* Cull if out of bounds */
      if (
        c.x < -c.size || c.x > canvasW + c.size ||
        c.y < -c.size || c.y > canvasH + c.size
      ) {
        dead.push(i);
      }
    });

    /* Replace culled circles (iterate backwards to keep indices valid) */
    for (let i = dead.length - 1; i >= 0; i--) {
      circles.splice(dead[i], 1);
      drawCircle(mkCircle());
    }

    requestAnimationFrame(animate);
  }

  /* --- Mouse tracking (relative to canvas centre) --- */
  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x    = e.clientX - rect.left  - canvasW / 2;
    const y    = e.clientY - rect.top   - canvasH / 2;
    if (x > -canvasW / 2 && x < canvasW / 2 && y > -canvasH / 2 && y < canvasH / 2) {
      mouse.x = x;
      mouse.y = y;
    }
  }, { passive: true });

  /* --- Resize (debounced) --- */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initCanvas, 200);
  }, { passive: true });

  /* (Search bar glow removed — replaced by Morph Panel) */

  /* --- Start --- */
  initCanvas();
  animate();

})();
