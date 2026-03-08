"use client";

import React from "react";
import {
  WixAppEmbedNode,
  WixCodeBlockNode,
  WixDecoration, WixHeadingNode,
  WixHtmlNode,
  WixImageNode,
  WixNode, WixParagraphNode,
  WixRichContent,
  WixTableCellNode,
  WixTableNode,
  WixTableRowNode,
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

const WIX_SMALL_IMAGE_WIDTH = 460;

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

function collectPlainText(nodes?: WixNode[]): string {
  if (!nodes?.length) {
    return "";
  }

  const parts: string[] = [];

  const walk = (currentNodes: WixNode[]) => {
    currentNodes.forEach((node) => {
      if (node.type === "TEXT") {
        const text = (node as WixTextNode).textData?.text;
        if (text) {
          parts.push(text);
        }
      }

      if (node.nodes?.length) {
        walk(node.nodes);
      }
    });
  };

  walk(nodes);

  return parts.join("");
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

function toSafeColor(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  const isHex = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(normalized);
  const isRgbLike = /^(?:rgb|hsl)a?\([^)]+\)$/.test(normalized);

  if (!isHex && !isRgbLike) {
    return undefined;
  }

  return normalized;
}

function mapVerticalAlignment(value: string | undefined): React.CSSProperties["verticalAlign"] {
  switch (value) {
    case "TOP":
      return "top";
    case "BOTTOM":
      return "bottom";
    case "MIDDLE":
    default:
      return "middle";
  }
}

function renderImage(node: WixImageNode, key: string): React.ReactNode {
  const imageId = node.imageData?.image?.src?.id;
  const src = getWixImageUrl(imageId);
  const alt = node.imageData?.altText ?? "";
  const caption = node.imageData?.caption;
  const originalHeight = toDimension(node.imageData?.image?.height) ?? toDimension(node.imageData?.image?.src?.height);
  const containerWidthSize = node.imageData?.containerData?.width?.size;
  const alignment = node.imageData?.containerData?.alignment;
  const isSmall = containerWidthSize === "SMALL";
  const isContent = containerWidthSize === "CONTENT";
  const width = isSmall ? WIX_SMALL_IMAGE_WIDTH : null;
  const height = isSmall ? "auto" : (isContent ? originalHeight : originalHeight);

  if (!src) return null;

  const imageStyle: React.CSSProperties = {
    maxWidth: width ?? "100%",
    height: "auto",
  };

  if (width) {
    imageStyle.width = `${ width }px`;
  }

  if (width && height) {
    imageStyle.aspectRatio = `${ width } / ${ height }`;
  }

  return (
    <figure
      key={ key }
      className={ cn(
        "my-6 w-fit max-w-full",
        mapImageAlignment(alignment),
      ) }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */ }
      <img
        src={ src }
        alt={ alt }
        width={ width ?? WIX_SMALL_IMAGE_WIDTH }
        height={ height }
        style={ imageStyle }
        className="w-auto! h-auto max-w-full rounded-lg"
      />
      { caption ? (
        <figcaption className="mt-2 text-sm text-neutral-500">{ caption }</figcaption>
      ) : null }
    </figure>
  );
}

function renderHtml(node: WixHtmlNode, key: string): React.ReactNode {
  const html = node.htmlData?.html?.trim();
  const url = sanitizeUrl(node.htmlData?.url);
  const alignment = node.htmlData?.containerData?.alignment;
  const width = toDimension(node.htmlData?.containerData?.width?.custom);
  const height = toDimension(node.htmlData?.containerData?.height?.custom);
  const safeHtml = html ? sanitizeHtmlNodeContent(html) : "";
  const wrapperStyle: React.CSSProperties = {
    maxWidth: "100%",
  };

  if (url) {
    if (width) {
      wrapperStyle.width = `${ width }px`;
    }

    return (
      <div
        key={ key }
        style={ wrapperStyle }
        className={ cn(
          "my-6 w-fit max-w-full overflow-hidden rounded-lg",
          mapImageAlignment(alignment),
        ) }
      >
        <iframe
          title={ `wix-html-embed-${ key }` }
          src={ url }
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="block w-full border-0 bg-transparent"
          style={ {height: `${ height ?? 420 }px`} }
        />
      </div>
    );
  }

  if (!safeHtml) {
    return null;
  }

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
      dangerouslySetInnerHTML={ {__html: safeHtml} }
    />
  );
}

function renderCodeBlock(node: WixCodeBlockNode, key: string): React.ReactNode {
  const rawCode = node.codeBlockData?.text
    ?? node.codeBlockData?.code
    ?? node.codeBlockData?.content
    ?? node.codeBlockData?.value
    ?? collectPlainText(node.nodes);
  const code = rawCode?.trimEnd() ?? "";
  const language = node.codeBlockData?.language?.trim();

  if (!code) {
    return null;
  }

  return (
    <figure
      key={ key }
      className="my-6 overflow-hidden rounded-xl border border-[#e8dfd4] bg-[#1f2430] text-[#f3f4f6]"
    >
      { language ? (
        <figcaption
          className="border-b border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/70">
          { language }
        </figcaption>
      ) : null }
      <pre className="overflow-x-auto p-4 text-sm leading-6">
        <code>{ code }</code>
      </pre>
    </figure>
  );
}

