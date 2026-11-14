import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  radius: number;
  speed: number;
  alpha: number;
  phase: number;
  tint: string;
}

/** Lightweight 2D starfield: no WebGL context, continuously drifting. */
export default function DeepSpaceStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let last = performance.now();
    let stars: Star[] = [];
    let meteor: { x: number; y: number; vx: number; vy: number; life: number } | null = null;
    let nextMeteor = performance.now() + 4500;

    const tints = ["255,255,255", "220,235,255", "255,240,215", "205,225,255"];

    const seed = () => {
      const count = Math.max(110, Math.round((width * height) / 6500));
      stars = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0.5 + Math.random() * 1.45,
        speed: 4 + Math.random() * 16,
        alpha: 0.4 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        tint: tints[index % tints.length] ?? "255,255,255",
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.08);
      last = now;
      context.clearRect(0, 0, width, height);

      for (const star of stars) {
        star.x -= star.speed * dt;
        if (star.x < -3) {
          star.x = width + 3;
          star.y = Math.random() * height;
        }
        const twinkle = 0.78 + Math.sin(now / 1400 + star.phase) * 0.22;
        context.beginPath();
        context.fillStyle = `rgba(${star.tint},${star.alpha * twinkle})`;
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        context.fill();

        if (star.radius > 1.35) {
          context.strokeStyle = `rgba(${star.tint},${star.alpha * 0.35})`;
          context.lineWidth = 0.6;
          context.beginPath();
          context.moveTo(star.x - star.radius * 3, star.y);
          context.lineTo(star.x + star.radius * 3, star.y);
          context.moveTo(star.x, star.y - star.radius * 3);
          context.lineTo(star.x, star.y + star.radius * 3);
          context.stroke();
        }
      }

      if (now > nextMeteor) {
        meteor = {
          x: width * (0.55 + Math.random() * 0.35),
          y: height * (0.12 + Math.random() * 0.3),
          vx: -(180 + Math.random() * 120),
          vy: 90 + Math.random() * 80,
          life: 1,
        };
        nextMeteor = now + 8000 + Math.random() * 7000;
      }

      if (meteor) {
        meteor.x += meteor.vx * dt;
        meteor.y += meteor.vy * dt;
        meteor.life -= dt * 0.65;
        if (meteor.life <= 0) {
          meteor = null;
        } else {
          const tailX = meteor.x - meteor.vx * 0.11;
          const tailY = meteor.y - meteor.vy * 0.11;
          const gradient = context.createLinearGradient(tailX, tailY, meteor.x, meteor.y);
          gradient.addColorStop(0, "rgba(180,215,255,0)");
          gradient.addColorStop(1, `rgba(235,245,255,${0.75 * meteor.life})`);
          context.strokeStyle = gradient;
          context.lineWidth = 1.1;
          context.beginPath();
          context.moveTo(tailX, tailY);
          context.lineTo(meteor.x, meteor.y);
          context.stroke();
        }
      }

      frame = requestAnimationFrame(draw);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("resize", resize);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      for (const star of stars) {
        context.beginPath();
        context.fillStyle = `rgba(${star.tint},${star.alpha})`;
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        context.fill();
      }
    } else {
      frame = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
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
