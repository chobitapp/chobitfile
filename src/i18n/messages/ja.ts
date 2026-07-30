export const ja = {
  meta: {
    title:
      "chobitfile 指定サイズの画像やオフィスファイルなどのダミーを生成するツール",
    description:
      "指定サイズの画像やオフィスファイルなどのダミーを生成するツール。対応フォーマット PNG, JPEG, DOCX, XLSX, PPTX, PDF, TXT, CSV, JSON",
  },
  mode: {
    label: "生成モード",
    size: "サイズ指定",
    bulk: "大量生成",
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
  bulk: {
    form: {
      count: "ファイル数",
      countDescription:
        "1〜10,000 件まで指定できます。ZIP にまとめてダウンロードします",
      countUnits: "件",
      fileTypes: "ファイル形式",
      selectAll: "すべて選択",
      directories: "ディレクトリに配置",
      directoriesDescription:
        "有効にすると、最大2階層までのディレクトリにファイルをランダム配置します",
      nameMode: "ファイル名",
      nameModeSequential: "連番",
      nameModeRandom: "ランダム",
      nameLocale: "ランダム名の言語",
      nameLocaleEn: "英語",
      nameLocaleJa: "日本語",
      nameModeDescription:
        "連番は chobitfile-0001 形式。ランダムは英単語または日本語の単語組み合わせ",
      preview: "生成内容",
      previewFiles: "ファイル",
      previewZip: "ZIP",
      previewWithDirs: "ディレクトリあり",
      previewNameSequential: "連番",
      previewNameRandomEn: "ランダム（英語）",
      previewNameRandomJa: "ランダム（日本語）",
      typesRequired: "形式を1つ以上選んでください",
    },
    actions: {
      generate: "ZIP を生成してダウンロード",
      generating: "生成中…",
    },
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
  mode: {
    label: string;
    size: string;
    bulk: string;
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
  bulk: {
    form: {
      count: string;
      countDescription: string;
      countUnits: string;
      fileTypes: string;
      selectAll: string;
      directories: string;
      directoriesDescription: string;
      nameMode: string;
      nameModeSequential: string;
      nameModeRandom: string;
      nameLocale: string;
      nameLocaleEn: string;
      nameLocaleJa: string;
      nameModeDescription: string;
      preview: string;
      previewFiles: string;
      previewZip: string;
      previewWithDirs: string;
      previewNameSequential: string;
      previewNameRandomEn: string;
      previewNameRandomJa: string;
      typesRequired: string;
    };
    actions: {
      generate: string;
      generating: string;
    };
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
