"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Eye,
  Globe,
  LoaderCircle,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AdminProgressLink, useAdminRouteProgress } from "@/components/admin/AdminRouteProgress";
import { AdminNoticeCard, AdminSectionCard } from "@/components/admin/AdminUi";
import BlogPostArticle from "@/components/blog/BlogPostArticle";
import { TiptapHtmlEditor, type TiptapHtmlEditorHandle } from "@/components/admin/TiptapHtmlEditor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  buildAuthHeaders,
  listAdminMediaAssets,
  type ApiAdminMediaAsset,
  type ApiUploadedMediaAsset,
  uploadAdminMediaAsset,
} from "@/lib/admin/media-client";
import {
  getAdminBlogPostClient,
  getAdminLanguagesClient,
  getAdminTagsClient,
} from "@/lib/admin/admin-client";
import {
  createBlogPreviewData,
  createEmptyBlogFormState,
  createEmptyTranslationFormState,
  createBlogFormStateFromApi,
  extractImageRefsFromHtml,
  generateBlogSlug,
  mergeBlogFormStateWithApiPost,
  toCreateBlogBody,
  toCreateBlogTranslationBody,
  toUpdateBlogBody,
  toUpdateBlogTranslationBody,
  validateBlogSharedForm,
  validateTranslationForPublish,
  type ApiBlogPost,
  type ApiLanguage,
  type ApiTag,
  type BlogFormState,
} from "@/lib/blog/admin-blog-form";
import { cn } from "@/lib/utils";
import {
  clearBlogPostHeroMediaAction,
  createBlogPostAction,
  createBlogPostTranslationAction,
  deleteBlogPostTranslationAction,
  publishBlogPostTranslationAction,
  setBlogPostHeroMediaAction,
  unpublishBlogPostTranslationAction,
  updateBlogPostAction,
  updateBlogPostTranslationAction,
} from "./actions";

const textareaClassName =
  "min-h-28 w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20";
const selectClassName =
  "h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20";
const fieldLabelClassName = "text-sm font-medium text-foreground";
const MEDIA_LIBRARY_PAGE_SIZE = 24;
const viewCountFormatter = new Intl.NumberFormat("en-US");

type BlogPostEditorClientProps = {
  accessToken: string;
  availableLanguages?: ApiLanguage[];
  availableTags?: ApiTag[];
  backendApiBaseUrl: string;
  initialBlogPost?: ApiBlogPost | null;
  blogPostId?: string;
  mode: "create" | "edit";
};

type FeedbackState =
  | {
  message: string;
  tone: "error" | "success";
}
  | null;

type MediaDialogMode = "cover" | "inline";
type MediaPreviewStatus = Record<
  string,
  {
    error: string | null;
    previewUrl: string | null;
  }
>;

const getTagLabel = (tag: ApiTag) =>
  tag.labels.en ?? Object.values(tag.labels)[0] ?? tag.key;

