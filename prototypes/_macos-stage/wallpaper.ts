/**
 * An alpine lake, drawn rather than fetched — prototypes must stay
 * self-contained, so there is no image file to load.
 *
 * Sky, two mountain ranges, shoreline, water, and granite boulders. Rendered as
 * inline SVG with `slice` so it fills any window without distorting.
 */
export function wallpaperSvg(): string {
  return `
<svg class="stage-wallpaper" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1d6ec4" />
      <stop offset="46%" stop-color="#57a5df" />
      <stop offset="100%" stop-color="#b6dcf0" />
    </linearGradient>
    <linearGradient id="farRange" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8fb2d4" />
      <stop offset="100%" stop-color="#5f83ad" />
    </linearGradient>
    <linearGradient id="nearRange" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3f5f8b" />
      <stop offset="100%" stop-color="#27405f" />
    </linearGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1f6f93" />
      <stop offset="22%" stop-color="#2e97ad" />
      <stop offset="58%" stop-color="#63c4c0" />
      <stop offset="100%" stop-color="#9fdcc9" />
    </linearGradient>
    <linearGradient id="rock" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#b9bcbd" />
      <stop offset="55%" stop-color="#83888c" />
      <stop offset="100%" stop-color="#5d6367" />
    </linearGradient>
    <linearGradient id="rockLit" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d5d7d6" />
      <stop offset="60%" stop-color="#9aa0a3" />
      <stop offset="100%" stop-color="#6d7478" />
    </linearGradient>
    <radialGradient id="shallow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#2f6f7e" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#2f6f7e" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="1600" height="1000" fill="url(#sky)" />

  <!-- far snowfields -->
  <path fill="url(#farRange)" d="M0 470 L90 424 L150 446 L232 402 L300 438 L372 396 L452 442 L540 404 L616 440 L700 410 L788 448 L862 416 L946 452 L1030 414 L1112 450 L1196 408 L1280 446 L1364 412 L1448 448 L1528 420 L1600 452 L1600 520 L0 520 Z" />
  <g fill="#f4f8fc" opacity="0.85">
    <path d="M232 402 L246 419 L256 412 L268 428 L278 421 L300 438 L204 438 L216 424 L224 430 Z" />
    <path d="M372 396 L388 416 L398 409 L410 426 L422 418 L452 442 L340 440 L354 425 L362 431 Z" />
    <path d="M540 404 L556 424 L566 417 L578 432 L590 424 L616 440 L512 440 L524 427 L532 433 Z" />
    <path d="M700 410 L716 430 L726 423 L740 439 L752 431 L788 448 L668 444 L682 430 L690 436 Z" />
    <path d="M862 416 L878 434 L888 427 L902 442 L914 434 L946 452 L832 448 L846 435 L854 441 Z" />
    <path d="M1030 414 L1046 432 L1056 425 L1070 440 L1082 432 L1112 450 L1000 446 L1014 433 L1022 439 Z" />
    <path d="M1196 408 L1212 428 L1222 421 L1236 437 L1248 429 L1280 446 L1164 444 L1178 430 L1186 436 Z" />
    <path d="M1364 412 L1380 432 L1390 425 L1404 440 L1416 432 L1448 448 L1332 446 L1346 433 L1354 439 Z" />
  </g>

  <!-- haze softening the far range into the sky -->
  <rect x="0" y="440" width="1600" height="86" fill="#a9cfe8" opacity="0.34" />

  <!-- near ridge -->
  <path fill="url(#nearRange)" d="M0 505 L120 486 L260 502 L400 482 L560 500 L720 486 L880 504 L1040 488 L1200 506 L1360 490 L1520 506 L1600 496 L1600 545 L0 545 Z" />

  <!-- water -->
  <rect x="0" y="540" width="1600" height="460" fill="url(#water)" />
  <g fill="#ffffff" opacity="0.13">
    <rect x="0" y="556" width="1600" height="2" />
    <rect x="0" y="580" width="1600" height="3" />
    <rect x="0" y="614" width="1600" height="2" />
    <rect x="0" y="662" width="1600" height="3" />
  </g>

  <!-- submerged shelves -->
  <g>
    <ellipse cx="330" cy="880" rx="210" ry="52" fill="url(#shallow)" />
    <ellipse cx="1120" cy="826" rx="240" ry="46" fill="url(#shallow)" />
    <ellipse cx="760" cy="960" rx="280" ry="54" fill="url(#shallow)" />
  </g>

  <!-- far shoreline rocks -->
  <g fill="url(#rock)" opacity="0.95">
    <ellipse cx="118" cy="566" rx="46" ry="13" />
    <ellipse cx="236" cy="560" rx="30" ry="9" />
    <ellipse cx="612" cy="562" rx="54" ry="15" />
    <ellipse cx="700" cy="556" rx="38" ry="11" />
    <ellipse cx="792" cy="564" rx="60" ry="16" />
    <ellipse cx="880" cy="558" rx="34" ry="10" />
  </g>

  <!-- right headland -->
  <path fill="#6f6a5e" d="M1400 596 L1452 566 L1516 578 L1560 556 L1600 570 L1600 632 L1400 626 Z" />
  <g fill="url(#rockLit)">
    <ellipse cx="1428" cy="612" rx="52" ry="24" />
    <ellipse cx="1512" cy="600" rx="60" ry="26" />
    <ellipse cx="1584" cy="616" rx="48" ry="22" />
  </g>

  <!-- lone pine -->
  <g transform="translate(1494 430)">
    <rect x="-4" y="86" width="9" height="60" fill="#4a3f33" />
    <path fill="#2f4a33" d="M0 0 L34 62 L18 60 L44 112 L-44 112 L-18 60 L-34 62 Z" />
    <path fill="#3d5c40" d="M0 18 L26 66 L12 64 L32 106 L-32 106 L-12 64 L-26 66 Z" />
  </g>

  <!-- mid-lake boulders -->
  <g>
    <ellipse cx="1060" cy="640" rx="96" ry="44" fill="url(#rockLit)" />
    <ellipse cx="1042" cy="626" rx="70" ry="26" fill="#c6c9c8" opacity="0.55" />
    <ellipse cx="940" cy="664" rx="58" ry="26" fill="url(#rock)" />
    <ellipse cx="1168" cy="668" rx="66" ry="28" fill="url(#rock)" />
    <ellipse cx="820" cy="652" rx="44" ry="19" fill="url(#rock)" />
  </g>

  <!-- foreground boulders -->
  <g>
    <ellipse cx="1236" cy="726" rx="128" ry="62" fill="url(#rockLit)" />
    <ellipse cx="1210" cy="702" rx="92" ry="34" fill="#cfd2d0" opacity="0.5" />
    <ellipse cx="1420" cy="762" rx="86" ry="38" fill="url(#rock)" />
    <ellipse cx="1010" cy="756" rx="74" ry="32" fill="url(#rock)" />
    <ellipse cx="620" cy="812" rx="176" ry="82" fill="url(#rockLit)" />
    <ellipse cx="590" cy="782" rx="126" ry="44" fill="#cbcecd" opacity="0.5" />
    <ellipse cx="880" cy="800" rx="70" ry="30" fill="url(#rock)" />
    <ellipse cx="300" cy="852" rx="96" ry="40" fill="url(#rock)" />
    <ellipse cx="1150" cy="900" rx="110" ry="42" fill="url(#rock)" opacity="0.7" />
  </g>

  <!-- contact shadows: rocks meet water rather than hover on it -->
  <g fill="#14424f" opacity="0.26">
    <ellipse cx="1252" cy="770" rx="120" ry="18" />
    <ellipse cx="1432" cy="792" rx="80" ry="13" />
    <ellipse cx="1020" cy="782" rx="70" ry="12" />
    <ellipse cx="640" cy="878" rx="168" ry="24" />
    <ellipse cx="890" cy="824" rx="66" ry="11" />
    <ellipse cx="312" cy="884" rx="90" ry="14" />
    <ellipse cx="1072" cy="666" rx="90" ry="13" />
  </g>

  <!-- surface caustics over everything shallow -->
  <g fill="#ffffff" opacity="0.09">
    <ellipse cx="420" cy="906" rx="150" ry="12" />
    <ellipse cx="980" cy="946" rx="190" ry="14" />
    <ellipse cx="1440" cy="880" rx="140" ry="11" />
  </g>
</svg>`;
}
