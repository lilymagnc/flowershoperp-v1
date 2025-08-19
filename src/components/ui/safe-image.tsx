"use client";
import { useState, useRef, useEffect } from 'react';

interface SafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fallbackSrc?: string;
  onError?: (error: any) => void;
}

export function SafeImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fallbackSrc,
  onError
}: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);

  // 디버깅용 로그
  console.log('SafeImage 렌더링:', { src, currentSrc, isLoading, hasError });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isMountedRef.current) {
      setCurrentSrc(src);
      setHasError(false);
      setIsLoading(true);
    }
  }, [src]);

  const handleError = (error: any) => {
    if (!isMountedRef.current) return;

    console.error('SafeImage 로딩 실패:', error);
    setHasError(true);
    setIsLoading(false);

    // fallback 이미지가 있고 아직 시도하지 않았다면
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
    } else {
      // 모든 시도가 실패한 경우
      onError?.(error);
    }
  };

  const handleLoad = () => {
    console.log('SafeImage 로드 성공:', currentSrc);
    if (isMountedRef.current) {
      setIsLoading(false);
    }
  };

  // 로딩 중이거나 오류가 있는 경우 스켈레톤 표시
  if (isLoading) {
    console.log('SafeImage 로딩 중 스켈레톤 표시');
    return (
      <div 
        className={`bg-gray-200 animate-pulse ${className}`}
        style={{ width, height }}
      />
    );
  }

  // 모든 이미지 로딩이 실패한 경우 기본 이미지 표시
  if (hasError && (!fallbackSrc || currentSrc === fallbackSrc)) {
    return (
      <div 
        className={`bg-gray-100 flex items-center justify-center text-gray-400 ${className}`}
        style={{ width, height }}
      >
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }

  console.log('SafeImage 이미지 렌더링:', currentSrc);
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
