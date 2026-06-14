'use client';
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { CartItem } from '@/types';

export interface UserCartItem extends CartItem { id: string; count: number; }
interface CartContextType { items: UserCartItem[]; itemCount: number; totalPrice: number; isDrawerOpen: boolean; addItem: (item: CartItem) => void; removeItem: (id: string) => void; increaseQuantity: (id: string) => void; decreaseQuantity: (id: string) => void; openDrawer: () => void; closeDrawer: () => void; clearCart: () => void; }
const CartContext = createContext<CartContextType | undefined>(undefined);

export function generateItemId(item: CartItem): string { return `${item.name}-${item.category}`.replace(/\s+/g, '-').toLowerCase(); }

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<UserCartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const itemCount = items.reduce((s, i) => s + i.count, 0);
  const totalPrice = items.reduce((s, i) => s + (i.estimated_price || 0) * i.count, 0);
  const addItem = useCallback((item: CartItem) => { const id = generateItemId(item); setItems(prev => { const ex = prev.find(i => i.id === id); if (ex) return prev.map(i => i.id === id ? { ...i, count: i.count + 1 } : i); return [...prev, { ...item, id, count: 1 }]; }); }, []);
  const removeItem = useCallback((id: string) => setItems(prev => prev.filter(i => i.id !== id)), []);
  const increaseQuantity = useCallback((id: string) => setItems(prev => prev.map(i => i.id === id ? { ...i, count: i.count + 1 } : i)), []);
  const decreaseQuantity = useCallback((id: string) => setItems(prev => prev.map(i => i.id === id ? { ...i, count: i.count - 1 } : i).filter(i => i.count > 0)), []);
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const clearCart = useCallback(() => setItems([]), []);
  return <CartContext.Provider value={{ items, itemCount, totalPrice, isDrawerOpen, addItem, removeItem, increaseQuantity, decreaseQuantity, openDrawer, closeDrawer, clearCart }}>{children}</CartContext.Provider>;
}
export function useCart() { const ctx = useContext(CartContext); if (!ctx) throw new Error('useCart must be within CartProvider'); return ctx; }
