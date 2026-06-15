"use client";

import { useState, useCallback, useEffect } from "react";
import { Product } from "@/lib/api";
import { getAllergenLabel } from "@/lib/dietary";
import { AddBtn } from "./AddBtn";

interface Props {
  product: Product;
  onAddToCart?: (product: Product, qty: number) => void;
  /** compact = horizontal row layout used in reorder nudges */
  compact?: boolean;
  /** grid = 4-column compact card (default for product grid) */
  grid?: boolean;
  /** initialQty = current quantity in cart */
  initialQty?: number;
  /** allergyWarning = warning message if product matches user's allergen restrictions */
  allergyWarning?: string;
  /** warningType = type of warning: 'allergen' (red) or 'diet' (orange) */
  warningType?: "allergen" | "diet";
  /** showDietaryInfo = whether to render dietary/allergen badges. Set to true only
   *  when the user has configured a dietary profile so badges aren't shown to
   *  users who haven't expressed dietary preferences. Default: false. */
  showDietaryInfo?: boolean;
  /** userDietTags = the user's selected diet preferences (e.g. ["vegetarian"]).
   *  Dietary badges on products are filtered to only those matching one of these
   *  preferences. Informational "Contains X" tags are always shown. */
  userDietTags?: string[];
  /** userAllergenTags = the user's selected allergen sensitivities. The
   *  "Allergen Safe" badge is only shown when this is non-empty. */
  userAllergenTags?: string[];
}

// Mock original prices for some products to show discount
const ORIG: Record<string, number> = {
  p001: 55,
  p002: 89,
  p006: 219,
  p007: 115,
  p011: 75,
  p016: 25,
  p017: 49,
  p019: 75,
  p031: 649,
  p039: 999,
};

