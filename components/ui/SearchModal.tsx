"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight, Sparkles, Package } from "lucide-react";
import { Londrina_Solid } from "next/font/google";

const londrina = Londrina_Solid({
  weight: ["400", "900"],
  subsets: ["latin"],
  display: "swap",
});

type Product = {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  category: string;
  subCategory?: string;
  shortDescription?: string;
  isSale?: boolean;
};

// Global in-memory cache so products are ready instantly with 0ms delay
let cachedProducts: Product[] | null = null;

const POPULAR_SEARCHES = [
  "Art & Craft",
  "Pencil Box",
  "Stationery",
  "Bags",
  "Pouches",
  "Sippers",
  "Lunch Boxes",
  "Water Colours",
];

// Highlight matching alphabet/text
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-[#00b8a2]/20 text-[#00b8a2] font-black rounded-xs px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// Calculate relevance score for instant alphabet matching
function getMatchScore(product: Product, query: string): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;

  const name = (product.name || "").toLowerCase();
  const cat = (product.category || "").toLowerCase();
  const sub = (product.subCategory || "").toLowerCase();
  const desc = (product.shortDescription || "").toLowerCase();

  // 1. Name starts with the exact typed query
  if (name.startsWith(q)) return 100;

  // 2. Any word in the name starts with the typed query
  const words = name.split(/\s+/);
  if (words.some((w) => w.startsWith(q))) return 85;

  // 3. Name contains the typed characters
  if (name.includes(q)) return 70;

  // 4. Category starts with or contains the query
  if (cat.startsWith(q)) return 60;
  if (cat.includes(q)) return 50;

  // 5. Sub-category contains the query
  if (sub.includes(q)) return 40;

  // 6. Description contains the query
  if (desc.includes(q)) return 20;

  return 0;
}

interface SearchModalProps {
  onClose: () => void;
}

export default function SearchModal({ onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>(() => cachedProducts || []);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input immediately
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fetch catalog quietly in background without showing any blocking loading message
  useEffect(() => {
    if (cachedProducts && cachedProducts.length > 0) return;

    let isMounted = true;
    const fetchCatalog = async () => {
      try {
        const res = await fetch("/api/products/store", { cache: "no-store" });
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
          ? data.products
          : Array.isArray(data?.data)
          ? data.data
          : [];

        const mapped: Product[] = list.map((item: any, idx: number) => {
          const price = Number(item.sellingPrice ?? item.price ?? 0);
          const mrp = Number(item.mrp ?? item.price ?? 0);
          const images = Array.isArray(item.images) && item.images.length > 0
            ? item.images
            : [item.image || item.thumbnail || "/product/placeholder.svg"];

          return {
            id: String(item._id || item.id || idx + 1),
            name: item.productName || item.name || item.title || `Product ${idx + 1}`,
            price,
            oldPrice: mrp > price ? mrp : undefined,
            image: item.image || item.thumbnail || images[0] || "/product/placeholder.svg",
            category: item.category || item.categoryName || "",
            subCategory: item.subCategory || "",
            shortDescription: item.shortDescription || item.shortDesc || item.description || "",
            isSale: mrp > price,
          };
        });

        cachedProducts = mapped;
        if (isMounted) {
          setProducts(mapped);
        }
      } catch (err) {
        console.error("Silent background catalog fetch error", err);
      }
    };

    fetchCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Real-time character-by-character filtering & relevance sorting
  const searchResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const scored = products
      .map((p) => ({ product: p, score: getMatchScore(p, trimmed) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.product);

    return scored;
  }, [query, products]);

  const handleFullSearch = (searchWord?: string) => {
    const term = (searchWord ?? query).trim();
    if (term) {
      router.push(`/listing?search=${encodeURIComponent(term)}`);
      onClose();
    }
  };

  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleFullSearch();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-16 px-3 sm:px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Search Input Bar */}
        <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center gap-2 sm:gap-3 bg-gray-50/80">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#00b8a2]/10 text-[#00b8a2] flex items-center justify-center shrink-0">
            <Search className="w-5 h-5" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownInput}
            placeholder="Type to search (e.g. pencil, bag, bottle)..."
            className="flex-1 bg-transparent text-sm sm:text-base text-gray-900 placeholder:text-gray-400 focus:outline-none font-semibold"
          />

          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200/60 transition cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-bold text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-xl shadow-2xs hover:bg-gray-100 transition cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Dynamic Results Body */}
        <div className="max-h-[60vh] sm:max-h-[65vh] overflow-y-auto p-4 space-y-4">
          
          {/* State 1: When user hasn't typed anything yet */}
          {!query.trim() && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#00b8a2]" />
                <span>Popular Searches</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setQuery(term);
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-[#00b8a2]/15 text-gray-700 hover:text-[#00b8a2] rounded-full text-xs font-semibold transition border border-transparent hover:border-[#00b8a2]/30 cursor-pointer active:scale-95"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* State 2: When user is typing (Character-by-character live match) */}
          {query.trim() && (
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 text-xs text-gray-500 font-medium">
                <span>
                  {searchResults.length > 0 ? (
                    <>
                      Found <strong className="text-[#00b8a2] font-bold">{searchResults.length}</strong> matching {searchResults.length === 1 ? "product" : "products"}
                    </>
                  ) : (
                    "No matches"
                  )}
                </span>
                {searchResults.length > 0 && (
                  <button
                    onClick={() => handleFullSearch()}
                    className="text-[#00b8a2] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Immediate removal when word/character is mismatched */}
              {searchResults.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center text-gray-400 space-y-2">
                  <Package className="w-12 h-12 text-gray-300 stroke-1" />
                  <p className="text-sm font-bold text-gray-700">
                    No products matching &ldquo;<span className="text-rose-500">{query}</span>&rdquo;
                  </p>
                  <p className="text-xs text-gray-400 max-w-xs">
                    Letters matched nahi ho rahe. Backspace karein ya doosra word try karein.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {searchResults.slice(0, 8).map((product) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      onClick={onClose}
                      className="group flex items-center justify-between py-2.5 px-2 hover:bg-gray-50/90 rounded-2xl transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-12 h-12 rounded-xl bg-gray-100 border border-gray-100 overflow-hidden shrink-0">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-contain p-1"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate group-hover:text-[#00b8a2] transition-colors">
                            <HighlightMatch text={product.name} query={query} />
                          </h4>
                          <span className="text-[10px] text-gray-400 uppercase font-semibold block truncate">
                            <HighlightMatch text={product.category} query={query} />
                            {product.subCategory ? ` • ${product.subCategory}` : ""}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-3">
                        <span className={`${londrina.className} text-base sm:text-lg font-bold text-[#00b8a2] block`}>
                          ₹{product.price}
                        </span>
                        {product.oldPrice && product.oldPrice > product.price && (
                          <span className={`${londrina.className} text-xs text-gray-400 line-through block`}>
                            ₹{product.oldPrice}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Instant Enter action */}
        {query.trim() && searchResults.length > 0 && (
          <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Press <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-200 text-gray-700 shadow-2xs">Enter ↵</kbd> for full results</span>
            <button
              onClick={() => handleFullSearch()}
              className="px-4 py-1.5 bg-[#00b8a2] hover:bg-[#009e8c] text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <span>See all {searchResults.length} products</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
