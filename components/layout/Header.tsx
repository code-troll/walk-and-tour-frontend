"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { type AppLocale } from "@/i18n/routing";
import { navLinks } from "@/lib/landing-data";
import { getHomeSectionHash, getInternalHref } from "@/lib/internal-paths";
import { CalendarCheckIcon, ChevronDown, Menu, X } from "lucide-react";
import { ES, GB, IT } from "country-flag-icons/react/3x2";

const SCROLL_THRESHOLD = 32;
type LanguageCode = "EN" | "ES" | "IT";
type CountryCode = "GB" | "ES" | "IT";

type LanguageOption = {
  code: LanguageCode;
  locale: AppLocale;
  countryCode: CountryCode;
};

const languageOptions: LanguageOption[] = [
  {code: "EN", locale: "en", countryCode: "GB"},
  {code: "ES", locale: "es", countryCode: "ES"},
  {code: "IT", locale: "it", countryCode: "IT"},
];

const flagByCountryCode: Record<
  CountryCode,
  ComponentType<{ className?: string }>
> = {
  GB,
  ES,
  IT,
};

type SocialLinkId = "instagram" | "facebook" | "linkedin" | "tiktok" | "tripadvisor";

const mobileSocialLinks = [
  {
    id: "instagram" as SocialLinkId,
    href: "https://www.instagram.com/walkandtour.dk",
    icon: "/walkandtour/social/white/instagram-white.png",
  },
  {
    id: "facebook" as SocialLinkId,
    href: "https://www.facebook.com/walkandtour.dk",
    icon: "/walkandtour/social/white/facebook-white.png",
  },
  {
    id: "linkedin" as SocialLinkId,
    href: "https://www.linkedin.com/company/walk-and-tour",
    icon: "/walkandtour/social/white/linkedin-white.png",
  },
  {
    id: "tiktok" as SocialLinkId,
    href: "https://www.tiktok.com/@walkandtour.dk",
    icon: "/walkandtour/social/white/tiktok-white.png",
  },
  {
    id: "tripadvisor" as SocialLinkId,
    href: "https://www.tripadvisor.com/Attraction_Review-g189541-d33403499-Reviews-Walk_and_Tour-Copenhagen_Zealand.html",
    icon: "/walkandtour/social/white/tripadvisor-white.png",
  },
];

