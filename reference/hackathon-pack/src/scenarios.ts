import { defaultOmiSeed } from './seed';
import { firstRunScenario } from './scenarios/first-run';
import { powerUserScenario } from './scenarios/power-user';
import { emptySearchScenario, offlineRecoveryScenario, processingScenario, recordingScenario } from './scenarios/variants';
import type { OmiScenarioName, OmiSeed } from './types';

export type { OmiScenarioName } from './types';

export const omiScenarioNames = [
  'default',
  'first-run',
  'power-user',
  'recording',
  'processing',
  'offline-recovery',
  'empty-search',
] as const satisfies readonly OmiScenarioName[];

export interface OmiScenarioInfo {
  id: OmiScenarioName;
  label: string;
  description: string;
}

export const omiScenarioCatalog: readonly OmiScenarioInfo[] = [
  { id: 'default', label: 'Default', description: 'A small balanced context for getting started.' },
  { id: 'first-run', label: 'First run', description: 'Synthetic setup context with a connecting device and recoverable actions.' },
  { id: 'power-user', label: 'Power user', description: 'A dense stitched day for timelines, memory links, and action queues.' },
  { id: 'recording', label: 'Active recording', description: 'A live capture with transcript segments and adjacent context.' },
  { id: 'processing', label: 'Processing after stop', description: 'A pending transcript while extraction remains in flight.' },
  { id: 'offline-recovery', label: 'Offline recovery', description: 'Readable local context with a disconnected device and retry path.' },
  { id: 'empty-search', label: 'Empty search', description: 'Populated context where a valid search has no matches.' },
];

const scenarioSeeds: Record<OmiScenarioName, OmiSeed> = {
  default: defaultOmiSeed,
  'first-run': firstRunScenario,
  'power-user': powerUserScenario,
  recording: recordingScenario,
  processing: processingScenario,
  'offline-recovery': offlineRecoveryScenario,
  'empty-search': emptySearchScenario,
};

const copy = <T>(value: T): T => structuredClone(value);

/** Return an isolated synthetic fixture for a named prototype state. */
export function getOmiScenario(name: OmiScenarioName): OmiSeed {
  if (!omiScenarioNames.includes(name)) {
    throw new Error(`Unknown Omi scenario: ${name}`);
  }
  return copy(scenarioSeeds[name]);
}
