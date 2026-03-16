import type { components } from "@/lib/api/generated/backend-types";

export type ApiTour = components["schemas"]["TourAdminResponseDto"];
export type ApiLanguage = components["schemas"]["LanguageResponseDto"];
export type ApiTag = components["schemas"]["TagResponseDto"];
export type ApiAdminMediaAsset = components["schemas"]["AdminMediaAssetResponseDto"];
export type ApiAdminMediaAssetListResponse = components["schemas"]["AdminMediaAssetListResponseDto"];
export type ApiUploadedMediaAsset = components["schemas"]["UploadedMediaResponseDto"];
export type CreateTourBody = components["schemas"]["CreateTourDto"];
export type UpdateTourBody = components["schemas"]["UpdateTourDto"];
export type AttachTourMediaBody = components["schemas"]["AttachTourMediaDto"];
export type UpdateTourMediaBody = components["schemas"]["UpdateTourMediaDto"];
export type SetTourCoverMediaBody = components["schemas"]["SetTourCoverMediaDto"];
export type TourContentSchema = NonNullable<UpdateTourBody["contentSchema"]>;
export type TourType = CreateTourBody["tourType"];
export type MediaType = ApiAdminMediaAsset["mediaType"];
export type ItineraryVariant = components["schemas"]["TourItineraryDto"]["variant"];
export type CommuteMode = NonNullable<
  components["schemas"]["TourItineraryConnectionDto"]["commuteMode"]
>;
export type CreateTourTranslationBody = {
  languageCode: string;
  bookingReferenceId?: string | null;
  payload: Record<string, unknown>;
};
export type UpdateTourTranslationBody = {
  bookingReferenceId?: string | null;
  payload?: Record<string, unknown>;
};
export type PublishTourTranslationBody = {
  bookingReferenceId?: string | null;
};

export const TOUR_TYPE_OPTIONS: TourType[] = ["private", "group", "tip_based", "company"];
export const COMMUTE_MODE_OPTIONS: CommuteMode[] = [
  "walk",
  "bike",
  "bus",
  "train",
  "metro",
  "tram",
  "ferry",
  "private-transport",
  "boat",
  "other",
];

export const TOUR_SLUG_PATTERN = "^[a-z0-9]+(?:-[a-z0-9]+)*$";
export const STOP_ID_PATTERN = TOUR_SLUG_PATTERN;
export const TOUR_NAME_MAX_LENGTH = 255;
export const TOUR_SLUG_MAX_LENGTH = 150;
export const TOUR_MEDIA_ALT_TEXT_MAX_LENGTH = 255;
export const TOUR_IMAGE_UPLOAD_MAX_SIZE = 104857600;
export const TOUR_CURRENCY_MAX_LENGTH = 10;
export const TOUR_TITLE_MAX_LENGTH = 255;
export const TOUR_POINT_LABEL_MAX_LENGTH = 255;
export const TOUR_LIST_ITEM_MAX_LENGTH = 255;
export const TOUR_TEXTAREA_MAX_LENGTH = 5000;
export const TOUR_STOP_ID_MAX_LENGTH = 100;
export const TOUR_BOOKING_REFERENCE_MAX_LENGTH = 255;

export const TOUR_CONTENT_SCHEMA: TourContentSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: {
      type: "string",
    },
    cancellationType: {
      type: "string",
    },
    aboutTourDescription: {
      type: "string",
    },
    customerSupportDescription: {
      type: "string",
    },
    highlights: {
      type: "array",
      items: {
        type: "string",
      },
    },
    included: {
      type: "array",
      items: {
        type: "string",
      },
    },
    notIncluded: {
      type: "array",
      items: {
        type: "string",
      },
    },
    startPoint: {
      type: "object",
      additionalProperties: false,
      properties: {
        label: {
          type: "string",
        },
      },
      required: ["label"],
    },
    endPoint: {
      type: "object",
      additionalProperties: false,
      properties: {
        label: {
          type: "string",
        },
      },
      required: ["label"],
    },
    itineraryDescription: {
      type: "string",
    },
    itineraryStops: {
      type: "object",
      additionalProperties: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: {
            type: "string",
          },
          description: {
            type: "string",
          },
        },
        required: ["title", "description"],
      },
    },
  },
  required: [
    "title",
    "cancellationType",
    "aboutTourDescription",
    "customerSupportDescription",
    "highlights",
    "included",
    "notIncluded",
    "startPoint",
    "endPoint",
  ],
} as const;

