import { useEffect, useState } from "react";
import { getFridgeStatus, FridgeStatus, Product } from "@/lib/api";

export function SmartFridgeWidget({
  onAddAll,
}: {
  onAddAll: (items: any[]) => void;
}) {
  const [status, setStatus] = useState<FridgeStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFridgeStatus()
      .then(setStatus)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !status || status.alerts === 0) return null;

  return (
    <div
      style={{
        margin: "8px 10px 0",
        background: "white",
        borderRadius: 10,
        overflow: "hidden",
        border: "1px solid #E0F7FA",
      }}
    >
      <div
        style={{
          padding: "12px 14px",
          background: "linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            background: "white",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            flexShrink: 0,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          ❄️
        </div>
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontWeight: 800,
              fontSize: 13,
              color: "#006064",
            }}
          >
            Smart Fridge Alert
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#00838F" }}>
            {status.alerts} items detected as critically low
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Wrap these auto_cart items into a dummy Product shape to pass up
            const itemsToSelect = status.auto_cart.map((item) => ({
              id: item.id,
              name: item.name,
              price: 0, // In a real app we'd fetch full product info
              quantity: item.suggested_qty,
            }));
            onAddAll(itemsToSelect);
          }}
          style={{
            background: "#FFD814",
            color: "#0F1111",
            border: "none",
            borderRadius: 6,
            padding: "7px 14px",
            fontWeight: 700,
            fontSize: 11,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Add to Cart →
        </button>
      </div>
      <div style={{ padding: "8px 14px", background: "#FAFAFA" }}>
        {status.auto_cart.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              marginBottom: 4,
            }}
          >
            <span style={{ fontWeight: 600, color: "#333" }}>
              {item.name}{" "}
              <span style={{ color: "#888" }}>x{item.suggested_qty}</span>
            </span>
            <span style={{ color: "#D32F2F", fontSize: 9 }}>{item.reason}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
