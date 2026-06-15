"use client";

import { useState, useEffect } from "react";
import { Product, getProductsByCategory } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";

interface Props {
  nowSuggestions: Product[];
  reorderNudges: Product[];
  trending: Product[];
  timeContext: string;
  onProductSelect: (product: Product, qty: number) => void;
  exclusionSet?: string[];
  alternatives?: Product[];
  cart?: { product: Product; quantity: number }[];
  dietTags?: string[];
  allergenTags?: string[];
}



const SUB_CATS = [
  "All",
  "Vegetables",
  "Fruits",
  "Dairy & Eggs",
  "Snacks",
  "Beverages",
  "Bakery",
  "Rice & Pulses",
];

const SECTION_TITLES: Record<string, string> = {
  morning: "Good morning! ☀️ Your essentials",
  midday: "Midday picks 🍽️",
  afternoon: "Afternoon pick-me-up ☕",
  evening: "Evening essentials 🌆",
  night: "Late night needs 🌙",
};

export function RecommendationFeed({
  nowSuggestions,
  reorderNudges,
  trending,
  timeContext,
  onProductSelect,
  exclusionSet,
  alternatives,
  cart = [],
  dietTags = [],
  allergenTags = [],
}: Props) {
  const [activeCategory, setActiveCategory] = useState("");
  const [activeSub, setActiveSub] = useState("All");
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [loadingCategory, setLoadingCategory] = useState(false);

  // Helper to get cart quantity for a product
  const getCartQty = (productId: string) => {
    const item = cart.find((c) => c.product.id === productId);
    return item ? item.quantity : 0;
  };

  console.log("[RecommendationFeed] Rendering with:", {
    nowSuggestions: nowSuggestions.length,
    trending: trending.length,
    exclusionSet: exclusionSet?.length ?? 0,
  });

  // Fetch catalog products whenever a category is selected
  useEffect(() => {
    if (!activeCategory) {
      setCategoryProducts([]);
      return;
    }
    setLoadingCategory(true);
    getProductsByCategory(activeCategory, 20)
      .then(setCategoryProducts)
      .catch(() => setCategoryProducts([]))
      .finally(() => setLoadingCategory(false));
  }, [activeCategory]);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setActiveSub("All");
  };

  // When no category selected, show recommendations; otherwise show catalog products
  const isBrowsing = Boolean(activeCategory);
  const filtered = isBrowsing
    ? categoryProducts
    : [...nowSuggestions, ...trending];
  const filteredReorder = isBrowsing ? [] : reorderNudges;

  // Apply client-side dietary safety check (warns, never removes)
  const safeProducts = filtered;
  const safeReorder = filteredReorder;

  // Only render dietary/allergen badges when the user has actually set up a profile.
  // Without a profile, products show no diet labels at all.
  const hasProfile = dietTags.length > 0 || allergenTags.length > 0;

  console.log("[RecommendationFeed] After filter:", {
    safe: safeProducts.length,
  });

  const sectionTitle = (() => {
    let title = isBrowsing
      ? `${activeCategory.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())} Products`
      : (SECTION_TITLES[timeContext] ?? "✨ For you right now");
    // Task 9.2: Enhance header with intent context
    if (
      !isBrowsing &&
      timeContext &&
      timeContext.toLowerCase().includes("based")
    ) {
      title = `${title} 💬`;
    }
    // Limit header text to 60 characters
    if (title.length > 60) {
      title = title.slice(0, 57) + "…";
    }
    return title;
  })();

  return (
    <div style={{ background: "#F7F7F7" }}>
      {/* Sub-category pill chips */}
      <div style={{ background: "white", borderBottom: "1px solid #F0F0F0" }}>
        <div
          className="scrollbar-hide"
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            padding: "8px 10px",
          }}
        ></div>
      </div>

      {/* Loading state */}
      {loadingCategory && (
        <div
          style={{
            textAlign: "center",
            padding: "32px 20px",
            background: "white",
            marginTop: 8,
          }}
        >
          <p style={{ color: "#888", fontSize: 13 }}>Loading products…</p>
        </div>
      )}

      {/* Main product grid */}
      {!loadingCategory && safeProducts.length > 0 && (
        <Section title={sectionTitle}>
          <ProductGrid4
            products={safeProducts}
            onProductSelect={onProductSelect}
            getCartQty={getCartQty}
                        showDietaryInfo={hasProfile}
            userDietTags={dietTags}
            userAllergenTags={allergenTags}
          />
        </Section>
      )}

      {/* Task 9.1: Alternatives carousel */}
      {alternatives && alternatives.length > 0 && (
        <Section title="🔄 Safe Alternatives">
          <div
            className="scrollbar-hide"
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              padding: "8px 10px 12px",
            }}
          >
            {alternatives.map((p) => (
              <div
                key={p.id}
                style={{ minWidth: 150, maxWidth: 150, flexShrink: 0 }}
              >
                <ProductCard
                  product={p}
                  onAddToCart={onProductSelect}
                  grid
                  initialQty={getCartQty(p.id)}
                  showDietaryInfo={hasProfile}
                  userDietTags={dietTags}
                  userAllergenTags={allergenTags}
                />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Reorder nudges (only on home / Top Picks view) */}
      {!isBrowsing && safeReorder.length > 0 && (
        <Section title="🔁 Buy Again">
          <div>
            {safeReorder.map((p) => {
              return (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={onProductSelect}
                  compact
                  initialQty={getCartQty(p.id)}
                  showDietaryInfo={hasProfile}
                  userDietTags={dietTags}
                  userAllergenTags={allergenTags}
                />
              );
            })}
          </div>
        </Section>
      )}

      {!loadingCategory && safeProducts.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            background: "white",
            marginTop: 8,
          }}
        >
          <p style={{ color: "#888", fontSize: 14 }}>
            No products in this category.
          </p>
          <button
            onClick={() => handleCategoryChange("")}
            style={{
              marginTop: 8,
              background: "#FFD814",
              color: "#0F1111",
              border: "none",
              borderRadius: 6,
              padding: "8px 20px",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Show All
          </button>
        </div>
      )}

      {/* Bottom spacing */}
      <div style={{ height: 80 }} />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ background: "white", padding: "14px 12px 0" }}>
        <h2
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            color: "#0F1111",
            paddingBottom: 10,
          }}
        >
          {title}
        </h2>
      </div>
      <div style={{ background: "white" }}>{children}</div>
    </div>
  );
}

// 4-column compact grid (Amazon Now style)
function ProductGrid4({
  products,
  onProductSelect,
  getCartQty,
    showDietaryInfo = false,
  userDietTags = [],
  userAllergenTags = [],
}: {
  products: Product[];
  onProductSelect: (p: Product, qty: number) => void;
  getCartQty: (productId: string) => number;
    showDietaryInfo?: boolean;
  userDietTags?: string[];
  userAllergenTags?: string[];
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: 8,
        padding: "8px 10px 12px",
      }}
    >
      {products.map((p) => {
                return (
          <ProductCard
            key={p.id}
            product={p}
            onAddToCart={onProductSelect}
            grid
            initialQty={getCartQty(p.id)}
                                    showDietaryInfo={showDietaryInfo}
            userDietTags={userDietTags}
            userAllergenTags={userAllergenTags}
          />
        );
      })}
    </div>
  );
}
