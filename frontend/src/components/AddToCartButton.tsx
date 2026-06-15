"use client";
import { ShoppingCart, Plus, Trash2 } from "lucide-react";
import { useCart, generateItemId } from "@/lib/cart-context";
import type { CartItem } from "@/types";

export default function AddToCartButton({
  item,
  onAdded,
}: {
  item: CartItem;
  onAdded?: () => void;
}) {
  const { items, addItem, removeItem, increaseQuantity } = useCart();
  const itemId = generateItemId(item);
  const cartItem = items.find((i) => i.id === itemId);
  const quantity = cartItem?.count || 0;

  if (quantity > 0) {
    return (
      <div className="flex items-center border border-amazon-orange rounded-full overflow-hidden">
        <button
          onClick={() => removeItem(itemId)}
          className="flex items-center justify-center w-8 h-8 text-amazon-orange hover:bg-amazon-orange/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <span className="w-8 h-8 flex items-center justify-center text-sm font-semibold text-gray-800 border-x border-amazon-orange/30">
          {quantity}
        </span>
        <button
          onClick={() => increaseQuantity(itemId)}
          className="flex items-center justify-center w-8 h-8 text-amazon-orange hover:bg-amazon-orange/10"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={() => {
        addItem(item);
        onAdded?.();
      }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amazon-orange hover:bg-amazon-orange-dark text-white text-xs font-semibold transition-all hover:shadow-md active:scale-95"
    >
      <ShoppingCart className="h-3.5 w-3.5" />
      Add to Cart
    </button>
  );
}
