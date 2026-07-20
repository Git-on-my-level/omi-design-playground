import type { OmiSnapshot } from './types';

export const defaultOmiSeed: OmiSnapshot = {
  me: {
    id: 'person-me',
    name: 'Alex Morgan',
    relationship: 'You',
    lastSeenAt: '2026-07-20T14:00:00.000Z',
  },
  device: {
    id: 'omi-001',
    name: 'Omi',
    connection: 'connected',
    batteryPercent: 82,
    firmwareVersion: '3.0.8',
    lastSyncedAt: '2026-07-20T14:02:00.000Z',
  },
  capture: { id: 'capture-current', status: 'idle', liveTranscript: [] },
  people: [
    { id: 'person-me', name: 'Alex Morgan', relationship: 'You', lastSeenAt: '2026-07-20T14:00:00.000Z' },
    { id: 'person-sam', name: 'Sam Rivera', relationship: 'Design partner', lastSeenAt: '2026-07-20T13:28:00.000Z' },
    { id: 'person-jordan', name: 'Jordan Lee', relationship: 'Teammate', lastSeenAt: '2026-07-18T16:30:00.000Z' },
  ],
  conversations: [
    {
      id: 'conv-design-review',
      title: 'Design review: better ways to revisit a day',
      startedAt: '2026-07-20T13:00:00.000Z',
      updatedAt: '2026-07-20T13:28:00.000Z',
      source: 'device',
      summary: 'Sam and Alex explored a calmer daily review that surfaces decisions, loose ends, and meaningful moments.',
      people: ['person-me', 'person-sam'],
      segments: [
        { id: 'seg-1', speaker: 'Alex Morgan', text: 'I want the day to feel understandable without reading a transcript.', startedAt: '2026-07-20T13:00:00.000Z', endedAt: '2026-07-20T13:00:08.000Z' },
        { id: 'seg-2', speaker: 'Sam Rivera', text: 'Then the interface should lead with moments and choices, not a dense list.', startedAt: '2026-07-20T13:00:09.000Z', endedAt: '2026-07-20T13:00:19.000Z' },
      ],
    },
    {
      id: 'conv-planning',
      title: 'Tuesday planning',
      startedAt: '2026-07-18T16:00:00.000Z',
      updatedAt: '2026-07-18T16:30:00.000Z',
      source: 'macos',
      summary: 'Alex and Jordan set a small experiment plan and agreed to reconnect next week.',
      people: ['person-me', 'person-jordan'],
      segments: [],
    },
  ],
  memories: [
    { id: 'mem-1', text: 'Alex prefers a quiet daily review that highlights decisions over a complete log.', kind: 'preference', createdAt: '2026-07-20T13:28:00.000Z', people: ['person-me'], sourceConversationId: 'conv-design-review' },
    { id: 'mem-2', text: 'Sam is a design partner focused on making information feel less overwhelming.', kind: 'relationship', createdAt: '2026-07-20T13:28:00.000Z', people: ['person-sam'], sourceConversationId: 'conv-design-review' },
    { id: 'mem-3', text: 'Reconnect with Jordan next week to review the experiment.', kind: 'commitment', createdAt: '2026-07-18T16:30:00.000Z', people: ['person-me', 'person-jordan'], sourceConversationId: 'conv-planning' },
  ],
  apps: [
    { id: 'app-calendar', name: 'Calendar', description: 'Makes commitments and schedule context available.', category: 'Productivity', connected: true },
    { id: 'app-notes', name: 'Notes', description: 'Captures notes and enriches recall.', category: 'Knowledge', connected: true },
    { id: 'app-slack', name: 'Slack', description: 'Brings relevant team context into Omi.', category: 'Communication', connected: false },
  ],
  actions: [
    { id: 'action-1', title: 'Send Sam the first daily-review concept', status: 'open', dueAt: '2026-07-21T17:00:00.000Z', conversationId: 'conv-design-review' },
    { id: 'action-2', title: 'Reconnect with Jordan next week', status: 'open', conversationId: 'conv-planning' },
  ],
};
