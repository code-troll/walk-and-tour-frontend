import type { ReactNode } from "react";
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
  return (
    <div className="bg-[#fcfaf7]">
      <div className="mx-auto w-full max-w-7xl">
        <div className="my-6 lg:hidden">
          { sidebar }
        </div>
        <div className="relative w-full lg:[&>section>div]:pr-96">
          { children }
          <aside className="hidden lg:absolute lg:inset-y-0 lg:right-0 lg:block lg:w-[calc(25rem)]">
            <div className={ cn("lg:sticky lg:top-22 mt-22 mb-1 lg:self-start", sidebarContainerClassName) }>
              { sidebar }
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
