import { useEffect, useRef, useState } from "react";
import { Camera, Play, RotateCcw } from "lucide-react";
import { audioEngine } from "@/audio/AudioEngine";
import { useAppStore } from "@/store/useAppStore";

const IDEAL_LEAD_SEC = -1.3; // T - 1.3s radio signal travel time from Houston

export default function RoverLiftoffCam() {
  const openSources = useAppStore((s) => s.openSources);

  const [phase, setPhase] = useState<"idle" | "countdown" | "liftoff" | "done">("idle");
  const [missionTimeSec, setMissionTimeSec] = useState(-5.0);
  const [pressedAtSec, setPressedAtSec] = useState<number | null>(null);

  const rafRef = useRef<number | null>(null);
  const pressedRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const startCountdown = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    audioEngine.playUiTick(880);
    pressedRef.current = null;
    setPressedAtSec(null);
    setMissionTimeSec(-5.0);
    setPhase("countdown");

    const startWall = performance.now();

    const step = (now: number) => {
      const elapsedSec = (now - startWall) / 1000;
      const t = -5.0 + elapsedSec;
      setMissionTimeSec(t);

      if (t >= 0 && t < 3.2) {
        setPhase("liftoff");
      }

      if (t < 3.2) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setPhase("done");
        audioEngine.playUiTick(1160);
      }
    };

    rafRef.current = requestAnimationFrame(step);
  };

  const handleTiltPress = () => {
    if (phase !== "countdown" && phase !== "liftoff") return;
    if (pressedRef.current !== null) return;
    pressedRef.current = missionTimeSec;
    setPressedAtSec(missionTimeSec);
    audioEngine.playUiTick(1420);
  };

  // Compute how well the camera tracks Challenger's ascent (0s .. 3s)
  // Camera actually begins tilting 1.3s AFTER the user presses the button in Houston!
  const cameraTiltStartSec =
    pressedAtSec !== null ? pressedAtSec + 1.3 : 999;

  // Ascent stage vertical height (0 at T<=0, climbs rapidly for T>0)
  const ascentHeight =
    missionTimeSec <= 0 ? 0 : Math.min(110, missionTimeSec * 42);

  // Camera viewport vertical pan (tracks upward after cameraTiltStartSec)
  const cameraPan =
    missionTimeSec <= cameraTiltStartSec
      ? 0
      : Math.min(95, (missionTimeSec - cameraTiltStartSec) * 40);

  // Relative Y of Challenger inside the rover TV frame (lower is higher in SVG)
  const challengerScreenY = 74 - (ascentHeight - cameraPan);
  const descentScreenY = 78 + cameraPan * 0.85;

  // Score calculation
  const timingError =
    pressedAtSec !== null ? Math.abs(pressedAtSec - IDEAL_LEAD_SEC) : null;

  let verdict = "";
  if (pressedAtSec === null && phase === "done") {
    verdict = "SIGNAL MISSED // Challenger rocketed out of the top of the TV frame before command transmission.";
  } else if (pressedAtSec !== null && timingError !== null) {
    if (timingError <= 0.35) {
      verdict = `BULLSEYE (T ${pressedAtSec.toFixed(2)}s) // Just like Ed Fendell in Houston, you compensated for the 1.3s speed-of-light delay.`;
    } else if (timingError <= 0.85) {
      verdict = `ON TARGET (T ${pressedAtSec.toFixed(2)}s) // You captured most of Challenger's climb into lunar orbit.`;
    } else if (pressedAtSec < IDEAL_LEAD_SEC) {
      verdict = `EARLY TRANSMISSION (T ${pressedAtSec.toFixed(2)}s) // The camera tilted up at empty black sky prior to ascent ignition.`;
    } else {
      verdict = `LATE TRANSMISSION (T ${pressedAtSec.toFixed(2)}s) // By the time your S-band signal reached the Moon, Challenger was already high above.`;
    }
  }

  return (
    <div className="space-y-4 border border-white/15 bg-space-950/90 p-4">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <span className="font-mono text-[9.5px] font-bold tracking-[0.16em] text-sunlit uppercase">
            INSTRUMENT 03 // APOLLO 17 LRV-3 · DEC 14, 1972
          </span>
          <h3 className="mt-1 font-display text-base font-bold tracking-tight text-regolith-bright">
            Beat the 1.3-Second Radio Delay
          </h3>
        </div>
        <button
          type="button"
          onClick={() => openSources("S-NSSDCA-1972-096C")}
          className="shrink-0 cursor-pointer border border-white/15 bg-white/[0.04] px-2 py-0.5 font-mono text-[9.5px] tracking-wider text-loro uppercase transition hover:border-loro hover:text-white"
        >
          REF
        </button>
      </div>

      <p className="text-xs leading-relaxed text-regolith/85">
        To film Apollo 17&apos;s liftoff using the parked rover&apos;s TV camera,
        Mission Control&apos;s Ed Fendell had to press <strong>TILT UP</strong>{" "}
        at <span className="font-mono text-sunlit">T − 1.3s</span>—because radio
        commands take 1.3 seconds to cross 384,400 km of space.
      </p>

      {/* Vintage 4:3 RCA TV Monitor View */}
      <div className="telemetry-scanlines relative overflow-hidden border border-white/20 bg-space-900 p-3">
        <div className="mb-1.5 flex items-center justify-between font-mono text-[9.5px] tracking-wider uppercase">
          <span className="text-sunlit">LRV-3 GCTA COLOR TV · TAURUS-LITTROW</span>
          <span
            className={`font-bold ${
              Math.abs(missionTimeSec - IDEAL_LEAD_SEC) < 0.35 && phase === "countdown"
                ? "animate-pulse text-sunlit"
                : "text-loro"
            }`}
          >
            MET T {missionTimeSec >= 0 ? `+${missionTimeSec.toFixed(1)}` : missionTimeSec.toFixed(1)} s
          </span>
        </div>

        <svg
          viewBox="0 0 320 120"
          className="h-32 w-full overflow-hidden border border-white/10 bg-[#05070e]"
          role="img"
          aria-label="Simulated rover television view of Apollo 17 Challenger liftoff"
        >
          {/* Taurus-Littrow Massif Mountains in background */}
          <polygon
            points={`0,${94 + cameraPan * 0.4} 65,${58 + cameraPan * 0.4} 145,${86 + cameraPan * 0.4} 235,${52 + cameraPan * 0.4} 320,${88 + cameraPan * 0.4} 320,140 0,140`}
            fill="#1e293b"
          />
          {/* Lunar Regolith Horizon */}
          <rect
            x="0"
            y={86 + cameraPan * 0.85}
            width="320"
            height="80"
            fill="#475569"
          />

          {/* Gold Descent Stage (stays on the Moon forever!) */}
          <g transform={`translate(160, ${descentScreenY})`}>
            <line x1="-18" y1="0" x2="-26" y2="10" stroke="#eab308" strokeWidth="2" />
            <line x1="18" y1="0" x2="26" y2="10" stroke="#eab308" strokeWidth="2" />
            <rect
              x="-18"
              y="-8"
              width="36"
              height="10"
              rx="1"
              fill="#eab308"
              stroke="#fef08a"
              strokeWidth="1"
            />
          </g>

          {/* Kapton Foil Confetti & Plume Burst at T >= 0 */}
          {missionTimeSec >= 0 && (
            <g transform={`translate(160, ${descentScreenY - 8})`}>
              <circle
                cx={-18 - missionTimeSec * 22}
                cy={-missionTimeSec * 8}
                r="2"
                fill="#ffcf70"
              />
              <circle
                cx={20 + missionTimeSec * 25}
                cy={-missionTimeSec * 10}
                r="2"
                fill="#ffcf70"
              />
              <circle
                cx={-10 - missionTimeSec * 15}
                cy={-missionTimeSec * 16}
                r="1.5"
                fill="#5ce1ff"
              />
            </g>
          )}

          {/* Challenger Ascent Stage (rockets into orbit at T = 0.0s!) */}
          <g transform={`translate(160, ${challengerScreenY})`}>
            {missionTimeSec >= 0 && (
              <polygon
                points="-6,4 6,4 0,20"
                fill="#ff9f5c"
                opacity="0.9"
              />
            )}
            <polygon
              points="-14,4 -18,-8 -9,-16 9,-16 18,-8 14,4"
              fill="#e2e8f0"
              stroke="#94a3b8"
              strokeWidth="1.2"
            />
            {/* Triangular LM cabin windows */}
            <polygon points="-9,-6 -3,-10 -3,-4" fill="#0f172a" />
            <polygon points="9,-6 3,-10 3,-4" fill="#0f172a" />
          </g>

          {/* TV Crosshair Reticle */}
          <line x1="152" y1="60" x2="168" y2="60" stroke="#ffffff" strokeOpacity="0.25" />
          <line x1="160" y1="52" x2="160" y2="68" stroke="#ffffff" strokeOpacity="0.25" />
        </svg>

        {/* Controls */}
        <div className="mt-2.5 flex items-center gap-2">
          {phase === "idle" || phase === "done" ? (
            <button
              type="button"
              onClick={startCountdown}
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 border border-regolith-bright bg-regolith-bright px-4 py-2.5 font-mono text-[11px] font-bold tracking-wider text-space-950 uppercase transition hover:bg-white"
            >
              {phase === "done" ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Replay Liftoff Sequence</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Initiate T − 5.0s Countdown</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleTiltPress}
              disabled={pressedAtSec !== null}
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 border border-loro bg-loro px-4 py-2.5 font-mono text-[11px] font-bold tracking-wider text-space-950 uppercase transition hover:bg-white disabled:opacity-55"
            >
              <Camera className="h-3.5 w-3.5" />
              <span>
                {pressedAtSec !== null
                  ? `Command Transmitted T ${pressedAtSec.toFixed(2)}s (+1.3s Delay)`
                  : "TRANSMIT 'TILT UP' (TARGET T − 1.3s)"}
              </span>
            </button>
          )}
        </div>
      </div>

      {verdict && (
        <div className="border border-white/15 border-l-2 border-l-loro bg-space-900/75 p-3 font-mono text-[11px] leading-relaxed text-regolith-bright">
          {verdict}
        </div>
      )}
    </div>
  );
}
