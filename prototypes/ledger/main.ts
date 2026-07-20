import { OmiMock, omiScenarioNames, type OmiScenarioName } from '../../reference/hackathon-pack/src';
import {
  accountSubtotal,
  assertLedgerInvariants,
  balanceOf,
  buildEntries,
  type LedgerEntry,
} from './entries';
import './style.css';

const DEFAULT_SCENARIO: OmiScenarioName = 'power-user';

const requested = new URLSearchParams(window.location.search).get('scenario');
const scenario: OmiScenarioName =
  omiScenarioNames.find((name) => name === requested) ?? DEFAULT_SCENARIO;

const omi = new OmiMock({ scenario, latencyMs: 40, processingMs: 900 });

const root = document.querySelector<HTMLElement>('#root');
if (!root) throw new Error('#root is missing from index.html');

/** Local settle overrides — toggleAction also fires, but credits aren't SDK actions. */
const settledLocal = new Map<string, boolean>();
let filterPersonId: string | null = null;
let expandedId: string | null = null;
let entries: LedgerEntry[] = [];

function isSettled(entry: LedgerEntry): boolean {
  return settledLocal.has(entry.id) ? settledLocal.get(entry.id)! : entry.settled;
}

function visibleEntries(): LedgerEntry[] {
  const list = entries.map((e) => ({ ...e, settled: isSettled(e) }));
  list.sort((a, b) => {
    if (a.settled !== b.settled) return a.settled ? 1 : -1;
    return b.ageDays - a.ageDays || a.date.getTime() - b.date.getTime();
  });
  if (!filterPersonId) return list;
  return list.filter((e) => e.personId === filterPersonId);
}

function ageLabel(days: number): string {
  if (days === 0) return '0d';
  return `${days}d`;
}

function sideMark(side: LedgerEntry['side']): string {
  return side === 'debit' ? 'Dr' : 'Cr';
}

function renderBalance(mount: HTMLElement, owe: number, owed: number): void {
  const prev = mount.dataset.sig;
  const sig = `${owe}:${owed}`;
  mount.dataset.sig = sig;
  mount.innerHTML = `
    <span class="bal-line">
      <span class="bal-label">Outstanding</span>
      <span class="bal-nums">
        <span class="bal-owe" data-roll="${owe}">You owe <em>${owe}</em></span>
        <span class="bal-sep">·</span>
        <span class="bal-owed" data-roll="${owed}">You are owed <em>${owed}</em></span>
      </span>
    </span>
  `;
  if (prev && prev !== sig) {
    mount.querySelectorAll('em').forEach((el) => {
      el.classList.add('is-rolling');
      el.addEventListener('animationend', () => el.classList.remove('is-rolling'), { once: true });
    });
  }
}

