'use client';

// Large illustrated-style category icons (matching Amazon Now's look)
const CATEGORIES = [
  { id: '',             icon: '🏠', label: 'Top Picks',   color: '#FFF3E0' },
  { id: 'beverages',    icon: '🥤', label: 'Beverages',   color: '#E3F2FD' },
  { id: 'snacks',       icon: '🍿', label: 'Snacks',      color: '#FFF8E1' },
  { id: 'dairy',        icon: '🥛', label: 'Dairy & Eggs', color: '#F1F8E9' },
  { id: 'fresh',        icon: '🥦', label: 'Fresh',       color: '#E8F5E9' },
  { id: 'medicine',     icon: '💊', label: 'Health',      color: '#FCE4EC' },
  { id: 'personal_care',icon: '🧴', label: 'Personal Care', color: '#EDE7F6' },
  { id: 'cleaning',     icon: '🧹', label: 'Cleaners',    color: '#E0F7FA' },
  { id: 'baby',         icon: '👶', label: 'Baby',        color: '#FFF3E0' },
  { id: 'electronics',  icon: '🔋', label: 'Electronics', color: '#ECEFF1' },
  { id: 'fashion',      icon: '👕', label: 'Fashion',     color: '#FCE4EC' },
];

interface Props {
  active: string;
  onChange: (cat: string) => void;
}

export function CategoryStrip({ active, onChange }: Props) {
  return (
    <div style={{
      background: 'white',
      borderBottom: '1px solid #F0F0F0',
      padding: '12px 0 8px',
    }}>
      <div
        className="scrollbar-hide"
        style={{
          display: 'flex', gap: 0, overflowX: 'auto',
          paddingLeft: 8, paddingRight: 8,
        }}
      >
        {CATEGORIES.map(cat => {
          const isActive = active === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onChange(cat.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 5, flexShrink: 0, background: 'none', border: 'none',
                cursor: 'pointer', padding: '2px 10px', minWidth: 64,
              }}
            >
              {/* Large illustrated icon — square with rounded corners */}
              <div style={{
                width: 58, height: 58,
                background: isActive ? cat.color : '#F7F7F7',
                borderRadius: 10,
                border: isActive ? `2px solid ${cat.color.replace('E', '9').replace('F', 'C')}` : '2px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, transition: 'all 0.15s',
              }}>
                {cat.icon}
              </div>
              <span style={{
                fontSize: 10, fontWeight: isActive ? 700 : 500,
                color: isActive ? '#0F1111' : '#565959',
                textAlign: 'center', lineHeight: 1.2,
                maxWidth: 60, whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
