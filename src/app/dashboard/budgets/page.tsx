"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Target, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Calendar,
  BarChart3,
  Settings,
  PieChart,
  Flower,
  Package,
  Megaphone,
  Users,
  Bell,
  Smartphone
} from 'lucide-react';
import { BudgetForm } from './components/budget-form';
import { BudgetList } from './components/budget-list';
import { BudgetAnalytics } from './components/budget-analytics';
import { BudgetAlerts } from './components/budget-alerts';

import { ExpenseList } from './components/expense-list';
import { useBudgets } from '@/hooks/use-budgets';
import { useExpenses } from '@/hooks/use-expenses';
import { Budget } from '@/types/expense';

export default function BudgetsPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  
  // 지출 데이터 로드
  const { expenses, loading: expensesLoading, addExpense, deleteExpense } = useExpenses();
  
  // 예산 데이터 로드 (지출과 연동)
  const { budgets, loading: budgetsLoading, stats, createBudget, updateBudget } = useBudgets(expenses);
  
  const loading = budgetsLoading || expensesLoading;

  const handleCreateBudget = () => {
    setShowCreateForm(true);
    setActiveTab('create');
  };

  const handleBudgetCreated = () => {
    setShowCreateForm(false);
    setEditingBudget(null);
    // 수정 후에는 예산 목록 탭으로 이동, 생성 후에는 대시보드로 이동
    setActiveTab(editingBudget ? 'list' : 'dashboard');
  };

  const handleEditBudget = (budget: Budget) => {
    // Budget 타입을 BudgetForm의 initialData 타입으로 변환
    const initialData = {
      name: budget.name,
      category: budget.category as any, // 타입 변환
      period: budget.period || 'monthly',
      allocatedAmount: budget.allocatedAmount,
      startDate: budget.startDate || new Date().toISOString().split('T')[0],
      endDate: budget.endDate || new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      description: budget.description || '',
      alertThreshold: budget.alertThreshold || 80,
    };
    setEditingBudget(budget);
    setShowCreateForm(true);
    setActiveTab('create');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      notation: 'compact'
    }).format(amount);
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 100) return 'text-red-600';
    if (usage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUsageBgColor = (usage: number) => {
    if (usage >= 100) return 'bg-red-600';
    if (usage >= 80) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  // 꽃집 특화 카테고리별 예산 템플릿
  const flowerShopTemplates = [
    { id: 'flowers', name: '꽃 구매', icon: Flower, color: 'bg-pink-100', textColor: 'text-pink-600' },
    { id: 'packaging', name: '포장재/소모품', icon: Package, color: 'bg-blue-100', textColor: 'text-blue-600' },
    { id: 'marketing', name: '마케팅/홍보', icon: Megaphone, color: 'bg-purple-100', textColor: 'text-purple-600' },
    { id: 'operations', name: '운영비', icon: Settings, color: 'bg-gray-100', textColor: 'text-gray-600' },
    { id: 'labor', name: '인건비', icon: Users, color: 'bg-green-100', textColor: 'text-green-600' }
  ];

  // 빠른 액션 버튼들
  const quickActions = [
    { name: '예산 조정', icon: Target, action: () => setActiveTab('list') },
    { name: '알림 설정', icon: Bell, action: () => setActiveTab('alerts') },
    { name: '모바일 앱', icon: Smartphone, action: () => window.open('/mobile', '_blank') }
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">예산 관리</h1>
          <p className="text-muted-foreground mt-1">
            꽃집 운영에 최적화된 간편한 예산 관리
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateBudget} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            새 예산
          </Button>
        </div>
      </div>

      {/* 빠른 액션 버튼들 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {quickActions.map((action) => (
          <Button
            key={action.name}
            variant="outline"
            onClick={action.action}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            <action.icon className="h-5 w-5" />
            <span className="text-xs">{action.name}</span>
          </Button>
        ))}
      </div>

      {/* 핵심 통계 카드 - 간소화 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">이번 달 예산</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalAllocated)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">사용 금액</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalUsed)}</p>
                <p className={`text-xs ${getUsageColor(stats.averageUsage)}`}>
                  {stats.averageUsage.toFixed(1)}% 사용
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">남은 예산</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalRemaining)}</p>
                <p className="text-xs text-purple-600">
                  안전 마진
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 예산 사용률 시각화 - 간소화 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            이번 달 예산 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">전체 예산 사용률</span>
              <span className="text-sm font-bold">{stats.averageUsage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${getUsageBgColor(stats.averageUsage)}`}
                style={{ width: `${Math.min(stats.averageUsage, 100)}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">할당:</span>
                <span className="ml-2 font-medium">{formatCurrency(stats.totalAllocated)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">사용:</span>
                <span className="ml-2 font-medium">{formatCurrency(stats.totalUsed)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 꽃집 특화 예산 템플릿 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flower className="h-5 w-5" />
            예산 템플릿
          </CardTitle>
          <CardDescription>
            빠른 예산 설정을 위한 꽃집 특화 카테고리
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {flowerShopTemplates.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                onClick={() => {
                  setShowCreateForm(true);
                  setActiveTab('create');
                }}
                className="flex items-center gap-3 h-auto p-4 justify-start"
              >
                <div className={`p-2 rounded-lg ${template.color}`}>
                  <template.icon className={`h-5 w-5 ${template.textColor}`} />
                </div>
                <div className="text-left">
                  <div className="font-medium">{template.name}</div>
                  <div className="text-xs text-muted-foreground">예산 설정</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

             {/* 탭 네비게이션 */}
       <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
         <TabsList className="grid w-full grid-cols-5">
           <TabsTrigger value="dashboard">대시보드</TabsTrigger>
           <TabsTrigger value="list">예산 목록</TabsTrigger>
           <TabsTrigger value="expenses">지출 관리</TabsTrigger>
           <TabsTrigger value="analytics">분석</TabsTrigger>
           <TabsTrigger value="alerts">알림</TabsTrigger>
         </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {/* 대시보드 내용은 위의 카드들로 구성됨 */}
        </TabsContent>

                 <TabsContent value="list">
           <BudgetList 
             budgets={budgets} 
             onEdit={handleEditBudget}
           />
         </TabsContent>

         <TabsContent value="expenses">
           <ExpenseList 
             expenses={expenses} 
             loading={expensesLoading}
             onDelete={deleteExpense}
           />
         </TabsContent>

         <TabsContent value="analytics">
           <BudgetAnalytics budgets={budgets} stats={stats} expenses={expenses} />
         </TabsContent>

         <TabsContent value="alerts">
           <BudgetAlerts budgets={budgets} />
         </TabsContent>

                 <TabsContent value="create">
           {showCreateForm && (
             <BudgetForm 
               onClose={() => {
                 setShowCreateForm(false);
                 setEditingBudget(null);
               }}
               onSubmit={handleBudgetCreated}
               isEditing={!!editingBudget}
               onSuccess={() => {
                 // 성공 후 추가 작업이 필요한 경우 여기에 추가
                 console.log('Budget operation completed successfully');
               }}
               createBudget={createBudget}
               updateBudget={updateBudget}
               initialData={editingBudget ? {
                 id: editingBudget.id,
                 name: editingBudget.name,
                 category: editingBudget.category as any,
                 period: editingBudget.period || 'monthly',
                 allocatedAmount: editingBudget.allocatedAmount,
                 startDate: editingBudget.startDate || new Date().toISOString().split('T')[0],
                 endDate: editingBudget.endDate || new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
                 description: editingBudget.description || '',
                 alertThreshold: editingBudget.alertThreshold || 80,
               } : undefined}
             />
           )}
         </TabsContent>
      </Tabs>

    </div>
  );
}
