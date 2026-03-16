import { Eye, PenLine } from "lucide-react";

type BlogPostMetaTopBarProps = {
  publishedLabel: string;
  updatedLabel: string;
  viewsLabel: string;
  publishedDate: string | null;
  updatedDate: string | null;
  viewCount: number;
  locale: string;
};

const formatDate = (value: string, locale: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
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
                                             viewsLabel,
                                             publishedDate,
                                             updatedDate,
                                             viewCount,
                                             locale,
                                           }: BlogPostMetaTopBarProps) {
  const formattedPublishedDate = publishedDate ? formatDate(publishedDate, locale) : null;
  const formattedUpdatedDate = updatedDate ? formatDate(updatedDate, locale) : null;
  const formattedViewCount = new Intl.NumberFormat(locale).format(viewCount);

  return (
    <div className="flex flex-row gap-6">
      { publishedDate ? (
        <p className="inline-flex items-center gap-2 text-sm font-medium text-[#5b4d3c]">
          <PenLine className="h-4 w-4 text-[#8a7562]"/>
          <span>{ publishedLabel }: { formattedPublishedDate }</span>
        </p>
      ) : null }
      { updatedDate ? (
        <p className="inline-flex items-center gap-2 text-sm font-medium text-[#5b4d3c]">
          <PenLine className="h-4 w-4 text-[#8a7562]"/>
          <span>{ updatedLabel }: { formattedUpdatedDate }</span>
        </p>
      ) : null }
      <p className="inline-flex items-center gap-2 text-sm font-medium text-[#5b4d3c]">
        <Eye className="h-4 w-4 text-[#8a7562]"/>
        <span>{ viewsLabel }: { formattedViewCount }</span>
      </p>
    </div>
  );
}