function renderAppEmbed(node: WixAppEmbedNode, key: string): React.ReactNode {
  const embed = node.appEmbedData;
  if (!embed) {
    return null;
  }

  const title = embed.name?.trim() || "Embedded item";
  const type = embed.type?.trim();
  const duration = embed.bookingData?.durations?.trim();
  const buttonText = embed.buttonStyles?.buttonText?.trim() || "Open";
  const href = sanitizeUrl(embed.url);
  const imageUrl = sanitizeUrl(embed.image?.src?.url) ?? getWixImageUrl(embed.image?.src?.id);

  const content = (
    <>
      { imageUrl ? (
        <div className="overflow-hidden border-b border-[#e8dfd4] rounded-t-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */ }
          <img
            src={ imageUrl }
            alt={ title }
            width={ 320 }
            height={ 320 }
            className="h-60 object-cover p-0 m-0!"
          />
        </div>
      ) : null }
      <div className="space-y-3 p-4">
        <div className="space-y-1">
          { type ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-[#7c6f60]">{ type }</p>
          ) : null }
          <h4 className="text-lg font-semibold leading-snug text-[#2a221a]">{ title }</h4>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          { duration ? (
            <span className="rounded-full bg-[#fcfaf7] px-3 py-1 text-sm font-medium text-[#5b4d3c]">
              { duration }
            </span>
          ) : <span/> }
          <span className="inline-flex items-center text-sm font-semibold text-[#c24343]">
            { buttonText } <span aria-hidden className="ml-1">→</span>
          </span>
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <a
        key={ key }
        href={ href }
        target="_blank"
        rel="noreferrer noopener"
        className="block overflow-hidden rounded-2xl border border-[#e8dfd4] bg-white transition-colors hover:border-[#d6c7a5] max-w-105"
      >
        { content }
      </a>
    );
  }

  return (
    <div
      key={ key }
      className="my-6 overflow-hidden rounded-2xl border border-[#e8dfd4] bg-white"
    >
      { content }
    </div>
  );
}

function renderTable(node: WixTableNode, key: string): React.ReactNode {
  const rows = (node.nodes ?? []).filter((row): row is WixTableRowNode => row.type === "TABLE_ROW");
  if (!rows.length) {
    return null;
  }

  const rowHeader = Boolean(node.tableData?.rowHeader);
  const colMinWidth = node.tableData?.dimensions?.colsMinWidth ?? [];
  const colWidth = node.tableData?.dimensions?.colsWidthRatio ?? [];
  const rowHeight = node.tableData?.dimensions?.rowsHeight ?? [];

  return (
    <div key={ key } className="my-6 w-full overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-base leading-7 text-[#3d3124]">
        <tbody>
        { rows.map((row, rowIndex) => {
          const cells = (row.nodes ?? []).filter((cell): cell is WixTableCellNode => cell.type === "TABLE_CELL");
          const height = toDimension(rowHeight[rowIndex]);
          const rowStyle: React.CSSProperties = {};
          if (height) {
            rowStyle.height = `${ height }px`;
          }

          return (
            <tr key={ `${ key }-row-${ row.id ?? rowIndex }` } style={ rowStyle }>
              { cells.map((cell, colIndex) => {
                const isHeaderCell = rowHeader && rowIndex === 0;
                const minWidth = toDimension(colMinWidth[colIndex]);
                const width = toDimension(colWidth[colIndex]);
                const borderColors = cell.tableCellData?.borderColors;
                const backgroundColor = toSafeColor(cell.tableCellData?.cellStyle?.backgroundColor);
                const verticalAlignment = mapVerticalAlignment(cell.tableCellData?.cellStyle?.verticalAlignment);

                const style: React.CSSProperties = {
                  padding: "0.65rem 0.85rem",
                  verticalAlign: verticalAlignment,
                  borderLeft: `1px solid ${ toSafeColor(borderColors?.left) ?? "#d6c7a5" }`,
                  borderRight: `1px solid ${ toSafeColor(borderColors?.right) ?? "#d6c7a5" }`,
                  borderTop: `1px solid ${ toSafeColor(borderColors?.top) ?? "#d6c7a5" }`,
                  borderBottom: `1px solid ${ toSafeColor(borderColors?.bottom) ?? "#d6c7a5" }`,
                };

                if (backgroundColor) {
                  style.backgroundColor = backgroundColor;
                }

                if (minWidth) {
                  style.minWidth = `${ minWidth }px`;
                }

                if (width) {
                  style.width = `${ width }px`;
                }

                if (isHeaderCell) {
                  return (
                    <th
                      key={ `${ key }-cell-${ cell.id ?? `${ rowIndex }-${ colIndex }` }` }
                      style={ style }
                      className="font-semibold text-[#2a221a]"
                      scope="col"
                    >
                      { renderChildren(cell.nodes, `${ key }-cell-${ rowIndex }-${ colIndex }`) }
                    </th>
                  );
                }

                return (
                  <td
                    key={ `${ key }-cell-${ cell.id ?? `${ rowIndex }-${ colIndex }` }` }
                    style={ style }
                  >
                    { renderChildren(cell.nodes, `${ key }-cell-${ rowIndex }-${ colIndex }`) }
                  </td>
                );
              }) }
            </tr>
          );
        }) }
        </tbody>
      </table>
    </div>
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

    case "CODE_BLOCK":
      return renderCodeBlock(node as WixCodeBlockNode, key);

    case "APP_EMBED":
      return renderAppEmbed(node as WixAppEmbedNode, key);

    case "TABLE":
      return renderTable(node as WixTableNode, key);

    case "TABLE_ROW":
    case "TABLE_CELL":
      return null;

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
