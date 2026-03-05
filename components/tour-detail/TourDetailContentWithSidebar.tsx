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
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-10">
        <div>{ children }</div>
        <aside className="lg:sticky lg:top-0 lg:self-start">
          { sidebar }
        </aside>
      </div>
    </div>
  );
}
