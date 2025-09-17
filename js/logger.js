/**
 * 로깅 모듈
 * 시스템 로그 관리 및 디버깅 지원
 */

class Logger {
    static levels = {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3
    };

    static currentLevel = Logger.levels.DEBUG; // 개발 환경에서는 모든 레벨 표시
    static logs = [];
    static maxLogs = 1000;

    /**
     * 로그 레벨 설정
     */
    static setLevel(level) {
        if (typeof level === 'string') {
            level = Logger.levels[level.toUpperCase()];
        }
        Logger.currentLevel = level;
    }

    /**
     * 로그 메시지 포맷팅
     */
    static formatMessage(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const levelName = Object.keys(Logger.levels)[level];
        
        let formattedMessage = message;
        if (args.length > 0) {
            formattedMessage += ' ' + args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
        }

        return {
            timestamp,
            level: levelName,
            message: formattedMessage,
            raw: { message, args }
        };
    }

    /**
     * 로그 저장 및 출력
     */
    static log(level, message, ...args) {
        if (level > Logger.currentLevel) return;

        const logEntry = Logger.formatMessage(level, message, ...args);
        
        // 로그 배열에 저장 (최대 개수 제한)
        Logger.logs.push(logEntry);
        if (Logger.logs.length > Logger.maxLogs) {
            Logger.logs.shift();
        }

        // 콘솔 출력
        const consoleMethod = {
            [Logger.levels.ERROR]: 'error',
            [Logger.levels.WARN]: 'warn',
            [Logger.levels.INFO]: 'info',
            [Logger.levels.DEBUG]: 'log'
        }[level];

        const style = {
            [Logger.levels.ERROR]: 'color: #dc3545; font-weight: bold;',
            [Logger.levels.WARN]: 'color: #ffc107; font-weight: bold;',
            [Logger.levels.INFO]: 'color: #007bff; font-weight: bold;',
            [Logger.levels.DEBUG]: 'color: #28a745;'
        }[level];

        console[consoleMethod](
            `%c[${logEntry.timestamp}] ${logEntry.level}:`,
            style,
            message,
            ...args
        );

        // 이벤트 발생 (다른 모듈에서 로그를 감지할 수 있도록)
        if (typeof window !== 'undefined' && window.EventEmitter) {
            window.EventEmitter.emit('log:entry', logEntry);
        }
    }

    /**
     * 에러 로그
     */
    static error(message, ...args) {
        Logger.log(Logger.levels.ERROR, message, ...args);
    }

    /**
     * 경고 로그
     */
    static warn(message, ...args) {
        Logger.log(Logger.levels.WARN, message, ...args);
    }

    /**
     * 정보 로그
     */
    static info(message, ...args) {
        Logger.log(Logger.levels.INFO, message, ...args);
    }

    /**
     * 디버그 로그
     */
    static debug(message, ...args) {
        Logger.log(Logger.levels.DEBUG, message, ...args);
    }

    /**
     * 모든 로그 반환
     */
    static getLogs(level = null) {
        if (level === null) {
            return [...Logger.logs];
        }
        
        const targetLevel = typeof level === 'string' ? 
            Logger.levels[level.toUpperCase()] : level;
        
        return Logger.logs.filter(log => 
            Logger.levels[log.level] === targetLevel
        );
    }

    /**
     * 로그 초기화
     */
    static clearLogs() {
        Logger.logs = [];
        Logger.info('로그가 초기화되었습니다.');
    }

    /**
     * 로그를 문자열로 내보내기
     */
    static exportLogs() {
        return Logger.logs.map(log => 
            `[${log.timestamp}] ${log.level}: ${log.message}`
        ).join('\n');
    }

    /**
     * 성능 측정 시작
     */
    static startTimer(label) {
        if (typeof performance !== 'undefined' && performance.mark) {
            performance.mark(`${label}-start`);
        }
        Logger.debug(`⏱️ 타이머 시작: ${label}`);
    }

