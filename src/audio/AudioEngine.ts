/**
 * Clean, subtle Web Audio engine:
 * - Zero continuous background hum/drone (silent when idle)
 * - Ultra-soft, warm tactile UI tap (no harsh high-pitched beeps)
 * - Soft, warm telemetry chime for equipment transmissions
 */
class LunarAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private muted = false;
  private activeVoiceElements = new Set<HTMLAudioElement>();

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

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.06;
      this.sfxGain.connect(this.masterGain);
    }

    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  registerVoiceAudio(el: HTMLAudioElement): () => void {
    el.muted = this.muted;
    this.activeVoiceElements.add(el);
    return () => {
      this.activeVoiceElements.delete(el);
    };
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    for (const el of this.activeVoiceElements) {
      el.muted = muted;
    }
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, now, 0.03);
  }

  setVoiceActive(_speaking: boolean): void {
    // Kept as no-op hook for compatibility; no continuous background drone is used.
  }

  /**
   * Gentle, warm 55ms telemetry cue before/after equipment memory playback
   * (Replaces the harsh 2525 Hz sine beep with a soft, warm 520/440 Hz tone)
   */
  playQuindar(kind: "intro" | "outro"): void {
    if (this.muted || !this.ctx || !this.sfxGain) return;
    if (this.ctx.state !== "running") return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(kind === "intro" ? 520 : 440, now);

    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.08, now + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

    osc.connect(env);
    env.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * Barely-audible, warm 14ms low-frequency tactile tap for UI buttons
   */
  playUiTick(_freq = 320): void {
    if (this.muted || !this.ctx || !this.sfxGain) return;
    if (this.ctx.state !== "running") return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.015);

    env.gain.setValueAtTime(0.04, now);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.016);

    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.018);
  }
}

export const audioEngine = new LunarAudioEngine();
