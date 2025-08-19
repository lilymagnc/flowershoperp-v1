"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Receipt, 
  Calendar, 
  BarChart3,
  DollarSign,
  TrendingUp,
  ShoppingCart
} from 'lucide-react';
import { ExpenseInputForm } from './components/expense-input-form';
import { FixedCostTemplate } from './components/fixed-cost-template';
import { ExpenseList } from './components/expense-list';
import { ExpenseCharts } from './components/expense-charts';
import { useSimpleExpenses } from '@/hooks/use-simple-expenses';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useMemo } from 'react';
import { 
  SIMPLE_EXPENSE_CATEGORY_LABELS,
  formatCurrency,
  getCategoryColor
} from '@/types/simple-expense';
export default function SimpleExpensesPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('charts');
  const { expenses, fetchExpenses, calculateStats } = useSimpleExpenses();
  const { user } = useAuth();

  


  // 성공 시 새로고침
  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchExpenses();
  };
  // 이번 달 지출 계산
  const thisMonthExpenses = expenses.filter(expense => {
    if (!expense.date) return false;
    const expenseDate = expense.date.toDate();
    const now = new Date();
    const isCurrentMonth = expenseDate.getMonth() === now.getMonth() && 
                          expenseDate.getFullYear() === now.getFullYear();
    return isCurrentMonth;
  });
  const thisMonthStats = calculateStats(thisMonthExpenses);
  // 오늘 지출 계산
  const todayExpenses = expenses.filter(expense => {
    if (!expense.date) return false;
    const expenseDate = expense.date.toDate();
    const today = new Date();
    const isToday = expenseDate.toDateString() === today.toDateString();
    return isToday;
  });
  const todayTotal = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  // 초기 데이터 로드
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">간편 지출 관리</h1>
          <p className="text-muted-foreground">
            모든 지출을 쉽고 빠르게 관리하세요
          </p>
        </div>

      </div>
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
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
       <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
         <TabsList className="grid w-full grid-cols-4">
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
         </TabsList>
        <TabsContent value="input">
          <ExpenseInputForm 
            onSuccess={handleSuccess}
            continueMode={true}
          />
        </TabsContent>
        <TabsContent value="fixed">
          <FixedCostTemplate 
            onSuccess={handleSuccess} 
          />
        </TabsContent>
        <TabsContent value="list">
          <ExpenseList 
            refreshTrigger={refreshTrigger} 
          />
        </TabsContent>
        <TabsContent value="charts">
          <ExpenseCharts 
            expenses={expenses}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
