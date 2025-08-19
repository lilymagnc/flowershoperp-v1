"use client";
import { useState, useEffect } from 'react';

interface SimpleImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
  onError?: (error: any) => void;
}

export function SimpleImage({
  src,
  alt,
  width,
  height,
  className,
  fallbackSrc,
  onError
}: SimpleImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  const handleError = () => {
    if (!hasError && fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(true);
      setIsLoading(true);
    } else {
      setIsLoading(false);
      onError?.(new Error('이미지 로딩 실패'));
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div 
        className={`bg-gray-200 animate-pulse ${className || ''}`}
        style={{ width, height }}
      />
    );
  }

  if (hasError && currentSrc === fallbackSrc) {
    return (
      <div 
        className={`bg-gray-100 flex items-center justify-center text-gray-400 ${className || ''}`}
        style={{ width, height }}
      >
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
}



