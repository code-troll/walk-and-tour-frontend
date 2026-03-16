import { getPathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import BlogPostCard from "@/components/blog/BlogPostCard";
import type { PublicBlogCard } from "@/lib/public-blog-data";

type BlogRecentPostsSectionProps = {
  locale: AppLocale;
  posts: PublicBlogCard[];
  title: string;
  readMoreLabel: string;
};

export default function BlogRecentPostsSection({
                                                 locale,
                                                 posts,
                                                 title,
                                                 readMoreLabel,
                                               }: BlogRecentPostsSectionProps) {
  if (posts.length === 0) {
    return null;
  }

  const postBasePath = getPathname({locale, href: "/post"});

  return (
    <section className="bg-[#fcfaf7] py-16">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
        <h2 className="text-3xl font-semibold text-teal sm:text-4xl">
          { title }
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          { posts.map((post) => (
            <BlogPostCard
              key={ post.id }
              post={ post }
              postHref={ `${ postBasePath }/${ post.slug }` }
              readMoreLabel={ readMoreLabel }
              locale={ locale }
            />
          )) }
        </div>
      </div>
    </section>
  );
}