export type TranslationStopContent = {
  title: string;
  description: string;
};

export type TourMediaItemFormState = {
  clientId: string;
  mediaId: string;
  mediaType: MediaType;
  storagePath: string;
  contentUrl: string;
  contentType: string;
  size: number;
  originalFilename: string;
  altTexts: Record<string, string>;
  isCover: boolean;
};

export type TourTranslationFormState = {
  existing: boolean;
  languageCode: string;
  isReady: boolean;
  isPublished: boolean;
  bookingReferenceId: string;
  title: string;
  cancellationType: string;
  aboutTourDescription: string;
  customerSupportDescription: string;
  startPointLabel: string;
  endPointLabel: string;
  itineraryDescription: string;
  highlightsText: string;
  includedText: string;
  notIncludedText: string;
  stopContent: Record<string, TranslationStopContent>;
};

export type TourStopFormState = {
  clientId: string;
  id: string;
  durationMinutes: string;
  latitude: string;
  longitude: string;
  nextDurationMinutes: string;
  nextCommuteMode: CommuteMode | "";
};

export type TourFormState = {
  name: string;
  slug: string;
  coverMediaId: string | null;
  mediaItems: TourMediaItemFormState[];
  tourType: TourType;
  durationMinutes: string;
  rating: string;
  reviewCount: string;
  hasPrice: boolean;
  priceAmount: string;
  priceCurrency: string;
  startPointLat: string;
  startPointLng: string;
  endPointLat: string;
  endPointLng: string;
  itineraryVariant: ItineraryVariant;
  stops: TourStopFormState[];
  tagKeys: string[];
  translations: TourTranslationFormState[];
};

export type TourFormErrors = {
  shared: string[];
  itinerary: string[];
  translations: Record<string, string[]>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asString = (value: unknown) => (typeof value === "string" ? value : "");

const asOptionalString = (value: unknown) => (typeof value === "string" ? value : null);

const asNumberString = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? String(value) : "";

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const asAltTextRecord = (value: unknown): Record<string, string> => {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
};

const asStopContentMap = (value: unknown): Record<string, TranslationStopContent> => {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, Record<string, unknown>] => isRecord(entry[1]))
      .map(([stopId, stopValue]) => [
        stopId,
        {
          title: asString(stopValue.title),
          description: asString(stopValue.description),
        },
      ]),
  );
};

const splitTextareaLines = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const joinTextareaLines = (items: string[] | null | undefined) => (items ?? []).join("\n");

const toCoordinates = ({
                         lat,
                         lng,
                       }: {
  lat: string;
  lng: string;
}) => {
  const normalizedLat = lat.trim();
  const normalizedLng = lng.trim();

  if (!normalizedLat || !normalizedLng) {
    return undefined;
  }

  return {
    lat: Number.parseFloat(normalizedLat),
    lng: Number.parseFloat(normalizedLng),
  };
};

const createClientId = (prefix: string) =>
  `${ prefix }-${ Math.random().toString(36).slice(2, 10) }`;

const sanitizeAltTexts = (altTexts: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(altTexts)
      .map(([languageCode, text]) => [languageCode, text.trim()] as const)
      .filter((entry) => entry[1].length > 0),
  );

const toTourMediaItemFormState = ({
  asset,
  altText,
  isCover,
}: {
  asset: {
    mediaId: string;
    mediaType: MediaType;
    storagePath: string;
    contentUrl: string;
    contentType: string;
    size: number;
    originalFilename: string;
  };
  altText?: Record<string, string> | null;
  isCover: boolean;
}): TourMediaItemFormState => ({
  clientId: createClientId("media"),
  mediaId: asset.mediaId,
  mediaType: asset.mediaType,
  storagePath: asset.storagePath,
  contentUrl: asset.contentUrl,
  contentType: asset.contentType,
  size: asset.size,
  originalFilename: asset.originalFilename,
  altTexts: asAltTextRecord(altText),
  isCover,
});

export const createTourMediaItemFormStateFromAdminAsset = (
  asset: ApiAdminMediaAsset,
): TourMediaItemFormState =>
  toTourMediaItemFormState({
    asset: {
      mediaId: asset.id,
      mediaType: asset.mediaType,
      storagePath: asset.storagePath,
      contentUrl: asset.adminContentUrl,
      contentType: asset.contentType,
      size: asset.size,
      originalFilename: asset.originalFilename,
    },
    isCover: false,
  });

