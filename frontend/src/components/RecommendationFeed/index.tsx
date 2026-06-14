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
  exclusionSet?: string[];
  alternatives?: Product[];
}

/**
 * Client-side safety filter: removes products whose category/tags/name
 * contain any exclusion keyword (case-insensitive substring match).
 * Returns { safe: Product[], removed: { product: Product, reason: string }[] }
 */
function filterProductsClient(products: Product[], exclusionSet: string[]): {
  safe: Product[];
  removed: { product: Product; reason: string }[];
} {
  if (!exclusionSet || exclusionSet.length === 0) return { safe: products, removed: [] };

  const safe: Product[] = [];
  const removed: { product: Product; reason: string }[] = [];

  for (const product of products) {
    const searchable = `${product.name} ${product.category} ${(product as any).tags ?? ''}`.toLowerCase();
    const matchedKeyword = exclusionSet.find(kw => searchable.includes(kw.toLowerCase()));
    if (matchedKeyword) {
      removed.push({ product, reason: `Removed due to ${matchedKeyword} restriction` });
    } else {
      safe.push(product);
    }
  }

  return { safe, removed };
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
  nowSuggestions, reorderNudges, trending, timeContext, onProductSelect, exclusionSet, alternatives,
}: Props) {
  const [activeCategory, setActiveCategory] = useState('');
  const [activeSub, setActiveSub] = useState('All');
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [loadingCategory, setLoadingCategory] = useState(false);

  console.log('[RecommendationFeed] Rendering with:', {
    nowSuggestions: nowSuggestions.length,
    trending: trending.length,
    exclusionSet: exclusionSet?.length ?? 0,
  });

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

  // Apply client-side dietary safety filter
  const { safe: safeProducts, removed: removedProducts } = filterProductsClient(filtered, exclusionSet ?? []);
  const { safe: safeReorder } = filterProductsClient(filteredReorder, exclusionSet ?? []);

  console.log('[RecommendationFeed] After filter:', {
    safe: safeProducts.length,
    removed: removedProducts.length,
  });

  const sectionTitle = (() => {
    let title = isBrowsing
      ? `${activeCategory.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} Products`
      : (SECTION_TITLES[timeContext] ?? '✨ For you right now');
    // Task 9.2: Enhance header with intent context
    if (!isBrowsing && timeContext && timeContext.toLowerCase().includes('based')) {
      title = `${title} 💬`;
    }
    // Limit header text to 60 characters
    if (title.length > 60) {
      title = title.slice(0, 57) + '…';
    }
    return title;
  })();

  return (
    <div style={{ background: '#F7F7F7' }}>
      {/* Category icon strip */}
      <CategoryStrip active={activeCategory} onChange={handleCategoryChange} />

      {/* Task 9.5: Personalized indicator when exclusionSet is active */}
      {exclusionSet && exclusionSet.length > 0 && (
        <div style={{ padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#067D62', fontWeight: 500 }}>🛡️ Personalized for your dietary profile</span>
        </div>
      )}

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
      {!loadingCategory && safeProducts.length > 0 && (
        <Section title={sectionTitle}>
          <ProductGrid4 products={safeProducts} onProductSelect={onProductSelect} />
        </Section>
      )}

      {/* Explainability: filtered items */}
      {removedProducts.length > 0 && (
        <div style={{ padding: '8px 12px', background: '#FFF8E1', margin: '0 10px 8px', borderRadius: 8, border: '1px solid #FFE082' }}>
          <p style={{ margin: 0, fontSize: 11, color: '#B71C1C', fontWeight: 600 }}>
            🛡️ {removedProducts.length} item{removedProducts.length > 1 ? 's' : ''} filtered for your safety
          </p>
          <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {removedProducts.slice(0, 3).map(({ product, reason }) => (
              <p key={product.id} style={{ margin: 0, fontSize: 10, color: '#666' }}>
                • {product.name} — <span style={{ color: '#C62828' }}>{reason}</span>
              </p>
            ))}
            {removedProducts.length > 3 && (
              <p style={{ margin: 0, fontSize: 10, color: '#888' }}>
                + {removedProducts.length - 3} more items hidden
              </p>
            )}
          </div>
        </div>
      )}

      {/* Task 9.1: Alternatives carousel */}
      {alternatives && alternatives.length > 0 && (
        <Section title="🔄 Safe Alternatives">
          <div className="scrollbar-hide" style={{
            display: 'flex', gap: 10, overflowX: 'auto', padding: '8px 10px 12px',
          }}>
            {alternatives.map(p => (
              <div key={p.id} style={{ minWidth: 150, maxWidth: 150, flexShrink: 0 }}>
                <ProductCard product={p} onAddToCart={onProductSelect} grid />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Reorder nudges (only on home / Top Picks view) */}
      {!isBrowsing && safeReorder.length > 0 && (
        <Section title="🔁 Buy Again">
          <div>
            {safeReorder.map(p => (
              <ProductCard key={p.id} product={p} onAddToCart={onProductSelect} compact />
            ))}
          </div>
        </Section>
      )}

      {!loadingCategory && safeProducts.length === 0 && (
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
      <div style={{ background: 'white', padding: '12px 12px 0' }}>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0F1111', paddingBottom: 10 }}>
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
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 8,
      padding: '8px 10px 12px',
    }}>
      {products.map(p => (
        <ProductCard key={p.id} product={p} onAddToCart={onProductSelect} grid />
      ))}
    </div>
  );
}
