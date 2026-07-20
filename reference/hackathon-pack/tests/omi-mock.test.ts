import { describe, expect, it, vi } from 'vitest';
import { getOmiScenario, OmiMock, omiScenarioNames } from '../src';

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

  it.each(['ios', 'macos'] as const)('preserves %s capture provenance in the completed conversation', async (platform) => {
    const omi = new OmiMock({ latencyMs: 0, processingMs: 0, now: () => new Date('2026-07-20T15:00:00.000Z') });

    await omi.startCapture(platform);
    await omi.appendLiveTranscript('Alex Morgan', `Captured on ${platform}.`);
    const conversation = await omi.stopCapture();

    expect(conversation.source).toBe(platform);
    expect(conversation.segments[0]?.text).toBe(`Captured on ${platform}.`);
  });

  it('rejects a new capture while the previous capture is processing', async () => {
    const omi = new OmiMock({ latencyMs: 0, processingMs: 25, now: () => new Date('2026-07-20T15:00:00.000Z') });

    await omi.startCapture('ios');
    await omi.appendLiveTranscript('Alex Morgan', 'Keep this session intact.');
    const stopping = omi.stopCapture();
    await vi.waitFor(async () => expect((await omi.getSnapshot()).capture.status).toBe('processing'));

    await expect(omi.startCapture('macos')).rejects.toThrow('active or processing');
    const conversation = await stopping;

    expect(conversation.segments).toHaveLength(1);
    expect(conversation.segments[0]?.text).toBe('Keep this session intact.');
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

  it('emits action changes for reactive prototype surfaces', async () => {
    const omi = new OmiMock({ latencyMs: 0 });
    const onAction = vi.fn();
    const stopListening = omi.on('action.changed', onAction);

    const updated = await omi.toggleAction('action-1');
    expect(onAction).toHaveBeenCalledWith({ type: 'action.changed', action: updated });

    stopListening();
    await omi.toggleAction('action-1');
    expect(onAction).toHaveBeenCalledTimes(1);
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

  it('exposes isolated named scenarios and applies explicit seed overrides', async () => {
    for (const scenario of omiScenarioNames) {
      const fixture = getOmiScenario(scenario);
      expect(fixture).toBeDefined();
      const first = new OmiMock({ scenario, latencyMs: 0 });
      const second = new OmiMock({ scenario, latencyMs: 0 });
      await first.createMemory({ text: `Only in ${scenario}`, kind: 'fact', people: [] });
      expect((await second.listMemories()).some((memory) => memory.text === `Only in ${scenario}`)).toBe(false);
    }

    const overridden = new OmiMock({
      scenario: 'power-user',
      seed: { device: { batteryPercent: 12 }, memories: [] },
      latencyMs: 0,
    });
    const snapshot = await overridden.getSnapshot();
    expect(snapshot.device.batteryPercent).toBe(12);
    expect(snapshot.memories).toEqual([]);
    expect((await overridden.listConversations()).length).toBeGreaterThan(1);
  });
});
