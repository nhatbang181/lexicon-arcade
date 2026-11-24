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
  /** Dòng kịch bản chứa đoạn bẫy. CHỈ dùng sau khi trả lời; không bao giờ hiện thay audio (lộ đáp án). */
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
  /**
   * `itemId` (`ltrap:*`, `dict:*`) đã kiểm và xác nhận KHÔNG có file audio thật: thẻ bị bỏ khỏi run
   * (log `missing_item` + `reason: 'missing_audio'`), không hiện chữ thay audio, không chấm FSRS.
   */
  missingAudio?: string[];
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
