import type { OmiSeed } from '../types';

/**
 * A deterministic, synthetic first-run fixture. The mock schema has no
 * dedicated permission or onboarding fields, so those states are represented
 * by disconnected setup apps, a connecting device, and recoverable actions.
 */
export const firstRunScenario: OmiSeed = {
  me: {
    id: 'person-me',
    name: 'You',
    relationship: 'You',
    lastSeenAt: '2026-07-20T08:10:00.000Z',
  },
  device: {
    id: 'omi-first-run',
    name: 'Omi',
    connection: 'connecting',
    batteryPercent: 68,
    firmwareVersion: '3.1.0',
    lastSyncedAt: '2026-07-19T18:40:00.000Z',
  },
  capture: {
    id: 'capture-first-run',
    status: 'idle',
    liveTranscript: [],
  },
  people: [
    { id: 'person-me', name: 'You', relationship: 'You', lastSeenAt: '2026-07-20T08:10:00.000Z' },
    { id: 'person-teammate-a', name: 'Teammate A', relationship: 'Teammate', lastSeenAt: '2026-07-20T07:58:00.000Z' },
    { id: 'person-teammate-b', name: 'Teammate B', relationship: 'Teammate', lastSeenAt: '2026-07-18T15:32:00.000Z' },
    { id: 'person-study-partner', name: 'Study partner', relationship: 'Study partner', lastSeenAt: '2026-07-16T18:05:00.000Z' },
    { id: 'person-family-member', name: 'Family member', relationship: 'Family', lastSeenAt: '2026-07-14T12:24:00.000Z' },
    { id: 'person-neighbor', name: 'Neighbor', relationship: 'Neighbor', lastSeenAt: '2026-07-12T09:15:00.000Z' },
  ],
  conversations: [
    {
      id: 'conv-first-setup',
      title: 'First-run setup check',
      startedAt: '2026-07-20T07:45:00.000Z',
      updatedAt: '2026-07-20T07:58:00.000Z',
      source: 'device',
      summary: 'A short setup check introduced local capture, privacy controls, and the recovery path after a permission pause.',
      people: ['person-me', 'person-teammate-a'],
      segments: [
        { id: 'seg-first-setup-1', speaker: 'You', text: 'Let us start with the smallest useful capture and keep the review local.', startedAt: '2026-07-20T07:45:00.000Z', endedAt: '2026-07-20T07:45:11.000Z' },
        { id: 'seg-first-setup-2', speaker: 'Teammate A', text: 'If access pauses, show the retry step and preserve this setup note.', startedAt: '2026-07-20T07:45:12.000Z', endedAt: '2026-07-20T07:45:24.000Z' },
        { id: 'seg-first-setup-3', speaker: 'You', text: 'A clear handoff is enough for the first session.', startedAt: '2026-07-20T07:57:35.000Z', endedAt: '2026-07-20T07:57:44.000Z' },
      ],
    },
    {
      id: 'conv-context-reset',
      title: 'Morning context reset',
      startedAt: '2026-07-19T08:00:00.000Z',
      updatedAt: '2026-07-19T08:14:00.000Z',
      source: 'device',
      summary: 'A small plan for reviewing yesterday, choosing one priority, and leaving the rest for later.',
      people: ['person-me'],
      segments: [
        { id: 'seg-context-reset-1', speaker: 'You', text: 'Today needs one clear priority and a short end-of-day review.', startedAt: '2026-07-19T08:00:00.000Z', endedAt: '2026-07-19T08:00:10.000Z' },
        { id: 'seg-context-reset-2', speaker: 'You', text: 'Keep unfinished thoughts available without turning them into tasks yet.', startedAt: '2026-07-19T08:13:20.000Z', endedAt: '2026-07-19T08:13:32.000Z' },
      ],
    },
    {
      id: 'conv-project-handoff',
      title: 'Project handoff notes',
      startedAt: '2026-07-18T15:00:00.000Z',
      updatedAt: '2026-07-18T15:32:00.000Z',
      source: 'macos',
      summary: 'Two teammates outlined a small handoff, named the open question, and picked a next check-in.',
      people: ['person-me', 'person-teammate-b'],
      segments: [
        { id: 'seg-project-handoff-1', speaker: 'You', text: 'The handoff can wait for one example that shows the edge case.', startedAt: '2026-07-18T15:00:00.000Z', endedAt: '2026-07-18T15:00:12.000Z' },
        { id: 'seg-project-handoff-2', speaker: 'Teammate B', text: 'I will collect that example before our next check-in.', startedAt: '2026-07-18T15:20:10.000Z', endedAt: '2026-07-18T15:20:20.000Z' },
        { id: 'seg-project-handoff-3', speaker: 'You', text: 'Link the example to this conversation so it is easy to retrieve.', startedAt: '2026-07-18T15:31:20.000Z', endedAt: '2026-07-18T15:31:30.000Z' },
      ],
    },
    {
      id: 'conv-errand-plan',
      title: 'Errand plan',
      startedAt: '2026-07-16T17:40:00.000Z',
      updatedAt: '2026-07-16T18:05:00.000Z',
      source: 'ios',
      summary: 'A quick plan grouped two errands together and left a reminder to check the closing time.',
      people: ['person-me', 'person-study-partner'],
      segments: [
        { id: 'seg-errand-plan-1', speaker: 'Study partner', text: 'Bundle the two stops so the evening stays simple.', startedAt: '2026-07-16T17:40:00.000Z', endedAt: '2026-07-16T17:40:10.000Z' },
        { id: 'seg-errand-plan-2', speaker: 'You', text: 'I will check the closing time before heading out.', startedAt: '2026-07-16T18:04:10.000Z', endedAt: '2026-07-16T18:04:20.000Z' },
      ],
    },
    {
      id: 'conv-quiet-reflection',
      title: 'Quiet reflection',
      startedAt: '2026-07-14T12:00:00.000Z',
      updatedAt: '2026-07-14T12:24:00.000Z',
      source: 'ios',
      summary: 'A calm reflection surfaced one helpful routine and one thing to revisit after a break.',
      people: ['person-me', 'person-family-member'],
      segments: [
        { id: 'seg-quiet-reflection-1', speaker: 'Family member', text: 'The short walk helped make the afternoon feel less crowded.', startedAt: '2026-07-14T12:00:00.000Z', endedAt: '2026-07-14T12:00:12.000Z' },
        { id: 'seg-quiet-reflection-2', speaker: 'You', text: 'Keep that routine in the morning review for a week.', startedAt: '2026-07-14T12:23:10.000Z', endedAt: '2026-07-14T12:23:20.000Z' },
      ],
    },
    {
      id: 'conv-recovery-rehearsal',
      title: 'Recovery rehearsal',
      startedAt: '2026-07-12T09:00:00.000Z',
      updatedAt: '2026-07-12T09:15:00.000Z',
      source: 'device',
      summary: 'A rehearsal confirmed that a paused connection should leave local notes readable and offer a retry.',
      people: ['person-me', 'person-neighbor'],
      segments: [
        { id: 'seg-recovery-rehearsal-1', speaker: 'You', text: 'If the device drops, keep the saved timeline visible.', startedAt: '2026-07-12T09:00:00.000Z', endedAt: '2026-07-12T09:00:10.000Z' },
        { id: 'seg-recovery-rehearsal-2', speaker: 'Neighbor', text: 'A retry should explain what is waiting and what is already safe.', startedAt: '2026-07-12T09:14:10.000Z', endedAt: '2026-07-12T09:14:22.000Z' },
      ],
    },
  ],
  memories: [
    { id: 'mem-first-run-privacy', text: 'Start with a short local review before adding any integrations.', kind: 'preference', createdAt: '2026-07-20T07:58:00.000Z', people: ['person-me'], sourceConversationId: 'conv-first-setup' },
    { id: 'mem-first-run-retry', text: 'When setup pauses, preserve the local note and offer a visible retry.', kind: 'insight', createdAt: '2026-07-20T07:58:00.000Z', people: ['person-me', 'person-teammate-a'], sourceConversationId: 'conv-first-setup' },
    { id: 'mem-review-priority', text: 'A morning review works best with one clear priority.', kind: 'preference', createdAt: '2026-07-19T08:14:00.000Z', people: ['person-me'], sourceConversationId: 'conv-context-reset' },
    { id: 'mem-open-thoughts', text: 'Unfinished thoughts can stay available without becoming tasks immediately.', kind: 'fact', createdAt: '2026-07-19T08:14:00.000Z', people: ['person-me'], sourceConversationId: 'conv-context-reset' },
    { id: 'mem-handoff-example', text: 'The project handoff needs one edge-case example before the next check-in.', kind: 'commitment', createdAt: '2026-07-18T15:32:00.000Z', people: ['person-me', 'person-teammate-b'], sourceConversationId: 'conv-project-handoff' },
    { id: 'mem-bundled-errands', text: 'Grouping nearby errands keeps an evening plan simple.', kind: 'insight', createdAt: '2026-07-16T18:05:00.000Z', people: ['person-me', 'person-study-partner'], sourceConversationId: 'conv-errand-plan' },
    { id: 'mem-morning-walk', text: 'A short morning walk is worth revisiting after a busy day.', kind: 'preference', createdAt: '2026-07-14T12:24:00.000Z', people: ['person-me', 'person-family-member'], sourceConversationId: 'conv-quiet-reflection' },
    { id: 'mem-offline-continuity', text: 'Saved notes should remain readable while a device reconnects.', kind: 'fact', createdAt: '2026-07-12T09:15:00.000Z', people: ['person-me', 'person-neighbor'], sourceConversationId: 'conv-recovery-rehearsal' },
  ],
  apps: [
    { id: 'app-microphone-access', name: 'Microphone access', description: 'Setup permission needed before a first live capture can begin.', category: 'Setup', connected: false },
    { id: 'app-omi-device-link', name: 'Omi device link', description: 'Pair the nearby device, then retry if the connection pauses.', category: 'Setup', connected: false },
    { id: 'app-calendar', name: 'Calendar', description: 'Optional schedule context for turning memories into follow-ups.', category: 'Productivity', connected: false },
    { id: 'app-notes', name: 'Notes', description: 'Optional notes context that can enrich local recall.', category: 'Knowledge', connected: false },
    { id: 'app-reminders', name: 'Reminders', description: 'Optional destination for actions after you review them.', category: 'Productivity', connected: false },
    { id: 'app-sample-context', name: 'Sample context', description: 'A synthetic integration used to preview progressive setup states.', category: 'Demo', connected: true },
  ],
  actions: [
    { id: 'action-grant-microphone', title: 'Allow microphone access, then retry setup', status: 'open', dueAt: '2026-07-20T09:00:00.000Z', conversationId: 'conv-first-setup' },
    { id: 'action-retry-device', title: 'Retry the Omi device connection', status: 'open', dueAt: '2026-07-20T09:05:00.000Z', conversationId: 'conv-first-setup' },
    { id: 'action-review-privacy', title: 'Review capture and privacy controls', status: 'open', conversationId: 'conv-first-setup' },
    { id: 'action-choose-priority', title: 'Choose one priority for the next review', status: 'done', dueAt: '2026-07-19T08:30:00.000Z', conversationId: 'conv-context-reset' },
    { id: 'action-collect-example', title: 'Collect the edge-case example for handoff', status: 'open', dueAt: '2026-07-21T15:00:00.000Z', conversationId: 'conv-project-handoff' },
    { id: 'action-check-closing-time', title: 'Check the closing time before the errands', status: 'done', dueAt: '2026-07-16T18:30:00.000Z', conversationId: 'conv-errand-plan' },
    { id: 'action-revisit-walk', title: 'Revisit the morning-walk routine after a busy day', status: 'open', conversationId: 'conv-quiet-reflection' },
    { id: 'action-test-recovery', title: 'Test the reconnect path without hiding saved notes', status: 'done', conversationId: 'conv-recovery-rehearsal' },
  ],
};

export const firstRunScenarioNotes =
  'Use the connecting device, disconnected setup apps, and open retry actions as the initial onboarding state; progressively mark those records done or connected as the prototype walks through recovery.';
