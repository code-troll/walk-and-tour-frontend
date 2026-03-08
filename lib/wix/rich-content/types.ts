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
    url?: string;
    source?: string;
    autoHeight?: boolean;
  };
};

export type WixCodeBlockNode = {
  type: "CODE_BLOCK";
  id?: string;
  nodes?: WixNode[];
  codeBlockData?: {
    text?: string;
    code?: string;
    content?: string;
    value?: string;
    language?: string;
  };
};

export type WixAppEmbedNode = {
  type: "APP_EMBED";
  id?: string;
  nodes?: WixNode[];
  appEmbedData?: {
    type?: string;
    itemId?: string;
    name?: string;
    url?: string;
    image?: {
      src?: {
        url?: string;
        id?: string;
      };
      width?: number | string;
      height?: number | string;
    };
    bookingData?: {
      durations?: string;
    };
    buttonStyles?: {
      buttonText?: string;
    };
    pricingData?: Record<string, unknown>;
  };
};

export type WixTableCellNode = {
  type: "TABLE_CELL";
  id?: string;
  nodes?: WixNode[];
  tableCellData?: {
    cellStyle?: {
      verticalAlignment?: "TOP" | "MIDDLE" | "BOTTOM" | string;
      backgroundColor?: string;
    };
    borderColors?: {
      left?: string;
      right?: string;
      top?: string;
      bottom?: string;
    };
  };
};

export type WixTableRowNode = {
  type: "TABLE_ROW";
  id?: string;
  nodes?: WixTableCellNode[];
};

export type WixTableNode = {
  type: "TABLE";
  id?: string;
  nodes?: WixTableRowNode[];
  tableData?: {
    dimensions?: {
      colsWidthRatio?: Array<number | string>;
      rowsHeight?: Array<number | string>;
      colsMinWidth?: Array<number | string>;
    };
    rowHeader?: boolean;
    cellPadding?: unknown[];
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
  | WixCodeBlockNode
  | WixAppEmbedNode
  | WixTableNode
  | WixTableRowNode
  | WixTableCellNode
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
