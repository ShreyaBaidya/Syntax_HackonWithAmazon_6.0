"use client";

import { Product } from "@/lib/api";

interface Props {
  onAddToCart?: (product: Product, qty: number) => void;
}

const RUNNING_LOW_ITEMS: Product[] = [
  {
    id: "running_low_milk",
    name: "Fresh Milk 1L",
    price: 65,
    category: "dairy",
    image_url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=400&h=400&q=80",
    unit: "1L",
    eta_min: 8,
  },
  {
    id: "running_low_bread",
    name: "Whole Wheat Bread",
    price: 45,
    category: "grocery",
    image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&h=400&q=80",
    unit: "400g",
    eta_min: 10,
  },
  {
    id: "running_low_eggs",
    name: "Farm Fresh Eggs (6)",
    price: 52,
    category: "fresh",
    image_url: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=400&h=400&q=80",
    unit: "6 pcs",
    eta_min: 12,
  },
];

export function SmartFridgeWidget({ onAddToCart }: Props) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 12,
        border: "1px solid #E8E8E8",
        padding: 16,
        marginBottom: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>🧊</span>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F1111", margin: 0 }}>
          Running Low in Fridge
        </h3>
      </div>

      {/* Items grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        {RUNNING_LOW_ITEMS.map((item) => (
          <div
            key={item.id}
            style={{
              background: "#F9F9F9",
              borderRadius: 8,
              padding: 10,
              textAlign: "center",
            }}
          >
            {/* Product image */}
            <div
              style={{
                width: "100%",
                height: 80,
                background: "#FAFAFA",
                borderRadius: 6,
                marginBottom: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image_url}
                  alt={item.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ fontSize: 12, color: "#999" }}>
                  {item.name.split(" ")[0]}
                </div>
              )}
            </div>

            {/* Product name */}
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#0F1111",
                marginBottom: 4,
                lineHeight: 1.3,
              }}
            >
              {item.name}
            </div>

            {/* Price */}
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#FF9900",
                marginBottom: 8,
              }}
            >
              ₹{item.price}
            </div>

            {/* Add button */}
            <button
              onClick={() => onAddToCart?.(item, 1)}
              style={{
                width: "100%",
                background: "#FF9900",
                color: "white",
                border: "none",
                borderRadius: 4,
                padding: "6px 8px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Add
            </button>
          </div>
        ))}
      </div>

      {/* Footer text */}
      <p
        style={{
          fontSize: 11,
          color: "#999",
          margin: "12px 0 0",
          textAlign: "center",
        }}
      >
        Smart fridge detected low stock
      </p>
    </div>
  );
}
