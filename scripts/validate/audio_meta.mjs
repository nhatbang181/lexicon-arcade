// Đọc thông tin MP3 không cần thư viện ngoài (D3): thời lượng + sha256 + kiểm toàn vẹn byte/khung.
// Khi có tiêu đề Xing/Info: đối chiếu byte và số khung khai báo với dữ liệu thật (lệch > 10% → lỗi/null).
// Khi không có Xing/Info: duyệt từng khung MPEG thật để tính thời lượng và phát hiện cắt cụt.
import crypto from 'node:crypto';
import fs from 'node:fs';

const BITRATES = {
  // [mpegVersion][layer] -> kbps theo chỉ số 1..14
  1: {
    1: [32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
    2: [32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
    3: [32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  },
  2: {
    1: [32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
    2: [8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
    3: [8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
  },
};
const SAMPLE_RATES = { 1: [44100, 48000, 32000], 2: [22050, 24000, 16000], 25: [11025, 12000, 8000] };
const MAX_MISMATCH_RATIO = 0.1;

function id3v2Size(buf) {
  if (buf.length >= 10 && buf.toString('latin1', 0, 3) === 'ID3') {
    return 10 + ((buf[6] & 0x7f) << 21) + ((buf[7] & 0x7f) << 14) + ((buf[8] & 0x7f) << 7) + (buf[9] & 0x7f);
  }
  return 0;
}

function id3v1Size(buf, audioStart) {
  if (buf.length - audioStart >= 128 && buf.toString('latin1', buf.length - 128, buf.length - 125) === 'TAG') {
    return 128;
  }
  return 0;
}

function parseFrameHeader(buf, pos) {
  if (pos + 4 > buf.length) return null;
  if (buf[pos] !== 0xff || (buf[pos + 1] & 0xe0) !== 0xe0) return null;
  const verBits = (buf[pos + 1] >> 3) & 3;
  const layerBits = (buf[pos + 1] >> 1) & 3;
  const brIdx = (buf[pos + 2] >> 4) & 15;
  const srIdx = (buf[pos + 2] >> 2) & 3;
  const pad = (buf[pos + 2] >> 1) & 1;
  if (verBits === 1 || layerBits === 0 || brIdx === 0 || brIdx === 15 || srIdx === 3) return null;
  const version = verBits === 3 ? 1 : 2;
  const layer = 4 - layerBits;
  const mpeg = verBits === 3 ? 1 : verBits === 2 ? 2 : 25;
  const bitrateKbps = BITRATES[version][layer][brIdx - 1];
  const sampleRate = SAMPLE_RATES[mpeg][srIdx];
  const samplesPerFrame = layer === 1 ? 384 : layer === 2 || version === 1 ? 1152 : 576;
  const frameLength =
    layer === 1
      ? Math.floor((12 * bitrateKbps * 1000) / sampleRate + pad) * 4
      : Math.floor(((samplesPerFrame / 8) * bitrateKbps * 1000) / sampleRate + pad);
  if (frameLength <= 0) return null;
  const mono = ((buf[pos + 3] >> 6) & 3) === 3;
  const sideInfo = version === 1 ? (mono ? 17 : 32) : mono ? 9 : 17;
  return { version, layer, mpeg, bitrateKbps, sampleRate, samplesPerFrame, frameLength, sideInfo };
}

function walkFrames(buf, startPos, audioEnd) {
  let p = startPos;
  let frames = 0;
  let bytes = 0;
  let durationSec = 0;
  let firstBitrate = null;
  let vbr = false;
  while (p + 4 <= audioEnd) {
    const hdr = parseFrameHeader(buf, p);
    if (!hdr || p + hdr.frameLength > audioEnd) break;
    if (firstBitrate === null) firstBitrate = hdr.bitrateKbps;
    else if (hdr.bitrateKbps !== firstBitrate) vbr = true;
    frames += 1;
    bytes += hdr.frameLength;
    durationSec += hdr.samplesPerFrame / hdr.sampleRate;
    p += hdr.frameLength;
  }
  return { frames, bytes, durationSec, vbr };
}

/** @returns {{durationSec:number, bitrateKbps:number, sampleRate:number, vbr:boolean}|null} */
export function mp3InfoFromBuffer(buf) {
  let pos = id3v2Size(buf);
  const audioEnd = buf.length - id3v1Size(buf, pos);
  if (pos >= audioEnd) return null;

  while (pos + 4 <= audioEnd) {
    const hdr = parseFrameHeader(buf, pos);
    if (hdr && pos + hdr.frameLength <= audioEnd) {
      const audioBytes = audioEnd - pos;
      const tagPos = pos + 4 + hdr.sideInfo;
      const hasXingArea = tagPos + 12 <= pos + hdr.frameLength;
      const tag = hasXingArea ? buf.toString('latin1', tagPos, tagPos + 4) : '';
      if ((tag === 'Xing' || tag === 'Info') && (buf[tagPos + 7] & 1)) {
        const flags = buf[tagPos + 7];
        const declaredFrames = buf.readUInt32BE(tagPos + 8);
        if (declaredFrames === 0) return null;
        const xingBytes =
          (flags & 2) && tagPos + 16 <= pos + hdr.frameLength ? buf.readUInt32BE(tagPos + 12) : null;

        // Đối chiếu dung lượng byte và số khung thật với header Xing/Info (lệch > 10% = cắt cụt hoặc nối hỏng).
        const nextHdr = parseFrameHeader(buf, pos + hdr.frameLength);
        const bytesPerAudioFrame = nextHdr ? nextHdr.frameLength : hdr.frameLength;
        const expectedBytes =
          xingBytes && xingBytes > 0 ? xingBytes : hdr.frameLength + declaredFrames * bytesPerAudioFrame;
        if (Math.abs(audioBytes - expectedBytes) / expectedBytes > MAX_MISMATCH_RATIO) return null;

        const walked = walkFrames(buf, pos + hdr.frameLength, audioEnd);
        if (Math.abs(walked.frames - declaredFrames) / declaredFrames > MAX_MISMATCH_RATIO) return null;
        const walkedTotalBytes = hdr.frameLength + walked.bytes;
        if (Math.abs(audioBytes - walkedTotalBytes) / audioBytes > MAX_MISMATCH_RATIO) return null;

        return {
          durationSec: (declaredFrames * hdr.samplesPerFrame) / hdr.sampleRate,
          bitrateKbps: hdr.bitrateKbps,
          sampleRate: hdr.sampleRate,
          vbr: tag === 'Xing' || walked.vbr,
        };
      }

      const walked = walkFrames(buf, pos, audioEnd);
      if (walked.frames === 0) return null;
      if (Math.abs(audioBytes - walked.bytes) / audioBytes > MAX_MISMATCH_RATIO) return null;
      return {
        durationSec: walked.durationSec,
        bitrateKbps: hdr.bitrateKbps,
        sampleRate: hdr.sampleRate,
        vbr: walked.vbr,
      };
    }
    pos += 1;
  }
  return null;
}

/** @returns {{durationSec:number, bitrateKbps:number, sampleRate:number, vbr:boolean}|null} */
export function mp3Info(file) {
  return mp3InfoFromBuffer(fs.readFileSync(file));
}

export function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
