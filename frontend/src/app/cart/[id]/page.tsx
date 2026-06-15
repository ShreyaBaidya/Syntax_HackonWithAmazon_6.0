"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { CartState, getSharedCart, joinSharedCart } from "@/lib/api";
import { SharedCart } from "@/components/SharedCart";

const EMOJIS = ["🛒", "🎉", "👋", "🍕", "🥗", "🛍️", "✨", "🎯"];
const randomEmoji = () => EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

export default function CartPage() {
  const params = useParams();
  const cartId = ((params?.id as string) ?? "").toUpperCase();

  const [step, setStep] = useState<"loading" | "name" | "ready" | "error">(
    "loading",
  );
  const [cart, setCart] = useState<CartState | null>(null);
  const [participantName, setParticipantName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState("");

  // Check if cart exists
  useEffect(() => {
    if (!cartId) return;
    getSharedCart(cartId)
      .then((c) => {
        setCart(c);
        // Check if user already has a stored name for this cart
        const stored = sessionStorage.getItem(`cart_name_${cartId}`);
        if (stored) {
          setParticipantName(stored);
          setStep("ready");
        } else {
          setStep("name");
        }
      })
      .catch(() => {
        // Cart not found — clean up stale session data
        sessionStorage.removeItem(`cart_name_${cartId}`);
        setStep("error");
      });
  }, [cartId]);

  const handleJoin = async () => {
    const name = nameInput.trim() || `Guest ${randomEmoji()}`;
    try {
      const updated = await joinSharedCart(cartId, name);
      setCart(updated);
      setParticipantName(name);
      sessionStorage.setItem(`cart_name_${cartId}`, name);
      setStep("ready");
    } catch {
      setError("Could not join cart. Check the link and try again.");
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F7F7F7",
        }}
      >
        <p style={{ color: "#888", fontSize: 14 }}>Loading cart…</p>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (step === "error") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#F7F7F7",
          padding: 24,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>Cart not found</h2>
        <p style={{ color: "#888", fontSize: 13 }}>
          The cart <strong>{cartId}</strong> doesn't exist or has expired.
        </p>
        <a
          href="/"
          style={{
            marginTop: 16,
            background: "#FFD814",
            color: "#0F1111",
            padding: "10px 24px",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          Go Home
        </a>
      </div>
    );
  }

  // ── Name entry ────────────────────────────────────────────────────────────
  if (step === "name") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#F7F7F7",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 28,
            maxWidth: 360,
            width: "100%",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🛒</div>
            <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800 }}>
              Join Shared Cart
            </h2>
            <p style={{ margin: 0, color: "#888", fontSize: 13 }}>
              Cart <strong>{cartId}</strong> · {cart?.participants.length ?? 0}{" "}
              participant{(cart?.participants.length ?? 0) !== 1 ? "s" : ""}{" "}
              online
            </p>
          </div>

          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "#555",
              marginBottom: 6,
            }}
          >
            YOUR NAME (optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Rahul 🎉"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1.5px solid #DDD",
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
              marginBottom: 12,
            }}
            autoFocus
          />
          {error && (
            <p style={{ color: "#CC0C39", fontSize: 12, margin: "0 0 10px" }}>
              {error}
            </p>
          )}
          <button
            onClick={handleJoin}
            style={{
              width: "100%",
              background: "#FFD814",
              color: "#0F1111",
              border: "none",
              borderRadius: 8,
              padding: "12px",
              fontWeight: 800,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Join Cart →
          </button>
          <p
            style={{
              textAlign: "center",
              margin: "10px 0 0",
              fontSize: 11,
              color: "#aaa",
            }}
          >
            Leave name blank to join as a random guest
          </p>
        </div>
      </div>
    );
  }

  // ── Ready ─────────────────────────────────────────────────────────────────
  return (
    <SharedCart
      cartId={cartId}
      initialCart={cart!}
      participantName={participantName}
    />
  );
}
