"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useUserRole } from "@/hooks/use-user-role";
import { 
  Settings, 
  Building, 
  Truck, 
  Globe, 
  Database, 
  Bell,
  Save,
  RefreshCw,
  MessageSquare,
  Mail,
  Type,
  Percent,
  Trash2,
  AlertTriangle,
  Image,
  Upload
} from "lucide-react";
import { useSettings, defaultSettings } from "@/hooks/use-settings";
import { useDataCleanup } from "@/hooks/use-data-cleanup";
import BackupManagement from "./components/backup-management";
import { Progress } from "@/components/ui/progress";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'general';
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const { settings, loading, error, saveSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  
  // 디버깅용 로그
  React.useEffect(() => {
    console.log('설정 페이지 - 로딩 상태:', loading);
    console.log('설정 페이지 - 오류:', error);
    console.log('설정 페이지 - 설정 데이터:', settings);
  }, [loading, error, settings]);
  const [saving, setSaving] = useState(false);
  const [newFont, setNewFont] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  // 개발 단계에서는 권한 체크 제거
  // const { isHQManager } = useUserRole();
  const isHQManager = () => true; // 개발 단계에서는 모든 권한 허용
  const { loading: cleanupLoading, progress, cleanupAllData, cleanupSpecificData } = useDataCleanup();
  const [selectedDataType, setSelectedDataType] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // 컴포넌트 마운트 상태 추적
  const isMountedRef = useRef(true);
  const fileReaderRef = useRef<FileReader | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 컴포넌트 언마운트 시 cleanup
  useEffect(() => {
    isMountedRef.current = true;
    abortControllerRef.current = new AbortController();
    
    return () => {
      isMountedRef.current = false;
      // FileReader 정리
      if (fileReaderRef.current) {
        fileReaderRef.current.abort();
        fileReaderRef.current = null;
      }
      // AbortController 정리
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // 안전한 상태 업데이트 함수
  const safeSetState = useCallback((setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
    if (isMountedRef.current) {
      setter(value);
    }
  }, []);

  const handleSpecificDataCleanup = (dataType: string) => {
    setSelectedDataType(dataType);
    setShowConfirmDialog(true);
  };

  const confirmSpecificDataCleanup = () => {
    if (selectedDataType) {
      cleanupSpecificData(selectedDataType);
      setShowConfirmDialog(false);
      setSelectedDataType('');
    }
  };

  const getDataTypeName = (dataType: string): string => {
    const dataTypeNames: { [key: string]: string } = {
      'orders': '주문',
      'customers': '고객',
      'products': '상품',
      'materials': '자재',
      'expenses': '간편지출',
      'materialRequests': '자재요청',
             'employees': '직원',
       'partners': '거래처',
       'stockHistory': '재고이력',
      'albums': '샘플앨범'
    };
    return dataTypeNames[dataType] || dataType;
  };

  // settings가 로드되었을 때만 localSettings 업데이트
  useEffect(() => {
    if (!loading && settings !== defaultSettings && isMountedRef.current) {
      setLocalSettings(settings);
    }
  }, [settings, loading]);

  const handleSaveSettings = async () => {
    if (!isMountedRef.current) return;
    
    try {
      setSaving(true);
      const success = await saveSettings(localSettings);
      if (success && isMountedRef.current) {
        toast({
          title: '성공',
          description: '설정이 저장되었습니다.'
        });
      } else if (isMountedRef.current) {
        toast({
          variant: 'destructive',
          title: '오류',
          description: '설정 저장 중 오류가 발생했습니다.'
        });
      }
    } catch (error) {
      console.error('설정 저장 중 오류:', error);
      if (isMountedRef.current) {
        toast({
          variant: 'destructive',
          title: '오류',
          description: '설정 저장 중 오류가 발생했습니다.'
        });
      }
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  const resetToDefaults = () => {
    if (isMountedRef.current) {
      setLocalSettings(settings);
      toast({
        title: '초기화 완료',
        description: '설정이 기본값으로 초기화되었습니다.'
      });
    }
  };

  const addNewFont = () => {
    if (!newFont.trim() || !isMountedRef.current) return;
    const fontName = newFont.trim();
    const currentFonts = localSettings.availableFonts || [];
    if (currentFonts.includes(fontName)) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '이미 존재하는 폰트입니다.'
      });
      return;
    }
    safeSetState(setLocalSettings, prev => ({
      ...prev,
      availableFonts: [...currentFonts, fontName]
    }));
    setNewFont('');
    toast({
      title: '성공',
      description: `폰트 "${fontName}"가 추가되었습니다.`
    });
  };

  // 안전한 파일 업로드 핸들러
  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isMountedRef.current) return;

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: '파일 크기 오류',
        description: '파일 크기는 5MB 이하여야 합니다.'
      });
      return;
    }

    // 이전 FileReader 정리
    if (fileReaderRef.current) {
      fileReaderRef.current.abort();
    }

    const reader = new FileReader();
    fileReaderRef.current = reader;

    reader.onload = (e) => {
      if (e.target?.result && isMountedRef.current) {
        safeSetState(setLocalSettings, prev => ({ 
          ...prev, 
          logoUrl: e.target.result as string 
        }));
      }
    };

    reader.onerror = () => {
      if (isMountedRef.current) {
        toast({
          variant: 'destructive',
          title: '파일 읽기 오류',
          description: '파일을 읽는 중 오류가 발생했습니다.'
        });
      }
    };

    reader.readAsDataURL(file);
  }, [toast, safeSetState]);

  const handleFaviconUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isMountedRef.current) return;

    // 파일 크기 제한 (1MB)
    if (file.size > 1 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: '파일 크기 오류',
        description: '파비콘 파일 크기는 1MB 이하여야 합니다.'
      });
      return;
    }

    // 이전 FileReader 정리
    if (fileReaderRef.current) {
      fileReaderRef.current.abort();
    }

    const reader = new FileReader();
    fileReaderRef.current = reader;

    reader.onload = (e) => {
      if (e.target?.result && isMountedRef.current) {
        safeSetState(setLocalSettings, prev => ({ 
          ...prev, 
          faviconUrl: e.target.result as string 
        }));
      }
    };

    reader.onerror = () => {
      if (isMountedRef.current) {
        toast({
          variant: 'destructive',
          title: '파일 읽기 오류',
          description: '파일을 읽는 중 오류가 발생했습니다.'
        });
      }
    };

    reader.readAsDataURL(file);
  }, [toast, safeSetState]);

  // 본사 관리자가 아니면 접근 제한
  if (!isHQManager()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">접근 권한이 없습니다</h2>
          <p className="text-gray-500">시스템 설정은 본사 관리자만 접근할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>설정을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="시스템 설정"
        description="시스템의 기본 설정을 관리합니다."
      />
      <Tabs key={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="general">일반 설정</TabsTrigger>
          <TabsTrigger value="branding">브랜딩</TabsTrigger>
          <TabsTrigger value="delivery">배송 설정</TabsTrigger>
          <TabsTrigger value="notifications">알림 설정</TabsTrigger>
          <TabsTrigger value="messages">메시지 설정</TabsTrigger>
          <TabsTrigger value="auto-email">자동 이메일</TabsTrigger>
          <TabsTrigger value="security">보안 설정</TabsTrigger>
          <TabsTrigger value="discount">할인 설정</TabsTrigger>
          <TabsTrigger value="backup">백업 관리</TabsTrigger>
          <TabsTrigger value="data-cleanup">데이터 초기화</TabsTrigger>
        </TabsList>

        {/* 일반 설정 */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                사이트 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">사이트명</Label>
                  <Input
                    id="siteName"
                    value={localSettings.siteName}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, siteName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flowerShopName">플라워샵 이름</Label>
                  <Input
                    id="flowerShopName"
                    value={localSettings.flowerShopName}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, flowerShopName: e.target.value }))}
                    placeholder="예: 릴리맥 플라워"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">사이트 설명</Label>
                  <Input
                    id="siteDescription"
                    value={localSettings.siteDescription}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">연락처 이메일</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={localSettings.contactEmail}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">연락처 전화번호</Label>
                  <Input
                    id="contactPhone"
                    value={localSettings.contactPhone}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shopAddress">샵 주소</Label>
                  <Input
                    id="shopAddress"
                    value={localSettings.shopAddress}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, shopAddress: e.target.value }))}
                    placeholder="예: 서울시 강남구 테헤란로 123"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                시스템 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderNumberPrefix">주문번호 접두사</Label>
                  <Input
                    id="orderNumberPrefix"
                    value={localSettings.orderNumberPrefix}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, orderNumberPrefix: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pointEarnRate">포인트 적립률 (%)</Label>
                  <Input
                    id="pointEarnRate"
                    type="number"
                    min="0"
                    max="10"
                    value={localSettings.pointEarnRate}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, pointEarnRate: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataRetentionDays">데이터 보관 기간 (일)</Label>
                  <Input
                    id="dataRetentionDays"
                    type="number"
                    min="30"
                    max="1095"
                    value={localSettings.dataRetentionDays}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, dataRetentionDays: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 브랜딩 설정 */}
        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                로고 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>메인 로고</Label>
                    <p className="text-sm text-gray-500">사이드바와 주문서에 표시되는 로고 (권장: 300x80px)</p>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">로고 업로드</p>
                      </label>
                    </div>
                    {localSettings.logoUrl && (
                      <div className="mt-2">
                        <img 
                          src={localSettings.logoUrl} 
                          alt="로고 미리보기" 
                          className="max-w-full h-20 object-contain border rounded"
                          onError={() => {
                            console.error('로고 이미지 로딩 실패');
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => safeSetState(setLocalSettings, prev => ({ ...prev, logoUrl: '' }))}
                          className="mt-2"
                        >
                          로고 제거
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>파비콘</Label>
                    <p className="text-sm text-gray-500">브라우저 탭에 표시되는 아이콘 (권장: 32x32px)</p>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFaviconUpload}
                        className="hidden"
                        id="favicon-upload"
                      />
                      <label htmlFor="favicon-upload" className="cursor-pointer">
                        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">파비콘 업로드</p>
                      </label>
                    </div>
                    {localSettings.faviconUrl && (
                      <div className="mt-2">
                        <img 
                          src={localSettings.faviconUrl} 
                          alt="파비콘 미리보기" 
                          className="w-8 h-8 object-contain border rounded"
                          onError={() => {
                            console.error('파비콘 이미지 로딩 실패');
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => safeSetState(setLocalSettings, prev => ({ ...prev, faviconUrl: '' }))}
                          className="mt-2"
                        >
                          파비콘 제거
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="space-y-2">
                  <Label>브랜드 색상</Label>
                  <p className="text-sm text-gray-500">주요 UI 요소에 사용될 브랜드 색상</p>
                  <div className="flex gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">주 색상</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={localSettings.primaryColor}
                          onChange={(e) => setLocalSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="w-16 h-10"
                        />
                        <Input
                          value={localSettings.primaryColor}
                          onChange={(e) => setLocalSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor">보조 색상</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={localSettings.secondaryColor}
                          onChange={(e) => setLocalSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          className="w-16 h-10"
                        />
                        <Input
                          value={localSettings.secondaryColor}
                          onChange={(e) => setLocalSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          placeholder="#666666"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 배송 설정 */}
        <TabsContent value="delivery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                배송비 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultDeliveryFee">기본 배송비 (원)</Label>
                  <Input
                    id="defaultDeliveryFee"
                    type="number"
                    min="0"
                    value={localSettings.defaultDeliveryFee}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, defaultDeliveryFee: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="freeDeliveryThreshold">무료 배송 기준 (원)</Label>
                  <Input
                    id="freeDeliveryThreshold"
                    type="number"
                    min="0"
                    value={localSettings.freeDeliveryThreshold}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, freeDeliveryThreshold: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 알림 설정 */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                알림 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>이메일 알림</Label>
                    <p className="text-sm text-gray-500">주문 및 시스템 알림을 이메일로 받습니다</p>
                  </div>
                                     <input
                     type="checkbox"
                     checked={localSettings.emailNotifications}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                     className="h-4 w-4"
                   />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS 알림</Label>
                    <p className="text-sm text-gray-500">중요한 알림을 SMS로 받습니다</p>
                  </div>
                                     <input
                     type="checkbox"
                     checked={localSettings.smsNotifications}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                     className="h-4 w-4"
                   />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>자동 백업</Label>
                    <p className="text-sm text-gray-500">정기적으로 데이터를 자동 백업합니다</p>
                  </div>
                                     <input
                     type="checkbox"
                     checked={localSettings.autoBackup}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, autoBackup: e.target.checked }))}
                     className="h-4 w-4"
                   />
                </div>
              </div>
            </CardContent>
          </Card>
                 </TabsContent>
         {/* 메시지 설정 */}
         <TabsContent value="messages" className="space-y-4">
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <MessageSquare className="h-5 w-5" />
                 메시지 출력 설정
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div className="space-y-2">
                    <Label htmlFor="messageFont">메시지 폰트</Label>
                    <select
                      id="messageFont"
                      value={localSettings.messageFont}
                      onChange={(e) => setLocalSettings(prev => ({ ...prev, messageFont: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                    >
                      {localSettings.availableFonts?.map((font) => (
                        <option key={font} value={font} style={{ fontFamily: font }}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </div>
                 <div className="space-y-2">
                   <Label htmlFor="messageFontSize">폰트 크기 (px)</Label>
                   <Input
                     id="messageFontSize"
                     type="number"
                     min="10"
                     max="24"
                     value={localSettings.messageFontSize}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, messageFontSize: Number(e.target.value) }))}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="messageColor">메시지 색상</Label>
                   <Input
                     id="messageColor"
                     type="color"
                     value={localSettings.messageColor}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, messageColor: e.target.value }))}
                     className="w-full h-10"
                   />
                 </div>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="messageTemplate">기본 메시지 템플릿</Label>
                 <textarea
                   id="messageTemplate"
                   value={localSettings.messageTemplate}
                   onChange={(e) => setLocalSettings(prev => ({ ...prev, messageTemplate: e.target.value }))}
                   className="w-full p-2 border rounded-md h-24"
                   placeholder="메시지 템플릿을 입력하세요. {고객명}, {상태} 등의 변수를 사용할 수 있습니다."
                 />
                                   <p className="text-xs text-gray-500">
                    사용 가능한 변수: {'{고객명}'}, {'{상태}'}, {'{주문번호}'}, {'{총금액}'}
                  </p>
                </div>
              </CardContent>
            </Card>
            {/* 폰트 관리 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  폰트 관리
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>사용 가능한 폰트 목록</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {localSettings.availableFonts?.map((font, index) => (
                      <div key={font} className="flex items-center justify-between p-2 border rounded">
                        <span style={{ fontFamily: font }} className="text-sm">
                          {font}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newFonts = localSettings.availableFonts?.filter((_, i) => i !== index) || [];
                            setLocalSettings(prev => ({ ...prev, availableFonts: newFonts }));
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          삭제
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newFont">새 폰트 추가</Label>
                  <div className="flex gap-2">
                    <Input
                      id="newFont"
                      placeholder="폰트 이름을 입력하세요 (예: Roboto)"
                      value={newFont}
                      onChange={(e) => setNewFont(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={addNewFont}
                      disabled={!newFont.trim()}
                      size="sm"
                    >
                      추가
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    • 폰트 이름은 정확히 입력해야 합니다 (예: "Roboto", "Open Sans")
                    • 시스템에 설치된 폰트만 사용 가능합니다
                    • 웹 폰트를 사용하려면 CSS에서 @import 또는 @font-face를 추가해야 합니다
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* 백업 관리 */}
          <TabsContent value="backup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  백업 관리
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <BackupManagement />
              </CardContent>
            </Card>
          </TabsContent>
         {/* 자동 이메일 설정 */}
         <TabsContent value="auto-email" className="space-y-4">
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Mail className="h-5 w-5" />
                 자동 이메일 설정
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <div>
                     <Label>배송완료 자동 이메일</Label>
                     <p className="text-sm text-gray-500">배송 완료 시 고객에게 자동으로 이메일을 발송합니다</p>
                   </div>
                   <input
                     type="checkbox"
                     checked={localSettings.autoEmailDeliveryComplete}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, autoEmailDeliveryComplete: e.target.checked }))}
                     className="h-4 w-4"
                   />
                 </div>
                 <div className="flex items-center justify-between">
                   <div>
                     <Label>주문확인 자동 이메일</Label>
                     <p className="text-sm text-gray-500">주문 접수 시 고객에게 확인 이메일을 발송합니다</p>
                   </div>
                   <input
                     type="checkbox"
                     checked={localSettings.autoEmailOrderConfirm}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, autoEmailOrderConfirm: e.target.checked }))}
                     className="h-4 w-4"
                   />
                 </div>
                 <div className="flex items-center justify-between">
                   <div>
                     <Label>상태변경 자동 이메일</Label>
                     <p className="text-sm text-gray-500">주문 상태 변경 시 고객에게 알림 이메일을 발송합니다</p>
                   </div>
                   <input
                     type="checkbox"
                     checked={localSettings.autoEmailStatusChange}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, autoEmailStatusChange: e.target.checked }))}
                     className="h-4 w-4"
                   />
                 </div>
                 <div className="flex items-center justify-between">
                   <div>
                     <Label>생일 축하 자동 이메일</Label>
                     <p className="text-sm text-gray-500">고객 생일 시 축하 이메일을 자동으로 발송합니다</p>
                   </div>
                   <input
                     type="checkbox"
                     checked={localSettings.autoEmailBirthday}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, autoEmailBirthday: e.target.checked }))}
                     className="h-4 w-4"
                   />
                 </div>
               </div>
               <div className="space-y-4 mt-6">
                 <h4 className="font-medium">이메일 템플릿</h4>
                 <div className="space-y-2">
                   <Label htmlFor="emailTemplateDeliveryComplete">배송완료 이메일 템플릿</Label>
                   <textarea
                     id="emailTemplateDeliveryComplete"
                     value={localSettings.emailTemplateDeliveryComplete}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, emailTemplateDeliveryComplete: e.target.value }))}
                     className="w-full p-2 border rounded-md h-24"
                     placeholder="배송완료 이메일 템플릿을 입력하세요"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="emailTemplateOrderConfirm">주문확인 이메일 템플릿</Label>
                   <textarea
                     id="emailTemplateOrderConfirm"
                     value={localSettings.emailTemplateOrderConfirm}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, emailTemplateOrderConfirm: e.target.value }))}
                     className="w-full p-2 border rounded-md h-24"
                     placeholder="주문확인 이메일 템플릿을 입력하세요"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="emailTemplateStatusChange">상태변경 이메일 템플릿</Label>
                   <textarea
                     id="emailTemplateStatusChange"
                     value={localSettings.emailTemplateStatusChange}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, emailTemplateStatusChange: e.target.value }))}
                     className="w-full p-2 border rounded-md h-24"
                     placeholder="상태변경 이메일 템플릿을 입력하세요"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="emailTemplateBirthday">생일축하 이메일 템플릿</Label>
                   <textarea
                     id="emailTemplateBirthday"
                     value={localSettings.emailTemplateBirthday}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, emailTemplateBirthday: e.target.value }))}
                     className="w-full p-2 border rounded-md h-24"
                     placeholder="생일축하 이메일 템플릿을 입력하세요"
                   />
                 </div>
                 <p className="text-xs text-gray-500">
                   사용 가능한 변수: {'{고객명}'}, {'{주문번호}'}, {'{주문일}'}, {'{배송일}'}, {'{총금액}'}, {'{이전상태}'}, {'{현재상태}'}, {'{회사명}'}
                 </p>
               </div>
             </CardContent>
           </Card>
         </TabsContent>
         {/* 보안 설정 */}
         <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                보안 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">세션 타임아웃 (분)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="5"
                    max="480"
                    value={localSettings.sessionTimeout}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, sessionTimeout: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">최소 비밀번호 길이</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min="6"
                    max="20"
                    value={localSettings.passwordMinLength}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, passwordMinLength: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>비밀번호 변경 요구</Label>
                  <p className="text-sm text-gray-500">정기적으로 비밀번호 변경을 요구합니다</p>
                </div>
                                 <input
                   type="checkbox"
                   checked={localSettings.requirePasswordChange}
                   onChange={(e) => setLocalSettings(prev => ({ ...prev, requirePasswordChange: e.target.checked }))}
                   className="h-4 w-4"
                 />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
         {/* 할인 설정 */}
         <TabsContent value="discount" className="space-y-4">
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Percent className="h-5 w-5" />
                 할인 설정
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="text-center py-8">
                 <Percent className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                 <h3 className="text-lg font-semibold mb-2">할인 설정 관리</h3>
                 <p className="text-gray-500 mb-6">
                   지점별 할인율, 할인 기간, 할인 조건 등을 관리할 수 있습니다.
                 </p>
                 <Button 
                   onClick={() => window.location.href = '/dashboard/settings/discount'}
                   className="bg-blue-600 hover:bg-blue-700"
                 >
                   <Percent className="h-4 w-4 mr-2" />
                   할인 설정 관리
                 </Button>
               </div>
             </CardContent>
           </Card>
         </TabsContent>
         {/* 데이터 초기화 */}
         <TabsContent value="data-cleanup" className="space-y-4">
           <Card>
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Trash2 className="h-5 w-5" />
                 데이터 초기화
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                 <div className="flex items-start gap-3">
                   <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                   <div>
                     <h4 className="font-medium text-yellow-800 mb-2">⚠️ 주의사항</h4>
                     <ul className="text-sm text-yellow-700 space-y-1">
                       <li>• 삭제된 데이터는 복구할 수 없습니다.</li>
                       <li>• 실제 운영 환경에서는 신중하게 사용하세요.</li>
                       <li>• 테스트 데이터 정리 시에만 사용하세요.</li>
                       <li>• 삭제 전 반드시 백업을 확인하세요.</li>
                     </ul>
                   </div>
                 </div>
               </div>
               {/* 전체 데이터 초기화 */}
               <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                 <h4 className="font-medium text-red-800 mb-3">전체 데이터 초기화</h4>
                 <p className="text-sm text-red-700 mb-4">
                   모든 테스트 데이터를 한 번에 삭제합니다. (주문, 고객, 상품, 자재, 지출 등)
                 </p>
                 <AlertDialog>
                   <AlertDialogTrigger asChild>
                     <Button 
                       disabled={cleanupLoading}
                       variant="destructive"
                       className="w-full"
                     >
                       <Trash2 className="h-4 w-4 mr-2" />
                       {cleanupLoading ? '전체 데이터 삭제 중...' : '전체 데이터 삭제'}
                     </Button>
                   </AlertDialogTrigger>
                   <AlertDialogContent>
                     <AlertDialogHeader>
                       <AlertDialogTitle>⚠️ 전체 데이터 삭제</AlertDialogTitle>
                       <AlertDialogDescription>
                         정말로 모든 테스트 데이터를 삭제하시겠습니까?<br />
                         <strong>이 작업은 되돌릴 수 없습니다.</strong><br /><br />
                         삭제될 데이터:
                         <ul className="list-disc list-inside mt-2 space-y-1">
                           <li>주문 데이터</li>
                           <li>고객 데이터</li>
                           <li>상품 데이터</li>
                           <li>자재 데이터</li>
                           <li>간편지출 데이터</li>
                           <li>자재요청 데이터</li>
                                                       <li>직원 데이터</li>
                            <li>거래처 데이터</li>
                            <li>재고이력 데이터</li>
                           <li>샘플앨범 데이터</li>
                         </ul>
                       </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                       <AlertDialogCancel>취소</AlertDialogCancel>
                       <AlertDialogAction
                         onClick={cleanupAllData}
                         className="bg-red-600 hover:bg-red-700"
                       >
                         삭제 확인
                       </AlertDialogAction>
                     </AlertDialogFooter>
                   </AlertDialogContent>
                 </AlertDialog>
               </div>
               {/* 개별 데이터 초기화 */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="border rounded-lg p-4">
                   <h4 className="font-medium mb-3">주문 관리</h4>
                   <Button 
                     onClick={() => handleSpecificDataCleanup('orders')}
                     disabled={cleanupLoading}
                     variant="outline"
                     size="sm"
                     className="w-full"
                   >
                     주문 데이터 삭제
                   </Button>
                 </div>
                 <div className="border rounded-lg p-4">
                   <h4 className="font-medium mb-3">고객 관리</h4>
                   <Button 
                     onClick={() => handleSpecificDataCleanup('customers')}
                     disabled={cleanupLoading}
                     variant="outline"
                     size="sm"
                     className="w-full"
                   >
                     고객 데이터 삭제
                   </Button>
                 </div>
                 <div className="border rounded-lg p-4">
                   <h4 className="font-medium mb-3">상품 관리</h4>
                   <Button 
                     onClick={() => handleSpecificDataCleanup('products')}
                     disabled={cleanupLoading}
                     variant="outline"
                     size="sm"
                     className="w-full"
                   >
                     상품 데이터 삭제
                   </Button>
                 </div>
                 <div className="border rounded-lg p-4">
                   <h4 className="font-medium mb-3">자재 관리</h4>
                   <Button 
                     onClick={() => handleSpecificDataCleanup('materials')}
                     disabled={cleanupLoading}
                     variant="outline"
                     size="sm"
                     className="w-full"
                   >
                     자재 데이터 삭제
                   </Button>
                 </div>
                 <div className="border rounded-lg p-4">
                   <h4 className="font-medium mb-3">간편지출</h4>
                   <Button 
                     onClick={() => handleSpecificDataCleanup('expenses')}
                     disabled={cleanupLoading}
                     variant="outline"
                     size="sm"
                     className="w-full"
                   >
                     지출 데이터 삭제
                   </Button>
                 </div>
                 <div className="border rounded-lg p-4">
                   <h4 className="font-medium mb-3">자재요청</h4>
                   <Button 
                     onClick={() => handleSpecificDataCleanup('materialRequests')}
                     disabled={cleanupLoading}
                     variant="outline"
                     size="sm"
                     className="w-full"
                   >
                     자재요청 데이터 삭제
                   </Button>
                 </div>
                 <div className="border rounded-lg p-4">
                   <h4 className="font-medium mb-3">직원 관리</h4>
                   <Button 
                     onClick={() => handleSpecificDataCleanup('employees')}
                     disabled={cleanupLoading}
                     variant="outline"
                     size="sm"
                     className="w-full"
                   >
                     직원 데이터 삭제
                   </Button>
                 </div>
                 <div className="border rounded-lg p-4">
                   <h4 className="font-medium mb-3">거래처 관리</h4>
                   <Button 
                     onClick={() => handleSpecificDataCleanup('partners')}
                     disabled={cleanupLoading}
                     variant="outline"
                     size="sm"
                     className="w-full"
                   >
                     거래처 데이터 삭제
                   </Button>
                 </div>
                 <div className="border rounded-lg p-4">
                   <h4 className="font-medium mb-3">재고이력</h4>
                   <Button 
                     onClick={() => handleSpecificDataCleanup('stockHistory')}
                     disabled={cleanupLoading}
                     variant="outline"
                     size="sm"
                     className="w-full"
                   >
                     재고이력 데이터 삭제
                   </Button>
                 </div>
                 <div className="border rounded-lg p-4">
                   <h4 className="font-medium mb-3">샘플앨범</h4>
                   <Button 
                     onClick={() => handleSpecificDataCleanup('albums')}
                     disabled={cleanupLoading}
                     variant="outline"
                     size="sm"
                     className="w-full"
                   >
                     샘플앨범 데이터 삭제
                   </Button>
                 </div>
               </div>
               {/* 진행률 표시 */}
               {progress && (
                 <div className="border rounded-lg p-4 bg-blue-50">
                   <h4 className="font-medium text-blue-800 mb-2">진행 상황</h4>
                   <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                       <span>{progress.current}</span>
                       <span>{progress.completed}/{progress.total}</span>
                     </div>
                     <div className="w-full bg-gray-200 rounded-full h-2">
                       <div 
                         className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                         style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                       ></div>
                     </div>
                   </div>
                 </div>
               )}
               {/* 개별 데이터 삭제 확인 대화상자 */}
               <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                 <AlertDialogContent>
                   <AlertDialogHeader>
                     <AlertDialogTitle>⚠️ 데이터 삭제 확인</AlertDialogTitle>
                     <AlertDialogDescription>
                       정말로 {getDataTypeName(selectedDataType)} 데이터를 삭제하시겠습니까?<br />
                       <strong>이 작업은 되돌릴 수 없습니다.</strong>
                     </AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter>
                     <AlertDialogCancel>취소</AlertDialogCancel>
                     <AlertDialogAction
                       onClick={confirmSpecificDataCleanup}
                       className="bg-red-600 hover:bg-red-700"
                     >
                       삭제 확인
                     </AlertDialogAction>
                   </AlertDialogFooter>
                 </AlertDialogContent>
               </AlertDialog>
             </CardContent>
           </Card>
         </TabsContent>
      </Tabs>
      {/* 액션 버튼 */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={resetToDefaults}>
          <RefreshCw className="h-4 w-4 mr-2" />
          기본값으로 초기화
        </Button>
        <Button onClick={handleSaveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? '저장 중...' : '설정 저장'}
        </Button>
      </div>
    </div>
  );
} 
