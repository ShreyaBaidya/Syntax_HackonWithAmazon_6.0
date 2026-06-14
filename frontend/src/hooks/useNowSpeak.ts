'use client';

import { useState, useCallback, useRef } from 'react';
import { openChatStream, Product } from '@/lib/api';

export type ChatMessage = {
  role: 'user' | 'assistant';
  text: string;
  products?: Product[];
};

export interface NowSpeakHook {
  messages: ChatMessage[];
  isStreaming: boolean;
  sendMessage: (text: string) => Promise<void>;
  reset: () => void;
}

/**
 * Manages the NowSpeak chat state and consumes the SSE stream from the backend.
 * Each user turn triggers a new POST /api/v1/chat call; the response is
 * streamed in as text deltas and then a products payload.
 */
export function useNowSpeak(): NowSpeakHook {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  // Stable session ID for the lifetime of this hook instance
  const sessionId = useRef(
    typeof crypto !== 'undefined' ? crypto.randomUUID() : `session-${Date.now()}`
  );

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    // Store the user's intent so the home page can react to it
    try {
      sessionStorage.setItem('last_chat_intent', trimmed);
      console.log('[NowSpeak] Stored chat intent:', trimmed);
      // Dispatch custom event so home page picks up the change immediately
      window.dispatchEvent(new Event('chat-intent-changed'));
    } catch { /* sessionStorage unavailable */ }

    // Append user bubble immediately
    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setIsStreaming(true);

    // Placeholder assistant bubble — we'll update it in-place
    setMessages(prev => [...prev, { role: 'assistant', text: '', products: [] }]);

    try {
      const response = await openChatStream(trimmed, sessionId.current);
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';           // keep incomplete last line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === 'text') {
              assistantText += event.delta;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  text: assistantText,
                };
                return updated;
              });
            } else if (event.type === 'products') {
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  products: event.products as Product[],
                };
                return updated;
              });
            }
            // 'done' and 'error' just end the loop gracefully
          } catch {
            // Malformed SSE line — skip
          }
        }
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          text: "Sorry, I couldn't reach the server. Please try again.",
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming]);

  const reset = useCallback(() => {
    setMessages([]);
    sessionId.current =
      typeof crypto !== 'undefined' ? crypto.randomUUID() : `session-${Date.now()}`;
  }, []);

  return { messages, isStreaming, sendMessage, reset };
}
