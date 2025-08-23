"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useProducts } from "@/hooks/use-products";
import { Product } from "@/hooks/use-products";
import { PageHeader } from "@/components/page-header";
import { ImportButton } from "@/components/import-button";
import { ProductForm } from "./components/product-form";
import { ProductTable } from "./components/product-table";
import { ProductStatsCards } from "./components/product-stats-cards";
import { MultiPrintOptionsDialog } from "@/components/multi-print-options-dialog";
import { ScanLine, Plus, Download, Trash2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { exportProductsToExcel } from "@/lib/excel-export";

export default function ProductsPage() {
  const router = useRouter(); 
  const { 
    products, 
    loading, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    bulkAddProducts,
    fetchProducts,
    removeDuplicateProducts,
    detectDuplicateProducts,
    // migrateProductIds 제거
  } = useProducts();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isMultiPrintDialogOpen, setIsMultiPrintDialogOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    // 중복 상품 필터링 (이름과 코드가 같은 상품 중 첫 번째만 유지)
    const uniqueProducts = products.reduce((acc, product) => {
      const key = `${product.name}_${product.code || ''}`;
      if (!acc[key]) {
        acc[key] = product;
      }
      return acc;
    }, {} as Record<string, Product>);

    const uniqueProductsArray = Object.values(uniqueProducts);

    return uniqueProductsArray.filter(product => {
      const matchesSearch = (product.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (product.code?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || selectedCategory === "all" || product.mainCategory === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // 카테고리 목록 생성 (필터링된 상품 기준)
  const categories = useMemo(() => {
    return [...new Set(filteredProducts.map(product => product.mainCategory).filter(Boolean))];
  }, [filteredProducts]);

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.docId, data);
      } else {
        await addProduct(data);
      }
      setIsFormOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleMultiPrintSubmit = (items: { id: string; quantity: number }[], startPosition: number) => {
    const itemsQuery = items.map(item => `${item.id}:${item.quantity}`).join(',');
    const params = new URLSearchParams({
      items: itemsQuery,
      type: 'product',
      start: String(startPosition),
    });
    router.push(`/dashboard/print-labels?${params.toString()}`);
    setIsMultiPrintDialogOpen(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">로딩 중...</div>;
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleExportToExcel = async () => {
    try {
      const filename = `상품목록_전체`;
      await exportProductsToExcel(filteredProducts, filename);
    } catch (error) {
      console.error('엑셀 내보내기 오류:', error);
      alert('엑셀 파일 생성에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="상품 관리" description="상품을 추가, 수정, 삭제할 수 있습니다.">
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => router.push('/dashboard/barcode-scanner')}
          >
            <ScanLine className="mr-2 h-4 w-4" />
            바코드 스캔
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            상품 추가
          </Button>
          <ImportButton
            onImport={(data) => bulkAddProducts(data)}
            fileName="products_template.xlsx"
            resourceName="상품"
          />
          <Button 
            variant="outline"
            onClick={handleExportToExcel}
            disabled={filteredProducts.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            엑셀 내보내기
          </Button>
          {selectedProducts.length > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setIsMultiPrintDialogOpen(true)}
            >
              선택 상품 라벨 출력 ({selectedProducts.length}개)
            </Button>
          )}
                     <Button 
             variant="outline" 
             onClick={async () => {
               const duplicates = detectDuplicateProducts();
               if (duplicates.length > 0) {
                 const totalDuplicates = duplicates.reduce((sum, group) => sum + group.length - 1, 0);
                 if (confirm(`기존 중복 상품이 ${duplicates.length}개 그룹에서 ${totalDuplicates}개 발견되었습니다. 중복 상품을 삭제하시겠습니까?`)) {
                   await removeDuplicateProducts();
                 }
               } else {
                 alert('중복된 상품이 없습니다.');
               }
             }}
             className="border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
           >
             <Trash2 className="mr-2 h-4 w-4" />
             기존 중복 정리
           </Button>
        </div>
      </PageHeader>

             {/* 중복 상품 알림 (기존 중복 상품이 있을 경우에만 표시) */}
       {(() => {
         const duplicates = detectDuplicateProducts();
         if (duplicates.length > 0) {
           const totalDuplicates = duplicates.reduce((sum, group) => sum + group.length - 1, 0);
           return (
             <Card className="border-orange-200 bg-orange-50">
               <CardContent className="pt-6">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <AlertTriangle className="h-5 w-5 text-orange-600" />
                     <div>
                       <p className="font-medium text-orange-800">
                         기존 중복 상품 발견
                       </p>
                       <p className="text-sm text-orange-600">
                         {duplicates.length}개 그룹에서 {totalDuplicates}개의 중복 상품이 발견되었습니다.
                         <br />
                         <span className="text-xs">새로 추가되는 상품은 중복 방지 기능이 적용됩니다.</span>
                       </p>
                     </div>
                   </div>
                   <Button 
                     variant="outline" 
                     size="sm"
                     onClick={async () => {
                       if (confirm(`기존 중복 상품 ${totalDuplicates}개를 삭제하시겠습니까?`)) {
                         await removeDuplicateProducts();
                       }
                     }}
                     className="border-orange-500 text-orange-600 hover:bg-orange-100"
                   >
                     <Trash2 className="mr-2 h-4 w-4" />
                     중복 정리
                   </Button>
                 </div>
               </CardContent>
             </Card>
           );
         }
         return null;
       })()}

      {/* 상품 통계 카드 */}
      <ProductStatsCards 
        products={filteredProducts} 
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="상품명 또는 코드로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="카테고리 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 카테고리</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredProducts.length === 0 && !loading ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">표시할 상품이 없습니다.</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>총 상품 수: {products.length}</p>
              <p>검색어: {searchTerm || "없음"}</p>
              <p>카테고리: {selectedCategory === "all" ? "전체" : selectedCategory}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ProductTable
          products={filteredProducts}
          onSelectionChange={setSelectedProducts}
          onEdit={handleEdit}
          onDelete={deleteProduct}
          selectedProducts={selectedProducts}
        />
      )}

      <ProductForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        product={editingProduct}
      />

      <MultiPrintOptionsDialog
        isOpen={isMultiPrintDialogOpen}
        onOpenChange={setIsMultiPrintDialogOpen}
        onSubmit={handleMultiPrintSubmit}
        itemIds={selectedProducts}
        itemType="product"
      />
    </div>
  );
}
