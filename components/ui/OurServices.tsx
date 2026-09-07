import React from 'react'
import { Sparkle, Gift, Rainbow } from "lucide-react";
import { Poppins } from "next/font/google";
import WaveDivider from './WaveDivider';

const poppins = Poppins({
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    subsets: ["latin"],
    display: "swap",
});

const services = [
    {
        icon: Gift,
        title: "Perfect Return Gifts & Gift Hampers",
        desc: "Celebrate every special occasion with Artiory's thoughtfully curated return gifts and premium gift hampers. Packed with fun, useful, and kid-friendly products, they're perfect for birthdays, school events, and celebrations.",
    },
    {
        icon: Rainbow,
        title: "Wide Range of Kid's Essentials",
        desc: "Discover a diverse collection of trendy, colourful, and high-quality products designed for kids. From stationery and school essentials to bottles, lunchboxes, backpacks, toys, and more — all in one place.",
    },
    {
        icon: Sparkle,
        title: "Exclusive & Innovative Products",
        desc: "Artiory brings you a unique range of thoughtfully designed products that stand out from the ordinary. Our exclusive collection is created especially for kids, offering playful, practical, and innovative products.",
    },
];

const OurServices = () => {
    return (
        <section className={`${poppins.className} relative z-10 mx-auto`}>
            <WaveDivider bgColor="#e5fef0" className="mb-[-2px] -mt-6 sm:-mt-10 md:-mt-14 lg:-mt-18 xl:-mt-22" flip />
            <div className="bg-[#e5fef0] py-12 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="flex items-start gap-4">
                            <div className="shrink-0 bg-[#00b8a2] w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center">
                                <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                            </div>
                            <div>
                                <h4 className="text-sm sm:text-base font-bold text-[#1e1e4d] leading-snug mb-1">{title}</h4>
                                <p className="text-xs sm:text-sm text-gray-500 font-light italic leading-relaxed">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <WaveDivider bgColor="#e5fef0" className="mt-0 transform -translate-y-2" />
        </section>
    );
};

export default OurServices;
