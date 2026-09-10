import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createBackendToken, getTargetBackendUrl } from "@/lib/auth";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const API_BASE_URL = getTargetBackendUrl(req);
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    const token = createBackendToken(session?.user || { id: "guest", email: "guest@artiory.com" });

    const res = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Order not found" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Order details proxy GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
