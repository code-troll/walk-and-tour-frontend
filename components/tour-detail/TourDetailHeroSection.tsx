"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, MapPin, Star } from "lucide-react";
import { RowsPhotoAlbum, type Photo } from "react-photo-album";
import "react-photo-album/rows.css";

type TourDetailHeroSectionProps = {
  title: string;
  tag: string;
  rating: string;
  reviews: string;
  duration: string;
  location: string;
  tourImages: string[];
};

const FALLBACK_WIDTH = 1600;
const FALLBACK_HEIGHT = 1067;
const MOBILE_ALBUM_MAX_HEIGHT = 420;
const DESKTOP_ALBUM_MAX_HEIGHT = 560;
const DEFAULT_TARGET_ROW_HEIGHT = 290;
const MIN_TARGET_ROW_HEIGHT = 90;
const ALBUM_SPACING = 6;
const MOBILE_BREAKPOINT_QUERY = "(min-width: 768px)";

const resolveImageDimensions = (src: string): Promise<{ width: number; height: number }> => {
  if (typeof window === "undefined") {
    return Promise.resolve({width: FALLBACK_WIDTH, height: FALLBACK_HEIGHT});
  }

  return new Promise((resolve) => {
    const image = new window.Image();

    image.onload = () => {
      resolve({
        width: image.naturalWidth || FALLBACK_WIDTH,
        height: image.naturalHeight || FALLBACK_HEIGHT,
      });
    };

    image.onerror = () => {
      resolve({width: FALLBACK_WIDTH, height: FALLBACK_HEIGHT});
    };

    image.src = src;
  });
};

const estimateAlbumHeight = (totalAspectRatio: number, containerWidth: number, targetRowHeight: number): number => {
  const rows = Math.max(1, Math.ceil((totalAspectRatio * targetRowHeight) / containerWidth));
  return rows * targetRowHeight + Math.max(0, rows - 1) * ALBUM_SPACING;
};

