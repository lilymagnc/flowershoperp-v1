"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';

export interface ShopSettings {
  id?: string;
  // 기본 상점 정보
  shopName: string;
  ownerName: string;
  businessNumber?: string;
  
  // 연락처 정보
  phone: string;
  email?: string;
  
  // 주소 정보
  address: string;
  detailAddress?: string;
  zipCode?: string;
  
  // 영업 정보
  businessHours?: {
    open: string;
    close: string;
    breakStart?: string;
    breakEnd?: string;
    closedDays?: string[]; // 휴무일 (월, 화, 수, 목, 금, 토, 일)
  };
  
  // 기타 설정
  currency: string; // 통화 (KRW, USD 등)
  taxRate?: number; // 세율 (10% = 0.1)
  
  // 타임스탬프
  createdAt?: any;
  updatedAt?: any;
}

// 기본 상점 설정
const defaultShopSettings: Omit<ShopSettings, 'id' | 'createdAt' | 'updatedAt'> = {
  shopName: '내 꽃집',
  ownerName: '사장님',
  phone: '02-0000-0000',
  address: '서울특별시',
  currency: 'KRW',
  taxRate: 0.1,
  businessHours: {
    open: '09:00',
    close: '18:00',
    closedDays: []
  }
};

export function useShopSettings() {
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // 상점 설정 초기화
  const initializeShopSettings = useCallback(async () => {
    try {
      const shopSettingsCollection = collection(db, 'shopSettings');
      const snapshot = await getDocs(shopSettingsCollection);
      
      if (snapshot.empty) {
        const docRef = doc(shopSettingsCollection);
        await setDoc(docRef, {
          ...defaultShopSettings,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        console.log('상점 설정 초기화 완료');
      }
    } catch (error) {
      console.error('상점 설정 초기화 오류:', error);
    }
  }, []);

  // 상점 설정 조회
  const fetchShopSettings = useCallback(async () => {
    try {
      setLoading(true);
      
      const snapshot = await getDocs(collection(db, 'shopSettings'));
      
      if (!snapshot.empty) {
        const settingsDoc = snapshot.docs[0];
        const settings: ShopSettings = {
          id: settingsDoc.id,
          ...settingsDoc.data()
        } as ShopSettings;
        
        setShopSettings(settings);
      } else {
        // 설정이 없으면 초기화
        await initializeShopSettings();
        // 재조회
        setTimeout(() => fetchShopSettings(), 1000);
      }
    } catch (error) {
      console.error('상점 설정 조회 오류:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '상점 설정을 불러오는 중 오류가 발생했습니다.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, initializeShopSettings]);

  useEffect(() => {
    fetchShopSettings();
  }, [fetchShopSettings]);

  // 상점 설정 수정
  const updateShopSettings = async (settingsData: Partial<ShopSettings>) => {
    try {
      if (!shopSettings?.id) {
        // 새로 생성
        const docRef = doc(collection(db, 'shopSettings'));
        await setDoc(docRef, {
          ...defaultShopSettings,
          ...settingsData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        // 기존 수정
        const docRef = doc(db, 'shopSettings', shopSettings.id);
        await setDoc(docRef, {
          ...settingsData,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      
      toast({
        title: '성공',
        description: '상점 설정이 저장되었습니다.',
      });
      
      await fetchShopSettings();
    } catch (error) {
      console.error('상점 설정 수정 오류:', error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '상점 설정 수정 중 오류가 발생했습니다.',
      });
    }
  };

  return {
    shopSettings,
    loading,
    fetchShopSettings,
    updateShopSettings
  };
}
