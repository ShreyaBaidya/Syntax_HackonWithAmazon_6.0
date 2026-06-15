"use client";
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

export default function Toast({
  message,
  isVisible,
  onClose,
}: {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (isVisible) {
      const t = setTimeout(onClose, 2500);
      return () => clearTimeout(t);
    }
  }, [isVisible, onClose]);
  if (!isVisible) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-slide-up">
      <div className="flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-gray-700">
        <div className="bg-green-500 rounded-full p-1">
          <Check className="h-3 w-3 text-white" />
        </div>
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white ml-2"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
export function useToast() {
  const [toast, setToast] = useState({ message: "", isVisible: false });
  return {
    toast,
    showToast: (m: string) => setToast({ message: m, isVisible: true }),
    hideToast: () => setToast((p) => ({ ...p, isVisible: false })),
  };
}
