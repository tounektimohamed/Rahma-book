import React, { useRef, useState } from 'react';
import { ImagePlus, RotateCw, Trash2, Upload, ZoomIn } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { ImageService } from '../../services/images/ImageService';

interface PhotoUploaderCropperProps {
  photoBase64: string;
  onPhotoChange: (base64: string) => void;
  errorMessage?: string;
}

export function PhotoUploaderCropper({
  photoBase64,
  onPhotoChange,
  errorMessage,
}: PhotoUploaderCropperProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep raw original file dataUrl in component memory only while editing crop/rotation
  const [rawSourceUrl, setRawSourceUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [processing, setProcessing] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [compressedBytes, setCompressedBytes] = useState<number>(() =>
    photoBase64 ? ImageService.getImageSize(photoBase64) : 0
  );

  const runCompression = async (
    source: File | string,
    nextRotation: number,
    nextZoom: number
  ) => {
    setProcessing(true);
    setLocalError(null);
    try {
      const result = await ImageService.compressImage(source, {
        rotation: nextRotation,
        cropZoom: nextZoom,
        maxDimension: 420,
        initialQuality: 0.78,
      });
      setCompressedBytes(result.byteSize);
      onPhotoChange(result.base64);
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'invalid_type') {
        setLocalError(t.photoErrorType);
      } else if (code === 'file_too_large') {
        setLocalError(t.photoErrorSize);
      } else {
        setLocalError(t.photoErrorProcess);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = ImageService.validateImage(file);
    if (!validation.valid) {
      if (validation.errorCode === 'invalid_type') {
        setLocalError(t.photoErrorType);
      } else if (validation.errorCode === 'file_too_large') {
        setLocalError(t.photoErrorSize);
      } else {
        setLocalError(t.photoErrorProcess);
      }
      e.target.value = '';
      return;
    }

    // Store original in memory for lossless re-cropping/rotating in Step 2
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        setRawSourceUrl(reader.result);
        setRotation(0);
        setCropZoom(1);
        await runCompression(file, 0, 1);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRotate = async () => {
    const nextRotation = (rotation + 90) % 360;
    setRotation(nextRotation);
    const source = rawSourceUrl || photoBase64;
    if (source) {
      await runCompression(source, nextRotation, cropZoom);
    }
  };

  const handleZoomChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextZoom = Number(e.target.value);
    setCropZoom(nextZoom);
    const source = rawSourceUrl || photoBase64;
    if (source) {
      await runCompression(source, rotation, nextZoom);
    }
  };

  const handleRemove = () => {
    setRawSourceUrl(null);
    setRotation(0);
    setCropZoom(1);
    setCompressedBytes(0);
    setLocalError(null);
    onPhotoChange('');
  };

  const displayedError = localError || errorMessage;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-[#443B3B]">{t.photoUploadTitle}</h3>
        <p className="text-sm text-[#706464]">{t.photoUploadHelp}</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="sr-only"
        id="child-photo-input"
        data-testid="child-photo-input"
      />

      {!photoBase64 ? (
        <label
          htmlFor="child-photo-input"
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#EADFD7] bg-[#FFF9F2] hover:bg-[#F8E8DC]/50 transition-colors p-8 sm:p-12 text-center cursor-pointer"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#F5B8B8]/40 flex items-center justify-center mb-4">
            <ImagePlus className="w-7 h-7 text-[#443B3B]" aria-hidden="true" />
          </div>
          <span className="text-sm font-bold text-[#443B3B] mb-1">
            {processing ? '...' : t.choosePhotoBtn}
          </span>
          <span className="text-xs text-[#706464]">JPEG · PNG · WEBP (Max 5 MB)</span>
        </label>
      ) : (
        <div className="rounded-2xl border border-[#EADFD7] bg-white p-5 space-y-5">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-44 h-44 rounded-2xl overflow-hidden border border-[#EADFD7] bg-[#F8E8DC] shrink-0">
              <img
                src={photoBase64}
                alt="Child preview"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 w-full space-y-4">
              <div className="text-xs font-medium text-[#443B3B] flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#4E7A56]" aria-hidden="true" />
                <span>{t.photoReadyLabel}</span>
                {compressedBytes > 0 && (
                  <span className="text-[#706464] tabular-nums">
                    ({Math.max(1, Math.round(compressedBytes / 1024))} KB)
                  </span>
                )}
              </div>

              {/* Crop Zoom Control */}
              <div className="space-y-1.5">
                <label
                  htmlFor="photo-zoom-slider"
                  className="flex items-center justify-between text-xs font-semibold text-[#443B3B]"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
                    {t.zoomLabel}
                  </span>
                  <span className="tabular-nums">{cropZoom.toFixed(1)}×</span>
                </label>
                <input
                  id="photo-zoom-slider"
                  type="range"
                  min="1"
                  max="2.2"
                  step="0.1"
                  value={cropZoom}
                  onChange={handleZoomChange}
                  disabled={processing}
                  className="w-full accent-[#443B3B] cursor-pointer"
                />
              </div>

              {/* Rotate, Replace, Remove Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleRotate}
                  disabled={processing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EADFD7] bg-[#FFF9F2] text-xs font-semibold text-[#443B3B] hover:bg-[#F8E8DC] transition-colors cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t.rotateBtn}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={processing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#EADFD7] bg-[#FFF9F2] text-xs font-semibold text-[#443B3B] hover:bg-[#F8E8DC] transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t.replacePhotoBtn}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={processing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E7C2C2] bg-[#FFF5F5] text-xs font-semibold text-[#8E2F2F] hover:bg-[#FCE8E8] transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t.removePhotoBtn}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {displayedError && (
        <p role="alert" className="text-sm font-medium text-[#993636] bg-[#FCE8E8] border border-[#E7C2C2] rounded-xl px-4 py-2.5">
          {displayedError}
        </p>
      )}
    </div>
  );
}
