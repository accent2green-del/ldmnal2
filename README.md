# (PYM)도로관리 행정매뉴얼

도로관리 업무를 위한 체계적인 행정매뉴얼 웹 애플리케이션입니다.

## 🚀 주요 기능

### 📱 사용자 기능
- **트리 구조 네비게이션**: 부서 > 카테고리 > 프로세스 계층 구조로 체계적인 정보 접근
- **반응형 디자인**: 데스크톱, 태블릿, 모바일 모든 기기에서 최적화된 사용자 경험
- **전체 텍스트 검색**: 모든 매뉴얼 내용에 대한 빠르고 정확한 검색 기능
- **실시간 검색**: 입력 중 실시간으로 결과 표시
- **검색 히스토리**: 최근 검색어 기록 및 빠른 재검색
- **프로세스 상세보기**: 단계별 상세 업무 절차 안내
- **프린트 기능**: 매뉴얼 내용 인쇄 최적화
- **데이터 내보내기**: JSON 형태로 개별 프로세스 내보내기

### 🛠️ 관리자 기능
- **보안 로그인**: 비밀번호 기반 관리자 인증 (비밀번호: `spt2019!`)
- **부서 관리**: 부서 추가, 수정, 삭제 및 순서 관리
- **카테고리 관리**: 부서별 카테고리 구성 및 관리
- **프로세스 관리**: 업무 프로세스 CRUD 작업
- **단계별 편집**: 프로세스 내 세부 단계 추가/편집/삭제
- **데이터 내보내기**: 전체 데이터 JSON 백업
- **데이터 가져오기**: JSON 파일을 통한 데이터 복원
- **실시간 통계**: 부서, 카테고리, 프로세스 현황 대시보드

## 🏗️ 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **CSS Framework**: Custom CSS with CSS Variables
- **Icons**: Font Awesome 6
- **Data Storage**: LocalStorage + JSON Files
- **Architecture**: 모듈형 설계 (MVC 패턴)

## 📁 프로젝트 구조

```
webapp/
├── index.html              # 메인 HTML 파일
├── css/
│   └── styles.css          # 메인 스타일시트
├── js/
│   ├── config.js           # 애플리케이션 설정
│   ├── data-manager.js     # 데이터 관리 모듈
│   ├── navigation.js       # 네비게이션 관리
│   ├── content-renderer.js # 콘텐츠 렌더링
│   ├── admin.js            # 관리자 기능
│   ├── search.js           # 검색 기능
│   └── app.js              # 메인 애플리케이션
├── data/
│   └── manual-data.json    # 기본 데이터
└── images/
    └── (아이콘 및 이미지)
```

## 🚀 시작하기

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd webapp
```

### 2. 로컬 서버 실행

#### Python 사용 (권장)
```bash
# Python 3
python -m http.server 8000

# 또는 Python 2
python -m SimpleHTTPServer 8000
```

#### Node.js 사용
```bash
# http-server 설치
npm install -g http-server

# 서버 실행
http-server -p 8000
```

#### PHP 사용
```bash
php -S localhost:8000
```

### 3. 브라우저 접속
```
http://localhost:8000
```

## 👤 관리자 기능 사용법

### 로그인
1. 우상단 "관리자" 버튼 클릭
2. 비밀번호 입력: `spt2019!`
3. 로그인 완료

### 데이터 관리
1. **부서 관리**: 부서 추가, 수정, 삭제
2. **카테고리 관리**: 부서별 카테고리 구성
3. **프로세스 관리**: 상세 업무 프로세스 편집

### 데이터 백업/복원
- **백업**: "데이터 내보내기" 버튼으로 JSON 파일 다운로드
- **복원**: "데이터 가져오기"로 JSON 파일 업로드

## ⌨️ 키보드 단축키

- `Ctrl/Cmd + K`: 검색 모달 열기
- `Alt + A`: 관리자 패널 토글
- `Alt + S`: 사이드바 토글
- `Alt + H`: 홈으로 이동
- `Esc`: 열린 모달 닫기

## 📱 반응형 지원

- **데스크톱**: 1200px 이상 - 완전한 기능
- **태블릿**: 768px - 1199px - 적응형 레이아웃  
- **모바일**: 768px 미만 - 모바일 최적화

## 🔧 설정

### 관리자 비밀번호 변경
`js/config.js` 파일에서 `ADMIN_PASSWORD` 값을 변경하세요.

```javascript
window.AppConfig = {
    ADMIN_PASSWORD: 'your_new_password',
    // ... 기타 설정
};
```

### 로컬스토리지 키 설정
필요시 `js/config.js`에서 스토리지 키들을 변경할 수 있습니다.

## 🌐 브라우저 호환성

- **Chrome**: 90+ ✅
- **Firefox**: 88+ ✅  
- **Safari**: 14+ ✅
- **Edge**: 90+ ✅

## 📊 데이터 구조

### 부서 (Department)
```json
{
  "id": "dept_001",
  "name": "부서명",
  "description": "부서 설명",
  "order": 1,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 카테고리 (Category)
```json
{
  "id": "cat_001",
  "name": "카테고리명",
  "departmentId": "dept_001",
  "description": "카테고리 설명",
  "order": 1,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 프로세스 (Process)
```json
{
  "id": "proc_001",
  "title": "프로세스명",
  "description": "프로세스 설명",
  "categoryId": "cat_001",
  "departmentId": "dept_001",
  "steps": [
    {
      "stepNumber": 1,
      "title": "단계명",
      "description": "단계 설명",
      "details": "세부사항"
    }
  ],
  "tags": ["태그1", "태그2"],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "order": 1
}
```

## 🔍 검색 기능

### 검색 범위
- 프로세스 제목 및 설명
- 단계별 내용
- 태그
- 카테고리명 및 설명

### 검색 옵션
- **실시간 검색**: 2자 이상 입력 시 자동 검색
- **키보드 네비게이션**: 화살표 키로 결과 탐색
- **검색 히스토리**: 최근 검색어 자동 저장

## 🛡️ 보안

### 클라이언트 사이드 보안
- XSS 방지를 위한 HTML 이스케이프 처리
- 입력값 검증 및 sanitization
- 안전한 DOM 조작

### 데이터 보안
- 관리자 비밀번호 기반 인증
- 세션 토큰 관리 (24시간 자동 만료)
- 로컬스토리지 암호화 (향후 구현 예정)

## 🐛 문제 해결

### 일반적인 문제
1. **데이터가 로드되지 않음**: 브라우저 새로고침 시도
2. **검색이 작동하지 않음**: 로컬스토리지 초기화 (`localStorage.clear()`)
3. **관리자 로그인 실패**: 비밀번호 `spt2019!` 확인

### 개발자 도구
브라우저 콘솔에서 `window.dev` 객체를 사용하여 디버깅:

```javascript
// 앱 상태 확인
window.dev.app.getAppState()

// 헬스 체크
window.dev.healthCheck()

// 데이터 내보내기
window.dev.exportData()

// 로컬스토리지 초기화
window.dev.clearStorage()
```

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 있습니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 지원

문제가 있거나 제안사항이 있으시면 이슈를 생성해 주세요.

---

**버전**: 1.0.0  
**최종 업데이트**: 2024년 9월 16일  
**개발자**: Claude AI Assistant