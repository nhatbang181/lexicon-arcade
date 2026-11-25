import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  CANONICAL_SFX_CUES,
  sfxEngine,
  type CanonicalSfxCue,
  type PlaySfxOptions,
  type SfxName,
} from '../../core/audio/sfx';
import { profileRepo } from '../../core/storage/repos/profileRepo';

export { CANONICAL_SFX_CUES, type CanonicalSfxCue, type PlaySfxOptions, type SfxName };

export interface AudioContextValue {
  sfxVolume: number; // 0..100, default 60
  setSfxVolume: (v: number) => void;
  muted: boolean;
  setMuted: (m: boolean) => void;
  toggleMute: () => void;
  playSfx: (name: SfxName, options?: PlaySfxOptions) => void;
  lastPlayedCue: SfxName | null;
}

const LS_VOL_KEY = 'lexicon:sfxVolume';
const LS_MUTE_KEY = 'lexicon:sfxMuted';

function normalizeVolumeScale(raw: number): number {
  if (!Number.isFinite(raw)) return 60;
  // Tương thích ngược profile cũ dùng thang 0..1 (A9)
  const scaled = raw > 0 && raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
  return Math.max(0, Math.min(100, scaled));
}

function readSavedVolume(): number {
  try {
    const raw = localStorage?.getItem(LS_VOL_KEY);
    if (raw !== null) return normalizeVolumeScale(Number(raw));
  } catch {
    // ignore
  }
  return 60;
}

function readSavedMuted(): boolean {
  try {
    return localStorage?.getItem(LS_MUTE_KEY) === 'true';
  } catch {
    return false;
  }
}

const AudioContext = createContext<AudioContextValue>({
  sfxVolume: 60,
  setSfxVolume: () => undefined,
  muted: false,
  setMuted: () => undefined,
  toggleMute: () => undefined,
  playSfx: () => undefined,
  lastPlayedCue: null,
});

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sfxVolume, setSfxVolumeState] = useState<number>(readSavedVolume);
  const [muted, setMutedState] = useState<boolean>(readSavedMuted);
  const [lastPlayedCue, setLastPlayedCue] = useState<SfxName | null>(null);

  useEffect(() => {
    sfxEngine.init();
    sfxEngine.setVolume(sfxVolume);
    sfxEngine.setMuted(muted);

    if (typeof indexedDB !== 'undefined') {
      void profileRepo
        .get()
        .then((profile) => {
          if (!profile || typeof profile.sfxVolume !== 'number') return;
          const vol = normalizeVolumeScale(profile.sfxVolume);
          if (vol === 0) {
            setMutedState(true);
            sfxEngine.setMuted(true);
          } else {
            setSfxVolumeState(vol);
            sfxEngine.setVolume(vol);
          }
        })
        .catch(() => undefined);
    }
  }, []);

  const persistVolume = useCallback((vol: number, isMuted: boolean) => {
    try {
      localStorage?.setItem(LS_VOL_KEY, String(vol));
      localStorage?.setItem(LS_MUTE_KEY, String(isMuted));
    } catch {
      // ignore
    }
    if (typeof indexedDB !== 'undefined') {
      void profileRepo.update({ sfxVolume: isMuted ? 0 : vol }).catch(() => undefined);
    }
  }, []);

  const setSfxVolume = useCallback(
    (v: number) => {
      const clamped = Math.max(0, Math.min(100, Math.round(v)));
      const nextMuted = clamped === 0;
      setSfxVolumeState(clamped);
      sfxEngine.setVolume(clamped);
      setMutedState(nextMuted);
      sfxEngine.setMuted(nextMuted);
      persistVolume(clamped, nextMuted);
    },
    [persistVolume],
  );

  const setMuted = useCallback(
    (m: boolean) => {
      setMutedState(m);
      sfxEngine.setMuted(m);
      persistVolume(sfxVolume, m);
    },
    [sfxVolume, persistVolume],
  );

  const toggleMute = useCallback(() => {
    setMutedState((prev) => {
      const next = !prev;
      sfxEngine.setMuted(next);
      persistVolume(sfxVolume, next);
      return next;
    });
  }, [sfxVolume, persistVolume]);

  const playSfx = useCallback(
    (name: SfxName, options?: PlaySfxOptions) => {
      if (muted || sfxVolume <= 0) return;
      sfxEngine.play(name, options);
      setLastPlayedCue(name);
    },
    [muted, sfxVolume],
  );

  return (
    <AudioContext.Provider
      value={{
        sfxVolume,
        setSfxVolume,
        muted,
        setMuted,
        toggleMute,
        playSfx,
        lastPlayedCue,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export function useAudio(): AudioContextValue {
  return useContext(AudioContext);
}
