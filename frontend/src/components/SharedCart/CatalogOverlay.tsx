import React, { useState, useEffect } from 'react';
import { useProductSearch } from '@/hooks/useProductSearch';
import { CartState, Product, searchProducts, getProductsByCategory, getRecommendations } from '@/lib/api';

const CATEGORIES = [
  { id: "", icon: "🏠", label: "Top Picks", color: "#FFF3E0" },
  { id: "beverages", icon: "🥤", label: "Beverages", color: "#E3F2FD" },
  { id: "snacks", icon: "🍿", label: "Snacks", color: "#FFF8E1" },
  { id: "dairy", icon: "🥛", label: "Dairy & Eggs", color: "#F1F8E9" },
  { id: "fresh", icon: "🥦", label: "Fresh", color: "#E8F5E9" },
  { id: "medicine", icon: "💊", label: "Health", color: "#FCE4EC" },
  { id: "personal_care", icon: "🧴", label: "Personal Care", color: "#EDE7F6" },
  { id: "cleaning", icon: "🧹", label: "Cleaners", color: "#E0F7FA" },
  { id: "baby", icon: "👶", label: "Baby", color: "#FFF3E0" },
  { id: "electronics", icon: "🔋", label: "Electronics", color: "#ECEFF1" },
  { id: "fashion", icon: "👕", label: "Fashion", color: "#FCE4EC" },
];

// ── Full-screen catalog overlay ───────────────────────────────────────────────
export function CatalogOverlay({
  cart,
  participantName,
  onAddProduct,
  addingIds,
  onClose,
}: {
  cart: CartState;
  participantName: string;
  onAddProduct: (product: Product) => void;
  addingIds: Set<string>;
  onClose: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { query: searchQuery, setQuery: setSearchQuery, results: searchResults, searching } = useProductSearch("", 12);

  // Fetch products on category change
  useEffect(() => {
    setLoading(true);
    if (activeCategory) {
      getProductsByCategory(activeCategory, 20)
        .then(setProducts)
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    } else {
      // Top picks = recommendations trending + now
      getRecommendations()
        .then((recs) => {
          setProducts([...recs.now_suggestions, ...recs.trending]);
        })
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    }
  }, [activeCategory]);


  const displayProducts =
    searchQuery.trim().length >= 2 ? searchResults : products;
  const isSearching = searchQuery.trim().length >= 2;

  return (
    <>
      {/* Blurred backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 800,
          zIndex: 59,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
        onClick={onClose}
      />

      {/* Catalog panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 800,
          zIndex: 60,
          background: "#F7F7F7",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: "#0F1111",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <svg width="22" height="22" fill="white" viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
          <div
            className="blur-overlay"
            style={{ flex: 1, backfaceVisibility: "hidden" }}
          >
            <p
              style={{
                color: "white",
                fontWeight: 700,
                fontSize: 14,
                margin: 0,
              }}
            >
              Add to Shared Cart
            </p>
            <p style={{ color: "#aaa", fontSize: 10, margin: 0 }}>
              {cart.item_count} items · ₹{cart.total.toFixed(0)} in cart
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div
          style={{
            background: "white",
            padding: "8px 12px",
            borderBottom: "1px solid #F0F0F0",
          }}
        >
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 14,
                color: "#aaa",
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Search products…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px 9px 32px",
                borderRadius: 8,
                border: "1.5px solid #DDD",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
                background: "#F7F7F7",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#888",
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category strip (hidden when searching) */}
        {!isSearching && (
          <div
            style={{
              background: "white",
              borderBottom: "1px solid #F0F0F0",
              padding: "10px 0 6px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 0,
                overflowX: "auto",
                paddingLeft: 8,
                paddingRight: 8,
              }}
            >
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      flexShrink: 0,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "2px 8px",
                      minWidth: 56,
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        background: isActive ? cat.color : "#F7F7F7",
                        borderRadius: 8,
                        border: isActive
                          ? "2px solid #067D62"
                          : "2px solid transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                      }}
                    >
                      {cat.icon}
                    </div>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? "#0F1111" : "#565959",
                        textAlign: "center",
                        maxWidth: 56,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Product grid */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px 80px" }}>
          {(loading || searching) && (
            <div style={{ textAlign: "center", padding: "32px 20px" }}>
              <p style={{ color: "#888", fontSize: 13 }}>Loading…</p>
            </div>
          )}

          {!loading && !searching && displayProducts.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ color: "#888", fontSize: 13 }}>
                {isSearching
                  ? "No products found"
                  : "No products in this category"}
              </p>
            </div>
          )}

          {!loading && !searching && displayProducts.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 8,
              }}
            >
              {displayProducts.map((product) => {
                const cartItem = cart.items[product.id];
                const alreadyInCart = !!cartItem;
                const isAdding = addingIds.has(product.id);
                return (
                  <div
                    key={product.id}
                    style={{
                      background: "white",
                      borderRadius: 8,
                      overflow: "hidden",
                      border: alreadyInCart
                        ? "2px solid #067D62"
                        : "1px solid #F0F0F0",
                      display: "flex",
                      flexDirection: "column",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    {/* Image */}
                    <div
                      style={{
                        background: "#FAFAFA",
                        position: "relative",
                        paddingTop: "75%",
                        overflow: "hidden",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.image_url}
                        alt={product.name}
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          padding: 4,
                        }}
                      />
                      {alreadyInCart && (
                        <div
                          style={{
                            position: "absolute",
                            top: 4,
                            left: 4,
                            background: "#067D62",
                            color: "white",
                            fontSize: 8,
                            fontWeight: 700,
                            padding: "2px 5px",
                            borderRadius: 3,
                          }}
                        >
                          In cart ×{cartItem.quantity}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div
                      style={{
                        padding: "6px 6px 8px",
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <p
                        style={{
                          fontSize: 11,
                          color: "#0F1111",
                          margin: 0,
                          lineHeight: 1.3,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {product.name}
                      </p>
                      <p
                        style={{
                          fontSize: 9,
                          color: "#888",
                          margin: "2px 0 4px",
                        }}
                      >
                        {product.unit}
                      </p>

                      {/* Added by (if in cart) */}
                      {alreadyInCart && (
                        <p
                          style={{
                            fontSize: 9,
                            color: "#067D62",
                            margin: "0 0 4px",
                            fontWeight: 500,
                          }}
                        >
                          by {cartItem.added_by.join(" & ")}
                        </p>
                      )}

                      {/* Price + Add */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: "auto",
                        }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 700 }}>
                          ₹{product.price}
                        </span>
                        <button
                          onClick={() => onAddProduct(product)}
                          disabled={isAdding}
                          style={{
                            background: alreadyInCart ? "#E0F4EC" : "#FFD814",
                            color: alreadyInCart ? "#067D62" : "#0F1111",
                            border: "none",
                            borderRadius: 6,
                            padding: "4px 10px",
                            fontWeight: 700,
                            fontSize: 11,
                            cursor: isAdding ? "not-allowed" : "pointer",
                            opacity: isAdding ? 0.6 : 1,
                          }}
                        >
                          {isAdding ? "…" : "+ Add"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom bar showing cart total */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: "white",
            borderTop: "1px solid #F0F0F0",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 -2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <div>
            <span style={{ fontSize: 12, color: "#555" }}>
              {cart.item_count} items ·{" "}
            </span>
            <span style={{ fontSize: 15, fontWeight: 800 }}>
              ₹{cart.total.toFixed(0)}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#FFD814",
              color: "#0F1111",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            ← Back to Cart
          </button>
        </div>
      </div>
    </>
  );
}
