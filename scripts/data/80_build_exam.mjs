#!/usr/bin/env node
/**
 * D14: tạo public/data/exam/tests.json gồm 2 ExamTest (xt:) ghép các episode/passage `reserved`.
 * Chỉ ghép khi mọi episode có MP3 hợp lệ (sha256 khác "pending") và mọi id tồn tại, reserved === true.
 */
import fs from 'node:fs';
import path from 'node:path';
const ROOT = process.cwd();
const D = path.join(ROOT, 'public/data');
const ep = (n) => JSON.parse(fs.readFileSync(path.join(D, `listening/episodes/${n}.json`), 'utf8'));
const rp = (n) => JSON.parse(fs.readFileSync(path.join(D, `reading/passages/${n}.json`), 'utf8'));
const tests = [];
for (const k of ['001', '002']) {
  const lis = [1, 2, 3, 4].map((p) => `p${p}_res_${k}`);
  const rea = [1, 2, 3].map((p) => `p${p}_res_${k}`);
  for (const s of lis) {
    const e = ep(s);
    if (e.reserved !== true) throw new Error(`${s} không phải reserved`);
    if (!e.audio?.sha256 || e.audio.sha256 === 'pending') throw new Error(`${s} chưa có audio`);
  }
  for (const s of rea) if (rp(s).reserved !== true) throw new Error(`${s} không phải reserved`);
  tests.push({
    id: `xt:set_${k}`,
    title: `Đề thi thử ${Number(k)} (Listening 4 phần + Reading 3 bài)`,
    listening: lis.map((s) => `lep:${s}`),
    reading: rea.map((s) => `rp:${s}`),
    reserved: true,
  });
}
fs.mkdirSync(path.join(D, 'exam'), { recursive: true });
fs.writeFileSync(path.join(D, 'exam/tests.json'), JSON.stringify(tests, null, 2) + '\n');
console.log('exam/tests.json:', tests.map((t) => t.id).join(', '));
