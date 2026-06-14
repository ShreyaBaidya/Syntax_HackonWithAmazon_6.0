'use client';
import type { NutritionInfo } from '@/types';
export default function NutritionCard({ nutrition }: { nutrition: NutritionInfo }) {
  const items = [{ label: 'Calories', value: Math.round(nutrition.calories), unit: 'kcal', color: 'bg-orange-500' },{ label: 'Protein', value: Math.round(nutrition.protein), unit: 'g', color: 'bg-red-500' },{ label: 'Carbs', value: Math.round(nutrition.carbs), unit: 'g', color: 'bg-blue-500' },{ label: 'Fat', value: Math.round(nutrition.fat), unit: 'g', color: 'bg-yellow-500' }];
  if (nutrition.fiber) items.push({ label: 'Fiber', value: Math.round(nutrition.fiber), unit: 'g', color: 'bg-green-500' });
  return (<div className="bg-white rounded-xl shadow-lg p-5"><h3 className="font-semibold text-gray-800 mb-3">🥗 Nutrition Summary</h3><div className="space-y-3">{items.map((i) => (<div key={i.label} className="flex items-center justify-between"><div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${i.color}`} /><span className="text-sm text-gray-600">{i.label}</span></div><span className="text-sm font-semibold text-gray-800">{i.value} {i.unit}</span></div>))}</div></div>);
}
