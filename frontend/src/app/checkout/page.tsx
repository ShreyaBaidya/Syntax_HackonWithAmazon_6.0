"use client";

import { useRouter } from "next/navigation";

/**
 * Standalone checkout page — redirects to home since checkout is
 * handled as a modal overlay (SpeedCheckout) from both Home and NowSpeak.
 */
export default function CheckoutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">🛒</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Your cart is empty
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Add items from the home feed or use NowSpeak to find what you need.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Browse Recommendations
          </button>
          <button
            onClick={() => router.push("/nowspeak")}
            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-2xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <span>🎙️</span> Open NowSpeak
          </button>
        </div>
      </div>
    </div>
  );
}
