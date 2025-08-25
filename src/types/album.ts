import { Timestamp } from 'firebase/firestore';
export type AlbumCategory = 'wedding' | 'birthday' | 'memorial' | 'anniversary' | 'other';
export interface Album {
  id: string;
  title: string;
  description: string;
  category: AlbumCategory;
  thumbnailUrl?: string;
  photoCount: number;
  isPublic: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  googlePhotosAlbumId?: string; // Google Photos 앨범 ID
  googlePhotosShareUrl?: string; // Google Photos 공유 URL
}
export interface Photo {
  id: string;
  filename: string;
  originalUrl: string;
  thumbnailUrl: string;
  previewUrl: string;
  order: number;
  size: number;
  width: number;
  height: number;
  uploadedAt: Timestamp;
  uploadedBy: string;
  mediaItemId?: string; // Google Photos mediaItemId
  storageType?: 'google-photos' | 'firebase-storage'; // 저장소 타입
}
export interface CreateAlbumData {
  title: string;
  description: string;
  category: AlbumCategory;
  isPublic?: boolean;
}
export interface UploadProgress {
  filename: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}
export const ALBUM_CATEGORIES: { value: AlbumCategory; label: string }[] = [
  { value: 'wedding', label: '웨딩' },
  { value: 'birthday', label: '생일' },
  { value: 'memorial', label: '장례식' },
  { value: 'anniversary', label: '기념일' },
  { value: 'other', label: '기타' },
];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const THUMBNAIL_SIZE = 200;
export const PREVIEW_SIZE = 800;
