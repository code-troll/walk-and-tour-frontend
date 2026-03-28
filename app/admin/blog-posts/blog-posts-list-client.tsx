"use client";

import {useEffect, useState} from "react";
import {Pencil, Plus} from "lucide-react";
import {AdminProgressLink, useAdminRouteLoadingBoundary} from "@/components/admin/AdminRouteProgress";
import {AdminNoticeCard, AdminSectionCard} from "@/components/admin/AdminUi";
import {Button} from "@/components/ui/button";
import {getAdminBlogPostsClient, getAdminLanguagesClient} from "@/lib/admin/admin-client";
import type {components} from "@/lib/api/generated/backend-types";

const viewCountFormatter = new Intl.NumberFormat("en-US");

type ApiBlogPost = components["schemas"]["BlogAdminResponseDto"];
type ApiLanguage = components["schemas"]["LanguageResponseDto"];

export default function AdminBlogPostsListClient() {
  const [blogPosts, setBlogPosts] = useState<ApiBlogPost[]>([]);
  const [languages, setLanguages] = useState<ApiLanguage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useAdminRouteLoadingBoundary(isLoading);

  const loadBlogPostsWorkspace = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [nextBlogPosts, nextLanguages] = await Promise.all([
        getAdminBlogPostsClient(),
        getAdminLanguagesClient(),
      ]);

      setBlogPosts(nextBlogPosts);
      setLanguages(nextLanguages);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load blog posts.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadBlogPostsWorkspace();
  }, []);

  if (isLoading) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="Loading the blog posts workspace."
        description="Resolving blog post records and available languages."
      />
    );
  }

  if (error) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The blog posts workspace could not be loaded."
        description={error}
        actions={
          <button
            type="button"
            onClick={() => void loadBlogPostsWorkspace()}
            className="rounded-full border border-[#cbb390] px-5 py-3 text-sm font-semibold text-[#7a5424]"
          >
            Retry
          </button>
        }
      />
    );
  }

  const languageNameByCode = Object.fromEntries(
    languages.map((language) => [language.code, language.name]),
  );

  return (
    <div className="space-y-6">
      <AdminSectionCard
        title="Blog posts"
        description="Create shared blog records, manage localized content, and publish each locale independently from the backend contract."
        actions={
          <Button asChild>
            <AdminProgressLink href="/blog-posts/new">
              <Plus className="size-4"/>
              Create Blog Post
            </AdminProgressLink>
          </Button>
        }
      >
        {blogPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
            <p>No blog posts have been created yet.</p>
            <Button asChild className="mt-4">
              <AdminProgressLink href="/blog-posts/new">
                <Plus className="size-4"/>
                Create your first blog post
              </AdminProgressLink>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {blogPosts.map((post) => (
              <article
                key={post.id}
                className="rounded-2xl border border-[#f0e6d8] bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-foreground">{post.name}</h3>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="truncate">Slug: {Object.values(post.translations)[0]?.slug ?? "—"}</span>
                      <span>{Object.keys(post.translations).length} translations</span>
                      <span>{post.tagKeys.length} tags</span>
                    </div>
                  </div>

                  <Button asChild variant="outline" size="sm">
                    <AdminProgressLink href={`/blog-posts/${post.id}`}>
                      <Pencil className="size-4"/>
                      Edit
                    </AdminProgressLink>
                  </Button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {post.translationAvailability.map((availability) => {
                    const translation = post.translations[availability.languageCode];

                    return (
                      <span
                        key={availability.languageCode}
                        className="rounded-full border border-[#eadfce] px-3 py-1 text-xs text-muted-foreground"
                      >
                        {languageNameByCode[availability.languageCode] ?? availability.languageCode}
                        {": "}
                        {availability.isPublished ? "Published" : "Not Published"}
                        {availability.publiclyAvailable ? " • Public" : ""}
                        {translation ? ` • ${viewCountFormatter.format(translation.viewCount)} views` : ""}
                      </span>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        )}
      </AdminSectionCard>
    </div>
  );
}
