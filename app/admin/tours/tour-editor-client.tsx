"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminRouteLoadingBoundary, useAdminRouteProgress } from "@/components/admin/AdminRouteProgress";
import { AdminNoticeCard } from "@/components/admin/AdminUi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  getAdminLanguagesClient,
  getAdminTagsClient,
  getAdminTourClient,
} from "@/lib/admin/admin-client";
import { formatBackendErrorMessage } from "@/lib/api/core/backend-error";
import {
  TourEditorHeader,
  type TourSection,
} from "@/components/tour-editor/Header";
import { GeneralSection } from "@/components/tour-editor/GeneralSection";
import { ItinerarySection } from "@/components/tour-editor/ItinerarySection";
import { TranslationsSection } from "@/components/tour-editor/TranslationsSection";
import { PublicationSection } from "@/components/tour-editor/PublicationSection";
import {
  type ApiAdminMediaAssetListResponse,
  buildAttachTourMediaPayload,
  buildCreateTourTranslationPayload,
  buildInitialCreateTourPayload,
  buildPublishTourTranslationPayload,
  buildSetTourCoverMediaPayload,
  buildUpdateTourPayload,
  buildUpdateTourMediaPayload,
  buildUpdateTourTranslationPayload,
  type ApiUploadedMediaAsset,
  createEmptyStopFormState,
  createEmptyTourFormErrors,
  createEmptyTranslationFormState,
  getInitialTourFormState,
  hasTourFormErrors,
  type ApiLanguage,
  type ApiTag,
  type ApiTour,
  type TourFormState,
  type TourMediaItemFormState,
  type TourTranslationFormState,
  validateInitialTourCreateForm,
  validateSharedTourSaveForm,
  validateTranslationForm,
} from "@/lib/tours/admin-tour-form";

type TourEditorClientProps = {
  mode: "create" | "edit";
  initialTour?: ApiTour;
  availableLanguages?: ApiLanguage[];
  availableTags?: ApiTag[];
  accessToken: string;
  backendApiBaseUrl: string;
  tourId?: string;
};

type TourMutationResult =
  | {
  ok: true;
  tour: ApiTour;
}
  | {
  ok: false;
  statusCode: number;
  message: string;
};

type TourFetchResult =
  | {
  ok: true;
  tour: ApiTour;
}
  | {
  ok: false;
  statusCode: number;
  message: string;
};

type MediaLibraryResult =
  | {
  ok: true;
  response: ApiAdminMediaAssetListResponse;
}
  | {
  ok: false;
  statusCode: number;
  message: string;
};

type MediaDeleteResult =
  | {
  ok: true;
}
  | {
  ok: false;
  statusCode: number;
  message: string;
};

type MediaUploadBatchResult = {
  uploaded: ApiUploadedMediaAsset[];
  errors: string[];
};

type MediaPreviewStatus = Record<
  string,
  {
    error: string | null;
    previewUrl: string | null;
  }
>;

type DirtyScope =
  | {
  type: "shared";
}
  | {
  type: "translation";
  languageCode: string;
};

type NavigationIntent =
  | {
  type: "section";
  section: TourSection;
}
  | {
  type: "addTranslation";
  languageCode: string;
}
  | {
  type: "leave";
};

const getActionErrorMessage = ({
                                 message,
                                 statusCode,
                               }: {
  message: string;
  statusCode: number;
}) => `Request failed with status ${ statusCode }: ${ message }`;

const normalizeBackendApiBaseUrl = (backendApiBaseUrl: string) =>
  backendApiBaseUrl.trim().replace(/\/$/, "");

const parseJsonSafely = async (response: Response) => {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
};

const buildAuthHeaders = (accessToken: string, includeJsonContentType = true) => ({
  Authorization: `Bearer ${ accessToken }`,
  ...(includeJsonContentType ? {"content-type": "application/json"} : {}),
});

const mutateTour = async ({
                            accessToken,
                            backendApiBaseUrl,
                            body,
                            method,
                            path,
                          }: {
  accessToken: string;
  backendApiBaseUrl: string;
  body?: unknown;
  method: "POST" | "PATCH";
  path: string;
}): Promise<TourMutationResult> => {
  const normalizedBaseUrl = normalizeBackendApiBaseUrl(backendApiBaseUrl);
  const response = await fetch(`${ normalizedBaseUrl }${ path }`, {
    method,
    headers: buildAuthHeaders(accessToken),
    ...(body === undefined ? {} : {body: JSON.stringify(body)}),
    cache: "no-store",
  });

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    return {
      ok: false,
      statusCode: response.status,
      message: formatBackendErrorMessage(payload, "Backend request failed."),
    };
  }

  if (!payload || typeof payload !== "object") {
    return {
      ok: false,
      statusCode: 500,
      message: "Backend returned an unexpected response.",
    };
  }

  return {
    ok: true,
    tour: payload as ApiTour,
  };
};

const fetchTour = async ({
                           accessToken,
                           backendApiBaseUrl,
                           path,
                         }: {
  accessToken: string;
  backendApiBaseUrl: string;
  path: string;
}): Promise<TourFetchResult> => {
  const normalizedBaseUrl = normalizeBackendApiBaseUrl(backendApiBaseUrl);
  const response = await fetch(`${ normalizedBaseUrl }${ path }`, {
    method: "GET",
    headers: buildAuthHeaders(accessToken, false),
    cache: "no-store",
  });

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    return {
      ok: false,
      statusCode: response.status,
      message: formatBackendErrorMessage(payload, "Backend request failed."),
    };
  }

  if (!payload || typeof payload !== "object") {
    return {
      ok: false,
      statusCode: 500,
      message: "Backend returned an unexpected response.",
    };
  }

  return {
    ok: true,
    tour: payload as ApiTour,
  };
};

const deleteTourTranslation = async ({
                                       accessToken,
                                       backendApiBaseUrl,
                                       path,
                                     }: {
  accessToken: string;
  backendApiBaseUrl: string;
  path: string;
}) => {
  const normalizedBaseUrl = normalizeBackendApiBaseUrl(backendApiBaseUrl);
  const response = await fetch(`${ normalizedBaseUrl }${ path }`, {
    method: "DELETE",
    headers: buildAuthHeaders(accessToken, false),
    cache: "no-store",
  });

  if (response.status === 204) {
    return {
      ok: true as const,
    };
  }

  const payload = await parseJsonSafely(response);
  return {
    ok: false as const,
    statusCode: response.status,
    message: formatBackendErrorMessage(payload, "Backend request failed."),
  };
};

