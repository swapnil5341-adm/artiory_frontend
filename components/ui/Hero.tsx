"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

const slides = [
  {
    id: 1,
    title: "Artiory Banner 1",
    desktop: "/Banner1_web.jpeg",
    mobile: "/Banner1_mobile.jpeg",
    link: "/listing?all=true",
  },
  {
    id: 2,
    title: "Artiory Banner 2",
    desktop: "/Banner2_web.jpeg",
    mobile: "/Banner2_mobile.jpeg",
    link: "/listing?category=Art%20%26%20Craft",
  },
];

const Hero: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  // Auto-play sliding animation every 4.5 seconds
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 4500);

    return () => clearInterval(interval);
  }, [nextSlide, isHovered]);

  // Touch swipe support for mobile/tablet
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    if (distance > 50) {
      nextSlide();
    } else if (distance < -50) {
      prevSlide();
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  return (
    <section
      className="relative w-full overflow-hidden bg-slate-900 select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Promotional Hero Banners"
    >
      {/* Horizontal Sliding Track (Smooth horizontal slide only, NO zoom in/out) */}
      <div
        className="flex w-full transition-transform duration-700 ease-in-out will-change-transform"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div key={slide.id} className="w-full flex-shrink-0 relative">
            <Link
              href={slide.link}
              className="block w-full focus:outline-none"
              tabIndex={currentSlide === index ? 0 : -1}
            >
              {/* Desktop / Laptop Web Banner (16:9 ratio matching 1280x720) */}
              <div className="hidden md:block relative w-full aspect-[16/9] max-h-[85vh]">
                <Image
                  src={slide.desktop}
                  alt={slide.title}
                  fill
                  priority={index === 0}
                  className="object-cover object-center"
                  sizes="100vw"
                />
              </div>

              {/* Mobile View Banner (Taller height for prominent, full-impact view) */}
              <div className="block md:hidden relative w-full h-[75vh] min-h-[540px] max-h-[750px]">
                <Image
                  src={slide.mobile}
                  alt={`${slide.title} Mobile`}
                  fill
                  priority={index === 0}
                  className="object-cover object-center"
                  sizes="100vw"
                />
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Hero;

