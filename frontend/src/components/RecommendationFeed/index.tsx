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
  cart?: { product: Product; quantity: number }[];
  dietTags?: string[];
  allergenTags?: string[];
}

// Dietary tag to keyword mappings (mirroring backend)
const DIET_EXCLUSIONS: Record<string, string[]> = {
  vegan: ['milk', 'dairy', 'egg', 'meat', 'chicken', 'fish', 'butter', 'cheese', 'yogurt', 'honey'],
  vegetarian: ['meat', 'chicken', 'fish', 'mutton', 'pork', 'prawn', 'shrimp'],
  keto: ['sugar', 'bread', 'rice', 'wheat', 'flour', 'atta', 'noodles', 'pasta'],
  halal: ['pork', 'alcohol', 'wine', 'beer', 'rum'],
  pescatarian: ['meat', 'chicken', 'mutton', 'pork'],
  'gluten-free': ['wheat', 'bread', 'flour', 'atta', 'noodles', 'pasta', 'biscuit', 'cookies'],
};

const ALLERGEN_EXCLUSIONS: Record<string, string[]> = {
  nuts: ['nut', 'almond', 'cashew', 'peanut', 'walnut', 'pistachio'],
  gluten: ['wheat', 'bread', 'flour', 'atta', 'noodles', 'pasta', 'biscuit', 'cookies'],
  dairy: ['milk', 'dairy', 'butter', 'cheese', 'yogurt', 'cream', 'paneer'],
  soy: ['soy', 'soya', 'tofu'],
  shellfish: ['prawn', 'shrimp', 'crab', 'lobster', 'shellfish'],
  eggs: ['egg', 'eggs'],
};

/**
 * Enhanced dietary safety check with proper allergen vs diet preference logic.
 * Rules:
 * 1. Allergens: ALWAYS warn (red banner) - user is allergic
 * 2. Vegan users: warn if product contains dairy/eggs (orange banner) - dietary incompatibility
 * 3. Vegetarian users: NO warning for vegan products - vegetarians can eat vegan
 * 4. All products shown with appropriate warnings
 */
