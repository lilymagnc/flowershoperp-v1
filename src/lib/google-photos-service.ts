// Google Photos API 직접 구현
const GOOGLE_PHOTOS_CLIENT_ID = process.env.GOOGLE_PHOTOS_CLIENT_ID;
const GOOGLE_PHOTOS_CLIENT_SECRET = process.env.GOOGLE_PHOTOS_CLIENT_SECRET;
const GOOGLE_PHOTOS_REFRESH_TOKEN = process.env.GOOGLE_PHOTOS_REFRESH_TOKEN;

// 환경 변수 디버깅 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  console.log('Google Photos Environment Variables:', {
    CLIENT_ID: GOOGLE_PHOTOS_CLIENT_ID ? 'Set' : 'Not Set',
    CLIENT_SECRET: GOOGLE_PHOTOS_CLIENT_SECRET ? 'Set' : 'Not Set',
    REFRESH_TOKEN: GOOGLE_PHOTOS_REFRESH_TOKEN ? 'Set' : 'Not Set',
    REFRESH_TOKEN_PREFIX: GOOGLE_PHOTOS_REFRESH_TOKEN ? GOOGLE_PHOTOS_REFRESH_TOKEN.substring(0, 20) + '...' : 'Not Set'
  });
}

// 환경별 리디렉션 URI 설정
const getRedirectUri = () => {
  if (typeof window !== 'undefined') {
    // 클라이언트 사이드
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:${port}/auth/google/callback`;
    } else {
      return `${protocol}//${hostname}/auth/google/callback`;
    }
  }
  
  // 서버 사이드 - 환경 변수로 판단
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000/auth/google/callback';
  } else {
    // 배포 환경 - 실제 도메인으로 설정
    return process.env.GOOGLE_PHOTOS_REDIRECT_URI || 'https://your-domain.com/auth/google/callback';
  }
};

// Google Photos API 액세스 토큰 가져오기
const getAccessToken = async (): Promise<string> => {
  if (!GOOGLE_PHOTOS_CLIENT_ID || !GOOGLE_PHOTOS_CLIENT_SECRET || !GOOGLE_PHOTOS_REFRESH_TOKEN) {
    throw new Error('Google Photos API credentials not configured');
  }

  // Access token 요청 로그 제거
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_PHOTOS_CLIENT_ID,
      client_secret: GOOGLE_PHOTOS_CLIENT_SECRET,
      refresh_token: GOOGLE_PHOTOS_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Access token request failed:', response.status, errorText);
    throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
};

// 이미지를 Google Photos에 업로드
export const uploadToGooglePhotos = async (file: File, fileName: string): Promise<string> => {
  try {
    const accessToken = await getAccessToken();
    
    // 1단계: 업로드 토큰 가져오기
    const uploadTokenResponse = await fetch('https://photoslibrary.googleapis.com/v1/uploads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
        'X-Goog-Upload-Content-Type': file.type,
        'X-Goog-Upload-Protocol': 'raw',
      },
      body: file,
    });

    if (!uploadTokenResponse.ok) {
      throw new Error('Failed to get upload token');
    }

    const uploadToken = await uploadTokenResponse.text();

    // 2단계: 미디어 아이템 생성
    const createMediaItemResponse = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newMediaItems: [{
          description: `Brand asset: ${fileName}`,
          simpleMediaItem: {
            fileName: fileName,
            uploadToken: uploadToken,
          },
        }],
      }),
    });

    if (!createMediaItemResponse.ok) {
      throw new Error('Failed to create media item');
    }

    const mediaItemData = await createMediaItemResponse.json();
    const mediaItemId = mediaItemData.newMediaItemResults[0].mediaItem.id;

    // 3단계: 앨범 생성 및 공유
    const createAlbumResponse = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        album: {
          title: `Brand Assets - ${new Date().toISOString().split('T')[0]}`,
          description: 'Brand logo and favicon storage',
        },
      }),
    });

    if (!createAlbumResponse.ok) {
      throw new Error('Failed to create album');
    }

    const albumData = await createAlbumResponse.json();
    const albumId = albumData.id;

    // 4단계: 미디어 아이템을 앨범에 추가
    await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        albumId: albumId,
        newMediaItems: [{
          description: `Brand asset: ${fileName}`,
          simpleMediaItem: {
            fileName: fileName,
            uploadToken: uploadToken,
          },
        }],
      }),
    });

    // 5단계: 앨범 공유
    const shareAlbumResponse = await fetch(`https://photoslibrary.googleapis.com/v1/albums/${albumId}:share`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sharedAlbumOptions: {
          isCollaborative: false,
          isCommentable: false,
        },
      }),
    });

    if (!shareAlbumResponse.ok) {
      throw new Error('Failed to share album');
    }

    const shareData = await shareAlbumResponse.json();
    return shareData.shareInfo.shareableUrl;

  } catch (error) {
    console.error('Google Photos upload error:', error);
    throw new Error('Failed to upload to Google Photos');
  }
};