export default function TourDetailHeroSection({
                                                title,
                                                tag,
                                                rating,
                                                reviews,
                                                duration,
                                                location,
                                                tourImages,
                                              }: TourDetailHeroSectionProps) {
  const imageSources = useMemo(
    () => Array.from(new Set(tourImages.filter((src) => Boolean(src)))),
    [tourImages],
  );
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);
  const [albumContainerWidth, setAlbumContainerWidth] = useState(960);
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);
  const albumContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadPhotos = async () => {
      if (imageSources.length === 0) {
        if (!isCancelled) {
          setPhotos([]);
          setIsLoadingPhotos(false);
        }

        return;
      }

      if (!isCancelled) {
        setIsLoadingPhotos(true);
      }

      const nextPhotos = await Promise.all(
        imageSources.map(async (src, index) => {
          const {width, height} = await resolveImageDimensions(src);
          return {
            src,
            width,
            height,
            alt: `${ title } image ${ index + 1 }`,
          } satisfies Photo;
        }),
      );

      if (isCancelled) {
        return;
      }

      setPhotos(nextPhotos);
      setIsLoadingPhotos(false);
    };

    void loadPhotos();

    return () => {
      isCancelled = true;
    };
  }, [imageSources, title]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQueryList = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    const updateViewport = () => setIsDesktopViewport(mediaQueryList.matches);
    updateViewport();

    mediaQueryList.addEventListener("change", updateViewport);
    return () => {
      mediaQueryList.removeEventListener("change", updateViewport);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !albumContainerRef.current) {
      return undefined;
    }

    const updateWidth = (nextWidth: number) => {
      setAlbumContainerWidth(Math.max(320, Math.round(nextWidth)));
    };

    updateWidth(albumContainerRef.current.clientWidth);

    const resizeObserver = new ResizeObserver((entries) => {
      const [entry] = entries;
      if (!entry) {
        return;
      }

      updateWidth(entry.contentRect.width);
    });

    resizeObserver.observe(albumContainerRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const maxAlbumHeight = isDesktopViewport ? DESKTOP_ALBUM_MAX_HEIGHT : MOBILE_ALBUM_MAX_HEIGHT;
  const targetRowHeight = useMemo(() => {
    if (photos.length === 0) {
      return DEFAULT_TARGET_ROW_HEIGHT;
    }

    const totalAspectRatio = photos.reduce((sum, photo) => sum + photo.width / photo.height, 0);
    if (!Number.isFinite(totalAspectRatio) || totalAspectRatio <= 0) {
      return DEFAULT_TARGET_ROW_HEIGHT;
    }

    const maxRowHeight = Math.min(DEFAULT_TARGET_ROW_HEIGHT, maxAlbumHeight);
    let low = MIN_TARGET_ROW_HEIGHT;
    let high = maxRowHeight;
    let best = MIN_TARGET_ROW_HEIGHT;

    for (let index = 0; index < 24; index += 1) {
      const mid = (low + high) / 2;
      const estimatedHeight = estimateAlbumHeight(totalAspectRatio, albumContainerWidth, mid);

      if (estimatedHeight <= maxAlbumHeight) {
        best = mid;
        low = mid;
      } else {
        high = mid;
      }
    }

    return Math.max(MIN_TARGET_ROW_HEIGHT, Math.round(best));
  }, [albumContainerWidth, maxAlbumHeight, photos]);

  const numericRating = Number.parseFloat(rating);
  const boundedRating = Number.isNaN(numericRating)
    ? 0
    : Math.max(0, Math.min(5, numericRating));
  const filledStars = Math.round(boundedRating);
  const displayRating = Number.isInteger(boundedRating)
    ? `${ boundedRating.toFixed(0) }/5`
    : `${ boundedRating.toFixed(1) }/5`;

  return (
    <section className="bg-[#fcfaf7] pt-12 pb-6 md:pt-16 md:pb-6">
      <div className="mx-auto w-full px-6 lg:px-12">
        <div className="space-y-5">
          <h1 className="text-3xl font-semibold leading-tight text-teal sm:text-4xl">{ title }</h1>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
            <p className="text-base leading-none">
              <span className="font-normal text-[#3d3124]">Type: </span>
              <span className="font-semibold text-[#c24343]">{ tag }</span>
            </p>

            <div className="inline-flex items-center gap-3">
              <span className="text-base font-semibold leading-none text-[#3d3124]">{ displayRating }</span>
              <div className="inline-flex items-center gap-1" aria-hidden="true">
                { Array.from({length: 5}).map((_, index) => (
                  <Star
                    key={ `tour-detail-star-${ index }` }
                    className={ `h-6 w-6 ${ index < filledStars ? "fill-[#f08d33] text-[#f08d33]" : "text-[#e2d2c0]" }` }
                  />
                )) }
              </div>
              <span className="text-base leading-none text-[#3d3124]">({ reviews } reviews)</span>
            </div>

            <div className="inline-flex items-center gap-2 text-base leading-none text-[#3d3124]">
              <CalendarDays className="h-6 w-6 text-[#c24343]"/>
              <span>{ duration }</span>
            </div>

            <div className="inline-flex items-center gap-2 text-base leading-none text-[#3d3124]">
              <MapPin className="h-6 w-6 text-[#c24343]"/>
              <span>{ location }</span>
            </div>
          </div>
        </div>
        <div className="mt-7">
          <div
            className="overflow-hidden rounded-[1.75rem] bg-[#fcfaf7]">
            <div
              ref={ albumContainerRef }
              className="max-overflow-hidden rounded-[1.25rem] bg-[#fcfaf7]"
            >
              { isLoadingPhotos ? (
                <div className="w-full animate-pulse rounded-[1.25rem] bg-[#efe8de]"/>
              ) : photos.length > 0 ? (
                <RowsPhotoAlbum
                  photos={ photos }
                  spacing={ ALBUM_SPACING }
                  targetRowHeight={ targetRowHeight }
                  defaultContainerWidth={ albumContainerWidth }
                  componentsProps={ {
                    container: {
                      className: "bg-[#fcfaf7]",
                    },
                    wrapper: {
                      className: "group overflow-hidden rounded-[0.85rem]",
                    },
                    image: {
                      className: "transition-transform duration-500 ease-out will-change-transform group-hover:scale-[1.04] group-hover:brightness-[1.04]",
                    },
                  } }
                />
              ) : (
                <div className="w-full rounded-[1.25rem] bg-[#efe8de]"/>
              ) }
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
