/**
 * 애플리케이션 설정 파일
 */

// 전역 설정
window.AppConfig = {
    // 관리자 설정
    ADMIN_PASSWORD: 'spt2019!',
    
    // 로컬 스토리지 키
    STORAGE_KEYS: {
        MANUAL_DATA: 'koreanRoadManual_manualData',
        ADMIN_SESSION: 'admin_session',
        NAVIGATION_STATE: 'navigation_state',
        USER_PREFERENCES: 'user_preferences'
    },
    
    // API 설정 (시뮬레이션용)
    API: {
        BASE_URL: '',
        ENDPOINTS: {
            MANUAL_DATA: '/new-format-data.json',
            HEALTH_CHECK: '/api/health'
        }
    },
    
    // UI 설정
    UI: {
        SIDEBAR_COLLAPSED_WIDTH: '60px',
        SIDEBAR_EXPANDED_WIDTH: '320px',
        ANIMATION_DURATION: 300,
        DEBOUNCE_DELAY: 300
    },
    
    // 메시지
    MESSAGES: {
        LOADING: '데이터 로딩 중...',
        ERROR_LOAD_DATA: '데이터를 불러오는 중 오류가 발생했습니다.',
        ERROR_ADMIN_LOGIN: '관리자 비밀번호가 올바르지 않습니다.',
        SUCCESS_ADMIN_LOGIN: '관리자 로그인 성공',
        SUCCESS_DATA_SAVE: '데이터가 성공적으로 저장되었습니다.',
        SUCCESS_DATA_DELETE: '데이터가 성공적으로 삭제되었습니다.',
        CONFIRM_DELETE: '정말 삭제하시겠습니까?',
        NO_SEARCH_RESULTS: '검색 결과가 없습니다.',
        SEARCH_PLACEHOLDER: '검색어를 입력하세요'
    },
    
    // 기본 데이터 구조
    DEFAULT_DATA: {
        departments: [
            {
                id: 'dept_001',
                name: '공통(운영지원과)',
                description: '운영지원과 공통 업무',
                order: 1,
                categories: []
            },
            {
                id: 'dept_002', 
                name: '시설안전관리과',
                description: '시설안전관리과 업무',
                order: 2,
                categories: []
            },
            {
                id: 'dept_003',
                name: '도로안전운영과', 
                description: '도로안전운영과 업무',
                order: 3,
                categories: []
            }
        ],
        categories: [],
        processes: []
    }
};