export function ProductCard({
  product,
  onAddToCart,
  compact = false,
  grid = false,
  initialQty = 0,
  allergyWarning,
  warningType = "allergen",
  showDietaryInfo = false,
  userDietTags = [],
  userAllergenTags = [],
}: Props) {
  const [qty, setQty] = useState(initialQty);
  const [ingredientsExpanded, setIngredientsExpanded] = useState(false);

  // Resolve the red allergen badge. An explicitly-passed allergyWarning (e.g.
  // computed by RecommendationFeed) takes precedence; otherwise self-compute
  // from the user's selected allergens so surfaces like NowSpeak that don't
  // pre-compute warnings still show the "Contains <substance>" badge.
  const resolvedWarning =
    allergyWarning ??
    (showDietaryInfo ? getAllergenLabel(product, userAllergenTags) : null);

  // Sync qty with initialQty when it changes (e.g., coming back from cart page)
  useEffect(() => {
    setQty(initialQty);
  }, [initialQty]);

  const add = useCallback(() => {
    setQty(1);
    setTimeout(() => onAddToCart?.(product, 1), 0);
  }, [product, onAddToCart]);

  const inc = useCallback(() => {
    setQty((q) => {
      const n = q + 1;
      setTimeout(() => onAddToCart?.(product, n), 0);
      return n;
    });
  }, [product, onAddToCart]);

  const dec = useCallback(() => {
    setQty((q) => {
      const n = Math.max(0, q - 1);
      setTimeout(() => onAddToCart?.(product, n), 0);
      return n;
    });
  }, [product, onAddToCart]);

  const origPrice = ORIG[product.id];
  const discount = origPrice
    ? Math.round((1 - product.price / origPrice) * 100)
    : null;

  // ── Compact (horizontal) ──────────────────────────────────────────────────
  if (compact) {
    const warnBg = warningType === "allergen" ? "#FEE2E2" : "#FFF7ED";
    const warnText = warningType === "allergen" ? "#991B1B" : "#9A3412";
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          background: resolvedWarning ? warnBg : "white",
          borderBottom: "1px solid #F0F0F0",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            background: "#F7F7F7",
            borderRadius: 6,
            flexShrink: 0,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image_url}
            alt={product.name}
            style={{ width: 46, height: 46, objectFit: "contain" }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#0F1111",
              margin: 0,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {product.name}
          </p>
          {resolvedWarning && (
            <p
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: warnText,
                margin: "1px 0 0",
              }}
            >
              {resolvedWarning}
            </p>
          )}
          <p style={{ fontSize: 10, color: "#888", margin: "2px 0 0" }}>
            {product.unit}
          </p>
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#0F1111",
              margin: "3px 0 0",
            }}
          >
            ₹{product.price}
          </p>
        </div>
        <AddBtn qty={qty} onAdd={add} onInc={inc} onDec={dec} small />
      </div>
    );
  }

  // ── Grid card (4-column compact, matches Amazon Now) ──────────────────────
  if (grid) {
    // Dietary badges: only show product tags that match the user's selected
    // diet preferences (case-insensitive). No "Allergen Safe" badge, no
    // "Contains X" info badges — just confirmation that the product fits one
    // of the user's chosen preferences.
    const userDietSet = new Set(userDietTags.map((t) => t.toLowerCase()));
    const allProductTags = product.dietary_tags || [];
    const matchedTags = allProductTags.filter((tag) =>
      userDietSet.has(tag.toLowerCase()),
    );
    const dietaryBadges = showDietaryInfo ? matchedTags.slice(0, 3) : [];

    // Task 8.3: Reason text truncated at 120 chars
    const reasonText = product.reason
      ? product.reason.length > 120
        ? product.reason.slice(0, 120) + "…"
        : product.reason
      : null;
    // Task 8.5: Ingredients expandable section
    const hasIngredients =
      product.ingredients && product.ingredients.length > 0;
    // Task 8.6: Discount display with MRP strikethrough
    const discountPercent =
      origPrice && discount && discount > 0 ? discount : null;

    return (
      <div
        style={{
          background: "white",
          borderRadius: 6,
          border: "1px solid #F0F0F0",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        {/* Image */}
        <div
          style={{
            background: "#FAFAFA",
            position: "relative",
            paddingTop: "70%",
            overflow: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image_url}
            alt={product.name}
            style={{
              position: "absolute",
              inset: "8%",
              width: "84%",
              height: "84%",
              objectFit: "contain",
            }}
          />
          {/* Rating badge (top-left) */}
          <div
            style={{
              position: "absolute",
              top: 3,
              left: 3,
              background: "rgba(255,255,255,0.92)",
              borderRadius: 3,
              padding: "1px 4px",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <span style={{ fontSize: 8, color: "#0F1111", fontWeight: 600 }}>
              4.{Math.floor(Math.random() * 4 + 1)}
            </span>
            <span style={{ fontSize: 7, color: "#FF9900" }}>★</span>
          </div>
          {/* ETA badge (top-right) */}
          <div
            style={{
              position: "absolute",
              top: 3,
              right: 3,
              background: "rgba(255,255,255,0.92)",
              borderRadius: 3,
              padding: "1px 4px",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <span style={{ fontSize: 7, color: "#067D62" }}>⚡</span>
            <span style={{ fontSize: 8, color: "#067D62", fontWeight: 600 }}>
              {product.eta_min}m
            </span>
          </div>
          {discount && discount > 0 && (
            <div
              style={{
                position: "absolute",
                bottom: 3,
                left: 3,
                background: "#CC0C39",
                color: "white",
                fontSize: 8,
                fontWeight: 700,
                padding: "1px 4px",
                borderRadius: 2,
              }}
            >
              {discount}% OFF
            </div>
          )}
        </div>

        {/* Info */}
        <div
          style={{
            padding: "5px 6px 6px",
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
              fontWeight: 400,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {product.name}
          </p>
          <p style={{ fontSize: 9, color: "#888", margin: "2px 0 4px" }}>
            {product.unit}
          </p>

          {/* Task 8.3: Reason field (grey italic) */}
          {reasonText && (
            <p
              style={{
                fontSize: 10,
                color: "#666",
                fontStyle: "italic",
                margin: "0 0 4px",
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {reasonText}
            </p>
          )}

          {/* Dietary preference badges (green chips, max 3). Only tags matching
              the user's chosen preferences are passed in via dietaryBadges. */}
          {dietaryBadges.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 3,
                margin: "0 0 4px",
              }}
            >
              {dietaryBadges.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 8,
                    color: "#067D62",
                    background: "#E6F7F2",
                    border: "1px solid #B2E8D9",
                    borderRadius: 3,
                    padding: "1px 4px",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  ✓ {tag}
                </span>
              ))}
            </div>
          )}

          {/* Dietary conflict badge (red chip) — e.g. "Contains milk" */}
          {resolvedWarning && (
            <div style={{ margin: "0 0 4px" }}>
              <span
                style={{
                  fontSize: 8,
                  color: "white",
                  background: "#CC0C39",
                  border: "1px solid #CC0C39",
                  borderRadius: 3,
                  padding: "1px 5px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {resolvedWarning}
              </span>
            </div>
          )}

          {/* Task 8.4: Alternative product badge (orange) */}
          {product.is_alternative && (
            <div style={{ margin: "0 0 4px" }}>
              <span
                style={{
                  fontSize: 8,
                  color: "#E65100",
                  background: "#FFF3E0",
                  border: "1px solid #FFCC80",
                  borderRadius: 3,
                  padding: "1px 4px",
                  fontWeight: 600,
                }}
              >
                🔄 Recommended Alternative
              </span>
              {product.replaces && (
                <p
                  style={{
                    fontSize: 8,
                    color: "#999",
                    margin: "2px 0 0",
                    lineHeight: 1.2,
                  }}
                >
                  Replaces: {product.replaces}
                </p>
              )}
            </div>
          )}

          {/* Task 8.6: Price with MRP strikethrough + discount badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              margin: "2px 0 4px",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0F1111" }}>
              ₹{product.price}
            </span>
            {origPrice && discountPercent && (
              <>
                <span
                  style={{
                    fontSize: 9,
                    color: "#888",
                    textDecoration: "line-through",
                  }}
                >
                  ₹{origPrice}
                </span>
                <span
                  style={{
                    fontSize: 8,
                    color: "#CC0C39",
                    fontWeight: 600,
                  }}
                >
                  -{discountPercent}%
                </span>
              </>
            )}
          </div>

          {/* Task 8.5: Expandable ingredients + Add button row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "auto",
            }}
          >
            {hasIngredients ? (
              <button
                onClick={() => setIngredientsExpanded((prev) => !prev)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 9,
                  color: "#555",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <span style={{ fontSize: 8 }}>
                  {ingredientsExpanded ? "▾" : "▸"}
                </span>{" "}
                Ingredients
              </button>
            ) : (
              <span />
            )}
            <AddBtn qty={qty} onAdd={add} onInc={inc} onDec={dec} small />
          </div>

          {/* Task 8.5: Expanded ingredients list */}
          {hasIngredients && ingredientsExpanded && (
            <ul
              style={{
                margin: "4px 0 0",
                padding: "4px 0 0",
                borderTop: "1px solid #F0F0F0",
                listStyle: "none",
                fontSize: 8,
                color: "#555",
                lineHeight: 1.5,
              }}
            >
              {product.ingredients!.map((ing, i) => (
                <li key={i} style={{ padding: "1px 0" }}>
                  • {ing}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  // ── Standard 2-column card (used in NowSpeak results) ─────────────────────
  return (
    <div
      style={{
        background: "white",
        borderRadius: 6,
        overflow: "hidden",
        border: "1px solid #EBEBEB",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          background: "#FAFAFA",
          position: "relative",
          paddingTop: "100%",
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
            padding: 8,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 6,
            left: 6,
            background: "#067D62",
            color: "white",
            fontSize: 9,
            fontWeight: 700,
            padding: "2px 5px",
            borderRadius: 3,
          }}
        >
          ⚡ {product.eta_min} min
        </div>
        {discount && discount > 0 && (
          <div
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              background: "#CC0C39",
              color: "white",
              fontSize: 9,
              fontWeight: 700,
              padding: "2px 5px",
              borderRadius: 3,
            }}
          >
            {discount}% off
          </div>
        )}
      </div>
      <div style={{ padding: "8px 8px 4px", flex: 1 }}>
        <p
          style={{
            fontSize: 12,
            color: "#0F1111",
            margin: 0,
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {product.name}
        </p>
        <p style={{ fontSize: 11, color: "#888", margin: "2px 0 0" }}>
          {product.unit}
        </p>

        {/* Reason text */}
        {product.reason && (
          <p
            style={{
              fontSize: 10,
              color: "#666",
              fontStyle: "italic",
              margin: "3px 0 0",
              lineHeight: 1.3,
            }}
          >
            {product.reason.length > 120
              ? product.reason.slice(0, 120) + "…"
              : product.reason}
          </p>
        )}

        {/* Dietary preference badges — only tags matching the user's selected diet preferences */}
        {showDietaryInfo &&
          (() => {
            const userDietSet = new Set(
              userDietTags.map((t) => t.toLowerCase()),
            );
            const allTags = product.dietary_tags || [];
            const filtered = allTags
              .filter((tag) => userDietSet.has(tag.toLowerCase()))
              .slice(0, 3);
            if (filtered.length === 0) return null;
            return (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 3,
                  margin: "4px 0 0",
                }}
              >
                {filtered.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 9,
                      color: "#067D62",
                      background: "#E6F7F2",
                      border: "1px solid #B2E8D9",
                      borderRadius: 3,
                      padding: "1px 5px",
                      fontWeight: 500,
                    }}
                  >
                    ✓ {tag}
                  </span>
                ))}
              </div>
            );
          })()}

        {/* Allergen Safe badge intentionally omitted — only diet preference badges shown */}

        {/* Dietary conflict badge (red chip) */}
        {resolvedWarning && (
          <div style={{ margin: "3px 0 0" }}>
            <span
              style={{
                fontSize: 9,
                color: "white",
                background: "#CC0C39",
                border: "1px solid #CC0C39",
                borderRadius: 3,
                padding: "1px 5px",
                fontWeight: 700,
              }}
            >
              {resolvedWarning}
            </span>
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 4,
            marginTop: 4,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0F1111" }}>
            ₹{product.price}
          </span>
          {origPrice && (
            <span
              style={{
                fontSize: 10,
                color: "#888",
                textDecoration: "line-through",
              }}
            >
              ₹{origPrice}
            </span>
          )}
        </div>
      </div>
      <div style={{ padding: "0 8px 8px" }}>
        <AddBtn qty={qty} onAdd={add} onInc={inc} onDec={dec} />
      </div>
    </div>
  );
}

// ── Reusable Add/Counter button ───────────────────────────────────────────────
