/**
 * A macOS desktop to stage a prototype on.
 *
 * Deliberately shared and deliberately identical everywhere: it is a bezel, not
 * a design decision. Concepts still bring their own visual language for whatever
 * they mount on the returned `surface`.
 *
 * See README.md for the carve-out from the distinctness rule in AGENTS.md.
 */
import { wallpaperSvg } from './wallpaper';
import './stage.css';

export interface DesktopFile {
  name: string;
  kind: 'folder' | 'document' | 'image';
}

export interface MacStageOptions {
  /** Bold name in the menu bar. Defaults to Finder. */
  appName?: string;
  /** Menu titles after the app name. */
  menus?: string[];
  /** Icons on the right of the desktop. */
  files?: DesktopFile[];
  /** Clock source. Supply a fixture clock to keep screenshots deterministic. */
  now?: () => Date;
  /** Calendar and weather widgets, top-left. Default true. */
  widgets?: boolean;
  /**
   * Where desktop icons sit. macOS defaults to top-right, but that is exactly
   * where notification-style overlays live — use 'bottom-left' when your
   * concept occupies that corner, so icons are not half-covered.
   */
  filesArea?: 'top-right' | 'bottom-left';
  /** Dock along the bottom. Default true. */
  dock?: boolean;
}

export interface MacStage {
  /** Mount the prototype's own UI here. Sits above the desktop, below the menu bar. */
  surface: HTMLElement;
  /**
   * Leading edge of the menu bar's status area, for concepts that *are* a menu
   * bar item. Prepend your own glyph here; the stage's own status icons and
   * clock stay to its right, where macOS would put them.
   */
  statusSlot: HTMLElement;
  /** Stop the clock. */
  destroy(): void;
}

const DEFAULT_MENUS = ['File', 'Edit', 'View', 'Go', 'Window', 'Help'];

