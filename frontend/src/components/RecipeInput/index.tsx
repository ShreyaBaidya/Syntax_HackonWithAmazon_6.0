"use client";

import { useState, useRef } from "react";
import { Product } from "@/lib/api";

interface Props {
  onRecipeFound?: (products: Product[], servings: number, recipeName: string) => void;
  isLoading?: boolean;
}

const RECIPE_GALLERY = [
  {
    id: "carbonara",
    name: "Pasta Carbonara",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=300&h=200&fit=crop",
  },
  {
    id: "biryani",
    name: "Chicken Biryani",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a104?w=300&h=200&fit=crop",
  },
  {
    id: "butter_chicken",
    name: "Butter Chicken",
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300&h=200&fit=crop",
  },
  {
    id: "paneer_tikka",
    name: "Paneer Tikka",
    image: "https://images.unsplash.com/photo-1599599810694-b5ac4dd94b61?w=300&h=200&fit=crop",
  },
  {
    id: "pizza",
    name: "Homemade Pizza",
    image: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=300&h=200&fit=crop",
  },
  {
    id: "dhal_fry",
    name: "Dal Fry",
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&h=200&fit=crop",
  },
];

export function RecipeInput({ onRecipeFound, isLoading = false }: Props) {
  const [inputMode, setInputMode] = useState<"gallery" | "url" | "image" | "text">("gallery");
  const [url, setUrl] = useState("");
  const [recipeText, setRecipeText] = useState("");
  const [servings, setServings] = useState(4);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRecipeSelect = async (recipeId: string) => {
    await submitRecipe(recipeId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (inputMode === "url" && url.trim()) {
      await submitRecipe(undefined, url.trim());
    } else if (inputMode === "text" && recipeText.trim()) {
      await submitRecipe(undefined, undefined, recipeText.trim());
    } else if (inputMode === "image" && fileInputRef.current?.files?.[0]) {
      await submitRecipe(undefined, undefined, undefined, fileInputRef.current.files[0]);
    }
  };

  const submitRecipe = async (
    recipeId?: string,
    recipeUrl?: string,
    userText?: string,
    imageFile?: File
  ) => {
    setLoading(true);

    try {
      const formData = new FormData();

      if (recipeId) {
        formData.append("user_text", recipeId);
      } else if (recipeUrl) {
        formData.append("recipe_url", recipeUrl);
      } else if (userText) {
        formData.append("user_text", userText);
      } else if (imageFile) {
        formData.append("image_file", imageFile);
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

      onRecipeFound?.(data.products, servings, data.recipe_name);

      // Reset form
      setUrl("");
      setRecipeText("");
      setInputMode("gallery");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      alert("Error fetching recipe. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "12px", background: "white", borderRadius: "12px", border: "1px solid #E8E8E8" }}>
      <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 12px", color: "#0F1111" }}>
        🍳 Pick a Recipe
      </h3>

      {inputMode === "gallery" ? (
        <>
          {/* Recipe gallery grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            {RECIPE_GALLERY.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => handleRecipeSelect(recipe.id)}
                disabled={loading || isLoading}
                style={{
                  border: "none",
                  borderRadius: "8px",
                  overflow: "hidden",
                  cursor: loading || isLoading ? "not-allowed" : "pointer",
                  opacity: loading || isLoading ? 0.6 : 1,
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLElement).style.transform = "scale(1.05)")
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLElement).style.transform = "scale(1)")
                }
              >
                <div style={{ position: "relative" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={recipe.image}
                    alt={recipe.name}
                    style={{ width: "100%", height: "100px", objectFit: "cover", display: "block" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: "rgba(0,0,0,0.6)",
                      color: "white",
                      padding: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      textAlign: "center",
                    }}
                  >
                    {recipe.name}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Or alternatives */}
          <div
            style={{
              textAlign: "center",
              fontSize: "12px",
              color: "#565959",
              marginBottom: "8px",
              paddingBottom: "8px",
              borderBottom: "1px solid #E8E8E8",
            }}
          >
            Or...
          </div>

          {/* Input mode tabs */}
          <div style={{ display: "flex", gap: "6px" }}>
            {(["url", "image", "text"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setInputMode(mode)}
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  borderRadius: "4px",
                  border: "1px solid #DDD",
                  background: "white",
                  color: "#0F1111",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {mode === "url" && "🔗"}
                {mode === "image" && "📷"}
                {mode === "text" && "✍️"}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Input mode tabs */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
            {(["gallery", "url", "image", "text"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setInputMode(mode)}
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  borderRadius: "4px",
                  border: mode === inputMode ? "2px solid #FF9900" : "1px solid #DDD",
                  background: mode === inputMode ? "#FFF3E0" : "white",
                  color: "#0F1111",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {mode === "gallery" && "🖼️"}
                {mode === "url" && "🔗"}
                {mode === "image" && "📷"}
                {mode === "text" && "✍️"}
              </button>
            ))}
          </div>

          {/* Input fields */}
          {inputMode === "url" && (
            <input
              type="text"
              placeholder="Paste recipe URL"
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
              📷 Click to upload dish image
            </div>
          )}

          {inputMode === "text" && (
            <input
              type="text"
              placeholder="E.g., 'butter chicken' or 'carbonara'"
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
                submitRecipe(
                  undefined,
                  undefined,
                  undefined,
                  e.target.files[0]
                );
              }
            }}
          />

          {/* Servings slider */}
          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "12px", color: "#565959", display: "block", marginBottom: "6px" }}>
              Servings: <strong>{servings}</strong>
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
        </>
      )}
    </div>
  );
}
