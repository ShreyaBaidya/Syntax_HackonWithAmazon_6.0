import { useEffect, useState } from 'react';
import { getOccasions, Occasion } from '@/lib/api';
import { useRouter } from 'next/navigation';

export function OccasionBundlesWidget() {
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const router = useRouter();

  useEffect(() => {
    getOccasions().then(setOccasions).catch(console.error);
  }, []);

  if (occasions.length === 0) return null;

  return (
    <div style={{ margin: '16px 0', padding: '0 10px' }}>
      <h3 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 800, color: '#0F1111' }}>
        Instant Occasion Bundles
      </h3>
      <div style={{ 
        display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 10,
        msOverflowStyle: 'none', scrollbarWidth: 'none'
      }}>
        {occasions.map((occ) => (
          <div 
            key={occ.id} 
            onClick={() => {
              sessionStorage.setItem('last_chat_intent', `Build a cart for a ${occ.name.toLowerCase()}`);
              router.push('/nowspeak');
            }}
            style={{ 
              flexShrink: 0, width: 120, height: 110, borderRadius: 12, 
              background: 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)',
              border: '1px solid #FFE082', padding: '12px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
            }}
          >
            <span style={{ fontSize: 32, marginBottom: 8 }}>{occ.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F1111', lineHeight: '1.2' }}>{occ.name}</span>
            <span style={{ fontSize: 9, color: '#555', marginTop: 4 }}>1-Click Cart</span>
          </div>
        ))}
      </div>
    </div>
  );
}