    /**
     * 성능 측정 종료
     */
    static endTimer(label) {
        if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
            performance.mark(`${label}-end`);
            performance.measure(label, `${label}-start`, `${label}-end`);
            
            const measure = performance.getEntriesByName(label)[0];
            Logger.debug(`⏱️ 타이머 종료: ${label} (${measure.duration.toFixed(2)}ms)`);
            
            return measure.duration;
        } else {
            Logger.debug(`⏱️ 타이머 종료: ${label}`);
            return null;
        }
    }

    /**
     * 그룹 로그 시작
     */
    static group(label) {
        if (console.group) {
            console.group(label);
        }
        Logger.info(`📂 그룹 시작: ${label}`);
    }

    /**
     * 그룹 로그 종료
     */
    static groupEnd() {
        if (console.groupEnd) {
            console.groupEnd();
        }
        Logger.info('📂 그룹 종료');
    }

    /**
     * 테이블 형태로 데이터 출력
     */
    static table(data, label = '') {
        if (label) {
            Logger.info(`📊 테이블: ${label}`);
        }
        
        if (console.table) {
            console.table(data);
        } else {
            Logger.info('테이블 데이터:', data);
        }
    }

    /**
     * 스택 트레이스 출력
     */
    static trace(message = '') {
        if (message) {
            Logger.debug(`🔍 스택 트레이스: ${message}`);
        }
        
        if (console.trace) {
            console.trace();
        }
    }

    /**
     * 시스템 정보 로깅
     */
    static logSystemInfo() {
        Logger.group('시스템 정보');
        Logger.info('User Agent:', navigator.userAgent);
        Logger.info('Platform:', navigator.platform);
        Logger.info('Language:', navigator.language);
        Logger.info('Online:', navigator.onLine);
        Logger.info('Cookie Enabled:', navigator.cookieEnabled);
        
        if (typeof window !== 'undefined') {
            Logger.info('Window Size:', `${window.innerWidth}x${window.innerHeight}`);
            Logger.info('Screen Size:', `${screen.width}x${screen.height}`);
        }
        
        Logger.groupEnd();
    }

    /**
     * 메모리 사용량 로깅 (Chrome 전용)
     */
    static logMemoryUsage() {
        if (typeof performance !== 'undefined' && performance.memory) {
            const memory = performance.memory;
            Logger.group('메모리 사용량');
            Logger.info('Used:', `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`);
            Logger.info('Total:', `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`);
            Logger.info('Limit:', `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`);
            Logger.groupEnd();
        } else {
            Logger.warn('메모리 정보를 사용할 수 없습니다 (Chrome 전용 기능)');
        }
    }

    /**
     * 개발 모드 여부 확인
     */
    static isDevelopment() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname.includes('dev') ||
               window.location.hostname.includes('test');
    }

    /**
     * 모듈별 로깅 메서드들
     */
    static navigation(message, ...args) {
        Logger.info(`🧭 [Navigation] ${message}`, ...args);
    }

    static admin(message, ...args) {
        Logger.info(`👑 [Admin] ${message}`, ...args);
    }

    static data(message, ...args) {
        Logger.info(`📊 [Data] ${message}`, ...args);
    }

    static content(message, ...args) {
        Logger.info(`📝 [Content] ${message}`, ...args);
    }

    static search(message, ...args) {
        Logger.info(`🔍 [Search] ${message}`, ...args);
    }

    static ui(message, ...args) {
        Logger.info(`🎨 [UI] ${message}`, ...args);
    }

    static api(message, ...args) {
        Logger.info(`🌐 [API] ${message}`, ...args);
    }

    static event(message, ...args) {
        Logger.info(`⚡ [Event] ${message}`, ...args);
    }

    /**
     * 초기화
     */
    static init() {
        // 개발 환경에서는 모든 레벨, 운영 환경에서는 ERROR, WARN만
        if (Logger.isDevelopment()) {
            Logger.setLevel(Logger.levels.DEBUG);
            Logger.info('🔧 개발 모드: 모든 로그 레벨 활성화');
        } else {
            Logger.setLevel(Logger.levels.WARN);
            Logger.info('🚀 운영 모드: ERROR, WARN 로그만 활성화');
        }

        // 전역 에러 핸들러 등록
        if (typeof window !== 'undefined') {
            window.addEventListener('error', (event) => {
                Logger.error('전역 에러:', event.error || event.message, {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                });
            });

            window.addEventListener('unhandledrejection', (event) => {
                Logger.error('처리되지 않은 Promise 거부:', event.reason);
            });
        }

        Logger.info('🎯 Logger 초기화 완료');
    }
}

// 전역 객체로 등록
window.Logger = Logger;

// 자동 초기화
Logger.init();

console.log('✅ Logger 모듈 로드 완료');