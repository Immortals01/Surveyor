export default function Hud() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-6">
      <header className="pointer-events-auto max-w-md">
        <p className="font-mono text-xs tracking-widest text-loro uppercase">
          2026 NASA Space Apps Challenge
        </p>
        <h1 className="font-display text-2xl font-bold text-regolith-bright">
          Abandoned, Not Forgotten
        </h1>
      </header>
    </div>
  );
}
