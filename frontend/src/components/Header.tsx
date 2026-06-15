"use client";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export default function Header() {
  const { itemCount, openDrawer } = useCart();
  return (
    <header className="bg-amazon-blue-dark border-b border-amazon-blue-light sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-1">
            <ShoppingCart className="h-8 w-8 text-amazon-orange" />
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">
                Amazon <span className="text-amazon-orange">Neighborhood</span>
              </h1>
              <p className="text-gray-400 text-xs">AI Shopping Assistant</p>
            </div>
          </div>
          <button
            onClick={openDrawer}
            className="relative p-2 rounded-lg hover:bg-amazon-blue-light transition-colors group"
            aria-label="Open cart"
          >
            <ShoppingCart className="h-6 w-6 text-white group-hover:text-amazon-orange transition-colors" />
            <span className="absolute -top-0.5 -right-0.5 bg-amazon-orange text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {itemCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
