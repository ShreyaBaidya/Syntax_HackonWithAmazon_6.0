"use client";

import { useState } from "react";
import { Product, placeOrder, Order } from "@/lib/api";

export type CartItem = { product: Product; quantity: number };

interface Props {
  cart: CartItem[];
  onOrderComplete: (order: Order) => void;
  onClose: () => void;
  onUpdateQty?: (productId: string, qty: number) => void;
  onAddProduct?: (product: Product) => void;
}

type Phase = "review" | "biometric" | "confirmed";

export function SpeedCheckout({
  cart,
  onOrderComplete,
  onClose,
  onUpdateQty,
}: Readonly<Props>) {
  const [phase, setPhase] = useState<Phase>("review");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  const total = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const maxEta = cart.length
    ? Math.max(...cart.map((i) => i.product.eta_min))
    : 28;

  const handleOrderNow = async () => {
    setError("");
    setPhase("biometric");
    await new Promise((r) => setTimeout(r, 1800)); // biometric animation duration

    try {
      const result = await placeOrder({
        user_id: "demo_user",
        items: cart.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
        })),
        delivery_address: "📍 Your saved address",
      });
      setOrder(result);
      setPhase("confirmed");
      onOrderComplete(result);
    } catch {
      setError("Order failed. Please try again.");
      setPhase("review");
    }
  };

  // ── Biometric animation ────────────────────────────────────────────────────
  if (phase === "biometric") {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-3xl p-10 w-full max-w-xs text-center shadow-2xl">
          <div className="w-24 h-24 mx-auto mb-5 relative">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-ping opacity-75" />
            <div className="absolute inset-2 border-4 border-blue-400 rounded-full animate-pulse" />
            <div className="absolute inset-4 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-3xl">👤</span>
            </div>
          </div>
          <p className="text-lg font-bold text-gray-900">Authenticating</p>
          <p className="text-sm text-gray-500 mt-1">
            Face ID verification in progress…
          </p>
        </div>
      </div>
    );
  }

  // ── Order confirmed ────────────────────────────────────────────────────────
  if (phase === "confirmed" && order) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
          <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Order Placed!
          </h2>
          <p className="text-gray-400 text-sm mb-5 font-mono">
            {order.order_id}
          </p>
          <div className="bg-green-50 border border-green-100 rounded-2xl p-5 mb-5">
            <p className="text-4xl font-bold text-green-600">
              {order.eta_minutes} min
            </p>
            <p className="text-sm text-green-700 font-medium mt-1">
              Estimated delivery
            </p>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Total paid:{" "}
            <span className="font-semibold text-gray-900">
              ₹{order.total_amount.toFixed(2)}
            </span>
          </p>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-base hover:bg-blue-700 active:scale-[0.98] transition-all"
          >
            Track Order →
          </button>
        </div>
      </div>
    );
  }

  // ── Order review ───────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-3xl w-full max-w-lg px-6 pt-6 pb-8 shadow-2xl">
        {/* Handle bar */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Items */}
        <div
          className="space-y-3 mb-5"
          style={{ maxHeight: "40vh", overflowY: "auto" }}
        >
          {cart.map((item) => (
            <div key={item.product.id} className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.product.image_url}
                alt={item.product.name}
                className="w-12 h-12 object-contain bg-gray-50 rounded-xl flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 leading-tight truncate">
                  {item.product.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.product.unit}
                </p>
              </div>
              {/* Qty stepper */}
              {onUpdateQty ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0,
                    background: "#FFD814",
                    borderRadius: 20,
                    border: "1px solid #F0C000",
                    overflow: "hidden",
                  }}
                >
                  <button
                    onClick={() =>
                      onUpdateQty(item.product.id, item.quantity - 1)
                    }
                    style={{
                      width: 26,
                      height: 26,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 15,
                      fontWeight: 700,
                    }}
                  >
                    {item.quantity === 1 ? "🗑" : "−"}
                  </button>
                  <span
                    style={{
                      minWidth: 16,
                      textAlign: "center",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      onUpdateQty(item.product.id, item.quantity + 1)
                    }
                    style={{
                      width: 26,
                      height: 26,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 15,
                      fontWeight: 700,
                    }}
                  >
                    +
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-400">×{item.quantity}</p>
              )}
              <p
                className="font-semibold text-gray-900 flex-shrink-0"
                style={{ minWidth: 44, textAlign: "right" }}
              >
                ₹{(item.product.price * item.quantity).toFixed(0)}
              </p>
            </div>
          ))}
        </div>

        {/* Total + ETA */}
        <div className="border-t border-gray-100 pt-4 mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹{total.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Delivery</p>
            <p className="text-2xl font-bold text-green-600">{maxEta} min</p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center mb-3">{error}</p>
        )}

        <button
          onClick={handleOrderNow}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span>Order Now</span>
          <span>→</span>
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">
          Saved address · Saved card · Face ID to confirm
        </p>
      </div>
    </div>
  );
}
