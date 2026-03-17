import type { TourFilterId } from "@/lib/public-tour-model";
import cn from "@meltdownjs/cn";

type TourFilterOption = {
  id: TourFilterId;
  label: string;
};

type TourFiltersProps = {
  label: string;
  options: TourFilterOption[];
  selectedOptions: TourFilterId[];
  onToggleOption: (option: TourFilterId) => void;
};

export default function TourFilters({
                                      label,
                                      options,
                                      selectedOptions,
                                      onToggleOption,
                                    }: TourFiltersProps) {
  return (
    <div className="rounded-xl border border-[#d8c8b7] bg-[#ffffff] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7562]">
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
              className={ cn(
                "rounded-full border px-4 py-2 text-sm transition-colors duration-150 cursor-pointer",
                isSelected
                  ? "border-[#2b666d] bg-[#2b666d] text-[#ffffff]"
                  : "border-[#d8c8b7] bg-[#ffffff] text-[#5b4d3c] hover:border-[#2b666d]"
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