const listMediaAssets = async ({
  accessToken,
  backendApiBaseUrl,
  limit,
  page,
  search,
}: {
  accessToken: string;
  backendApiBaseUrl: string;
  limit: number;
  page: number;
  search: string;
}): Promise<MediaLibraryResult> => {
  const normalizedBaseUrl = normalizeBackendApiBaseUrl(backendApiBaseUrl);
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    mediaType: "image",
  });

  if (search.trim()) {
    query.set("search", search.trim());
  }

  const response = await fetch(`${ normalizedBaseUrl }/api/admin/media?${ query.toString() }`, {
    method: "GET",
    headers: buildAuthHeaders(accessToken, false),
    cache: "no-store",
  });

  const payload = await parseJsonSafely(response);
  if (!response.ok) {
    return {
      ok: false,
      statusCode: response.status,
      message: formatBackendErrorMessage(payload, "Unable to load media assets."),
    };
  }

  if (!payload || typeof payload !== "object") {
    return {
      ok: false,
      statusCode: 500,
      message: "Backend returned an unexpected media library response.",
    };
  }

  return {
    ok: true,
    response: payload as ApiAdminMediaAssetListResponse,
  };
};

const uploadMediaAsset = async ({
  accessToken,
  backendApiBaseUrl,
  file,
  folder,
}: {
  accessToken: string;
  backendApiBaseUrl: string;
  file: File;
  folder: string;
}) => {
  const normalizedBaseUrl = normalizeBackendApiBaseUrl(backendApiBaseUrl);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const response = await fetch(`${ normalizedBaseUrl }/api/admin/media`, {
    method: "POST",
    headers: buildAuthHeaders(accessToken, false),
    body: formData,
    cache: "no-store",
  });

  const payload = await parseJsonSafely(response);
  if (!response.ok) {
    return {
      ok: false as const,
      statusCode: response.status,
      message: formatBackendErrorMessage(payload, "Unable to upload the selected image."),
    };
  }

  if (!payload || typeof payload !== "object") {
    return {
      ok: false as const,
      statusCode: 500,
      message: "Backend returned an unexpected upload response.",
    };
  }

  return {
    ok: true as const,
    media: payload as ApiUploadedMediaAsset,
  };
};

const deleteMediaAsset = async ({
  accessToken,
  backendApiBaseUrl,
  mediaId,
}: {
  accessToken: string;
  backendApiBaseUrl: string;
  mediaId: string;
}): Promise<MediaDeleteResult> => {
  const normalizedBaseUrl = normalizeBackendApiBaseUrl(backendApiBaseUrl);
  const response = await fetch(`${ normalizedBaseUrl }/api/admin/media/${ mediaId }`, {
    method: "DELETE",
    headers: buildAuthHeaders(accessToken, false),
    cache: "no-store",
  });

  if (response.status === 204) {
    return {
      ok: true,
    };
  }

  const payload = await parseJsonSafely(response);
  return {
    ok: false,
    statusCode: response.status,
    message: formatBackendErrorMessage(payload, "Unable to delete the uploaded image."),
  };
};

const detachTourMedia = async ({
                                 accessToken,
                                 backendApiBaseUrl,
                                 mediaId,
                                 tourId,
                               }: {
  accessToken: string;
  backendApiBaseUrl: string;
  mediaId: string;
  tourId: string;
}) => {
  const normalizedBaseUrl = normalizeBackendApiBaseUrl(backendApiBaseUrl);
  const response = await fetch(`${ normalizedBaseUrl }/api/admin/tours/${ tourId }/media/${ mediaId }`, {
    method: "DELETE",
    headers: buildAuthHeaders(accessToken, false),
    cache: "no-store",
  });

  if (response.status === 204) {
    return {
      ok: true as const,
    };
  }

  const payload = await parseJsonSafely(response);
  return {
    ok: false as const,
    statusCode: response.status,
    message: formatBackendErrorMessage(payload, "Unable to detach the selected image."),
  };
};

const getNextActiveTranslationLanguageCode = ({
                                                currentLanguageCode,
                                                nextFormState,
                                                preferredLanguageCode,
                                              }: {
  currentLanguageCode: string | null;
  nextFormState: TourFormState;
  preferredLanguageCode?: string | null;
}) => {
  const preferredCode = preferredLanguageCode ?? currentLanguageCode;
  if (
    preferredCode &&
    nextFormState.translations.some((translation) => translation.languageCode === preferredCode)
  ) {
    return preferredCode;
  }

  return nextFormState.translations[0]?.languageCode ?? null;
};

