import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AsrController,
  mergeTranscriptSegments,
  type SpeechRecognitionEventLike,
  type SpeechRecognitionLike,
} from './asr';

class MockSpeechRecognition implements SpeechRecognitionLike {
  public lang = '';
  public continuous = false;
  public interimResults = false;
  public maxAlternatives = 1;
  public onstart: (() => void) | null = null;
  public onresult: ((event: SpeechRecognitionEventLike) => void) | null = null;
  public onerror: ((event: { error: string; message?: string }) => void) | null = null;
  public onend: (() => void) | null = null;

  public started = false;
  public stopped = false;
  public aborted = false;

  public start(): void {
    this.started = true;
    this.onstart?.();
  }

  public stop(): void {
    this.stopped = true;
    this.onend?.();
  }

  public abort(): void {
    this.aborted = true;
  }

  public emitResult(
    results: Array<{ transcript: string; isFinal: boolean; confidence?: number }>,
    resultIndex = 0,
  ): void {
    const list: Record<number, { isFinal: boolean; length: number; 0: { transcript: string; confidence?: number } }> & {
      length: number;
    } = { length: results.length };

    results.forEach((r, idx) => {
      list[idx] = {
        isFinal: r.isFinal,
        length: 1,
        0: { transcript: r.transcript, confidence: r.confidence },
      };
    });

    this.onresult?.({
      resultIndex,
      results: list,
    });
  }

  public emitPrematureEnd(): void {
    this.onend?.();
  }

  public emitError(error: string): void {
    this.onerror?.({ error });
  }
}

describe('speech/asr mergeTranscriptSegments', () => {
  it('stitches non-overlapping segments cleanly', () => {
    expect(mergeTranscriptSegments('I enjoy reading books', 'especially historical fiction')).toBe(
      'I enjoy reading books especially historical fiction',
    );
  });

  it('removes partial boundary overlap across restarts', () => {
    expect(
      mergeTranscriptSegments(
        'I really enjoy playing football with my friends',
        'with my friends at the local park',
      ),
    ).toBe('I really enjoy playing football with my friends at the local park');
  });

  it('ignores exact tail replay (case and punctuation insensitive)', () => {
    expect(
      mergeTranscriptSegments(
        'Honestly, public transport is much faster.',
        'public transport is much faster',
      ),
    ).toBe('Honestly, public transport is much faster.');
  });
});

describe('speech/asr AsrController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('auto-restarts seamlessly when Chrome cuts off mid-session and deduplicates transcript', () => {
    const instances: MockSpeechRecognition[] = [];
    const controller = new AsrController({
      lang: 'en-GB',
      restartDelayMs: 100,
      recognitionFactory: () => {
        const inst = new MockSpeechRecognition();
        instances.push(inst);
        return inst;
      },
    });

    expect(controller.getState().status).toBe('supported');
    expect(controller.getState().isSupported).toBe(true);

    const started = controller.start();
    expect(started).toBe(true);
    expect(instances).toHaveLength(1);
    expect(instances[0].lang).toBe('en-GB');
    expect(controller.getState().status).toBe('listening');

    // Interim + Final in session 1
    instances[0].emitResult([{ transcript: 'I think renewable', isFinal: false }]);
    expect(controller.getState().interimTranscript).toBe('I think renewable');
    expect(controller.getState().combinedTranscript).toBe('I think renewable');

    instances[0].emitResult([
      { transcript: 'I think renewable energy is essential', isFinal: true, confidence: 0.92 },
    ]);
    expect(controller.getState().finalTranscript).toBe('I think renewable energy is essential');

    // Simulate Chrome 60s unexpected cutoff -> onend fires while listening
    instances[0].emitPrematureEnd();
    expect(controller.getState().status).toBe('restarting');
    expect(controller.getState().restartCount).toBe(1);

    // Advance timer past restartDelayMs -> session 2 starts automatically
    vi.advanceTimersByTime(100);
    expect(instances).toHaveLength(2);
    expect(controller.getState().status).toBe('listening');

    // Session 2 replays trailing words "energy is essential" + new continuation
    instances[1].emitResult([
      {
        transcript: 'energy is essential for mitigating climate change',
        isFinal: true,
        confidence: 0.68,
      },
    ]);

    const state = controller.getState();
    expect(state.finalTranscript).toBe(
      'I think renewable energy is essential for mitigating climate change',
    );
    expect(state.segments).toHaveLength(2);
    expect(state.segments[0].isLowConfidence).toBe(false);
    expect(state.segments[1].isLowConfidence).toBe(true);

    // Manual stop prevents any further auto-restart
    controller.stop();
    expect(controller.getState().status).toBe('stopped');
    vi.advanceTimersByTime(500);
    expect(instances).toHaveLength(2);
  });

  it('recovers from non-fatal no-speech error via auto-restart, but stops on fatal not-allowed error', () => {
    const instances: MockSpeechRecognition[] = [];
    const controller = new AsrController({
      restartDelayMs: 50,
      recognitionFactory: () => {
        const inst = new MockSpeechRecognition();
        instances.push(inst);
        return inst;
      },
    });

    controller.start();
    instances[0].emitError('no-speech');
    instances[0].emitPrematureEnd();
    expect(controller.getState().status).toBe('restarting');

    vi.advanceTimersByTime(50);
    expect(instances).toHaveLength(2);
    expect(controller.getState().status).toBe('listening');

    // Fatal permission error stops auto-restart
    instances[1].emitError('not-allowed');
    instances[1].emitPrematureEnd();
    expect(controller.getState().status).toBe('error');
    expect(controller.getState().error?.code).toBe('not-allowed');

    vi.advanceTimersByTime(500);
    expect(instances).toHaveLength(2);
  });

  it('falls back gracefully when browser does not support SpeechRecognition (Firefox/Safari)', () => {
    const controller = new AsrController({
      recognitionFactory: null,
    });

    const initial = controller.getState();
    expect(initial.isSupported).toBe(false);
    expect(initial.status).toBe('unsupported');
    expect(initial.fallbackMessageVi).toContain('Firefox');

    // Calling start() does not throw and returns false
    expect(controller.start()).toBe(false);
    expect(controller.getState().status).toBe('unsupported');

    // User can paste/type transcript manually into the same controller state
    controller.setManualTranscript('Manual transcript pasted by user on Firefox.');
    expect(controller.getState().finalTranscript).toBe(
      'Manual transcript pasted by user on Firefox.',
    );
    expect(controller.getState().combinedTranscript).toBe(
      'Manual transcript pasted by user on Firefox.',
    );
  });
});
