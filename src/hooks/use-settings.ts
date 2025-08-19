import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface SystemSettings {
  // 사이트 정보
  siteName: string;
  flowerShopName: string; // 플라워샵 이름 추가
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  shopAddress: string; // 샵 주소 추가

  // 브랜딩 설정
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;

  // 기본 배송비 설정
  defaultDeliveryFee: number;
  freeDeliveryThreshold: number;

  // 알림 설정
  emailNotifications: boolean;
  smsNotifications: boolean;

  // 시스템 설정
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  dataRetentionDays: number;

  // 포인트 시스템
  pointEarnRate: number; // 구매 금액 대비 포인트 적립률
  pointUseRate: number;  // 포인트 사용 시 할인률

  // 주문 설정
  orderNumberPrefix: string;
  autoOrderNumber: boolean;

  // 보안 설정
  sessionTimeout: number; // 분 단위
  requirePasswordChange: boolean;
  passwordMinLength: number;

  // 메시지 출력 설정
  messageFont: string;
  messageFontSize: number;
  messageColor: string;
  messageTemplate: string;
  availableFonts: string[]; // 사용 가능한 폰트 목록

  // 자동 이메일 설정
  autoEmailDeliveryComplete: boolean;
  autoEmailOrderConfirm: boolean;
  autoEmailStatusChange: boolean;
  autoEmailBirthday: boolean;
  emailTemplateDeliveryComplete: string;
  emailTemplateOrderConfirm: string;
  emailTemplateStatusChange: string;
  emailTemplateBirthday: string;

  // 할인 설정
  defaultDiscountRate: number;
  maxDiscountRate: number;
  discountReason: string;
}

export const defaultSettings: SystemSettings = {
  siteName: "릴리맥 ERP",
  flowerShopName: "릴리맥 플라워", // 플라워샵 이름 기본값
  siteDescription: "플라워샵 주문관리 및 가맹점 관리를 위한 ERP 시스템",
  contactEmail: "admin@lilymag.com",
  contactPhone: "02-1234-5678",
  shopAddress: "서울시 강남구 테헤란로 123", // 샵 주소 기본값
  logoUrl: "",
  faviconUrl: "",
  primaryColor: "#000000",
  secondaryColor: "#666666",
  defaultDeliveryFee: 3000,
  freeDeliveryThreshold: 50000,
  emailNotifications: true,
  smsNotifications: false,
  autoBackup: true,
  backupFrequency: 'daily',
  dataRetentionDays: 365,
  pointEarnRate: 2, // 2%
  pointUseRate: 1,  // 1:1 비율
  orderNumberPrefix: "ORD",
  autoOrderNumber: true,
  sessionTimeout: 30,
  requirePasswordChange: false,
  passwordMinLength: 8,
  // 메시지 출력 설정
  messageFont: "Noto Sans KR",
  messageFontSize: 14,
  messageColor: "#000000",
  messageTemplate: "안녕하세요! {고객명}님의 주문이 {상태}되었습니다. 감사합니다.",
  availableFonts: [
    "Noto Sans KR",
    "Malgun Gothic",
    "Nanum Gothic",
    "Nanum Myeongjo",
    "Gaegu",
    "Noto Serif KR",
    "Source Code Pro",
    "Roboto",
    "Open Sans",
    "Lato",
    "Montserrat",
    "Poppins",
    "Arial",
    "Helvetica",
    "Times New Roman",
    "Georgia",
    "Verdana",
    "Tahoma",
    "Courier New",
    "Impact",
    "Comic Sans MS"
  ],
  // 자동 이메일 설정
  autoEmailDeliveryComplete: true,
  autoEmailOrderConfirm: true,
  autoEmailStatusChange: false,
  autoEmailBirthday: true,
  emailTemplateDeliveryComplete: "안녕하세요 {고객명}님!\n\n주문하신 상품이 성공적으로 배송 완료되었습니다.\n\n주문번호: {주문번호}\n배송일: {배송일}\n\n감사합니다.\n{회사명}",
  emailTemplateOrderConfirm: "안녕하세요 {고객명}님!\n\n주문이 성공적으로 접수되었습니다.\n\n주문번호: {주문번호}\n주문일: {주문일}\n총 금액: {총금액}원\n\n감사합니다.\n{회사명}",
  emailTemplateStatusChange: "안녕하세요 {고객명}님!\n\n주문 상태가 변경되었습니다.\n\n주문번호: {주문번호}\n이전 상태: {이전상태}\n현재 상태: {현재상태}\n\n감사합니다.\n{회사명}",
  emailTemplateBirthday: "안녕하세요 {고객명}님!\n\n생일을 진심으로 축하드립니다! 🎉\n\n특별한 할인 혜택을 드립니다.\n\n감사합니다.\n{회사명}",
  // 할인 설정
  defaultDiscountRate: 0,
  maxDiscountRate: 10,
  discountReason: "회원 할인"
};

export function useSettings() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetState = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
    if (isMountedRef.current) {
      setter(value);
    }
  };

  const saveSettings = useCallback(async (newSettings: SystemSettings) => {
    try {
      safeSetState(setError, null);

      const settingsDoc = doc(db, 'system', 'settings');
      await setDoc(settingsDoc, {
        ...newSettings,
        updatedAt: serverTimestamp()
      });

      safeSetState(setSettings, newSettings);
      return true;
    } catch (err) {
      console.error('설정 저장 중 오류:', err);
      safeSetState(setError, '설정 저장 중 오류가 발생했습니다.');
      return false;
    }
  }, []); // safeSetState 의존성 제거

  const getSetting = useCallback((key: keyof SystemSettings) => {
    return settings[key];
  }, [settings]);

  useEffect(() => {
    const initializeSettings = async () => {
      try {
        console.log('설정 초기화 시작...');
        safeSetState(setLoading, true);
        safeSetState(setError, null);

        const settingsDoc = doc(db, 'system', 'settings');
        const settingsSnapshot = await getDoc(settingsDoc);

        if (settingsSnapshot.exists()) {
          const data = settingsSnapshot.data();
          console.log('설정 데이터 로드됨:', data);
          safeSetState(setSettings, { ...defaultSettings, ...data });
        } else {
          console.log('설정 데이터 없음, 기본값으로 초기화...');
          // 기본 설정으로 초기화
          await setDoc(settingsDoc, {
            ...defaultSettings,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          safeSetState(setSettings, defaultSettings);
        }
      } catch (err) {
        console.error('설정 로드 중 오류:', err);
        safeSetState(setError, '설정을 불러오는 중 오류가 발생했습니다.');
      } finally {
        console.log('설정 로딩 완료');
        safeSetState(setLoading, false);
      }
    };

    initializeSettings();
  }, []); // safeSetState 의존성 제거

  return {
    settings,
    loading,
    error,
    saveSettings,
    getSetting
  };
} 
