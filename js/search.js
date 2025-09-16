/**
 * 검색 기능 모듈
 * 전체 텍스트 검색, 결과 필터링, 검색 히스토리
 */

class SearchManager {
    constructor() {
        this.searchHistory = [];
        this.currentResults = [];
        
        // 이벤트 바인딩
        this.bindEvents();
        
        // 검색 히스토리 복원
        this.loadSearchHistory();
        
        Logger.info('SearchManager 초기화 완료');
    }
    
    /**
     * 이벤트 리스너 설정
     */
    bindEvents() {
        document.addEventListener('DOMContentLoaded', () => {
            // 검색 버튼 클릭
            const searchBtn = document.getElementById('search-btn');
            if (searchBtn) {
                searchBtn.addEventListener('click', () => {
                    this.showSearchModal();
                });
            }
            
            // 검색 모달 이벤트
            this.bindSearchModalEvents();
            
            // 키보드 단축키 (Ctrl+K 또는 Cmd+K)
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                    e.preventDefault();
                    this.showSearchModal();
                }
            });
        });
    }
    
    /**
     * 검색 모달 이벤트 바인딩
     */
    bindSearchModalEvents() {
        const searchModal = document.getElementById('search-modal');
        const searchForm = document.getElementById('search-form');
        const searchInput = document.getElementById('search-input');
        const closeBtn = document.getElementById('search-modal-close');
        
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSearch();
            });
        }
        
        if (searchInput) {
            // 실시간 검색 (디바운스 적용)
            searchInput.addEventListener('input', Utils.debounce(() => {
                const query = searchInput.value.trim();
                if (query.length >= 2) {
                    this.performSearch(query, true);
                } else if (query.length === 0) {
                    this.clearResults();
                }
            }, AppConfig.UI.DEBOUNCE_DELAY));
            
            // 키보드 네비게이션
            searchInput.addEventListener('keydown', (e) => {
                this.handleKeyboardNavigation(e);
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideSearchModal();
            });
        }
        
        if (searchModal) {
            searchModal.addEventListener('click', (e) => {
                if (e.target === searchModal) {
                    this.hideSearchModal();
                }
            });
        }
    }
    
    /**
     * 검색 모달 표시
     */
    showSearchModal() {
        const modal = document.getElementById('search-modal');
        const searchInput = document.getElementById('search-input');
        
        if (modal) {
            modal.classList.add('show');
            if (searchInput) {
                searchInput.value = '';
                setTimeout(() => searchInput.focus(), 100);
            }
            
            // 최근 검색어 표시
            this.showSearchHistory();
        }
        
        Logger.info('🔍 검색 모달 표시');
    }
    
    /**
     * 검색 모달 숨김
     */
    hideSearchModal() {
        const modal = document.getElementById('search-modal');
        if (modal) {
            modal.classList.remove('show');
        }
        
        // 결과 초기화
        this.clearResults();
    }
    
    /**
     * 검색 처리
     */
    handleSearch() {
        const searchInput = document.getElementById('search-input');
        const query = searchInput ? searchInput.value.trim() : '';
        
        if (query.length < 2) {
            Utils.showNotification('검색어는 2자 이상 입력해주세요.', 'warning');
            return;
        }
        
        this.performSearch(query);
        this.addToHistory(query);
    }
    
    /**
     * 검색 실행
     */
    performSearch(query, isRealtime = false) {
        Logger.info(`🔍 검색 실행: "${query}" (실시간: ${isRealtime})`);
        
        try {
            // 데이터 매니저를 통해 검색
            const results = dataManager.search(query);
            
            this.currentResults = results;
            this.renderSearchResults(results, query, isRealtime);
            
            Logger.info(`✅ 검색 완료: ${results.length}개 결과 발견`);
            
        } catch (error) {
            Logger.error('검색 중 오류 발생:', error);
            this.renderError('검색 중 오류가 발생했습니다.');
        }
    }
    
    /**
     * 검색 결과 렌더링
     */
    renderSearchResults(results, query, isRealtime) {
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) return;
        
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>${AppConfig.MESSAGES.NO_SEARCH_RESULTS}</p>
                    ${!isRealtime ? `<p>검색어: "${Utils.escapeHtml(query)}"</p>` : ''}
                </div>
            `;
            return;
        }
        
        const resultHTML = `
            <div class="search-results-header">
                <h4>${results.length}개의 결과</h4>
                ${!isRealtime ? `<p>검색어: "${Utils.escapeHtml(query)}"</p>` : ''}
            </div>
            <div class="search-results-list">
                ${results.map((result, index) => this.renderSearchResultItem(result, index, query)).join('')}
            </div>
        `;
        
        resultsContainer.innerHTML = resultHTML;
        
        // 이벤트 연결
        this.attachSearchResultEvents();
    }
    
    /**
     * 검색 결과 아이템 렌더링
     */
    renderSearchResultItem(result, index, query) {
        const highlightedTitle = Utils.highlightText(result.title, query);
        const highlightedDescription = Utils.highlightText(result.description, query);
        
        return `
            <div class="search-result-item" data-index="${index}" data-type="${result.type}" data-id="${result.id}">
                <div class="result-icon">
                    ${this.getResultIcon(result.type)}
                </div>
                <div class="result-content">
                    <div class="result-title">${highlightedTitle}</div>
                    <div class="result-description">${highlightedDescription}</div>
                    <div class="result-path">
                        <i class="fas fa-map-marker-alt"></i>
                        ${Utils.escapeHtml(result.path)}
                    </div>
                    <div class="result-meta">
                        <span class="result-type">${this.getResultTypeText(result.type)}</span>
                        <span class="result-score">일치도: ${result.score}</span>
                    </div>
                </div>
                <div class="result-action">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
        `;
    }
    
    /**
     * 결과 타입별 아이콘 반환
     */
    getResultIcon(type) {
        const icons = {
            'department': '<i class="fas fa-building"></i>',
            'category': '<i class="fas fa-list"></i>',
            'process': '<i class="fas fa-file-alt"></i>'
        };
        
        return icons[type] || '<i class="fas fa-file"></i>';
    }
    
    /**
     * 결과 타입별 텍스트 반환
     */
    getResultTypeText(type) {
        const typeTexts = {
            'department': '부서',
            'category': '카테고리',
            'process': '프로세스'
        };
        
        return typeTexts[type] || '기타';
    }
    
    /**
     * 검색 결과 이벤트 연결
     */
    attachSearchResultEvents() {
        document.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const type = item.dataset.type;
                const id = item.dataset.id;
                
                this.selectSearchResult(type, id);
            });
            
            // 호버 효과
            item.addEventListener('mouseenter', () => {
                this.highlightSearchResult(item);
            });
        });
    }
    
    /**
     * 검색 결과 선택 처리
     */
    selectSearchResult(type, id) {
        Logger.info(`🎯 검색 결과 선택: ${type} - ${id}`);
        
        // 모달 닫기
        this.hideSearchModal();
        
        // 해당 아이템으로 네비게이션
        navigationManager.navigateToItem(type, id);
    }
    
    /**
     * 키보드 네비게이션 처리
     */
    handleKeyboardNavigation(e) {
        const results = document.querySelectorAll('.search-result-item');
        const currentHighlighted = document.querySelector('.search-result-item.keyboard-highlighted');
        
        let currentIndex = -1;
        if (currentHighlighted) {
            currentIndex = parseInt(currentHighlighted.dataset.index);
        }
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.highlightSearchResult(results[Math.min(currentIndex + 1, results.length - 1)]);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.highlightSearchResult(results[Math.max(currentIndex - 1, 0)]);
                break;
                
            case 'Enter':
                if (currentHighlighted) {
                    e.preventDefault();
                    currentHighlighted.click();
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                this.hideSearchModal();
                break;
        }
    }
    
    /**
     * 검색 결과 하이라이트
     */
    highlightSearchResult(element) {
        // 기존 하이라이트 제거
        document.querySelectorAll('.search-result-item.keyboard-highlighted').forEach(item => {
            item.classList.remove('keyboard-highlighted');
        });
        
        // 새 하이라이트 적용
        if (element) {
            element.classList.add('keyboard-highlighted');
            element.scrollIntoView({ block: 'nearest' });
        }
    }
    
    /**
     * 검색 히스토리 표시
     */
    showSearchHistory() {
        if (this.searchHistory.length === 0) {
            this.clearResults();
            return;
        }
        
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) return;
        
        const historyHTML = `
            <div class="search-history">
                <div class="search-history-header">
                    <h4>최근 검색어</h4>
                    <button class="clear-history-btn" onclick="searchManager.clearSearchHistory()">
                        <i class="fas fa-trash"></i> 전체 삭제
                    </button>
                </div>
                <div class="search-history-list">
                    ${this.searchHistory.slice(0, 10).map(item => `
                        <div class="search-history-item" onclick="searchManager.selectHistoryItem('${Utils.escapeHtml(item.query)}')">
                            <i class="fas fa-history"></i>
                            <span class="history-query">${Utils.escapeHtml(item.query)}</span>
                            <span class="history-date">${Utils.formatDate(item.timestamp)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        resultsContainer.innerHTML = historyHTML;
    }
    
    /**
     * 히스토리 아이템 선택
     */
    selectHistoryItem(query) {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = query;
            searchInput.focus();
            this.performSearch(query);
        }
    }
    
    /**
     * 검색 히스토리에 추가
     */
    addToHistory(query) {
        // 중복 제거
        this.searchHistory = this.searchHistory.filter(item => item.query !== query);
        
        // 새 항목 추가 (최상단)
        this.searchHistory.unshift({
            query: query,
            timestamp: new Date().toISOString()
        });
        
        // 최대 20개까지만 보관
        if (this.searchHistory.length > 20) {
            this.searchHistory = this.searchHistory.slice(0, 20);
        }
        
        // 저장
        this.saveSearchHistory();
        
        Logger.info(`📝 검색어 히스토리 추가: "${query}"`);
    }
    
    /**
     * 검색 히스토리 저장
     */
    saveSearchHistory() {
        Utils.setToStorage('search_history', this.searchHistory);
    }
    
    /**
     * 검색 히스토리 로드
     */
    loadSearchHistory() {
        this.searchHistory = Utils.getFromStorage('search_history', []);
        Logger.info(`📚 검색 히스토리 로드: ${this.searchHistory.length}개 항목`);
    }
    
    /**
     * 검색 히스토리 삭제
     */
    clearSearchHistory() {
        if (Utils.confirm('모든 검색 히스토리를 삭제하시겠습니까?')) {
            this.searchHistory = [];
            this.saveSearchHistory();
            this.showSearchHistory();
            Utils.showNotification('검색 히스토리가 삭제되었습니다.', 'info');
            Logger.info('🗑️ 검색 히스토리 삭제 완료');
        }
    }
    
    /**
     * 검색 결과 초기화
     */
    clearResults() {
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
        }
        
        this.currentResults = [];
    }
    
    /**
     * 오류 표시
     */
    renderError(message) {
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="search-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${Utils.escapeHtml(message)}</p>
                </div>
            `;
        }
    }
    
    /**
     * 고급 검색 기능 (향후 확장용)
     */
    advancedSearch(options) {
        const {
            query,
            type = null,        // 'department', 'category', 'process'
            departmentId = null,
            categoryId = null,
            tags = [],
            dateRange = null
        } = options;
        
        // 기본 검색 실행
        let results = dataManager.search(query);
        
        // 추가 필터 적용
        if (type) {
            results = results.filter(result => result.type === type);
        }
        
        if (departmentId) {
            results = results.filter(result => {
                if (result.type === 'process') {
                    const process = dataManager.getProcessById(result.id);
                    return process && process.departmentId === departmentId;
                }
                return true;
            });
        }
        
        if (categoryId) {
            results = results.filter(result => {
                if (result.type === 'process') {
                    const process = dataManager.getProcessById(result.id);
                    return process && process.categoryId === categoryId;
                }
                return true;
            });
        }
        
        if (tags.length > 0) {
            results = results.filter(result => {
                if (result.type === 'process') {
                    const process = dataManager.getProcessById(result.id);
                    return process && process.tags && 
                           tags.some(tag => process.tags.includes(tag));
                }
                return true;
            });
        }
        
        return results;
    }
    
    /**
     * 검색 통계 정보 반환
     */
    getSearchStats() {
        return {
            historyCount: this.searchHistory.length,
            currentResultsCount: this.currentResults.length,
            totalSearchableItems: dataManager.getDataSummary()
        };
    }
}