// Google Photos에서 이미지 삭제
export const deleteFromGooglePhotos = async (mediaItemId: string): Promise<void> => {
  try {
    const accessToken = await getAccessToken();
    
    await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:batchRemove', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mediaItemIds: [mediaItemId],
      }),
    });
  } catch (error) {
    console.error('Google Photos delete error:', error);
    throw new Error('Failed to delete from Google Photos');
  }
};

// 샘플앨범용 Google Photos 업로드 (앨범 ID 포함)
export const uploadToGooglePhotosForAlbum = async (file: File, fileName: string, albumId: string): Promise<{
  mediaItemId: string;
  originalUrl: string;
  thumbnailUrl: string;
  previewUrl: string;
}> => {
  try {
    const accessToken = await getAccessToken();
    
    // 1단계: 업로드 토큰 가져오기
    const uploadTokenResponse = await fetch('https://photoslibrary.googleapis.com/v1/uploads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
        'X-Goog-Upload-Content-Type': file.type,
        'X-Goog-Upload-Protocol': 'raw',
      },
      body: file,
    });

    if (!uploadTokenResponse.ok) {
      throw new Error('Failed to get upload token');
    }

    const uploadToken = await uploadTokenResponse.text();

    // 2단계: 미디어 아이템 생성 (앨범에 직접 추가)
    const createMediaItemResponse = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        albumId: albumId,
        newMediaItems: [{
          description: `Sample album photo: ${fileName}`,
          simpleMediaItem: {
            fileName: fileName,
            uploadToken: uploadToken,
          },
        }],
      }),
    });

    if (!createMediaItemResponse.ok) {
      throw new Error('Failed to create media item');
    }

    const mediaItemData = await createMediaItemResponse.json();
    const mediaItem = mediaItemData.newMediaItemResults[0].mediaItem;
    const mediaItemId = mediaItem.id;

    // 3단계: 앨범 공유 (이미 공유되어 있지 않은 경우)
    try {
      await fetch(`https://photoslibrary.googleapis.com/v1/albums/${albumId}:share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sharedAlbumOptions: {
            isCollaborative: false,
            isCommentable: false,
          },
        }),
      });
    } catch (shareError) {
      // 이미 공유되어 있는 경우 무시
      console.log('Album already shared or share failed:', shareError);
    }

    // 4단계: 앨범 정보 가져오기 (공유 URL 포함)
    const albumResponse = await fetch(`https://photoslibrary.googleapis.com/v1/albums/${albumId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    let albumShareUrl = '';
    if (albumResponse.ok) {
      const albumData = await albumResponse.json();
      albumShareUrl = albumData.shareInfo?.shareableUrl || '';
    }

    // 5단계: 미디어 아이템 정보 가져오기
    const mediaItemResponse = await fetch(`https://photoslibrary.googleapis.com/v1/mediaItems/${mediaItemId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    let originalUrl = '';
    let thumbnailUrl = '';
    let previewUrl = '';

    if (mediaItemResponse.ok) {
      const mediaItemInfo = await mediaItemResponse.json();
      originalUrl = mediaItemInfo.baseUrl + '=w2048-h2048';
      thumbnailUrl = mediaItemInfo.baseUrl + '=w200-h200-c';
      previewUrl = mediaItemInfo.baseUrl + '=w800-h600-c';
    }

    return {
      mediaItemId,
      originalUrl,
      thumbnailUrl,
      previewUrl
    };

  } catch (error) {
    console.error('Google Photos upload error:', error);
    throw new Error('Failed to upload to Google Photos');
  }
};

// 샘플앨범용 Google Photos 앨범 생성
export const createGooglePhotosAlbum = async (albumTitle: string, albumDescription?: string): Promise<{
  albumId: string;
  shareableUrl: string;
}> => {
  try {
    // 입력값 검증
    if (!albumTitle || albumTitle.trim() === '') {
      throw new Error('Album title is required');
    }
    
    // API 라우트 호출 로그 제거
    
    // 서버 사이드 API 라우트 호출
    const response = await fetch('/api/google-photos/albums', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: albumTitle,
        description: albumDescription,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Photos API route error:', errorData);
      throw new Error(errorData.error || 'Failed to create Google Photos album');
    }

    const data = await response.json();
    
    return {
      albumId: data.albumId,
      shareableUrl: data.shareableUrl
    };

  } catch (error) {
    console.error('Google Photos album creation error:', error);
    throw new Error('Failed to create Google Photos album');
  }
};

// 샘플앨범용 Google Photos 앨범 삭제
export const deleteGooglePhotosAlbum = async (albumId: string): Promise<void> => {
  try {
    const accessToken = await getAccessToken();
    
    // 앨범 내의 모든 미디어 아이템 삭제
    const mediaItemsResponse = await fetch(`https://photoslibrary.googleapis.com/v1/mediaItems:search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        albumId: albumId,
        pageSize: 100,
      }),
    });

    if (mediaItemsResponse.ok) {
      const mediaItemsData = await mediaItemsResponse.json();
      if (mediaItemsData.mediaItems && mediaItemsData.mediaItems.length > 0) {
        const mediaItemIds = mediaItemsData.mediaItems.map((item: any) => item.id);
        
        await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:batchRemove', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mediaItemIds: mediaItemIds,
          }),
        });
      }
    }

    // 앨범 삭제 (Google Photos API는 앨범 삭제를 직접 지원하지 않으므로 공유 해제만 가능)
    // 실제로는 앨범을 비공개로 만들거나 다른 방법을 사용해야 함
    console.log('Google Photos album deletion: Albums cannot be directly deleted via API');

  } catch (error) {
    console.error('Google Photos album deletion error:', error);
    throw new Error('Failed to delete Google Photos album');
  }
};

