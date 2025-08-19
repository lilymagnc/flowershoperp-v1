"use client";
import { useEffect } from 'react';
import { useSettings } from '@/hooks/use-settings';

export function FaviconSetter() {
  const { settings } = useSettings();

  useEffect(() => {
    if (settings?.faviconUrl) {
      // 기존 파비콘 링크 제거
      const existingFavicon = document.querySelector('link[rel="icon"]');
      if (existingFavicon) {
        existingFavicon.remove();
      }

      // 새로운 파비콘 링크 추가
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = settings.faviconUrl;
      document.head.appendChild(link);
    } else {
      // 기본 파비콘으로 복원
      const existingFavicon = document.querySelector('link[rel="icon"]');
      if (existingFavicon) {
        existingFavicon.remove();
      }

      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌸</text></svg>';
      document.head.appendChild(link);
    }
  }, [settings?.faviconUrl]);

  return null;
}




