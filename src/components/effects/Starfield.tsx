import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  depth: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
}

function createStars(width: number, height: number, count: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 1.6 + 0.4,
    opacity: Math.random() * 0.5 + 0.2,
    twinkleSpeed: Math.random() * 0.02 + 0.005,
    twinkleOffset: Math.random() * Math.PI * 2,
    depth: Math.random() * 0.6 + 0.4,
  }));
}

function spawnShootingStar(width: number, height: number): ShootingStar {
  return {
    x: Math.random() * width * 0.8,
    y: Math.random() * height * 0.4,
    length: Math.random() * 80 + 40,
    speed: Math.random() * 6 + 8,
    angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
    opacity: 1,
  };
}

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const starsRef = useRef<Star[]>([]);
  const shootingRef = useRef<ShootingStar | null>(null);
  const nextShootRef = useRef(0);
  const frameRef = useRef(0);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    reducedMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let animationId = 0;
    let isDark = document.documentElement.classList.contains('dark');

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      starsRef.current = createStars(width, height, Math.floor((width * height) / 9000));
    }

    function onMove(event: MouseEvent) {
      mouseRef.current = {
        x: event.clientX / width,
        y: event.clientY / height,
      };
    }

    function onThemeChange() {
      isDark = document.documentElement.classList.contains('dark');
    }

    const observer = new MutationObserver(onThemeChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    function drawBackground() {
      if (isDark) {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#020617');
        gradient.addColorStop(0.5, '#0a0f1e');
        gradient.addColorStop(1, '#030712');
        ctx.fillStyle = gradient;
      } else {
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#eef2ff');
        gradient.addColorStop(0.5, '#f1f5f9');
        gradient.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = gradient;
      }
      ctx.fillRect(0, 0, width, height);
    }

    function drawMouseGlow() {
      const mx = mouseRef.current.x * width;
      const my = mouseRef.current.y * height;
      const glow = ctx.createRadialGradient(mx, my, 0, mx, my, 280);
      if (isDark) {
        glow.addColorStop(0, 'rgba(99, 102, 241, 0.12)');
        glow.addColorStop(0.4, 'rgba(16, 185, 129, 0.06)');
        glow.addColorStop(1, 'transparent');
      } else {
        glow.addColorStop(0, 'rgba(99, 102, 241, 0.08)');
        glow.addColorStop(0.5, 'rgba(16, 185, 129, 0.04)');
        glow.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    }

    function drawStars(time: number) {
      const parallaxX = (mouseRef.current.x - 0.5) * 24;
      const parallaxY = (mouseRef.current.y - 0.5) * 16;

      for (const star of starsRef.current) {
        const twinkle = reducedMotionRef.current
          ? 1
          : 0.55 + 0.45 * Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
        const px = star.x + parallaxX * star.depth;
        const py = star.y + parallaxY * star.depth;

        const wrappedX = ((px % width) + width) % width;
        const wrappedY = ((py % height) + height) % height;

        ctx.beginPath();
        ctx.arc(wrappedX, wrappedY, star.size, 0, Math.PI * 2);
        const alpha = star.opacity * twinkle;
        if (isDark) {
          ctx.fillStyle = `rgba(226, 232, 240, ${alpha})`;
        } else {
          ctx.fillStyle = `rgba(71, 85, 105, ${alpha * 0.7})`;
        }
        ctx.fill();
      }
    }

    function drawShootingStar(time: number) {
      if (reducedMotionRef.current) return;

      if (!shootingRef.current && time > nextShootRef.current) {
        shootingRef.current = spawnShootingStar(width, height);
        nextShootRef.current = time + Math.random() * 6000 + 4000;
      }

      const star = shootingRef.current;
      if (!star) return;

      const tailX = star.x - Math.cos(star.angle) * star.length;
      const tailY = star.y - Math.sin(star.angle) * star.length;

      const gradient = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
      gradient.addColorStop(0, 'transparent');
      if (isDark) {
        gradient.addColorStop(0.6, `rgba(167, 243, 208, ${star.opacity * 0.3})`);
        gradient.addColorStop(1, `rgba(110, 231, 183, ${star.opacity})`);
      } else {
        gradient.addColorStop(0.6, `rgba(16, 185, 129, ${star.opacity * 0.2})`);
        gradient.addColorStop(1, `rgba(5, 150, 105, ${star.opacity * 0.7})`);
      }

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(star.x, star.y);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      star.x += Math.cos(star.angle) * star.speed;
      star.y += Math.sin(star.angle) * star.speed;
      star.opacity -= 0.018;

      if (star.opacity <= 0 || star.x > width + 100 || star.y > height + 100) {
        shootingRef.current = null;
      }
    }

    function animate(time: number) {
      drawBackground();
      drawMouseGlow();
      drawStars(time);
      drawShootingStar(time);
      animationId = window.requestAnimationFrame(animate);
    }

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove, { passive: true });
    animationId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
