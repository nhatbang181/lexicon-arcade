// Browser Web Speech API phonetics utility

export function speakEnglish(text: string, rate: number = 0.9): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const cleanText = text.replace(/[_/]/g, ' ').trim();
    if (!cleanText) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    // Attempt to pick a high-quality native English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => (v.lang.startsWith('en-US') || v.lang.startsWith('en-GB')) && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}
