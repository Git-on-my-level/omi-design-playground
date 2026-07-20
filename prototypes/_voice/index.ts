/**
 * Voice input detection. No UI, no opinions — a level signal and speech
 * boundaries, which each prototype renders in its own visual language.
 *
 * It uses the real microphone when it can get one, and falls back to a
 * synthesised level when it cannot. The fallback is not a convenience: headless
 * Chrome has no microphone, and a demo that dies on a denied permission prompt
 * is not presentable. Callers should not care which mode they are in, and the
 * shape of the signal is the same either way.
 */

export interface VoiceLevel {
  /** Smoothed loudness, 0–1. Drives meters, glows, waveform bars. */
  level: number;
  /** True while the level has been over the speech threshold recently. */
  speaking: boolean;
}

export interface VoiceInputOptions {
  /** Called on every animation frame while listening. */
  onLevel?(state: VoiceLevel): void;
  onSpeechStart?(): void;
  onSpeechEnd?(): void;
  /** Level above which we call it speech. Default 0.06. */
  threshold?: number;
  /** Silence held this long ends the utterance. Default 700ms. */
  hangoverMs?: number;
  /** Force the synthesised signal even when a microphone is available. */
  simulate?: boolean;
}

export interface VoiceInput {
  /** Begin listening. Resolves once the source is live. */
  start(): Promise<void>;
  stop(): void;
  /** True when the level is coming from a real microphone. */
  readonly live: boolean;
  readonly listening: boolean;
  destroy(): void;
}

type Source =
  | { kind: 'mic'; stream: MediaStream; context: AudioContext; analyser: AnalyserNode; buffer: Float32Array<ArrayBuffer> }
  | { kind: 'simulated'; startedAt: number };

export function createVoiceInput(options: VoiceInputOptions = {}): VoiceInput {
  const threshold = options.threshold ?? 0.06;
  const hangoverMs = options.hangoverMs ?? 700;

  let source: Source | undefined;
  let frame: number | undefined;
  let smoothed = 0;
  let speaking = false;
  let lastLoudAt = 0;
  let lastFrameAt = 0;
  let destroyed = false;

  async function acquire(): Promise<Source> {
    if (options.simulate || !navigator.mediaDevices?.getUserMedia) {
      return { kind: 'simulated', startedAt: performance.now() };
    }
    try {
      /*
       * A permission prompt with nobody to answer it never settles — headless
       * Chrome does exactly this, and so does a user who ignores the sheet. An
       * await with no timeout leaves the meter dead instead of falling back.
       */
      const stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({ audio: true }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 900)),
      ]);
      const context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.6;
      context.createMediaStreamSource(stream).connect(analyser);
      return { kind: 'mic', stream, context, analyser, buffer: new Float32Array(analyser.fftSize) };
    } catch {
      // Denied, absent, or blocked. The demo continues either way.
      return { kind: 'simulated', startedAt: performance.now() };
    }
  }

  /** RMS of the current window, scaled so ordinary speech lands near 0.3–0.7. */
  function micLevel(active: Extract<Source, { kind: 'mic' }>): number {
    active.analyser.getFloatTimeDomainData(active.buffer);
    let sum = 0;
    for (const sample of active.buffer) sum += sample * sample;
    return Math.min(1, Math.sqrt(sum / active.buffer.length) * 6);
  }

  /**
   * A plausible speech envelope: syllable-rate amplitude modulation under a
   * slower phrase contour, with a breath-length gap. Deterministic, so
   * screenshots of a listening state look the same every run.
   */
  function simulatedLevel(active: Extract<Source, { kind: 'simulated' }>): number {
    const t = (performance.now() - active.startedAt) / 1000;
    const syllables = 0.5 + 0.5 * Math.sin(t * 15.5);
    const phrase = 0.55 + 0.45 * Math.sin(t * 1.7 + 0.6);
    const breath = t % 4.2 > 3.7 ? 0.05 : 1;
    const onset = Math.min(1, t * 4);
    return Math.min(1, syllables * phrase * breath * onset * 0.85);
  }

  function tick(): void {
    if (!source) return;
    const raw = source.kind === 'mic' ? micLevel(source) : simulatedLevel(source);

    const now = performance.now();
    const dt = Math.min(120, now - lastFrameAt);
    lastFrameAt = now;

    /*
     * Fast attack, slow release: meters should jump to a voice and ease off it.
     * The coefficient is derived from elapsed time rather than assumed to be
     * one frame — a meter that only converges at 60fps goes flat under a
     * throttled tab or headless virtual time, which is where screenshots live.
     */
    const tau = raw > smoothed ? 30 : 130;
    smoothed += (raw - smoothed) * (1 - Math.exp(-dt / tau));

    if (smoothed > threshold) lastLoudAt = now;

    if (!speaking && smoothed > threshold) {
      speaking = true;
      options.onSpeechStart?.();
    } else if (speaking && now - lastLoudAt > hangoverMs) {
      speaking = false;
      options.onSpeechEnd?.();
    }

    options.onLevel?.({ level: smoothed, speaking });
    frame = requestAnimationFrame(tick);
  }

  function release(): void {
    if (source?.kind === 'mic') {
      for (const track of source.stream.getTracks()) track.stop();
      void source.context.close();
    }
    source = undefined;
  }

  return {
    get live() {
      return source?.kind === 'mic';
    },
    get listening() {
      return source !== undefined;
    },

    async start() {
      if (destroyed || source) return;
      const acquired = await acquire();
      if (destroyed) return;
      source = acquired;
      smoothed = 0;
      speaking = false;
      lastLoudAt = lastFrameAt = performance.now();
      frame = requestAnimationFrame(tick);
    },

    stop() {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
      if (speaking) {
        speaking = false;
        options.onSpeechEnd?.();
      }
      release();
      options.onLevel?.({ level: 0, speaking: false });
    },

    destroy() {
      destroyed = true;
      this.stop();
    },
  };
}

/* ---------------------------------------------------------------------- *
 * Push to talk
 * ---------------------------------------------------------------------- */

export interface PushToTalkOptions {
  /** `KeyboardEvent.code`. Right command is `MetaRight`. Default `MetaRight`. */
  code?: string;
  onPress(): void;
  onRelease(): void;
}

/**
 * Hold-a-key binding. Right ⌘ is the usual choice: it is reachable, it is not
 * a shortcut prefix on its own, and `code` distinguishes it from the left key
 * where `key` would not.
 *
 * Returns an unbind function. Handles the case where the window loses focus
 * mid-hold, which otherwise leaves the mic open forever.
 */
export function pushToTalk(options: PushToTalkOptions): () => void {
  const code = options.code ?? 'MetaRight';
  let held = false;

  const down = (event: KeyboardEvent): void => {
    if (event.code !== code || held || event.repeat) return;
    held = true;
    event.preventDefault();
    options.onPress();
  };

  const up = (event: KeyboardEvent): void => {
    if (event.code !== code || !held) return;
    held = false;
    options.onRelease();
  };

  const abandon = (): void => {
    if (!held) return;
    held = false;
    options.onRelease();
  };

  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', abandon);

  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
    window.removeEventListener('blur', abandon);
    abandon();
  };
}
