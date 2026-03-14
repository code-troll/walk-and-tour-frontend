"use client";

import type { CSSProperties, ComponentType, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from "react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Extension, Mark, mergeAttributes, Node } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/react";
import { EditorContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import { history } from "@tiptap/pm/history";
import {
  Bold,
  Film,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  RemoveFormatting,
  Settings2,
} from "lucide-react";
import ImageResize from "tiptap-extension-resize-image";
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
import { cn } from "@/lib/utils";

export type TiptapHtmlEditorHandle = {
  insertImage: (args: {
    alt: string;
    mediaId: string;
    src: string;
    storagePath: string;
  }) => void;
};

type SupportedVideoProvider = "youtube" | "vimeo";
type ImageAlignment = "left" | "center" | "right";
type VideoAlignment = "left" | "center" | "right";
type VideoAspectRatio = "21:9" | "16:9" | "4:3" | "1:1";
type VideoWidthPreset = "small" | "medium" | "wide" | "full";

const IMAGE_ALIGNMENT_OPTIONS: Array<{ label: string; value: ImageAlignment }> = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
];
const IMAGE_MIN_WIDTH = 120;
const IMAGE_MAX_WIDTH = 960;

const VIDEO_ALIGNMENT_OPTIONS: Array<{ label: string; value: VideoAlignment }> = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
];

const VIDEO_RATIO_OPTIONS: Array<{ label: string; value: VideoAspectRatio }> = [
  { label: "21:9", value: "21:9" },
  { label: "16:9", value: "16:9" },
  { label: "4:3", value: "4:3" },
  { label: "1:1", value: "1:1" },
];

const VIDEO_WIDTH_OPTIONS: Array<{ label: string; value: VideoWidthPreset }> = [
  { label: "S", value: "small" },
  { label: "M", value: "medium" },
  { label: "W", value: "wide" },
  { label: "Full", value: "full" },
];

const toInternalAdminMediaSrc = (value: string) => {
  if (!value) {
    return value;
  }

  try {
    const url = value.startsWith("http://") || value.startsWith("https://")
      ? new URL(value)
      : new URL(value, "http://local.invalid");

    if (url.pathname.startsWith("/api/internal/admin/")) {
      return `${ url.pathname }${ url.search }`;
    }

    if (url.pathname.startsWith("/api/admin/")) {
      return `/api/internal/admin/${ url.pathname.replace(/^\/api\/admin\//, "") }${ url.search }`;
    }
  } catch {
    return value;
  }

  return value;
};

const normalizeHostname = (hostname: string) =>
  hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");

const normalizeVideoUrlInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${ trimmed.replace(/^\/+/, "") }`;
};

const parseYouTubeVideoId = (url: URL) => {
  const hostname = normalizeHostname(url.hostname);

  if (hostname === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0] ?? null;
  }

  if (hostname !== "youtube.com" && hostname !== "youtube-nocookie.com") {
    return null;
  }

  if (url.pathname === "/watch") {
    return url.searchParams.get("v");
  }

  const pathSegments = url.pathname.split("/").filter(Boolean);

  if (pathSegments[0] === "embed" || pathSegments[0] === "shorts" || pathSegments[0] === "live") {
    return pathSegments[1] ?? null;
  }

  return null;
};

const parseVimeoVideoId = (url: URL) => {
  const hostname = normalizeHostname(url.hostname);
  const pathSegments = url.pathname.split("/").filter(Boolean);

  if (hostname === "player.vimeo.com" && pathSegments[0] === "video") {
    return pathSegments[1] ?? null;
  }

  if (hostname === "vimeo.com") {
    return pathSegments[0] ?? null;
  }

  return null;
};

const toSupportedVideoProvider = (value: string | null | undefined): SupportedVideoProvider | null => {
  if (value === "youtube" || value === "vimeo") {
    return value;
  }

  return null;
};

const toImageAlignment = (value: string | null | undefined): ImageAlignment => {
  if (value === "left" || value === "center" || value === "right") {
    return value;
  }

  return "center";
};

const extractWidthFromStyle = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const match = value.match(/width:\s*([^;]+)/i);
  return match?.[1]?.trim() ?? null;
};

const inferImageAlignment = (containerStyle: string | null | undefined, wrapperStyle: string | null | undefined) => {
  const combinedStyle = `${ wrapperStyle ?? "" } ${ containerStyle ?? "" }`.toLowerCase();

  if (combinedStyle.includes("float: right")) {
    return "right" as const;
  }

  if (combinedStyle.includes("float: left")) {
    return "left" as const;
  }

  if (combinedStyle.includes("margin: 0 auto")) {
    return "center" as const;
  }

  if (combinedStyle.includes("margin: 0 0 0 auto")) {
    return "right" as const;
  }

  if (combinedStyle.includes("margin: 0 auto 0 0")) {
    return "left" as const;
  }

  return "center" as const;
};

const getImagePublicStyle = (
  alignmentAttribute: string | null | undefined,
  containerStyle: string | null | undefined,
  wrapperStyle: string | null | undefined,
): CSSProperties => {
  const alignment = alignmentAttribute
    ? toImageAlignment(alignmentAttribute)
    : inferImageAlignment(containerStyle, wrapperStyle);
  const width = extractWidthFromStyle(containerStyle);
  const style: CSSProperties = {
    display: "block",
    height: "auto",
    marginBottom: "1.5rem",
    marginTop: "1.5rem",
    maxWidth: "100%",
    width: width ?? "100%",
  };

  if (!width || width === "100%") {
    style.clear = "both";
  }

  if (alignment === "left") {
    style.float = "left";
    style.marginRight = "1.5rem";
    return style;
  }

  if (alignment === "right") {
    style.float = "right";
    style.marginLeft = "1.5rem";
    return style;
  }

  style.marginLeft = "auto";
  style.marginRight = "auto";
  return style;
};

const getImageContainerStyle = (width: number) =>
  `width: ${ width }px; height: auto; cursor: pointer;`;

const clampImageWidth = (width: number) =>
  Math.min(IMAGE_MAX_WIDTH, Math.max(IMAGE_MIN_WIDTH, width));

const getImageWidthFromAttrs = (attrs: Record<string, unknown>) => {
  const widthFromStyle = extractWidthFromStyle(
    typeof attrs.containerStyle === "string" ? attrs.containerStyle : null,
  );
  if (widthFromStyle?.endsWith("px")) {
    const parsed = Number.parseFloat(widthFromStyle);
    if (!Number.isNaN(parsed)) {
      return clampImageWidth(parsed);
    }
  }

  if (typeof attrs.width === "number" && Number.isFinite(attrs.width)) {
    return clampImageWidth(attrs.width);
  }

  if (typeof attrs.width === "string") {
    const parsed = Number.parseFloat(attrs.width);
    if (!Number.isNaN(parsed)) {
      return clampImageWidth(parsed);
    }
  }

  return 320;
};

const toVideoAlignment = (value: string | null | undefined): VideoAlignment => {
  if (value === "left" || value === "center" || value === "right") {
    return value;
  }

  return "center";
};

const toVideoAspectRatio = (value: string | null | undefined): VideoAspectRatio => {
  if (value === "21:9" || value === "16:9" || value === "4:3" || value === "1:1") {
    return value;
  }

  return "16:9";
};

const toVideoWidthPreset = (value: string | null | undefined): VideoWidthPreset => {
  if (value === "small" || value === "medium" || value === "wide" || value === "full") {
    return value;
  }

  return "wide";
};

const getVideoProviderLabel = (provider: SupportedVideoProvider) =>
  provider === "youtube" ? "YouTube" : "Vimeo";

const getVideoPaddingTop = (aspectRatio: VideoAspectRatio) => {
  switch (aspectRatio) {
    case "21:9":
      return "42.8571428571%";
    case "16:9":
      return "56.25%";
    case "4:3":
      return "75%";
    case "1:1":
      return "100%";
  }
};

const getVideoWidth = (widthPreset: VideoWidthPreset) => {
  switch (widthPreset) {
    case "small":
      return "min(100%, 18rem)";
    case "medium":
      return "min(100%, 24rem)";
    case "wide":
      return "min(100%, 32rem)";
    case "full":
      return "100%";
  }
};

const getVideoContainerStyle = (
  alignment: VideoAlignment,
  aspectRatio: VideoAspectRatio,
  widthPreset: VideoWidthPreset,
): CSSProperties => {
  const resolvedAlignment = widthPreset === "full" ? "center" : alignment;
  const style: CSSProperties = {
    background: "#000",
    borderRadius: "1rem",
    display: "block",
    marginBottom: "1.5rem",
    marginTop: "1.5rem",
    maxWidth: "100%",
    overflow: "hidden",
    paddingTop: getVideoPaddingTop(aspectRatio),
    position: "relative",
    width: getVideoWidth(widthPreset),
  };

  if (widthPreset === "full") {
    style.clear = "both";
  }

  if (resolvedAlignment === "left") {
    style.float = "left";
    style.marginRight = "1.5rem";
    return style;
  }

  if (resolvedAlignment === "right") {
    style.float = "right";
    style.marginLeft = "1.5rem";
    return style;
  }

  style.marginLeft = "auto";
  style.marginRight = "auto";
  return style;
};

const styleObjectToString = (style: CSSProperties) =>
  Object.entries(style)
    .filter((entry): entry is [string, string | number] => entry[1] !== undefined && entry[1] !== null)
    .map(([key, value]) => {
      const cssKey = key.replace(/[A-Z]/g, (character) => `-${ character.toLowerCase() }`);
      return `${ cssKey }:${ value }`;
    })
    .join(";");

const buildVideoEmbedSrc = (provider: SupportedVideoProvider, videoId: string) => {
  if (!videoId) {
    return "";
  }

  return provider === "youtube"
    ? `https://www.youtube.com/embed/${ videoId }`
    : `https://player.vimeo.com/video/${ videoId }`;
};

