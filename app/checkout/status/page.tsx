"use client";
import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Londrina_Solid } from "next/font/google";
import { useCart } from "@/app/context/cart/Cartcontext";

const londrina = Londrina_Solid({
  weight: ["100", "300", "400", "900"],
  subsets: ["latin"],
  display: "swap",
});

function StatusContent() {
  const { dispatch } = useCart();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "pending";
  const orderId = searchParams.get("orderId") || "N/A";
  const initialTxnId = searchParams.get("txnId") || "N/A";
  const amount = searchParams.get("amount") || "N/A";

  const [currentStatus, setCurrentStatus] = React.useState(initialStatus);
  const [currentTxnId, setCurrentTxnId] = React.useState(initialTxnId);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [countdown, setCountdown] = React.useState(4);

  const isSuccess = currentStatus === "paid" || currentStatus === "success";
  const isFailed = currentStatus === "failed" || currentStatus === "error";

  const checkLiveStatus = React.useCallback(async () => {
    if (!orderId || orderId === "N/A") return;
    try {
      setIsVerifying(true);
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com";
      const res = await fetch(`${apiBase}/api/payment/sabpaisa/enquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, merchantTxnId: orderId }),
      });
      const data = await res.json();
      if (data.success && (data.isPaid || data.status === "SUCCESS" || data.status === "TXN_SUCCESS")) {
        setCurrentStatus("paid");
        if (data.data?.transaction_id) setCurrentTxnId(data.data.transaction_id);
        dispatch({ type: "CLEAR_CART" });
      }
    } catch (e) {
      console.error("Live status check error:", e);
    } finally {
      setIsVerifying(false);
    }
  }, [orderId, dispatch]);

  React.useEffect(() => {
    if (isSuccess) {
      dispatch({ type: "CLEAR_CART" });

      if (typeof window !== "undefined" && orderId && orderId !== "N/A") {
        try {
          const existing = JSON.parse(localStorage.getItem("artiory_guest_orders") || "[]");
          const updated = [orderId, ...existing.filter((id: string) => id !== orderId)].slice(0, 10);
          localStorage.setItem("artiory_guest_orders", JSON.stringify(updated));
          localStorage.setItem("artiory_recent_order", orderId);
        } catch (e) {
          console.error("Local order save notice:", e);
        }
      }

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            window.location.href = `/orders/${orderId}`;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else if (orderId !== "N/A") {
      checkLiveStatus();
    }
  }, [isSuccess, orderId, checkLiveStatus, dispatch]);

  return (
    <div className="max-w-md w-full border border-gray-200 rounded-3xl p-8 shadow-xl text-center bg-white space-y-6">
      {isSuccess && (
        <>
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-500 text-4xl animate-bounce">
            ✓
          </div>
          <h2 className={`${londrina.className} text-3xl font-bold text-emerald-600`}>Payment Confirmed!</h2>
          <p className="text-gray-500 text-sm">
            Thank you! Your payment has been verified and your order is booked.
          </p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-800 font-medium">
            Redirecting to your order receipt & live tracking in <b>{countdown}s</b>...
          </div>
        </>
      )}

      {isFailed && (
        <>
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-500 text-4xl">
            ✕
          </div>
          <h2 className={`${londrina.className} text-3xl font-bold text-rose-500`}>Payment Failed</h2>
          <p className="text-gray-500 text-sm">
            Unfortunately, your transaction could not be processed. Please try again or choose another payment method.
          </p>
        </>
      )}

      {!isSuccess && !isFailed && (
        <>
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-500 text-4xl">
            ⌛
          </div>
          <h2 className={`${londrina.className} text-3xl font-bold text-amber-500`}>Payment Processing</h2>
          <p className="text-gray-500 text-sm">
            Your payment is currently being verified. We will notify you once the status updates.
          </p>
        </>
      )}

      <div className="border-t border-dashed border-gray-200 pt-6 space-y-3 text-left text-sm text-gray-600">
        <div className="flex justify-between">
          <span className="font-medium text-[#2e306a]">Order ID:</span>
          <span className="font-mono text-gray-800">#ORD-{orderId.slice(-8).toUpperCase()}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium text-[#2e306a]">SabPaisa Txn ID:</span>
          <span className="font-mono text-gray-800">{currentTxnId}</span>
        </div>
        {amount !== "N/A" && (
          <div className="flex justify-between">
            <span className="font-medium text-[#2e306a]">Amount Paid:</span>
            <span className="font-bold text-emerald-700">₹{amount}</span>
          </div>
        )}
      </div>

      <div className="pt-4 flex flex-col gap-3">
        {isSuccess ? (
          <>
            <Link
              href={`/orders/${orderId}`}
              className="w-full bg-[#1e1e4d] hover:bg-[#2e306a] text-white font-bold rounded-xl py-3.5 transition text-center shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              📦 View Order Details & Track Shipment →
            </Link>
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/listing"
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl py-2.5 transition text-center text-xs"
              >
                Continue Shopping
              </Link>
              <Link
                href="/track-order"
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl py-2.5 transition text-center text-xs"
              >
                Track Order Page
              </Link>
            </div>
          </>
        ) : (
          <>
            {!isSuccess && (
              <button
                onClick={checkLiveStatus}
                disabled={isVerifying}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl py-3 transition text-center shadow flex items-center justify-center gap-2 text-sm"
              >
                {isVerifying ? (
                  <>
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                    Checking SabPaisa Status...
                  </>
                ) : (
                  <>🔄 Check Status with SabPaisa</>
                )}
              </button>
            )}
            <Link
              href="/checkout"
              className="w-full border border-gray-300 hover:bg-gray-50 text-gray-600 font-semibold rounded-xl py-3 transition text-center text-sm"
            >
              Retry Order
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function CheckoutStatusPage() {
  return (
    <section className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <Suspense fallback={
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="text-gray-500 text-sm">Loading status...</p>
        </div>
      }>
        <StatusContent />
      </Suspense>
    </section>
  );
}
