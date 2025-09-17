/**
 * 이벤트 에미터 모듈
 * 모듈 간 이벤트 기반 통신 지원
 */

class EventEmitter {
    static events = new Map();
    static maxListeners = 100;
    static debugMode = false;

    /**
     * 이벤트 리스너 등록
     */
    static on(eventName, listener) {
        if (typeof listener !== 'function') {
            throw new Error('리스너는 함수여야 합니다.');
        }

        if (!EventEmitter.events.has(eventName)) {
            EventEmitter.events.set(eventName, []);
        }

        const listeners = EventEmitter.events.get(eventName);
        
        // 최대 리스너 수 체크
        if (listeners.length >= EventEmitter.maxListeners) {
            console.warn(`이벤트 "${eventName}"의 리스너가 최대 개수(${EventEmitter.maxListeners})를 초과했습니다.`);
        }

        listeners.push(listener);

        if (EventEmitter.debugMode) {
            console.log(`📡 이벤트 리스너 등록: ${eventName} (총 ${listeners.length}개)`);
        }

        return EventEmitter; // 체이닝을 위해
    }

    /**
     * 일회성 이벤트 리스너 등록
     */
    static once(eventName, listener) {
        const onceListener = (...args) => {
            EventEmitter.off(eventName, onceListener);
            listener.apply(this, args);
        };

        return EventEmitter.on(eventName, onceListener);
    }

    /**
     * 이벤트 리스너 제거
     */
    static off(eventName, listener) {
        if (!EventEmitter.events.has(eventName)) {
            return EventEmitter;
        }

        const listeners = EventEmitter.events.get(eventName);
        const index = listeners.indexOf(listener);

        if (index > -1) {
            listeners.splice(index, 1);
            
            if (EventEmitter.debugMode) {
                console.log(`📡 이벤트 리스너 제거: ${eventName} (남은 리스너: ${listeners.length}개)`);
            }

            // 리스너가 없으면 이벤트 자체를 제거
            if (listeners.length === 0) {
                EventEmitter.events.delete(eventName);
            }
        }

        return EventEmitter;
    }

    /**
     * 모든 이벤트 리스너 제거
     */
    static removeAllListeners(eventName = null) {
        if (eventName === null) {
            // 모든 이벤트 제거
            EventEmitter.events.clear();
            if (EventEmitter.debugMode) {
                console.log('📡 모든 이벤트 리스너 제거됨');
            }
        } else {
            // 특정 이벤트의 모든 리스너 제거
            EventEmitter.events.delete(eventName);
            if (EventEmitter.debugMode) {
                console.log(`📡 이벤트 "${eventName}"의 모든 리스너 제거됨`);
            }
        }

        return EventEmitter;
    }

    /**
     * 이벤트 발생
     */
    static emit(eventName, ...args) {
        if (!EventEmitter.events.has(eventName)) {
            if (EventEmitter.debugMode) {
                console.log(`📡 이벤트 발생 (리스너 없음): ${eventName}`);
            }
            return false;
        }

        const listeners = EventEmitter.events.get(eventName);
        const listenerCount = listeners.length;

        if (EventEmitter.debugMode) {
            console.log(`📡 이벤트 발생: ${eventName} (${listenerCount}개 리스너)`);
        }

        // 리스너들을 복사해서 실행 (실행 중 리스너가 변경되는 것을 방지)
        const listenersToExecute = [...listeners];

        for (const listener of listenersToExecute) {
            try {
                listener.apply(this, args);
            } catch (error) {
                console.error(`이벤트 "${eventName}" 리스너 실행 중 오류:`, error);
                
                // Logger가 있다면 사용
                if (typeof window !== 'undefined' && window.Logger) {
                    window.Logger.error('EventEmitter 리스너 오류:', error, {
                        eventName,
                        args
                    });
                }
            }
        }

        return listenerCount > 0;
    }

    /**
     * 이벤트에 등록된 리스너 개수 반환
     */
    static listenerCount(eventName) {
        if (!EventEmitter.events.has(eventName)) {
            return 0;
        }
        return EventEmitter.events.get(eventName).length;
    }

    /**
     * 이벤트에 등록된 리스너들 반환
     */
    static listeners(eventName) {
        if (!EventEmitter.events.has(eventName)) {
            return [];
        }
        return [...EventEmitter.events.get(eventName)]; // 복사본 반환
    }

    /**
     * 등록된 모든 이벤트 이름들 반환
     */
    static eventNames() {
        return Array.from(EventEmitter.events.keys());
    }

    /**
     * 최대 리스너 수 설정
     */
    static setMaxListeners(n) {
        if (typeof n !== 'number' || n < 0 || !isFinite(n)) {
            throw new Error('최대 리스너 수는 0 이상의 숫자여야 합니다.');
        }
        EventEmitter.maxListeners = n;
        return EventEmitter;
    }

