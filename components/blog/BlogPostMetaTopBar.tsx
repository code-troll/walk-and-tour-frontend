import { PenLine } from "lucide-react";

type BlogPostMetaTopBarProps = {
  publishedLabel: string;
  updatedLabel: string;
  publishedDate: string | null;
  updatedDate: string | null;
  locale: string;
};

const formatDate = (value: string | null, locale: string): string => {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsed);
};

export default function BlogPostMetaTopBar({
                                             publishedLabel,
                                             updatedLabel,
                                             publishedDate,
                                             updatedDate,
                                             locale,
                                           }: BlogPostMetaTopBarProps) {
  return (
    <div className="flex flex-row gap-6">
      <p className="inline-flex items-center gap-2 text-sm font-medium text-[#5b4d3c]">
        <PenLine className="h-4 w-4 text-[#8a7562]"/>
        <span>{ publishedLabel }: { formatDate(publishedDate, locale) }</span>
      </p>
      <p className="inline-flex items-center gap-2 text-sm font-medium text-[#5b4d3c]">
        <PenLine className="h-4 w-4 text-[#8a7562]"/>
        <span>{ updatedLabel }: { formatDate(updatedDate, locale) }</span>
      </p>

    </div>
  );
}
