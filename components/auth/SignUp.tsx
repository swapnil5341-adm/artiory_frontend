"use client";
import React, { useEffect } from "react";
import { Londrina_Solid } from "next/font/google";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

const londrina = Londrina_Solid({
  weight: ["100", "300", "400", "900"],
  subsets: ["latin"],
  display: "swap",
});

export default function SignUp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push(callbackUrl);
    }
  }, [session, status, router, callbackUrl]);

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="-mt-20 w-full max-w-sm text-center">
        <div className="mb-6">
          <Image width={120} height={120} src="/Artiory-Logo.svg" alt="Artiory Logo" className="mx-auto" />
        </div>

        <div className="text-center mb-8">
          <h1 className={`text-4xl text-[#2e306a] tracking-[0.2px] font-bold ${londrina.className}`}>
            Create your account
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Sign up easily with your Google account to start shopping and save your cart/wishlist.
          </p>
        </div>

        {/* Google Button */}
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-3 px-4 mb-6 shadow-md hover:scale-105 transition bg-white"
        >
          <Image width={20} height={20} src="https://cdn-icons-png.flaticon.com/128/281/281764.png" alt="Google Icon" />
          <span className="text-[#2e306a] font-semibold text-md">Continue with Google</span>
        </button>
      </div>
    </section>
  );
}
