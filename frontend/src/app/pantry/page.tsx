'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { buildCartFromImage, Product } from '@/lib/api';

export default function PantryScannerPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleScan = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const data = await buildCartFromImage(file);
      setResults(data.items);
      // Auto-add to local cart
      const currentCartStr = localStorage.getItem('amazon_now_cart');
      let cart = currentCartStr ? JSON.parse(currentCartStr) : [];
      data.items.forEach((item: any) => {
        cart.push({ product: item, quantity: 1 });
      });
      localStorage.setItem('amazon_now_cart', JSON.stringify(cart));
    } catch (err) {
      console.error(err);
      alert('Failed to scan image. Make sure the backend is running and the image is valid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#F7F7F7', minHeight: '100vh', paddingBottom: 60, fontFamily: 'sans-serif' }}>
      <header style={{ background: '#232F3E', padding: '15px 20px', color: 'white', display: 'flex', alignItems: 'center', gap: 15 }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: 'white', fontSize: 24, cursor: 'pointer' }}>←</button>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>AI Pantry Scanner</h1>
      </header>

      <div style={{ padding: 20 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 20, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>📸</div>
          <h2 style={{ margin: '0 0 10px', color: '#0F1111' }}>What are you missing?</h2>
          <p style={{ color: '#555', fontSize: 14, marginBottom: 20 }}>
            Upload a photo of your fridge or pantry. Our AI will instantly detect what's low and build a cart for you.
          </p>

          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            capture="environment"
          />

          {!preview ? (
            <button 
              onClick={() => fileInputRef.current?.click()}
              style={{ background: '#FFD814', color: '#0F1111', border: '1px solid #FCD200', padding: '12px 24px', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer', width: '100%' }}
            >
              Take a Photo / Upload
            </button>
          ) : (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Pantry Preview" style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 8, marginBottom: 15 }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  onClick={() => { setFile(null); setPreview(null); }}
                  style={{ flex: 1, background: '#F0F2F2', border: '1px solid #D5D9D9', padding: '12px', borderRadius: 8, color: '#0F1111', fontWeight: 600, cursor: 'pointer' }}
                >
                  Retake
                </button>
                <button 
                  onClick={handleScan}
                  disabled={loading}
                  style={{ flex: 2, background: '#FFD814', border: '1px solid #FCD200', padding: '12px', borderRadius: 8, color: '#0F1111', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Scanning AI...' : 'Scan & Build Cart →'}
                </button>
              </div>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 16, color: '#0F1111', marginBottom: 10 }}>Added to your cart</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {results.map((item, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 8, padding: 15, display: 'flex', gap: 15, alignItems: 'center' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image_url || 'https://placehold.co/100x100?text=Item'} alt={item.name} style={{ width: 50, height: 50, objectFit: 'contain' }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0F1111' }}>{item.name}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>Detected missing</p>
                  </div>
                  <p style={{ margin: 0, fontWeight: 700, color: '#B12704' }}>₹{item.estimated_price || item.price}</p>
                </div>
              ))}
            </div>
            <button 
              onClick={() => router.push('/')}
              style={{ marginTop: 20, width: '100%', background: '#232F3E', color: 'white', border: 'none', padding: '14px', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
            >
              Go to Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