const DEFAULT_FILES: DesktopFile[] = [
  { name: 'Workshop', kind: 'folder' },
  { name: 'decision-trail.pdf', kind: 'document' },
  { name: 'Screenshots', kind: 'folder' },
  { name: 'lake-tahoe.heic', kind: 'image' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function menuBarTime(at: Date): string {
  const time = at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${DAYS[at.getDay()]} ${MONTHS[at.getMonth()]} ${at.getDate()}  ${time}`;
}

/* -- desktop icons -------------------------------------------------------- */

function fileIcon(kind: DesktopFile['kind']): string {
  if (kind === 'folder') {
    return `<svg viewBox="0 0 64 52" aria-hidden="true">
      <path d="M2 10a6 6 0 0 1 6-6h16l7 7h27a6 6 0 0 1 6 6v29a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6Z" fill="#5aa9e8"/>
      <path d="M2 18h60v23a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6Z" fill="#7cc0f2"/>
    </svg>`;
  }
  if (kind === 'image') {
    return `<svg viewBox="0 0 52 64" aria-hidden="true">
      <rect x="4" y="2" width="44" height="60" rx="5" fill="#f4f5f7"/>
      <rect x="10" y="10" width="32" height="30" rx="3" fill="#63b6e0"/>
      <path d="M10 34l9-9 8 8 6-5 9 9v3H10Z" fill="#3d8f5f"/>
      <circle cx="35" cy="18" r="4" fill="#ffd76e"/>
    </svg>`;
  }
  return `<svg viewBox="0 0 52 64" aria-hidden="true">
    <path d="M9 2h24l14 14v43a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z" fill="#f6f7f9"/>
    <path d="M33 2l14 14H33Z" fill="#cfd4da"/>
    <g fill="#c8ced6">
      <rect x="12" y="30" width="28" height="3" rx="1.5"/>
      <rect x="12" y="38" width="28" height="3" rx="1.5"/>
      <rect x="12" y="46" width="18" height="3" rx="1.5"/>
    </g>
  </svg>`;
}

/* -- widgets -------------------------------------------------------------- */

function calendarWidget(at: Date): string {
  const year = at.getFullYear();
  const month = at.getMonth();
  const today = at.getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: string[] = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push('<span></span>');
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(
      day === today
        ? `<span class="is-today">${day}</span>`
        : `<span>${day}</span>`,
    );
  }

  return `<div class="stage-widget stage-widget--calendar">
    <p class="stage-widget-month">${MONTHS[month]!.toUpperCase()}</p>
    <div class="stage-cal-grid stage-cal-head">
      <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
    </div>
    <div class="stage-cal-grid">${cells.join('')}</div>
  </div>`;
}

function weatherWidget(): string {
  return `<div class="stage-widget stage-widget--weather">
    <p class="stage-weather-place">Hunters Point <span>➤</span></p>
    <p class="stage-weather-temp">81°</p>
    <p class="stage-weather-sun">☀︎</p>
    <p class="stage-weather-cond">Sunny</p>
    <p class="stage-weather-range">H:83° L:64°</p>
  </div>`;
}

/* -- dock ----------------------------------------------------------------- */

const DOCK_TILES: Array<[string, string]> = [
  ['Finder', 'linear-gradient(160deg,#4fa8e8,#1f6fc4)'],
  ['Mail', 'linear-gradient(160deg,#6cc6f7,#2b7fd4)'],
  ['Calendar', 'linear-gradient(160deg,#ffffff,#e6e7ea)'],
  ['Notes', 'linear-gradient(160deg,#ffe27a,#f5c02f)'],
  ['Music', 'linear-gradient(160deg,#fc5c7d,#e8324f)'],
  ['Terminal', 'linear-gradient(160deg,#4b4f55,#22262b)'],
  ['omi', 'linear-gradient(160deg,#f0906a,#d9542a)'],
];

function dock(): string {
  const tiles = DOCK_TILES.map(
    ([label, fill]) =>
      `<span class="stage-dock-tile" title="${label}" style="background:${fill}"></span>`,
  ).join('');
  return `<div class="stage-dock"><div class="stage-dock-inner">${tiles}</div></div>`;
}

/* -- mount ---------------------------------------------------------------- */

export function mountMacStage(mount: HTMLElement, options: MacStageOptions = {}): MacStage {
  const {
    appName = 'Finder',
    menus = DEFAULT_MENUS,
    files = DEFAULT_FILES,
    now = () => new Date(),
    widgets = true,
    filesArea = 'top-right',
    dock: withDock = true,
  } = options;

  const at = now();

  const desktop = document.createElement('div');
  desktop.className = 'stage-desktop';
  desktop.innerHTML = `
    ${wallpaperSvg()}
    <div class="stage-menubar">
      <nav class="stage-menubar-left">
        <span class="stage-apple"></span>
        <span class="stage-app">${appName}</span>
        ${menus.map((menu) => `<span>${menu}</span>`).join('')}
      </nav>
      <div class="stage-menubar-right">
        <span class="stage-status-slot" data-stage-status-slot></span>
        <span class="stage-status">◐</span>
        <span class="stage-status">☰</span>
        <span class="stage-status">✦</span>
        <span class="stage-status">⌘</span>
        <span class="stage-status">▮</span>
        <span class="stage-clock" data-stage-clock>${menuBarTime(at)}</span>
      </div>
    </div>
    ${widgets ? `<div class="stage-widgets">${calendarWidget(at)}${weatherWidget()}</div>` : ''}
    <div class="stage-files stage-files--${filesArea}">
      ${files
        .map(
          (file) =>
            `<figure class="stage-file"><span class="stage-file-icon">${fileIcon(file.kind)}</span><figcaption>${file.name}</figcaption></figure>`,
        )
        .join('')}
    </div>
    ${withDock ? dock() : ''}
  `;

  const surface = document.createElement('div');
  surface.className = 'stage-surface';

  mount.replaceChildren(desktop, surface);

  const clockEl = desktop.querySelector<HTMLElement>('[data-stage-clock]');
  const ticker = window.setInterval(() => {
    if (clockEl) clockEl.textContent = menuBarTime(now());
  }, 10_000);

  return {
    surface,
    statusSlot: desktop.querySelector<HTMLElement>('[data-stage-status-slot]')!,
    destroy: () => window.clearInterval(ticker),
  };
}
