import { useCallback, useRef, useState } from "react";
import { imageLabelFromParams } from "../generators";
import type { Locale } from "../i18n/locales";
import { downloadBlob } from "../lib/download";
import { buildFilename } from "../lib/filename";
import { targetBytesFor } from "../lib/sizes";
import type { GeneratorParams } from "../lib/types";
import type {
  GenerateRequest,
  GenerateResponse,
} from "../worker/generate.worker";

type Status = "idle" | "generating" | "error";

export function useGenerateFile() {
  const workerRef = useRef<Worker | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const ensureWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL("../worker/generate.worker.ts", import.meta.url),
        { type: "module" },
      );
    }
    return workerRef.current;
  }, []);

  const generate = useCallback(
    async (params: GeneratorParams, locale: Locale = "ja") => {
      setStatus("generating");
      setError(null);

      const targetBytes = targetBytesFor(params.sizeMb, params.boundary);
      const filename = buildFilename(
        params.type,
        params.sizeMb,
        params.boundary,
      );
      const request: GenerateRequest = {
        type: params.type,
        targetBytes,
        filename,
        imageLabel:
          params.type === "png" || params.type === "jpeg"
            ? imageLabelFromParams(
                params.sizeMb,
                params.boundary,
                targetBytes,
                locale,
              )
            : undefined,
      };

      try {
        const worker = ensureWorker();
        const response = await new Promise<GenerateResponse>(
          (resolve, reject) => {
            const onMessage = (event: MessageEvent<GenerateResponse>) => {
              worker.removeEventListener("message", onMessage);
              worker.removeEventListener("error", onError);
              resolve(event.data);
            };
            const onError = (event: ErrorEvent) => {
              worker.removeEventListener("message", onMessage);
              worker.removeEventListener("error", onError);
              reject(new Error(event.message || "Worker error"));
            };
            worker.addEventListener("message", onMessage);
            worker.addEventListener("error", onError);
            worker.postMessage(request);
          },
        );

        if (!response.ok) {
          throw new Error(response.error);
        }

        const blob = new Blob([response.buffer], { type: response.mimeType });
        if (blob.size !== targetBytes) {
          throw new Error(
            `Size mismatch before download: expected ${targetBytes}, got ${blob.size}`,
          );
        }
        downloadBlob(blob, response.filename);
        setStatus("idle");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setStatus("error");
      }
    },
    [ensureWorker],
  );

  return {
    status,
    error,
    isGenerating: status === "generating",
    generate,
    clearError: () => {
      setError(null);
      setStatus("idle");
    },
  };
}