// 기존 Google Photos 앨범 목록 가져오기
export const getGooglePhotosAlbums = async (): Promise<{
  id: string;
  title: string;
  description?: string;
  mediaItemsCount: string;
  coverPhotoBaseUrl?: string;
  shareInfo?: {
    shareableUrl?: string;
  };
}[]> => {
  try {
    const accessToken = await getAccessToken();
    console.log('Access token obtained:', accessToken ? 'Success' : 'Failed');
    
    const response = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    console.log('Google Photos API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Photos API error response:', errorText);
      throw new Error(`Failed to fetch albums: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Google Photos albums data:', data);
    return data.albums || [];

  } catch (error) {
    console.error('Google Photos albums fetch error:', error);
    
    // 구체적인 오류 메시지 제공
    if (error instanceof Error) {
      if (error.message.includes('403')) {
        throw new Error('Google Photos API 권한이 부족합니다. OAuth 스코프를 확인해주세요.');
      } else if (error.message.includes('401')) {
        throw new Error('Google Photos API 인증이 실패했습니다. Refresh Token을 확인해주세요.');
      } else {
        throw new Error(`Google Photos 앨범 가져오기 실패: ${error.message}`);
      }
    }
    
    throw new Error('Google Photos 앨범 가져오기 중 알 수 없는 오류가 발생했습니다.');
  }
};

// 특정 Google Photos 앨범의 사진 목록 가져오기
export const getGooglePhotosAlbumPhotos = async (albumId: string): Promise<{
  id: string;
  filename: string;
  baseUrl: string;
  mediaMetadata: {
    width: string;
    height: string;
    creationTime: string;
  };
}[]> => {
  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        albumId: albumId,
        pageSize: 100,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch album photos');
    }

    const data = await response.json();
    return data.mediaItems || [];

  } catch (error) {
    console.error('Google Photos album photos fetch error:', error);
    throw new Error('Failed to fetch Google Photos album photos');
  }
};

// 기존 Google Photos 앨범을 앱에 가져오기
export const importGooglePhotosAlbum = async (
  googlePhotosAlbumId: string, 
  albumTitle: string, 
  albumDescription?: string
): Promise<{
  albumId: string;
  importedPhotosCount: number;
}> => {
  try {
    const accessToken = await getAccessToken();
    
    // 1. Google Photos 앨범 정보 가져오기
    const albumResponse = await fetch(`https://photoslibrary.googleapis.com/v1/albums/${googlePhotosAlbumId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!albumResponse.ok) {
      throw new Error('Failed to fetch album info');
    }

    const albumData = await albumResponse.json();
    
    // 2. 앨범의 사진 목록 가져오기
    const photosResponse = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        albumId: googlePhotosAlbumId,
        pageSize: 100,
      }),
    });

    if (!photosResponse.ok) {
      throw new Error('Failed to fetch album photos');
    }

    const photosData = await photosResponse.json();
    const photos = photosData.mediaItems || [];

    // 3. Firestore에 앨범 생성
    const { db } = await import('@/lib/firebase');
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    const { useAuth } = await import('@/hooks/use-auth');
    
    const albumsRef = collection(db, 'albums');
    const albumDoc = await addDoc(albumsRef, {
      title: albumTitle || albumData.title,
      description: albumDescription || albumData.description || '',
      category: 'other', // 기본값
      photoCount: photos.length,
      isPublic: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: 'imported', // 실제 사용자 ID로 변경 필요
      googlePhotosAlbumId: googlePhotosAlbumId,
      googlePhotosShareUrl: albumData.shareInfo?.shareableUrl || '',
    });

    // 4. 각 사진을 Firestore에 저장
    const photosRef = collection(db, 'albums', albumDoc.id, 'photos');
    const photoPromises = photos.map(async (photo: any, index: number) => {
      const originalUrl = photo.baseUrl + '=w2048-h2048';
      const thumbnailUrl = photo.baseUrl + '=w200-h200-c';
      const previewUrl = photo.baseUrl + '=w800-h600-c';

      return addDoc(photosRef, {
        filename: photo.filename,
        originalUrl,
        thumbnailUrl,
        previewUrl,
        order: index + 1,
        size: 0, // Google Photos에서는 파일 크기를 직접 제공하지 않음
        width: parseInt(photo.mediaMetadata.width),
        height: parseInt(photo.mediaMetadata.height),
        uploadedAt: serverTimestamp(),
        uploadedBy: 'imported', // 실제 사용자 ID로 변경 필요
        mediaItemId: photo.id,
        storageType: 'google-photos',
      });
    });

    await Promise.all(photoPromises);

    return {
      albumId: albumDoc.id,
      importedPhotosCount: photos.length,
    };

  } catch (error) {
    console.error('Google Photos album import error:', error);
    throw new Error('Failed to import Google Photos album');
  }
};
