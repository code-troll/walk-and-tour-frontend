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
  return (
    <section className="bg-[#fcfaf7] pb-6">
      <div className="mx-auto w-full px-6 lg:px-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          { items.map((item) => {
            const Icon = iconById[item.id];

            return (
              <article
                key={ item.id }
                className="rounded-2xl border border-[#eadfce] bg-[#fcfaf7] p-4"
              >
                <div className="flex items-start gap-3">
                    <span
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f4e7da] text-[#c24343]">
                      <Icon className="h-4 w-4"/>
                    </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8a7562]">
                      { item.label }
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#2a221a]">
                      { item.value }
                    </p>
                  </div>
                </div>
              </article>
            );
          }) }
        </div>
      </div>
    </section>
  );
}
