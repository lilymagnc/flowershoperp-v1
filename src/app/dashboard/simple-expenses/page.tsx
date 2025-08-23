"use client";
import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Receipt, 
  Calendar, 
  BarChart3,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Building,
  FileSpreadsheet
} from 'lucide-react';
import { ExpenseInputForm } from './components/expense-input-form';
import { FixedCostTemplate } from './components/fixed-cost-template';
import { ExpenseList } from './components/expense-list';
import { ExpenseCharts } from './components/expense-charts';
import { useSimpleExpenses } from '@/hooks/use-simple-expenses';
import { useAuth } from '@/hooks/use-auth';

import { useUserRole } from '@/hooks/use-user-role';
import { useEffect, useMemo } from 'react';
import { 
  SIMPLE_EXPENSE_CATEGORY_LABELS,
  formatCurrency,
  getCategoryColor
} from '@/types/simple-expense';
export default function SimpleExpensesPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('charts');
  const [selectedMonth, setSelectedMonth] = useState<string>('current');
  const [isMounted, setIsMounted] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { expenses, fetchExpenses, calculateStats } = useSimpleExpenses();
  const { user } = useAuth();
  
  // 엑셀 템플릿 다운로드 함수
  const handleDownloadTemplate = () => {
    const template = [
      {
        '날짜': '2024-12-06',
        '지점명': '메인매장',
        '구매처': 'ABC상사',
        '카테고리': '자재',
        '세부분류': '원단',
        '품목명': '면원단',
        '수량': 10,
        '단가': 5000,
        '금액': 50000,
        '비고': ''
      }
    ];

    // XLSX 라이브러리 동적 import
    import('xlsx').then((XLSX) => {
      const ws = XLSX.utils.json_to_sheet(template);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '간편지출템플릿');
      
      // 컬럼 너비 설정
      ws['!cols'] = [
        { width: 12 }, // 날짜
        { width: 10 }, // 지점명
        { width: 15 }, // 구매처
        { width: 10 }, // 카테고리
        { width: 12 }, // 세부분류
        { width: 20 }, // 품목명
        { width: 8 },  // 수량
        { width: 10 }, // 단가
        { width: 12 }, // 금액
        { width: 15 }  // 비고
      ];

      XLSX.writeFile(wb, '간편지출_템플릿.xlsx');
    });
  };
  // 관리자 여부 확인 (user?.role 직접 사용)
  const isAdmin = user?.role === '본사 관리자';
  const isHQManager = user?.role === '본사 관리자';
  
  // 본사관리자 권한 확인
  const isHeadOfficeAdmin = user?.role === '본사 관리자';
  // 데이터 업데이트 함수
  const updateEmptyBranchIds = async () => {
    try {
      const { collection, getDocs, updateDoc, doc, query, where } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      // 빈 branchId를 가진 지출 데이터 찾기
      const expensesRef = collection(db, 'simpleExpenses');
      const q = query(expensesRef, where('branchId', '==', ''));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return;
      }
              // 배치 업데이트 - 모든 빈 branchId를 메인매장으로 설정
      const batch = [];
      snapshot.docs.forEach((docSnapshot) => {
        batch.push(updateDoc(docSnapshot.ref, { branchId: 'lilymac-gwanghwamun' }));
      });
      await Promise.all(batch);
      // 데이터 새로고침
      fetchExpenses();
    } catch (error) {
      console.error('데이터 업데이트 오류:', error);
    }
  };

  // 성공 시 새로고침
  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    // 전체 데이터 새로고침
    fetchExpenses();
  };
  

  // 필터링된 지출 데이터
  const filteredExpenses = useMemo(() => {
    return expenses; // 전체 데이터 표시
  }, [expenses]);
  // 이번 달 지출 계산 (현자 지점만)
  const thisMonthExpenses = filteredExpenses.filter(expense => {
    if (!expense.date) return false;
    const expenseDate = expense.date.toDate();
    const now = new Date();
    const isCurrentMonth = expenseDate.getMonth() === now.getMonth() && 
                          expenseDate.getFullYear() === now.getFullYear();
    return isCurrentMonth;
  });
  const thisMonthStats = calculateStats(thisMonthExpenses);
  // 오늘 지출 계산 (현자 지점만)
  const todayExpenses = filteredExpenses.filter(expense => {
    if (!expense.date) return false;
    const expenseDate = expense.date.toDate();
    const today = new Date();
    const isToday = expenseDate.toDateString() === today.toDateString();
    return isToday;
  });
  const todayTotal = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  // 실제 데이터가 있는 월들 계산
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentMonthKey = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    
    // 현재 월은 항상 포함
    monthSet.add(currentMonthKey);
    
    // 지출 데이터에서 월 추출
    expenses.forEach(expense => {
      if (expense.date) {
        const expenseDate = expense.date.toDate();
        const year = expenseDate.getFullYear();
        const month = expenseDate.getMonth() + 1;
        const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
        monthSet.add(monthKey);
      }
    });
    
    // 월별로 정렬 (최신순)
    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  }, [expenses]);
  // 현재 월을 기본값으로 설정
  useEffect(() => {
    if (selectedMonth === 'current' && availableMonths.length > 0) {
      setSelectedMonth(availableMonths[0]); // 가장 최신 월(현재 월)로 설정
    }
  }, [selectedMonth, availableMonths]);

  // 컴포넌트 마운트 상태 관리
  useEffect(() => {
    setIsMounted(true);
    setRenderKey(prev => prev + 1);
    return () => {
      setIsMounted(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    if (!isMounted) return;
    
    if (isAdmin) {
      // 관리자는 전체 데이터 로드
      fetchExpenses();
      // 본사 관리자인 경우 빈 branchId 데이터 자동 업데이트
      updateEmptyBranchIds();
    } else {
      // 기본적으로 전체 데이터 로드
      fetchExpenses();
    }
  }, [user, isAdmin, fetchExpenses, isMounted]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">간편 지출 관리</h1>
          <p className="text-muted-foreground">
            전체 지출을 쉽고 빠르게 관리하세요
          </p>
        </div>
        {/* 월 선택 드롭다운 */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select 
            key={`month-select-${selectedMonth}-${renderKey}-${isMounted}`}
            value={selectedMonth} 
            onValueChange={setSelectedMonth}
            disabled={isUpdating || !isMounted}
          >
            <SelectTrigger className="w-[150px] text-foreground">
              <SelectValue placeholder="월 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 기간</SelectItem>
              {availableMonths.map(monthKey => {
                const [year, month] = monthKey.split('-');
                const monthLabel = `${year}년 ${parseInt(month)}월`;
                return (
                  <SelectItem key={monthKey} value={monthKey}>
                    {monthLabel}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {isUpdating ? (
          // 로딩 중일 때 스켈레톤 표시
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">오늘 지출</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">이번 달 지출</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">주요 분류</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">주요 구매처</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">오늘 지출</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(todayTotal)}</div>
                <p className="text-xs text-muted-foreground">
                  {todayExpenses.length}건
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">이번 달 지출</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(thisMonthStats.totalAmount)}</div>
                <p className="text-xs text-muted-foreground">
                  {thisMonthExpenses.length}건
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">주요 분류</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {thisMonthStats.categoryBreakdown.length > 0 ? (
                  <div>
                    <div className="text-2xl font-bold">
                      {SIMPLE_EXPENSE_CATEGORY_LABELS[thisMonthStats.categoryBreakdown[0].category]}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {thisMonthStats.categoryBreakdown[0].percentage.toFixed(1)}%
                    </p>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">데이터 없음</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">주요 구매처</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {thisMonthStats.topSuppliers.length > 0 ? (
                  <div>
                    <div className="text-2xl font-bold truncate">
                      {thisMonthStats.topSuppliers[0].name}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(thisMonthStats.topSuppliers[0].amount)}
                    </p>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">데이터 없음</div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
      {/* 이번 달 카테고리별 요약 */}
      {thisMonthStats.categoryBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">이번 달 분류별 지출</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {thisMonthStats.categoryBreakdown.map((category) => (
                <div key={category.category} className="flex items-center gap-2">
                  <Badge 
                    variant="outline"
                    className={`border-${getCategoryColor(category.category)}-500`}
                  >
                    {SIMPLE_EXPENSE_CATEGORY_LABELS[category.category]}
                  </Badge>
                  <span className="text-sm font-medium">
                    {formatCurrency(category.amount)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({category.percentage.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
             {/* 메인 탭 */}
       {isMounted && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4" key={`tabs-${renderKey}-${isMounted}`}>
         <TabsList className="grid w-full grid-cols-5">
           <TabsTrigger value="input" className="flex items-center gap-2">
             <Plus className="h-4 w-4" />
             지출 입력
           </TabsTrigger>
           <TabsTrigger value="fixed" className="flex items-center gap-2">
             <Calendar className="h-4 w-4" />
             고정비 관리
           </TabsTrigger>
           <TabsTrigger value="list" className="flex items-center gap-2">
             <Receipt className="h-4 w-4" />
             지출 내역
           </TabsTrigger>
           <TabsTrigger value="charts" className="flex items-center gap-2">
             <BarChart3 className="h-4 w-4" />
             차트 분석
           </TabsTrigger>
           {isHQManager && (
             <TabsTrigger value="headquarters" className="flex items-center gap-2">
               <Building className="h-4 w-4" />
               본사 관리
             </TabsTrigger>
           )}
         </TabsList>
        <TabsContent value="input">
          {isUpdating ? (
            <Card className="w-full max-w-2xl mx-auto">
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">데이터를 불러오는 중입니다...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* 엑셀 업로드 안내 카드 */}
              <Card className="w-full max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                    엑셀 대량 업로드
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    대량의 지출 데이터를 엑셀 파일로 한 번에 입력할 수 있습니다.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-800 mb-1">간편한 대량 입력</h4>
                      <p className="text-sm text-blue-600">
                        • 엑셀 템플릿 다운로드 후 데이터 입력<br/>
                        • 신규 구매처, 자재, 상품 자동 등록<br/>
                        • 지점별 데이터 자동 분류 및 재고 업데이트
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDownloadTemplate}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2 inline" />
                        템플릿 다운로드
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 기존 지출 입력 폼 */}
              <ExpenseInputForm 
                key={`expense-form-${renderKey}`}
                onSuccess={handleSuccess}
                continueMode={true}
              />
            </div>
          )}
        </TabsContent>
        <TabsContent value="fixed">
          <FixedCostTemplate 
            key={`fixed-cost-${renderKey}`}
            onSuccess={handleSuccess} 
          />
        </TabsContent>
                 <TabsContent value="list">
           <ExpenseList 
             key={`expense-list-${renderKey}`}
             refreshTrigger={refreshTrigger} 
           />
         </TabsContent>
         <TabsContent value="charts">
           <ExpenseCharts 
             key={`expense-charts-${renderKey}-${selectedMonth}`}
             expenses={filteredExpenses}
             currentBranchName="메인매장"
             selectedMonth={selectedMonth === 'all' || selectedMonth === 'current' ? undefined : selectedMonth}
           />
         </TabsContent>
         {isHQManager && (
           <TabsContent value="headquarters">
             <ExpenseList 
               refreshTrigger={refreshTrigger} 
               isHeadquarters={true}
             />
           </TabsContent>
         )}
        </Tabs>
      )}
    </div>
  );
}
