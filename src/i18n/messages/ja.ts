export const ja = {
  meta: {
    title:
      "chobitfile 指定サイズの画像やオフィスファイルなどのダミーを生成するツール",
    description:
      "指定サイズの画像やオフィスファイルなどのダミーを生成するツール。対応フォーマット PNG, JPEG, DOCX, XLSX, PPTX, PDF, TXT, CSV, JSON",
  },
  form: {
    fileType: "ファイル形式",
    size: "サイズ",
    sizeDescription: "1 MB = 1,048,576 バイト（1024 系）",
    boundary: "境界モード",
    boundaryExact: "ちょうど",
    boundaryUnder: "−1 バイト",
    boundaryOver: "+1 バイト",
    preview: "生成内容",
    previewBytes: "バイト",
  },
  sections: {
    image: "画像",
    document: "ドキュメント",
    text: "テキスト",
  },
  actions: {
    generate: "生成してダウンロード",
    generating: "生成中…",
  },
  errors: {
    generateFailed: "生成に失敗しました",
  },
  cli: {
    heading: "CLI でも使えます",
    generateComment: "# 10MBのPDFファイルを生成",
    installComment: "# グローバルにインストール",
  },
  lang: {
    label: "言語",
    ja: "日本語",
    en: "English",
  },
  sizeOption: (sizeMb: number, formattedBytes: string) =>
    `${sizeMb} MB（${formattedBytes} バイト）`,
} as const;

export type Messages = {
  meta: {
    title: string;
    description: string;
  };
  form: {
    fileType: string;
    size: string;
    sizeDescription: string;
    boundary: string;
    boundaryExact: string;
    boundaryUnder: string;
    boundaryOver: string;
    preview: string;
    previewBytes: string;
  };
  sections: {
    image: string;
    document: string;
    text: string;
  };
  actions: {
    generate: string;
    generating: string;
  };
  errors: {
    generateFailed: string;
  };
  cli: {
    heading: string;
    generateComment: string;
    installComment: string;
  };
  lang: {
    label: string;
    ja: string;
    en: string;
  };
  sizeOption: (sizeMb: number, formattedBytes: string) => string;
};
