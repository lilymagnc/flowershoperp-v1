"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts } from "@/hooks/use-products";
import { useAuth } from "@/hooks/use-auth";
import { Product } from "@/hooks/use-products";
import { PageHeader } from "@/components/page-header";
import { ImportButton } from "@/components/import-button";
import { ProductForm } from "./components/product-form";
import { ProductTable } from "./components/product-table";
import { MultiPrintOptionsDialog } from "@/components/multi-print-options-dialog";
import { ScanLine, Plus } from "lucide-react";
import { useRouter } from "next/navigation"; 

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
    // migrateProductIds 제거
  } = useProducts();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isMultiPrintDialogOpen, setIsMultiPrintDialogOpen] = useState(false);



  // 카테고리 목록 생성
  const categories = useMemo(() => {
    return [...new Set(products.map(product => product.mainCategory).filter(Boolean))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // 검색어 및 카테고리 필터링만 유지
    const finalFiltered = filtered.filter(product => {
      const matchesSearch = (product.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (product.code?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || selectedCategory === "all" || product.mainCategory === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    return finalFiltered;
  }, [products, searchTerm, selectedCategory]);

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
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

  const handleRefresh = async () => {
    await fetchProducts();
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="상품 관리" 
        description="상품 정보를 관리합니다."
      >
        <Button 
          variant="outline"
          onClick={() => router.push('/dashboard/barcode-scanner')}
        >
          <ScanLine className="mr-2 h-4 w-4" />
          바코드 스캔
        </Button>
      </PageHeader>

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

      <PageHeader title="상품 관리" description="상품을 추가, 수정, 삭제할 수 있습니다.">
        <div className="flex gap-2">
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            상품 추가
          </Button>
          {/* 마이그레이션 버튼 제거 */}
          <ImportButton
            onImport={bulkAddProducts}
            fileName="products_template.xlsx"
          />
          {selectedProducts.length > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setIsMultiPrintDialogOpen(true)}
            >
              선택 상품 라벨 출력 ({selectedProducts.length}개)
            </Button>
          )}
        </div>
      </PageHeader>

      <ProductTable
        products={filteredProducts}
        onSelectionChange={setSelectedProducts}
        onEdit={handleEdit}
        onDelete={deleteProduct}
        selectedProducts={selectedProducts}
        isAdmin={true}
        onRefresh={handleRefresh} // 새로고침 함수 전달
      />

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