export const createTourMediaItemFormStateFromUploadedAsset = (
  asset: ApiUploadedMediaAsset,
): TourMediaItemFormState =>
  toTourMediaItemFormState({
    asset: {
      mediaId: asset.id,
      mediaType: asset.mediaType,
      storagePath: asset.storagePath,
      contentUrl: asset.adminContentUrl,
      contentType: asset.contentType,
      size: asset.size,
      originalFilename: asset.originalFilename,
    },
    isCover: false,
  });

export const createEmptyStopFormState = (): TourStopFormState => ({
  clientId: createClientId("stop"),
  id: "",
  durationMinutes: "",
  latitude: "",
  longitude: "",
  nextDurationMinutes: "",
  nextCommuteMode: "",
});

export const createEmptyTranslationFormState = (languageCode: string): TourTranslationFormState => ({
  existing: false,
  languageCode,
  isReady: false,
  isPublished: false,
  bookingReferenceId: "",
  title: "",
  cancellationType: "",
  aboutTourDescription: "",
  customerSupportDescription: "",
  startPointLabel: "",
  endPointLabel: "",
  itineraryDescription: "",
  highlightsText: "",
  includedText: "",
  notIncludedText: "",
  stopContent: {},
});

export const createEmptyTourFormState = (): TourFormState => ({
  name: "",
  slug: "",
  coverMediaId: null,
  mediaItems: [],
  tourType: "group",
  durationMinutes: "",
  rating: "5",
  reviewCount: "",
  hasPrice: true,
  priceAmount: "",
  priceCurrency: "EUR",
  startPointLat: "",
  startPointLng: "",
  endPointLat: "",
  endPointLng: "",
  itineraryVariant: "description",
  stops: [],
  tagKeys: [],
  translations: [],
});

export const generateTourSlug = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const getTranslationDisplayName = ({
                                            languageCode,
                                            languages,
                                          }: {
  languageCode: string;
  languages: ApiLanguage[];
}) => languages.find((language) => language.code === languageCode)?.name ?? languageCode;

export const getInitialTourFormState = (tour?: ApiTour): TourFormState => {
  if (!tour) {
    return createEmptyTourFormState();
  }

  const itineraryVariant = tour.itinerary?.variant ?? "description";

  const translations = Object.entries(tour.translations).map(([languageCode, translation]) => {
    const payload = isRecord(translation.payload) ? translation.payload : {};
    const startPointPayload = isRecord(payload.startPoint) ? payload.startPoint : {};
    const endPointPayload = isRecord(payload.endPoint) ? payload.endPoint : {};

    return {
      existing: true,
      languageCode,
      isReady: translation.isReady,
      isPublished: translation.isPublished,
      bookingReferenceId: asString(translation.bookingReferenceId),
      title: asString(payload.title),
      cancellationType: asString(translation.cancellationType ?? payload.cancellationType),
      aboutTourDescription: asString(payload.aboutTourDescription ?? payload.description),
      customerSupportDescription: asString(payload.customerSupportDescription),
      startPointLabel: asString(startPointPayload.label),
      endPointLabel: asString(endPointPayload.label),
      itineraryDescription: asString(payload.itineraryDescription),
      highlightsText: joinTextareaLines(translation.highlights ?? asStringArray(payload.highlights)),
      includedText: joinTextareaLines(translation.included ?? asStringArray(payload.included)),
      notIncludedText: joinTextareaLines(
        translation.notIncluded ?? asStringArray(payload.notIncluded),
      ),
      stopContent: asStopContentMap(payload.itineraryStops),
    };
  });
  const coverMediaId = asOptionalString(tour.coverMediaId);
  const mediaItems = (tour.mediaItems ?? [])
    .slice()
    .sort((left, right) => left.orderIndex - right.orderIndex)
    .map((item) =>
      toTourMediaItemFormState({
        asset: {
          mediaId: item.mediaId,
          mediaType: item.mediaType,
          storagePath: item.storagePath,
          contentUrl: item.contentUrl,
          contentType: item.contentType,
          size: item.size,
          originalFilename: item.originalFilename,
        },
        altText: item.altText,
        isCover: coverMediaId === item.mediaId,
      }),
    );

  return {
    name: tour.name,
    slug: tour.slug,
    coverMediaId,
    mediaItems,
    tourType: tour.tourType,
    durationMinutes: asNumberString(tour.durationMinutes),
    rating: asNumberString(tour.rating),
    reviewCount: asNumberString(tour.reviewCount),
    hasPrice: Boolean(tour.price),
    priceAmount: asNumberString(tour.price?.amount),
    priceCurrency: typeof tour.price?.currency === "string" ? tour.price.currency : "EUR",
    startPointLat: asNumberString(tour.startPoint?.coordinates?.lat),
    startPointLng: asNumberString(tour.startPoint?.coordinates?.lng),
    endPointLat: asNumberString(tour.endPoint?.coordinates?.lat),
    endPointLng: asNumberString(tour.endPoint?.coordinates?.lng),
    itineraryVariant,
    stops:
      itineraryVariant === "stops"
        ? (tour.itinerary?.stops ?? []).map((stop) => ({
          clientId: createClientId("stop"),
          id: stop.id,
          durationMinutes: asNumberString(stop.durationMinutes ?? null),
          latitude: asNumberString(stop.coordinates?.lat ?? null),
          longitude: asNumberString(stop.coordinates?.lng ?? null),
          nextDurationMinutes: asNumberString(stop.nextConnection?.durationMinutes ?? null),
          nextCommuteMode: stop.nextConnection?.commuteMode ?? "",
        }))
        : [],
    tagKeys: tour.tagKeys,
    translations,
  };
};

