import BlogPostHtmlContent from "@/components/blog/BlogPostHtmlContent";
import type { AppLocale } from "@/i18n/routing";
import { sanitizeBlogContentHtml } from "@/lib/blog/sanitize-content-html";

type BlogPostContentProps = {
  contentHtml: string | null;
  contentText: string;
  locale?: string;
};

const contentClassName = [
  "flow-root",
  "text-lg leading-8 text-[#3d3124]",
  "[&_h1]:mt-8 [&_h1]:text-4xl [&_h1]:font-semibold [&_h1]:leading-tight [&_h1]:text-[#2a221a]",
  "[&_h2]:mt-8 [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:text-[#2a221a]",
  "[&_h3]:mt-6 [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:leading-tight [&_h3]:text-[#2a221a]",
  "[&_p]:mt-5",
  "[&_ul]:mt-5 [&_ul]:list-disc [&_ul]:pl-6",
  "[&_ol]:mt-5 [&_ol]:list-decimal [&_ol]:pl-6",
  "[&_li]:mt-2",
  "[&_a]:font-semibold [&_a]:text-[#c24343] [&_a]:underline",
  "[&_img]:rounded-2xl [&_img]:h-auto [&_img]:max-w-full",
  "[&_figure[data-blog-image=\"true\"]]:max-w-full",
  "[&_figure[data-blog-image=\"true\"]_img]:m-0",
  "[&_figure[data-blog-image=\"true\"]_figcaption]:mt-3 [&_figure[data-blog-image=\"true\"]_figcaption]:text-center [&_figure[data-blog-image=\"true\"]_figcaption]:text-sm [&_figure[data-blog-image=\"true\"]_figcaption]:leading-6 [&_figure[data-blog-image=\"true\"]_figcaption]:text-[#6d5b47]",
  "[&_[data-blog-clear=\"true\"]]:block [&_[data-blog-clear=\"true\"]]:h-0 [&_[data-blog-clear=\"true\"]]:clear-both [&_[data-blog-clear=\"true\"]]:overflow-hidden [&_[data-blog-clear=\"true\"]]:m-0 [&_[data-blog-clear=\"true\"]]:border-0 [&_[data-blog-clear=\"true\"]]:p-0",
  "[&_[data-blog-video=\"true\"]]:shadow-sm",
].join(" ");

export default function BlogPostContent({
                                         contentHtml,
                                         contentText,
                                         locale,
                                       }: BlogPostContentProps) {
  const safeContentHtml = contentHtml ? sanitizeBlogContentHtml(contentHtml) : null;

  if (safeContentHtml) {
    return <BlogPostHtmlContent className={ contentClassName } contentHtml={ safeContentHtml } locale={ locale as AppLocale }/>;
  }

  return (
    <div className={ contentClassName }>
      { contentText
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph, index) => (
          <p key={ `${ paragraph.slice(0, 60) }-${ index }` }>
            { paragraph }
          </p>
        )) }
    </div>
  );
}
