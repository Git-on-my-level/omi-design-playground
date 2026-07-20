/**
 * Synthetic, deterministic Omi states for prototyping transitions.
 *
 * These fixtures intentionally use the hackathon pack's normalized contract;
 * they are not account data or production API payloads.
 */
import type { OmiSeed } from '../types';

/** A live capture with enough adjacent context to prototype an in-the-moment UI. */
export const recordingScenario = {
  me: {
    id: 'person-recording-me',
    name: 'Avery North',
    relationship: 'You',
    lastSeenAt: '2026-07-20T15:09:00.000Z',
  },
  device: {
    id: 'omi-recording',
    name: 'Omi Field Note',
    connection: 'connected',
    batteryPercent: 68,
    firmwareVersion: '3.1.0',
    lastSyncedAt: '2026-07-20T15:09:20.000Z',
  },
  capture: {
    id: 'capture-recording',
    status: 'capturing',
    startedAt: '2026-07-20T15:10:00.000Z',
    liveTranscript: [
      { id: 'live-rec-1', speaker: 'Avery North', text: 'Let us keep the next review small enough to finish today.', startedAt: '2026-07-20T15:10:03.000Z', endedAt: '2026-07-20T15:10:08.000Z' },
      { id: 'live-rec-2', speaker: 'Mina Sol', text: 'I can bring the two examples that made the handoff confusing.', startedAt: '2026-07-20T15:10:10.000Z', endedAt: '2026-07-20T15:10:16.000Z' },
      { id: 'live-rec-3', speaker: 'Avery North', text: 'Please mark the decision and leave the open question visible.', startedAt: '2026-07-20T15:10:18.000Z', endedAt: '2026-07-20T15:10:25.000Z' },
      { id: 'live-rec-4', speaker: 'Mina Sol', text: 'The open question is whether a compact summary is enough on mobile.', startedAt: '2026-07-20T15:10:27.000Z', endedAt: '2026-07-20T15:10:36.000Z' },
      { id: 'live-rec-5', speaker: 'Avery North', text: 'We can test that after this capture and compare the two paths.', startedAt: '2026-07-20T15:10:39.000Z', endedAt: '2026-07-20T15:10:47.000Z' },
      { id: 'live-rec-6', speaker: 'Jo Reed', text: 'I will watch for anything that needs a follow-up owner.', startedAt: '2026-07-20T15:10:50.000Z', endedAt: '2026-07-20T15:10:56.000Z' },
    ],
  },
  people: [
    { id: 'person-recording-me', name: 'Avery North', relationship: 'You', lastSeenAt: '2026-07-20T15:09:00.000Z' },
    { id: 'person-recording-mina', name: 'Mina Sol', relationship: 'Project partner', lastSeenAt: '2026-07-20T15:10:36.000Z' },
    { id: 'person-recording-jo', name: 'Jo Reed', relationship: 'Facilitator', lastSeenAt: '2026-07-20T15:10:56.000Z' },
    { id: 'person-recording-kai', name: 'Kai Rowan', relationship: 'Research partner', lastSeenAt: '2026-07-19T17:40:00.000Z' },
    { id: 'person-recording-nia', name: 'Nia Vale', relationship: 'Teammate', lastSeenAt: '2026-07-18T12:22:00.000Z' },
  ],
  conversations: [
    {
      id: 'conv-recording-handoff',
      title: 'Handoff rehearsal: keep the decision visible',
      startedAt: '2026-07-20T15:10:00.000Z',
      updatedAt: '2026-07-20T15:10:56.000Z',
      source: 'device',
      summary: 'A live rehearsal is testing a compact review flow, with one decision and one open question kept in view.',
      people: ['person-recording-me', 'person-recording-mina', 'person-recording-jo'],
      segments: [
        { id: 'seg-rec-handoff-1', speaker: 'Avery North', text: 'Let us keep the next review small enough to finish today.', startedAt: '2026-07-20T15:10:03.000Z', endedAt: '2026-07-20T15:10:08.000Z' },
        { id: 'seg-rec-handoff-2', speaker: 'Mina Sol', text: 'I can bring the two examples that made the handoff confusing.', startedAt: '2026-07-20T15:10:10.000Z', endedAt: '2026-07-20T15:10:16.000Z' },
        { id: 'seg-rec-handoff-3', speaker: 'Avery North', text: 'Please mark the decision and leave the open question visible.', startedAt: '2026-07-20T15:10:18.000Z', endedAt: '2026-07-20T15:10:25.000Z' },
        { id: 'seg-rec-handoff-4', speaker: 'Mina Sol', text: 'The open question is whether a compact summary is enough on mobile.', startedAt: '2026-07-20T15:10:27.000Z', endedAt: '2026-07-20T15:10:36.000Z' },
        { id: 'seg-rec-handoff-5', speaker: 'Avery North', text: 'We can test that after this capture and compare the two paths.', startedAt: '2026-07-20T15:10:39.000Z', endedAt: '2026-07-20T15:10:47.000Z' },
        { id: 'seg-rec-handoff-6', speaker: 'Jo Reed', text: 'I will watch for anything that needs a follow-up owner.', startedAt: '2026-07-20T15:10:50.000Z', endedAt: '2026-07-20T15:10:56.000Z' },
      ],
    },
    {
      id: 'conv-recording-checkin',
      title: 'Morning check-in: one useful thread',
      startedAt: '2026-07-20T09:05:00.000Z',
      updatedAt: '2026-07-20T09:28:00.000Z',
      source: 'macos',
      summary: 'A short check-in narrowed the day to one experiment, one owner, and a quiet review later.',
      people: ['person-recording-me', 'person-recording-nia'],
      segments: [
        { id: 'seg-rec-checkin-1', speaker: 'Avery North', text: 'I want the next experiment to answer one question clearly.', startedAt: '2026-07-20T09:05:06.000Z', endedAt: '2026-07-20T09:05:13.000Z' },
        { id: 'seg-rec-checkin-2', speaker: 'Nia Vale', text: 'I will own the small test and report back before lunch.', startedAt: '2026-07-20T09:05:15.000Z', endedAt: '2026-07-20T09:05:22.000Z' },
        { id: 'seg-rec-checkin-3', speaker: 'Avery North', text: 'Then leave the rest as notes instead of new work.', startedAt: '2026-07-20T09:27:30.000Z', endedAt: '2026-07-20T09:28:00.000Z' },
      ],
    },
    {
      id: 'conv-recording-retro',
      title: 'Retro notes: find the quiet signal',
      startedAt: '2026-07-18T16:20:00.000Z',
      updatedAt: '2026-07-18T16:58:00.000Z',
      source: 'device',
      summary: 'The group noticed that small follow-ups disappear when the interface shows every detail at once.',
      people: ['person-recording-me', 'person-recording-kai', 'person-recording-nia'],
      segments: [
        { id: 'seg-rec-retro-1', speaker: 'Kai Rowan', text: 'The important part was hidden under a complete transcript.', startedAt: '2026-07-18T16:22:00.000Z', endedAt: '2026-07-18T16:22:08.000Z' },
        { id: 'seg-rec-retro-2', speaker: 'Nia Vale', text: 'A short list of choices would help me return to the work.', startedAt: '2026-07-18T16:38:00.000Z', endedAt: '2026-07-18T16:38:10.000Z' },
        { id: 'seg-rec-retro-3', speaker: 'Avery North', text: 'Let us make the next prototype prove that return path.', startedAt: '2026-07-18T16:56:00.000Z', endedAt: '2026-07-18T16:58:00.000Z' },
      ],
    },
  ],
  memories: [
    { id: 'mem-rec-1', text: 'Avery prefers a short daily review that separates decisions from open questions.', kind: 'preference', createdAt: '2026-07-20T09:28:00.000Z', relevance: 0.98, people: ['person-recording-me'], sourceConversationId: 'conv-recording-checkin' },
    { id: 'mem-rec-2', text: 'Mina can bring concrete handoff examples to the next review.', kind: 'commitment', createdAt: '2026-07-20T15:10:16.000Z', relevance: 0.95, people: ['person-recording-mina'], sourceConversationId: 'conv-recording-handoff' },
    { id: 'mem-rec-3', text: 'Jo watches for follow-up owners when a conversation creates several threads.', kind: 'relationship', createdAt: '2026-07-20T15:10:56.000Z', relevance: 0.88, people: ['person-recording-jo'], sourceConversationId: 'conv-recording-handoff' },
    { id: 'mem-rec-4', text: 'The mobile review experiment should compare a compact summary with a full transcript.', kind: 'commitment', createdAt: '2026-07-20T15:10:36.000Z', relevance: 0.93, people: ['person-recording-me', 'person-recording-mina'], sourceConversationId: 'conv-recording-handoff' },
    { id: 'mem-rec-5', text: 'Nia owns the small test from the morning check-in.', kind: 'commitment', createdAt: '2026-07-20T09:28:00.000Z', relevance: 0.91, people: ['person-recording-nia'], sourceConversationId: 'conv-recording-checkin' },
    { id: 'mem-rec-6', text: 'Kai noticed that complete transcripts can hide a useful signal.', kind: 'insight', createdAt: '2026-07-18T16:38:00.000Z', relevance: 0.86, people: ['person-recording-kai'], sourceConversationId: 'conv-recording-retro' },
    { id: 'mem-rec-7', text: 'The next prototype should make returning to an unfinished thread feel lightweight.', kind: 'insight', createdAt: '2026-07-18T16:58:00.000Z', relevance: 0.84, people: ['person-recording-me'], sourceConversationId: 'conv-recording-retro' },
    { id: 'mem-rec-8', text: 'A clear privacy indicator belongs beside any live capture control.', kind: 'preference', createdAt: '2026-07-20T15:09:20.000Z', relevance: 0.9, people: ['person-recording-me'] },
  ],
  apps: [
    { id: 'app-rec-calendar', name: 'Calendar', description: 'Provides synthetic schedule context for review moments.', category: 'Productivity', connected: true },
    { id: 'app-rec-notes', name: 'Notes', description: 'Stores local scratch notes for a handoff.', category: 'Knowledge', connected: true },
    { id: 'app-rec-tasks', name: 'Tasks', description: 'Keeps owners and follow-ups near captured context.', category: 'Productivity', connected: true },
    { id: 'app-rec-chat', name: 'Team chat', description: 'Optional context from the project room.', category: 'Communication', connected: false },
  ],
  actions: [
    { id: 'action-rec-1', title: 'Capture the two handoff examples', status: 'open', dueAt: '2026-07-20T16:00:00.000Z', conversationId: 'conv-recording-handoff' },
    { id: 'action-rec-2', title: 'Compare compact and full review on mobile', status: 'open', dueAt: '2026-07-21T11:00:00.000Z', conversationId: 'conv-recording-handoff' },
    { id: 'action-rec-3', title: 'Check in with Nia about the small test', status: 'done', dueAt: '2026-07-20T13:00:00.000Z', conversationId: 'conv-recording-checkin' },
    { id: 'action-rec-4', title: 'Write the privacy cue into the prototype notes', status: 'open', conversationId: 'conv-recording-retro' },
    { id: 'action-rec-5', title: 'Assign a follow-up owner before stopping capture', status: 'open', conversationId: 'conv-recording-handoff' },
  ],
} satisfies OmiSeed;