const buildTranslationPayload = ({
                                   formState,
                                   itineraryVariant,
                                 }: {
  formState: TourTranslationFormState;
  itineraryVariant: ItineraryVariant;
}) => {
  const payload: Record<string, unknown> = {
    title: formState.title.trim(),
    cancellationType: formState.cancellationType.trim(),
    aboutTourDescription: formState.aboutTourDescription.trim(),
    customerSupportDescription: formState.customerSupportDescription.trim(),
    highlights: splitTextareaLines(formState.highlightsText),
    included: splitTextareaLines(formState.includedText),
    notIncluded: splitTextareaLines(formState.notIncludedText),
    startPoint: {
      label: formState.startPointLabel.trim(),
    },
    endPoint: {
      label: formState.endPointLabel.trim(),
    },
  };

  const itineraryDescription = formState.itineraryDescription.trim();
  if (itineraryVariant === "description" && itineraryDescription) {
    payload.itineraryDescription = itineraryDescription;
  }

  if (itineraryVariant === "stops") {
    payload.itineraryStops = Object.fromEntries(
      Object.entries(formState.stopContent).map(([stopId, stopContent]) => [
        stopId,
        {
          title: stopContent.title.trim(),
          description: stopContent.description.trim(),
        },
      ]),
    );
  }

  return payload;
};

export const buildCreateTourTranslationPayload = ({
                                                    formState,
                                                    translation,
                                                  }: {
  formState: TourFormState;
  translation: TourTranslationFormState;
}): CreateTourTranslationBody => ({
  languageCode: translation.languageCode,
  bookingReferenceId: translation.bookingReferenceId.trim() || null,
  payload: buildTranslationPayload({
    formState: translation,
    itineraryVariant: formState.itineraryVariant,
  }),
});

export const buildUpdateTourTranslationPayload = ({
                                                    formState,
                                                    translation,
                                                  }: {
  formState: TourFormState;
  translation: TourTranslationFormState;
}): UpdateTourTranslationBody => ({
  bookingReferenceId: translation.bookingReferenceId.trim() || null,
  payload: buildTranslationPayload({
    formState: translation,
    itineraryVariant: formState.itineraryVariant,
  }),
});

export const buildPublishTourTranslationPayload = ({
                                                     translation,
                                                   }: {
  translation: TourTranslationFormState;
}): PublishTourTranslationBody => ({
  bookingReferenceId: translation.bookingReferenceId.trim() || null,
});

const buildStopsPayload = (stops: TourStopFormState[]) =>
  stops.map((stop, index) => {
    const coordinates = toCoordinates({
      lat: stop.latitude,
      lng: stop.longitude,
    });
    const isLastStop = index === stops.length - 1;
    const nextDuration = stop.nextDurationMinutes.trim();
    const nextConnection =
      !isLastStop && stop.nextCommuteMode
        ? {
          commuteMode: stop.nextCommuteMode,
          ...(nextDuration
            ? {
              durationMinutes: Number.parseFloat(nextDuration),
            }
            : {}),
        }
        : undefined;

    return {
      id: stop.id.trim(),
      ...(stop.durationMinutes.trim()
        ? {
          durationMinutes: Number.parseFloat(stop.durationMinutes),
        }
        : {}),
      ...(coordinates ? {coordinates} : {}),
      ...(nextConnection ? {nextConnection} : {}),
    };
  });

