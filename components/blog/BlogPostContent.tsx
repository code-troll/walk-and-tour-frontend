import { WixRichContentRenderer } from "@/components/wix/WixRichContentRenderer";
import type { WixRichContent } from "@/lib/wix/rich-content/types";

type BlogPostContentProps = {
  richContent?: WixRichContent | null;
  contentHtml: string | null;
  contentText: string;
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
  "[&_img]:mt-6 [&_img]:w-full [&_img]:rounded-2xl",
].join(" ");

export default function BlogPostContent({
                                         richContent,
                                         contentHtml,
                                         contentText,
                                       }: BlogPostContentProps) {
  if (richContent?.nodes?.length) {
    return (
      <WixRichContentRenderer
        content={ richContent }
        className={ contentClassName }
      />
    );
  }

  if (contentHtml) {
    return (
      <div
        className={ contentClassName }
        dangerouslySetInnerHTML={ { __html: contentHtml } }
      />
    );
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
