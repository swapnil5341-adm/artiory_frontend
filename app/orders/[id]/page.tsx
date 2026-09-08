"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Package,
  MapPin,
  Truck,
  FileText,
  ExternalLink,
  RefreshCw,
  ShoppingBag,
  User as UserIcon,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RotateCcw,
  ReceiptText,
  Phone,
  ArrowLeft,
  Search,
  AlertCircle,
  HelpCircle,
  Copy,
  Check
} from "lucide-react";

interface ProductDetails {
  _id?: string;
  productName?: string;
  skuCode?: string;
  thumbnail?: string;
  images?: string[];
  sellingPrice?: number;
  mrp?: number;
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
  shippingLabelUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const router = useRouter();
  const { data: session } = useSession();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) {
          throw new Error("Unable to locate order details");
        }
        const data = await res.json();
        setOrder(data);
      } catch (err: any) {
        console.error("Fetch order error:", err);
        setError(err.message || "Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleCopyId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleOpenTracking = async () => {
    if (!order?.awbNumber) return;
    setTrackingModalOpen(true);
    setTrackingLoading(true);
    setTrackingData(null);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com";
      const res = await fetch(`${apiBase}/api/logistics/order/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ awb_number_list: order.awbNumber }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setTrackingData(json.data?.[order.awbNumber] || json.data);
      }
    } catch (e) {
      console.error("Tracking load error:", e);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!order) return;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com";
    window.open(`${apiBase}/api/logistics/orders/${order._id}/invoice-html`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-700">Loading your order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border-2 border-slate-200 text-center shadow-lg space-y-6">
          <div className="w-16 h-16 bg-rose-50 border-2 border-rose-200 rounded-full flex items-center justify-center mx-auto text-rose-600">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Order Not Found</h2>
          <p className="text-xs text-slate-600 font-medium">
            {error || "We couldn't retrieve the details for this order. It might have been archived or moved."}
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href={session?.user ? "/profile?tab=orders" : "/track-order"}
              className="w-full bg-slate-950 hover:bg-black text-white font-bold py-3 rounded-xl text-xs transition"
            >
              {session?.user ? "← Back to My Orders" : "← Track Another Order"}
            </Link>
            <Link
              href="/listing"
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl text-xs transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const shortId = order._id.slice(-8).toUpperCase();
  const isPaid = order.status === "Paid";
  const isShipped = order.status === "Shipped" || order.shipmentStatus === "Shipped" || order.shipmentStatus === "In-Transit";
  const isDelivered = order.status === "Delivered" || order.shipmentStatus === "Delivered";

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const itemsSubtotal = (order.orderItems || []).reduce(
    (acc, it) => acc + (Number(it.price || 0) * Number(it.qty || 1)),
    0
  );
  const actualShipping = Number(order.shippingCharge !== undefined && order.shippingCharge !== null ? order.shippingCharge : 149);
  const discountAmt = Number(order.discountAmount || 0);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-24 pt-8 text-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation & Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href={session?.user ? "/profile?tab=orders" : "/track-order"}
            className="inline-flex items-center gap-2 text-xs font-black text-slate-900 bg-white border-2 border-slate-300 hover:bg-slate-50 px-4 py-2 rounded-xl transition shadow-xs"
          >
            <ArrowLeft size={14} />
            <span>{session?.user ? "Back to All Orders" : "Track Another Order"}</span>
          </Link>
          <div className="text-xs text-slate-500 font-medium">
            <span>Orders</span> &nbsp;/&nbsp; <b className="text-slate-950 font-mono">#ORD-{shortId}</b>
          </div>
        </div>

        {/* Order Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-300 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-slate-100">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight font-mono">
                  #ORD-{shortId}
                </h1>
                <button
                  onClick={() => handleCopyId(order._id)}
                  title="Copy Full Order ID"
                  className="text-slate-500 hover:text-slate-900 p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition text-xs flex items-center gap-1 font-sans"
                >
                  {copiedId ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span className="text-[11px] font-bold">{copiedId ? "Copied" : "Copy ID"}</span>
                </button>
              </div>
              <p className="text-xs text-slate-600 font-semibold mt-1 flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-500" /> Placed on {formattedDate}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {isPaid ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-100 border-2 border-emerald-300 text-emerald-950 text-xs font-black rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  Paid & Confirmed
                </span>
              ) : order.status === "Pending" ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-100 border-2 border-amber-300 text-amber-950 text-xs font-black rounded-full">
                  <Clock size={14} />
                  Payment Pending
                </span>
              ) : (
                <span className="px-4 py-1.5 bg-rose-100 border-2 border-rose-300 text-rose-950 text-xs font-black rounded-full">
                  {order.status}
                </span>
              )}

              {isShipped && (
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-100 border-2 border-blue-300 text-blue-950 text-xs font-black rounded-full">
                  <Truck size={14} />
                  {order.shipmentStatus || "In Transit"}
                </span>
              )}
            </div>
          </div>

          {/* Shipment Progress Stepper */}
          <div className="bg-slate-50 rounded-2xl p-5 border-2 border-slate-200 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Truck size={16} />
              <span>Consignment Tracking Status</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className={`p-3.5 rounded-xl border-2 transition ${isPaid || order.status ? "bg-white border-emerald-300 text-emerald-950 shadow-xs" : "bg-slate-100 border-slate-200 text-slate-400"}`}>
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <CheckCircle2 size={15} className={isPaid ? "text-emerald-600" : "text-slate-400"} />
                  <span>1. Confirmed</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 font-medium">Order booked & verified</p>
              </div>

              <div className={`p-3.5 rounded-xl border-2 transition ${isShipped || isDelivered ? "bg-white border-emerald-300 text-emerald-950 shadow-xs" : "bg-slate-100 border-slate-200 text-slate-400"}`}>
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <CheckCircle2 size={15} className={isShipped || isDelivered ? "text-emerald-600" : "text-slate-400"} />
                  <span>2. Manifested</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 font-medium">{order.awbNumber ? `AWB: ${order.awbNumber.slice(-8)}` : "Origin Hub 122518"}</p>
              </div>

              <div className={`p-3.5 rounded-xl border-2 transition ${isShipped || isDelivered ? "bg-white border-blue-300 text-blue-950 shadow-xs" : "bg-slate-100 border-slate-200 text-slate-400"}`}>
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Truck size={15} className={isShipped || isDelivered ? "text-blue-600" : "text-slate-400"} />
                  <span>3. In-Transit</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 font-medium">{order.courierName || "Carrier Assigned"}</p>
              </div>

              <div className={`p-3.5 rounded-xl border-2 transition ${isDelivered ? "bg-white border-emerald-400 text-emerald-950 shadow-xs" : "bg-slate-100 border-slate-200 text-slate-400"}`}>
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <CheckCircle2 size={15} className={isDelivered ? "text-emerald-600" : "text-slate-400"} />
                  <span>4. Delivered</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 font-medium">{isDelivered ? "Delivered to Customer" : "Final Destination"}</p>
              </div>
            </div>

            {order.awbNumber && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Courier Partner:</span>
                  <span className="font-black text-slate-950">{order.courierName || "iThink Logistics Partner"}</span>
                  <span className="text-slate-300">|</span>
                  <span className="font-bold text-slate-700">AWB:</span>
                  <span className="font-mono font-black text-slate-950 bg-white px-2 py-0.5 border border-slate-300 rounded">
                    {order.awbNumber}
                  </span>
                </div>

                <button
                  onClick={handleOpenTracking}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-950 hover:bg-black text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  <Search size={13} />
                  <span>Live Tracking Milestones</span>
                </button>
              </div>
            )}
          </div>

          {/* Ordered Products Itemized List */}
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-950 flex items-center gap-2">
              <ShoppingBag size={16} />
              <span>Items in this Order ({order.orderItems?.length || 0})</span>
            </h3>

            <div className="divide-y-2 divide-slate-100 border-2 border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
              {order.orderItems?.map((item, idx) => {
                const productObj = typeof item.productId === "object" ? (item.productId as ProductDetails) : null;
                const itemImage = item.image || productObj?.thumbnail || productObj?.images?.[0] || "";
                const itemName = item.name || productObj?.productName || "Handcrafted Product";
                const itemSku = productObj?.skuCode || (item as any)?.sku || (item as any)?.skuCode || `SKU-${shortId}`;
                const itemPrice = Number(item.price || productObj?.sellingPrice || 0);
                const itemQty = Number(item.qty || 1);
                const itemTotal = itemPrice * itemQty;
                const prodId = productObj?._id || (typeof item.productId === "string" ? item.productId : "");

                return (
                  <div key={idx} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-slate-50 transition">
                    <div className="flex items-center gap-4">
                      {/* Product Thumbnail */}
                      <div className="w-20 h-20 rounded-2xl bg-white border-2 border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-xs relative">
                        {itemImage ? (
                          <Image
                            src={itemImage}
                            alt={itemName}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package size={28} className="text-slate-400" />
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="space-y-1.5">
                        {prodId ? (
                          <Link
                            href={`/product/${prodId}`}
                            className="font-black text-slate-950 text-base hover:text-slate-700 transition line-clamp-1 flex items-center gap-1.5 group"
                          >
                            <span>{itemName}</span>
                            <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition text-slate-500" />
                          </Link>
                        ) : (
                          <p className="font-black text-slate-950 text-base line-clamp-1">{itemName}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono font-bold bg-slate-100 border border-slate-300 px-2.5 py-0.5 rounded text-slate-900">
                            SKU: {itemSku}
                          </span>
                          <span className="font-black bg-slate-900 text-white px-2.5 py-0.5 rounded">
                            Qty: {itemQty}
                          </span>
                          <span className="font-bold text-slate-600">
                            ₹{itemPrice.toLocaleString("en-IN")} per item
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Price Subtotal */}
                    <div className="sm:text-right flex sm:flex-col justify-between items-center sm:items-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Item Total</span>
                      <span className="text-lg font-black text-slate-950 font-mono">
                        ₹{itemTotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2-Column Grid: Delivery Information & Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* Delivery Address Card */}
            <div className="bg-slate-50 rounded-2xl p-5 border-2 border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-slate-950 font-black text-xs uppercase tracking-wider">
                <MapPin size={16} className="text-slate-900" />
                <span>Delivery / Shipping Address</span>
              </div>
              <div className="space-y-1 text-xs text-slate-800 font-semibold leading-relaxed">
                <p className="text-sm font-black text-slate-950">
                  {order.shippingAddress?.name || "Customer Name"}
                </p>
                <p>
                  {[
                    order.shippingAddress?.home,
                    order.shippingAddress?.street,
                    order.shippingAddress?.landmark,
                    order.shippingAddress?.city,
                    order.shippingAddress?.state
                  ].filter(Boolean).join(", ")}
                </p>
                <p className="font-mono font-bold text-slate-950 pt-1">
                  Postal PIN: {order.shippingAddress?.postalCode || "400071"}
                </p>
                {order.shippingAddress?.phone && (
                  <p className="flex items-center gap-1.5 text-slate-950 font-bold font-mono pt-1">
                    <Phone size={13} className="text-slate-500" />
                    <span>{order.shippingAddress.phone}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Payment & Charges Card */}
            <div className="bg-slate-50 rounded-2xl p-5 border-2 border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-slate-950 font-black text-xs uppercase tracking-wider">
                <ReceiptText size={16} className="text-slate-900" />
                <span>Payment & Charges Breakdown</span>
              </div>

              <div className="space-y-2 text-xs text-slate-700 font-semibold">
                <div className="flex justify-between">
                  <span>Items Subtotal:</span>
                  <span className="font-bold text-slate-950 font-mono">₹{itemsSubtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Charges (Flat Rate):</span>
                  <span className="font-bold text-slate-950 font-mono">₹{actualShipping.toFixed(2)}</span>
                </div>
                {discountAmt > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Promotional Discount:</span>
                    <span className="font-mono">-₹{discountAmt.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>GST & Applicable Taxes:</span>
                  <span className="font-bold text-slate-800">Inclusive (18%)</span>
                </div>
                <div className="pt-2 border-t-2 border-slate-200 flex justify-between items-baseline">
                  <span className="font-black text-slate-950 text-sm uppercase tracking-wider">Total Paid</span>
                  <span className="font-black text-slate-950 text-2xl font-mono">
                    ₹{order.totalPrice.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="pt-4 border-t-2 border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-700 font-bold flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-700" />
              <span>Protected by Artiory Authentic Delivery Guarantee</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleDownloadInvoice}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white border-2 border-slate-300 text-slate-950 hover:bg-slate-50 rounded-xl text-xs font-black transition shadow-xs"
              >
                <FileText size={15} />
                <span>Download Tax Invoice (A4)</span>
              </button>

              {order.awbNumber && (
                <button
                  onClick={handleOpenTracking}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-950 hover:bg-black text-white rounded-xl text-xs font-black transition shadow-xs"
                >
                  <Truck size={15} />
                  <span>Live Tracking</span>
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Live Tracking Modal */}
      {trackingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border-2 border-slate-300 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-950 flex items-center gap-2">
                  <Truck size={20} className="text-slate-900" />
                  <span>Live Consignment Tracking</span>
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">AWB: {order.awbNumber}</p>
              </div>
              <button
                onClick={() => setTrackingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {trackingLoading ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-600">Connecting to live courier network...</p>
              </div>
            ) : trackingData ? (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-500 font-bold block">Current Status:</span>
                    <span className="text-sm font-black text-emerald-700">{trackingData.current_status || trackingData.status || "In Transit"}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 font-bold block">Courier:</span>
                    <span className="font-black text-slate-950">{trackingData.courier_name || order.courierName || "iThink Logistics"}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Tracking Milestones</h4>
                  {Array.isArray(trackingData.scans) && trackingData.scans.length > 0 ? (
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {trackingData.scans.map((scan: any, sIdx: number) => (
                        <div key={sIdx} className="relative space-y-0.5">
                          <div className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${sIdx === 0 ? "bg-emerald-600 ring-4 ring-emerald-100" : "bg-slate-400"}`} />
                          <p className="text-xs font-black text-slate-950">{scan.activity || scan.status_detail || "Checkpoint scan"}</p>
                          <p className="text-[11px] text-slate-500 font-medium">{scan.location || "Origin Hub"} • {scan.date || "Just now"}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-4 bg-slate-50 rounded-xl">Tracking details are being synced with carrier network.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                Tracking information is being updated by courier partner.
              </div>
            )}

            <button
              onClick={() => setTrackingModalOpen(false)}
              className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