/** A just-stopped capture that remains visibly processing while old context stays usable. */
export const processingScenario = {
  me: {
    id: 'person-processing-me',
    name: 'Morgan Reed',
    relationship: 'You',
    lastSeenAt: '2026-07-20T14:21:00.000Z',
  },
  device: {
    id: 'omi-processing',
    name: 'Omi Desk Note',
    connection: 'connected',
    batteryPercent: 42,
    firmwareVersion: '3.0.9',
    lastSyncedAt: '2026-07-20T14:21:10.000Z',
  },
  capture: {
    id: 'capture-processing',
    status: 'processing',
    startedAt: '2026-07-20T14:00:00.000Z',
    liveTranscript: [
      { id: 'live-proc-1', speaker: 'Morgan Reed', text: 'We have a decision on the first release slice.', startedAt: '2026-07-20T14:00:05.000Z', endedAt: '2026-07-20T14:00:12.000Z' },
      { id: 'live-proc-2', speaker: 'Tess Rowan', text: 'The remaining question is how much context to show by default.', startedAt: '2026-07-20T14:04:00.000Z', endedAt: '2026-07-20T14:04:09.000Z' },
      { id: 'live-proc-3', speaker: 'Morgan Reed', text: 'Keep the first view calm and let people expand when they need detail.', startedAt: '2026-07-20T14:09:00.000Z', endedAt: '2026-07-20T14:09:13.000Z' },
      { id: 'live-proc-4', speaker: 'Tess Rowan', text: 'I will sketch the expanded state before tomorrow morning.', startedAt: '2026-07-20T14:12:00.000Z', endedAt: '2026-07-20T14:12:10.000Z' },
      { id: 'live-proc-5', speaker: 'Morgan Reed', text: 'Please include the decision and owner in the first summary.', startedAt: '2026-07-20T14:18:00.000Z', endedAt: '2026-07-20T14:18:11.000Z' },
    ],
  },
  people: [
    { id: 'person-processing-me', name: 'Morgan Reed', relationship: 'You', lastSeenAt: '2026-07-20T14:21:00.000Z' },
    { id: 'person-processing-tess', name: 'Tess Rowan', relationship: 'Design partner', lastSeenAt: '2026-07-20T14:12:10.000Z' },
    { id: 'person-processing-eli', name: 'Eli Park', relationship: 'Engineer', lastSeenAt: '2026-07-19T18:05:00.000Z' },
    { id: 'person-processing-rue', name: 'Rue Chen', relationship: 'Research partner', lastSeenAt: '2026-07-18T10:30:00.000Z' },
  ],
  conversations: [
    {
      id: 'conv-processing-release',
      title: 'Release slice review',
      startedAt: '2026-07-20T14:00:00.000Z',
      updatedAt: '2026-07-20T14:21:00.000Z',
      source: 'device',
      summary: 'A finished capture is being organized into a decision, an owner, and a follow-up question.',
      people: ['person-processing-me', 'person-processing-tess'],
      segments: [
        { id: 'seg-proc-release-1', speaker: 'Morgan Reed', text: 'We have a decision on the first release slice.', startedAt: '2026-07-20T14:00:05.000Z', endedAt: '2026-07-20T14:00:12.000Z' },
        { id: 'seg-proc-release-2', speaker: 'Tess Rowan', text: 'The remaining question is how much context to show by default.', startedAt: '2026-07-20T14:04:00.000Z', endedAt: '2026-07-20T14:04:09.000Z' },
        { id: 'seg-proc-release-3', speaker: 'Morgan Reed', text: 'Keep the first view calm and let people expand when they need detail.', startedAt: '2026-07-20T14:09:00.000Z', endedAt: '2026-07-20T14:09:13.000Z' },
        { id: 'seg-proc-release-4', speaker: 'Tess Rowan', text: 'I will sketch the expanded state before tomorrow morning.', startedAt: '2026-07-20T14:12:00.000Z', endedAt: '2026-07-20T14:12:10.000Z' },
        { id: 'seg-proc-release-5', speaker: 'Morgan Reed', text: 'Please include the decision and owner in the first summary.', startedAt: '2026-07-20T14:18:00.000Z', endedAt: '2026-07-20T14:18:11.000Z' },
      ],
    },
    {
      id: 'conv-processing-research',
      title: 'Research debrief: returning to context',
      startedAt: '2026-07-19T17:15:00.000Z',
      updatedAt: '2026-07-19T17:48:00.000Z',
      source: 'macos',
      summary: 'Rue described a need to recover the thread behind a decision without replaying every sentence.',
      people: ['person-processing-me', 'person-processing-rue'],
      segments: [
        { id: 'seg-proc-research-1', speaker: 'Rue Chen', text: 'I need the reason behind a choice when I return a week later.', startedAt: '2026-07-19T17:17:00.000Z', endedAt: '2026-07-19T17:17:10.000Z' },
        { id: 'seg-proc-research-2', speaker: 'Morgan Reed', text: 'A linked memory should make the path back to the source obvious.', startedAt: '2026-07-19T17:40:00.000Z', endedAt: '2026-07-19T17:40:12.000Z' },
      ],
    },
    {
      id: 'conv-processing-standup',
      title: 'Standup: owner check',
      startedAt: '2026-07-18T09:10:00.000Z',
      updatedAt: '2026-07-18T09:24:00.000Z',
      source: 'device',
      summary: 'The team assigned one owner to the next test and parked the rest for later.',
      people: ['person-processing-me', 'person-processing-eli'],
      segments: [
        { id: 'seg-proc-standup-1', speaker: 'Eli Park', text: 'I will own the instrumentation check.', startedAt: '2026-07-18T09:12:00.000Z', endedAt: '2026-07-18T09:12:08.000Z' },
        { id: 'seg-proc-standup-2', speaker: 'Morgan Reed', text: 'The rest can wait until we see that first result.', startedAt: '2026-07-18T09:20:00.000Z', endedAt: '2026-07-18T09:20:08.000Z' },
      ],
    },
  ],
  memories: [
    { id: 'mem-proc-1', text: 'The first release slice should show the decision and its owner immediately.', kind: 'insight', createdAt: '2026-07-20T14:21:00.000Z', relevance: 0.97, people: ['person-processing-me', 'person-processing-tess'], sourceConversationId: 'conv-processing-release' },
    { id: 'mem-proc-2', text: 'Tess will sketch the expanded context state before tomorrow morning.', kind: 'commitment', createdAt: '2026-07-20T14:12:10.000Z', relevance: 0.94, people: ['person-processing-tess'], sourceConversationId: 'conv-processing-release' },
    { id: 'mem-proc-3', text: 'Morgan wants progressive disclosure instead of a dense first view.', kind: 'preference', createdAt: '2026-07-20T14:09:13.000Z', relevance: 0.92, people: ['person-processing-me'], sourceConversationId: 'conv-processing-release' },
    { id: 'mem-proc-4', text: 'Rue values a clear path from a memory back to its source conversation.', kind: 'preference', createdAt: '2026-07-19T17:48:00.000Z', relevance: 0.88, people: ['person-processing-rue'], sourceConversationId: 'conv-processing-research' },
    { id: 'mem-proc-5', text: 'Eli owns the instrumentation check from standup.', kind: 'commitment', createdAt: '2026-07-18T09:24:00.000Z', relevance: 0.85, people: ['person-processing-eli'], sourceConversationId: 'conv-processing-standup' },
    { id: 'mem-proc-6', text: 'The team parks low-confidence follow-ups until the first result arrives.', kind: 'insight', createdAt: '2026-07-18T09:24:00.000Z', relevance: 0.82, people: ['person-processing-me', 'person-processing-eli'], sourceConversationId: 'conv-processing-standup' },
    { id: 'mem-proc-7', text: 'Processing should preserve a readable live transcript while extraction is pending.', kind: 'preference', createdAt: '2026-07-20T14:21:00.000Z', relevance: 0.9, people: ['person-processing-me'] },
  ],
  apps: [
    { id: 'app-proc-calendar', name: 'Calendar', description: 'Adds synthetic timing context to the pending capture.', category: 'Productivity', connected: true },
    { id: 'app-proc-notes', name: 'Notes', description: 'Offers a local handoff for extracted highlights.', category: 'Knowledge', connected: true },
    { id: 'app-proc-tasks', name: 'Tasks', description: 'Turns a confirmed owner into a follow-up.', category: 'Productivity', connected: true },
    { id: 'app-proc-mail', name: 'Mail', description: 'Optional destination for a finished summary.', category: 'Communication', connected: false },
  ],
  actions: [
    { id: 'action-proc-1', title: 'Wait for the release review to finish processing', status: 'open', conversationId: 'conv-processing-release' },
    { id: 'action-proc-2', title: 'Review the decision and owner together', status: 'open', dueAt: '2026-07-20T17:00:00.000Z', conversationId: 'conv-processing-release' },
    { id: 'action-proc-3', title: 'Check Tess sketch tomorrow morning', status: 'open', dueAt: '2026-07-21T10:00:00.000Z', conversationId: 'conv-processing-release' },
    { id: 'action-proc-4', title: 'Confirm the instrumentation result', status: 'done', conversationId: 'conv-processing-standup' },
    { id: 'action-proc-5', title: 'Open the source behind the research memory', status: 'open', conversationId: 'conv-processing-research' },
  ],
} satisfies OmiSeed;

