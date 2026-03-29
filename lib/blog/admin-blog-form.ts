import type { components, paths } from "@/lib/api/generated/backend-types";

export type ApiBlogPost = components["schemas"]["BlogAdminResponseDto"];
export type ApiBlogTranslation = components["schemas"]["BlogAdminTranslationResponseDto"];
export type ApiLanguage = components["schemas"]["LanguageResponseDto"];
export type ApiTag = components["schemas"]["TagResponseDto"];

export type CreateBlogBody =
  paths["/api/admin/blog-posts"]["post"]["requestBody"]["content"]["application/json"];
export type UpdateBlogBody =
  paths["/api/admin/blog-posts/{id}"]["patch"]["requestBody"]["content"]["application/json"];
export type CreateBlogTranslationBody =
  paths["/api/admin/blog-posts/{id}/translations"]["post"]["requestBody"]["content"]["application/json"];
export type UpdateBlogTranslationBody =
  paths["/api/admin/blog-posts/{id}/translations/{languageCode}"]["patch"]["requestBody"]["content"]["application/json"];

export const BLOG_NAME_MAX_LENGTH = 255;
export const BLOG_SLUG_MAX_LENGTH = 150;
export const BLOG_TITLE_MAX_LENGTH = 255;
export const BLOG_SLUG_PATTERN = "^[a-z0-9]+(?:-[a-z0-9]+)*$";

export type BlogTranslationFormState = {
  existsOnServer: boolean;
  htmlContent: string;
  imageRefsText: string;
  isPublished: boolean;
  languageCode: string;
  slug: string;
  seoDescription: string;
  seoTitle: string;
  summary: string;
  title: string;
};

export type BlogFormState = {
  name: string;
  cardTagKey: string;
  tagKeys: string[];
  translations: BlogTranslationFormState[];
};

export type BlogPreviewData = {
  contentHtml: string | null;
  contentText: string;
  locale: string;
  publishedDate: string | null;
  slug: string;
  summary: string | null;
  title: string;
  updatedDate: string | null;
  viewCount: number;
};

const EMPTY_PARAGRAPH_HTML = "<p></p>";

const coerceApiString = (value: unknown) =>
  typeof value === "string" ? value : "";

const normalizeOptionalString = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const normalizeNullableString = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const normalizePreviewString = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const stripHtml = (text: string) => (
  text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
);

export const normalizeHtmlContent = (value: string) => value.trim();

export const isEmptyHtmlContent = (value: string) => {
  const normalized = normalizeHtmlContent(value);

  if (!normalized) {
    return true;
  }

  return normalized
    .replace(/<p>\s*(<br\s*\/?>)?\s*<\/p>/gi, "")
    .replace(/&nbsp;/gi, "")
    .trim().length === 0;
};

export const generateBlogSlug = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, BLOG_SLUG_MAX_LENGTH);

export const createEmptyTranslationFormState = (
  languageCode: string,
): BlogTranslationFormState => ({
  existsOnServer: false,
  htmlContent: EMPTY_PARAGRAPH_HTML,
  imageRefsText: "",
  isPublished: false,
  languageCode,
  slug: "",
  seoDescription: "",
  seoTitle: "",
  summary: "",
  title: "",
});

const createTranslationFormStateFromApi = (
  languageCode: string,
  translation: ApiBlogTranslation,
): BlogTranslationFormState => ({
  existsOnServer: true,
  htmlContent: translation.htmlContent || EMPTY_PARAGRAPH_HTML,
  imageRefsText: translation.imageRefs.join("\n"),
  isPublished: translation.isPublished,
  languageCode,
  slug: coerceApiString(translation.slug),
  seoDescription: coerceApiString(translation.seoDescription),
  seoTitle: coerceApiString(translation.seoTitle),
  summary: coerceApiString(translation.summary),
  title: coerceApiString(translation.title),
});

export const createBlogFormStateFromApi = (blogPost: ApiBlogPost): BlogFormState => ({
  name: blogPost.name,
  cardTagKey: blogPost.cardTagKey ?? "",
  tagKeys: [...blogPost.tagKeys],
  translations: Object.entries(blogPost.translations)
    .map(([languageCode, translation]) => createTranslationFormStateFromApi(languageCode, translation))
    .sort((left, right) => left.languageCode.localeCompare(right.languageCode)),
});

export const mergeBlogFormStateWithApiPost = (
  current: BlogFormState,
  blogPost: ApiBlogPost,
  options?: {
    refreshedLanguageCodes?: string[];
  },
): BlogFormState => {
  const refreshedLanguageCodes = options?.refreshedLanguageCodes
    ? new Set(options.refreshedLanguageCodes)
    : null;
  const currentByLanguage = new Map(
    current.translations.map((translation) => [translation.languageCode, translation]),
  );
  const translations = Object.entries(blogPost.translations)
    .map(([languageCode, translation]) => {
      const currentTranslation = currentByLanguage.get(languageCode);

      if (!currentTranslation) {
        return createTranslationFormStateFromApi(languageCode, translation);
      }

      if (!refreshedLanguageCodes?.has(languageCode)) {
        return {
          ...currentTranslation,
          existsOnServer: true,
          isPublished: translation.isPublished,
        };
      }

      return {
        ...currentTranslation,
        ...createTranslationFormStateFromApi(languageCode, translation),
      };
    })
    .sort((left, right) => left.languageCode.localeCompare(right.languageCode));

  current.translations.forEach((translation) => {
    if (!translation.existsOnServer && !(translation.languageCode in blogPost.translations)) {
      translations.push(translation);
    }
  });

  return {
    name: blogPost.name,
    cardTagKey: blogPost.cardTagKey ?? "",
    tagKeys: [...blogPost.tagKeys],
    translations,
  };
};

