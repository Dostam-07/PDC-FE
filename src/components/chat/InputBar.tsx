import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Paperclip, ArrowUp, Mic, AlertCircle, X, Check, Loader2, Send } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { SUPPORTED_LANGUAGES, SupportedLanguage, getLocalizedText } from '../../utils/i18n';

// Web Speech API interfaces for TypeScript
interface SpeechRecognitionEventLike extends Event {
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
  resultIndex: number;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
}

interface InputBarProps {
  onOpenDocumentUpload: () => void;
  variant?: 'default' | 'welcome';
}

export const InputBar: React.FC<InputBarProps> = ({ onOpenDocumentUpload, variant = 'default' }) => {
  const { activeConversation, sendMessage, sending } = useChat();
  const { user } = useAuth();
  const currentLang = (user?.language || 'English') as SupportedLanguage;
  const langDef = SUPPORTED_LANGUAGES[currentLang] || SUPPORTED_LANGUAGES.English;
  const isWelcome = variant === 'welcome';
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Voice Recording & Audio Waveform State (transcribes into text box when stopped)
  const WAVEFORM_BARS = 28;
  const [voiceState, setVoiceState] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [waveformLevels, setWaveformLevels] = useState<number[]>(() => Array(WAVEFORM_BARS).fill(12));
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const finalizeTimeoutRef = useRef<number | null>(null);
  const isCancelledRef = useRef(false);

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Expose mock/toggle for testing & accessibility in browser console
  useEffect(() => {
    (window as unknown as { __pdcToggleListening?: (state?: boolean) => void }).__pdcToggleListening = (state?: boolean) => {
      setVoiceState((prev) => {
        const next = state !== undefined ? (state ? 'recording' : 'idle') : (prev === 'recording' ? 'idle' : 'recording');
        return next;
      });
    };
    return () => {
      delete (window as unknown as { __pdcToggleListening?: (state?: boolean) => void }).__pdcToggleListening;
    };
  }, []);

  // Check microphone or SpeechRecognition availability
  const isVoiceSupported = useMemo(() => {
    return typeof window !== 'undefined' && (
      !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ||
      ('SpeechRecognition' in window) ||
      ('webkitSpeechRecognition' in window)
    );
  }, []);

  // Auto-resize textarea height as user types (keeping initial height low and compact)
  useEffect(() => {
    if (!isWelcome && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      if (inputText.trim()) {
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
      } else {
        textareaRef.current.style.height = '24px';
      }
    }
  }, [inputText, isWelcome]);

  const cleanupAudioResources = useCallback((abortRecognition: boolean = true) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (finalizeTimeoutRef.current) {
      clearTimeout(finalizeTimeoutRef.current);
      finalizeTimeoutRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (abortRecognition && recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudioResources(true);
    };
  }, [cleanupAudioResources]);

  // Real-time 60fps AudioContext AnalyserNode loop for waveform bars
  const startWaveformLoop = useCallback((analyser: AnalyserNode) => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);

      const nextLevels: number[] = [];
      const step = Math.max(1, Math.floor(bufferLength / WAVEFORM_BARS));
      for (let i = 0; i < WAVEFORM_BARS; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += dataArray[i * step + j] || 0;
        }
        const avg = sum / step;
        // Map 0..255 -> 15%..100% height for crisp visual feedback
        const normalized = Math.max(14, Math.min(100, Math.round((avg / 180) * 100)));
        nextLevels.push(normalized);
      }
      setWaveformLevels(nextLevels);
      animationFrameRef.current = requestAnimationFrame(update);
    };

    animationFrameRef.current = requestAnimationFrame(update);
  }, []);

  const commitTranscribedText = useCallback(() => {
    if (finalizeTimeoutRef.current) {
      clearTimeout(finalizeTimeoutRef.current);
      finalizeTimeoutRef.current = null;
    }
    cleanupAudioResources(true);

    if (isCancelledRef.current) return;

    const combined = `${finalTranscriptRef.current} ${interimTranscriptRef.current}`.trim();
    if (combined) {
      setInputText((prev) => (prev.trim() ? `${prev.trim()} ${combined}` : combined));
      setTimeout(() => textareaRef.current?.focus(), 50);
    } else {
      setSpeechError('No speech detected. Please speak clearly or type your message.');
    }
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    setRecordingSeconds(0);
    setWaveformLevels(Array(WAVEFORM_BARS).fill(12));
    setVoiceState('idle');
  }, [cleanupAudioResources]);

  const discardRecording = useCallback(() => {
    isCancelledRef.current = true;
    cleanupAudioResources(true);
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    setRecordingSeconds(0);
    setWaveformLevels(Array(WAVEFORM_BARS).fill(12));
    setVoiceState('idle');
  }, [cleanupAudioResources]);

  const finishRecording = useCallback(() => {
    isCancelledRef.current = false;
    setVoiceState('processing');

    // Stop waveform & mic stream, but let SpeechRecognition flush its final results before committing
    cleanupAudioResources(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        commitTranscribedText();
        return;
      }
      // Safety fallback in case browser doesn't fire onend promptly
      finalizeTimeoutRef.current = window.setTimeout(() => {
        commitTranscribedText();
      }, 1200);
    } else {
      commitTranscribedText();
    }
  }, [cleanupAudioResources, commitTranscribedText]);

  const startRecording = useCallback(async () => {
    setSpeechError(null);
    isCancelledRef.current = false;
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    setRecordingSeconds(0);
    setWaveformLevels(Array(WAVEFORM_BARS).fill(14));

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setSpeechError('Microphone access is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 1. Setup Web Audio API Analyser for real-time audio-reactive waveform
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.78;
        source.connect(analyser);
        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
        startWaveformLoop(analyser);
      }

      // 2. Run SpeechRecognition silently in background so it populates the text box when recording stops
      const SpeechRecognitionClass =
        (window as unknown as { SpeechRecognition?: { new(): SpeechRecognitionLike } }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: { new(): SpeechRecognitionLike } }).webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        try {
          const recognition = new SpeechRecognitionClass();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = langDef.speechCode || navigator.language || 'en-IN';
          recognition.onresult = (event: SpeechRecognitionEventLike) => {
            let finalChunk = '';
            let interimChunk = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const res = event.results[i];
              const transcript = res[0]?.transcript || '';
              if (res.isFinal) {
                finalChunk += ` ${transcript}`;
              } else {
                interimChunk += ` ${transcript}`;
              }
            }
            if (finalChunk.trim()) {
              finalTranscriptRef.current = `${finalTranscriptRef.current} ${finalChunk.trim()}`.trim();
              interimTranscriptRef.current = '';
            } else if (interimChunk.trim()) {
              interimTranscriptRef.current = interimChunk.trim();
            }
          };
          recognition.onend = () => {
            if (!isCancelledRef.current && recognitionRef.current) {
              commitTranscribedText();
            }
          };
          recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
              setSpeechError('Microphone access was denied. Please allow microphone permissions.');
              discardRecording();
            }
          };
          recognitionRef.current = recognition;
          recognition.start();
        } catch {}
      }

      setVoiceState('recording');
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err: unknown) {
      console.error('Failed to access microphone:', err);
      cleanupAudioResources(true);
      setSpeechError('Microphone access was denied. Please allow microphone permissions.');
      setVoiceState('idle');
    }
  }, [cleanupAudioResources, commitTranscribedText, discardRecording, langDef.speechCode, startWaveformLoop]);

  const handleSend = () => {
    if (voiceState === 'recording') {
      finishRecording();
      return;
    }
    if (!inputText.trim() || sending) return;
    sendMessage(inputText.trim());
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const inputPlaceholder = isWelcome && currentLang === 'English'
    ? 'Describe your task or ask a question, and Program Design Companion will guide you through it...'
    : getLocalizedText('input.placeholder', currentLang);

  return (
    <div className={isWelcome ? 'w-full space-y-2' : 'p-3 bg-white border-t border-gray-100 space-y-1.5'}>
      {/* Speech Error Banner */}
      {speechError && (
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs animate-fade-in">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
            <span>{speechError}</span>
          </div>
          <button
            onClick={() => setSpeechError(null)}
            className="text-rose-500 hover:text-rose-800 text-[11px] font-medium underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Modern Floating Input Capsule (ChatGPT / Claude / WhatsApp Style) */}
      <div className="relative">
        {voiceState === 'recording' ? (
          /* Active Recording HUD: Clean single-row capsule with Cancel, Live Timer, Audio-Reactive Waveform, and Confirm */
          <div className="flex items-center gap-2 sm:gap-3 border border-rose-200 bg-rose-50/50 rounded-2xl p-2 sm:px-3 sm:py-2 shadow-2xs ring-2 ring-rose-100/70 transition-all animate-fade-in">
            {/* Cancel / Discard Button */}
            <button
              type="button"
              onClick={discardRecording}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-rose-600 hover:bg-rose-100/80 transition-colors cursor-pointer shrink-0"
              title="Discard recording"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Pulsing Rec Dot + Live Digital Timer */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
              </span>
              <span className="text-[12.5px] font-mono font-semibold text-gray-800 tabular-nums min-w-[36px]">
                {formatDuration(recordingSeconds)}
              </span>
            </div>

            {/* Real-time Audio-Reactive Waveform Visualizer */}
            <div
              className="flex-1 flex items-center justify-center gap-[3px] h-7 px-2 overflow-hidden"
              aria-label="Recording audio waveform"
            >
              {waveformLevels.map((level, idx) => (
                <span
                  key={idx}
                  className="w-[3px] rounded-full bg-gradient-to-t from-purple-600 to-rose-500 transition-[height] duration-75 ease-out"
                  style={{ height: `${Math.max(16, level)}%` }}
                />
              ))}
            </div>

            {/* Confirm / Stop Recording Button */}
            <button
              type="button"
              onClick={finishRecording}
              className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-xs cursor-pointer active:scale-90 transition-all shrink-0"
              title="Finish recording"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        ) : voiceState === 'processing' ? (
          /* Brief Transcribing State */
          <div className="flex items-center justify-center gap-2.5 border border-purple-200 bg-purple-50/40 rounded-2xl p-2.5 sm:py-3 text-xs font-medium text-purple-800 shadow-2xs animate-fade-in">
            <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
            <span>Transcribing voice into text box...</span>
          </div>
        ) : (
          /* Standard Text Composer Capsule */
          <div
            className={
              isWelcome
                ? 'flex items-center gap-2 border rounded-full px-3.5 py-2 transition-all bg-white border-purple-300/90 hover:border-purple-400 focus-within:border-purple-500 shadow-[0_4px_24px_rgba(124,58,237,0.10)] focus-within:ring-4 focus-within:ring-purple-100/70'
                : 'flex items-end gap-1.5 sm:gap-2 border rounded-2xl p-1.5 sm:p-2 transition-all shadow-2xs bg-gray-50/60 hover:bg-white focus-within:bg-white border-gray-200/90 hover:border-gray-300 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-100/60'
            }
          >
            {/* Document Upload Button */}
            <button
              type="button"
              onClick={onOpenDocumentUpload}
              className={
                isWelcome
                  ? 'p-2 rounded-full text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer shrink-0'
                  : 'p-1 sm:p-1.5 rounded-xl text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer shrink-0'
              }
              title="Upload reference document or baseline data"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Text Input / Textarea */}
            <div className="flex-1 min-w-0 relative py-1 px-1 overflow-hidden">
              {isWelcome ? (
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={inputPlaceholder}
                  className="w-full bg-transparent border-0 text-[13px] sm:text-[13.5px] text-gray-900 placeholder-gray-400 focus:outline-none leading-normal p-0 font-sans block h-6 truncate placeholder:truncate placeholder:text-ellipsis overflow-hidden"
                />
              ) : (
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  rows={1}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={inputPlaceholder}
                  className="w-full bg-transparent border-0 text-[13px] sm:text-[13.5px] text-gray-900 placeholder-gray-400 focus:outline-none resize-none max-h-28 sm:max-h-32 leading-normal p-0 font-sans block h-6 min-h-[24px]"
                />
              )}
            </div>

            {/* Keyboard helper hint */}
            {!isWelcome && (
              <span className="hidden sm:inline-block text-[10px] text-gray-300 font-mono self-center pr-1 select-none pointer-events-none">
                ↵
              </span>
            )}

            {/* Voice Microphone Button */}
            {isVoiceSupported && (
              <button
                type="button"
                onClick={startRecording}
                className={
                  isWelcome
                    ? 'w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center transition-all cursor-pointer shrink-0 text-gray-600 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50 active:scale-95'
                    : 'p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer shrink-0 text-gray-400 hover:text-purple-600 hover:bg-purple-50 active:scale-95'
                }
                title="Record voice input"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}

            {/* Send Button */}
            {isWelcome ? (
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim() || sending}
                className={`h-9 px-4 rounded-full flex items-center justify-center gap-1.5 text-[12.5px] font-semibold transition-all shrink-0 ${
                  inputText.trim() && !sending
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs cursor-pointer active:scale-95'
                    : 'bg-purple-100/80 text-purple-400 cursor-not-allowed'
                }`}
                title={sending ? 'Generating response...' : 'Send message (Enter)'}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim() || sending}
                className={`w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                  inputText.trim() && !sending
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs cursor-pointer active:scale-90'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                title={sending ? 'Generating response...' : 'Send message (Enter)'}
              >
                <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.4]" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modern Disclaimer Footer */}
      {!isWelcome && (
        <div className="text-center text-[10px] text-gray-400 select-none font-sans truncate px-2 pt-0.5">
          PDC AI Companion • Synthesizes LFA frameworks grounded in education research
        </div>
      )}
    </div>
  );
};