/** Local context remains readable while an unavailable device offers a recoverable path. */
export const offlineRecoveryScenario = {
  me: {
    id: 'person-offline-me',
    name: 'Nico Vale',
    relationship: 'You',
    lastSeenAt: '2026-07-20T12:05:00.000Z',
  },
  device: {
    id: 'omi-offline',
    name: 'Omi Pocket Note',
    connection: 'disconnected',
    batteryPercent: 14,
    firmwareVersion: '3.0.7',
    lastSyncedAt: '2026-07-20T12:05:00.000Z',
  },
  capture: {
    id: 'capture-offline',
    status: 'idle',
    liveTranscript: [],
  },
  people: [
    { id: 'person-offline-me', name: 'Nico Vale', relationship: 'You', lastSeenAt: '2026-07-20T12:05:00.000Z' },
    { id: 'person-offline-uma', name: 'Uma Lake', relationship: 'Project partner', lastSeenAt: '2026-07-19T15:40:00.000Z' },
    { id: 'person-offline-ian', name: 'Ian Moss', relationship: 'Teammate', lastSeenAt: '2026-07-19T11:05:00.000Z' },
    { id: 'person-offline-sage', name: 'Sage Lin', relationship: 'Research partner', lastSeenAt: '2026-07-17T17:12:00.000Z' },
    { id: 'person-offline-drew', name: 'Drew Sol', relationship: 'Collaborator', lastSeenAt: '2026-07-16T13:08:00.000Z' },
  ],
  conversations: [
    {
      id: 'conv-offline-planning',
      title: 'Planning note: choose a safe fallback',
      startedAt: '2026-07-20T11:20:00.000Z',
      updatedAt: '2026-07-20T12:05:00.000Z',
      source: 'device',
      summary: 'Nico and Uma chose a local-first fallback so the work remains available during a connection gap.',
      people: ['person-offline-me', 'person-offline-uma'],
      segments: [
        { id: 'seg-offline-planning-1', speaker: 'Nico Vale', text: 'If the connection drops, the last synced context should remain useful.', startedAt: '2026-07-20T11:22:00.000Z', endedAt: '2026-07-20T11:22:10.000Z' },
        { id: 'seg-offline-planning-2', speaker: 'Uma Lake', text: 'Show the gap plainly and offer a single retry when the device is nearby.', startedAt: '2026-07-20T11:45:00.000Z', endedAt: '2026-07-20T11:45:12.000Z' },
        { id: 'seg-offline-planning-3', speaker: 'Nico Vale', text: 'Do not hide the notes people already trusted to the app.', startedAt: '2026-07-20T12:03:00.000Z', endedAt: '2026-07-20T12:05:00.000Z' },
      ],
    },
    {
      id: 'conv-offline-test',
      title: 'Test review: battery handoff',
      startedAt: '2026-07-19T14:30:00.000Z',
      updatedAt: '2026-07-19T15:40:00.000Z',
      source: 'macos',
      summary: 'The group identified a low-battery handoff as a moment that needs an explicit next step.',
      people: ['person-offline-me', 'person-offline-uma', 'person-offline-ian'],
      segments: [
        { id: 'seg-offline-test-1', speaker: 'Ian Moss', text: 'A low battery should explain what is still local and what must wait.', startedAt: '2026-07-19T14:32:00.000Z', endedAt: '2026-07-19T14:32:12.000Z' },
        { id: 'seg-offline-test-2', speaker: 'Uma Lake', text: 'A retry button is useful only if the reason for retrying is clear.', startedAt: '2026-07-19T15:20:00.000Z', endedAt: '2026-07-19T15:20:11.000Z' },
        { id: 'seg-offline-test-3', speaker: 'Nico Vale', text: 'The recovery path can be short without pretending the device is online.', startedAt: '2026-07-19T15:38:00.000Z', endedAt: '2026-07-19T15:40:00.000Z' },
      ],
    },
    {
      id: 'conv-offline-research',
      title: 'Research readout: durable context',
      startedAt: '2026-07-17T16:30:00.000Z',
      updatedAt: '2026-07-17T17:12:00.000Z',
      source: 'device',
      summary: 'Sage described why a durable local record matters when a person moves between places.',
      people: ['person-offline-me', 'person-offline-sage'],
      segments: [
        { id: 'seg-offline-research-1', speaker: 'Sage Lin', text: 'A useful record should travel with the person, not with a perfect connection.', startedAt: '2026-07-17T16:35:00.000Z', endedAt: '2026-07-17T16:35:10.000Z' },
        { id: 'seg-offline-research-2', speaker: 'Nico Vale', text: 'Then the sync timestamp needs to be part of the trust signal.', startedAt: '2026-07-17T17:08:00.000Z', endedAt: '2026-07-17T17:12:00.000Z' },
      ],
    },
    {
      id: 'conv-offline-retro',
      title: 'Retro: reconnect without losing the thread',
      startedAt: '2026-07-16T12:30:00.000Z',
      updatedAt: '2026-07-16T13:08:00.000Z',
      source: 'macos',
      summary: 'A prior retro named a concise reconnect explanation as the smallest trustworthy recovery step.',
      people: ['person-offline-me', 'person-offline-drew'],
      segments: [
        { id: 'seg-offline-retro-1', speaker: 'Drew Sol', text: 'Recovery feels safer when the app says what it last knows.', startedAt: '2026-07-16T12:34:00.000Z', endedAt: '2026-07-16T12:34:12.000Z' },
        { id: 'seg-offline-retro-2', speaker: 'Nico Vale', text: 'Keep the saved thread open while reconnecting in the background.', startedAt: '2026-07-16T13:02:00.000Z', endedAt: '2026-07-16T13:08:00.000Z' },
      ],
    },
  ],
  memories: [
    { id: 'mem-offline-1', text: 'Nico wants last-synced context to remain readable during a connection gap.', kind: 'preference', createdAt: '2026-07-20T12:05:00.000Z', relevance: 0.98, people: ['person-offline-me'], sourceConversationId: 'conv-offline-planning' },
    { id: 'mem-offline-2', text: 'Uma prefers a single retry with a clear reason instead of repeated automatic attempts.', kind: 'preference', createdAt: '2026-07-20T11:45:00.000Z', relevance: 0.92, people: ['person-offline-uma'], sourceConversationId: 'conv-offline-planning' },
    { id: 'mem-offline-3', text: 'The offline state should disclose exactly when the device last synced.', kind: 'insight', createdAt: '2026-07-17T17:12:00.000Z', relevance: 0.95, people: ['person-offline-me', 'person-offline-sage'], sourceConversationId: 'conv-offline-research' },
    { id: 'mem-offline-4', text: 'Ian raised low battery as a separate handoff from a disconnected device.', kind: 'insight', createdAt: '2026-07-19T14:32:12.000Z', relevance: 0.89, people: ['person-offline-ian'], sourceConversationId: 'conv-offline-test' },
    { id: 'mem-offline-5', text: 'Sage values context that travels without a perfect network.', kind: 'preference', createdAt: '2026-07-17T16:35:10.000Z', relevance: 0.87, people: ['person-offline-sage'], sourceConversationId: 'conv-offline-research' },
    { id: 'mem-offline-6', text: 'Drew recommends showing the last known state during recovery.', kind: 'insight', createdAt: '2026-07-16T12:34:12.000Z', relevance: 0.84, people: ['person-offline-drew'], sourceConversationId: 'conv-offline-retro' },
    { id: 'mem-offline-7', text: 'The saved thread should stay open while a reconnect attempt is pending.', kind: 'preference', createdAt: '2026-07-16T13:08:00.000Z', relevance: 0.83, people: ['person-offline-me'], sourceConversationId: 'conv-offline-retro' },
    { id: 'mem-offline-8', text: 'Local notes are not proof that the device is currently connected.', kind: 'insight', createdAt: '2026-07-20T12:05:00.000Z', relevance: 0.81, people: ['person-offline-me'] },
    { id: 'mem-offline-9', text: 'Battery below twenty percent should make the next sync expectation explicit.', kind: 'fact', createdAt: '2026-07-19T15:40:00.000Z', relevance: 0.8, people: ['person-offline-me', 'person-offline-uma'], sourceConversationId: 'conv-offline-test' },
    { id: 'mem-offline-10', text: 'A recovery explanation can be concise and still preserve trust.', kind: 'insight', createdAt: '2026-07-16T13:08:00.000Z', relevance: 0.79, people: ['person-offline-me', 'person-offline-drew'], sourceConversationId: 'conv-offline-retro' },
  ],
  apps: [
    { id: 'app-offline-calendar', name: 'Calendar', description: 'Cached schedule context remains available locally.', category: 'Productivity', connected: true },
    { id: 'app-offline-notes', name: 'Notes', description: 'Local notes remain readable while sync is unavailable.', category: 'Knowledge', connected: true },
    { id: 'app-offline-tasks', name: 'Tasks', description: 'Open follow-ups can still be reviewed offline.', category: 'Productivity', connected: true },
    { id: 'app-offline-chat', name: 'Team chat', description: 'Fresh team context is unavailable until reconnect.', category: 'Communication', connected: false },
    { id: 'app-offline-drive', name: 'Drive', description: 'Remote documents are waiting for a connection.', category: 'Files', connected: false },
  ],
  actions: [
    { id: 'action-offline-1', title: 'Move closer to the device and retry connection', status: 'open', dueAt: '2026-07-20T12:30:00.000Z', conversationId: 'conv-offline-planning' },
    { id: 'action-offline-2', title: 'Review the last synced planning note', status: 'open', conversationId: 'conv-offline-planning' },
    { id: 'action-offline-3', title: 'Charge the device before the next capture', status: 'open', dueAt: '2026-07-20T18:00:00.000Z', conversationId: 'conv-offline-test' },
    { id: 'action-offline-4', title: 'Keep the saved thread visible during retry', status: 'done', conversationId: 'conv-offline-retro' },
    { id: 'action-offline-5', title: 'Check the sync timestamp after reconnect', status: 'open', conversationId: 'conv-offline-research' },
    { id: 'action-offline-6', title: 'Send the recovery behavior note when online', status: 'open', conversationId: 'conv-offline-retro' },
  ],
} satisfies OmiSeed;

