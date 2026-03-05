import type { ReactNode } from "react";

type TourDetailContentWithSidebarProps = {
  children: ReactNode;
  sidebar: ReactNode;
};

export default function TourDetailContentWithSidebar({
  children,
  sidebar,
}: TourDetailContentWithSidebarProps) {
  return (
    <div className="w-full">
      <div className="relative w-full lg:[&>section>div]:pr-96">
        { children }
        <aside className="hidden lg:absolute lg:inset-y-0 lg:right-0 lg:block lg:w-[24rem]">
          <div className="lg:sticky lg:top-0">
            { sidebar }
          </div>
        </aside>
      </div>
      <div className="lg:hidden">
        { sidebar }
      </div>
    </div>
  );
}
