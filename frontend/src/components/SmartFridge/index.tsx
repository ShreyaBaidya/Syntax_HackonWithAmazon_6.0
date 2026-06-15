"use client";

import { useState, useRef } from "react";
import { Product } from "@/lib/api";

interface Props {
  onFridgeScanned?: (products: Product[], description: string) => void;
  isLoading?: boolean;
}

export function SmartFridge({ onFridgeScanned, isLoading = false }: Props) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8000/api/v1/cart/image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.detail || !data.items) {
        alert("❌ Could not analyze fridge photo. Try another angle!");
        return;
      }

      const products: Product[] = data.items.map((item: any) => ({
        id: item.id || `demo-${item.name.toLowerCase()}`,
        name: item.name,
        price: item.estimated_price || 149,
        category: item.category || "grocery",
        image_url: item.image_url || "https://via.placeholder.com/150",
        rating: 4.5,
        review_count: 100,
        in_stock: true,
      }));

      onFridgeScanned?.(products, data.description || "Smart fridge scan results");
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      alert("Error scanning fridge. Is backend running?");
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "12px", background: "white", borderRadius: "12px", border: "1px solid #E8E8E8" }}>
      <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 12px", color: "#0F1111" }}>
        🧊 Smart Fridge Scanner
      </h3>

      <p style={{ fontSize: "12px", color: "#565959", margin: "0 0 12px", lineHeight: 1.4 }}>
        Photograph your fridge or pantry shelf. AI detects what you have and suggests what to buy.
      </p>

      <div
        onClick={() => fileInputRef.current?.click()}
        style={{
          padding: "20px",
          borderRadius: "8px",
          border: "2px dashed #FF9900",
          textAlign: "center",
          cursor: loading || isLoading ? "not-allowed" : "pointer",
          background: "#FFF9F0",
          opacity: loading || isLoading ? 0.6 : 1,
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) =>
          !loading && !isLoading && ((e.target as HTMLElement).style.background = "#FFEDDC")
        }
        onMouseLeave={(e) =>
          !loading && !isLoading && ((e.target as HTMLElement).style.background = "#FFF9F0")
        }
      >
        <div style={{ fontSize: "24px", marginBottom: "8px" }}>📸</div>
        <div style={{ fontSize: "12px", color: "#FF9900", fontWeight: 600 }}>
          {loading || isLoading ? "Analyzing..." : "Tap to scan fridge"}
        </div>
        <div style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>
          Works best with clear shelf/fridge photo
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
        disabled={loading || isLoading}
      />
    </div>
  );
}
