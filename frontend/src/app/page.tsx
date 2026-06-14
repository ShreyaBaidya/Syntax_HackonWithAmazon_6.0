'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import CartDisplay from '@/components/CartDisplay';
import OccasionGrid from '@/components/OccasionGrid';
import ImageUpload from '@/components/ImageUpload';
import URLInput from '@/components/RecipeInput';
import LoadingState from '@/components/LoadingState';
import CartDrawer from '@/components/CartDrawer';
import {
  buildCartFromIntent,
  buildCartFromImage,
  buildCartFromURL,
  buildCartForOccasion,
} from '@/lib/api';
import type { CartResponse, BudgetTier } from '@/types';
import { MessageSquare, Camera, Link, Sparkles } from 'lucide-react';

type Tab = 'chat' | 'photo' | 'url' | 'occasion';

export default function Home() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  const handleSearch = async (query: string, budget: BudgetTier) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await buildCartFromIntent({
        query,
        budget_tier: budget,
        dietary_preferences: [],
      });
      setCart(result);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to build cart. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await buildCartFromImage(file);
      setCart(result);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to analyze image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleURLSubmit = async (url: string, prompt?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await buildCartFromURL({ url, prompt, budget_tier: 'standard' });
      setCart(result);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to process URL. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOccasionSelect = async (occasion: string, budget: BudgetTier) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await buildCartForOccasion({ occasion, guests: 4, budget_tier: budget, dietary_preferences: [] });
      setCart(result);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to build occasion cart. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => { setCart(null); setError(null); };

  const tabs = [
    { id: 'chat' as Tab, label: 'Chat', icon: MessageSquare },
    { id: 'photo' as Tab, label: 'Photo', icon: Camera },
    { id: 'url' as Tab, label: 'URL', icon: Link },
    { id: 'occasion' as Tab, label: 'Occasions', icon: Sparkles },
  ];

  return (
    <>
      <Header />
      <CartDrawer />
      <main className="px-4 py-8">
        {!cart && !isLoading && (
          <div className="text-center mb-8 animate-fade-in">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-3">
              What are you <span className="text-amazon-orange">shopping</span> for?
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Tell us your intent and we&apos;ll build the perfect cart. AI-powered and budget-aware.
            </p>
          </div>
        )}

        {!cart && !isLoading && (
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-amazon-blue-light/50 rounded-xl p-1 gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-amazon-orange text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!cart && !isLoading && (
          <div className="mb-10">
            {activeTab === 'chat' && <SearchBar onSearch={handleSearch} isLoading={isLoading} />}
            {activeTab === 'photo' && <ImageUpload onUpload={handleImageUpload} isLoading={isLoading} />}
            {activeTab === 'url' && <URLInput onSubmit={handleURLSubmit} isLoading={isLoading} />}
            {activeTab === 'occasion' && <OccasionGrid onSelect={handleOccasionSelect} isLoading={isLoading} />}
          </div>
        )}

        {!cart && !isLoading && activeTab === 'chat' && (
          <div className="mt-10">
            <OccasionGrid onSelect={handleOccasionSelect} isLoading={isLoading} />
          </div>
        )}

        {isLoading && <LoadingState />}

        {error && (
          <div className="max-w-lg mx-auto bg-red-900/50 border border-red-500 rounded-xl p-4 text-center animate-fade-in">
            <p className="text-red-200">{error}</p>
            <button onClick={handleReset} className="mt-2 text-red-300 hover:text-white text-sm underline">Try again</button>
          </div>
        )}

        {cart && <CartDisplay cart={cart} onReset={handleReset} />}
      </main>
    </>
  );
}
