import type {
  CollocationItem,
  DictationItem,
  ErrorItem,
  ParaphraseItem,
  VocabItem,
} from '../../core/content/schemas';
import type { UserItemRecord } from '../../core/storage/db';

/**
 * Nội dung bổ sung cho các thẻ không nằm trong 5 tập dữ liệu từ vựng (G1).
 * Do `extras.ts` nạp theo đúng các thẻ cần dùng trong run; engine chỉ đọc, không fetch.
 */
export interface V1ReadingRef {
  kind: 'tfng' | 'head';
  passageId: string;
  passageTitle: string;
  paragraphLabel: string;
  paragraphText: string;
  /** TFNG/YNNG: câu phát biểu. Heading: "Paragraph B". */
  statement: string;
  qType: 'tfng' | 'ynng' | 'headings';
  /** Đáp án chuẩn dạng chữ hiển thị: TRUE/FALSE/NOT GIVEN, YES/NO/NOT GIVEN hoặc nội dung heading. */
  correctAnswer: string;
  /** Lựa chọn hiển thị (đã gồm đáp án; thứ tự do engine xáo theo seed). */
  options: string[];
  decoyReasons?: Record<string, string>;
  evidenceQuote?: string;
  explanationVi: string;
}

export interface V1ListeningRef {
  episodeId: string;
  qid: string;
  questionPrompt: string;
  acceptedAnswers: string[];
  /** Đường dẫn audio của cả episode (tương đối `public/`). */
  audioPath: string;
  clipStart: number;
  clipEnd: number;
  /** Dòng kịch bản chứa đoạn bẫy (dùng làm chữ thay audio khi chưa có file). */
  transcriptLine?: string;
  trapType?: string;
  decoy?: string;
  trapExplanationVi: string;
}

export interface V1ExtraContent {
  /** Theo `itemId`. */
  userItems: Record<string, UserItemRecord>;
  reading: Record<string, V1ReadingRef>;
  listening: Record<string, V1ListeningRef>;
}

export const EMPTY_V1_EXTRAS: V1ExtraContent = { userItems: {}, reading: {}, listening: {} };

export interface V1ContentBundle {
  vocab: VocabItem[];
  collocations: CollocationItem[];
  paraphrases: ParaphraseItem[];
  errors: ErrorItem[];
  dictations: DictationItem[];
  extras?: V1ExtraContent;
}
