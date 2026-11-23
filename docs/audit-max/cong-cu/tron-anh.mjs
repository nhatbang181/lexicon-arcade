// tron-anh.mjs – Trộn ảnh để CHẤM MÙ (KIEM-THU.md §3.2). Không ai được sửa file này (LUAT.md Q4).
// Cách chạy (từ D:\English):
//   node docs/audit-max/cong-cu/tron-anh.mjs <thư-mục-ảnh-gốc> <thư-mục-ảnh-mới> <thư-mục-ra>
// Ví dụ:
//   node docs/audit-max/cong-cu/tron-anh.mjs docs/audit-max/anh-goc out/review-T4-A-A out/cham-mu-T4-A-A
// Chỉ lấy ảnh có CÙNG TÊN ở cả hai thư mục, bỏ mọi file "-loi", copy thành shuffle-<n>.<ext> theo thứ tự ngẫu nhiên.
// Bảng giải mã ở <thư-mục-ra>/key.json: KHÔNG mở trước khi chấm xong mọi ảnh.
// Hai bên phải cùng định dạng (cùng chụp bằng audit-ui.mjs --fmt jpg) để không lộ bên nào là bên nào.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const [goc, moi, out] = process.argv.slice(2);
if (!goc || !moi || !out) { console.error('Cần 3 tham số: <ảnh-gốc> <ảnh-mới> <ra>'); process.exit(2); }
const pick = (d) => new Set(fs.readdirSync(d).filter((f) => /\.(png|jpe?g)$/i.test(f) && !/-loi\./i.test(f)));
const a = pick(goc), b = pick(moi);
const both = [...a].filter((f) => b.has(f));
const extA = new Set([...a].map((f) => path.extname(f).toLowerCase()));
if (!both.length) { console.error('Không có ảnh nào trùng tên giữa hai thư mục.'); process.exit(1); }
fs.mkdirSync(out, { recursive: true });
const items = both.flatMap((f) => [{ src: path.join(goc, f), side: 'goc', name: f }, { src: path.join(moi, f), side: 'moi', name: f }]);
for (let i = items.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [items[i], items[j]] = [items[j], items[i]]; }
const key = {};
items.forEach((it, i) => {
  const dst = `shuffle-${String(i + 1).padStart(3, '0')}${path.extname(it.name).toLowerCase()}`;
  fs.copyFileSync(it.src, path.join(out, dst));
  key[dst] = { ben: it.side, anh: it.name };
});
fs.writeFileSync(path.join(out, 'key.json'), JSON.stringify(key, null, 1));
fs.writeFileSync(path.join(out, 'PHIEU-CHAM.md'), ['# Phiếu chấm mù', '',
  'Chấm các tiêu chí nhìn được trên ảnh (KIEM-THU.md §3.2): R2 Cảm giác game, R4 Mật độ & chất lượng hình, R5 Thứ bậc & bố cục, R6 Đọc & truy cập.',
  'Dùng mốc mô tả 4/7/10 ở KIEM-THU.md §3.1. Chấm XONG mọi ảnh rồi mới mở key.json.', '',
  '| Ảnh | R2 | R4 | R5 | R6 | Trung bình | Lý do ngắn |', '|---|---|---|---|---|---|---|',
  ...Object.keys(key).map((k) => `| ${k} | | | | | | |`)].join('\n') + '\n');
console.log(`tron-anh: ${both.length} cặp → ${items.length} ảnh ở ${out} (mở key.json SAU khi chấm). Định dạng gốc: ${[...extA].join(',')}`);
