import { motion } from "motion/react";
import { useAppStore } from "@/store/useAppStore";
import { LORO_MOODS } from "./moods";

interface LoRoProps {
  size?: "md" | "lg";
}

/**
 * Expressive SVG character rig inspired by NASA's Lunar Reconnaissance Orbiter (LRO):
 * - Gold Kapton MLI octagonal spacecraft bus
 * - Signature single-sided asymmetric blue/cyan solar panel wing
 * - Gimbaled high-gain S/Ka-band dish antenna on upper boom
 * - Oversized LROC Narrow Angle Camera barrel acting as an expressive eye
 */
export default function LoRo({ size = "md" }: LoRoProps) {
  const mood = useAppStore((s) => s.loroMood);
  const isSpeaking = useAppStore((s) => Boolean(s.dialogue?.isSpeaking));
  const speaker = useAppStore((s) => s.dialogue?.speaker ?? "loro");
  const reduceMotion = useAppStore((s) => s.settings.reduceMotion);

  const spec = LORO_MOODS[mood];
  const dim = size === "lg" ? "h-32 w-32 sm:h-36 sm:w-36" : "h-24 w-24 sm:h-28 sm:w-28";

  return (
    <div
      className={`relative select-none ${dim} shrink-0`}
      aria-label={`Lo-Ro orbital guide (${spec.label})`}
    >
      {/* Soft ambient thruster/halo glow */}
      <div
        className="pointer-events-none absolute inset-3 rounded-full blur-xl transition-colors duration-500"
        style={{ backgroundColor: `${spec.glowColor}24` }}
      />

      <motion.svg
        viewBox="0 0 140 140"
        className="relative h-full w-full drop-shadow-[0_8px_22px_rgba(0,0,0,0.75)]"
        animate={
          reduceMotion
            ? { y: 0, rotate: spec.bodyTiltDeg }
            : {
                y: mood === "excited" ? [0, -6, 0] : [0, -3.5, 0],
                rotate: spec.bodyTiltDeg,
              }
        }
        transition={
          reduceMotion
            ? { duration: 0.2 }
            : {
                y: {
                  duration: mood === "excited" ? 1.2 : 2.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                rotate: { duration: 0.45, ease: "easeOut" },
              }
        }
      >
        <defs>
          <linearGradient id="loro-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffe299" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#925f0e" />
          </linearGradient>
          <linearGradient id="loro-solar" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="55%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <radialGradient id="loro-lens" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="75%" stopColor="#090d16" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
        </defs>

        {/* High-Gain Dish Antenna & Telemetry Boom */}
        <motion.g
          style={{ transformOrigin: "64px 36px" }}
          animate={
            reduceMotion
              ? { rotate: 0 }
              : { rotate: mood === "scanning" ? [-10, 12, -10] : [-3, 4, -3] }
          }
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <line
            x1="64"
            y1="38"
            x2="54"
            y2="19"
            stroke="#cbd5e1"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M 38 22 Q 54 31 68 15"
            fill="none"
            stroke="#f8fafc"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle cx="53" cy="17" r="2.6" fill={spec.irisColor} />

          {/* Radio telemetry waves when speaking or scanning */}
          {(isSpeaking || mood === "scanning" || mood === "excited") && (
            <motion.path
              d="M 43 10 Q 53 3 63 9"
              fill="none"
              stroke={speaker === "equipment" ? "#ffcf70" : "#5ce1ff"}
              strokeWidth="1.8"
              strokeLinecap="round"
              animate={
                reduceMotion ? { opacity: 0.85 } : { opacity: [0.2, 0.95, 0.2], y: [0, -3, 0] }
              }
              transition={{ duration: 1.1, repeat: Infinity }}
            />
          )}
        </motion.g>

        {/* Asymmetric Left Solar Panel Wing (waves hello!) */}
        <motion.g
          style={{ transformOrigin: "38px 72px" }}
          animate={
            reduceMotion
              ? { rotate: 0 }
              : { rotate: [-spec.wingWaveDeg, spec.wingWaveDeg, -spec.wingWaveDeg] }
          }
          transition={{
            duration: mood === "waving" ? 0.95 : 2.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <line x1="40" y1="72" x2="30" y2="72" stroke="#94a3b8" strokeWidth="3.5" />
          <rect
            x="4"
            y="54"
            width="28"
            height="36"
            rx="4"
            fill="url(#loro-solar)"
            stroke="#5ce1ff"
            strokeWidth="1.4"
          />
          <line x1="13" y1="55" x2="13" y2="89" stroke="#5ce1ff" strokeOpacity="0.4" />
          <line x1="23" y1="55" x2="23" y2="89" stroke="#5ce1ff" strokeOpacity="0.4" />
          <line x1="5" y1="66" x2="31" y2="66" stroke="#5ce1ff" strokeOpacity="0.4" />
          <line x1="5" y1="78" x2="31" y2="78" stroke="#5ce1ff" strokeOpacity="0.4" />
        </motion.g>

        {/* Right LOLA Laser Altimeter / Star-Tracker Pod */}
        <g>
          <line x1="104" y1="72" x2="115" y2="72" stroke="#94a3b8" strokeWidth="3.5" />
          <rect
            x="114"
            y="61"
            width="16"
            height="22"
            rx="4"
            fill="#1e293b"
            stroke="#ffcf70"
            strokeWidth="1.4"
          />
          <circle
            cx="122"
            cy="72"
            r="3.5"
            fill={mood === "scanning" ? "#7ee787" : "#5ce1ff"}
          />
        </g>

        {/* Octagonal Gold Kapton MLI Spacecraft Bus */}
        <polygon
          points="52,38 92,38 106,52 106,92 92,106 52,106 38,92 38,52"
          fill="url(#loro-gold)"
          stroke="#fef08a"
          strokeWidth="1.6"
        />
        {/* Foil crinkle facet lines */}
        <polyline
          points="42,54 56,46 88,46 102,54"
          fill="none"
          stroke="#fef9c3"
          strokeOpacity="0.35"
          strokeWidth="1.2"
        />

        {/* LROC Camera Barrel (Expressive Visor / Eye) */}
        <circle
          cx="72"
          cy="73"
          r="24"
          fill="url(#loro-lens)"
          stroke="#cbd5e1"
          strokeWidth="2.8"
        />

        {/* Speaking Voice Pulse Ring */}
        {isSpeaking && (
          <motion.circle
            cx="72"
            cy="73"
            r="20"
            fill="none"
            stroke={speaker === "equipment" ? "#ffcf70" : "#5ce1ff"}
            strokeWidth="1.8"
            animate={
              reduceMotion
                ? { opacity: 0.7 }
                : { scale: [0.94, 1.08, 0.94], opacity: [0.35, 0.95, 0.35] }
            }
            transition={{ duration: 0.65, repeat: Infinity }}
            style={{ transformOrigin: "72px 73px" }}
          />
        )}

        {/* Glowing Camera Iris */}
        {mood === "waving" ? (
          /* Happy curved arc eye when waving! */
          <path
            d="M 61 74 Q 72 62 83 74"
            fill="none"
            stroke={spec.irisColor}
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        ) : (
          <motion.g
            animate={
              reduceMotion
                ? { scaleY: 1 }
                : { scaleY: [1, 1, 0.12, 1, 1] }
            }
            transition={{
              duration: 4.2,
              times: [0, 0.46, 0.49, 0.52, 1],
              repeat: Infinity,
            }}
            style={{ transformOrigin: "72px 73px" }}
          >
            <circle
              cx={mood === "scanning" ? 75 : 72}
              cy={mood === "scanning" ? 76 : 73}
              r={mood === "excited" ? 11.5 : 9.5}
              fill={spec.irisColor}
              fillOpacity="0.92"
            />
            <circle
              cx={mood === "scanning" ? 78 : 75}
              cy={mood === "scanning" ? 72 : 69}
              r="3.2"
              fill="#ffffff"
            />
          </motion.g>
        )}

        {/* Expressive LED Brow Bar */}
        <motion.rect
          x="57"
          y="46"
          width="30"
          height="3.8"
          rx="2"
          fill={spec.irisColor}
          animate={{
            y: spec.browOffsetY,
            rotate: spec.browTiltDeg,
          }}
          style={{ transformOrigin: "72px 48px" }}
        />

        {/* Downward orbital scan beam when scanning */}
        {mood === "scanning" && (
          <polygon
            points="60,106 84,106 98,136 46,136"
            fill="#5ce1ff"
            fillOpacity="0.18"
          />
        )}
      </motion.svg>
    </div>
  );
}
