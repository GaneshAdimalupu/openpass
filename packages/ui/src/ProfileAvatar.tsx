'use client'

import Image from 'next/image'

type ProfileAvatarProps = {
  src: string | null | undefined
  alt: string
  /** Pixel size of the avatar (width = height) */
  size: number
  /** Fallback text when no image (e.g. user initials) */
  fallback?: string
  className?: string
  /** Extra classes for the fallback container */
  fallbackClassName?: string
}

/**
 * Optimized profile avatar using next/image.
 * - Serves resized, WebP/AVIF images via Next.js image pipeline
 * - Lazy loads by default with a blurred shimmer placeholder
 * - Falls back to initials when no image URL is available
 */
export function ProfileAvatar({
  src,
  alt,
  size,
  fallback,
  className = '',
  fallbackClassName = '',
}: ProfileAvatarProps) {
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center font-bold ${fallbackClassName}`}
        style={{ width: size, height: size }}
      >
        {fallback || '?'}
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      // Only request what we need — the avatar is small
      sizes={`${size}px`}
      // Priority false = lazy load (good for avatars below the fold / in lists)
      priority={false}
      // Use a tiny inline shimmer while loading to prevent layout shift
      placeholder="blur"
      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMjIyIi8+PC9zdmc+"
    />
  )
}
