import {
  BOUNDARY_MODES,
  type BoundaryMode,
  DEFAULT_PARAMS,
  FILE_TYPES,
  type FileType,
  type GeneratorParams,
  SIZE_MB_OPTIONS,
  type SizeMb,
} from "./types";

function isFileType(value: string): value is FileType {
  return (FILE_TYPES as readonly string[]).includes(value);
}

function isSizeMb(value: number): value is SizeMb {
  return (SIZE_MB_OPTIONS as readonly number[]).includes(value);
}

function isBoundary(value: string): value is BoundaryMode {
  return (BOUNDARY_MODES as readonly string[]).includes(value);
}

/** URL クエリから設定を読む。不正値はデフォルトにフォールバック */
export function paramsFromSearch(search: string): GeneratorParams {
  const q = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const typeRaw = q.get("type") ?? "";
  const sizeRaw = Number(q.get("size"));
  const boundaryRaw = q.get("boundary") ?? "";

  return {
    type: isFileType(typeRaw) ? typeRaw : DEFAULT_PARAMS.type,
    sizeMb: isSizeMb(sizeRaw) ? sizeRaw : DEFAULT_PARAMS.sizeMb,
    boundary: isBoundary(boundaryRaw) ? boundaryRaw : DEFAULT_PARAMS.boundary,
  };
}

export function searchFromParams(params: GeneratorParams): string {
  const q = new URLSearchParams({
    type: params.type,
    size: String(params.sizeMb),
    boundary: params.boundary,
  });
  return `?${q.toString()}`;
}
