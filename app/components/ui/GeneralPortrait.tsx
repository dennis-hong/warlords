'use client';

import { useState } from 'react';

// 초상화 이미지가 있는 장수 ID 매핑 (rebels.png → zhangjiao)
const PORTRAIT_IMAGE_MAP: Record<string, string> = {
  zhangjiao: 'rebels',
};

interface GeneralPortraitProps {
  generalId: string;
  portrait: string; // 이모지 폴백
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

export function GeneralPortrait({ generalId, portrait, size = 'md', className = '' }: GeneralPortraitProps) {
  const [imgError, setImgError] = useState(false);
  const px = SIZE_MAP[size];
  const imageFile = PORTRAIT_IMAGE_MAP[generalId] || generalId;
  const imagePath = `/images/portraits/${imageFile}.png`;

  if (imgError) {
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 ${className}`}
        style={{ width: px, height: px, fontSize: px * 0.65 }}
      >
        {portrait}
      </span>
    );
  }

  return (
    <img
      src={imagePath}
      alt={generalId}
      onError={() => setImgError(true)}
      className={`rounded-full object-cover border-2 border-gold/40 bg-dynasty-dark shrink-0 ${className}`}
      style={{ width: px, height: px }}
    />
  );
}
