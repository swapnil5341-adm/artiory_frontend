"use client";
import React, { useState, useEffect, useRef } from "react";
import { Londrina_Solid } from "next/font/google";
import { useCart } from "@/app/context/cart/Cartcontext";
import { HeartIcon, ShoppingCart, ChevronDown } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import Link from "next/link";
import { useWishlist } from "@/app/context/whishlist/WishlistContext";

const londrina = Londrina_Solid({
  weight: ["100", "300", "400", "900"],
  subsets: ["latin"],
  display: "swap",
});

type Product = {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  images: string[];
  category: string;
  shortDescription: string;
  description: string;
  isSale?: boolean;
  stock?: number;
  stockQuantity?: number;
};

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    if (isMoreOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMoreOpen]);

  useEffect(() => {
    const fetchProducts = async () => {
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
        
        const finalProducts = list.map((item: any, index: number) => {
          const price = Number(item.sellingPrice ?? item.price ?? 0);
          const mrp = Number(item.mrp ?? item.price ?? 0);
          const rawImages: string[] = Array.isArray(item.images)
            ? item.images.filter((img: unknown): img is string => typeof img === "string" && img.trim().length > 0)
            : [];
          const mainImg = typeof item.image === "string" && item.image.trim()
            ? item.image
            : (item.thumbnail || rawImages[0] || "/product/placeholder.svg");
          const images = [...new Set(rawImages.length > 0 ? [mainImg, ...rawImages] : [mainImg])];
          return {
            id: String(item._id || item.id || index + 1),
            name: item.productName || item.name || "",
            price,
            oldPrice: mrp > price ? mrp : undefined,
            image: mainImg,
            images,
            category: item.category || "",
            shortDescription: item.shortDescription || item.shortDesc || "",
            description: item.description || "",
            isSale: mrp > price,
            ageGroup: item.ageGroup || "3+",
            stock: item.stockQuantity ?? item.stock ?? 999,
            stockQuantity: item.stockQuantity ?? item.stock ?? 999,
          };
        });
        
        // Dynamic random shuffle
        const shuffleArray = (arr: Product[]) => {
          const shuffled = [...arr];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          return shuffled;
        };
        setProducts(shuffleArray(finalProducts));
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const itemsPerPage = 8;
  const [page, setPage] = useState(1);

  // Filter products by selected category
  const filteredProducts = selectedCategory === "All"
    ? products
    : products.filter((p) => p.category === selectedCategory);

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  // For mobile/tablet: Single compact row without slider/scroll (3 main tabs + 1 More button)
  const otherCategories = categories.filter((c) => c !== "All");
  const defaultTopTwo = otherCategories.slice(0, 2);
  let mobileTabs = ["All", ...defaultTopTwo];
  if (selectedCategory !== "All" && !defaultTopTwo.includes(selectedCategory)) {
    mobileTabs = ["All", defaultTopTwo[0] || "All", selectedCategory].filter(Boolean);
  }
  const isSelectedInMore = !mobileTabs.includes(selectedCategory);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const getPaginationRange = () => {
    const range: (number | string)[] = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
      return range;
    }
    range.push(1);
    let start = Math.max(2, page - 1);
    let end = Math.min(totalPages - 1, page + 1);
    if (page <= 3) {
      end = 4;
    } else if (page >= totalPages - 2) {
      start = totalPages - 3;
    }
    if (start > 2) {
      range.push("...");
    }
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    if (end < totalPages - 1) {
      range.push("...");
    }
    range.push(totalPages);
    return range;
  };

  const { cartItems, dispatch } = useCart();
  const handleAddToCart = (product: Product) => {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: String(product.id),
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
        stock: product.stockQuantity ?? product.stock,
      },
    });
    toast.success(`${product.name} added to cart!`, {
      position: "bottom-right",
      autoClose: 800,
    });
  };

  const { wishlistDispatch, wishlistState } = useWishlist();
  const handleWishlist = (product: Product) => {
    const isInWishlist = wishlistState.items.some(
      (item) => item.id === String(product.id)
    );

    if (isInWishlist) {
      wishlistDispatch({
        type: "REMOVE_FROM_WISHLIST",
        payload: { id: String(product.id) },
      });
      toast.info(`${product.name} removed from Wishlist!`, {
        position: "bottom-right",
        autoClose: 800,
      });
    } else {
      wishlistDispatch({
        type: "ADD_TO_WISHLIST",
        payload: {
          id: String(product.id),
          name: product.name,
          price: product.price,
          image: product.image,
        },
      });
      toast.success(`${product.name} added to Wishlist!`, {
        position: "bottom-right",
        autoClose: 800,
      });
    }
  };

  if (loading) {
    return (
      <section className={`${londrina.className} py-8 sm:py-12 lg:py-16 bg-white`}>
        <div className="max-w-7xl mx-auto px-4 mb-5 sm:mb-7 lg:mb-10">
          <div className="flex flex-row items-center justify-between lg:flex-col lg:justify-center text-left lg:text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-extrabold text-[#00b8a2] tracking-wide">
              OUR PRODUCTS.
            </h1>
            <div className="h-4 w-16 sm:w-20 lg:w-24 bg-gray-200 rounded animate-pulse lg:mt-3" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 w-full max-w-7xl mx-auto px-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden bg-white">
              <div className="aspect-square w-full bg-gray-200 animate-pulse" />
              <div className="px-3 pt-2 pb-3 flex flex-col gap-2">
                <div className="h-2.5 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-3.5 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mt-1" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className={`${londrina.className} py-8 sm:py-12 lg:py-16 bg-white`}>
      {/* Heading: Left-Right on Mobile/Tablet, Centered on Desktop */}
      <div className="max-w-7xl mx-auto px-4 mb-5 sm:mb-7 lg:mb-10">
        <div className="flex flex-row items-center justify-between lg:flex-col lg:justify-center text-left lg:text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-extrabold text-[#00b8a2] tracking-wide">
            OUR PRODUCTS.
          </h1>
          <Link
            href="/listing"
            className="group flex items-center gap-1 text-sm sm:text-base md:text-lg lg:text-2xl font-bold lg:font-normal text-gray-400 hover:text-[#00b8a2] transition-colors lg:mt-3 cursor-pointer"
          >
            <span>View All</span>
            <span className="inline-block transition-transform duration-200 group-hover:translate-x-1 lg:hidden text-xs sm:text-sm">
              →
            </span>
          </Link>
        </div>
      </div>

      {/* Mobile & Tablet: Compact 1-Row Bar (NO SLIDING/SCROLLING) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 mb-6 sm:mb-8 lg:hidden relative">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {mobileTabs.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setPage(1);
                  setIsMoreOpen(false);
                }}
                className={`flex items-center justify-center py-2 px-1.5 sm:px-2.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase transition-all duration-200 border cursor-pointer ${
                  isSelected
                    ? "bg-[#00b8a2] text-white border-[#00b8a2] shadow-sm shadow-[#00b8a2]/30"
                    : "bg-gray-50 text-[#2e306a] border-gray-200 hover:border-[#00b8a2] hover:text-[#00b8a2]"
                }`}
              >
                <span className="truncate">{cat}</span>
              </button>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setIsMoreOpen((prev) => !prev)}
            className={`flex items-center justify-center gap-1 py-2 px-1.5 sm:px-2.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase transition-all duration-200 border cursor-pointer ${
              isMoreOpen || isSelectedInMore
                ? "bg-[#00b8a2]/15 text-[#00b8a2] border-[#00b8a2] ring-1 ring-[#00b8a2]"
                : "bg-gray-50 text-[#2e306a] border-gray-200 hover:border-[#00b8a2] hover:text-[#00b8a2]"
            }`}
          >
            <span className="truncate">{isMoreOpen ? "Close" : "More"}</span>
            <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isMoreOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Dropdown Card for More Categories (No Slider) */}
        {isMoreOpen && (
          <div
            ref={dropdownRef}
            className="absolute left-3 right-3 sm:left-auto sm:right-4 top-full mt-2 sm:w-80 bg-white rounded-2xl shadow-xl border border-gray-200 p-3.5 z-30 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-gray-100">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                All Categories ({categories.length})
              </span>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-60 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setPage(1);
                      setIsMoreOpen(false);
                    }}
                    className={`flex items-center px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#00b8a2] text-white shadow-sm"
                        : "bg-gray-50 text-[#2e306a] hover:bg-[#00b8a2]/10 hover:text-[#00b8a2]"
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Desktop: Standard Centered Wrap (UNCHANGED) */}
      <div className="hidden lg:flex flex-wrap justify-center gap-2.5 mb-10 px-4 max-w-7xl mx-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(cat);
              setPage(1);
            }}
            className={`px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider border transition-all duration-300 cursor-pointer ${
              selectedCategory === cat
                ? "bg-[#00b8a2] text-white border-[#00b8a2] shadow-md shadow-[#00b8a2]/25"
                : "bg-gray-50 text-[#2e306a] border-gray-200 hover:border-[#00b8a2] hover:text-[#00b8a2]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-3.5 md:gap-4 w-full max-w-7xl mx-auto px-3 sm:px-4">
        {paginatedProducts.map((product) => (
          <div key={product.id} className="w-full flex justify-center">
            <Link
              href={`/product/${product.id}`}
              className="w-full flex justify-center"
            >
              <div className="group relative flex flex-col justify-between w-full rounded-xl sm:rounded-2xl bg-white border border-gray-100/90 shadow-2xs hover:shadow-md hover:border-[#00b8a2]/30 overflow-hidden transition-all duration-200">

                {/* Badges */}
                <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                  {product.isSale && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">SALE</span>
                  )}
                  {product.oldPrice && product.oldPrice > product.price && (
                    <span className="bg-[#00b8a2] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      -{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
                    </span>
                  )}
                </div>

                {/* Wishlist & Cart icons */}
                <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => { e.preventDefault(); handleWishlist(product); }}
                    className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center"
                  >
                    <HeartIcon
                      className="w-4 h-4 stroke-[#8bd2c9] stroke-2"
                      fill={wishlistState.items.some((item) => item.id === product.id) ? "#00c8a2" : "none"}
                    />
                  </button>
                  {/* <button
                    onClick={(e) => { e.preventDefault(); handleAddToCart(product); }}
                    className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center"
                  >
                    <ShoppingCart className="w-4 h-4 text-[#00b8a2]" />
                  </button> */}
                </div>

                {/* Image */}
                <div className="relative aspect-square w-full bg-white overflow-hidden">
                  <img
                    src={product.image || (product.images && product.images[0]) || "/product/placeholder.svg"}
                    alt={product.name}
                    className={`h-full w-full object-cover object-center transition-opacity duration-300 ${
                      product.images && product.images.length > 1 && product.images[1] !== (product.image || product.images[0])
                        ? "group-hover:opacity-0"
                        : ""
                    }`}
                    loading="lazy"
                  />
                  {product.images && product.images.length > 1 && product.images[1] && product.images[1] !== (product.image || product.images[0]) && (
                    <img
                      src={product.images[1]}
                      alt={`${product.name} - alternate view`}
                      className="absolute inset-0 h-full w-full object-cover object-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      loading="lazy"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-col gap-1 px-3 pt-2 pb-3 flex-1">
                  {product.category && (
                    <span className="text-[10px] text-[#00b8a2] font-medium uppercase tracking-wide">{product.category}</span>
                  )}
                  <h2 className="line-clamp-2 text-sm font-semibold text-[#2e306a]">{product.name}</h2>
                  {product.shortDescription && (
                    <p className="text-xs text-gray-400 line-clamp-1">{product.shortDescription}</p>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                    <div className="flex items-baseline gap-1.5">
                      <span className={`${londrina.className} text-lg font-semibold text-[#00b8a2]`}>₹{product.price}</span>
                      {product.oldPrice && product.oldPrice > product.price && (
                        <span className={`${londrina.className} text-sm text-gray-400 line-through`}>₹{product.oldPrice}</span>
                      )}
                    </div>
                    {(() => {
                      const cartItem = cartItems.find((item) => item.id === String(product.id));
                      return cartItem ? (
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-1 py-0.5 shadow-sm">
                          <button
                            onClick={(e) => {
                              e.preventDefault(); e.stopPropagation();
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
                            className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-md text-sm font-semibold transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={product.stockQuantity ?? product.stock ?? 999}
                            value={cartItem.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              const maxStock = product.stockQuantity ?? product.stock ?? 999;
                              if (!isNaN(val)) {
                                if (val > maxStock) {
                                  toast.warn(`Only ${maxStock} items in stock!`, { position: "bottom-right", autoClose: 2000 });
                                  dispatch({
                                    type: "UPDATE_QUANTITY",
                                    payload: { id: String(product.id), quantity: maxStock },
                                  });
                                } else if (val >= 1) {
                                  dispatch({
                                    type: "UPDATE_QUANTITY",
                                    payload: { id: String(product.id), quantity: val },
                                  });
                                }
                              }
                            }}
                            className="w-8 text-center font-bold text-[11px] text-[#2e306a] bg-transparent border-none focus:outline-none focus:ring-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            onClick={(e) => {
                              e.preventDefault(); e.stopPropagation();
                              const maxStock = product.stockQuantity ?? product.stock ?? 999;
                              if (cartItem.quantity >= maxStock) {
                                toast.warn(`Only ${maxStock} items available in stock!`, { position: "bottom-right", autoClose: 2000 });
                                return;
                              }
                              dispatch({
                                type: "UPDATE_QUANTITY",
                                payload: { id: String(product.id), quantity: cartItem.quantity + 1 },
                              });
                            }}
                            disabled={cartItem.quantity >= (product.stockQuantity ?? product.stock ?? 999)}
                            className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-[#00b8a2] hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed rounded-md text-sm font-semibold transition-colors cursor-pointer"
                            title={cartItem.quantity >= (product.stockQuantity ?? product.stock ?? 999) ? "Stock limit reached" : ""}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(product); }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#00b8a2] text-white rounded-xl text-xs font-medium hover:bg-[#009e8c] transition-colors cursor-pointer"
                        >
                          <ShoppingCart className="w-3 h-3" /> Add
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-3 mt-10">
        {page > 1 && (
          <button
            onClick={() => setPage(page - 1)}
            className="text-[#00b8a2] font-semibold hover:underline cursor-pointer"
          >
            Prev
          </button>
        )}
        {getPaginationRange().map((item, index) => {
          if (item === "...") {
            return (
              <span key={`dots-${index}`} className="text-gray-400 font-bold px-1 select-none">
                ...
              </span>
            );
          }
          const pageNum = Number(item);
          return (
            <button
              key={`page-${pageNum}`}
              onClick={() => setPage(pageNum)}
              className={`px-3 py-1 cursor-pointer font-extrabold rounded-lg ${
                page === pageNum ? "text-white bg-[#00b8a2]" : "text-[#00b8a2]"
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        {page < totalPages && (
          <button
            onClick={() => setPage(page + 1)}
            className="text-[#00b8a2] font-semibold hover:underline cursor-pointer"
          >
            Next
          </button>
        )}
      </div>
      <ToastContainer />
    </section>
  );
};

export default Products;
