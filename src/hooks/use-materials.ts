
"use client";

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, setDoc, addDoc, writeBatch, serverTimestamp, runTransaction, query, where, orderBy, limit, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import type { Material as MaterialData } from "@/app/dashboard/materials/components/material-table";
import type { MaterialFormValues } from '@/app/dashboard/materials/components/material-form';

export type Material = MaterialData;

const initialMaterials: Omit<Material, 'docId' | 'status'>[] = [
  { id: "M00001", name: "마르시아 장미", mainCategory: "생화", midCategory: "장미", price: 5000, supplier: "경부선꽃시장", stock: 100, size: "1단", color: "Pink" },
  { id: "M00002", name: "레드 카네이션", mainCategory: "생화", midCategory: "카네이션", price: 4500, supplier: "플라워팜", stock: 200, size: "1단", color: "Red" },
  { id: "M00003", name: "몬스테라", mainCategory: "화분", midCategory: "관엽식물", price: 25000, supplier: "플라워팜", stock: 0, size: "대", color: "Green" },
  { id: "M00004", name: "만천홍", mainCategory: "화분", midCategory: "난", price: 55000, supplier: "경부선꽃시장", stock: 30, size: "특", color: "Purple" },
  { id: "M00005", name: "포장용 크라프트지", mainCategory: "기타자재", midCategory: "기타", price: 1000, supplier: "자재월드", stock: 15, size: "1롤", color: "Brown" },
  { id: "M00006", name: "유칼립투스", mainCategory: "생화", midCategory: "기타", price: 3000, supplier: "플라워팜", stock: 50, size: "1단", color: "Green" },
];

