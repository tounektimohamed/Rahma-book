import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { resolveStoryAssetUrl } from '../../utils/storyAssets';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackTitle,
}: ResilientImageProps) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = resolveStoryAssetUrl(src);

  if (failed || !resolvedSrc) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F8E8DC] via-[#FFF9F2] to-[#DCD6F7]/60 text-[#443B3B] p-6 text-center ${className}`}
      >
        <BookOpen className="w-10 h-10 text-[#443B3B]/45 mb-3" aria-hidden="true" />
        {fallbackTitle && (
          <span className="text-sm font-semibold text-[#443B3B]/80 line-clamp-2">
            {fallbackTitle}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
