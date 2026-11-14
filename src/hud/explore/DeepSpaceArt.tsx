const BLUE = "#2d5f8b";
const BLUE_LIGHT = "#4d86b8";
const METAL = "#c9c3b5";
const METAL_DARK = "#8e897e";

function DawnArt() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="dawn-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e6dcc4" />
          <stop offset="1" stopColor="#9b8f78" />
        </linearGradient>
        <linearGradient id="dawn-panel" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#18344f" />
          <stop offset="0.5" stopColor="#3d76a6" />
          <stop offset="1" stopColor="#162c43" />
        </linearGradient>
      </defs>
      <g transform="rotate(-8 60 60)">
        <polygon points="8,40 46,30 46,64 8,76" fill="url(#dawn-panel)" stroke="#7ec8ff" strokeOpacity=".35" />
        <polygon points="74,30 112,40 112,76 74,64" fill="url(#dawn-panel)" stroke="#7ec8ff" strokeOpacity=".35" />
        <path d="M18 42l24-7M18 53l24-5M18 64l24-3M78 33l24 7M78 48l24 5M78 61l24 3" stroke="#8fd4ff" strokeOpacity=".45" strokeWidth="1" />
        <polygon points="46,34 74,34 80,54 70,76 50,76 40,54" fill="url(#dawn-body)" stroke="#f1e8d4" strokeOpacity=".55" />
        <ellipse cx="60" cy="28" rx="17" ry="5" fill="#ded4bd" />
        <path d="M46 28c0 7 6 12 14 12s14-5 14-12" fill="#b8ae98" opacity=".9" />
        <rect x="55" y="72" width="10" height="8" fill="#6e6a61" />
        <ellipse cx="60" cy="82" rx="12" ry="3.5" fill="#3b3a38" />
        <circle cx="60" cy="52" r="4" fill="#5ce1ff" opacity=".8" />
      </g>
    </svg>
  );
}

function NearArt() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="near-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ded6c5" />
          <stop offset="1" stopColor="#8d877c" />
        </linearGradient>
      </defs>
      <g transform="rotate(6 60 60)">
        <polygon points="14,34 44,26 44,62 14,72" fill={BLUE} stroke="#7ec8ff" strokeOpacity=".4" />
        <polygon points="76,26 106,34 106,72 76,62" fill={BLUE} stroke="#7ec8ff" strokeOpacity=".4" />
        <polygon points="49,26 71,26 71,62 49,62" fill={BLUE_LIGHT} opacity=".9" />
        <polygon points="42,42 78,42 84,66 74,86 46,86 36,66" fill="url(#near-body)" stroke="#f1e8d4" strokeOpacity=".5" />
        <ellipse cx="60" cy="38" rx="16" ry="5.5" fill="#e8e0ce" />
        <path d="M44 38c0 7 7 12 16 12s16-5 16-12" fill="#a9a295" />
        <path d="M70 44l24 22" stroke={METAL_DARK} strokeWidth="3" strokeLinecap="round" />
        <circle cx="94" cy="66" r="2.5" fill="#5ce1ff" />
        <rect x="55" y="86" width="10" height="7" fill="#6e6a61" />
      </g>
    </svg>
  );
}

function PioneerArt() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="pioneer-dish" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2ead9" />
          <stop offset="0.55" stopColor="#bdb5a4" />
          <stop offset="1" stopColor="#776f62" />
        </linearGradient>
      </defs>
      <g transform="rotate(-4 60 60)">
        <ellipse cx="60" cy="38" rx="38" ry="16" fill="url(#pioneer-dish)" stroke="#fff5df" strokeOpacity=".5" />
        <ellipse cx="60" cy="38" rx="28" ry="11" fill="none" stroke="#6f665a" strokeOpacity=".55" />
        <path d="M60 50v18" stroke={METAL_DARK} strokeWidth="4" />
        <rect x="48" y="66" width="24" height="18" rx="3" fill={METAL} stroke="#f1e8d4" strokeOpacity=".5" />
        <path d="M72 78l22 8" stroke={METAL_DARK} strokeWidth="4" strokeLinecap="round" />
        <rect x="92" y="80" width="9" height="14" rx="2" fill="#5b5b5b" transform="rotate(18 96 86)" />
        <path d="M48 72l-16 10" stroke={METAL_DARK} strokeWidth="2.5" strokeLinecap="round" />
        <rect x="22" y="82" width="12" height="4" fill={BLUE} />
        <circle cx="60" cy="60" r="2.5" fill="#5ce1ff" />
      </g>
    </svg>
  );
}

function KeplerArt() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="kepler-tube" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8e1d1" />
          <stop offset="1" stopColor="#8c8578" />
        </linearGradient>
        <linearGradient id="kepler-panel" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#152c43" />
          <stop offset="0.5" stopColor="#3d76a6" />
          <stop offset="1" stopColor="#152c43" />
        </linearGradient>
      </defs>
      <g transform="rotate(-10 60 60)">
        <rect x="24" y="44" width="72" height="22" rx="11" fill="url(#kepler-tube)" stroke="#fff5df" strokeOpacity=".5" />
        <ellipse cx="26" cy="55" rx="6" ry="11" fill="#6f665a" />
        <ellipse cx="26" cy="55" rx="3.5" ry="8" fill="#1b2f45" />
        <polygon points="34,66 94,66 90,92 38,92" fill="url(#kepler-panel)" stroke="#7ec8ff" strokeOpacity=".35" />
        <path d="M44 70l-4 18M58 70l-3 18M72 70l-2 18M86 70l-1 18" stroke="#8fd4ff" strokeOpacity=".4" />
        <rect x="94" y="50" width="8" height="8" rx="1" fill="#5ce1ff" opacity=".8" />
      </g>
    </svg>
  );
}

export default function DeepSpaceArt({ id }: { id: string }) {
  if (id === "dawn") return <DawnArt />;
  if (id === "near-shoemaker") return <NearArt />;
  if (id === "pioneer") return <PioneerArt />;
  return <KeplerArt />;
}
