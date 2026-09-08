"use client";

import React, { useRef, useReducer, useState } from "react";
import Image from "next/image";
import { Londrina_Solid } from "next/font/google";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import ProfileIcon from "../icons/ProfileIcon";
import { useCart } from "@/app/context/cart/Cartcontext";
import { useWishlist } from "@/app/context/whishlist/WishlistContext";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import ProfileModal from "./ProfileModal";
import SearchModal from "./SearchModal";

type CartItem = {
  id: string;
  name: string;
  quantity: number;
};

const londrina = Londrina_Solid({
  weight: ["100", "300", "400", "900"],
  subsets: ["latin"],
  display: "swap",
});

const Header: React.FC = () => {
  const { data: session } = useSession();
  const { wishlistState } = useWishlist();
  const { cart } = useCart();

  const menuOpenRef = useRef<boolean>(false);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const [hoverOpen, setHoverOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHoverOpen(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      setHoverOpen(false);
    }, 300);
  };

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const toggleMenu = () => {
    menuOpenRef.current = !menuOpenRef.current;
    forceUpdate();
  };
  const closeMenu = () => {
    menuOpenRef.current = false;
    forceUpdate();
  };

  // Toggle ?account=true on/off
  const toggleAccountQuery = () => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (params.has("account")) {
      params.delete("account");
      const newUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;
      router.push(newUrl);
    } else {
      params.set("account", "true");
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  const closeAccountModal = () => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (params.has("account")) {
      params.delete("account");
      const newUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;
      router.push(newUrl);
    }
  };

  const onSignOut = async () => {
    // optional: pass callbackUrl
    await signOut({ callbackUrl: "/" });
  };

  // session.user shape: { name, email, image, id? }
  type User = {
    name?: string;
    email?: string;
    image?: string;
    id?: string;
  };
  const user = session?.user as User | undefined;

  return (
    <>
      <header className="p-1 sticky top-0 bg-white/95 backdrop-blur-md z-50 border-b border-gray-100 shadow-2xs">
        {menuOpenRef.current && (
          <div
            className="fixed inset-0 bg-black/70 z-40 transition-opacity duration-500"
            onClick={closeMenu}
          />
        )}

        <div className="flex items-center justify-between md:justify-between lg:justify-around transition-all duration-300 ease-in-out">
          <div className="flex md:hidden gap-4 items-center">
            <button
              className={`${menuOpenRef.current ? "absolute left-[82%] z-50 text-white" : ""
                }`}
              onClick={toggleMenu}
            >
              {menuOpenRef.current ? <X size={28} /> : <Menu size={28} />}
            </button>

            {/* <button onClick={() => console.log("search clicked")}>
              <Image
                src="/search-icon.svg"
                className="w-6 md:w-7 cursor-pointer"
                alt="search"
                width={25}
                height={20}
              />
            </button> */}
          </div>

          <div className="flex justify-center flex-1 md:flex-none">
            <Link href="/">
              <Image
                width={100}
                height={50}
                className="h-auto w-30 lg:w-30 cursor-pointer"
                src="/Artiory-Logo.svg"
                alt="logo"
              />
            </Link>
          </div>

          {/* Desktop Menu */}
          <nav className={`${londrina.className} hidden md:block mt-1`}>
            <ul className="flex gap-10 font-bold justify-center">
              {["HOME", "ABOUT US", "PRODUCTS", "TRACK ORDER", "CONTACT US"].map((text, i) => {
                const hrefs = ["/", "/about", "/listing", "/track-order", "/contact"];
                return (
                  <li
                    key={text}
                    className="text-xl font-medium lg:text-2xl text-[#2e306a] cursor-pointer hover:text-[#00b8a2] transition-all duration-300 ease-in-out"
                  >
                    <Link href={hrefs[i]}>{text}</Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right: Icons */}
          <div className="flex gap-4 md:gap-6 items-center">
            {/* Search Button (Before Wishlist) */}
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search products"
              className="relative p-0.5 hover:opacity-75 transition cursor-pointer flex items-center justify-center"
            >
              <Image
                src="/search-icon.svg"
                className="w-5.5 md:w-6.5 h-auto cursor-pointer"
                alt="search"
                width={25}
                height={20}
              />
            </button>

            {/* Wishlist */}
            <Link href="/wish" className="relative">
              <Image
                src="/Like-icon.svg"
                className="w-6 md:w-7 cursor-pointer"
                alt="like"
                width={25}
                height={20}
              />
              {wishlistState?.items?.length > 0 && (
                <div
                  className="absolute -top-2 -right-1 w-5 h-5 rounded-full flex items-center justify-center 
                bg-gradient-to-br from-[#3a3d8a] via-[#2e306a] to-[#232455]
                text-xs text-white font-bold
                shadow-md
                overflow-hidden"
                >
                  <span className="relative z-10">
                    {wishlistState.items.length}
                  </span>
                  {/* Highlight spot to create 3D effect */}
                  <div className="absolute top-0 left-0 w-2 h-2 bg-white/20 rounded-full transform -translate-x-0.5 -translate-y-0.5"></div>
                  {/* Bottom shadow */}
                  <div className="absolute bottom-0 right-0 w-3 h-2 bg-black/20 rounded-full"></div>
                </div>
              )}
            </Link>

            {/* Cart */}
            <Link href="/cart" className="relative inline-block">
              <Image
                src="/cart-icon.svg"
                alt="cart"
                width={30}
                height={30}
                className="cursor-pointer h-auto w-6 md:w-7"
              />
              {cart?.items?.length > 0 && (
                <div
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center 
    bg-gradient-to-br from-[#3a3d8a] via-[#2e306a] to-[#232455]
    text-xs text-white font-bold
    shadow-md
    overflow-hidden"
                >
                  <span className="relative z-10">
                    {cart.items.reduce(
                      (total: number, item: CartItem) => total + item.quantity,
                      0
                    )}
                  </span>
                  {/* Highlight spot to create 3D effect */}
                  <div className="absolute top-0 left-0 w-2 h-2 bg-white/20 rounded-full transform -translate-x-0.5 -translate-y-0.5"></div>
                  {/* Bottom shadow */}
                  <div className="absolute bottom-0 right-0 w-3 h-2 bg-black/20 rounded-full"></div>
                </div>
              )}
            </Link>

            {/* Profile / Login (changed behaviour) */}
            {user ? (
              <div
                className="relative py-1"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  onClick={toggleAccountQuery}
                  aria-label="Open account modal"
                  className="flex items-center gap-2 group cursor-pointer"
                >
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name ?? "avatar"}
                      width={36}
                      unoptimized
                      height={36}
                      className="rounded-full border border-slate-200 shadow-xs"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-800">
                      {(user.name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span
                    className={`${londrina.className} text-lg text-[#2e306a] hidden md:inline-block`}
                  >
                    {user.name ?? "Account"}
                  </span>
                </button>

                {/* Hover dropdown with invisible bridge */}
                {hoverOpen && (
                  <div 
                    className="absolute right-0 top-full mt-1 w-56 bg-white border-2 border-slate-200 rounded-2xl shadow-xl z-50 p-3 text-xs space-y-1.5 before:absolute before:-top-3 before:left-0 before:w-full before:h-3 before:content-['']"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="px-2 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="font-black text-slate-950 text-sm truncate">{user.name}</div>
                      <div className="text-[11px] text-slate-500 font-medium truncate">
                        {user.email}
                      </div>
                    </div>

                    <div className="pt-1 space-y-1 font-bold">
                      <Link
                        href="/profile?tab=orders"
                        onClick={() => setHoverOpen(false)}
                        className="w-full text-left px-3 py-2 text-slate-800 hover:bg-slate-100 hover:text-slate-950 rounded-xl block transition flex items-center gap-2"
                      >
                        <span>My Orders</span>
                      </Link>

                      <Link
                        href="/profile?tab=addresses"
                        onClick={() => setHoverOpen(false)}
                        className="w-full text-left px-3 py-2 text-slate-800 hover:bg-slate-100 hover:text-slate-950 rounded-xl block transition flex items-center gap-2"
                      >
                        <span>Saved Addresses</span>
                      </Link>

                      <Link
                        href="/profile"
                        onClick={() => setHoverOpen(false)}
                        className="w-full text-left px-3 py-2 text-slate-800 hover:bg-slate-100 hover:text-slate-950 rounded-xl block transition flex items-center gap-2"
                      >
                        <span>Account Profile</span>
                      </Link>

                      <Link
                        href="/wish"
                        onClick={() => setHoverOpen(false)}
                        className="w-full text-left px-3 py-2 text-slate-800 hover:bg-slate-100 hover:text-slate-950 rounded-xl block transition flex items-center gap-2"
                      >
                        <span>My Wishlist</span>
                      </Link>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          onClick={onSignOut}
                          className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl block transition font-bold flex items-center gap-2"
                        >
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="flex gap-2 items-center group cursor-pointer"
              >
                <span
                  className={`${londrina.className} text-lg text-[#2e306a] group-hover:text-[#00b8a2]`}
                >
                  Login
                </span>
                <ProfileIcon className="w-8 h-8 text-[#2e306a] group-hover:text-[#00b8a2]" />
              </Link>
            )}
          </div>
        </div>

        {/* ====== MOBILE MENU (Full Responsive Drawer) ====== */}
        <nav
          className={`${londrina.className} absolute top-0 left-0 w-[85%] max-w-[320px] h-[100vh] bg-white shadow-2xl p-5 md:hidden z-50 transform transition-all duration-500 ease-in-out overflow-y-auto ${
            menuOpenRef.current
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-5 pointer-events-none"
          }`}
        >
          {/* Top Banner */}
          <div className="flex absolute top-0 left-0 w-full bg-[#00b8a2] justify-between p-4 items-center">
            {user ? (
              <Link href="/profile" onClick={closeMenu} className="flex gap-3 items-center text-white">
                {user.image ? (
                  <Image src={user.image} alt={user.name || "User"} width={34} height={34} unoptimized className="rounded-full border border-white/40" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white text-[#00b8a2] font-black flex items-center justify-center text-sm">
                    {(user.name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="leading-tight">
                  <p className="text-sm font-bold truncate max-w-[140px]">{user.name}</p>
                  <p className="text-[10px] text-white/80 font-sans truncate max-w-[140px]">{user.email}</p>
                </div>
              </Link>
            ) : (
              <Link href="/auth/signin" onClick={closeMenu} className="flex gap-2 items-center text-white">
                <ProfileIcon className="w-7 h-7 text-white" />
                <span className="text-sm font-bold uppercase tracking-wider">LOGIN / SIGNUP</span>
              </Link>
            )}
            <Link href="/" onClick={closeMenu}>
              <Image
                width={85}
                height={40}
                className="h-auto w-24 cursor-pointer"
                src="/Artiory-Logo.svg"
                alt="logo"
              />
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="mt-20 space-y-6">
            {/* Account Quick Links for Logged in user */}
            {user && (
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2.5 font-sans text-xs">
                <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">My Account</p>
                <div className="grid grid-cols-2 gap-2 font-bold text-slate-800">
                  <Link
                    href="/profile?tab=orders"
                    onClick={closeMenu}
                    className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-1.5 shadow-xs"
                  >
                    <span>📦</span>
                    <span>Orders</span>
                  </Link>
                  <Link
                    href="/profile?tab=addresses"
                    onClick={closeMenu}
                    className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-1.5 shadow-xs"
                  >
                    <span>📍</span>
                    <span>Addresses</span>
                  </Link>
                  <Link
                    href="/wish"
                    onClick={closeMenu}
                    className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-1.5 shadow-xs"
                  >
                    <span>❤️</span>
                    <span>Wishlist</span>
                  </Link>
                  <Link
                    href="/profile"
                    onClick={closeMenu}
                    className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-1.5 shadow-xs"
                  >
                    <span>👤</span>
                    <span>Profile</span>
                  </Link>
                </div>
              </div>
            )}

            <ul className="flex flex-col gap-4 text-xl font-bold text-[#2e306a]">
              <li onClick={closeMenu}>
                <Link href="/" className="hover:text-[#00b8a2] transition flex items-center justify-between">
                  <span>HOME</span>
                  <span className="text-sm opacity-40">→</span>
                </Link>
              </li>
              <li onClick={closeMenu}>
                <Link href="/listing" className="hover:text-[#00b8a2] transition flex items-center justify-between">
                  <span>ALL PRODUCTS</span>
                  <span className="text-sm opacity-40">→</span>
                </Link>
              </li>
              <li onClick={closeMenu}>
                <Link href="/about" className="hover:text-[#00b8a2] transition flex items-center justify-between">
                  <span>ABOUT US</span>
                  <span className="text-sm opacity-40">→</span>
                </Link>
              </li>
              <li onClick={closeMenu}>
                <Link href="/track-order" className="hover:text-[#00b8a2] transition flex items-center justify-between">
                  <span>TRACK ORDER</span>
                  <span className="text-sm opacity-40">→</span>
                </Link>
              </li>
              <li onClick={closeMenu}>
                <Link href="/contact" className="hover:text-[#00b8a2] transition flex items-center justify-between">
                  <span>CONTACT US</span>
                  <span className="text-sm opacity-40">→</span>
                </Link>
              </li>
            </ul>

            {user && (
              <div className="pt-4 border-t border-slate-200 font-sans">
                <button
                  onClick={() => { closeMenu(); onSignOut(); }}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-rose-600 bg-rose-50 border border-rose-100 flex items-center justify-center gap-2"
                >
                  <span>🚪</span>
                  <span>Log Out of Account</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Profile Modal — open when URL contains ?account=true */}
      {searchParams?.has("account") && (
        <ProfileModal onClose={closeAccountModal} />
      )}

      {/* Search Modal */}
      {isSearchOpen && (
        <SearchModal onClose={() => setIsSearchOpen(false)} />
      )}
    </>
  );
};

export default Header;
