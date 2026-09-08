"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X, ArrowRight } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Londrina_Solid } from "next/font/google";

const londrina = Londrina_Solid({
  weight: ["100", "300", "400", "900"],
  subsets: ["latin"],
  display: "swap",
});

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onContinueAsGuest: () => void;
  onSuccessLogin?: () => void;
}

export default function CheckoutAuthModal({
  isOpen,
  onClose,
  onContinueAsGuest,
}: Props) {
  const [googleLoading, setGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    signIn("google", { callbackUrl: "/checkout" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fadeIn">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-gray-100 z-10 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-5">
          <Image
            width={110}
            height={55}
            src="/Artiory-Logo.svg"
            alt="Artiory Logo"
            className="mx-auto h-auto w-24 mb-2"
          />
          <h3 className={`${londrina.className} text-3xl text-[#2e306a] font-bold`}>
            Checkout Options
          </h3>
          <p className="text-gray-500 text-xs mt-1">
            Choose fast guest checkout or sign in with your Google account
          </p>
        </div>

        <div className="space-y-3.5">
          {/* 1. DIRECT GUEST CHECKOUT */}
          <div className="border-2 border-emerald-400/90 bg-emerald-50/50 rounded-2xl p-4 transition hover:bg-emerald-50/80 hover:shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
              Fast & Direct
            </span>
            <h4 className="text-base font-bold text-[#2e306a] mt-1.5 flex items-center gap-1.5">
              <span>⚡ Continue as Guest</span>
            </h4>
            <p className="text-xs text-gray-600 mt-1 leading-snug">
              No account required! Simply enter your delivery address and make payment to place your order.
            </p>

            <button
              onClick={onContinueAsGuest}
              className="mt-3.5 w-full bg-[#00ba82] hover:bg-[#009b6d] text-white font-bold py-3 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.99]"
            >
              <span>Proceed to Checkout as Guest</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Or Sign In
            </span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* 2. GOOGLE SIGN-IN BUTTON */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50/80 rounded-2xl py-3 px-4 transition text-sm font-bold text-[#2e306a] shadow-2xs cursor-pointer active:scale-[0.99] disabled:opacity-60"
          >
            <Image
              width={18}
              height={18}
              src="https://cdn-icons-png.flaticon.com/128/281/281764.png"
              alt="Google Icon"
            />
            <span>{googleLoading ? "Connecting with Google..." : "Continue with Google"}</span>
          </button>

          {/* Email option */}
          <div className="pt-1 text-center text-xs text-gray-400">
            Have an account with email?{" "}
            <Link
              href="/auth/signin?callbackUrl=/checkout"
              className="text-[#00ba82] font-semibold hover:underline"
            >
              Sign in with Email
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
