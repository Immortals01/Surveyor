import { motion } from "motion/react";
import { useAppStore } from "@/store/useAppStore";
import { LORO_MOODS } from "./moods";

interface LoRoProps {
  size?: "sm" | "md" | "lg";
}

/**
 * High-detail technical illustration of NASA's Surveyor 3 Lunar Lander (1967-035A):
 * - Sun-tanned white/butterscotch tubular triangular spaceframe resting on a crater slope
 * - Three hinged shock-absorber landing legs with circular honeycomb footpads
 * - Tall mast with tilted photovoltaic solar panel & planar high-gain antenna
 * - Accordion-linkage Surface Sampler soil scoop arm (waves/articulates!)
 * - Rotating-mirror Television Survey Camera hood acting as an expressive optical eye
 */
export default function LoRo({ size = "md" }: LoRoProps) {
  const mood = useAppStore((s) => s.loroMood);
  const isSpeaking = useAppStore((s) => Boolean(s.dialogue?.isSpeaking));
  const speaker = useAppStore((s) => s.dialogue?.speaker ?? "loro");
  const reduceMotion = useAppStore((s) => s.settings.reduceMotion);

  const spec = LORO_MOODS[mood];
  const dim =
    size === "lg"
      ? "h-24 w-24 sm:h-28 sm:w-28"
      : size === "sm"
        ? "h-14 w-14"
        : "h-20 w-20 sm:h-22 sm:w-22";

  const accentHex = speaker === "equipment" ? "#ffcf70" : spec.irisColor;

  return (
    <div
      className={`relative select-none ${dim} shrink-0`}
      aria-label={`Surveyor 3 Host (${spec.label})`}
    >
      <motion.svg
        viewBox="0 0 160 160"
        className="relative h-full w-full"
        animate={
          reduceMotion
            ? { y: 0, rotate: spec.bodyTiltDeg * 0.35 }
            : {
                y: mood === "excited" ? [0, -2.5, 0] : [0, -1, 0],
                rotate: spec.bodyTiltDeg * 0.35,
              }
        }
        transition={
          reduceMotion
            ? { duration: 0.2 }
            : {
                y: {
                  duration: mood === "excited" ? 1.4 : 3.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                rotate: { duration: 0.45, ease: "easeOut" },
              }
        }
      >
        <defs>
          {/* Sun-tanned white-to-butterscotch thermal paint gradient */}
          <linearGradient id="sv3-hull" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5efe2" />
            <stop offset="55%" stopColor="#dfcda8" />
            <stop offset="100%" stopColor="#9c8253" />
          </linearGradient>
          <linearGradient id="sv3-chrome" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <linearGradient id="sv3-solar" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="50%" stopColor="#172554" />
            <stop offset="100%" stopColor="#090d16" />
          </linearGradient>
          <radialGradient id="sv3-lens" cx="42%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="70%" stopColor="#090e18" />
            <stop offset="100%" stopColor="#020409" />
          </radialGradient>
        </defs>

        {/* Technical Corner Reticle Ticks */}
        <g stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1" fill="none">
          <path d="M 8 20 L 8 8 L 20 8" />
          <path d="M 140 8 L 152 8 L 152 20" />
          <path d="M 8 140 L 8 152 L 20 152" />
          <path d="M 140 152 L 152 152 L 152 140" />
        </g>

        {/* Subtle Oceanus Procellarum Crater Slope Horizon */}
        <path
          d="M 12 138 Q 80 128 148 142"
          fill="none"
          stroke="#d9cbb0"
          strokeOpacity="0.28"
          strokeWidth="1.5"
        />

        {/* Central Mast + Planar High-Gain Antenna + Solar Panel */}
        <g>
          {/* Vertical mast tube */}
          <line x1="78" y1="62" x2="78" y2="18" stroke="#cbd5e1" strokeWidth="3" />
          <line x1="74" y1="62" x2="78" y2="28" stroke="#64748b" strokeWidth="1.2" />

          {/* Tilted Planar High-Gain Antenna (Left of Mast) */}
          <motion.g
            style={{ transformOrigin: "74px 28px" }}
            animate={
              reduceMotion
                ? { rotate: 0 }
                : { rotate: mood === "scanning" ? [-5, 6, -5] : [-1.5, 2, -1.5] }
            }
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <polygon
              points="40,18 72,12 74,34 42,40"
              fill="url(#sv3-hull)"
              stroke="#f8fafc"
              strokeWidth="1.2"
            />
            <line x1="48" y1="20" x2="49" y2="38" stroke="#64748b" strokeOpacity="0.45" strokeWidth="0.8" />
            <line x1="56" y1="18" x2="57" y2="36" stroke="#64748b" strokeOpacity="0.45" strokeWidth="0.8" />
            <line x1="64" y1="16" x2="65" y2="35" stroke="#64748b" strokeOpacity="0.45" strokeWidth="0.8" />
            <line x1="41" y1="28" x2="73" y2="23" stroke="#64748b" strokeOpacity="0.45" strokeWidth="0.8" />

            {/* Radio telemetry wave arcs when speaking */}
            {(isSpeaking || mood === "scanning") && (
              <>
                <motion.path
                  d="M 46 10 Q 56 3 68 8"
                  fill="none"
                  stroke={accentHex}
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  animate={
                    reduceMotion ? { opacity: 0.7 } : { opacity: [0.15, 0.85, 0.15] }
                  }
                  transition={{ duration: 1.1, repeat: Infinity }}
                />
                <motion.path
                  d="M 42 5 Q 56 -3 72 4"
                  fill="none"
                  stroke={accentHex}
                  strokeWidth="1"
                  strokeLinecap="round"
                  animate={
                    reduceMotion ? { opacity: 0.4 } : { opacity: [0.05, 0.5, 0.05] }
                  }
                  transition={{ duration: 1.1, delay: 0.25, repeat: Infinity }}
                />
              </>
            )}
          </motion.g>

          {/* Tilted Blue Photovoltaic Solar Panel (Right of Mast) */}
          <g>
            <polygon
              points="80,16 122,22 118,40 78,34"
              fill="url(#sv3-solar)"
              stroke="#60a5fa"
              strokeWidth="1.1"
            />
            <line x1="92" y1="18" x2="89" y2="36" stroke="#38bdf8" strokeOpacity="0.35" strokeWidth="0.8" />
            <line x1="106" y1="20" x2="103" y2="38" stroke="#38bdf8" strokeOpacity="0.35" strokeWidth="0.8" />
            <line x1="79" y1="25" x2="120" y2="31" stroke="#94a3b8" strokeOpacity="0.4" strokeWidth="0.8" />
          </g>
        </g>

        {/* Three Outstretched Tripod Landing Legs & Honeycomb Footpads */}
        <g>
          {/* Left Landing Leg + Shock Strut + Crushable Footpad */}
          <line x1="56" y1="88" x2="22" y2="132" stroke="url(#sv3-hull)" strokeWidth="3.2" strokeLinecap="round" />
          <line x1="52" y1="104" x2="22" y2="132" stroke="#94a3b8" strokeWidth="2" />
          <line x1="58" y1="74" x2="36" y2="114" stroke="#cbd5e1" strokeWidth="1.6" />
          <ellipse cx="20" cy="134" rx="11" ry="4.2" fill="url(#sv3-hull)" stroke="#475569" strokeWidth="1.1" />

          {/* Right Landing Leg + Shock Strut + Crushable Footpad */}
          <line x1="104" y1="88" x2="138" y2="135" stroke="url(#sv3-hull)" strokeWidth="3.2" strokeLinecap="round" />
          <line x1="108" y1="104" x2="138" y2="135" stroke="#94a3b8" strokeWidth="2" />
          <line x1="102" y1="74" x2="124" y2="116" stroke="#cbd5e1" strokeWidth="1.6" />
          <ellipse cx="140" cy="137" rx="11" ry="4.2" fill="url(#sv3-hull)" stroke="#475569" strokeWidth="1.1" />

          {/* Center-Front Footpad */}
          <line x1="80" y1="112" x2="80" y2="136" stroke="#94a3b8" strokeWidth="2.8" />
          <ellipse cx="80" cy="139" rx="9.5" ry="3.8" fill="url(#sv3-hull)" stroke="#475569" strokeWidth="1.1" />
        </g>

        {/* Surveyor 3 Surface Sampler Soil Mechanics Scoop Arm (Right — waves!) */}
        <motion.g
          style={{ transformOrigin: "106px 88px" }}
          animate={
            reduceMotion
              ? { rotate: 0 }
              : {
                  rotate: [
                    -spec.wingWaveDeg * 0.55,
                    spec.wingWaveDeg * 0.55,
                    -spec.wingWaveDeg * 0.55,
                  ],
                }
          }
          transition={{
            duration: mood === "waving" ? 1.2 : 3.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Pantograph scissor linkage bars */}
          <polyline
            points="106,86 118,80 130,86 142,80"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1.6"
          />
          <polyline
            points="106,90 118,96 130,90 142,96"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.6"
          />
          {/* Blue-grey trenching scoop head */}
          <path
            d="M 140 78 L 152 76 L 150 92 L 140 90 Z"
            fill="#38bdf8"
            stroke="#e2e8f0"
            strokeWidth="1.1"
          />
        </motion.g>

        {/* Triangular Spaceframe Bus, Thermal Electronics Compartments & Helium Tank */}
        <g>
          {/* Left polished chrome thermal compartment */}
          <polygon
            points="44,68 66,64 66,106 42,102"
            fill="url(#sv3-chrome)"
            stroke="#cbd5e1"
            strokeWidth="1.1"
          />
          {/* Right spherical helium/vernier tank */}
          <circle
            cx="104"
            cy="88"
            r="13"
            fill="url(#sv3-hull)"
            stroke="#f8fafc"
            strokeWidth="1.1"
          />
          {/* Central spaceframe truss beams */}
          <polygon
            points="54,60 106,60 114,108 46,108"
            fill="url(#sv3-hull)"
            stroke="#fef3c7"
            strokeWidth="1.3"
          />
          {/* Structural diagonal spaceframe tubes */}
          <line x1="48" y1="106" x2="78" y2="62" stroke="#78716c" strokeOpacity="0.45" strokeWidth="1.4" />
          <line x1="112" y1="106" x2="78" y2="62" stroke="#78716c" strokeOpacity="0.45" strokeWidth="1.4" />
          <line x1="48" y1="84" x2="112" y2="84" stroke="#78716c" strokeOpacity="0.4" strokeWidth="1.2" />
        </g>

        {/* Surveyor 3 Television Survey Camera Tower & Expressive Optical Mirror Hood */}
        <g>
          {/* Upper angled mirror hood bezel */}
          <polygon
            points="63,46 97,46 102,58 58,58"
            fill="#1e293b"
            stroke="#e2e8f0"
            strokeWidth="1.3"
          />
          {/* Attitude / Brow LED Indicator */}
          <motion.rect
            x="67"
            y="50"
            width="26"
            height="2.5"
            rx="1"
            fill={accentHex}
            animate={{
              y: spec.browOffsetY * 0.55,
              rotate: spec.browTiltDeg * 0.55,
            }}
            style={{ transformOrigin: "80px 51px" }}
          />

          {/* Main TV Camera Optical Barrel (Center of Spaceframe) */}
          <circle
            cx="80"
            cy="84"
            r="22"
            fill="#0f172a"
            stroke="#e2e8f0"
            strokeWidth="2"
          />
          <circle
            cx="80"
            cy="84"
            r="18.5"
            fill="url(#sv3-lens)"
            stroke="#475569"
            strokeWidth="1"
          />

          {/* Voice / Telemetry Pulse Ring */}
          {isSpeaking && (
            <motion.circle
              cx="80"
              cy="84"
              r="16.5"
              fill="none"
              stroke={accentHex}
              strokeWidth="1.4"
              animate={
                reduceMotion
                  ? { opacity: 0.7 }
                  : { scale: [0.95, 1.06, 0.95], opacity: [0.3, 0.9, 0.3] }
              }
              transition={{ duration: 0.7, repeat: Infinity }}
              style={{ transformOrigin: "80px 84px" }}
            />
          )}

          {/* Expressive Optical Vidicon Sensor Core */}
          <motion.g
            animate={
              reduceMotion ? { scaleY: 1 } : { scaleY: [1, 1, 0.14, 1, 1] }
            }
            transition={{
              duration: 4.4,
              times: [0, 0.47, 0.5, 0.53, 1],
              repeat: Infinity,
            }}
            style={{ transformOrigin: "80px 84px" }}
          >
            <circle
              cx={mood === "scanning" ? 82.5 : 80}
              cy={mood === "scanning" ? 86 : 84}
              r={mood === "excited" ? 9.5 : 8}
              fill={accentHex}
              fillOpacity="0.24"
              stroke={accentHex}
              strokeWidth="1.8"
            />
            <circle
              cx={mood === "scanning" ? 82.5 : 80}
              cy={mood === "scanning" ? 86 : 84}
              r={mood === "excited" ? 4.5 : 3.8}
              fill={accentHex}
            />
            {/* Glass specular highlight */}
            <circle
              cx={mood === "scanning" ? 78 : 76}
              cy={mood === "scanning" ? 80 : 78.5}
              r="2.2"
              fill="#ffffff"
              fillOpacity="0.9"
            />
          </motion.g>
        </g>
      </motion.svg>
    </div>
  );
}