export const buildCreateTourPayload = ({
                                         formState,
                                       }: {
  formState: TourFormState;
}): CreateTourBody => buildInitialCreateTourPayload({formState});

export const buildInitialCreateTourPayload = ({
                                                formState,
                                              }: {
  formState: TourFormState;
}): CreateTourBody => ({
  name: formState.name.trim(),
  slug: (formState.slug.trim() || generateTourSlug(formState.name)).trim(),
  tourType: formState.tourType,
});

export const buildUpdateTourPayload = ({
                                         formState,
                                       }: {
  formState: TourFormState;
}): UpdateTourBody => {
  return {
    name: formState.name.trim(),
    slug: formState.slug.trim(),
    contentSchema: TOUR_CONTENT_SCHEMA,
    price:
      formState.tourType === "tip_based" || !formState.hasPrice
        ? null
        : {
          amount: Number.parseFloat(formState.priceAmount),
          currency: formState.priceCurrency.trim(),
        },
    rating: Number.parseFloat(formState.rating),
    reviewCount: Number.parseInt(formState.reviewCount, 10),
    tourType: formState.tourType,
    durationMinutes: Number.parseInt(formState.durationMinutes, 10),
    startPoint: {
      ...(toCoordinates({
        lat: formState.startPointLat,
        lng: formState.startPointLng,
      })
        ? {
          coordinates: toCoordinates({
            lat: formState.startPointLat,
            lng: formState.startPointLng,
          }),
        }
        : {}),
    },
    endPoint: {
      ...(toCoordinates({
        lat: formState.endPointLat,
        lng: formState.endPointLng,
      })
        ? {
          coordinates: toCoordinates({
            lat: formState.endPointLat,
            lng: formState.endPointLng,
          }),
        }
        : {}),
    },
    itinerary:
      formState.itineraryVariant === "description"
        ? {
          variant: "description",
        }
        : {
          variant: "stops",
          stops: buildStopsPayload(formState.stops),
        },
    tagKeys: formState.tagKeys,
  };
};

export const buildAttachTourMediaPayload = ({
                                              mediaId,
                                              altTexts,
                                              orderIndex,
                                            }: {
  mediaId: string;
  altTexts?: Record<string, string>;
  orderIndex?: number;
}): AttachTourMediaBody => ({
  mediaId: mediaId.trim(),
  ...(altTexts ? {altText: sanitizeAltTexts(altTexts)} : {}),
  ...(typeof orderIndex === "number" ? {orderIndex} : {}),
});

export const buildUpdateTourMediaPayload = ({
                                              altTexts,
                                              orderIndex,
                                            }: {
  altTexts?: Record<string, string>;
  orderIndex?: number;
}): UpdateTourMediaBody => ({
  ...(altTexts ? {altText: sanitizeAltTexts(altTexts)} : {}),
  ...(typeof orderIndex === "number" ? {orderIndex} : {}),
});

export const buildSetTourCoverMediaPayload = (mediaId: string): SetTourCoverMediaBody => ({
  mediaId: mediaId.trim(),
});

const addSharedError = (errors: TourFormErrors, message: string) => {
  errors.shared.push(message);
};

const addItineraryError = (errors: TourFormErrors, message: string) => {
  errors.itinerary.push(message);
};

const addTranslationError = ({
                               errors,
                               languageCode,
                               message,
                             }: {
  errors: TourFormErrors;
  languageCode: string;
  message: string;
}) => {
  errors.translations[languageCode] = [
    ...(errors.translations[languageCode] ?? []),
    message,
  ];
};

export const createEmptyTourFormErrors = (): TourFormErrors => ({
  shared: [],
  itinerary: [],
  translations: {},
});

export const hasTourFormErrors = (errors: TourFormErrors) =>
  errors.shared.length > 0 ||
  errors.itinerary.length > 0 ||
  Object.values(errors.translations).some((translationErrors) => translationErrors.length > 0);

