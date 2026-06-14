'use client';

import { useState, useEffect } from 'react';
import { Product, getProductsByCategory } from '@/lib/api';
import { ProductCard } from '@/components/ProductCard';
import { CategoryStrip } from '@/components/CategoryStrip';

interface Props {
  nowSuggestions: Product[];
  reorderNudges: Product[];
  trending: Product[];
  timeContext: string;
  onProductSelect: (product: Product, qty: number) => void;
}

const SUB_CATS = [
  'All', 'Vegetables', 'Fruits', 'Dairy & Eggs',
  'Snacks', 'Beverages', 'Bakery', 'Rice & Pulses',
];

const SECTION_TITLES: Record<string, string> = {
  morning:   'Good morning! ☀️ Your essentials',
  midday:    'Midday picks 🍽️',
  afternoon: 'Afternoon pick-me-up ☕',
  evening:   'Evening essentials 🌆',
  night:     'Late night needs 🌙',
};

export function RecommendationFeed({
  nowSuggestions, reorderNudges, trending, timeContext, onProductSelect,
}: Props) {
  const [activeCategory, setActiveCategory] = useState('');
  const [activeSub, setActiveSub] = useState('All');
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [loadingCategory, setLoadingCategory] = useState(false);

  // Fetch catalog products whenever a category is selected
  useEffect(() => {
    if (!activeCategory) {
      setCategoryProducts([]);
      return;
    }
    setLoadingCategory(true);
    getProductsByCategory(activeCategory, 20)
      .then(setCategoryProducts)
      .catch(() => setCategoryProducts([]))
      .finally(() => setLoadingCategory(false));
  }, [activeCategory]);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setActiveSub('All');
  };

  // When no category selected, show recommendations; otherwise show catalog products
  const isBrowsing = Boolean(activeCategory);
  const filtered = isBrowsing ? categoryProducts : [...nowSuggestions, ...trending];
  const filteredReorder = isBrowsing ? [] : reorderNudges;

  const sectionTitle = isBrowsing
    ? `${activeCategory.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} Products`
    : (SECTION_TITLES[timeContext] ?? '✨ For you right now');

  return (
    <div style={{ background: '#F7F7F7' }}>
      {/* Category icon strip */}
      <CategoryStrip active={activeCategory} onChange={handleCategoryChange} />

      {/* Sub-category pill chips */}
      <div style={{ background: 'white', borderBottom: '1px solid #F0F0F0' }}>
        <div className="scrollbar-hide" style={{
          display: 'flex', gap: 6, overflowX: 'auto',
          padding: '8px 10px',
        }}>
          {SUB_CATS.map(s => (
            <button
              key={s}
              onClick={() => setActiveSub(s)}
              style={{
                flexShrink: 0, padding: '5px 12px', borderRadius: 20,
                border: '1px solid #DDD',
                background: activeSub === s ? '#0F1111' : 'white',
                color: activeSub === s ? 'white' : '#0F1111',
                fontSize: 11, fontWeight: activeSub === s ? 700 : 400,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loadingCategory && (
        <div style={{ textAlign: 'center', padding: '32px 20px', background: 'white', marginTop: 8 }}>
          <p style={{ color: '#888', fontSize: 13 }}>Loading products…</p>
        </div>
      )}

      {/* Main product grid */}
      {!loadingCategory && filtered.length > 0 && (
        <Section title={sectionTitle}>
          <ProductGrid4 products={filtered} onProductSelect={onProductSelect} />
        </Section>
      )}

      {/* Reorder nudges (only on home / Top Picks view) */}
      {!isBrowsing && filteredReorder.length > 0 && (
        <Section title="🔁 Buy Again">
          <div>
            {filteredReorder.map(p => (
              <ProductCard key={p.id} product={p} onAddToCart={onProductSelect} compact />
            ))}
          </div>
        </Section>
      )}

      {!loadingCategory && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: 'white', marginTop: 8 }}>
          <p style={{ color: '#888', fontSize: 14 }}>No products in this category.</p>
          <button
            onClick={() => handleCategoryChange('')}
            style={{
              marginTop: 8, background: '#FFD814', color: '#0F1111',
              border: 'none', borderRadius: 6, padding: '8px 20px',
              fontWeight: 700, cursor: 'pointer', fontSize: 13,
            }}
          >
            Show All
          </button>
        </div>
      )}

      {/* Bottom spacing */}
      <div style={{ height: 80 }} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ background: 'white', padding: '14px 12px 0' }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F1111', paddingBottom: 10 }}>
          {title}
        </h2>
      </div>
      <div style={{ background: 'white' }}>{children}</div>
    </div>
  );
}

// 4-column compact grid (Amazon Now style)
function ProductGrid4({ products, onProductSelect }: {
  products: Product[];
  onProductSelect: (p: Product, qty: number) => void;
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
      gap: 8,
      padding: '8px 10px 12px',
    }}>
      {products.map(p => (
        <ProductCard key={p.id} product={p} onAddToCart={onProductSelect} grid />
      ))}
    </div>
  );
}
