'use client';

import { useState } from 'react';
import { Product } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { CategoryStrip } from '@/components/CategoryStrip';

interface Props {
  nowSuggestions: Product[];
  reorderNudges: Product[];
  trending: Product[];
  timeContext: string;
  onProductSelect: (product: Product, qty: number) => void;
}

const SECTION_TITLES: Record<string, string> = {
  morning:   '☀️ Good morning! Your morning essentials',
  midday:    '🍽️ Midday deals for you',
  afternoon: '☕ Afternoon picks',
  evening:   '🌆 Evening essentials',
  night:     '🌙 Late night needs',
};

export function RecommendationFeed({
  nowSuggestions, reorderNudges, trending, timeContext, onProductSelect,
}: Props) {
  const [activeCategory, setActiveCategory] = useState('');

  const filterByCategory = (products: Product[]) =>
    activeCategory ? products.filter(p => p.category === activeCategory) : products;

  const filteredNow = filterByCategory(nowSuggestions);
  const filteredTrending = filterByCategory(trending);
  const filteredReorder = filterByCategory(reorderNudges);

  return (
    <div>
      {/* Category strip */}
      <CategoryStrip active={activeCategory} onChange={setActiveCategory} />

      {/* Now Suggestions */}
      {filteredNow.length > 0 && (
        <Section title={SECTION_TITLES[timeContext] ?? '✨ For you right now'}>
          <ProductGrid products={filteredNow} onProductSelect={onProductSelect} />
        </Section>
      )}

      {/* Reorder nudges */}
      {filteredReorder.length > 0 && (
        <Section title="🔁 Buy Again">
          <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {filteredReorder.map(p => (
              <ProductCard key={p.id} product={p} onAddToCart={onProductSelect} compact />
            ))}
          </div>
        </Section>
      )}

      {/* Trending */}
      {filteredTrending.length > 0 && (
        <Section title="🔥 Trending Near You">
          <ProductGrid products={filteredTrending} onProductSelect={onProductSelect} />
        </Section>
      )}

      {filteredNow.length === 0 && filteredTrending.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#565959' }}>
          <p style={{ fontSize: 15 }}>No products in this category yet.</p>
          <button
            onClick={() => setActiveCategory('')}
            style={{
              marginTop: 8, background: '#FF9900', color: 'white',
              border: 'none', borderRadius: 4, padding: '8px 20px',
              fontWeight: 600, cursor: 'pointer', fontSize: 13,
            }}
          >
            Show All
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{
        background: 'white', padding: '12px 12px 0',
        borderTop: '1px solid #EEE', borderBottom: '1px solid #EEE',
      }}>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0F1111', paddingBottom: 10 }}>
          {title}
        </h2>
      </div>
      <div style={{ background: 'white' }}>
        {children}
      </div>
    </div>
  );
}

function ProductGrid({ products, onProductSelect }: { products: Product[]; onProductSelect: (p: Product, qty: number) => void }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      gap: 1, padding: 1, background: '#EEE',
    }}>
      {products.map(p => (
        <ProductCard key={p.id} product={p} onAddToCart={onProductSelect} />
      ))}
    </div>
  );
}
