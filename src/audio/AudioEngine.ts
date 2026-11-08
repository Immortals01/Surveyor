/**
 * Native Web Audio API synthesizer & mixer for:
 * - Apollo Quindar telemetry tones (2525 Hz intro / 2475 Hz outro)
 * - Subtle HUD UI hover/click ticks
 * - Optional low-volume space drone pad that ducks during narration
 * - Moonquake low-frequency rumble sonification (x40 time-compressed feel)
 */
class LunarAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private droneStarted = false;
  private muted = false;

  unlock(initialMuted = false): void {
    this.muted = initialMuted;
    if (typeof window === "undefined") return;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 1;
      this.masterGain.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = 0.045;
      this.ambientGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.16;
      this.sfxGain.connect(this.masterGain);
    }

    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }

    this.startAmbientPad();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, now, 0.04);
  }

  setVoiceActive(speaking: boolean): void {
    if (!this.ctx || !this.ambientGain) return;
    const now = this.ctx.currentTime;
    this.ambientGain.gain.setTargetAtTime(speaking ? 0.016 : 0.045, now, 0.12);
  }

  /**
   * Authentic NASA Mission Control Quindar beep:
   * - intro = 2525 Hz for 250 ms
   * - outro = 2475 Hz for 250 ms
   */
  playQuindar(kind: "intro" | "outro"): void {
    if (this.muted || !this.ctx || !this.sfxGain) return;
    if (this.ctx.state !== "running") return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(kind === "intro" ? 2525 : 2475, now);

    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.22, now + 0.012);
    env.gain.setValueAtTime(0.22, now + 0.225);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.255);

    osc.connect(env);
    env.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  playUiTick(freq = 880): void {
    if (this.muted || !this.ctx || !this.sfxGain) return;
    if (this.ctx.state !== "running") return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);

    env.gain.setValueAtTime(0.08, now);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  playLaserPulse(): void {
    if (this.muted || !this.ctx || !this.sfxGain) return;
    if (this.ctx.state !== "running") return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1480, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.18);

    env.gain.setValueAtTime(0.28, now);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.21);
  }

  playMoonquakeRumble(durationSec = 2.6): void {
    if (this.muted || !this.ctx || !this.sfxGain) return;
    if (this.ctx.state !== "running") return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(78, now);
    osc.frequency.exponentialRampToValueAtTime(46, now + durationSec);

    sub.type = "sine";
    sub.frequency.setValueAtTime(119, now);

    env.gain.setValueAtTime(0.001, now);
    env.gain.linearRampToValueAtTime(0.32, now + 0.15);
    env.gain.exponentialRampToValueAtTime(0.0008, now + durationSec);

    osc.connect(env);
    sub.connect(env);
    env.connect(this.sfxGain);

    osc.start(now);
    sub.start(now);
    osc.stop(now + durationSec + 0.05);
    sub.stop(now + durationSec + 0.05);
  }

  private startAmbientPad(): void {
    if (this.droneStarted || !this.ctx || !this.ambientGain) return;
    this.droneStarted = true;

    // Gentle detuned fifth (D2 + A2) lowpass-filtered space pad
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 240;
    filter.connect(this.ambientGain);

    for (const freq of [73.42, 110.0, 146.83]) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      g.gain.value = 0.28;
      osc.connect(g);
      g.connect(filter);
      osc.start();
    }
  }
}

export const audioEngine = new LunarAudioEngine();
