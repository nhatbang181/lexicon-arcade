# 04 · LUẬT CỨNG (NC-SR) · cộng thêm vào luật plan cũ

> Mọi luật trong `docs/audit-max/LUAT.md` và `docs/audit-max/antigravity/04-LUAT-CUNG.md` (SR-01…SR-93) **vẫn áp dụng nguyên**. Vi phạm NC-SR = **CHẶN**.

## 1. Dữ liệu và bản quyền
| Mã | Luật |
|---|---|
| NC-SR-01 | Mọi nguồn dữ liệu phải có dòng trong `data-src/licenses/REGISTER.md` (URL, license, ngày kiểm, phần được ship, câu ghi công) **trước** khi import. `license_check.py` fail → không merge |
| NC-SR-02 | Nội dung giữ mọi quyền (Cambridge, IELTS.org, BC, IDP, ieltsonlinetests, sách, khoá học) **không bao giờ** vào repo, CI, build, Pages hay artifact. Chỉ qua **gói riêng** trên thiết bị của Bang (`10b`) |
| NC-SR-03 | Cấm cào web trái điều khoản (ieltsonlinetests, Writing9, Facebook…). Cấm tải đề lậu và repo chứa đề Cambridge |
| NC-SR-04 | Nguồn CC-ND dùng nguyên văn, không sửa (The Conversation: cả bài; TED: đoạn nguyên văn). Nguồn CC-SA thì file dẫn xuất giữ SA, ghi `LICENSES.md` |
| NC-SR-05 | Item sinh bằng LLM: model kiểm **khác hãng** với model sinh; blind-solve 100%; không trùng ≥ 12 từ liên tiếp với nguồn (trừ ND nguyên văn); nhãn "đề luyện tập gốc". Không dùng logo/tên IELTS như thương hiệu |
| NC-SR-06 | Forecast/đề thí sinh kể lại: chỉ lưu **nhãn chủ đề + quý + link**. Câu hỏi tự soạn |
| NC-SR-07 | Thống kê từ gói riêng chỉ được commit **số đếm và nhãn** (vd tỷ lệ dạng câu), không kèm văn bản |
| NC-SR-08 | Không đổi ID item đã phát hành (A6). 2.207 từ cũ giữ `vocab:<headword>` khi chuyển sang lexicon v2 |

## 2. Chấm điểm và đo lường
| Mã | Luật |
|---|---|
| NC-SR-10 | Điểm W/S luôn là **khoảng đã hiệu chỉnh** + nhãn "ước lượng" + trích dẫn bằng chứng. Không hiện 1 con số trơ trọi |
| NC-SR-11 | Band L/R chỉ tính từ **mock đầy đủ, lần làm đầu**. Drill chỉ cập nhật Elo |
| NC-SR-12 | Mọi điểm phát âm là **proxy**, ghi rõ không phải band Pronunciation |
| NC-SR-13 | Anchor có điểm thật của Bang và sample chính thức chỉ dùng offline; bảng hiệu chỉnh commit được (chỉ hệ số) |

## 3. Riêng tư và thiết bị
| Mã | Luật |
|---|---|
| NC-SR-20 | Bản ghi âm, bài viết, gói riêng chỉ ở thiết bị. Không gửi ra ngoài, trừ khi Bang tự dán bài vào Claude chat. ASR mặc định **on-device**; Web Speech chỉ khi Bang chọn và có cảnh báo |
| NC-SR-21 | Model ML chỉ tải khi bật tính năng, có tiến độ, có nút xoá; không vào bundle entry; chạy trong Web Worker |
| NC-SR-22 | iPhone ưu tiên 1: mọi tính năng mới phải chạy trên iPhone thật ở chế độ đã cài app (Speaking, gói riêng, Harper) trước khi qua cổng |

## 4. Phương pháp
| Mã | Luật |
|---|---|
| NC-SR-30 | Mỗi cơ chế mới phải ghi trong KE-HOACH: trỏ tới cụm descriptor band 8 / ngưỡng 35/40 / phương pháp có nguồn (`13`). Không trỏ được thì không làm |
| NC-SR-31 | Không có chế độ học thuộc câu trả lời mẫu, không nhồi idiom, không XP theo số lượng (R5, R6) |
| NC-SR-32 | Từ mới học theo **khối chủ đề**; chỉ trộn lượt ôn và cặp dễ nhầm (plan cũ PP-05) |

## 9. Điểm dừng hỏi Bang (thêm vào danh sách cũ)
1. Mua sách/tài liệu (Cambridge 18–21…).
2. Audio trong repo/site công khai vượt **400 MB** (phần vượt đi vào gói audio riêng, `10b` §0); gói audio riêng nhập vào iPhone vượt 300 MB một lần.
3. Tắt site public, đổi repo sang private, đổi cài đặt GitHub.
4. Đổi nhân vật hoặc phong cách thiết kế đã qua G1.
5. Dùng dữ liệu NC mà sau này muốn thương mại hoá (hiện phi lợi nhuận nên được dùng).
