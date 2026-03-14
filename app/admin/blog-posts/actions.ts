"use server";

import type { ApiBlogPost, CreateBlogBody, CreateBlogTranslationBody, UpdateBlogBody, UpdateBlogTranslationBody } from "@/lib/blog/admin-blog-form";
import { getAdminViewerState } from "@/lib/admin/session";
import { createAdminApi } from "@/lib/api/admin";
import { isBackendApiError } from "@/lib/api/core/backend-client";

type BlogPostsAdminApi = ReturnType<typeof createAdminApi>;
type BlogActionError = {
  message: string;
  ok: false;
  statusCode: number;
};
type BlogActionSuccess = {
  blogPost: ApiBlogPost;
  ok: true;
};
type BlogDeleteTranslationSuccess = {
  ok: true;
};

export type BlogActionResult = BlogActionSuccess | BlogActionError;
export type BlogDeleteTranslationResult = BlogDeleteTranslationSuccess | BlogActionError;

const getBlogPostsAdminApi = async (): Promise<
  | {
      adminApi: BlogPostsAdminApi;
      ok: true;
    }
  | BlogActionError
> => {
  const viewerState = await getAdminViewerState();

  if (viewerState.kind === "unauthenticated") {
    return {
      ok: false,
      statusCode: 401,
      message: "Authentication required.",
    };
  }

  if (viewerState.kind === "backend-error") {
    return {
      ok: false,
      statusCode: viewerState.statusCode,
      message: viewerState.message,
    };
  }

  if (viewerState.kind !== "authenticated") {
    return {
      ok: false,
      statusCode: 503,
      message: "Unable to initialize the admin session.",
    };
  }

  if (viewerState.backendAdmin.roleName === "marketing") {
    return {
      ok: false,
      statusCode: 403,
      message: "You do not have access to blog post administration.",
    };
  }

  return {
    ok: true,
    adminApi: createAdminApi(viewerState.accessToken),
  };
};

const toBlogActionError = (error: unknown, fallbackMessage: string): BlogActionError => {
  if (isBackendApiError(error)) {
    return {
      ok: false,
      statusCode: error.statusCode,
      message: error.message,
    };
  }

  return {
    ok: false,
    statusCode: 500,
    message: error instanceof Error ? error.message : fallbackMessage,
  };
};

export async function createBlogPostAction(body: CreateBlogBody): Promise<BlogActionResult> {
  const adminApiResult = await getBlogPostsAdminApi();
  if (!adminApiResult.ok) {
    return adminApiResult;
  }

  try {
    return {
      ok: true,
      blogPost: await adminApiResult.adminApi.createBlogPost(body),
    };
  } catch (error) {
    return toBlogActionError(error, "Unable to create the blog post.");
  }
}

export async function updateBlogPostAction({
  body,
  id,
}: {
  body: UpdateBlogBody;
  id: string;
}): Promise<BlogActionResult> {
  const adminApiResult = await getBlogPostsAdminApi();
  if (!adminApiResult.ok) {
    return adminApiResult;
  }

  try {
    return {
      ok: true,
      blogPost: await adminApiResult.adminApi.updateBlogPost({ body, id }),
    };
  } catch (error) {
    return toBlogActionError(error, "Unable to update the blog post.");
  }
}

export async function createBlogPostTranslationAction({
  body,
  id,
}: {
  body: CreateBlogTranslationBody;
  id: string;
}): Promise<BlogActionResult> {
  const adminApiResult = await getBlogPostsAdminApi();
  if (!adminApiResult.ok) {
    return adminApiResult;
  }

  try {
    return {
      ok: true,
      blogPost: await adminApiResult.adminApi.createBlogPostTranslation({ body, id }),
    };
  } catch (error) {
    return toBlogActionError(error, "Unable to create the blog translation.");
  }
}

export async function updateBlogPostTranslationAction({
  body,
  id,
  languageCode,
}: {
  body: UpdateBlogTranslationBody;
  id: string;
  languageCode: string;
}): Promise<BlogActionResult> {
  const adminApiResult = await getBlogPostsAdminApi();
  if (!adminApiResult.ok) {
    return adminApiResult;
  }

  try {
    return {
      ok: true,
      blogPost: await adminApiResult.adminApi.updateBlogPostTranslation({
        body,
        id,
        languageCode,
      }),
    };
  } catch (error) {
    return toBlogActionError(error, "Unable to update the blog translation.");
  }
}

export async function deleteBlogPostTranslationAction({
  id,
  languageCode,
}: {
  id: string;
  languageCode: string;
}): Promise<BlogDeleteTranslationResult> {
  const adminApiResult = await getBlogPostsAdminApi();
  if (!adminApiResult.ok) {
    return adminApiResult;
  }

  try {
    await adminApiResult.adminApi.deleteBlogPostTranslation({ id, languageCode });

    return {
      ok: true,
    };
  } catch (error) {
    return toBlogActionError(error, "Unable to delete the blog translation.");
  }
}

export async function publishBlogPostTranslationAction({
  id,
  languageCode,
}: {
  id: string;
  languageCode: string;
}): Promise<BlogActionResult> {
  const adminApiResult = await getBlogPostsAdminApi();
  if (!adminApiResult.ok) {
    return adminApiResult;
  }

  try {
    return {
      ok: true,
      blogPost: await adminApiResult.adminApi.publishBlogPostTranslation({ id, languageCode }),
    };
  } catch (error) {
    return toBlogActionError(error, "Unable to publish the blog translation.");
  }
}

export async function unpublishBlogPostTranslationAction({
  id,
  languageCode,
}: {
  id: string;
  languageCode: string;
}): Promise<BlogActionResult> {
  const adminApiResult = await getBlogPostsAdminApi();
  if (!adminApiResult.ok) {
    return adminApiResult;
  }

  try {
    return {
      ok: true,
      blogPost: await adminApiResult.adminApi.unpublishBlogPostTranslation({ id, languageCode }),
    };
  } catch (error) {
    return toBlogActionError(error, "Unable to unpublish the blog translation.");
  }
}

export async function setBlogPostHeroMediaAction({
  id,
  mediaId,
}: {
  id: string;
  mediaId: string;
}): Promise<BlogActionResult> {
  const adminApiResult = await getBlogPostsAdminApi();
  if (!adminApiResult.ok) {
    return adminApiResult;
  }

  try {
    return {
      ok: true,
      blogPost: await adminApiResult.adminApi.setBlogPostHeroMedia({ id, mediaId }),
    };
  } catch (error) {
    return toBlogActionError(error, "Unable to update the cover image.");
  }
}

export async function clearBlogPostHeroMediaAction(id: string): Promise<BlogActionResult> {
  const adminApiResult = await getBlogPostsAdminApi();
  if (!adminApiResult.ok) {
    return adminApiResult;
  }

  try {
    return {
      ok: true,
      blogPost: await adminApiResult.adminApi.clearBlogPostHeroMedia(id),
    };
  } catch (error) {
    return toBlogActionError(error, "Unable to clear the cover image.");
  }
}
