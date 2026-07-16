// ---------- Scroll reveal ----------
(function reveal() {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  items.forEach((el) => io.observe(el));
})();

// ---------- Gauge / ring fill (big hero gauge + small applicant rings) ----------
// Elements need: data-score (0-100), and an SVG circle with class gauge-fill or fg
// with a known circumference set via data-circumference.
(function gauges() {
  function paint(el) {
    const score = Number(el.dataset.score || 0);
    const circle = el.querySelector('.gauge-fill, .fg');
    if (!circle) return;
    const circumference = Number(el.dataset.circumference || circle.getAttribute('data-circumference') || 502);
    const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
    // colour by band
    let color = 'var(--green-500)';
    if (score < 40) color = 'var(--red-500)';
    else if (score < 70) color = 'var(--amber-500)';
    circle.style.stroke = circle.classList.contains('gauge-fill') ? '' : color;
    requestAnimationFrame(() => {
      circle.style.strokeDashoffset = String(offset);
    });
    const numEl = el.querySelector('.gauge-score, .val');
    if (numEl) animateCount(numEl, score);
  }
  document.querySelectorAll('[data-score]').forEach(paint);
})();

// ---------- Count-up numbers ----------
function animateCount(el, target, duration = 1200) {
  const start = 0;
  const startTime = performance.now();
  function tick(now) {
    const progress = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + (target - start) * eased);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
document.querySelectorAll('[data-count]').forEach((el) => {
  const target = Number(el.dataset.count || 0);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(el, target);
        io.unobserve(el);
      }
    });
  });
  io.observe(el);
});

// ---------- File drop UX for resume upload ----------
(function fileDrop() {
  const drop = document.querySelector('[data-file-drop]');
  if (!drop) return;
  const input = drop.querySelector('input[type="file"]');
  const nameEl = drop.querySelector('[data-file-name]');

  const showName = () => {
    if (input.files && input.files[0]) {
      nameEl.textContent = input.files[0].name;
      nameEl.style.display = 'block';
    }
  };

  drop.addEventListener('click', () => input.click());
  input.addEventListener('change', showName);
  ['dragenter', 'dragover'].forEach((evt) =>
    drop.addEventListener(evt, (e) => {
      e.preventDefault();
      drop.classList.add('drag');
    })
  );
  ['dragleave', 'drop'].forEach((evt) =>
    drop.addEventListener(evt, (e) => {
      e.preventDefault();
      drop.classList.remove('drag');
    })
  );
  drop.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      input.files = e.dataTransfer.files;
      showName();
    }
  });
})();

// ---------- Mobile nav ----------
(function mobileNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => links.classList.toggle('nav-open'));
})();

// ---------- Cursor glow ----------
(function cursorGlow() {
  const glow = document.querySelector('.cursor-glow');
  if (!glow || matchMedia('(hover: none)').matches) return;
  let raf = null;
  window.addEventListener('mousemove', (e) => {
    glow.style.opacity = '1';
    if (raf) return;
    raf = requestAnimationFrame(() => {
      glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      raf = null;
    });
  });
  document.addEventListener('mouseleave', () => (glow.style.opacity = '0'));
})();

// ---------- Magnetic buttons ----------
(function magnetic() {
  const els = document.querySelectorAll('.magnetic');
  if (!els.length || matchMedia('(hover: none)').matches) return;
  els.forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const mx = (e.clientX - rect.left - rect.width / 2) * 0.25;
      const my = (e.clientY - rect.top - rect.height / 2) * 0.35;
      el.style.setProperty('--mx', mx.toFixed(1));
      el.style.setProperty('--my', my.toFixed(1));
    });
    el.addEventListener('mouseleave', () => {
      el.style.setProperty('--mx', 0);
      el.style.setProperty('--my', 0);
    });
  });
})();

// ---------- 3D tilt cards ----------
(function tiltCards() {
  const cards = document.querySelectorAll('.tilt');
  if (!cards.length || matchMedia('(hover: none)').matches) return;
  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty('--rx', (px * 6).toFixed(2));
      card.style.setProperty('--ry', (py * 6).toFixed(2));
    });
    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--rx', 0);
      card.style.setProperty('--ry', 0);
    });
  });
})();

