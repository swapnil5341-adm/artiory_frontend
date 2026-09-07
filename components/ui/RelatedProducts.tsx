"use client";
import React, { useState, useEffect } from "react";
import { Londrina_Solid } from "next/font/google";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { useCart } from "@/app/context/cart/Cartcontext";
import { useWishlist } from "@/app/context/whishlist/WishlistContext";
import { toast } from "react-toastify";

const londrina = Londrina_Solid({
  weight: ["100", "300", "400", "900"],
  subsets: ["latin"],
  display: "swap",
});

type Product = {
  id: string;
  image: string;
  images: string[];
  name: string;
  price: number;
  oldPrice?: number;
  category: string;
  shortDescription: string;
  isSale?: boolean;
  stock?: number;
  stockQuantity?: number;
};

interface RelatedProductsProps {
  category?: string;
  currentProductId?: string;
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({ category, currentProductId }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const { cartItems, dispatch } = useCart();
  const { wishlistDispatch, wishlistState } = useWishlist();

  useEffect(() => {
    fetch("/api/products/store", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const list: any[] = Array.isArray(data) ? data : data?.products ?? data?.data ?? [];
        const mapped: Product[] = list.map((item, i) => {
          const price = Number(item.sellingPrice ?? item.price ?? 0);
          const mrp = Number(item.mrp ?? item.oldPrice ?? 0);
          const rawImages: string[] = Array.isArray(item.images)
            ? item.images.filter((img: unknown) => typeof img === "string" && (img as string).trim())
            : [];
          const image = typeof item.image === "string" && item.image.trim() ? item.image : rawImages[0] ?? "";
          const images = [...new Set(rawImages.length > 0 ? rawImages : image ? [image] : [])];
          return {
            id: String(item._id ?? item.id ?? i + 1),
            name: item.productName ?? item.name ?? "",
            price,
            oldPrice: mrp > price ? mrp : undefined,
            image,
            images,
            category: item.category ?? "",
            shortDescription: item.shortDescription ?? item.shortDesc ?? "",
            isSale: Boolean(item.isSale ?? item.onSale ?? (mrp > 0 && price > 0 && price < mrp)),
            stock: item.stockQuantity ?? item.stock ?? 999,
            stockQuantity: item.stockQuantity ?? item.stock ?? 999,
          };
        });

        const filtered = mapped.filter((p) => String(p.id) !== String(currentProductId));
        const sameCategory = filtered.filter((p) => !category || p.category === category);
        const result = sameCategory.length >= 5
          ? sameCategory
          : [...sameCategory, ...filtered.filter((p) => p.category !== category)].slice(0, 5);

        setProducts(result.slice(0, 5));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category, currentProductId]);

  const handleAddToCart = (p: Product) => {
    dispatch({ type: "ADD_ITEM", payload: { id: p.id, name: p.name, price: p.price, image: p.image, quantity: 1, stock: p.stockQuantity ?? p.stock } });
    toast.success(`${p.name} added to cart!`, { position: "bottom-right", autoClose: 800 });
  };

  const handleWishlist = (p: Product) => {
    const isIn = wishlistState.items.some((item) => item.id === p.id);
    if (isIn) {
      wishlistDispatch({ type: "REMOVE_FROM_WISHLIST", payload: { id: p.id } });
      toast.info(`${p.name} removed from Wishlist!`, { position: "bottom-right", autoClose: 800 });
    } else {
      wishlistDispatch({ type: "ADD_TO_WISHLIST", payload: { id: p.id, name: p.name, price: p.price, image: p.image } });
      toast.success(`${p.name} added to Wishlist!`, { position: "bottom-right", autoClose: 800 });
    }
  };

  if (!loading && products.length === 0) return null;

  return (
    <section className={`${londrina.className} py-10`}>
      <h2 className="text-3xl md:text-4xl font-extrabold text-[#00b8a2] mb-8">Related Products</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden bg-white">
                <div className="aspect-square w-full bg-gray-200 animate-pulse" />
                <div className="px-3 pt-2 pb-3 flex flex-col gap-2">
                  <div className="h-2.5 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3.5 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mt-1" />
                </div>
              </div>
            ))
          : products.map((p) => {
              const isWishlisted = wishlistState.items.some((item) => item.id === p.id);
              const discount = p.oldPrice && p.oldPrice > p.price
                ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
                : null;
              return (
                <div key={p.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
                  <Link href={`/product/${p.id}`} className="relative block aspect-square bg-white overflow-hidden">
                    {/* Badges */}
                    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                      {p.isSale && <span className="bg-red-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">SALE</span>}
                      {discount && <span className="bg-[#00b8a2] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">-{discount}%</span>}
                    </div>
                    {/* Actions */}
                    <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center hover:scale-110 transition-transform"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleWishlist(p); }}
                      >
                        <Heart className={`w-4 h-4 ${isWishlisted ? "fill-[#00b8a2] text-[#00b8a2]" : "text-gray-400"}`} />
                      </button>
                      {/* <button
                        className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center hover:scale-110 transition-transform"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(p); }}
                      >
                        <ShoppingCart className="w-4 h-4 text-[#00b8a2]" />
                      </button> */}
                    </div>
                    {/* Images */}
                    {p.image
                      ? <img src={p.image} alt={p.name} className={`h-full w-full object-cover object-center transition-opacity duration-300 ${p.images && p.images.length > 1 && p.images[1] && p.images[1] !== (p.image || p.images[0]) ? "group-hover:opacity-0" : ""}`} />
                      : <div className="h-full w-full flex items-center justify-center text-gray-300 text-xs">No Image</div>
                    }
                    {p.images && p.images.length > 1 && p.images[1] && p.images[1] !== (p.image || p.images[0]) && (
                      <img src={p.images[1]} alt={p.name} className="h-full w-full object-cover object-center absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}
                  </Link>

                  <div className="p-3 flex flex-col gap-1 flex-1">
                    {p.category && <span className="text-[10px] text-[#00b8a2] font-medium uppercase tracking-wide">{p.category}</span>}
                    <Link href={`/product/${p.id}`}>
                      <h3 className="text-sm font-semibold text-[#2e306a] leading-snug line-clamp-2 hover:text-[#00b8a2] transition-colors">{p.name}</h3>
                    </Link>
                    {p.shortDescription && <p className="text-xs text-gray-400 line-clamp-1">{p.shortDescription}</p>}
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                      <div className="flex items-baseline gap-1.5">
                        <span className={`${londrina.className} text-lg font-semibold text-[#00b8a2]`}>₹{p.price}</span>
                        {p.oldPrice && <span className={`${londrina.className} text-sm text-gray-400 line-through`}>₹{p.oldPrice}</span>}
                      </div>
                      {(() => {
                        const cartItem = cartItems.find((item) => item.id === String(p.id));
                        return cartItem ? (
                          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-1 py-0.5 shadow-sm">
                            <button
                              onClick={(e) => {
                                e.preventDefault(); e.stopPropagation();
                                if (cartItem.quantity > 1) {
                                  dispatch({
                                    type: "UPDATE_QUANTITY",
                                    payload: { id: String(p.id), quantity: cartItem.quantity - 1 },
                                  });
                                } else {
                                  dispatch({ type: "REMOVE_ITEM", payload: String(p.id) });
                                  toast.info(`${p.name} removed from cart`, { position: "bottom-right", autoClose: 800 });
                                }
                              }}
                              className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-md text-sm font-semibold transition-colors cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={p.stockQuantity ?? p.stock ?? 999}
                              value={cartItem.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                const maxStock = p.stockQuantity ?? p.stock ?? 999;
                                if (!isNaN(val)) {
                                  if (val > maxStock) {
                                    toast.warn(`Only ${maxStock} items in stock!`, { position: "bottom-right", autoClose: 2000 });
                                    dispatch({
                                      type: "UPDATE_QUANTITY",
                                      payload: { id: String(p.id), quantity: maxStock },
                                    });
                                  } else if (val >= 1) {
                                    dispatch({
                                      type: "UPDATE_QUANTITY",
                                      payload: { id: String(p.id), quantity: val },
                                    });
                                  }
                                }
                              }}
                              className="w-8 text-center font-bold text-[11px] text-[#2e306a] bg-transparent border-none focus:outline-none focus:ring-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              onClick={(e) => {
                                e.preventDefault(); e.stopPropagation();
                                const maxStock = p.stockQuantity ?? p.stock ?? 999;
                                if (cartItem.quantity >= maxStock) {
                                  toast.warn(`Only ${maxStock} items available in stock!`, { position: "bottom-right", autoClose: 2000 });
                                  return;
                                }
                                dispatch({
                                  type: "UPDATE_QUANTITY",
                                  payload: { id: String(p.id), quantity: cartItem.quantity + 1 },
                                });
                              }}
                              disabled={cartItem.quantity >= (p.stockQuantity ?? p.stock ?? 999)}
                              className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-[#00b8a2] hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed rounded-md text-sm font-semibold transition-colors cursor-pointer"
                              title={cartItem.quantity >= (p.stockQuantity ?? p.stock ?? 999) ? "Stock limit reached" : ""}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(p); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#00b8a2] text-white rounded-xl text-xs font-medium hover:bg-[#009e8c] transition-colors cursor-pointer"
                          >
                            <ShoppingCart className="w-3 h-3" /> Add
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
    </section>
  );
};

export default RelatedProducts;
