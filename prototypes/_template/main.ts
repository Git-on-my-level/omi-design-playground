/**
 * Prototype wiring only. No design decisions live in this file.
 *
 * What it gives you:
 *   - a mock bound to a scenario, overridable with ?scenario=power-user
 *   - a snapshot on load
 *   - live re-render on every mock event, with listeners cleaned up on HMR
 *
 * Replace `render` with your concept. Delete anything you do not need.
 */
import { OmiMock, omiScenarioNames, type OmiScenarioName } from '../../reference/hackathon-pack/src';
import type { OmiSnapshot } from '../../reference/hackathon-pack/src/types';
import './style.css';

const DEFAULT_SCENARIO: OmiScenarioName = 'default';

const requested = new URLSearchParams(window.location.search).get('scenario');
const scenario: OmiScenarioName =
  omiScenarioNames.find((name) => name === requested) ?? DEFAULT_SCENARIO;

const omi = new OmiMock({ scenario, latencyMs: 80, processingMs: 900 });

const root = document.querySelector<HTMLElement>('#root');
if (!root) throw new Error('#root is missing from index.html');

function render(snapshot: OmiSnapshot, mount: HTMLElement): void {
  // Your concept goes here. This placeholder exists to prove the wiring works.
  mount.textContent = `${snapshot.me.name} · ${snapshot.memories.length} memories · ${snapshot.actions.length} actions`;
}

async function refresh(): Promise<void> {
  render(await omi.getSnapshot(), root!);
}

/** Every mock event re-renders. Narrow this if a concept needs finer control. */
const unsubscribers = [
  omi.on('capture.changed', refresh),
  omi.on('conversation.updated', refresh),
  omi.on('memory.created', refresh),
  omi.on('device.changed', refresh),
  omi.on('action.changed', refresh),
];

void refresh();

import.meta.hot?.dispose(() => {
  unsubscribers.forEach((off) => off());
});
