"use client";

import { useState, useRef } from "react";
import { Product } from "@/lib/api";

interface Props {
  onRecipeFound?: (products: Product[], servings: number, recipeName: string) => void;
  isLoading?: boolean;
}

export function RecipeInput({ onRecipeFound, isLoading = false }: Props) {
  const [inputMode, setInputMode] = useState<"url" | "image" | "text">("url");
  const [url, setUrl] = useState("");
  const [recipeText, setRecipeText] = useState("");
  const [servings, setServings] = useState(4);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();

      if (inputMode === "url" && url.trim()) {
        formData.append("recipe_url", url.trim());
      } else if (inputMode === "image" && fileInputRef.current?.files?.[0]) {
        formData.append("image_file", fileInputRef.current.files[0]);
      } else if (inputMode === "text" && recipeText.trim()) {
        formData.append("user_text", recipeText.trim());
      }

      formData.append("servings", servings.toString());

      const response = await fetch("http://localhost:8000/api/v1/recipe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        alert(`❌ ${data.error}\n\n${data.suggestion || ""}`);
        return;
      }

      // Call handler with products and servings
      onRecipeFound?.(data.products, servings, data.recipe_name);

      // Reset form
      setUrl("");
      setRecipeText("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      alert("Error fetching recipe. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "16px", background: "white", borderRadius: "12px", border: "1px solid #E8E8E8" }}>
      <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 12px", color: "#0F1111" }}>
        🍳 Share a Recipe
      </h3>

      {/* Input mode tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        {(["url", "image", "text"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setInputMode(mode)}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: mode === inputMode ? "2px solid #FF9900" : "1px solid #DDD",
              background: mode === inputMode ? "#FFF3E0" : "white",
              color: "#0F1111",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {mode === "url" && "🔗 URL"}
            {mode === "image" && "📷 Image"}
            {mode === "text" && "✍️ Type"}
          </button>
        ))}
      </div>

      {/* Input fields */}
      {inputMode === "url" && (
        <input
          type="text"
          placeholder="Paste recipe URL (e.g., tastemade.com/carbonara)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: "6px",
            border: "1px solid #E8E8E8",
            fontSize: "13px",
            marginBottom: "8px",
            boxSizing: "border-box",
          }}
        />
      )}

      {inputMode === "image" && (
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: "12px",
            borderRadius: "6px",
            border: "2px dashed #FF9900",
            textAlign: "center",
            cursor: "pointer",
            background: "#FFF9F0",
            fontSize: "12px",
            color: "#FF9900",
            fontWeight: 600,
            marginBottom: "8px",
          }}
        >
          📷 Click or drag image of dish
        </div>
      )}

      {inputMode === "text" && (
        <input
          type="text"
          placeholder="E.g., 'butter chicken for 6' or 'pasta carbonara'"
          value={recipeText}
          onChange={(e) => setRecipeText(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: "6px",
            border: "1px solid #E8E8E8",
            fontSize: "13px",
            marginBottom: "8px",
            boxSizing: "border-box",
          }}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files?.[0]) {
            // File is already in fileInputRef, just trigger submission
            handleSubmit(e as any);
          }
        }}
      />

      {/* Servings slider */}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ fontSize: "12px", color: "#565959", display: "block", marginBottom: "6px" }}>
          Servings: <strong>{servings}</strong> people
        </label>
        <input
          type="range"
          min="1"
          max="12"
          value={servings}
          onChange={(e) => setServings(parseInt(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>

      {/* Submit button */}
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px" }}>
        <button
          type="submit"
          disabled={loading || isLoading}
          style={{
            flex: 1,
            padding: "10px",
            background: "#FF9900",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: loading || isLoading ? "not-allowed" : "pointer",
            opacity: loading || isLoading ? 0.6 : 1,
          }}
        >
          {loading ? "Finding ingredients..." : "Find Ingredients"}
        </button>
      </form>

      {/* Quick suggestions */}
      <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #E8E8E8", fontSize: "11px", color: "#565959" }}>
        Try: <strong>carbonara</strong>, <strong>biryani</strong>, <strong>butter chicken</strong>, <strong>paneer tikka</strong>
      </div>
    </div>
  );
}
