import { describe, expect, it, vi } from 'vitest';
import { OmiMock } from '../src';

describe('OmiMock', () => {
  it('offers seeded Omi context without requiring an account or network', async () => {
    const omi = new OmiMock({ latencyMs: 0 });

    const [conversations, memories, people, apps, actions] = await Promise.all([
      omi.listConversations(),
      omi.listMemories(),
      omi.listPeople(),
      omi.listApps(),
      omi.listActions(),
    ]);

    expect(conversations[0]?.title).toContain('Design review');
    expect(memories).toHaveLength(3);
    expect(people.map((person) => person.name)).toContain('Sam Rivera');
    expect(apps.some((app) => app.connected)).toBe(true);
    expect(actions.some((action) => action.status === 'open')).toBe(true);
  });

  it('models capture as interactive state and emits useful UI events', async () => {
    const omi = new OmiMock({ latencyMs: 0, processingMs: 10, now: () => new Date('2026-07-20T15:00:00.000Z') });
    const onChanged = vi.fn();
    omi.on('capture.changed', onChanged);

    await omi.startCapture('ios');
    await omi.appendLiveTranscript('Alex Morgan', 'A prototype should respond to a live moment.');
    const stopping = omi.stopCapture();
    expect((await omi.getSnapshot()).capture.status).toBe('processing');
    const conversation = await stopping;

    expect(conversation.segments).toHaveLength(1);
    expect(onChanged).toHaveBeenCalledTimes(4);
    expect((await omi.getSnapshot()).capture.status).toBe('idle');
  });

  it('keeps prototype mutations local and testable', async () => {
    const omi = new OmiMock({ latencyMs: 0 });
    const before = await omi.listActions();
    const updated = await omi.toggleAction('action-1');
    const after = await omi.listActions();

    expect(before.find((action) => action.id === 'action-1')?.status).toBe('open');
    expect(updated.status).toBe('done');
    expect(after.find((action) => action.id === 'action-1')?.status).toBe('done');
  });

  it('creates a synthetic memory and exposes it through its event and list seams', async () => {
    const omi = new OmiMock({ latencyMs: 0, now: () => new Date('2026-07-20T15:00:00.000Z') });
    const onMemory = vi.fn();
    omi.on('memory.created', onMemory);

    const memory = await omi.createMemory({
      text: 'Alex wants a prototype that feels surprising but grounded.',
      kind: 'preference',
      people: ['person-me'],
    });

    expect(memory.createdAt).toBe('2026-07-20T15:00:00.000Z');
    expect(onMemory).toHaveBeenCalledWith({ type: 'memory.created', memory });
    expect((await omi.listMemories('surprising'))[0]?.id).toBe(memory.id);
  });

  it('clones a supplied fixture so prototype sessions cannot contaminate each other', async () => {
    const seed = { actions: [{ id: 'shared-action', title: 'Keep fixture isolated', status: 'open' as const }] };
    const first = new OmiMock({ seed, latencyMs: 0 });
    const second = new OmiMock({ seed, latencyMs: 0 });

    await first.toggleAction('shared-action');

    expect(seed.actions[0]?.status).toBe('open');
    expect((await second.listActions())[0]?.status).toBe('open');
  });
});
