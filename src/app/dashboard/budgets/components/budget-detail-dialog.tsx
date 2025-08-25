"use client";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  DollarSign, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Pause,
  Flower,
  Package,
  Megaphone,
  Users,
  Settings
} from 'lucide-react';
import { Budget } from '@/types/expense';

// 꽃집 특화 카테고리 매핑
const FLOWER_SHOP_CATEGORIES = {
  'flowers': { label: '꽃 구매', icon: Flower, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  'packaging': { label: '포장재/소모품', icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'marketing': { label: '마케팅/홍보', icon: Megaphone, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'operations': { label: '운영비', icon: Settings, color: 'text-gray-600', bgColor: 'bg-gray-50' },
  'labor': { label: '인건비', icon: Users, color: 'text-green-600', bgColor: 'bg-green-50' },
  'other': { label: '기타', icon: Target, color: 'text-orange-600', bgColor: 'bg-orange-50' }
};

interface BudgetDetailDialogProps {
  budget: Budget | null;
  open: boolean;
  onClose: () => void;
}

export function BudgetDetailDialog({ budget, open, onClose }: BudgetDetailDialogProps) {
  if (!budget) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryInfo = (category: string) => {
    return FLOWER_SHOP_CATEGORIES[category as keyof typeof FLOWER_SHOP_CATEGORIES] || 
           { label: category, icon: Target, color: 'text-gray-600', bgColor: 'bg-gray-50' };
  };

  const getBudgetUsage = () => {
    return budget.allocatedAmount > 0 ? (budget.usedAmount / budget.allocatedAmount) * 100 : 0;
  };

  const getStatusInfo = () => {
    if (!budget.isActive) {
      return { icon: Pause, color: 'text-gray-500', label: '비활성', bgColor: 'bg-gray-100' };
    }
    
    const usage = getBudgetUsage();
    if (usage >= 100) {
      return { icon: AlertTriangle, color: 'text-red-600', label: '초과', bgColor: 'bg-red-100' };
    }
    if (usage >= 80) {
      return { icon: TrendingUp, color: 'text-yellow-600', label: '주의', bgColor: 'bg-yellow-100' };
    }
    return { icon: CheckCircle, color: 'text-green-600', label: '정상', bgColor: 'bg-green-100' };
  };

  const categoryInfo = getCategoryInfo(budget.category);
  const statusInfo = getStatusInfo();
  const usage = getBudgetUsage();
  const CategoryIcon = categoryInfo.icon;
  const StatusIcon = statusInfo.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            예산 상세 정보
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${categoryInfo.bgColor}`}>
                  <CategoryIcon className={`h-5 w-5 ${categoryInfo.color}`} />
                </div>
                <div>
                  <div className="text-lg font-semibold">{budget.name}</div>
                  <div className="text-sm text-muted-foreground">{categoryInfo.label}</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {budget.description && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">설명</div>
                  <div className="text-sm">{budget.description}</div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">상태</div>
                  <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-0`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusInfo.label}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">기간</div>
                  <div className="text-sm">
                    {budget.fiscalYear}년 {budget.fiscalMonth ? `${budget.fiscalMonth}월` : ''}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 예산 현황 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                예산 현황
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(budget.allocatedAmount)}
                  </div>
                  <div className="text-sm text-muted-foreground">할당 예산</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(budget.usedAmount)}
                  </div>
                  <div className="text-sm text-muted-foreground">사용 금액</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(budget.remainingAmount)}
                  </div>
                  <div className="text-sm text-muted-foreground">남은 예산</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>사용률</span>
                  <span className="font-medium">{usage.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={Math.min(usage, 100)} 
                  className="h-3"
                />
                <div className="text-xs text-muted-foreground">
                  {usage >= 100 ? '예산을 초과했습니다' : 
                   usage >= 80 ? '예산의 80% 이상 사용 중입니다' : 
                   '예산 사용이 정상 범위입니다'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 추가 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                추가 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">생성일</div>
                  <div>{formatDate(budget.createdAt)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">수정일</div>
                  <div>{formatDate(budget.updatedAt)}</div>
                </div>
                {budget.alertThreshold && (
                  <div>
                    <div className="text-muted-foreground mb-1">알림 임계값</div>
                    <div>{budget.alertThreshold}%</div>
                  </div>
                )}
                {budget.period && (
                  <div>
                    <div className="text-muted-foreground mb-1">예산 기간</div>
                    <div>{budget.period}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
