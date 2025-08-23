"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useMaterials } from "@/hooks/use-materials";
import { Material } from "@/hooks/use-materials";
import { PageHeader } from "@/components/page-header";
import { ImportButton } from "@/components/import-button";
import { MaterialForm } from "./components/material-form";
import { MaterialTable } from "./components/material-table";
import { MaterialStatsCards } from "./components/material-stats-cards";
import { MultiPrintOptionsDialog } from "@/components/multi-print-options-dialog";
import { ScanLine, Plus, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { exportMaterialsToExcel } from "@/lib/excel-export";

export default function MaterialsPage() {
  const router = useRouter(); 
  const { 
    materials, 
    loading, 
    addMaterial, 
    updateMaterial, 
    deleteMaterial, 
    bulkAddMaterials,
    fetchMaterials,
  } = useMaterials();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [isMultiPrintDialogOpen, setIsMultiPrintDialogOpen] = useState(false);

  const filteredMaterials = useMemo(() => {
    return materials.filter(material => {
      const matchesSearch = (material.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (material.id?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || selectedCategory === "all" || material.mainCategory === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [materials, searchTerm, selectedCategory]);

  // 카테고리 목록 생성 (필터링된 자재 기준)
  const categories = useMemo(() => {
    return [...new Set(filteredMaterials.map(material => material.mainCategory).filter(Boolean))];
  }, [filteredMaterials]);

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingMaterial) {
        await updateMaterial(editingMaterial.docId, editingMaterial.id, data);
      } else {
        await addMaterial(data);
      }
      setIsFormOpen(false);
      setEditingMaterial(null);
    } catch (error) {
      console.error('Error saving material:', error);
    }
  };

  const handleMultiPrintSubmit = (items: { id: string; quantity: number }[], startPosition: number) => {
    const itemsQuery = items.map(item => `${item.id}:${item.quantity}`).join(',');
    const params = new URLSearchParams({
      items: itemsQuery,
      type: 'material',
      start: String(startPosition),
    });
    router.push(`/dashboard/print-labels?${params.toString()}`);
    setIsMultiPrintDialogOpen(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">로딩 중...</div>;
  }

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setIsFormOpen(true);
  };

  const handleExportToExcel = async () => {
    try {
      const filename = `자재목록_전체`;
      await exportMaterialsToExcel(filteredMaterials, filename);
    } catch (error) {
      console.error('엑셀 내보내기 오류:', error);
      alert('엑셀 파일 생성에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="자재 관리" description="자재를 추가, 수정, 삭제할 수 있습니다.">
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
            자재 추가
          </Button>
          <ImportButton
            onImport={(data) => bulkAddMaterials(data)}
            fileName="materials_template.xlsx"
            resourceName="자재"
          />
          <Button 
            variant="outline"
            onClick={handleExportToExcel}
            disabled={filteredMaterials.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            엑셀 내보내기
          </Button>
          {selectedMaterials.length > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setIsMultiPrintDialogOpen(true)}
            >
              선택 자재 라벨 출력 ({selectedMaterials.length}개)
            </Button>
          )}
        </div>
      </PageHeader>

      {/* 자재 통계 카드 */}
      <MaterialStatsCards 
        materials={filteredMaterials} 
        selectedBranch="all"
        isAdmin={true}
      />

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="자재명 또는 코드로 검색..."
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

      {filteredMaterials.length === 0 && !loading ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">표시할 자재가 없습니다.</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>총 자재 수: {materials.length}</p>
              <p>검색어: {searchTerm || "없음"}</p>
              <p>카테고리: {selectedCategory === "all" ? "전체" : selectedCategory}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <MaterialTable
          materials={filteredMaterials}
          onSelectionChange={setSelectedMaterials}
          onEdit={handleEdit}
          onDelete={deleteMaterial}
          selectedMaterials={selectedMaterials}
          isAdmin={true}
        />
      )}

      <MaterialForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        material={editingMaterial}
      />

      <MultiPrintOptionsDialog
        isOpen={isMultiPrintDialogOpen}
        onOpenChange={setIsMultiPrintDialogOpen}
        onSubmit={handleMultiPrintSubmit}
        itemIds={selectedMaterials}
        itemType="material"
      />
    </div>
  );
}
