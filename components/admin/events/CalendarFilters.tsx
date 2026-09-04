"use client";

import type {ReactNode} from "react";
import {SlidersHorizontal} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";

export type FilterGroup = {
  key: string;
  label: string;
  options: {value: string; label: ReactNode}[];
};

type CalendarFiltersProps = {
  groups: FilterGroup[];
  /** Per-group sets of *excluded* option values (empty set = everything visible). */
  excluded: Record<string, Set<string>>;
  onToggle: (groupKey: string, value: string) => void;
  onToggleAll: (groupKey: string, values: string[], checked: boolean) => void;
};

/** Client-side facet filters (language / type / linked tour) over the currently loaded calendar items. */
export function CalendarFilters({groups, excluded, onToggle, onToggleAll}: CalendarFiltersProps) {
  const activeCount = groups.reduce((sum, group) => sum + (excluded[group.key]?.size ?? 0), 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-10 gap-2">
          <SlidersHorizontal className="size-4" />
          Filters
          {activeCount > 0 ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--wt-ink)] px-1.5 text-xs font-medium text-white">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-[70vh] w-72 gap-4 overflow-y-auto">
        {groups.map((group) => {
          const excludedSet = excluded[group.key] ?? new Set<string>();
          const allValues = group.options.map((option) => option.value);
          const allChecked = excludedSet.size === 0;
          return (
            <div key={group.key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </span>
                {group.options.length > 0 ? (
                  <button
                    type="button"
                    className="text-xs text-[var(--wt-ink-muted)] hover:underline"
                    onClick={() => onToggleAll(group.key, allValues, !allChecked)}
                  >
                    {allChecked ? "Clear" : "Select all"}
                  </button>
                ) : null}
              </div>
              {group.options.length === 0 ? (
                <p className="text-xs text-muted-foreground">None in view.</p>
              ) : null}
              {group.options.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded-[var(--wt-radius-sm)] px-1 py-1 text-sm hover:bg-muted"
                >
                  <Checkbox
                    checked={!excludedSet.has(option.value)}
                    onCheckedChange={() => onToggle(group.key, option.value)}
                  />
                  <span className="flex items-center gap-1.5">{option.label}</span>
                </label>
              ))}
            </div>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
