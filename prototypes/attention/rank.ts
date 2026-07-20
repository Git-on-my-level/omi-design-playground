import type { Conversation, Memory, OmiSnapshot, SuggestedAction } from '../../reference/hackathon-pack/src/types';

export type AttentionKind = 'device' | 'capture' | 'action';

export interface AttentionItem {
  id: string;
  kind: AttentionKind;
  title: string;
  reason: string;
  dueAt?: string;
  urgency: 'now' | 'soon' | 'later';
  actionId?: string;
  conversationId?: string;
  memoryIds?: string[];
}

function actionUrgency(dueAt: string | undefined, now: Date): AttentionItem['urgency'] {
  if (!dueAt) return 'later';
  const due = new Date(dueAt);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  if (due < now || (due >= startOfToday && due < endOfToday)) return 'now';
  if (due.getTime() - now.getTime() <= 24 * 60 * 60 * 1000) return 'soon';
  return 'later';
}

function compareDueAt(a: SuggestedAction, b: SuggestedAction): number {
  if (!a.dueAt && !b.dueAt) return 0;
  if (!a.dueAt) return 1;
  if (!b.dueAt) return -1;
  return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
}

function pickMemories(action: SuggestedAction, memories: Memory[]): string[] {
  if (action.conversationId) {
    const linked = memories.filter((m) => m.sourceConversationId === action.conversationId);
    if (linked.length) return linked.slice(0, 2).map((m) => m.id);
  }
  return [...memories]
    .sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0))
    .slice(0, 2)
    .map((m) => m.id);
}

export function rankAttention(input: {
  snapshot: OmiSnapshot;
  conversations: Conversation[];
  memories: Memory[];
  actions: SuggestedAction[];
  now?: Date;
}): { primary: AttentionItem | null; queue: AttentionItem[] } {
  const now = input.now ?? new Date();
  const { snapshot, conversations, memories, actions } = input;
  const items: AttentionItem[] = [];

  if (snapshot.device.connection === 'disconnected') {
    const lowBattery = snapshot.device.batteryPercent <= 20;
    items.push({
      id: 'attention-device',
      kind: 'device',
      title: 'Reconnect Omi',
      reason: lowBattery
        ? `Battery at ${snapshot.device.batteryPercent}%`
        : 'Device is offline',
      urgency: 'now',
    });
  } else if (snapshot.capture.status === 'capturing') {
    items.push({
      id: 'attention-capture',
      kind: 'capture',
      title: 'Listening',
      reason: 'Stop when you are ready to review',
      urgency: 'now',
    });
  }

  const convById = new Map(conversations.map((c) => [c.id, c]));
  const openActions = actions.filter((a) => a.status === 'open').sort(compareDueAt);
  for (const action of openActions) {
    const conv = action.conversationId ? convById.get(action.conversationId) : undefined;
    items.push({
      id: `attention-action-${action.id}`,
      kind: 'action',
      title: action.title,
      reason: conv ? `From ${conv.title}` : 'Open follow-up',
      dueAt: action.dueAt,
      urgency: actionUrgency(action.dueAt, now),
      actionId: action.id,
      conversationId: action.conversationId,
      memoryIds: pickMemories(action, memories),
    });
  }

  // Processing is ambient, not a to-do — only surface it when nothing else needs you.
  if (!items.length && snapshot.capture.status === 'processing') {
    items.push({
      id: 'attention-processing',
      kind: 'capture',
      title: 'Finishing your last capture',
      reason: 'Nothing else needs you while this wraps up',
      urgency: 'soon',
    });
  }

  const capped = items.slice(0, 7);
  return { primary: capped[0] ?? null, queue: capped.slice(1) };
}

// ponytail: smoke — rankAttention({ snapshot: defaultOmiSeed, conversations: [], memories: [], actions: [] }).primary?.kind
