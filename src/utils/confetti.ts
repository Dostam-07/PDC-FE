/**
 * Zero-dependency, high-performance HTML5 Canvas Confetti Engine
 * Designed for celebration milestones (e.g. "Your Logical Framework is ready!")
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: 'rect' | 'circle';
  rotation: number;
  rotationSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  opacity: number;
}

const CELEBRATION_COLORS = [
  '#7C3AED', // Brand Purple
  '#9333EA', // Vivid Purple
  '#A855F7', // Light Purple
  '#F59E0B', // Amber / Gold
  '#FBBF24', // Yellow Gold
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#F43F5E', // Rose
  '#EC4899', // Pink
];

export const triggerCelebratoryConfetti = () => {
  if (typeof window === 'undefined') return;

  // Respect user preference for reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'pdc-confetti-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '99999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const resize = () => {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  };
  resize();

  const width = window.innerWidth;
  const height = window.innerHeight;

  const particles: Particle[] = [];
  const particleCount = 140;

  // Launch from left cannon (shooting up and right)
  for (let i = 0; i < particleCount / 2; i++) {
    const angle = (Math.PI / 4) + (Math.random() * 0.4 - 0.2); // ~45 deg
    const speed = 12 + Math.random() * 10;
    particles.push({
      x: width * 0.1,
      y: height * 0.85,
      vx: Math.cos(angle) * speed + (Math.random() * 2),
      vy: -Math.sin(angle) * speed,
      size: 6 + Math.random() * 6,
      color: CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)],
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.08 + Math.random() * 0.08,
      opacity: 1,
    });
  }

  // Launch from right cannon (shooting up and left)
  for (let i = 0; i < particleCount / 2; i++) {
    const angle = (Math.PI * 0.75) + (Math.random() * 0.4 - 0.2); // ~135 deg
    const speed = 12 + Math.random() * 10;
    particles.push({
      x: width * 0.9,
      y: height * 0.85,
      vx: Math.cos(angle) * speed - (Math.random() * 2),
      vy: -Math.sin(angle) * speed,
      size: 6 + Math.random() * 6,
      color: CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)],
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.08 + Math.random() * 0.08,
      opacity: 1,
    });
  }

  const gravity = 0.38;
  const drag = 0.985;
  const startTime = Date.now();
  const maxDuration = 3800; // 3.8s total celebration

  let animationFrameId: number;

  const render = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed > maxDuration) {
      cancelAnimationFrame(animationFrameId);
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, width, height);

    let activeCount = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.vx *= drag;
      p.vy *= drag;
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;

      p.rotation += p.rotationSpeed;
      p.wobble += p.wobbleSpeed;

      // Start fading out after 2.2 seconds
      if (elapsed > 2200) {
        p.opacity = Math.max(0, 1 - (elapsed - 2200) / (maxDuration - 2200));
      }

      if (p.opacity > 0 && p.y < height + 40) {
        activeCount++;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        const scaleX = Math.cos(p.wobble);
        ctx.scale(scaleX, 1);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    if (activeCount > 0) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameId);
      canvas.remove();
    }
  };

  animationFrameId = requestAnimationFrame(render);
};
