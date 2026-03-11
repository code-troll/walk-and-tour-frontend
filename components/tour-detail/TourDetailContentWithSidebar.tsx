"use client";

import { useEffect, useState, type ReactNode } from "react";
import cn from "@meltdownjs/cn";

type TourDetailContentWithSidebarProps = {
  children: ReactNode;
  sidebar: ReactNode;
  sidebarContainerClassName?: string;
};

export default function TourDetailContentWithSidebar({
                                                       children,
                                                       sidebar,
                                                       sidebarContainerClassName
                                                     }: TourDetailContentWithSidebarProps) {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  useEffect(() => {
    const headerElement = document.querySelector(".header-shell");

    if (!headerElement) {
      return;
    }

    const updateHeaderVisibility = () => {
      setIsHeaderVisible(!headerElement.classList.contains("is-hidden"));
    };

    updateHeaderVisibility();

    const observer = new MutationObserver(updateHeaderVisibility);
    observer.observe(headerElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="bg-[#fcfaf7]">
      <div className="mx-auto w-full max-w-7xl">
        <div className="py-6 lg:hidden">
          { sidebar }
        </div>
        <div className="relative w-full lg:[&>section>div]:pr-96">
          { children }
          <aside
            className={ cn(
              "hidden lg:absolute lg:inset-y-0 lg:right-0 lg:block lg:w-[calc(25rem)] lg:transition-[padding-top] lg:duration-300 lg:ease-in-out lg:pt-30",
            ) }
          >
            <div
              id="sidebar-container"
              className={ cn(
                "mb-1 transition-[top] duration-300 ease-in-out lg:self-start lg:sticky",
                isHeaderVisible ? "lg:top-24" : "lg:top-8",
                sidebarContainerClassName
              ) }
            >
              { sidebar }
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