export default function Header() {
  const t = useTranslations("header");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopLanguageMenuOpen, setIsDesktopLanguageMenuOpen] = useState(false);
  const [isMobileLanguageMenuOpen, setIsMobileLanguageMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("#");
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const desktopLanguageMenuRef = useRef<HTMLDivElement>(null);
  const mobileLanguageMenuRef = useRef<HTMLDivElement>(null);

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

    window.addEventListener("scroll", onScroll, {passive: true});

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
      const nextHash = window.location.hash || "#";
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
        setIsMobileLanguageMenuOpen(false);
      }
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        desktopLanguageMenuRef.current &&
        !desktopLanguageMenuRef.current.contains(target)
      ) {
        setIsDesktopLanguageMenuOpen(false);
      }

      if (
        mobileLanguageMenuRef.current &&
        !mobileLanguageMenuRef.current.contains(target)
      ) {
        setIsMobileLanguageMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (isMobileLanguageMenuOpen) {
        setIsMobileLanguageMenuOpen(false);
        return;
      }

      if (isDesktopLanguageMenuOpen) {
        setIsDesktopLanguageMenuOpen(false);
        return;
      }

      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isDesktopLanguageMenuOpen, isMobileLanguageMenuOpen, isMobileMenuOpen]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsMobileLanguageMenuOpen(false);
  };

  const selectLanguage = (nextLocale: AppLocale) => {
    setIsDesktopLanguageMenuOpen(false);
    setIsMobileLanguageMenuOpen(false);

    if (locale === nextLocale) {
      return;
    }

    const hash = window.location.hash;
    router.replace(`${pathname}${hash}`, {locale: nextLocale, scroll: false});
  };

  const headerClassName = [
    "fixed inset-x-0 top-0 z-50 h-[var(--header-h)] border-b border-black/10 bg-white",
    "transition-transform duration-500 ease-out motion-reduce:transition-none",
    isVisible ? "translate-y-0" : "-translate-y-full",
  ].join(" ");
  const homeHref = getInternalHref({
    locale,
    target: {kind: "homeSection", section: "home"},
  });
  const privateToursHref = getInternalHref({
    locale,
    target: {kind: "homeSection", section: "private"},
  });
  const getNavHref = (linkId: (typeof navLinks)[number]["id"]) => {
    const link = navLinks.find((item) => item.id === linkId);
    if (!link) {
      return homeHref;
    }

    return getInternalHref({locale, target: link.target});
  };
  const getNavHash = (linkId: (typeof navLinks)[number]["id"]) => {
    const link = navLinks.find((item) => item.id === linkId);
    if (!link || link.target.kind !== "homeSection") {
      return "";
    }

    return getHomeSectionHash(link.target.section);
  };
  const selectedLanguageOption =
    languageOptions.find((option) => option.locale === locale) ?? languageOptions[0];
  const SelectedLanguageFlag = flagByCountryCode[selectedLanguageOption.countryCode];

  return (
    <>
      <header className={ headerClassName }>
        <div className="flex h-full w-full items-center justify-between px-[var(--header-px)] py-[var(--header-py)]">
          <a href={ homeHref } className="mb-[var(--logo-mb)] flex items-center gap-3">
            <Image
              src="/walkandtour/branding/logo-formal.png"
              alt={ t("logoAlt") }
              width={ 120 }
              height={ 84 }
              className="h-[var(--logo-h)] w-auto"
              priority
            />
          </a>
          <nav className="hidden items-center gap-6 text-xl font-semibold xl:flex">
            { navLinks.map((link) => (
              <a
                key={ link.id }
                href={ getNavHref(link.id) }
                className="site-link"
              >
                { t(`nav.${link.id}`) }
              </a>
            )) }
          </nav>
          <div className="hidden items-center gap-3 xl:flex">
            <a
              href={ privateToursHref }
              className="flex btn-red-black px-5 py-2 text-base font-semibold transition-colors uppercase"
            >
              <CalendarCheckIcon className="mr-2 h-6 w-6"/>
              { t("privateTours") }
            </a>
          </div>
          <div className="flex items-center gap-[var(--ctrl-gap)]">
            <div ref={ desktopLanguageMenuRef } className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={ isDesktopLanguageMenuOpen }
                aria-label={ t("selectLanguage") }
                onClick={ () => {
                  setIsDesktopLanguageMenuOpen((prev) => !prev);
                  setIsMobileLanguageMenuOpen(false);
                } }
                className="inline-flex h-10 items-center gap-2 rounded-full border border-black/20 px-2 sm:px-3 text-sm font-semibold text-[#2a221a] transition-colors hover:border-[#2a221a] hover:bg-[#f8f4ef]"
              >
                <SelectedLanguageFlag className="h-4 w-6 overflow-hidden rounded-xs"/>
                <span>{ selectedLanguageOption.code }</span>
                <ChevronDown
                  className={ [
                    "h-4 w-4 transition-transform",
                    isDesktopLanguageMenuOpen ? "rotate-180" : "",
                  ].join(" ") }
                />
              </button>
              <div
                role="menu"
                className={ [
                  "absolute right-0 mt-2 w-44 rounded-2xl border border-black/10 bg-white p-2 shadow-lg transition-opacity",
                  isDesktopLanguageMenuOpen ? "opacity-100" : "pointer-events-none opacity-0",
                ].join(" ") }
              >
                { languageOptions.map((language) => {
                  const LanguageFlag = flagByCountryCode[language.countryCode];

                  return (
                    <button
                      key={ language.code }
                      type="button"
                      role="menuitem"
                      onClick={ () => selectLanguage(language.locale) }
                      className={ [
                        "flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm font-semibold transition-colors",
                        selectedLanguageOption.locale === language.locale
                          ? "bg-[#f8f4ef] text-[#2a221a]"
                          : "text-[#3d3124] hover:bg-[#f8f4ef]",
                      ].join(" ") }
                    >
                      <LanguageFlag className="h-4 w-6 overflow-hidden rounded-xs"/>
                      <span>{ language.code }</span>
                      <span className="text-xs font-medium text-black/60">
                        { t(`languages.${language.code}`) }
                      </span>
                    </button>
                  );
                }) }
              </div>
            </div>
            <button
              type="button"
              aria-label={ t("openMenu") }
              aria-expanded={ isMobileMenuOpen }
              aria-controls="mobile-menu-overlay"
              onClick={ () => setIsMobileMenuOpen(true) }
              className="btn-red-white-round inline-flex h-10 w-10 cursor-pointer items-center justify-center transition-colors xl:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true"/>
            </button>
          </div>
        </div>
      </header>
      <div
        id="mobile-menu-overlay"
        aria-hidden={ !isMobileMenuOpen }
        className={ [
          "fixed inset-0 z-9999 flex flex-col bg-[#c24343] px-6 pt-7 md:pt-9 lg:pt-11 pb-6 text-white transition-transform duration-300 ease-in-out lg:hidden",
          isMobileMenuOpen ? "translate-x-0" : "pointer-events-none translate-x-full",
        ].join(" ") }
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            { mobileSocialLinks.map((link) => (
              <a
                key={ link.id }
                href={ link.href }
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={ isMobileMenuOpen ? 0 : -1 }
                aria-label={ t(`social.${link.id}`) }
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-transparent transition-transform hover:scale-105"
              >
                <Image
                  src={ link.icon }
                  alt={ t(`social.${link.id}`) }
                  width={ 20 }
                  height={ 20 }
                  className="h-9 w-9 object-contain"
                />
              </a>
            )) }
          </div>
          <button
            type="button"
            aria-label={ t("closeMenu") }
            onClick={ closeMobileMenu }
            tabIndex={ isMobileMenuOpen ? 0 : -1 }
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 transition-colors hover:bg-white hover:text-[#c24343] cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true"/>
          </button>
        </div>
        <nav
          className="flex flex-1 flex-col items-center justify-center gap-8 text-center text-4xl font-semibold uppercase tracking-wide">
          { navLinks.map((link) => (
            <a
              key={ link.id }
              href={ getNavHref(link.id) }
              onClick={ () => {
                const nextHash = getNavHash(link.id);
                setActiveHash(nextHash);
                closeMobileMenu();
              } }
              tabIndex={ isMobileMenuOpen ? 0 : -1 }
              className={ [
                "text-white transition-opacity hover:opacity-80",
                activeHash === getNavHash(link.id) ? "menu-link-active" : "",
              ].join(" ") }
            >
              { t(`nav.${link.id}`) }
            </a>
          )) }
          <a
            href={ privateToursHref }
            onClick={ closeMobileMenu }
            tabIndex={ isMobileMenuOpen ? 0 : -1 }
            className="mt-3 rounded-full border border-white px-6 py-3 text-lg font-semibold uppercase tracking-wide text-white transition-colors hover:bg-white hover:text-[#c24343]"
          >
            { t("privateTours") }
          </a>
        </nav>
      </div>
    </>
  );
}