export function TourEditorClient({
                                   mode,
                                   initialTour,
                                   availableLanguages: initialLanguages = [],
                                   availableTags: initialTags = [],
                                 accessToken,
                                 backendApiBaseUrl,
                                 tourId,
                               }: TourEditorClientProps) {
  const router = useRouter();
  const { startNavigation } = useAdminRouteProgress();
  const [availableLanguages, setAvailableLanguages] = useState<ApiLanguage[]>(initialLanguages);
  const [availableTags, setAvailableTags] = useState<ApiTag[]>(initialTags);
  const [isInitialLoading, setIsInitialLoading] = useState(
    initialLanguages.length === 0 && initialTags.length === 0 && (!initialTour || mode === "edit"),
  );
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<TourSection>("general");
  const [activeTranslationLanguageCode, setActiveTranslationLanguageCode] = useState<string | null>(
    initialTour ? getInitialTourFormState(initialTour).translations[0]?.languageCode ?? null : null,
  );
  const [savedTour, setSavedTour] = useState<ApiTour | undefined>(initialTour);
  const [formState, setFormState] = useState<TourFormState>(() => getInitialTourFormState(initialTour));
  const [validationErrors, setValidationErrors] = useState(createEmptyTourFormErrors());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(
    initialTour?.audit.updatedAt ? new Date(initialTour.audit.updatedAt) : null,
  );
  const [dirtyScope, setDirtyScope] = useState<DirtyScope | null>(null);
  const [pendingNavigation, setPendingNavigation] = useState<NavigationIntent | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [isMediaMutating, setIsMediaMutating] = useState(false);
  const [mediaPreviewStatus, setMediaPreviewStatus] = useState<MediaPreviewStatus>({});
  const [savingTranslationLanguageCode, setSavingTranslationLanguageCode] = useState<string | null>(null);
  const sessionUploadedMediaIdsRef = useRef<Set<string>>(new Set());
  const mediaPreviewObjectUrlsRef = useRef<Map<string, string>>(new Map());
  const loadingMediaPreviewIdsRef = useRef<Set<string>>(new Set());
  const isCreated = mode === "edit" || Boolean(savedTour?.id ?? initialTour?.id);
  const canSaveInitialTour = formState.name.trim().length > 0;
  const diagnostics = savedTour?.translationAvailability ?? initialTour?.translationAvailability ?? [];
  const getLanguageName = (languageCode: string) => availableLanguages.find((lang) => lang.code === languageCode)?.name;

  useAdminRouteLoadingBoundary(isInitialLoading);

  useEffect(() => {
    if (
      initialLanguages.length > 0 &&
      initialTags.length > 0 &&
      (mode !== "edit" || initialTour)
    ) {
      setIsInitialLoading(false);
      return;
    }

    void (async () => {
      setIsInitialLoading(true);
      setInitialLoadError(null);

      try {
        const [languages, tags, tour] = await Promise.all([
          getAdminLanguagesClient(),
          getAdminTagsClient(),
          mode === "edit" && tourId ? getAdminTourClient(tourId) : Promise.resolve(null),
        ]);

        setAvailableLanguages(languages);
        setAvailableTags(tags);

        if (mode === "edit") {
          if (!tour) {
            setInitialLoadError("The requested tour could not be found.");
            return;
          }

          const nextFormState = getInitialTourFormState(tour);
          setSavedTour(tour);
          setFormState(nextFormState);
          setActiveTranslationLanguageCode(nextFormState.translations[0]?.languageCode ?? null);
          setLastSaved(tour.audit.updatedAt ? new Date(tour.audit.updatedAt) : null);
        }
      } catch (error) {
        setInitialLoadError(error instanceof Error ? error.message : "Unable to load the tour editor.");
      } finally {
        setIsInitialLoading(false);
      }
    })();
  }, [initialLanguages.length, initialTags.length, initialTour, mode, tourId]);

  useEffect(() => {
    if (!dirtyScope) {
      return undefined;
    }

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirtyScope]);

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

  const clearFeedback = () => {
    setSubmitError(null);
    setSuccessMessage(null);
  };

  const getSavedSnapshot = () => getInitialTourFormState(savedTour ?? initialTour);

  const syncWithSavedTour = ({
                               preferredLanguageCode,
                               tour,
                             }: {
    preferredLanguageCode?: string | null;
    tour: ApiTour;
  }) => {
    const nextFormState = getInitialTourFormState(tour);

    setSavedTour(tour);
    setFormState(nextFormState);
    setDirtyScope(null);
    setLastSaved(new Date(tour.audit.updatedAt));
    setActiveTranslationLanguageCode((currentLanguageCode) =>
      getNextActiveTranslationLanguageCode({
        currentLanguageCode,
        nextFormState,
        preferredLanguageCode,
      }),
    );
  };

  const discardDirtyScope = () => {
    const nextFormState = getSavedSnapshot();

    setFormState(nextFormState);
    setValidationErrors(createEmptyTourFormErrors());
    setDirtyScope(null);
    clearFeedback();
    setActiveTranslationLanguageCode((currentLanguageCode) =>
      getNextActiveTranslationLanguageCode({
        currentLanguageCode,
        nextFormState,
      }),
    );
  };

  const markSharedDirty = () => {
    setDirtyScope({type: "shared"});
    clearFeedback();
  };

  const markTranslationDirty = (languageCode: string) => {
    setDirtyScope({type: "translation", languageCode});
    clearFeedback();
  };

  const updateFormState = <K extends keyof TourFormState>(key: K, value: TourFormState[K]) => {
    markSharedDirty();
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const loadMediaLibrary = async ({
    limit,
    page,
    search,
  }: {
    limit: number;
    page: number;
    search: string;
  }) =>
    listMediaAssets({
      accessToken,
      backendApiBaseUrl,
      limit,
      page,
      search,
    });

  const uploadMediaFiles = async (files: File[]): Promise<MediaUploadBatchResult> => {
    const tourId = savedTour?.id ?? initialTour?.id;
    if (!tourId) {
      return {
        uploaded: [],
        errors: ["Create the tour before uploading images."],
      };
    }

    const uploaded: ApiUploadedMediaAsset[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const result = await uploadMediaAsset({
        accessToken,
        backendApiBaseUrl,
        file,
        folder: `tours/${ tourId }`,
      });

      if (!result.ok) {
        errors.push(`${ file.name }: ${ result.message }`);
        continue;
      }

      uploaded.push(result.media);
      sessionUploadedMediaIdsRef.current.add(result.media.id);
    }

    return {
      uploaded,
      errors,
    };
  };

  const attachMediaItems = async (mediaIds: string[]) => {
    if (blockDirtyMediaMutation()) {
      return false;
    }

    const tourId = savedTour?.id ?? initialTour?.id;
    if (!tourId || mediaIds.length === 0) {
      return false;
    }

    clearFeedback();
    setIsMediaMutating(true);

    try {
      let latestTour = savedTour ?? initialTour;
      const attachedMediaIds = new Set(formState.mediaItems.map((item) => item.mediaId));
      let nextOrderIndex = formState.mediaItems.length;

      for (const mediaId of mediaIds) {
        if (attachedMediaIds.has(mediaId)) {
          continue;
        }

        const result = await mutateTour({
          accessToken,
          backendApiBaseUrl,
          method: "POST",
          path: `/api/admin/tours/${ tourId }/media`,
          body: buildAttachTourMediaPayload({
            mediaId,
            orderIndex: nextOrderIndex,
          }),
        });

        if (!result.ok) {
          setSubmitError(
            getActionErrorMessage({
              message: result.message,
              statusCode: result.statusCode,
            }),
          );
          return false;
        }

        latestTour = result.tour;
        attachedMediaIds.add(mediaId);
        nextOrderIndex += 1;
      }

      if (latestTour) {
        syncWithSavedTour({
          preferredLanguageCode: activeTranslationLanguageCode,
          tour: latestTour,
        });
      }

      setSuccessMessage("Images attached.");
      return true;
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : "Unable to attach the selected images.",
      );
      return false;
    } finally {
      setIsMediaMutating(false);
    }
  };

  const setCoverMedia = async (mediaId: string) => {
    if (blockDirtyMediaMutation()) {
      return false;
    }

    const tourId = savedTour?.id ?? initialTour?.id;
    if (!tourId) {
      return false;
    }

    clearFeedback();
    setIsMediaMutating(true);

    try {
      const result = await mutateTour({
        accessToken,
        backendApiBaseUrl,
        method: "POST",
        path: `/api/admin/tours/${ tourId }/cover-media`,
        body: buildSetTourCoverMediaPayload(mediaId),
      });

      if (!result.ok) {
        setSubmitError(
          getActionErrorMessage({
            message: result.message,
            statusCode: result.statusCode,
          }),
        );
        return false;
      }

      syncWithSavedTour({
        preferredLanguageCode: activeTranslationLanguageCode,
        tour: result.tour,
      });
      setSuccessMessage("Cover image updated.");
      return true;
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message ? error.message : "Unable to update the cover image.",
      );
      return false;
    } finally {
      setIsMediaMutating(false);
    }
  };

  const reorderMediaItems = async (mediaItems: TourMediaItemFormState[]) => {
    if (blockDirtyMediaMutation()) {
      return false;
    }

    const tourId = savedTour?.id ?? initialTour?.id;
    if (!tourId) {
      return false;
    }

    clearFeedback();
    setIsMediaMutating(true);

    try {
      let latestTour = savedTour ?? initialTour;

      for (const [index, mediaItem] of mediaItems.entries()) {
        const result = await mutateTour({
          accessToken,
          backendApiBaseUrl,
          method: "PATCH",
          path: `/api/admin/tours/${ tourId }/media/${ mediaItem.mediaId }`,
          body: buildUpdateTourMediaPayload({
            orderIndex: index,
          }),
        });

        if (!result.ok) {
          await refreshTourSnapshot({
            preferredLanguageCode: activeTranslationLanguageCode,
            tourId,
          });
          setSubmitError(
            getActionErrorMessage({
              message: result.message,
              statusCode: result.statusCode,
            }),
          );
          return false;
        }

        latestTour = result.tour;
      }

      if (latestTour) {
        syncWithSavedTour({
          preferredLanguageCode: activeTranslationLanguageCode,
          tour: latestTour,
        });
      }

      setSuccessMessage("Image order updated.");
      return true;
    } catch (error) {
      await refreshTourSnapshot({
        preferredLanguageCode: activeTranslationLanguageCode,
        tourId,
      });
      setSubmitError(
        error instanceof Error && error.message ? error.message : "Unable to update the image order.",
      );
      return false;
    } finally {
      setIsMediaMutating(false);
    }
  };

  const updateMediaAltTexts = async ({
    altTexts,
    mediaId,
  }: {
    altTexts: Record<string, string>;
    mediaId: string;
  }) => {
    if (blockDirtyMediaMutation()) {
      return false;
    }

    const tourId = savedTour?.id ?? initialTour?.id;
    if (!tourId) {
      return false;
    }

    clearFeedback();
    setIsMediaMutating(true);

    try {
      const result = await mutateTour({
        accessToken,
        backendApiBaseUrl,
        method: "PATCH",
        path: `/api/admin/tours/${ tourId }/media/${ mediaId }`,
        body: buildUpdateTourMediaPayload({
          altTexts,
        }),
      });

      if (!result.ok) {
        await refreshTourSnapshot({
          preferredLanguageCode: activeTranslationLanguageCode,
          tourId,
        });
        setSubmitError(
          getActionErrorMessage({
            message: result.message,
            statusCode: result.statusCode,
          }),
        );
        return false;
      }

      syncWithSavedTour({
        preferredLanguageCode: activeTranslationLanguageCode,
        tour: result.tour,
      });
      setSuccessMessage("Image details saved.");
      return true;
    } catch (error) {
      await refreshTourSnapshot({
        preferredLanguageCode: activeTranslationLanguageCode,
        tourId,
      });
      setSubmitError(
        error instanceof Error && error.message ? error.message : "Unable to update the image details.",
      );
      return false;
    } finally {
      setIsMediaMutating(false);
    }
  };

  const removeMediaItem = async (mediaId: string) => {
    if (blockDirtyMediaMutation()) {
      return false;
    }

    const tourId = savedTour?.id ?? initialTour?.id;
    if (!tourId) {
      return false;
    }

    clearFeedback();
    setIsMediaMutating(true);

    try {
      const result = await detachTourMedia({
        accessToken,
        backendApiBaseUrl,
        mediaId,
        tourId,
      });

      if (!result.ok) {
        setSubmitError(
          getActionErrorMessage({
            message: result.message,
            statusCode: result.statusCode,
          }),
        );
        return false;
      }

      const refreshedTour = await refreshTourSnapshot({
        preferredLanguageCode: activeTranslationLanguageCode,
        tourId,
      });

      if (!refreshedTour) {
        return false;
      }

      await deleteSessionUploadedMediaIfOrphaned(mediaId);
      setSuccessMessage("Image removed.");
      return true;
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message ? error.message : "Unable to remove the selected image.",
      );
      return false;
    } finally {
      setIsMediaMutating(false);
    }
  };

  const refreshTourSnapshot = async ({
    preferredLanguageCode,
    tourId,
  }: {
    preferredLanguageCode?: string | null;
    tourId: string;
  }) => {
    const refreshedTour = await fetchTour({
      accessToken,
      backendApiBaseUrl,
      path: `/api/admin/tours/${ tourId }`,
    });

    if (!refreshedTour.ok) {
      setSubmitError(
        getActionErrorMessage({
          message: refreshedTour.message,
          statusCode: refreshedTour.statusCode,
        }),
      );
      return null;
    }

    syncWithSavedTour({
      preferredLanguageCode,
      tour: refreshedTour.tour,
    });
    return refreshedTour.tour;
  };

  const ensureMediaPreview = async ({
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
  };

  const deleteSessionUploadedMediaIfOrphaned = async (mediaId: string) => {
    if (!sessionUploadedMediaIdsRef.current.has(mediaId)) {
      return;
    }

    const result = await deleteMediaAsset({
      accessToken,
      backendApiBaseUrl,
      mediaId,
    });

    if (result.ok) {
      sessionUploadedMediaIdsRef.current.delete(mediaId);
    }
  };

  const blockDirtyMediaMutation = () => {
    if (!dirtyScope) {
      return false;
    }

    setSubmitError("Save or discard tour changes before editing media.");
    return true;
  };

  const setTranslationField = ({
                                 languageCode,
                                 updater,
                               }: {
    languageCode: string;
    updater: (translation: TourTranslationFormState) => TourTranslationFormState;
  }) => {
    markTranslationDirty(languageCode);
    setFormState((current) => ({
      ...current,
      translations: current.translations.map((translation) =>
        translation.languageCode === languageCode ? updater(translation) : translation,
      ),
    }));
  };

  const updateStopField = ({
                             clientId,
                             field,
                             value,
                           }: {
    clientId: string;
    field: keyof TourFormState["stops"][number];
    value: string;
  }) => {
    markSharedDirty();
    setFormState((current) => {
      let previousStopId = "";
      let nextStopId = "";

      const nextStops = current.stops.map((stop) => {
        if (stop.clientId !== clientId) {
          return stop;
        }

        previousStopId = stop.id.trim();
        nextStopId = field === "id" ? value.trim() : previousStopId;

        return {
          ...stop,
          [field]: value,
        };
      });

      if (field !== "id" || previousStopId === nextStopId) {
        return {
          ...current,
          stops: nextStops,
        };
      }

      return {
        ...current,
        stops: nextStops,
        translations: current.translations.map((translation) => {
          if (!previousStopId) {
            return translation;
          }

          const currentStopContent = translation.stopContent[previousStopId];
          if (!currentStopContent) {
            return translation;
          }

          const nextStopContent = {
            ...translation.stopContent,
          };

          delete nextStopContent[previousStopId];
          if (nextStopId) {
            nextStopContent[nextStopId] = currentStopContent;
          }

          return {
            ...translation,
            stopContent: nextStopContent,
          };
        }),
      };
    });
  };

  const addStop = () => {
    markSharedDirty();
    setFormState((current) => ({
      ...current,
      stops: [...current.stops, createEmptyStopFormState()],
    }));
  };

  const removeStop = (clientId: string) => {
    markSharedDirty();
    setFormState((current) => {
      const removedStop = current.stops.find((stop) => stop.clientId === clientId);
      const nextStops = current.stops.filter((stop) => stop.clientId !== clientId);

      if (!removedStop?.id.trim()) {
        return {
          ...current,
          stops: nextStops,
        };
      }

      const removedStopId = removedStop.id.trim();
      return {
        ...current,
        stops: nextStops,
        translations: current.translations.map((translation) => {
          const nextStopContent = {
            ...translation.stopContent,
          };
          delete nextStopContent[removedStopId];

          return {
            ...translation,
            stopContent: nextStopContent,
          };
        }),
      };
    });
  };

  const moveStop = ({
                      clientId,
                      direction,
                    }: {
    clientId: string;
    direction: "up" | "down";
  }) => {
    markSharedDirty();
    setFormState((current) => {
      const index = current.stops.findIndex((stop) => stop.clientId === clientId);
      if (index === -1) {
        return current;
      }

      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= current.stops.length) {
        return current;
      }

      const nextStops = [...current.stops];
      [nextStops[index], nextStops[nextIndex]] = [nextStops[nextIndex], nextStops[index]];

      return {
        ...current,
        stops: nextStops,
      };
    });
  };

  const addTranslationNow = (languageCode: string) => {
    markTranslationDirty(languageCode);
    setFormState((current) => ({
      ...current,
      translations: [...current.translations, createEmptyTranslationFormState(languageCode)],
    }));
    setActiveTranslationLanguageCode(languageCode);
    setActiveSection("translations");
  };

  const removeTranslationNow = (languageCode: string) => {
    const translation = formState.translations.find((item) => item.languageCode === languageCode);
    if (!translation) {
      return;
    }

    if (!translation.existing) {
      markTranslationDirty(languageCode);
      const nextTranslations = formState.translations.filter(
        (item) => item.languageCode !== languageCode,
      );
      const nextFormState = {
        ...formState,
        translations: nextTranslations,
      };

      setFormState(nextFormState);
      setActiveTranslationLanguageCode(
        getNextActiveTranslationLanguageCode({
          currentLanguageCode: activeTranslationLanguageCode,
          nextFormState,
          preferredLanguageCode:
            activeTranslationLanguageCode === languageCode
              ? nextTranslations[0]?.languageCode ?? null
              : activeTranslationLanguageCode,
        }),
      );

      if (dirtyScope?.type === "translation" && dirtyScope.languageCode === languageCode) {
        setDirtyScope(null);
      }
      clearFeedback();
      return;
    }

    if (
      dirtyScope?.type === "translation" &&
      dirtyScope.languageCode !== languageCode
    ) {
      setSubmitError("Save or discard the current translation changes before deleting another translation.");
      return;
    }

    const tourId = savedTour?.id ?? initialTour?.id;
    if (!tourId) {
      setSubmitError("The tour editor is missing the current tour.");
      return;
    }

    clearFeedback();
    setIsMutating(true);
    setSavingTranslationLanguageCode(languageCode);

    void (async () => {
      try {
        const deleteResult = await deleteTourTranslation({
          accessToken,
          backendApiBaseUrl,
          path: `/api/admin/tours/${ tourId }/translations/${ languageCode }`,
        });

        if (!deleteResult.ok) {
          setSubmitError(
            getActionErrorMessage({
              message: deleteResult.message,
              statusCode: deleteResult.statusCode,
            }),
          );
          return;
        }

        const refreshedTour = await fetchTour({
          accessToken,
          backendApiBaseUrl,
          path: `/api/admin/tours/${ tourId }`,
        });

        if (!refreshedTour.ok) {
          setSubmitError(
            getActionErrorMessage({
              message: refreshedTour.message,
              statusCode: refreshedTour.statusCode,
            }),
          );
          return;
        }

        syncWithSavedTour({
          preferredLanguageCode:
            activeTranslationLanguageCode === languageCode ? null : activeTranslationLanguageCode,
          tour: refreshedTour.tour,
        });
        setSuccessMessage(`${ getLanguageName(languageCode) } translation deleted.`);
      } catch (error) {
        setSubmitError(
          error instanceof Error && error.message
            ? error.message
            : `Unable to delete the ${ getLanguageName(languageCode) } translation.`,
        );
      } finally {
        setSavingTranslationLanguageCode(null);
        setIsMutating(false);
      }
    })();
  };

  const updateStopContent = ({
                               languageCode,
                               stopId,
                               field,
                               value,
                             }: {
    languageCode: string;
    stopId: string;
    field: "title" | "description";
    value: string;
  }) => {
    if (!stopId) {
      return;
    }

    setTranslationField({
      languageCode,
      updater: (translation) => ({
        ...translation,
        stopContent: {
          ...translation.stopContent,
          [stopId]: {
            title: translation.stopContent[stopId]?.title ?? "",
            description: translation.stopContent[stopId]?.description ?? "",
            [field]: value,
          },
        },
      }),
    });
  };

  const saveSharedTour = async ({
                                  redirectAfterCreate = true,
                                }: {
    redirectAfterCreate?: boolean;
  } = {}) => {
    if (!isCreated) {
      const nextErrors = validateInitialTourCreateForm({
        formState,
      });

      if (hasTourFormErrors(nextErrors)) {
        setValidationErrors(nextErrors);
        clearFeedback();
        return false;
      }
    } else {
      const nextErrors = validateSharedTourSaveForm({
        formState,
      });

      if (hasTourFormErrors(nextErrors)) {
        setValidationErrors(nextErrors);
        clearFeedback();
        return false;
      }
    }

    setValidationErrors(createEmptyTourFormErrors());
    clearFeedback();
    setIsMutating(true);

    try {
      if (!isCreated) {
        const createResult = await mutateTour({
          accessToken,
          backendApiBaseUrl,
          body: buildInitialCreateTourPayload({formState}),
          method: "POST",
          path: "/api/admin/tours",
        });

        if (!createResult.ok) {
          setSubmitError(
            getActionErrorMessage({
              message: createResult.message,
              statusCode: createResult.statusCode,
            }),
          );
          return false;
        }

        syncWithSavedTour({
          tour: createResult.tour,
        });
        setSuccessMessage(redirectAfterCreate ? "Tour created. Redirecting to the editor." : "Tour created.");

        if (redirectAfterCreate) {
          startNavigation();
          router.replace(`/tours/${ createResult.tour.id }`);
          router.refresh();
        }

        return true;
      }

      const tourId = savedTour?.id ?? initialTour?.id;
      if (!tourId) {
        setSubmitError("The tour editor is missing the current tour.");
        return false;
      }

      const updateResult = await mutateTour({
        accessToken,
        backendApiBaseUrl,
        body: buildUpdateTourPayload({formState}),
        method: "PATCH",
        path: `/api/admin/tours/${ tourId }`,
      });
      if (!updateResult.ok) {
        setSubmitError(
          getActionErrorMessage({
            message: updateResult.message,
            statusCode: updateResult.statusCode,
          }),
        );
        return false;
      }

      syncWithSavedTour({
        preferredLanguageCode: activeTranslationLanguageCode,
        tour: updateResult.tour,
      });
      setSuccessMessage("Tour saved.");
      return true;
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : mode === "create"
            ? "Unable to create the tour."
            : "Unable to update the tour.",
      );
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  const saveTranslation = async (languageCode: string) => {
    const translation = formState.translations.find((item) => item.languageCode === languageCode);
    if (!translation) {
      setSubmitError(`Missing translation for ${ getLanguageName(languageCode) }.`);
      return false;
    }

    const tourId = savedTour?.id ?? initialTour?.id;
    if (!tourId) {
      setSubmitError("Create the tour before saving translations.");
      return false;
    }

    const nextErrors = validateTranslationForm({
      formState,
      languageCode,
    });
    if (hasTourFormErrors(nextErrors)) {
      setValidationErrors(nextErrors);
      clearFeedback();
      return false;
    }

    setValidationErrors(createEmptyTourFormErrors());
    clearFeedback();
    setIsMutating(true);
    setSavingTranslationLanguageCode(languageCode);

    try {
      const result = await mutateTour({
        accessToken,
        backendApiBaseUrl,
        method: translation.existing ? "PATCH" : "POST",
        path: translation.existing
          ? `/api/admin/tours/${ tourId }/translations/${ translation.languageCode }`
          : `/api/admin/tours/${ tourId }/translations`,
        body: translation.existing
          ? buildUpdateTourTranslationPayload({
            formState,
            translation,
          })
          : buildCreateTourTranslationPayload({
            formState,
            translation,
          }),
      });

      if (!result.ok) {
        setSubmitError(
          getActionErrorMessage({
            message: result.message,
            statusCode: result.statusCode,
          }),
        );
        return false;
      }

      syncWithSavedTour({
        preferredLanguageCode: languageCode,
        tour: result.tour,
      });
      setSuccessMessage(`${ getLanguageName(languageCode) } translation saved.`);
      return true;
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : `Unable to save the ${ languageCode } translation.`,
      );
      return false;
    } finally {
      setSavingTranslationLanguageCode(null);
      setIsMutating(false);
    }
  };

  const executeNavigation = (action: NavigationIntent) => {
    switch (action.type) {
      case "section":
        if (!isCreated && action.section !== "general") {
          return;
        }

        if (
          action.section === "translations" &&
          !activeTranslationLanguageCode &&
          formState.translations.length > 0
        ) {
          setActiveTranslationLanguageCode(formState.translations[0].languageCode);
        }

        setActiveSection(action.section);
        return;
      case "addTranslation":
        addTranslationNow(action.languageCode);
        return;
      case "leave":
        startNavigation();
        router.push("/tours");
    }
  };

  const requestNavigation = (action: NavigationIntent) => {
    if (isMutating || isMediaMutating) {
      return;
    }

    if (action.type === "section" && action.section === activeSection) {
      return;
    }

    if (dirtyScope) {
      setPendingNavigation(action);
      return;
    }

    executeNavigation(action);
  };

  const publishTranslation = async ({
                                      languageCode,
                                    }: {
    languageCode: string;
  }) => {
    if (dirtyScope) {
      setSubmitError("Save or discard changes before publishing translations.");
      return;
    }

    const tourId = savedTour?.id ?? initialTour?.id;
    if (!tourId) {
      setSubmitError("The tour editor is missing the current tour.");
      return;
    }

    const translation = formState.translations.find((item) => item.languageCode === languageCode);
    if (!translation) {
      setSubmitError(`Missing translation for ${ getLanguageName(languageCode) }.`);
      return;
    }

    clearFeedback();
    setIsMutating(true);

    try {
      const result = await mutateTour({
        accessToken,
        backendApiBaseUrl,
        method: "POST",
        path: `/api/admin/tours/${ tourId }/translations/${ languageCode }/publish`,
        body: buildPublishTourTranslationPayload({translation}),
      });

      if (!result.ok) {
        setSubmitError(
          getActionErrorMessage({
            message: result.message,
            statusCode: result.statusCode,
          }),
        );
        return;
      }

      syncWithSavedTour({
        preferredLanguageCode: languageCode,
        tour: result.tour,
      });
      setSuccessMessage(`${ languageCode } published.`);
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : `Unable to publish the ${ languageCode } translation.`,
      );
    } finally {
      setIsMutating(false);
    }
  };

  const unpublishTranslation = async ({
                                        languageCode,
                                      }: {
    languageCode: string;
  }) => {
    if (dirtyScope) {
      setSubmitError("Save or discard changes before publishing translations.");
      return;
    }

    const tourId = savedTour?.id ?? initialTour?.id;
    if (!tourId) {
      setSubmitError("The tour editor is missing the current tour.");
      return;
    }

    clearFeedback();
    setIsMutating(true);

    try {
      const result = await mutateTour({
        accessToken,
        backendApiBaseUrl,
        method: "POST",
        path: `/api/admin/tours/${ tourId }/translations/${ languageCode }/unpublish`,
      });

      if (!result.ok) {
        setSubmitError(
          getActionErrorMessage({
            message: result.message,
            statusCode: result.statusCode,
          }),
        );
        return;
      }

      syncWithSavedTour({
        preferredLanguageCode: languageCode,
        tour: result.tour,
      });
      setSuccessMessage(`${ languageCode } unpublished.`);
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : `Unable to unpublish the ${ languageCode } translation.`,
      );
    } finally {
      setIsMutating(false);
    }
  };

  const publishAllReady = async () => {
    if (dirtyScope) {
      setSubmitError("Save or discard changes before publishing translations.");
      return;
    }

    const readyTranslations = formState.translations.filter(
      (translation) => translation.isReady && !translation.isPublished,
    );
    if (readyTranslations.length === 0) {
      return;
    }

    const tourId = savedTour?.id ?? initialTour?.id;
    if (!tourId) {
      setSubmitError("The tour editor is missing the current tour.");
      return;
    }

    clearFeedback();
    setIsMutating(true);

    try {
      let latestTour = savedTour ?? initialTour;

      for (const translation of readyTranslations) {
        const result = await mutateTour({
          accessToken,
          backendApiBaseUrl,
          method: "POST",
          path: `/api/admin/tours/${ tourId }/translations/${ translation.languageCode }/publish`,
          body: buildPublishTourTranslationPayload({translation}),
        });

        if (!result.ok) {
          setSubmitError(
            getActionErrorMessage({
              message: result.message,
              statusCode: result.statusCode,
            }),
          );
          return;
        }

        latestTour = result.tour;
      }

      if (latestTour) {
        syncWithSavedTour({
          preferredLanguageCode: activeTranslationLanguageCode,
          tour: latestTour,
        });
      }
      setSuccessMessage("Ready translations published.");
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : "Unable to publish the ready translations.",
      );
    } finally {
      setIsMutating(false);
    }
  };

  const unpublishAll = async () => {
    if (dirtyScope) {
      setSubmitError("Save or discard changes before publishing translations.");
      return;
    }

    const publishedTranslations = formState.translations.filter((translation) => translation.isPublished);
    if (publishedTranslations.length === 0) {
      return;
    }

    const tourId = savedTour?.id ?? initialTour?.id;
    if (!tourId) {
      setSubmitError("The tour editor is missing the current tour.");
      return;
    }

    clearFeedback();
    setIsMutating(true);

    try {
      let latestTour = savedTour ?? initialTour;

      for (const translation of publishedTranslations) {
        const result = await mutateTour({
          accessToken,
          backendApiBaseUrl,
          method: "POST",
          path: `/api/admin/tours/${ tourId }/translations/${ translation.languageCode }/unpublish`,
        });

        if (!result.ok) {
          setSubmitError(
            getActionErrorMessage({
              message: result.message,
              statusCode: result.statusCode,
            }),
          );
          return;
        }

        latestTour = result.tour;
      }

      if (latestTour) {
        syncWithSavedTour({
          preferredLanguageCode: activeTranslationLanguageCode,
          tour: latestTour,
        });
      }
      setSuccessMessage("Translations unpublished.");
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : "Unable to unpublish the translations.",
      );
    } finally {
      setIsMutating(false);
    }
  };

  const handleSaveAndContinue = async () => {
    if (!pendingNavigation || !dirtyScope) {
      setPendingNavigation(null);
      return;
    }

    const nextAction = pendingNavigation;
    let didSave = false;

    if (dirtyScope.type === "shared") {
      didSave = await saveSharedTour({redirectAfterCreate: false});
    } else {
      didSave = await saveTranslation(dirtyScope.languageCode);
    }

    if (!didSave) {
      setPendingNavigation(null);
      return;
    }

    setPendingNavigation(null);
    executeNavigation(nextAction);
  };

  const handleDiscardAndContinue = () => {
    const nextAction = pendingNavigation;
    discardDirtyScope();
    setPendingNavigation(null);

    if (nextAction) {
      executeNavigation(nextAction);
    }
  };

  const handlePrimarySave = async () => {
    await saveSharedTour();
  };

  const visibleErrors =
    activeSection === "general"
      ? validationErrors.shared
      : activeSection === "itinerary"
        ? validationErrors.itinerary
        : activeSection === "translations"
          ? Object.entries(validationErrors.translations).flatMap(([languageCode, messages]) =>
            messages.map((message) => `${ languageCode }: ${ message }`),
          )
          : [];

  const primaryAction =
    !isCreated
      ? {
        disabled: !canSaveInitialTour,
        label: "Create Tour",
        onClick: () => {
          void handlePrimarySave();
        },
      }
      : activeSection === "general" || activeSection === "itinerary"
        ? {
          disabled: false,
          label: "Save Tour",
          onClick: () => {
            void handlePrimarySave();
          },
        }
        : null;

  if (isInitialLoading) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title={mode === "edit" ? "Loading the tour editor." : "Loading the new tour workspace."}
        description="Resolving tags, languages, and tour content."
      />
    );
  }

  if (initialLoadError) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title={mode === "edit" ? "The tour editor could not be loaded." : "The new tour workspace could not be loaded."}
        description={initialLoadError}
      />
    );
  }

  return (
    <>
      <div className="flex min-h-screen flex-col bg-transparent">
        <TourEditorHeader
          mode={ mode }
          formState={ formState }
          onBackAction={ () => requestNavigation({type: "leave"}) }
          isMutating={ isMutating || isMediaMutating }
          lastSaved={ lastSaved }
          activeSection={ activeSection }
          isCreated={ isCreated }
          primaryAction={ primaryAction }
          onSectionChangeAction={ (section) => requestNavigation({type: "section", section}) }
        />

        <main className="flex-1 overflow-auto px-2 py-6 sm:px-4">
          <div className="mx-auto max-w-5xl space-y-6">
            { submitError ? (
              <div
                className="rounded-[1.25rem] border border-[#e8c7c1] bg-[#fbf2f0] px-4 py-3 text-sm text-[#a3483f] shadow-[0_10px_24px_rgba(163,72,63,0.08)]">
                { submitError }
              </div>
            ) : null }

            { successMessage ? (
              <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-[0_10px_24px_rgba(47,111,69,0.08)]">
                { successMessage }
              </div>
            ) : null }

            { visibleErrors.length > 0 ? (
              <div className="rounded-[1.25rem] border border-[#e8c7c1] bg-[#fbf2f0] px-4 py-3 shadow-[0_10px_24px_rgba(163,72,63,0.08)]">
                <p className="text-sm font-medium text-[#a3483f]">
                  Fix the following issues before saving:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#a3483f]">
                  { visibleErrors.map((message) => (
                    <li key={ message }>{ message }</li>
                  )) }
                </ul>
              </div>
            ) : null }

            { activeSection === "general" ? (
              <GeneralSection
                formState={ formState }
                isCreated={ isCreated }
                isMutating={ isMutating || isMediaMutating }
                updateFormStateAction={ updateFormState }
                loadMediaLibraryAction={ loadMediaLibrary }
                uploadMediaFilesAction={ uploadMediaFiles }
                attachMediaItemsAction={ attachMediaItems }
                removeMediaItemAction={ removeMediaItem }
                reorderMediaItemsAction={ reorderMediaItems }
                setCoverMediaAction={ setCoverMedia }
                updateMediaAltTextsAction={ updateMediaAltTexts }
                ensureMediaPreviewAction={ ensureMediaPreview }
                mediaPreviewStatus={ mediaPreviewStatus }
                availableTags={ availableTags }
                availableLanguages={ availableLanguages }
              />
            ) : null }

            { activeSection === "itinerary" ? (
              <ItinerarySection
                formState={ formState }
                updateFormStateAction={ updateFormState }
                onAddStopAction={ addStop }
                onRemoveStopAction={ removeStop }
                onMoveStopAction={ moveStop }
                onUpdateStopAction={ updateStopField }
              />
            ) : null }

            { activeSection === "translations" ? (
              <TranslationsSection
                formState={ formState }
                availableLanguages={ availableLanguages }
                activeLanguageCode={ activeTranslationLanguageCode }
                savingTranslationLanguageCode={ savingTranslationLanguageCode }
                translationErrors={ validationErrors.translations }
                onSelectTranslationAction={ setActiveTranslationLanguageCode }
                onAddTranslationAction={ (languageCode) =>
                  requestNavigation({type: "addTranslation", languageCode})
                }
                onRemoveTranslationAction={ removeTranslationNow }
                onSaveTranslationAction={ (languageCode) => {
                  void saveTranslation(languageCode);
                } }
                onSetTranslationFieldAction={ setTranslationField }
                onUpdateStopContentAction={ updateStopContent }
              />
            ) : null }

            { activeSection === "publication" ? (
              <PublicationSection
                formState={ formState }
                availableLanguages={ availableLanguages }
                diagnostics={ diagnostics }
                isMutating={ isMutating }
                onPublishTranslationAction={ (args) => {
                  void publishTranslation(args);
                } }
                onUnpublishTranslationAction={ (args) => {
                  void unpublishTranslation(args);
                } }
                onPublishAllReadyAction={ () => {
                  void publishAllReady();
                } }
                onUnpublishAllAction={ () => {
                  void unpublishAll();
                } }
              />
            ) : null }
          </div>
        </main>
      </div>

      <Dialog open={ Boolean(pendingNavigation) } onOpenChange={ () => undefined }>
        <DialogContent showCloseButton={ false } className="border border-[#eadfce] bg-[#fffdfa] shadow-[0_30px_80px_rgba(61,45,27,0.14)]">
          <DialogHeader>
            <DialogTitle className="text-[#21343b]">Unsaved changes</DialogTitle>
            <DialogDescription className="text-[#627176]">
              Save or discard your current changes before leaving this part of the editor.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t border-[#f0e6d8] bg-[#fbf7f0]">
            <Button
              variant="outline"
              onClick={ () => setPendingNavigation(null) }
              disabled={ isMutating }
              className="border-[#d8c5a8] bg-white text-[#7a5424] hover:bg-[#f4ebde]"
            >
              Stay
            </Button>
            <Button
              variant="outline"
              onClick={ handleDiscardAndContinue }
              disabled={ isMutating }
              className="border-[#e8c7c1] bg-white text-[#a3483f] hover:bg-[#fbf2f0]"
            >
              Discard
            </Button>
            <Button
              onClick={ () => void handleSaveAndContinue() }
              disabled={ isMutating }
              className="border border-[#21343b] bg-[#21343b] text-white hover:bg-[#2c454d]"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
