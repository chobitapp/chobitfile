import { generateBulkZip, generateFile } from "../generators";
import { MIME_TYPES } from "../lib/types";
import {
  type BulkGenerateRequest,
  type GenerateRequest,
  parseWorkerRequest,
} from "./validate-request";

export type { WorkerRequest } from "./validate-request";
export type { BulkGenerateRequest, GenerateRequest };

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

function toTransferableBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

async function handleSingle(
  request: GenerateRequest,
): Promise<GenerateResponse> {
  const { type, targetBytes, filename, imageLabel } = request;
  const bytes = await generateFile(type, targetBytes, { imageLabel });
  if (bytes.byteLength !== targetBytes) {
    throw new Error(
      `Generated size mismatch: expected ${targetBytes}, got ${bytes.byteLength}`,
    );
  }
  const buffer = toTransferableBuffer(bytes);
  return {
    ok: true,
    buffer,
    filename,
    mimeType: MIME_TYPES[type],
  };
}

async function handleBulk(
  request: BulkGenerateRequest,
): Promise<GenerateResponse> {
  const bytes = await generateBulkZip({
    count: request.count,
    types: request.types,
    directories: request.directories === true,
    nameMode: request.nameMode,
    nameLocale: request.nameLocale,
  });
  const buffer = toTransferableBuffer(bytes);
  return {
    ok: true,
    buffer,
    filename: request.filename,
    mimeType: "application/zip",
  };
}

workerScope.onmessage = (event: MessageEvent<unknown>) => {
  void (async () => {
    try {
      const request = parseWorkerRequest(event.data);
      const response =
        request.mode === "bulk"
          ? await handleBulk(request)
          : await handleSingle(request);
      workerScope.postMessage(response, [response.buffer]);
    } catch (error) {
      const response: GenerateResponse = {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
      workerScope.postMessage(response);
    }
  })();
};
