import type {paths} from "@/lib/api/generated/backend-types";
import {createBackendApiClient, unwrapBackendApiResult} from "@/lib/api/core/backend-client";

type NewsletterSubscribersQuery =
  paths["/api/admin/newsletter/subscribers"]["get"]["parameters"]["query"];

type NewsletterExportQuery =
  paths["/api/admin/newsletter/subscribers/export"]["get"]["parameters"]["query"];

export const createAdminApi = (accessToken: string) => {
  const client = createBackendApiClient({accessToken});

  return {
    getCurrentAdmin: async () =>
      unwrapBackendApiResult(
        await client.GET("/api/admin/auth/me"),
        "Unable to resolve the authenticated admin.",
      ),
    getAdminUsers: async () =>
      unwrapBackendApiResult(await client.GET("/api/admin/users"), "Unable to load admin users."),
    getAdminRoles: async () =>
      unwrapBackendApiResult(await client.GET("/api/admin/roles"), "Unable to load admin roles."),
    getLanguages: async () =>
      unwrapBackendApiResult(await client.GET("/api/admin/languages"), "Unable to load languages."),
    getTags: async () =>
      unwrapBackendApiResult(await client.GET("/api/admin/tags"), "Unable to load tags."),
    getTours: async () =>
      unwrapBackendApiResult(await client.GET("/api/admin/tours"), "Unable to load tours."),
    getBlogPosts: async () =>
      unwrapBackendApiResult(
        await client.GET("/api/admin/blog-posts"),
        "Unable to load blog posts.",
      ),
    getNewsletterSubscribers: async (query: NewsletterSubscribersQuery = {}) =>
      unwrapBackendApiResult(
        await client.GET("/api/admin/newsletter/subscribers", {
          params: {
            query,
          },
        }),
        "Unable to load newsletter subscribers.",
      ),
    getNewsletterSubscriber: async (id: string) =>
      unwrapBackendApiResult(
        await client.GET("/api/admin/newsletter/subscribers/{id}", {
          params: {
            path: {
              id,
            },
          },
        }),
        "Unable to load the newsletter subscriber.",
      ),
    exportNewsletterSubscribers: async (query: NewsletterExportQuery = {}) => {
      const result = await client.GET("/api/admin/newsletter/subscribers/export", {
        params: {
          query,
        },
        parseAs: "text",
      });

      return unwrapBackendApiResult(result, "Unable to export newsletter subscribers.");
    },
  };
};
