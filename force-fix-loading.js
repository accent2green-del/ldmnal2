/**
 * 로딩 문제 강제 해결 스크립트
 * 브라우저 콘솔에서 직접 실행할 수 있는 스크립트
 */

(function() {
    'use strict';
    
    console.log('🚨 로딩 문제 강제 해결 스크립트 시작');
    
    function forceFixLoading() {
        try {
            // 1. 모든 로딩 관련 요소 찾기 및 숨김
            const loadingElements = [
                '#loading-overlay',
                '.loading-overlay',
                '[id*="loading"]',
                '[class*="loading"]',
                '.spinner',
                '.loader'
            ];
            
            loadingElements.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    if (el && (
                        el.textContent.includes('로딩') ||
                        el.textContent.includes('Loading') ||
                        el.textContent.includes('애플리케이션') ||
                        el.textContent.includes('처리 중')
                    )) {
                        el.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; z-index: -9999 !important;';
                        el.remove();
                        console.log('✅ 로딩 요소 제거:', selector);
                    }
                });
            });
            
            // 2. body와 html에서 로딩 관련 클래스 제거
            document.body.classList.remove('loading', 'app-loading', 'initializing');
            document.documentElement.classList.remove('loading', 'app-loading', 'initializing');
            
            // 3. 강력한 CSS 오버라이드 적용
            let style = document.getElementById('emergency-fix-loading');
            if (style) {
                style.remove();
            }
            
            style = document.createElement('style');
            style.id = 'emergency-fix-loading';
            style.textContent = `
                /* 강제 로딩 숨김 */
                .loading-overlay,
                .loading-overlay.show,
                #loading-overlay,
                #loading-overlay.show,
                [class*="loading"],
                [id*="loading"] {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    z-index: -9999 !important;
                    pointer-events: none !important;
                }
                
                /* body 스크롤 복원 */
                body, html {
                    overflow: auto !important;
                    position: static !important;
                }
                
                /* 메인 콘텐츠 표시 보장 */
                .main-content,
                .content-body,
                .navigation,
                nav,
                main,
                header {
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }
            `;
            document.head.appendChild(style);
            
            // 4. App 강제 초기화 완료 처리
            if (window.App && typeof window.App.forceHideAllLoading === 'function') {
                window.App.forceHideAllLoading();
            }
            
            // 5. 최종 확인 및 보고
            const remainingLoading = document.querySelectorAll('[class*="loading"], [id*="loading"]');
            const visibleLoading = Array.from(remainingLoading).filter(el => {
                const style = getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden';
            });
            
            console.log('🔍 남은 로딩 요소:', visibleLoading.length);
            if (visibleLoading.length > 0) {
                visibleLoading.forEach(el => {
                    console.log('🚨 여전히 표시 중인 로딩 요소:', el);
                    el.style.cssText = 'display: none !important;';
                });
            }
            
            console.log('✅ 로딩 문제 강제 해결 완료');
            return true;
            
        } catch (error) {
            console.error('❌ 로딩 해결 중 오류:', error);
            return false;
        }
    }
    
    // 즉시 실행
    forceFixLoading();
    
    // 1초 후 재실행
    setTimeout(forceFixLoading, 1000);
    
    // 5초 후 재실행
    setTimeout(forceFixLoading, 5000);
    
    // 전역에 함수 등록 (수동 호출 가능)
    window.forceFixLoading = forceFixLoading;
    
    console.log('💡 수동 실행: window.forceFixLoading()');
    
})();