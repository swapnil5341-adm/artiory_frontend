import { NextRequest, NextResponse } from "next/server";
import { getTargetBackendUrl } from "@/lib/auth";

const API_BASE_URL = getTargetBackendUrl();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = body?.query;

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { success: false, message: "Order ID, Mobile Number, or Email is required" },
        { status: 400 }
      );
    }

    const res = await fetch(`${API_BASE_URL}/api/orders/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: query.trim() }),
    });

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.error(`Track Order Proxy non-JSON response (${res.status}):`, text.slice(0, 500));
      return NextResponse.json(
        { success: false, message: "Tracking service returned an unexpected response" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("Track Order Proxy Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error while tracking order" },
      { status: 500 }
    );
  }
}
