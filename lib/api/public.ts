import type {paths} from "@/lib/api/generated/backend-types";
import {createBackendApiClient, unwrapBackendApiResult} from "@/lib/api/core/backend-client";

type LocaleQuery = paths["/api/public/tours"]["get"]["parameters"]["query"];
type NewsletterSubscribeBody =
  paths["/api/public/newsletter/subscribers/subscribe"]["post"]["requestBody"]["content"]["application/json"];
type NewsletterTokenBody =
  paths["/api/public/newsletter/subscribers/confirm"]["post"]["requestBody"]["content"]["application/json"];

export const createPublicApi = ({
  cache,
  revalidate,
}: {
  cache?: RequestCache;
  revalidate?: number;
} = {}) => {
  const client = createBackendApiClient({
    cache,
    requestInitExt: typeof revalidate === "number"
      ? {
          next: {
            revalidate,
          },
        }
      : undefined,
  });

  return {
    getTours: async (query: LocaleQuery) =>
      unwrapBackendApiResult(
        await client.GET("/api/public/tours", {
          params: {
            query,
          },
        }),
        "Unable to load public tours.",
      ),
    getTourBySlug: async ({locale, slug}: {locale: string; slug: string}) =>
      unwrapBackendApiResult(
        await client.GET("/api/public/tours/{slug}", {
          params: {
            path: {
              slug,
            },
            query: {
              locale,
            },
          },
        }),
        "Unable to load the public tour.",
      ),
    getBlogPosts: async (query: LocaleQuery) =>
      unwrapBackendApiResult(
        await client.GET("/api/public/blog-posts", {
          params: {
            query,
          },
        }),
        "Unable to load public blog posts.",
      ),
    getBlogPostBySlug: async ({locale, slug}: {locale: string; slug: string}) =>
      unwrapBackendApiResult(
        await client.GET("/api/public/blog-posts/{slug}", {
          params: {
            path: {
              slug,
            },
            query: {
              locale,
            },
          },
        }),
        "Unable to load the public blog post.",
      ),
    subscribeToNewsletter: async (body: NewsletterSubscribeBody) =>
      unwrapBackendApiResult(
        await client.POST("/api/public/newsletter/subscribers/subscribe", {
          body,
        }),
        "Unable to start newsletter subscription.",
      ),
    confirmNewsletterSubscription: async (body: NewsletterTokenBody) =>
      unwrapBackendApiResult(
        await client.POST("/api/public/newsletter/subscribers/confirm", {
          body,
        }),
        "Unable to confirm the newsletter subscription.",
      ),
    unsubscribeFromNewsletter: async (body: NewsletterTokenBody) =>
      unwrapBackendApiResult(
        await client.POST("/api/public/newsletter/subscribers/unsubscribe", {
          body,
        }),
        "Unable to unsubscribe from the newsletter.",
      ),
  };
};
