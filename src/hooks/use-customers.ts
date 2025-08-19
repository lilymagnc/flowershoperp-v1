
"use client";
import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, setDoc, addDoc, serverTimestamp, query, where, deleteDoc, orderBy, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { CustomerFormValues } from '@/app/dashboard/customers/components/customer-form';
export interface Customer extends CustomerFormValues {
  id: string;
  createdAt: string | any;
  lastOrderDate?: string | any;
  totalSpent?: number;
  orderCount?: number;
  points?: number;
  address?: string;
  companyName?: string;
}
export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // 실시간 고객 데이터 리스너
  useEffect(() => {
    setLoading(true);
    const customersCollection = collection(db, 'customers');
    
    const unsubscribe = onSnapshot(customersCollection, (querySnapshot) => {
      try {
        // 삭제되지 않은 고객만 필터링 (클라이언트 사이드에서 처리)
        const customersData = querySnapshot.docs
          .filter(doc => {
            const data = doc.data();
            return !data.isDeleted;
          })
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
              lastOrderDate: data.lastOrderDate?.toDate ? data.lastOrderDate.toDate().toISOString() : data.lastOrderDate,
            } as Customer;
          });
        setCustomers(customersData);
      } catch (error) {
        console.error("Error processing customers data: ", error);
        toast({
          variant: 'destructive',
          title: '오류',
          description: '고객 정보를 처리하는 중 오류가 발생했습니다.',
        });
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error("Error fetching customers: ", error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '고객 정보를 불러오는 중 오류가 발생했습니다.',
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  // 기존 fetchCustomers 함수는 수동 새로고침용으로 유지
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const customersCollection = collection(db, 'customers');
      const querySnapshot = await getDocs(customersCollection);
      // 삭제되지 않은 고객만 필터링 (클라이언트 사이드에서 처리)
      const customersData = querySnapshot.docs
        .filter(doc => {
          const data = doc.data();
          return !data.isDeleted;
        })
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
            lastOrderDate: data.lastOrderDate?.toDate ? data.lastOrderDate.toDate().toISOString() : data.lastOrderDate,
          } as Customer;
        });
      setCustomers(customersData);
    } catch (error) {
      console.error("Error fetching customers: ", error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '고객 정보를 불러오는 중 오류가 발생했습니다.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  // 전 지점에서 고객 검색 (연락처 기준)
  const findCustomerByContact = useCallback(async (contact: string) => {
    try {
      const q = query(collection(db, 'customers'), where('contact', '==', contact));
      const querySnapshot = await getDocs(q);
      const existingCustomers = querySnapshot.docs
        .filter(doc => {
          const data = doc.data();
          return !data.isDeleted;
        })
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
            lastOrderDate: data.lastOrderDate?.toDate ? data.lastOrderDate.toDate().toISOString() : data.lastOrderDate,
          } as Customer;
        });
      return existingCustomers.length > 0 ? existingCustomers[0] : null;
    } catch (error) {
      console.error('Error finding customer by contact:', error);
      return null;
    }
  }, []);
  // 고객 등록 (통합 관리)
  const addCustomer = async (data: CustomerFormValues) => {
    setLoading(true);
    try {
      const { contact } = data;
      // 전 지점에서 동일 연락처 고객 검색
      const existingCustomer = await findCustomerByContact(contact);
      if (existingCustomer) {
        // 기존 고객이면 현재 지점에 등록
        const currentBranch = data.branch || '';
        await updateDoc(doc(db, 'customers', existingCustomer.id), {
          [`branches.${currentBranch}`]: {
            registeredAt: serverTimestamp(),
            grade: data.grade,
            notes: data.memo
          }
        });
        toast({ title: "성공", description: "기존 고객이 현재 지점에 등록되었습니다." });
      } else {
        // 새 고객 생성
        const currentBranch = data.branch || '';
        const customerWithTimestamp = {
          ...data,
          createdAt: serverTimestamp(),
          totalSpent: 0,
          orderCount: 0,
          points: 0,
          branches: {
            [currentBranch]: {
              registeredAt: serverTimestamp(),
              grade: data.grade,
              notes: data.memo
            }
          },
          primaryBranch: currentBranch
        };
        await addDoc(collection(db, 'customers'), customerWithTimestamp);
        toast({ title: "성공", description: "새 고객이 추가되었습니다." });
      }
      await fetchCustomers();
    } catch (error) {
      console.error("Error adding customer:", error);
      toast({ variant: 'destructive', title: '오류', description: '고객 추가 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };
  const updateCustomer = async (id: string, data: CustomerFormValues) => {
    setLoading(true);
    try {
      const customerDocRef = doc(db, 'customers', id);
      await setDoc(customerDocRef, data, { merge: true });
      toast({ title: "성공", description: "고객 정보가 수정되었습니다." });
      await fetchCustomers();
    } catch (error) {
      console.error("Error updating customer:", error);
      toast({ variant: 'destructive', title: '오류', description: '고객 정보 수정 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  // 포인트 업데이트 함수 (이력 포함)
  const updateCustomerPoints = async (customerId: string, newPoints: number, reason: string, modifier: string) => {
    setLoading(true);
    try {
      const customerDocRef = doc(db, 'customers', customerId);
      const customerDoc = await getDoc(customerDocRef);
      
      if (!customerDoc.exists()) {
        throw new Error('고객을 찾을 수 없습니다.');
      }

      const customerData = customerDoc.data();
      const previousPoints = customerData.points || 0;
      const difference = newPoints - previousPoints;

      // 고객 포인트 업데이트
      await updateDoc(customerDocRef, {
        points: newPoints
      });

      // 포인트 수정 이력 저장
      const pointHistoryData = {
        customerId,
        previousPoints,
        newPoints,
        difference,
        reason,
        modifier,
        timestamp: serverTimestamp(),
        customerName: customerData.name,
        customerContact: customerData.contact
      };

      await addDoc(collection(db, 'pointHistory'), pointHistoryData);

      toast({ 
        title: "성공", 
        description: `포인트가 ${difference > 0 ? '+' : ''}${difference.toLocaleString()}P ${difference > 0 ? '증가' : '감소'}되었습니다.` 
      });
      
      await fetchCustomers();
    } catch (error) {
      console.error("Error updating customer points:", error);
      toast({ 
        variant: 'destructive', 
        title: '오류', 
        description: '포인트 수정 중 오류가 발생했습니다.' 
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const deleteCustomer = async (id: string) => {
    setLoading(true);
    try {
      const customerDocRef = doc(db, 'customers', id);
      await setDoc(customerDocRef, { isDeleted: true }, { merge: true });
      toast({ title: "성공", description: "고객 정보가 삭제되었습니다." });
      await fetchCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({ variant: 'destructive', title: '오류', description: '고객 삭제 중 오류가 발생했습니다.' });
    } finally {
      setLoading(false);
    }
  };
  const bulkAddCustomers = async (data: any[]) => {
    setLoading(true);
    let newCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    await Promise.all(data.map(async (row) => {
      try {
        if (!row.contact || !row.name) return;
        const customerData = {
          name: String(row.name),
          contact: String(row.contact),
          companyName: String(row.companyName || ''),
          address: String(row.address || ''),
          email: String(row.email || ''),
          totalSpent: 0,
          orderCount: 0,
          points: 0,
        };
        // 중복 체크: 연락처 기준으로 체크
        const contactQuery = query(collection(db, "customers"), where("contact", "==", customerData.contact));
        const contactSnapshot = await getDocs(contactQuery);
        const existingCustomers = contactSnapshot.docs.filter(doc => !doc.data().isDeleted);
        if (existingCustomers.length > 0) {
          duplicateCount++;
        } else {
          // 새 고객 생성
          const newCustomerData = {
            ...customerData,
            createdAt: serverTimestamp(),
          };
          await addDoc(collection(db, "customers"), newCustomerData);
          newCount++;
        }
      } catch (error) {
        console.error("Error processing row:", row, error);
        errorCount++;
      }
    }));
    setLoading(false);
    if (errorCount > 0) {
      toast({ 
        variant: 'destructive', 
        title: '일부 처리 오류', 
        description: `${errorCount}개 항목 처리 중 오류가 발생했습니다.` 
      });
    }
    toast({ 
      title: '처리 완료', 
      description: `성공: 신규 고객 ${newCount}명 추가, 중복 고객 ${duplicateCount}명 건너뜀.`
    });
    await fetchCustomers();
  };
  // findCustomersByContact 함수 (기존 호환성 유지)
  const findCustomersByContact = useCallback(async (contact: string) => {
    try {
      const q = query(collection(db, 'customers'), where('contact', '==', contact));
      const querySnapshot = await getDocs(q);
      // 삭제되지 않은 고객만 반환
      return querySnapshot.docs
        .filter(doc => {
          const data = doc.data();
          return !data.isDeleted;
        })
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
            lastOrderDate: data.lastOrderDate?.toDate ? data.lastOrderDate.toDate().toISOString() : data.lastOrderDate,
          } as Customer;
        });
    } catch (error) {
      console.error('Error finding customers by contact:', error);
      return [];
    }
  }, []);
  // 포인트 조회 (전 지점 공유)
  const getCustomerPoints = useCallback(async (contact: string) => {
    try {
      const customer = await findCustomerByContact(contact);
      return customer ? (customer.points || 0) : 0;
    } catch (error) {
      console.error('Error getting customer points:', error);
      return 0;
    }
  }, [findCustomerByContact]);
  // 포인트 차감 (전 지점 공유)
  const deductCustomerPoints = useCallback(async (contact: string, pointsToDeduct: number) => {
    try {
      const customer = await findCustomerByContact(contact);
      if (customer) {
        const currentPoints = customer.points || 0;
        const newPoints = Math.max(0, currentPoints - pointsToDeduct);
        await updateDoc(doc(db, 'customers', customer.id), {
          points: newPoints,
          lastUpdated: serverTimestamp(),
        });
        return newPoints;
      }
      return 0;
    } catch (error) {
      console.error('Error deducting customer points:', error);
      return 0;
    }
  }, [findCustomerByContact]);
  // 포인트 적립 (전 지점 공유)
  const addCustomerPoints = useCallback(async (contact: string, pointsToAdd: number) => {
    try {
      const customer = await findCustomerByContact(contact);
      if (customer) {
        const currentPoints = customer.points || 0;
        const newPoints = currentPoints + pointsToAdd;
        await updateDoc(doc(db, 'customers', customer.id), {
          points: newPoints,
          lastUpdated: serverTimestamp(),
        });
        return newPoints;
      }
      return 0;
    } catch (error) {
      console.error('Error adding customer points:', error);
      return 0;
    }
  }, [findCustomerByContact]);
  return { 
    customers, 
    loading, 
    addCustomer, 
    updateCustomer, 
    updateCustomerPoints,
    deleteCustomer, 
    bulkAddCustomers,
    findCustomersByContact,
    findCustomerByContact,
    getCustomerPoints,
    deductCustomerPoints,
    addCustomerPoints
  };
}
