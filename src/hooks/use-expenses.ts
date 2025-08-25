"use client";
import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Expense, FlowerShopExpenseCategory } from '@/types/expense';

interface UseExpensesReturn {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getExpensesByBudget: (budgetId: string) => Expense[];
  getExpensesByCategory: (category: FlowerShopExpenseCategory) => Expense[];
  getExpensesByDateRange: (startDate: Date, endDate: Date) => Expense[];
  refreshExpenses: () => Promise<void>;
}

export function useExpenses(): UseExpensesReturn {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 지출 목록 조회
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const expensesRef = collection(db, 'expenses');
      const q = query(expensesRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const expensesData: Expense[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        expensesData.push({
          id: doc.id,
          budgetId: data.budgetId,
          category: data.category,
          amount: data.amount,
          description: data.description,
          date: data.date.toDate(),
          paymentMethod: data.paymentMethod,
          receipt: data.receipt,
          tags: data.tags || [],
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        });
      });
      
      setExpenses(expensesData);
    } catch (err) {
      setError('지출 목록을 불러오는데 실패했습니다.');
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  // 지출 추가
  const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      
      const expenseDoc = {
        ...expenseData,
        date: Timestamp.fromDate(expenseData.date),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      await addDoc(collection(db, 'expenses'), expenseDoc);
      await fetchExpenses(); // 목록 새로고침
    } catch (err) {
      setError('지출 추가에 실패했습니다.');
      console.error('Error adding expense:', err);
      throw err;
    }
  };

  // 지출 수정
  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      setError(null);
      
      const expenseRef = doc(db, 'expenses', id);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
      };
      
      // 날짜 필드가 있으면 Timestamp로 변환
      if (updates.date) {
        updateData.date = Timestamp.fromDate(updates.date);
      }
      
      await updateDoc(expenseRef, updateData);
      await fetchExpenses(); // 목록 새로고침
    } catch (err) {
      setError('지출 수정에 실패했습니다.');
      console.error('Error updating expense:', err);
      throw err;
    }
  };

  // 지출 삭제
  const deleteExpense = async (id: string) => {
    try {
      setError(null);
      
      await deleteDoc(doc(db, 'expenses', id));
      await fetchExpenses(); // 목록 새로고침
    } catch (err) {
      setError('지출 삭제에 실패했습니다.');
      console.error('Error deleting expense:', err);
      throw err;
    }
  };

  // 예산별 지출 조회
  const getExpensesByBudget = (budgetId: string): Expense[] => {
    return expenses.filter(expense => expense.budgetId === budgetId);
  };

  // 카테고리별 지출 조회
  const getExpensesByCategory = (category: FlowerShopExpenseCategory): Expense[] => {
    return expenses.filter(expense => expense.category === category);
  };

  // 날짜 범위별 지출 조회
  const getExpensesByDateRange = (startDate: Date, endDate: Date): Expense[] => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  };

  // 지출 목록 새로고침
  const refreshExpenses = async () => {
    await fetchExpenses();
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  return {
    expenses,
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpensesByBudget,
    getExpensesByCategory,
    getExpensesByDateRange,
    refreshExpenses,
  };
}
