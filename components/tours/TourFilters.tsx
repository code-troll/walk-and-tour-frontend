import type { TourCategoryId } from "@/lib/landing-data";
import cn from "@meltdownjs/cn";

type TourFilterOption = {
  id: TourCategoryId;
  label: string;
};

type TourFiltersProps = {
  label: string;
  options: TourFilterOption[];
  selectedOptions: TourCategoryId[];
  onToggleOption: (option: TourCategoryId) => void;
};

export default function TourFilters({
                                      label,
                                      options,
                                      selectedOptions,
                                      onToggleOption,
                                    }: TourFiltersProps) {
  return (
    <div className="rounded-2xl border border-[#e4d8cb] bg-white/90 p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#5b4d3c]">
        { label }
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        { options.map((option) => {
          const isSelected = selectedOptions.includes(option.id);

          return (
            <button
              key={ option.id }
              type="button"
              onClick={ () => onToggleOption(option.id) }
              className={ cn("rounded-full border px-4 py-2 text-sm font-medium transition-colors cursor-pointer",
                isSelected ? "border-[#2a221a] bg-[#2a221a] text-white" : "border-[#d8c8b7] bg-[#f8f4ef] text-[#5b4d3c] hover:border-[#2a221a] hover:text-[#2a221a]"
              ) }
            >
              { option.label }
            </button>
          );
        }) }
      </div>
    </div>
  );
}
