"use client";
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { 
  Target, 
  DollarSign,
  Calendar,
  Save,
  X,
  AlertTriangle,
  Info,
  Flower,
  Package,
  Megaphone,
  Users,
  Settings,
  Zap
} from 'lucide-react';
import { useBudgets, UpdateBudgetData } from '@/hooks/use-budgets';
import { useToast } from '@/hooks/use-toast';

// 꽃집 특화 카테고리
enum FlowerShopCategory {
  FLOWERS = 'flowers',
  PACKAGING = 'packaging',
  MARKETING = 'marketing',
  OPERATIONS = 'operations',
  LABOR = 'labor',
  OTHER = 'other'
}

const FLOWER_SHOP_CATEGORIES = {
  [FlowerShopCategory.FLOWERS]: { label: '꽃 구매', icon: Flower, color: 'text-pink-600' },
  [FlowerShopCategory.PACKAGING]: { label: '포장재/소모품', icon: Package, color: 'text-blue-600' },
  [FlowerShopCategory.MARKETING]: { label: '마케팅/홍보', icon: Megaphone, color: 'text-purple-600' },
  [FlowerShopCategory.OPERATIONS]: { label: '운영비', icon: Settings, color: 'text-gray-600' },
  [FlowerShopCategory.LABOR]: { label: '인건비', icon: Users, color: 'text-green-600' },
  [FlowerShopCategory.OTHER]: { label: '기타', icon: Target, color: 'text-orange-600' }
};

// 간소화된 폼 스키마
const budgetFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, '예산명을 입력해주세요'),
  category: z.nativeEnum(FlowerShopCategory),
  period: z.enum(['monthly', 'quarterly', 'yearly']),
  allocatedAmount: z.number().min(1, '예산 금액은 1원 이상이어야 합니다'),
  startDate: z.string().min(1, '시작일을 선택해주세요'),
  endDate: z.string().min(1, '종료일을 선택해주세요'),
  description: z.string().optional(),
  alertThreshold: z.number().min(50).max(100).default(80),
});

type BudgetFormData = z.infer<typeof budgetFormSchema>;

interface BudgetFormProps {
  onClose: () => void;
  onSubmit: () => void;
  initialData?: Partial<BudgetFormData>;
  isEditing?: boolean;
  onSuccess?: () => void;
  createBudget: (data: any) => Promise<string>;
  updateBudget: (id: string, data: any) => Promise<void>;
}

export function BudgetForm({ onClose, onSubmit, initialData, isEditing = false, onSuccess, createBudget, updateBudget }: BudgetFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      name: '',
      category: FlowerShopCategory.FLOWERS,
      period: 'monthly',
      allocatedAmount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      description: '',
      alertThreshold: 80,
      ...initialData
    },
  });

  const selectedCategory = form.watch('category');
  const period = form.watch('period');

  // 기간별 기본 설정
  const getPeriodDates = (periodType: string) => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (periodType) {
      case 'monthly':
        endDate.setMonth(now.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(now.getMonth() + 3);
        break;
      case 'yearly':
        endDate.setFullYear(now.getFullYear() + 1);
        break;
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const handlePeriodChange = (newPeriod: string) => {
    const dates = getPeriodDates(newPeriod);
    form.setValue('startDate', dates.startDate);
    form.setValue('endDate', dates.endDate);
  };

  const handleSubmit = async (data: BudgetFormData) => {
    setIsSubmitting(true);
    try {
      if (isEditing && initialData?.id) {
        // 수정 모드
        const updateData: UpdateBudgetData = {
          name: data.name,
          category: data.category as any, // 타입 변환
          fiscalYear: new Date(data.startDate).getFullYear(),
          fiscalMonth: new Date(data.startDate).getMonth() + 1,
          allocatedAmount: data.allocatedAmount,
          description: data.description,
          period: data.period,
          startDate: data.startDate,
          endDate: data.endDate,
          alertThreshold: data.alertThreshold,
        };
        await updateBudget(initialData.id, updateData);
        
        toast({
          title: "예산 수정 완료",
          description: `${data.name} 예산이 성공적으로 수정되었습니다.`,
        });
      } else {
        // 생성 모드
        await createBudget({
          name: data.name,
          category: data.category as any, // 타입 변환
          fiscalYear: new Date(data.startDate).getFullYear(),
          fiscalMonth: new Date(data.startDate).getMonth() + 1,
          allocatedAmount: data.allocatedAmount,
          description: data.description,
          period: data.period,
          startDate: data.startDate,
          endDate: data.endDate,
          alertThreshold: data.alertThreshold,
        });
        
        toast({
          title: "예산 생성 완료",
          description: `${data.name} 예산이 성공적으로 생성되었습니다.`,
        });
      }
      
      onSubmit();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: isEditing ? "예산 수정 실패" : "예산 생성 실패",
        description: isEditing ? "예산 수정 중 오류가 발생했습니다." : "예산 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
              <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {isEditing ? '예산 수정' : '새 예산 생성'}
          </CardTitle>
        </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>예산명 *</FormLabel>
                    <FormControl>
                      <Input placeholder="예: 2024년 3월 꽃 구매 예산" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>카테고리 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="카테고리 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(FLOWER_SHOP_CATEGORIES).map(([key, category]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <category.icon className="h-4 w-4" />
                              {category.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>예산 기간 *</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        handlePeriodChange(value);
                      }} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">월간</SelectItem>
                          <SelectItem value="quarterly">분기</SelectItem>
                          <SelectItem value="yearly">연간</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allocatedAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>예산 금액 *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === '' ? 0 : Number(value));
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>시작일 *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>종료일 *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="alertThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>알림 임계값 (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="50"
                        max="100"
                        placeholder="80"
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? 80 : Number(value));
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                    </FormControl>
                    <FormDescription>
                      예산 사용률이 이 값에 도달하면 알림을 받습니다.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>설명 (선택사항)</FormLabel>
                    <FormControl>
                      <Input placeholder="예산에 대한 추가 설명을 입력하세요" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 선택된 카테고리 정보 */}
            {selectedCategory && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>{FLOWER_SHOP_CATEGORIES[selectedCategory].label}</strong> 카테고리는 
                  {selectedCategory === FlowerShopCategory.FLOWERS && ' 꽃 구매 및 수급 관리에 사용됩니다.'}
                  {selectedCategory === FlowerShopCategory.PACKAGING && ' 포장재, 리본, 종이 등 소모품 구매에 사용됩니다.'}
                  {selectedCategory === FlowerShopCategory.MARKETING && ' 광고, 홍보, 이벤트 비용에 사용됩니다.'}
                  {selectedCategory === FlowerShopCategory.OPERATIONS && ' 임대료, 전기세, 인터넷 등 운영비에 사용됩니다.'}
                  {selectedCategory === FlowerShopCategory.LABOR && ' 직원 급여, 수당 등 인건비에 사용됩니다.'}
                  {selectedCategory === FlowerShopCategory.OTHER && ' 기타 비용에 사용됩니다.'}
                </AlertDescription>
              </Alert>
            )}

            {/* 버튼 */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting 
                  ? (isEditing ? '수정 중...' : '생성 중...') 
                  : (isEditing ? '예산 수정' : '예산 생성')
                }
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
