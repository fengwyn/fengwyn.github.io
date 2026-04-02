const canvas = document.getElementById('stars-canvas');
const ctx = canvas.getContext('2d');
let stars = [];
const starCount = 150;
let mouse = { x: -1000, y: -1000 };

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

class Star {
  constructor() {
    this.init();
  }

  init() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 1.5 + 0.5;
    this.baseOpacity = Math.random() * 0.2 + 0.1;
    this.opacity = this.baseOpacity;
    this.color = Math.random() > 0.8 ? '#e3b5ff' : '#ffffff';
    this.isShooting = false;
    this.speedX = 0;
    this.speedY = 0;
    this.trail = [];
  }

  update() {
    if (this.isShooting) {
      this.trail.push({ x: this.x, y: this.y, opacity: this.opacity });
      if (this.trail.length > 20) this.trail.shift();

      this.x += this.speedX;
      this.y += this.speedY;

      if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
        this.isShooting = false;
        this.trail = [];
        this.init();
      }
    } else {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 150) {
        const influence = (1 - dist / 150);
        this.opacity = this.baseOpacity + influence * 0.8;
        this.size = (Math.random() * 1.5 + 0.5) * (1 + influence);
      } else {
        this.opacity = this.baseOpacity;
        this.size = Math.max(this.size * 0.95, Math.random() * 1.5 + 0.5);
      }

      if (Math.random() < 0.0005) {
        this.isShooting = true;
        this.speedX = (Math.random() - 0.5) * 15;
        this.speedY = (Math.random() - 0.5) * 15;
        this.opacity = 1;
      }
    }
  }

  draw() {
    if (this.isShooting) {
      this.trail.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, this.size * (i / this.trail.length), 0, Math.PI * 2);
        ctx.fillStyle = this.color + Math.floor((p.opacity * (i / this.trail.length)) * 255).toString(16).padStart(2, '0');
        ctx.fill();
      });
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color + Math.floor(this.opacity * 255).toString(16).padStart(2, '0');
    ctx.shadowBlur = this.opacity > 0.4 ? 10 : 0;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function initStars() {
  resize();
  for (let i = 0; i < starCount; i++) {
    stars.push(new Star());
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stars.forEach(star => {
    star.update();
    star.draw();
  });
  requestAnimationFrame(animate);
}

initStars();
animate();