const parseSupportedVideoUrl = (value: string) => {
  try {
    const url = new URL(normalizeVideoUrlInput(value));

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    const youtubeVideoId = parseYouTubeVideoId(url);
    if (youtubeVideoId) {
      return {
        provider: "youtube" as const,
        title: "YouTube video",
        videoId: youtubeVideoId,
      };
    }

    const vimeoVideoId = parseVimeoVideoId(url);
    if (vimeoVideoId) {
      return {
        provider: "vimeo" as const,
        title: "Vimeo video",
        videoId: vimeoVideoId,
      };
    }
  } catch {
    return null;
  }

  return null;
};

function BlogVideoNodeView({
  editor,
  getPos,
  node,
  selected,
  updateAttributes,
}: NodeViewProps) {
  const provider = toSupportedVideoProvider(node.attrs.provider);
  const videoId = node.attrs.videoId?.trim() ?? "";
  const alignment = toVideoAlignment(node.attrs.alignment);
  const aspectRatio = toVideoAspectRatio(node.attrs.aspectRatio);
  const widthPreset = toVideoWidthPreset(node.attrs.widthPreset);
  const containerStyle = getVideoContainerStyle(alignment, aspectRatio, widthPreset);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const title = node.attrs.title?.trim() || `${ getVideoProviderLabel(provider) } video`;
  const setAlignment = (nextAlignment: VideoAlignment) => {
    updateAttributes({ alignment: nextAlignment });
  };
  const setAspectRatio = (nextAspectRatio: VideoAspectRatio) => {
    updateAttributes({ aspectRatio: nextAspectRatio });
  };
  const setWidthPreset = (nextWidthPreset: VideoWidthPreset) => {
    updateAttributes({
      alignment: nextWidthPreset === "full" ? "center" : alignment,
      widthPreset: nextWidthPreset,
    });
  };
  const isControlsVisible = isMenuOpen;

  useEffect(() => {
    if (!selected) {
      const timeoutId = window.setTimeout(() => {
        setIsMenuOpen(false);
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }
  }, [selected]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  const openMenu = () => {
    const position = typeof getPos === "function" ? getPos() : null;
    if (typeof position === "number") {
      editor.chain().focus().setNodeSelection(position).run();
    }

    setIsMenuOpen(true);
  };

  if (!provider || !videoId) {
    return (
      <NodeViewWrapper
        as="div"
        ref={ rootRef }
        className="my-6 rounded-2xl border border-dashed border-[#eadfce] bg-[#fbf7f0] px-4 py-6 text-center text-sm text-[#8b7862]"
        data-blog-video="true"
        contentEditable={ false }
      >
        Unsupported video embed
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      as="div"
      ref={ rootRef }
      className={ cn(
        "group/video relative shadow-sm",
        selected ? "ring-2 ring-[#d9c3a2] ring-offset-2 ring-offset-white" : "",
      ) }
      data-blog-video="true"
      data-video-alignment={ widthPreset === "full" ? "center" : alignment }
      data-video-ratio={ aspectRatio }
      data-video-id={ videoId }
      data-video-provider={ provider }
      data-video-title={ title }
      data-video-width={ widthPreset }
      contentEditable={ false }
      style={ containerStyle }
    >
      <Button
        type="button"
        size="icon-xs"
        variant="outline"
        aria-label="Video settings"
        className="absolute right-3 top-3 z-30 opacity-100 shadow-sm transition md:opacity-0 md:group-hover/video:opacity-100 md:group-focus-within/video:opacity-100"
        onMouseDown={ (event) => event.preventDefault() }
        onClick={ openMenu }
      >
        <Settings2 className="size-3.5"/>
      </Button>

      { isControlsVisible ? (
        <div className="absolute inset-x-3 top-3 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-[#eadfce] bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center gap-1">
            { VIDEO_ALIGNMENT_OPTIONS.map((option) => (
              <Button
                key={ option.value }
                type="button"
                size="xs"
                variant={
                  (widthPreset === "full" ? option.value === "center" : alignment === option.value)
                    ? "default"
                    : "outline"
                }
                disabled={ widthPreset === "full" && option.value !== "center" }
                className="h-7"
                onMouseDown={ (event) => event.preventDefault() }
                onClick={ () => setAlignment(option.value) }
              >
                { option.label }
              </Button>
            )) }
          </div>
          <div className="flex flex-wrap items-center gap-1">
            { VIDEO_WIDTH_OPTIONS.map((option) => (
              <Button
                key={ option.value }
                type="button"
                size="xs"
                variant={ widthPreset === option.value ? "default" : "outline" }
                className="h-7"
                onMouseDown={ (event) => event.preventDefault() }
                onClick={ () => setWidthPreset(option.value) }
              >
                { option.label }
              </Button>
            )) }
          </div>
          <div className="flex flex-wrap items-center gap-1">
            { VIDEO_RATIO_OPTIONS.map((option) => (
              <Button
                key={ option.value }
                type="button"
                size="xs"
                variant={ aspectRatio === option.value ? "default" : "outline" }
                className="h-7"
                onMouseDown={ (event) => event.preventDefault() }
                onClick={ () => setAspectRatio(option.value) }
              >
                { option.label }
              </Button>
            )) }
          </div>
        </div>
      ) : null }
      <iframe
        title={ title }
        src={ buildVideoEmbedSrc(provider, videoId) }
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </NodeViewWrapper>
  );
}

function BlogImageNodeView({
  editor,
  getPos,
  node,
  selected,
  updateAttributes,
}: NodeViewProps) {
  const src = typeof node.attrs.src === "string" ? toInternalAdminMediaSrc(node.attrs.src) : "";
  const alt = typeof node.attrs.alt === "string" ? node.attrs.alt : "";
  const alignment = toImageAlignment(
    typeof node.attrs.alignment === "string"
      ? node.attrs.alignment
      : inferImageAlignment(
          typeof node.attrs.containerStyle === "string" ? node.attrs.containerStyle : null,
          typeof node.attrs.wrapperStyle === "string" ? node.attrs.wrapperStyle : null,
        ),
  );
  const persistedWidth = getImageWidthFromAttrs(node.attrs);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(persistedWidth);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPreviewWidth(persistedWidth);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [persistedWidth]);

  useEffect(() => {
    if (!selected) {
      const timeoutId = window.setTimeout(() => {
        setIsMenuOpen(false);
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }
  }, [selected]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as globalThis.Node)) {
        return;
      }

      setIsMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  const persistWidth = (nextWidth: number) => {
    const clampedWidth = clampImageWidth(nextWidth);
    updateAttributes({
      containerStyle: getImageContainerStyle(clampedWidth),
      width: clampedWidth,
    });
    setPreviewWidth(clampedWidth);
  };

  const setAlignment = (nextAlignment: ImageAlignment) => {
    updateAttributes({ alignment: nextAlignment });
  };

  const openMenu = () => {
    const position = typeof getPos === "function" ? getPos() : null;
    if (typeof position === "number") {
      editor.chain().focus().setNodeSelection(position).run();
    }

    setIsMenuOpen(true);
  };

  const startResize = (edge: "left" | "right", clientX: number) => {
    const position = typeof getPos === "function" ? getPos() : null;
    if (typeof position === "number") {
      editor.chain().focus().setNodeSelection(position).run();
    }

    const startWidth = previewWidth;

    const finish = () => {
      persistWidth(previewWidthRef.current);
    };

    const previewWidthRef = { current: startWidth };

    const handleMouseMove = (event: MouseEvent) => {
      const delta = edge === "left" ? clientX - event.clientX : event.clientX - clientX;
      const nextWidth = clampImageWidth(startWidth + delta);
      previewWidthRef.current = nextWidth;
      setPreviewWidth(nextWidth);
    };

    const handleMouseUp = () => {
      finish();
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleResizeMouseDown = (edge: "left" | "right") => (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    startResize(edge, event.clientX);
  };

  const handleResizeTouchStart = (edge: "left" | "right") => (event: ReactTouchEvent<HTMLDivElement>) => {
    if (!event.touches[0]) {
      return;
    }

    event.preventDefault();
    const startX = event.touches[0].clientX;
    const startWidth = previewWidth;
    const previewWidthRef = { current: startWidth };

    const position = typeof getPos === "function" ? getPos() : null;
    if (typeof position === "number") {
      editor.chain().focus().setNodeSelection(position).run();
    }

    const handleTouchMove = (moveEvent: TouchEvent) => {
      const touch = moveEvent.touches[0];
      if (!touch) {
        return;
      }

      const delta = edge === "left" ? startX - touch.clientX : touch.clientX - startX;
      const nextWidth = clampImageWidth(startWidth + delta);
      previewWidthRef.current = nextWidth;
      setPreviewWidth(nextWidth);
    };

    const handleTouchEnd = () => {
      persistWidth(previewWidthRef.current);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };

    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
  };

  if (!src) {
    return (
      <NodeViewWrapper
        as="div"
        ref={ rootRef }
        className="my-6 rounded-2xl border border-dashed border-[#eadfce] bg-[#fbf7f0] px-4 py-6 text-center text-sm text-[#8b7862]"
        data-blog-image="true"
        contentEditable={ false }
      >
        Unsupported image
      </NodeViewWrapper>
    );
  }

  const rootStyle: CSSProperties = {
    ...getImagePublicStyle(alignment, getImageContainerStyle(previewWidth), null),
    position: "relative",
  };

  return (
    <NodeViewWrapper
      as="div"
      ref={ rootRef }
      className={ cn(
        "group/image shadow-sm",
        selected ? "ring-2 ring-[#d9c3a2] ring-offset-2 ring-offset-white" : "",
      ) }
      data-blog-image="true"
      data-image-alignment={ alignment }
      data-media-id={ typeof node.attrs.mediaId === "string" ? node.attrs.mediaId : "" }
      data-storage-path={ typeof node.attrs.storagePath === "string" ? node.attrs.storagePath : "" }
      contentEditable={ false }
      style={ rootStyle }
    >
      <Button
        type="button"
        size="icon-xs"
        variant="outline"
        aria-label="Image settings"
        className="absolute right-3 top-3 z-30 opacity-100 shadow-sm transition md:opacity-0 md:group-hover/image:opacity-100 md:group-focus-within/image:opacity-100"
        onMouseDown={ (event) => event.preventDefault() }
        onClick={ openMenu }
      >
        <Settings2 className="size-3.5"/>
      </Button>

      { isMenuOpen ? (
        <div className="absolute inset-x-3 top-3 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-[#eadfce] bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center gap-1">
            { IMAGE_ALIGNMENT_OPTIONS.map((option) => (
              <Button
                key={ option.value }
                type="button"
                size="xs"
                variant={ alignment === option.value ? "default" : "outline" }
                className="h-7"
                onMouseDown={ (event) => event.preventDefault() }
                onClick={ () => setAlignment(option.value) }
              >
                { option.label }
              </Button>
            )) }
          </div>
        </div>
      ) : null }

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ src }
        alt={ alt }
        className="block h-auto max-w-full rounded-2xl"
        style={ { width: `${ previewWidth }px` } }
      />

      <div
        className="absolute bottom-[-6px] left-[-6px] size-4 rounded-full border-2 border-[#6c6c6c] bg-white"
        style={ { cursor: "nwse-resize" } }
        onMouseDown={ handleResizeMouseDown("left") }
        onTouchStart={ handleResizeTouchStart("left") }
      />
      <div
        className="absolute bottom-[-6px] right-[-6px] size-4 rounded-full border-2 border-[#6c6c6c] bg-white"
        style={ { cursor: "nwse-resize" } }
        onMouseDown={ handleResizeMouseDown("right") }
        onTouchStart={ handleResizeTouchStart("right") }
      />
    </NodeViewWrapper>
  );
}

const readVideoEmbedFromElement = (element: HTMLElement) => {
  const providerFromData = toSupportedVideoProvider(element.getAttribute("data-video-provider"));
  const videoIdFromData = element.getAttribute("data-video-id")?.trim();
  const titleFromData = element.getAttribute("data-video-title")?.trim();
  const alignmentFromData = toVideoAlignment(element.getAttribute("data-video-alignment"));
  const aspectRatioFromData = toVideoAspectRatio(
    element.getAttribute("data-video-ratio") ?? element.getAttribute("data-video-aspect-ratio"),
  );
  const widthPresetFromData = toVideoWidthPreset(element.getAttribute("data-video-width"));

  if (providerFromData && videoIdFromData) {
    return {
      alignment: alignmentFromData,
      aspectRatio: aspectRatioFromData,
      provider: providerFromData,
      title: titleFromData || `${ getVideoProviderLabel(providerFromData) } video`,
      videoId: videoIdFromData,
      widthPreset: widthPresetFromData,
    };
  }

  const iframe = element.querySelector("iframe");
  if (!iframe) {
    return null;
  }

  const parsedFromIframe = parseSupportedVideoUrl(iframe.getAttribute("src") ?? "");
  if (!parsedFromIframe) {
    return null;
  }

  return {
    alignment: alignmentFromData,
    aspectRatio: aspectRatioFromData,
    ...parsedFromIframe,
    title: iframe.getAttribute("title")?.trim() || parsedFromIframe.title,
    widthPreset: widthPresetFromData,
  };
};

const Document = Node.create({
  name: "doc",
  topNode: true,
  content: "block+",
});

const Text = Node.create({
  name: "text",
  group: "inline",
});

const Paragraph = Node.create({
  name: "paragraph",
  group: "block",
  content: "inline*",
  parseHTML() {
    return [{ tag: "p" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["p", mergeAttributes(HTMLAttributes), 0];
  },
});

const Heading = Node.create({
  name: "heading",
  group: "block",
  content: "inline*",
  defining: true,
  addAttributes() {
    return {
      level: {
        default: 2,
        parseHTML: (element) => {
          const match = /^H([1-6])$/.exec(element.tagName);
          return match ? Number(match[1]) : 2;
        },
      },
    };
  },
  parseHTML() {
    return [1, 2, 3].map((level) => ({
      tag: `h${ level }`,
      attrs: { level },
    }));
  },
  renderHTML({ HTMLAttributes }) {
    const level = Number(HTMLAttributes.level ?? 2);
    const attributes = { ...HTMLAttributes };
    delete attributes.level;
    return [`h${ level }`, mergeAttributes(attributes), 0];
  },
});

const Blockquote = Node.create({
  name: "blockquote",
  group: "block",
  content: "block+",
  defining: true,
  parseHTML() {
    return [{ tag: "blockquote" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["blockquote", mergeAttributes(HTMLAttributes), 0];
  },
});

const HorizontalRule = Node.create({
  name: "horizontalRule",
  group: "block",
  atom: true,
  selectable: true,
  parseHTML() {
    return [{ tag: "hr" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["hr", mergeAttributes(HTMLAttributes)];
  },
});

const BulletList = Node.create({
  name: "bulletList",
  group: "block",
  content: "listItem+",
  parseHTML() {
    return [{ tag: "ul" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["ul", mergeAttributes(HTMLAttributes), 0];
  },
});

const OrderedList = Node.create({
  name: "orderedList",
  group: "block",
  content: "listItem+",
  addAttributes() {
    return {
      start: {
        default: 1,
        parseHTML: (element) => {
          const start = element.getAttribute("start");
          return start ? Number(start) : 1;
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: "ol" }];
  },
  renderHTML({ HTMLAttributes }) {
    const { start, ...attributes } = HTMLAttributes;
    const normalizedStart = Number(start ?? 1);

    return [
      "ol",
      mergeAttributes(normalizedStart === 1 ? attributes : { ...attributes, start: normalizedStart }),
      0,
    ];
  },
});

const ListItem = Node.create({
  name: "listItem",
  content: "paragraph block*",
  defining: true,
  parseHTML() {
    return [{ tag: "li" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["li", mergeAttributes(HTMLAttributes), 0];
  },
});

const BoldMark = Mark.create({
  name: "bold",
  parseHTML() {
    return [
      { tag: "strong" },
      {
        tag: "b",
        getAttrs: (element) =>
          (element as HTMLElement).style.fontWeight !== "normal" && null,
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["strong", mergeAttributes(HTMLAttributes), 0];
  },
});

const ItalicMark = Mark.create({
  name: "italic",
  parseHTML() {
    return [
      { tag: "em" },
      {
        tag: "i",
        getAttrs: (element) =>
          (element as HTMLElement).style.fontStyle !== "normal" && null,
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["em", mergeAttributes(HTMLAttributes), 0];
  },
});

const LinkMark = Mark.create({
  name: "link",
  inclusive: false,
  addAttributes() {
    return {
      href: {
        default: null,
      },
      rel: {
        default: "noopener noreferrer",
      },
      target: {
        default: "_blank",
      },
    };
  },
  parseHTML() {
    return [{ tag: "a[href]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["a", mergeAttributes(HTMLAttributes), 0];
  },
});

const BlogImage = ImageResize.extend({
  name: "blogImage",
  addAttributes() {
    const parentAttributes = this.parent?.() ?? {};

    return {
      ...parentAttributes,
      src: {
        ...(typeof parentAttributes.src === "object" ? parentAttributes.src : {}),
        default: "",
        parseHTML: (element: HTMLElement) => toInternalAdminMediaSrc(element.getAttribute("src") ?? ""),
      },
      alignment: {
        default: "center",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-image-alignment")
          ?? inferImageAlignment(
            element.getAttribute("containerstyle"),
            element.getAttribute("wrapperstyle"),
          ),
        renderHTML: (attributes: { alignment?: string }) =>
          attributes.alignment ? { "data-image-alignment": attributes.alignment } : {},
      },
      mediaId: {
        default: "",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-media-id") ?? "",
        renderHTML: (attributes: { mediaId?: string }) =>
          attributes.mediaId ? { "data-media-id": attributes.mediaId } : {},
      },
      storagePath: {
        default: "",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-storage-path") ?? "",
        renderHTML: (attributes: { storagePath?: string }) =>
          attributes.storagePath ? { "data-storage-path": attributes.storagePath } : {},
      },
      blogImageMarker: {
        default: "true",
        parseHTML: () => "true",
        renderHTML: () => ({
          "data-blog-image": "true",
        }),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(BlogImageNodeView);
  },
  renderHTML({ HTMLAttributes }) {
    const containerStyle = typeof HTMLAttributes.containerStyle === "string" ? HTMLAttributes.containerStyle : "";
    const wrapperStyle = typeof HTMLAttributes.wrapperStyle === "string" ? HTMLAttributes.wrapperStyle : "";
    const alignment = typeof HTMLAttributes.alignment === "string" ? HTMLAttributes.alignment : "";
    const publicStyle = styleObjectToString(getImagePublicStyle(alignment, containerStyle, wrapperStyle));

    return [
      "img",
      mergeAttributes(HTMLAttributes, {
        style: publicStyle,
      }),
    ];
  },
});

const BlogVideo = Node.create({
  name: "blogVideo",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes() {
    return {
      alignment: {
        default: "center",
        parseHTML: (element) => readVideoEmbedFromElement(element)?.alignment ?? "center",
        renderHTML: () => ({}),
      },
      aspectRatio: {
        default: "16:9",
        parseHTML: (element) => readVideoEmbedFromElement(element)?.aspectRatio ?? "16:9",
        renderHTML: () => ({}),
      },
      provider: {
        default: "",
        parseHTML: (element) => readVideoEmbedFromElement(element)?.provider ?? "",
        renderHTML: () => ({}),
      },
      videoId: {
        default: "",
        parseHTML: (element) => readVideoEmbedFromElement(element)?.videoId ?? "",
        renderHTML: () => ({}),
      },
      title: {
        default: "",
        parseHTML: (element) => readVideoEmbedFromElement(element)?.title ?? "",
        renderHTML: () => ({}),
      },
      widthPreset: {
        default: "wide",
        parseHTML: (element) => readVideoEmbedFromElement(element)?.widthPreset ?? "wide",
        renderHTML: () => ({}),
      },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-blog-video=\"true\"]" }];
  },
  addNodeView() {
    return ReactNodeViewRenderer(BlogVideoNodeView);
  },
  renderHTML({ HTMLAttributes }) {
    const {
      alignment: alignmentAttribute,
      aspectRatio: aspectRatioAttribute,
      provider: providerAttribute,
      title: titleAttribute,
      videoId: videoIdAttribute,
      widthPreset: widthPresetAttribute,
      ...restAttributes
    } = HTMLAttributes;
    const alignment = toVideoAlignment(
      typeof alignmentAttribute === "string" ? alignmentAttribute : "",
    );
    const aspectRatio = toVideoAspectRatio(
      typeof aspectRatioAttribute === "string" ? aspectRatioAttribute : "",
    );
    const provider = toSupportedVideoProvider(
      typeof providerAttribute === "string" ? providerAttribute : "",
    );
    const videoId = typeof videoIdAttribute === "string" ? videoIdAttribute.trim() : "";
    const widthPreset = toVideoWidthPreset(
      typeof widthPresetAttribute === "string" ? widthPresetAttribute : "",
    );

    if (!provider || !videoId) {
      return ["div", mergeAttributes(restAttributes)];
    }

    const title =
      typeof titleAttribute === "string" && titleAttribute.trim()
        ? titleAttribute.trim()
        : `${ getVideoProviderLabel(provider) } video`;

    return [
      "div",
      mergeAttributes(restAttributes, {
        "data-blog-video": "true",
        "data-video-alignment": widthPreset === "full" ? "center" : alignment,
        "data-video-ratio": aspectRatio,
        "data-video-id": videoId,
        "data-video-provider": provider,
        "data-video-title": title,
        "data-video-width": widthPreset,
        style: styleObjectToString(getVideoContainerStyle(alignment, aspectRatio, widthPreset)),
      }),
      [
        "iframe",
        {
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
          allowfullscreen: "true",
          loading: "lazy",
          referrerpolicy: "strict-origin-when-cross-origin",
          src: buildVideoEmbedSrc(provider, videoId),
          style: "position:absolute;inset:0;height:100%;width:100%;border:0;",
          title,
        },
      ],
    ];
  },
});

const HistoryExtension = Extension.create({
  name: "history",
  addProseMirrorPlugins() {
    return [history()];
  },
});

const editorExtensions = [
  Document,
  Text,
  Paragraph,
  Heading,
  Blockquote,
  HorizontalRule,
  BulletList,
  OrderedList,
  ListItem,
  BoldMark,
  ItalicMark,
  LinkMark,
  BlogImage.configure({
    minWidth: 120,
    maxWidth: 960,
  }),
  BlogVideo,
  HistoryExtension,
];

const normalizeEditorValue = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : "<p></p>";
};

type ToolbarButtonProps = {
  active?: boolean;
  disabled?: boolean;
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
};

function ToolbarButton({
  active = false,
  disabled = false,
  icon: Icon,
  label,
  onClick,
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant={ active ? "default" : "outline" }
      onClick={ onClick }
      disabled={ disabled }
      className="gap-2"
    >
      <Icon className="size-4"/>
      <span className="hidden md:inline">{ label }</span>
    </Button>
  );
}

export const TiptapHtmlEditor = forwardRef<
  TiptapHtmlEditorHandle,
  {
    className?: string;
    onChange: (value: string) => void;
    onError?: (message: string) => void;
    onRequestInsertImage?: () => void;
    value: string;
  }
>(function TiptapHtmlEditor({
  className,
  onChange,
  onError,
  onRequestInsertImage,
  value,
}, ref) {
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [videoDialogError, setVideoDialogError] = useState<string | null>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: editorExtensions,
    content: normalizeEditorValue(value),
    editorProps: {
      attributes: {
        class:
          "min-h-64 rounded-b-[1.25rem] px-4 py-4 text-sm leading-7 text-[#21343b] outline-none [&_blockquote]:border-l-4 [&_blockquote]:border-[#d8c5a8] [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-semibold [&_hr]:my-6 [&_hr]:border-[#eadfce] [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-4 [&_p:first-child]:mt-0 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-2 [&_[data-blog-video=\"true\"]]:shadow-sm",
      },
    },
    onUpdate: ({ editor: nextEditor }) => {
      onChange(nextEditor.getHTML());
    },
  });

  useImperativeHandle(ref, () => ({
    insertImage: ({ alt, mediaId, src, storagePath }) => {
      editor?.chain().focus().insertContent([
        {
          type: "blogImage",
          attrs: {
            alt,
            mediaId,
            src: toInternalAdminMediaSrc(src),
            storagePath,
          },
        },
        {
          type: "paragraph",
        },
      ]).run();
    },
  }), [editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextValue = normalizeEditorValue(value);
    if (editor.getHTML() !== nextValue) {
      editor.commands.setContent(nextValue, { emitUpdate: false });
    }
  }, [editor, value]);

  const setLink = () => {
    if (!editor) {
      return;
    }

    if (editor.isActive("link")) {
      editor.chain().focus().unsetMark("link").run();
      return;
    }

    const url = window.prompt("Enter a URL", "https://");
    if (!url) {
      return;
    }

    editor
      .chain()
      .focus()
      .setMark("link", {
        href: url,
        rel: "noopener noreferrer",
        target: "_blank",
      })
      .run();
  };

  const submitVideo = () => {
    if (!editor) {
      return;
    }

    const normalizedUrl = videoUrlInput.trim();
    if (!normalizedUrl) {
      setVideoDialogError("Enter a YouTube or Vimeo URL.");
      return;
    }

    const embed = parseSupportedVideoUrl(normalizedUrl);
    if (!embed) {
      const message = "Only YouTube and Vimeo video links are supported.";
      setVideoDialogError(message);
      onError?.(message);
      return;
    }

    editor.chain().focus().insertContent([
      {
        type: "blogVideo",
        attrs: {
          alignment: "center",
          aspectRatio: "16:9",
          provider: embed.provider,
          title: embed.title,
          videoId: embed.videoId,
          widthPreset: "wide",
        },
      },
      {
        type: "paragraph",
      },
    ]).run();

    handleVideoDialogOpenChange(false);
  };

  const handleVideoDialogOpenChange = (nextOpen: boolean) => {
    setIsVideoDialogOpen(nextOpen);

    if (!nextOpen) {
      setVideoUrlInput("");
      setVideoDialogError(null);
    }
  };

  return (
    <div className={ cn("overflow-hidden rounded-[1.35rem] border border-[#eadfce] bg-white", className) }>
      <div className="flex flex-wrap gap-2 border-b border-[#f0e6d8] bg-[#fbf7f0] p-3">
        <ToolbarButton
          icon={ Pilcrow }
          label="Paragraph"
          active={ Boolean(editor?.isActive("paragraph")) }
          disabled={ !editor }
          onClick={ () => editor?.chain().focus().setNode("paragraph").run() }
        />
        <ToolbarButton
          icon={ Heading2 }
          label="Heading 2"
          active={ Boolean(editor?.isActive("heading", { level: 2 })) }
          disabled={ !editor }
          onClick={ () => editor?.chain().focus().toggleNode("heading", "paragraph", { level: 2 }).run() }
        />
        <ToolbarButton
          icon={ Heading3 }
          label="Heading 3"
          active={ Boolean(editor?.isActive("heading", { level: 3 })) }
          disabled={ !editor }
          onClick={ () => editor?.chain().focus().toggleNode("heading", "paragraph", { level: 3 }).run() }
        />
        <ToolbarButton
          icon={ Bold }
          label="Bold"
          active={ Boolean(editor?.isActive("bold")) }
          disabled={ !editor }
          onClick={ () => editor?.chain().focus().toggleMark("bold").run() }
        />
        <ToolbarButton
          icon={ Italic }
          label="Italic"
          active={ Boolean(editor?.isActive("italic")) }
          disabled={ !editor }
          onClick={ () => editor?.chain().focus().toggleMark("italic").run() }
        />
        <ToolbarButton
          icon={ List }
          label="Bulleted"
          active={ Boolean(editor?.isActive("bulletList")) }
          disabled={ !editor }
          onClick={ () => editor?.chain().focus().toggleList("bulletList", "listItem").run() }
        />
        <ToolbarButton
          icon={ ListOrdered }
          label="Numbered"
          active={ Boolean(editor?.isActive("orderedList")) }
          disabled={ !editor }
          onClick={ () => editor?.chain().focus().toggleList("orderedList", "listItem").run() }
        />
        <ToolbarButton
          icon={ Link2 }
          label="Link"
          active={ Boolean(editor?.isActive("link")) }
          disabled={ !editor }
          onClick={ setLink }
        />
        <ToolbarButton
          icon={ Quote }
          label="Quote"
          active={ Boolean(editor?.isActive("blockquote")) }
          disabled={ !editor }
          onClick={ () => editor?.chain().focus().toggleWrap("blockquote").run() }
        />
        <ToolbarButton
          icon={ RemoveFormatting }
          label="Divider"
          disabled={ !editor }
          onClick={ () => editor?.chain().focus().insertContent({ type: "horizontalRule" }).run() }
        />
        { onRequestInsertImage ? (
          <ToolbarButton
            icon={ ImagePlus }
            label="Image"
            disabled={ !editor }
            onClick={ onRequestInsertImage }
          />
        ) : null }
        <ToolbarButton
          icon={ Film }
          label="Video"
          disabled={ !editor }
          onClick={ () => handleVideoDialogOpenChange(true) }
        />
      </div>

      <EditorContent editor={ editor }/>

      <Dialog open={ isVideoDialogOpen } onOpenChange={ handleVideoDialogOpenChange }>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Insert Video</DialogTitle>
            <DialogDescription>
              Paste a YouTube or Vimeo link to embed it in the post body.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="blog-video-url" className="text-sm font-medium text-[#21343b]">
              Video URL
            </label>
            <Input
              id="blog-video-url"
              type="url"
              value={ videoUrlInput }
              onChange={ (event) => {
                setVideoUrlInput(event.target.value);
                if (videoDialogError) {
                  setVideoDialogError(null);
                }
              } }
              onKeyDown={ (event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitVideo();
                }
              } }
              placeholder="https://www.youtube.com/watch?v=..."
              autoFocus
            />
            { videoDialogError ? (
              <p className="text-sm text-[#8c3b32]">{ videoDialogError }</p>
            ) : null }
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={ () => handleVideoDialogOpenChange(false) }>
              Cancel
            </Button>
            <Button type="button" onClick={ submitVideo } disabled={ !editor }>
              Insert Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});
