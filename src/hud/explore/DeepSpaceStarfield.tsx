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

    const tints = ["255,255,255", "220,235,255", "255,240,215", "205,225,255"];

    const seed = () => {
      const count = Math.max(90, Math.round((width * height) / 9000));
      stars = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0.35 + Math.random() * 1.25,
        speed: 3 + Math.random() * 13,
        alpha: 0.25 + Math.random() * 0.7,
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
