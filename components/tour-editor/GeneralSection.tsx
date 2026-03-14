"use client";

import { type ChangeEvent, type SubmitEvent, useEffect, useMemo, useRef, useState } from "react";
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
  type ApiAdminMediaAsset,
  type ApiAdminMediaAssetListResponse,
  type ApiLanguage,
  type ApiTag,
  type ApiUploadedMediaAsset,
  generateTourSlug,
  TOUR_IMAGE_UPLOAD_MAX_SIZE,
  TOUR_MEDIA_ALT_TEXT_MAX_LENGTH,
  TOUR_TYPE_OPTIONS,
  type TourFormState,
  type TourMediaItemFormState,
  type TourType,
} from "@/lib/tours/admin-tour-form";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Flag,
  ImageIcon,
  LoaderCircle,
  MapPin,
  Search,
  Star,
  Upload,
  X,
} from "lucide-react";

type GeneralSectionProps = {
  formState: TourFormState;
  isCreated: boolean;
  isMutating: boolean;
  updateFormStateAction: <K extends keyof TourFormState>(key: K, value: TourFormState[K]) => void;
  loadMediaLibraryAction: (args: {
    limit: number;
    page: number;
    search: string;
  }) => Promise<
    | {
    ok: true;
    response: ApiAdminMediaAssetListResponse;
  }
    | {
    ok: false;
    statusCode: number;
    message: string;
  }
  >;
  uploadMediaFilesAction: (files: File[]) => Promise<{
    uploaded: ApiUploadedMediaAsset[];
    errors: string[];
  }>;
  attachMediaItemsAction: (mediaIds: string[]) => Promise<boolean>;
  removeMediaItemAction: (mediaId: string) => Promise<boolean>;
  reorderMediaItemsAction: (mediaItems: TourMediaItemFormState[]) => Promise<boolean>;
  setCoverMediaAction: (mediaId: string) => Promise<boolean>;
  updateMediaAltTextsAction: (args: {
    mediaId: string;
    altTexts: Record<string, string>;
  }) => Promise<boolean>;
  ensureMediaPreviewAction: (args: {mediaId: string; contentUrl: string}) => Promise<void>;
  mediaPreviewStatus: Record<string, {previewUrl: string | null; error: string | null}>;
  availableTags: ApiTag[];
  availableLanguages: ApiLanguage[];
};

const formatLabel = (value: string) =>
  value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());

const normalizePositiveIntegerInput = (value: string) => {
  const digitsOnly = value.replace(/\D+/g, "");
  return digitsOnly.replace(/^0+/, "");
};

const PRICE_CURRENCY_OPTIONS = ["DKK", "EUR"] as const;
const MEDIA_LIBRARY_PAGE_SIZE = 24;
const sectionClassName =
  "rounded-[1.75rem] border border-[#eadfce] bg-white p-6 shadow-[0_20px_50px_rgba(42,36,25,0.05)] max-[520px]:p-4";
const subCardClassName = "rounded-[1.25rem] border border-[#efe4d5] bg-[#fffcf7] p-4";
const warmSelectClassName =
  "h-11 w-full rounded-2xl border border-[#ddd0bf] bg-[#fdfbf7] px-3 text-sm text-[#21343b] shadow-sm outline-none transition focus:border-[#cfb48f] focus:ring-2 focus:ring-[#eadfce]";

const formatFileSize = (sizeInBytes: number) => {
  if (sizeInBytes < 1024 * 1024) {
    return `${ Math.round(sizeInBytes / 1024) } KB`;
  }

  return `${ (sizeInBytes / (1024 * 1024)).toFixed(1) } MB`;
};

