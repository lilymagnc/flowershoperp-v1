"use client";
import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, setDoc, addDoc, serverTimestamp, query, where, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';

export interface Branch {
  id: string;
  name: string;
  address: string;
  contact: string;
  manager: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  deliveryFees?: Array<{district: string, fee: number}>;
  surcharges?: {
    mediumItem: number;
    largeItem: number;
    express: number;
  };
}

export interface BranchFormValues {
  name: string;
  address: string;
  contact: string;
  manager: string;
  isActive: boolean;
}

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      const branchesCollection = collection(db, 'branches');
      const branchesData = (await getDocs(branchesCollection)).docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : undefined,
        } as Branch;
      });
      setBranches(branchesData);
    } catch (error) {
      console.error("Error fetching branches: ", error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '지점 정보를 불러오는 중 오류가 발생했습니다.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const addBranch = async (data: BranchFormValues) => {
    setLoading(true);
    try {
      const branchWithTimestamp = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'branches'), branchWithTimestamp);
      toast({ title: "성공", description: "새 지점이 추가되었습니다." });
      await fetchBranches();
    } catch (error) {
      console.error("Error adding branch:", error);
      toast({ variant: 'destructive', title: '오류', description: '지점 추가 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const updateBranch = async (id: string, data: Partial<BranchFormValues>) => {
    setLoading(true);
    try {
      const branchDocRef = doc(db, 'branches', id);
      await updateDoc(branchDocRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "성공", description: "지점 정보가 수정되었습니다." });
      await fetchBranches();
    } catch (error) {
      console.error("Error updating branch:", error);
      toast({ variant: 'destructive', title: '오류', description: '지점 정보 수정 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const deleteBranch = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'branches', id));
      toast({ title: "성공", description: "지점 정보가 삭제되었습니다." });
      await fetchBranches();
    } catch (error) {
      console.error("Error deleting branch:", error);
      toast({ variant: 'destructive', title: '오류', description: '지점 삭제 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const getBranchById = useCallback((id: string) => {
    return branches.find(branch => branch.id === id);
  }, [branches]);

  const getBranchByName = useCallback((name: string) => {
    return branches.find(branch => branch.name === name);
  }, [branches]);

  const getActiveBranches = useCallback(() => {
    return branches.filter(branch => branch.isActive);
  }, [branches]);

  // 샘플 배송비 데이터 설정 함수
  const setupSampleDeliveryFees = async (branchId: string) => {
    const sampleDeliveryFees = [
      { district: "영등포구", fee: 10000 },
      { district: "마포구", fee: 13000 },
      { district: "양천구", fee: 13000 },
      { district: "동작구", fee: 13000 },
      { district: "관악구", fee: 13000 },
      { district: "구로구", fee: 13000 },
      { district: "금천구", fee: 13000 },
      { district: "용산구", fee: 14000 },
      { district: "강서구", fee: 14000 },
      { district: "서대문구", fee: 15000 },
      { district: "종로구", fee: 16000 },
      { district: "중구", fee: 16000 },
      { district: "동대문구", fee: 18000 },
      { district: "서초구", fee: 18000 },
      { district: "성동구", fee: 18000 },
      { district: "강남구", fee: 20000 },
      { district: "은평구", fee: 20000 },
      { district: "성북구", fee: 20000 },
      { district: "광진구", fee: 20000 },
      { district: "송파구", fee: 23000 },
      { district: "강북구", fee: 23000 },
      { district: "중랑구", fee: 23000 },
      { district: "도봉구", fee: 25000 },
      { district: "강동구", fee: 25000 },
      { district: "노원구", fee: 25000 },
      { district: "기타", fee: 30000 },
      { district: "무료", fee: 0 }
    ];

    const sampleSurcharges = {
      mediumItem: 2000,
      largeItem: 5000,
      express: 10000
    };

    try {
      const branchDocRef = doc(db, 'branches', branchId);
      await updateDoc(branchDocRef, {
        deliveryFees: sampleDeliveryFees,
        surcharges: sampleSurcharges,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "성공", description: "샘플 배송비 데이터가 설정되었습니다." });
      await fetchBranches();
    } catch (error) {
      console.error("Error setting up sample delivery fees:", error);
      toast({ variant: 'destructive', title: '오류', description: '샘플 배송비 설정 중 오류가 발생했습니다.' });
    }
  };

  return {
    branches,
    loading,
    fetchBranches,
    addBranch,
    updateBranch,
    deleteBranch,
    getBranchById,
    getBranchByName,
    getActiveBranches,
    setupSampleDeliveryFees,
  };
}

