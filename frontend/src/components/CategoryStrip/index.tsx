'use client';

const CATEGORIES = [
  { id: '',              emoji: '🏠', label: 'All' },
  { id: 'fresh',         emoji: '🥦', label: 'Veg & Fruits' },
  { id: 'dairy',         emoji: '🥛', label: 'Dairy & Bread' },
  { id: 'snacks',        emoji: '🍫', label: 'Snacks' },
  { id: 'beverages',     emoji: '☕', label: 'Beverages' },
  { id: 'medicine',      emoji: '💊', label: 'Health' },
  { id: 'personal_care', emoji: '🧴', label: 'Personal Care' },
  { id: 'cleaning',      emoji: '🧹', label: 'Household' },
  { id: 'baby',          emoji: '👶', label: 'Baby' },
  { id: 'electronics',   emoji: '⚡', label: 'Electronics' },
];

interface Props {
  active: string;
  onChange: (cat: string) => void;
}

export function CategoryStrip({ active, onChange }: Props) {
  return (
    <div style={{
      background: 'white',
      borderBottom: '1px solid #DDD',
      padding: '10px 0',
    }}>
      <div
        className="scrollbar-hide"
        style={{
          display: 'flex', gap: 8, overflowX: 'auto',
          paddingLeft: 12, paddingRight: 12,
        }}
      >
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 4, flexShrink: 0, background: 'none', border: 'none',
              cursor: 'pointer', padding: 0, minWidth: 56,
            }}
          >
            {/* Circle icon */}
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: active === cat.id ? '#FFF3E0' : '#F3F3F3',
              border: active === cat.id ? '2px solid #FF9900' : '2px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, transition: 'all 0.15s',
            }}>
              {cat.emoji}
            </div>
            <span style={{
              fontSize: 10, fontWeight: active === cat.id ? 700 : 400,
              color: active === cat.id ? '#FF9900' : '#565959',
              textAlign: 'center', lineHeight: 1.2, maxWidth: 54,
            }}>
              {cat.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
