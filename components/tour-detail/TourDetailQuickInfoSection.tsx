import {
  Flag,
  Languages,
  MapPin,
  ShieldCheck,
  Tag,
  type LucideIcon,
} from "lucide-react";

type TourDetailQuickInfoId =
  | "startFrom"
  | "endAt"
  | "typeTour"
  | "cancellationType"
  | "languages";

type TourDetailQuickInfoItem = {
  id: TourDetailQuickInfoId;
  label: string;
  value: string;
};

type TourDetailQuickInfoSectionProps = {
  items: TourDetailQuickInfoItem[];
};

const iconById: Record<TourDetailQuickInfoId, LucideIcon> = {
  startFrom: MapPin,
  endAt: Flag,
  typeTour: Tag,
  cancellationType: ShieldCheck,
  languages: Languages,
};

export default function TourDetailQuickInfoSection({
  items,
}: TourDetailQuickInfoSectionProps) {
  const itemBorderClassesByIndex = [
    "",
    "",
    "border-t border-[#dfd6c9]/50 sm:border-t-0",
    "border-t border-[#dfd6c9]/50 sm:border-t-0",
    "col-span-2 border-t border-[#dfd6c9]/50 sm:col-span-1 lg:border-t-0",
  ];

  return (
    <section className="bg-[#fcfaf7] py-6">
      <div className="mx-auto w-full px-5 lg:px-10">
        <div className="relative overflow-hidden rounded-4xl bg-[#fcf8f1]/80 backdrop-blur-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,100,68,0.08),transparent_50%)]"/>
          <div className="relative grid grid-cols-2 divide-x divide-[#dfd6c9]/50 sm:grid-cols-3 lg:grid-cols-5">
            { items.map((item, index) => {
              const Icon = iconById[item.id];
              const itemBorderClass = itemBorderClassesByIndex[index] ?? "";

              return (
                <article
                  key={ item.id }
                  className={ `group relative flex justify-center items-center gap-3 px-4 py-4 transition-all duration-300 hover:bg-[#005211]/5 lg:py-5 ${ itemBorderClass }` }
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#005211]/10 text-[#005211] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#005211] group-hover:text-[#fcf8f1] group-hover:shadow-lg">
                    <Icon className="h-5 w-5" strokeWidth={ 1.5 }/>
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-widest text-[#4b5a4b]/70">
                      { item.label }
                    </p>
                    <p className="mt-1 text-sm font-semibold tracking-tight text-[#182619]">
                      { item.value }
                    </p>
                  </div>
                </article>
              );
            }) }
          </div>
        </div>
      </div>
    </section>
  );
}
