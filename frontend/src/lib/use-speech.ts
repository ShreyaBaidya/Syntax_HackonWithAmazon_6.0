"use client";
import { useState, useCallback, useRef, useEffect } from "react";

export function useSpeech(
  options: {
    onResult?: (t: string) => void;
    onError?: (e: string) => void;
  } = {},
) {
  const { onResult, onError } = options;
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      onError?.("Speech recognition not supported. Try Chrome or Edge.");
      return;
    }
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) t += e.results[i][0].transcript;
      }
      if (t) onResult?.(t);
    };
    recognition.onerror = (e: any) => {
      const msgs: Record<string, string> = {
        "not-allowed": "Microphone permission denied.",
        "no-speech": "No speech detected.",
        "audio-capture": "No microphone found.",
      };
      onError?.(msgs[e.error] || "Speech error.");
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, onResult, onError]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);
  const toggleListening = useCallback(() => {
    isListening ? stopListening() : startListening();
  }, [isListening, startListening, stopListening]);

  return { isListening, isSupported, toggleListening };
}
