"use client";

import {LoaderCircle} from "lucide-react";

export function PublicLoadingState({label = "Loading content..."}: {label?: string}) {
  return (
    <div className="flex min-h-[320px] items-center justify-center px-6 py-12">
      <div className="flex items-center gap-3 rounded-full border border-[#e8dfd4] bg-white px-5 py-3 text-sm text-[#5b4d3c]">
        <LoaderCircle className="size-4 animate-spin"/>
        <span>{label}</span>
      </div>
    </div>
  );
}

export function PublicErrorState({
  actionLabel = "Retry",
  description,
  onRetry,
  title = "Unable to load this content.",
}: {
  title?: string;
  description: string;
  actionLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-3xl rounded-3xl border border-[#e8c7c1] bg-[#fbf2f0] p-6 text-center">
        <h2 className="text-2xl font-semibold text-[#7b2d2d]">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-[#7b4a46]">{description}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 rounded-full border border-[#7b2d2d] px-5 py-2 text-sm font-semibold text-[#7b2d2d] transition-colors hover:bg-[#7b2d2d] hover:text-white"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
