# 19 · BẪY VÀ GHI CHÚ (bổ sung `docs/audit-max/antigravity/16-GHI-CHU-BAY.md`)

## Dữ liệu và license
- **B-01** "Non-profit" **không** cho phép đăng lại nội dung giữ mọi quyền. Đề thật chỉ dùng qua **gói riêng** trên thiết bị (`10b`).
- **B-02** CC **ND**:
  - The Conversation: theo hướng dẫn của họ, dùng **nguyên văn cả bài**, không cắt sửa.
  - TED (BY-NC-ND 4.0): được chia sẻ **một phần nguyên văn**, không sửa lời.
  - Câu hỏi do mình viết là tác phẩm riêng, để tách biệt.
- **B-03** CC **SA** (NGSL, Octanove, Wiktionary, Wikipedia, wordfreq): file dữ liệu dẫn xuất giữ CC BY-SA, ghi `public/data/v2/LICENSES.md`. Code app không bị ảnh hưởng nếu file dữ liệu tách riêng.
- **B-04** Word Atlas và dataset IELTS trên HF **do AI sinh**, không ai soát tay → bắt buộc QA. Dataset crawl Writing9: license ghi sai, **không dùng**.
- **B-05** wordfreq đóng băng ở dữ liệu 2021; viwiktionary có nghĩa cổ (nghi nhập từ từ điển cũ) → lọc.
- **B-06** Pearson ACL cấm TDM/AI: không đưa vào LLM, không cào.
- **B-07** Write & Improve / Speak & Improve (Cambridge): cấm chia sẻ, giới hạn LLM, **không dùng**.
- **B-08** Forecast Speaking: chỉ lấy **nhãn chủ đề**. "IELTS Bro cập nhật đề thật" (R6) → không chép câu hỏi.

## Mạng xã hội
- **B-10** Seeding dày đặc. Dấu hiệu:
  - cùng mô tả hồ sơ ("chia sẻ kn học ielts");
  - link Zalo nhóm;
  - "web giáo viên không muốn bạn biết";
  - bình luận "đi đâu cũng gặp seeding app này".
  
  IELTS Mate, Openquizai, các page "tham gia group" đều thuộc dạng này. Đọc lấy **phương pháp**, bỏ quảng cáo (`03`).
- **B-11** Facebook nhiễu nhất, Threads giá trị nhất, TikTok chỉ đọc được tiêu đề/mô tả/bình luận (tab Video). Reddit chặn công cụ.
- **B-12** Chrome extension phải đăng nhập **tài khoản Claude của app**, không phải Gmail. Có thể có nhiều Chrome kết nối → chọn đúng hồ sơ.

## Chấm điểm
- **B-20** LLM nén điểm về giữa; 2 lần chấm ra 2 điểm → luôn chấm 2 lần + hiệu chỉnh + báo khoảng (`12`).
- **B-21** Câu trả lời Speaking mẫu do AI viết **giống văn Writing** (First and foremost, Lastly) → bị coi là học thuộc. Phải dùng discourse marker kiểu nói (`11` §6).
- **B-22** Web Speech API gửi âm thanh ra máy chủ và hỗ trợ kém trên Safari → dùng ASR on-device làm mặc định trên iOS (`16`).

## Kỹ thuật
- **B-30** `kokoro-js` kéo transformers v3 → xung đột với transformers v4 dùng cho ASR. Không dùng TTS trong trình duyệt; render sẵn.
- **B-31** MeloTTS cài trên Windows dễ vỡ → dùng Docker/WSL. Repo đứng yên từ 2024.
- **B-32** GPU máy dev là RTX 3050 4 GB → không chạy được model TTS 2B (VoxCPM2). Kokoro/Piper/whisper.cpp chạy tốt.
- **B-33** Site công khai giữ trần audio 400 MB. Phần vượt đi vào gói audio riêng (≤ 300 MB/lần trên iPhone). Dùng opus 32–48 kbps, gói theo unit.
- **B-36** (Phương án chạy local để sau) Nếu chuyển local: iPhone truy cập qua Tailscale HTTPS. PWA cần HTTPS → không dùng `http://192.168…`.
- **B-37** Repo GitHub và tài liệu bản quyền: agent không tải hay tìm bản lậu (PDF Cambridge, repo chép đề). Đề thật chỉ từ nguồn Bang mua hoặc được phép, đặt ở `D:\English-private\`.
- **B-34** Gói riêng `.lexpack` phải bị chặn ở `.gitignore` **và** ở CI (fail khi thấy). Không đặt thư mục private bên trong repo.
- **B-35** iOS: nhập gói riêng **sau** khi cài app ra màn hình chính (tab Safari không chia sẻ IndexedDB với app đã cài).
