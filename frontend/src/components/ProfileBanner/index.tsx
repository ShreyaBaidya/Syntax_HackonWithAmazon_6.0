'use client';
import { useRouter } from 'next/navigation';

interface ProfileBannerProps {
  dietTags: string[];
  allergenTags: string[];
  hasProfile: boolean;
  filteredCount?: number;
}

export function ProfileBanner({ dietTags, allergenTags, filteredCount, hasProfile }: ProfileBannerProps) {
  const router = useRouter();

  if (!hasProfile) {
    return (
      <div
        onClick={() => router.push('/profile')}
        role="button"
        tabIndex={0}
        aria-label="Set up dietary profile"
        onKeyDown={e => e.key === 'Enter' && router.push('/profile')}
        style={{
          background: '#FFF8E1', margin: '8px 10px 0', borderRadius: 10,
          padding: '10px 14px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10,
          border: '1px solid #FFE082',
        }}
      >
        <span style={{ fontSize: 20 }}>🍽️</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0F1111' }}>
            Set up dietary profile
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#666' }}>
            Filter out allergens &amp; dietary restrictions automatically
          </p>
        </div>
        <span style={{ color: '#888', fontSize: 14 }}>›</span>
      </div>
    );
  }

  return (
    <div
      onClick={() => router.push('/profile')}
      role="button"
      tabIndex={0}
      aria-label="Edit dietary profile"
      onKeyDown={e => e.key === 'Enter' && router.push('/profile')}
      style={{
        background: '#E8F5E9', margin: '8px 10px 0', borderRadius: 10,
        padding: '8px 14px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 10,
        border: '1px solid #C8E6C9',
      }}
    >
      <span style={{ fontSize: 16 }}>✓</span>
      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
        {dietTags.map(tag => (
          <span key={`diet-${tag}`} style={{
            background: '#C8E6C9', borderRadius: 12, padding: '2px 8px',
            fontSize: 11, fontWeight: 600, color: '#2E7D32',
          }}>
            ✓ {tag}
          </span>
        ))}
        {allergenTags.map(tag => (
          <span key={`allergy-${tag}`} style={{
            background: '#FFCDD2', borderRadius: 12, padding: '2px 8px',
            fontSize: 11, fontWeight: 600, color: '#C62828',
          }}>
            ⚠️ {tag}
          </span>
        ))}
        {filteredCount !== undefined && filteredCount > 0 && (
          <span style={{ fontSize: 10, color: '#666', marginLeft: 4 }}>
            · {filteredCount} items filtered for your safety
          </span>
        )}
      </div>
      <span style={{ color: '#888', fontSize: 12 }}>Edit ›</span>
    </div>
  );
}
