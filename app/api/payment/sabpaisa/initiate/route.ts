import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { createBackendToken, getTargetBackendUrl, getPublicSiteOrigin } from "@/lib/auth";

const API_BASE_URL = getTargetBackendUrl();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const userObj = session?.user || {
      id: "guest",
      email: "customer@artiory.com",
      name: "Customer",
    };

    const token = createBackendToken(userObj);

    const publicOrigin = getPublicSiteOrigin(req);
    let returnUrl = body.returnUrl || publicOrigin;
    if (returnUrl.includes("3011") || (process.env.NODE_ENV === "production" && returnUrl.includes("localhost"))) {
      returnUrl = "https://artiory.com";
    }

    const payload = {
      ...body,
      returnUrl,
    };

    const res = await fetch(`${API_BASE_URL}/api/payment/sabpaisa/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.error(`SabPaisa Proxy: Backend returned non-JSON response (status ${res.status}):`, text.slice(0, 1000));
      return NextResponse.json({ error: "Backend returned invalid format" }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Sabpaisa initiate proxy POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
