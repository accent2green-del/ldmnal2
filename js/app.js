/**
 * 메인 애플리케이션 스크립트
 * 앱 초기화, 이벤트 조정, 전역 상태 관리
 */

class Application {
    constructor() {
        this.initialized = false;
        this.modules = {};
        this.globalState = {
            isLoading: false,
            currentView: 'home',
            sidebarCollapsed: false,
            darkMode: false
        };
        
        Logger.info('🚀 애플리케이션 초기화 시작');
        
        // DOM 로드 후 초기화
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }
    
    /**
     * 애플리케이션 초기화
     */
    async initialize() {
        try {
            Logger.info('🔧 애플리케이션 초기화 중...');
            
            // 로딩 표시
            this.showGlobalLoading('애플리케이션 로딩 중...');
            
            // 모듈 참조 저장
            this.modules = {
                dataManager: window.dataManager,
                navigationManager: window.navigationManager,
                contentRenderer: window.contentRenderer,
                adminManager: window.adminManager,
                searchManager: window.searchManager
            };
            
            // 모듈 검증
            this.validateModules();
            
            // 전역 이벤트 리스너 설정
            this.bindGlobalEvents();
            
            // UI 초기화
            this.initializeUI();
            
            // 데이터 매니저 초기화
            await this.modules.dataManager.initialize();
            
            // 사용자 설정 복원
            this.restoreUserPreferences();
            
            // 로딩 숨김
            this.hideGlobalLoading();
            
            this.initialized = true;
            
            Logger.info('✅ 애플리케이션 초기화 완료');
            
            // 초기화 완료 이벤트 발생
            EventEmitter.emit('app:initialized');
            
            // 헬스 체크 실행
            this.performHealthCheck();
            
        } catch (error) {
            Logger.error('❌ 애플리케이션 초기화 실패:', error);
            this.handleInitializationError(error);
        }
    }
    
    /**
     * 모듈 검증
     */
    validateModules() {
        const requiredModules = ['dataManager', 'navigationManager', 'contentRenderer', 'adminManager', 'searchManager'];
        const missingModules = requiredModules.filter(module => !this.modules[module]);
        
        if (missingModules.length > 0) {
            throw new Error(`필수 모듈이 없습니다: ${missingModules.join(', ')}`);
        }
        
        Logger.info('✅ 모든 필수 모듈 확인 완료');
    }
    
