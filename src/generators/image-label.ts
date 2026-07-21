import type { Locale } from "../i18n/locales";
import type { BoundaryMode, SizeMb } from "../lib/types";

/** プレビュー用キャンバスサイズ（小さめ固定 → 出力は数〜数十 KB 程度） */
const LABEL_CANVAS_WIDTH = 640;
const LABEL_CANVAS_HEIGHT = 360;

export type ImageLabel = {
  sizeMb: SizeMb;
  boundary: BoundaryMode;
  targetBytes: number;
  /** プレビュー文言の言語。省略時は ja */
  locale?: Locale;
};

const BOUNDARY_LABEL: Record<Locale, Record<BoundaryMode, string>> = {
  ja: {
    exact: "ちょうど",
    under: "−1 バイト",
    over: "+1 バイト",
  },
  en: {
    exact: "Exact",
    under: "−1 byte",
    over: "+1 byte",
  },
};

const BOUNDARY_PREFIX: Record<Locale, string> = {
  ja: "境界",
  en: "Boundary",
};

export function imageLabelFromParams(
  sizeMb: SizeMb,
  boundary: BoundaryMode,
  targetBytes: number,
  locale: Locale = "ja",
): ImageLabel {
  return { sizeMb, boundary, targetBytes, locale };
}

/**
 * OffscreenCanvas でサイズ情報を描画した画像バイト列を返す。
 * Canvas が使えない環境（Node テスト等）では null。
 */
export async function renderLabeledImage(
  label: ImageLabel,
  mimeType: "image/png" | "image/jpeg",
  quality = 0.92,
): Promise<Uint8Array | null> {
  if (typeof OffscreenCanvas === "undefined") {
    return null;
  }

  const canvas = new OffscreenCanvas(LABEL_CANVAS_WIDTH, LABEL_CANVAS_HEIGHT);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get OffscreenCanvas 2d context");
  }

  // 背景
  ctx.fillStyle = "#0f1419";
  ctx.fillRect(0, 0, LABEL_CANVAS_WIDTH, LABEL_CANVAS_HEIGHT);

  // 左アクセント
  ctx.fillStyle = "#3b82f6";
  ctx.fillRect(0, 0, 10, LABEL_CANVAS_HEIGHT);

  const locale = label.locale ?? "ja";
  const left = 40;
  ctx.textBaseline = "top";

  ctx.fillStyle = "#94a3b8";
  ctx.font = "500 22px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.fillText("chobitfile", left, 48);

  ctx.fillStyle = "#f1f5f9";
  ctx.font = "600 64px ui-sans-serif, system-ui, -apple-system, sans-serif";
  ctx.fillText(`${label.sizeMb} MB`, left, 100);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "500 28px ui-sans-serif, system-ui, -apple-system, sans-serif";
  const boundaryText = `${BOUNDARY_PREFIX[locale]}: ${BOUNDARY_LABEL[locale][label.boundary]}`;
  ctx.fillText(boundaryText, left, 190);

  ctx.fillStyle = "#94a3b8";
  ctx.font =
    "400 24px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  ctx.fillText(`${label.targetBytes.toLocaleString("en-US")} bytes`, left, 250);

  const blob =
    mimeType === "image/jpeg"
      ? await canvas.convertToBlob({ type: mimeType, quality })
      : await canvas.convertToBlob({ type: mimeType });
  return new Uint8Array(await blob.arrayBuffer());
}