const validateSharedFields = ({
  errors,
  formState,
}: {
  errors: TourFormErrors;
  formState: TourFormState;
}) => {
  if (!formState.name.trim()) {
    addSharedError(errors, "Name is required.");
  } else if (formState.name.trim().length > TOUR_NAME_MAX_LENGTH) {
    addSharedError(errors, `Name must be ${ TOUR_NAME_MAX_LENGTH } characters or less.`);
  }

  if (!formState.slug.trim()) {
    addSharedError(errors, "Slug is required.");
  } else {
    if (formState.slug.trim().length > TOUR_SLUG_MAX_LENGTH) {
      addSharedError(errors, `Slug must be ${ TOUR_SLUG_MAX_LENGTH } characters or less.`);
    }

    if (!new RegExp(TOUR_SLUG_PATTERN).test(formState.slug.trim())) {
      addSharedError(errors, "Slug must use lowercase letters, numbers, and hyphens only.");
    }
  }

  const invalidAltText = formState.mediaItems.find((image) =>
    Object.values(image.altTexts).some((text) => text.length > TOUR_MEDIA_ALT_TEXT_MAX_LENGTH),
  );
  if (invalidAltText) {
    addSharedError(
      errors,
      `Media alt text must be ${ TOUR_MEDIA_ALT_TEXT_MAX_LENGTH } characters or less.`,
    );
  }

  if (
    formState.coverMediaId &&
    !formState.mediaItems.some((item) => item.mediaId === formState.coverMediaId)
  ) {
    addSharedError(errors, "Cover image must be one of the attached images.");
  }

  const rating = Number.parseFloat(formState.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    addSharedError(errors, "Rating must be a number between 1 and 5.");
  }

  const reviewCount = Number.parseInt(formState.reviewCount, 10);
  if (!Number.isInteger(reviewCount) || reviewCount <= 0) {
    addSharedError(errors, "Review count must be a positive whole number.");
  }

  const durationMinutes = Number.parseInt(formState.durationMinutes, 10);
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    addSharedError(errors, "Duration must be a positive whole number.");
  }

  if (formState.tourType !== "tip_based" && formState.hasPrice) {
    const priceAmount = Number.parseFloat(formState.priceAmount);
    if (!Number.isFinite(priceAmount) || priceAmount < 0) {
      addSharedError(errors, "Price amount must be a number greater than or equal to 0.");
    }

    if (!formState.priceCurrency.trim()) {
      addSharedError(errors, "Currency is required when the tour has a fixed price.");
    } else if (formState.priceCurrency.trim().length > TOUR_CURRENCY_MAX_LENGTH) {
      addSharedError(
        errors,
        `Currency must be ${ TOUR_CURRENCY_MAX_LENGTH } characters or less.`,
      );
    }
  }

  if (formState.itineraryVariant === "stops") {
    if (formState.stops.length === 0) {
      addItineraryError(errors, "At least one stop is required for stop-based itineraries.");
    }

    const seenStopIds = new Set<string>();
    formState.stops.forEach((stop, index) => {
      const stopLabel = `Stop ${ index + 1 }`;
      const normalizedId = stop.id.trim();

      if (!normalizedId) {
        addItineraryError(errors, `${ stopLabel } ID is required.`);
      } else {
        if (normalizedId.length > TOUR_STOP_ID_MAX_LENGTH) {
          addItineraryError(
            errors,
            `${ stopLabel } ID must be ${ TOUR_STOP_ID_MAX_LENGTH } characters or less.`,
          );
        }

        if (!new RegExp(STOP_ID_PATTERN).test(normalizedId)) {
          addItineraryError(
            errors,
            `${ stopLabel } ID must use lowercase letters, numbers, and hyphens only.`,
          );
        }

        if (seenStopIds.has(normalizedId)) {
          addItineraryError(errors, `${ stopLabel } ID must be unique.`);
        }
        seenStopIds.add(normalizedId);
      }

      if (stop.durationMinutes.trim()) {
        const stopDuration = Number.parseFloat(stop.durationMinutes);
        if (!Number.isFinite(stopDuration) || stopDuration < 0) {
          addItineraryError(errors, `${ stopLabel } duration must be greater than or equal to 0.`);
        }
      }

      const lat = stop.latitude.trim();
      const lng = stop.longitude.trim();
      if ((lat && !lng) || (!lat && lng)) {
        addItineraryError(errors, `${ stopLabel } coordinates require both latitude and longitude.`);
      }

      const isLastStop = index === formState.stops.length - 1;
      if (isLastStop && (stop.nextCommuteMode || stop.nextDurationMinutes.trim())) {
        addItineraryError(errors, `${ stopLabel } cannot include a next connection because it is the final stop.`);
      }

      if (!isLastStop && stop.nextDurationMinutes.trim() && !stop.nextCommuteMode) {
        addItineraryError(errors, `${ stopLabel } next connection requires a commute mode.`);
      }
    });
  }
};

