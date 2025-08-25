"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Flower,
  Package,
  Megaphone,
  Users,
  Settings
} from 'lucide-react';
import { Expense, FlowerShopExpenseCategory, FLOWER_SHOP_CATEGORY_LABELS, FLOWER_SHOP_CATEGORY_COLORS } from '@/types/expense';

// 꽃집 특화 카테고리 매핑
const FLOWER_SHOP_CATEGORIES = {
  'flowers': { label: '꽃 구매', icon: Flower, color: 'text-pink-600' },
  'packaging': { label: '포장재/소모품', icon: Package, color: 'text-blue-600' },
  'marketing': { label: '마케팅/홍보', icon: Megaphone, color: 'text-purple-600' },
  'operations': { label: '운영비', icon: Settings, color: 'text-gray-600' },
  'labor': { label: '인건비', icon: Users, color: 'text-green-600' },
  'other': { label: '기타', icon: Target, color: 'text-orange-600' }
};

interface ExpenseListProps {
  expenses: Expense[];
  loading: boolean;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expenseId: string) => void;
  onView?: (expense: Expense) => void;
}

export function ExpenseList({ expenses, loading, onEdit, onDelete, onView }: ExpenseListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // 필터링된 지출 목록
  const filteredExpenses = expenses.filter(expense => {
    const searchMatch = !searchTerm || 
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const categoryMatch = categoryFilter === 'all' || expense.category === categoryFilter;
    const dateMatch = dateFilter === 'all' || 
      (dateFilter === 'today' && isToday(expense.date)) ||
      (dateFilter === 'week' && isThisWeek(expense.date)) ||
      (dateFilter === 'month' && isThisMonth(expense.date));
    return searchMatch && categoryMatch && dateMatch;
  });

  // 날짜 포맷팅
  const formatDate = (date: Date) => {
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

  // 결제 방법 라벨
  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      'cash': '현금',
      'card': '카드',
      'transfer': '이체'
    };
    return labels[method as keyof typeof labels] || method;
  };

  // 카테고리 아이콘 및 라벨 가져오기
  const getCategoryInfo = (category: string) => {
    return FLOWER_SHOP_CATEGORIES[category as keyof typeof FLOWER_SHOP_CATEGORIES] || 
           { label: category, icon: Target, color: 'text-gray-600' };
  };

  // 날짜 필터링 헬퍼 함수들
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isThisWeek = (date: Date) => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= weekAgo && date <= today;
  };

  const isThisMonth = (date: Date) => {
    const today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">지출 목록을 불러오는 중...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          지출 목록
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 필터 및 검색 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="지출 내용 또는 태그로 검색..."
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
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="today">오늘</SelectItem>
                <SelectItem value="week">이번 주</SelectItem>
                <SelectItem value="month">이번 달</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 지출 목록 테이블 */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>지출 내용</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>금액</TableHead>
                <TableHead>결제 방법</TableHead>
                <TableHead>날짜</TableHead>
                <TableHead>태그</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchTerm || categoryFilter !== 'all' || dateFilter !== 'all' 
                      ? '검색 조건에 맞는 지출이 없습니다.' 
                      : '등록된 지출이 없습니다.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => {
                  const categoryInfo = getCategoryInfo(expense.category);
                  const CategoryIcon = categoryInfo.icon;
                  
                  return (
                    <TableRow key={expense.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{expense.description}</div>
                          {expense.budgetId && (
                            <div className="text-xs text-muted-foreground">예산 연동됨</div>
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
                        <div className="text-sm font-medium">
                          {formatCurrency(expense.amount)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getPaymentMethodLabel(expense.paymentMethod)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(expense.date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {expense.tags?.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {expense.tags && expense.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{expense.tags.length - 2}
                            </Badge>
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
                            {onView && (
                              <DropdownMenuItem onClick={() => onView(expense)}>
                                <Eye className="h-4 w-4 mr-2" />
                                상세보기
                              </DropdownMenuItem>
                            )}
                            {onEdit && (
                              <DropdownMenuItem onClick={() => onEdit(expense)}>
                                <Edit className="h-4 w-4 mr-2" />
                                수정
                              </DropdownMenuItem>
                            )}
                            {onDelete && (
                              <DropdownMenuItem 
                                onClick={() => onDelete(expense.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                삭제
                              </DropdownMenuItem>
                            )}
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
        {filteredExpenses.length > 0 && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">총 지출</div>
                <div className="font-medium">
                  {formatCurrency(filteredExpenses.reduce((sum, e) => sum + e.amount, 0))}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">평균 지출</div>
                <div className="font-medium">
                  {formatCurrency(filteredExpenses.reduce((sum, e) => sum + e.amount, 0) / filteredExpenses.length)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">지출 건수</div>
                <div className="font-medium">
                  {filteredExpenses.length}건
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">예산 연동</div>
                <div className="font-medium">
                  {filteredExpenses.filter(e => e.budgetId).length}건
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
