"use client";

import React from "react";
import {
  WixDecoration, WixHeadingNode,
  WixHtmlNode,
  WixImageNode,
  WixNode, WixParagraphNode,
  WixRichContent,
  WixTextNode,
} from "@/lib/wix/rich-content/types";
import {
  cn,
  getWixImageUrl,
  mapAlignment,
  mapImageAlignment,
  sanitizeUrl,
} from "@/lib/wix/rich-content/utils";

export type WixRichContentRendererProps = {
  content?: WixRichContent | null;
  className?: string;
};

function renderTextWithDecorations(node: WixTextNode, key: string): React.ReactNode {
  const text = node.textData?.text ?? "";
  const decorations = node.textData?.decorations ?? [];

  let content: React.ReactNode = text;

  for (let i = 0; i < decorations.length; i += 1) {
    const decoration = decorations[i] as WixDecoration;

    switch (decoration.type) {
      case "BOLD":
        content = <strong key={ `${ key }-bold-${ i }` }>{ content }</strong>;
        break;

      case "ITALIC":
        content = <em key={ `${ key }-italic-${ i }` }>{ content }</em>;
        break;

      case "UNDERLINE":
        content = <u key={ `${ key }-underline-${ i }` }>{ content }</u>;
        break;

      case "STRIKETHROUGH":
        content = <s key={ `${ key }-strike-${ i }` }>{ content }</s>;
        break;

      case "COLOR": {
        const style: React.CSSProperties = {};
        if (decoration.colorData?.foreground) {
          style.color = decoration.colorData.foreground;
        }
        if (decoration.colorData?.background) {
          style.backgroundColor = decoration.colorData.background;
        }
        content = (
          <span key={ `${ key }-color-${ i }` } style={ style }>
            { content }
          </span>
        );
        break;
      }

      case "LINK": {
        const link = decoration.linkData?.link;
        const href = sanitizeUrl(link?.url);

        if (!href) break;

        const target = link?.target === "BLANK" ? "_blank" : undefined;
        const relParts = [
          link?.rel?.noreferrer ? "noreferrer" : "",
          link?.rel?.nofollow ? "nofollow" : "",
          link?.rel?.noopener ? "noopener" : "",
        ].filter(Boolean);

        content = (
          <a
            key={ `${ key }-link-${ i }` }
            href={ href }
            target={ target }
            rel={ relParts.length ? relParts.join(" ") : undefined }
            className="underline underline-offset-2"
          >
            { content }
          </a>
        );
        break;
      }

      case "SPOILER":
        content = (
          <span
            key={ `${ key }-spoiler-${ i }` }
            className="rounded px-1 transition hover:text-inherit text-transparent bg-current/80"
          >
            { content }
          </span>
        );
        break;

      default:
        break;
    }
  }

  return <React.Fragment key={ key }>{ content }</React.Fragment>;
}

function renderChildren(nodes?: WixNode[], parentKey = "node"): React.ReactNode {
  if (!nodes?.length) return null;

  return nodes.map((node, index) => renderNode(node, `${ parentKey }-${ index }`));
}

function toDimension(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.round(parsed);
    }
  }

  return undefined;
}

function sanitizeHtmlNodeContent(html: string): string {
  return html
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/<image>/gi, "<div>")
    .replace(/<\/image>/gi, "</div>");
}

function renderImage(node: WixImageNode, key: string): React.ReactNode {
  const imageId = node.imageData?.image?.src?.id;
  const src = getWixImageUrl(imageId);
  const alt = node.imageData?.altText ?? "";
  const caption = node.imageData?.caption;
  const width = toDimension(node.imageData?.image?.width) ?? toDimension(node.imageData?.image?.src?.width);
  const height = toDimension(node.imageData?.image?.height) ?? toDimension(node.imageData?.image?.src?.height);
  const alignment = node.imageData?.containerData?.alignment;

  if (!src) return null;

  const imageStyle: React.CSSProperties = {
    maxWidth: "100%",
    height: "auto",
  };

  if (width) {
    imageStyle.width = `${ width }px`;
  }

  if (width && height) {
    imageStyle.aspectRatio = `${ width } / ${ height }`;
  }

  return (
    <figure key={ key } className={ cn("my-6 w-fit max-w-full", mapImageAlignment(alignment)) }>
      {/* eslint-disable-next-line @next/next/no-img-element */ }
      <img
        src={ src }
        alt={ alt }
        width={ width }
        height={ height }
        style={ imageStyle }
        className="!w-auto h-auto max-w-full rounded-lg"
      />
      { caption ? (
        <figcaption className="mt-2 text-sm text-neutral-500">{ caption }</figcaption>
      ) : null }
    </figure>
  );
}

