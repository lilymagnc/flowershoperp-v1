# Google Photos API 설정 가이드

## 1. Google Cloud Console에서 프로젝트 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **Google Photos Library API 활성화**:
   - "API 및 서비스" > "라이브러리"로 이동
   - "Google Photos Library API" 검색 후 활성화

## 2. OAuth 2.0 클라이언트 ID 생성

1. "API 및 서비스" > "사용자 인증 정보"로 이동
2. "사용자 인증 정보 만들기" > "OAuth 2.0 클라이언트 ID" 선택
3. 애플리케이션 유형: "웹 애플리케이션" 선택
4. 승인된 리디렉션 URI 추가:
   - 개발 환경: `http://localhost:3000/auth/google/callback`
   - 프로덕션 환경: `https://your-domain.com/auth/google/callback`

## 3. OAuth 동의 화면 설정

1. "OAuth 동의 화면" 탭으로 이동
2. 사용자 유형: "외부" 선택
3. **범위 추가**:
   - "범위 추가 또는 삭제" 클릭
   - 다음 스코프들을 추가:
     - `https://www.googleapis.com/auth/photoslibrary.readonly`
     - `https://www.googleapis.com/auth/photoslibrary.appendonly`
     - `https://www.googleapis.com/auth/photoslibrary`

## 4. 필요한 스코프 설정

Google Photos API를 사용하려면 다음 스코프가 필요합니다:

```
https://www.googleapis.com/auth/photoslibrary.readonly
https://www.googleapis.com/auth/photoslibrary.appendonly
https://www.googleapis.com/auth/photoslibrary
```

## 5. 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 추가:

```env
GOOGLE_PHOTOS_CLIENT_ID=your-client-id
GOOGLE_PHOTOS_CLIENT_SECRET=your-client-secret
GOOGLE_PHOTOS_REFRESH_TOKEN=your-refresh-token
```

## 6. Refresh Token 획득 (중요!)

### 6.1. 브라우저에서 OAuth 인증 URL 접속

다음 URL을 브라우저에서 열고 CLIENT_ID를 실제 값으로 교체:

```
https://accounts.google.com/o/oauth2/v2/auth?
client_id=YOUR_CLIENT_ID&
redirect_uri=http://localhost:3000/auth/google/callback&
scope=https://www.googleapis.com/auth/photoslibrary.readonly https://www.googleapis.com/auth/photoslibrary.appendonly&
response_type=code&
access_type=offline&
prompt=consent
```

**중요**: `prompt=consent` 파라미터를 추가하여 매번 새로운 refresh token을 받도록 합니다.

### 6.2. 권한 승인

1. Google 계정으로 로그인
2. "Google Photos Library API" 권한 승인
3. 리디렉션된 URL에서 `code` 파라미터 추출

### 6.3. Refresh Token 획득

다음 curl 명령으로 refresh token 획득:

```bash
curl -X POST https://oauth2.googleapis.com/token \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "code=AUTHORIZATION_CODE" \
  -d "grant_type=authorization_code" \
  -d "redirect_uri=http://localhost:3000/auth/google/callback"
```

응답에서 `refresh_token` 값을 복사하여 환경 변수에 설정합니다.

## 7. 문제 해결

### "insufficient authentication scopes" 오류

**증상**: 403 Forbidden 오류와 함께 "Request had insufficient authentication scopes" 메시지

**해결 방법**:
1. **OAuth 동의 화면에서 스코프 확인**:
   - Google Cloud Console > "OAuth 동의 화면" > "범위" 섹션
   - Google Photos API 관련 스코프가 추가되어 있는지 확인

2. **새로운 refresh token 생성**:
   - 기존 refresh token은 올바른 스코프가 없을 수 있음
   - 위의 6단계를 따라 새로운 refresh token 생성
   - `prompt=consent` 파라미터 사용 필수

3. **환경 변수 업데이트**:
   - 새로운 refresh token으로 `.env.local` 파일 업데이트
   - 개발 서버 재시작

### 403 Forbidden 오류

**해결 방법**:
1. Google Photos Library API가 활성화되었는지 확인
2. OAuth 동의 화면에서 Google Photos API 권한이 추가되었는지 확인
3. 올바른 스코프로 refresh token을 생성했는지 확인

### 401 Unauthorized 오류

**해결 방법**:
1. Client ID와 Client Secret이 올바른지 확인
2. Refresh token이 유효한지 확인
3. 환경 변수가 올바르게 설정되었는지 확인

## 8. 테스트

설정 완료 후 다음을 확인:

1. 개발 서버 재시작
2. Google Photos 가져오기 버튼 클릭
3. 앨범 목록이 정상적으로 로드되는지 확인

## 9. 주의사항

- Refresh token은 민감한 정보이므로 `.env.local` 파일에만 저장
- `.env.local` 파일을 Git에 커밋하지 않도록 주의
- 프로덕션 환경에서는 환경 변수로 설정