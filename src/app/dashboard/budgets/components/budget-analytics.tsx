"use client";
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  Flower,
  Package,
  Megaphone,
  Users,
  Settings,
  BarChart3,
  PieChart
} from 'lucide-react';
import type { Budget, Expense } from '@/types/expense';
import { Alert, AlertDescription } from '@/components/ui/alert';

// 꽃집 특화 카테고리 아이콘
const CATEGORY_ICONS = {
  'flowers': Flower,
  'packaging': Package,
  'marketing': Megaphone,
  'operations': Settings,
  'labor': Users,
  'other': Target
};

const CATEGORY_LABELS = {
  'flowers': '꽃 구매',
  'packaging': '포장재/소모품',
  'marketing': '마케팅/홍보',
  'operations': '운영비',
  'labor': '인건비',
  'other': '기타'
};

interface BudgetAnalyticsProps {
  budgets: Budget[];
  stats: any;
  expenses?: Expense[];
}

export function BudgetAnalytics({ budgets, stats }: BudgetAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'current' | 'quarter' | 'year'>('current');

  // 시간 범위별 데이터 필터링
  const filteredBudgets = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    return budgets.filter(budget => {
      switch (timeRange) {
        case 'current':
          return budget.fiscalYear === currentYear && budget.isActive;
        case 'quarter':
          const quarterMonths = Math.ceil(currentMonth / 3) * 3;
          return budget.fiscalYear === currentYear && 
                 (!budget.fiscalMonth || budget.fiscalMonth <= quarterMonths);
        case 'year':
          return budget.fiscalYear === currentYear;
        default:
          return budget.isActive;
      }
    });
  }, [budgets, timeRange]);

  // 카테고리별 분석
  const categoryAnalysis = useMemo(() => {
    const categoryData = filteredBudgets.reduce((acc, budget) => {
      const category = budget.category as keyof typeof CATEGORY_LABELS;
      if (!acc[category]) {
        acc[category] = {
          category,
          label: CATEGORY_LABELS[category] || category,
          allocated: 0,
          used: 0,
          remaining: 0,
          count: 0
        };
      }
      acc[category].allocated += budget.allocatedAmount;
      acc[category].used += budget.usedAmount;
      acc[category].remaining += (budget.allocatedAmount - budget.usedAmount);
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(categoryData).map(item => ({
      ...item,
      usage: item.allocated > 0 ? (item.used / item.allocated) * 100 : 0
    }));
  }, [filteredBudgets]);

  // 월별 추이 분석
  const monthlyTrend = useMemo(() => {
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      allocated: 0,
      used: 0,
      remaining: 0
    }));

         filteredBudgets.forEach(budget => {
       if (budget.fiscalMonth) {
         const monthIndex = budget.fiscalMonth - 1;
         monthlyData[monthIndex].allocated += budget.allocatedAmount;
         monthlyData[monthIndex].used += budget.usedAmount;
         monthlyData[monthIndex].remaining += (budget.allocatedAmount - budget.usedAmount);
       }
     });

    return monthlyData;
  }, [filteredBudgets]);

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

  return (
    <div className="space-y-6">
      {/* 필터 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            예산 분석
          </CardTitle>
          <CardDescription>
            예산 사용 현황과 추이를 분석합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">이번 달</SelectItem>
                <SelectItem value="quarter">이번 분기</SelectItem>
                <SelectItem value="year">이번 년도</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 요약 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">총 예산</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalAllocated)}</p>
                <p className="text-xs text-blue-600">
                  {filteredBudgets.length}개 예산
                </p>
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
                <DollarSign className="h-5 w-5 text-purple-600" />
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

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">활성 예산</p>
                <p className="text-xl font-bold">{filteredBudgets.filter(b => b.isActive).length}</p>
                <p className="text-xs text-orange-600">
                  관리 중
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 카테고리별 분석 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            카테고리별 예산 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
                         {categoryAnalysis.map((item) => {
               const CategoryIcon = CATEGORY_ICONS[item.category as keyof typeof CATEGORY_ICONS] || Target;
               
               return (
                 <div key={item.category} className="border rounded-lg p-4">
                   <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-2">
                       <CategoryIcon className="h-5 w-5" />
                       <span className="font-medium">{item.label}</span>
                       <Badge variant="outline" className="text-xs">
                         {item.count}개
                       </Badge>
                     </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(item.allocated)}</div>
                      <div className="text-sm text-muted-foreground">
                        사용: {formatCurrency(item.used)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>사용률</span>
                      <span className={getUsageColor(item.usage)}>
                        {item.usage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(item.usage, 100)} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>할당: {formatCurrency(item.allocated)}</span>
                      <span>남음: {formatCurrency(item.remaining)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 월별 추이 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            월별 예산 추이
          </CardTitle>
          <CardDescription>
            월간 예산의 할당 및 사용 현황
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyTrend.map((month) => {
              const usage = month.allocated > 0 ? (month.used / month.allocated) * 100 : 0;
              const monthName = `${month.month}월`;
              
              return (
                <div key={month.month} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="w-16 text-sm font-medium">{monthName}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">사용률</span>
                      <span className={`text-sm font-medium ${getUsageColor(usage)}`}>
                        {usage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(usage, 100)} 
                      className="h-2"
                    />
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-medium">{formatCurrency(month.allocated)}</div>
                    <div className="text-muted-foreground">
                      사용: {formatCurrency(month.used)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 인사이트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            예산 인사이트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.averageUsage >= 80 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>주의:</strong> 전체 예산 사용률이 {stats.averageUsage.toFixed(1)}%에 도달했습니다. 
                  지출을 신중하게 관리하세요.
                </AlertDescription>
              </Alert>
            )}
            
            {categoryAnalysis.some(item => item.usage >= 100) && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>예산 초과:</strong> 일부 카테고리에서 예산을 초과했습니다. 
                  해당 카테고리의 지출을 중단하고 예산을 재검토하세요.
                </AlertDescription>
              </Alert>
            )}
            
            {categoryAnalysis.some(item => item.usage < 30) && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>효율적 관리:</strong> 일부 카테고리에서 예산을 효율적으로 관리하고 있습니다. 
                  남은 예산을 다른 우선순위에 재배치하는 것을 고려해보세요.
                </AlertDescription>
              </Alert>
            )}
            
            {stats.totalRemaining > stats.totalAllocated * 0.3 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>건전한 재정:</strong> 충분한 예산 여유가 있습니다. 
                  향후 계획에 대한 투자를 고려해보세요.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
