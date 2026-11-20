import React, { createContext, useContext, useState } from 'react';

export type SfxName =
  | 'tap'
  | 'correct'
  | 'wrong'
  | 'combo'
  | 'reveal'
  | 'tick'
  | 'timeup'
  | 'goal'
  | 'levelup'
  | 'record_start'
  | 'record_stop'
  | 'page';

export interface AudioContextValue {
  sfxVolume: number; // 0..100, default 60
  setSfxVolume: (v: number) => void;
  muted: boolean;
  setMuted: (m: boolean) => void;
  toggleMute: () => void;
  playSfx: (name: SfxName) => void;
}

const AudioContext = createContext<AudioContextValue>({
  sfxVolume: 60,
  setSfxVolume: () => undefined,
  muted: false,
  setMuted: () => undefined,
  toggleMute: () => undefined,
  playSfx: () => undefined,
});

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sfxVolume, setSfxVolumeState] = useState<number>(60);
  const [muted, setMuted] = useState<boolean>(false);

  const setSfxVolume = (v: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(v)));
    setSfxVolumeState(clamped);
    if (clamped === 0) setMuted(true);
    else if (muted) setMuted(false);
  };

  const toggleMute = () => setMuted((prev) => !prev);

  const playSfx = (_name: SfxName) => {
    // Khung AudioProvider M0: sẽ kết nối sprite howler ở M1/M3 khi có sfx.webm
    if (muted || sfxVolume <= 0) return;
  };

  return (
    <AudioContext.Provider
      value={{
        sfxVolume,
        setSfxVolume,
        muted,
        setMuted,
        toggleMute,
        playSfx,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export function useAudio(): AudioContextValue {
  return useContext(AudioContext);
}
