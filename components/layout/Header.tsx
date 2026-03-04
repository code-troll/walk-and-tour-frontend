"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { navLinks } from "@/lib/landing-data";
import { CalendarCheckIcon, Menu, X } from "lucide-react";

const SCROLL_THRESHOLD = 32;
const mobileSocialLinks = [
  {
    href: "https://www.instagram.com/walkandtour.dk",
    icon: "/walkandtour/instagram-white.png",
    label: "Instagram",
  },
  {
    href: "https://www.facebook.com/walkandtour.dk",
    icon: "/walkandtour/facebook-white.png",
    label: "Facebook",
  },
  {
    href: "https://www.linkedin.com/company/walk-and-tour",
    icon: "/walkandtour/linkedin-white.png",
    label: "LinkedIn",
  },
  {
    href: "https://www.tiktok.com/@walkandtour.dk",
    icon: "/walkandtour/tiktok-white.png",
    label: "TikTok",
  },
];

export default function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("#home");
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

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const updateActiveHash = () => {
      const nextHash = window.location.hash || "#home";
      setActiveHash(nextHash);
    };

    updateActiveHash();
    window.addEventListener("hashchange", updateActiveHash);

    return () => {
      window.removeEventListener("hashchange", updateActiveHash);
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const headerClassName = [
    "fixed inset-x-0 top-0 z-50 h-32 border-b border-black/10 bg-white",
    "transition-transform duration-500 ease-out motion-reduce:transition-none",
    isVisible ? "translate-y-0" : "-translate-y-full",
  ].join(" ");

  return (
    <>
      <header className={ headerClassName }>
        <div className="flex h-full w-full items-center justify-between px-6 py-5  lg:px-12">
          <a href="#home" className="flex items-center gap-3 mb-5">
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
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={ isMobileMenuOpen }
            aria-controls="mobile-menu-overlay"
            onClick={ () => setIsMobileMenuOpen(true) }
            className="btn-red-white-round inline-flex h-10 w-10 cursor-pointer items-center justify-center transition-colors lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </header>
      <div
        id="mobile-menu-overlay"
        aria-hidden={ !isMobileMenuOpen }
        className={ [
          "fixed inset-0 z-[9999] flex flex-col bg-[#c24343] px-6 pt-11 pb-6 text-white transition-transform duration-300 ease-in-out lg:hidden",
          isMobileMenuOpen ? "translate-x-0" : "pointer-events-none translate-x-full",
        ].join(" ") }
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            { mobileSocialLinks.map((link) => (
              <a
                key={ link.label }
                href={ link.href }
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={ isMobileMenuOpen ? 0 : -1 }
                aria-label={ link.label }
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-transparent transition-transform hover:scale-105"
              >
                <Image
                  src={ link.icon }
                  alt={ link.label }
                  width={ 20 }
                  height={ 20 }
                  className="h-9 w-9 object-contain"
                />
              </a>
            )) }
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={ closeMobileMenu }
            tabIndex={ isMobileMenuOpen ? 0 : -1 }
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 transition-colors hover:bg-white hover:text-[#c24343] cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col items-center justify-center gap-8 text-center text-4xl font-semibold uppercase tracking-wide">
          { navLinks.map((link) => (
            <a
              key={ link.label }
              href={ link.href }
              onClick={ () => {
                setActiveHash(link.href);
                closeMobileMenu();
              } }
              tabIndex={ isMobileMenuOpen ? 0 : -1 }
              className={ [
                "text-white transition-opacity hover:opacity-80",
                activeHash === link.href ? "menu-link-active" : "",
              ].join(" ") }
            >
              { link.label }
            </a>
          )) }
          <a
            href="#private"
            onClick={ closeMobileMenu }
            tabIndex={ isMobileMenuOpen ? 0 : -1 }
            className="mt-3 rounded-full border border-white px-6 py-3 text-lg font-semibold uppercase tracking-wide text-white transition-colors hover:bg-white hover:text-[#c24343]"
          >
            Private Tours
          </a>
        </nav>
      </div>
    </>
  );
}
