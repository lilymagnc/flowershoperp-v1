"use client";
import { useState, useRef, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, writeBatch, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';
export interface CleanupProgress {
  total: number;
  completed: number;
  current: string;
}
export function useDataCleanup() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<CleanupProgress | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
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
  const cleanupCollection = async (collectionName: string, description: string) => {
    try {
      safeSetState(setProgress, prev => ({ 
        total: prev?.total || 0, 
        completed: prev?.completed || 0, 
        current: `${description} 삭제 중...` 
      }));
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      if (snapshot.empty) {
        return 0;
      }
      const batch = writeBatch(db);
      let batchCount = 0;
      const batchSize = 500; // Firestore 배치 제한
      for (const docRef of snapshot.docs) {
        batch.delete(docRef.ref);
        batchCount++;
        if (batchCount >= batchSize) {
          await batch.commit();
          batchCount = 0;
        }
      }
      if (batchCount > 0) {
        await batch.commit();
      }
      return snapshot.size;
    } catch (error) {
      console.error(`${collectionName} 삭제 오류:`, error);
      throw error;
    }
  };
  const cleanupOrders = async () => {
    return await cleanupCollection('orders', '주문 데이터');
  };
  const cleanupCustomers = async () => {
    return await cleanupCollection('customers', '고객 데이터');
  };
  const cleanupProducts = async () => {
    return await cleanupCollection('products', '상품 데이터');
  };
  const cleanupMaterials = async () => {
    return await cleanupCollection('materials', '자재 데이터');
  };
  const cleanupExpenses = async () => {
    return await cleanupCollection('simpleExpenses', '간편지출 데이터');
  };
  const cleanupMaterialRequests = async () => {
    return await cleanupCollection('materialRequests', '자재요청 데이터');
  };
  const cleanupEmployees = async () => {
    return await cleanupCollection('employees', '직원 데이터');
  };
  const cleanupPartners = async () => {
    return await cleanupCollection('partners', '거래처 데이터');
  };
  const cleanupStockHistory = async () => {
    return await cleanupCollection('stockHistory', '재고이력 데이터');
  };
  const cleanupSampleAlbums = async () => {
    return await cleanupCollection('albums', '샘플앨범 데이터');
  };
  const cleanupAllData = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '로그인이 필요합니다.'
      });
      return;
    }
    safeSetState(setLoading, true);
    safeSetState(setProgress, { total: 10, completed: 0, current: '초기화 시작...' });
    try {
      const cleanupTasks = [
        { name: '주문 데이터', task: cleanupOrders },
        { name: '고객 데이터', task: cleanupCustomers },
        { name: '상품 데이터', task: cleanupProducts },
        { name: '자재 데이터', task: cleanupMaterials },
        { name: '간편지출 데이터', task: cleanupExpenses },
        { name: '자재요청 데이터', task: cleanupMaterialRequests },
        { name: '직원 데이터', task: cleanupEmployees },
        { name: '거래처 데이터', task: cleanupPartners },
        { name: '재고이력 데이터', task: cleanupStockHistory },
        { name: '샘플앨범 데이터', task: cleanupSampleAlbums }
      ];
      let totalDeleted = 0;
      for (let i = 0; i < cleanupTasks.length; i++) {
        const task = cleanupTasks[i];
        safeSetState(setProgress, prev => ({ 
          total: cleanupTasks.length, 
          completed: i, 
          current: `${task.name} 삭제 중...` 
        }));
        try {
          const deleted = await task.task();
          totalDeleted += deleted;
        } catch (error) {
          console.error(`${task.name} 삭제 실패:`, error);
          // 개별 실패해도 계속 진행
        }
      }
      safeSetState(setProgress, { total: cleanupTasks.length, completed: cleanupTasks.length, current: '완료' });
      if (isMountedRef.current) {
        toast({
          title: '데이터 초기화 완료',
          description: `총 ${totalDeleted}개의 데이터가 삭제되었습니다.`
        });
      }
    } catch (error) {
      console.error('데이터 초기화 오류:', error);
      if (isMountedRef.current) {
        toast({
          variant: 'destructive',
          title: '오류',
          description: '데이터 초기화 중 오류가 발생했습니다.'
        });
      }
    } finally {
      safeSetState(setLoading, false);
      safeSetState(setProgress, null);
    }
  };
  const cleanupSpecificData = async (dataType: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '로그인이 필요합니다.'
      });
      return;
    }
    safeSetState(setLoading, true);
    safeSetState(setProgress, { total: 1, completed: 0, current: `${dataType} 삭제 중...` });
    try {
      let deleted = 0;
      switch (dataType) {
        case 'orders':
          deleted = await cleanupOrders();
          break;
        case 'customers':
          deleted = await cleanupCustomers();
          break;
        case 'products':
          deleted = await cleanupProducts();
          break;
        case 'materials':
          deleted = await cleanupMaterials();
          break;
        case 'expenses':
          deleted = await cleanupExpenses();
          break;
        case 'materialRequests':
          deleted = await cleanupMaterialRequests();
          break;
        case 'employees':
          deleted = await cleanupEmployees();
          break;
        case 'partners':
          deleted = await cleanupPartners();
          break;
        case 'stockHistory':
          deleted = await cleanupStockHistory();
          break;
        case 'albums':
          deleted = await cleanupSampleAlbums();
          break;
        default:
          throw new Error('알 수 없는 데이터 타입');
      }
      safeSetState(setProgress, { total: 1, completed: 1, current: '완료' });
      if (isMountedRef.current) {
        toast({
          title: '삭제 완료',
          description: `${dataType} ${deleted}개가 삭제되었습니다.`
        });
      }
    } catch (error) {
      console.error(`${dataType} 삭제 오류:`, error);
      if (isMountedRef.current) {
        toast({
          variant: 'destructive',
          title: '오류',
          description: `${dataType} 삭제 중 오류가 발생했습니다.`
        });
      }
    } finally {
      safeSetState(setLoading, false);
      safeSetState(setProgress, null);
    }
  };
  return {
    loading,
    progress,
    cleanupAllData,
    cleanupSpecificData
  };
}