/** Populated data with a deliberate no-match query path for search empty states. */
export const emptySearchScenario = {
  me: {
    id: 'person-search-me',
    name: 'Riley West',
    relationship: 'You',
    lastSeenAt: '2026-07-20T10:15:00.000Z',
  },
  device: {
    id: 'omi-search',
    name: 'Omi Quiet Clip',
    connection: 'connected',
    batteryPercent: 91,
    firmwareVersion: '3.1.0',
    lastSyncedAt: '2026-07-20T10:15:00.000Z',
  },
  capture: {
    id: 'capture-search',
    status: 'idle',
    liveTranscript: [],
  },
  people: [
    { id: 'person-search-me', name: 'Riley West', relationship: 'You', lastSeenAt: '2026-07-20T10:15:00.000Z' },
    { id: 'person-search-arden', name: 'Arden Pike', relationship: 'Teammate', lastSeenAt: '2026-07-19T16:05:00.000Z' },
    { id: 'person-search-bea', name: 'Bea Moss', relationship: 'Project partner', lastSeenAt: '2026-07-18T14:35:00.000Z' },
  ],
  conversations: [
    {
      id: 'conv-search-signal',
      title: 'Signal review',
      startedAt: '2026-07-20T09:40:00.000Z',
      updatedAt: '2026-07-20T10:15:00.000Z',
      source: 'macos',
      summary: 'Riley and Arden compared three signals and chose one small follow-up.',
      people: ['person-search-me', 'person-search-arden'],
      segments: [
        { id: 'seg-search-signal-1', speaker: 'Riley West', text: 'The useful signal is the one we can explain in one sentence.', startedAt: '2026-07-20T09:42:00.000Z', endedAt: '2026-07-20T09:42:10.000Z' },
        { id: 'seg-search-signal-2', speaker: 'Arden Pike', text: 'I will test that explanation with the next small group.', startedAt: '2026-07-20T10:05:00.000Z', endedAt: '2026-07-20T10:15:00.000Z' },
      ],
    },
    {
      id: 'conv-search-brief',
      title: 'Briefing: make the next step obvious',
      startedAt: '2026-07-19T15:10:00.000Z',
      updatedAt: '2026-07-19T16:05:00.000Z',
      source: 'device',
      summary: 'A brief conversation made one next step obvious and parked a larger idea.',
      people: ['person-search-me', 'person-search-arden', 'person-search-bea'],
      segments: [
        { id: 'seg-search-brief-1', speaker: 'Bea Moss', text: 'The next step should be visible before the larger idea.', startedAt: '2026-07-19T15:20:00.000Z', endedAt: '2026-07-19T15:20:12.000Z' },
        { id: 'seg-search-brief-2', speaker: 'Riley West', text: 'Link the larger idea so it is not lost, but do not lead with it.', startedAt: '2026-07-19T15:55:00.000Z', endedAt: '2026-07-19T16:05:00.000Z' },
      ],
    },
    {
      id: 'conv-search-retro',
      title: 'Retro: search by meaning',
      startedAt: '2026-07-18T13:50:00.000Z',
      updatedAt: '2026-07-18T14:35:00.000Z',
      source: 'macos',
      summary: 'The team wants search to feel useful even when a phrase is not repeated verbatim.',
      people: ['person-search-me', 'person-search-bea'],
      segments: [
        { id: 'seg-search-retro-1', speaker: 'Riley West', text: 'A no-match result should invite a better query, not imply missing history.', startedAt: '2026-07-18T13:52:00.000Z', endedAt: '2026-07-18T13:52:12.000Z' },
        { id: 'seg-search-retro-2', speaker: 'Bea Moss', text: 'Show nearby topics so the person can recover their intent.', startedAt: '2026-07-18T14:20:00.000Z', endedAt: '2026-07-18T14:35:00.000Z' },
      ],
    },
  ],
  memories: [
    { id: 'mem-search-1', text: 'Riley prefers search results that explain why a memory matches.', kind: 'preference', createdAt: '2026-07-18T14:35:00.000Z', relevance: 0.94, people: ['person-search-me'], sourceConversationId: 'conv-search-retro' },
    { id: 'mem-search-2', text: 'Arden will test the one-sentence signal with a small group.', kind: 'commitment', createdAt: '2026-07-20T10:15:00.000Z', relevance: 0.9, people: ['person-search-arden'], sourceConversationId: 'conv-search-signal' },
    { id: 'mem-search-3', text: 'Bea likes a visible next step with a link to the larger idea.', kind: 'preference', createdAt: '2026-07-19T16:05:00.000Z', relevance: 0.88, people: ['person-search-bea'], sourceConversationId: 'conv-search-brief' },
    { id: 'mem-search-4', text: 'Search empty states should offer nearby topics instead of a blank wall.', kind: 'insight', createdAt: '2026-07-18T14:35:00.000Z', relevance: 0.86, people: ['person-search-me', 'person-search-bea'], sourceConversationId: 'conv-search-retro' },
    { id: 'mem-search-5', text: 'A useful signal can be explained in one sentence.', kind: 'fact', createdAt: '2026-07-20T10:15:00.000Z', relevance: 0.83, people: ['person-search-me', 'person-search-arden'], sourceConversationId: 'conv-search-signal' },
    { id: 'mem-search-6', text: 'The larger idea is parked rather than discarded.', kind: 'insight', createdAt: '2026-07-19T16:05:00.000Z', relevance: 0.79, people: ['person-search-me', 'person-search-bea'], sourceConversationId: 'conv-search-brief' },
  ],
  apps: [
    { id: 'app-search-calendar', name: 'Calendar', description: 'Adds timing context to nearby search results.', category: 'Productivity', connected: true },
    { id: 'app-search-notes', name: 'Notes', description: 'Provides a second local source for related terms.', category: 'Knowledge', connected: true },
    { id: 'app-search-tasks', name: 'Tasks', description: 'Surfaces action links beside matching memories.', category: 'Productivity', connected: false },
  ],
  actions: [
    { id: 'action-search-1', title: 'Try a broader meaning-based query', status: 'open' },
    { id: 'action-search-2', title: 'Open the signal review as nearby context', status: 'open', conversationId: 'conv-search-signal' },
    { id: 'action-search-3', title: 'Check Arden\'s small-group test', status: 'open', dueAt: '2026-07-21T12:00:00.000Z', conversationId: 'conv-search-signal' },
    { id: 'action-search-4', title: 'Keep the parked idea linked', status: 'done', conversationId: 'conv-search-brief' },
  ],
} satisfies OmiSeed;