// 유틸리티 함수들
window.Utils = {
    /**
     * 고유 ID 생성
     */
    generateId: function(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    
    /**
     * 로컬 스토리지에서 데이터 가져오기
     */
    getFromStorage: function(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    },
    
    /**
     * 로컬 스토리지에 데이터 저장
     */
    setToStorage: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    },
    
    /**
     * 로컬 스토리지에서 데이터 삭제
     */
    removeFromStorage: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    },
    
    /**
     * 디바운스 함수
     */
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * 문자열을 HTML 엔티티로 이스케이프
     */
    escapeHtml: function(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    },
    
    /**
     * 날짜 포맷팅
     */
    formatDate: function(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        
        switch (format) {
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            case 'YYYY-MM-DD HH:mm':
                return `${year}-${month}-${day} ${hours}:${minutes}`;
            default:
                return d.toLocaleDateString('ko-KR');
        }
    },
    
    /**
     * 검색 문자열 하이라이트
     */
    highlightText: function(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    },
    
    /**
     * 정규식 특수문자 이스케이프
     */
    escapeRegex: function(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },
    
    /**
     * 객체 깊은 복사
     */
    deepClone: function(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    },
    
    /**
     * 로딩 상태 표시/숨김 (개선된 버전)
     */
    showLoading: function(message = '처리 중...') {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            const spinner = loadingOverlay.querySelector('.spinner p');
            if (spinner) {
                spinner.textContent = message;
            }
            loadingOverlay.classList.add('show');
        }
    },
    
    hideLoading: function() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('show');
        }
    },
    
    /**
     * 고급 알림 시스템 (Toast Notification)
     */
    showNotification: function(message, type = 'info', duration = 4000) {
        // 기존 toast 제거
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // 새 toast 생성
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // 아이콘 선택
        let icon = '';
        switch (type) {
            case 'success': icon = '<span class="icon icon-check"></span>'; break;
            case 'error': icon = '<span class="icon icon-exclamation"></span>'; break;
            case 'warning': icon = '<span class="icon icon-exclamation"></span>'; break;
            case 'info': icon = '<span class="icon icon-info"></span>'; break;
            default: icon = '<span class="icon icon-bell"></span>';
        }
        
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                ${icon}
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.2rem;
                    cursor: pointer;
                    margin-left: auto;
                    opacity: 0.7;
                    padding: 0;
                ">&times;</button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // 애니메이션
        setTimeout(() => toast.classList.add('show'), 100);
        
        // 자동 삭제
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (toast.parentElement) {
                        toast.remove();
                    }
                }, 300);
            }
        }, duration);
    },
    
    /**
     * 버튼 로딩 상태 설정
     */
    setButtonLoading: function(button, loading = true) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    },
    
    /**
     * 입력 필드 오류 표시
     */
    showFieldError: function(field, message) {
        field.classList.add('error');
        field.classList.remove('success');
        
        // 오류 메시지 생성 또는 업데이트
        let errorMsg = field.parentElement.querySelector('.error-message');
        if (!errorMsg) {
            errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            field.parentElement.appendChild(errorMsg);
        }
        
        errorMsg.textContent = message;
        errorMsg.classList.add('show');
        
        // 입력 시 오류 상태 제거
        const removeError = () => {
            field.classList.remove('error');
            errorMsg.classList.remove('show');
            field.removeEventListener('input', removeError);
        };
        
        field.addEventListener('input', removeError);
    },
    
    /**
     * 입력 필드 성공 표시
     */
    showFieldSuccess: function(field) {
        field.classList.add('success');
        field.classList.remove('error');
        
        const errorMsg = field.parentElement.querySelector('.error-message');
        if (errorMsg) {
            errorMsg.classList.remove('show');
        }
    },
    
    /**
     * 고급 확인 대화상자
     */
    confirm: function(message, title = '확인') {
        return new Promise((resolve) => {
            // 모달 생성
            const modal = document.createElement('div');
            modal.className = 'modal show';
            modal.innerHTML = `
                <div class="modal-content bounce-in" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3>${title}</h3>
                    </div>
                    <div class="modal-body">
                        <p style="margin-bottom: 2rem; line-height: 1.6;">${message}</p>
                        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                            <button class="btn-secondary confirm-cancel">취소</button>
                            <button class="btn-primary confirm-ok">확인</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // 이벤트 바인딩
            modal.querySelector('.confirm-ok').addEventListener('click', () => {
                modal.remove();
                resolve(true);
            });
            
            modal.querySelector('.confirm-cancel').addEventListener('click', () => {
                modal.remove();
                resolve(false);
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    resolve(false);
                }
            });
        });
    },
    
    /**
     * 엘리먼트에 애니메이션 추가
     */
    addAnimation: function(element, animationClass, duration = 600) {
        element.classList.add(animationClass);
        setTimeout(() => {
            element.classList.remove(animationClass);
        }, duration);
    }
};

// 전역 이벤트 에미터
window.EventEmitter = {
    events: {},
    
    on: function(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    },
    
    off: function(event, callback) {
        if (!this.events[event]) return;
        const index = this.events[event].indexOf(callback);
        if (index > -1) {
            this.events[event].splice(index, 1);
        }
    },
    
    emit: function(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }
};

// 콘솔 로깅 설정 (디버깅용)
window.Logger = {
    debug: function(...args) {
        console.log('🔧 [DEBUG]', ...args);
    },
    
    info: function(...args) {
        console.log('ℹ️ [INFO]', ...args);
    },
    
    warn: function(...args) {
        console.warn('⚠️ [WARN]', ...args);
    },
    
    error: function(...args) {
        console.error('❌ [ERROR]', ...args);
    },
    
    navigation: function(...args) {
        console.log('🧭 [NAV]', ...args);
    }
};