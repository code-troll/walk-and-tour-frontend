"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatBackendErrorMessage } from "@/lib/api/core/backend-error";
import {
  TourEditorHeader,
  type TourSection,
} from "@/components/tour-editor/header";
import { GeneralSection } from "@/components/tour-editor/general-section";
import { ItinerarySection } from "@/components/tour-editor/itinerary-section";
import { TranslationsSection } from "@/components/tour-editor/translations-section";
import { PublicationSection } from "@/components/tour-editor/publication-section";
import {
  buildCreateTourTranslationPayload,
  buildInitialCreateTourPayload,
  buildPublishTourTranslationPayload,
  buildUpdateTourPayload,
  buildUpdateTourTranslationPayload,
  createEmptyStopFormState,
  createEmptyTourFormErrors,
  createEmptyTranslationFormState,
  getInitialTourFormState,
  getLegacyMediaFieldsFromGalleryImages,
  hasTourFormErrors,
  type ApiLanguage,
  type ApiTag,
  type ApiTour,
  type TourFormState,
  type TourGalleryImageFormState,
  type TourTranslationFormState,
  validateInitialTourCreateForm,
  validateSharedTourSaveForm,
  validateTranslationForm,
} from "@/lib/tours/admin-tour-form";

type TourEditorClientProps = {
  mode: "create" | "edit";
  initialTour?: ApiTour;
  availableLanguages: ApiLanguage[];
  availableTags: ApiTag[];
  accessToken: string;
  backendApiBaseUrl: string;
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
  const normalizedBaseUrl = backendApiBaseUrl.trim().replace(/\/$/, "");
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
  const normalizedBaseUrl = backendApiBaseUrl.trim().replace(/\/$/, "");
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
  const normalizedBaseUrl = backendApiBaseUrl.trim().replace(/\/$/, "");
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
                                   availableLanguages,
                                   availableTags,
                                   accessToken,
                                   backendApiBaseUrl,
                                 }: TourEditorClientProps) {
  const router = useRouter();
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
  const [savingTranslationLanguageCode, setSavingTranslationLanguageCode] = useState<string | null>(null);
  const isCreated = mode === "edit" || Boolean(savedTour?.id ?? initialTour?.id);
  const canSaveInitialTour = formState.name.trim().length > 0;
  const diagnostics = savedTour?.translationAvailability ?? initialTour?.translationAvailability ?? [];
  const getLanguageName = (languageCode: string) => availableLanguages.find(lang => lang.code === languageCode)?.name

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

  const updateGalleryImages = (galleryImages: TourGalleryImageFormState[]) => {
    markSharedDirty();
    const legacyMediaFields = getLegacyMediaFieldsFromGalleryImages(galleryImages);

    setFormState((current) => ({
      ...current,
      ...legacyMediaFields,
      galleryImages,
    }));
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
        router.push("/tours");
    }
  };

  const requestNavigation = (action: NavigationIntent) => {
    if (isMutating) {
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

  return (
    <>
      <div className="flex min-h-screen flex-col bg-muted/30">
        <TourEditorHeader
          mode={ mode }
          formState={ formState }
          onBack={ () => requestNavigation({type: "leave"}) }
          isMutating={ isMutating }
          lastSaved={ lastSaved }
          activeSection={ activeSection }
          isCreated={ isCreated }
          primaryAction={ primaryAction }
          onSectionChange={ (section) => requestNavigation({type: "section", section}) }
        />

        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-5xl space-y-6">
            { submitError ? (
              <div
                className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                { submitError }
              </div>
            ) : null }

            { successMessage ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700">
                { successMessage }
              </div>
            ) : null }

            { visibleErrors.length > 0 ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                <p className="text-sm font-medium text-destructive">
                  Fix the following issues before saving:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-destructive">
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
                updateFormStateAction={ updateFormState }
                updateGalleryImagesAction={ updateGalleryImages }
                availableTags={ availableTags }
                availableLanguages={ availableLanguages }
              />
            ) : null }

            { activeSection === "itinerary" ? (
              <ItinerarySection
                formState={ formState }
                updateFormState={ updateFormState }
                onAddStop={ addStop }
                onRemoveStop={ removeStop }
                onMoveStop={ moveStop }
                onUpdateStop={ updateStopField }
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
                onPublishTranslation={ (args) => {
                  void publishTranslation(args);
                } }
                onUnpublishTranslation={ (args) => {
                  void unpublishTranslation(args);
                } }
                onPublishAllReady={ () => {
                  void publishAllReady();
                } }
                onUnpublishAll={ () => {
                  void unpublishAll();
                } }
              />
            ) : null }
          </div>
        </main>
      </div>

      <Dialog open={ Boolean(pendingNavigation) } onOpenChange={ () => undefined }>
        <DialogContent showCloseButton={ false }>
          <DialogHeader>
            <DialogTitle>Unsaved changes</DialogTitle>
            <DialogDescription>
              Save or discard your current changes before leaving this part of the editor.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={ () => setPendingNavigation(null) }
              disabled={ isMutating }
            >
              Stay
            </Button>
            <Button
              variant="outline"
              onClick={ handleDiscardAndContinue }
              disabled={ isMutating }
            >
              Discard
            </Button>
            <Button onClick={ () => void handleSaveAndContinue() } disabled={ isMutating }>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
