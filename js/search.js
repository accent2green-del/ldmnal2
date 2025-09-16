/**
 * 사이드바 실시간 검색 기능 모듈
 * 전체 텍스트 검색, 실시간 결과 표시, 검색 히스토리
 */

class SearchManager {
    constructor() {
        this.searchHistory = [];
        this.currentResults = [];
        this.currentQuery = '';
        this.selectedIndex = -1;
        this.searchTimeout = null;
        
        // 이벤트 바인딩
        this.bindEvents();
        
        // 검색 히스토리 복원
        this.loadSearchHistory();
        
        Logger.info('📚 검색 히스토리 로드: ' + this.searchHistory.length + '개 항목');
        Logger.info('SearchManager 초기화 완료');
    }
    
    /**
     * 이벤트 리스너 설정
     */
    bindEvents() {
        document.addEventListener('DOMContentLoaded', () => {
            // 사이드바 검색 이벤트 바인딩
            this.bindSidebarSearchEvents();
            
            // 키보드 단축키 (Ctrl+K 또는 Cmd+K)
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                    e.preventDefault();
                    this.focusSearchInput();
                }
            });
        });
    }
    
    /**
     * 사이드바 검색 이벤트 바인딩
     */
    bindSidebarSearchEvents() {
        const searchInput = document.getElementById('sidebar-search-input');
        const searchClear = document.getElementById('search-clear');
        const searchResults = document.getElementById('search-results');
        
        if (!searchInput) return;
        
        // 실시간 검색 입력 이벤트
        searchInput.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });
        
        // 키보드 네비게이션
        searchInput.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
        
        // 검색 지우기 버튼
        if (searchClear) {
            searchClear.addEventListener('click', () => {
                this.clearSearch();
            });
        }
        
        // 검색 결과 클릭 이벤트
        if (searchResults) {
            searchResults.addEventListener('click', (e) => {
                const resultItem = e.target.closest('.search-result-item');
                if (resultItem) {
                    this.selectSearchResult(resultItem);
                }
            });
        }
        
        // 검색 영역 외부 클릭 시 결과 숨기기
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.sidebar-search')) {
                this.hideSearchResults();
            }
        });
    }
    
    /**
     * 검색 입력 처리
     */
    handleSearchInput(query) {
        // 이전 타이머 취소
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        this.currentQuery = query.trim();
        
        // 검색어가 비어있으면 결과 숨김
        if (this.currentQuery === '') {
            this.hideSearchResults();
            this.updateClearButton(false);
            return;
        }
        
        // 검색어가 있으면 지우기 버튼 표시
        this.updateClearButton(true);
        
        // 300ms 딜레이 후 검색 실행 (타이핑 딜레이)
        this.searchTimeout = setTimeout(() => {
            this.performSearch(this.currentQuery);
        }, 300);
    }
    
    /**
     * 검색 수행
     */
    performSearch(query) {
        Logger.info(`🔍 실시간 검색 수행: "${query}"`);
        
        // 로딩 상태 표시
        this.showSearchLoading();
        
        try {
            // 데이터 매니저에서 검색 수행
            const results = dataManager.searchAll(query);
            this.currentResults = results;
            this.selectedIndex = -1;
            
            // 결과 표시
            this.displaySearchResults(results, query);
            
            // 검색 히스토리에 추가
            this.addToSearchHistory(query);
            
            Logger.info(`✨ 검색 완료: ${results.length}개 결과`);
            
        } catch (error) {
            Logger.error('검색 오류:', error);
            this.showSearchError('검색 중 오류가 발생했습니다.');
        }
    }
    
    /**
     * 검색 결과 표시
     */
    displaySearchResults(results, query) {
        const searchResults = document.getElementById('search-results');
        const searchResultsList = document.getElementById('search-results-list');
        const resultsCount = document.querySelector('.results-count');
        
        if (!searchResults || !searchResultsList || !resultsCount) return;
        
        // 결과 개수 업데이트
        resultsCount.textContent = results.length;
        
        if (results.length === 0) {
            searchResultsList.innerHTML = `
                <div class="search-no-results">
                    <span class="icon icon-search"></span>
                    <p>"${Utils.escapeHtml(query)}"에 대한 결과가 없습니다.</p>
                    <small>다른 검색어를 시도해보세요.</small>
                </div>
            `;
        } else {
            searchResultsList.innerHTML = results.map((result, index) => 
                this.createSearchResultItem(result, index, query)
            ).join('');
        }
        
        // 결과 표시
        searchResults.style.display = 'block';
    }
    
    /**
     * 검색 결과 아이템 생성
     */
    createSearchResultItem(result, index, query) {
        const typeIcons = {
            'department': 'icon-building',
            'category': 'icon-list', 
            'process': 'icon-file'
        };
        
        const typeNames = {
            'department': '부서',
            'category': '카테고리',
            'process': '프로세스'
        };
        
        // 검색어 하이라이트
        const highlightedTitle = this.highlightSearchTerm(result.title, query);
        const highlightedDescription = this.highlightSearchTerm(result.description, query);
        
        return `
            <div class="search-result-item" data-type="${result.type}" data-id="${result.id}" data-index="${index}">
                <div class="search-result-title">
                    <span class="icon ${typeIcons[result.type]}"></span>
                    ${highlightedTitle}
                    <span class="result-type-badge ${result.type}">${typeNames[result.type]}</span>
                </div>
                <div class="search-result-description">
                    ${highlightedDescription}
                </div>
                <div class="search-result-path">
                    <span class="icon icon-home"></span>
                    ${Utils.escapeHtml(result.path)}
                </div>
            </div>
        `;
    }
    
    /**
     * 검색어 하이라이트
     */
    highlightSearchTerm(text, searchTerm) {
        if (!text || !searchTerm) return Utils.escapeHtml(text || '');
        
        const escapedText = Utils.escapeHtml(text);
        const escapedSearchTerm = Utils.escapeHtml(searchTerm);
        
        const regex = new RegExp(`(${escapedSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return escapedText.replace(regex, '<mark>$1</mark>');
    }
    
    /**
     * 검색 결과 선택
     */
    selectSearchResult(resultItem) {
        const type = resultItem.dataset.type;
        const id = resultItem.dataset.id;
        
        Logger.info(`🎯 검색 결과 선택: ${type} - ${id}`);
        
        // 네비게이션 이동
        navigationManager.navigateToItem(type, id);
        
        // 검색 지우기 및 숨김
        this.clearSearch();
        
        // 모바일에서 사이드바 닫기
        if (window.innerWidth <= 768) {
            navigationManager.hideSidebar();
        }
    }
    
    /**
     * 키보드 네비게이션 처리
     */
    handleKeyboardNavigation(e) {
        const results = document.querySelectorAll('.search-result-item');
        if (results.length === 0) return;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, results.length - 1);
                this.updateKeyboardSelection(results);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateKeyboardSelection(results);
                break;
                
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0 && results[this.selectedIndex]) {
                    this.selectSearchResult(results[this.selectedIndex]);
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                this.clearSearch();
                break;
        }
    }
    
    /**
     * 키보드 선택 상태 업데이트
     */
    updateKeyboardSelection(results) {
        results.forEach((result, index) => {
            result.classList.remove('keyboard-focused');
            if (index === this.selectedIndex) {
                result.classList.add('keyboard-focused');
                result.scrollIntoView({ block: 'nearest' });
            }
        });
    }
    
    /**
     * 검색 초기화
     */
    focusSearchInput() {
        const searchInput = document.getElementById('sidebar-search-input');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
    
    /**
     * 검색 지우기
     */
    clearSearch() {
        const searchInput = document.getElementById('sidebar-search-input');
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
        
        this.currentQuery = '';
        this.currentResults = [];
        this.selectedIndex = -1;
        
        this.hideSearchResults();
        this.updateClearButton(false);
    }
    
    /**
     * 검색 결과 숨김
     */
    hideSearchResults() {
        const searchResults = document.getElementById('search-results');
        if (searchResults) {
            searchResults.style.display = 'none';
        }
    }
    
    /**
     * 지우기 버튼 상태 업데이트
     */
    updateClearButton(show) {
        const clearButton = document.getElementById('search-clear');
        if (clearButton) {
            clearButton.style.display = show ? 'flex' : 'none';
        }
    }
    
    /**
     * 검색 로딩 상태 표시
     */
    showSearchLoading() {
        const searchResults = document.getElementById('search-results');
        const searchResultsList = document.getElementById('search-results-list');
        const resultsCount = document.querySelector('.results-count');
        
        if (!searchResults || !searchResultsList || !resultsCount) return;
        
        resultsCount.textContent = '0';
        searchResultsList.innerHTML = `
            <div class="search-loading">
                <span class="icon icon-spinner"></span>
                검색 중...
            </div>
        `;
        
        searchResults.style.display = 'block';
    }
    
    /**
     * 검색 오류 표시
     */
    showSearchError(message) {
        const searchResults = document.getElementById('search-results');
        const searchResultsList = document.getElementById('search-results-list');
        const resultsCount = document.querySelector('.results-count');
        
        if (!searchResults || !searchResultsList || !resultsCount) return;
        
        resultsCount.textContent = '0';
        searchResultsList.innerHTML = `
            <div class="search-no-results">
                <span class="icon icon-exclamation-triangle"></span>
                <p>${Utils.escapeHtml(message)}</p>
            </div>
        `;
        
        searchResults.style.display = 'block';
    }
    
    /**
     * 검색 히스토리에 추가
     */
    addToSearchHistory(query) {
        if (!query || query.length < 2) return;
        
        // 중복 제거
        this.searchHistory = this.searchHistory.filter(item => item !== query);
        
        // 맨 앞에 추가
        this.searchHistory.unshift(query);
        
        // 최대 20개로 제한
        if (this.searchHistory.length > 20) {
            this.searchHistory = this.searchHistory.slice(0, 20);
        }
        
        // 로컬 스토리지에 저장
        this.saveSearchHistory();
    }
    
    /**
     * 검색 히스토리 저장
     */
    saveSearchHistory() {
        try {
            Utils.setToStorage(AppConfig.STORAGE_KEYS.SEARCH_HISTORY, this.searchHistory);
            Logger.info('📚 검색 히스토리 저장 완료');
        } catch (error) {
            Logger.error('검색 히스토리 저장 실패:', error);
        }
    }
    
    /**
     * 검색 히스토리 로드
     */
    loadSearchHistory() {
        try {
            const history = Utils.getFromStorage(AppConfig.STORAGE_KEYS.SEARCH_HISTORY) || [];
            this.searchHistory = Array.isArray(history) ? history : [];
            Logger.info(`📚 검색 히스토리 로드: ${this.searchHistory.length}개 항목`);
        } catch (error) {
            Logger.error('검색 히스토리 로드 실패:', error);
            this.searchHistory = [];
        }
    }
}

// 전역 인스턴스 생성
window.searchManager = new SearchManager();