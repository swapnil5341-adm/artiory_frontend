"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useCart } from "@/app/context/cart/Cartcontext";
import Link from "next/link";
import { Londrina_Solid } from "next/font/google";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const londrina = Londrina_Solid({
  weight: ["100", "300", "400", "900"],
  subsets: ["latin"],
  display: "swap",
});

type CartItem = {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
};

export default function CheckoutPage() {
  const { cartItems, getCartTotal } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    home: "",
    address: "",
    landmark: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    alternatePhone: "",
    email: "",
    notes: "",
    addressType: "Home",
    saveAddressToProfile: true,
    paymentMethod: "sabpaisa",
  });

  const [pincodeChecking, setPincodeChecking] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState<"serviceable" | "unserviceable" | "">("");
  const [pincodeMessage, setPincodeMessage] = useState("");
  const [shipping, setShipping] = useState<number | null>(null);

  const checkPincode = async (zipCode: string) => {
    const cleaned = zipCode.replace(/\D/g, "");
    if (!cleaned || cleaned.length !== 6) {
      setPincodeStatus("");
      setPincodeMessage("");
      setShipping(null);
      return;
    }

    try {
      setPincodeChecking(true);
      setPincodeStatus("");
      setPincodeMessage("");

      const orderItems = cartItems.map((item) => ({
        productId: item.id,
        qty: item.quantity,
      }));

      const backendBase = (process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com").replace(/\/+$/, "");
      const chargeRes = await fetch(`${backendBase}/api/logistics/shipping-charge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          pincode: cleaned,
          totalPrice: getCartTotal(),
          orderItems,
          payment_method: "prepaid"
        }),
      });
      const chargeJson = await chargeRes.json();
      if (chargeRes.ok && chargeJson.success && chargeJson.serviceable !== false) {
        const liveShippingRate = Number(chargeJson.shippingCharge || 0);
        setShipping(liveShippingRate);
        setPincodeStatus("serviceable");
        const courierNote = chargeJson.courierName ? ` via ${chargeJson.courierName}` : "";
        const weightNote = chargeJson.weightGrams ? ` (${chargeJson.weightGrams} gm)` : "";
        const eddNote = chargeJson.edd ? ` • Est. Delivery: ${chargeJson.edd}` : "";
        setPincodeMessage(`✅ Delivery available${courierNote}${weightNote} • Shipping: ₹${liveShippingRate}${eddNote}`);
      } else if (chargeJson.serviceable === false) {
        setShipping(null);
        setPincodeStatus("unserviceable");
        setPincodeMessage(`❌ ${chargeJson.message || "Sorry, delivery is not available for this pincode."}`);
      } else {
        const fallbackRate = Number(chargeJson.shippingCharge || 65);
        setShipping(fallbackRate);
        setPincodeStatus("serviceable");
        setPincodeMessage(`✅ Delivery available • Shipping: ₹${fallbackRate}`);
      }
    } catch (err) {
      console.error("Pincode rate check error:", err);
      setShipping(65);
      setPincodeStatus("serviceable");
      setPincodeMessage("✅ Delivery available • Shipping: ₹65");
    } finally {
      setPincodeChecking(false);
    }
  };

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [applying, setApplying] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponStatus, setCouponStatus] = useState<"success" | "error" | "">("");

  const subtotal = getCartTotal();
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const shippingCost = shipping ?? 0;
  const total = Math.max(0, subtotal + shippingCost - discountAmount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      setApplying(true);
      setCouponMessage("");
      setCouponStatus("");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.artiory.com"}/api/coupons/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          code: couponCode,
          orderTotal: subtotal,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Invalid coupon code");
      }

      setAppliedCoupon(json.data);
      setCouponMessage(`Coupon applied! You saved ₹${json.data.discountAmount}`);
      setCouponStatus("success");
    } catch (err: any) {
      console.error(err);
      setCouponMessage(err.message || "Failed to apply coupon");
      setCouponStatus("error");
    } finally {
      setApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponMessage("");
    setCouponStatus("");
  };

  const [placing, setPlacing] = useState(false);

  const handlePlaceOrder = async () => {
    if (pincodeStatus === "unserviceable") {
      alert("Cannot place order. Selected delivery address pincode is not serviceable by our shipping partner.");
      return;
    }

    const fullName = `${form.firstName} ${form.lastName}`.trim();
    if (!fullName || !form.home.trim() || !form.address.trim() || !form.city.trim() || !form.state.trim() || !form.email.trim() || !form.phone.trim() || !form.zip.trim()) {
      alert("Please fill in all required delivery information marked with * (Name, Flat/House No, Street, City, State, 6-digit Pincode, Mobile & Email).");
      return;
    }

    const cleanedPhone = form.phone.replace(/\D/g, "");
    if (cleanedPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number for delivery.");
      return;
    }

    const cleanedZip = form.zip.replace(/\D/g, "");
    if (cleanedZip.length !== 6) {
      alert("Please enter a valid 6-digit postal PIN code.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      alert("Please enter a valid email address.");
      return;
    }

    if (cartItems.length === 0) {
      alert("Your cart is empty");
      return;
    }

    try {
      setPlacing(true);

      const orderItems = cartItems.map((item) => ({
        productId: item.id,
        name: item.name,
        qty: item.quantity,
        price: item.price,
      }));

      const shippingAddress = {
        name: `${form.firstName} ${form.lastName}`.trim() || "Customer",
        email: form.email.trim(),
        phone: cleanedPhone.slice(-10),
        alternatePhone: form.alternatePhone?.trim() ? form.alternatePhone.replace(/\D/g, "").slice(-10) : "",
        home: form.home.trim(),
        street: form.address.trim(),
        landmark: form.landmark?.trim() || "",
        address: [form.home.trim(), form.address.trim(), form.landmark?.trim()].filter(Boolean).join(", "),
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: cleanedZip,
        country: "India",
        addressType: form.addressType || "Home",
      };

      // Optional: Auto-save new address to profile if checked
      if (form.saveAddressToProfile && session?.user) {
        fetch("/api/address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            home: form.home.trim(),
            street: form.address.trim(),
            landmark: form.landmark?.trim() || "",
            city: form.city.trim(),
            state: form.state.trim(),
            postalCode: cleanedZip,
            phone: cleanedPhone.slice(-10),
            alternatePhone: form.alternatePhone?.trim() ? form.alternatePhone.replace(/\D/g, "").slice(-10) : "",
            email: form.email.trim(),
            type: form.addressType || "Home",
            country: "India",
            isDefault: savedAddresses.length === 0,
          }),
        }).catch((e) => console.error("Address auto-save notice:", e));
      }

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderItems,
          totalPrice: total,
          shippingAddress,
          discountAmount,
          shippingCharge: shipping,
          couponCode: appliedCoupon?.code || "",
        }),
      });

      const orderJson = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderJson.message || "Failed to create order");
      }

      const orderId = orderJson._id;

      if (typeof window !== "undefined" && orderId) {
        try {
          const existing = JSON.parse(localStorage.getItem("artiory_guest_orders") || "[]");
          const updated = [orderId, ...existing.filter((id: string) => id !== orderId)].slice(0, 10);
          localStorage.setItem("artiory_guest_orders", JSON.stringify(updated));
          localStorage.setItem("artiory_recent_order", orderId);
        } catch (e) {
          console.error("Local order save notice:", e);
        }
      }

      const currentOrigin = typeof window !== "undefined" && window.location.origin && !window.location.origin.includes("3011")
        ? window.location.origin
        : "https://artiory.com";

      const paymentRes = await fetch("/api/payment/sabpaisa/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, returnUrl: currentOrigin }),
      });

      const paymentJson = await paymentRes.json();
      if (!paymentRes.ok) {
        throw new Error(paymentJson.message || "Failed to initialize payment gateway");
      }

      if (paymentJson.checkoutUrl) {
        window.location.href = paymentJson.checkoutUrl;
        return;
      }

      const { encData, clientCode, sabpaisaUrl } = paymentJson;

      // Dynamically build and submit redirection form
      const formEl = document.createElement("form");
      formEl.method = "POST";
      formEl.action = sabpaisaUrl;

      const addField = (name: string, value: string) => {
        if (!value) return;
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        formEl.appendChild(input);
      };

      addField("clientCode", clientCode);
      addField("clientcode", clientCode);
      addField("client_code", clientCode);
      addField("encData", encData);
      addField("encdata", encData);

      document.body.appendChild(formEl);
      formEl.submit();
    } catch (err: any) {
      console.error("Place Order Error:", err);
      alert(err.message || "Something went wrong while placing your order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  useEffect(() => {
    if (session?.user) {
      // 1. Autofill profile name and email
      const nameParts = (session.user.name || "").trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      setForm((prev) => ({
        ...prev,
        firstName: prev.firstName || firstName,
        lastName: prev.lastName || lastName,
        email: prev.email || session.user.email || "",
        phone: prev.phone || (session.user as any).number || "",
      }));

      // 2. Fetch addresses
      fetch("/api/address")
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Failed to load addresses");
        })
        .then((json) => {
          setSavedAddresses(Array.isArray(json.data) ? json.data : []);
        })
        .catch((err) => console.error(err));
    }
  }, [session]);

  const handleSelectAddress = (addressId: string) => {
    setSelectedAddressId(addressId);
    if (!addressId) return;

    const selected = savedAddresses.find((addr) => addr._id === addressId);
    if (selected) {
      setForm((prev) => ({
        ...prev,
        firstName: selected.firstName || prev.firstName || "",
        lastName: selected.lastName || prev.lastName || "",
        email: selected.email || prev.email || "",
        home: selected.home || "",
        address: selected.street || selected.address || "",
        landmark: selected.landmark || "",
        city: selected.city || "",
        state: selected.state || "",
        zip: selected.postalCode || "",
        phone: selected.phone || prev.phone || "",
        alternatePhone: selected.alternatePhone || prev.alternatePhone || "",
        addressType: selected.type || prev.addressType || "Home",
      }));
      checkPincode(selected.postalCode || "");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === "zip") {
      checkPincode(value);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-white">
        <div className="w-12 h-12 border-4 border-[#00ba82] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium text-sm">Loading checkout...</p>
      </div>
    );
  }

  return (
    <section className={`bg-white py-12 px-4 md:px-10 lg:px-00 xl:px-40 2xl:px-80 text-[#2e306a]`}>
      {/* Breadcrumb */}
        <p className={`${londrina.className} text-xl font-light mb-4 text-[#2e306a]`}>
        <Link
          href="/"
          className="hover:underline hover:text-[#00ba82] transition-all duration-300 ease-in-out"
        >
          Home /
        </Link>{" "}
        <span className="text-[#00ba82]">Checkout</span>
      </p>
      <h1 className={`${londrina.className} text-3xl font-bold mb-10`}>Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* LEFT SIDE - Form */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Delivery Info */}
          <div className="border border-gray-300 rounded-xl p-8 shadow-md">
            <h2 className={`${londrina.className} text-2xl font-semibold mb-6`}>Delivery Information</h2>

            {!session?.user && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[#2e306a]">
                <div className="text-xs sm:text-sm">
                  <span className="font-bold text-[#00ba82]">⚡ Direct Guest Checkout:</span> Enter your delivery address below to place order directly.
                </div>
                <button
                  type="button"
                  onClick={() => signIn("google", { callbackUrl: "/checkout" })}
                  className="shrink-0 bg-[#2e306a] hover:bg-[#1d1e44] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-2"
                >
                  <Image
                    width={14}
                    height={14}
                    src="https://cdn-icons-png.flaticon.com/128/281/281764.png"
                    alt="Google"
                  />
                  <span>Sign in with Google</span>
                </button>
              </div>
            )}
            
            {savedAddresses.length > 0 && (
              <div className="mb-6 bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4">
                <label className="block text-sm font-semibold text-[#2e306a] mb-2">
                  Select a Saved Address
                </label>
                <select
                  value={selectedAddressId}
                  onChange={(e) => handleSelectAddress(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 bg-white text-[#2e306a] focus:outline-none focus:ring focus:ring-gray-300 font-medium"
                >
                  <option value="">-- Choose from your saved addresses --</option>
                  {savedAddresses.map((addr) => (
                    <option key={addr._id} value={addr._id}>
                      {addr.type || addr.home || "Address"} - {addr.street}, {addr.city}, {addr.state} ({addr.phone})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Full Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">First Name</label>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                  className="border border-gray-300 rounded-lg p-3 w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name *</label>
                <input
                  name="lastName"
                  required
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Last Name *"
                  className="border border-gray-300 rounded-lg p-3 w-full text-sm"
                />
              </div>
            </div>

            {/* Contact Details (Phone, Alternate Phone, Email) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Mobile Number *</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-xs font-bold text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg">
                    +91
                  </span>
                  <input
                    name="phone"
                    required
                    type="tel"
                    maxLength={10}
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile number *"
                    className="border border-gray-300 rounded-r-lg p-3 w-full text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Alternate Phone (Optional)</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-xs font-bold text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg">
                    +91
                  </span>
                  <input
                    name="alternatePhone"
                    type="tel"
                    maxLength={10}
                    value={form.alternatePhone}
                    onChange={handleChange}
                    placeholder="Secondary contact"
                    className="border border-gray-300 rounded-r-lg p-3 w-full text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address * (For live tracking updates & invoice)</label>
              <input
                name="email"
                required
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@example.com *"
                className="border border-gray-300 rounded-lg p-3 w-full text-sm"
              />
            </div>

            {/* Address Line 1 & Line 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Flat / House No. / Building / Floor *</label>
                <input
                  name="home"
                  required
                  value={form.home}
                  onChange={handleChange}
                  placeholder="e.g. Flat 402, Sunshine Apts *"
                  className="border border-gray-300 rounded-lg p-3 w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Street / Area / Colony / Road *</label>
                <input
                  name="address"
                  required
                  value={form.address}
                  onChange={handleChange}
                  placeholder="e.g. 14th Main Road, Indiranagar *"
                  className="border border-gray-300 rounded-lg p-3 w-full text-sm"
                />
              </div>
            </div>

            {/* Landmark */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nearby Landmark (Optional - Helps courier find you easily)</label>
              <input
                name="landmark"
                value={form.landmark}
                onChange={handleChange}
                placeholder="e.g. Near City Hospital / Opposite Metro Pillar 120"
                className="border border-gray-300 rounded-lg p-3 w-full text-sm"
              />
            </div>

            {/* City & State */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Town / City *</label>
                <input
                  name="city"
                  required
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g. Mumbai *"
                  className="border border-gray-300 rounded-lg p-3 w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">State *</label>
                <input
                  name="state"
                  required
                  value={form.state}
                  onChange={handleChange}
                  placeholder="e.g. Maharashtra *"
                  className="border border-gray-300 rounded-lg p-3 w-full text-sm"
                />
              </div>
            </div>

            {/* PIN Code & Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Postal PIN Code *</label>
                <input
                  name="zip"
                  required
                  maxLength={6}
                  value={form.zip}
                  onChange={handleChange}
                  placeholder="6-digit PIN Code *"
                  className="border border-gray-300 rounded-lg p-3 w-full text-sm"
                />
                {pincodeChecking && <p className="text-[10px] text-gray-500 mt-1">Verifying courier serviceability...</p>}
                {pincodeMessage && (
                  <p className={`text-[10px] ${pincodeStatus === "serviceable" ? "text-emerald-600" : "text-rose-500"} font-semibold mt-1`}>
                    {pincodeMessage}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Country</label>
                <input
                  disabled
                  value="India 🇮🇳"
                  className="border border-gray-200 bg-gray-100 text-gray-700 rounded-lg p-3 w-full text-sm cursor-not-allowed font-medium"
                />
              </div>
            </div>

            {/* Address Type Selection */}
            <div className="mt-5">
              <label className="block text-xs font-semibold text-gray-700 mb-2">Address Type</label>
              <div className="flex gap-3">
                {[
                  { id: "Home", label: "🏠 Home (All Day Delivery)" },
                  { id: "Work", label: "🏢 Work / Office (10 AM - 6 PM)" },
                  { id: "Other", label: "📍 Other" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setForm({ ...form, addressType: t.id })}
                    className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      form.addressType === t.id
                        ? "bg-[#2e306a] text-white border-[#2e306a]"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Order Notes */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Special Delivery Instructions (Optional)</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="e.g. Leave package with building security if not available"
                className="border border-gray-300 rounded-lg p-3 w-full text-sm h-20 resize-none"
              />
            </div>

            {/* Save Address to Profile Checkbox */}
            {session?.user && (
              <label className="flex items-center gap-2.5 mt-4 cursor-pointer text-xs font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={form.saveAddressToProfile}
                  onChange={(e) => setForm({ ...form, saveAddressToProfile: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                />
                <span>Save this address to my profile for faster 1-click checkouts</span>
              </label>
            )}
          </div>

          {/* Payment Section - 100% Online Payment */}
          <div className="border border-gray-200/90 rounded-2xl p-6 sm:p-8 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h2 className={`${londrina.className} text-2xl font-bold text-[#2e306a]`}>Payment Method</h2>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                🔒 100% Secure & Verified
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-5">Pay instantly and securely using any UPI App (GPay, PhonePe, Paytm, BHIM) by scanning the QR code.</p>

            {/* Online Payment Card (Pre-selected) */}
            <div className="relative flex flex-col p-4 sm:p-5 rounded-xl border-2 border-[#00b8a2] bg-[#f0fdfa] shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-[#00b8a2] bg-[#00b8a2] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm sm:text-base font-bold text-[#2e306a]">
                        Instant UPI & QR Payment
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Fast & Direct
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Scan QR code with Google Pay, PhonePe, Paytm, Cred or any UPI app for zero-delay instant confirmation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Supported badges */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-emerald-100 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-2xs">
                  📱 Scan & Pay QR
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-2xs">
                  ⚡ PhonePe / Google Pay / Paytm
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-2xs">
                  🛡️ Instant Order Verification
                </span>
              </div>
            </div>

            {/* Place Order & Pay Button */}
            <button 
              onClick={handlePlaceOrder}
              disabled={placing}
              className="bg-[#00b8a2] hover:bg-[#009e8b] text-white font-bold text-base rounded-xl w-full mt-6 py-3.5 shadow-md shadow-[#00b8a2]/20 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {placing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Generating Payment QR...</span>
                </>
              ) : (
                <>
                  <span>📱 Scan & Pay ₹{total.toFixed(2)} via UPI QR</span>
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-gray-400 mt-3">
              By placing this order, you agree to Artiory's Terms of Service & Privacy Policy.
            </p>
          </div>
        </div>

        <div className="border border-gray-300 rounded-xl p-3 shadow-md h-fit flex flex-col justify-between">
          <h2 className={`${londrina.className} text-2xl font-semibold mb-6`}>Your Order</h2>

          {cartItems.length === 0 ? (
            <p className="text-gray-500 text-sm">Your cart is empty.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {cartItems.map((item: CartItem) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center border rounded-2xl border-gray-300 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={50}
                      height={50}
                      className="rounded"
                    />
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium">&#8377;{item.price * item.quantity}</p>
                </div>
              ))}
            </div>
          )}

          {/* Promo Code Coupon Section */}
          <div className="mt-6 border border-gray-300 rounded-2xl p-4 space-y-3">
            <h3 className={`${londrina.className} text-xl font-semibold`}>Promo / Coupon Code</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Coupon Code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                disabled={!!appliedCoupon}
                className="border border-gray-300 rounded-lg p-2.5 flex-1 uppercase text-sm focus:outline-none focus:ring focus:ring-emerald-200"
              />
              {appliedCoupon ? (
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-lg px-4 text-sm transition"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={!couponCode.trim() || applying}
                  className="bg-[#2e306a] hover:bg-[#1d1e44] text-white font-medium rounded-lg px-5 text-sm transition disabled:opacity-50"
                >
                  {applying ? "Applying..." : "Apply"}
                </button>
              )}
            </div>
            {couponMessage && (
              <p className={`text-xs ${couponStatus === "success" ? "text-emerald-600" : "text-rose-500"} font-medium`}>
                {couponMessage}
              </p>
            )}
          </div>

          {/* Totals */}
          <div className="mt-6 border border-gray-300 rounded-2xl p-4 pt-4 space-y-2 text-gray-700">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>&#8377;{subtotal}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount Applied ({appliedCoupon?.code})</span>
                <span>-&#8377;{discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span>Shipping Charges</span>
              <span className="font-semibold text-gray-800">
                {shipping !== null ? (
                  `₹${shipping.toFixed(2)}`
                ) : (
                  <span className="text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Enter PIN Code to calculate
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t border-dashed border-gray-300 pt-2">
              <span>Total</span>
              <span>&#8377;{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