export function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getStatus = (stock: number): string => {
      if (stock < 5) return 'low_stock';
      return 'active';
  }

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const materialsCollection = collection(db, 'materials');
      const querySnapshot = await getDocs(materialsCollection);

      if (querySnapshot.size <= 1) {
          const initDocRef = doc(materialsCollection, '_initialized');
          const initDoc = await getDoc(initDocRef);
          if (!initDoc.exists()) {
            const batch = writeBatch(db);
            initialMaterials.forEach((materialData) => {
                const newDocRef = doc(materialsCollection);
                batch.set(newDocRef, materialData);
            });
            batch.set(initDocRef, { seeded: true });
            await batch.commit();

            const seededSnapshot = await getDocs(materialsCollection);
            const materialsData = seededSnapshot.docs
                .filter(doc => doc.id !== '_initialized')
                .map((doc) => {
                    const data = doc.data();
                    return { 
                        docId: doc.id,
                        ...data,
                        status: getStatus(data.stock)
                    } as Material;
            })
            .filter(material => 
                material && 
                material.name && 
                material.id && 
                material.docId
            )
            .sort((a,b) => (a.id && b.id) ? a.id.localeCompare(b.id) : 0);
            setMaterials(materialsData);
            return;
          }
      } 

      const materialsData = querySnapshot.docs
          .filter(doc => doc.id !== '_initialized')
          .map((doc) => {
              const data = doc.data();
              return { 
                  docId: doc.id,
                  ...data,
                  status: getStatus(data.stock)
              } as Material;
      })
      .filter(material => 
          material && 
          material.name && 
          material.id && 
          material.docId
      )
      .sort((a,b) => (a.id && b.id) ? a.id.localeCompare(b.id) : 0);
      setMaterials(materialsData);

    } catch (error) {
      console.error("Error fetching materials: ", error);
      toast({
        variant: 'destructive',
        title: '오류',
        description: '자재 정보를 불러오는 중 오류가 발생했습니다.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const generateNewId = async () => {
    const q = query(collection(db, "materials"), orderBy("id", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    let lastIdNumber = 0;
    if (!querySnapshot.empty) {
        const lastId = querySnapshot.docs[0].data().id;
        if(lastId && lastId.startsWith('M')) {
            lastIdNumber = parseInt(lastId.replace('M', ''), 10);
        }
    }
    return `M${String(lastIdNumber + 1).padStart(5, '0')}`;
  }

  // 기존 자재 ID를 6자리 M00000 형식으로 업데이트하는 함수
  const updateMaterialIds = async () => {
    try {
      setLoading(true);
      const materialsCollection = collection(db, 'materials');
      const querySnapshot = await getDocs(materialsCollection);

      let updateCount = 0;
      let currentNumber = 1;

      for (const docSnapshot of querySnapshot.docs) {
        if (docSnapshot.id === '_initialized') continue;

        const data = docSnapshot.data();
        const currentId = data.id;

        // 이미 M00000 형식이면 건너뛰기
        if (currentId && currentId.match(/^M\d{5}$/)) {
          continue;
        }

        // 새로운 6자리 ID 생성
        const newId = `M${String(currentNumber).padStart(5, '0')}`;

        // 문서 업데이트
        await setDoc(docSnapshot.ref, { ...data, id: newId }, { merge: true });
        updateCount++;
        currentNumber++;
      }

      if (updateCount > 0) {
        toast({ 
          title: "ID 업데이트 완료", 
          description: `${updateCount}개 자재의 ID가 M00000 형식으로 업데이트되었습니다.` 
        });
        await fetchMaterials();
      }

    } catch (error) {
      console.error("Error updating material IDs:", error);
      toast({ 
        variant: 'destructive', 
        title: '오류', 
        description: '자재 ID 업데이트 중 오류가 발생했습니다.' 
      });
    } finally {
      setLoading(false);
    }
  }

  const addMaterial = async (data: MaterialFormValues) => {
    setLoading(true);
    try {
        // 지점별로 구분하여 중복 체크
        const existingMaterialQuery = query(
            collection(db, "materials"), 
            where("name", "==", data.name)
        );
        const existingMaterialSnapshot = await getDocs(existingMaterialQuery);

        if (!existingMaterialSnapshot.empty) {
            toast({ variant: 'destructive', title: '중복된 자재', description: `동일한 이름의 자재가 이미 존재합니다.`});
            setLoading(false);
            return;
        }

        const newId = await generateNewId();
        const docRef = doc(collection(db, "materials"));
        await setDoc(docRef, { ...data, id: newId });

        toast({ title: "성공", description: "새 자재가 추가되었습니다."});
        await fetchMaterials();
    } catch (error) {
        console.error("Error adding material:", error);
        toast({ variant: 'destructive', title: '오류', description: '자재 추가 중 오류가 발생했습니다.'});
    } finally {
        setLoading(false);
    }
  }

  const updateMaterial = async (docId: string, materialId: string, data: MaterialFormValues) => {
      setLoading(true);
      try {
          const docRef = doc(db, "materials", docId);
          await setDoc(docRef, { ...data, id: materialId }, { merge: true });
          toast({ title: "성공", description: "자재 정보가 수정되었습니다."});
          await fetchMaterials();
      } catch (error) {
          console.error("Error updating material:", error);
          toast({ variant: 'destructive', title: '오류', description: '자재 수정 중 오류가 발생했습니다.'});
      } finally {
          setLoading(false);
      }
  }

  const deleteMaterial = async (docId: string) => {
    setLoading(true);
    try {
        const docRef = doc(db, "materials", docId);
        await deleteDoc(docRef);
        await fetchMaterials();
        toast({ title: "성공", description: "자재가 삭제되었습니다."});
    } catch (error) {
        console.error("Error deleting material:", error);
        toast({ variant: 'destructive', title: '오류', description: '자재 삭제 중 오류가 발생했습니다.'});
    } finally {
        setLoading(false);
    }
  }

  const updateStock = async (
    items: { id: string; name: string; quantity: number, price?: number, supplier?: string }[],
    type: 'in' | 'out',
    branchName: string,
    operator: string
  ) => {
    const historyBatch = writeBatch(db);

    for (const item of items) {
        try {
            await runTransaction(db, async (transaction) => {
                const materialQuery = query(collection(db, "materials"), where("id", "==", item.id));
                const materialSnapshot = await getDocs(materialQuery);

                if (materialSnapshot.empty) {
                    // 자재가 없으면 새로 생성
                    const newMaterialId = await generateNewId();
                    const newMaterialRef = doc(collection(db, "materials"));

                    const newMaterialData = {
                        id: newMaterialId,
                        name: item.name,
                        mainCategory: '원재료',
                        midCategory: '기타',
                        supplier: item.supplier || '',
                        price: item.price || 0,
                        stock: type === 'in' ? item.quantity : 0,
                        size: '',
                        color: '',
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    };

                    transaction.set(newMaterialRef, newMaterialData);

                    // 새로 생성된 자재로 재고 업데이트
                    const materialDocRef = newMaterialRef;
                    const materialData = newMaterialData;
                    const currentStock = 0;
                    const change = type === 'in' ? item.quantity : -item.quantity;
                    const newStock = currentStock + change;

                    const updatePayload: {stock: number, price?: number, supplier?: string} = { stock: newStock };
                    if (type === 'in') {
                        if (item.price !== undefined) updatePayload.price = item.price;
                        if (item.supplier !== undefined) updatePayload.supplier = item.supplier;
                    }

                    transaction.update(materialDocRef, updatePayload);

                    const historyDocRef = doc(collection(db, "stockHistory"));
                    historyBatch.set(historyDocRef, {
                        date: serverTimestamp(),
                        type: type,
                        itemType: "material",
                        itemId: newMaterialId,
                        itemName: item.name,
                        quantity: item.quantity,
                        fromStock: currentStock,
                        toStock: newStock,
                        resultingStock: newStock,
                        branch: branchName,
                        operator: operator,
                        supplier: type === 'in' ? (item.supplier || materialData?.supplier) : materialData?.supplier,
                        price: type === 'in' ? (item.price || materialData?.price) : materialData?.price,
                        totalAmount: type === 'in' ? ((item.price || materialData?.price || 0) * item.quantity) : 0,
                    });

                    return; // 새 자재 생성 후 다음 아이템으로
                }

                const materialDocRef = materialSnapshot.docs[0].ref;
                const materialDoc = await transaction.get(materialDocRef);

                if(!materialDoc.exists()) {
                     throw new Error(`자재 문서를 찾을 수 없습니다: ${item.name} (${branchName})`);
                }

                const materialData = materialDoc.data();
                const currentStock = materialData?.stock || 0;
                const change = type === 'in' ? item.quantity : -item.quantity;
                const newStock = currentStock + change;

                const updatePayload: {stock: number, price?: number, supplier?: string} = { stock: newStock };
                if (type === 'in') {
                    if (item.price !== undefined) updatePayload.price = item.price;
                    if (item.supplier !== undefined) updatePayload.supplier = item.supplier;
                }

                transaction.update(materialDocRef, updatePayload);

                const historyDocRef = doc(collection(db, "stockHistory"));
                historyBatch.set(historyDocRef, {
                    date: serverTimestamp(),
                    type: type,
                    itemType: "material",
                    itemId: item.id,
                    itemName: item.name,
                    quantity: item.quantity,
                    fromStock: currentStock,
                    toStock: newStock,
                    resultingStock: newStock,
                    branch: branchName,
                    operator: operator,
                    supplier: type === 'in' ? (item.supplier || materialData?.supplier) : materialData?.supplier,
                    price: type === 'in' ? (item.price || materialData?.price) : materialData?.price,
                    totalAmount: type === 'in' ? ((item.price || materialData?.price || 0) * item.quantity) : 0,
                });
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "재고 업데이트 오류",
                description: `${item.name}의 재고를 업데이트하는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
            });
            // Continue to next item
        }
    }

    await historyBatch.commit();
    await fetchMaterials();
  };

  const manualUpdateStock = async (
    itemId: string,
    itemName: string,
    newStock: number,
    branchName: string,
    operator: string
  ) => {
    try {
      await runTransaction(db, async (transaction) => {
        const materialQuery = query(collection(db, "materials"), where("id", "==", itemId));
        const materialSnapshot = await getDocs(materialQuery);

        if (materialSnapshot.empty) {
          throw new Error(`자재를 찾을 수 없습니다: ${itemName} (${branchName})`);
        }

        const materialRef = materialSnapshot.docs[0].ref;
        const materialDoc = await transaction.get(materialRef);

        if(!materialDoc.exists()) {
            throw new Error(`자재 문서를 찾을 수 없습니다: ${itemName} (${branchName})`);
        }

        const currentStock = materialDoc.data()?.stock || 0;

        transaction.update(materialRef, { stock: newStock });

        const materialData = materialDoc.data();
        const historyDocRef = doc(collection(db, "stockHistory"));
        transaction.set(historyDocRef, {
            date: serverTimestamp(),
            type: "manual_update",
            itemType: "material",
            itemId: itemId,
            itemName: itemName,
            quantity: newStock - currentStock,
            fromStock: currentStock,
            toStock: newStock,
            resultingStock: newStock,
            branch: branchName,
            operator: operator,
            supplier: materialData.supplier || '',
            price: materialData.price || 0,
            totalAmount: (materialData.price || 0) * Math.abs(newStock - currentStock),
        });
      });

      toast({
        title: "업데이트 성공",
        description: `${itemName}의 재고가 ${newStock}으로 업데이트되었습니다.`,
      });
      await fetchMaterials();

    } catch (error) {
      console.error("Manual stock update error:", error);
      toast({
        variant: "destructive",
        title: "재고 업데이트 오류",
        description: `재고 업데이트 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  };

  const bulkAddMaterials = async (data: any[], currentBranch: string) => {
    setLoading(true);
    let newCount = 0;
    let deleteCount = 0;
    let errorCount = 0;
    let supplierAddedCount = 0;
    let categoryAddedCount = 0;

    try {
      // 1. 먼저 모든 기존 자재 삭제
      const existingMaterialsSnapshot = await getDocs(collection(db, 'materials'));
      const deletePromises = existingMaterialsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      deleteCount = existingMaterialsSnapshot.docs.length;
    } catch (error) {
      console.error("기존 자재 삭제 오류:", error);
      toast({ 
        variant: 'destructive', 
        title: '오류', 
        description: '기존 자재 삭제 중 오류가 발생했습니다.' 
      });
      setLoading(false);
      return;
    }

    const dataToProcess = data.filter(row => {
        const hasName = row.name && String(row.name).trim() !== '';
        return hasName;
    });

    // 새로운 공급업체들을 수집
    const suppliersToAdd = new Set<string>();
    dataToProcess.forEach(row => {
        const supplier = String(row.supplier || '').trim();
        if (supplier && supplier !== '미지정' && supplier !== '') {
            suppliersToAdd.add(supplier);
        }
    });

    // 새로운 카테고리들을 수집
    const mainCategoriesToAdd = new Set<string>();
    const midCategoriesToAdd = new Set<string>();
    dataToProcess.forEach(row => {
        const mainCategory = String(row.mainCategory || '').trim();
        const midCategory = String(row.midCategory || '').trim();
        if (mainCategory && mainCategory !== '기타자재') {
            mainCategoriesToAdd.add(mainCategory);
        }
        if (midCategory && midCategory !== '기타') {
            midCategoriesToAdd.add(midCategory);
        }
    });

    // 공급업체들을 거래처 관리에 추가
    if (suppliersToAdd.size > 0) {
        try {
            for (const supplierName of suppliersToAdd) {
                const nameQuery = query(collection(db, "partners"), where("name", "==", supplierName));
                const nameSnapshot = await getDocs(nameQuery);

                if (nameSnapshot.empty) {
                    const partnerData = {
                        name: supplierName,
                        type: '자재공급업체',
                        contact: '',
                        address: '',
                        items: '자재',
                        memo: `자재 업로드 시 자동 추가된 공급업체: ${supplierName}`,
                        createdAt: serverTimestamp()
                    };
                    await addDoc(collection(db, 'partners'), partnerData);
                    supplierAddedCount++;
                }
            }
        } catch (error) {
            console.error("Error adding suppliers to partners:", error);
        }
    }

    // 새로운 카테고리들을 카테고리 관리에 추가
    if (mainCategoriesToAdd.size > 0 || midCategoriesToAdd.size > 0) {
        try {
            // 대분류 카테고리 추가
            for (const mainCategory of mainCategoriesToAdd) {
                const mainQuery = query(collection(db, "categories"), where("name", "==", mainCategory), where("type", "==", "main"));
                const mainSnapshot = await getDocs(mainQuery);

                if (mainSnapshot.empty) {
                    const categoryData = {
                        name: mainCategory,
                        type: 'main',
                        createdAt: serverTimestamp()
                    };
                    await addDoc(collection(db, 'categories'), categoryData);
                    categoryAddedCount++;
                }
            }

            // 중분류 카테고리 추가
            for (const midCategory of midCategoriesToAdd) {
                const midQuery = query(collection(db, "categories"), where("name", "==", midCategory), where("type", "==", "mid"));
                const midSnapshot = await getDocs(midQuery);

                if (midSnapshot.empty) {
                    const categoryData = {
                        name: midCategory,
                        type: 'mid',
                        createdAt: serverTimestamp()
                    };
                    await addDoc(collection(db, 'categories'), categoryData);
                    categoryAddedCount++;
                }
            }
        } catch (error) {
            console.error("Error adding categories:", error);
        }
    }

    // 순차 처리로 변경하여 ID 매핑이 올바르게 동작하도록 함
    for (let index = 0; index < dataToProcess.length; index++) {
      const row = dataToProcess[index];
      try {
        // 엑셀 필드명 매핑 (한글 필드명을 영문 필드명으로 변환)
        const mappedRow = {
          name: row.name || row.자재명 || '',
          mainCategory: row.mainCategory || row.대분류 || '',
          midCategory: row.midCategory || row.중분류 || '',
          price: row.price || row.가격 || 0,
          supplier: row.supplier || row.공급업체 || '',
          stock: row.stock || row.재고 || 0,
          size: row.size || row.규격 || '',
          color: row.color || row.색상 || '',
          code: row.code || row.코드 || row.자재코드 || '', // 자재코드 필드 추가
          category: row.category || row.카테고리 || '',
          status: row.status || row.상태 || 'active' // 상태 필드 추가
        };
        
        if (!mappedRow.name) {
          return;
        }
        const materialName = String(mappedRow.name);
        const materialCode = String(mappedRow.code || '');
        
        // 자재 데이터 준비 (엑셀의 모든 필드를 완전히 덮어쓰기)
        const materialData = {
          name: materialName,
          mainCategory: String(mappedRow.mainCategory || ''),
          midCategory: String(mappedRow.midCategory || ''),
          price: Number(mappedRow.price) || 0,
          supplier: String(mappedRow.supplier || ''),
          stock: Number(mappedRow.stock) || 0,
          size: String(mappedRow.size || ''),
          color: String(mappedRow.color || ''),
          code: materialCode,
          category: String(mappedRow.category || ''),
          status: String(mappedRow.status || 'active'),
          updatedAt: serverTimestamp(), // 업데이트 시간 추가
        };
        
        // 모든 자재를 새로 추가 (기존 자재는 이미 삭제됨)
        const docRef = doc(collection(db, "materials"));
        
        // 자재 ID 결정 로직: 엑셀에 코드가 있으면 무조건 그것을 사용 (자재명 중복 무시)
        let materialId;
        if (materialCode && materialCode.trim()) {
          // 1. 엑셀에 코드가 있으면 무조건 사용 (각 행이 독립적으로 처리됨)
          materialId = materialCode.trim();
        } else {
          // 2. 엑셀에 코드가 없으면 새 ID 생성
          materialId = await generateNewId();
        }
        
        await setDoc(docRef, { 
          ...materialData, 
          id: materialId,
          createdAt: serverTimestamp() 
        });
        newCount++;
      } catch (error) {
        console.error("Error processing material:", error);
        errorCount++;
      }
    }

    setLoading(false);
    if (errorCount > 0) {
        toast({ 
            variant: 'destructive', 
            title: '일부 처리 오류', 
            description: `${errorCount}개 항목 처리 중 오류가 발생했습니다.` 
        });
    }
    let description = `성공: 기존 자재 ${deleteCount}개 삭제, 신규 자재 ${newCount}개 추가 완료.`;
    if (supplierAddedCount > 0) {
        description += ` 새로운 공급업체 ${supplierAddedCount}개가 거래처 관리에 추가되었습니다.`;
    }
    if (categoryAddedCount > 0) {
        description += ` 새로운 카테고리 ${categoryAddedCount}개가 카테고리 관리에 추가되었습니다.`;
    }
    if (errorCount > 0) {
        description += ` (${errorCount}개 항목 처리 중 오류 발생)`;
    }
    
    toast({ 
        title: '처리 완료', 
        description
    });
    // 자재 목록 새로고침 (약간의 지연 후)
    setTimeout(async () => {
        await fetchMaterials();
    }, 1000);
  };
  return { materials, loading, updateStock, fetchMaterials, manualUpdateStock, addMaterial, updateMaterial, deleteMaterial, bulkAddMaterials, updateMaterialIds };
}
