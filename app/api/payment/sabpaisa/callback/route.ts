import { NextRequest, NextResponse } from "next/server";

import { getTargetBackendUrl, getPublicSiteOrigin } from "@/lib/auth";

const API_BASE_URL = getTargetBackendUrl();

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const merchantTxnId = searchParams.get("merchant_txn_id") || searchParams.get("merchantTxnId") || searchParams.get("clientTxnId") || "";
    const transactionId = searchParams.get("transaction_id") || searchParams.get("sabpaisaTxnId") || searchParams.get("txnId") || "N/A";
    const status = searchParams.get("status") || searchParams.get("statusCode") || "PENDING";
    const rawAmount = searchParams.get("paid_amount") || searchParams.get("amount") || "0.00";

    const orderId = merchantTxnId.split("-")[0] || "";
    const isSuccess = status.toUpperCase() === "SUCCESS" || status.toUpperCase() === "TXN_SUCCESS" || status.toUpperCase() === "PAID";
    const statusLabel = isSuccess ? "paid" : status.toLowerCase() === "failed" ? "failed" : "pending";

    // Format amount
    let displayAmount = rawAmount;
    if (Number(rawAmount) > 1000 && !rawAmount.includes(".")) {
      displayAmount = (Number(rawAmount) / 100).toFixed(2);
    }

    // Inform backend in the background
    fetch(`${API_BASE_URL}/api/payment/sabpaisa/callback?${searchParams.toString()}`, {
      method: "GET",
    }).catch((e) => console.error("Async backend sync error:", e));

    const origin = getPublicSiteOrigin(req);
    if (isSuccess) {
      return NextResponse.redirect(`${origin}/profile?tab=orders&highlight=${orderId}`);
    } else {
      return NextResponse.redirect(`${origin}/checkout?error=PaymentFailed&orderId=${orderId}`);
    }
  } catch (error) {
    console.error("Sabpaisa callback GET handler error:", error);
    const origin = getPublicSiteOrigin(req);
    return NextResponse.redirect(`${origin}/profile?tab=orders`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let merchantTxnId = "";
    let transactionId = "N/A";
    let status = "PENDING";
    let rawAmount = "0.00";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      merchantTxnId = formData.get("merchant_txn_id")?.toString() || formData.get("merchantTxnId")?.toString() || formData.get("clientTxnId")?.toString() || "";
      transactionId = formData.get("transaction_id")?.toString() || formData.get("sabpaisaTxnId")?.toString() || formData.get("txnId")?.toString() || "N/A";
      status = formData.get("status")?.toString() || formData.get("statusCode")?.toString() || "PENDING";
      rawAmount = formData.get("paid_amount")?.toString() || formData.get("amount")?.toString() || "0.00";
    } else {
      const json = await req.json().catch(() => ({}));
      merchantTxnId = json.merchant_txn_id || json.merchantTxnId || json.clientTxnId || "";
      transactionId = json.transaction_id || json.sabpaisaTxnId || json.txnId || "N/A";
      status = json.status || json.statusCode || "PENDING";
      rawAmount = json.paid_amount || json.amount || "0.00";
    }

    const orderId = merchantTxnId.split("-")[0] || "";
    const isSuccess = status.toUpperCase() === "SUCCESS" || status.toUpperCase() === "TXN_SUCCESS" || status.toUpperCase() === "PAID";

    const origin = getPublicSiteOrigin(req);
    if (isSuccess) {
      return NextResponse.redirect(`${origin}/profile?tab=orders&highlight=${orderId}`);
    } else {
      return NextResponse.redirect(`${origin}/checkout?error=PaymentFailed&orderId=${orderId}`);
    }
  } catch (error) {
    console.error("Sabpaisa callback POST handler error:", error);
    const origin = getPublicSiteOrigin(req);
    return NextResponse.redirect(`${origin}/profile?tab=orders`);
  }
}
