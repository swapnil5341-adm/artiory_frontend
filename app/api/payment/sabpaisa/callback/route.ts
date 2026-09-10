import { NextRequest, NextResponse } from "next/server";
import { getTargetBackendUrl, getPublicSiteOrigin } from "@/lib/auth";

async function handleCallback(req: NextRequest, isPost: boolean) {
  const origin = getPublicSiteOrigin(req);
  const API_BASE_URL = getTargetBackendUrl(req);
  try {
    const payload: Record<string, string> = {};

    // 1. Collect query params
    req.nextUrl.searchParams.forEach((value, key) => {
      payload[key] = value;
    });

    // 2. If POST, collect body params (support urlencoded, form-data, json)
    if (isPost) {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
        try {
          const formData = await req.formData();
          formData.forEach((value, key) => {
            payload[key] = value.toString();
          });
        } catch (e) {
          console.error("Error reading formData in SabPaisa callback:", e);
        }
      } else if (contentType.includes("application/json")) {
        try {
          const json = await req.json();
          if (json && typeof json === "object") {
            Object.assign(payload, json);
          }
        } catch (e) {
          console.error("Error reading JSON body in SabPaisa callback:", e);
        }
      } else {
        // Fallback: try reading raw text and parsing as urlencoded
        try {
          const rawText = await req.text();
          if (rawText && rawText.includes("=")) {
            const parsed = new URLSearchParams(rawText);
            parsed.forEach((value, key) => {
              payload[key] = value;
            });
          }
        } catch {}
      }
    }

    console.log("SabPaisa Callback received in Next.js:", {
      method: req.method,
      hasEncResponse: Boolean(payload.encResponse || payload.encData),
      clientTxnId: payload.clientTxnId || payload.merchantTxnId || payload.merchant_txn_id,
      status: payload.status || payload.statusCode,
    });

    // 3. Forward full payload directly to backend for AES decryption & order update
    let backendResult: any = null;
    try {
      const backendRes = await fetch(`${API_BASE_URL}/api/payment/sabpaisa/callback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "x-forwarded-by": "nextjs",
        },
        body: JSON.stringify(payload),
      });

      if (backendRes.ok) {
        backendResult = await backendRes.json().catch(() => null);
        console.log("Backend sync result:", backendResult);
      } else {
        const text = await backendRes.text();
        console.warn("Backend callback returned status", backendRes.status, text.slice(0, 300));
      }
    } catch (backendErr) {
      console.error("Failed to forward callback to backend:", backendErr);
    }

    // 4. Resolve Order ID and final status
    const resolvedOrderId =
      backendResult?.orderId ||
      (payload.clientTxnId || payload.merchantTxnId || payload.merchant_txn_id || "").split("-")[0] ||
      "";

    const rawStatus = (
      backendResult?.status ||
      payload.status ||
      payload.statusCode ||
      payload.status_code ||
      "PENDING"
    ).toUpperCase().trim();

    const isSuccess =
      backendResult?.isSuccess === true ||
      rawStatus === "PAID" ||
      rawStatus === "SUCCESS" ||
      rawStatus === "TXN_SUCCESS" ||
      rawStatus === "0000" ||
      rawStatus === "0200" ||
      rawStatus === "OK";

    if (isSuccess) {
      if (backendResult?.isGuest) {
        return NextResponse.redirect(`${origin}/track-order?orderId=${resolvedOrderId}&payment=success`);
      }
      return NextResponse.redirect(`${origin}/profile?tab=orders&highlight=${resolvedOrderId}`);
    } else {
      return NextResponse.redirect(`${origin}/checkout?error=PaymentFailed&orderId=${resolvedOrderId}`);
    }
  } catch (error) {
    console.error("SabPaisa callback general error:", error);
    return NextResponse.redirect(`${origin}/profile?tab=orders`);
  }
}

export async function GET(req: NextRequest) {
  return handleCallback(req, false);
}

export async function POST(req: NextRequest) {
  return handleCallback(req, true);
}