function renderHtml(node: WixHtmlNode, key: string): React.ReactNode {
  const html = node.htmlData?.html?.trim();
  const alignment = node.htmlData?.containerData?.alignment;
  const height = toDimension(node.htmlData?.containerData?.height?.custom);
  const safeHtml = html ? sanitizeHtmlNodeContent(html) : "";

  if (!safeHtml) {
    return null;
  }

  const wrapperStyle: React.CSSProperties = {
    maxWidth: "100%",
  };

  if (height) {
    wrapperStyle.maxHeight = `${ height }px`;
  }

  return (
    <div
      key={ key }
      style={ wrapperStyle }
      className={ cn(
        "my-6 w-fit max-w-full overflow-scroll rounded-lg",
        mapImageAlignment(alignment),
      ) }
      dangerouslySetInnerHTML={ {__html: html!} }
    />
  );
}

function renderNode(node: WixNode, key: string): React.ReactNode {
  switch (node.type) {
    case "TEXT":
      return renderTextWithDecorations(node as WixTextNode, key);

    case "PARAGRAPH": {
      const alignment = (node as WixParagraphNode).paragraphData?.textStyle?.textAlignment;
      const hasChildren = Boolean(node.nodes?.length);

      if (!hasChildren) {
        return <div key={ key } className="h-4"/>;
      }

      return (
        <p key={ key } className={ cn("my-4 leading-7", mapAlignment(alignment)) }>
          { renderChildren(node.nodes, key) }
        </p>
      );
    }

    case "HEADING": {
      const level = (node as WixHeadingNode).headingData?.level ?? 3;
      const alignment = (node as WixHeadingNode).headingData?.textStyle?.textAlignment;
      const className = cn("mt-8 mb-4 font-semibold tracking-tight", mapAlignment(alignment));

      if (level === 1) {
        return (
          <h1 key={ key } className={ cn(className, "text-4xl") }>
            { renderChildren(node.nodes, key) }
          </h1>
        );
      }

      if (level === 2) {
        return (
          <h2 key={ key } className={ cn(className, "text-3xl") }>
            { renderChildren(node.nodes, key) }
          </h2>
        );
      }

      if (level === 3) {
        return (
          <h3 key={ key } className={ cn(className, "text-2xl") }>
            { renderChildren(node.nodes, key) }
          </h3>
        );
      }

      return (
        <h4 key={ key } className={ cn(className, "text-xl") }>
          { renderChildren(node.nodes, key) }
        </h4>
      );
    }

    case "IMAGE":
      return renderImage(node as WixImageNode, key);

    case "HTML":
      return renderHtml(node as WixHtmlNode, key);

    case "BULLETED_LIST":
      return (
        <ul key={ key } className="my-4 list-disc pl-6 space-y-2">
          { node.nodes?.map((item, index) => (
            <li key={ `${ key }-li-${ item.id ?? index }` }>{ renderChildren(item.nodes, key) }</li>
          )) }
        </ul>
      );

    case "NUMBERED_LIST":
      return (
        <ol key={ key } className="my-4 list-decimal pl-6 space-y-2">
          { node.nodes?.map((item, index) => (
            <li key={ `${ key }-li-${ item.id ?? index }` }>{ renderChildren(item.nodes, key) }</li>
          )) }
        </ol>
      );

    case "LIST_ITEM":
      return <React.Fragment key={ key }>{ renderChildren(node.nodes, key) }</React.Fragment>;

    default:
      return null;
  }
}

export function WixRichContentRenderer({
                                         content,
                                         className,
                                       }: WixRichContentRendererProps) {
  if (!content?.nodes?.length) return null;

  return (
    <div className={ cn("wix-rich-content", className) }>
      { content.nodes.map((node, index) => renderNode(node, `${ node.id ?? "node" }-${ index }`)) }
    </div>
  );
}