const validateTranslationEntry = ({
  errors,
  formState,
  translation,
}: {
  errors: TourFormErrors;
  formState: TourFormState;
  translation: TourTranslationFormState;
}) => {
  const languageCode = translation.languageCode;

  if (!languageCode) {
    addTranslationError({
      errors,
      languageCode: "new",
      message: "Translation locale is required.",
    });
    return;
  }

  const duplicateCount = formState.translations.filter(
    (item) => item.languageCode === languageCode,
  ).length;
  if (duplicateCount > 1) {
    addTranslationError({
      errors,
      languageCode,
      message: "Translation locales must be unique.",
    });
  }

  if (translation.bookingReferenceId.length > TOUR_BOOKING_REFERENCE_MAX_LENGTH) {
    addTranslationError({
      errors,
      languageCode,
      message: `Booking reference must be ${ TOUR_BOOKING_REFERENCE_MAX_LENGTH } characters or less.`,
    });
  }

  if (translation.title.length > TOUR_TITLE_MAX_LENGTH) {
    addTranslationError({
      errors,
      languageCode,
      message: `Title must be ${ TOUR_TITLE_MAX_LENGTH } characters or less.`,
    });
  }

  if (translation.aboutTourDescription.length > TOUR_TEXTAREA_MAX_LENGTH) {
    addTranslationError({
      errors,
      languageCode,
      message: `About tour description must be ${ TOUR_TEXTAREA_MAX_LENGTH } characters or less.`,
    });
  }

  if (translation.cancellationType.length > TOUR_TEXTAREA_MAX_LENGTH) {
    addTranslationError({
      errors,
      languageCode,
      message: `Cancellation type must be ${ TOUR_TEXTAREA_MAX_LENGTH } characters or less.`,
    });
  }

  if (translation.customerSupportDescription.length > TOUR_TEXTAREA_MAX_LENGTH) {
    addTranslationError({
      errors,
      languageCode,
      message: `Customer support description must be ${ TOUR_TEXTAREA_MAX_LENGTH } characters or less.`,
    });
  }

  if (
    translation.startPointLabel.length > TOUR_POINT_LABEL_MAX_LENGTH ||
    translation.endPointLabel.length > TOUR_POINT_LABEL_MAX_LENGTH
  ) {
    addTranslationError({
      errors,
      languageCode,
      message: `Point labels must be ${ TOUR_POINT_LABEL_MAX_LENGTH } characters or less.`,
    });
  }

  if (translation.itineraryDescription.length > TOUR_TEXTAREA_MAX_LENGTH) {
    addTranslationError({
      errors,
      languageCode,
      message: `Itinerary description must be ${ TOUR_TEXTAREA_MAX_LENGTH } characters or less.`,
    });
  }

  if (formState.itineraryVariant === "stops") {
    formState.stops.forEach((stop) => {
      const stopId = stop.id.trim();
      if (!stopId) {
        return;
      }

      const stopCopy = translation.stopContent[stopId];
      if (!stopCopy) {
        return;
      }

      if (stopCopy.title.length > TOUR_TITLE_MAX_LENGTH) {
        addTranslationError({
          errors,
          languageCode,
          message: `Stop "${ stopId }" title must be ${ TOUR_TITLE_MAX_LENGTH } characters or less.`,
        });
      }

      if (stopCopy.description.length > TOUR_TEXTAREA_MAX_LENGTH) {
        addTranslationError({
          errors,
          languageCode,
          message: `Stop "${ stopId }" description must be ${ TOUR_TEXTAREA_MAX_LENGTH } characters or less.`,
        });
      }
    });
  }
};

export const validateSharedTourForm = ({
  formState,
}: {
  formState: TourFormState;
}) => {
  const errors = createEmptyTourFormErrors();

  validateSharedFields({
    errors,
    formState,
  });

  return errors;
};

