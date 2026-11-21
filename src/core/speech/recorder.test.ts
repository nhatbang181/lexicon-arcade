import { describe, expect, it, vi } from 'vitest';
import {
  AudioRecorder,
  selectBestAudioMimeType,
  type MediaRecorderLike,
  type MediaStreamLike,
} from './recorder';

class MockMediaRecorder implements MediaRecorderLike {
  public state: 'inactive' | 'recording' | 'paused' = 'inactive';
  public mimeType: string;
  public ondataavailable: ((event: { data: Blob }) => void) | null = null;
  public onstop: (() => void) | null = null;
  public onerror: ((event: unknown) => void) | null = null;

  constructor(mimeType: string) {
    this.mimeType = mimeType;
  }

  public start(): void {
    this.state = 'recording';
    this.ondataavailable?.({ data: new Blob(['chunk-1'], { type: this.mimeType }) });
  }

  public stop(): void {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['chunk-2'], { type: this.mimeType }) });
    this.onstop?.();
  }
}

describe('speech/recorder', () => {
  it('selects MIME type in priority order: webm/opus -> webm -> mp4 -> fallback', () => {
    expect(
      selectBestAudioMimeType((m) => m === 'audio/webm;codecs=opus' || m === 'audio/mp4'),
    ).toBe('audio/webm;codecs=opus');

    expect(selectBestAudioMimeType((m) => m === 'audio/webm' || m === 'audio/mp4')).toBe(
      'audio/webm',
    );

    expect(selectBestAudioMimeType((m) => m === 'audio/mp4')).toBe('audio/mp4');

    expect(selectBestAudioMimeType(() => false)).toBe('');
  });

  it('records Blob + durationMs and cleans up owned MediaStream tracks on stop', async () => {
    let clock = 10_000;
    const stopTrack = vi.fn();
    const mockStream: MediaStreamLike = {
      getTracks: () => [{ stop: stopTrack, kind: 'audio' }],
    };

    const recorder = new AudioRecorder({
      now: () => clock,
      isTypeSupported: (m) => m === 'audio/webm;codecs=opus',
      getUserMedia: async () => mockStream,
      mediaRecorderFactory: (_stream, opts) =>
        new MockMediaRecorder(opts.mimeType ?? 'audio/webm;codecs=opus'),
    });

    await recorder.start();
    expect(recorder.getState().status).toBe('recording');
    expect(recorder.getState().mimeType).toBe('audio/webm;codecs=opus');

    clock += 4250;
    const result = await recorder.stop();

    expect(result.durationMs).toBe(4250);
    expect(result.durationSec).toBe(4.25);
    expect(result.mimeType).toBe('audio/webm;codecs=opus');
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(stopTrack).toHaveBeenCalledTimes(1);
    expect(recorder.getStream()).toBeNull();
    expect(recorder.getState().status).toBe('stopped');
  });

  it('reports permission_denied cleanly when microphone access is rejected', async () => {
    const err = Object.assign(new Error('Permission denied'), { name: 'NotAllowedError' });
    const recorder = new AudioRecorder({
      isTypeSupported: () => true,
      getUserMedia: async () => {
        throw err;
      },
      mediaRecorderFactory: () => new MockMediaRecorder('audio/webm'),
    });

    await expect(recorder.start()).rejects.toThrow('Permission denied');
    expect(recorder.getState().status).toBe('error');
    expect(recorder.getState().error?.code).toBe('permission_denied');
  });
});
