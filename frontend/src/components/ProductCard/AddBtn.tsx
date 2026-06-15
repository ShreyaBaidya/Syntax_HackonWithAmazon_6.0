import React from 'react';

interface Props {
  qty: number;
  onAdd: (e: React.MouseEvent) => void;
  onInc: (e: React.MouseEvent) => void;
  onDec: (e: React.MouseEvent) => void;
  small?: boolean;
}

export function AddBtn({ qty, onAdd, onInc, onDec, small }: Props) {
  if (qty === 0) {
    return (
      <button
        onClick={onAdd}
        style={{
          background: "#FFD814",
          color: "#0F1111",
          border: "none",
          borderRadius: 6,
          padding: small ? "4px 10px" : "8px 0",
          width: small ? "auto" : "100%",
          fontWeight: 700,
          fontSize: small ? 11 : 13,
          cursor: "pointer",
        }}
      >
        + Add
      </button>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "#FFD814",
        borderRadius: 20,
        border: "1px solid #F0C000",
        overflow: "hidden",
        width: small ? "auto" : "100%",
        maxWidth: small ? 80 : "none",
      }}
    >
      <button
        onClick={onDec}
        style={{
          flex: 1,
          height: small ? 26 : 32,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: small ? 14 : 16,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        −
      </button>
      <span
        style={{
          width: small ? 16 : 24,
          textAlign: "center",
          fontSize: small ? 12 : 14,
          fontWeight: 700,
        }}
      >
        {qty}
      </span>
      <button
        onClick={onInc}
        style={{
          flex: 1,
          height: small ? 26 : 32,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: small ? 14 : 16,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        +
      </button>
    </div>
  );
}
