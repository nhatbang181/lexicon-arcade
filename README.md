# ⚔️ LEXICON QUEST: The Realm of IELTS 8.0 RPG

> **Chuyển hóa 1.499+ từ vựng IELTS 8.0 trong Anki thành tựa game RPG nhập vai chiến đấu đầy lôi cuốn, chú trọng tối đa hiệu quả ghi nhớ sâu.**

---

## 🌟 Tính Năng Nổi Bật & Triết Lý Học Tập (Learning Science)

1. **Active Recall Chiến Đấu (Context Cloze Strike)**:
   - Thay vì lật thẻ bị động, người chơi phải trực tiếp gõ chính xác từ vựng bị thiếu trong câu ví dụ học thuật thực tế (hoặc chọn đáp án nhanh).
   - **Cơ chế thưởng**: Gõ từ trực tiếp (Active Recall) kích hoạt **Critical Strike (+50% sát thương chí mạng)**, khuyến khích tối đa phản xạ viết đúng chính tả.

2. **Chuỗi Combo Collocations (Collocation Combo)**:
   - Đánh bại khiên quái vật bằng cách ghép đúng cụm collocations tự nhiên (ví dụ: *rely on* + *rote learning*, *national* + *curriculum*), giúp người chơi ghi nhớ cách dùng từ theo cụm chuẩn band 8.0+.

3. **Phản Đòn Bằng Từ Đồng Nghĩa (Synonym Parry)**:
   - Nhận diện từ đồng nghĩa học thuật hoặc định nghĩa chuẩn xác để dựng khiên phòng thủ và phản lại sát thương của boss.

4. **Luyện Nghe & Phát Âm Tức Thì (Phonetic Speech)**:
   - Tích hợp chuẩn âm thanh bản ngữ (Web Speech API) và phiên âm quốc tế IPA cho mọi từ vựng trong game, giúp khắc sâu phát âm chuẩn Anh/Mỹ ngay trong nhịp đánh.

5. **Thuật Toán Lặp Lại Ngắt Quãng & Hệ Thống Nemesis (Spaced Repetition)**:
   - Dựa trên hệ thống Leitner 5 hộp: Từ vựng trả lời đúng sẽ thăng cấp sao (Box 1 -> Box 5).
   - Từ vựng làm sai lập tức trở thành **Nemesis Beast** (Quái vật định mệnh) với tần suất xuất hiện dày đặc ở các tầng hầm tiếp theo cho đến khi bạn thuần thục.

6. **Hệ Thống RPG Chuẩn Chỉ**:
   - **Level, EXP, HP, MP, Vàng**: Thăng cấp tăng chỉ số sức mạnh, máu và mana.
   - **Merchant Guild (Cửa hàng trang bị)**: Dùng vàng kiếm được từ các trận đánh để mua kiếm tăng ATK, áo giáp giảm sát thương khi làm sai, bình máu và cổ vật thần bí (tăng EXP, tăng tỉ lệ chí mạng).
   - **Grimoire Codex (Bách khoa toàn thư từ vựng)**: Tìm kiếm tra cứu hơn 1.499 từ vựng theo chủ đề, nghe phát âm, xem ví dụ, collocations và mức độ sao thuần thục.

---

## 🗺️ 12 Vùng Đất / Chủ Đề (IELTS Realms)

- **The Scholastic Citadel**: Chủ đề *Education* (200 từ)
- **The Primordial Wilds**: Chủ đề *Environment* (194 từ)
- **The Cyber Foundry**: Chủ đề *Technology* (200 từ)
- **The Sanctuary of Vitae**: Chủ đề *Health* (198 từ)
- **The Merchant Metropolis**: Chủ đề *Work & Economy* (206 từ)
- **The Shadow Underworld**: Chủ đề *Society & Crime* (202 từ)
- **The Broadcasting Spire**: Chủ đề *Media* (206 từ)
- **The Steam Transit Hub**: Chủ đề *Urban & Transport* (200 từ)
- **The Astral Observatory**: Chủ đề *Science & Research* (202 từ)
- **The Global Pantheon**: Chủ đề *Culture & Globalisation* (204 từ)
- **The Spire of Erudition**: Bộ *Academic Word List (AWL Sublists 1 & 2)* (120 từ)
- **The Collocation Arena**: Chuyên đề *Collocations, Paraphrase & Speaking*

---

## 🚀 Hướng Dẫn Khởi Chạy Nhanh

### Cách 1: Chạy bằng file Batch (Khuyên dùng)
Chỉ cần nhấp đúp chuột vào file:
```
run_game.bat
```
File sẽ tự động kiểm tra dữ liệu Anki, khởi động server và mở trình duyệt tại `http://localhost:5173`.

### Cách 2: Khởi chạy thủ công qua Terminal
```powershell
# 1. Đồng bộ lại dữ liệu mới nhất từ Anki (nếu có thẻ mới)
python scripts/extract_anki.py

# 2. Khởi chạy game
npm run dev
```
Mở trình duyệt truy cập: `http://localhost:5173`
