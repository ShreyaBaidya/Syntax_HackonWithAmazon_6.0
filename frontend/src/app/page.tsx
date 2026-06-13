'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getRecommendations, Recommendations, Product } from '@/lib/api';
import { RecommendationFeed } from '@/components/RecommendationFeed';
import { SpeedCheckout, CartItem } from '@/components/SpeedCheckout';
import { AmazonHeader } from '@/components/AmazonHeader';
import { Order } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
  const [recs, setRecs] = useState<Recommendations | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    getRecommendations()
      .then(setRecs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleProductSelect = useCallback((product: Product, qty: number) => {
    setCart(prev => {
      const exists = prev.find(i => i.product.id === product.id);
      if (qty === 0) return prev.filter(i => i.product.id !== product.id);
      if (exists) return prev.map(i => i.product.id === product.id ? { ...i, quantity: qty } : i);
      return [...prev, { product, quantity: qty }];
    });
  }, []);

  const handleOrderComplete = (_order: Order) => {
    setCart([]);
    setTimeout(() => setShowCheckout(false), 3200);
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div style={{ background: '#EAEDED', minHeight: '100vh', paddingBottom: 64 }}>
      {/* Amazon-style sticky header */}
      <AmazonHeader cart={cart} onCartClick={() => cartCount > 0 && setShowCheckout(true)} />

      {/* NowSpeak banner — Amazon prime-style */}
      <div
        onClick={() => router.push('/nowspeak')}
        style={{
          background: 'linear-gradient(135deg, #232F3E 0%, #37475A 100%)',
          margin: '8px 8px 0',
          borderRadius: 6, padding: '12px 14px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
          border: '1px solid #FF9900',
        }}
      >
        <div style={{
          width: 44, height: 44, background: '#FF9900', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
        }}>🎙️</div>
        <div style={{ flex: 1 }}>
          <p style={{ color: '#FF9900', fontWeight: 700, fontSize: 14, margin: 0 }}>
            Try NowSpeak™ — Just say what you need
          </p>
          <p style={{ color: '#CCC', fontSize: 11, margin: '2px 0 0' }}>
            "I have a fever" → AI finds it in seconds
          </p>
        </div>
        <svg width="20" height="20" fill="#FF9900" viewBox="0 0 24 24">
          <path d="M10 17l5-5-5-5v10z"/>
        </svg>
      </div>

      {/* Deals of the Day banner */}
      <div style={{
        background: 'linear-gradient(90deg, #FF9900 0%, #FFB347 100%)',
        margin: '8px 8px 0', borderRadius: 6, padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: 0 }}>
            🏷️ Deals of the Day
          </p>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, margin: '2px 0 0' }}>
            Up to 30% off on daily essentials
          </p>
        </div>
        <div style={{
          background: 'white', color: '#FF9900', fontSize: 11,
          fontWeight: 700, padding: '4px 10px', borderRadius: 4,
        }}>
          Shop Now
        </div>
      </div>

      {/* Products section */}
      <div style={{ marginTop: 8 }}>
        {loading ? (
          <LoadingSkeleton />
        ) : recs ? (
          <RecommendationFeed
            nowSuggestions={recs.now_suggestions}
            reorderNudges={recs.reorder_nudges}
            trending={recs.trending}
            timeContext={recs.time_context}
            onProductSelect={handleProductSelect}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'white' }}>
            <p style={{ color: '#565959', fontSize: 14 }}>
              Backend not running. Start with:
            </p>
            <code style={{
              background: '#F3F3F3', padding: '6px 12px', borderRadius: 4,
              fontSize: 12, display: 'block', marginTop: 8,
            }}>
              cd backend && uvicorn app.main:app --reload
            </code>
          </div>
        )}
      </div>

      {/* Amazon-style bottom nav */}
      <nav style={{
        position: 'fixed', bottom: 0, inset: '0 0 auto',
        left: 0, right: 0, background: 'white',
        borderTop: '1px solid #DDD', display: 'flex',
        justifyContent: 'space-around', alignItems: 'center',
        padding: '8px 0 4px', height: 56, zIndex: 40,
      }}>
        <NavTab icon="🏠" label="Home" active />
        <NavTab icon="🔍" label="Search" onClick={() => router.push('/nowspeak')} />
        <NavTab
          icon="🛒"
          label="Cart"
          badge={cartCount}
          onClick={() => cartCount > 0 && setShowCheckout(true)}
        />
        <NavTab icon="👤" label="Account" />
      </nav>

      {/* Speed checkout modal */}
      {showCheckout && cart.length > 0 && (
        <SpeedCheckout
          cart={cart}
          onOrderComplete={handleOrderComplete}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
}

function NavTab({
  icon, label, active, badge, onClick,
}: { icon: string; label: string; active?: boolean; badge?: number; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 2, background: 'none', border: 'none', cursor: 'pointer',
        position: 'relative', padding: '2px 12px',
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      {badge !== undefined && badge > 0 && (
        <span style={{
          position: 'absolute', top: 0, right: 6,
          background: '#CC0C39', color: 'white',
          borderRadius: '50%', width: 15, height: 15, fontSize: 9,
          fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {badge}
        </span>
      )}
      <span style={{
        fontSize: 10, fontWeight: active ? 700 : 400,
        color: active ? '#FF9900' : '#565959',
      }}>
        {label}
      </span>
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ background: 'white', padding: 12 }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
      }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            borderRadius: 4, overflow: 'hidden',
            border: '1px solid #EEE',
          }}>
            <div style={{
              paddingTop: '100%',
              background: 'linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }} />
            <div style={{ padding: 8 }}>
              <div style={{ height: 12, background: '#F0F0F0', borderRadius: 2, marginBottom: 6 }} />
              <div style={{ height: 12, background: '#F0F0F0', borderRadius: 2, width: '70%' }} />
              <div style={{ height: 28, background: '#F0F0F0', borderRadius: 4, marginTop: 10 }} />
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
