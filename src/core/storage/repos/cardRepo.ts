import { State } from 'ts-fsrs';
import type { SRSCard } from '../../srs/fsrsAdapter';
import { db as defaultDb, type LexiconV3DB, type ReviewRecord } from '../db';

export const cardRepo = {
  async get(id: string, database: LexiconV3DB = defaultDb): Promise<SRSCard | undefined> {
    return database.cards.get(id);
  },

  async getByItemId(itemId: string, database: LexiconV3DB = defaultDb): Promise<SRSCard[]> {
    return database.cards.where('itemId').equals(itemId).toArray();
  },

  async getAll(database: LexiconV3DB = defaultDb): Promise<SRSCard[]> {
    return database.cards.toArray();
  },

  async getDue(nowMs = Date.now(), database: LexiconV3DB = defaultDb): Promise<SRSCard[]> {
    return database.cards
      .where('due')
      .belowOrEqual(nowMs)
      .filter((c) => c.unlocked)
      .toArray();
  },

  async upsert(card: SRSCard, database: LexiconV3DB = defaultDb): Promise<string> {
    return database.cards.put(card);
  },

  async bulkUpsert(cards: readonly SRSCard[], database: LexiconV3DB = defaultDb): Promise<void> {
    if (cards.length === 0) return;
    await database.cards.bulkPut([...cards]);
  },

  async toggleStar(id: string, database: LexiconV3DB = defaultDb): Promise<boolean> {
    const card = await database.cards.get(id);
    if (!card) return false;
    const nextStarred = !card.starred;
    await database.cards.update(id, { starred: nextStarred });
    return nextStarred;
  },

  async recordReview(
    updatedCard: SRSCard,
    review: Omit<ReviewRecord, 'id'>,
    database: LexiconV3DB = defaultDb,
  ): Promise<number> {
    return database.transaction('rw', database.cards, database.reviews, async () => {
      await database.cards.put(updatedCard);
      const id = await database.reviews.add(review);
      return id ?? 0;
    });
  },

  /**
   * Số thẻ MỚI đã bắt đầu học kể từ `sinceMs` (thẻ có review đầu tiên với `prevState === New`).
   * Dùng cho hạn mức thẻ mới theo ngày (V1-9), tính trên mọi game chứ không riêng 1 run.
   */
  async countNewCardsStartedSince(
    sinceMs: number,
    database: LexiconV3DB = defaultDb,
  ): Promise<number> {
    const rows = await database.reviews.where('ts').aboveOrEqual(sinceMs).toArray();
    return new Set(rows.filter((r) => r.prevState === State.New).map((r) => r.cardId)).size;
  },

  async getReviewsForCard(
    cardId: string,
    database: LexiconV3DB = defaultDb,
  ): Promise<ReviewRecord[]> {
    return database.reviews.where('cardId').equals(cardId).toArray();
  },
};
