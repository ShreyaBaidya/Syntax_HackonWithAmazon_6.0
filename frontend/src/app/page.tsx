"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getRecommendations,
  Recommendations,
  Product,
  Order,
  createSharedCart,
  getSharedCart,
  getEventRecommendations,
  EventRecommendations,
} from "@/lib/api";
import { RecommendationFeed } from "@/components/RecommendationFeed";
import { SpeedCheckout, CartItem } from "@/components/SpeedCheckout";
import { AmazonHeader } from "@/components/AmazonHeader";
import { ProductCard } from "@/components/ProductCard";
import { useProfile } from "@/hooks/useProfile";
import { ProfileBanner } from "@/components/ProfileBanner";

import { LoadingSkeleton } from '@/components/LoadingSkeleton';
export default function HomePage() {
  const router = useRouter();
  const { userId, profile, exclusionSet, loading: profileLoading } = useProfile();
  const [recs, setRecs] = useState<Recommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [eventRecs, setEventRecs] = useState<EventRecommendations | null>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    try {
      const user = localStorage.getItem("amazon_now_user");
      if (!user) router.replace("/auth");
    } catch {
      /* ignore */
    }
  }, [router]);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("amazon_now_cart");
      if (saved) setCart(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, []);

  // Checkout state
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeSharedCartId, setActiveSharedCartId] = useState<string | null>(null);
  const [sharedCartTotal, setSharedCartTotal] = useState(0);
  const [sharedCartItemCount, setSharedCartItemCount] = useState(0);

  // Check for active shared cart on mount
  useEffect(() => {
    const keys = Object.keys(sessionStorage);
    const cartKey = keys.find((k) => k.startsWith("cart_name_"));
    if (cartKey) {
      const id = cartKey.replace("cart_name_", "");
      getSharedCart(id)
        .then((c) => {
          setActiveSharedCartId(id);
          setSharedCartTotal(c.total);
          setSharedCartItemCount(c.item_count);
        })
        .catch(() => {
          sessionStorage.removeItem(cartKey);
          setActiveSharedCartId(null);
        });
    }
  }, []);

  // Chat intent state (synced with NowSpeak)
  const [chatIntent, setChatIntent] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("last_chat_intent");
      if (stored) setChatIntent(stored);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const syncIntent = () => {
      try {
        const stored = sessionStorage.getItem("last_chat_intent") || null;
        setChatIntent(stored);
      } catch {
        /* ignore */
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") syncIntent();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", syncIntent);
    window.addEventListener("chat-intent-changed", syncIntent);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", syncIntent);
      window.removeEventListener("chat-intent-changed", syncIntent);
    };
  }, []);

  // Fetch recommendations with timeout
  useEffect(() => {
    if (profileLoading) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const params = new URLSearchParams();
    if (userId) params.set("user_id", userId);
    if (chatIntent) params.set("query", chatIntent);
    const qs = params.toString() ? `?${params.toString()}` : "";

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/recommendations${qs}`,
      { signal: controller.signal }
    )
      .then((res) => (res.ok ? res.json() : Promise.reject("Failed")))
      .then(setRecs)
      .catch(() => {
        try {
          const cached = sessionStorage.getItem("recs_cache");
          if (cached) setRecs(JSON.parse(cached));
        } catch {
          /* ignore */
        }
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setLoading(false);
      });
  }, [userId, chatIntent, profileLoading]);

  // Calendar event recommendations (Shreya only)
  useEffect(() => {
    let authUserId: string | undefined;
    try {
      const stored = localStorage.getItem("amazon_now_user");
      if (stored) authUserId = JSON.parse(stored).user_id;
    } catch {
      /* ignore */
    }
    if (!authUserId) {
      setEventRecs(null);
      return;
    }
    getEventRecommendations(authUserId)
      .then((data) => setEventRecs(data.enabled ? data : null))
      .catch(() => setEventRecs(null));
  }, []);

  // Handlers
  const handleProductSelect = useCallback((product: Product, qty: number) => {
    setCart((prev) => {
      const updated =
        qty === 0
          ? prev.filter((i) => i.product.id !== product.id)
          : prev.find((i) => i.product.id === product.id)
            ? prev.map((i) =>
                i.product.id === product.id ? { ...i, quantity: qty } : i,
              )
            : [...prev, { product, quantity: qty }];
      localStorage.setItem("amazon_now_cart", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleOrderComplete = (_order: Order) => {
    setCart([]);
    localStorage.removeItem("amazon_now_cart");
    setTimeout(() => setShowCheckout(false), 3200);
  };

  const handleStartSharedCart = useCallback(async () => {
    try {
      const storedName = sessionStorage.getItem("my_name") || "You";
      const cart = await createSharedCart(storedName);
      sessionStorage.setItem(`cart_name_${cart.cart_id}`, storedName);
      setActiveSharedCartId(cart.cart_id);
      router.push(`/cart/${cart.cart_id}`);
    } catch {
      alert("Could not create cart. Is the backend running?");
    }
  }, [router]);

  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div style={{ background: "#F7F7F7", minHeight: "100vh", paddingBottom: 60 }}>
      {/* Header */}
      <AmazonHeader
        cart={cart}
        onCartClick={() => cartCount > 0 && router.push("/cart")}
        onProductSelect={handleProductSelect}
      />

      {/* Dietary Profile Banner */}
      <ProfileBanner
        dietTags={profile?.diet_tags ?? []}
        allergenTags={profile?.allergen_tags ?? []}
        hasProfile={!!profile}
      />

      {/* NowSpeak CTA */}
      <div
        onClick={() => router.push("/nowspeak")}
        style={{
          background: "linear-gradient(135deg, #1565C0 0%, #1E88E5 100%)",
          margin: "8px 10px 0",
          borderRadius: 10,
          padding: "12px 14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            background: "rgba(255,255,255,0.2)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          🎙️
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: "white", fontWeight: 700, fontSize: 13, margin: 0 }}>
            NowSpeak™ — Just say what you need
          </p>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, margin: "2px 0 0" }}>
            "I have a fever" → AI finds it in seconds
          </p>
        </div>
        <svg width="16" height="16" fill="rgba(255,255,255,0.8)" viewBox="0 0 24 24">
          <path d="M10 17l5-5-5-5v10z" />
        </svg>
      </div>

      {/* Shared Cart CTAs */}
      {!activeSharedCartId && (
        <div style={{ margin: "6px 10px 0", display: "flex", gap: 8 }}>
          <div
            onClick={handleStartSharedCart}
            style={{
              flex: 1,
              background: "linear-gradient(135deg, #065F46 0%, #059669 100%)",
              borderRadius: 10,
              padding: "12px 12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
              🛒
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: "white", fontWeight: 700, fontSize: 12, margin: 0 }}>Start Cart</p>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 10, margin: "2px 0 0" }}>Create & share link</p>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Event Recommendations */}
      {eventRecs && eventRecs.recommendations.length > 0 && (
        <div style={{ margin: "8px 0 0", background: "white" }}>
          <div style={{ padding: "12px 14px", background: "linear-gradient(135deg, #EDE7F6 0%, #F3E5F5 100%)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, background: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
              🗓️
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: "#0F1111" }}>For your events today</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6A1B9A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {eventRecs.events.map((e) => e.title).join(" · ") || "Picked by AI"}
              </p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8, padding: "8px 10px 12px" }}>
            {eventRecs.recommendations.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onAddToCart={handleProductSelect}
                grid
                initialQty={cart.find((i) => i.product.id === p.id)?.quantity ?? 0}
                showDietaryInfo={(profile?.diet_tags?.length ?? 0) > 0 || (profile?.allergen_tags?.length ?? 0) > 0}
                userDietTags={profile?.diet_tags ?? []}
                userAllergenTags={profile?.allergen_tags ?? []}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Feed */}
      <div style={{ marginTop: 0 }}>
        {loading ? (
          <LoadingSkeleton />
        ) : recs ? (
          <RecommendationFeed
            nowSuggestions={recs.now_suggestions}
            reorderNudges={recs.reorder_nudges}
            trending={recs.trending}
            timeContext={recs.time_context}
            onProductSelect={handleProductSelect}
            exclusionSet={exclusionSet}
            alternatives={recs.alternatives}
            cart={cart}
            dietTags={profile?.diet_tags ?? []}
            allergenTags={profile?.allergen_tags ?? []}
          />
        ) : (
          <div style={{ textAlign: "center", padding: "40px 20px", background: "white", margin: "8px 0" }}>
            <p style={{ color: "#888", fontSize: 13 }}>Backend not running</p>
          </div>
        )}
      </div>

      {/* Floating Shared Cart Pill */}
      {activeSharedCartId && (
        <div
          onClick={() => router.push(`/cart/${activeSharedCartId}`)}
          style={{
            position: "fixed",
            bottom: 58,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 41,
            background: "#FFD814",
            color: "#0F1111",
            borderRadius: 24,
            padding: "8px 18px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
          }}
        >
          <span style={{ fontSize: 16 }}>👥</span>
          <span style={{ fontSize: 12, fontWeight: 700 }}>Shared Cart</span>
          {sharedCartItemCount > 0 && (
            <span style={{ background: "#0F1111", color: "white", borderRadius: 10, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
              ₹{sharedCartTotal.toFixed(0)} · {sharedCartItemCount} items
            </span>
          )}
        </div>
      )}

      {/* Bottom Navigation */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 800,
          background: "white",
          borderTop: "1px solid #E0E0E0",
          padding: "8px 12px",
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => router.push("/")}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
          >
            <svg width="22" height="22" fill="#0F1111" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="22" height="22" fill="#0F1111" viewBox="0 0 24 24">
              <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59L5.25 14c-.16.28-.25.61-.25.96C5 16.1 5.9 17 7 17h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H19c.75 0 1.41-.41 1.75-1.03L23 6H5.21l-.67-4H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
            {cartCount > 0 && (
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#0F1111" }}>₹{cartTotal.toFixed(0)}</p>
                <p style={{ margin: 0, fontSize: 9, color: "#888" }}>{cartCount} item{cartCount > 1 ? "s" : ""}</p>
              </div>
            )}
          </div>
        </div>
        {cartCount > 0 ? (
          <button
            onClick={() => router.push("/cart")}
            style={{
              background: "#ffd814",
              color: "black",
              border: "none",
              borderRadius: 8,
              padding: "10px 24px",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            View Cart →
          </button>
        ) : (
          <div style={{ display: "flex", gap: 16 }}>
            <button
              onClick={() => router.push("/nowspeak")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <svg width="20" height="20" fill="#888" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <span style={{ fontSize: 9, color: "#888" }}>Search</span>
            </button>
            <button
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <svg width="20" height="20" fill="#888" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              <span style={{ fontSize: 9, color: "#888" }}>Account</span>
            </button>
          </div>
        )}
      </nav>

      {/* Checkout Modal */}
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
          onAddProduct={(product) => {
            handleProductSelect(product, 1);
          }}
        />
      )}
    </div>
  );
}

