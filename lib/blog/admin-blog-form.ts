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
  seoDescription: string;
  seoTitle: string;
  summary: string;
  title: string;
};

export type BlogFormState = {
  name: string;
  slug: string;
  tagKeys: string[];
  translations: BlogTranslationFormState[];
};

const EMPTY_PARAGRAPH_HTML = "<p></p>";

const normalizeOptionalString = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const normalizeNullableString = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

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
  seoDescription: translation.seoDescription ?? "",
  seoTitle: translation.seoTitle ?? "",
  summary: translation.summary ?? "",
  title: translation.title ?? "",
});

export const createBlogFormStateFromApi = (blogPost: ApiBlogPost): BlogFormState => ({
  name: blogPost.name,
  slug: blogPost.slug,
  tagKeys: [...blogPost.tagKeys],
  translations: Object.entries(blogPost.translations)
    .map(([languageCode, translation]) => createTranslationFormStateFromApi(languageCode, translation))
    .sort((left, right) => left.languageCode.localeCompare(right.languageCode)),
});

export const mergeBlogFormStateWithApiPost = (
  current: BlogFormState,
  blogPost: ApiBlogPost,
): BlogFormState => {
  const currentByLanguage = new Map(
    current.translations.map((translation) => [translation.languageCode, translation]),
  );
  const translations = Object.entries(blogPost.translations)
    .map(([languageCode, translation]) => {
      const currentTranslation = currentByLanguage.get(languageCode);

      if (!currentTranslation) {
        return createTranslationFormStateFromApi(languageCode, translation);
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
    slug: blogPost.slug,
    tagKeys: [...blogPost.tagKeys],
    translations,
  };
};

export const createEmptyBlogFormState = (): BlogFormState => ({
  name: "",
  slug: "",
  tagKeys: [],
  translations: [],
});

export const toCreateBlogBody = (formState: BlogFormState): CreateBlogBody => ({
  name: formState.name.trim(),
  slug: (formState.slug.trim() || generateBlogSlug(formState.name)).trim(),
  tagKeys: formState.tagKeys.length > 0 ? formState.tagKeys : undefined,
});

export const toUpdateBlogBody = (formState: BlogFormState): UpdateBlogBody => ({
  name: formState.name.trim(),
  slug: (formState.slug.trim() || generateBlogSlug(formState.name)).trim(),
  tagKeys: formState.tagKeys,
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
): CreateBlogTranslationBody => ({
  languageCode: translation.languageCode,
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
  title: translation.title.trim(),
  summary: normalizeNullableString(translation.summary),
  htmlContent: normalizeHtmlContent(translation.htmlContent),
  seoTitle: normalizeNullableString(translation.seoTitle),
  seoDescription: normalizeNullableString(translation.seoDescription),
  imageRefs: parseImageRefs(translation.imageRefsText),
});

export const validateBlogSharedForm = (formState: BlogFormState) => {
  const name = formState.name.trim();
  const slug = (formState.slug.trim() || generateBlogSlug(formState.name)).trim();

  if (!name) {
    return "A blog post name is required.";
  }

  if (name.length > BLOG_NAME_MAX_LENGTH) {
    return `The name must be ${ BLOG_NAME_MAX_LENGTH } characters or fewer.`;
  }

  if (!slug) {
    return "A valid slug is required.";
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
