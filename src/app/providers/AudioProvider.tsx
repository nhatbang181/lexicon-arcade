import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  CANONICAL_SFX_CUES,
  sfxEngine,
  type CanonicalSfxCue,
  type PlaySfxOptions,
  type SfxName,
} from '../../core/audio/sfx';

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
  const [sfxVolume, setSfxVolumeState] = useState<number>(60);
  const [muted, setMutedState] = useState<boolean>(false);
  const [lastPlayedCue, setLastPlayedCue] = useState<SfxName | null>(null);

  useEffect(() => {
    sfxEngine.init();
    sfxEngine.setVolume(sfxVolume);
    sfxEngine.setMuted(muted);
  }, []);

  const setSfxVolume = useCallback(
    (v: number) => {
      const clamped = Math.max(0, Math.min(100, Math.round(v)));
      setSfxVolumeState(clamped);
      sfxEngine.setVolume(clamped);
      if (clamped === 0) {
        setMutedState(true);
        sfxEngine.setMuted(true);
      } else if (muted) {
        setMutedState(false);
        sfxEngine.setMuted(false);
      }
    },
    [muted]
  );

  const setMuted = useCallback((m: boolean) => {
    setMutedState(m);
    sfxEngine.setMuted(m);
  }, []);

  const toggleMute = useCallback(() => {
    setMutedState((prev) => {
      const next = !prev;
      sfxEngine.setMuted(next);
      return next;
    });
  }, []);

  const playSfx = useCallback(
    (name: SfxName, options?: PlaySfxOptions) => {
      if (muted || sfxVolume <= 0) return;
      sfxEngine.play(name, options);
      setLastPlayedCue(name);
    },
    [muted, sfxVolume]
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
