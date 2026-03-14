"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  TOUR_MEDIA_ALT_TEXT_MAX_LENGTH,
  TOUR_MEDIA_REF_MAX_LENGTH,
  TOUR_TYPE_OPTIONS,
  createEmptyGalleryImageFormState,
  generateTourSlug,
  type ApiLanguage,
  type ApiTag,
  type TourFormState,
  type TourGalleryImageFormState,
  type TourType,
} from "@/lib/tours/admin-tour-form";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign, Flag,
  ImageIcon,
  ImagePlus,
  MapPin,
  Star,
  X,
} from "lucide-react";

type GeneralSectionProps = {
  formState: TourFormState;
  isCreated: boolean;
  updateFormStateAction: <K extends keyof TourFormState>(key: K, value: TourFormState[K]) => void;
  updateGalleryImagesAction: (galleryImages: TourGalleryImageFormState[]) => void;
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
  const normalizedValue = digitsOnly.replace(/^0+/, "");

  return normalizedValue;
};

const PRICE_CURRENCY_OPTIONS = ["DKK", "EUR"] as const;

export function GeneralSection({
                                 formState,
                                 isCreated,
                                 updateFormStateAction,
                                 updateGalleryImagesAction,
                                 availableTags,
                                 availableLanguages,
                               }: GeneralSectionProps) {
  const generatedSlug = generateTourSlug(formState.name);
  const [expandedImageId, setExpandedImageId] = useState<string | null>(null);

  const enabledLanguages = availableLanguages.filter((language) => language.isEnabled);
  const galleryImages = formState.galleryImages;

  const setImages = (updater: (images: TourGalleryImageFormState[]) => TourGalleryImageFormState[]) => {
    updateGalleryImagesAction(updater(galleryImages));
  };

  const addImage = () => {
    updateGalleryImagesAction([
      ...galleryImages,
      createEmptyGalleryImageFormState(galleryImages.length === 0),
    ]);
  };

  const removeImage = (imageId: string) => {
    setImages((images) => {
      const nextImages = images.filter((image) => image.id !== imageId);
      if (nextImages.length > 0 && !nextImages.some((image) => image.isCover)) {
        nextImages[0] = {
          ...nextImages[0],
          isCover: true,
        };
      }

      return nextImages;
    });

    if (expandedImageId === imageId) {
      setExpandedImageId(null);
    }
  };

  const setCoverImage = (imageId: string) => {
    setImages((images) =>
      images.map((image) => ({
        ...image,
        isCover: image.id === imageId,
      })),
    );
  };

  const updateImageRef = (imageId: string, ref: string) => {
    setImages((images) =>
      images.map((image) => (image.id === imageId ? {...image, ref} : image)),
    );
  };

  const updateImageAltText = (imageId: string, languageCode: string, altText: string) => {
    setImages((images) =>
      images.map((image) =>
        image.id === imageId
          ? {
            ...image,
            altTexts: {
              ...image.altTexts,
              [languageCode]: altText,
            },
          }
          : image,
      ),
    );
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
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Basic Information</h2>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
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
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
        <section className="rounded-xl border border-dashed border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Complete Initial Setup</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Save the tour after entering Basic Information to unlock the remaining
            settings and tabs.
          </p>
        </section>
      ) : null }

      { isCreated ? (
        <>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-6 text-lg font-semibold text-foreground">Tour Metrics</h2>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-3 rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-4"/>
                  <span className="text-xs font-medium uppercase tracking-wide">Duration</span>
                </div>
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

              <div className="space-y-3 rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Star className="size-4"/>
                  <span className="text-xs font-medium uppercase tracking-wide">Rating</span>
                </div>
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

              <div className="space-y-3 rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Star className="size-4"/>
                  <span className="text-xs font-medium uppercase tracking-wide">Reviews</span>
                </div>
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

          <section className="rounded-xl border border-border bg-card p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Media Gallery</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage the cover and gallery media references that are stored with the tour.
                </p>
              </div>

              <button
                type="button"
                onClick={ addImage }
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <ImagePlus className="size-4"/>
                Add Image
              </button>
            </div>

            { galleryImages.length === 0 ? (
              <div
                className="rounded-lg border-2 border-dashed border-border px-6 py-10 text-center text-muted-foreground">
                <ImageIcon className="mx-auto mb-3 size-10 opacity-60"/>
                <p className="text-sm">No media assets configured yet.</p>
                <button
                  type="button"
                  onClick={ addImage }
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <ImagePlus className="size-4"/>
                  Add your first image
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                { galleryImages.map((image, index) => (
                  <div
                    key={ image.id }
                    className={ cn(
                      "overflow-hidden rounded-lg border transition-all",
                      image.isCover ? "border-primary ring-2 ring-primary/20" : "border-border",
                    ) }
                  >
                    <div className="flex items-start gap-4 p-3">
                      <div
                        className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                        { image.ref ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={ image.ref }
                            alt={ image.altTexts[enabledLanguages[0]?.code ?? ""] ?? "" }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="size-8 text-muted-foreground"/>
                        ) }
                        { image.isCover ? (
                          <div
                            className="absolute top-1 left-1 rounded bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                            Cover
                          </div>
                        ) : null }
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">Image { index + 1 }</p>
                            <p className="truncate text-xs text-muted-foreground">
                              { image.ref || "Set a media reference to preview or save this image." }
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={ () => setCoverImage(image.id) }
                              className={ cn(
                                "rounded-md p-1.5 transition-colors",
                                image.isCover
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:bg-muted",
                              ) }
                              title={ image.isCover ? "Current cover" : "Set as cover" }
                            >
                              <Check className="size-4"/>
                            </button>
                            <button
                              type="button"
                              onClick={ () =>
                                setExpandedImageId(expandedImageId === image.id ? null : image.id)
                              }
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                              title="Edit media details"
                            >
                              { expandedImageId === image.id ? (
                                <ChevronUp className="size-4"/>
                              ) : (
                                <ChevronDown className="size-4"/>
                              ) }
                            </button>
                            <button
                              type="button"
                              onClick={ () => removeImage(image.id) }
                              className="rounded-md p-1.5 text-destructive transition-colors hover:bg-destructive/10"
                              title="Remove image"
                            >
                              <X className="size-4"/>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Media
                            Reference</label>
                          <Input
                            value={ image.ref }
                            onChange={ (event) => updateImageRef(image.id, event.target.value) }
                            placeholder="media/tours/historic-center/cover.jpg"
                            maxLength={ TOUR_MEDIA_REF_MAX_LENGTH }
                            className="h-9 font-mono text-sm"
                          />
                        </div>

                        { Object.keys(image.altTexts).length > 0 && expandedImageId !== image.id ? (
                          <p className="mt-2 truncate text-xs text-muted-foreground">
                            Alt: { Object.values(image.altTexts)[0] }
                          </p>
                        ) : null }
                      </div>
                    </div>

                    { expandedImageId === image.id ? (
                      <div className="border-t border-border bg-muted/30 p-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          { enabledLanguages.map((language) => (
                            <div key={ language.code } className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">
                                { language.name }
                              </label>
                              <Input
                                value={ image.altTexts[language.code] || "" }
                                onChange={ (event) =>
                                  updateImageAltText(image.id, language.code, event.target.value)
                                }
                                placeholder={ `Alt text in ${ language.name }...` }
                                maxLength={ TOUR_MEDIA_ALT_TEXT_MAX_LENGTH }
                                className="h-8 text-sm"
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

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-6 text-lg font-semibold text-foreground">Pricing</h2>

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
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
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
                        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
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

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-6 text-lg font-semibold text-foreground">Start & End Points</h2>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4 rounded-lg border border-border p-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-green-700/10">
                    <MapPin className="size-4 text-green-700"/>
                  </div>
                  <span className="font-medium text-foreground">Start Point</span>
                </div>

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

              <div className="space-y-4 rounded-lg border border-border p-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-destructive/10">
                    <Flag className="size-4 text-destructive"/>
                  </div>
                  <span className="font-medium text-foreground">End Point</span>
                </div>

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

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-2 text-lg font-semibold text-foreground">Tags</h2>
            <p className="mb-4 text-sm text-muted-foreground">
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
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80",
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