export function BlogPostEditorClient({
                                       accessToken,
                                       availableLanguages: initialLanguages = [],
                                       availableTags: initialTags = [],
                                       backendApiBaseUrl,
                                       initialBlogPost = null,
                                       blogPostId,
                                       mode,
                                     }: BlogPostEditorClientProps) {
  const router = useRouter();
  const { startNavigation } = useAdminRouteProgress();
  const [availableLanguages, setAvailableLanguages] = useState<ApiLanguage[]>(initialLanguages);
  const [availableTags, setAvailableTags] = useState<ApiTag[]>(initialTags);
  const [isInitialLoading, setIsInitialLoading] = useState(
    initialLanguages.length === 0 && initialTags.length === 0 && (!initialBlogPost || mode === "edit"),
  );
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);
  const editorRef = useRef<TiptapHtmlEditorHandle | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaPreviewObjectUrlsRef = useRef<Map<string, string>>(new Map());
  const loadingMediaPreviewIdsRef = useRef<Set<string>>(new Set());
  const [savedBlogPost, setSavedBlogPost] = useState<ApiBlogPost | null>(initialBlogPost);
  const [formState, setFormState] = useState<BlogFormState>(
    initialBlogPost ? createBlogFormStateFromApi(initialBlogPost) : createEmptyBlogFormState(),
  );
  const [activeLanguageCode, setActiveLanguageCode] = useState<string | null>(
    initialBlogPost ? Object.keys(initialBlogPost.translations)[0] ?? null : null,
  );
  const [languageToAdd, setLanguageToAdd] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [mediaDialogMode, setMediaDialogMode] = useState<MediaDialogMode>("inline");
  const [mediaSearchInput, setMediaSearchInput] = useState("");
  const [appliedMediaSearch, setAppliedMediaSearch] = useState("");
  const [mediaLibraryItems, setMediaLibraryItems] = useState<ApiAdminMediaAsset[]>([]);
  const [mediaLibraryPage, setMediaLibraryPage] = useState(1);
  const [mediaLibraryTotal, setMediaLibraryTotal] = useState(0);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [mediaDialogError, setMediaDialogError] = useState<string | null>(null);
  const [isLoadingMediaLibrary, setIsLoadingMediaLibrary] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaPreviewStatus, setMediaPreviewStatus] = useState<MediaPreviewStatus>({});
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  const enabledLanguages = useMemo(
    () => [...availableLanguages]
      .filter((language) => language.isEnabled)
      .sort((left, right) => left.sortOrder - right.sortOrder),
    [availableLanguages],
  );
  const languageNameByCode = useMemo(
    () => Object.fromEntries(enabledLanguages.map((language) => [language.code, language.name])),
    [enabledLanguages],
  );
  const remainingLanguages = enabledLanguages.filter(
    (language) => !formState.translations.some((translation) => translation.languageCode === language.code),
  );
  const resolvedActiveLanguageCode =
    activeLanguageCode && formState.translations.some((translation) => translation.languageCode === activeLanguageCode)
      ? activeLanguageCode
      : formState.translations[0]?.languageCode ?? null;
  const selectedLanguageToAdd =
    languageToAdd && remainingLanguages.some((language) => language.code === languageToAdd)
      ? languageToAdd
      : remainingLanguages[0]?.code ?? "";
  const activeTranslation =
    formState.translations.find((translation) => translation.languageCode === resolvedActiveLanguageCode) ?? null;
  const selectedMediaAsset =
    mediaLibraryItems.find((asset) => asset.id === selectedMediaId) ?? null;
  const isCreated = Boolean(savedBlogPost?.id);
  const generatedSlug = generateBlogSlug(formState.name);
  const publicLocaleCount = savedBlogPost?.translationAvailability.filter((item) => item.publiclyAvailable).length ?? 0;

  useEffect(() => {
    if (
      initialLanguages.length > 0 &&
      initialTags.length > 0 &&
      (mode !== "edit" || initialBlogPost)
    ) {
      setIsInitialLoading(false);
      return;
    }

    void (async () => {
      setIsInitialLoading(true);
      setInitialLoadError(null);

      try {
        const [languages, tags, blogPost] = await Promise.all([
          getAdminLanguagesClient(),
          getAdminTagsClient(),
          mode === "edit" && blogPostId ? getAdminBlogPostClient(blogPostId) : Promise.resolve(null),
        ]);

        setAvailableLanguages(languages);
        setAvailableTags(tags);

        if (mode === "edit") {
          if (!blogPost) {
            setInitialLoadError("The requested blog post could not be found.");
            return;
          }

          setSavedBlogPost(blogPost);
          setFormState(createBlogFormStateFromApi(blogPost));
          setActiveLanguageCode(Object.keys(blogPost.translations)[0] ?? null);
        }
      } catch (error) {
        setInitialLoadError(error instanceof Error ? error.message : "Unable to load the blog post editor.");
      } finally {
        setIsInitialLoading(false);
      }
    })();
  }, [blogPostId, initialBlogPost, initialLanguages.length, initialTags.length, mode]);

  useEffect(() => {
    const previewUrls = mediaPreviewObjectUrlsRef.current;
    const loadingPreviewIds = loadingMediaPreviewIdsRef.current;

    return () => {
      previewUrls.forEach((previewUrl) => {
        URL.revokeObjectURL(previewUrl);
      });
      previewUrls.clear();
      loadingPreviewIds.clear();
    };
  }, []);

  const applySavedBlogPost = (blogPost: ApiBlogPost, successMessage: string) => {
    setSavedBlogPost(blogPost);
    setFormState((current) => mergeBlogFormStateWithApiPost(current, blogPost));
    setFeedback({
      tone: "success",
      message: successMessage,
    });
    setLastSaved(new Date());

    if (!resolvedActiveLanguageCode && Object.keys(blogPost.translations).length > 0) {
      setActiveLanguageCode(Object.keys(blogPost.translations)[0]);
    }
  };

  const updateSharedField = <K extends keyof BlogFormState>(key: K, value: BlogFormState[K]) => {
    setFeedback(null);
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateTranslationField = (
    languageCode: string,
    key: keyof BlogFormState["translations"][number],
    value: string | boolean,
  ) => {
    setFeedback(null);
    setFormState((current) => ({
      ...current,
      translations: current.translations.map((translation) =>
        translation.languageCode === languageCode
          ? {
            ...translation,
            [key]: value,
          }
          : translation,
      ),
    }));
  };

  const updateTranslationHtmlContent = (languageCode: string, htmlContent: string) => {
    const imageRefsText = extractImageRefsFromHtml(htmlContent).join("\n");

    setFeedback(null);
    setFormState((current) => ({
      ...current,
      translations: current.translations.map((translation) =>
        translation.languageCode === languageCode
          ? {
            ...translation,
            htmlContent,
            imageRefsText,
          }
          : translation,
      ),
    }));
  };

  const toggleTag = (tagKey: string) => {
    setFeedback(null);
    setFormState((current) => ({
      ...current,
      tagKeys: current.tagKeys.includes(tagKey)
        ? current.tagKeys.filter((key) => key !== tagKey)
        : [...current.tagKeys, tagKey],
    }));
  };

  const saveShared = async () => {
    const validationError = validateBlogSharedForm(formState);
    if (validationError) {
      setFeedback({
        tone: "error",
        message: validationError,
      });
      return;
    }

    setIsMutating(true);
    setFeedback(null);

    const result = savedBlogPost
      ? await updateBlogPostAction({
        id: savedBlogPost.id,
        body: toUpdateBlogBody(formState),
      })
      : await createBlogPostAction(toCreateBlogBody(formState));

    setIsMutating(false);

    if (!result.ok) {
      setFeedback({
        tone: "error",
        message: result.message,
      });
      return;
    }

    applySavedBlogPost(result.blogPost, savedBlogPost ? "Shared blog details updated." : "Blog post created.");

    if (!savedBlogPost) {
      startNavigation();
      router.replace(`/blog-posts/${ result.blogPost.id }`);
    }
  };

  const addTranslation = () => {
    if (!selectedLanguageToAdd) {
      return;
    }

    setFeedback(null);
    setFormState((current) => ({
      ...current,
      translations: [...current.translations, createEmptyTranslationFormState(selectedLanguageToAdd)],
    }));
    setActiveLanguageCode(selectedLanguageToAdd);
    setLanguageToAdd("");
  };

  const saveTranslation = async () => {
    if (!savedBlogPost || !activeTranslation) {
      setFeedback({
        tone: "error",
        message: "Save the shared blog post before managing translations.",
      });
      return;
    }

    setIsMutating(true);
    setFeedback(null);

    const result = activeTranslation.existsOnServer
      ? await updateBlogPostTranslationAction({
        body: toUpdateBlogTranslationBody(activeTranslation),
        id: savedBlogPost.id,
        languageCode: activeTranslation.languageCode,
      })
      : await createBlogPostTranslationAction({
        body: toCreateBlogTranslationBody(activeTranslation),
        id: savedBlogPost.id,
      });

    setIsMutating(false);

    if (!result.ok) {
      setFeedback({
        tone: "error",
        message: result.message,
      });
      return;
    }

    applySavedBlogPost(
      result.blogPost,
      `${ languageNameByCode[activeTranslation.languageCode] ?? activeTranslation.languageCode } translation saved.`,
    );
  };

  const togglePublishTranslation = async () => {
    if (!savedBlogPost || !activeTranslation) {
      return;
    }

    const publishValidationError = !activeTranslation.isPublished
      ? validateTranslationForPublish(activeTranslation)
      : null;

    if (publishValidationError) {
      setFeedback({
        tone: "error",
        message: publishValidationError,
      });
      return;
    }

    setIsMutating(true);
    setFeedback(null);

    let nextBlogPost = savedBlogPost;

    if (!activeTranslation.existsOnServer) {
      const saveResult = await createBlogPostTranslationAction({
        body: toCreateBlogTranslationBody(activeTranslation),
        id: savedBlogPost.id,
      });

      if (!saveResult.ok) {
        setIsMutating(false);
        setFeedback({
          tone: "error",
          message: saveResult.message,
        });
        return;
      }

      nextBlogPost = saveResult.blogPost;
      applySavedBlogPost(nextBlogPost, `${ languageNameByCode[activeTranslation.languageCode] ?? activeTranslation.languageCode } translation saved.`);
    } else if (!activeTranslation.isPublished) {
      const saveResult = await updateBlogPostTranslationAction({
        body: toUpdateBlogTranslationBody(activeTranslation),
        id: savedBlogPost.id,
        languageCode: activeTranslation.languageCode,
      });

      if (!saveResult.ok) {
        setIsMutating(false);
        setFeedback({
          tone: "error",
          message: saveResult.message,
        });
        return;
      }

      nextBlogPost = saveResult.blogPost;
      applySavedBlogPost(nextBlogPost, `${ languageNameByCode[activeTranslation.languageCode] ?? activeTranslation.languageCode } translation saved.`);
    }

    const publishResult = activeTranslation.isPublished
      ? await unpublishBlogPostTranslationAction({
        id: nextBlogPost.id,
        languageCode: activeTranslation.languageCode,
      })
      : await publishBlogPostTranslationAction({
        id: nextBlogPost.id,
        languageCode: activeTranslation.languageCode,
      });

    setIsMutating(false);

    if (!publishResult.ok) {
      setFeedback({
        tone: "error",
        message: publishResult.message,
      });
      return;
    }

    applySavedBlogPost(
      publishResult.blogPost,
      activeTranslation.isPublished
        ? `${ languageNameByCode[activeTranslation.languageCode] ?? activeTranslation.languageCode } translation unpublished.`
        : `${ languageNameByCode[activeTranslation.languageCode] ?? activeTranslation.languageCode } translation published.`,
    );
  };

  const removeTranslation = async (languageCode: string) => {
    const languageName = languageNameByCode[languageCode] ?? languageCode;
    if (!window.confirm(`Delete the ${ languageName } translation?`)) {
      return;
    }

    const translation = formState.translations.find((item) => item.languageCode === languageCode);
    if (!translation) {
      return;
    }

    if (!savedBlogPost || !translation.existsOnServer) {
      const remaining = formState.translations.filter((item) => item.languageCode !== languageCode);
      setFormState((current) => ({
        ...current,
        translations: current.translations.filter((item) => item.languageCode !== languageCode),
      }));
      setActiveLanguageCode((current) =>
        current === languageCode ? remaining[0]?.languageCode ?? null : current,
      );
      setFeedback({
        tone: "success",
        message: `${ languageName } draft removed.`,
      });
      return;
    }

    setIsMutating(true);
    setFeedback(null);

    const result = await deleteBlogPostTranslationAction({
      id: savedBlogPost.id,
      languageCode,
    });

    setIsMutating(false);

    if (!result.ok) {
      setFeedback({
        tone: "error",
        message: result.message,
      });
      return;
    }

    setSavedBlogPost((current) => {
      if (!current) {
        return current;
      }

      const nextTranslations = {...current.translations};
      delete nextTranslations[languageCode];

      return {
        ...current,
        translations: nextTranslations,
        translationAvailability: current.translationAvailability.filter(
          (item) => item.languageCode !== languageCode,
        ),
      };
    });
    setFormState((current) => ({
      ...current,
      translations: current.translations.filter((item) => item.languageCode !== languageCode),
    }));
    setActiveLanguageCode((current) =>
      current === languageCode
        ? formState.translations.find((item) => item.languageCode !== languageCode)?.languageCode ?? null
        : current,
    );
    setFeedback({
      tone: "success",
      message: `${ languageName } translation deleted.`,
    });
    setLastSaved(new Date());
  };

  const ensureMediaPreview = useCallback(async ({
                                                  contentUrl,
                                                  mediaId,
                                                }: {
    contentUrl: string;
    mediaId: string;
  }) => {
    if (!contentUrl || mediaPreviewObjectUrlsRef.current.has(mediaId) || loadingMediaPreviewIdsRef.current.has(mediaId)) {
      return;
    }

    loadingMediaPreviewIdsRef.current.add(mediaId);

    try {
      const response = await fetch(contentUrl, {
        method: "GET",
        headers: buildAuthHeaders(accessToken, false),
        cache: "force-cache",
      });

      if (!response.ok) {
        setMediaPreviewStatus((current) => ({
          ...current,
          [mediaId]: {
            error: `Preview unavailable (${ response.status }).`,
            previewUrl: null,
          },
        }));
        return;
      }

      const blob = await response.blob();
      const previewUrl = URL.createObjectURL(blob);
      const previousPreviewUrl = mediaPreviewObjectUrlsRef.current.get(mediaId);

      if (previousPreviewUrl) {
        URL.revokeObjectURL(previousPreviewUrl);
      }

      mediaPreviewObjectUrlsRef.current.set(mediaId, previewUrl);
      setMediaPreviewStatus((current) => ({
        ...current,
        [mediaId]: {
          error: null,
          previewUrl,
        },
      }));
    } catch {
      setMediaPreviewStatus((current) => ({
        ...current,
        [mediaId]: {
          error: "Preview unavailable.",
          previewUrl: null,
        },
      }));
    } finally {
      loadingMediaPreviewIdsRef.current.delete(mediaId);
    }
  }, [accessToken]);

  useEffect(() => {
    mediaLibraryItems.forEach((asset) => {
      void ensureMediaPreview({
        contentUrl: asset.adminContentUrl,
        mediaId: asset.id,
      });
    });

    if (savedBlogPost?.heroMedia) {
      void ensureMediaPreview({
        contentUrl: savedBlogPost.heroMedia.contentUrl,
        mediaId: savedBlogPost.heroMedia.id,
      });
    }
  }, [ensureMediaPreview, mediaLibraryItems, savedBlogPost?.heroMedia]);

  const loadMediaPage = async ({
                                 append,
                                 page,
                                 search,
                               }: {
    append: boolean;
    page: number;
    search: string;
  }) => {
    setIsLoadingMediaLibrary(true);
    setMediaDialogError(null);

    try {
      const result = await listAdminMediaAssets({
        accessToken,
        backendApiBaseUrl,
        limit: MEDIA_LIBRARY_PAGE_SIZE,
        page,
        search,
      });

      if (!result.ok) {
        setMediaDialogError(result.message);
        return;
      }

      setMediaLibraryItems((currentItems) => {
        const nextItems = append ? [...currentItems, ...result.response.items] : result.response.items;
        const deduplicatedItems = new Map(nextItems.map((item) => [item.id, item]));
        return [...deduplicatedItems.values()];
      });
      setMediaLibraryPage(result.response.page);
      setMediaLibraryTotal(result.response.total);
    } finally {
      setIsLoadingMediaLibrary(false);
    }
  };

  const openMediaDialog = async (mode: MediaDialogMode) => {
    if (!savedBlogPost?.id) {
      setFeedback({
        tone: "error",
        message: "Save the blog post before working with images.",
      });
      return;
    }

    setMediaDialogMode(mode);
    setSelectedMediaId(savedBlogPost.heroMedia?.id ?? null);
    setIsMediaDialogOpen(true);
    await loadMediaPage({
      append: false,
      page: 1,
      search: appliedMediaSearch,
    });
  };

  const handleMediaSearch = async () => {
    const nextSearch = mediaSearchInput.trim();
    setAppliedMediaSearch(nextSearch);
    await loadMediaPage({
      append: false,
      page: 1,
      search: nextSearch,
    });
  };

  const handleMediaUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !savedBlogPost?.id) {
      return;
    }

    setIsUploadingMedia(true);
    setMediaDialogError(null);

    const uploadedAssets: ApiUploadedMediaAsset[] = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      const result = await uploadAdminMediaAsset({
        accessToken,
        backendApiBaseUrl,
        file,
        folder: `blog-posts/${ savedBlogPost.id }/${ mediaDialogMode === "cover" ? "cover" : "content" }`,
      });

      if (!result.ok) {
        errors.push(`${ file.name }: ${ result.message }`);
        continue;
      }

      uploadedAssets.push(result.media);
    }

    if (uploadedAssets.length > 0) {
      const nextItems = uploadedAssets.map((asset) => ({
        ...asset,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      setMediaLibraryItems((current) => {
        const deduplicatedItems = new Map([...nextItems, ...current].map((item) => [item.id, item]));
        return [...deduplicatedItems.values()];
      });
      setMediaLibraryTotal((current) => current + uploadedAssets.length);
      setSelectedMediaId(uploadedAssets[0].id);

      uploadedAssets.forEach((asset) => {
        void ensureMediaPreview({
          contentUrl: asset.adminContentUrl,
          mediaId: asset.id,
        });
      });
    }

    if (errors.length > 0) {
      setMediaDialogError(errors.join("\n"));
    }

    setIsUploadingMedia(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const confirmSelectedMedia = async () => {
    if (!savedBlogPost?.id || !selectedMediaAsset) {
      return;
    }

    if (mediaDialogMode === "cover") {
      setIsMutating(true);
      setFeedback(null);

      const result = await setBlogPostHeroMediaAction({
        id: savedBlogPost.id,
        mediaId: selectedMediaAsset.id,
      });

      setIsMutating(false);

      if (!result.ok) {
        setFeedback({
          tone: "error",
          message: result.message,
        });
        return;
      }

      applySavedBlogPost(result.blogPost, "Cover image updated.");
      setIsMediaDialogOpen(false);
      return;
    }

    editorRef.current?.insertImage({
      alt: selectedMediaAsset.originalFilename,
      mediaId: selectedMediaAsset.id,
      src: selectedMediaAsset.publicContentUrl,
      storagePath: selectedMediaAsset.storagePath,
    });
    setIsMediaDialogOpen(false);
    setFeedback({
      tone: "success",
      message: "Image inserted into the post body. Select it in the editor to change size, alignment, or caption.",
    });
  };

  const clearCoverImage = async () => {
    if (!savedBlogPost?.id || !savedBlogPost.heroMedia) {
      return;
    }

    setIsMutating(true);
    setFeedback(null);

    const result = await clearBlogPostHeroMediaAction(savedBlogPost.id);

    setIsMutating(false);

    if (!result.ok) {
      setFeedback({
        tone: "error",
        message: result.message,
      });
      return;
    }

    applySavedBlogPost(result.blogPost, "Cover image cleared.");
  };

  const coverPreviewUrl = savedBlogPost?.heroMedia
    ? mediaPreviewStatus[savedBlogPost.heroMedia.id]?.previewUrl ?? null
    : null;
  const previewData = useMemo(
    () => (
      activeTranslation
        ? createBlogPreviewData({
          blogPost: savedBlogPost,
          formState,
          translation: activeTranslation,
        })
        : null
    ),
    [activeTranslation, formState, savedBlogPost],
  );
  const mediaDialogTitle = mediaDialogMode === "cover" ? "Select Cover Image" : "Insert Post Image";
  const mediaDialogDescription = mediaDialogMode === "cover"
    ? "Choose or upload the image used for blog listings and the hero section."
    : "Choose or upload an image to insert into the article body. After insertion, select the image in the editor to change its size and alignment.";

  if (isInitialLoading) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title={mode === "edit" ? "Loading the blog post editor." : "Loading the new blog post workspace."}
        description="Resolving tags, languages, and blog content."
      />
    );
  }

  if (initialLoadError) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title={mode === "edit" ? "The blog post editor could not be loaded." : "The new blog post workspace could not be loaded."}
        description={initialLoadError}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
        { feedback ? (
          <div
            className={ cn(
              "whitespace-pre-line rounded-2xl border px-4 py-3 text-sm",
              feedback.tone === "error"
                ? "border-[#e7c9c2] bg-[#fdf2ef] text-[#8c3b32]"
                : "border-[#d8c5a8] bg-[#fcfaf6] text-[#8f6a3b]",
            ) }
          >
            { feedback.message }
          </div>
        ) : null }

        <AdminSectionCard
          title={ formState.name || (mode === "create" ? "New Blog Post" : "Untitled Blog Post") }
          description={
            isCreated
              ? `Slug: ${ formState.slug || "not-set" }`
              : "Save the shared details once to unlock cover image and locale editing."
          }
          actions={
            <>
              { lastSaved ? (
                <time
                  dateTime={ lastSaved.toISOString() }
                  suppressHydrationWarning
                  className="hidden text-xs text-[#627176] md:block"
                >
                  Saved { lastSaved.toLocaleTimeString(undefined, {hourCycle: "h12"}) }
                </time>
              ) : null }
              <Button
                type="button"
                onClick={ saveShared }
                disabled={ isMutating }
                className="gap-2"
              >
                { isMutating ? <LoaderCircle className="size-4 animate-spin"/> : <Check className="size-4"/> }
                Save Shared
              </Button>
            </>
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <AdminProgressLink
              href="/blog-posts"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#627176] transition-colors hover:text-[#21343b]"
            >
              <ArrowLeft className="size-4"/>
              <span>Back to Blog Posts</span>
            </AdminProgressLink>
            <span
              className={ cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                publicLocaleCount > 0
                  ? "border-[#d8c5a8] bg-[#fcfaf6] text-[#8f6a3b]"
                  : "border-[#eadfce] bg-[#fbf7f0] text-[#627176]",
              ) }
            >
              { publicLocaleCount > 0 ? `${ publicLocaleCount } public locale${ publicLocaleCount === 1 ? "" : "s" }` : "No public locales" }
            </span>
          </div>
        </AdminSectionCard>

        <AdminSectionCard
          title="Shared Details"
          description="The shared record defines the admin-facing name, public slug, and tags."
          actions={
            <Button type="button" onClick={ saveShared } disabled={ isMutating } variant="outline" className="gap-2">
              { isMutating ? <LoaderCircle className="size-4 animate-spin"/> : <Save className="size-4"/> }
              Save
            </Button>
          }
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-2">
              <label className={ fieldLabelClassName } htmlFor="blog-name">Name</label>
              <Input
                id="blog-name"
                value={ formState.name }
                onChange={ (event) => updateSharedField("name", event.target.value) }
                placeholder="Barcelona Historic Center SEO Article"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label className={ fieldLabelClassName } htmlFor="blog-slug">Slug</label>
              <Input
                id="blog-slug"
                value={ formState.slug }
                onChange={ (event) => updateSharedField("slug", event.target.value) }
                placeholder={ generatedSlug || "blog-post-slug" }
                className="h-11 font-mono"
              />
              { !formState.slug && generatedSlug ? (
                <p className="text-xs text-muted-foreground">Will use: <span
                  className="font-mono">{ generatedSlug }</span></p>
              ) : null }
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <p className={ fieldLabelClassName }>Tags</p>
            <div className="flex flex-wrap gap-2">
              { availableTags.map((tag) => {
                const isSelected = formState.tagKeys.includes(tag.key);

                return (
                  <button
                    key={ tag.key }
                    type="button"
                    onClick={ () => toggleTag(tag.key) }
                    className={ cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
                    ) }
                  >
                    { getTagLabel(tag) }
                  </button>
                );
              }) }
            </div>
          </div>
        </AdminSectionCard>

        <AdminSectionCard
          title="Cover Image"
          description="This image is used as the listing and hero image for the blog post."
          actions={
            isCreated ? (
              <>
                <Button type="button" onClick={ () => void openMediaDialog("cover") } disabled={ isMutating }
                        className="gap-2">
                  <Upload className="size-4"/>
                  Upload or Select
                </Button>
                { savedBlogPost?.heroMedia ? (
                  <Button type="button" variant="outline" onClick={ clearCoverImage } disabled={ isMutating }
                          className="gap-2 text-destructive hover:text-destructive">
                    <X className="size-4"/>
                    Clear
                  </Button>
                ) : null }
              </>
            ) : null
          }
        >

          { !isCreated ? (
            <div
              className="rounded-2xl border-2 border-dashed border-[#eadfce] bg-[#fbf7f0] px-6 py-10 text-center text-sm text-[#627176]">
              Save the shared blog post before selecting a cover image.
            </div>
          ) : savedBlogPost?.heroMedia ? (
            <div className="flex flex-wrap items-start gap-5">
              <div className="overflow-hidden rounded-2xl border border-[#eadfce] bg-[#fbf7f0]">
                { coverPreviewUrl ? (
                  <Image
                    src={ coverPreviewUrl }
                    alt={ savedBlogPost.heroMedia.originalFilename }
                    width={ 288 }
                    height={ 192 }
                    unoptimized
                    className="h-48 w-72 object-cover"
                  />
                ) : (
                  <div className="flex h-48 w-72 items-center justify-center text-sm text-[#627176]">
                    Loading preview...
                  </div>
                ) }
              </div>
              <div className="min-w-0 flex-1 space-y-2 text-sm text-[#627176]">
                <p className="font-medium text-[#21343b]">{ savedBlogPost.heroMedia.originalFilename }</p>
                <p className="truncate font-mono text-xs">{ savedBlogPost.heroMedia.storagePath }</p>
                <p>{ Math.round(savedBlogPost.heroMedia.size / 1024) } KB</p>
              </div>
            </div>
          ) : (
            <div
              className="rounded-2xl border-2 border-dashed border-[#eadfce] bg-[#fbf7f0] px-6 py-10 text-center text-sm text-[#627176]">
              No cover image selected yet.
            </div>
          ) }
        </AdminSectionCard>

        <AdminSectionCard
          title="Translations"
          description={
            isCreated
              ? "Each locale is stored as a separate translation record. Save, publish, and unpublish them independently."
              : "Create the shared blog record first. Locale translations are attached after the base post exists."
          }
          actions={
            isCreated && remainingLanguages.length > 0 ? (
              <>
                <select
                  value={ selectedLanguageToAdd }
                  onChange={ (event) => setLanguageToAdd(event.target.value) }
                  className={ selectClassName }
                >
                  { remainingLanguages.map((language) => (
                    <option key={ language.code } value={ language.code }>
                      { language.name }
                    </option>
                  )) }
                </select>
                <Button type="button" onClick={ addTranslation } disabled={ isMutating || !selectedLanguageToAdd }
                        className="gap-2">
                  <Plus className="size-4"/>
                  Add Locale
                </Button>
              </>
            ) : null
          }
        >

          { !isCreated ? (
            <div
              className="rounded-2xl border-2 border-dashed border-[#eadfce] bg-[#fbf7f0] px-6 py-10 text-center text-sm text-[#627176]">
              Save the shared details to start adding localized blog content.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                { formState.translations.length === 0 ? (
                  <div
                    className="w-full rounded-2xl border-2 border-dashed border-[#eadfce] bg-[#fbf7f0] px-6 py-10 text-center text-sm text-[#627176]">
                    No translations yet. Add a locale to start writing the blog content.
                  </div>
                ) : (
                  formState.translations.map((translation) => {
                    const availability = savedBlogPost?.translationAvailability.find(
                      (item) => item.languageCode === translation.languageCode,
                    );
                    const savedTranslation = savedBlogPost?.translations[translation.languageCode];
                    const isActive = translation.languageCode === resolvedActiveLanguageCode;

                    return (
                      <button
                        key={ translation.languageCode }
                        type="button"
                        onClick={ () => setActiveLanguageCode(translation.languageCode) }
                        className={ cn(
                          "rounded-2xl border px-4 py-3 text-left transition",
                          isActive
                            ? "border-[#d8c5a8] bg-[#fcfaf6] ring-2 ring-[#eadfce]"
                            : "border-[#eadfce] bg-white hover:border-[#d8c5a8]",
                        ) }
                      >
                        <div className="flex items-center gap-2 text-sm font-medium text-[#21343b]">
                          <Globe className="size-4 text-[#9a6a2f]"/>
                          { languageNameByCode[translation.languageCode] ?? translation.languageCode }
                        </div>
                        <p className="mt-1 text-xs text-[#627176]">
                          { availability?.isPublished || translation.isPublished ? "Published" : "Draft" }
                          { availability?.publiclyAvailable ? " - Public" : "" }
                        </p>
                        <p className="mt-1 text-xs font-medium text-[#8f6a3b]">
                          Views: { viewCountFormatter.format(savedTranslation?.viewCount ?? 0) }
                        </p>
                      </button>
                    );
                  })
                ) }
              </div>

              { activeTranslation ? (
                <div className="space-y-5 rounded-lg border border-border bg-muted/30 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        { languageNameByCode[activeTranslation.languageCode] ?? activeTranslation.languageCode }
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Upload images from the media library, use Video for YouTube or Vimeo links, then select inserted
                        images in the body to change size, alignment, and captions.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#d8c5a8] bg-[#fcfaf6] px-3 py-1 text-xs font-medium text-[#8f6a3b]">
                        Views: {
                          viewCountFormatter.format(
                            savedBlogPost?.translations[activeTranslation.languageCode]?.viewCount ?? 0,
                          )
                        }
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={ () => setIsPreviewDialogOpen(true) }
                        disabled={ isMutating }
                        className="gap-2"
                      >
                        <Eye className="size-4"/>
                        Preview
                      </Button>
                      <Button type="button" variant="outline" onClick={ saveTranslation } disabled={ isMutating }
                              className="gap-2">
                        { isMutating ? <LoaderCircle className="size-4 animate-spin"/> : <Save className="size-4"/> }
                        Save Translation
                      </Button>
                      <Button
                        type="button"
                        onClick={ togglePublishTranslation }
                        disabled={ isMutating }
                        className="gap-2"
                      >
                        { isMutating ? <LoaderCircle className="size-4 animate-spin"/> : <Globe className="size-4"/> }
                        { activeTranslation.isPublished ? "Unpublish" : "Publish" }
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={ () => void removeTranslation(activeTranslation.languageCode) }
                        disabled={ isMutating }
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4"/>
                        Delete
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    <div className="space-y-2">
                      <label className={ fieldLabelClassName } htmlFor="translation-title">Title</label>
                      <Input
                        id="translation-title"
                        value={ activeTranslation.title }
                        onChange={ (event) => updateTranslationField(activeTranslation.languageCode, "title", event.target.value) }
                        placeholder="Barcelona Historic Center Guide"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className={ fieldLabelClassName } htmlFor="translation-summary">Summary</label>
                      <textarea
                        id="translation-summary"
                        value={ activeTranslation.summary }
                        onChange={ (event) => updateTranslationField(activeTranslation.languageCode, "summary", event.target.value) }
                        placeholder="A walking guide to the historic center of Barcelona."
                        className={ textareaClassName }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={ fieldLabelClassName }>Body</label>
                    <TiptapHtmlEditor
                      ref={ editorRef }
                      value={ activeTranslation.htmlContent }
                      onChange={ (value) => updateTranslationHtmlContent(activeTranslation.languageCode, value) }
                      onError={ (message) => setFeedback({tone: "error", message}) }
                      onRequestInsertImage={ () => void openMediaDialog("inline") }
                    />
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    <div className="space-y-2">
                      <label className={ fieldLabelClassName } htmlFor="translation-seo-title">SEO Title</label>
                      <Input
                        id="translation-seo-title"
                        value={ activeTranslation.seoTitle }
                        onChange={ (event) => updateTranslationField(activeTranslation.languageCode, "seoTitle", event.target.value) }
                        placeholder="Historic Center Guide | Walk and Tour"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className={ fieldLabelClassName } htmlFor="translation-seo-description">SEO
                        Description</label>
                      <textarea
                        id="translation-seo-description"
                        value={ activeTranslation.seoDescription }
                        onChange={ (event) => updateTranslationField(activeTranslation.languageCode, "seoDescription", event.target.value) }
                        placeholder="Discover the best historic landmarks in Barcelona."
                        className={ textareaClassName }
                      />
                    </div>
                  </div>
                </div>
              ) : null }
            </div>
          ) }
        </AdminSectionCard>

      <Dialog open={ isMediaDialogOpen } onOpenChange={ setIsMediaDialogOpen }>
        <DialogContent showCloseButton={ false } className="border border-[#eadfce] bg-white shadow-[0_20px_50px_rgba(42,36,25,0.05)] sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{ mediaDialogTitle }</DialogTitle>
            <DialogDescription>{ mediaDialogDescription }</DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"/>
              <Input
                value={ mediaSearchInput }
                onChange={ (event) => setMediaSearchInput(event.target.value) }
                placeholder="Search media library"
                className="h-11 pl-9"
              />
            </div>
            <Button type="button" variant="outline" onClick={ () => void handleMediaSearch() }
                    disabled={ isLoadingMediaLibrary }>
              Search
            </Button>
            <input
              ref={ fileInputRef }
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={ (event) => void handleMediaUpload(event.target.files) }
            />
            <Button type="button" onClick={ () => fileInputRef.current?.click() } disabled={ isUploadingMedia }
                    className="gap-2">
              { isUploadingMedia ? <LoaderCircle className="size-4 animate-spin"/> : <Upload className="size-4"/> }
              Upload
            </Button>
          </div>

          { mediaDialogError ? (
            <div
              className="whitespace-pre-line rounded-2xl border border-[#e7c9c2] bg-[#fdf2ef] px-4 py-3 text-sm text-[#8c3b32]">
              { mediaDialogError }
            </div>
          ) : null }

          <div className="max-h-112 overflow-y-auto rounded-2xl border border-[#eadfce] bg-[#fbf7f0] p-4">
            { mediaLibraryItems.length === 0 && !isLoadingMediaLibrary ? (
              <div className="flex min-h-48 items-center justify-center text-sm text-[#627176]">
                No media assets found.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                { mediaLibraryItems.map((asset) => {
                  const preview = mediaPreviewStatus[asset.id]?.previewUrl;
                  const isSelected = asset.id === selectedMediaId;

                  return (
                    <button
                      key={ asset.id }
                      type="button"
                      onClick={ () => setSelectedMediaId(asset.id) }
                      className={ cn(
                        "overflow-hidden rounded-2xl border bg-white text-left transition",
                        isSelected
                          ? "border-[#d8c5a8] ring-2 ring-[#eadfce] shadow-md"
                          : "border-[#eadfce] hover:border-[#d8c5a8]",
                      ) }
                    >
                      <div className="flex h-40 items-center justify-center bg-[#fbf7f0]">
                        { preview ? (
                          <Image
                            src={ preview }
                            alt={ asset.originalFilename }
                            width={ 320 }
                            height={ 160 }
                            unoptimized
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm text-[#627176]">Loading preview...</span>
                        ) }
                      </div>
                      <div className="space-y-1 p-3">
                        <p className="truncate text-sm font-medium text-[#21343b]">{ asset.originalFilename }</p>
                        <p className="truncate font-mono text-xs text-[#627176]">{ asset.storagePath }</p>
                      </div>
                    </button>
                  );
                }) }
              </div>
            ) }
          </div>

          { mediaLibraryItems.length < mediaLibraryTotal ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={ () => void loadMediaPage({
                  append: true,
                  page: mediaLibraryPage + 1,
                  search: appliedMediaSearch
                }) }
                disabled={ isLoadingMediaLibrary }
              >
                { isLoadingMediaLibrary ? <LoaderCircle className="size-4 animate-spin"/> : null }
                Load More
              </Button>
            </div>
          ) : null }

          <DialogFooter>
            <Button type="button" variant="outline" onClick={ () => setIsMediaDialogOpen(false) }>
              Cancel
            </Button>
            <Button type="button" onClick={ () => void confirmSelectedMedia() }
                    disabled={ !selectedMediaAsset || isMutating || isUploadingMedia }>
              { mediaDialogMode === "cover" ? "Use as Cover" : "Insert Image" }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={ isPreviewDialogOpen } onOpenChange={ setIsPreviewDialogOpen }>
        <DialogContent className="grid max-h-[90vh] grid-rows-[auto_minmax(0,1fr)] overflow-hidden border border-[#eadfce] bg-white p-0 shadow-[0_20px_50px_rgba(42,36,25,0.05)] sm:max-w-5xl">
          <DialogHeader className="border-b border-[#f0e6d8] px-6 py-5">
            <DialogTitle>Preview Post</DialogTitle>
            <DialogDescription>
              This preview reflects the current draft after the same translation normalization used by save, without publishing or persisting changes.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 overflow-y-auto px-6 py-6">
            { previewData ? (
              <div className="mx-auto w-full max-w-4xl rounded-3xl border border-[#e8dfd4] bg-white px-6 py-8 lg:px-12">
                <BlogPostArticle
                  contentHtml={ previewData.contentHtml }
                  contentText={ previewData.contentText }
                  coverImageAlt={ previewData.title }
                  coverImageUrl={ coverPreviewUrl }
                  eyebrow="Preview"
                  eyebrowNote={
                    `Locale: ${ languageNameByCode[previewData.locale] ?? previewData.locale } • Slug: ${ previewData.slug }`
                  }
                  locale={ previewData.locale }
                  publishedDate={ previewData.publishedDate }
                  publishedLabel="Published on"
                  summary={ previewData.summary }
                  title={ previewData.title }
                  updatedDate={ previewData.updatedDate }
                  updatedLabel="Updated on"
                  viewCount={ previewData.viewCount }
                  viewsLabel="Views"
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#eadfce] bg-[#fbf7f0] px-6 py-10 text-center text-sm text-[#627176]">
                Select a translation to preview the rendered post.
              </div>
            ) }
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
