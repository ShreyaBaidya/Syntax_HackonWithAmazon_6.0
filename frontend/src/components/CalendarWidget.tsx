import { useEffect, useState } from 'react';
import { getUpcomingEvents, Product } from '@/lib/api';
import { useRouter } from 'next/navigation';

export function CalendarWidget({ userId }: { userId: string }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;
    getUpcomingEvents(userId)
      .then(data => setEvents(data.events || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading || events.length === 0) return null;

  return (
    <div style={{ margin: '8px 10px 0', background: 'white', borderRadius: 10, overflow: 'hidden', border: '1px solid #E8EAF6' }}>
      <div style={{
        padding: '12px 14px',
        background: 'linear-gradient(135deg, #E8EAF6 0%, #C5CAE9 100%)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 40, height: 40, background: 'white',
          borderRadius: '50%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 20, flexShrink: 0,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>📅</div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: '#283593' }}>
            Upcoming Event Sync
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#3949AB' }}>
            {events.length} event(s) detected this week
          </p>
        </div>
      </div>
      <div style={{ padding: '0' }}>
        {events.map((event, idx) => (
          <div key={idx} style={{ 
            padding: '12px 14px', 
            borderTop: idx > 0 ? '1px solid #F5F5F5' : 'none',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#1A237E' }}>{event.summary}</p>
              <p style={{ margin: '2px 0 0', fontSize: 10, color: '#5C6BC0' }}>
                {new Date(event.start.dateTime || event.start.date).toLocaleDateString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit'})}
              </p>
            </div>
            <button
              onClick={() => {
                // When clicking "Prepare", we should route to a chat/intent or handle it here
                // We can set the sessionStorage intent and navigate to nowspeak!
                sessionStorage.setItem('last_chat_intent', `Prepare a cart for my event: ${event.summary}`);
                router.push('/nowspeak');
              }}
              style={{
                background: '#FFD814', color: '#0F1111', border: 'none',
                borderRadius: 6, padding: '6px 12px', fontWeight: 700,
                fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              Prep Cart →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
