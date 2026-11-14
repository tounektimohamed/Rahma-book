export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export const MAX_ORIGINAL_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_COMPRESSED_BASE64_BYTES = 180_000; // ~180 KB safe budget per photo
export const FIRESTORE_SAFE_DOC_BYTES = 850_000; // Safely below 1 MiB (1,048,576 bytes)

export interface ImageValidationResult {
  valid: boolean;
  errorCode?: 'invalid_type' | 'file_too_large' | 'empty_file' | 'invalid_data_url';
}

export interface ImageCompressionOptions {
  rotation?: number; // 0, 90, 180, 270
  cropZoom?: number; // 1.0 .. 2.5
  cropOffsetX?: number; // -0.5 .. 0.5
  cropOffsetY?: number; // -0.5 .. 0.5
  maxDimension?: number;
  initialQuality?: number;
}

export interface CompressedImageResult {
  base64: string;
  byteSize: number;
  width: number;
  height: number;
}

export function validateImageMeta(file: { type: string; size: number }): ImageValidationResult {
  if (!file || file.size <= 0) {
    return { valid: false, errorCode: 'empty_file' };
  }
  const normalizedType = file.type.toLowerCase();
  const isAllowed = (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(normalizedType);
  if (!isAllowed) {
    return { valid: false, errorCode: 'invalid_type' };
  }
  if (file.size > MAX_ORIGINAL_IMAGE_BYTES) {
    return { valid: false, errorCode: 'file_too_large' };
  }
  return { valid: true };
}

export function getImageSize(base64DataUrl: string): number {
  if (!base64DataUrl) return 0;
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(base64DataUrl).length;
  }
  return base64DataUrl.length;
}

export function validateFirestoreDocumentSize(
  payload: unknown,
  maxBytes: number = FIRESTORE_SAFE_DOC_BYTES
): { valid: boolean; byteSize: number } {
  const serialized = JSON.stringify(payload);
  const byteSize =
    typeof TextEncoder !== 'undefined'
      ? new TextEncoder().encode(serialized).length
      : serialized.length;
  return {
    valid: byteSize <= maxBytes,
    byteSize,
  };
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('IMAGE_DECODE_FAILED'));
    img.src = src;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('FILE_READ_FAILED'));
      }
    };
    reader.onerror = () => reject(new Error('FILE_READ_FAILED'));
    reader.readAsDataURL(file);
  });
}

