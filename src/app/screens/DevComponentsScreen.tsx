import React, { useState } from 'react';
import {
  Button,
  Card,
  Pill,
  ProgressRing,
  BandMeter,
  Timer,
  Modal,
  Sheet,
  Toast,
  AnswerInput,
  ChoiceButton,
  KeyHint,
  AudioButton,
  FeedbackPanel,
  RecapScreen,
  EmptyState,
  Skeleton,
} from '../../design/components';
import { useTheme } from '../providers';

export const DevComponentsScreen: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [answerText, setAnswerText] = useState('sustainable development');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="space-y-8 pb-12" data-testid="dev-components-showcase">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Pill tone="info">Design System · 08-DESIGN-SYSTEM.md</Pill>
          <h1 className="text-2xl font-bold mt-2" style={{ color: 'var(--color-text)' }}>
            Thư viện 17 UI Components chuẩn V3
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-dim)' }}>
            Kiểm tra trực quan toàn bộ component ở các trạng thái và bảng màu Editorial Academic.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={theme === 'dark' ? 'primary' : 'secondary'}
            onClick={() => setTheme('dark')}
          >
            Theme Dark
          </Button>
          <Button
            size="sm"
            variant={theme === 'light' ? 'primary' : 'secondary'}
            onClick={() => setTheme('light')}
          >
            Theme Light
          </Button>
          <Button
            size="sm"
            variant={theme === 'exam' ? 'primary' : 'secondary'}
            onClick={() => setTheme('exam')}
          >
            Theme Exam
          </Button>
        </div>
      </div>

      {/* 1. Button, Pill, KeyHint, AudioButton */}
      <Card padding="lg" className="space-y-5">
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
          1. Button · Pill · KeyHint · AudioButton
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" skill="vocab" hotkey="Enter">
            Primary Vocab
          </Button>
          <Button variant="primary" skill="listening">
            Listening
          </Button>
          <Button variant="primary" skill="reading">
            Reading
          </Button>
          <Button variant="secondary" hotkey="H">
            Gợi ý
          </Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" loading>
            Đang tải
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="vocab">V1 · Từ vựng</Pill>
          <Pill tone="listening">L1 · Listening</Pill>
          <Pill tone="reading">R1 · Reading</Pill>
          <Pill tone="writing">W1 · Writing</Pill>
          <Pill tone="speaking">S1 · Speaking</Pill>
          <Pill tone="exam">X1 · Thi thử</Pill>
          <Pill tone="correct">Đúng</Pill>
          <Pill tone="wrong">Sai</Pill>
          <Pill tone="partial">Gần đúng</Pill>
          <KeyHint keyName="Esc" />
          <KeyHint keyName="Space" />
          <AudioButton
            playing={audioPlaying}
            onToggle={() => setAudioPlaying((p) => !p)}
            label={audioPlaying ? 'Đang phát mẫu' : 'Nghe phát âm UK'}
          />
        </div>
      </Card>

      {/* 2. ProgressRing, BandMeter, Timer */}
      <Card padding="lg" className="space-y-5">
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
          2. ProgressRing · BandMeter · Timer
        </h2>
        <div className="flex flex-wrap items-center gap-6">
          <ProgressRing value={18} max={30} skill="info" label="18/30'" />
          <ProgressRing value={75} max={100} skill="vocab" />
          <ProgressRing value={100} max={100} skill="reading" />
          <Timer remainingSec={245} totalSec={300} />
          <Timer remainingSec={40} totalSec={300} />
          <Timer remainingSec={15} totalSec={300} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <BandMeter
            skillCode="L"
            skillLabel="Listening"
            skill="listening"
            currentBand={7.0}
            targetBand={8.5}
            confidence={0.5}
            trend="up"
          />
          <BandMeter
            skillCode="R"
            skillLabel="Reading"
            skill="reading"
            currentBand={null}
            targetBand={8.5}
          />
        </div>
      </Card>

      {/* 3. AnswerInput & ChoiceButton */}
      <Card padding="lg" className="space-y-5">
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
          3. AnswerInput · ChoiceButton
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnswerInput
            label="NO MORE THAN TWO WORDS"
            wordLimit={2}
            value={answerText}
            onChange={setAnswerText}
            status="correct"
            helperText="Chấp nhận biến thể Anh-Anh và Anh-Mỹ."
          />
          <AnswerInput
            label="ONE WORD ONLY"
            wordLimit={1}
            value="unprecedented"
            onChange={() => undefined}
            status="idle"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ChoiceButton indexLabel="A" label="Trạng thái mặc định (Idle)" state="idle" />
          <ChoiceButton indexLabel="B" label="Đang chọn (Selected)" state="selected" />
          <ChoiceButton indexLabel="C" label="Đáp án đúng (Correct)" state="correct" />
          <ChoiceButton indexLabel="D" label="Đáp án sai (Wrong)" state="wrong" />
          <ChoiceButton
            indexLabel="E"
            label="Hiện đáp án đúng sau khi chọn sai (Reveal Correct)"
            state="reveal-correct"
          />
        </div>
      </Card>

      {/* 4. FeedbackPanel & Toast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FeedbackPanel
          open
          status="correct"
          title="Đúng, bạn bắt được bẫy self-correction."
          correctAnswer="15th October"
          explanation="Người nói ban đầu nhắc tới 12th October nhưng ngay sau đó đính chính lại là 'Oh sorry, moved to the 15th'."
          evidenceQuote="Actually, the seminar was originally on the twelfth, but we pushed it to the fifteenth of October."
          onNext={() => undefined}
          onFlagItem={() => undefined}
        />

        <div className="space-y-4">
          <Toast
            tone="correct"
            title="Hoàn thành mục tiêu hôm nay"
            description="Bạn đã giữ chuỗi 12 ngày học liên tiếp (+120 XP)."
          />
          <Toast
            tone="partial"
            title="Lưu ý chính tả số nhiều"
            description="Từ 'student' thiếu hậu tố -s trong ngữ cảnh 'many international students'."
          />
          <Card padding="md" className="space-y-3">
            <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
              5. Modal · Sheet · Skeleton
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" variant="secondary" onClick={() => setModalOpen(true)}>
                Mở Modal mẫu
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setSheetOpen(true)}>
                Mở Sheet mẫu
              </Button>
            </div>
            <Skeleton lines={2} />
          </Card>
        </div>
      </div>

      {/* 6. RecapScreen & EmptyState */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <RecapScreen
          scoreLabel="8/10"
          xpEarned={140}
          winStatement="Bắt được 4/4 bẫy self-correction và distractor số liệu trong Part 1."
          accuracyPercent={80}
          durationSec={315}
          mistakes={[
            {
              id: 'm1',
              prompt: 'The library extension opens on ____.',
              userAnswer: 'Monday',
              correctAnswer: 'Wednesday',
              note: 'Bẫy distractor: Monday là lịch cũ trước khi cải tạo.',
            },
          ]}
          onRetryMistakes={() => undefined}
          onGoToday={() => undefined}
        />

        <EmptyState
          title="Hết thẻ ôn tập hôm nay"
          description="Bạn đã hoàn thành toàn bộ thẻ FSRS đến hạn. Muốn mở thêm 10 từ học thuật mới chứ?"
          action={<Button variant="primary">Học thêm 10 từ mới</Button>}
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Lưu phần đã làm và thoát?"
        subtitle="Các thẻ bạn vừa trả lời vẫn được ghi nhận vào lịch FSRS."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Tiếp tục học
            </Button>
            <Button variant="danger" onClick={() => setModalOpen(false)}>
              Thoát phiên
            </Button>
          </>
        }
      >
        Bạn đã hoàn thành 7/10 câu trong phiên này.
      </Modal>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Cấu hình phiên luyện L1 · Trap Detector"
        subtitle="Chọn chế độ Training hoặc Exam trước khi bắt đầu."
        footer={
          <Button variant="primary" onClick={() => setSheetOpen(false)}>
            Bắt đầu phiên
          </Button>
        }
      >
        <p>Chế độ Training cho phép tua lại 5 giây và hiển thị vùng bẫy trên sóng âm sau khi nộp.</p>
      </Sheet>
    </div>
  );
};
