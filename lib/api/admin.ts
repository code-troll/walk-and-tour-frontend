import type {paths} from "@/lib/api/generated/backend-types";
import {createBackendApiClient, unwrapBackendApiResult} from "@/lib/api/core/backend-client";
import {toBackendApiError} from "@/lib/api/core/backend-error";

type NewsletterSubscribersQuery =
  paths["/api/admin/newsletter/subscribers"]["get"]["parameters"]["query"];

type NewsletterExportQuery =
  paths["/api/admin/newsletter/subscribers/export"]["get"]["parameters"]["query"];
type CreateLanguageBody =
  paths["/api/admin/languages"]["post"]["requestBody"]["content"]["application/json"];
type UpdateLanguageBody =
  paths["/api/admin/languages/{code}"]["patch"]["requestBody"]["content"]["application/json"];
type CreateTagBody = paths["/api/admin/tags"]["post"]["requestBody"]["content"]["application/json"];
type UpdateTagBody =
  paths["/api/admin/tags/{key}"]["patch"]["requestBody"]["content"]["application/json"];
type CreateTourBody = paths["/api/admin/tours"]["post"]["requestBody"]["content"]["application/json"];
type UpdateTourBody =
  paths["/api/admin/tours/{id}"]["patch"]["requestBody"]["content"]["application/json"];
type CreateBlogPostBody =
  paths["/api/admin/blog-posts"]["post"]["requestBody"]["content"]["application/json"];
type UpdateBlogPostBody =
  paths["/api/admin/blog-posts/{id}"]["patch"]["requestBody"]["content"]["application/json"];
type CreateBlogPostTranslationBody =
  paths["/api/admin/blog-posts/{id}/translations"]["post"]["requestBody"]["content"]["application/json"];
type UpdateBlogPostTranslationBody =
  paths["/api/admin/blog-posts/{id}/translations/{languageCode}"]["patch"]["requestBody"]["content"]["application/json"];
