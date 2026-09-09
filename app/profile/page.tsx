"use client";

import React, { Suspense, useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  MapPin,
  Heart,
  Settings,
  Clock,
  CheckCircle2,
  Truck,
  FileText,
  ExternalLink,
  RefreshCw,
  ShoppingBag,
  User as UserIcon,
  Mail,
  Calendar,
  X,
  Tag,
  ShieldCheck,
  Check,
  AlertCircle,
  Copy,
  Search,
  ArrowRight,
  ChevronRight,
  Download,
  HelpCircle,
  RotateCcw,
  ReceiptText,
  CreditCard,
  Phone,
  Plus,
  Edit3,
  Trash2
} from "lucide-react";
import { useWishlist } from "@/app/context/whishlist/WishlistContext";
import { useCart } from "@/app/context/cart/Cartcontext";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com").replace(/\/+$/, "");

interface ProductDetails {
  _id?: string;
  productName?: string;
  skuCode?: string;
  thumbnail?: string;
  images?: string[];
  sellingPrice?: number;
  mrp?: number;
  weight?: number;
  category?: string;
}

interface OrderItem {
  name: string;
  qty: number;
  price: number;
  image?: string;
  sku?: string;
  skuCode?: string;
  productId?: string | ProductDetails;
}

interface ShippingAddress {
  name?: string;
  home?: string;
  street?: string;
  address?: string;
  landmark?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
}

interface Order {
  _id: string;
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
  totalPrice: number;
  shippingCharge?: number;
  discountAmount?: number;
  status: "Pending" | "Paid" | "Shipped" | "Delivered" | "Cancelled" | "Failed";
  shipmentStatus?: string;
  awbNumber?: string;
  courierName?: string;
  clientTxnId?: string;
  createdAt: string;
}

