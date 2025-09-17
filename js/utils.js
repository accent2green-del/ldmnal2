/**
 * 유틸리티 함수 모듈
 * 공통으로 사용되는 헬퍼 함수들
 */

class Utils {
    /**
     * HTML 이스케이프 처리
     */
    static escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    /**
     * 깊은 복사 수행
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
        
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = Utils.deepClone(obj[key]);
            }
        }
        return clonedObj;
    }

    /**
     * 로컬 스토리지에서 데이터 가져오기
     */
    static getFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('스토리지에서 데이터 읽기 실패:', error);
            return null;
        }
    }

    /**
     * 로컬 스토리지에 데이터 저장
     */
    static setToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('스토리지에 데이터 저장 실패:', error);
            return false;
        }
    }

    /**
     * 로컬 스토리지에서 데이터 제거
     */
    static removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('스토리지에서 데이터 제거 실패:', error);
            return false;
        }
    }

    /**
     * 날짜 포맷팅
     */
    static formatDate(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day);
    }

    /**
     * 디바운스 함수
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 스로틀링 함수
     */
    static throttle(func, limit) {
        let lastFunc;
        let lastRan;
        return function(...args) {
            if (!lastRan) {
                func.apply(this, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(() => {
                    if ((Date.now() - lastRan) >= limit) {
                        func.apply(this, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    }

    /**
     * 고유 ID 생성
     */
    static generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 문자열이 비어있는지 확인
     */
    static isEmpty(str) {
        return !str || str.trim().length === 0;
    }

    /**
     * 배열에서 중복 제거
     */
    static removeDuplicates(array) {
        return [...new Set(array)];
    }

    /**
     * 객체가 비어있는지 확인
     */
    static isObjectEmpty(obj) {
        return Object.keys(obj).length === 0;
    }

    /**
     * 알림 표시 (간단한 구현)
     */
    static showNotification(message, type = 'info') {
        // 간단한 알림 구현
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // 브라우저 알림이 필요하다면 여기에 구현
        if (type === 'error') {
            alert(`오류: ${message}`);
        }
    }

    /**
     * 확인 대화상자 (Promise 기반)
     */
    static confirm(message, title = '확인') {
        return new Promise((resolve) => {
            const result = window.confirm(`${title}\n\n${message}`);
            resolve(result);
        });
    }

    /**
     * 로딩 표시
     */
    static showLoading() {
        console.log('로딩 중...');
    }

    /**
     * 로딩 숨김
     */
    static hideLoading() {
        console.log('로딩 완료');
    }

    /**
     * 문자열을 케밥 케이스로 변환
     */
    static toKebabCase(str) {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase();
    }

    /**
     * 문자열을 카멜 케이스로 변환
     */
    static toCamelCase(str) {
        return str
            .replace(/-([a-z])/g, (g) => g[1].toUpperCase())
            .replace(/^([A-Z])/, (g) => g.toLowerCase());
    }

    /**
     * 숫자를 한국어 형식으로 포맷
     */
    static formatNumber(num) {
        return new Intl.NumberFormat('ko-KR').format(num);
    }

    /**
     * URL 파라미터 파싱
     */
    static parseUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    }

    /**
     * 모바일 디바이스 감지
     */
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * 현재 브라우저 정보
     */
    static getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        
        if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
        else if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
        else if (ua.indexOf('Safari') > -1) browser = 'Safari';
        else if (ua.indexOf('Edge') > -1) browser = 'Edge';
        
        return {
            name: browser,
            userAgent: ua,
            isMobile: Utils.isMobile()
        };
    }
}

// 전역 객체로 등록
window.Utils = Utils;

console.log('✅ Utils 모듈 로드 완료');