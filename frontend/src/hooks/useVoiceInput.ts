"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
// Web Speech API types aren't included in TS's DOM lib — declare them here
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
  type SpeechRecognition = any;
  type SpeechRecognitionEvent = any;
}

import { useState, useRef, useCallback } from "react";

export interface VoiceInputHook {
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
}

/**
 * Wraps the Web Speech API (SpeechRecognition).
 * Calls onResult with the final transcript when speech ends.
 * Gracefully no-ops in environments without browser speech support.
 */
export function useVoiceInput(
  onResult: (transcript: string) => void,
): VoiceInputHook {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startListening = useCallback(() => {
    if (!isSupported || isListening) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR =
      (window as any).SpeechRecognition ??
      (window as any).webkitSpeechRecognition;
    const recognition: SpeechRecognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.resultIndex][0].transcript.trim();
      if (transcript) onResult(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, isListening, onResult]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, startListening, stopListening, isSupported };
}
