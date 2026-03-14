"use client";

import type { ComponentType } from "react";
import { forwardRef, useEffect, useImperativeHandle } from "react";
import { Extension, Mark, mergeAttributes, Node } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { history } from "@tiptap/pm/history";
import {
  Bold,
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
} from "lucide-react";
import ImageResize from "tiptap-extension-resize-image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TiptapHtmlEditorHandle = {
  insertImage: (args: {
    alt: string;
    mediaId: string;
    src: string;
    storagePath: string;
  }) => void;
};

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
    onRequestInsertImage?: () => void;
    value: string;
  }
>(function TiptapHtmlEditor({
  className,
  onChange,
  onRequestInsertImage,
  value,
}, ref) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: editorExtensions,
    content: normalizeEditorValue(value),
    editorProps: {
      attributes: {
        class:
          "min-h-64 rounded-b-[1.25rem] px-4 py-4 text-sm leading-7 text-[#21343b] outline-none [&_blockquote]:border-l-4 [&_blockquote]:border-[#d8c5a8] [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-semibold [&_hr]:my-6 [&_hr]:border-[#eadfce] [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-4 [&_p:first-child]:mt-0 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-2",
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
      </div>

      <EditorContent editor={ editor }/>
    </div>
  );
});
