import { NextRequest, NextResponse } from 'next/server';

// Google Photos API 환경 변수 (서버 사이드에서만 접근)
const GOOGLE_PHOTOS_CLIENT_ID = process.env.GOOGLE_PHOTOS_CLIENT_ID;
const GOOGLE_PHOTOS_CLIENT_SECRET = process.env.GOOGLE_PHOTOS_CLIENT_SECRET;
const GOOGLE_PHOTOS_REFRESH_TOKEN = process.env.GOOGLE_PHOTOS_REFRESH_TOKEN;

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

// Google Photos 앨범 생성
export async function POST(request: NextRequest) {
  try {
    const { title, description } = await request.json();

    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: 'Album title is required' },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();
    
    // 1단계: 앨범 생성
    
    const cleanTitle = title.trim();
    
    const albumRequestBody = {
      album: {
        title: cleanTitle,
      },
    };
    
    // Album request body 로그 제거
    
    const createAlbumResponse = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(albumRequestBody),
    });

    if (!createAlbumResponse.ok) {
      const errorText = await createAlbumResponse.text();
      console.error('Google Photos album creation error response:', createAlbumResponse.status, errorText);
      return NextResponse.json(
        { error: `Failed to create album: ${createAlbumResponse.status} ${createAlbumResponse.statusText}` },
        { status: createAlbumResponse.status }
      );
    }

    const albumData = await createAlbumResponse.json();
    const albumId = albumData.id;

    // 2단계: 앨범 공유
    
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

    let shareableUrl = '';
    if (shareAlbumResponse.ok) {
      const shareData = await shareAlbumResponse.json();
      shareableUrl = shareData.shareInfo?.shareableUrl || '';
      // Album shared successfully 로그 제거
    } else {
      const errorText = await shareAlbumResponse.text();
      console.error('Google Photos album sharing error response:', shareAlbumResponse.status, errorText);
      // Album sharing failed 로그 제거
    }

    return NextResponse.json({
      albumId,
      shareableUrl,
      title: cleanTitle,
      description: description || ''
    });

  } catch (error) {
    console.error('Google Photos album creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create Google Photos album' },
      { status: 500 }
    );
  }
}
