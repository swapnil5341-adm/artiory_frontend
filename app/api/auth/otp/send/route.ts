import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "OTP route disabled" }, { status: 404 });
}