const toLibraryAssetFromUploadedAsset = (asset: ApiUploadedMediaAsset): ApiAdminMediaAsset => {
  const timestamp = new Date().toISOString();

  return {
    ...asset,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

export function GeneralSection({
                                 formState,
                                 isCreated,
                                 isMutating,
                                 updateFormStateAction,
                                 loadMediaLibraryAction,
                                 uploadMediaFilesAction,
                                 attachMediaItemsAction,
                                 removeMediaItemAction,
                                 reorderMediaItemsAction,
                                 setCoverMediaAction,
                                 updateMediaAltTextsAction,
                                 ensureMediaPreviewAction,
                                 mediaPreviewStatus,
                                 availableTags,
                                 availableLanguages,
                               }: GeneralSectionProps) {
  const generatedSlug = generateTourSlug(formState.name);
  const [expandedImageId, setExpandedImageId] = useState<string | null>(null);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [mediaSearchInput, setMediaSearchInput] = useState("");
  const [appliedMediaSearch, setAppliedMediaSearch] = useState("");
  const [mediaLibraryItems, setMediaLibraryItems] = useState<ApiAdminMediaAsset[]>([]);
  const [mediaLibraryPage, setMediaLibraryPage] = useState(1);
  const [mediaLibraryTotal, setMediaLibraryTotal] = useState(0);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [mediaDialogError, setMediaDialogError] = useState<string | null>(null);
  const [isLoadingMediaLibrary, setIsLoadingMediaLibrary] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [altTextDrafts, setAltTextDrafts] = useState<Record<string, Record<string, string>>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const enabledLanguages = useMemo(
    () => availableLanguages.filter((language) => language.isEnabled),
    [availableLanguages],
  );
  const mediaItems = formState.mediaItems;
  const attachedMediaIds = new Set(mediaItems.map((item) => item.mediaId));

  useEffect(() => {
    setAltTextDrafts(
      Object.fromEntries(
        mediaItems.map((item) => [
          item.clientId,
          Object.fromEntries(
            enabledLanguages.map((language) => [language.code, item.altTexts[language.code] ?? ""]),
          ),
        ]),
      ),
    );
  }, [enabledLanguages, mediaItems]);

  useEffect(() => {
    mediaItems.forEach((item) => {
      void ensureMediaPreviewAction({
        mediaId: item.mediaId,
        contentUrl: item.contentUrl,
      });
    });
  }, [ensureMediaPreviewAction, mediaItems]);

  useEffect(() => {
    mediaLibraryItems.forEach((asset) => {
      void ensureMediaPreviewAction({
        mediaId: asset.id,
        contentUrl: asset.contentUrl,
      });
    });
  }, [ensureMediaPreviewAction, mediaLibraryItems]);

  const loadMediaPage = async ({
                                 page,
                                 search,
                                 append,
                               }: {
    page: number;
    search: string;
    append: boolean;
  }) => {
    setIsLoadingMediaLibrary(true);
    setMediaDialogError(null);

    try {
      const result = await loadMediaLibraryAction({
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

  const openMediaDialog = () => {
    setIsMediaDialogOpen(true);
    setMediaSearchInput(appliedMediaSearch);
    void loadMediaPage({
      page: 1,
      search: appliedMediaSearch,
      append: false,
    });
  };

  const removeImage = async (mediaId: string, imageClientId: string) => {
    const didRemove = await removeMediaItemAction(mediaId);
    if (!didRemove) {
      return;
    }

    if (expandedImageId === imageClientId) {
      setExpandedImageId(null);
    }
  };

  const moveImage = async (imageClientId: string, direction: "up" | "down") => {
    const index = mediaItems.findIndex((item) => item.clientId === imageClientId);
    if (index === -1) {
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= mediaItems.length) {
      return;
    }

    const nextItems = [...mediaItems];
    [nextItems[index], nextItems[targetIndex]] = [nextItems[targetIndex], nextItems[index]];
    await reorderMediaItemsAction(nextItems);
  };

  const setCoverImage = async (mediaId: string) => {
    await setCoverMediaAction(mediaId);
  };

  const updateImageAltText = (imageClientId: string, languageCode: string, altText: string) => {
    setAltTextDrafts((current) => ({
      ...current,
      [imageClientId]: {
        ...(current[imageClientId] ?? {}),
        [languageCode]: altText,
      },
    }));
  };

  const saveImageAltTexts = async (image: TourMediaItemFormState) => {
    const altTexts = altTextDrafts[image.clientId] ?? {};
    await updateMediaAltTextsAction({
      mediaId: image.mediaId,
      altTexts,
    });
  };

  const toggleSelectedMediaId = (mediaId: string) => {
    setSelectedMediaIds((currentIds) =>
      currentIds.includes(mediaId)
        ? currentIds.filter((id) => id !== mediaId)
        : [...currentIds, mediaId],
    );
  };

  const addSelectedMediaToTour = async () => {
    const selectedIds = selectedMediaIds.filter((mediaId) => !attachedMediaIds.has(mediaId));
    if (selectedIds.length === 0) {
      return;
    }

    const didAttach = await attachMediaItemsAction(selectedIds);
    if (!didAttach) {
      return;
    }

    setSelectedMediaIds([]);
    setIsMediaDialogOpen(false);
  };

  const handleMediaSearchSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextSearch = mediaSearchInput.trim();
    setAppliedMediaSearch(nextSearch);
    void loadMediaPage({
      page: 1,
      search: nextSearch,
      append: false,
    });
  };

  const handleUploadInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    const uploadableFiles: File[] = [];
    const localErrors: string[] = [];

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        localErrors.push(`${ file.name }: only image files are supported.`);
        return;
      }

      if (file.size > TOUR_IMAGE_UPLOAD_MAX_SIZE) {
        localErrors.push(`${ file.name }: exceeds the ${ TOUR_IMAGE_UPLOAD_MAX_SIZE } byte limit.`);
        return;
      }

      uploadableFiles.push(file);
    });

    if (uploadableFiles.length === 0) {
      setMediaDialogError(localErrors.join(" "));
      return;
    }

    setIsUploadingMedia(true);
    setMediaDialogError(null);

    try {
      const result = await uploadMediaFilesAction(uploadableFiles);
      const uploadedAssets = result.uploaded.map(toLibraryAssetFromUploadedAsset);

      setMediaLibraryItems((currentItems) => {
        const deduplicatedItems = new Map([
          ...uploadedAssets.map((item) => [item.id, item] as const),
          ...currentItems.map((item) => [item.id, item] as const),
        ]);
        return [...deduplicatedItems.values()];
      });
      setMediaLibraryTotal((currentTotal) => currentTotal + uploadedAssets.length);
      setSelectedMediaIds((currentIds) => [
        ...new Set([...currentIds, ...uploadedAssets.map((item) => item.id)]),
      ]);

      const allErrors = [...localErrors, ...result.errors];
      setMediaDialogError(allErrors.length > 0 ? allErrors.join(" ") : null);
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleTourTypeChange = (value: string) => {
    const tourType = value as TourType;
    updateFormStateAction("tourType", tourType);

    if (tourType === "tip_based") {
      updateFormStateAction("hasPrice", false);
    }
  };

  return (
    <div className="space-y-8">
      <section className={ sectionClassName }>
        <h2 className="mb-6 text-lg font-semibold text-[#21343b]">Basic Information</h2>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-medium text-foreground">Tour Name</label>
            <Input
              value={ formState.name }
              onChange={ (event) => updateFormStateAction("name", event.target.value) }
              placeholder="Enter tour name"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">URL Slug</label>
            <Input
              value={ formState.slug }
              onChange={ (event) => updateFormStateAction("slug", event.target.value) }
              placeholder={ generatedSlug || "tour-url-slug" }
              className="h-11 font-mono text-sm"
            />
            { !formState.slug && generatedSlug ? (
              <p className="text-xs text-muted-foreground">
                Will use: <span className="font-mono">{ generatedSlug }</span>
              </p>
            ) : null }
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tour Type</label>
            <select
              value={ formState.tourType }
              onChange={ (event) => handleTourTypeChange(event.target.value) }
              className={ warmSelectClassName }
            >
              { TOUR_TYPE_OPTIONS.map((tourType) => (
                <option key={ tourType } value={ tourType }>
                  { formatLabel(tourType) }
                </option>
              )) }
            </select>
          </div>
        </div>
      </section>

      { !isCreated ? (
        <section className="rounded-[1.5rem] border border-dashed border-[#d8c5a8] bg-[#fcfaf6] p-6">
          <h2 className="text-lg font-semibold text-[#21343b]">Complete Initial Setup</h2>
          <p className="mt-2 text-sm text-[#627176]">
            Save the tour after entering Basic Information to unlock the remaining
            settings and tabs.
          </p>
        </section>
      ) : null }

      { isCreated ? (
        <>

          <section className={ sectionClassName }>
            <h2 className="mb-6 text-lg font-semibold text-[#21343b]">Tour Metrics</h2>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className={ subCardClassName }>
                <label className="text-sm font-medium text-foreground flex">
                  <Clock className="size-4"/>
                  <span className="text-xs font-medium uppercase tracking-wide ml-2">Duration</span>
                </label>
                <div className="flex items-baseline gap-2">
                  <Input
                    type="text"
                    value={ formState.durationMinutes }
                    onChange={ (event) =>
                      updateFormStateAction(
                        "durationMinutes",
                        normalizePositiveIntegerInput(event.target.value),
                      )
                    }
                    className="h-9 text-lg font-semibold"
                    inputMode="numeric"
                    pattern="[1-9][0-9]*"
                    placeholder="90"
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </div>

              <div className={ subCardClassName }>
                <label className="text-sm font-medium text-foreground flex">
                  <Star className="size-4"/>
                  <span className="text-xs font-medium uppercase tracking-wide ml-2">Rating</span>
                </label>
                <div className="flex items-baseline gap-2">
                  <Input
                    type="number"
                    value={ formState.rating }
                    onChange={ (event) => updateFormStateAction("rating", event.target.value) }
                    className="h-9 text-lg font-semibold"
                    min={ 1 }
                    max={ 5 }
                    step={ 0.1 }
                  />
                  <span className="text-sm text-muted-foreground">/5</span>
                </div>
              </div>

              <div className={ subCardClassName }>
                <label className="text-sm font-medium text-foreground flex">
                  <Star className="size-4"/>
                  <span className="text-xs font-medium uppercase tracking-wide ml-2">Reviews</span>
                </label>
                <Input
                  type="text"
                  value={ formState.reviewCount }
                  onChange={ (event) =>
                    updateFormStateAction(
                      "reviewCount",
                      normalizePositiveIntegerInput(event.target.value),
                    )
                  }
                  className="h-9 text-lg font-semibold"
                  inputMode="numeric"
                  pattern="[1-9][0-9]*"
                  placeholder="120"
                />
              </div>
            </div>
          </section>

          <section className={ sectionClassName }>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 max-[520px]:items-stretch">
              <div>
                <h2 className="text-lg font-semibold text-[#21343b]">Media Gallery</h2>
                <p className="mt-1 text-sm text-[#627176]">
                  Attach uploaded images, choose the cover, and edit localized alt text.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={ openMediaDialog }
                disabled={ isMutating }
                className="border-[#d8c5a8] bg-[#fbf7f0] text-[#7a5424] hover:bg-[#f4ebde] max-[520px]:w-full"
              >
                <Upload className="size-4"/>
                Add Images
              </Button>
            </div>

            { mediaItems.length === 0 ? (
              <div
                className="rounded-[1.25rem] border-2 border-dashed border-[#d8c5a8] bg-[#fcfaf6] px-6 py-10 text-center text-[#627176]">
                <ImageIcon className="mx-auto mb-3 size-10 text-[#8f7e67] opacity-80"/>
                <p className="text-sm">No images attached yet.</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={ openMediaDialog }
                  className="mt-4 border-[#d8c5a8] bg-white text-[#7a5424] hover:bg-[#f4ebde]"
                  disabled={ isMutating }
                >
                  <Upload className="size-4"/>
                  Add your first image
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                { mediaItems.map((image, index) => (
                  <div
                    key={ image.clientId }
                    className={ cn(
                      "overflow-hidden rounded-[1.25rem] border transition-all shadow-[0_8px_22px_rgba(42,36,25,0.04)]",
                      image.isCover ? "border-[#d5b588] ring-2 ring-[#ead7b8]" : "border-[#efe4d5] bg-[#fffcf7]",
                    ) }
                  >
                    <div className="flex flex-col gap-4 p-3 sm:flex-row sm:items-start">
                      <div
                        className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] bg-[#f3ede4] max-[520px]:h-40 max-[520px]:w-full">
                        { mediaPreviewStatus[image.mediaId]?.previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={ mediaPreviewStatus[image.mediaId]?.previewUrl ?? "" }
                            alt={ image.altTexts[enabledLanguages[0]?.code ?? ""] ?? "" }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="size-8 text-[#9b8a73]"/>
                        ) }
                        { image.isCover ? (
                          <div
                            className="absolute top-1 left-1 rounded-full bg-[#9a6a2f] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                            Cover
                          </div>
                        ) : null }
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex items-start justify-between gap-3 max-[520px]:flex-col">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[#21343b]">Image { index + 1 }</p>
                            <p className="truncate text-xs text-[#627176]">{ image.originalFilename }</p>
                            <p className="truncate text-xs text-[#8b7862]">{ image.storagePath }</p>
                          </div>

                          <div className="flex shrink-0 flex-wrap items-center gap-1.5 max-[520px]:justify-start">
                            <button
                              type="button"
                              onClick={ () => {
                                void moveImage(image.clientId, "up");
                              } }
                              className="rounded-xl p-1.5 text-[#627176] transition-colors hover:bg-[#f2eadf] disabled:opacity-40"
                              title="Move image up"
                              disabled={ index === 0 || isMutating }
                            >
                              <ArrowUp className="size-4"/>
                            </button>
                            <button
                              type="button"
                              onClick={ () => {
                                void moveImage(image.clientId, "down");
                              } }
                              className="rounded-xl p-1.5 text-[#627176] transition-colors hover:bg-[#f2eadf] disabled:opacity-40"
                              title="Move image down"
                              disabled={ index === mediaItems.length - 1 || isMutating }
                            >
                              <ArrowDown className="size-4"/>
                            </button>
                            <button
                              type="button"
                              onClick={ () => {
                                void setCoverImage(image.mediaId);
                              } }
                              className={ cn(
                                "rounded-md p-1.5 transition-colors",
                                image.isCover
                                  ? "bg-[#21343b] text-white"
                                  : "text-[#627176] hover:bg-[#f2eadf]",
                              ) }
                              title={ image.isCover ? "Current cover" : "Set as cover" }
                              disabled={ isMutating }
                            >
                              <Check className="size-4"/>
                            </button>
                            <button
                              type="button"
                              onClick={ () =>
                                setExpandedImageId(expandedImageId === image.clientId ? null : image.clientId)
                              }
                              className="rounded-xl p-1.5 text-[#627176] transition-colors hover:bg-[#f2eadf]"
                              title="Edit media details"
                            >
                              { expandedImageId === image.clientId ? (
                                <ChevronUp className="size-4"/>
                              ) : (
                                <ChevronDown className="size-4"/>
                              ) }
                            </button>
                            <button
                              type="button"
                              onClick={ () => {
                                void removeImage(image.mediaId, image.clientId);
                              } }
                              className="rounded-xl p-1.5 text-[#b3574a] transition-colors hover:bg-[#fbf2f0]"
                              title="Remove image"
                              disabled={ isMutating }
                            >
                              <X className="size-4"/>
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#627176]">
                          <span className="rounded-full bg-[#f4ede3] px-2.5 py-1 font-medium text-[#6a5743]">
                            { formatFileSize(image.size) }
                          </span>
                          <span className="rounded-full bg-[#f4ede3] px-2.5 py-1 font-medium text-[#6a5743]">
                            { image.contentType }
                          </span>
                        </div>

                        { Object.keys(image.altTexts).length > 0 && expandedImageId !== image.clientId ? (
                          <p className="mt-2 truncate text-xs text-[#627176]">
                            Alt: { Object.values(image.altTexts)[0] }
                          </p>
                        ) : null }
                      </div>
                    </div>

                    { expandedImageId === image.clientId ? (
                      <div className="border-t border-[#f0e6d8] bg-[#fcfaf6] p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          { enabledLanguages.map((language) => (
                            <div key={ language.code } className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">
                                { language.name }
                              </label>
                              <Input
                                value={ altTextDrafts[image.clientId]?.[language.code] ?? "" }
                                onChange={ (event) =>
                                  updateImageAltText(image.clientId, language.code, event.target.value)
                                }
                                onBlur={ () => {
                                  void saveImageAltTexts(image);
                                } }
                                placeholder={ `Alt text in ${ language.name }...` }
                                maxLength={ TOUR_MEDIA_ALT_TEXT_MAX_LENGTH }
                                className="h-8 text-sm"
                                disabled={ isMutating }
                              />
                            </div>
                          )) }
                        </div>
                      </div>
                    ) : null }
                  </div>
                )) }
              </div>
            ) }
          </section>

          <Dialog open={ isMediaDialogOpen } onOpenChange={ setIsMediaDialogOpen }>
            <DialogContent className="border border-[#eadfce] bg-[#fffdfa] shadow-[0_30px_80px_rgba(61,45,27,0.14)] sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Select Images</DialogTitle>
                <DialogDescription>
                  Search the media library or upload new images to attach to this tour.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <form className="flex flex-col gap-3 sm:flex-row" onSubmit={ handleMediaSearchSubmit }>
                  <div className="relative min-w-0 flex-1">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"/>
                    <Input
                      value={ mediaSearchInput }
                      onChange={ (event) => setMediaSearchInput(event.target.value) }
                      placeholder="Search by filename or path"
                      className="h-10 pl-9"
                    />
                  </div>
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={ isLoadingMediaLibrary || isUploadingMedia }
                      className="max-[520px]:w-full"
                    >
                    { isLoadingMediaLibrary ? <LoaderCircle className="size-4 animate-spin"/> :
                      <Search className="size-4"/> }
                    Search
                  </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={ () => fileInputRef.current?.click() }
                      disabled={ isUploadingMedia || isMutating }
                      className="max-[520px]:w-full"
                    >
                    { isUploadingMedia ? <LoaderCircle className="size-4 animate-spin"/> :
                      <Upload className="size-4"/> }
                    Upload images
                  </Button>
                  <input
                    ref={ fileInputRef }
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={ (event) => {
                      void handleUploadInputChange(event);
                    } }
                  />
                </form>

                <p className="text-xs text-[#627176]">
                  Only images are supported in the frontend. Maximum file size: { TOUR_IMAGE_UPLOAD_MAX_SIZE } bytes.
                </p>

                { mediaDialogError ? (
                  <div
                    className="rounded-[1rem] border border-[#e8c7c1] bg-[#fbf2f0] px-3 py-2 text-sm text-[#a3483f]">
                    { mediaDialogError }
                  </div>
                ) : null }

                <div className="grid max-h-105 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
                  { mediaLibraryItems.map((asset) => {
                    const isAttached = attachedMediaIds.has(asset.id);
                    const isSelected = selectedMediaIds.includes(asset.id);

                    return (
                      <button
                        key={ asset.id }
                        type="button"
                        disabled={ isAttached }
                        onClick={ () => toggleSelectedMediaId(asset.id) }
                        className={ cn(
                          "overflow-hidden rounded-lg border text-left transition-colors",
                          isSelected ? "border-primary ring-2 ring-primary/20" : "border-border",
                          isSelected ? "border-[#d5b588] ring-2 ring-[#ead7b8]" : "border-[#efe4d5] bg-[#fffcf7]",
                          isAttached ? "cursor-not-allowed opacity-60" : "hover:bg-[#fcf7ef]",
                        ) }
                      >
                        <div className="relative aspect-4/3 bg-[#f3ede4]">
                          { mediaPreviewStatus[asset.id]?.previewUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={ mediaPreviewStatus[asset.id]?.previewUrl ?? "" }
                              alt={ asset.originalFilename }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <ImageIcon className="size-8 text-[#9b8a73]"/>
                            </div>
                          ) }
                          <div className="absolute top-2 left-2 flex gap-2">
                            { isAttached ? (
                              <span
                                className="rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#21343b]">
                                Attached
                              </span>
                            ) : null }
                            { isSelected ? (
                              <span
                                className="rounded-full bg-[#9a6a2f] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white">
                                Selected
                              </span>
                            ) : null }
                          </div>
                        </div>
                        <div className="space-y-1 p-3">
                          <p className="truncate text-sm font-medium text-foreground">{ asset.originalFilename }</p>
                          <p className="truncate text-xs text-muted-foreground">{ asset.storagePath }</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{ formatFileSize(asset.size) }</span>
                            <span>{ asset.contentType }</span>
                          </div>
                        </div>
                      </button>
                    );
                  }) }
                </div>

                { !isLoadingMediaLibrary && mediaLibraryItems.length === 0 ? (
                  <div
                    className="rounded-[1.25rem] border border-dashed border-[#d8c5a8] bg-[#fcfaf6] px-6 py-10 text-center text-[#627176]">
                    No images found for this search.
                  </div>
                ) : null }

                { mediaLibraryItems.length < mediaLibraryTotal ? (
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={ () =>
                        void loadMediaPage({
                          page: mediaLibraryPage + 1,
                          search: appliedMediaSearch,
                          append: true,
                        })
                      }
                      disabled={ isLoadingMediaLibrary }
                    >
                      { isLoadingMediaLibrary ? <LoaderCircle className="size-4 animate-spin"/> : null }
                      Load more
                    </Button>
                  </div>
                ) : null }
              </div>

              <DialogFooter className="max-[520px]:gap-2">
                <Button type="button" variant="outline" onClick={ () => setIsMediaDialogOpen(false) } className="max-[520px]:w-full">
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={ () => {
                    void addSelectedMediaToTour();
                  } }
                  disabled={
                    isMutating || selectedMediaIds.filter((mediaId) => !attachedMediaIds.has(mediaId)).length === 0
                  }
                  className="max-[520px]:w-full"
                >
                  Add selected images
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <section className={ sectionClassName }>
            <h2 className="mb-6 text-lg font-semibold text-[#21343b]">Pricing</h2>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
              <label className="flex items-center gap-3 md:self-center">
                <input
                  type="checkbox"
                  checked={ formState.hasPrice }
                  onChange={ (event) => updateFormStateAction("hasPrice", event.target.checked) }
                  className="size-5 rounded border-input accent-primary"
                  disabled={ formState.tourType === "tip_based" }
                />
                <span className="text-sm font-medium text-foreground">Fixed Price</span>
              </label>

              { formState.hasPrice && formState.tourType !== "tip_based" ? (
                <div className="flex flex-1 flex-col gap-3 md:max-w-lg">
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px] max-[520px]:grid-cols-1">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Amount</label>
                      <div className="relative">
                        <DollarSign
                          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"/>
                        <Input
                          type="number"
                          value={ formState.priceAmount }
                          onChange={ (event) => updateFormStateAction("priceAmount", event.target.value) }
                          className="h-11 pl-9"
                          placeholder="0.00"
                          step={ 0.01 }
                          min={ 0 }
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Currency</label>
                      <select
                        value={ formState.priceCurrency }
                        onChange={ (event) => updateFormStateAction("priceCurrency", event.target.value) }
                        className={ warmSelectClassName }
                      >
                        { PRICE_CURRENCY_OPTIONS.map((currency) => (
                          <option key={ currency } value={ currency }>
                            { currency }
                          </option>
                        )) }
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Fixed-price tours currently support DKK and EUR.
                  </p>
                </div>
              ) : null }

              { formState.tourType === "tip_based" ? (
                <span className="text-sm italic text-muted-foreground">
              Tip-based tours do not have a fixed price.
            </span>
              ) : null }
            </div>
          </section>

          <section className={ sectionClassName }>
            <h2 className="mb-6 text-lg font-semibold text-[#21343b]">Start & End Points</h2>

            <div className="grid gap-6 md:grid-cols-2">
              <div className={ subCardClassName }>
                <label className="text-sm font-medium text-foreground flex items-center">
                  <div className="flex size-8 items-center justify-center rounded-full bg-green-700/10">
                    <MapPin className="size-4 text-green-700"/>
                  </div>
                  <span className="font-medium text-foreground ml-2">Start Point</span>
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Latitude</label>
                    <Input
                      type="number"
                      value={ formState.startPointLat }
                      onChange={ (event) => updateFormStateAction("startPointLat", event.target.value) }
                      step="any"
                      className="h-9 font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Longitude</label>
                    <Input
                      type="number"
                      value={ formState.startPointLng }
                      onChange={ (event) => updateFormStateAction("startPointLng", event.target.value) }
                      step="any"
                      className="h-9 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className={ subCardClassName }>
                <label className="text-sm font-medium text-foreground flex items-center">
                  <div className="flex size-8 items-center justify-center rounded-full bg-destructive/10">
                    <Flag className="size-4 text-destructive"/>
                  </div>
                  <span className="font-medium text-foreground ml-2">End Point</span>
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Latitude</label>
                    <Input
                      type="number"
                      value={ formState.endPointLat }
                      onChange={ (event) => updateFormStateAction("endPointLat", event.target.value) }
                      step="any"
                      className="h-9 font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Longitude</label>
                    <Input
                      type="number"
                      value={ formState.endPointLng }
                      onChange={ (event) => updateFormStateAction("endPointLng", event.target.value) }
                      step="any"
                      className="h-9 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={ sectionClassName }>
            <h2 className="mb-2 text-lg font-semibold text-[#21343b]">Tags</h2>
            <p className="mb-4 text-sm text-[#627176]">
              Select the tags that describe this tour.
            </p>

            <div className="flex flex-wrap gap-2">
              { availableTags.map((tag) => {
                const isSelected = formState.tagKeys.includes(tag.key);

                return (
                  <button
                    key={ tag.key }
                    type="button"
                    onClick={ () =>
                      updateFormStateAction(
                        "tagKeys",
                        isSelected
                          ? formState.tagKeys.filter((key) => key !== tag.key)
                          : [...formState.tagKeys, tag.key],
                      )
                    }
                    className={ cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer",
                      isSelected
                        ? "border border-[#d9c3a2] bg-[#f3e5cf] text-[#8a6029]"
                        : "border border-[#eadfce] bg-[#fbf7f0] text-[#627176] hover:bg-[#f4ebde] hover:text-[#21343b]",
                    ) }
                  >
                    { tag.key }
                  </button>
                );
              }) }
            </div>
          </section>
        </>
      ) : null }
    </div>
  );
}
