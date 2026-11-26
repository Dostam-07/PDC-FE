// Speech Synthesis (TTS) & Web Speech Recognition (STT) Service

export const speakText = (text: string) => {
  if (!('speechSynthesis' in window)) {
    console.warn("Speech synthesis not supported on this browser.");
    return;
  }

  // Clean markdown tags for TTS
  const cleanText = text.replace(/[*#_`]/g, '');

  window.speechSynthesis.cancel(); // Stop active audio
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
};

export const stopSpeech = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export const createSpeechRecognition = (onResult: (text: string) => void, onError?: (err: any) => void) => {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn("Speech recognition is not supported in this browser.");
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };

  if (onError) {
    recognition.onerror = onError;
  }

  return recognition;
};
