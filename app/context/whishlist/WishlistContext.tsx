"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import {
  wishlistReducer,
  initialWishlistState,
} from "./wishlistReducer";
import { WishlistState, WishlistAction } from "./wishlistTypes";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface WishlistContextType {
  wishlistState: WishlistState;
  wishlistDispatch: React.Dispatch<WishlistAction>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlistState, wishlistDispatch] = useReducer(
    wishlistReducer,
    initialWishlistState
  );
  const { data: session, status } = useSession();
  const router = useRouter();

  const userId = (session?.user as any)?.id || session?.user?.email || null;
  const lastUserIdRef = React.useRef<string | null>(null);
  const syncTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const WISHLIST_STORAGE_KEY = "artiory_wishlist";

  const getLocalWishlist = (): any[] => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  };

  const saveLocalWishlist = (items: any[]) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch {}
  };

  // Initial load of guest wishlist from localStorage
  React.useEffect(() => {
    const local = getLocalWishlist();
    if (local.length > 0 && status !== "authenticated") {
      wishlistDispatch({ type: "SET_WISHLIST", payload: local });
    }
  }, []);

  // Fetch initial wishlist from backend when user logs in or changes, and merge local items
  React.useEffect(() => {
    if (status === "authenticated" && userId) {
      if (lastUserIdRef.current === userId) return;
      lastUserIdRef.current = userId;

      const localItems = getLocalWishlist();

      fetch("/api/users/wishlist")
        .then((res) => res.json())
        .then((data) => {
          let backendWishlist: any[] = [];
          if (data.success && Array.isArray(data.wishlist)) {
            backendWishlist = data.wishlist.map((item: any) => ({
              id: String(item.productId || item.id),
              name: item.name,
              price: item.price,
              image: item.image,
              stock: item.stock !== undefined ? item.stock : item.stockQuantity,
              stockQuantity: item.stockQuantity !== undefined ? item.stockQuantity : item.stock,
              isOutOfStock: item.isOutOfStock !== undefined ? item.isOutOfStock : ((item.stock !== undefined && item.stock <= 0) || (item.stockQuantity !== undefined && item.stockQuantity <= 0)),
            }));
          }

          if (localItems.length > 0) {
            const mergedMap = new Map<string, any>();
            backendWishlist.forEach((item) => mergedMap.set(String(item.id), item));
            localItems.forEach((localItem) => {
              const key = String(localItem.id);
              if (!mergedMap.has(key)) {
                mergedMap.set(key, localItem);
              }
            });
            const mergedList = Array.from(mergedMap.values());
            wishlistDispatch({ type: "SET_WISHLIST", payload: mergedList });
            saveLocalWishlist(mergedList);
            syncWishlistToBackend(mergedList);
          } else {
            wishlistDispatch({ type: "SET_WISHLIST", payload: backendWishlist });
            saveLocalWishlist(backendWishlist);
          }
        })
        .catch((err) => {
          console.error("Failed to load wishlist:", err);
          if (localItems.length > 0) {
            wishlistDispatch({ type: "SET_WISHLIST", payload: localItems });
          }
        });
    } else if (status === "unauthenticated") {
      if (lastUserIdRef.current !== null) {
        lastUserIdRef.current = null;
        wishlistDispatch({ type: "SET_WISHLIST", payload: [] });
        if (typeof window !== "undefined") {
          localStorage.removeItem(WISHLIST_STORAGE_KEY);
        }
      }
    }
  }, [status, userId]);

  // Debounced sync function
  const syncWishlistToBackend = (items: any[]) => {
    if (status !== "authenticated" || !userId) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(() => {
      const wishlistItemsForBackend = items.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        stock: item.stock,
        stockQuantity: item.stockQuantity,
        isOutOfStock: item.isOutOfStock
      }));

      fetch("/api/users/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wishlistItems: wishlistItemsForBackend }),
      }).catch((err) => console.error("Failed to sync wishlist:", err));
    }, 400);
  };

  const customWishlistDispatch = (action: any) => {
    wishlistDispatch(action);

    if (["ADD_TO_WISHLIST", "REMOVE_FROM_WISHLIST", "CLEAR_WISHLIST"].includes(action.type)) {
      const nextState = wishlistReducer(wishlistState, action);
      saveLocalWishlist(nextState.items);
      syncWishlistToBackend(nextState.items);
    }
  };

  return (
    <WishlistContext.Provider value={{ wishlistState, wishlistDispatch: customWishlistDispatch }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used inside WishlistProvider");
  }
  return context;
};