    /**
     * 최대 리스너 수 반환
     */
    static getMaxListeners() {
        return EventEmitter.maxListeners;
    }

    /**
     * 디버그 모드 설정
     */
    static setDebugMode(enabled) {
        EventEmitter.debugMode = !!enabled;
        console.log(`📡 EventEmitter 디버그 모드: ${enabled ? '활성화' : '비활성화'}`);
        return EventEmitter;
    }

    /**
     * 모든 이벤트와 리스너 정보 출력
     */
    static debug() {
        console.group('📡 EventEmitter 디버그 정보');
        
        console.log(`최대 리스너 수: ${EventEmitter.maxListeners}`);
        console.log(`총 이벤트 수: ${EventEmitter.events.size}`);
        
        if (EventEmitter.events.size === 0) {
            console.log('등록된 이벤트가 없습니다.');
        } else {
            for (const [eventName, listeners] of EventEmitter.events) {
                console.group(`이벤트: ${eventName}`);
                console.log(`리스너 수: ${listeners.length}`);
                listeners.forEach((listener, index) => {
                    console.log(`  ${index + 1}. ${listener.name || '익명 함수'}`);
                });
                console.groupEnd();
            }
        }
        
        console.groupEnd();
    }

    /**
     * Promise 기반 이벤트 대기
     */
    static waitFor(eventName, timeout = 5000) {
        return new Promise((resolve, reject) => {
            let resolved = false;
            
            // 타임아웃 설정
            const timer = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    reject(new Error(`이벤트 "${eventName}" 대기 시간 초과 (${timeout}ms)`));
                }
            }, timeout);

            // 이벤트 리스너 등록
            const listener = (...args) => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timer);
                    resolve(args.length === 1 ? args[0] : args);
                }
            };

            EventEmitter.once(eventName, listener);
        });
    }

    /**
     * 이벤트 파이프라인 (체인)
     */
    static pipe(fromEvent, toEvent, transform = null) {
        return EventEmitter.on(fromEvent, (...args) => {
            const data = transform ? transform(...args) : args;
            EventEmitter.emit(toEvent, ...(Array.isArray(data) ? data : [data]));
        });
    }

    /**
     * 조건부 이벤트 리스너
     */
    static onIf(eventName, condition, listener) {
        return EventEmitter.on(eventName, (...args) => {
            if (condition(...args)) {
                listener(...args);
            }
        });
    }

    /**
     * 카운트 기반 이벤트 리스너 (n번 실행 후 제거)
     */
    static onCount(eventName, count, listener) {
        let executeCount = 0;
        
        const countListener = (...args) => {
            executeCount++;
            listener(...args);
            
            if (executeCount >= count) {
                EventEmitter.off(eventName, countListener);
            }
        };

        return EventEmitter.on(eventName, countListener);
    }

    /**
     * 이벤트 통계 정보
     */
    static getStats() {
        const stats = {
            totalEvents: EventEmitter.events.size,
            totalListeners: 0,
            events: {}
        };

        for (const [eventName, listeners] of EventEmitter.events) {
            stats.totalListeners += listeners.length;
            stats.events[eventName] = listeners.length;
        }

        return stats;
    }

    /**
     * 네임스페이스 이벤트 헬퍼
     */
    static namespace(ns) {
        return {
            on: (event, listener) => EventEmitter.on(`${ns}:${event}`, listener),
            once: (event, listener) => EventEmitter.once(`${ns}:${event}`, listener),
            off: (event, listener) => EventEmitter.off(`${ns}:${event}`, listener),
            emit: (event, ...args) => EventEmitter.emit(`${ns}:${event}`, ...args)
        };
    }

    /**
     * 초기화
     */
    static init(options = {}) {
        const {
            maxListeners = 100,
            debugMode = false
        } = options;

        EventEmitter.setMaxListeners(maxListeners);
        EventEmitter.setDebugMode(debugMode);

        // 개발 환경에서는 디버그 모드 자동 활성화
        if (typeof window !== 'undefined') {
            const isDev = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.includes('dev');
            
            if (isDev && !options.hasOwnProperty('debugMode')) {
                EventEmitter.setDebugMode(true);
            }
        }

        if (EventEmitter.debugMode) {
            console.log('📡 EventEmitter 초기화 완료', {
                maxListeners: EventEmitter.maxListeners,
                debugMode: EventEmitter.debugMode
            });
        }

        return EventEmitter;
    }
}

// 전역 객체로 등록
window.EventEmitter = EventEmitter;

// 자동 초기화
EventEmitter.init();

console.log('✅ EventEmitter 모듈 로드 완료');