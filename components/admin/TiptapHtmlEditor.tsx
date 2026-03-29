"use client";

import type { CSSProperties, ComponentType, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from "react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Extension, Mark, mergeAttributes, Node } from "@tiptap/core";
import type { NodeViewProps } from "@tiptap/react";
import { EditorContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor } from "@tiptap/react";
import { history } from "@tiptap/pm/history";
import {
  Bold,
  CalendarDays,
  ExternalLink,
  Globe,
  Heading2,
  Heading3,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  MapPinned,
  Palette,
  Pilcrow,
  Quote,
  RemoveFormatting,
  Settings2,
  Strikethrough,
  Underline,
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
import { mountTuritopWidgets, TURITOP_EMBED_MODE } from "@/lib/turitop/widget";
import { cn } from "@/lib/utils";

export type TiptapHtmlEditorHandle = {
  getHtml: () => string;
  insertImage: (args: {
    alt: string;
    mediaId: string;
    src: string;
    storagePath: string;
  }) => void;
};

type SupportedVideoProvider = "youtube" | "vimeo";
type SupportedIframeProvider = "instagram" | "googleMaps" | "turitop" | "tiktok" | "walkAndTour";
type ImageAlignment = "left" | "center" | "right";
type ImageWidthPreset = "custom" | "full";
type VideoAlignment = "left" | "center" | "right";
type VideoAspectRatio = "21:9" | "16:9" | "4:3" | "1:1";
type VideoWidthPreset = "small" | "medium" | "wide" | "full";
type EmbedAlignment = "left" | "center" | "right";
type EmbedWidthPreset = "medium" | "wide" | "full";
type TuritopAlignment = "left" | "center" | "right";

type ParsedEmbedResult =
  | {
      kind: "video";
      provider: SupportedVideoProvider;
      title: string;
      videoId: string;
    }
  | {
      canonicalUrl: string;
      embedSrc: string;
      height: number;
      kind: "iframe";
      provider: SupportedIframeProvider;
      title: string;
      widthPreset: EmbedWidthPreset;
    }
  | {
      href: string;
      kind: "linkCard";
      title: string;
    };

const IMAGE_ALIGNMENT_OPTIONS: Array<{ label: string; value: ImageAlignment }> = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
];
const IMAGE_WIDTH_OPTIONS: Array<{ label: string; value: ImageWidthPreset }> = [
  { label: "Custom", value: "custom" },
  { label: "Full", value: "full" },
];
const IMAGE_MIN_WIDTH = 120;
const IMAGE_MAX_WIDTH = 960;
const EMBED_MIN_WIDTH = 240;
const EMBED_MAX_WIDTH = 960;
const EMBED_MIN_HEIGHT = 240;
const EMBED_MAX_HEIGHT = 1400;
const TURITOP_MIN_WIDTH = 320;
const TURITOP_MAX_WIDTH = 960;
const TURITOP_MIN_HEIGHT = 320;
const TURITOP_MAX_HEIGHT = 1400;
const TURITOP_DEFAULT_WIDTH = 720;
const TURITOP_DEFAULT_HEIGHT = 760;

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

const EMBED_ALIGNMENT_OPTIONS: Array<{ label: string; value: EmbedAlignment }> = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
];

const EMBED_WIDTH_OPTIONS: Array<{ label: string; value: EmbedWidthPreset }> = [
  { label: "M", value: "medium" },
  { label: "W", value: "wide" },
  { label: "Full", value: "full" },
];

const TURITOP_ALIGNMENT_OPTIONS: Array<{ label: string; value: TuritopAlignment }> = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
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

