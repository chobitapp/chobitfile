import {
  BULK_COUNT_MAX,
  BULK_COUNT_MIN,
  FILE_TYPES,
  type FileType,
} from "../lib/types";
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
};

export type BulkFilePlan = {
  index: number;
  type: FileType;
  name: string;
  targetBytes: number;
};

function isFileType(value: string): value is FileType {
  return (FILE_TYPES as readonly string[]).includes(value);
}

/** 件数・形式の組み合わせをエントリ計画に展開する（ラウンドロビン） */
export function planBulkFiles(params: BulkGenerateParams): BulkFilePlan[] {
  const { count, types } = params;

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

  const width = String(count).length;
  const plans: BulkFilePlan[] = [];
  for (let i = 0; i < count; i++) {
    const type = uniqueTypes[i % uniqueTypes.length];
    const index = i + 1;
    const name = `chobitfile-${String(index).padStart(width, "0")}.${type}`;
    plans.push({
      index,
      type,
      name,
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