export const createEmptyBlogFormState = (): BlogFormState => ({
  name: "",
  cardTagKey: "",
  tagKeys: [],
  translations: [],
});

export const toCreateBlogBody = (formState: BlogFormState): CreateBlogBody => ({
  name: formState.name.trim(),
  tagKeys: formState.tagKeys.length > 0 ? formState.tagKeys : undefined,
});

export const toUpdateBlogBody = (formState: BlogFormState): UpdateBlogBody => ({
  name: formState.name.trim(),
  tagKeys: formState.tagKeys,
  cardTagKey: formState.cardTagKey.trim() || null,
});

const parseImageRefs = (imageRefsText: string) =>
  imageRefsText
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);

export const extractImageRefsFromHtml = (htmlContent: string) => {
  const matches = [...htmlContent.matchAll(/data-storage-path="([^"]+)"/g)];
  return [...new Set(matches.map((match) => match[1]).filter(Boolean))];
};

export const toCreateBlogTranslationBody = (
  translation: BlogTranslationFormState,
  formState: BlogFormState,
): CreateBlogTranslationBody => ({
  languageCode: translation.languageCode,
  slug: (translation.slug.trim() || generateBlogSlug(translation.title || formState.name)).trim(),
  title: normalizeOptionalString(translation.title),
  summary: normalizeOptionalString(translation.summary),
  htmlContent: isEmptyHtmlContent(translation.htmlContent)
    ? undefined
    : normalizeHtmlContent(translation.htmlContent),
  seoTitle: normalizeOptionalString(translation.seoTitle),
  seoDescription: normalizeOptionalString(translation.seoDescription),
  imageRefs: parseImageRefs(translation.imageRefsText),
});

export const toUpdateBlogTranslationBody = (
  translation: BlogTranslationFormState,
): UpdateBlogTranslationBody => ({
  slug: translation.slug.trim() || undefined,
  title: translation.title.trim(),
  summary: normalizeNullableString(translation.summary) as unknown as UpdateBlogTranslationBody["summary"],
  htmlContent: normalizeHtmlContent(translation.htmlContent),
  seoTitle: normalizeNullableString(translation.seoTitle) as unknown as UpdateBlogTranslationBody["seoTitle"],
  seoDescription: normalizeNullableString(translation.seoDescription) as unknown as UpdateBlogTranslationBody["seoDescription"],
  imageRefs: parseImageRefs(translation.imageRefsText),
});

export const createBlogPreviewData = ({
  blogPost,
  formState,
  translation,
}: {
  blogPost?: ApiBlogPost | null;
  formState: BlogFormState;
  translation: BlogTranslationFormState;
}): BlogPreviewData => {
  const normalizedTranslation = translation.existsOnServer
    ? toUpdateBlogTranslationBody(translation)
    : toCreateBlogTranslationBody(translation, formState);
  const slug = (translation.slug.trim() || generateBlogSlug(translation.title || formState.name)).trim();
  const title =
    normalizePreviewString(normalizedTranslation.title) ||
    formState.name.trim() ||
    slug ||
    "Untitled draft";
  const summary = normalizePreviewString(normalizedTranslation.summary);
  const contentHtml = normalizePreviewString(normalizedTranslation.htmlContent);

  return {
    contentHtml,
    contentText: stripHtml(contentHtml ?? summary ?? ""),
    locale: translation.languageCode,
    publishedDate: blogPost?.audit.publishedAt ?? null,
    slug,
    summary,
    title,
    updatedDate: blogPost?.audit.updatedAt ?? null,
    viewCount: blogPost?.translations[translation.languageCode]?.viewCount ?? 0,
  };
};

export const validateBlogSharedForm = (formState: BlogFormState) => {
  const name = formState.name.trim();

  if (!name) {
    return "A blog post name is required.";
  }

  if (name.length > BLOG_NAME_MAX_LENGTH) {
    return `The name must be ${ BLOG_NAME_MAX_LENGTH } characters or fewer.`;
  }

  return null;
};

export const validateBlogTranslationSlug = (translation: BlogTranslationFormState, formState: BlogFormState) => {
  const slug = (translation.slug.trim() || generateBlogSlug(translation.title || formState.name)).trim();

  if (!slug) {
    return "A valid slug is required for this translation.";
  }

  if (slug.length > BLOG_SLUG_MAX_LENGTH) {
    return `The slug must be ${ BLOG_SLUG_MAX_LENGTH } characters or fewer.`;
  }

  if (!new RegExp(BLOG_SLUG_PATTERN).test(slug)) {
    return "The slug may only contain lowercase letters, numbers, and hyphens.";
  }

  return null;
};

export const validateTranslationForPublish = (translation: BlogTranslationFormState) => {
  if (!translation.title.trim()) {
    return "A title is required before publishing a translation.";
  }

  if (isEmptyHtmlContent(translation.htmlContent)) {
    return "Body content is required before publishing a translation.";
  }

  return null;
};
