'use client';

import { useState, useCallback } from 'react';
import { Product } from '@/lib/api';

interface Props {
  product: Product;
  onAddToCart?: (product: Product, qty: number) => void;
  /** compact = horizontal row layout used in reorder nudges */
  compact?: boolean;
  /** grid = 4-column compact card (default for product grid) */
  grid?: boolean;
}

// Mock original prices for some products to show discount
const ORIG: Record<string, number> = {
  p001: 55, p002: 89, p006: 219, p007: 115, p011: 75,
  p016: 25, p017: 49, p019: 75, p031: 649, p039: 999,
};

export function ProductCard({ product, onAddToCart, compact = false, grid = false }: Props) {
  const [qty, setQty] = useState(0);

  const add = useCallback(() => {
    setQty(1);
    setTimeout(() => onAddToCart?.(product, 1), 0);
  }, [product, onAddToCart]);

  const inc = useCallback(() => {
    setQty(q => {
      const n = q + 1;
      setTimeout(() => onAddToCart?.(product, n), 0);
      return n;
    });
  }, [product, onAddToCart]);

  const dec = useCallback(() => {
    setQty(q => {
      const n = Math.max(0, q - 1);
      setTimeout(() => onAddToCart?.(product, n), 0);
      return n;
    });
  }, [product, onAddToCart]);

  const origPrice = ORIG[product.id];
  const discount = origPrice ? Math.round((1 - product.price / origPrice) * 100) : null;

  // ── Compact (horizontal) ──────────────────────────────────────────────────
  if (compact) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', background: 'white',
        borderBottom: '1px solid #F0F0F0',
      }}>
        <div style={{
          width: 52, height: 52, background: '#F7F7F7', borderRadius: 6,
          flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image_url} alt={product.name} style={{ width: 46, height: 46, objectFit: 'contain' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#0F1111', margin: 0, lineHeight: 1.3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {product.name}
          </p>
          <p style={{ fontSize: 10, color: '#888', margin: '2px 0 0' }}>{product.unit}</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#0F1111', margin: '3px 0 0' }}>₹{product.price}</p>
        </div>
        <AddBtn qty={qty} onAdd={add} onInc={inc} onDec={dec} small />
      </div>
    );
  }

  // ── Grid card (4-column compact, matches Amazon Now) ──────────────────────
  if (grid) {
    return (
      <div style={{
        background: 'white', borderRadius: 6,
        border: '1px solid #F0F0F0', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}>
        {/* Image */}
        <div style={{ background: '#FAFAFA', position: 'relative', paddingTop: '70%', overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image_url} alt={product.name}
            style={{ position: 'absolute', inset: '8%', width: '84%', height: '84%', objectFit: 'contain' }}
          />
          {/* Rating badge (top-left) */}
          <div style={{
            position: 'absolute', top: 3, left: 3,
            background: 'rgba(255,255,255,0.92)', borderRadius: 3,
            padding: '1px 4px', display: 'flex', alignItems: 'center', gap: 2,
          }}>
            <span style={{ fontSize: 8, color: '#0F1111', fontWeight: 600 }}>4.{Math.floor(Math.random() * 4 + 1)}</span>
            <span style={{ fontSize: 7, color: '#FF9900' }}>★</span>
          </div>
          {/* ETA badge (top-right) */}
          <div style={{
            position: 'absolute', top: 3, right: 3,
            background: 'rgba(255,255,255,0.92)', borderRadius: 3,
            padding: '1px 4px', display: 'flex', alignItems: 'center', gap: 2,
          }}>
            <span style={{ fontSize: 7, color: '#067D62' }}>⚡</span>
            <span style={{ fontSize: 8, color: '#067D62', fontWeight: 600 }}>{product.eta_min}m</span>
          </div>
          {discount && discount > 0 && (
            <div style={{
              position: 'absolute', bottom: 3, left: 3,
              background: '#CC0C39', color: 'white',
              fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 2,
            }}>
              {discount}% OFF
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '5px 6px 6px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <p style={{
            fontSize: 11, color: '#0F1111', margin: 0, lineHeight: 1.3, fontWeight: 400,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {product.name}
          </p>
          <p style={{ fontSize: 9, color: '#888', margin: '2px 0 4px' }}>{product.unit}</p>

          {/* Price + Add button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0F1111' }}>₹{product.price}</span>
              {origPrice && (
                <span style={{ fontSize: 9, color: '#888', textDecoration: 'line-through', marginLeft: 3 }}>
                  ₹{origPrice}
                </span>
              )}
            </div>
            <AddBtn qty={qty} onAdd={add} onInc={inc} onDec={dec} small />
          </div>
        </div>
      </div>
    );
  }

  // ── Standard 2-column card (used in NowSpeak results) ─────────────────────
  return (
    <div style={{
      background: 'white', borderRadius: 6, overflow: 'hidden',
      border: '1px solid #EBEBEB', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ background: '#FAFAFA', position: 'relative', paddingTop: '100%', overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image_url} alt={product.name}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: 8 }}
        />
        <div style={{
          position: 'absolute', top: 6, left: 6,
          background: '#067D62', color: 'white',
          fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 3,
        }}>
          ⚡ {product.eta_min} min
        </div>
        {discount && discount > 0 && (
          <div style={{
            position: 'absolute', top: 6, right: 6,
            background: '#CC0C39', color: 'white',
            fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 3,
          }}>
            {discount}% off
          </div>
        )}
      </div>
      <div style={{ padding: '8px 8px 4px', flex: 1 }}>
        <p style={{
          fontSize: 12, color: '#0F1111', margin: 0, lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {product.name}
        </p>
        <p style={{ fontSize: 11, color: '#888', margin: '2px 0 0' }}>{product.unit}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0F1111' }}>₹{product.price}</span>
          {origPrice && (
            <span style={{ fontSize: 10, color: '#888', textDecoration: 'line-through' }}>₹{origPrice}</span>
          )}
        </div>
      </div>
      <div style={{ padding: '0 8px 8px' }}>
        <AddBtn qty={qty} onAdd={add} onInc={inc} onDec={dec} />
      </div>
    </div>
  );
}

// ── Reusable Add/Counter button ───────────────────────────────────────────────
function AddBtn({
  qty, onAdd, onInc, onDec, small = false,
}: { qty: number; onAdd: () => void; onInc: () => void; onDec: () => void; small?: boolean }) {
  const size = small ? 26 : 32;
  const fontSize = small ? 16 : 18;
  const textSize = small ? 11 : 13;

  if (qty === 0) {
    return (
      <button
        onClick={onAdd}
        style={{
          width: size, height: size, borderRadius: '50%',
          background: '#FFD814', border: '1px solid #F0C000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize, fontWeight: 700, color: '#0F1111',
          flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        +
      </button>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: '#FFD814', borderRadius: 20,
      border: '1px solid #F0C000', overflow: 'hidden',
      flexShrink: 0,
    }}>
      <button
        onClick={onDec}
        style={{
          width: size, height: size, background: 'none', border: 'none',
          cursor: 'pointer', fontSize, fontWeight: 700, color: '#0F1111',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        −
      </button>
      <span style={{ fontSize: textSize, fontWeight: 700, color: '#0F1111', minWidth: 16, textAlign: 'center' }}>
        {qty}
      </span>
      <button
        onClick={onInc}
        style={{
          width: size, height: size, background: 'none', border: 'none',
          cursor: 'pointer', fontSize, fontWeight: 700, color: '#0F1111',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        +
      </button>
    </div>
  );
}
