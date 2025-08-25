"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  RefreshCw,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Pause,
  Play,
  Flower,
  Package,
  Megaphone,
  Users,
  Settings
} from 'lucide-react';
import { useBudgets } from '@/hooks/use-budgets';
import { 
  Budget, 
  ExpenseCategory,
  EXPENSE_CATEGORY_LABELS,
  calculateBudgetUsage,
  getBudgetStatus 
} from '@/types/expense';
import { BudgetDetailDialog } from './budget-detail-dialog';

// 꽃집 특화 카테고리 매핑
const FLOWER_SHOP_CATEGORIES = {
  'flowers': { label: '꽃 구매', icon: Flower, color: 'text-pink-600' },
  'packaging': { label: '포장재/소모품', icon: Package, color: 'text-blue-600' },
  'marketing': { label: '마케팅/홍보', icon: Megaphone, color: 'text-purple-600' },
  'operations': { label: '운영비', icon: Settings, color: 'text-gray-600' },
  'labor': { label: '인건비', icon: Users, color: 'text-green-600' },
  'other': { label: '기타', icon: Target, color: 'text-orange-600' }
};

interface BudgetListProps {
  budgets: Budget[];
  onEdit?: (budget: Budget) => void;
}

export function BudgetList({ budgets, onEdit }: BudgetListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const { toggleBudgetStatus, deleteBudget } = useBudgets();

  // 필터링된 예산 목록
  const filteredBudgets = budgets.filter(budget => {
    const searchMatch = !searchTerm || 
      String(budget.name ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = categoryFilter === 'all' || budget.category === categoryFilter;
    const statusMatch = statusFilter === 'all' || 
      (statusFilter === 'active' && budget.isActive) ||
      (statusFilter === 'inactive' && !budget.isActive);
    return searchMatch && categoryMatch && statusMatch;
  });

  // 예산 사용률 계산
  const getBudgetUsage = (budget: Budget) => {
    return budget.allocatedAmount > 0 ? (budget.usedAmount / budget.allocatedAmount) * 100 : 0;
  };

  // 상태별 색상 반환
  const getStatusColor = (budget: Budget) => {
    if (!budget.isActive) return 'text-gray-500';
    const usage = getBudgetUsage(budget);
    if (usage >= 100) return 'text-red-600';
    if (usage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  // 상태별 아이콘 반환
  const getStatusIcon = (budget: Budget) => {
    if (!budget.isActive) return <Pause className="h-4 w-4 text-gray-500" />;
    const usage = getBudgetUsage(budget);
    if (usage >= 100) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (usage >= 80) return <TrendingUp className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  // 날짜 포맷팅
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 금액 포맷팅
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      notation: 'compact'
    }).format(amount);
  };

  // 카테고리 아이콘 및 라벨 가져오기
  const getCategoryInfo = (category: string) => {
    return FLOWER_SHOP_CATEGORIES[category as keyof typeof FLOWER_SHOP_CATEGORIES] || 
           { label: category, icon: Target, color: 'text-gray-600' };
  };

  const handleToggleStatus = async (budgetId: string, currentStatus: boolean) => {
    try {
      await toggleBudgetStatus(budgetId, !currentStatus);
    } catch (error) {
      console.error('Failed to toggle budget status:', error);
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (confirm('정말로 이 예산을 삭제하시겠습니까?')) {
      try {
        await deleteBudget(budgetId);
      } catch (error) {
        console.error('Failed to delete budget:', error);
      }
    }
  };

  const handleViewDetail = (budget: Budget) => {
    setSelectedBudget(budget);
    setShowDetailDialog(true);
  };

  const handleEditBudget = (budget: Budget) => {
    if (onEdit) {
      onEdit(budget);
    }
  };



  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            예산 목록
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 필터 및 검색 */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="예산명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="카테고리" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 카테고리</SelectItem>
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
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="active">활성</SelectItem>
                  <SelectItem value="inactive">비활성</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 예산 목록 테이블 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>예산명</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>예산 금액</TableHead>
                  <TableHead>사용률</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>기간</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBudgets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' 
                        ? '검색 조건에 맞는 예산이 없습니다.' 
                        : '등록된 예산이 없습니다.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBudgets.map((budget) => {
                    const usage = getBudgetUsage(budget);
                    const categoryInfo = getCategoryInfo(budget.category);
                    const CategoryIcon = categoryInfo.icon;
                    
                    return (
                      <TableRow key={budget.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{budget.name}</div>
                            {budget.description && (
                              <div className="text-sm text-muted-foreground">{budget.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CategoryIcon className={`h-4 w-4 ${categoryInfo.color}`} />
                            <span className="text-sm">{categoryInfo.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{formatCurrency(budget.allocatedAmount)}</div>
                            <div className="text-muted-foreground">
                              사용: {formatCurrency(budget.usedAmount)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span>{usage.toFixed(1)}%</span>
                              <span className="text-muted-foreground">
                                {formatCurrency(budget.allocatedAmount - budget.usedAmount)} 남음
                              </span>
                            </div>
                            <Progress 
                              value={Math.min(usage, 100)} 
                              className="h-2"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(budget)}
                            <Badge 
                              variant={budget.isActive ? "default" : "secondary"}
                              className={getStatusColor(budget)}
                            >
                              {budget.isActive ? '활성' : '비활성'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{budget.fiscalYear}년</div>
                            {budget.fiscalMonth && (
                              <div className="text-muted-foreground">{budget.fiscalMonth}월</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetail(budget)}>
                                <Eye className="h-4 w-4 mr-2" />
                                상세보기
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditBudget(budget)}>
                                <Edit className="h-4 w-4 mr-2" />
                                수정
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleToggleStatus(budget.id, budget.isActive)}
                              >
                                {budget.isActive ? (
                                  <>
                                    <Pause className="h-4 w-4 mr-2" />
                                    비활성화
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-4 w-4 mr-2" />
                                    활성화
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteBudget(budget.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                삭제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* 요약 정보 */}
          {filteredBudgets.length > 0 && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">총 예산</div>
                  <div className="font-medium">
                    {formatCurrency(filteredBudgets.reduce((sum, b) => sum + b.allocatedAmount, 0))}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">총 사용</div>
                  <div className="font-medium">
                    {formatCurrency(filteredBudgets.reduce((sum, b) => sum + b.usedAmount, 0))}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">평균 사용률</div>
                  <div className="font-medium">
                    {(filteredBudgets.reduce((sum, b) => sum + getBudgetUsage(b), 0) / filteredBudgets.length).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">활성 예산</div>
                  <div className="font-medium">
                    {filteredBudgets.filter(b => b.isActive).length}개
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 예산 상세보기 다이얼로그 */}
      <BudgetDetailDialog
        budget={selectedBudget}
        open={showDetailDialog}
        onClose={() => {
          setShowDetailDialog(false);
          setSelectedBudget(null);
        }}
      />
    </>
  );
}