    /**
     * 전역 이벤트 리스너 설정
     */
    bindGlobalEvents() {
        // 윈도우 이벤트
        window.addEventListener('error', this.handleGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
        
        // 키보드 단축키
        document.addEventListener('keydown', this.handleGlobalKeyboard.bind(this));
        
        // 앱 수준 이벤트
        EventEmitter.on('app:loading:show', (message) => this.showGlobalLoading(message));
        EventEmitter.on('app:loading:hide', () => this.hideGlobalLoading());
        EventEmitter.on('app:notification', (data) => this.showNotification(data));
        EventEmitter.on('app:error', (error) => this.handleAppError(error));
        
        Logger.info('🔗 전역 이벤트 리스너 설정 완료');
    }
    
    /**
     * UI 초기화
     */
    initializeUI() {
        // 다크모드 설정 복원
        this.initializeDarkMode();
        
        // 반응형 처리
        this.initializeResponsive();
        
        // 접근성 개선
        this.initializeAccessibility();
        
        Logger.info('🎨 UI 초기화 완료');
    }
    
    /**
     * 다크모드 초기화
     */
    initializeDarkMode() {
        const savedDarkMode = Utils.getFromStorage('dark_mode');
        const systemDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        this.globalState.darkMode = savedDarkMode !== null ? savedDarkMode : systemDarkMode;
        
        if (this.globalState.darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
        
        // 시스템 다크모드 변경 감지
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (Utils.getFromStorage('dark_mode') === null) {
                    this.toggleDarkMode(e.matches);
                }
            });
        }
    }
    
    /**
     * 반응형 초기화
     */
    initializeResponsive() {
        // 모바일 뷰포트 메타 태그 확인
        let viewportMeta = document.querySelector('meta[name="viewport"]');
        if (!viewportMeta) {
            viewportMeta = document.createElement('meta');
            viewportMeta.name = 'viewport';
            viewportMeta.content = 'width=device-width, initial-scale=1.0';
            document.head.appendChild(viewportMeta);
        }
        
        // 터치 이벤트 지원
        if ('ontouchstart' in window) {
            document.body.classList.add('touch-device');
        }
        
        // 화면 방향 변경 처리
        window.addEventListener('orientationchange', Utils.debounce(() => {
            EventEmitter.emit('app:orientation-change');
        }, 100));
    }
    
    /**
     * 접근성 초기화
     */
    initializeAccessibility() {
        // 포커스 트랩 설정
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                this.handleFocusTrap(e);
            }
        });
        
        // 스크린 리더 지원
        this.setupAriaLabels();
        
        // 키보드 네비게이션 개선
        this.improveKeyboardNavigation();
    }
    
    /**
     * ARIA 레이블 설정
     */
    setupAriaLabels() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.setAttribute('role', 'navigation');
            sidebar.setAttribute('aria-label', '메인 네비게이션');
        }
        
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.setAttribute('role', 'main');
            mainContent.setAttribute('aria-label', '주요 콘텐츠');
        }
        
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.setAttribute('aria-label', '검색 (단축키: Ctrl+K)');
        }
    }
    
    /**
     * 키보드 네비게이션 개선
     */
    improveKeyboardNavigation() {
        // Skip to main content 링크 추가
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = '메인 콘텐츠로 건너뛰기';
        skipLink.className = 'skip-link';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: var(--primary-color);
            color: white;
            padding: 8px;
            text-decoration: none;
            z-index: 9999;
            border-radius: 4px;
            transition: top 0.3s;
        `;
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
    }
    
    /**
     * 포커스 트랩 처리
     */
    handleFocusTrap(e) {
        const modal = document.querySelector('.modal.show');
        if (!modal) return;
        
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                lastFocusable.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                firstFocusable.focus();
                e.preventDefault();
            }
        }
    }
    
    /**
     * 전역 키보드 이벤트 처리
     */
    handleGlobalKeyboard(e) {
        // 관리자 모드 토글 (Alt + A)
        if (e.altKey && e.key === 'a') {
            e.preventDefault();
            const adminBtn = document.getElementById('admin-btn');
            if (adminBtn) adminBtn.click();
        }
        
        // 사이드바 토글 (Alt + S)
        if (e.altKey && e.key === 's') {
            e.preventDefault();
            const sidebarToggle = document.getElementById('sidebar-toggle');
            if (sidebarToggle) sidebarToggle.click();
        }
        
        // 홈으로 이동 (Alt + H)
        if (e.altKey && e.key === 'h') {
            e.preventDefault();
            EventEmitter.emit('navigation:itemSelected', { type: 'home', id: null });
        }
        
        // ESC 키로 모달 닫기
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                const closeBtn = openModal.querySelector('.modal-close');
                if (closeBtn) closeBtn.click();
            }
        }
    }
    
    /**
     * 사용자 설정 복원
     */
    restoreUserPreferences() {
        const preferences = Utils.getFromStorage(AppConfig.STORAGE_KEYS.USER_PREFERENCES, {});
        
        // 사이드바 상태 복원
        if (preferences.sidebarCollapsed) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.add('collapsed');
                this.globalState.sidebarCollapsed = true;
            }
        }
        
        Logger.info('🔄 사용자 설정 복원 완료', preferences);
    }
    
    /**
     * 사용자 설정 저장
     */
    saveUserPreferences() {
        const preferences = {
            sidebarCollapsed: this.globalState.sidebarCollapsed,
            darkMode: this.globalState.darkMode,
            version: '1.0',
            timestamp: new Date().toISOString()
        };
        
        Utils.setToStorage(AppConfig.STORAGE_KEYS.USER_PREFERENCES, preferences);
    }
    
    /**
     * 헬스 체크 실행
     */
    performHealthCheck() {
        const checks = {
            localStorage: this.checkLocalStorage(),
            modules: this.checkModules(),
            data: this.checkDataIntegrity(),
            performance: this.checkPerformance()
        };
        
        const overallHealth = Object.values(checks).every(check => check.status === 'ok');
        
        Logger.info('🏥 헬스 체크 결과:', { overall: overallHealth ? 'healthy' : 'issues', details: checks });
        
        if (!overallHealth) {
            this.handleHealthIssues(checks);
        }
        
        // 콘솔에 헬스 체크 결과 출력 (디버깅용)
        console.log('🏥 Health Check:', checks);
    }
    
    /**
     * 로컬스토리지 체크
     */
    checkLocalStorage() {
        try {
            const testKey = 'health_check_test';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return { status: 'ok', message: 'LocalStorage available' };
        } catch (error) {
            return { status: 'error', message: 'LocalStorage not available', error };
        }
    }
    
    /**
     * 모듈 상태 체크
     */
    checkModules() {
        const moduleStatus = {};
        
        for (const [name, module] of Object.entries(this.modules)) {
            moduleStatus[name] = module && typeof module === 'object' ? 'ok' : 'error';
        }
        
        const allOk = Object.values(moduleStatus).every(status => status === 'ok');
        
        return {
            status: allOk ? 'ok' : 'error',
            message: allOk ? 'All modules loaded' : 'Some modules missing',
            details: moduleStatus
        };
    }
    
    /**
     * 데이터 무결성 체크
     */
    checkDataIntegrity() {
        try {
            const data = this.modules.dataManager.getAllData();
            const summary = this.modules.dataManager.getDataSummary();
            
            // 기본 구조 검증
            const hasRequiredStructure = data.departments && data.categories && data.processes;
            
            // 참조 무결성 검증
            let referenceIntegrity = true;
            data.categories.forEach(cat => {
                if (!data.departments.find(dept => dept.id === cat.departmentId)) {
                    referenceIntegrity = false;
                }
            });
            
            data.processes.forEach(proc => {
                if (!data.categories.find(cat => cat.id === proc.categoryId) ||
                    !data.departments.find(dept => dept.id === proc.departmentId)) {
                    referenceIntegrity = false;
                }
            });
            
            return {
                status: hasRequiredStructure && referenceIntegrity ? 'ok' : 'warning',
                message: hasRequiredStructure && referenceIntegrity ? 
                    'Data integrity good' : 'Data integrity issues detected',
                summary
            };
            
        } catch (error) {
            return { status: 'error', message: 'Data check failed', error };
        }
    }
    
    /**
     * 성능 체크
     */
    checkPerformance() {
        const memory = performance.memory;
        const navigation = performance.getEntriesByType('navigation')[0];
        
        const checks = {
            memoryUsage: memory ? memory.usedJSHeapSize / memory.jsHeapSizeLimit : 0,
            loadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
            domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 0
        };
        
        const performanceIssues = 
            checks.memoryUsage > 0.8 || 
            checks.loadTime > 5000 || 
            checks.domContentLoaded > 2000;
        
        return {
            status: performanceIssues ? 'warning' : 'ok',
            message: performanceIssues ? 'Performance issues detected' : 'Performance good',
            metrics: checks
        };
    }
    
    /**
     * 헬스 체크 이슈 처리
     */
    handleHealthIssues(checks) {
        const issues = Object.entries(checks)
            .filter(([_, check]) => check.status !== 'ok')
            .map(([name, check]) => `${name}: ${check.message}`)
            .join('\n');
        
        Logger.warn('⚠️ 헬스 체크에서 이슈 발견:', issues);
        
        // 심각한 이슈인 경우 사용자에게 알림
        if (checks.modules.status === 'error' || checks.localStorage.status === 'error') {
            setTimeout(() => {
                Utils.showNotification(
                    '일부 기능에 문제가 있을 수 있습니다. 페이지를 새로고침해보세요.',
                    'warning'
                );
            }, 2000);
        }
    }
    
    /**
     * 전역 에러 처리
     */
    handleGlobalError(event) {
        Logger.error('🚨 전역 오류 발생:', event.error);
        
        // 사용자에게 친화적인 오류 메시지
        if (!this.globalState.isLoading) {
            Utils.showNotification('예기치 못한 오류가 발생했습니다.', 'error');
        }
        
        // 오류 리포팅 (향후 확장용)
        this.reportError(event.error);
    }
    
    /**
     * Promise rejection 처리
     */
    handleUnhandledRejection(event) {
        Logger.error('🚨 처리되지 않은 Promise 거부:', event.reason);
        event.preventDefault(); // 콘솔 오류 방지
        
        this.reportError(event.reason);
    }
    
    /**
     * 페이지 언로드 전 처리
     */
    handleBeforeUnload(event) {
        // 사용자 설정 저장
        this.saveUserPreferences();
        
        // 관리자가 편집 중인 경우 확인
        if (this.modules.adminManager.currentEditItem) {
            event.preventDefault();
            event.returnValue = '편집 중인 내용이 있습니다. 정말 나가시겠습니까?';
            return event.returnValue;
        }
    }
    
    /**
     * 온라인 상태 처리
     */
    handleOnline() {
        Logger.info('🌐 온라인 상태로 변경');
        Utils.showNotification('인터넷 연결이 복원되었습니다.', 'success');
    }
    
    /**
     * 오프라인 상태 처리
     */
    handleOffline() {
        Logger.warn('📡 오프라인 상태로 변경');
        Utils.showNotification('인터넷 연결이 끊어졌습니다. 일부 기능이 제한될 수 있습니다.', 'warning');
    }
    
    /**
     * 초기화 오류 처리
     */
    handleInitializationError(error) {
        this.hideGlobalLoading();
        
        const errorMessage = `
            <div class="initialization-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>애플리케이션 초기화 실패</h2>
                <p>애플리케이션을 시작하는 중 오류가 발생했습니다.</p>
                <details>
                    <summary>오류 세부 정보</summary>
                    <pre>${error.message}</pre>
                </details>
                <button onclick="location.reload()" class="btn-primary">
                    <i class="fas fa-redo"></i> 다시 시도
                </button>
            </div>
        `;
        
        const contentBody = document.getElementById('content-body');
        if (contentBody) {
            contentBody.innerHTML = errorMessage;
        }
    }
    
    /**
     * 앱 에러 처리
     */
    handleAppError(error) {
        Logger.error('🚨 앱 레벨 오류:', error);
        Utils.showNotification('오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
    }
    
    /**
     * 전역 로딩 표시
     */
    showGlobalLoading(message = AppConfig.MESSAGES.LOADING) {
        this.globalState.isLoading = true;
        
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            const messageElement = loadingOverlay.querySelector('p');
            if (messageElement) {
                messageElement.textContent = message;
            }
            loadingOverlay.classList.add('show');
        }
    }
    
    /**
     * 전역 로딩 숨김
     */
    hideGlobalLoading() {
        this.globalState.isLoading = false;
        
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('show');
        }
    }
    
    /**
     * 다크모드 토글
     */
    toggleDarkMode(force = null) {
        this.globalState.darkMode = force !== null ? force : !this.globalState.darkMode;
        
        if (this.globalState.darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        
        Utils.setToStorage('dark_mode', this.globalState.darkMode);
        Logger.info(`🌙 다크모드 ${this.globalState.darkMode ? '활성화' : '비활성화'}`);
    }
    
    /**
     * 알림 표시
     */
    showNotification(data) {
        const { message, type = 'info' } = data;
        Utils.showNotification(message, type);
    }
    
    /**
     * 오류 리포팅 (향후 확장용)
     */
    reportError(error) {
        // 향후 오류 리포팅 서비스 연동
        const errorReport = {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            userId: 'anonymous' // 향후 사용자 식별용
        };
        
        // 로컬에 오류 로그 저장 (개발 목적)
        const errorLogs = Utils.getFromStorage('error_logs', []);
        errorLogs.push(errorReport);
        
        // 최대 50개까지만 보관
        if (errorLogs.length > 50) {
            errorLogs.splice(0, errorLogs.length - 50);
        }
        
        Utils.setToStorage('error_logs', errorLogs);
    }
    
    /**
     * 앱 상태 반환
     */
    getAppState() {
        return {
            ...this.globalState,
            initialized: this.initialized,
            version: '1.0.0',
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * 개발자 도구 (콘솔 명령용)
     */
    getDevTools() {
        return {
            app: this,
            modules: this.modules,
            config: AppConfig,
            utils: Utils,
            logger: Logger,
            eventEmitter: EventEmitter,
            
            // 유틸리티 함수들
            exportData: () => this.modules.dataManager.exportData(),
            clearStorage: () => {
                localStorage.clear();
                location.reload();
            },
            toggleDebugMode: () => {
                Logger.debug('디버그 모드 토글');
                console.log('Current state:', this.getAppState());
            },
            healthCheck: () => this.performHealthCheck()
        };
    }
}

// 초기화 오류 스타일
const initErrorStyles = `
    .initialization-error {
        text-align: center;
        padding: 3rem;
        max-width: 600px;
        margin: 2rem auto;
    }
    
    .initialization-error i {
        font-size: 4rem;
        color: var(--error-color);
        margin-bottom: 1rem;
        display: block;
    }
    
    .initialization-error h2 {
        font-size: var(--font-size-2xl);
        color: var(--text-primary);
        margin-bottom: 1rem;
    }
    
    .initialization-error details {
        margin: 1rem 0;
        text-align: left;
        background: var(--surface-color);
        padding: 1rem;
        border-radius: var(--border-radius);
        border: 1px solid var(--border-color);
    }
    
    .initialization-error pre {
        background: var(--background-color);
        padding: 0.5rem;
        border-radius: 4px;
        font-size: 0.875rem;
        overflow-x: auto;
        color: var(--error-color);
    }
`;

const initErrorStyleSheet = document.createElement('style');
initErrorStyleSheet.textContent = initErrorStyles;
document.head.appendChild(initErrorStyleSheet);

// 전역 애플리케이션 인스턴스 생성
window.app = new Application();

// 개발자 콘솔에서 사용할 수 있도록 전역 변수 설정
window.dev = window.app.getDevTools();

// 애플리케이션 정보 콘솔 출력
console.log('%c(PYM)도로관리 행정매뉴얼', 'color: #2563eb; font-size: 24px; font-weight: bold;');
console.log('%c개발자 도구가 활성화되었습니다. window.dev 객체를 사용하여 디버깅할 수 있습니다.', 'color: #64748b; font-size: 14px;');
console.log('%c버전: 1.0.0 | 빌드: ' + new Date().toISOString(), 'color: #94a3b8; font-size: 12px;');