// ---------- Command palette (⌘K / Ctrl+K) ----------
(function commandPalette() {
  const backdrop = document.getElementById('cmdk-backdrop');
  const trigger = document.getElementById('cmdk-trigger');
  const input = document.getElementById('cmdk-input');
  const results = document.getElementById('cmdk-results');
  if (!backdrop || !trigger || !input || !results) return;

  const staticLinks = [
    { t: 'Browse jobs', s: 'See every open role', href: '/jobs' },
    { t: 'How it works', s: 'Jump to the landing page section', href: '/#how-it-works' },
    { t: 'Log in', s: 'Access your dashboard', href: '/auth/login' },
    { t: 'Create an account', s: 'Candidate or recruiter', href: '/auth/register' },
  ];

  let activeIndex = -1;
  let currentItems = [];

  function open() {
    backdrop.classList.add('open');
    input.value = '';
    renderStatic();
    setTimeout(() => input.focus(), 50);
  }
  function close() {
    backdrop.classList.remove('open');
  }

  function renderItems(items, emptyLabel) {
    currentItems = items;
    activeIndex = items.length ? 0 : -1;
    if (!items.length) {
      results.innerHTML = `<div class="cmdk-empty">${emptyLabel}</div>`;
      return;
    }
    results.innerHTML = items
      .map(
        (item, i) => `
        <a class="cmdk-item ${i === 0 ? 'active' : ''}" href="${item.href}" data-index="${i}">
          <span>
            <span class="t">${item.t}</span><br/>
            <span class="s">${item.s}</span>
          </span>
        </a>`
      )
      .join('');
  }

  function renderStatic() {
    results.innerHTML = '<div class="cmdk-section-label">Quick links</div>';
    const wrap = document.createElement('div');
    wrap.innerHTML = staticLinks
      .map((item, i) => `<a class="cmdk-item ${i === 0 ? 'active' : ''}" href="${item.href}"><span><span class="t">${item.t}</span><br/><span class="s">${item.s}</span></span></a>`)
      .join('');
    results.appendChild(wrap);
    currentItems = staticLinks;
    activeIndex = 0;
  }

  let debounceTimer = null;
  input.addEventListener('input', () => {
    const q = input.value.trim();
    clearTimeout(debounceTimer);
    if (!q) return renderStatic();
    debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`/jobs/search.json?q=${encodeURIComponent(q)}`);
        const jobs = await res.json();
        renderItems(
          jobs.map((j) => ({ t: j.title, s: `${j.company} · ${j.location}`, href: `/jobs/${j._id}` })),
          'No matching jobs — try a different keyword.'
        );
      } catch (e) {
        renderItems([], 'Search is unavailable right now.');
      }
    }, 220);
  });

  input.addEventListener('keydown', (e) => {
    const items = results.querySelectorAll('.cmdk-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(items.length - 1, activeIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(0, activeIndex - 1);
    } else if (e.key === 'Enter') {
      const el = items[activeIndex];
      if (el) window.location.href = el.getAttribute('href');
      return;
    } else if (e.key === 'Escape') {
      close();
      return;
    } else {
      return;
    }
    items.forEach((el, i) => el.classList.toggle('active', i === activeIndex));
    if (items[activeIndex]) items[activeIndex].scrollIntoView({ block: 'nearest' });
  });

  trigger.addEventListener('click', open);
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      backdrop.classList.contains('open') ? close() : open();
    }
  });
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });
})();

// ---------- Confetti burst (used when a candidate is shortlisted/hired) ----------
function fireConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = ['#3f5eef', '#2ecc71', '#f5a524', '#8b5cf6', '#ef4444'];
  const pieces = Array.from({ length: 90 }, () => ({
    x: canvas.width / 2,
    y: canvas.height / 3,
    vx: (Math.random() - 0.5) * 14,
    vy: Math.random() * -12 - 4,
    size: Math.random() * 6 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    spin: (Math.random() - 0.5) * 18,
  }));
  let frame = 0;
  function tick() {
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p) => {
      p.vy += 0.35;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });
    if (frame < 130) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  tick();
}

// ---------- Kanban drag-and-drop pipeline board ----------
(function kanban() {
  const board = document.getElementById('kanban-board');
  if (!board) return;

  let dragged = null;

  board.querySelectorAll('.kanban-card').forEach((card) => {
    card.addEventListener('dragstart', () => {
      dragged = card;
      setTimeout(() => card.classList.add('dragging'), 0);
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      dragged = null;
    });
  });

  board.querySelectorAll('.kanban-drop').forEach((zone) => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', async (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      if (!dragged) return;

      const previousStage = dragged.closest('.kanban-drop').dataset.stage;
      const newStage = zone.dataset.stage;
      if (previousStage === newStage) return;

      const appId = dragged.dataset.appId;
      const emptyState = zone.querySelector('.kanban-empty');
      if (emptyState) emptyState.remove();
      zone.appendChild(dragged);
      updateColumnCounts(board);

      try {
        const res = await fetch(`${board.dataset.moveUrlBase}/${appId}/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStage }),
        });
        if (!res.ok) throw new Error('Move failed');
        if (newStage === 'shortlisted' || newStage === 'hired') fireConfetti();
      } catch (err) {
        // Roll back optimistic UI on failure.
        const originalZone = board.querySelector(`.kanban-drop[data-stage="${previousStage}"]`);
        if (originalZone) originalZone.appendChild(dragged);
        updateColumnCounts(board);
        alert('Could not update this application. Please try again.');
      }
    });
  });

  function updateColumnCounts(root) {
    root.querySelectorAll('.kanban-col').forEach((col) => {
      const count = col.querySelectorAll('.kanban-card').length;
      const countEl = col.querySelector('.kanban-count');
      if (countEl) countEl.textContent = String(count);
      const dropZone = col.querySelector('.kanban-drop');
      if (dropZone && !count && !dropZone.querySelector('.kanban-empty')) {
        const empty = document.createElement('div');
        empty.className = 'kanban-empty';
        empty.textContent = 'Drop here';
        dropZone.appendChild(empty);
      }
    });
  }
})();
