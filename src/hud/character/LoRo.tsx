import { motion } from "motion/react";
import { useAppStore } from "@/store/useAppStore";
import { LORO_MOODS } from "./moods";

interface LoRoProps {
  size?: "sm" | "md" | "lg";
}

/**
 * High-detail technical illustration of NASA's Lunar Reconnaissance Orbiter (LRO / "Lo-Ro"):
 * - Multi-faceted Kapton MLI spacecraft bus with structural truss seams
 * - Articulated 3-segment photovoltaic solar wing with silver busbars
 * - High-gain parabolic dish on upper gimbal boom + LOLA laser altimeter pod
 * - Multi-element LROC Narrow Angle Camera (NAC) optical barrel with aperture iris & specular lens reflections
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
      aria-label={`LRO Orbital Guide (${spec.label})`}
    >
      <motion.svg
        viewBox="0 0 160 160"
        className="relative h-full w-full"
        animate={
          reduceMotion
            ? { y: 0, rotate: spec.bodyTiltDeg * 0.5 }
            : {
                y: mood === "excited" ? [0, -3.5, 0] : [0, -2, 0],
                rotate: spec.bodyTiltDeg * 0.5,
              }
        }
        transition={
          reduceMotion
            ? { duration: 0.2 }
            : {
                y: {
                  duration: mood === "excited" ? 1.6 : 3.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                rotate: { duration: 0.5, ease: "easeOut" },
              }
        }
      >
        <defs>
          <linearGradient id="lro-kapton-main" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f6d379" />
            <stop offset="45%" stopColor="#c9932c" />
            <stop offset="100%" stopColor="#6e4b0f" />
          </linearGradient>
          <linearGradient id="lro-kapton-shadow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a8761e" />
            <stop offset="100%" stopColor="#462f08" />
          </linearGradient>
          <linearGradient id="lro-solar-cell" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="50%" stopColor="#0f2342" />
            <stop offset="100%" stopColor="#081326" />
          </linearGradient>
          <radialGradient id="lro-optics-glass" cx="42%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#1a273b" />
            <stop offset="65%" stopColor="#090e18" />
            <stop offset="100%" stopColor="#030509" />
          </radialGradient>
        </defs>

        {/* Subtle technical corner reticle ticks */}
        <g stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1" fill="none">
          <path d="M 10 22 L 10 10 L 22 10" />
          <path d="M 138 10 L 150 10 L 150 22" />
          <path d="M 10 138 L 10 150 L 22 150" />
          <path d="M 138 150 L 150 150 L 150 138" />
        </g>

        {/* Upper Gimbaled High-Gain Parabolic Dish Antenna */}
        <motion.g
          style={{ transformOrigin: "78px 44px" }}
          animate={
            reduceMotion
              ? { rotate: 0 }
              : { rotate: mood === "scanning" ? [-6, 8, -6] : [-2, 2.5, -2] }
          }
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Antenna boom mast */}
          <line x1="78" y1="46" x2="66" y2="23" stroke="#94a3b8" strokeWidth="2.2" />
          <line x1="72" y1="46" x2="66" y2="28" stroke="#64748b" strokeWidth="1.2" />
          {/* Parabolic dish shell */}
          <path
            d="M 46 26 C 56 36, 76 32, 84 16"
            fill="rgba(226,232,240,0.12)"
            stroke="#e2e8f0"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Sub-reflector feed tripod */}
          <line x1="54" y1="25" x2="64" y2="15" stroke="#94a3b8" strokeWidth="1" />
          <line x1="76" y1="21" x2="64" y2="15" stroke="#94a3b8" strokeWidth="1" />
          <circle cx="64" cy="15" r="2.2" fill={accentHex} />

          {/* Subtle S-band telemetry wave arcs when active */}
          {(isSpeaking || mood === "scanning") && (
            <>
              <motion.path
                d="M 55 10 Q 64 4 73 10"
                fill="none"
                stroke={accentHex}
                strokeWidth="1.2"
                strokeLinecap="round"
                animate={
                  reduceMotion
                    ? { opacity: 0.65 }
                    : { opacity: [0.15, 0.8, 0.15] }
                }
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <motion.path
                d="M 50 5 Q 64 -2 78 5"
                fill="none"
                stroke={accentHex}
                strokeWidth="1"
                strokeLinecap="round"
                animate={
                  reduceMotion
                    ? { opacity: 0.35 }
                    : { opacity: [0.05, 0.45, 0.05] }
                }
                transition={{ duration: 1.2, delay: 0.25, repeat: Infinity }}
              />
            </>
          )}
        </motion.g>

        {/* Asymmetric Articulated 3-Panel Solar Array Wing (Left) */}
        <motion.g
          style={{ transformOrigin: "48px 82px" }}
          animate={
            reduceMotion
              ? { rotate: 0 }
              : {
                  rotate: [
                    -spec.wingWaveDeg * 0.45,
                    spec.wingWaveDeg * 0.45,
                    -spec.wingWaveDeg * 0.45,
                  ],
                }
          }
          transition={{
            duration: mood === "waving" ? 1.4 : 3.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Deployment yoke truss */}
          <line x1="50" y1="78" x2="38" y2="75" stroke="#94a3b8" strokeWidth="1.8" />
          <line x1="50" y1="86" x2="38" y2="89" stroke="#94a3b8" strokeWidth="1.8" />
          {/* Solar wing panel frame */}
          <rect
            x="6"
            y="58"
            width="34"
            height="48"
            rx="1.5"
            fill="url(#lro-solar-cell)"
            stroke="#64748b"
            strokeWidth="1.2"
          />
          {/* Photovoltaic cell grid & silver interconnect busbars */}
          <line x1="17" y1="59" x2="17" y2="105" stroke="#38bdf8" strokeOpacity="0.28" strokeWidth="0.9" />
          <line x1="29" y1="59" x2="29" y2="105" stroke="#38bdf8" strokeOpacity="0.28" strokeWidth="0.9" />
          <line x1="7" y1="70" x2="39" y2="70" stroke="#94a3b8" strokeOpacity="0.35" strokeWidth="0.8" />
          <line x1="7" y1="82" x2="39" y2="82" stroke="#94a3b8" strokeOpacity="0.45" strokeWidth="1" />
          <line x1="7" y1="94" x2="39" y2="94" stroke="#94a3b8" strokeOpacity="0.35" strokeWidth="0.8" />
        </motion.g>

        {/* Right Instrument Boom: LOLA 5-Beam Laser Altimeter & Diviner Radiometer */}
        <g>
          <line x1="114" y1="78" x2="126" y2="78" stroke="#94a3b8" strokeWidth="2" />
          <line x1="114" y1="86" x2="126" y2="86" stroke="#64748b" strokeWidth="1.5" />
          <rect
            x="125"
            y="66"
            width="20"
            height="32"
            rx="2"
            fill="#111827"
            stroke="#94a3b8"
            strokeWidth="1.2"
          />
          <rect x="128" y="70" width="14" height="8" rx="1" fill="#1e293b" />
          {/* LOLA Laser Transceiver Status Optic */}
          <circle
            cx="135"
            cy="88"
            r="3.2"
            fill={mood === "scanning" ? "#7ee787" : accentHex}
          />
          <circle cx="135" cy="88" r="5.5" fill="none" stroke={accentHex} strokeOpacity="0.35" strokeWidth="0.8" />
        </g>

        {/* Spacecraft Main Octagonal Chassis (Multi-Layer Insulation Gold Kapton) */}
        <g>
          {/* Lower shadow bevel */}
          <polygon
            points="60,46 104,46 118,60 118,104 104,118 60,118 46,104 46,60"
            fill="url(#lro-kapton-shadow)"
            stroke="#eab308"
            strokeOpacity="0.55"
            strokeWidth="1.2"
          />
          {/* Upper sunlit Kapton facet */}
          <polygon
            points="62,48 102,48 114,60 114,98 102,110 62,110 50,98 50,60"
            fill="url(#lro-kapton-main)"
          />
          {/* MLI thermal blanket seam lines */}
          <line x1="50" y1="60" x2="62" y2="48" stroke="#fef08a" strokeOpacity="0.4" strokeWidth="1" />
          <line x1="62" y1="48" x2="62" y2="110" stroke="#422006" strokeOpacity="0.35" strokeWidth="0.9" />
          <line x1="102" y1="48" x2="102" y2="110" stroke="#422006" strokeOpacity="0.35" strokeWidth="0.9" />
          <line x1="50" y1="64" x2="114" y2="64" stroke="#fef08a" strokeOpacity="0.25" strokeWidth="0.9" />
          <line x1="50" y1="98" x2="114" y2="98" stroke="#422006" strokeOpacity="0.35" strokeWidth="0.9" />
        </g>

        {/* LROC Narrow Angle Camera (NAC) Precision Optical Barrel */}
        <g>
          {/* Outer machined titanium lens bezel */}
          <circle
            cx="82"
            cy="81"
            r="25.5"
            fill="#0f172a"
            stroke="#cbd5e1"
            strokeWidth="2"
          />
          {/* Concentric optical baffle rings */}
          <circle
            cx="82"
            cy="81"
            r="22"
            fill="url(#lro-optics-glass)"
            stroke="#475569"
            strokeWidth="1"
          />
          <circle
            cx="82"
            cy="81"
            r="17.5"
            fill="none"
            stroke="#334155"
            strokeWidth="0.9"
            strokeDasharray="4 2"
          />

          {/* Active voice/telemetry ring modulation */}
          {isSpeaking && (
            <motion.circle
              cx="82"
              cy="81"
              r="19.5"
              fill="none"
              stroke={accentHex}
              strokeWidth="1.4"
              animate={
                reduceMotion
                  ? { opacity: 0.7 }
                  : { scale: [0.96, 1.05, 0.96], opacity: [0.3, 0.9, 0.3] }
              }
              transition={{ duration: 0.7, repeat: Infinity }}
              style={{ transformOrigin: "82px 81px" }}
            />
          )}

          {/* Expressive Optical Sensor Core (Iris) */}
          <motion.g
            animate={
              reduceMotion
                ? { scaleY: 1 }
                : { scaleY: [1, 1, 0.14, 1, 1] }
            }
            transition={{
              duration: 4.6,
              times: [0, 0.47, 0.5, 0.53, 1],
              repeat: Infinity,
            }}
            style={{ transformOrigin: "82px 81px" }}
          >
            {/* Outer illuminated sensor ring */}
            <circle
              cx={mood === "scanning" ? 84.5 : 82}
              cy={mood === "scanning" ? 83.5 : 81}
              r={mood === "excited" ? 10.5 : 9}
              fill={accentHex}
              fillOpacity="0.22"
              stroke={accentHex}
              strokeWidth="1.8"
            />
            {/* Inner precision pupil core */}
            <circle
              cx={mood === "scanning" ? 84.5 : 82}
              cy={mood === "scanning" ? 83.5 : 81}
              r={mood === "excited" ? 5 : 4}
              fill={accentHex}
            />
            {/* Optical glass specular reflection */}
            <circle
              cx={mood === "scanning" ? 79.5 : 77.5}
              cy={mood === "scanning" ? 77.5 : 75.5}
              r="2.4"
              fill="#ffffff"
              fillOpacity="0.9"
            />
            <circle
              cx={mood === "scanning" ? 87 : 85.5}
              cy={mood === "scanning" ? 86 : 84.5}
              r="1.1"
              fill="#ffffff"
              fillOpacity="0.55"
            />
          </motion.g>
        </g>

        {/* Upper Telemetry Visor / Attitude Indicator Bar */}
        <motion.rect
          x="67"
          y="51"
          width="30"
          height="2.5"
          rx="1"
          fill={accentHex}
          animate={{
            y: spec.browOffsetY * 0.6,
            rotate: spec.browTiltDeg * 0.6,
          }}
          style={{ transformOrigin: "82px 52px" }}
        />

        {/* Lower nadir scan cone when scanning */}
        {mood === "scanning" && (
          <polygon
            points="68,118 96,118 108,148 56,148"
            fill="#5ce1ff"
            fillOpacity="0.12"
          />
        )}
      </motion.svg>
    </div>
  );
}
