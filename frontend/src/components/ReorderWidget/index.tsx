"use client";

import { Product } from "@/lib/api";

interface Props {
  onAddToCart?: (product: Product, qty: number) => void;
}

interface ReorderItem extends Product {
  daysAgo: number;
  cycleLabel: string;
}

const REORDER_ITEMS: ReorderItem[] = [
  {
    id: "reorder_milk",
    name: "Amul Taza Milk 1L",
    price: 62,
    category: "dairy",
    image_url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=400&h=400&q=80",
    unit: "1L",
    eta_min: 8,
    daysAgo: 7,
    cycleLabel: "Weekly staple",
  },
  {
    id: "reorder_atta",
    name: "Aashirvaad Atta 5kg",
    price: 285,
    category: "grocery",
    image_url: "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&w=400&h=400&q=80",
    unit: "5kg",
    eta_min: 12,
    daysAgo: 22,
    cycleLabel: "Monthly buy",
  },
  {
    id: "reorder_salt",
    name: "Tata Salt 1kg",
    price: 24,
    category: "grocery",
    image_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&h=400&q=80",
    unit: "1kg",
    eta_min: 8,
    daysAgo: 30,
    cycleLabel: "Monthly buy",
  },
];

export function ReorderWidget({ onAddToCart }: Props) {
  const handleAddAll = () => {
    REORDER_ITEMS.forEach((item) => onAddToCart?.(item, 1));
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: 12,
        border: "1px solid #E8E8E8",
        padding: 16,
        marginBottom: 0,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🔁</span>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F1111", margin: 0 }}>
              Time to Restock?
            </h3>
            <p style={{ fontSize: 10, color: "#888", margin: "2px 0 0" }}>
              Based on your purchase history
            </p>
          </div>
        </div>
        <button
          onClick={handleAddAll}
          style={{
            background: "#FFD814",
            color: "#0F1111",
            border: "none",
            borderRadius: 6,
            padding: "5px 10px",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Add All
        </button>
      </div>

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {REORDER_ITEMS.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#FAFAFA",
              borderRadius: 8,
              padding: "8px 10px",
            }}
          >
            {/* Icon placeholder */}
            <div
              style={{
                width: 44,
                height: 44,
                background: "#FAFAFA",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image_url}
                  alt={item.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
                />
              ) : (
                <div style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>
                  {item.name.split(" ")[0]}
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#0F1111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.name}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: 10, color: "#E65100", fontWeight: 600 }}>
                  ⏱ {item.daysAgo}d ago
                </span>
                <span style={{ fontSize: 10, color: "#888" }}>·</span>
                <span style={{ fontSize: 10, color: "#888" }}>{item.cycleLabel}</span>
              </div>
            </div>

            {/* Price + button */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0F1111" }}>
                ₹{item.price}
              </span>
              <button
                onClick={() => onAddToCart?.(item, 1)}
                style={{
                  background: "#FF9900",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Re-add
              </button>
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 10, color: "#AAA", margin: "10px 0 0", textAlign: "center" }}>
        AI predicted based on your buying cycle
      </p>
    </div>
  );
}
