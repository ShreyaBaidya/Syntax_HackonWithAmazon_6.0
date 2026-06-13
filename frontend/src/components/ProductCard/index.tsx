'use client';

import { useState, useCallback } from 'react';
import { Product } from '@/lib/api';

interface Props {
  product: Product;
  onAddToCart?: (product: Product, qty: number) => void;
  compact?: boolean;
}

const MOCK_ORIGINAL_PRICES: Record<string, number> = {
  p001: 55, p002: 89, p006: 219, p007: 115, p011: 75,
  p016: 25, p017: 49, p019: 75, p031: 649,
};

export function ProductCard({ product, onAddToCart, compact = false }: Props) {
  const [qty, setQty] = useState(0);

  const handleAdd = useCallback(() => {
    setQty(1);
    onAddToCart?.(product, 1);
  }, [product, onAddToCart]);

  const handleIncrement = useCallback(() => {
    setQty(q => { const next = q + 1; onAddToCart?.(product, next); return next; });
  }, [product, onAddToCart]);

  const handleDecrement = useCallback(() => {
    setQty(q => {
      const next = Math.max(0, q - 1);
      onAddToCart?.(product, next);
      return next;
    });
  }, [product, onAddToCart]);

  const originalPrice = MOCK_ORIGINAL_PRICES[product.id];
  const discount = originalPrice
    ? Math.round((1 - product.price / originalPrice) * 100)
    : null;

  if (compact) {
    return (
      <div style={{
        background: 'white', borderRadius: 4, padding: 10,
        display: 'flex', gap: 10, alignItems: 'center',
        borderBottom: '1px solid #EEE',
      }}>
        <div style={{
          width: 56, height: 56, background: '#F7F7F7', borderRadius: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, overflow: 'hidden',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image_url} alt={product.name} style={{ width: 48, height: 48, objectFit: 'contain' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#0F1111', lineHeight: 1.3, margin: '0 0 2px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {product.name}
          </p>
          <p style={{ fontSize: 11, color: '#565959', margin: 0 }}>{product.unit}</p>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F1111' }}>₹{product.price}</span>
            {originalPrice && (
              <span style={{ fontSize: 11, color: '#565959', textDecoration: 'line-through' }}>₹{originalPrice}</span>
            )}
          </div>
        </div>
        <AddButton qty={qty} onAdd={handleAdd} onInc={handleIncrement} onDec={handleDecrement} />
      </div>
    );
  }

  return (
    <div style={{
      background: 'white', borderRadius: 4, overflow: 'hidden',
      border: '1px solid #E8E8E8',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Product image */}
      <div style={{
        background: '#F7F7F7', position: 'relative',
        paddingTop: '100%', overflow: 'hidden',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image_url}
          alt={product.name}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'contain', padding: 8,
          }}
        />
        {/* ETA badge */}
        <div style={{
          position: 'absolute', top: 6, left: 6,
          background: '#067D62', color: 'white',
          fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 3,
          display: 'flex', alignItems: 'center', gap: 2,
        }}>
          ⚡ {product.eta_min} min
        </div>
        {/* Discount badge */}
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

      {/* Product info */}
      <div style={{ padding: '8px 8px 4px', flex: 1 }}>
        <p style={{
          fontSize: 12, fontWeight: 400, color: '#0F1111', margin: 0,
          lineHeight: 1.4, display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {product.name}
        </p>
        <p style={{ fontSize: 11, color: '#565959', margin: '2px 0 0' }}>{product.unit}</p>

        {/* Price row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0F1111' }}>₹{product.price}</span>
          {originalPrice && (
            <span style={{ fontSize: 11, color: '#565959', textDecoration: 'line-through' }}>
              ₹{originalPrice}
            </span>
          )}
        </div>
      </div>

      {/* Add button */}
      <div style={{ padding: '0 8px 8px' }}>
        <AddButton qty={qty} onAdd={handleAdd} onInc={handleIncrement} onDec={handleDecrement} />
      </div>
    </div>
  );
}

function AddButton({
  qty, onAdd, onInc, onDec,
}: { qty: number; onAdd: () => void; onInc: () => void; onDec: () => void }) {
  if (qty === 0) {
    return (
      <button
        onClick={onAdd}
        style={{
          width: '100%', padding: '7px 0',
          background: 'white', color: '#FF9900',
          border: '1.5px solid #FF9900',
          borderRadius: 4, fontSize: 13, fontWeight: 700,
          cursor: 'pointer', letterSpacing: '0.5px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}
        className="add-btn-transition"
      >
        + Add
      </button>
    );
  }

  return (
    <div style={{
      width: '100%', display: 'flex', alignItems: 'center',
      background: '#FF9900', borderRadius: 4, overflow: 'hidden',
    }}>
      <button
        onClick={onDec}
        style={{
          flex: 1, padding: '7px 0', background: 'none', border: 'none',
          color: 'white', fontSize: 18, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        −
      </button>
      <span style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>
        {qty}
      </span>
      <button
        onClick={onInc}
        style={{
          flex: 1, padding: '7px 0', background: 'none', border: 'none',
          color: 'white', fontSize: 18, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        +
      </button>
    </div>
  );
}