const toSupportedIframeProvider = (value: string | null | undefined): SupportedIframeProvider | null => {
  if (value === "instagram" || value === "googleMaps" || value === "turitop" || value === "tiktok" || value === "walkAndTour") {
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

const toImageWidthPreset = (value: string | null | undefined): ImageWidthPreset => {
  if (value === "full") {
    return "full";
  }

  return "custom";
};

const extractWidthFromStyle = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const match = value.match(/width:\s*([^;]+)/i);
  return match?.[1]?.trim() ?? null;
};

const extractStyleProperty = (value: string | null | undefined, propertyName: string) => {
  if (!value) {
    return null;
  }

  const escapedPropertyName = propertyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = value.match(new RegExp(`${ escapedPropertyName }\\s*:\\s*([^;]+)`, "i"));
  return match?.[1]?.trim() ?? null;
};

const parseRgbChannel = (value: string) => {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isNaN(parsed) ? null : Math.max(0, Math.min(255, parsed));
};

const normalizeColorInputValue = (value: string | null | undefined, fallback: string) => {
  if (!value) {
    return fallback;
  }

  const normalizedValue = value.trim();
  if (/^#[\da-f]{6}$/i.test(normalizedValue)) {
    return normalizedValue.toLowerCase();
  }

  const shortHexMatch = normalizedValue.match(/^#([\da-f]{3})$/i);
  if (shortHexMatch) {
    return `#${ shortHexMatch[1].split("").map((character) => `${ character }${ character }`).join("") }`.toLowerCase();
  }

  const rgbMatch = normalizedValue.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
  if (rgbMatch) {
    const channels = rgbMatch.slice(1).map((channel) => parseRgbChannel(channel));
    if (channels.every((channel): channel is number => channel !== null)) {
      return `#${ channels.map((channel) => channel.toString(16).padStart(2, "0")).join("") }`;
    }
  }

  return fallback;
};

const DEFAULT_TEXT_COLOR = "#21343b";
const DEFAULT_HIGHLIGHT_COLOR = "#fff2a8";
const EDITOR_SCHEMA_VERSION = "blog-editor-inline-marks-v2";

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
  widthPresetAttribute?: string | null | undefined,
): CSSProperties => {
  const widthPreset = toImageWidthPreset(widthPresetAttribute);
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

  if (widthPreset === "full") {
    style.clear = "both";
    style.display = "flow-root";
    style.marginLeft = "auto";
    style.marginRight = "auto";
    style.width = "100%";
    return style;
  }

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

  style.display = "flow-root";
  style.marginLeft = "auto";
  style.marginRight = "auto";
  return style;
};

const getImageContainerStyle = (width: number) =>
  `width: ${ width }px; height: auto; cursor: pointer;`;

const clampImageWidth = (width: number) =>
  Math.min(IMAGE_MAX_WIDTH, Math.max(IMAGE_MIN_WIDTH, width));

const getImageCaptionText = (value: unknown) =>
  (typeof value === "string" ? value : "").trim();

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

const isFullWidthImage = (attrs: Record<string, unknown>) => {
  if (attrs.widthPreset === "full" || attrs.fullWidth === true || attrs.fullWidth === "true") {
    return true;
  }

  const widthFromStyle = extractWidthFromStyle(
    typeof attrs.containerStyle === "string" ? attrs.containerStyle : null,
  );

  return widthFromStyle === "100%";
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

const toEmbedWidthPreset = (value: string | null | undefined): EmbedWidthPreset => {
  if (value === "medium" || value === "wide" || value === "full") {
    return value;
  }

  return "wide";
};

const toEmbedAlignment = (value: string | null | undefined): EmbedAlignment => {
  if (value === "left" || value === "center" || value === "right") {
    return value;
  }

  return "center";
};

const getVideoProviderLabel = (provider: SupportedVideoProvider) =>
  provider === "youtube" ? "YouTube" : "Vimeo";

const getEmbedProviderLabel = (provider: SupportedIframeProvider) => {
  switch (provider) {
    case "instagram":
      return "Instagram";
    case "googleMaps":
      return "Google Maps";
    case "turitop":
      return "Turitop";
    case "tiktok":
      return "TikTok";
    case "walkAndTour":
      return "WalkAndTour";
  }
};

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

const getEmbedWidth = (widthPreset: EmbedWidthPreset) => {
  switch (widthPreset) {
    case "medium":
      return "min(100%, 28rem)";
    case "wide":
      return "min(100%, 36rem)";
    case "full":
      return "100%";
  }
};

const clampEmbedWidth = (width: number) =>
  Math.min(EMBED_MAX_WIDTH, Math.max(EMBED_MIN_WIDTH, width));

const clampEmbedHeight = (height: number) =>
  Math.min(EMBED_MAX_HEIGHT, Math.max(EMBED_MIN_HEIGHT, height));

const clampTuritopWidth = (width: number) =>
  Math.min(TURITOP_MAX_WIDTH, Math.max(TURITOP_MIN_WIDTH, width));

const clampTuritopHeight = (height: number) =>
  Math.min(TURITOP_MAX_HEIGHT, Math.max(TURITOP_MIN_HEIGHT, height));

const getEmbedWidthFromAttrs = (attrs: Record<string, unknown>) => {
  if (typeof attrs.customWidth === "number" && Number.isFinite(attrs.customWidth)) {
    return clampEmbedWidth(attrs.customWidth);
  }

  if (typeof attrs.customWidth === "string") {
    const parsed = Number.parseFloat(attrs.customWidth);
    if (!Number.isNaN(parsed)) {
      return clampEmbedWidth(parsed);
    }
  }

  const widthFromStyle = extractWidthFromStyle(
    typeof attrs.style === "string" ? attrs.style : null,
  );
  if (widthFromStyle?.endsWith("px")) {
    const parsed = Number.parseFloat(widthFromStyle);
    if (!Number.isNaN(parsed)) {
      return clampEmbedWidth(parsed);
    }
  }

  return null;
};

const getEmbedHeightFromAttrs = (attrs: Record<string, unknown>) => {
  if (typeof attrs.customHeight === "number" && Number.isFinite(attrs.customHeight)) {
    return clampEmbedHeight(attrs.customHeight);
  }

  if (typeof attrs.customHeight === "string") {
    const parsed = Number.parseFloat(attrs.customHeight);
    if (!Number.isNaN(parsed)) {
      return clampEmbedHeight(parsed);
    }
  }

  return null;
};

const getTuritopWidthFromAttrs = (attrs: Record<string, unknown>) => {
  if (typeof attrs.customWidth === "number" && Number.isFinite(attrs.customWidth)) {
    return clampTuritopWidth(attrs.customWidth);
  }

  if (typeof attrs.customWidth === "string") {
    const parsed = Number.parseFloat(attrs.customWidth);
    if (!Number.isNaN(parsed)) {
      return clampTuritopWidth(parsed);
    }
  }

  const widthFromStyle = extractWidthFromStyle(
    typeof attrs.style === "string" ? attrs.style : null,
  );
  if (widthFromStyle?.endsWith("px")) {
    const parsed = Number.parseFloat(widthFromStyle);
    if (!Number.isNaN(parsed)) {
      return clampTuritopWidth(parsed);
    }
  }

  return null;
};

const getTuritopHeightFromAttrs = (attrs: Record<string, unknown>) => {
  if (typeof attrs.customHeight === "number" && Number.isFinite(attrs.customHeight)) {
    return clampTuritopHeight(attrs.customHeight);
  }

  if (typeof attrs.customHeight === "string") {
    const parsed = Number.parseFloat(attrs.customHeight);
    if (!Number.isNaN(parsed)) {
      return clampTuritopHeight(parsed);
    }
  }

  return null;
};

const getTuritopContainerStyle = (
  alignment: TuritopAlignment,
  customWidth?: number | null,
  customHeight?: number | null,
): CSSProperties => {
  const style: CSSProperties = {
    background: "#fff",
    border: "1px solid #eadfce",
    borderRadius: "1rem",
    display: "block",
    height: `${ customHeight ?? TURITOP_DEFAULT_HEIGHT }px`,
    marginBottom: "1.5rem",
    marginTop: "1.5rem",
    maxWidth: "100%",
    overflowX: "hidden",
    overflowY: "auto",
    width: `${ customWidth ?? TURITOP_DEFAULT_WIDTH }px`,
    WebkitOverflowScrolling: "touch",
  };

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

  style.display = "flow-root";
  style.marginLeft = "auto";
  style.marginRight = "auto";
  return style;
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

  style.display = "flow-root";
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

const normalizeHttpUrl = (value: string) => {
  try {
    const url = new URL(normalizeVideoUrlInput(value));
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url;
  } catch {
    return null;
  }
};

const parseInstagramEmbedUrl = (url: URL) => {
  const hostname = normalizeHostname(url.hostname);
  if (hostname !== "instagram.com") {
    return null;
  }

  const [resourceType, mediaId] = url.pathname.split("/").filter(Boolean);

  if (resourceType && mediaId && ["p", "reel", "reels", "tv"].includes(resourceType)) {
    const canonicalUrl = `https://www.instagram.com/${ resourceType }/${ mediaId }/`;

    return {
      canonicalUrl,
      embedSrc: `${ canonicalUrl }embed`,
      height: 720,
      kind: "iframe" as const,
      provider: "instagram" as const,
      title: resourceType === "p" ? "Instagram post" : "Instagram reel",
      widthPreset: "medium" as const,
    };
  }

  return null;
};

const parseGoogleMapsEmbedUrl = (url: URL) => {
  const hostname = normalizeHostname(url.hostname);
  const isGoogleMapsHost = hostname === "google.com" || hostname === "maps.google.com";
  const isEmbeddablePath = url.pathname.startsWith("/maps/embed") || url.pathname.startsWith("/maps/d/embed");

  if (!isGoogleMapsHost || !isEmbeddablePath) {
    return null;
  }

  return {
    canonicalUrl: url.toString(),
    embedSrc: url.toString(),
    height: 420,
    kind: "iframe" as const,
    provider: "googleMaps" as const,
    title: "Google Maps",
    widthPreset: "wide" as const,
  };
};

const parseTuritopEmbedUrl = (url: URL) => {
  const hostname = normalizeHostname(url.hostname);
  if (hostname !== "turitop.com") {
    return null;
  }

  return {
    canonicalUrl: url.toString(),
    embedSrc: url.toString(),
    height: 720,
    kind: "iframe" as const,
    provider: "turitop" as const,
    title: "Turitop booking",
    widthPreset: "wide" as const,
  };
};

const parseTikTokVideoId = (url: URL) => {
  const hostname = normalizeHostname(url.hostname);
  if (hostname !== "tiktok.com") {
    return null;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  const videoIndex = segments.findIndex((segment) => segment === "video");
  if (videoIndex >= 0 && segments[videoIndex + 1]) {
    return segments[videoIndex + 1];
  }

  if (segments[0] === "embed" && segments[1] === "v3" && segments[2]) {
    return segments[2];
  }

  return null;
};

const parseTikTokEmbedUrl = (url: URL) => {
  const videoId = parseTikTokVideoId(url);
  if (!videoId) {
    return null;
  }

  return {
    canonicalUrl: url.toString(),
    embedSrc: `https://www.tiktok.com/embed/v3/${ videoId }`,
    height: 740,
    kind: "iframe" as const,
    provider: "tiktok" as const,
    title: "TikTok video",
    widthPreset: "medium" as const,
  };
};

const WALK_AND_TOUR_EMBED_HOSTS = new Set([
  "walkandtour.dk",
  "staging.walkandtour.dk",
]);

const parseWalkAndTourEmbedUrl = (url: URL) => {
  const hostname = normalizeHostname(url.hostname);
  if (!WALK_AND_TOUR_EMBED_HOSTS.has(hostname)) {
    return null;
  }

  return {
    canonicalUrl: url.toString(),
    embedSrc: url.toString(),
    height: 720,
    kind: "iframe" as const,
    provider: "walkAndTour" as const,
    title: "WalkAndTour page",
    widthPreset: "wide" as const,
  };
};

const getLinkCardTitle = (url: URL) => normalizeHostname(url.hostname).replace(/\.$/, "");

const getEmbedContainerStyle = (
  alignment: EmbedAlignment,
  height: number,
  widthPreset: EmbedWidthPreset,
  customWidth?: number | null,
  customHeight?: number | null,
): CSSProperties => {
  const resolvedAlignment = widthPreset === "full" ? "center" : alignment;
  const style: CSSProperties = {
    background: "#fff",
    border: "1px solid #eadfce",
    borderRadius: "1rem",
    display: "block",
    height: `${ customHeight ?? height }px`,
    marginBottom: "1.5rem",
    marginTop: "1.5rem",
    maxWidth: "100%",
    overflow: "hidden",
    width: customWidth ? `${ customWidth }px` : getEmbedWidth(widthPreset),
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

  style.display = "flow-root";
  style.marginLeft = "auto";
  style.marginRight = "auto";
  return style;
};

const getLinkCardStyle = (): CSSProperties => ({
  background: "#fbf7f0",
  border: "1px solid #eadfce",
  borderRadius: "1rem",
  color: "#21343b",
  display: "block",
  marginBottom: "1.5rem",
  marginTop: "1.5rem",
  maxWidth: "100%",
  padding: "1rem 1.125rem",
  textDecoration: "none",
  width: "min(100%, 36rem)",
});

const parseSupportedVideoUrl = (value: string) => {
  const url = normalizeHttpUrl(value);
  if (!url) {
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

  return null;
};

const parseSupportedEmbedUrl = (value: string): ParsedEmbedResult | null => {
  const videoEmbed = parseSupportedVideoUrl(value);
  if (videoEmbed) {
    return {
      kind: "video",
      ...videoEmbed,
    };
  }

  const url = normalizeHttpUrl(value);
  if (!url) {
    return null;
  }

  const iframeEmbed = parseInstagramEmbedUrl(url)
    ?? parseGoogleMapsEmbedUrl(url)
    ?? parseTuritopEmbedUrl(url)
    ?? parseTikTokEmbedUrl(url)
    ?? parseWalkAndTourEmbedUrl(url);

  if (iframeEmbed) {
    return iframeEmbed;
  }

  return {
    href: url.toString(),
    kind: "linkCard",
    title: getLinkCardTitle(url),
  };
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

  const title = node.attrs.title?.trim() || `${ getVideoProviderLabel(provider) } video`;

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
  const caption = getImageCaptionText(node.attrs.caption);
  const widthPreset = toImageWidthPreset(
    typeof node.attrs.widthPreset === "string"
      ? node.attrs.widthPreset
      : isFullWidthImage(node.attrs as Record<string, unknown>)
        ? "full"
        : "custom",
  );
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
  const captionInputId = `blog-image-caption-${ typeof node.attrs.mediaId === "string" && node.attrs.mediaId
    ? node.attrs.mediaId
    : "new" }`;

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
      widthPreset: "custom",
      width: clampedWidth,
    });
    setPreviewWidth(clampedWidth);
  };

  const setAlignment = (nextAlignment: ImageAlignment) => {
    updateAttributes({ alignment: nextAlignment });
  };

  const setWidthPreset = (nextWidthPreset: ImageWidthPreset) => {
    updateAttributes({
      alignment: nextWidthPreset === "full" ? "center" : alignment,
      containerStyle: nextWidthPreset === "full" ? "width: 100%; height: auto; cursor: pointer;" : getImageContainerStyle(previewWidth),
      widthPreset: nextWidthPreset,
    });
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
    ...getImagePublicStyle(
      alignment,
      widthPreset === "full" ? "width: 100%; height: auto; cursor: pointer;" : getImageContainerStyle(previewWidth),
      null,
      widthPreset,
    ),
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
      data-image-width-preset={ widthPreset }
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
        <div className="absolute inset-x-3 top-3 z-20 flex min-w-0 flex-col gap-3 rounded-xl border border-[#eadfce] bg-white/95 px-3 py-3 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center gap-1">
            { IMAGE_ALIGNMENT_OPTIONS.map((option) => (
              <Button
                key={ option.value }
                type="button"
                size="xs"
                variant={
                  (widthPreset === "full" ? option.value === "center" : alignment === option.value)
                    ? "default"
                    : "outline"
                }
                className="h-7"
                disabled={ widthPreset === "full" && option.value !== "center" }
                onMouseDown={ (event) => event.preventDefault() }
                onClick={ () => setAlignment(option.value) }
              >
                { option.label }
              </Button>
            )) }
          </div>

          <div className="flex flex-wrap items-center gap-1">
            { IMAGE_WIDTH_OPTIONS.map((option) => (
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

          <div className="space-y-1">
            <label className="block text-xs font-medium text-[#5d4d3f]" htmlFor={ captionInputId }>
              Caption
            </label>
            <Input
              id={ captionInputId }
              value={ caption }
              onChange={ (event) => updateAttributes({ caption: event.target.value }) }
              placeholder="Add an optional caption"
              className="h-9 bg-white"
            />
          </div>
        </div>
      ) : null }

      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ src }
          alt={ alt }
          className="block h-auto max-w-full rounded-2xl"
          style={ { width: widthPreset === "full" ? "100%" : `${ previewWidth }px` } }
        />

        { widthPreset === "custom" ? (
          <>
            <div
              className="absolute -bottom-1.5 -left-1.5 size-4 rounded-full border-2 border-[#6c6c6c] bg-white"
              style={ { cursor: "nwse-resize" } }
              onMouseDown={ handleResizeMouseDown("left") }
              onTouchStart={ handleResizeTouchStart("left") }
            />
            <div
              className="absolute -bottom-1.5 -right-1.5 size-4 rounded-full border-2 border-[#6c6c6c] bg-white"
              style={ { cursor: "nwse-resize" } }
              onMouseDown={ handleResizeMouseDown("right") }
              onTouchStart={ handleResizeTouchStart("right") }
            />
          </>
        ) : null }
      </div>

      { caption ? (
        <p className="mt-3 text-center text-sm leading-6 text-[#6d5b47]">
          { caption }
        </p>
      ) : null }
    </NodeViewWrapper>
  );
}

function BlogEmbedNodeView({
  editor,
  getPos,
  node,
  selected,
  updateAttributes,
}: NodeViewProps) {
  const resizeSessionRef = useRef<{
    startHeight: number;
    startWidth: number;
    startX: number;
    startY: number;
  } | null>(null);
  const provider = toSupportedIframeProvider(node.attrs.provider);
  const embedSrc = typeof node.attrs.embedSrc === "string" ? node.attrs.embedSrc.trim() : "";
  const title = typeof node.attrs.title === "string" ? node.attrs.title.trim() : "";
  const height = typeof node.attrs.height === "number" && Number.isFinite(node.attrs.height)
    ? node.attrs.height
    : 560;
  const alignment = toEmbedAlignment(node.attrs.alignment);
  const widthPreset = toEmbedWidthPreset(node.attrs.widthPreset);
  const persistedHeight = getEmbedHeightFromAttrs(node.attrs);
  const persistedWidth = getEmbedWidthFromAttrs(node.attrs);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const fallbackWidth = widthPreset === "medium" ? 448 : widthPreset === "wide" ? 576 : EMBED_MAX_WIDTH;
  const activeHeight = dragHeight ?? persistedHeight ?? height;
  const activeWidth = dragWidth ?? persistedWidth ?? fallbackWidth;

  useEffect(() => {
    if (!selected) {
      const timeoutId = window.setTimeout(() => {
        setIsMenuOpen(false);
        setDragHeight(null);
        setDragWidth(null);
        setIsResizing(false);
        resizeSessionRef.current = null;
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

  const persistSize = (nextWidth: number, nextHeight: number) => {
    const clampedWidth = clampEmbedWidth(nextWidth);
    const clampedHeight = clampEmbedHeight(nextHeight);
    updateAttributes({
      customHeight: clampedHeight,
      customWidth: clampedWidth,
      widthPreset: clampedWidth >= 576 ? "wide" : "medium",
    });
    setDragHeight(null);
    setDragWidth(null);
  };

  const setAlignment = (nextAlignment: EmbedAlignment) => {
    updateAttributes({ alignment: nextAlignment });
  };

  const setWidthPreset = (nextWidthPreset: EmbedWidthPreset) => {
    setDragHeight(null);
    setDragWidth(null);
    updateAttributes({
      alignment: nextWidthPreset === "full" ? "center" : alignment,
      customWidth: null,
      widthPreset: nextWidthPreset,
    });
  };

  const openMenu = () => {
    const position = typeof getPos === "function" ? getPos() : null;
    if (typeof position === "number") {
      editor.chain().focus().setNodeSelection(position).run();
    }

    setIsMenuOpen(true);
  };

  const getResizedSize = (clientX: number, clientY: number) => {
    const session = resizeSessionRef.current;
    if (!session) {
      return {
        height: activeHeight,
        width: activeWidth,
      };
    }

    const width = clampEmbedWidth(session.startWidth + (clientX - session.startX));
    const height = clampEmbedHeight(session.startHeight + (clientY - session.startY));

    return { height, width };
  };

  const updateResizePreview = (clientX: number, clientY: number) => {
    const nextSize = getResizedSize(clientX, clientY);
    setDragHeight(nextSize.height);
    setDragWidth(nextSize.width);
    return nextSize;
  };

  const finishResize = (clientX?: number, clientY?: number) => {
    const nextSize = typeof clientX === "number" && typeof clientY === "number"
      ? updateResizePreview(clientX, clientY)
      : { height: dragHeight ?? activeHeight, width: dragWidth ?? activeWidth };
    persistSize(nextSize.width, nextSize.height);
    setIsResizing(false);
    resizeSessionRef.current = null;
  };

  const startResize = (clientX: number, clientY: number) => {
    const position = typeof getPos === "function" ? getPos() : null;
    if (typeof position === "number") {
      editor.chain().focus().setNodeSelection(position).run();
    }

    setIsMenuOpen(false);
    resizeSessionRef.current = {
      startHeight: activeHeight,
      startWidth: activeWidth,
      startX: clientX,
      startY: clientY,
    };
    setDragHeight(activeHeight);
    setDragWidth(activeWidth);
    setIsResizing(true);
  };

  const handleResizeMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    startResize(event.clientX, event.clientY);
  };

  const handleResizeTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (!event.touches[0]) {
      return;
    }

    event.preventDefault();
    startResize(event.touches[0].clientX, event.touches[0].clientY);
  };

  if (!provider || !embedSrc) {
    return (
      <NodeViewWrapper
        as="div"
        ref={ rootRef }
        className="my-6 rounded-2xl border border-dashed border-[#eadfce] bg-[#fbf7f0] px-4 py-6 text-center text-sm text-[#8b7862]"
        data-blog-embed="true"
        contentEditable={ false }
      >
        Unsupported embed
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      as="div"
      ref={ rootRef }
      className={ cn(
        "group/embed shadow-sm",
        selected ? "ring-2 ring-[#d9c3a2] ring-offset-2 ring-offset-white" : "",
      ) }
      data-blog-embed="true"
      data-embed-alignment={ widthPreset === "full" ? "center" : alignment }
      data-embed-provider={ provider }
      data-embed-src={ embedSrc }
      data-embed-title={ title || getEmbedProviderLabel(provider) }
      data-embed-width={ widthPreset }
      data-embed-height={ height }
      data-embed-custom-height={ persistedHeight ?? "" }
      data-embed-custom-width={ persistedWidth ?? "" }
      contentEditable={ false }
      style={ {
        ...getEmbedContainerStyle(
          alignment,
          height,
          widthPreset,
          dragWidth ?? persistedWidth,
          dragHeight ?? persistedHeight,
        ),
        position: "relative",
      } }
    >
      <Button
        type="button"
        size="icon-xs"
        variant="outline"
        aria-label="Embed settings"
        className="absolute right-3 top-3 z-30 opacity-100 shadow-sm transition md:opacity-0 md:group-hover/embed:opacity-100 md:group-focus-within/embed:opacity-100"
        onMouseDown={ (event) => event.preventDefault() }
        onClick={ openMenu }
      >
        <Settings2 className="size-3.5"/>
      </Button>

      { isMenuOpen ? (
        <div className="absolute inset-x-3 top-3 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-[#eadfce] bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center gap-1">
            { EMBED_ALIGNMENT_OPTIONS.map((option) => (
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
            { EMBED_WIDTH_OPTIONS.map((option) => (
              <Button
                key={ option.value }
                type="button"
                size="xs"
                variant={ widthPreset === option.value && persistedWidth === null ? "default" : "outline" }
                className="h-7"
                onMouseDown={ (event) => event.preventDefault() }
                onClick={ () => setWidthPreset(option.value) }
              >
                { option.label }
              </Button>
            )) }
          </div>
        </div>
      ) : null }

      { isResizing ? (
        <div
          className="fixed inset-0 z-40 cursor-nwse-resize bg-transparent"
          onMouseMove={ (event) => updateResizePreview(event.clientX, event.clientY) }
          onMouseUp={ (event) => finishResize(event.clientX, event.clientY) }
          onTouchMove={ (event) => {
            const touch = event.touches[0];
            if (!touch) {
              return;
            }

            event.preventDefault();
            updateResizePreview(touch.clientX, touch.clientY);
          } }
          onTouchEnd={ (event) => finishResize(event.changedTouches[0]?.clientX, event.changedTouches[0]?.clientY) }
          onTouchCancel={ () => finishResize() }
        />
      ) : null }

      <iframe
        title={ title || getEmbedProviderLabel(provider) }
        src={ embedSrc }
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        className="h-full w-full border-0"
      />
      <div
        className="absolute -bottom-1.5 -right-1.5 size-4 rounded-full border-2 border-[#6c6c6c] bg-white"
        style={ { cursor: "nwse-resize" } }
        onMouseDown={ handleResizeMouseDown }
        onTouchStart={ handleResizeTouchStart }
      />
    </NodeViewWrapper>
  );
}

function BlogLinkCardNodeView({
  node,
  selected,
}: NodeViewProps) {
  const href = typeof node.attrs.href === "string" ? node.attrs.href.trim() : "";
  const title = typeof node.attrs.title === "string" ? node.attrs.title.trim() : href;

  if (!href) {
    return (
      <NodeViewWrapper
        as="div"
        className="my-6 rounded-2xl border border-dashed border-[#eadfce] bg-[#fbf7f0] px-4 py-6 text-center text-sm text-[#8b7862]"
        contentEditable={ false }
      >
        Invalid link
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      as="a"
      href={ href }
      target="_blank"
      rel="noopener noreferrer"
      className={ cn(
        "group/link-card block shadow-sm",
        selected ? "ring-2 ring-[#d9c3a2] ring-offset-2 ring-offset-white" : "",
      ) }
      data-blog-link-card="true"
      data-link-card-title={ title }
      contentEditable={ false }
      style={ getLinkCardStyle() }
    >
      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#21343b]">
        <ExternalLink className="size-4 text-[#8b7862]"/>
        { title }
      </span>
      <span className="block truncate text-sm text-[#627176]">{ href }</span>
    </NodeViewWrapper>
  );
}

function BlogClearNodeView({
  selected,
}: NodeViewProps) {
  return (
    <NodeViewWrapper
      as="div"
      className={ cn(
        "clear-both my-4 rounded-xl border border-dashed border-[#d8c5a8] bg-[#fbf7f0] px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[#8b7862]",
        selected ? "ring-2 ring-[#d9c3a2] ring-offset-2 ring-offset-white" : "",
      ) }
      data-blog-clear="true"
      contentEditable={ false }
    >
      Clear wrap
    </NodeViewWrapper>
  );
}

function BlogTuritopWidgetNodeView({
  editor,
  getPos,
  node,
  selected,
  updateAttributes,
}: NodeViewProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [alignment, setAlignment] = useState<TuritopAlignment>(
    typeof node.attrs.alignment === "string" && (node.attrs.alignment === "left" || node.attrs.alignment === "right")
      ? node.attrs.alignment
      : "center",
  );
  const [language, setLanguage] = useState(typeof node.attrs.language === "string" ? node.attrs.language : "");
  const [service, setService] = useState(typeof node.attrs.service === "string" ? node.attrs.service : "");
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const widgetHostRef = useRef<HTMLDivElement | null>(null);
  const resizeSessionRef = useRef<{
    startHeight: number;
    startWidth: number;
    startX: number;
    startY: number;
  } | null>(null);

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

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const session = resizeSessionRef.current;
      if (!session) {
        return;
      }

      setDragWidth(clampTuritopWidth(session.startWidth + event.clientX - session.startX));
      setDragHeight(clampTuritopHeight(session.startHeight + event.clientY - session.startY));
    };

    const handleTouchMove = (event: TouchEvent) => {
      const session = resizeSessionRef.current;
      const touch = event.touches[0];
      if (!session || !touch) {
        return;
      }

      event.preventDefault();
      setDragWidth(clampTuritopWidth(session.startWidth + touch.clientX - session.startX));
      setDragHeight(clampTuritopHeight(session.startHeight + touch.clientY - session.startY));
    };

    const finishResize = (clientX?: number, clientY?: number) => {
      const session = resizeSessionRef.current;
      if (!session) {
        return;
      }

      const nextWidth = typeof clientX === "number"
        ? clampTuritopWidth(session.startWidth + clientX - session.startX)
        : (dragWidth ?? session.startWidth);
      const nextHeight = typeof clientY === "number"
        ? clampTuritopHeight(session.startHeight + clientY - session.startY)
        : (dragHeight ?? session.startHeight);

      updateAttributes({
        customHeight: nextHeight,
        customWidth: nextWidth,
      });
      setDragWidth(null);
      setDragHeight(null);
      setIsResizing(false);
      resizeSessionRef.current = null;
    };

    const handleMouseUp = (event: MouseEvent) => {
      finishResize(event.clientX, event.clientY);
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      finishResize(touch?.clientX, touch?.clientY);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setDragWidth(null);
      setDragHeight(null);
      setIsResizing(false);
      resizeSessionRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [dragHeight, dragWidth, isResizing, updateAttributes]);

  const openMenu = () => {
    const position = typeof getPos === "function" ? getPos() : null;
    if (typeof position === "number") {
      editor.chain().focus().setNodeSelection(position).run();
    }

    setAlignment(
      typeof node.attrs.alignment === "string" && (node.attrs.alignment === "left" || node.attrs.alignment === "right")
        ? node.attrs.alignment
        : "center",
    );
    setLanguage(typeof node.attrs.language === "string" ? node.attrs.language : "");
    setService(typeof node.attrs.service === "string" ? node.attrs.service : "");
    setIsMenuOpen(true);
  };

  const saveSettings = () => {
    updateAttributes({
      alignment,
      embed: TURITOP_EMBED_MODE,
      language: language.trim(),
      service: service.trim(),
    });
    setIsMenuOpen(false);
  };

  const currentLanguage = typeof node.attrs.language === "string" ? node.attrs.language : "";
  const currentService = typeof node.attrs.service === "string" ? node.attrs.service : "";
  const currentAlignment: TuritopAlignment =
    typeof node.attrs.alignment === "string" && (node.attrs.alignment === "left" || node.attrs.alignment === "right")
      ? node.attrs.alignment
      : "center";
  const persistedWidth = getTuritopWidthFromAttrs(node.attrs as Record<string, unknown>) ?? TURITOP_DEFAULT_WIDTH;
  const persistedHeight = getTuritopHeightFromAttrs(node.attrs as Record<string, unknown>) ?? TURITOP_DEFAULT_HEIGHT;
  const activeWidth = dragWidth ?? persistedWidth;
  const activeHeight = dragHeight ?? persistedHeight;

  useEffect(() => {
    const host = widgetHostRef.current;
    if (!host) {
      return;
    }

    host.innerHTML = "";

    if (!currentService || !currentLanguage) {
      return;
    }

    mountTuritopWidgets([
      {
        container: host,
        embed: TURITOP_EMBED_MODE,
        language: currentLanguage,
        service: currentService,
      },
    ]);

    return () => {
      host.innerHTML = "";
    };
  }, [currentLanguage, currentService]);

  const startResize = (clientX: number, clientY: number) => {
    const position = typeof getPos === "function" ? getPos() : null;
    if (typeof position === "number") {
      editor.chain().focus().setNodeSelection(position).run();
    }

    setIsMenuOpen(false);
    resizeSessionRef.current = {
      startHeight: activeHeight,
      startWidth: activeWidth,
      startX: clientX,
      startY: clientY,
    };
    setDragWidth(activeWidth);
    setDragHeight(activeHeight);
    setIsResizing(true);
  };

  const handleResizeMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    startResize(event.clientX, event.clientY);
  };

  const handleResizeTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    startResize(touch.clientX, touch.clientY);
  };

  return (
    <NodeViewWrapper
      as="div"
      ref={ rootRef }
      className={ cn(
        "group/embed relative shadow-sm",
        selected ? "ring-2 ring-[#d9c3a2] ring-offset-2 ring-offset-white" : "",
      ) }
      data-blog-turitop="true"
      data-alignment={ currentAlignment }
      data-embed={ TURITOP_EMBED_MODE }
      data-lang={ currentLanguage }
      data-service={ currentService }
      contentEditable={ false }
      style={ {
        ...getTuritopContainerStyle(currentAlignment, activeWidth, activeHeight),
        position: "relative",
      } }
    >
      <Button
        type="button"
        size="icon-xs"
        variant="outline"
        aria-label="Turitop widget settings"
        className="absolute right-3 top-3 z-30 opacity-100 shadow-sm transition md:opacity-0 md:group-hover/embed:opacity-100 md:group-focus-within/embed:opacity-100"
        onMouseDown={ (event) => event.preventDefault() }
        onClick={ openMenu }
      >
        <Settings2 className="size-3.5"/>
      </Button>

      { isMenuOpen ? (
        <div className="absolute inset-x-3 top-3 z-20 rounded-xl border border-[#eadfce] bg-white/95 p-3 shadow-sm backdrop-blur">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-1">
              { TURITOP_ALIGNMENT_OPTIONS.map((option) => (
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
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide text-[#8b7862]">Service</label>
              <Input
                value={ service }
                onChange={ (event) => setService(event.target.value) }
                placeholder="P1"
                onMouseDown={ (event) => event.stopPropagation() }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide text-[#8b7862]">Language</label>
              <Input
                value={ language }
                onChange={ (event) => setLanguage(event.target.value) }
                placeholder="es"
                onMouseDown={ (event) => event.stopPropagation() }
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-[#8b7862]">Embed mode: { TURITOP_EMBED_MODE }</p>
              <Button
                type="button"
                size="xs"
                onMouseDown={ (event) => event.preventDefault() }
                onClick={ saveSettings }
                disabled={ !service.trim() || !language.trim() }
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : null }

      { currentService && currentLanguage ? (
        <div
          ref={ widgetHostRef }
          className="h-full min-h-24 w-full"
        />
      ) : (
        <div className="flex h-full min-h-24 w-full items-center justify-center rounded-[1rem] border border-dashed border-[#d6c7a5] bg-white/70 px-4 text-sm text-[#8b7862]">
          <span>Set service and language to render the Turitop calendar here.</span>
        </div>
      ) }

      <div
        className="absolute bottom-2 right-2 z-30 h-4 w-4 cursor-se-resize rounded-sm border border-[#d6c7a5] bg-white/90 shadow-sm"
        onMouseDown={ handleResizeMouseDown }
        onTouchStart={ handleResizeTouchStart }
      />

      { isResizing ? (
        <div className="fixed inset-0 z-999" />
      ) : null }
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

  const iframe = element.tagName === "IFRAME"
    ? element
    : element.querySelector("iframe");
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

const readIframeEmbedFromElement = (element: HTMLElement) => {
  const provider = toSupportedIframeProvider(element.getAttribute("data-embed-provider"));
  const embedSrc = element.getAttribute("data-embed-src")?.trim()
    ?? element.querySelector("iframe")?.getAttribute("src")?.trim()
    ?? "";
  const title = element.getAttribute("data-embed-title")?.trim() || "";
  const heightValue = Number.parseInt(element.getAttribute("data-embed-height") ?? "", 10);
  const customHeightValue = Number.parseFloat(element.getAttribute("data-embed-custom-height") ?? "");
  const customWidthValue = Number.parseFloat(element.getAttribute("data-embed-custom-width") ?? "");
  const alignment = toEmbedAlignment(element.getAttribute("data-embed-alignment"));
  const widthPreset = toEmbedWidthPreset(element.getAttribute("data-embed-width"));

  if (!provider || !embedSrc) {
    return null;
  }

  return {
    alignment,
    customHeight: Number.isFinite(customHeightValue) ? clampEmbedHeight(customHeightValue) : null,
    customWidth: Number.isFinite(customWidthValue) ? clampEmbedWidth(customWidthValue) : null,
    embedSrc,
    height: Number.isFinite(heightValue) ? heightValue : 560,
    provider,
    title: title || getEmbedProviderLabel(provider),
    widthPreset,
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

const UnderlineMark = Mark.create({
  name: "underline",
  parseHTML() {
    return [
      { tag: "u" },
      {
        tag: "span",
        getAttrs: (element) => {
          const textDecoration = extractStyleProperty((element as HTMLElement).getAttribute("style"), "text-decoration");
          return textDecoration?.toLowerCase().includes("underline") ? null : false;
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["u", mergeAttributes(HTMLAttributes), 0];
  },
});

const StrikeMark = Mark.create({
  name: "strike",
  parseHTML() {
    return [
      { tag: "s" },
      { tag: "del" },
      { tag: "strike" },
      {
        tag: "span",
        getAttrs: (element) => {
          const textDecoration = extractStyleProperty((element as HTMLElement).getAttribute("style"), "text-decoration");
          return textDecoration?.toLowerCase().includes("line-through") ? null : false;
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["s", mergeAttributes(HTMLAttributes), 0];
  },
});

const TextColorMark = Mark.create({
  name: "textColor",
  addAttributes() {
    return {
      color: {
        default: null,
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "span",
        getAttrs: (element) => {
          const color = extractStyleProperty((element as HTMLElement).getAttribute("style"), "color");
          return color ? { color } : false;
        },
      },
      {
        tag: "[style]",
        getAttrs: (element) => {
          const color = extractStyleProperty((element as HTMLElement).getAttribute("style"), "color");
          return color ? { color } : false;
        },
      },
      {
        tag: "font[color]",
        getAttrs: (element) => {
          const color = (element as HTMLElement).getAttribute("color");
          return color ? { color } : false;
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    const color = typeof HTMLAttributes.color === "string" ? HTMLAttributes.color.trim() : "";

    if (!color) {
      return ["span", mergeAttributes(HTMLAttributes), 0];
    }

    const attributes = { ...HTMLAttributes };
    delete attributes.color;

    return [
      "span",
      mergeAttributes(attributes, {
        style: styleObjectToString({ color }),
      }),
      0,
    ];
  },
});

const TextHighlightMark = Mark.create({
  name: "textHighlight",
  addAttributes() {
    return {
      color: {
        default: null,
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "mark",
        getAttrs: (element) => ({
          color: extractStyleProperty((element as HTMLElement).getAttribute("style"), "background-color") ?? DEFAULT_HIGHLIGHT_COLOR,
        }),
      },
      {
        tag: "span",
        getAttrs: (element) => {
          const color = extractStyleProperty((element as HTMLElement).getAttribute("style"), "background-color");
          return color ? { color } : false;
        },
      },
      {
        tag: "[style]",
        getAttrs: (element) => {
          const color = extractStyleProperty((element as HTMLElement).getAttribute("style"), "background-color");
          return color ? { color } : false;
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    const color = typeof HTMLAttributes.color === "string" ? HTMLAttributes.color.trim() : "";

    if (!color) {
      return ["mark", mergeAttributes(HTMLAttributes), 0];
    }

    const attributes = { ...HTMLAttributes };
    delete attributes.color;

    return [
      "mark",
      mergeAttributes(attributes, {
        style: styleObjectToString({
          backgroundColor: color,
          color: "inherit",
        }),
      }),
      0,
    ];
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
  parseHTML() {
    return [
      {
        tag: "figure[data-blog-image=\"true\"]",
        getAttrs: (element) => {
          const figure = element as HTMLElement;
          const image = figure.querySelector("img");
          if (!image) {
            return false;
          }

          const containerStyle =
            figure.getAttribute("data-image-container-style")
            ?? figure.getAttribute("containerstyle")
            ?? image.getAttribute("containerstyle");
          const widthPreset =
            figure.getAttribute("data-image-width-preset")
            ?? image.getAttribute("data-image-width-preset")
            ?? (extractWidthFromStyle(containerStyle) === "100%"
              ? "full"
              : "custom");

          const width = getImageWidthFromAttrs({
            containerStyle,
            width:
              figure.getAttribute("data-image-width")
              ?? figure.getAttribute("width")
              ?? image.getAttribute("width"),
          });

          return {
            alt: image.getAttribute("alt") ?? "",
            blogImageMarker: "true",
            caption: getImageCaptionText(figure.querySelector("figcaption")?.textContent ?? ""),
            containerStyle: widthPreset === "full"
              ? "width: 100%; height: auto; cursor: pointer;"
              : getImageContainerStyle(width),
            mediaId: figure.getAttribute("data-media-id") ?? image.getAttribute("data-media-id") ?? "",
            src: toInternalAdminMediaSrc(image.getAttribute("src") ?? ""),
            storagePath: figure.getAttribute("data-storage-path") ?? image.getAttribute("data-storage-path") ?? "",
            alignment:
              figure.getAttribute("data-image-alignment")
              ?? image.getAttribute("data-image-alignment")
              ?? inferImageAlignment(figure.getAttribute("style"), image.getAttribute("style")),
            widthPreset,
            width,
          };
        },
      },
      {
        tag: "img[src]",
      },
    ];
  },
  addAttributes() {
    const parentAttributes = (this.parent?.() ?? {}) as Record<string, unknown>;

    return {
      ...parentAttributes,
      src: {
        ...(typeof parentAttributes.src === "object" ? parentAttributes.src : {}),
        default: "",
        parseHTML: (element: HTMLElement) =>
          toInternalAdminMediaSrc(
            element.tagName === "FIGURE"
              ? element.querySelector("img")?.getAttribute("src") ?? ""
              : element.getAttribute("src") ?? "",
          ),
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
      widthPreset: {
        default: "custom",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-image-width-preset")
          ?? (extractWidthFromStyle(
            element.getAttribute("containerstyle"),
          ) === "100%"
            ? "full"
            : "custom"),
        renderHTML: (attributes: { widthPreset?: string }) =>
          attributes.widthPreset ? { "data-image-width-preset": attributes.widthPreset } : {},
      },
      mediaId: {
        default: "",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-media-id")
          ?? (element.tagName === "FIGURE" ? element.querySelector("img")?.getAttribute("data-media-id") : null)
          ?? "",
        renderHTML: (attributes: { mediaId?: string }) =>
          attributes.mediaId ? { "data-media-id": attributes.mediaId } : {},
      },
      storagePath: {
        default: "",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-storage-path")
          ?? (element.tagName === "FIGURE" ? element.querySelector("img")?.getAttribute("data-storage-path") : null)
          ?? "",
        renderHTML: (attributes: { storagePath?: string }) =>
          attributes.storagePath ? { "data-storage-path": attributes.storagePath } : {},
      },
      caption: {
        default: "",
        parseHTML: (element: HTMLElement) =>
          getImageCaptionText(
            element.tagName === "FIGURE"
              ? element.querySelector("figcaption")?.textContent
              : element.getAttribute("data-image-caption"),
          ),
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
    const alignment = toImageAlignment(
      typeof HTMLAttributes["data-image-alignment"] === "string"
        ? HTMLAttributes["data-image-alignment"]
        : typeof HTMLAttributes.alignment === "string"
          ? HTMLAttributes.alignment
          : "center",
    );
    const widthPreset = toImageWidthPreset(
      typeof HTMLAttributes["data-image-width-preset"] === "string"
        ? HTMLAttributes["data-image-width-preset"]
        : typeof HTMLAttributes.widthPreset === "string"
          ? HTMLAttributes.widthPreset
          : isFullWidthImage(HTMLAttributes as Record<string, unknown>)
            ? "full"
            : "custom",
    );
    const caption = getImageCaptionText(HTMLAttributes.caption);
    const persistedWidth = getImageWidthFromAttrs(HTMLAttributes as Record<string, unknown>);
    const mediaId = typeof HTMLAttributes["data-media-id"] === "string"
      ? HTMLAttributes["data-media-id"]
      : typeof HTMLAttributes.mediaId === "string"
        ? HTMLAttributes.mediaId
        : "";
    const storagePath = typeof HTMLAttributes["data-storage-path"] === "string"
      ? HTMLAttributes["data-storage-path"]
      : typeof HTMLAttributes.storagePath === "string"
        ? HTMLAttributes.storagePath
        : "";
    const figureAttributes = mergeAttributes(
      {
        "data-blog-image": "true",
        "data-image-alignment": alignment,
        "data-image-container-style": containerStyle || (widthPreset === "full"
          ? "width: 100%; height: auto; cursor: pointer;"
          : getImageContainerStyle(persistedWidth)),
        "data-image-width": widthPreset === "full" ? "full" : String(persistedWidth),
        "data-image-width-preset": widthPreset,
        style: styleObjectToString({
          ...getImagePublicStyle(alignment, containerStyle, wrapperStyle, widthPreset),
          width: widthPreset === "full" ? "100%" : `${ persistedWidth }px`,
        }),
      },
      mediaId.length > 0
        ? { "data-media-id": mediaId }
        : {},
      storagePath.length > 0
        ? { "data-storage-path": storagePath }
        : {},
    );
    const imageAttributes = mergeAttributes(
      typeof HTMLAttributes.src === "string" && HTMLAttributes.src.length > 0
        ? { src: HTMLAttributes.src }
        : {},
      typeof HTMLAttributes.alt === "string"
        ? { alt: HTMLAttributes.alt }
        : {},
      {
        style: "display: block; height: auto; margin: 0; max-width: 100%; width: 100%;",
      },
    );

    return [
      "figure",
      figureAttributes,
      ["img", imageAttributes],
      ...(caption
        ? [[
          "figcaption",
          {
            style: "margin-top: 0.75rem; text-align: center;",
          },
          caption,
        ]]
        : []),
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
    return [
      { tag: "div[data-blog-video=\"true\"]" },
      {
        tag: "div",
        getAttrs: (element) =>
          readVideoEmbedFromElement(element as HTMLElement)
            ? null
            : false,
      },
      {
        tag: "iframe",
        getAttrs: (element) =>
          readVideoEmbedFromElement(element as HTMLElement)
            ? null
            : false,
      },
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(BlogVideoNodeView);
  },
  renderHTML({ HTMLAttributes, node }) {
    const {
      alignment: alignmentAttribute,
      aspectRatio: aspectRatioAttribute,
      provider: providerAttribute,
      title: titleAttribute,
      videoId: videoIdAttribute,
      widthPreset: widthPresetAttribute,
      ...restAttributes
    } = node.attrs as Record<string, unknown>;
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
      mergeAttributes(HTMLAttributes, restAttributes, {
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

const BlogEmbed = Node.create({
  name: "blogEmbed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes() {
    return {
      alignment: {
        default: "center",
        parseHTML: (element) => readIframeEmbedFromElement(element)?.alignment ?? "center",
        renderHTML: () => ({}),
      },
      customHeight: {
        default: null,
        parseHTML: (element) => readIframeEmbedFromElement(element)?.customHeight ?? null,
        renderHTML: () => ({}),
      },
      customWidth: {
        default: null,
        parseHTML: (element) => readIframeEmbedFromElement(element)?.customWidth ?? null,
        renderHTML: () => ({}),
      },
      provider: {
        default: "",
        parseHTML: (element) => readIframeEmbedFromElement(element)?.provider ?? "",
        renderHTML: () => ({}),
      },
      embedSrc: {
        default: "",
        parseHTML: (element) => readIframeEmbedFromElement(element)?.embedSrc ?? "",
        renderHTML: () => ({}),
      },
      title: {
        default: "",
        parseHTML: (element) => readIframeEmbedFromElement(element)?.title ?? "",
        renderHTML: () => ({}),
      },
      height: {
        default: 560,
        parseHTML: (element) => readIframeEmbedFromElement(element)?.height ?? 560,
        renderHTML: () => ({}),
      },
      widthPreset: {
        default: "wide",
        parseHTML: (element) => readIframeEmbedFromElement(element)?.widthPreset ?? "wide",
        renderHTML: () => ({}),
      },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-blog-embed=\"true\"]" }];
  },
  addNodeView() {
    return ReactNodeViewRenderer(BlogEmbedNodeView);
  },
  renderHTML({ HTMLAttributes, node }) {
    const attrs = node.attrs as Record<string, unknown>;
    const alignment = toEmbedAlignment(
      typeof attrs.alignment === "string" ? attrs.alignment : "",
    );
    const provider = toSupportedIframeProvider(
      typeof attrs.provider === "string" ? attrs.provider : "",
    );
    const embedSrc = typeof attrs.embedSrc === "string" ? attrs.embedSrc.trim() : "";
    const title = typeof attrs.title === "string" ? attrs.title.trim() : "";
    const customHeight = getEmbedHeightFromAttrs(attrs);
    const customWidth = getEmbedWidthFromAttrs(attrs);
    const widthPreset = toEmbedWidthPreset(
      typeof attrs.widthPreset === "string" ? attrs.widthPreset : "",
    );
    const height = typeof attrs.height === "number" && Number.isFinite(attrs.height)
      ? attrs.height
      : 560;

    if (!provider || !embedSrc) {
      return ["div", mergeAttributes(HTMLAttributes)];
    }

    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-blog-embed": "true",
        "data-embed-alignment": widthPreset === "full" ? "center" : alignment,
        "data-embed-custom-height": customHeight ?? "",
        "data-embed-custom-width": customWidth ?? "",
        "data-embed-provider": provider,
        "data-embed-src": embedSrc,
        "data-embed-title": title || getEmbedProviderLabel(provider),
        "data-embed-width": widthPreset,
        "data-embed-height": height,
        style: styleObjectToString(getEmbedContainerStyle(alignment, height, widthPreset, customWidth, customHeight)),
      }),
      [
        "iframe",
        {
          loading: "lazy",
          referrerpolicy: "strict-origin-when-cross-origin",
          src: embedSrc,
          style: "height:100%;width:100%;border:0;",
          title: title || getEmbedProviderLabel(provider),
        },
      ],
    ];
  },
});

const BlogTuritopWidget = Node.create({
  name: "blogTuritopWidget",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes() {
    return {
      alignment: {
        default: "center",
        parseHTML: (element) => {
          const value = element.getAttribute("data-alignment");
          return value === "left" || value === "right" ? value : "center";
        },
        renderHTML: () => ({}),
      },
      customHeight: {
        default: null,
        parseHTML: (element) => {
          const value = Number.parseFloat(element.getAttribute("data-custom-height") ?? "");
          return Number.isNaN(value) ? null : clampTuritopHeight(value);
        },
        renderHTML: () => ({}),
      },
      customWidth: {
        default: null,
        parseHTML: (element) => {
          const value = Number.parseFloat(element.getAttribute("data-custom-width") ?? "");
          return Number.isNaN(value) ? null : clampTuritopWidth(value);
        },
        renderHTML: () => ({}),
      },
      embed: {
        default: TURITOP_EMBED_MODE,
        parseHTML: (element) => element.getAttribute("data-embed") ?? TURITOP_EMBED_MODE,
        renderHTML: () => ({}),
      },
      language: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-lang") ?? "",
        renderHTML: () => ({}),
      },
      service: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-service") ?? "",
        renderHTML: () => ({}),
      },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-blog-turitop=\"true\"]" }];
  },
  addNodeView() {
    return ReactNodeViewRenderer(BlogTuritopWidgetNodeView);
  },
  renderHTML({ HTMLAttributes, node }) {
    const attrs = node.attrs as Record<string, unknown>;
    const alignment: TuritopAlignment =
      typeof attrs.alignment === "string" && (attrs.alignment === "left" || attrs.alignment === "right")
        ? attrs.alignment
        : "center";
    const embed = typeof attrs.embed === "string" && attrs.embed.trim()
      ? attrs.embed.trim()
      : TURITOP_EMBED_MODE;
    const customHeight = getTuritopHeightFromAttrs(attrs);
    const customWidth = getTuritopWidthFromAttrs(attrs);
    const language = typeof attrs.language === "string" ? attrs.language.trim() : "";
    const service = typeof attrs.service === "string" ? attrs.service.trim() : "";

    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-blog-turitop": "true",
        "data-alignment": alignment,
        "data-custom-height": customHeight ?? "",
        "data-custom-width": customWidth ?? "",
        "data-embed": embed,
        "data-lang": language,
        "data-service": service,
        style: styleObjectToString(getTuritopContainerStyle(alignment, customWidth, customHeight)),
      }),
    ];
  },
});

const BlogLinkCard = Node.create({
  name: "blogLinkCard",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes() {
    return {
      href: {
        default: "",
        parseHTML: (element) => element.getAttribute("href") ?? "",
        renderHTML: () => ({}),
      },
      title: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-link-card-title") ?? element.textContent?.trim() ?? "",
        renderHTML: () => ({}),
      },
    };
  },
  parseHTML() {
    return [{ tag: "a[data-blog-link-card=\"true\"]" }];
  },
  addNodeView() {
    return ReactNodeViewRenderer(BlogLinkCardNodeView);
  },
  renderHTML({ HTMLAttributes, node }) {
    const attrs = node.attrs as Record<string, unknown>;
    const href = typeof attrs.href === "string" ? attrs.href.trim() : "";
    const title = typeof attrs.title === "string" ? attrs.title.trim() : href;

    if (!href) {
      return ["div", mergeAttributes(HTMLAttributes)];
    }

    return [
      "a",
      mergeAttributes(HTMLAttributes, {
        href,
        rel: "noopener noreferrer",
        target: "_blank",
        "data-blog-link-card": "true",
        "data-link-card-title": title,
        style: styleObjectToString(getLinkCardStyle()),
      }),
      [
        "span",
        {
          style: "display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;font-size:0.875rem;font-weight:600;color:#21343b;",
        },
        title,
      ],
      [
        "span",
        {
          style: "display:block;color:#627176;font-size:0.875rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;",
        },
        href,
      ],
    ];
  },
});

const BlogClear = Node.create({
  name: "blogClear",
  group: "block",
  atom: true,
  selectable: true,
  parseHTML() {
    return [{ tag: "div[data-blog-clear=\"true\"]" }];
  },
  addAttributes() {
    return {
      "aria-hidden": {
        default: "true",
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(BlogClearNodeView);
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-blog-clear": "true",
        "aria-hidden": "true",
        style: "clear: both; display: block; height: 0; margin: 0; overflow: hidden; padding: 0; border: 0;",
      }),
    ];
  },
});

type TourCardAlignment = "left" | "center" | "right";

const TOUR_CARD_ALIGNMENT_OPTIONS: { label: string; value: TourCardAlignment }[] = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
];

const getTourCardContainerStyle = (alignment: TourCardAlignment): CSSProperties => {
  if (alignment === "left") {
    return { float: "left", marginRight: "1.5rem", marginBottom: "1rem" };
  }

  if (alignment === "right") {
    return { float: "right", marginLeft: "1.5rem", marginBottom: "1rem" };
  }

  return { display: "flow-root", marginLeft: "auto", marginRight: "auto" };
};

type TourCardPreview = {
  title: string;
  price: string | null;
  duration: string | null;
  coverUrl: string | null;
};

function useTourCardPreview(slug: string): TourCardPreview | null {
  const [preview, setPreview] = useState<TourCardPreview | null>(null);

  useEffect(() => {
    if (!slug) {
      setPreview(null);
      return;
    }

    let cancelled = false;

    fetch(`/api/internal/public/api/public/tours/${encodeURIComponent(slug)}?locale=en`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (cancelled || !data) return;

        const payload = typeof data.translation?.payload === "object" ? data.translation.payload : {};
        const title = typeof payload.title === "string" ? payload.title : slug;
        const coverUrl = data.coverMedia?.contentUrl ?? data.galleryMedia?.[0]?.contentUrl ?? null;
        const price = data.price ? `${data.price.amount} ${data.price.currency}` : null;
        const minutes = typeof data.durationMinutes === "number" ? data.durationMinutes : null;
        const duration = minutes !== null
          ? minutes >= 60
            ? `${(minutes / 60).toFixed(minutes % 60 === 0 ? 0 : 1)}h`
            : `${minutes} min`
          : null;

        setPreview({ title, price, duration, coverUrl });
      })
      .catch(() => {
        if (!cancelled) setPreview(null);
      });

    return () => { cancelled = true; };
  }, [slug]);

  return preview;
}

function BlogTourCardNodeView({
  node,
  selected,
  updateAttributes,
}: NodeViewProps) {
  const slug = typeof node.attrs.tourSlug === "string" ? node.attrs.tourSlug : "";
  const alignment: TourCardAlignment =
    typeof node.attrs.alignment === "string" &&
    (node.attrs.alignment === "left" || node.attrs.alignment === "right")
      ? node.attrs.alignment
      : "center";
  const [showSettings, setShowSettings] = useState(false);
  const preview = useTourCardPreview(slug);

  return (
    <NodeViewWrapper
      as="div"
      className={ cn(
        "my-4 max-w-md overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-[#e3d8cc]",
        selected ? "ring-2 ring-[#d9c3a2] ring-offset-2 ring-offset-white" : "",
      ) }
      data-blog-tour-card="true"
      contentEditable={ false }
      style={ getTourCardContainerStyle(alignment) }
    >
      <div className="flex flex-row">
        { preview?.coverUrl ? (
          <div className="relative w-36 shrink-0 bg-[#f5efe6]">
            <img
              src={ preview.coverUrl }
              alt={ preview.title }
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex w-36 shrink-0 items-center justify-center bg-[#f5efe6]">
            <MapPinned className="size-8 text-[#c24343]" />
          </div>
        ) }
        <div className="flex flex-1 flex-col justify-center gap-1.5 p-4 min-w-0">
          <p className="text-base font-semibold leading-snug text-[#2a221a] truncate">
            { preview?.title ?? (slug || "No slug set") }
          </p>
          { preview?.price ? (
            <p className="text-sm font-medium text-[#5b4d3c]">{ preview.price }</p>
          ) : null }
          { preview?.duration ? (
            <p className="flex items-center gap-1.5 text-sm text-[#8a7562]">
              <CalendarDays className="h-3.5 w-3.5" />
              { preview.duration }
            </p>
          ) : null }
          <span className="mt-1 inline-flex w-fit rounded-lg bg-[#c24343] px-3 py-1.5 text-xs font-semibold text-white">
            Book now
          </span>
        </div>
        <button
          type="button"
          className="self-start rounded-lg p-1.5 text-[#8b7862] hover:bg-[#f5efe6] m-1"
          onClick={ () => setShowSettings(!showSettings) }
        >
          <Settings2 className="size-4" />
        </button>
      </div>
      { showSettings ? (
        <div className="border-t border-[#eadfce] bg-[#fbf7f0] px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#627176]">Alignment:</span>
            { TOUR_CARD_ALIGNMENT_OPTIONS.map((option) => (
              <button
                key={ option.value }
                type="button"
                className={ cn(
                  "rounded-md px-2 py-0.5 text-xs font-medium",
                  alignment === option.value
                    ? "bg-[#2b666d] text-white"
                    : "bg-white text-[#627176] ring-1 ring-[#eadfce] hover:bg-[#f5efe6]",
                ) }
                onClick={ () => updateAttributes({ alignment: option.value }) }
              >
                { option.label }
              </button>
            )) }
          </div>
        </div>
      ) : null }
    </NodeViewWrapper>
  );
}

const BlogTourCard = Node.create({
  name: "blogTourCard",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes() {
    return {
      tourSlug: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-tour-slug") ?? "",
        renderHTML: () => ({}),
      },
      alignment: {
        default: "center",
        parseHTML: (element) => {
          const value = element.getAttribute("data-tour-card-alignment");
          return value === "left" || value === "right" ? value : "center";
        },
        renderHTML: () => ({}),
      },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-blog-tour-card=\"true\"]" }];
  },
  addNodeView() {
    return ReactNodeViewRenderer(BlogTourCardNodeView);
  },
  renderHTML({ HTMLAttributes, node }) {
    const attrs = node.attrs as Record<string, unknown>;
    const tourSlug = typeof attrs.tourSlug === "string" ? attrs.tourSlug.trim() : "";
    const alignment: TourCardAlignment =
      typeof attrs.alignment === "string" && (attrs.alignment === "left" || attrs.alignment === "right")
        ? attrs.alignment
        : "center";

    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-blog-tour-card": "true",
        "data-tour-slug": tourSlug,
        "data-tour-card-alignment": alignment,
        style: styleObjectToString(getTourCardContainerStyle(alignment)),
      }),
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
  UnderlineMark,
  StrikeMark,
  TextColorMark,
  TextHighlightMark,
  LinkMark,
  BlogImage.configure({
    minWidth: 120,
    maxWidth: 960,
  }),
  BlogVideo,
  BlogEmbed,
  BlogTuritopWidget,
  BlogLinkCard,
  BlogTourCard,
  BlogClear,
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

type ToolbarColorControlProps = {
  active?: boolean;
  currentColor: string;
  disabled?: boolean;
  icon: ComponentType<{ className?: string }>;
  label: string;
  onChange: (value: string) => void;
  onClear: () => void;
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

function ToolbarColorControl({
  active = false,
  currentColor,
  disabled = false,
  icon: Icon,
  label,
  onChange,
  onClear,
}: ToolbarColorControlProps) {
  return (
    <div
      className={ cn(
        "inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] border bg-background px-2.5 text-[0.8rem] font-medium whitespace-nowrap transition-all",
        active ? "border-primary ring-2 ring-ring/20" : "border-border",
        disabled ? "opacity-60" : "",
      ) }
    >
      <Icon className="size-4 shrink-0"/>
      <span className="hidden md:inline">{ label }</span>
      <input
        type="color"
        value={ currentColor }
        onChange={ (event) => onChange(event.target.value) }
        disabled={ disabled }
        aria-label={ `${ label } color` }
        className="h-5 w-7 cursor-pointer rounded border border-input bg-transparent p-0 disabled:cursor-not-allowed"
      />
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={ onClear }
        disabled={ disabled || !active }
        className="h-5 px-1.5 text-[0.8rem]"
      >
        Clear
      </Button>
    </div>
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
  const [isEmbedDialogOpen, setIsEmbedDialogOpen] = useState(false);
  const [isTuritopDialogOpen, setIsTuritopDialogOpen] = useState(false);
  const [isTourCardDialogOpen, setIsTourCardDialogOpen] = useState(false);
  const [embedUrlInput, setEmbedUrlInput] = useState("");
  const [embedDialogError, setEmbedDialogError] = useState<string | null>(null);
  const [turitopDialogError, setTuritopDialogError] = useState<string | null>(null);
  const [tourCardDialogError, setTourCardDialogError] = useState<string | null>(null);
  const [turitopLanguageInput, setTuritopLanguageInput] = useState("es");
  const [turitopServiceInput, setTuritopServiceInput] = useState("");
  const [tourCardSlugInput, setTourCardSlugInput] = useState("");
  const [, setToolbarVersion] = useState(0);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: editorExtensions,
    content: normalizeEditorValue(value),
    editorProps: {
      attributes: {
        class:
          "min-h-64 rounded-b-[1.25rem] px-4 py-4 text-sm leading-7 text-[#21343b] outline-none [display:flow-root] after:block after:clear-both after:content-[''] [&_blockquote]:border-l-4 [&_blockquote]:border-[#d8c5a8] [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-semibold [&_hr]:my-6 [&_hr]:border-[#eadfce] [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-4 [&_p:first-child]:mt-0 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-2 [&_[data-blog-video=\"true\"]]:shadow-sm [&_[data-blog-embed=\"true\"]]:shadow-sm [&_[data-blog-link-card=\"true\"]]:shadow-sm [&_[data-blog-turitop=\"true\"]]:shadow-sm overflow-visible",
      },
    },
    onUpdate: ({ editor: nextEditor }) => {
      onChange(nextEditor.getHTML());
      setToolbarVersion((current) => current + 1);
    },
    onSelectionUpdate: () => {
      setToolbarVersion((current) => current + 1);
    },
  }, [EDITOR_SCHEMA_VERSION]);

  useImperativeHandle(ref, () => ({
    getHtml: () => editor?.getHTML() ?? normalizeEditorValue(value),
    insertImage: ({ alt, mediaId, src, storagePath }) => {
      editor?.chain().focus().insertContent([
        {
          type: "blogImage",
          attrs: {
            alt,
            mediaId,
            src,
            storagePath,
          },
        },
        {
          type: "paragraph",
        },
      ]).run();
    },
  }), [editor, value]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextValue = normalizeEditorValue(value);
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled || editor.isDestroyed) {
        return;
      }

      if (editor.getHTML() !== nextValue) {
        editor.commands.setContent(nextValue, { emitUpdate: false });
      }
    });

    return () => {
      cancelled = true;
    };
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

  const toggleMarkSafely = (markName: string) => {
    if (!editor) {
      return;
    }

    if (!editor.schema.marks[markName]) {
      onError?.(`The ${ markName } formatter is not available in the current editor instance. Reload the page and try again.`);
      return;
    }

    editor.chain().focus().toggleMark(markName).run();
  };

  const currentTextColor = normalizeColorInputValue(
    editor?.getAttributes("textColor").color,
    DEFAULT_TEXT_COLOR,
  );
  const currentHighlightColor = normalizeColorInputValue(
    editor?.getAttributes("textHighlight").color,
    DEFAULT_HIGHLIGHT_COLOR,
  );

  const setTextColor = (color: string) => {
    if (!editor) {
      return;
    }

    editor.chain().focus().setMark("textColor", { color }).run();
  };

  const clearTextColor = () => {
    editor?.chain().focus().unsetMark("textColor").run();
  };

  const setHighlightColor = (color: string) => {
    if (!editor) {
      return;
    }

    editor.chain().focus().setMark("textHighlight", { color }).run();
  };

  const clearHighlightColor = () => {
    editor?.chain().focus().unsetMark("textHighlight").run();
  };

  const submitEmbed = () => {
    if (!editor) {
      return;
    }

    const normalizedUrl = embedUrlInput.trim();
    if (!normalizedUrl) {
      setEmbedDialogError("Enter a supported embed URL.");
      return;
    }

    const embed = parseSupportedEmbedUrl(normalizedUrl);
    if (!embed) {
      const message = "Enter a valid public URL.";
      setEmbedDialogError(message);
      onError?.(message);
      return;
    }

    const content =
      embed.kind === "video"
        ? [
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
          ]
        : embed.kind === "iframe"
          ? [
              {
                type: "blogEmbed",
                attrs: {
                  embedSrc: embed.embedSrc,
                  height: embed.height,
                  provider: embed.provider,
                  title: embed.title,
                  widthPreset: embed.widthPreset,
                },
              },
            ]
          : [
              {
                type: "blogLinkCard",
                attrs: {
                  href: embed.href,
                  title: embed.title,
                },
              },
            ];

    editor.chain().focus().insertContent([
      ...content,
      {
        type: "paragraph",
      },
    ]).run();

    handleEmbedDialogOpenChange(false);
  };

  const handleEmbedDialogOpenChange = (nextOpen: boolean) => {
    setIsEmbedDialogOpen(nextOpen);

    if (!nextOpen) {
      setEmbedUrlInput("");
      setEmbedDialogError(null);
    }
  };

  const handleTuritopDialogOpenChange = (nextOpen: boolean) => {
    setIsTuritopDialogOpen(nextOpen);

    if (!nextOpen) {
      setTuritopDialogError(null);
      setTuritopLanguageInput("es");
      setTuritopServiceInput("");
    }
  };

  const submitTuritopWidget = () => {
    if (!editor) {
      return;
    }

    const service = turitopServiceInput.trim();
    const language = turitopLanguageInput.trim();

    if (!service || !language) {
      const message = "Service and language are required.";
      setTuritopDialogError(message);
      onError?.(message);
      return;
    }

    editor.chain().focus().insertContent([
      {
        type: "blogTuritopWidget",
        attrs: {
          embed: TURITOP_EMBED_MODE,
          language,
          service,
        },
      },
      {
        type: "paragraph",
      },
    ]).run();

    handleTuritopDialogOpenChange(false);
  };

  const handleTourCardDialogOpenChange = (nextOpen: boolean) => {
    setIsTourCardDialogOpen(nextOpen);

    if (!nextOpen) {
      setTourCardDialogError(null);
      setTourCardSlugInput("");
    }
  };

  const submitTourCard = () => {
    if (!editor) {
      return;
    }

    const tourSlug = tourCardSlugInput.trim();

    if (!tourSlug) {
      const message = "Tour slug is required.";
      setTourCardDialogError(message);
      onError?.(message);
      return;
    }

    editor.chain().focus().insertContent([
      {
        type: "blogTourCard",
        attrs: {
          tourSlug,
        },
      },
      {
        type: "paragraph",
      },
    ]).run();

    handleTourCardDialogOpenChange(false);
  };

  const insertClearWrap = () => {
    if (!editor) {
      return;
    }

    editor.chain().focus().insertContent([
      {
        type: "blogClear",
      },
      {
        type: "paragraph",
      },
    ]).run();
  };

  return (
    <div className={ cn("rounded-[1.35rem] border border-[#eadfce] bg-white overflow-clip", className) }>
      <div className="sticky top-0 z-10 flex flex-wrap gap-2 border-b border-[#f0e6d8] bg-[#fbf7f0]/95 p-3 shadow-[0_10px_24px_-18px_rgba(42,36,25,0.35)] backdrop-blur">
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
          onClick={ () => toggleMarkSafely("bold") }
        />
        <ToolbarButton
          icon={ Italic }
          label="Italic"
          active={ Boolean(editor?.isActive("italic")) }
          disabled={ !editor }
          onClick={ () => toggleMarkSafely("italic") }
        />
        <ToolbarButton
          icon={ Underline }
          label="Underline"
          active={ Boolean(editor?.isActive("underline")) }
          disabled={ !editor }
          onClick={ () => toggleMarkSafely("underline") }
        />
        <ToolbarButton
          icon={ Strikethrough }
          label="Strike"
          active={ Boolean(editor?.isActive("strike")) }
          disabled={ !editor }
          onClick={ () => toggleMarkSafely("strike") }
        />
        <ToolbarColorControl
          icon={ Palette }
          label="Text"
          active={ Boolean(editor?.isActive("textColor")) }
          currentColor={ currentTextColor }
          disabled={ !editor }
          onChange={ setTextColor }
          onClear={ clearTextColor }
        />
        <ToolbarColorControl
          icon={ Highlighter }
          label="Highlight"
          active={ Boolean(editor?.isActive("textHighlight")) }
          currentColor={ currentHighlightColor }
          disabled={ !editor }
          onChange={ setHighlightColor }
          onClear={ clearHighlightColor }
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
        <ToolbarButton
          icon={ Pilcrow }
          label="Clear Wrap"
          disabled={ !editor }
          onClick={ insertClearWrap }
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
          icon={ Globe }
          label="Embed"
          disabled={ !editor }
          onClick={ () => handleEmbedDialogOpenChange(true) }
        />
        <ToolbarButton
          icon={ CalendarDays }
          label="Turitop"
          disabled={ !editor }
          onClick={ () => handleTuritopDialogOpenChange(true) }
        />
        <ToolbarButton
          icon={ MapPinned }
          label="Tour Card"
          disabled={ !editor }
          onClick={ () => handleTourCardDialogOpenChange(true) }
        />
      </div>

      <EditorContent editor={ editor }/>

      <Dialog open={ isEmbedDialogOpen } onOpenChange={ handleEmbedDialogOpenChange }>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Insert Embed</DialogTitle>
            <DialogDescription>
              Paste a public URL. YouTube, Vimeo, Instagram posts or reels, TikTok videos, Google Maps
              embed URLs, Turitop URLs, and WalkAndTour production or staging pages become embeds.
              Other public URLs become link cards.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="blog-embed-url" className="text-sm font-medium text-[#21343b]">
              Embed URL
            </label>
            <Input
              id="blog-embed-url"
              type="url"
              value={ embedUrlInput }
              onChange={ (event) => {
                setEmbedUrlInput(event.target.value);
                if (embedDialogError) {
                  setEmbedDialogError(null);
                }
              } }
              onKeyDown={ (event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitEmbed();
                }
              } }
              placeholder="https://www.tiktok.com/@account/video/... or https://walkandtour.dk/..."
              autoFocus
            />
            { embedDialogError ? (
              <p className="text-sm text-[#8c3b32]">{ embedDialogError }</p>
            ) : null }
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={ () => handleEmbedDialogOpenChange(false) }>
              Cancel
            </Button>
            <Button type="button" onClick={ submitEmbed } disabled={ !editor }>
              Insert Embed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={ isTuritopDialogOpen } onOpenChange={ handleTuritopDialogOpenChange }>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Insert Turitop Calendar</DialogTitle>
            <DialogDescription>
              Add a Turitop calendar widget placeholder to the post. The live calendar is mounted on the public blog page.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <label htmlFor="blog-turitop-service" className="text-sm font-medium text-[#21343b]">
                Service
              </label>
              <Input
                id="blog-turitop-service"
                value={ turitopServiceInput }
                onChange={ (event) => {
                  setTuritopServiceInput(event.target.value);
                  if (turitopDialogError) {
                    setTuritopDialogError(null);
                  }
                } }
                placeholder="P1"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="blog-turitop-language" className="text-sm font-medium text-[#21343b]">
                Language
              </label>
              <Input
                id="blog-turitop-language"
                value={ turitopLanguageInput }
                onChange={ (event) => {
                  setTuritopLanguageInput(event.target.value);
                  if (turitopDialogError) {
                    setTuritopDialogError(null);
                  }
                } }
                placeholder="es"
                onKeyDown={ (event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    submitTuritopWidget();
                  }
                } }
              />
            </div>

            <div className="rounded-2xl border border-[#eadfce] bg-[#fbf7f0] px-4 py-3 text-sm text-[#627176]">
              Embed mode: <span className="font-medium text-[#21343b]">{ TURITOP_EMBED_MODE }</span>
            </div>

            { turitopDialogError ? (
              <p className="text-sm text-[#8c3b32]">{ turitopDialogError }</p>
            ) : null }
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={ () => handleTuritopDialogOpenChange(false) }>
              Cancel
            </Button>
            <Button type="button" onClick={ submitTuritopWidget } disabled={ !editor }>
              Insert Calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={ isTourCardDialogOpen } onOpenChange={ handleTourCardDialogOpenChange }>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Insert Tour Card</DialogTitle>
            <DialogDescription>
              Embed an inline tour card in the blog post. The card shows the tour image, name, price, duration, and a booking link. Enter the tour translation slug.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="blog-tour-card-slug" className="text-sm font-medium text-[#21343b]">
              Tour Slug
            </label>
            <Input
              id="blog-tour-card-slug"
              value={ tourCardSlugInput }
              onChange={ (event) => {
                setTourCardSlugInput(event.target.value);
                if (tourCardDialogError) {
                  setTourCardDialogError(null);
                }
              } }
              onKeyDown={ (event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitTourCard();
                }
              } }
              placeholder="en-historic-center-highlights"
              autoFocus
            />
            { tourCardDialogError ? (
              <p className="text-sm text-[#8c3b32]">{ tourCardDialogError }</p>
            ) : null }
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={ () => handleTourCardDialogOpenChange(false) }>
              Cancel
            </Button>
            <Button type="button" onClick={ submitTourCard } disabled={ !editor }>
              Insert Tour Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});
