"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NowSpeak } from "@/components/NowSpeak";
import { SpeedCheckout, CartItem } from "@/components/SpeedCheckout";
import { Product, Order } from "@/lib/api";

export default function NowSpeakPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);

  // Load cart on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("amazon_now_cart");
      if (saved) setCart(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, []);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      const updated = existing
        ? prev.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          )
        : [...prev, { product, quantity: 1 }];
      try {
        localStorage.setItem("amazon_now_cart", JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      return updated;
    });
  };

  const handleOrderComplete = (_order: Order) => {
    setCart([]);
    setTimeout(() => setShowCheckout(false), 3200);
  };

  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#EAEDED",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "#232F3E",
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg width="22" height="22" fill="white" viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  color: "white",
                  fontWeight: 700,
                  fontSize: 16,
                  letterSpacing: "-0.5px",
                  lineHeight: 1,
                }}
              >
                amazon
              </span>
              <svg width="46" height="7" viewBox="0 0 46 7">
                <path
                  d="M1 2 Q12 7 23 6 Q34 5 45 2"
                  stroke="#FF9900"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
                <polygon points="41,1 45,3 42,5" fill="#FF9900" />
              </svg>
            </div>
            {/* cyan "now" badge */}
            <div
              style={{
                background: "#00C2E0",
                borderRadius: 3,
                padding: "2px 7px 3px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#0F1111",
                  fontStyle: "italic",
                }}
              >
                now
              </span>
            </div>
          </div>
          <p style={{ color: "#67B0D1", fontSize: 10, margin: 0 }}>
            Voice + AI · 30-min delivery
          </p>
        </div>

        {cartCount > 0 && (
          <button
            onClick={() => setShowCheckout(true)}
            style={{
              background: "#FF9900",
              color: "white",
              border: "none",
              borderRadius: 4,
              padding: "6px 12px",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            🛒 {cartCount} · ₹{cartTotal.toFixed(0)}
          </button>
        )}
      </header>

      {/* NowSpeak chat */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <NowSpeak onProductSelect={addToCart} />
      </div>

      {showCheckout && cart.length > 0 && (
        <SpeedCheckout
          cart={cart}
          onOrderComplete={handleOrderComplete}
          onClose={() => setShowCheckout(false)}
          onUpdateQty={(productId, qty) => {
            if (qty <= 0) {
              setCart((prev) => prev.filter((i) => i.product.id !== productId));
            } else {
              setCart((prev) =>
                prev.map((i) =>
                  i.product.id === productId ? { ...i, quantity: qty } : i,
                ),
              );
            }
          }}
        />
      )}
    </div>
  );
}
