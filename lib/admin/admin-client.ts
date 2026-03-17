"use client";

import {fetchJson} from "@/lib/api/client-json";
import type {components} from "@/lib/api/generated/backend-types";

export type AdminSessionResponse = {
  auth0User: {
    name?: string | null;
    sub?: string | null;
  } | null;
  backendAdmin: components["schemas"]["AuthenticatedAdminResponseDto"];
};

export const getAdminSessionClient = () =>
  fetchJson<AdminSessionResponse>({
    input: "/api/internal/admin/session",
    fallbackMessage: "Unable to load the admin session.",
  });

export const getAdminUsersClient = () =>
  fetchJson<components["schemas"]["AdminUserResponseDto"][]>({
    input: "/api/internal/admin/users",
    fallbackMessage: "Unable to load admin users.",
  });

export const getAdminRolesClient = () =>
  fetchJson<components["schemas"]["RoleResponseDto"][]>({
    input: "/api/internal/admin/roles",
    fallbackMessage: "Unable to load admin roles.",
  });

export const getAdminLanguagesClient = () =>
  fetchJson<components["schemas"]["LanguageResponseDto"][]>({
    input: "/api/internal/admin/languages",
    fallbackMessage: "Unable to load languages.",
  });

export const getAdminTagsClient = () =>
  fetchJson<components["schemas"]["TagResponseDto"][]>({
    input: "/api/internal/admin/tags",
    fallbackMessage: "Unable to load tags.",
  });

export const getAdminToursClient = () =>
  fetchJson<components["schemas"]["TourAdminListResponseDto"][]>({
    input: "/api/internal/admin/tours",
    fallbackMessage: "Unable to load tours.",
  });

export const getAdminTourClient = (id: string) =>
  fetchJson<components["schemas"]["TourAdminResponseDto"] | null>({
    input: `/api/internal/admin/tours/${id}`,
    fallbackMessage: "Unable to load the tour.",
    notFoundFallback: null,
  });

export const getAdminBlogPostsClient = () =>
  fetchJson<components["schemas"]["BlogAdminResponseDto"][]>({
    input: "/api/internal/admin/blog-posts",
    fallbackMessage: "Unable to load blog posts.",
  });

export const getAdminBlogPostClient = (id: string) =>
  fetchJson<components["schemas"]["BlogAdminResponseDto"] | null>({
    input: `/api/internal/admin/blog-posts/${id}`,
    fallbackMessage: "Unable to load the blog post.",
    notFoundFallback: null,
  });

export const getAdminNewsletterSubscribersClient = ({
  limit = 10,
  page = 1,
}: {
  limit?: number;
  page?: number;
} = {}) =>
  fetchJson<components["schemas"]["NewsletterSubscriberAdminListResponseDto"]>({
    input: `/api/internal/admin/newsletter/subscribers?page=${page}&limit=${limit}`,
    fallbackMessage: "Unable to load newsletter subscribers.",
  });
