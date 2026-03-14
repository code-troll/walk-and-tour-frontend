import { createAdminApi } from "@/lib/api/admin";
import { isBackendApiError } from "@/lib/api/core/backend-client";

export const loadBlogPostsListData = async (accessToken: string) => {
  try {
    const adminApi = createAdminApi(accessToken);
    const [blogPosts, languages] = await Promise.all([
      adminApi.getBlogPosts(),
      adminApi.getLanguages(),
    ]);

    return {
      blogPosts,
      languages,
    };
  } catch (error) {
    return {
      errorMessage:
        isBackendApiError(error) || error instanceof Error
          ? error.message
          : "Unable to load blog posts.",
    };
  }
};

export const loadBlogPostEditorData = async ({
  accessToken,
  id,
}: {
  accessToken: string;
  id?: string;
}) => {
  try {
    const adminApi = createAdminApi(accessToken);
    const [blogPost, languages, tags] = await Promise.all([
      id ? adminApi.getBlogPost(id) : Promise.resolve(null),
      adminApi.getLanguages(),
      adminApi.getTags(),
    ]);

    return {
      blogPost,
      languages,
      tags,
    };
  } catch (error) {
    return {
      errorMessage:
        isBackendApiError(error) || error instanceof Error
          ? error.message
          : "Unable to load the blog post editor.",
    };
  }
};