function ProfileContent() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "orders";
  const highlightedOrderId = searchParams.get("highlight") || "";
  const paymentSuccess = searchParams.get("payment") === "success" || !!highlightedOrderId;

  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "wishlist" | "settings">(
    (initialTab as any) || "orders"
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState<"all" | "paid" | "shipped" | "delivered">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [reconcilingId, setReconcilingId] = useState<string | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(paymentSuccess);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Tracking Modal State
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);

  // Address State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);

  const { wishlistState } = useWishlist();
  const { cartItems } = useCart();

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com";

  // Fetch Orders
  const fetchOrders = async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.data || [];
        const confirmedOrders = list.filter((o: any) => o.status === "Paid" || o.status === "Shipped" || o.status === "Delivered" || o.status === "In-Transit");
        setOrders(confirmedOrders);
      } else {
        setOrdersError("Unable to load orders. Please try again.");
      }
    } catch (err: any) {
      setOrdersError(err.message || "Network error loading orders.");
    } finally {
      setOrdersLoading(false);
    }
  };

  // Fetch Addresses
  const fetchAddresses = async () => {
    setAddressesLoading(true);
    try {
      const res = await fetch("/api/address");
      if (res.ok) {
        const data = await res.json();
        setAddresses(Array.isArray(data.data) ? data.data : []);
      }
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    } finally {
      setAddressesLoading(false);
    }
  };

  // Address Modal State for Add & Edit
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressSubmitting, setAddressSubmitting] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [addressForm, setAddressForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    alternatePhone: "",
    email: "",
    home: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    postalCode: "",
    type: "Home",
  });

  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressError("");
    setAddressForm({
      firstName: (session?.user?.name || "").split(" ")[0] || "",
      lastName: (session?.user?.name || "").split(" ").slice(1).join(" ") || "",
      phone: (session?.user as any)?.number || "",
      alternatePhone: "",
      email: session?.user?.email || "",
      home: "",
      street: "",
      landmark: "",
      city: "",
      state: "",
      postalCode: "",
      type: "Home",
    });
    setAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: any) => {
    setEditingAddressId(addr._id);
    setAddressError("");
    setAddressForm({
      firstName: addr.firstName || "",
      lastName: addr.lastName || "",
      phone: addr.phone || "",
      alternatePhone: addr.alternatePhone || "",
      email: addr.email || "",
      home: addr.home || "",
      street: addr.street || addr.address || "",
      landmark: addr.landmark || "",
      city: addr.city || "",
      state: addr.state || "",
      postalCode: addr.postalCode || "",
      type: addr.type || "Home",
    });
    setAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError("");

    if (
      !addressForm.lastName.trim() ||
      !addressForm.phone.trim() ||
      !addressForm.home.trim() ||
      !addressForm.street.trim() ||
      !addressForm.city.trim() ||
      !addressForm.state.trim() ||
      !addressForm.postalCode.trim()
    ) {
      setAddressError("Please fill in all required fields marked with *.");
      return;
    }

    if (addressForm.phone.replace(/\D/g, "").length < 10) {
      setAddressError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (addressForm.postalCode.replace(/\D/g, "").length !== 6) {
      setAddressError("Please enter a valid 6-digit PIN code.");
      return;
    }

    setAddressSubmitting(true);
    try {
      const url = editingAddressId ? `/api/address/${editingAddressId}` : "/api/address";
      const method = editingAddressId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addressForm,
          postalCode: addressForm.postalCode.replace(/\D/g, ""),
          phone: addressForm.phone.replace(/\D/g, "").slice(-10),
          alternatePhone: addressForm.alternatePhone ? addressForm.alternatePhone.replace(/\D/g, "").slice(-10) : "",
          country: "India",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAddressModalOpen(false);
        fetchAddresses();
      } else {
        setAddressError(data.message || data.error || "Failed to save address.");
      }
    } catch (err: any) {
      setAddressError(err.message || "Failed to save address.");
    } finally {
      setAddressSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      const res = await fetch(`/api/address/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchAddresses();
      } else {
        alert("Failed to delete address.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting address.");
    }
  };

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/profile");
    } else if (authStatus === "authenticated") {
      fetchOrders();
      fetchAddresses();
    }
  }, [authStatus, router]);

  // Copy Order ID
  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Live Tracking
  const handleOpenTracking = async (order: Order) => {
    setTrackingOrder(order);
    setTrackingLoading(true);
    setTrackingData(null);
    try {
      const awb = order.awbNumber || order._id;
      const res = await fetch(`${API_BASE}/api/logistics/order/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ awb_number_list: awb }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const keys = Object.keys(json.data);
        setTrackingData(json.data[keys[0]] || null);
      }
    } catch (err) {
      console.error("Failed to fetch tracking data:", err);
    } finally {
      setTrackingLoading(false);
    }
  };

  // Open Customer Invoice
  const handleDownloadInvoice = async (order: Order) => {
    try {
      const awb = order.awbNumber || order._id;
      const res = await fetch(`${API_BASE}/api/logistics/shipping/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ awbNumber: awb, orderId: order._id }),
      });
      const json = await res.json();
      if (json.success && json.invoice_url) {
        window.open(json.invoice_url, "_blank");
      } else {
        window.open(`${API_BASE}/api/logistics/orders/${order._id}/invoice-html`, "_blank");
      }
    } catch (err) {
      window.open(`${API_BASE}/api/logistics/orders/${order._id}/invoice-html`, "_blank");
    }
  };

  // Reconcile Pending Order
  const handleReconcileOrder = async (orderId: string, txnId?: string) => {
    setReconcilingId(orderId);
    try {
      const res = await fetch(`${API_BASE}/api/payment/sabpaisa/enquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, merchantTxnId: txnId || orderId }),
      });
      const data = await res.json();
      if (data.success && (data.isPaid || data.status === "SUCCESS" || data.status === "TXN_SUCCESS")) {
        await fetchOrders();
      } else {
        alert(data.message || "Payment is still processing on SabPaisa.");
      }
    } catch (err: any) {
      alert(err.message || "Status check failed");
    } finally {
      setReconcilingId(null);
    }
  };

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Tab filter
      if (orderFilter === "paid") {
        const isP = o.status === "Paid" || o.status === "Shipped" || o.status === "Delivered";
        if (!isP) return false;
      }
      if (orderFilter === "shipped") {
        const isS = o.status === "Shipped" || o.shipmentStatus === "In-Transit" || !!o.awbNumber;
        if (!isS) return false;
      }
      if (orderFilter === "delivered") {
        if (o.status !== "Delivered") return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = o._id.toLowerCase().includes(q);
        const matchAwb = o.awbNumber?.toLowerCase().includes(q);
        const matchItems = o.orderItems.some((item) => {
          const nameMatch = item.name?.toLowerCase().includes(q);
          const skuMatch =
            item.sku?.toLowerCase().includes(q) ||
            item.skuCode?.toLowerCase().includes(q) ||
            (typeof item.productId === "object" && item.productId?.skuCode?.toLowerCase().includes(q));
          return nameMatch || skuMatch;
        });
        return matchId || matchAwb || matchItems;
      }

      return true;
    });
  }, [orders, orderFilter, searchQuery]);

  if (authStatus === "loading") {
    return (
      <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-medium text-xs">Loading account profile...</p>
        </div>
      </div>
    );
  }

  if (authStatus === "unauthenticated" || (!session && authStatus !== "loading")) {
    return (
      <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-lg space-y-6">
          <div className="w-16 h-16 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <UserIcon size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Sign In to Your Account</h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Log in with your Google account to view your order history, track live shipments, and manage saved delivery addresses.
            </p>
          </div>
          <Link
            href="/auth/signin?callbackUrl=/profile"
            className="w-full flex items-center justify-center gap-3 bg-[#2e306a] hover:bg-[#232455] text-white py-3.5 px-6 rounded-2xl font-bold text-sm shadow-md transition hover:scale-[1.02]"
          >
            <UserIcon size={18} />
            <span>Sign In to Continue</span>
          </Link>
          <div className="pt-2 border-t border-slate-100">
            <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 font-medium">
              ← Return to Home Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const user = session?.user;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-20">
      {/* Top Header / Account Overview Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl font-bold shadow-xs overflow-hidden flex-shrink-0">
                {user?.image ? (
                  <Image src={user.image} alt={user?.name || "User"} width={64} height={64} className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.name?.charAt(0)?.toUpperCase() || "A"}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">{user?.name || "Customer Account"}</h1>
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <Mail size={13} className="text-slate-400" /> {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/listing"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition"
              >
                <ShoppingBag size={14} /> Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Payment Confirmation Alert */}
        {showSuccessBanner && (
          <div className="mb-6 bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                <Check size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950">
                  Payment Confirmed & Order Placed
                </h3>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Your order has been verified and processed. Tracking and invoice details are available below.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSuccessBanner(false)}
              className="p-1 text-emerald-700 hover:bg-emerald-100 rounded-lg transition"
              aria-label="Dismiss alert"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar Navigation */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs space-y-1">
              <button
                onClick={() => setActiveTab("orders")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === "orders"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Package size={16} />
                  <span>Orders</span>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-md ${activeTab === "orders" ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"}`}>
                  {orders.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === "settings"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings size={16} />
                  <span>Account Settings</span>
                </div>
              </button>
            </div>

            {/* Assistance Card */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                <HelpCircle size={15} className="text-slate-500" />
                <span>Need Assistance?</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Have questions about your order, tracking, or tax invoice?
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-900 hover:underline pt-1"
              >
                Contact Support <ChevronRight size={12} />
              </Link>
            </div>
          </div>

          {/* Right Main Panel */}
          <div className="lg:col-span-3">
            
            {/* TAB 1: ORDERS */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                
                {/* Search & Filter Header */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Orders & Invoices</h2>
                      <p className="text-xs text-slate-500">Track shipments, download tax invoices, and inspect order details</p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      {[
                        { key: "all", label: "All" },
                        { key: "paid", label: "Paid" },
                        { key: "shipped", label: "In Transit" },
                        { key: "delivered", label: "Delivered" },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setOrderFilter(tab.key as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            orderFilter === tab.key
                              ? "bg-white text-slate-900 shadow-xs font-bold"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search Input Bar */}
                  <div className="relative">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by Order ID, Product name, or SKU..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Orders Content List */}
                {ordersLoading ? (
                  <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-xs space-y-3">
                    <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">Fetching orders...</p>
                  </div>
                ) : ordersError ? (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-2xl text-center text-xs space-y-2">
                    <p className="font-semibold">{ordersError}</p>
                    <button
                      onClick={fetchOrders}
                      className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition"
                    >
                      Retry
                    </button>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-xs space-y-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto">
                      <Package size={28} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900">No Orders Found</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        {searchQuery ? "No orders matched your search criteria." : "You do not have any orders in this category yet."}
                      </p>
                    </div>
                    {searchQuery ? (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition"
                      >
                        Clear Search
                      </button>
                    ) : (
                      <Link
                        href="/listing"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition"
                      >
                        Start Shopping <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredOrders.map((order) => {
                      const isHighlighted = highlightedOrderId && (order._id === highlightedOrderId || order._id.includes(highlightedOrderId));
                      const isPaid = order.status === "Paid" || order.status === "Delivered" || order.status === "Shipped";
                      const isShipped = order.status === "Shipped" || order.shipmentStatus === "Shipped" || order.shipmentStatus === "In-Transit" || !!order.awbNumber;
                      const formattedDate = order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Recent";
                      const shortId = order._id.slice(-8).toUpperCase();

                      return (
                        <div
                          key={order._id}
                          className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs overflow-hidden ${
                            isHighlighted
                              ? "border-emerald-500 ring-2 ring-emerald-100"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {/* Order Header Bar */}
                          <div className="bg-slate-100/80 px-5 py-4 border-b-2 border-slate-200 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white border-2 border-slate-300 flex items-center justify-center text-slate-950 shadow-xs">
                                <Package size={20} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/orders/${order._id}`}
                                    className="font-mono text-sm font-black text-slate-950 hover:text-[#00b8a2] hover:underline transition flex items-center gap-1 group"
                                  >
                                    <span>#ORD-{shortId}</span>
                                    <ExternalLink size={13} className="opacity-0 group-hover:opacity-100 transition text-slate-500" />
                                  </Link>
                                  <button
                                    onClick={() => handleCopy(order._id)}
                                    className="text-slate-700 hover:text-slate-950 transition"
                                    title="Copy Full Order ID"
                                  >
                                    {copiedId === order._id ? <Check size={14} className="text-emerald-700" /> : <Copy size={14} />}
                                  </button>
                                  {isHighlighted && (
                                    <span className="text-xs bg-emerald-200 text-emerald-950 font-black px-2.5 py-0.5 rounded border border-emerald-400">
                                      New Order
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-800 font-semibold mt-0.5 flex items-center gap-1.5">
                                  <Calendar size={13} className="text-slate-700" /> Placed on {formattedDate}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Status Badge */}
                              {isPaid ? (
                                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-bold rounded-full">
                                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                                  Paid & Confirmed
                                </span>
                              ) : order.status === "Pending" ? (
                                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-amber-100 border border-amber-300 text-amber-950 text-xs font-bold rounded-full">
                                  <Clock size={13} />
                                  Payment Pending
                                </span>
                              ) : (
                                <span className="px-3.5 py-1 bg-rose-100 border border-rose-300 text-rose-950 text-xs font-bold rounded-full">
                                  {order.status}
                                </span>
                              )}

                              {isShipped && (
                                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-blue-100 border border-blue-300 text-blue-950 text-xs font-bold rounded-full">
                                  <Truck size={13} />
                                  {order.shipmentStatus || "In Transit"}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Order Products List */}
                          <div className="p-5 space-y-4">
                            <div className="space-y-3">
                              {order.orderItems.map((item, idx) => {
                                const productObj = typeof item.productId === "object" ? (item.productId as ProductDetails) : null;
                                const itemImage = item.image || productObj?.thumbnail || productObj?.images?.[0] || "";
                                const itemName = item.name || productObj?.productName || "Handcrafted Product";
                                const itemSku = productObj?.skuCode || (item as any)?.sku || (item as any)?.skuCode || `SKU-${shortId}`;
                                const itemPrice = item.price || productObj?.sellingPrice || 0;
                                const itemQty = item.qty || 1;
                                const itemTotal = itemPrice * itemQty;
                                const prodId = productObj?._id || (typeof item.productId === "string" ? item.productId : "");

                                return (
                                  <div
                                    key={idx}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 border-2 border-slate-200 rounded-xl transition"
                                  >
                                    <div className="flex items-center gap-4">
                                      {/* Thumbnail */}
                                      <div className="w-16 h-16 rounded-xl bg-white border-2 border-slate-300 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-xs">
                                        {itemImage ? (
                                          <Image
                                            src={itemImage}
                                            alt={itemName}
                                            width={64}
                                            height={64}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <Package size={24} className="text-slate-400" />
                                        )}
                                      </div>

                                      {/* Title & Metadata */}
                                      <div className="space-y-1.5">
                                        {prodId ? (
                                          <Link
                                            href={`/product/${prodId}`}
                                            className="font-bold text-slate-950 text-sm hover:underline transition line-clamp-1 flex items-center gap-1.5 group"
                                          >
                                            {itemName}
                                            <ExternalLink size={13} className="opacity-0 group-hover:opacity-100 text-slate-700 transition" />
                                          </Link>
                                        ) : (
                                          <p className="font-bold text-slate-950 text-sm line-clamp-1">{itemName}</p>
                                        )}

                                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-800 font-semibold">
                                          <span className="bg-white border border-slate-300 text-slate-900 px-2.5 py-0.5 rounded font-mono text-xs font-bold">
                                            SKU: {itemSku}
                                          </span>
                                          <span className="bg-slate-200 text-slate-950 px-2.5 py-0.5 rounded text-xs font-black">
                                            Qty: {itemQty}
                                          </span>
                                          <span className="text-slate-800 font-bold">
                                            ₹{itemPrice.toLocaleString("en-IN")} each
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Line Item Subtotal */}
                                    <div className="sm:text-right flex sm:flex-col justify-between items-center sm:items-end">
                                      <span className="text-xs text-slate-800 uppercase font-black tracking-wider">Subtotal</span>
                                      <span className="font-black text-slate-950 text-base font-mono">
                                        ₹{itemTotal.toLocaleString("en-IN")}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* 2-Column Summary Grid: Shipping Address & Financial Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t-2 border-slate-200">
                              
                              {/* Left Column: Shipping Address & AWB */}
                              <div className="bg-slate-50 rounded-xl p-4 border-2 border-slate-300 space-y-2 text-xs text-slate-800 shadow-xs">
                                <div className="flex items-center gap-1.5 text-slate-950 font-black text-xs uppercase tracking-wider">
                                  <MapPin size={15} className="text-slate-900" />
                                  <span>Shipping Details</span>
                                </div>
                                <p className="font-black text-slate-950 text-sm pt-0.5">
                                  {order.shippingAddress?.name || "Customer Name"}
                                </p>
                                <p className="text-slate-800 text-xs font-semibold leading-relaxed">
                                  {[
                                    order.shippingAddress?.home,
                                    order.shippingAddress?.street,
                                    order.shippingAddress?.city,
                                    order.shippingAddress?.state,
                                    order.shippingAddress?.postalCode
                                  ].filter(Boolean).join(", ")}
                                </p>
                                {order.shippingAddress?.phone && (
                                  <p className="text-slate-900 font-bold font-mono text-xs">
                                    Phone: {order.shippingAddress.phone}
                                  </p>
                                )}
                                {order.awbNumber && (
                                  <div className="pt-2 flex items-center gap-2 border-t border-slate-200">
                                    <span className="text-xs font-bold text-slate-800">Tracking AWB:</span>
                                    <span className="font-mono text-xs bg-white border border-slate-300 px-2.5 py-0.5 rounded font-black text-slate-950">
                                      {order.awbNumber}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Right Column: Payment Details & Amount Paid */}
                              <div className="bg-slate-50 rounded-xl p-4 border-2 border-slate-300 space-y-2.5 text-xs shadow-xs">
                                <div className="flex items-center gap-1.5 text-slate-950 font-black text-xs uppercase tracking-wider">
                                  <ReceiptText size={15} className="text-slate-900" />
                                  <span>Payment Summary</span>
                                </div>

                                <div className="space-y-1.5 text-xs text-slate-800 font-semibold">
                                  <div className="flex justify-between">
                                    <span>Items Subtotal:</span>
                                    <span className="font-bold text-slate-950 font-mono">
                                      ₹{((order.orderItems || []).reduce((acc: number, it: any) => acc + ((it.price || 0) * (it.qty || 1)), 0) || Math.max(0, order.totalPrice - (order.shippingCharge ?? 149))).toLocaleString("en-IN")}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Shipping Charges (Flat Rate):</span>
                                    <span className="font-bold text-slate-950 font-mono">
                                      ₹{Number(order.shippingCharge !== undefined && order.shippingCharge !== null ? order.shippingCharge : 149).toFixed(2)}
                                    </span>
                                  </div>
                                  {order.discountAmount ? (
                                    <div className="flex justify-between text-emerald-700 font-bold">
                                      <span>Discount Applied:</span>
                                      <span className="font-mono">-₹{order.discountAmount.toLocaleString("en-IN")}</span>
                                    </div>
                                  ) : null}
                                  <div className="flex justify-between">
                                    <span>GST & Taxes:</span>
                                    <span className="font-bold text-slate-950">Inclusive (18%)</span>
                                  </div>
                                </div>

                                <div className="pt-2 border-t-2 border-slate-200 flex justify-between items-baseline">
                                  <span className="font-black text-slate-950 text-xs uppercase tracking-wider">Total Amount Paid</span>
                                  <span className="font-black text-slate-950 text-lg font-mono">
                                    ₹{order.totalPrice.toLocaleString("en-IN")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Toolbar */}
                          <div className="bg-slate-100 px-5 py-4 border-t-2 border-slate-200 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-xs text-slate-800 font-bold flex items-center gap-1.5">
                              <ShieldCheck size={16} className="text-emerald-700" />
                              <span>Protected by Artiory Authentic Guarantee</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5">
                              <Link
                                href={`/orders/${order._id}`}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2e306a] hover:bg-[#1e1e4d] text-white rounded-xl text-xs font-black transition shadow-xs group"
                              >
                                <span>Order Details</span>
                                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                              </Link>

                              {order.status === "Pending" && (
                                <button
                                  onClick={() => handleReconcileOrder(order._id, order.clientTxnId)}
                                  disabled={reconcilingId === order._id}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 border-2 border-blue-300 text-blue-950 hover:bg-blue-100 rounded-xl text-xs font-bold transition shadow-xs"
                                >
                                  <RefreshCw size={13} className={reconcilingId === order._id ? "animate-spin" : ""} />
                                  {reconcilingId === order._id ? "Verifying..." : "Verify Payment"}
                                </button>
                              )}

                              <button
                                onClick={() => handleDownloadInvoice(order)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-slate-300 text-slate-950 hover:bg-slate-50 rounded-xl text-xs font-bold transition shadow-xs"
                              >
                                <FileText size={14} />
                                <span>Tax Invoice</span>
                              </button>

                              <button
                                onClick={() => handleOpenTracking(order)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-950 hover:bg-black text-white rounded-xl text-xs font-bold transition shadow-xs"
                              >
                                <Truck size={14} />
                                <span>Track</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ADDRESSES */}
            {activeTab === "addresses" && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Saved Delivery Addresses</h2>
                    <p className="text-xs text-slate-500">Manage your shipping addresses for seamless 1-click checkout</p>
                  </div>
                  <button
                    onClick={handleOpenAddAddress}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2e306a] hover:bg-[#1e1e4d] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
                  >
                    <Plus size={14} />
                    <span>Add New Address</span>
                  </button>
                </div>

                {addressesLoading ? (
                  <div className="py-12 text-center text-xs text-slate-400">Loading addresses...</div>
                ) : addresses.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <MapPin size={32} className="text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">No saved addresses found.</p>
                    <button
                      onClick={handleOpenAddAddress}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2e306a] text-white text-xs font-semibold rounded-xl shadow-xs"
                    >
                      <Plus size={14} />
                      <span>Add Address</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {addresses.map((addr, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/50 hover:bg-white transition space-y-3 text-xs text-slate-700 relative flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 uppercase text-[10px] bg-white border border-slate-300 px-2.5 py-0.5 rounded-full">
                              {addr.type === "Work" ? "🏢 Work" : addr.type === "Other" ? "📍 Other" : "🏠 Home"}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenEditAddress(addr)}
                                className="text-slate-500 hover:text-slate-900 p-1 rounded hover:bg-slate-100 transition"
                                title="Edit Address"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(addr._id)}
                                className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition"
                                title="Delete Address"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {(addr.firstName || addr.lastName) && (
                            <p className="font-bold text-slate-900 text-sm">
                              {`${addr.firstName || ""} ${addr.lastName || ""}`.trim()}
                            </p>
                          )}

                          <div className="space-y-1 text-slate-700 leading-relaxed font-medium">
                            <p className="font-semibold text-slate-900">{addr.home}</p>
                            <p>{addr.street || addr.address}</p>
                            {addr.landmark && (
                              <p className="text-slate-500 text-[11px]">
                                <span className="font-semibold text-slate-600">Landmark:</span> {addr.landmark}
                              </p>
                            )}
                            <p className="font-semibold text-slate-900">
                              {addr.city}, {addr.state} - <span className="font-mono">{addr.postalCode}</span>
                            </p>
                            <p className="text-[11px] text-slate-500">Country: {addr.country || "India"}</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/80 flex flex-col gap-1 text-[11px]">
                          <p className="text-slate-800 font-bold flex items-center gap-1 font-mono">
                            <Phone size={12} className="text-slate-500" /> +91 {addr.phone}
                          </p>
                          {addr.alternatePhone && (
                            <p className="text-slate-500 flex items-center gap-1 font-mono">
                              <Phone size={12} className="text-slate-400" /> Alt: +91 {addr.alternatePhone}
                            </p>
                          )}
                          {addr.email && (
                            <p className="text-slate-500 flex items-center gap-1">
                              <Mail size={12} className="text-slate-400" /> {addr.email}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: WISHLIST */}
            {activeTab === "wishlist" && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-900">My Wishlist</h2>
                  <p className="text-xs text-slate-500">Items you have saved for future purchases</p>
                </div>

                {wishlistState?.items?.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <Heart size={32} className="text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">Your wishlist is empty</p>
                    <Link href="/listing" className="inline-block px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xs">
                      Browse Catalog
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {wishlistState?.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white transition">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-400">
                            <Package size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-slate-900">{item.name || "Product"}</p>
                            <p className="text-xs text-slate-700 font-semibold">₹{item.price}</p>
                          </div>
                        </div>
                        <Link href={`/product/${item.productId || item._id || ""}`} className="text-xs text-slate-900 font-bold hover:underline flex items-center gap-1">
                          View <ChevronRight size={12} />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: SETTINGS */}
            {activeTab === "settings" && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-900">Account Credentials</h2>
                  <p className="text-xs text-slate-500">Your profile details and active session</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">
                        <UserIcon size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{user?.name}</p>
                        <p className="text-slate-500 text-[11px]">{user?.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold px-2 py-0.5 rounded">
                      Active Account
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Shipment Tracking Modal */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl relative max-h-[85vh] overflow-y-auto border border-slate-200">
            <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Live Shipment Tracker</h3>
                <p className="text-xs text-slate-500 font-mono">
                  AWB: {trackingOrder.awbNumber || `ORD-${trackingOrder._id.slice(-8).toUpperCase()}`}
                </p>
              </div>
              <button
                onClick={() => setTrackingOrder(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
              >
                <X size={15} />
              </button>
            </div>

            {trackingLoading ? (
              <div className="py-10 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Fetching tracking checkpoints...</p>
              </div>
            ) : trackingData ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status</span>
                    <p className="text-sm font-bold text-slate-900">{trackingData.current_status || trackingData.status || "In-Transit"}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200">
                    {trackingData.courier_name || trackingOrder.courierName || "iThink Logistics"}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Milestones</p>
                  {Array.isArray(trackingData.scans) && trackingData.scans.length > 0 ? (
                    <div className="relative pl-5 border-l-2 border-slate-900 space-y-3.5 ml-2">
                      {trackingData.scans.map((s: any, idx: number) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[27px] top-1 w-2.5 h-2.5 bg-slate-900 rounded-full border-2 border-white shadow-2xs" />
                          <p className="text-xs font-bold text-slate-800">{s.activity || s.status_detail || "Scan Checkpoint"}</p>
                          <p className="text-[11px] text-slate-500">{s.date || ""} • {s.location || ""}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 text-center">
                      Consignment booked. Awaiting initial scan by courier partner.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center space-y-1">
                <p className="text-xs text-slate-500">Tracking information is being updated by courier partner.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Address Modal */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-[#2e306a]" />
                <h3 className="font-bold text-slate-900 text-base">
                  {editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"}
                </h3>
              </div>
              <button
                onClick={() => setAddressModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            {addressError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{addressError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAddress} className="space-y-4 text-xs">
              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">First Name</label>
                  <input
                    type="text"
                    value={addressForm.firstName}
                    onChange={(e) => setAddressForm({ ...addressForm, firstName: e.target.value })}
                    placeholder="First Name"
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2e306a]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.lastName}
                    onChange={(e) => setAddressForm({ ...addressForm, lastName: e.target.value })}
                    placeholder="Last Name *"
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2e306a]"
                  />
                </div>
              </div>

              {/* Phones */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Primary Mobile *</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-2.5 text-[11px] font-bold text-slate-500 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      placeholder="10-digit number *"
                      className="w-full border border-slate-300 rounded-r-xl p-2.5 text-xs focus:outline-none focus:border-[#2e306a]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Alternate Phone (Optional)</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-2.5 text-[11px] font-bold text-slate-500 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={addressForm.alternatePhone}
                      onChange={(e) => setAddressForm({ ...addressForm, alternatePhone: e.target.value })}
                      placeholder="Optional secondary"
                      className="w-full border border-slate-300 rounded-r-xl p-2.5 text-xs focus:outline-none focus:border-[#2e306a]"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email (For dispatch tracking updates)</label>
                <input
                  type="email"
                  value={addressForm.email}
                  onChange={(e) => setAddressForm({ ...addressForm, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2e306a]"
                />
              </div>

              {/* House / Flat & Street */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Flat / House No. / Building *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.home}
                    onChange={(e) => setAddressForm({ ...addressForm, home: e.target.value })}
                    placeholder="e.g. Flat 402, Sunshine Apts *"
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2e306a]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Street / Area / Colony *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    placeholder="e.g. 14th Main Road, Indiranagar *"
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2e306a]"
                  />
                </div>
              </div>

              {/* Landmark */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nearby Landmark (Optional)</label>
                <input
                  type="text"
                  value={addressForm.landmark}
                  onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                  placeholder="e.g. Near City Hospital / Opposite Metro Pillar 120"
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2e306a]"
                />
              </div>

              {/* City & State */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Town / City *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="e.g. Mumbai *"
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2e306a]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    placeholder="e.g. Maharashtra *"
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2e306a]"
                  />
                </div>
              </div>

              {/* PIN Code & Country */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Postal PIN Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                    placeholder="6-digit PIN *"
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2e306a]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Country</label>
                  <input
                    disabled
                    value="India 🇮🇳"
                    className="w-full border border-slate-200 bg-slate-100 text-slate-500 rounded-xl p-2.5 text-xs font-semibold cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Address Type */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Address Type</label>
                <div className="flex gap-2">
                  {[
                    { id: "Home", label: "🏠 Home" },
                    { id: "Work", label: "🏢 Work" },
                    { id: "Other", label: "📍 Other" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setAddressForm({ ...addressForm, type: t.id })}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                        addressForm.type === t.id
                          ? "bg-[#2e306a] text-white border-[#2e306a]"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addressSubmitting}
                  className="px-5 py-2 bg-[#2e306a] hover:bg-[#1e1e4d] text-white rounded-xl font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {addressSubmitting ? "Saving..." : editingAddressId ? "Update Address" : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] bg-[#f8fafc] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-500 text-xs">Loading profile...</p>
          </div>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
