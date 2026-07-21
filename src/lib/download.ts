export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // 一部ブラウザは revoke が早すぎると失敗するため遅延
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
