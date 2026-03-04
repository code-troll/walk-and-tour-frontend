"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { navLinks } from "@/lib/landing-data";
import { CalendarCheckIcon } from "lucide-react";

const SCROLL_THRESHOLD = 32;

export default function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const update = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;

      if (currentY <= 0) {
        setIsVisible(true);
        lastScrollY.current = 0;
        return;
      }

      if (delta > SCROLL_THRESHOLD) {
        setIsVisible(false);
        lastScrollY.current = currentY;
      } else if (delta < -SCROLL_THRESHOLD) {
        setIsVisible(true);
        lastScrollY.current = currentY;
      }
    };

    const onScroll = () => {
      if (ticking.current) {
        return;
      }

      ticking.current = true;
      window.requestAnimationFrame(() => {
        update();
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const headerClassName = [
    "fixed inset-x-0 top-0 z-50 h-32 border-b border-black/10 bg-white",
    "transition-transform duration-500 ease-out motion-reduce:transition-none",
    isVisible ? "translate-y-0" : "-translate-y-full",
  ].join(" ");

  return (
    <header className={ headerClassName }>
      <div className="flex h-full w-full items-center justify-between px-6 py-5  lg:px-12">
        <a href="#top" className="flex items-center gap-3 mb-5">
          <Image
            src="/walkandtour/logo-formal.png"
            alt="Walk & Tour Copenhagen"
            width={ 120 }
            height={ 84 }
            className="h-16 w-auto"
            priority
          />
        </a>
        <nav className="hidden items-center gap-6 text-xl font-semibold lg:flex">
          { navLinks.map((link) => (
            <a
              key={ link.label }
              href={ link.href }
              className="site-link"
            >
              { link.label }
            </a>
          )) }
        </nav>
        <div className="hidden lg:block">
          <a
            href="#private"
            className="flex btn-red-black px-5 py-2 text-base font-semibold transition-colors uppercase"
          >
            <CalendarCheckIcon className="mr-2 h-6 w-6" />
            Private Tours
          </a>
        </div>
        <details className="relative lg:hidden">
          <summary
            className="cursor-pointer list-none rounded-full border border-black/15 px-4 py-2 text-sm font-semibold text-[#3d3124]">
            Menu
          </summary>
          <div className="absolute right-0 mt-3 w-48 rounded-2xl border border-black/10 bg-white p-4 shadow-lg">
            <div className="flex flex-col gap-3 text-sm font-semibold">
              { navLinks.map((link) => (
                <a key={ link.label } href={ link.href } className="site-link">
                  { link.label }
                </a>
              )) }
              <a
                href="#private"
                className="rounded-full bg-[#2a221a] px-4 py-2 text-center text-white"
              >
                Private Tours
              </a>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