type SetBlogPostHeroMediaBody =
  paths["/api/admin/blog-posts/{id}/hero-media"]["post"]["requestBody"]["content"]["application/json"];

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
    createLanguage: async (body: CreateLanguageBody) =>
      unwrapBackendApiResult(
        await client.POST("/api/admin/languages", {
          body,
        }),
        "Unable to create the language.",
      ),
    updateLanguage: async ({
      body,
      code,
    }: {
      body: UpdateLanguageBody;
      code: string;
    }) =>
      unwrapBackendApiResult(
        await client.PATCH("/api/admin/languages/{code}", {
          params: {
            path: {
              code,
            },
          },
          body,
        }),
        "Unable to update the language.",
      ),
    getTags: async () =>
      unwrapBackendApiResult(await client.GET("/api/admin/tags"), "Unable to load tags."),
    createTag: async (body: CreateTagBody) =>
      unwrapBackendApiResult(
        await client.POST("/api/admin/tags", {
          body,
        }),
        "Unable to create the tag.",
      ),
    updateTag: async ({
      body,
      key,
    }: {
      body: UpdateTagBody;
      key: string;
    }) =>
      unwrapBackendApiResult(
        await client.PATCH("/api/admin/tags/{key}", {
          params: {
            path: {
              key,
            },
          },
          body,
        }),
        "Unable to update the tag.",
      ),
    deleteTag: async (key: string) =>
      {
        const result = await client.DELETE("/api/admin/tags/{key}", {
          params: {
            path: {
              key,
            },
          },
        });

        if (!result.response.ok) {
          throw toBackendApiError({
            fallbackMessage: "Unable to delete the tag.",
            payload: result.error,
            statusCode: result.response.status,
          });
        }
      },
    getTours: async () =>
      unwrapBackendApiResult(await client.GET("/api/admin/tours"), "Unable to load tours."),
    getTour: async (id: string) =>
      unwrapBackendApiResult(
        await client.GET("/api/admin/tours/{id}", {
          params: {
            path: {
              id,
            },
          },
        }),
        "Unable to load the tour.",
      ),
    createTour: async (body: CreateTourBody) =>
      unwrapBackendApiResult(
        await client.POST("/api/admin/tours", {
          body,
        }),
        "Unable to create the tour.",
      ),
    updateTour: async ({
      body,
      id,
    }: {
      body: UpdateTourBody;
      id: string;
    }) =>
      unwrapBackendApiResult(
        await client.PATCH("/api/admin/tours/{id}", {
          params: {
            path: {
              id,
            },
          },
          body,
        }),
        "Unable to update the tour.",
      ),
    getBlogPosts: async () =>
      unwrapBackendApiResult(
        await client.GET("/api/admin/blog-posts"),
        "Unable to load blog posts.",
      ),
    getBlogPost: async (id: string) =>
      unwrapBackendApiResult(
        await client.GET("/api/admin/blog-posts/{id}", {
          params: {
            path: {
              id,
            },
          },
        }),
        "Unable to load the blog post.",
      ),
    createBlogPost: async (body: CreateBlogPostBody) =>
      unwrapBackendApiResult(
        await client.POST("/api/admin/blog-posts", {
          body,
        }),
        "Unable to create the blog post.",
      ),
    updateBlogPost: async ({
      body,
      id,
    }: {
      body: UpdateBlogPostBody;
      id: string;
    }) =>
      unwrapBackendApiResult(
        await client.PATCH("/api/admin/blog-posts/{id}", {
          params: {
            path: {
              id,
            },
          },
          body,
        }),
        "Unable to update the blog post.",
      ),
    createBlogPostTranslation: async ({
      body,
      id,
    }: {
      body: CreateBlogPostTranslationBody;
      id: string;
    }) =>
      unwrapBackendApiResult(
        await client.POST("/api/admin/blog-posts/{id}/translations", {
          params: {
            path: {
              id,
            },
          },
          body,
        }),
        "Unable to create the blog translation.",
      ),
    updateBlogPostTranslation: async ({
      body,
      id,
      languageCode,
    }: {
      body: UpdateBlogPostTranslationBody;
      id: string;
      languageCode: string;
    }) =>
      unwrapBackendApiResult(
        await client.PATCH("/api/admin/blog-posts/{id}/translations/{languageCode}", {
          params: {
            path: {
              id,
              languageCode,
            },
          },
          body,
        }),
        "Unable to update the blog translation.",
      ),
    deleteBlogPostTranslation: async ({
      id,
      languageCode,
    }: {
      id: string;
      languageCode: string;
    }) => {
      const result = await client.DELETE("/api/admin/blog-posts/{id}/translations/{languageCode}", {
        params: {
          path: {
            id,
            languageCode,
          },
        },
      });

      if (!result.response.ok) {
        throw toBackendApiError({
          fallbackMessage: "Unable to delete the blog translation.",
          payload: result.error,
          statusCode: result.response.status,
        });
      }
    },
    publishBlogPostTranslation: async ({
      id,
      languageCode,
    }: {
      id: string;
      languageCode: string;
    }) =>
      unwrapBackendApiResult(
        await client.POST("/api/admin/blog-posts/{id}/translations/{languageCode}/publish", {
          params: {
            path: {
              id,
              languageCode,
            },
          },
        }),
        "Unable to publish the blog translation.",
      ),
    unpublishBlogPostTranslation: async ({
      id,
      languageCode,
    }: {
      id: string;
      languageCode: string;
    }) =>
      unwrapBackendApiResult(
        await client.POST("/api/admin/blog-posts/{id}/translations/{languageCode}/unpublish", {
          params: {
            path: {
              id,
              languageCode,
            },
          },
        }),
        "Unable to unpublish the blog translation.",
      ),
    setBlogPostHeroMedia: async ({
      id,
      mediaId,
    }: {
      id: string;
      mediaId: string;
    }) =>
      unwrapBackendApiResult(
        await client.POST("/api/admin/blog-posts/{id}/hero-media", {
          params: {
            path: {
              id,
            },
          },
          body: {
            mediaId,
          } satisfies SetBlogPostHeroMediaBody,
        }),
        "Unable to update the cover image.",
      ),
    clearBlogPostHeroMedia: async (id: string) => {
      const result = await client.DELETE("/api/admin/blog-posts/{id}/hero-media", {
        params: {
          path: {
            id,
          },
        },
      });

      if (result.response.status === 204) {
        return await unwrapBackendApiResult(
          await client.GET("/api/admin/blog-posts/{id}", {
            params: {
              path: {
                id,
              },
            },
          }),
          "Unable to reload the blog post after clearing the cover image.",
        );
      }

      throw toBackendApiError({
        fallbackMessage: "Unable to clear the cover image.",
        payload: result.error,
        statusCode: result.response.status,
      });
    },
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
