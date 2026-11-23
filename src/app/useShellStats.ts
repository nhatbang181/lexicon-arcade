import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../core/storage/db';
import { displayStreakCount } from '../core/gamification/streak';

export interface ShellStats {
  streak: number;
  freezes: number;
  xp: number;
  loaded: boolean;
}

/** Streak/XP thật của người học cho thanh điều hướng (F2, U18, LUAT D9). Tự cập nhật khi DB đổi. */
export function useShellStats(): ShellStats {
  const profile = useLiveQuery(() => db.profile.get('me'), []);
  if (!profile) return { streak: 0, freezes: 0, xp: 0, loaded: false };
  return {
    streak: displayStreakCount(profile.streak, new Date()),
    freezes: profile.streak.freezes,
    xp: profile.xp,
    loaded: true,
  };
}