function filterProductsClient(
  products: Product[],
  dietTags: string[] = [],
  allergenTags: string[] = [],
): {
  safe: Product[];
  removed: { product: Product; reason: string }[];
  warnings: Map<string, { message: string; type: 'allergen' | 'diet' }>;
} {
  const warnings = new Map<string, { message: string; type: 'allergen' | 'diet' }>();

  // Build exclusion sets from tags
  const allergenKeywords = new Set<string>();
  allergenTags.forEach(tag => {
    const keywords = ALLERGEN_EXCLUSIONS[tag.toLowerCase()];
    if (keywords) keywords.forEach(kw => allergenKeywords.add(kw));
  });

  const dietKeywords = new Set<string>();
  dietTags.forEach(tag => {
    const keywords = DIET_EXCLUSIONS[tag.toLowerCase()];
    if (keywords) keywords.forEach(kw => dietKeywords.add(kw));
  });

  const isVegan = dietTags.some(t => t.toLowerCase() === 'vegan');
  const isVegetarian = dietTags.some(t => t.toLowerCase() === 'vegetarian');

  for (const product of products) {
    // Build searchable text from product fields
    const searchable = `${product.name} ${product.category} ${(product as any).tags ?? ''} ${(product as any).ingredients?.join(' ') ?? ''}`.toLowerCase();
    const productTags = ((product as any).tags ?? '').toLowerCase();

    // Check if product is vegan (has 'vegan' in tags)
    const isProductVegan = productTags.includes('vegan');

    // 1. ALLERGEN CHECK (highest priority - always warn)
    const allergenMatches = Array.from(allergenKeywords).filter(kw => searchable.includes(kw));
    if (allergenMatches.length > 0) {
      warnings.set(product.id, {
        message: `⚠️ Allergen: ${allergenMatches[0]}`,
        type: 'allergen',
      });
      continue; // Allergen warning takes precedence
    }

    // 2. DIETARY INCOMPATIBILITY CHECK
    if (isVegan) {
      // Vegans can't consume dairy or eggs (even from vegetarian products)
      const veganConflicts = ['milk', 'dairy', 'egg', 'butter', 'cheese', 'yogurt', 'cream', 'paneer', 'honey'];
      const matchedConflict = veganConflicts.find(kw => searchable.includes(kw));
      if (matchedConflict) {
        warnings.set(product.id, {
          message: `Not vegan: ${matchedConflict}`,
          type: 'diet',
        });
        continue;
      }
    }

    if (isVegetarian && !isProductVegan) {
      // Vegetarians can eat vegan products (no warning needed for vegan items)
      // Only warn if product contains meat/fish
      const vegetarianConflicts = ['meat', 'chicken', 'fish', 'mutton', 'pork', 'prawn', 'shrimp'];
      const matchedConflict = vegetarianConflicts.find(kw => searchable.includes(kw));
      if (matchedConflict) {
        warnings.set(product.id, {
          message: `Contains: ${matchedConflict}`,
          type: 'diet',
        });
        continue;
      }
    }

    // 3. OTHER DIET RESTRICTIONS (keto, halal, etc.)
    const dietMatches = Array.from(dietKeywords).filter(kw =>
      searchable.includes(kw) &&
      !['milk', 'dairy', 'egg', 'butter', 'cheese', 'yogurt', 'cream', 'paneer', 'honey', 'meat', 'chicken', 'fish', 'mutton', 'pork', 'prawn', 'shrimp'].includes(kw)
    );
    if (dietMatches.length > 0) {
      warnings.set(product.id, {
        message: `Contains: ${dietMatches[0]}`,
        type: 'diet',
      });
    }
  }

  // All products are shown — none removed
  return { safe: products, removed: [], warnings };
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
  nowSuggestions, reorderNudges, trending, timeContext, onProductSelect, exclusionSet, alternatives, cart = [],
  dietTags = [], allergenTags = [],
}: Props) {
  const [activeCategory, setActiveCategory] = useState('');
  const [activeSub, setActiveSub] = useState('All');
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [loadingCategory, setLoadingCategory] = useState(false);

  // Helper to get cart quantity for a product
  const getCartQty = (productId: string) => {
    const item = cart.find(c => c.product.id === productId);
    return item ? item.quantity : 0;
  };

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

  // Apply client-side dietary safety check (warns, never removes)
  const { safe: safeProducts, removed: removedProducts, warnings: productWarnings } = filterProductsClient(filtered, dietTags, allergenTags);
  const { safe: safeReorder } = filterProductsClient(filteredReorder, dietTags, allergenTags);

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
          <ProductGrid4 products={safeProducts} onProductSelect={onProductSelect} getCartQty={getCartQty} warnings={productWarnings} />
        </Section>
      )}

      {/* Task 9.1: Alternatives carousel */}
      {alternatives && alternatives.length > 0 && (
        <Section title="🔄 Safe Alternatives">
          <div className="scrollbar-hide" style={{
            display: 'flex', gap: 10, overflowX: 'auto', padding: '8px 10px 12px',
          }}>
            {alternatives.map(p => (
              <div key={p.id} style={{ minWidth: 150, maxWidth: 150, flexShrink: 0 }}>
                <ProductCard product={p} onAddToCart={onProductSelect} grid initialQty={getCartQty(p.id)} />
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
              <ProductCard key={p.id} product={p} onAddToCart={onProductSelect} compact initialQty={getCartQty(p.id)} />
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
function ProductGrid4({ products, onProductSelect, getCartQty, warnings = new Map() }: {
  products: Product[];
  onProductSelect: (p: Product, qty: number) => void;
  getCartQty: (productId: string) => number;
  warnings?: Map<string, { message: string; type: 'allergen' | 'diet' }>;
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
      gap: 8,
      padding: '8px 10px 12px',
    }}>
      {products.map(p => {
        const warning = warnings.get(p.id);
        return (
          <ProductCard
            key={p.id}
            product={p}
            onAddToCart={onProductSelect}
            grid
            initialQty={getCartQty(p.id)}
            allergyWarning={warning?.message}
            warningType={warning?.type}
          />
        );
      })}
    </div>
  );
}