export const ImageService = {
  validateImage(file: File): ImageValidationResult {
    return validateImageMeta({ type: file.type, size: file.size });
  },

  async convertImageToBase64(
    canvas: HTMLCanvasElement,
    quality: number = 0.78
  ): Promise<string> {
    return canvas.toDataURL('image/jpeg', quality);
  },

  async compressImage(
    source: File | string,
    options: ImageCompressionOptions = {}
  ): Promise<CompressedImageResult> {
    const {
      rotation = 0,
      cropZoom = 1,
      cropOffsetX = 0,
      cropOffsetY = 0,
      maxDimension = 420,
      initialQuality = 0.78,
    } = options;

    let dataUrl: string;
    if (typeof source === 'string') {
      if (!source.startsWith('data:image/')) {
        throw new Error('INVALID_IMAGE_SOURCE');
      }
      dataUrl = source;
    } else {
      const check = validateImageMeta({ type: source.type, size: source.size });
      if (!check.valid) {
        throw new Error(check.errorCode ?? 'INVALID_IMAGE');
      }
      dataUrl = await readFileAsDataUrl(source);
    }

    const img = await loadImageElement(dataUrl);

    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const isSwapped = normalizedRotation === 90 || normalizedRotation === 270;
    const rotatedWidth = isSwapped ? img.naturalHeight : img.naturalWidth;
    const rotatedHeight = isSwapped ? img.naturalWidth : img.naturalHeight;

    // First draw rotated image onto an intermediate canvas
    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = rotatedWidth;
    rotCanvas.height = rotatedHeight;
    const rotCtx = rotCanvas.getContext('2d');
    if (!rotCtx) {
      throw new Error('CANVAS_CONTEXT_UNAVAILABLE');
    }

    rotCtx.save();
    rotCtx.translate(rotatedWidth / 2, rotatedHeight / 2);
    rotCtx.rotate((normalizedRotation * Math.PI) / 180);
    rotCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    rotCtx.restore();

    // Square centered crop with zoom and pan
    const minSide = Math.min(rotatedWidth, rotatedHeight);
    const clampedZoom = Math.max(1, Math.min(3, cropZoom));
    const cropSize = minSide / clampedZoom;

    const maxPanX = Math.max(0, (rotatedWidth - cropSize) / 2);
    const maxPanY = Math.max(0, (rotatedHeight - cropSize) / 2);
    const sx = Math.max(
      0,
      Math.min(
        rotatedWidth - cropSize,
        (rotatedWidth - cropSize) / 2 + cropOffsetX * maxPanX * 2
      )
    );
    const sy = Math.max(
      0,
      Math.min(
        rotatedHeight - cropSize,
        (rotatedHeight - cropSize) / 2 + cropOffsetY * maxPanY * 2
      )
    );

    const targetSide = Math.min(maxDimension, Math.round(cropSize));
    const outCanvas = document.createElement('canvas');
    outCanvas.width = targetSide;
    outCanvas.height = targetSide;
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) {
      throw new Error('CANVAS_CONTEXT_UNAVAILABLE');
    }

    // Fill warm cream paper backdrop for transparent PNG/WEBP uploads before JPEG conversion
    outCtx.fillStyle = '#FFF9F2';
    outCtx.fillRect(0, 0, targetSide, targetSide);
    outCtx.drawImage(rotCanvas, sx, sy, cropSize, cropSize, 0, 0, targetSide, targetSide);

    // Step down JPEG quality if needed to stay safely inside Firestore budget
    let quality = initialQuality;
    let base64 = await this.convertImageToBase64(outCanvas, quality);
    let byteSize = getImageSize(base64);

    while (byteSize > MAX_COMPRESSED_BASE64_BYTES && quality > 0.35) {
      quality = Math.max(0.35, quality - 0.1);
      base64 = await this.convertImageToBase64(outCanvas, quality);
      byteSize = getImageSize(base64);
    }

    if (byteSize > MAX_COMPRESSED_BASE64_BYTES) {
      throw new Error('COMPRESSED_IMAGE_TOO_LARGE');
    }

    return {
      base64,
      byteSize,
      width: targetSide,
      height: targetSide,
    };
  },

  async compressArtworkImage(
    file: File,
    maxLongEdge: number = 760
  ): Promise<CompressedImageResult> {
    const check = validateImageMeta({ type: file.type, size: file.size });
    if (!check.valid) {
      throw new Error(check.errorCode ?? 'INVALID_IMAGE');
    }
    const dataUrl = await readFileAsDataUrl(file);
    const img = await loadImageElement(dataUrl);

    const scale = Math.min(1, maxLongEdge / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('CANVAS_CONTEXT_UNAVAILABLE');
    }
    ctx.fillStyle = '#FFF9F2';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    let quality = 0.82;
    let base64 = await this.convertImageToBase64(canvas, quality);
    let byteSize = getImageSize(base64);

    while (byteSize > MAX_COMPRESSED_BASE64_BYTES && quality > 0.35) {
      quality = Math.max(0.35, quality - 0.1);
      base64 = await this.convertImageToBase64(canvas, quality);
      byteSize = getImageSize(base64);
    }

    if (byteSize > MAX_COMPRESSED_BASE64_BYTES) {
      throw new Error('COMPRESSED_IMAGE_TOO_LARGE');
    }

    return { base64, byteSize, width, height };
  },

  getImageSize,
  validateFirestoreDocumentSize,
};