function render(): void {
  const shown = visibleEntries();
  const allForBalance = entries.map((e) => ({ ...e, settled: isSettled(e) }));
  const filteredPerson = filterPersonId
    ? entries.find((e) => e.personId === filterPersonId)?.personName ?? null
    : null;

  const bal = filterPersonId
    ? accountSubtotal(allForBalance, filterPersonId)
    : { ...balanceOf(allForBalance), oldest: null as number | null };

  const subline =
    filterPersonId && filteredPerson
      ? `You owe ${filteredPerson} ${bal.owe}. ${filteredPerson} owes you ${bal.owed}.${
          bal.oldest != null ? ` Oldest: ${bal.oldest} days.` : ''
        }`
      : null;

  root!.innerHTML = `
    <div class="grain" aria-hidden="true"></div>
    <main class="sheet">
      <header class="masthead">
        <p class="eyebrow">Personal ledger · 20 Jul 2026</p>
        <h1>Open accounts</h1>
        <p class="lede">${filterPersonId ? `Account · ${filteredPerson}` : 'Riley Park'}</p>
        ${
          filterPersonId
            ? `<button type="button" class="clear-account" data-action="clear-filter">All accounts</button>`
            : ''
        }
      </header>

      ${subline ? `<p class="subtotal">${subline}</p>` : ''}

      <div class="ledger" role="table" aria-label="Open accounts">
        <div class="cols" role="row">
          <span role="columnheader">Date</span>
          <span role="columnheader">Counterparty</span>
          <span role="columnheader">Commitment</span>
          <span role="columnheader" class="num">Age</span>
          <span role="columnheader" class="num">Side</span>
        </div>
        <div class="rows">
          ${shown
            .map((entry) => {
              const settled = entry.settled;
              const open = expandedId === entry.id;
              return `
              <div
                class="row${settled ? ' is-settled' : ''}${open ? ' is-open' : ''}"
                role="row"
                data-id="${entry.id}"
              >
                <div class="row-main">
                  <button
                    type="button"
                    class="cell date"
                    data-action="receipt"
                    data-id="${entry.id}"
                    title="Show receipt"
                  >${entry.dateLabel}</button>
                  <button
                    type="button"
                    class="cell person"
                    data-action="filter"
                    data-person="${entry.personId}"
                    title="Open account"
                  >${entry.personName}</button>
                  <button
                    type="button"
                    class="cell commitment"
                    data-action="settle"
                    data-id="${entry.id}"
                    aria-label="${settled ? 'Reopen' : 'Settle'} entry with ${entry.personName}"
                  >
                    <span class="commitment-text">${entry.commitment}</span>
                    <span class="strike" aria-hidden="true"></span>
                  </button>
                  <button
                    type="button"
                    class="cell age num"
                    data-action="settle"
                    data-id="${entry.id}"
                    tabindex="-1"
                  >${ageLabel(entry.ageDays)}</button>
                  <button
                    type="button"
                    class="cell side num side-${entry.side}"
                    data-action="settle"
                    data-id="${entry.id}"
                    tabindex="-1"
                  >${sideMark(entry.side)}</button>
                </div>
                ${
                  entry.receipt
                    ? `<div class="receipt" ${open ? '' : 'hidden'}>
                        <p>${entry.receipt}</p>
                      </div>`
                    : ''
                }
              </div>`;
            })
            .join('')}
        </div>
      </div>

      <footer class="foot">
        <div class="balance" id="balance"></div>
        <p class="legend"><span class="lg-dr">Dr</span> you owe · <span class="lg-cr">Cr</span> you are owed</p>
      </footer>
    </main>
  `;

  renderBalance(root!.querySelector('#balance')!, bal.owe, bal.owed);
}

async function settle(id: string): Promise<void> {
  const entry = entries.find((e) => e.id === id);
  if (!entry) return;
  const next = !isSettled(entry);
  settledLocal.set(id, next);

  const row = root!.querySelector<HTMLElement>(`.row[data-id="${id}"]`);
  if (row && next) {
    row.classList.add('is-settling');
    await new Promise((r) => setTimeout(r, 320));
    row.classList.add('is-settled');
    row.classList.remove('is-settling');
    await new Promise((r) => setTimeout(r, 180));
  }

  render();
}

root!.addEventListener('click', (event) => {
  const t = event.target as HTMLElement;

  const clear = t.closest<HTMLElement>('[data-action="clear-filter"]');
  if (clear) {
    filterPersonId = null;
    render();
    return;
  }

  const filter = t.closest<HTMLElement>('[data-action="filter"]');
  if (filter) {
    event.preventDefault();
    event.stopPropagation();
    const pid = filter.dataset.person!;
    filterPersonId = filterPersonId === pid ? null : pid;
    expandedId = null;
    render();
    return;
  }

  const receipt = t.closest<HTMLElement>('[data-action="receipt"]');
  if (receipt) {
    event.preventDefault();
    event.stopPropagation();
    const id = receipt.dataset.id!;
    expandedId = expandedId === id ? null : id;
    render();
    return;
  }

  const settleBtn = t.closest<HTMLElement>('[data-action="settle"]');
  if (settleBtn) {
    void settle(settleBtn.dataset.id!);
  }
});

async function refresh(): Promise<void> {
  await document.fonts.ready.catch(() => undefined);
  const snapshot = await omi.getSnapshot();
  entries = buildEntries(snapshot);
  assertLedgerInvariants(entries);
  render();
}

void refresh();

import.meta.hot?.dispose(() => {
  /* snapshot-only; settle state is local */
});
