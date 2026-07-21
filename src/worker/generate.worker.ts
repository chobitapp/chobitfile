import { generateFile } from "../generators";
import { MIME_TYPES } from "../lib/types";
import { type GenerateRequest, parseGenerateRequest } from "./validate-request";

export type { GenerateRequest };

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
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
};

workerScope.onmessage = (event: MessageEvent<unknown>) => {
  void (async () => {
    try {
      const { type, targetBytes, filename, imageLabel } = parseGenerateRequest(
        event.data,
      );
      const bytes = await generateFile(type, targetBytes, { imageLabel });
      if (bytes.byteLength !== targetBytes) {
        throw new Error(
          `Generated size mismatch: expected ${targetBytes}, got ${bytes.byteLength}`,
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
