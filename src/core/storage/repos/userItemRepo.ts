import { createNewCard, type CardSource, type SRSCard } from '../../srs/fsrsAdapter';
import type { Face } from '../../srs/faces';
import { db as defaultDb, type LexiconV3DB, type UserItemKind, type UserItemRecord } from '../db';

export interface UpsertWithCardOptions {
  now?: Date;
  /** Nguồn của thẻ SRS (mặc định lấy từ `item.source` nếu hợp lệ, không thì `'user'`). */
  cardSource?: CardSource;
  unlocked?: boolean;
}

export type UserItemInput = Omit<UserItemRecord, 'createdAt'> & { createdAt?: number };

/**
 * Kho nội dung của thẻ SRS do người dùng/producer tạo (G1).
 * Thẻ chỉ có `itemId` thì V1 không có gì để hiển thị; mọi producer phải ghi item + thẻ qua `upsertWithCard`.
 */
export const userItemRepo = {
  async get(id: string, database: LexiconV3DB = defaultDb): Promise<UserItemRecord | undefined> {
    return database.userItems.get(id);
  },

  async getMany(
    ids: readonly string[],
    database: LexiconV3DB = defaultDb,
  ): Promise<Record<string, UserItemRecord>> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return {};
    const rows = await database.userItems.bulkGet(unique);
    const out: Record<string, UserItemRecord> = {};
    for (const row of rows) {
      if (row) out[row.id] = row;
    }
    return out;
  },

  async listByKind(kind: UserItemKind, database: LexiconV3DB = defaultDb): Promise<UserItemRecord[]> {
    return database.userItems.where('kind').equals(kind).toArray();
  },

  /**
   * Ghi item và thẻ SRS đầu tiên của nó trong **một transaction**.
   * - Item đã tồn tại: giữ `createdAt` cũ, cập nhật nội dung (không đổi ID).
   * - Thẻ `${item.id}#${face}` đã tồn tại: giữ nguyên lịch ôn (không reset FSRS).
   */
  async upsertWithCard(
    item: UserItemInput,
    cardFace: Face,
    options: UpsertWithCardOptions = {},
    database: LexiconV3DB = defaultDb,
  ): Promise<{ item: UserItemRecord; card: SRSCard; createdCard: boolean }> {
    const now = options.now ?? new Date();
    return database.transaction('rw', [database.userItems, database.cards], async () => {
      const existingItem = await database.userItems.get(item.id);
      const record: UserItemRecord = {
        ...item,
        createdAt: existingItem?.createdAt ?? item.createdAt ?? now.getTime(),
      };
      await database.userItems.put(record);

      const cardId = `${item.id}#${cardFace}`;
      const existingCard = await database.cards.get(cardId);
      if (existingCard) {
        return { item: record, card: existingCard, createdCard: false };
      }
      const card = createNewCard(item.id, cardFace, {
        now,
        unlocked: options.unlocked ?? true,
        source: options.cardSource ?? 'user',
      });
      await database.cards.put(card);
      return { item: record, card, createdCard: true };
    });
  },

  async remove(id: string, database: LexiconV3DB = defaultDb): Promise<void> {
    await database.userItems.delete(id);
  },
};
