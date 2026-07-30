import {
  BULK_COUNT_MAX,
  BULK_COUNT_MIN,
  BULK_DIR_MAX_DEPTH,
  type BulkNameLocale,
  type BulkNameMode,
  DEFAULT_BULK_NAME_LOCALE,
  DEFAULT_BULK_NAME_MODE,
  FILE_TYPES,
  type FileType,
} from "../lib/types";
import { buildBulkBaseName } from "./bulk-filename";
import { generateFile } from "./generate-file";
import { buildStoreZip, type ZipEntry } from "./zip";

/**
 * 大量生成で使う1ファイルあたりの目標バイト数。
 * 各形式の最小サイズより少し余裕を持たせ、メモリ負荷を抑える。
 */
export const BULK_TARGET_BYTES: Record<FileType, number> = {
  png: 128,
  jpeg: 256,
  pdf: 512,
  docx: 2048,
  xlsx: 4096,
  pptx: 10_240,
  txt: 64,
  csv: 64,
  json: 64,
};

export type BulkGenerateParams = {
  count: number;
  types: readonly FileType[];
  /**
   * true のとき、各ファイルを最大 {@link BULK_DIR_MAX_DEPTH} 階層までの
   * ディレクトリにランダム配置する。デフォルト false（ルート直下にフラット配置）。
   */
  directories?: boolean;
  /** ファイル名モード。デフォルト sequential */
  nameMode?: BulkNameMode;
  /** nameMode が random のときの語彙。デフォルト en */
  nameLocale?: BulkNameLocale;
  /** [0, 1) を返す乱数。未指定時は Math.random。テスト注入用。 */
  random?: () => number;
};

export type BulkFilePlan = {
  index: number;
  type: FileType;
  /** ZIP 内パス（ディレクトリ有効時は `dir/sub/name.ext`） */
  name: string;
  targetBytes: number;
};

function isFileType(value: string): value is FileType {
  return (FILE_TYPES as readonly string[]).includes(value);
}

/** ディレクトリ名プール（ZIP 内で読みやすい短い名前） */
function buildDirNamePool(count: number): string[] {
  // 件数に応じて適度なバリエーション（最低 8、最大 64）
  const poolSize = Math.min(64, Math.max(8, Math.ceil(Math.sqrt(count) * 2)));
  const width = String(poolSize).length;
  const names: string[] = [];
  for (let i = 1; i <= poolSize; i++) {
    names.push(`dir-${String(i).padStart(width, "0")}`);
  }
  return names;
}

function pickDir(pool: readonly string[], random: () => number): string {
  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
  return pool[index];
}

/**
 * 深さ 1..maxDepth のディレクトリ接頭辞をランダム生成する。
 * 例: "dir-01/" / "dir-03/dir-12/"
 */
export function randomDirPrefix(
  pool: readonly string[],
  maxDepth: number,
  random: () => number,
): string {
  if (pool.length === 0 || maxDepth < 1) {
    return "";
  }
  // 1..maxDepth を均等に選ぶ
  const depth = 1 + Math.floor(random() * maxDepth);
  const clampedDepth = Math.min(maxDepth, Math.max(1, depth));
  const segments: string[] = [];
  for (let d = 0; d < clampedDepth; d++) {
    segments.push(pickDir(pool, random));
  }
  return `${segments.join("/")}/`;
}

/** 件数・形式の組み合わせをエントリ計画に展開する（ラウンドロビン） */
export function planBulkFiles(params: BulkGenerateParams): BulkFilePlan[] {
  const {
    count,
    types,
    directories = false,
    nameMode = DEFAULT_BULK_NAME_MODE,
    nameLocale = DEFAULT_BULK_NAME_LOCALE,
    random = Math.random,
  } = params;

  if (
    !Number.isInteger(count) ||
    count < BULK_COUNT_MIN ||
    count > BULK_COUNT_MAX
  ) {
    throw new Error(
      `Invalid bulk count: ${String(count)} (integer ${BULK_COUNT_MIN}..${BULK_COUNT_MAX})`,
    );
  }

  if (types.length === 0) {
    throw new Error("At least one file type is required");
  }

  const uniqueTypes: FileType[] = [];
  const seen = new Set<FileType>();
  for (const type of types) {
    if (!isFileType(type)) {
      throw new Error(`Invalid bulk type: ${String(type)}`);
    }
    if (!seen.has(type)) {
      seen.add(type);
      uniqueTypes.push(type);
    }
  }

  const sequentialWidth = String(count).length;
  const dirPool = directories ? buildDirNamePool(count) : [];
  const usedBaseNames = new Set<string>();
  const plans: BulkFilePlan[] = [];
  for (let i = 0; i < count; i++) {
    const type = uniqueTypes[i % uniqueTypes.length];
    const index = i + 1;
    const baseName = buildBulkBaseName({
      mode: nameMode,
      locale: nameLocale,
      sequentialWidth,
      index,
      usedBaseNames,
      random,
    });
    const fileName = `${baseName}.${type}`;
    const prefix = directories
      ? randomDirPrefix(dirPool, BULK_DIR_MAX_DEPTH, random)
      : "";
    plans.push({
      index,
      type,
      name: `${prefix}${fileName}`,
      targetBytes: BULK_TARGET_BYTES[type],
    });
  }
  return plans;
}

/**
 * 指定件数のダミーファイルを ZIP（store）にまとめて返す。
 * 同一形式は1サンプルを再利用し、メモリと生成コストを抑える。
 */
export async function generateBulkZip(
  params: BulkGenerateParams,
): Promise<Uint8Array> {
  const plans = planBulkFiles(params);
  const samples = new Map<FileType, Uint8Array>();

  for (const type of new Set(plans.map((p) => p.type))) {
    const targetBytes = BULK_TARGET_BYTES[type];
    const bytes = await generateFile(type, targetBytes);
    if (bytes.byteLength !== targetBytes) {
      throw new Error(
        `Bulk sample size mismatch for ${type}: expected ${targetBytes}, got ${bytes.byteLength}`,
      );
    }
    samples.set(type, bytes);
  }

  const entries: ZipEntry[] = plans.map((plan) => {
    const data = samples.get(plan.type);
    if (!data) {
      throw new Error(`Missing sample for ${plan.type}`);
    }
    return { name: plan.name, data };
  });

  return buildStoreZip(entries);
}
