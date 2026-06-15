"use client";
import { ShoppingCart, RefreshCw } from "lucide-react";
import type { CartResponse, CartItem } from "@/types";
import { formatPrice } from "@/lib/utils";
import NutritionCard from "./NutritionCard";
import AddToCartButton from "./AddToCartButton";
import Toast, { useToast } from "./Toast";

export default function CartDisplay({
  cart,
  onReset,
}: {
  cart: CartResponse;
  onReset: () => void;
}) {
  const { toast, showToast, hideToast } = useToast();
  const essential = cart.items.filter((i) => i.category === "essential");
  const recommended = cart.items.filter((i) => i.category === "recommended");
  const optional = cart.items.filter((i) => i.category === "optional");

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-amazon-orange" />
              Your Smart Cart
            </h2>
            <p className="text-gray-500 mt-1">{cart.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="bg-amazon-orange/10 text-amazon-orange px-2 py-0.5 rounded-full font-medium capitalize">
                {cart.budget_tier}
              </span>
              <span className="text-gray-500">
                📦 {cart.items.length} items
              </span>
            </div>
          </div>
          <button
            onClick={onReset}
            className="text-sm text-gray-500 hover:text-amazon-orange flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            New Search
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {essential.length > 0 && (
            <ItemSection
              title="🔴 Essential Items"
              subtitle="Must-have items"
              items={essential}
              onAdded={(n) => showToast(`${n} added`)}
            />
          )}
          {recommended.length > 0 && (
            <ItemSection
              title="🟡 Recommended"
              subtitle="Improves the experience"
              items={recommended}
              onAdded={(n) => showToast(`${n} added`)}
            />
          )}
          {optional.length > 0 && (
            <ItemSection
              title="🟢 Optional"
              subtitle="Nice to have"
              items={optional}
              onAdded={(n) => showToast(`${n} added`)}
            />
          )}
        </div>
        <div className="space-y-4">
          {cart.nutrition && <NutritionCard nutrition={cart.nutrition} />}
        </div>
      </div>
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
}

function ItemSection({
  title,
  subtitle,
  items,
  onAdded,
}: {
  title: string;
  subtitle: string;
  items: CartItem[];
  onAdded: (name: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-5">
      <div className="mb-3">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
      <div className="divide-y divide-gray-100">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="py-3 flex items-center justify-between gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">{item.name}</p>
              {item.substitutes.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Alt: {item.substitutes.slice(0, 2).join(", ")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {item.estimated_price && (
                <p className="font-semibold text-gray-800 text-sm">
                  {formatPrice(item.estimated_price)}
                </p>
              )}
              <AddToCartButton item={item} onAdded={() => onAdded(item.name)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
