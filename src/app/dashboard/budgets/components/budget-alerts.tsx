"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  AlertTriangle, 
  TrendingUp,
  DollarSign,
  Calendar,
  Target,
  Bell,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  Settings,
  Flower,
  Package,
  Megaphone,
  Users
} from 'lucide-react';
import { useBudgets } from '@/hooks/use-budgets';
import type { Budget } from '@/types/expense';

// 꽃집 특화 카테고리 아이콘
const CATEGORY_ICONS = {
  'flowers': Flower,
  'packaging': Package,
  'marketing': Megaphone,
  'operations': Settings,
  'labor': Users,
  'other': Target
};

interface BudgetAlert {
  id: string;
  budget: Budget;
  type: 'over_budget' | 'near_limit' | 'monthly_reminder';
  severity: 'high' | 'medium' | 'low';
  message: string;
  usage: number;
  recommendedAction: string;
}

interface AlertSettings {
  enableAlerts: boolean;
  threshold80: boolean;
  threshold90: boolean;
  threshold100: boolean;
  monthlyReminder: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export function BudgetAlerts({ budgets }: { budgets: Budget[] }) {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    enableAlerts: true,
    threshold80: true,
    threshold90: true,
    threshold100: true,
    monthlyReminder: true,
    emailNotifications: false,
    pushNotifications: true,
  });

  // 알림 생성
  const generateAlerts = () => {
    if (!alertSettings.enableAlerts) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    const budgetAlerts: BudgetAlert[] = [];
    
    budgets
      .filter(budget => budget.isActive)
      .forEach(budget => {
        const usage = budget.allocatedAmount > 0 ? (budget.usedAmount / budget.allocatedAmount) * 100 : 0;
        const categoryIcon = CATEGORY_ICONS[budget.category as keyof typeof CATEGORY_ICONS] || Target;
        
        // 예산 초과 알림
        if (alertSettings.threshold100 && usage >= 100) {
          budgetAlerts.push({
            id: `${budget.id}_over_budget`,
            budget,
            type: 'over_budget',
            severity: 'high',
            message: `${budget.name} 예산을 ${(usage - 100).toFixed(1)}% 초과했습니다.`,
            usage,
            recommendedAction: '지출을 중단하고 예산을 재검토하세요.'
          });
        }
        // 90% 이상 알림
        else if (alertSettings.threshold90 && usage >= 90) {
          budgetAlerts.push({
            id: `${budget.id}_near_limit_90`,
            budget,
            type: 'near_limit',
            severity: 'high',
            message: `${budget.name} 예산 사용률이 ${usage.toFixed(1)}%에 도달했습니다.`,
            usage,
            recommendedAction: '지출을 신중하게 관리하고 예산 조정을 고려하세요.'
          });
        }
        // 80% 이상 알림
        else if (alertSettings.threshold80 && usage >= 80) {
          budgetAlerts.push({
            id: `${budget.id}_near_limit_80`,
            budget,
            type: 'near_limit',
            severity: 'medium',
            message: `${budget.name} 예산 사용률이 ${usage.toFixed(1)}%에 도달했습니다.`,
            usage,
            recommendedAction: '지출 계획을 검토하세요.'
          });
        }
        
                 // 월간 예산 월말 알림
         if (alertSettings.monthlyReminder && budget.fiscalMonth) {
           const now = new Date();
           const currentMonth = now.getMonth() + 1;
           const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
           
           if (budget.fiscalMonth === currentMonth && daysLeft <= 3) {
             budgetAlerts.push({
               id: `${budget.id}_monthly_reminder`,
               budget,
               type: 'monthly_reminder',
               severity: 'low',
               message: `${budget.name} 월말까지 ${daysLeft}일 남았습니다.`,
               usage,
               recommendedAction: '남은 예산을 효율적으로 활용하세요.'
             });
           }
         }
      });

    // 심각도별 정렬
    budgetAlerts.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
    
    setAlerts(budgetAlerts);
    setLoading(false);
  };

  useEffect(() => {
    generateAlerts();
  }, [budgets, alertSettings]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <TrendingUp className="h-4 w-4" />;
      case 'low': return <Bell className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      notation: 'compact'
    }).format(amount);
  };

  const handleSettingChange = (key: keyof AlertSettings, value: boolean) => {
    setAlertSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">알림을 확인하는 중...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 알림 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            알림 설정
          </CardTitle>
          <CardDescription>
            예산 알림을 관리하고 설정합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">알림 활성화</div>
              <div className="text-sm text-muted-foreground">모든 예산 알림을 켜거나 끕니다</div>
            </div>
            <Switch
              checked={alertSettings.enableAlerts}
              onCheckedChange={(checked) => handleSettingChange('enableAlerts', checked)}
            />
          </div>
          
          {alertSettings.enableAlerts && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">80% 알림</div>
                  <div className="text-sm text-muted-foreground">예산 80% 사용 시</div>
                </div>
                <Switch
                  checked={alertSettings.threshold80}
                  onCheckedChange={(checked) => handleSettingChange('threshold80', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">90% 알림</div>
                  <div className="text-sm text-muted-foreground">예산 90% 사용 시</div>
                </div>
                <Switch
                  checked={alertSettings.threshold90}
                  onCheckedChange={(checked) => handleSettingChange('threshold90', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">100% 알림</div>
                  <div className="text-sm text-muted-foreground">예산 초과 시</div>
                </div>
                <Switch
                  checked={alertSettings.threshold100}
                  onCheckedChange={(checked) => handleSettingChange('threshold100', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">월말 알림</div>
                  <div className="text-sm text-muted-foreground">월간 예산 월말 3일 전</div>
                </div>
                <Switch
                  checked={alertSettings.monthlyReminder}
                  onCheckedChange={(checked) => handleSettingChange('monthlyReminder', checked)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 알림 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            예산 알림
            {alerts.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {alerts.length}개
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            현재 활성화된 예산 알림입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">현재 활성화된 알림이 없습니다.</p>
              <p className="text-sm text-muted-foreground mt-1">모든 예산이 정상 범위 내에 있습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
                             {alerts.map((alert) => {
                 const CategoryIcon = CATEGORY_ICONS[alert.budget.category as keyof typeof CATEGORY_ICONS] || Target;
                 
                 return (
                   <Alert key={alert.id} className={getSeverityColor(alert.severity)}>
                     <div className="flex items-start gap-3">
                       {getSeverityIcon(alert.severity)}
                       <div className="flex-1">
                         <div className="flex items-center gap-2 mb-2">
                           <CategoryIcon className="h-4 w-4" />
                           <span className="font-medium">{alert.message}</span>
                                                     <Badge variant="outline" className="text-xs">
                             {alert.budget.fiscalYear}년
                             {alert.budget.fiscalMonth && ` ${alert.budget.fiscalMonth}월`}
                           </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>사용률: {alert.usage.toFixed(1)}%</span>
                            <span className="text-muted-foreground">
                              {formatCurrency(alert.budget.allocatedAmount - alert.budget.usedAmount)} 남음
                            </span>
                          </div>
                          <Progress 
                            value={Math.min(alert.usage, 100)} 
                            className="h-2"
                          />
                          <p className="text-sm text-muted-foreground">
                            💡 {alert.recommendedAction}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Alert>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
