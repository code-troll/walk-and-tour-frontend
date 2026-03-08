export type WixDecoration =
  | {
  type: "BOLD";
  fontWeightValue?: number;
}
  | {
  type: "ITALIC";
}
  | {
  type: "UNDERLINE";
}
  | {
  type: "SPOILER";
}
  | {
  type: "STRIKETHROUGH";
}
  | {
  type: "COLOR";
  colorData?: {
    foreground?: string;
    background?: string;
  };
}
  | {
  type: "LINK";
  linkData?: {
    link?: {
      url?: string;
      target?: "BLANK" | "SELF" | string;
      rel?: {
        noreferrer?: boolean;
        nofollow?: boolean;
        noopener?: boolean;
      };
    };
  };
};

export type WixTextNode = {
  type: "TEXT";
  id?: string;
  nodes?: [];
  textData?: {
    text?: string;
    decorations?: WixDecoration[];
  };
};

export type WixParagraphNode = {
  type: "PARAGRAPH";
  id?: string;
  nodes?: WixNode[];
  paragraphData?: {
    textStyle?: {
      textAlignment?: "AUTO" | "LEFT" | "CENTER" | "RIGHT" | "JUSTIFY";
    };
  };
};

export type WixHeadingNode = {
  type: "HEADING";
  id?: string;
  nodes?: WixNode[];
  headingData?: {
    level?: number;
    textStyle?: {
      textAlignment?: "AUTO" | "LEFT" | "CENTER" | "RIGHT" | "JUSTIFY";
    };
  };
};

export type WixImageNode = {
  type: "IMAGE";
  id?: string;
  nodes?: WixNode[];
  imageData?: {
    containerData?: {
      alignment?: "LEFT" | "CENTER" | "RIGHT";
      textWrap?: boolean;
      width?: {
        size?: "CONTENT" | "SMALL" | "MEDIUM" | "LARGE" | string;
      };
    };
    image?: {
      src?: {
        id?: string;
        width?: number | string;
        height?: number | string;
      };
      width?: number | string;
      height?: number | string;
    };
    altText?: string;
    caption?: string;
  };
};

export type WixHtmlNode = {
  type: "HTML";
  id?: string;
  nodes?: WixNode[];
  htmlData?: {
    containerData?: {
      width?: {
        custom?: number | string;
      };
      height?: {
        custom?: number | string;
      };
      alignment?: "LEFT" | "CENTER" | "RIGHT";
      textWrap?: boolean;
    };
    html?: string;
    source?: string;
    autoHeight?: boolean;
  };
};

export type WixListItemNode = {
  type: "LIST_ITEM";
  id?: string;
  nodes?: WixNode[];
};

export type WixBulletedListNode = {
  type: "BULLETED_LIST";
  id?: string;
  nodes?: WixListItemNode[];
  bulletedListData?: {
    indentation?: number;
  };
};

export type WixNumberedListNode = {
  type: "NUMBERED_LIST";
  id?: string;
  nodes?: WixListItemNode[];
  numberedListData?: {
    indentation?: number;
  };
};

export type WixUnsupportedNode = {
  type: string;
  id?: string;
  nodes?: WixNode[];
  [key: string]: unknown;
};

export type WixNode =
  | WixTextNode
  | WixParagraphNode
  | WixHeadingNode
  | WixImageNode
  | WixHtmlNode
  | WixListItemNode
  | WixBulletedListNode
  | WixNumberedListNode
  | WixUnsupportedNode;

export type WixRichContent = {
  nodes?: WixNode[];
  documentStyle?: Record<string, unknown>;
};

export type WixPost = {
  id: string;
  title: string;
  excerpt?: string;
  slug?: string;
  richContent?: WixRichContent;
  media?: {
    wixMedia?: {
      image?: {
        url?: string;
        altText?: string;
        width?: number;
        height?: number;
      };
    };
    altText?: string;
  };
};
