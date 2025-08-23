"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface Material {
  docId: string;
  id: string;
  name: string;
  mainCategory: string;
  midCategory: string;
  price: number;
  supplier: string;
  stock: number;
  status: string;
  size: string;
  color: string;
  branch: string;
}

interface MaterialStatsCardsProps {
  materials: Material[];
  selectedBranch: string;
  isAdmin: boolean;
}

export function MaterialStatsCards({ materials, selectedBranch, isAdmin }: MaterialStatsCardsProps) {
  const totalMaterials = materials.length;
  const totalValue = materials.reduce((sum, material) => sum + (material.price * material.stock), 0);
  
  const lowStockMaterials = materials.filter(material => material.stock < 5 && material.stock > 0);
  const outOfStockMaterials = materials.filter(material => material.stock === 0);
  const activeMaterials = materials.filter(material => material.stock > 0);

  const stats = [
    {
      title: "총 자재 수",
      value: totalMaterials,
      description: "등록된 자재",
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "총 재고 가치",
      value: `₩${totalValue.toLocaleString()}`,
      description: "전체 자재 가치",
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "재고 부족",
      value: lowStockMaterials.length,
      description: "5개 미만",
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      title: "품절",
      value: outOfStockMaterials.length,
      description: "재고 없음",
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
