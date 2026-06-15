import React from 'react';
import { CartItem } from "@/lib/api";

export function CartRow({
  item,
  isLast,
  participantColor,
  canEdit,
  onQty,
}: {
  item: CartItem;
  isLast: boolean;
  participantColor: string;
  canEdit: boolean;
  onQty: (delta: number) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 14px",
        borderBottom: isLast ? "none" : "1px solid #F5F5F5",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 8,
          overflow: "hidden",
          flexShrink: 0,
          background: "#FAFAFA",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={item.image_url}
          alt={item.name}
          style={{ width: 52, height: 52, objectFit: "contain" }}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 500,
            color: "#0F1111",
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.name}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 10, color: "#888" }}>
          {item.unit}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginTop: 3,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: participantColor,
            }}
          />
          <span style={{ fontSize: 10, color: "#888" }}>
            by {item.added_by.join(" & ")}
          </span>
        </div>
      </div>

      <div style={{ textAlign: "right", marginRight: 8 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>
          ₹{(item.price * item.quantity).toFixed(0)}
        </p>
        {item.quantity > 1 && (
          <p style={{ margin: "1px 0 0", fontSize: 9, color: "#888" }}>
            ₹{item.price} each
          </p>
        )}
      </div>

      {canEdit ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#FFD814",
            borderRadius: 20,
            border: "1px solid #F0C000",
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => onQty(-1)}
            style={{
              width: 28,
              height: 28,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            −
          </button>
          <span
            style={{
              minWidth: 18,
              textAlign: "center",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {item.quantity}
          </span>
          <button
            onClick={() => onQty(1)}
            style={{
              width: 28,
              height: 28,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            +
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#F5F5F5",
            borderRadius: 20,
            border: "1px solid #E0E0E0",
            padding: "4px 10px",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: "#888" }}>
            ×{item.quantity}
          </span>
        </div>
      )}
    </div>
  );
}
