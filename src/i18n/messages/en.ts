import type { Messages } from "./ja";

export const en: Messages = {
  meta: {
    title:
      "chobitfile — Generate dummy files at exact sizes (images, Office, and more)",
    description:
      "Generate dummy files of a specified size in your browser. Formats: PNG, JPEG, DOCX, XLSX, PPTX, PDF, TXT, CSV, JSON",
  },
  form: {
    fileType: "File type",
    size: "Size",
    sizeDescription: "1 MB = 1,048,576 bytes (1024-based)",
    boundary: "Boundary mode",
    boundaryExact: "Exact",
    boundaryUnder: "−1 byte",
    boundaryOver: "+1 byte",
    preview: "Output",
    previewBytes: "bytes",
  },
  sections: {
    image: "Images",
    document: "Documents",
    text: "Text",
  },
  actions: {
    generate: "Generate and download",
    generating: "Generating…",
  },
  errors: {
    generateFailed: "Generation failed",
  },
  cli: {
    heading: "Also available as a CLI",
    generateComment: "# Generate a 10MB PDF",
    installComment: "# Install globally",
  },
  lang: {
    label: "Language",
    ja: "日本語",
    en: "English",
  },
  sizeOption: (sizeMb, formattedBytes) =>
    `${sizeMb} MB (${formattedBytes} bytes)`,
};
