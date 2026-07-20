# _macos-stage

A macOS desktop to stage a prototype on: wallpaper, menu bar, calendar and weather widgets, desktop files, and a dock. Use it when a concept is an **overlay, panel, or menu-bar surface** that only makes sense floating above someone's real desktop.

```ts
import { mountMacStage } from '../_macos-stage';

const stage = mountMacStage(document.querySelector('#root')!, {
  appName: 'omi',
  menus: ['File', 'Edit', 'View', 'Capture', 'Window', 'Help'],
  now: fixtureClock,          // deterministic screenshots
});

stage.surface.append(myPanel); // your UI, above the desktop
```

| Option | Default | Notes |
| --- | --- | --- |
| `appName` | `'Finder'` | Bold entry in the menu bar |
| `menus` | File…Help | Menu titles after the app name |
| `files` | 4 items | Desktop icons, right side |
| `now` | `() => new Date()` | Pass a fixture clock to freeze the menu bar |
| `widgets` | `true` | Calendar + weather, top left |
| `dock` | `true` | Bottom dock |

`stage.surface` is click-through except where you put something, so the desktop reads as inert background. Call `stage.destroy()` on HMR dispose.

For a concept that **is** a menu bar item, prepend to `stage.statusSlot` instead — it sits left of the system icons and clock, where macOS would put it:

```ts
stage.statusSlot.append(myGlyph);
```

## Why this is shared when nothing else is

`AGENTS.md` forbids shared UI kits between prototypes, because shared components make every concept converge into variants of one app. **This is explicitly carved out of that rule**, on one condition: the stage is a *bezel*, not a design decision. It is the equivalent of a phone mockup frame around a screenshot. It should look identical in every prototype that uses it, and it never expresses anything about the concept it holds.

The line to hold: everything inside `stage.surface` is the prototype's own visual language and must not be shared. If you find yourself wanting to add a card style, a type scale, or a color token here, that belongs to your prototype instead.

## Self-contained

The wallpaper is drawn as inline SVG in `wallpaper.ts` — an alpine lake with sky, two mountain ranges, water, and granite boulders. No image files and no network requests, so prototypes stay runnable offline. Swap the SVG if a concept needs a different mood (a night desk, say), but change it in a copy rather than here, so existing prototypes don't shift underneath.
