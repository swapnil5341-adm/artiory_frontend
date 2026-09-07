"use client";
import { useCart } from "@/app/context/cart/Cartcontext";
import { useWishlist } from "@/app/context/whishlist/WishlistContext";
import {
  HeartIcon,
  Instagram,
  Twitter,
  Facebook,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Star,
} from "lucide-react";
import { toast } from "react-toastify";
import { useState, useRef, useEffect } from "react";
import { Londrina_Solid } from "next/font/google";
import RelatedProducts from "./RelatedProducts";

const londrina = Londrina_Solid({
  weight: ["100", "300", "400", "900"],
  subsets: ["latin"],
  display: "swap",
});

type ProductType = {
  id: number | string;
  images?: string[];
  image?: string;
  name: string;
  price: number;
  mrp?: number;
  rating?: number;
  sku?: string;
  category?: string;
  subCategory?: string;
  shortDescription?: string;
  description?: string;
  stockQuantity?: number;
  weight?: number;
  dimensions?: { length?: number; width?: number; height?: number };
  gst?: number;
};

const RatingStars: React.FC<{ rating?: number }> = ({ rating = 3 }) => (
  <div className="flex gap-1">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? "fill-[#00b8a2] text-[#00b8a2]" : "text-gray-300"}`} />
    ))}
  </div>
);

export default function ProductDetail({ product }: { product: ProductType }) {
  const { cartItems, dispatch } = useCart();
  const { wishlistDispatch, wishlistState } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDesktopHover, setIsDesktopHover] = useState(false);
  const [hoverZoom, setHoverZoom] = useState(false);
  const [hoverPos, setHoverPos] = useState({ x: 50, y: 50 });
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
      setIsDesktopHover(mq.matches);
      const handler = (e: MediaQueryListEvent) => setIsDesktopHover(e.matches);
      if (mq.addEventListener) {
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [product?.id]);

  const displayImages =
    product.images && product.images.length > 0
      ? product.images
      : product.image
      ? [product.image]
      : [];

  const mainImage = displayImages[currentIndex] || displayImages[0] || "/product/placeholder.svg";

  const handlePrev = () => setCurrentIndex((p) => (p === 0 ? displayImages.length - 1 : p - 1));
  const handleNext = () => setCurrentIndex((p) => (p === displayImages.length - 1 ? 0 : p + 1));

  const handleTouchStart = (e: React.TouchEvent) => {
    setHoverZoom(false);
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartXRef.current !== null && touchEndXRef.current !== null) {
      const diff = touchStartXRef.current - touchEndXRef.current;
      if (diff > 50) handleNext();
      else if (diff < -50) handlePrev();
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesktopHover) return;
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setHoverPos({ x, y });
    setCursorPos({ x: e.clientX, y: e.clientY });
  };

  const isInWishlist = wishlistState.items.some((item) => item.id === String(product.id));

  const handleCart = () => {
    const stockLimit = product.stockQuantity ?? 999;
    dispatch({ type: "ADD_ITEM", payload: { id: String(product.id), name: product.name, price: product.price, image: mainImage, quantity, stock: stockLimit } });
    toast.success(`${product.name} added to cart!`);
  };

  const handleWishlist = () => {
    if (isInWishlist) {
      wishlistDispatch({ type: "REMOVE_FROM_WISHLIST", payload: { id: String(product.id) } });
      toast.info(`${product.name} removed from Wishlist!`);
    } else {
      wishlistDispatch({ type: "ADD_TO_WISHLIST", payload: { id: String(product.id), name: product.name, price: product.price, image: mainImage } });
      toast.success(`${product.name} added to Wishlist!`);
    }
  };

  const discount = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : null;

  return (
    <div className={`${londrina.className} w-full max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-20 pt-6 pb-16 space-y-10 text-[#1e1e4d]`}>

      {/* Breadcrumb */}
      <p className="text-xs sm:text-sm text-gray-400">
        Home / <span className="text-[#1e1e4d] font-medium">{product.name}</span>
      </p>

      {/* Main Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 xl:gap-12 2xl:gap-14">

        {/* Left — Images + Hover Zoom Window */}
        <div className="flex flex-col-reverse sm:flex-row gap-3.5 relative items-start">

          {/* Thumbnails */}
          <div className="flex flex-row sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto sm:max-h-[520px] md:max-h-[560px] lg:max-h-[600px] xl:max-h-[660px] pb-1 sm:pb-0 shrink-0">
            {displayImages.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`shrink-0 w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 xl:w-22 xl:h-22 border-2 rounded-xl sm:rounded-2xl cursor-pointer overflow-hidden transition-all duration-200 bg-white ${
                  currentIndex === idx ? "border-[#00b8a2] shadow-md ring-2 ring-[#00b8a2]/20" : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-contain p-1.5" />
              </div>
            ))}
          </div>

          {/* Main Image (Cut-to-Cut Edge-to-Edge Large Display) */}
          <div
            ref={imageRef}
            className="relative flex-1 w-full aspect-square max-w-full rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-md overflow-hidden bg-white cursor-default lg:cursor-crosshair flex items-center justify-center p-0"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => {
              if (isDesktopHover) setHoverZoom(true);
            }}
            onMouseLeave={() => setHoverZoom(false)}
          >
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-contain pointer-events-none select-none transition-transform duration-300"
            />

            {/* Nav arrows */}
            {displayImages.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white shadow-md rounded-full p-2 transition hover:scale-105 active:scale-95">
                  <ChevronLeft className="w-5 h-5 text-[#1e1e4d]" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white shadow-md rounded-full p-2 transition hover:scale-105 active:scale-95">
                  <ChevronRight className="w-5 h-5 text-[#1e1e4d]" />
                </button>
              </>
            )}

            {/* Dot indicators */}
            {displayImages.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none">
                {displayImages.map((_, i) => (
                  <span key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? "bg-[#00b8a2] w-4" : "bg-gray-300"}`} />
                ))}
              </div>
            )}
          </div>

          {/* Hover Zoom Window — Desktop mouse only */}
          {isDesktopHover && hoverZoom && (
            <div
              className="fixed z-50 w-[420px] h-[420px] lg:w-[480px] lg:h-[480px] xl:w-[520px] xl:h-[520px] rounded-2xl border border-gray-200 shadow-2xl overflow-hidden bg-white pointer-events-none hidden lg:block"
              style={{
                top: Math.max(20, Math.min(typeof window !== "undefined" ? window.innerHeight - 540 : cursorPos.y - 250, cursorPos.y - 250)),
                left: typeof window !== "undefined" && cursorPos.x + 550 > window.innerWidth ? Math.max(20, cursorPos.x - 540) : cursorPos.x + 30,
              }}
            >
              <img
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-contain p-4"
                style={{
                  transformOrigin: `${hoverPos.x}% ${hoverPos.y}%`,
                  transform: "scale(2.5)",
                }}
              />
            </div>
          )}
        </div>

        {/* Right — Info */}
        <div className="flex flex-col gap-4 lg:gap-5">
          {product.category && (
            <span className="text-xs font-medium text-[#00b8a2] uppercase tracking-widest">
              {product.category}{product.subCategory ? ` / ${product.subCategory}` : ""}
            </span>
          )}

          <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-3xl 2xl:text-4xl font-bold leading-tight">{product.name}</h1>

          <RatingStars rating={product.rating} />

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-xl sm:text-2xl lg:text-3xl xl:text-3xl font-semibold text-[#00b8a2]">₹{product.price}</span>
            {product.mrp && product.mrp > product.price && (
              <span className="text-base text-gray-400 line-through">₹{product.mrp}</span>
            )}
            {discount && (
              <span className="text-sm bg-red-100 text-red-500 font-semibold px-2 py-0.5 rounded-full">{discount}% OFF</span>
            )}
          </div>

          {/* Stock Notification */}
          {(() => {
            const stock = product.stockQuantity ?? 0;
            if (stock === 0) {
              return (
                <div className="text-sm font-semibold text-rose-500 bg-rose-50 border border-rose-100 rounded-xl px-3 py-1.5 w-fit">
                  ❌ Out of Stock
                </div>
              );
            }
            if (stock <= 5) {
              return (
                <div className="text-sm font-semibold text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-1.5 w-fit animate-pulse">
                  ⚠️ Only {stock} items left in stock - order soon!
                </div>
              );
            }
            return (
              <div className="text-xs font-semibold text-[#00b8a2] bg-emerald-50/50 border border-emerald-100 rounded-xl px-2.5 py-1 w-fit">
                ✓ In Stock
              </div>
            );
          })()}

          {product.shortDescription && (
            <p className="text-sm sm:text-base xl:text-lg text-gray-500 font-light leading-relaxed">{product.shortDescription}</p>
          )}

          <hr className="border-gray-100" />

          {/* Quantity + Cart + Wishlist */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {(() => {
              const cartItem = cartItems.find((item) => item.id === String(product.id));
              const stockLimit = product.stockQuantity ?? 999;
              const isOutOfStock = stockLimit <= 0;

              if (isOutOfStock) {
                return (
                  <>
                    <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden opacity-50 pointer-events-none">
                      <button className="px-4 py-2.5 text-lg hover:bg-gray-50 transition cursor-pointer" disabled>−</button>
                      <span className="px-5 py-2.5 text-base font-medium border-x border-gray-300 w-12 text-center">0</span>
                      <button className="px-4 py-2.5 text-lg hover:bg-gray-50 transition cursor-pointer" disabled>+</button>
                    </div>
                    <button disabled className="flex items-center gap-2 bg-gray-400 text-white px-4 sm:px-6 py-2.5 rounded-xl text-sm font-medium cursor-not-allowed">
                      Out of Stock
                    </button>
                  </>
                );
              }

              if (cartItem) {
                return (
                  <>
                    <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white">
                      <button
                        className="px-4 py-2.5 text-lg hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => {
                          if (cartItem.quantity > 1) {
                            dispatch({
                              type: "UPDATE_QUANTITY",
                              payload: { id: String(product.id), quantity: cartItem.quantity - 1 },
                            });
                          } else {
                            dispatch({ type: "REMOVE_ITEM", payload: String(product.id) });
                            toast.info(`${product.name} removed from cart`, { position: "bottom-right", autoClose: 800 });
                          }
                        }}
                      >
                        −
                      </button>
                      <span className="px-5 py-2.5 text-base font-semibold border-x border-gray-300 w-12 text-center text-[#2e306a]">
                        {cartItem.quantity}
                      </span>
                      <button
                        className="px-4 py-2.5 text-lg hover:bg-gray-50 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        disabled={cartItem.quantity >= stockLimit}
                        onClick={() => {
                          if (cartItem.quantity >= stockLimit) {
                            toast.warn(`Only ${stockLimit} items available in stock!`, { position: "bottom-right", autoClose: 2000 });
                            return;
                          }
                          dispatch({
                            type: "UPDATE_QUANTITY",
                            payload: { id: String(product.id), quantity: cartItem.quantity + 1 },
                          });
                        }}
                        title={cartItem.quantity >= stockLimit ? "Stock limit reached" : ""}
                      >
                        +
                      </button>
                    </div>
                    <button
                      disabled
                      className="flex items-center gap-2 bg-emerald-600 text-white px-4 sm:px-6 py-2.5 rounded-xl text-sm font-medium cursor-not-allowed shadow-sm"
                    >
                      ✓ Added to Cart
                    </button>
                  </>
                );
              }

              return (
                <>
                  <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white">
                    <button
                      className="px-4 py-2.5 text-lg hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    >
                      −
                    </button>
                    <span className="px-5 py-2.5 text-base font-semibold border-x border-gray-300 w-12 text-center text-[#2e306a]">
                      {quantity}
                    </span>
                    <button
                      className="px-4 py-2.5 text-lg hover:bg-gray-50 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      disabled={quantity >= stockLimit}
                      onClick={() => {
                        if (quantity >= stockLimit) {
                          toast.warn(`Only ${stockLimit} items available in stock!`, { position: "bottom-right", autoClose: 2000 });
                          return;
                        }
                        setQuantity((q) => q + 1);
                      }}
                      title={quantity >= stockLimit ? "Stock limit reached" : ""}
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={handleCart}
                    className="flex items-center gap-2 bg-[#1e1e4d] hover:bg-[#2e3a7a] text-white px-4 sm:px-6 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer shadow-sm hover:shadow"
                  >
                    <ShoppingCart className="w-4 h-4" /> Add to Cart
                  </button>
                </>
              );
            })()}
            <button onClick={handleWishlist} className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-xl hover:border-[#00b8a2] transition">
              <HeartIcon className="w-5 h-5 stroke-[#8bd2c9] stroke-2" fill={isInWishlist ? "#00c8a2" : "none"} />
            </button>
          </div>

          {/* Share */}
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span>Share:</span>
            <a href="#" className="hover:text-pink-500 transition"><Instagram className="w-4 h-4" /></a>
            <a href="#" className="hover:text-sky-400 transition"><Twitter className="w-4 h-4" /></a>
            <a href="#" className="hover:text-blue-600 transition"><Facebook className="w-4 h-4" /></a>
          </div>

          {/* Specs */}
          <div className="border border-gray-200 rounded-2xl p-3 sm:p-4 lg:p-5 xl:p-6 bg-gray-50 text-sm xl:text-base">
            <h3 className="font-semibold text-[#1e1e4d] mb-3 text-base">Product Details</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-gray-500 font-light">
              {product.sku && <p><span className="font-medium text-[#1e1e4d]">SKU:</span> {product.sku}</p>}
              {product.category && <p><span className="font-medium text-[#1e1e4d]">Category:</span> {product.category}</p>}
              {product.stockQuantity !== undefined && (
                <p><span className="font-medium text-[#1e1e4d]">Stock:</span>{" "}
                  {product.stockQuantity > 0
                    ? <span className="text-green-600 font-normal">{product.stockQuantity} left</span>
                    : <span className="text-red-500 font-normal">Out of Stock</span>}
                </p>
              )}
              {product.weight !== undefined && product.weight > 0 && (
                <p>
                  <span className="font-medium text-[#1e1e4d]">Weight:</span>{" "}
                  <span className="font-normal text-gray-700">{product.weight} gm</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="border border-gray-200 rounded-2xl p-4 sm:p-6 lg:p-8 bg-white">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-600 mb-4">Description</h2>
          <p className="text-sm sm:text-base text-gray-500 font-light leading-relaxed">{product.description}</p>
        </div>
      )}

      {/* Related */}
      <RelatedProducts category={product.category} currentProductId={String(product.id)} />
    </div>
  );
}
