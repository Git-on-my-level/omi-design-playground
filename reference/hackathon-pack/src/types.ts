export type Platform = 'macos' | 'ios';
export type DeviceConnection = 'connected' | 'connecting' | 'disconnected';
export type CaptureStatus = 'idle' | 'capturing' | 'processing';
export type MemoryKind = 'fact' | 'preference' | 'relationship' | 'commitment' | 'insight';
export type OmiEventName =
  | 'capture.changed'
  | 'conversation.updated'
  | 'memory.created'
  | 'device.changed'
  | 'assistant.responded';

export interface Person {
  id: string;
  name: string;
  relationship: string;
  avatar?: string;
  lastSeenAt: string;
}

export interface TranscriptSegment {
  id: string;
  speaker: string;
  text: string;
  startedAt: string;
  endedAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  startedAt: string;
  updatedAt: string;
  source: Platform | 'device';
  summary: string;
  people: string[];
  segments: TranscriptSegment[];
}

export interface Memory {
  id: string;
  text: string;
  kind: MemoryKind;
  createdAt: string;
  relevance?: number;
  people: string[];
  sourceConversationId?: string;
}

export type MemoryDraft = Omit<Memory, 'id' | 'createdAt' | 'relevance'>;

export interface OmiDevice {
  id: string;
  name: string;
  connection: DeviceConnection;
  batteryPercent: number;
  firmwareVersion: string;
  lastSyncedAt: string;
}

export interface OmiApp {
  id: string;
  name: string;
  description: string;
  category: string;
  connected: boolean;
}

export interface SuggestedAction {
  id: string;
  title: string;
  status: 'open' | 'done';
  dueAt?: string;
  conversationId?: string;
}

export interface CaptureSession {
  id: string;
  status: CaptureStatus;
  startedAt?: string;
  liveTranscript: TranscriptSegment[];
}

export interface AssistantReply {
  id: string;
  text: string;
  citations: Array<{ type: 'memory' | 'conversation'; id: string; label: string }>;
}

export interface OmiSnapshot {
  me: Person;
  device: OmiDevice;
  capture: CaptureSession;
  conversations: Conversation[];
  memories: Memory[];
  people: Person[];
  apps: OmiApp[];
  actions: SuggestedAction[];
}

export type OmiEvent =
  | { type: 'capture.changed'; capture: CaptureSession }
  | { type: 'conversation.updated'; conversation: Conversation }
  | { type: 'memory.created'; memory: Memory }
  | { type: 'device.changed'; device: OmiDevice }
  | { type: 'assistant.responded'; reply: AssistantReply };

export type EventHandler<T extends OmiEventName> = (event: Extract<OmiEvent, { type: T }>) => void;

export interface OmiSeed {
  me?: Partial<Person>;
  device?: Partial<OmiDevice>;
  capture?: Partial<CaptureSession>;
  conversations?: Conversation[];
  memories?: Memory[];
  people?: Person[];
  apps?: OmiApp[];
  actions?: SuggestedAction[];
}

export interface OmiMockOptions {
  seed?: OmiSeed;
  latencyMs?: number;
  /** Time that stopCapture leaves the session visibly processing. */
  processingMs?: number;
  now?: () => Date;
}