export const validateSharedTourSaveForm = ({
  formState,
}: {
  formState: TourFormState;
}) => {
  const errors = createEmptyTourFormErrors();

  if (formState.tourType !== "tip_based" && formState.hasPrice) {
    const priceAmount = Number.parseFloat(formState.priceAmount);
    if (!Number.isFinite(priceAmount) || priceAmount < 0) {
      addSharedError(errors, "Price amount must be a number greater than or equal to 0.");
    }

    if (!formState.priceCurrency.trim()) {
      addSharedError(errors, "Currency is required when the tour has a fixed price.");
    } else if (formState.priceCurrency.trim().length > TOUR_CURRENCY_MAX_LENGTH) {
      addSharedError(
        errors,
        `Currency must be ${ TOUR_CURRENCY_MAX_LENGTH } characters or less.`,
      );
    }
  }

  if (formState.itineraryVariant === "stops") {
    const seenStopIds = new Set<string>();

    formState.stops.forEach((stop, index) => {
      const stopLabel = `Stop ${ index + 1 }`;
      const normalizedId = stop.id.trim();

      if (!normalizedId) {
        addItineraryError(errors, `${ stopLabel } ID is required.`);
        return;
      }

      if (normalizedId.length > TOUR_STOP_ID_MAX_LENGTH) {
        addItineraryError(
          errors,
          `${ stopLabel } ID must be ${ TOUR_STOP_ID_MAX_LENGTH } characters or less.`,
        );
      }

      if (!new RegExp(STOP_ID_PATTERN).test(normalizedId)) {
        addItineraryError(
          errors,
          `${ stopLabel } ID must use lowercase letters, numbers, and hyphens only.`,
        );
      }

      if (seenStopIds.has(normalizedId)) {
        addItineraryError(errors, `${ stopLabel } ID must be unique.`);
      }

      seenStopIds.add(normalizedId);
    });
  }

  return errors;
};

const validateTranslationSaveRequirements = ({
                                               errors,
                                               formState,
                                               translation,
                                             }: {
  errors: TourFormErrors;
  formState: TourFormState;
  translation: TourTranslationFormState;
}) => {
  const languageCode = translation.languageCode;

  if (formState.itineraryVariant === "description") {
    if (!translation.itineraryDescription.trim()) {
      addTranslationError({
        errors,
        languageCode,
        message: "Itinerary description is required for description-based itineraries.",
      });
    }

    return;
  }

  formState.stops.forEach((stop, index) => {
    const stopId = stop.id.trim();
    const stopTitle = stopId ? translation.stopContent[stopId]?.title.trim() ?? "" : "";

    if (!stopTitle) {
      addTranslationError({
        errors,
        languageCode,
        message: `Stop ${ index + 1 } title is required for stop-based itineraries.`,
      });
    }
  });
};

export const validateTranslationForm = ({
  formState,
  languageCode,
}: {
  formState: TourFormState;
  languageCode: string;
}) => {
  const errors = createEmptyTourFormErrors();
  const translation = formState.translations.find((item) => item.languageCode === languageCode);

  if (!translation) {
    addTranslationError({
      errors,
      languageCode,
      message: "Translation not found.",
    });
    return errors;
  }

  validateTranslationEntry({
    errors,
    formState,
    translation,
  });

  validateTranslationSaveRequirements({
    errors,
    formState,
    translation,
  });

  return errors;
};

export const validateTourForm = ({
                                   formState,
                                 }: {
  formState: TourFormState;
}) => {
  const errors = createEmptyTourFormErrors();

  validateSharedFields({
    errors,
    formState,
  });

  formState.translations.forEach((translation) => {
    validateTranslationEntry({
      errors,
      formState,
      translation,
    });
  });

  return errors;
};

export const validateInitialTourCreateForm = ({
                                                formState,
                                              }: {
  formState: TourFormState;
}) => {
  const errors = createEmptyTourFormErrors();

  if (!formState.name.trim()) {
    addSharedError(errors, "Name is required.");
  } else if (formState.name.trim().length > TOUR_NAME_MAX_LENGTH) {
    addSharedError(errors, `Name must be ${ TOUR_NAME_MAX_LENGTH } characters or less.`);
  }

  const slug = formState.slug.trim() || generateTourSlug(formState.name);
  if (!slug) {
    addSharedError(errors, "Slug could not be generated from the name.");
    return errors;
  }

  if (slug.length > TOUR_SLUG_MAX_LENGTH) {
    addSharedError(errors, `Slug must be ${ TOUR_SLUG_MAX_LENGTH } characters or less.`);
  }

  if (!new RegExp(TOUR_SLUG_PATTERN).test(slug)) {
    addSharedError(errors, "Slug must use lowercase letters, numbers, and hyphens only.");
  }

  return errors;
};
