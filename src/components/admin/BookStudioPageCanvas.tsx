import React, { useRef } from 'react';
import {
  hexToRgbString,
  type BookPage,
} from '../../utils/bookStudio';
import { resolveStoryAssetUrl } from '../../utils/storyAssets';

interface BookStudioPageCanvasProps {
  page: BookPage | null;
  rtl: boolean;
  childPhotoAsset?: string;
  interactive?: boolean;
  onMoveTextBox?: (x: number, y: number) => void;
  onCommitDrag?: () => void;
  className?: string;
}

export function BookStudioPageCanvas({
  page,
  rtl,
  childPhotoAsset,
  interactive = false,
  onMoveTextBox,
  onCommitDrag,
  className = '',
}: BookStudioPageCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    rect: DOMRect;
  } | null>(null);

  if (!page) {
    return (
      <div
        className={`w-full h-full bg-white ${className}`}
        aria-label="Blank filler page"
      />
    );
  }

  const isSplit = page.layout === 'split';
  const rgb = hexToRgbString(page.bg);
  const resolvedImg = page.img ? resolveStoryAssetUrl(page.img) : '';

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || isSplit || !onMoveTextBox || !containerRef.current) return;
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    dragStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: page.x,
      origY: page.y,
      rect,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || !onMoveTextBox) return;
    const dxPct = ((e.clientX - drag.startX) / drag.rect.width) * 100;
    const dyPct = ((e.clientY - drag.startY) / drag.rect.height) * 100;
    const nextX = Math.max(0, Math.min(100 - page.w, drag.origX + dxPct));
    const nextY = Math.max(0, Math.min(92, drag.origY + dyPct));
    onMoveTextBox(Number(nextX.toFixed(1)), Number(nextY.toFixed(1)));
  };

  const handlePointerUp = () => {
    if (dragStateRef.current) {
      dragStateRef.current = null;
      onCommitDrag?.();
    }
  };

  const badgePositionClass =
    page.childBadgeCorner === 'top-left'
      ? 'top-[5%] left-[5%]'
      : page.childBadgeCorner === 'top-right'
      ? 'top-[5%] right-[5%]'
      : 'bottom-[6%] left-1/2 -translate-x-1/2';

  return (
    <div
      ref={containerRef}
      style={{
        containerType: 'size',
        backgroundColor: isSplit ? page.bg : '#ffffff',
      }}
      className={`relative overflow-hidden w-full h-full select-none ${className}`}
    >
      {resolvedImg && (
        <img
          src={resolvedImg}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: isSplit ? '62%' : '100%',
            objectFit: page.fit,
            objectPosition: `${page.imgPosX}% ${page.imgPosY}%`,
            transform: `scale(${page.imgZoom})`,
            transformOrigin: `${page.imgPosX}% ${page.imgPosY}%`,
          }}
        />
      )}

      {page.frameBorder && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: '3%',
            border: '0.35cqw solid rgba(68,59,59,0.28)',
            borderRadius: '2cqw',
            pointerEvents: 'none',
          }}
        />
      )}

      {page.showChildBadge && childPhotoAsset && (
        <div
          className={`absolute ${badgePositionClass} rounded-full overflow-hidden shadow-md bg-[#F8E8DC]`}
          style={{
            width: `${page.childBadgeSize}%`,
            aspectRatio: '1 / 1',
            border: '0.7cqw solid #FFF9F2',
          }}
        >
          <img
            src={childPhotoAsset}
            alt=""
            draggable={false}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {page.text && (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            position: 'absolute',
            whiteSpace: 'pre-wrap',
            direction: rtl ? 'rtl' : 'ltr',
            padding: '2.2cqw',
            overflowWrap: 'anywhere',
            left: `${isSplit ? 4 : page.x}%`,
            top: `${isSplit ? 64 : page.y}%`,
            width: `${isSplit ? 92 : page.w}%`,
            fontFamily: `'${page.font}', sans-serif`,
            fontWeight: page.bold ? 700 : 400,
            fontSize: `${page.size}cqw`,
            lineHeight: page.lineHeight,
            color: page.color,
            textAlign: page.al,
            borderRadius: `${page.radius}cqw`,
            backgroundColor: isSplit ? 'transparent' : `rgba(${rgb},${page.a})`,
            textShadow:
              page.textShadow && !isSplit
                ? '0 1px 4px rgba(0,0,0,0.45)'
                : 'none',
            cursor: interactive && !isSplit ? 'move' : 'default',
            touchAction: interactive ? 'none' : 'auto',
          }}
        >
          {page.text}
        </div>
      )}
    </div>
  );
}
