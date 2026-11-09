import { useEffect, useRef, useState } from "react";
import { Camera, Play, RotateCcw, Tv } from "lucide-react";
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
    verdict = "Missed button! Challenger rocketed right out of the top of the TV frame!";
  } else if (pressedAtSec !== null && timingError !== null) {
    if (timingError <= 0.35) {
      verdict = `🎯 Bullseye (T ${pressedAtSec.toFixed(2)}s)! Just like Ed Fendell in Houston, you nailed the 1.3s speed-of-light delay!`;
    } else if (timingError <= 0.85) {
      verdict = `👍 Close (T ${pressedAtSec.toFixed(2)}s)! You caught most of Challenger's climb into orbit!`;
    } else if (pressedAtSec < IDEAL_LEAD_SEC) {
      verdict = `⏩ Too early (T ${pressedAtSec.toFixed(2)}s)! The camera tilted up at empty black sky before ignition!`;
    } else {
      verdict = `⏪ Too late (T ${pressedAtSec.toFixed(2)}s)! By the time your radio wave reached the Moon, Challenger was already high above!`;
    }
  }

  return (
    <div className="space-y-3.5 rounded-2xl border border-loro/35 bg-space-950/90 p-4 shadow-xl">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-semibold tracking-wider text-orange-300 uppercase">
            <Tv className="h-3 w-3" />
            Apollo 17 LRV-3 · Dec 14, 1972
          </span>
          <h3 className="mt-0.5 font-display text-base font-bold text-regolith-bright">
            Beat the 1.3-Second Radio Delay!
          </h3>
        </div>
        <button
          type="button"
          onClick={() => openSources("S-NSSDCA-1972-096C")}
          className="cursor-pointer rounded border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-loro hover:border-loro"
        >
          Cite
        </button>
      </div>

      <p className="text-xs leading-relaxed text-regolith/85">
        To film Apollo 17&apos;s liftoff using the parked rover&apos;s TV camera,
        Mission Control&apos;s Ed Fendell had to press <strong>TILT UP</strong>{" "}
        at <span className="font-mono text-sunlit">T − 1.3s</span>—because radio
        commands take 1.3 seconds to cross 384,400 km of space!
      </p>

      {/* Vintage 4:3 RCA TV Monitor View */}
      <div className="telemetry-scanlines relative overflow-hidden rounded-xl border-2 border-regolith/25 bg-space-900 p-2.5">
        <div className="mb-1 flex items-center justify-between font-mono text-[10px]">
          <span className="text-sunlit">LRV-3 RCA COLOR TV · TAURUS-LITTROW</span>
          <span
            className={`font-bold ${
              Math.abs(missionTimeSec - IDEAL_LEAD_SEC) < 0.35 && phase === "countdown"
                ? "animate-pulse text-emerald-300"
                : "text-loro"
            }`}
          >
            T {missionTimeSec >= 0 ? `+${missionTimeSec.toFixed(1)}` : missionTimeSec.toFixed(1)} s
          </span>
        </div>

        <svg
          viewBox="0 0 320 120"
          className="h-32 w-full overflow-hidden rounded-lg bg-[#05070e]"
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
              rx="2"
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
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-sunlit px-4 py-2.5 font-display text-xs font-bold text-space-950 transition hover:brightness-110"
            >
              {phase === "done" ? (
                <>
                  <RotateCcw className="h-4 w-4" />
                  <span>Try Liftoff Again</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Start T − 5.0s Countdown</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleTiltPress}
              disabled={pressedAtSec !== null}
              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-loro px-4 py-2.5 font-display text-xs font-bold text-space-950 shadow-[0_0_24px_rgba(92,225,255,0.4)] transition hover:bg-white disabled:opacity-55"
            >
              <Camera className="h-4 w-4" />
              <span>
                {pressedAtSec !== null
                  ? `Signal Sent at T ${pressedAtSec.toFixed(2)}s (Arrives +1.3s)`
                  : "SEND 'TILT UP' COMMAND (Aim for T − 1.3s!)"}
              </span>
            </button>
          )}
        </div>
      </div>

      {verdict && (
        <div className="rounded-xl border border-loro/35 bg-space-900/85 p-3 text-xs leading-relaxed text-regolith-bright">
          {verdict}
        </div>
      )}
    </div>
  );
}
