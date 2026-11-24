import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { mp3Info, mp3InfoFromBuffer } from './audio_meta.mjs';

const ROOT = process.cwd();
const VOCAB_SAMPLE = path.join(ROOT, 'public/audio/vocab/abandon.uk.mp3');
const LISTENING_SAMPLE = path.join(ROOT, 'public/audio/listening/p1_001.mp3');

/** Tạo buffer MP3 MPEG-2 Layer 3 (64 kbps, 24 kHz, 192 B/khung, 576 mẫu/khung) có hoặc không có header Info. */
function buildSyntheticMp3({ declaredFrames, actualAudioFrames, withInfo = true, includeBytesField = false }) {
  const frameLen = 192; // floor(72 * 64000 / 24000)
  // Header: sync 0xFFE, MPEG2 (verBits=2 -> 0x10), Layer3 (layerBits=1 -> 0x02), no CRC (1) => 0xF3
  // Byte 2: bitrate idx 8 (64 kbps -> 0x80), sr idx 1 (24000 Hz -> 0x04), pad 0 => 0x84
  // Byte 3: mono (3 << 6 = 0xC0) => sideInfo = 9
  const makeFrame = () => {
    const f = Buffer.alloc(frameLen, 0);
    f[0] = 0xff;
    f[1] = 0xf3;
    f[2] = 0x84;
    f[3] = 0xc0;
    return f;
  };
  const parts = [];
  if (withInfo) {
    const infoFrame = makeFrame();
    const tagPos = 4 + 9;
    infoFrame.write('Info', tagPos, 'latin1');
    infoFrame[tagPos + 7] = includeBytesField ? 0x03 : 0x01;
    infoFrame.writeUInt32BE(declaredFrames, tagPos + 8);
    if (includeBytesField) {
      infoFrame.writeUInt32BE((declaredFrames + 1) * frameLen, tagPos + 12);
    }
    parts.push(infoFrame);
  }
  for (let i = 0; i < actualAudioFrames; i++) parts.push(makeFrame());
  return Buffer.concat(parts);
}

describe('audio_meta (D3)', () => {
  it('đọc đúng file MP3 thật hợp lệ (vocab + listening)', () => {
    const vocab = mp3Info(VOCAB_SAMPLE);
    expect(vocab).not.toBeNull();
    expect(vocab.durationSec).toBeCloseTo(0.672, 2);

    const listening = mp3Info(LISTENING_SAMPLE);
    expect(listening).not.toBeNull();
    expect(listening.durationSec).toBeCloseTo(255.456, 1);
  });

  it('bắt lỗi file MP3 thật bị cắt cụt (1/2 listening, 1/4 vocab)', () => {
    const listeningBuf = fs.readFileSync(LISTENING_SAMPLE);
    expect(mp3InfoFromBuffer(listeningBuf.subarray(0, Math.floor(listeningBuf.length / 2)))).toBeNull();

    const vocabBuf = fs.readFileSync(VOCAB_SAMPLE);
    expect(mp3InfoFromBuffer(vocabBuf.subarray(0, Math.floor(vocabBuf.length / 4)))).toBeNull();
  });

  it('bắt lỗi file MP3 bị nối lặp bất thường (6× vocab)', () => {
    const vocabBuf = fs.readFileSync(VOCAB_SAMPLE);
    const repeated = Buffer.concat(Array.from({ length: 6 }, () => vocabBuf));
    expect(mp3InfoFromBuffer(repeated)).toBeNull();
  });

  it('bắt lỗi buffer MP3 có Info nhưng không có trường bytes khi cắt cụt > 10%', () => {
    const intact = buildSyntheticMp3({ declaredFrames: 20, actualAudioFrames: 20, withInfo: true, includeBytesField: false });
    const ok = mp3InfoFromBuffer(intact);
    expect(ok).not.toBeNull();
    expect(ok.durationSec).toBeCloseTo((20 * 576) / 24000, 4);

    // Cắt còn 15/20 khung (thiếu 25% > 10%)
    const truncated = buildSyntheticMp3({ declaredFrames: 20, actualAudioFrames: 15, withInfo: true, includeBytesField: false });
    expect(mp3InfoFromBuffer(truncated)).toBeNull();
  });

  it('đọc đúng CBR không có Xing/Info và bắt lỗi khi có rác cắt cụt ở cuối', () => {
    const cbr = buildSyntheticMp3({ declaredFrames: 10, actualAudioFrames: 10, withInfo: false });
    const ok = mp3InfoFromBuffer(cbr);
    expect(ok).not.toBeNull();
    expect(ok.durationSec).toBeCloseTo((10 * 576) / 24000, 4);

    // Gắn thêm 500 byte rác cuối (> 10% dung lượng)
    const corrupted = Buffer.concat([cbr, Buffer.alloc(500, 0xaa)]);
    expect(mp3InfoFromBuffer(corrupted)).toBeNull();
  });
});
