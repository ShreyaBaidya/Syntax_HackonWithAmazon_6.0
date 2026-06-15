"use client";
import type { BudgetTier } from "@/types";

const occasions = [
  {
    id: "sick_day",
    name: "Sick Day",
    icon: "🤒",
    description: "Feel better food & remedies",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "game_night",
    name: "Game Night",
    icon: "🎮",
    description: "Snacks & drinks for gaming",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "movie_night",
    name: "Movie Night",
    icon: "🎬",
    description: "Popcorn, snacks & treats",
    color: "from-red-500 to-orange-500",
  },
  {
    id: "house_party",
    name: "House Party",
    icon: "🎉",
    description: "Party food & beverages",
    color: "from-yellow-500 to-orange-500",
  },
  {
    id: "birthday",
    name: "Birthday",
    icon: "🎂",
    description: "Cake ingredients & party food",
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "date_night",
    name: "Date Night",
    icon: "💕",
    description: "Romantic dinner ingredients",
    color: "from-rose-500 to-red-500",
  },
  {
    id: "office_lunch",
    name: "Office Lunch",
    icon: "💼",
    description: "Quick & professional meals",
    color: "from-gray-500 to-slate-500",
  },
  {
    id: "quick_breakfast",
    name: "Quick Breakfast",
    icon: "☀️",
    description: "Fast morning meals",
    color: "from-amber-500 to-yellow-500",
  },
];

export default function OccasionGrid({
  onSelect,
  isLoading,
}: {
  onSelect: (occasion: string, budget: BudgetTier) => void;
  isLoading: boolean;
}) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <h3 className="text-white font-semibold text-lg mb-4 text-center">
        🎯 Quick Occasion Shopping
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {occasions.map((o) => (
          <button
            key={o.id}
            onClick={() => onSelect(o.id, "standard")}
            disabled={isLoading}
            className="group relative overflow-hidden rounded-xl p-4 text-center transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${o.color} opacity-80 group-hover:opacity-100 transition-opacity`}
            />
            <div className="relative z-10">
              <span className="text-3xl block mb-1">{o.icon}</span>
              <p className="text-white font-semibold text-sm">{o.name}</p>
              <p className="text-white/70 text-xs mt-0.5">{o.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
