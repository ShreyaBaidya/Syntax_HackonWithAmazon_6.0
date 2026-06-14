'use client';
import { ShoppingCart } from 'lucide-react';
export default function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <ShoppingCart className="h-16 w-16 text-amazon-orange animate-bounce" />
      <p className="text-white font-semibold text-lg mt-6">Building your smart cart...</p>
      <div className="mt-3 space-y-1">
        <p className="text-gray-400 text-sm animate-pulse">🧠 Understanding your intent...</p>
        <p className="text-gray-400 text-sm animate-pulse">🛒 Selecting best products...</p>
        <p className="text-gray-400 text-sm animate-pulse">💰 Optimizing for your budget...</p>
      </div>
    </div>
  );
}
