import { defaultOmiSeed } from './seed';
import type {
  AssistantReply,
  CaptureSession,
  Conversation,
  EventHandler,
  Memory,
  MemoryDraft,
  OmiEvent,
  OmiEventName,
  OmiMockOptions,
  OmiSeed,
  OmiSnapshot,
  Platform,
  SuggestedAction,
  TranscriptSegment,
} from './types';

const copy = <T>(value: T): T => structuredClone(value);

function mergeSeed(seed?: OmiSeed): OmiSnapshot {
  const base = copy(defaultOmiSeed);
  return {
    ...base,
    ...seed,
    me: { ...base.me, ...seed?.me },
    device: { ...base.device, ...seed?.device },
    capture: { ...base.capture, ...seed?.capture, liveTranscript: seed?.capture?.liveTranscript ?? base.capture.liveTranscript },
  };
}

/**
 * Local, in-memory implementation of the small Omi surface most useful for UI prototypes.
 * It never calls a network service and has no relation to a user's real Omi account.
 */
export class OmiMock {
  private state: OmiSnapshot;
  private readonly listeners = new Map<OmiEventName, Set<(event: OmiEvent) => void>>();
  private readonly latencyMs: number;
  private readonly processingMs: number;
  private readonly now: () => Date;

  constructor(options: OmiMockOptions = {}) {
    this.state = mergeSeed(options.seed ? copy(options.seed) : undefined);
    this.latencyMs = options.latencyMs ?? 120;
    this.processingMs = options.processingMs ?? 600;
    this.now = options.now ?? (() => new Date());
  }

  async getSnapshot(): Promise<OmiSnapshot> {
    await this.delay();
    return copy(this.state);
  }

  async listConversations(): Promise<Conversation[]> {
    await this.delay();
    return copy([...this.state.conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    await this.delay();
    const conversation = this.state.conversations.find((item) => item.id === id);
    return conversation ? copy(conversation) : undefined;
  }

  async listMemories(query?: string): Promise<Memory[]> {
    await this.delay();
    const normalized = query?.trim().toLowerCase();
    return copy(
      this.state.memories
        .filter((memory) => !normalized || memory.text.toLowerCase().includes(normalized))
        .map((memory) => ({ ...memory, relevance: normalized ? 0.9 : memory.relevance })),
    );
  }

  async createMemory(draft: MemoryDraft): Promise<Memory> {
    await this.delay();
    const memory: Memory = {
      ...draft,
      id: `mem-${this.now().getTime()}-${this.state.memories.length + 1}`,
      createdAt: this.now().toISOString(),
    };
    this.state.memories.unshift(memory);
    this.emit({ type: 'memory.created', memory: copy(memory) });
    return copy(memory);
  }

  async listPeople() {
    await this.delay();
    return copy(this.state.people);
  }

  async listApps() {
    await this.delay();
    return copy(this.state.apps);
  }

  async listActions(): Promise<SuggestedAction[]> {
    await this.delay();
    return copy(this.state.actions);
  }

  async startCapture(platform: Platform): Promise<CaptureSession> {
    await this.delay();
    this.state.capture = {
      ...this.state.capture,
      id: `capture-${this.now().getTime()}`,
      status: 'capturing',
      startedAt: this.now().toISOString(),
      liveTranscript: [],
    };
    this.emit({ type: 'capture.changed', capture: copy(this.state.capture) });
    void platform; // Platform is intentionally available to prototype authors for branching and analytics mocks.
    return copy(this.state.capture);
  }

  async appendLiveTranscript(speaker: string, text: string): Promise<TranscriptSegment> {
    await this.delay();
    if (this.state.capture.status !== 'capturing') throw new Error('Start a capture before appending a transcript segment.');
    const timestamp = this.now().toISOString();
    const segment: TranscriptSegment = {
      id: `seg-live-${this.state.capture.liveTranscript.length + 1}`,
      speaker,
      text,
      startedAt: timestamp,
      endedAt: timestamp,
    };
    this.state.capture.liveTranscript.push(segment);
    this.emit({ type: 'capture.changed', capture: copy(this.state.capture) });
    return copy(segment);
  }

  async stopCapture(): Promise<Conversation> {
    await this.delay();
    if (this.state.capture.status !== 'capturing') throw new Error('There is no active capture to stop.');
    this.state.capture.status = 'processing';
    this.emit({ type: 'capture.changed', capture: copy(this.state.capture) });

    await this.delayBy(this.processingMs);

    const endedAt = this.now().toISOString();
    const conversation: Conversation = {
      id: `conv-${this.now().getTime()}`,
      title: 'New captured conversation',
      startedAt: this.state.capture.startedAt ?? endedAt,
      updatedAt: endedAt,
      source: 'device',
      summary: 'A newly captured conversation, ready for a prototype to summarize or organize.',
      people: ['person-me'],
      segments: copy(this.state.capture.liveTranscript),
    };
    this.state.conversations.unshift(conversation);
    this.state.capture = { id: 'capture-current', status: 'idle', liveTranscript: [] };
    this.emit({ type: 'conversation.updated', conversation: copy(conversation) });
    this.emit({ type: 'capture.changed', capture: copy(this.state.capture) });
    return copy(conversation);
  }

  async setDeviceConnection(connection: OmiSnapshot['device']['connection']): Promise<OmiSnapshot['device']> {
    await this.delay();
    this.state.device.connection = connection;
    this.state.device.lastSyncedAt = this.now().toISOString();
    this.emit({ type: 'device.changed', device: copy(this.state.device) });
    return copy(this.state.device);
  }

  async toggleAction(id: string): Promise<SuggestedAction> {
    await this.delay();
    const action = this.state.actions.find((item) => item.id === id);
    if (!action) throw new Error(`Action ${id} was not found.`);
    action.status = action.status === 'open' ? 'done' : 'open';
    return copy(action);
  }

  async askAssistant(prompt: string): Promise<AssistantReply> {
    await this.delay();
    const matchingMemory = this.state.memories.find((memory) => prompt.toLowerCase().includes(memory.text.split(' ')[0].toLowerCase())) ?? this.state.memories[0];
    const reply: AssistantReply = {
      id: `reply-${this.now().getTime()}`,
      text: matchingMemory
        ? `A useful starting point is: ${matchingMemory.text}`
        : 'Try exploring the available conversations, memories, and people as a connected personal context.',
      citations: matchingMemory ? [{ type: 'memory', id: matchingMemory.id, label: 'Mock memory' }] : [],
    };
    this.emit({ type: 'assistant.responded', reply: copy(reply) });
    return reply;
  }

  on<T extends OmiEventName>(eventName: T, handler: EventHandler<T>): () => void {
    const handlers = this.listeners.get(eventName) ?? new Set<(event: OmiEvent) => void>();
    handlers.add(handler as (event: OmiEvent) => void);
    this.listeners.set(eventName, handlers);
    return () => handlers.delete(handler as (event: OmiEvent) => void);
  }

  private emit(event: OmiEvent): void {
    this.listeners.get(event.type)?.forEach((handler) => handler(event));
  }

  private delay(): Promise<void> {
    return this.delayBy(this.latencyMs);
  }

  private delayBy(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}
