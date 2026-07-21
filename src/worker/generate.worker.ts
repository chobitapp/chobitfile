import { generateFile, type PngLabel } from "../generators";
import { type FileType, MIME_TYPES } from "../lib/types";

export type GenerateRequest = {
  type: FileType;
  targetBytes: number;
  filename: string;
  /** PNG のときプレビューに描くラベル */
  pngLabel?: PngLabel;
};

export type GenerateResponse =
  | {
      ok: true;
      buffer: ArrayBuffer;
      filename: string;
      mimeType: string;
    }
  | {
      ok: false;
      error: string;
    };

const workerScope = self as unknown as {
  postMessage: (message: GenerateResponse, transfer?: Transferable[]) => void;
  onmessage: ((event: MessageEvent<GenerateRequest>) => void) | null;
};

workerScope.onmessage = (event: MessageEvent<GenerateRequest>) => {
  const { type, targetBytes, filename, pngLabel } = event.data;
  void (async () => {
    try {
      const bytes = await generateFile(type, targetBytes, { pngLabel });
      if (bytes.byteLength !== targetBytes) {
        throw new Error(
          `生成サイズ不一致: expected ${targetBytes}, got ${bytes.byteLength}`,
        );
      }
      const buffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer;
      const response: GenerateResponse = {
        ok: true,
        buffer,
        filename,
        mimeType: MIME_TYPES[type],
      };
      workerScope.postMessage(response, [buffer]);
    } catch (error) {
      const response: GenerateResponse = {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
      workerScope.postMessage(response);
    }
  })();
};