// 검색 관련 CSS 추가
const searchStyles = `
    .search-results-header {
        padding: 1rem;
        border-bottom: 1px solid var(--border-color);
        background: var(--surface-color);
    }
    
    .search-results-header h4 {
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
        margin-bottom: 0.25rem;
    }
    
    .search-results-header p {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
    }
    
    .search-results-list {
        max-height: 400px;
        overflow-y: auto;
    }
    
    .search-result-item {
        display: flex;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid var(--border-color);
        cursor: pointer;
        transition: var(--transition);
    }
    
    .search-result-item:hover,
    .search-result-item.keyboard-highlighted {
        background: var(--surface-color);
        border-color: var(--primary-color);
    }
    
    .result-icon {
        margin-right: 1rem;
        color: var(--primary-color);
        font-size: 1.25rem;
    }
    
    .result-content {
        flex: 1;
    }
    
    .result-title {
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
        margin-bottom: 0.25rem;
    }
    
    .result-title mark {
        background: var(--primary-color);
        color: white;
        padding: 0.125rem 0.25rem;
        border-radius: 2px;
    }
    
    .result-description {
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
        margin-bottom: 0.5rem;
    }
    
    .result-description mark {
        background: var(--warning-color);
        color: white;
        padding: 0.125rem 0.25rem;
        border-radius: 2px;
    }
    
    .result-path {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: var(--font-size-sm);
        color: var(--text-muted);
        margin-bottom: 0.25rem;
    }
    
    .result-meta {
        display: flex;
        gap: 1rem;
        font-size: var(--font-size-sm);
    }
    
    .result-type {
        color: var(--primary-color);
        font-weight: var(--font-weight-medium);
    }
    
    .result-score {
        color: var(--text-muted);
    }
    
    .result-action {
        margin-left: 1rem;
        color: var(--text-muted);
    }
    
    .no-results,
    .search-error {
        text-align: center;
        padding: 2rem;
        color: var(--text-muted);
    }
    
    .no-results i,
    .search-error i {
        font-size: 2rem;
        margin-bottom: 1rem;
        display: block;
    }
    
    .search-history {
        padding: 1rem;
    }
    
    .search-history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--border-color);
    }
    
    .search-history-header h4 {
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
    }
    
    .clear-history-btn {
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        font-size: var(--font-size-sm);
        transition: var(--transition);
    }
    
    .clear-history-btn:hover {
        color: var(--error-color);
    }
    
    .search-history-item {
        display: flex;
        align-items: center;
        padding: 0.75rem;
        border-radius: var(--border-radius);
        cursor: pointer;
        transition: var(--transition);
        margin-bottom: 0.25rem;
    }
    
    .search-history-item:hover {
        background: var(--surface-color);
    }
    
    .search-history-item i {
        margin-right: 0.75rem;
        color: var(--text-muted);
    }
    
    .history-query {
        flex: 1;
        font-weight: var(--font-weight-medium);
        color: var(--text-primary);
    }
    
    .history-date {
        font-size: var(--font-size-sm);
        color: var(--text-muted);
    }
    
    @media (max-width: 480px) {
        .search-result-item {
            flex-direction: column;
            align-items: flex-start;
        }
        
        .result-icon {
            margin-right: 0;
            margin-bottom: 0.5rem;
        }
        
        .result-action {
            margin-left: 0;
            margin-top: 0.5rem;
        }
        
        .search-history-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
        }
    }
`;

const searchStyleSheet = document.createElement('style');
searchStyleSheet.textContent = searchStyles;
document.head.appendChild(searchStyleSheet);

// 전역 인스턴스 생성
window.searchManager = new SearchManager();