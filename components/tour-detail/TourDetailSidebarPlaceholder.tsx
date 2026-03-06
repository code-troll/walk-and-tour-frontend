type TourDetailSidebarPlaceholderProps = {
  mapHref: string;
};

export default function TourDetailSidebarPlaceholder({
  mapHref,
}: TourDetailSidebarPlaceholderProps) {
  return (
    <div className="mt-6 px-6 lg:px-12 lg:pl-0" data-map-href={ mapHref }>
      <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-[#e8ddd2]">
        <div className="h-72 rounded-2xl border-2 border-dashed border-[#dccfbe] bg-[#fcfaf7]"/>
      </div>
    </div>
  );
}
