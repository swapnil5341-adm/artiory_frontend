"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Londrina_Solid } from "next/font/google";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  MapPin,
  AlertCircle,
  Copy,
  Check,
  History,
} from "lucide-react";

const londrina = Londrina_Solid({
  weight: ["100", "300", "400", "900"],
  subsets: ["latin"],
  display: "swap",
});

interface OrderSummary {
  _id: string;
  status: string;
  totalPrice: number;
  shipmentStatus?: string;
  courierName?: string;
  awbNumber?: string;
  logisticsOrderId?: string;
  createdAt: string;
  shippingAddress?: {
    name?: string;
    city?: string;
    state?: string;
    phone?: string;
  };
  orderItems?: Array<{
    name: string;
    qty: number;
    price: number;
    productId?: any;
  }>;
}

function TrackOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlOrderId = searchParams.get("orderId") || searchParams.get("id") || "";
  const isPaymentSuccess = searchParams.get("payment") === "success";

  const [query, setQuery] = useState(urlOrderId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<OrderSummary[] | null>(null);
  const [recentOrderIds, setRecentOrderIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load recent guest orders saved on this browser
  useEffect(() => {
    try {
      const stored = localStorage.getItem("artiory_guest_orders");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecentOrderIds(parsed.slice(0, 5));
        }
      }
    } catch {}
  }, []);

  // Automatically track if orderId was passed in URL (e.g. from payment callback)
  useEffect(() => {
    if (urlOrderId) {
      setQuery(urlOrderId);
      handleTrack(urlOrderId);

      try {
        const stored = localStorage.getItem("artiory_guest_orders");
        const existing = stored ? JSON.parse(stored) : [];
        const updated = [urlOrderId, ...existing.filter((id: string) => id !== urlOrderId)].slice(0, 10);
        localStorage.setItem("artiory_guest_orders", JSON.stringify(updated));
        setRecentOrderIds(updated.slice(0, 5));
      } catch (e) {
        console.error("Local order save notice:", e);
      }
    }
  }, [urlOrderId]);

  const handleTrack = async (searchQuery?: string) => {
    const q = (searchQuery || query).trim();
    if (!q) {
      setError("Please enter your Order ID, Mobile Number, or Email address.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "No orders found matching your search.");
      }

      setResults(json.data || []);
      // If exactly 1 order and it was a direct ID search, user can see it right here or click to open full details
    } catch (err: any) {
      console.error("Track order error:", err);
      setError(err.message || "Unable to find order details. Please check your information and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusColor = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "delivered") return "bg-emerald-100 text-emerald-800 border-emerald-300";
    if (s === "shipped" || s === "in-transit") return "bg-blue-100 text-blue-800 border-blue-300";
    if (s === "paid") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "pending") return "bg-amber-100 text-amber-800 border-amber-300";
    return "bg-slate-100 text-slate-700 border-slate-300";
  };

  return (
    <main className="min-h-screen bg-slate-50/70 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#2e306a]/10 text-[#2e306a] mb-1">
            <Truck size={36} className="text-[#2e306a]" />
          </div>
          <h1 className={`${londrina.className} text-4xl sm:text-5xl font-bold text-[#2e306a] tracking-tight`}>
            Track Your Order
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Check live delivery status, courier tracking, and complete order details without needing to sign in.
          </p>
        </div>

        {/* Payment Success Banner */}
        {isPaymentSuccess && (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-6 text-emerald-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 text-2xl font-bold shadow-xs">
              ✓
            </div>
            <div className="space-y-1 flex-1">
              <h3 className={`${londrina.className} text-2xl font-bold text-emerald-800 tracking-wide`}>
                Order Placed Successfully!
              </h3>
              <p className="text-xs sm:text-sm text-emerald-700 leading-relaxed">
                Thank you! Your payment is confirmed and your order has been registered. You can track live delivery milestones and courier updates below using your Order ID.
              </p>
            </div>
          </div>
        )}

        {/* Search Input Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTrack();
            }}
            className="space-y-4"
          >
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Enter Order ID, 10-Digit Mobile Number, or Email
            </label>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. #35468, 9820136133, ORD-506E4938, or email"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-[#2e306a] focus:outline-none text-sm text-slate-800 transition shadow-inner font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-[#2e306a] hover:bg-[#1f2048] disabled:opacity-60 text-white font-bold px-8 py-3.5 rounded-2xl text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0 active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>Track Order</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 font-medium">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                <span>{error}</span>
              </div>
            )}
          </form>

          {/* Quick Shortcuts from LocalStorage */}
          {recentOrderIds.length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2.5">
                <History size={14} />
                <span>Recent orders placed on this device:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentOrderIds.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setQuery(id);
                      handleTrack(id);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-mono font-semibold transition cursor-pointer"
                  >
                    <span>#ORD-{id.slice(-8).toUpperCase()}</span>
                    <ArrowRight size={12} className="text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        {results && results.length > 0 && (
          <div className="space-y-4">
            <h2 className={`${londrina.className} text-2xl text-[#2e306a] font-bold`}>
              Found {results.length} {results.length === 1 ? "Order" : "Orders"}
            </h2>

            <div className="space-y-4">
              {results.map((ord) => {
                const shortId = ord._id.slice(-8).toUpperCase();
                const itemCount = (ord.orderItems || []).reduce((sum, it) => sum + (it.qty || 1), 0);
                const firstItemName = ord.orderItems?.[0]?.name || "Product";
                const remainingCount = (ord.orderItems?.length || 0) - 1;

                return (
                  <div
                    key={ord._id}
                    className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm hover:shadow-md transition space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-black text-lg text-slate-900">
                          #ORD-{shortId}
                        </span>
                        {ord.logisticsOrderId && ord.logisticsOrderId !== "N/A" && (
                          <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-mono font-bold border border-slate-200">
                            iThink ID: #{ord.logisticsOrderId}
                          </span>
                        )}
                        <button
                          onClick={(e) => handleCopyId(ord._id, e)}
                          title="Copy Full ID"
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                        >
                          {copiedId === ord._id ? (
                            <Check size={14} className="text-emerald-600" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>

                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${getStatusColor(
                          ord.shipmentStatus || ord.status
                        )}`}
                      >
                        {ord.shipmentStatus || ord.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 block font-medium">Order Date:</span>
                        <span className="font-semibold text-slate-800">
                          {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Total Amount:</span>
                        <span className="font-black text-slate-900 text-sm">₹{ord.totalPrice}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Delivering to:</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {ord.shippingAddress?.city
                            ? `${ord.shippingAddress?.city}, ${ord.shippingAddress?.state || ""}`
                            : ord.shippingAddress?.name || "Customer"}
                        </span>
                      </div>
                    </div>

                    {/* Items snippet */}
                    <div className="bg-slate-50 rounded-2xl p-3.5 flex items-center justify-between text-xs text-slate-700">
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-slate-400 shrink-0" />
                        <span className="font-medium truncate max-w-xs">
                          {firstItemName}
                          {remainingCount > 0 && ` + ${remainingCount} more item(s)`}
                        </span>
                      </div>
                      <span className="font-bold text-slate-500 shrink-0">
                        {itemCount} {itemCount === 1 ? "item" : "items"}
                      </span>
                    </div>

                    {/* Courier / AWB info if available */}
                    {ord.awbNumber && (
                      <div className="text-xs flex items-center gap-2 text-slate-600 bg-blue-50/60 border border-blue-100 rounded-xl p-2.5">
                        <Truck size={15} className="text-blue-600 shrink-0" />
                        <span>
                          Shipped via <b>{ord.courierName || "Courier"}</b> • AWB:{" "}
                          <span className="font-mono font-bold text-slate-900">{ord.awbNumber}</span>
                        </span>
                      </div>
                    )}

                    {/* Action Button */}
                    <Link
                      href={`/orders/${ord._id}`}
                      className="w-full bg-[#1e1e4d] hover:bg-[#2e306a] text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.99]"
                    >
                      <span>View Complete Order Details & Live Tracking</span>
                      <ExternalLink size={15} />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Helpful Tips Card */}
        <div className="bg-white/80 rounded-3xl p-6 border border-slate-200 text-xs text-slate-600 space-y-3 shadow-xs">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span>ℹ️</span>
            <span>How Guest Order Tracking Works</span>
          </h3>
          <ul className="space-y-1.5 list-disc list-inside text-slate-600 leading-relaxed">
            <li>
              <b>Direct Receipt:</b> Whenever an order is placed, you are automatically shown your order confirmation receipt with live tracking.
            </li>
            <li>
              <b>Track Anytime:</b> You can search using your <b>Order ID</b> or the <b>10-digit mobile number</b> entered during checkout.
            </li>
            <li>
              <b>Tax Invoice:</b> You can download your official PDF invoice anytime from the order details page.
            </li>
            <li>
              <b>Google Account Linking:</b> If you ever sign in with Google using the same email address, all past guest orders will automatically show up in your profile.
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#2e306a] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Order Tracker...</p>
          </div>
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
