"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, ShoppingBag, TrendingUp, TrendingDown } from "lucide-react";

interface Product {
  id: string;
  name: string;
  mainCategory: string;
  midCategory: string;
  branch: string;
  stock: number;
  price: number;
  status: string;
}

interface ProductStatsCardsProps {
  products: Product[];
}

export function ProductStatsCards({ products }: ProductStatsCardsProps) {
  const stats = useMemo(() => {
    // 전체 통계만 계산
    const totalStats = {
      total: products.length,
      categories: products.reduce((acc, product) => {
        acc[product.mainCategory] = (acc[product.mainCategory] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      lowStock: products.filter(p => p.stock > 0 && p.stock < 5).length,
      outOfStock: products.filter(p => p.stock === 0).length,
      totalValue: products.reduce((sum, p) => sum + (p.stock * p.price), 0)
    };

    return totalStats;
  }, [products]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {/* 총 상품 수 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">총 상품 수</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            전체 상품
          </p>
        </CardContent>
      </Card>

      {/* 카테고리별 상품 수 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">카테고리별</CardTitle>
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {Object.entries(stats.categories || {})
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .slice(0, 3)
              .map(([category, count]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground truncate">{category}</span>
                  <Badge variant="secondary" className="text-xs">{count}</Badge>
                </div>
              ))}
            {Object.keys(stats.categories || {}).length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{Object.keys(stats.categories || {}).length - 3}개 더
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 재고 상태 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">재고 상태</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">품절</span>
              <Badge variant="destructive" className="text-xs">{stats.outOfStock || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">재고 부족</span>
              <Badge variant="secondary" className="text-xs">{stats.lowStock || 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">정상</span>
              <Badge variant="default" className="text-xs">
                {stats.total - (stats.outOfStock || 0) - (stats.lowStock || 0)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 재고 가치 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">재고 총 가치</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₩{(stats.totalValue || 0).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            현재 재고 기준
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
