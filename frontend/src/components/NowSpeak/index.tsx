"use client";

import { useState, useRef, useEffect } from "react";
import { useNowSpeak } from "@/hooks/useNowSpeak";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { ProductCard } from "@/components/ProductCard";
import { Product } from "@/lib/api";

const QUICK_PROMPTS = [
  { label: "I have a fever 🤒", q: "I have a fever and need medicine fast" },
  { label: "Need coffee ☕", q: "Need instant coffee urgently" },
  { label: "Party supplies 🎉", q: "Party snacks and drinks for tonight" },
  { label: "Running low on milk 🥛", q: "Need milk delivered fast" },
];

interface Props {
  onProductSelect?: (product: Product) => void;
}

export function NowSpeak({ onProductSelect }: Props) {
  const [inputText, setInputText] = useState("");
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isStreaming, sendMessage } = useNowSpeak();

  const handleVoiceResult = (transcript: string) => {
    sendMessage(transcript);
  };

  const { isListening, startListening, stopListening, isSupported } =
    useVoiceInput(handleVoiceResult);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText("");
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#F3F3F3",
      }}
    >
      {/* Messages area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 0" }}>
        {messages.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              height: "100%",
              textAlign: "center",
              paddingTop: 20,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "#FFF3E0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                marginBottom: 16,
                border: "2px solid #FF9900",
              }}
            >
              🎙️
            </div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#0F1111",
                margin: "0 0 6px",
              }}
            >
              What do you need?
            </h2>
            <p
              style={{
                color: "#565959",
                fontSize: 13,
                maxWidth: 260,
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              Speak or type your need — we deliver in 30 minutes.
            </p>

            {/* Quick prompts */}
            <div
              style={{
                marginTop: 20,
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                justifyContent: "center",
                maxWidth: 340,
              }}
            >
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => sendMessage(p.q)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 20,
                    background: "white",
                    color: "#0F1111",
                    fontSize: 12,
                    border: "1px solid #DDD",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div style={{ maxWidth: "88%" }}>
                {msg.role === "user" ? (
                  <div
                    style={{
                      background: "#232F3E",
                      color: "white",
                      padding: "10px 14px",
                      borderRadius: "18px 18px 4px 18px",
                      fontSize: 13,
                      lineHeight: 1.5,
                    }}
                  >
                    {msg.text}
                  </div>
                ) : (
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {(msg.text ||
                      (isStreaming && i === messages.length - 1)) && (
                      <div
                        style={{
                          background: "white",
                          border: "1px solid #E8E8E8",
                          padding: "10px 14px",
                          borderRadius: "18px 18px 18px 4px",
                          fontSize: 13,
                          lineHeight: 1.5,
                          color: "#0F1111",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                        }}
                      >
                        {msg.text}
                        {isStreaming && i === messages.length - 1 && (
                          <span
                            style={{
                              display: "inline-block",
                              width: 6,
                              height: 14,
                              background: "#FF9900",
                              marginLeft: 4,
                              borderRadius: 2,
                              verticalAlign: "middle",
                              animation: "pulse 1s infinite",
                            }}
                          />
                        )}
                      </div>
                    )}
                    {/* Product cards */}
                    {msg.products && msg.products.length > 0 && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 8,
                        }}
                      >
                        {msg.products.map((p) => (
                          <ProductCard
                            key={p.id}
                            product={p}
                            onAddToCart={(product, _qty) =>
                              onProductSelect?.(product)
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div ref={messagesEndRef} style={{ height: 12 }} />
      </div>

      {/* Input bar — Amazon style */}
      <div
        style={{
          background: "white",
          borderTop: "1px solid #DDD",
          padding: "10px 10px 12px",
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", gap: 8, alignItems: "center" }}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isListening
                ? "🎤 Listening..."
                : "Search or describe what you need..."
            }
            disabled={isStreaming || isListening}
            style={{
              flex: 1,
              border: "1px solid #DDD",
              borderRadius: 4,
              padding: "10px 12px",
              fontSize: 13,
              outline: "none",
              background: isStreaming ? "#F3F3F3" : "white",
              color: "#0F1111",
            }}
          />

          {mounted && isSupported && (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              disabled={isStreaming}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "none",
                background: isListening ? "#CC0C39" : "#F3F3F3",
                color: isListening ? "white" : "#565959",
                cursor: "pointer",
                fontSize: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: isListening ? "pulse 1s infinite" : "none",
              }}
            >
              🎤
            </button>
          )}

          <button
            type="submit"
            disabled={!inputText.trim() || isStreaming}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: inputText.trim() ? "#FF9900" : "#DDD",
              border: "none",
              cursor: inputText.trim() ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
