(() => {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[data-section]');
  const visible = new Set();
  let current = '';

  function update() {
    // At bottom of page, always highlight about
    if ((window.innerHeight + window.scrollY) >= document.body.scrollHeight - 50) {
      if (current !== 'about') {
        current = 'about';
        navLinks.forEach(l => l.classList.remove('active'));
        document.querySelector('.nav-link[data-section="about"]')?.classList.add('active');
      }
      return;
    }
    // Pick the topmost visible section
    let topId = '';
    let topY = Infinity;
    visible.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const y = el.getBoundingClientRect().top;
        if (y < topY) { topY = y; topId = id; }
      }
    });
    if (topId && topId !== current) {
      current = topId;
      navLinks.forEach(l => l.classList.remove('active'));
      document.querySelector(`.nav-link[data-section="${topId}"]`)?.classList.add('active');
    }
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) visible.add(entry.target.id);
      else visible.delete(entry.target.id);
    });
    update();
  }, { threshold: 0 });

  sections.forEach(s => observer.observe(s));
  window.addEventListener('scroll', update, { passive: true });
})();
