import type { Canvas } from 'fabric';

function exportCanvasToSvg(canvas: Canvas): string {
  /**
   * var: canvas
   * type: Canvas
   * desc: Fabric canvas to serialize as SVG text.
   */
  const svgString = canvas.toSVG();
  if (!svgString.trim()) {
    throw new Error('SVG export failed: empty payload generated.');
  }
  return svgString;
}

function dataUrlToBlob(dataUrl: string): Blob {
  /**
   * var: dataUrl
   * type: string
   * desc: Base64 PNG data URL produced by Fabric canvas.
   */
  const parts = dataUrl.split(',');
  if (parts.length !== 2) {
    throw new Error('PNG export failed: malformed data URL.');
  }
  const mimeMatch = parts[0].match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] ?? 'image/png';
  const binaryString = atob(parts[1]);
  const bytes = new Uint8Array(binaryString.length);
  for (let index = 0; index < binaryString.length; index += 1) {
    bytes[index] = binaryString.charCodeAt(index);
  }
  return new Blob([bytes], {
    type: mimeType
  });
}

function exportCanvasToPngBlob(canvas: Canvas): Blob {
  /**
   * var: canvas
   * type: Canvas
   * desc: Fabric canvas to serialize as PNG blob.
   */
  const pngDataUrl = canvas.toDataURL({
    enableRetinaScaling: true,
    format: 'png',
    multiplier: 2
  });
  if (!pngDataUrl.startsWith('data:image/png')) {
    throw new Error('PNG export failed: invalid PNG data URL generated.');
  }
  return dataUrlToBlob(pngDataUrl);
}

function triggerDownload(blob: Blob, fileName: string): void {
  /**
   * var: blob
   * type: Blob
   * desc: Binary file payload to download.
   * var: fileName
   * type: string
   * desc: Downloaded file name shown to the user.
   */
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

export {
  exportCanvasToPngBlob,
  exportCanvasToSvg,
  triggerDownload
};
