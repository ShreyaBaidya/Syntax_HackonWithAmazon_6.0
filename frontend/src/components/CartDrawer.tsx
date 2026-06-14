'use client';
import { X, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/utils';

export default function CartDrawer() {
  const { items, itemCount, totalPrice, isDrawerOpen, closeDrawer, removeItem, increaseQuantity, decreaseQuantity, clearCart } = useCart();
  if (!isDrawerOpen) return null;
  return (<>
    <div className="fixed inset-0 bg-black/50 z-[60]" onClick={closeDrawer} />
    <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col animate-slide-in-right">
      <div className="flex items-center justify-between px-6 py-4 border-b"><div className="flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-amazon-orange" /><h2 className="text-lg font-bold text-gray-800">Your Cart</h2><span className="bg-amazon-orange text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{itemCount}</span></div><button onClick={closeDrawer} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X className="h-5 w-5" /></button></div>
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {items.length === 0 ? <div className="flex flex-col items-center justify-center h-full text-center"><ShoppingCart className="h-16 w-16 text-gray-200 mb-4" /><p className="text-gray-500 font-medium">Your cart is empty</p></div>
        : <div className="space-y-4">{items.map(item => (
          <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100">
            <div className="flex-1 min-w-0"><p className="font-medium text-gray-800 text-sm truncate">{item.name}</p><span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">{item.category}</span></div>
            <div className="flex flex-col items-end gap-2">{item.estimated_price && <p className="font-semibold text-gray-800 text-sm">{formatPrice(item.estimated_price * item.count)}</p>}
              <div className="flex items-center gap-1"><button onClick={() => decreaseQuantity(item.id)} className="p-1 rounded-md bg-gray-100 hover:bg-gray-200"><Minus className="h-3 w-3" /></button><span className="text-sm font-medium w-6 text-center">{item.count}</span><button onClick={() => increaseQuantity(item.id)} className="p-1 rounded-md bg-gray-100 hover:bg-gray-200"><Plus className="h-3 w-3" /></button><button onClick={() => removeItem(item.id)} className="p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 ml-1"><Trash2 className="h-3 w-3" /></button></div></div>
          </div>))}</div>}
      </div>
      {items.length > 0 && <div className="border-t px-6 py-4 space-y-3"><div className="flex items-center justify-between"><span className="text-gray-600 font-medium">Total ({itemCount} items)</span><span className="text-xl font-bold text-amazon-orange">{formatPrice(totalPrice)}</span></div><button className="w-full bg-amazon-orange hover:bg-amazon-orange-dark text-white font-semibold py-3 rounded-xl">Proceed to Checkout</button><button onClick={clearCart} className="w-full text-center text-sm text-gray-500 hover:text-red-500">Clear Cart</button></div>}
    </div>
  </>);
}
