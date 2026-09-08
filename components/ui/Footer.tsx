import React from "react";
import Image from "next/image";
import { Facebook, Youtube, Twitter, Instagram } from "lucide-react";
import { Quicksand } from "next/font/google";
import Link from "next/link";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"], // choose weights you need
  display: "swap",
});

const Footer = () => {
  return (
    <footer className={`bg-white text-[#1e1e4d] py-12 px-6 mt-auto ${quicksand.className}`}>
      <div className="max-w-8xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-15">
        
        {/* Left Section - Logo & Socials */}
        <div className="flex flex-col items-center md:items-center">
          <Image src="/Artiory-Logo.svg" className="cursor-pointer" alt="Logo" width={180} height={80} />
          <div className="flex gap-1 mt-3">
            {/* <Link href="#"><Facebook className="text-[#4267B2] hover:scale-110 transition" size={28} /></Link> */}
            <Link href="https://www.youtube.com/@artiory"><Youtube className="text-[#FF0000] hover:scale-110 transition" size={29} /></Link>
            {/* <Link href="#"><Twitter className="text-[#1DA1F2] hover:scale-110 transition" size={28} /></Link> */}
            <Link href="https://www.instagram.com/artiory.in/"><Instagram className="text-[#E1306C] hover:scale-110 transition" size={24} /></Link>
          </div>
        </div>

        {/* Middle Section - Links */}
        <div className="grid grid-cols-2 gap-8 md:text-left">
          <div>
            <h3 className="font-bold text-lg mb-3">Quick Links</h3>
            <ul className="space-y-1">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li><Link href="/about" className="hover:underline">About us</Link></li>
              <li><Link href="/listing" className="hover:underline">Products</Link></li>
              <li><Link href="/track-order" className="hover:underline text-emerald-600 font-semibold">Track Order</Link></li>
              {/* <li><Link href="#" className="hover:underline">Mission</Link></li> */}
              {/* <li><Link href="#" className="hover:underline">Blog</Link></li> */}
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-3">Important Links</h3>
            <ul className="space-y-1">
              <li><Link href="/privacy" className="hover:underline">Privacy Policy</Link></li>
              <li><Link href="/shipping" className="hover:underline">Shipping Policy</Link></li>
              <li><Link href="/terms" className="hover:underline">Terms & Conditions</Link></li>
              <li><Link href="/return_refund" className="hover:underline">Return & Refund Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Right Section - Contact */}
        <div className="md:text-left">
          <h3 className="font-bold text-lg mb-3">Contact us</h3>
          <p>Chhadva residency, V N Purav <br/>Marg, Chembur, Mumbai 400071</p>
          <p className="mt-3">
            Email: <Link href="mailto:info@arttory.com" className="hover:underline">contact@artiory.com</Link>
          </p>
          <p>Phone: <Link href="tel:+919820136133" className="hover:underline"> +91 81085 61836</Link></p>
        </div>
   
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Artiory. All rights reserved.</p>

        <div className="flex items-center gap-1">
          <span>Designed & Developed by</span>
          <span className="font-semibold hover:text-[#00b8a2] transition-colors">
            Click Trick 
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
