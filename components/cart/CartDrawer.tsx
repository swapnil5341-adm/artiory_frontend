"use client";
import { useState, useEffect } from "react";
import { CartItem, useCart } from "@/app/context/cart/Cartcontext";
import { Trash, Plus, Minus, X } from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";
import Image from "next/image";
import { Londrina_Solid } from "next/font/google";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const londrina = Londrina_Solid({
  weight: ["100", "300", "400", "900"],
  subsets: ["latin"],
  display: "swap",
});

export default function CartPage() {
  const { cart, dispatch } = useCart(); 
  const { data: session, status } = useSession();
  const router = useRouter();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  const totalAmount = cart.items.reduce(
    (sum: number, item: CartItem) => sum + item.price * item.quantity,
    0
  );

  // Fetch available coupons
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com"}/api/coupons`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          // Only show active coupons
          const active = json.data.filter((c: any) => c.active && new Date(c.expiry) > new Date());
          setCoupons(active);
        }
      })
      .catch((err) => console.error("Error loading coupons:", err));
  }, []);

  const handleApplyCoupon = (codeToApply?: string) => {
    const targetCode = (codeToApply || couponCode).trim().toUpperCase();
    if (!targetCode) return;

    setCouponError("");
    setCouponSuccess("");

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com"}/api/coupons/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: targetCode,
        orderTotal: totalAmount,
      }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.message || "Invalid coupon code");
        }
        setAppliedCoupon(json.data);
        setCouponSuccess(`Coupon "${json.data.code}" applied! Saved ₹${json.data.discountAmount}`);
        setCouponCode(json.data.code);
      })
      .catch((err) => {
        console.error(err);
        setCouponError(err.message || "Failed to apply coupon");
        setAppliedCoupon(null);
      });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponSuccess("");
    setCouponError("");
  };

  const handleIncrement = (id: string) => {
    const item = cart.items.find((i) => i.id === id);
    if (!item) return;
    const maxStock = item.stock ?? 999;
    if (item.quantity >= maxStock) {
      toast.warn(`Cannot add more. Only ${maxStock} items available in stock!`, { position: "bottom-right", autoClose: 2000 });
      return;
    }
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity: item.quantity + 1 } });
  };

  const handleDecrement = (id: string) => {
    const item = cart.items.find((i) => i.id === id);
    if (!item) return;
    if (item.quantity <= 1) {
      dispatch({ type: "REMOVE_ITEM", payload: id });
    } else {
      dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity: item.quantity - 1 } });
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <p className={`${londrina.className} text-xl font-light mb-4 text-[#2e306a]`}>
        <Link
          href="/"
          className="hover:underline hover:text-[#00ba82] transition-all duration-300 ease-in-out"
        >
          Home /
        </Link>{" "}
        <span className="text-[#00ba82]">Your Shopping Cart</span>
      </p>

      <h2 className={`${londrina.className} text-4xl text-[#2e306a] mb-6`}>Your Cart</h2>

      {cart.items.length === 0 ? (
        <p className="text-gray-500 text-center">Your cart is empty</p>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#EAEAEA] text-left">
                  <th className="p-3">Product</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Subtotal</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {cart.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-3 flex items-center gap-3">
                      <Link href={`/product/${item.id}`} className="shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={70}
                          height={70}
                          className="rounded h-auto w-22 hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                      <div className="flex flex-col">
                        <Link href={`/product/${item.id}`} className="hover:text-[#00b8a2] transition-colors font-medium">
                          {item.name}
                        </Link>
                        {item.stock !== undefined && item.quantity >= item.stock && (
                          <span className="text-[10px] text-rose-500 font-semibold mt-1">⚠️ Max limit reached (Only {item.stock} left)</span>
                        )}
                        {item.stock !== undefined && item.stock <= 5 && item.quantity < item.stock && (
                          <span className="text-[10px] text-amber-500 font-semibold mt-1">⚠️ Low Stock: Only {item.stock} left</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">&#x20B9;{item.price}</td>
                    <td className="p-3">
                      <div className="flex items-center border rounded-md overflow-hidden w-fit bg-white">
                        <button
                          className="px-2 py-1 border-r hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleDecrement(item.id)}
                        >
                          <Minus size={20} />
                        </button>
                        <span className="px-3 min-w-[24px] text-center font-semibold">{item.quantity}</span>
                        <button
                          disabled={item.stock !== undefined && item.quantity >= item.stock}
                          className="px-2 py-1 border-l hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
                          onClick={() => handleIncrement(item.id)}
                          title={item.stock !== undefined && item.quantity >= item.stock ? "Stock limit reached" : ""}
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </td>
                    <td className="p-3 font-medium">&#x20B9;{item.price * item.quantity}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => dispatch({ type: "REMOVE_ITEM", payload: item.id })}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 flex flex-col gap-3">
                <div className="flex gap-3 items-center">
                  <Link href={`/product/${item.id}`} className="shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={60}
                      height={60}
                      className="rounded hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  <div>
                    <Link href={`/product/${item.id}`} className="hover:text-[#00b8a2] transition-colors font-semibold block text-sm">
                      {item.name}
                    </Link>
                    {/* <p className="text-gray-600 text-sm">
                      &#x20B9;{item.price} | SKU: BR-00{item.id}
                    </p> */}
                    {item.stock !== undefined && item.quantity >= item.stock && (
                      <p className="text-[10px] text-rose-500 font-semibold mt-1">⚠️ Max limit reached (Only {item.stock} left)</p>
                    )}
                    {item.stock !== undefined && item.stock <= 5 && item.quantity < item.stock && (
                      <p className="text-[10px] text-amber-500 font-semibold mt-1">⚠️ Low Stock: Only {item.stock} left</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center border rounded-md overflow-hidden bg-white">
                    <button
                      className="px-3 py-1 border-r hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleDecrement(item.id)}
                    >
                      <Minus size={18} />
                    </button>
                    <span className="px-3 min-w-[20px] text-center font-semibold">{item.quantity}</span>
                    <button
                      disabled={item.stock !== undefined && item.quantity >= item.stock}
                      className="px-3 py-1 border-l hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer"
                      onClick={() => handleIncrement(item.id)}
                      title={item.stock !== undefined && item.quantity >= item.stock ? "Stock limit reached" : ""}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <p className="font-medium">&#x20B9;{item.price * item.quantity}</p>
                  <button
                    onClick={() => dispatch({ type: "REMOVE_ITEM", payload: item.id })}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Coupon codes list and Cart Summary */}
          <div className="flex flex-col lg:flex-row lg:justify-between gap-8 mt-10 border-t border-gray-150 pt-8">
            <div className="w-full lg:w-3/5 space-y-4">
              <h4 className={`${londrina.className} text-2xl text-[#2e306a] font-semibold mb-2`}>Available Coupons & Offers</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coupons.map((c) => {
                  const eligible = totalAmount >= c.minOrder;
                  const diff = c.minOrder - totalAmount;

                  return (
                    <div
                      key={c._id || c.id}
                      onClick={() => eligible && handleApplyCoupon(c.code)}
                      className={`border rounded-2xl p-4 transition-all duration-300 relative select-none flex flex-col justify-between ${
                        eligible
                          ? "border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50/70 cursor-pointer hover:border-emerald-400 hover:shadow-sm"
                          : "border-gray-200 bg-gray-50/50 opacity-80"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-mono font-bold text-xs bg-white border border-dashed border-[#2e306a]/40 px-2.5 py-1 rounded text-[#2e306a]">
                            {c.code}
                          </span>
                          {eligible ? (
                            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                              Eligible
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 bg-amber-100 px-2.5 py-0.5 rounded-full">
                              Locked
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-base text-[#2e306a] mt-3">
                          {c.type === "percent" ? `${c.value}% OFF` : `Flat ₹${c.value} OFF`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{c.description}</p>
                      </div>
                      
                      {!eligible && (
                        <p className="text-[10px] text-amber-600 font-semibold mt-3 bg-amber-50 px-2 py-1 rounded border border-amber-200/50">
                          Add ₹{diff} more to unlock this offer
                        </p>
                      )}
                      {eligible && (
                        <p className="text-[10px] text-emerald-600 font-semibold mt-3">
                          ✓ Click to apply code
                        </p>
                      )}
                    </div>
                  );
                })}
                {coupons.length === 0 && (
                  <p className="text-sm text-gray-400">No active promotional codes available right now.</p>
                )}
              </div>
            </div>

            {/* Cart Total Card */}
            <div className="w-full lg:w-1/3">
              <div className="border border-gray-300 rounded-2xl p-6 shadow-sm bg-white">
                <h3 className="text-lg font-bold text-[#2e306a] mb-4">Cart Total</h3>
                
                {/* Coupon Apply Box */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={!!appliedCoupon}
                    className="border border-gray-300 px-3 py-2 rounded-lg text-sm w-full uppercase focus:outline-none focus:ring focus:ring-violet-200"
                  />
                  {appliedCoupon ? (
                    <button
                      onClick={handleRemoveCoupon}
                      className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold px-4 rounded-lg transition"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApplyCoupon()}
                      disabled={!couponCode.trim()}
                      className="bg-[#2e306a] hover:bg-[#1d1e44] text-white text-xs font-semibold px-4 rounded-lg transition disabled:opacity-50"
                    >
                      Apply
                    </button>
                  )}
                </div>

                {couponError && (
                  <p className="text-xs text-rose-500 font-semibold mb-3">⚠ {couponError}</p>
                )}
                {couponSuccess && (
                  <p className="text-xs text-emerald-600 font-semibold mb-3">✓ {couponSuccess}</p>
                )}

                <div className="space-y-2 border-t border-gray-100 pt-4 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-800">&#x20B9;{totalAmount}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>-&#x20B9;{appliedCoupon.discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-dashed border-gray-200 pt-3 text-[#2e306a]">
                    <span className="font-bold text-base">Total</span>
                    <span className="font-black text-xl">
                      &#x20B9;{appliedCoupon ? Math.max(0, totalAmount - appliedCoupon.discountAmount) : totalAmount}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (status === "authenticated" && session?.user) {
                      router.push("/checkout");
                    } else {
                      setShowAuthModal(true);
                    }
                  }}
                  className="bg-[#FFE926] hover:bg-[#ebd51e] w-full py-3.5 mt-5 rounded-xl text-[#1e1e4d] font-bold cursor-pointer transition shadow-sm text-center block active:scale-[0.99]"
                >
                  Proceed to checkout
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Auth Modal for Guest Proceed to Checkout */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => !isSigningIn && setShowAuthModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 sm:p-8 border border-gray-100 z-10 text-center transform transition-all">
            {/* Close button */}
            <button
              onClick={() => !isSigningIn && setShowAuthModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {/* Brand Logo */}
            <div className="mx-auto mb-4 flex items-center justify-center">
              <Image
                width={100}
                height={50}
                src="/Artiory-Logo.svg"
                alt="Artiory Logo"
                className="mx-auto h-auto w-24"
              />
            </div>

            <h3 className={`${londrina.className} text-3xl text-[#2e306a] mb-2 font-bold`}>
              Login or Register to Continue
            </h3>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              Sign in with your Google account to proceed to checkout, deliver to your address, and track your orders.
            </p>

            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={() => {
                setIsSigningIn(true);
                signIn("google", { callbackUrl: "/checkout" });
              }}
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-2xl py-3.5 px-4 mb-4 shadow-sm hover:shadow-md hover:border-gray-400 transition bg-white cursor-pointer active:scale-[0.98] disabled:opacity-60"
            >
              <Image
                width={22}
                height={22}
                src="https://cdn-icons-png.flaticon.com/128/281/281764.png"
                alt="Google Icon"
              />
              <span className="text-[#2e306a] font-bold text-base">
                {isSigningIn ? "Connecting Google..." : "Continue with Google"}
              </span>
            </button>

            {/* Email login option */}
            <div className="pt-2 text-xs text-gray-500">
              Prefer signing in with email?{" "}
              <Link
                href="/auth/signin?callbackUrl=/checkout"
                className="text-[#00ba82] font-semibold hover:underline"
              >
                Sign in here
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
