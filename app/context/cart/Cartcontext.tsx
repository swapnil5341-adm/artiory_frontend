// CartContext.tsx
"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { CartContextType, CartItem } from "./cartTypes";
import { cartReducer, initialCartState } from "./cartReducer";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export type { CartItem };
const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, dispatch] = useReducer(cartReducer, initialCartState);
  const { data: session, status } = useSession();
  const router = useRouter();

  const userId = (session?.user as any)?.id || session?.user?.email || null;
  const lastUserIdRef = React.useRef<string | null>(null);
  const syncTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const cartItems = cart.items;

  const getCartTotal = () =>
    cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const CART_STORAGE_KEY = "artiory_cart";

  const getLocalCart = (): CartItem[] => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  };

  const saveLocalCart = (items: CartItem[]) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {}
  };

  // Initial load of guest cart from localStorage
  React.useEffect(() => {
    const local = getLocalCart();
    if (local.length > 0 && status !== "authenticated") {
      dispatch({ type: "SET_CART", payload: local });
    }
  }, []);

  // Fetch initial cart from backend when user logs in, and merge any local guest cart
  React.useEffect(() => {
    if (status === "authenticated" && userId) {
      if (lastUserIdRef.current === userId) return;
      lastUserIdRef.current = userId;

      const localItems = getLocalCart();

      fetch("/api/users/cart")
        .then((res) => res.json())
        .then((data) => {
          let backendCart: CartItem[] = [];
          if (data.success && Array.isArray(data.cart)) {
            backendCart = data.cart.map((item: any) => ({
              id: String(item.productId || item.id),
              name: item.name,
              price: item.price,
              image: item.image,
              quantity: item.quantity,
              stock: item.stock,
            }));
          }

          if (localItems.length > 0) {
            const mergedMap = new Map<string, CartItem>();
            backendCart.forEach((item) => mergedMap.set(String(item.id), item));

            localItems.forEach((localItem) => {
              const key = String(localItem.id);
              if (mergedMap.has(key)) {
                const existing = mergedMap.get(key)!;
                const stockLimit = existing.stock ?? localItem.stock ?? 999;
                const newQty = Math.min(stockLimit, Math.max(existing.quantity, localItem.quantity));
                mergedMap.set(key, { ...existing, quantity: newQty });
              } else {
                mergedMap.set(key, localItem);
              }
            });

            const mergedList = Array.from(mergedMap.values());
            dispatch({ type: "SET_CART", payload: mergedList });
            saveLocalCart(mergedList);
            syncCartToBackend(mergedList);
          } else {
            dispatch({ type: "SET_CART", payload: backendCart });
            saveLocalCart(backendCart);
          }
        })
        .catch((err) => {
          console.error("Failed to load cart:", err);
          if (localItems.length > 0) {
            dispatch({ type: "SET_CART", payload: localItems });
          }
        });
    } else if (status === "unauthenticated") {
      if (lastUserIdRef.current !== null) {
        lastUserIdRef.current = null;
        dispatch({ type: "SET_CART", payload: [] });
        if (typeof window !== "undefined") {
          localStorage.removeItem(CART_STORAGE_KEY);
        }
      }
    }
  }, [status, userId]);

  // Debounced sync function to prevent network flooding
  const syncCartToBackend = (items: any[]) => {
    if (status !== "authenticated" || !userId) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(() => {
      const cartItemsForBackend = items.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
        stock: item.stock,
      }));

      fetch("/api/users/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItems: cartItemsForBackend }),
      }).catch((err) => console.error("Failed to sync cart:", err));
    }, 400);
  };

  const customDispatch = (action: any) => {
    if (action.type === "ADD_ITEM") {
      // Check stock limit for ADD_ITEM
      const existing = cart.items.find((item) => item.id === action.payload.id);
      const stockLimit = action.payload.stock ?? existing?.stock ?? (action.payload.stockQuantity ?? Infinity);
      const currentQty = existing ? existing.quantity : 0;
      const addedQty = action.payload.quantity ?? 1;

      if (stockLimit <= 0 || action.payload.isOutOfStock) {
        toast.error("This item is currently out of stock!", {
          position: "bottom-right",
          autoClose: 2000,
        });
        return;
      }

      if (currentQty + addedQty > stockLimit) {
        toast.warn(`Cannot add more. Only ${stockLimit} items in stock!`, {
          position: "bottom-right",
          autoClose: 2000,
        });
        const allowedAdd = stockLimit - currentQty;
        if (allowedAdd <= 0) return; // Block dispatch completely
        action.payload.quantity = allowedAdd;
      }
    }

    if (action.type === "UPDATE_QUANTITY") {
      const existing = cart.items.find((item) => item.id === action.payload.id);
      if (existing) {
        const stockLimit = existing.stock ?? Infinity;
        if (action.payload.quantity > stockLimit) {
          toast.warn(`Only ${stockLimit} items in stock!`, {
            position: "bottom-right",
            autoClose: 2000,
          });
          action.payload.quantity = stockLimit; // Cap at stock limit
        }
      }
    }

    dispatch(action);

    if (["ADD_ITEM", "REMOVE_ITEM", "UPDATE_QUANTITY", "CLEAR_CART"].includes(action.type)) {
      const nextState = cartReducer(cart, action);
      saveLocalCart(nextState.items);
      syncCartToBackend(nextState.items);
    }
  };

  return (
    <CartContext.Provider value={{ cart, cartItems, getCartTotal, dispatch: customDispatch }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
