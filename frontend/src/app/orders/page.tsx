'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getOrderHistory, OrderHistoryItem } from '@/lib/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  const weekday = d.toLocaleDateString('en-IN', { weekday: 'long' });
  const day     = d.getDate();
  const month   = d.toLocaleDateString('en-IN', { month: 'long' });
  const time    = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${weekday}, ${day} ${month} at ${time}`;
}

// Deterministic colour from product_id for placeholder thumbnails
function idToColour(id: string): string {
  const palette = ['#E8F5E9', '#E3F2FD', '#FFF3E0', '#FCE4EC', '#F3E5F5', '#E0F2F1'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  return palette[hash % palette.length];
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{
      background: 'white',
      border: '1px solid #E8E8E8',
      borderRadius: 12,
      padding: '14px 16px',
      marginBottom: 12,
    }}>
      {/* status row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ width: 180, height: 14, background: '#F0F0F0', borderRadius: 6 }} />
        <div style={{ width: 10, height: 14, background: '#F0F0F0', borderRadius: 6 }} />
      </div>
      {/* thumb row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 44, height: 44, borderRadius: 8, background: '#F0F0F0' }} />
        ))}
      </div>
      {/* bottom row */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ width: 120, height: 12, background: '#F0F0F0', borderRadius: 6 }} />
        <div style={{ width: 60, height: 12, background: '#F0F0F0', borderRadius: 6 }} />
      </div>
    </div>
  );
}

// ── Order card ────────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: OrderHistoryItem }) {
  const displayDate = formatDate(order.created_at);
  const visibleItems = order.items.slice(0, 5);
  const extra = order.items.length - visibleItems.length;

  return (
    <div style={{
      background: 'white',
      border: '1px solid #E8E8E8',
      borderRadius: 12,
      padding: '14px 16px',
      marginBottom: 12,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      {/* ── Status row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 20, height: 20, borderRadius: '50%',
            background: '#1A8B4E', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <div style={{fontWeight: 700 }}>
            <span style={{ fontSize: 12}}>Delivered</span>
            <span style={{ fontSize: 12, marginLeft: 6 }}>{displayDate}</span>
          </div>
        </div>
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
          <path d="M1 1l6 6-6 6" stroke="#AAAAAA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* ── Product thumbnails ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {visibleItems.map((item, idx) => {
          const imgUrl = (item as any).image_url;
          return (
            <div key={idx} style={{
              width: 44, height: 44, borderRadius: 8,
              background: idToColour(item.product_id),
              border: '1px solid #EEE', flexShrink: 0, overflow: 'hidden',
            }}>
              {imgUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgUrl} alt={(item as any).title || item.product_id}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 9, color: '#888', fontWeight: 600, textAlign: 'center', padding: 2 }}>
                    {item.product_id.slice(-4).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          );
        })}
        {extra > 0 && (
          <div style={{
            width: 44, height: 44, borderRadius: 8,
            background: '#F5F5F5', border: '1px solid #EEE',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, color: '#666', fontWeight: 600 }}>+{extra}</span>
          </div>
        )}
      </div>

      {/* ── Bottom row: order ID + total ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, color: '#9E9E9E', letterSpacing: 0.3 }}>
          {order.order_id}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0F1111' }}>
          Total: ₹{order.total_amount.toFixed(0)}
        </span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders]   = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    getOrderHistory('demo_user')
      .then(setOrders)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', maxWidth: 800, margin: '0 auto' }}>
      {/* ── Header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'linear-gradient(135deg, #004D40 0%, #00695C 100%)',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none', borderRadius: '50%',
            width: 34, height: 34, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
            <path d="M9 1L1 8.5 9 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span style={{ color: 'white', fontSize: 17, fontWeight: 700 }}>Your Orders</span>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '16px 14px', maxWidth: 540, margin: '0 auto' }}>
        {loading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {!loading && error && (
          <div style={{
            background: '#FFF3E0', border: '1px solid #FFB74D',
            borderRadius: 10, padding: 16, color: '#E65100', fontSize: 13,
          }}>
            Could not load orders: {error}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>📦</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#333', marginBottom: 8 }}>
              No orders yet
            </p>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
              Start shopping to see your order history here.
            </p>
            <button
              onClick={() => router.push('/')}
              style={{
                background: 'linear-gradient(135deg, #004D40, #00695C)',
                color: 'white', border: 'none', borderRadius: 24,
                padding: '10px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Start Shopping
            </button>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
              {orders.length} order{orders.length !== 1 ? 's' : ''}
            </p>
            {orders.map(order => (
              <OrderCard key={order.order_id} order={order} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
