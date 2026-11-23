// Đọc thông tin MP3 không cần thư viện ngoài (D3): thời lượng + sha256.
// Thời lượng lấy từ tiêu đề Xing/Info (nếu có), nếu không thì ước theo bitrate của khung đầu (CBR).
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

function id3v2Size(buf) {
  if (buf.length >= 10 && buf.toString('latin1', 0, 3) === 'ID3') {
    return 10 + ((buf[6] & 0x7f) << 21) + ((buf[7] & 0x7f) << 14) + ((buf[8] & 0x7f) << 7) + (buf[9] & 0x7f);
  }
  return 0;
}

/** @returns {{durationSec:number, bitrateKbps:number, sampleRate:number, vbr:boolean}|null} */
export function mp3Info(file) {
  const buf = fs.readFileSync(file);
  let pos = id3v2Size(buf);
  while (pos + 4 < buf.length) {
    if (buf[pos] === 0xff && (buf[pos + 1] & 0xe0) === 0xe0) {
      const verBits = (buf[pos + 1] >> 3) & 3;
      const layerBits = (buf[pos + 1] >> 1) & 3;
      const brIdx = (buf[pos + 2] >> 4) & 15;
      const srIdx = (buf[pos + 2] >> 2) & 3;
      if (verBits !== 1 && layerBits !== 0 && brIdx !== 0 && brIdx !== 15 && srIdx !== 3) {
        const version = verBits === 3 ? 1 : 2;
        const layer = 4 - layerBits;
        const mpeg = verBits === 3 ? 1 : verBits === 2 ? 2 : 25;
        const bitrateKbps = BITRATES[version][layer][brIdx - 1];
        const sampleRate = SAMPLE_RATES[mpeg][srIdx];
        const samplesPerFrame = layer === 1 ? 384 : layer === 2 || version === 1 ? 1152 : 576;
        const mono = ((buf[pos + 3] >> 6) & 3) === 3;
        const sideInfo = version === 1 ? (mono ? 17 : 32) : mono ? 9 : 17;
        const tagPos = pos + 4 + sideInfo;
        const tag = buf.toString('latin1', tagPos, tagPos + 4);
        if ((tag === 'Xing' || tag === 'Info') && (buf[tagPos + 7] & 1)) {
          const frames = buf.readUInt32BE(tagPos + 8);
          return { durationSec: (frames * samplesPerFrame) / sampleRate, bitrateKbps, sampleRate, vbr: tag === 'Xing' };
        }
        const audioBytes = buf.length - pos;
        return { durationSec: (audioBytes * 8) / (bitrateKbps * 1000), bitrateKbps, sampleRate, vbr: false };
      }
    }
    pos += 1;
  }
  return null;
}

export function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
