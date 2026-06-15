"use client";
import { useState } from "react";
import { Link, ArrowRight, Mic, MessageSquare } from "lucide-react";
import { useSpeech } from "@/lib/use-speech";

export default function URLInput({
  onSubmit,
  isLoading,
}: {
  onSubmit: (url: string, prompt?: string) => void;
  isLoading: boolean;
}) {
  const [url, setUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const { isListening, toggleListening } = useSpeech({
    onResult: (t) => setPrompt(t),
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onSubmit(url, prompt.trim() || undefined);
  };
  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-gray-300 text-sm font-medium mb-1 block">
            URL
          </label>
          <div className="flex items-center bg-white rounded-lg overflow-hidden shadow-lg">
            <div className="pl-4">
              <Link className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste any URL..."
              className="flex-1 px-3 py-3 text-gray-800 placeholder-gray-400 focus:outline-none"
              disabled={isLoading}
            />
          </div>
        </div>
        <div>
          <label className="text-gray-300 text-sm font-medium mb-1 block">
            Additional Instructions{" "}
            <span className="text-gray-500">(optional)</span>
          </label>
          <div className="flex items-start bg-white rounded-lg overflow-hidden shadow-lg">
            <div className="pl-4 pt-3">
              <MessageSquare className="h-5 w-5 text-gray-400" />
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g. 'Only recommend wired earphones under ₹1000'"
              className="flex-1 px-3 py-3 text-gray-800 placeholder-gray-400 focus:outline-none resize-none min-h-[80px]"
              disabled={isLoading}
              rows={3}
            />
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 mt-1 ${isListening ? "text-red-500" : "text-gray-400 hover:text-amazon-orange"}`}
            >
              <Mic className="h-5 w-5" />
            </button>
          </div>
          {isListening && (
            <p className="text-amazon-orange text-xs mt-1 animate-pulse">
              🎙️ Listening...
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="w-full bg-amazon-orange hover:bg-amazon-orange-dark disabled:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? "Processing..." : "Analyze & Build Cart"}
          <ArrowRight className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
