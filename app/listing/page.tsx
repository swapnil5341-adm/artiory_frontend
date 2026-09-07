"use client";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Star, Heart, ShoppingCart, SlidersHorizontal, ChevronDown, X, PackageSearch } from "lucide-react";
import { Londrina_Solid } from "next/font/google";
import { useWishlist } from "../context/whishlist/WishlistContext";
import { useCart } from "../context/cart/Cartcontext";
import { ToastContainer, toast } from "react-toastify";


const londrina = Londrina_Solid({
  weight: ["100", "300", "400", "900"],
  subsets: ["latin"],
  display: "swap",
});

function Rating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i < value ? "fill-[#00b8a2] text-[#00b8a2]" : "fill-gray-200 text-gray-200"}`}
        />
      ))}
      <span className="text-xs text-gray-400 ml-1">({value}.0)</span>
    </div>
  );
}

type Product = {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  images: string[];
  category: string;
  subCategory?: string;
  shortDescription: string;
  description: string;
  isSale?: boolean;
  stock?: number;
  stockQuantity?: number;
};



const categoryGroups: { label: string;  items: string[] }[] = [
  { label: "Art & Craft", items: ["Crayons", "Water Colours", "Puzzle Crayons"] },
  { label: "Stationery", items: ["Pencil Box", "Compass Box", "Slate", "Stationery Combo Set", "Mechanical Sharpener", "Pencil Case", "Diary"] },
  { label: "Bags", items: ["Tiffin Bags", "Cross Bags", "Folder Bags", "Fancy Bags", "Vanity Case"] },
  { label: "Pouches",  items: ["Soft Pouch", "Silicone Pouch"] },
  { label: "Drinkware/Lunchware",  items: ["Sippers", "500 ml Sipper", "900 ml Plastic Bottle Sipper", "Tumbler", "600ml Sippers", "Lunch Boxes"] },
  { label: "Gifts & Fun",  items: ["Metal Money Box", "Gift Hamper", "Mini Fan", "Tissue Paper Box"] },
];

function normalizeCategoryMatch(str: string) {
  if (!str) return "";
  let res = str.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (res === "artscraft" || res === "artsandcraft" || res === "artandcraft" || res === "artsandcrafts") {
    res = "artcraft";
  }
  if (res === "drinkwarelunchware" || res === "drinkware" || res === "lunchware") {
    res = "drinkwarelunchware";
  }
  return res;
}

function expandCategorySelection(rawList: string[]): { selected: string[]; openGroups: string[] } {
  const selected: string[] = [];
  const openGroups: string[] = [];

  rawList.forEach((item) => {
    const nItem = normalizeCategoryMatch(item);
    const matchingGroup = categoryGroups.find((g) => normalizeCategoryMatch(g.label) === nItem);
    if (matchingGroup) {
      // Group specified (e.g. Art & Craft) -> tick all its items and open the group!
      selected.push(...matchingGroup.items, matchingGroup.label);
      openGroups.push(matchingGroup.label);
    } else {
      selected.push(item);
      const parentGroup = categoryGroups.find((g) =>
        g.items.some((it) => normalizeCategoryMatch(it) === nItem)
      );
      if (parentGroup) {
        openGroups.push(parentGroup.label);
      }
    }
  });

  return {
    selected: Array.from(new Set(selected)),
    openGroups: Array.from(new Set(openGroups)),
  };
}

function ProductListContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const searchQuery = (searchParams.get("search") || searchParams.get("q") || "").trim();

  const clearSearch = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.delete("search");
      params.delete("q");
      const queryStr = params.toString();
      const newUrl = queryStr ? `${window.location.pathname}?${queryStr}` : window.location.pathname;
      window.location.href = newUrl;
    }
  };

  // Initialize selectedCategories & openGroups from URL or sessionStorage
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const isAll = params.get("all") === "true" || params.get("all") === "1" || params.get("category") === "all" || params.get("categories") === "all";
      if (isAll) {
        sessionStorage.removeItem("artiory_selected_categories");
        return [];
      }
      const catParam = params.get("categories") || params.get("category");
      if (catParam) {
        const rawList = catParam.split(",").map((c) => decodeURIComponent(c.trim())).filter(Boolean);
        const { selected } = expandCategorySelection(rawList);
        return selected;
      }
      const saved = sessionStorage.getItem("artiory_selected_categories");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }
    return [];
  });

  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const isAll = params.get("all") === "true" || params.get("all") === "1" || params.get("category") === "all" || params.get("categories") === "all";
      if (isAll) return [];
      const catParam = params.get("categories") || params.get("category");
      if (catParam) {
        const rawList = catParam.split(",").map((c) => decodeURIComponent(c.trim())).filter(Boolean);
        const { openGroups: groups } = expandCategorySelection(rawList);
        return groups;
      }
    }
    return [];
  });

  // Sync selectedCategories & openGroups when URL searchParams change
  useEffect(() => {
    const isAll = searchParams.get("all") === "true" || searchParams.get("all") === "1" || searchParams.get("category") === "all" || searchParams.get("categories") === "all";
    if (isAll) {
      setSelectedCategories([]);
      setOpenGroups([]);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("artiory_selected_categories");
      }
      return;
    }

    const catParam = searchParams.get("categories") || searchParams.get("category");
    if (catParam) {
      const rawList = catParam.split(",").map((c) => decodeURIComponent(c.trim())).filter(Boolean);
      const { selected, openGroups: groups } = expandCategorySelection(rawList);
      setSelectedCategories(selected);
      if (groups.length > 0) {
        setOpenGroups((prev) => Array.from(new Set([...prev, ...groups])));
      }
    }
  }, [searchParams]);

  // Initialize sortOption from URL or sessionStorage
  const [sortOption, setSortOption] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const sortParam = params.get("sort");
      if (sortParam) return sortParam;
      const saved = sessionStorage.getItem("artiory_sort_option");
      if (saved) return saved;
    }
    return "Default";
  });

  const [showMobileFilter, setShowMobileFilter] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch("/api/products/store", { cache: "no-store" });
        const data = await res.json();

        const normalizedProducts = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
            ? data.products
            : Array.isArray(data?.data)
              ? data.data
              : [];

        const finalProducts = normalizedProducts.length > 0
          ? normalizedProducts.map((item: any, index: number) => {
              const normalized = item ?? {};

              const extractImageCandidates = (value: unknown): string[] => {
                if (Array.isArray(value)) {
                  return value.flatMap((entry) => extractImageCandidates(entry));
                }

                if (value && typeof value === "object") {
                  const objectValue = value as Record<string, unknown>;
                  const nestedCandidates = [
                    objectValue.url,
                    objectValue.secureUrl,
                    objectValue.src,
                    objectValue.path,
                    objectValue.href,
                    objectValue.imageUrl,
                    objectValue.thumbnail,
                    objectValue.image,
                    objectValue.link,
                    objectValue.downloadUrl,
                  ];
                  return nestedCandidates.flatMap((entry) => extractImageCandidates(entry));
                }

                if (typeof value === "string") {
                  const trimmed = value.trim();
                  return trimmed ? [trimmed] : [];
                }

                return [];
              };

              const resolveImageSrc = (src?: unknown) => {
                if (typeof src !== "string") {
                  return "/product/placeholder.svg";
                }

                const trimmed = src.trim();
                if (!trimmed) return "/product/placeholder.svg";
                if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
                  return trimmed;
                }
                if (trimmed.startsWith("//")) {
                  return `https:${trimmed}`;
                }
                if (/^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(trimmed)) {
                  return trimmed;
                }
                if (/^(?:[a-z0-9.-]+\.)+[a-z]{2,}(?:\/|$)/i.test(trimmed)) {
                  return `https://${trimmed}`;
                }
                if (trimmed.startsWith("/")) {
                  return trimmed;
                }
                return `/product/${trimmed}`;
              };

              const imageCandidates = extractImageCandidates(
                normalized.images ??
                normalized.imageUrls ??
                normalized.imageList ??
                normalized.gallery ??
                normalized.productImages ??
                normalized.media ??
                normalized.image
              );

              const imageList = imageCandidates.filter(Boolean);
              const image = resolveImageSrc(
                normalized.image ??
                normalized.productImage ??
                normalized.thumbnail ??
                normalized.mainImage ??
                normalized.imageUrl ??
                normalized.imagePath ??
                normalized.url ??
                normalized.img ??
                normalized.photo ??
                imageList[0]
              );
              const price = Number(normalized.sellingPrice ?? normalized.price ?? normalized.selling_price ?? normalized.finalPrice ?? normalized.amount ?? 0);
              const mrp = Number(normalized.mrp ?? normalized.oldPrice ?? normalized.originalPrice ?? normalized.basePrice ?? normalized.price ?? 0);

              return {
                ...normalized,
                id: String(normalized._id ?? normalized.id ?? normalized.productId ?? normalized.product_id ?? index + 1),
                _id: normalized._id ?? normalized.id ?? normalized.productId ?? normalized.product_id ?? index + 1,
                name: normalized.productName || normalized.name || normalized.title || normalized.product_title || `Product ${index + 1}`,
                productName: normalized.productName || normalized.name || normalized.title || normalized.product_title || `Product ${index + 1}`,
                category: normalized.category || normalized.categoryName || normalized.productCategory || normalized.type || "",
                subCategory: normalized.subCategory || "",
                shortDescription: normalized.shortDescription || normalized.shortDesc || normalized.description || normalized.summary || normalized.details || "",
                description: normalized.description || normalized.longDescription || normalized.details || normalized.shortDescription || normalized.shortDesc || "",
                price,
                sellingPrice: price,
                mrp,
                oldPrice: mrp || undefined,
                image,
                images: [...new Set((imageList.length > 0 ? imageList.map((img: string) => resolveImageSrc(img)) : [image]).filter(Boolean))],
                isSale: Boolean(normalized.isSale ?? normalized.onSale ?? (mrp > 0 && price > 0 && price < mrp)),
              };
            })
          : [];

        // Dynamic Fisher-Yates shuffle for diverse All Products mix
        const shuffleArray = <T,>(arr: T[]): T[] => {
          const shuffled = [...arr];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          return shuffled;
        };

        setProducts(shuffleArray(finalProducts));
      } catch (error) {
        console.error("Failed to load products", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Restore scroll position after loading products
  useEffect(() => {
    if (!loading && products.length > 0 && typeof window !== "undefined") {
      const savedScroll = sessionStorage.getItem("artiory_listing_scroll");
      if (savedScroll) {
        const scrollY = parseInt(savedScroll, 10);
        if (!isNaN(scrollY) && scrollY > 0) {
          setTimeout(() => {
            window.scrollTo({ top: scrollY, behavior: "instant" });
          }, 80);
        }
      }
    }
  }, [loading, products.length]);

  // Persist selectedCategories & sortOption to URL and sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      sessionStorage.setItem("artiory_selected_categories", JSON.stringify(selectedCategories));
      sessionStorage.setItem("artiory_sort_option", sortOption);

      const params = new URLSearchParams(window.location.search);
      if (selectedCategories.length > 0) {
        params.set("categories", selectedCategories.join(","));
        params.delete("category");
      } else {
        params.delete("categories");
        params.delete("category");
      }

      if (sortOption && sortOption !== "Default") {
        params.set("sort", sortOption);
      } else {
        params.delete("sort");
      }

      const queryStr = params.toString();
      const newUrl = queryStr ? `${window.location.pathname}?${queryStr}` : window.location.pathname;
      window.history.replaceState(null, "", newUrl);
    } catch {}
  }, [selectedCategories, sortOption]);

  const { cartItems, dispatch } = useCart();
  const { wishlistDispatch, wishlistState } = useWishlist();

  const handleAddToCart = (p: Product) => {
    dispatch({ type: "ADD_ITEM", payload: { id: String(p.id), name: p.name, price: p.price, image: p.image, quantity: 1, stock: p.stockQuantity ?? p.stock } });
    toast.success(`${p.name} added to cart!`, { position: "bottom-right", autoClose: 800 });
  };

  const handleWishlist = (p: Product) => {
    const isIn = wishlistState.items.some((item) => item.id === String(p.id));
    if (isIn) {
      wishlistDispatch({ type: "REMOVE_FROM_WISHLIST", payload: { id: String(p.id) } });
      toast.info(`${p.name} removed from Wishlist!`, { position: "bottom-right", autoClose: 800 });
    } else {
      wishlistDispatch({ type: "ADD_TO_WISHLIST", payload: { id: String(p.id), name: p.name, price: p.price, image: p.image } });
      toast.success(`${p.name} added to Wishlist!`, { position: "bottom-right", autoClose: 800 });
    }
  };

  const handleProductNavigate = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("artiory_listing_scroll", window.scrollY.toString());
    }
  };

  const toggleGroup = (label: string) =>
    setOpenGroups((prev) => prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const isRemoving = prev.includes(cat);
      if (isRemoving) {
        const parentGroup = categoryGroups.find((g) => g.items.some((it) => it === cat) || g.label === cat);
        return prev.filter((c) => c !== cat && (parentGroup ? c !== parentGroup.label : true));
      } else {
        const next = [...prev, cat];
        const parentGroup = categoryGroups.find((g) => g.items.some((it) => it === cat));
        if (parentGroup && parentGroup.items.every((it) => next.includes(it))) {
          if (!next.includes(parentGroup.label)) {
            next.push(parentGroup.label);
          }
        }
        return next;
      }
    });
  };

  const shuffleList = <T,>(arr: T[]): T[] => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setOpenGroups([]);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("artiory_selected_categories");
      const params = new URLSearchParams(window.location.search);
      params.delete("categories");
      params.delete("category");
      params.delete("all");
      const queryStr = params.toString();
      const newUrl = queryStr ? `${window.location.pathname}?${queryStr}` : window.location.pathname;
      window.history.replaceState(null, "", newUrl);
    }
    setProducts((prev) => shuffleList(prev));
  };

  const handleAllProducts = () => {
    setSelectedCategories([]);
    setOpenGroups([]);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("artiory_selected_categories");
      const params = new URLSearchParams(window.location.search);
      params.delete("categories");
      params.delete("category");
      params.delete("all");
      const queryStr = params.toString();
      const newUrl = queryStr ? `${window.location.pathname}?${queryStr}` : window.location.pathname;
      window.history.replaceState(null, "", newUrl);
    }
    setProducts((prev) => shuffleList(prev));
  };

  const normalizeForMatch = normalizeCategoryMatch;

  let filteredProducts = products.filter((p) => {
    // 0. Search Query Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const pName = (p.name || "").toLowerCase();
      const pCat = (p.category || "").toLowerCase();
      const pSub = (p.subCategory || "").toLowerCase();
      const pDesc = (p.shortDescription || p.description || "").toLowerCase();
      if (!pName.includes(q) && !pCat.includes(q) && !pSub.includes(q) && !pDesc.includes(q)) {
        return false;
      }
    }

    // 1. Category Filter
    if (selectedCategories.length === 0) return true;

    const pCat = normalizeForMatch(p.category);
    const pSub = normalizeForMatch(p.subCategory || "");
    const pName = normalizeForMatch(p.name || "");

    return selectedCategories.some((selCatStr) => {
      const selCat = normalizeForMatch(selCatStr);
      const directCategoryMatch = pCat === selCat || (pCat && selCat && (pCat.includes(selCat) || selCat.includes(pCat)));
      const directSubCategoryMatch = pSub === selCat || (pSub && selCat && (pSub.includes(selCat) || selCat.includes(pSub)));
      const nameMatch = selCat.length > 3 && pName.includes(selCat);

      const group = categoryGroups.find((g) => normalizeForMatch(g.label) === selCat);
      const groupMatch = group
        ? (
            pCat === selCat ||
            pCat.includes(selCat) ||
            group.items.some((item) => {
              const nItem = normalizeForMatch(item);
              return pSub === nItem || pSub.includes(nItem) || nItem.includes(pSub) || pName.includes(nItem);
            })
          )
        : false;

      return directCategoryMatch || directSubCategoryMatch || nameMatch || groupMatch;
    });
  });

  if (sortOption === "Price: Low to High") filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  else if (sortOption === "Price: High to Low") filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);

  const activeFilterCount = selectedCategories.filter(cat => !categoryGroups.some(g => g.label === cat)).length || selectedCategories.length;

  const SidebarFilters = () => (
    <>
      {/* Categories */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className={`${londrina.className} font-semibold text-[#2e306a] tracking-wide text-sm uppercase`}>Categories</h3>
        </div>
        <div className="p-3">
          <button
            className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-xl text-sm transition-all mb-1 cursor-pointer ${
              selectedCategories.length === 0 ? "bg-[#00b8a2] text-white font-medium shadow-sm" : "hover:bg-gray-50 text-gray-600"
            }`}
            onClick={handleAllProducts}
          >
             All Products
          </button>
          {categoryGroups.map((group) => (
            <div key={group.label}>
              {/* Category Group */}
              <button
                type="button"
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-[#2e306a] hover:bg-gray-50 rounded-xl transition-all cursor-pointer"
                onClick={() => toggleGroup(group.label)}
              >
                <span className="flex items-center gap-2">
                  {group.label}
                </span>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                    openGroups.includes(group.label) ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Categories */}
              {openGroups.includes(group.label) && (
                <div className="ml-4 mb-1 space-y-1 border-l-2 border-[#00b8a2]/20 pl-3">
                  {group.items.map((cat) => {
                    const isSelected = selectedCategories.includes(cat);

                    return (
                      <label
                        key={cat}
                        className={`flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-xs group transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#00b8a2]/10 text-[#00b8a2] font-medium"
                            : "text-gray-500 hover:text-[#2e306a] hover:bg-gray-50"
                        }`}
                      >
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCategory(cat)}
                          className="peer sr-only"
                        />

                        {/* Custom Checkbox */}
                        <span
                          className={`flex items-center justify-center w-4 h-4 rounded border transition-all duration-200 ${
                            isSelected
                              ? "bg-[#00b8a2] border-[#00b8a2]"
                              : "bg-white border-gray-300 group-hover:border-[#00b8a2]"
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 12l4 4L19 7"
                              />
                            </svg>
                          )}
                        </span>

                        {/* Category Name */}
                        <span className="flex-1">
                          {cat}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <button
          onClick={clearFilters}
          className="w-full py-2.5 text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          Clear All Filters ({activeFilterCount})
        </button>
      )}
    </>
  );

  return (
    <div className={`${londrina.className} font-light text-[#2e306a] bg-gray-50 min-h-screen pb-16`}>
      <ToastContainer />

      {/* Page Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <p className="text-xs text-gray-400 mb-1">
            <Link href="/" className="hover:text-[#00b8a2] transition">Home</Link> / All Products
          </p>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <h1 className={`${londrina.className} text-2xl sm:text-3xl font-bold text-[#2e306a]`}>
              {searchQuery ? `Search Results for "${searchQuery}"` : "Our Products"}
            </h1>
            {searchQuery && (
              <span className="text-xs text-gray-500 font-sans font-medium">
                Found {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-5 sm:py-7">
        <div className="flex gap-6 lg:gap-7">

          {/* Desktop Sidebar (Sticky on Screen) */}
          <aside className="hidden lg:flex flex-col gap-4 w-60 shrink-0 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 select-none self-start">
            <SidebarFilters />
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">

            {/* Toolbar (Sticky under Header) */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-100 shadow-xs px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between mb-4 sm:mb-5 gap-2 flex-wrap sticky top-16 sm:top-20 z-20">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Mobile filter trigger */}
                <button
                  className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-[#00b8a2]/10 border border-[#00b8a2]/30 text-[#00b8a2] rounded-full text-xs font-bold active:scale-95 transition"
                  onClick={() => setShowMobileFilter(true)}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="bg-[#00b8a2] text-white rounded-full w-4 h-4 text-[10px] font-black flex items-center justify-center ml-0.5">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Active search filter chip */}
                {searchQuery && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-[#00b8a2]/15 text-[#00b8a2] border border-[#00b8a2]/30 rounded-full text-xs font-bold shadow-2xs">
                    <span>Search: &ldquo;{searchQuery}&rdquo;</span>
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="hover:text-red-500 ml-0.5 cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}

                {/* Active filter chips */}
                {selectedCategories
                  .filter((cat) => {
                    const group = categoryGroups.find((g) => g.label === cat);
                    if (group && group.items.some((it) => selectedCategories.includes(it))) {
                      return false;
                    }
                    return true;
                  })
                  .map((cat) => (
                    <span key={cat} className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-semibold">
                      {cat}
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className="hover:text-red-500 ml-0.5 cursor-pointer"
                        title={`Remove ${cat}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
              </div>

              <select
                className="border border-gray-200 px-3 py-1.5 rounded-xl text-xs sm:text-sm text-gray-700 bg-white focus:outline-none focus:border-[#00b8a2] cursor-pointer shadow-xs ml-auto"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="Default">Sort: Featured</option>
                <option value="Price: Low to High">Price: Low → High</option>
                <option value="Price: High to Low">Price: High → Low</option>
              </select>
            </div>
            {/* Product Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-2.5 sm:gap-3 md:gap-3.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden bg-white">
                    <div className="aspect-square w-full bg-gray-100 animate-pulse" />
                    <div className="p-2 sm:p-2.5 flex flex-col gap-1.5">
                      <div className="h-2 w-14 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
                      <div className="h-3.5 w-16 bg-gray-200 rounded animate-pulse mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-3xl border border-gray-100 p-6 text-center">
                <PackageSearch className="w-14 h-14 mb-3 text-gray-300" />
                <p className="text-base font-bold text-gray-700">No products found matching filters</p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm">Try resetting filters to explore all available art supplies and stationery.</p>
                <button onClick={clearFilters} className="mt-4 px-5 py-2 bg-[#00b8a2] text-white rounded-full text-xs font-bold shadow-sm hover:scale-105 transition">
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-2.5 sm:gap-3 md:gap-3.5">
                {filteredProducts.map((p) => {
                  const isWishlisted = wishlistState.items.some((item) => item.id === String(p.id));
                  const discount = p.oldPrice ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : null;
                  const displayCategory = p.category === "ArtsCraft" || normalizeForMatch(p.category) === "artcraft" 
                    ? "Art & Craft" 
                    : p.category;
                  return (
                    <div key={p.id} className="group bg-white rounded-xl sm:rounded-2xl border border-gray-100/90 shadow-2xs hover:shadow-md hover:border-[#00b8a2]/30 transition-all duration-200 overflow-hidden flex flex-col justify-between relative">
                      {/* Image Box */}
                      <Link
                        href={`/product/${p.id}`}
                        onClick={handleProductNavigate}
                        className="relative block aspect-square bg-white overflow-hidden"
                      >
                        {/* Badges */}
                        <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1">
                          {p.isSale && (
                            <span className="bg-rose-500 text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs">SALE</span>
                          )}
                          {discount !== null && discount > 0 && (
                            <span className="bg-[#00b8a2] text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs">-{discount}%</span>
                          )}
                        </div>

                        {/* Wishlist Button */}
                        <button
                          className="absolute top-1.5 right-1.5 z-10 w-6 h-6 sm:w-7 sm:h-7 bg-white/90 backdrop-blur-xs rounded-full shadow-xs border border-gray-100 flex items-center justify-center hover:scale-110 active:scale-95 transition"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleWishlist(p); }}
                          aria-label="Add to Wishlist"
                        >
                          <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isWishlisted ? "fill-[#00b8a2] text-[#00b8a2]" : "text-gray-400"}`} />
                        </button>

                        {/* Primary Image */}
                        <img
                          src={p.image || (p.images && p.images[0]) || "/product/placeholder.svg"}
                          alt={p.name}
                          className={`h-full w-full object-cover object-center transition-opacity duration-300 ${
                            p.images && p.images.length > 1 && p.images[1] && p.images[1] !== (p.image || p.images[0])
                              ? "group-hover:opacity-0"
                              : ""
                          }`}
                          loading="lazy"
                        />

                        {/* Secondary Image on Hover */}
                        {p.images && p.images.length > 1 && p.images[1] && p.images[1] !== (p.image || p.images[0]) && (
                          <img
                            src={p.images[1]}
                            alt={`${p.name} - view 2`}
                            className="absolute inset-0 h-full w-full object-cover object-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                            loading="lazy"
                          />
                        )}
                      </Link>

                      {/* Card Body */}
                      <div className="p-2 sm:p-2.5 flex flex-col justify-between flex-1 gap-1">
                        <div>
                          <span className="text-[9px] sm:text-[9.5px] text-[#00b8a2] font-black uppercase tracking-wider block truncate">
                            {displayCategory}{p.subCategory ? ` · ${p.subCategory}` : ""}
                          </span>
                          <Link href={`/product/${p.id}`} onClick={handleProductNavigate}>
                            <h3 className="text-[11px] sm:text-xs font-bold text-[#2e306a] leading-tight line-clamp-1 hover:text-[#00b8a2] transition-colors mt-0.5" title={p.name}>
                              {p.name}
                            </h3>
                          </Link>
                        </div>

                        {/* Price & Action Row */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 mt-1 gap-1">
                          <div className="flex items-baseline gap-1">
                            <span className={`${londrina.className} text-sm sm:text-base font-bold text-[#00b8a2]`}>₹{p.price}</span>
                            {p.oldPrice && p.oldPrice > p.price ? (
                              <span className={`${londrina.className} text-[10px] sm:text-xs text-gray-400 line-through`}>₹{p.oldPrice}</span>
                            ) : null}
                          </div>

                          {(() => {
                            const cartItem = cartItems.find((item) => item.id === String(p.id));
                            return cartItem ? (
                              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5 shadow-xs">
                                <button
                                  onClick={() => {
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
                                  className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-gray-700 hover:text-red-500 hover:bg-gray-100 rounded text-xs font-black transition-colors"
                                >
                                  -
                                </button>
                                <span className="w-5 sm:w-6 text-center font-black text-[11px] text-[#2e306a]">
                                  {cartItem.quantity}
                                </span>
                                <button
                                  onClick={() => {
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
                                  className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-gray-700 hover:text-[#00b8a2] hover:bg-gray-100 disabled:opacity-30 rounded text-xs font-black transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAddToCart(p)}
                                className="px-2 sm:px-2.5 py-1 bg-[#00b8a2]/10 hover:bg-[#00b8a2] text-[#00b8a2] hover:text-white rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-1 transition-all duration-200 cursor-pointer"
                              >
                                <ShoppingCart className="w-3 h-3" />
                                <span>Add</span>
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer / Bottom Sheet */}
      {showMobileFilter && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowMobileFilter(false)} />
          <div className="relative ml-auto w-[85%] max-w-sm bg-gray-50 h-full overflow-y-auto flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
              <h3 className={`${londrina.className} font-bold text-[#2e306a] text-lg`}>Filter Products</h3>
              <button onClick={() => setShowMobileFilter(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 flex flex-col gap-4">
              <SidebarFilters />
            </div>
            <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0 z-10">
              <button
                onClick={() => setShowMobileFilter(false)}
                className="w-full py-3 bg-[#00b8a2] hover:bg-[#009e8c] text-white font-bold rounded-2xl text-sm shadow-md transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductListPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00b8a2] border-t-transparent"></div>
      </div>
    }>
      <ProductListContent />
    </Suspense>
  );
}
