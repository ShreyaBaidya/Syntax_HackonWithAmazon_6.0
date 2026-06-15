"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CartState,
  CartItem,
  Product,
  addToSharedCart,
  updateCartItemQty,
  removeFromSharedCart,
  joinSharedCart,
  placeOrder,
  searchProducts,
  getProductsByCategory,
  getRecommendations,
  leaveSharedCart,
  deleteSharedCart,
} from "@/lib/api";

import { CartRow } from './CartRow';
import { CatalogOverlay } from './CatalogOverlay';
import { useSharedCart } from '@/hooks/useSharedCart';
import { useProductSearch } from '@/hooks/useProductSearch';

interface Props {
  cartId: string;
  initialCart: CartState;
  participantName: string;
}

// Pastel colours cycled per participant
const PARTICIPANT_COLORS = [
  "#FFD814",
  "#FF9900",
  "#067D62",
  "#0066C0",
  "#CC0C39",
  "#9333EA",
  "#EA580C",
  "#16A34A",
];

function colorForParticipant(name: string, all: string[]) {
  const idx = all.indexOf(name) % PARTICIPANT_COLORS.length;
  return PARTICIPANT_COLORS[Math.max(0, idx)];
}

export function SharedCart({ cartId, initialCart, participantName }: Props) {
  const router = useRouter();
  const { cart, activity } = useSharedCart(cartId, initialCart);

  const [copied, setCopied] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [orderDone, setOrderDone] = useState<string | null>(null);

  // The first participant in the list is the owner (cart creator)
  const ownerName = cart.participants[0] ?? "";
  const isOwner = participantName === ownerName;

  // ── Product search state ─────────────────────────────────────────────────────
  const [showSearch, setShowSearch] = useState(false);
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const { query: searchQuery, setQuery: setSearchQuery, results: searchResults, setResults: setSearchResults, searching } = useProductSearch("", 8);


  const closeSearch = useCallback(() => {
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  // ── Copy share link ─────────────────────────────────────────────────────────
  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  // ── Add product to shared cart ──────────────────────────────────────────────
  const handleAddProduct = useCallback(
    async (product: Product) => {
      setAddingIds((prev) => new Set(prev).add(product.id));
      try {
        await addToSharedCart(cartId, product.id, participantName, 1);
      } catch {
        // SSE stream will reflect the latest state regardless
      } finally {
        setAddingIds((prev) => {
          const n = new Set(prev);
          n.delete(product.id);
          return n;
        });
      }
    },
    [cartId, participantName],
  );

  // ── Quantity change ─────────────────────────────────────────────────────────
  const handleQty = useCallback(
    async (productId: string, delta: number, current: number) => {
      const next = current + delta;
      if (next <= 0) {
        await removeFromSharedCart(cartId, productId);
      } else {
        await updateCartItemQty(cartId, productId, next);
      }
    },
    [cartId],
  );

  // ── Checkout ────────────────────────────────────────────────────────────────
  const handleCheckout = useCallback(() => {
    if (cart.item_count === 0) return;
    // Transform shared cart items to regular cart format
    const cartItems = Object.values(cart.items).map((item) => ({
      product: {
        id: item.product_id,
        name: item.name,
        price: item.price,
        unit: item.unit,
        image_url: item.image_url,
        category: item.category,
        eta_min: 28, // default ETA for shared cart items
      },
      quantity: item.quantity,
    }));
    // Store in separate key to avoid mixing with regular cart
    localStorage.setItem("shared_cart_checkout", JSON.stringify(cartItems));
    // Store cartId for deletion after order completion
    localStorage.setItem("shared_cart_id", cartId);
    // Navigate to cart checkout page
    router.push("/cart");
  }, [cart, cartId, router]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const itemList = Object.values(cart.items);

  // ── Order confirmed screen ──────────────────────────────────────────────────
  if (orderDone) {
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
            padding: 32,
            textAlign: "center",
            maxWidth: 360,
            width: "100%",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800 }}>
            Order Placed!
          </h2>
          <p style={{ color: "#555", fontSize: 13, margin: "0 0 4px" }}>
            {orderDone}
          </p>
          <p
            style={{
              color: "#067D62",
              fontWeight: 700,
              fontSize: 15,
              margin: "0 0 24px",
            }}
          >
            ⚡ Arriving in 28 minutes
          </p>
          <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
            Total: ₹{cart.total.toFixed(2)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ minHeight: "100vh", background: "#F7F7F7", paddingBottom: 120 }}
    >
      {/* ── Header ── */}
      <div
        style={{
          background: "#0F1111",
          padding: "12px 16px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span style={{ color: "#FFD814", fontWeight: 800, fontSize: 15 }}>
              🛒 Shared Cart
            </span>
            <span style={{ color: "#aaa", fontSize: 12, marginLeft: 8 }}>
              · {cartId}
            </span>
          </div>
          <button
            onClick={copyLink}
            style={{
              background: copied ? "#067D62" : "#FFD814",
              border: "none",
              borderRadius: 6,
              padding: "6px 14px",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
              color: "#0F1111",
              transition: "background 0.2s",
            }}
          >
            {copied ? "✓ Copied!" : "🔗 Share Link"}
          </button>
        </div>
      </div>

      {/* ── Participants ── */}
      <div
        style={{
          background: "white",
          padding: "10px 16px",
          borderBottom: "1px solid #F0F0F0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>
            ONLINE:
          </span>
          {cart.participants.map((p, idx) => (
            <div
              key={p}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "#F7F7F7",
                borderRadius: 20,
                padding: "3px 10px",
                border: `1.5px solid ${colorForParticipant(p, cart.participants)}`,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: colorForParticipant(p, cart.participants),
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: p === participantName ? 700 : 400,
                }}
              >
                {p}
                {p === participantName ? " (you)" : ""}
              </span>
              {idx === 0 && (
                <span
                  style={{
                    background: "#FF9900",
                    color: "white",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "1px 5px",
                    borderRadius: 4,
                    marginLeft: 2,
                  }}
                >
                  Owner
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Activity feed (last 5 events) ── */}
      {activity.length > 0 && (
        <div
          style={{
            background: "#FFFBEB",
            padding: "6px 16px",
            borderBottom: "1px solid #FEF3C7",
          }}
        >
          <p style={{ margin: 0, fontSize: 11, color: "#92400E" }}>
            📢 {activity[0]}
          </p>
        </div>
      )}

      {/* ── Add Products button ── */}
      <div
        style={{
          background: "white",
          padding: "8px 12px",
          borderBottom: "1px solid #F0F0F0",
        }}
      >
        <button
          onClick={() => setShowSearch(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#F0FAF6",
            border: "1.5px dashed #067D62",
            borderRadius: 8,
            padding: "8px 16px",
            cursor: "pointer",
            color: "#067D62",
            fontWeight: 700,
            fontSize: 13,
            width: "100%",
            justifyContent: "center",
          }}
        >
          ➕ Add Products
        </button>
      </div>

      {/* ── Full-screen catalog overlay ── */}
      {showSearch && (
        <CatalogOverlay
          cart={cart}
          participantName={participantName}
          onAddProduct={handleAddProduct}
          addingIds={addingIds}
          onClose={closeSearch}
        />
      )}

      {/* ── Cart items ── */}
      <div style={{ marginTop: 8 }}>
        {itemList.length === 0 ? (
          <div
            style={{
              background: "white",
              margin: 8,
              borderRadius: 8,
              padding: "40px 20px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 8 }}>🛒</div>
            <p style={{ color: "#888", fontSize: 14, margin: 0 }}>
              Cart is empty
            </p>
            <p style={{ color: "#aaa", fontSize: 12, marginTop: 4 }}>
              Search for products above to get started
            </p>
          </div>
        ) : (
          <div
            style={{
              background: "white",
              borderRadius: 8,
              margin: "0 8px",
              overflow: "hidden",
            }}
          >
            {itemList.map((item, i) => (
              <CartRow
                key={item.product_id}
                item={item}
                isLast={i === itemList.length - 1}
                participantColor={colorForParticipant(
                  item.added_by[0] ?? "",
                  cart.participants,
                )}
                canEdit={item.added_by.includes(participantName) || isOwner}
                onQty={(delta) =>
                  handleQty(item.product_id, delta, item.quantity)
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Share URL box ── */}
      <div
        style={{
          margin: "12px 8px 0",
          background: "white",
          borderRadius: 8,
          padding: "12px 14px",
        }}
      >
        <p
          style={{
            margin: "0 0 6px",
            fontSize: 11,
            fontWeight: 700,
            color: "#555",
          }}
        >
          SHARE THIS CART
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div
            style={{
              flex: 1,
              background: "#F7F7F7",
              borderRadius: 6,
              padding: "8px 10px",
              fontSize: 11,
              color: "#333",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {shareUrl}
          </div>
          <button
            onClick={copyLink}
            style={{
              background: "#FFD814",
              border: "none",
              borderRadius: 6,
              padding: "8px 14px",
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Copy
          </button>
        </div>
      </div>

      {/* ── Quit / Delete Cart ── */}
      <div style={{ margin: "12px 8px 0", display: "flex", gap: 8 }}>
        {/* Quit Cart — available to everyone */}
        <button
          onClick={async () => {
            if (!confirm("Are you sure you want to leave this cart?")) return;
            try {
              await leaveSharedCart(cartId, participantName);
              sessionStorage.removeItem(`cart_name_${cartId}`);
              window.location.href = "/";
            } catch {
              alert("Could not leave cart");
            }
          }}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: 8,
            border: "1px solid #DDD",
            background: "white",
            fontWeight: 600,
            fontSize: 12,
            cursor: "pointer",
            color: "#555",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          🚪 Quit Cart
        </button>

        {/* Delete Cart — owner only */}
        {isOwner && (
          <button
            onClick={async () => {
              if (
                !confirm(
                  "Delete this cart for everyone? This cannot be undone.",
                )
              )
                return;
              try {
                await deleteSharedCart(cartId);
                sessionStorage.removeItem(`cart_name_${cartId}`);
                window.location.href = "/";
              } catch {
                alert("Could not delete cart");
              }
            }}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 8,
              border: "1px solid #FCA5A5",
              background: "#FEF2F2",
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
              color: "#DC2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            🗑️ Delete Cart
          </button>
        )}
      </div>

      {/* ── Sticky checkout bar ── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 800,
          background: "white",
          borderTop: "1px solid #F0F0F0",
          padding: "12px 16px",
          boxShadow: "0 -4px 12px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div>
            <span style={{ fontSize: 13, color: "#555" }}>
              {cart.item_count} items ·{" "}
            </span>
            <span style={{ fontSize: 16, fontWeight: 800 }}>
              ₹{cart.total.toFixed(2)}
            </span>
          </div>
          <span style={{ fontSize: 11, color: "#067D62", fontWeight: 600 }}>
            ⚡ 28 min delivery
          </span>
        </div>
        {isOwner ? (
          <button
            onClick={handleCheckout}
            disabled={cart.item_count === 0}
            style={{
              width: "100%",
              background: cart.item_count === 0 ? "#E0E0E0" : "#FFD814",
              color: "#0F1111",
              border: "none",
              borderRadius: 8,
              padding: "14px 20px",
              fontWeight: 800,
              fontSize: 15,
              cursor: cart.item_count === 0 ? "not-allowed" : "pointer",
            }}
          >
            {`⚡ Proceed to Checkout · ₹${cart.total.toFixed(2)}`}
          </button>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "100%",
                background: "#F0F0F0",
                color: "#888",
                border: "none",
                borderRadius: 8,
                padding: "14px 20px",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              🔒 Only the cart owner can checkout
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "#aaa" }}>
              Waiting for <strong>{ownerName}</strong> to place the order
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Single cart row ────────────────────────────────────────────────────────────
