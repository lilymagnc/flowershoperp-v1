'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Image, Download, AlertCircle } from 'lucide-react';
import { getGooglePhotosAlbums, importGooglePhotosAlbum } from '@/lib/google-photos-service';
import { useToast } from '@/hooks/use-toast';
import { AlbumCategory, ALBUM_CATEGORIES } from '@/types/album';

interface GooglePhotosAlbum {
  id: string;
  title: string;
  description?: string;
  mediaItemsCount: string;
  coverPhotoBaseUrl?: string;
  shareInfo?: {
    shareableUrl?: string;
  };
}

interface ImportGooglePhotosDialogProps {
  onImportComplete: () => void;
}

export function ImportGooglePhotosDialog({ onImportComplete }: ImportGooglePhotosDialogProps) {
  const [open, setOpen] = useState(false);
  const [albums, setAlbums] = useState<GooglePhotosAlbum[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<string>('');
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AlbumCategory>('other');
  const { toast } = useToast();

  // Google Photos 앨범 목록 가져오기
  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const albumsData = await getGooglePhotosAlbums();
      setAlbums(albumsData);
    } catch (error) {
      console.error('Google Photos 앨범 가져오기 실패:', error);
      
      let errorMessage = 'Google Photos에서 앨범 목록을 가져오는데 실패했습니다.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: '앨범 목록 가져오기 실패',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // 선택된 앨범 정보 업데이트
  useEffect(() => {
    if (selectedAlbum) {
      const album = albums.find(a => a.id === selectedAlbum);
      if (album) {
        setCustomTitle(album.title);
        setCustomDescription(album.description || '');
      }
    }
  }, [selectedAlbum, albums]);

  // 앨범 가져오기
  const handleImport = async () => {
    if (!selectedAlbum) {
      toast({
        variant: 'destructive',
        title: '앨범 선택 필요',
        description: '가져올 앨범을 선택해주세요.',
      });
      return;
    }

    setImporting(true);
    try {
      const result = await importGooglePhotosAlbum(
        selectedAlbum,
        customTitle,
        customDescription
      );

      toast({
        title: '앨범 가져오기 완료',
        description: `${result.importedPhotosCount}개의 사진이 포함된 앨범을 성공적으로 가져왔습니다.`,
      });

      setOpen(false);
      onImportComplete();
    } catch (error) {
      console.error('앨범 가져오기 실패:', error);
      toast({
        variant: 'destructive',
        title: '앨범 가져오기 실패',
        description: '앨범을 가져오는데 실패했습니다.',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={fetchAlbums}>
          <Download className="w-4 h-4 mr-2" />
          Google Photos에서 가져오기
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Google Photos 앨범 가져오기</DialogTitle>
          <DialogDescription>
            Google Photos에서 앨범을 선택하여 샘플 앨범으로 가져올 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 앨범 선택 */}
          <div className="space-y-4">
            <Label>Google Photos 앨범 선택</Label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                앨범 목록을 가져오는 중...
              </div>
            ) : albums.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <AlertCircle className="w-6 h-6 mr-2" />
                가져올 수 있는 앨범이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                {albums.map((album) => (
                  <Card
                    key={album.id}
                    className={`cursor-pointer transition-colors ${
                      selectedAlbum === album.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedAlbum(album.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center space-x-2">
                        {album.coverPhotoBaseUrl ? (
                          <img
                            src={album.coverPhotoBaseUrl + '=w100-h100-c'}
                            alt={album.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <Image className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm truncate">{album.title}</CardTitle>
                          <CardDescription className="text-xs">
                            {album.mediaItemsCount}개 사진
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    {album.description && (
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {album.description}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* 앨범 정보 설정 */}
          {selectedAlbum && (
            <div className="space-y-4">
              <Label>앨범 정보 설정</Label>
              
              <div className="space-y-2">
                <Label htmlFor="title">앨범 제목</Label>
                <Input
                  id="title"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="앨범 제목을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">앨범 설명</Label>
                <Input
                  id="description"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="앨범 설명을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">카테고리</Label>
                <Select value={selectedCategory} onValueChange={(value: AlbumCategory) => setSelectedCategory(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALBUM_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedAlbum || importing}
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  가져오는 중...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  앨범 가져오기
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
