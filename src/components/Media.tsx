"use client";

import React, { useState } from 'react';
import Image from 'next/image';

const FALLBACK_BOOK_COVER =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='180' viewBox='0 0 120 180'%3E%3Crect width='120' height='180' fill='%23f4f1ea'/%3E%3Crect x='14' y='18' width='92' height='144' rx='4' fill='%23e8e3d6'/%3E%3Ctext x='60' y='96' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%235c646d'%3EBook%3C/text%3E%3C/svg%3E";

const FALLBACK_AVATAR =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='32' fill='%23e9ecef'/%3E%3Ccircle cx='32' cy='25' r='11' fill='%239aa1a9'/%3E%3Cpath d='M14 54c3-10 12-14 18-14s15 4 18 14' fill='%239aa1a9'/%3E%3C/svg%3E";

interface MediaProps {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  title?: string;
  priority?: boolean;
}

const FallbackImage: React.FC<MediaProps & { fallbackSrc: string }> = ({
  src,
  alt,
  width,
  height,
  className = '',
  title,
  priority = false,
  fallbackSrc,
}) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const trimmed = src?.trim() || '';
  const resolvedSrc = !trimmed || failedSrc === trimmed ? fallbackSrc : trimmed;

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      loading={priority ? 'eager' : 'lazy'}
      priority={priority}
      title={title}
      className={className}
      onError={() => {
        if (trimmed && failedSrc !== trimmed) setFailedSrc(trimmed);
      }}
    />
  );
};

/** Lazy-loaded book cover / post photo with built-in SVG fallback on error. */
export const BookCover: React.FC<MediaProps> = ({
  width = 160,
  height = 240,
  ...props
}) => <FallbackImage {...props} width={width} height={height} fallbackSrc={FALLBACK_BOOK_COVER} />;

/** Lazy-loaded user avatar with built-in SVG fallback on error. */
export const UserAvatar: React.FC<MediaProps> = ({
  width = 64,
  height = 64,
  ...props
}) => <FallbackImage {...props} width={width} height={height} fallbackSrc={FALLBACK_AVATAR} />;
