import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createBackendToken, getTargetBackendUrl } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const API_BASE_URL = getTargetBackendUrl(req);
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const userObj = session?.user || {
      id: "guest_" + (body.shippingAddress?.phone || Date.now().toString().slice(-6)),
      email: body.shippingAddress?.email || `${body.shippingAddress?.phone || "guest"}@artiory.com`,
      name: body.shippingAddress?.name || "Customer",
    };

    const token = createBackendToken(userObj);

    const res = await fetch(`${API_BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.error(`Orders Proxy: Backend returned non-JSON response (status ${res.status}):`, text.slice(0, 1000));
      return NextResponse.json({ error: "Backend returned invalid format" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Orders proxy POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const API_BASE_URL = getTargetBackendUrl(req);
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = createBackendToken(session.user);

    const res = await fetch(`${API_BASE_URL}/api/orders/myorders`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.error(`Orders Proxy GET: Backend returned non-JSON response (status ${res.status}):`, text.slice(0, 1000));
      return NextResponse.json({ error: "Backend returned invalid format" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Orders proxy GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
