import { Eye, MessageCircle } from "lucide-react";

type BlogPostMetaBottomBarProps = {
  viewsLabel: string;
  commentsLabel: string;
  views: number | null;
  comments: number | null;
  locale: string;
};

const formatCount = (value: number | null, locale: string): string => {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat(locale).format(value);
};

export default function BlogPostMetaBottomBar({
                                                viewsLabel,
                                                commentsLabel,
                                                views,
                                                comments,
                                                locale,
                                              }: BlogPostMetaBottomBarProps) {
  return (
    <div className="px-5">
      <div className="flex flex-row gap-6">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-[#5b4d3c]">
          <Eye className="h-4 w-4 text-[#8a7562]"/>
          <span>{ formatCount(views, locale) } { viewsLabel }</span>
        </p>
        <p className="inline-flex items-center gap-2 text-sm font-medium text-[#5b4d3c]">
          <MessageCircle className="h-4 w-4 text-[#8a7562]"/>
          <span>{ formatCount(comments, locale) } { commentsLabel }</span>
        </p>
      </div>
    </div>
  );
}
