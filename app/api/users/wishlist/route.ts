import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createBackendToken, getTargetBackendUrl } from "@/lib/auth";

const API_BASE_URL = getTargetBackendUrl();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: true, wishlist: [] }, { status: 200 });
    }

    const token = createBackendToken(session.user);

    const res = await fetch(`${API_BASE_URL}/api/users/wishlist`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.error(`Wishlist Proxy GET: Backend returned non-JSON response (status ${res.status}):`, text.slice(0, 1000));
      return NextResponse.json({ error: "Backend returned invalid format" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Wishlist proxy GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = createBackendToken(session.user);
    const body = await req.json();

    const res = await fetch(`${API_BASE_URL}/api/users/wishlist`, {
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
      console.error(`Wishlist Proxy POST: Backend returned non-JSON response (status ${res.status}):`, text.slice(0, 1000));
      return NextResponse.json({ error: "Backend returned invalid format" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Wishlist proxy POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
