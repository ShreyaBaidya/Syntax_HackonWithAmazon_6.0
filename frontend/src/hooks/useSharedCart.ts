import { useState, useEffect, useRef } from "react";
import { CartState, CartSSEEvent, openCartStream } from "@/lib/api";

export function useSharedCart(cartId: string, initialCart: CartState) {
  const [cart, setCart] = useState<CartState>(initialCart);
  const [activity, setActivity] = useState<string[]>([]);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = openCartStream(cartId);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const evt: CartSSEEvent = JSON.parse(e.data);
        if (evt.cart) setCart(evt.cart);
        if (evt.message && evt.type !== "cart_update") {
          setActivity((prev) => [evt.message!, ...prev].slice(0, 8));
        }
      } catch {
        /* ignore malformed chunks */
      }
    };

    es.onerror = () => {
      // Auto-reconnect is handled by the browser EventSource spec
    };

    return () => {
      es.close();
    };
  }, [cartId]);

  return { cart, activity };
}
