# _voice

Voice input detection with **no UI**. A level signal and speech boundaries; every
prototype draws its own meter.

Like `_macos-stage`, this is shared infrastructure rather than a shared design. It emits
numbers, not pixels — nothing in here expresses a visual opinion, so using it does not make
two prototypes look alike.

```ts
import { createVoiceInput, pushToTalk } from '../_voice';

const voice = createVoiceInput({
  onLevel: ({ level, speaking }) => meter.style.setProperty('--level', String(level)),
  onSpeechStart: () => card.classList.add('is-hearing'),
  onSpeechEnd: () => card.classList.remove('is-hearing'),
});

const unbind = pushToTalk({
  code: 'MetaRight',            // right ⌘
  onPress: () => void voice.start(),
  onRelease: () => voice.stop(),
});
```

## The microphone is optional

`start()` asks for the real microphone and uses it when granted. When the permission is
denied, the API is missing, or there is no input device, it silently falls back to a
**synthesised speech envelope** with the same signal shape.

This is load-bearing, not a nicety:

- `screenshot-prototype.sh` runs headless Chrome, which has no microphone. A prototype that
  needs a granted permission to look alive cannot be screenshotted.
- A demo must not die on a permission sheet in front of an audience.

The simulated envelope is deterministic — syllable-rate modulation under a slower phrase
contour — so a screenshot of a listening state looks the same on every run. `voice.live`
tells you which mode you are in. Do not put that fact on screen.

Pass `simulate: true` to force the fallback while designing.

## Tuning a meter

Two numbers decide whether a meter looks alive, and both are about the **sampling window**
rather than about speech:

- A meter that scrolls one bar per frame shows only ~0.4s of history. A 1.5Hz syllable puts
  half a cycle on screen and reads as a static block; ~7Hz puts three or four peaks in view.
- Release smoothing much past ~30ms filters out exactly that modulation. The defaults here are
  8ms attack / 22ms release for this reason.

Raw mic RMS sits near 0.05 for ordinary speech, so a linear scale gives a meter that never
leaves the floor. `micLevel` applies a compressive curve instead.

## Notes

- `pushToTalk` keys off `KeyboardEvent.code`, so `MetaRight` really is the right ⌘ key.
  `event.key` cannot tell the two apart.
- It releases on window `blur`, so a hold that loses focus does not leave the mic open.
- Speech detection is a threshold with hangover (default `0.06` / `700ms`), not a VAD model.
  Good enough to drive a waveform; do not present it as transcription.
- Actual transcription is fabricated by the prototype. There is no speech-to-text here.
