/**
 * 콘텐츠 렌더링 모듈
 * 선택된 네비게이션 아이템에 따른 콘텐츠 표시
 */

class ContentRenderer {
    constructor() {
        this.currentContent = null;
        
        // 이벤트 바인딩
        this.bindEvents();
        
        Logger.info('ContentRenderer 초기화 완료');
    }
    
    /**
     * 이벤트 리스너 설정
     */
    bindEvents() {
        // 네비게이션 아이템 선택 시 콘텐츠 렌더링
        EventEmitter.on('navigation:itemSelected', (data) => {
            this.renderContent(data.type, data.id);
        });
        
        // 데이터 초기화 완료 시 홈 화면 표시
        EventEmitter.on('data:initialized', (data) => {
            this.renderHome(data);
        });
        
        // 데이터 업데이트 시 현재 콘텐츠 새로고침
        EventEmitter.on('data:updated', () => {
            if (this.currentContent) {
                this.renderContent(this.currentContent.type, this.currentContent.id);
            }
        });
    }
    
    /**
     * 콘텐츠 렌더링 메인 함수
     */
    renderContent(type, id) {
        const contentContainer = document.getElementById('content-body');
        if (!contentContainer) {
            Logger.error('콘텐츠 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        Logger.info(`📄 콘텐츠 렌더링: ${type} - ${id}`);
        
        // 현재 콘텐츠 저장
        this.currentContent = { type, id };
        
        try {
            switch (type) {
                case 'department':
                    this.renderDepartment(id);
                    break;
                case 'category':
                    this.renderCategory(id);
                    break;
                case 'process':
                    this.renderProcess(id);
                    break;
                default:
                    this.renderHome();
            }
        } catch (error) {
            Logger.error('콘텐츠 렌더링 중 오류:', error);
            this.renderError('콘텐츠를 표시하는 중 오류가 발생했습니다.');
        }
    }
    
    /**
     * 홈 화면 렌더링
     */
    renderHome(data = null) {
        const stats = data ? {
            departments: data.departments.length,
            categories: data.categories.length,
            processes: data.processes.length
        } : dataManager.getDataSummary();
        
        const content = `
            <div class="welcome-section fade-in">
                <div class="welcome-header">
                    <span class="icon icon-home"></span>
                    <h2>도로관리 행정매뉴얼에 오신 것을 환영합니다</h2>
                </div>
                <div class="welcome-content">
                    <p>좌측 메뉴에서 원하시는 업무 분류를 선택하여 관련 매뉴얼을 확인하실 수 있습니다.</p>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <span class="icon icon-building"></span>
                            <h3>부서</h3>
                            <span id="department-count">${stats.departments}</span>
                        </div>
                        <div class="stat-card">
                            <span class="icon icon-list"></span>
                            <h3>카테고리</h3>
                            <span id="category-count">${stats.categories}</span>
                        </div>
                        <div class="stat-card">
                            <span class="icon icon-file"></span>
                            <h3>프로세스</h3>
                            <span id="process-count">${stats.processes}</span>
                        </div>
                    </div>
                    <div class="recent-updates mt-3">
                        <h3>최근 업데이트</h3>
                        <div class="recent-list">
                            ${this.renderRecentUpdates()}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.updateContent(content);
        Logger.info('🏠 홈 화면 렌더링 완료');
    }
    
    /**
     * 부서 상세 화면 렌더링 (실제 데이터 내용 표시)
     */
    renderDepartment(departmentId) {
        const department = dataManager.getDepartmentById(departmentId);
        if (!department) {
            this.renderError('부서를 찾을 수 없습니다.');
            return;
        }
        
        const categories = dataManager.getCategoriesByDepartment(departmentId);
        const totalProcesses = categories.reduce((sum, cat) => {
            return sum + dataManager.getProcessesByCategory(cat.id).length;
        }, 0);
        
        // 부서의 모든 프로세스에서 법적근거 추출
        const allProcesses = categories.flatMap(cat => dataManager.getProcessesByCategory(cat.id));
        const allLegalBasis = [...new Set(
            allProcesses.flatMap(process => process.legalBasis || [])
        )].filter(basis => basis);
        
        // 부서의 주요 태그 추출
        const allTags = [...new Set(
            allProcesses.flatMap(process => process.tags || [])
        )].filter(tag => tag);
        
        const content = `
            <div class="department-content fade-in">
                <div class="department-header">
                    <div class="department-title">
                        <span class="icon icon-building"></span>
                        <h2>${Utils.escapeHtml(department.name)}</h2>
                    </div>
                    <div class="department-meta">
                        <span><span class="icon icon-list"></span> ${categories.length}개 카테고리</span>
                        <span><span class="icon icon-file"></span> ${totalProcesses}개 프로세스</span>
                        <span><span class="icon icon-calendar"></span> ${Utils.formatDate(department.updatedAt)}</span>
                    </div>
                </div>
                
                <div class="department-description">
                    <h3>부서 개요</h3>
                    <div class="description-content">
                        ${Utils.convertNewlinesToBr(department.description || '부서 설명이 없습니다.')}
                    </div>
                    ${department.businessDefinition ? `
                        <div class="business-definition">
                            <h4>📋 상세 업무정의</h4>
                            <div class="definition-content">
                                ${Utils.convertNewlinesToBr(department.businessDefinition)}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                ${allLegalBasis.length > 0 ? `
                    <div class="department-legal">
                        <h3>관련 법적근거</h3>
                        <ul class="legal-list">
                            ${allLegalBasis.slice(0, 10).map(legal => `<li>${Utils.escapeHtml(legal)}</li>`).join('')}
                            ${allLegalBasis.length > 10 ? '<li class="more-items">외 ' + (allLegalBasis.length - 10) + '건 더...</li>' : ''}
                        </ul>
                    </div>
                ` : ''}
                
                ${allTags.length > 0 ? `
                    <div class="department-tags">
                        <h3>주요 업무 분야</h3>
                        <div class="tag-list">
                            ${allTags.slice(0, 15).map(tag => `<span class="tag">${Utils.escapeHtml(tag)}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="department-categories">
                    <h3>업무 카테고리 목록</h3>
                    <div class="category-summary-list">
                        ${categories.map(category => this.renderCategorySummaryCard(category)).join('')}
                    </div>
                </div>
                
                <div class="department-actions">
                    <button class="btn-secondary" onclick="contentRenderer.exportDepartmentData('${departmentId}')">
                        <span class="icon icon-download"></span> 부서 정보 내보내기
                    </button>
                </div>
            </div>
        `;
        
        this.updateContent(content);
        this.attachCategoryCardEvents();
        Logger.info(`🏢 부서 상세 화면 렌더링 완료: ${department.name}`);
    }
    
    /**
     * 카테고리 상세 화면 렌더링 (실제 데이터 내용 표시)
     */
    renderCategory(categoryId) {
        const category = dataManager.getCategoryById(categoryId);
        if (!category) {
            this.renderError('카테고리를 찾을 수 없습니다.');
            return;
        }
        
        const department = dataManager.getDepartmentById(category.departmentId);
        const processes = dataManager.getProcessesByCategory(categoryId);
        
        // 카테고리의 모든 법적근거 추출
        const allLegalBasis = [...new Set(
            processes.flatMap(process => process.legalBasis || [])
        )].filter(basis => basis);
        
        // 카테고리의 모든 산출물 추출
        const allOutputs = [...new Set(
            processes.flatMap(process => process.outputs || [])
        )].filter(output => output);
        
        // 카테고리의 태그 추출
        const allTags = [...new Set(
            processes.flatMap(process => process.tags || [])
        )].filter(tag => tag);
        
        // 최근 업데이트된 프로세스
        const recentProcesses = processes
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 3);
        
        const content = `
            <div class="category-content fade-in">
                <div class="category-header">
                    <div class="category-title">
                        <span class="icon icon-list"></span>
                        <h2>${Utils.escapeHtml(category.name)}</h2>
                    </div>
                    <div class="category-meta">
                        <span><span class="icon icon-building"></span> ${Utils.escapeHtml(department?.name || '')}</span>
                        <span><span class="icon icon-file"></span> ${processes.length}개 프로세스</span>
                        <span><span class="icon icon-calendar"></span> ${Utils.formatDate(category.updatedAt)}</span>
                    </div>
                </div>
                
                <div class="category-description">
                    <h3>카테고리 개요</h3>
                    <div class="description-content">
                        ${Utils.convertNewlinesToBr(category.description || '카테고리 설명이 없습니다.')}
                    </div>
                    ${category.businessDefinition ? `
                        <div class="business-definition">
                            <h4>📋 상세 업무정의</h4>
                            <div class="definition-content">
                                ${Utils.convertNewlinesToBr(category.businessDefinition)}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                ${allLegalBasis.length > 0 ? `
                    <div class="category-legal">
                        <h3>관련 법적근거</h3>
                        <ul class="legal-list">
                            ${allLegalBasis.slice(0, 8).map(legal => `<li>${Utils.escapeHtml(legal)}</li>`).join('')}
                            ${allLegalBasis.length > 8 ? '<li class="more-items">외 ' + (allLegalBasis.length - 8) + '건 더...</li>' : ''}
                        </ul>
                    </div>
                ` : ''}
                
                ${allOutputs.length > 0 ? `
                    <div class="category-outputs">
                        <h3>주요 산출물</h3>
                        <ul class="outputs-list">
                            ${allOutputs.slice(0, 10).map(output => `<li>${Utils.escapeHtml(output)}</li>`).join('')}
                            ${allOutputs.length > 10 ? '<li class="more-items">외 ' + (allOutputs.length - 10) + '건 더...</li>' : ''}
                        </ul>
                    </div>
                ` : ''}
                
                ${allTags.length > 0 ? `
                    <div class="category-tags">
                        <h3>관련 태그</h3>
                        <div class="tag-list">
                            ${allTags.slice(0, 12).map(tag => `<span class="tag">${Utils.escapeHtml(tag)}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="category-processes">
                    <h3>업무 프로세스 목록</h3>
                    ${processes.length > 0 ? 
                        `<div class="process-summary-list">
                            ${processes.map(process => this.renderProcessSummaryCard(process)).join('')}
                        </div>` :
                        '<div class="no-data">등록된 프로세스가 없습니다.</div>'
                    }
                </div>
                
                <div class="category-actions">
                    <button class="btn-secondary" onclick="contentRenderer.exportCategoryData('${categoryId}')">
                        <span class="icon icon-download"></span> 카테고리 정보 내보내기
                    </button>
                </div>
            </div>
        `;
        
        this.updateContent(content);
        this.attachProcessCardEvents();
        Logger.info(`📋 카테고리 상세 화면 렌더링 완료: ${category.name}`);
    }
    
    /**
     * 프로세스 상세 화면 렌더링
     */
    renderProcess(processId) {
        const process = dataManager.getProcessById(processId);
        if (!process) {
            this.renderError('프로세스를 찾을 수 없습니다.');
            return;
        }
        
        const category = dataManager.getCategoryById(process.categoryId);
        const department = dataManager.getDepartmentById(process.departmentId);
        
        const content = `
            <div class="process-content fade-in">
                <div class="process-header">
                    <h2>${Utils.escapeHtml(process.title)}</h2>
                    <div class="process-meta">
                        <span><span class="icon icon-building"></span> ${Utils.escapeHtml(department?.name || '')}</span>
                        <span><span class="icon icon-list"></span> ${Utils.escapeHtml(category?.name || '')}</span>
                        <span><span class="icon icon-calendar"></span> ${Utils.formatDate(process.updatedAt)}</span>
                    </div>
                </div>
                
                <div class="process-description mb-3">
                    <h3>📋 업무 개요</h3>
                    <div class="description-content">${Utils.convertNewlinesToBr(process.description)}</div>
                </div>
                
                ${(process.mainContent && process.mainContent.length > 0) || (typeof process.mainContent === 'string' && process.mainContent.trim()) ? `
                    <div class="process-main-content mb-3">
                        <h3>🎯 주요 업무 내용</h3>
                        <div class="main-content-list">
                            ${Utils.renderMultilineAsCards(process.mainContent)}
                        </div>
                    </div>
                ` : ''}
                
                ${(process.legalBasis && process.legalBasis.length > 0) || (typeof process.legalBasis === 'string' && process.legalBasis.trim()) ? `
                    <div class="process-legal mb-3">
                        <h3>⚖️ 법적 근거</h3>
                        <div class="legal-content">
                            ${Utils.renderMultilineAsList(process.legalBasis, 'ul', '⚖️')}
                        </div>
                    </div>
                ` : ''}
                
                ${(process.outputs && process.outputs.length > 0) || (typeof process.outputs === 'string' && process.outputs.trim()) ? `
                    <div class="process-outputs mb-3">
                        <h3>📄 산출물 및 결과</h3>
                        <div class="outputs-content detail-item-list">
                            ${this.renderItemList(process.outputs, '📝')}
                        </div>
                    </div>
                ` : ''}
                
                ${process.tags && process.tags.length > 0 ? `
                    <div class="process-tags mb-3">
                        <h3>태그</h3>
                        <div class="tag-list">
                            ${process.tags.map(tag => `<span class="tag">${Utils.escapeHtml(tag)}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="process-steps">
                    <h3>처리 단계</h3>
                    <div class="steps-container">
                        ${process.steps && process.steps.length > 0 ? 
                            process.steps.map(step => this.renderProcessStep(step)).join('') :
                            '<div class="no-data">등록된 처리 단계가 없습니다.</div>'
                        }
                    </div>
                </div>
                
                ${process.references && process.references.length > 0 ? `
                    <div class="process-references mt-3">
                        <h3>📚 참고자료 및 관련 문서</h3>
                        <div class="references-enhanced detail-item-list">
                            ${this.renderItemList(process.references, '📚', true)}
                        </div>
                    </div>
                ` : ''}
                
                <div class="process-actions mt-3">
                    <button class="btn-secondary" onclick="window.print()">
                        <span class="icon icon-print"></span> 인쇄
                    </button>
                    <button class="btn-secondary" onclick="contentRenderer.exportProcess('${processId}')">
                        <span class="icon icon-download"></span> 내보내기
                    </button>
                </div>
            </div>
        `;
        
        this.updateContent(content);
        Logger.info(`📄 프로세스 상세 화면 렌더링 완료: ${process.title}`);
    }
    
    /**
     * 카테고리 카드 렌더링
     */
    renderCategoryCard(category) {
        const processCount = dataManager.getProcessesByCategory(category.id).length;
        
        return `
            <div class="category-card" data-category-id="${category.id}">
                <div class="card-header">
                    <span class="icon icon-list"></span>
                    <h4>${Utils.escapeHtml(category.name)}</h4>
                </div>
                <div class="card-body">
                    <p>${Utils.escapeHtml(category.description)}</p>
                    <div class="card-meta">
                        <span><span class="icon icon-file"></span> ${processCount}개 프로세스</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * 프로세스 카드 렌더링
     */
    renderProcessCard(process) {
        const stepsCount = process.steps ? process.steps.length : 0;
        
        return `
            <div class="process-card" data-process-id="${process.id}">
                <div class="card-header">
                    <span class="icon icon-file"></span>
                    <h4>${Utils.escapeHtml(process.title)}</h4>
                </div>
                <div class="card-body">
                    <div class="card-description">${Utils.convertNewlinesToBr(process.description)}</div>
                    <div class="card-meta">
                        <span><span class="icon icon-list"></span> ${stepsCount}개 단계</span>
                        <span><span class="icon icon-calendar"></span> ${Utils.formatDate(process.updatedAt)}</span>
                    </div>
                    ${process.tags && process.tags.length > 0 ? `
                        <div class="card-tags">
                            ${process.tags.slice(0, 3).map(tag => 
                                `<span class="tag-small">${Utils.escapeHtml(tag)}</span>`
                            ).join('')}
                            ${process.tags.length > 3 ? '<span class="tag-small">...</span>' : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * 프로세스 단계 렌더링
     */
    renderProcessStep(step) {
        return `
            <div class="step-item">
                <div class="step-header">
                    <div class="step-number">${step.stepNumber}</div>
                    <div class="step-title">${Utils.escapeHtml(step.title)}</div>
                </div>
                <div class="step-description">
                    <div class="step-overview">
                        <strong>개요:</strong> 
                        <div class="step-content">${Utils.convertNewlinesToBr(step.description)}</div>
                    </div>
                    ${step.details ? `
                        <div class="step-details">
                            <strong>세부사항:</strong> 
                            <div class="step-content">${Utils.convertNewlinesToBr(step.details)}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * 최근 업데이트 렌더링
     */
    renderRecentUpdates() {
        const allProcesses = dataManager.data.processes || [];
        
        // 최근 업데이트된 프로세스 5개
        const recentProcesses = allProcesses
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 5);
        
        if (recentProcesses.length === 0) {
            return '<div class="no-data">최근 업데이트가 없습니다.</div>';
        }
        
        return recentProcesses.map(process => {
            const category = dataManager.getCategoryById(process.categoryId);
            const department = dataManager.getDepartmentById(process.departmentId);
            
            return `
                <div class="recent-item" data-process-id="${process.id}">
                    <div class="recent-title">
                        <span class="icon icon-file"></span>
                        <span>${Utils.escapeHtml(process.title)}</span>
                    </div>
                    <div class="recent-path">
                        ${department?.name} > ${category?.name}
                    </div>
                    <div class="recent-date">
                        ${Utils.formatDate(process.updatedAt)}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * 오류 화면 렌더링
     */
    renderError(message) {
        const content = `
            <div class="error-content text-center">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--error-color); margin-bottom: 1rem;"></i>
                <h3>오류가 발생했습니다</h3>
                <p>${Utils.escapeHtml(message)}</p>
                <button class="btn-primary" onclick="location.reload()">
                    <span class="icon icon-refresh"></span> 새로고침
                </button>
            </div>
        `;
        
        this.updateContent(content);
        Logger.error(`❌ 오류 화면 표시: ${message}`);
    }
    
    /**
     * 콘텐츠 업데이트
     */
    updateContent(html) {
        const contentContainer = document.getElementById('content-body');
        if (contentContainer) {
            contentContainer.innerHTML = html;
        }
    }
    
    /**
     * 카테고리 카드 이벤트 등록
     */
    attachCategoryCardEvents() {
        // 기존 카테고리 카드 이벤트
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const categoryId = card.dataset.categoryId;
                navigationManager.navigateToItem('category', categoryId);
            });
        });
        
        // 새로운 카테고리 요약 카드 이벤트
        document.querySelectorAll('.category-summary-card').forEach(card => {
            card.addEventListener('click', () => {
                const categoryId = card.dataset.categoryId;
                navigationManager.navigateToItem('category', categoryId);
            });
        });
        
        // 최근 업데이트 아이템 이벤트
        document.querySelectorAll('.recent-item').forEach(item => {
            item.addEventListener('click', () => {
                const processId = item.dataset.processId;
                navigationManager.navigateToItem('process', processId);
            });
        });
    }
    
    /**
     * 프로세스 카드 이벤트 등록
     */
    attachProcessCardEvents() {
        // 기존 프로세스 카드 이벤트
        document.querySelectorAll('.process-card').forEach(card => {
            card.addEventListener('click', () => {
                const processId = card.dataset.processId;
                navigationManager.navigateToItem('process', processId);
            });
        });
        
        // 새로운 프로세스 요약 카드 이벤트
        document.querySelectorAll('.process-summary-card').forEach(card => {
            card.addEventListener('click', () => {
                const processId = card.dataset.processId;
                navigationManager.navigateToItem('process', processId);
            });
        });
    }
    
    /**
     * 프로세스 내보내기
     */
    exportProcess(processId) {
        try {
            const process = dataManager.getProcessById(processId);
            if (!process) {
                Utils.showNotification('프로세스를 찾을 수 없습니다.', 'error');
                return;
            }
            
            const category = dataManager.getCategoryById(process.categoryId);
            const department = dataManager.getDepartmentById(process.departmentId);
            
            const exportData = {
                title: process.title,
                description: process.description,
                department: department?.name,
                category: category?.name,
                steps: process.steps,
                tags: process.tags,
                updatedAt: process.updatedAt
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `${process.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            Utils.showNotification('프로세스를 성공적으로 내보냈습니다.', 'success');
            Logger.info(`📤 프로세스 내보내기 완료: ${process.title}`);
            
        } catch (error) {
            Logger.error('프로세스 내보내기 실패:', error);
            Utils.showNotification('프로세스 내보내기 중 오류가 발생했습니다.', 'error');
        }
    }
    
    /**
     * 개별 항목 리스트 렌더링 (새로운 방식)
     */
    renderItemList(items, icon = '•', withAttachment = false) {
        const processedItems = Utils.processItemsWithAttachments(items);
        
        if (processedItems.length === 0) {
            return '<div class="no-data">등록된 항목이 없습니다.</div>';
        }
        
        return processedItems.map((item, index) => {
            const itemText = typeof item === 'string' ? item : (item.text || '');
            const hasAttachment = typeof item === 'object' && item.attachment;
            const attachment = hasAttachment ? item.attachment : null;
            
            return `
                <div class="item-entry">
                    <div class="item-number">${index + 1}</div>
                    <div class="item-text">
                        ${icon} ${Utils.escapeHtml(itemText)}
                    </div>
                    ${withAttachment && hasAttachment ? `
                        <div class="item-attachment">
                            <a href="#" onclick="contentRenderer.downloadAttachment(${index}, '${Utils.escapeHtml(attachment.name)}', '${attachment.data}')" 
                               title="다운로드: ${Utils.escapeHtml(attachment.name)} (${Utils.formatFileSize(attachment.size)})">
                                📎 ${Utils.escapeHtml(attachment.name)}
                            </a>
                            <span class="file-size">(${Utils.formatFileSize(attachment.size)})</span>
                        </div>
                    ` : (withAttachment ? `
                        <div class="item-attachment-placeholder">
                            <span class="no-attachment">첨부파일 없음</span>
                        </div>
                    ` : '')}
                </div>
            `;
        }).join('');
    }

    /**
     * 첨부파일 다운로드
     */
    downloadAttachment(index, filename, base64Data) {
        console.log(`첨부파일 다운로드 시도: ${filename}`);
        
        const success = Utils.downloadBase64File(base64Data, filename);
        if (success) {
            Utils.showNotification(`파일 다운로드 완료: ${filename}`, 'success');
            Logger.info(`📎 첨부파일 다운로드 완료: ${filename}`);
        } else {
            Utils.showNotification(`파일 다운로드 실패: ${filename}`, 'error');
            Logger.error(`❌ 첨부파일 다운로드 실패: ${filename}`);
        }
    }

    /**
     * 개선된 참고자료 아이템 렌더링
     */
    renderReferenceItem(reference) {
        // 참고자료가 개선된 객체 형태인지 확인
        if (typeof reference === 'object' && reference.text) {
            const typeIcon = this.getReferenceTypeIcon(reference.type);
            const priorityClass = this.getReferencePriorityClass(reference.priority);
            
            return `
                <div class="reference-item ${priorityClass}">
                    <div class="reference-header">
                        <span class="reference-icon">${typeIcon}</span>
                        <span class="reference-type">${this.getReferenceTypeName(reference.type)}</span>
                        ${reference.priority <= 3 ? '<span class="priority-badge">중요</span>' : ''}
                    </div>
                    <div class="reference-text">
                        ${reference.isUrl ? 
                            `<a href="${reference.text}" target="_blank" class="reference-link">${Utils.convertNewlinesToBr(reference.text)}</a>` :
                            Utils.convertNewlinesToBr(reference.text)
                        }
                    </div>
                    ${reference.sections && reference.sections.length > 0 ? `
                        <div class="reference-sections">
                            ${reference.sections.map(section => `<span class="section-tag">${Utils.escapeHtml(section)}</span>`).join('')}
                        </div>
                    ` : ''}
                    ${reference.pages && reference.pages.length > 0 ? `
                        <div class="reference-pages">
                            페이지: ${reference.pages.join(', ')}
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            // 기본 텍스트 참고자료
            const referenceText = typeof reference === 'string' ? reference : reference.toString();
            const isUrl = /https?:\/\//.test(referenceText);
            
            return `
                <div class="reference-item basic">
                    <div class="reference-header">
                        <span class="reference-icon">📄</span>
                        <span class="reference-type">문서</span>
                    </div>
                    <div class="reference-text">
                        ${isUrl ? 
                            `<a href="${referenceText}" target="_blank" class="reference-link">${Utils.convertNewlinesToBr(referenceText)}</a>` :
                            Utils.convertNewlinesToBr(referenceText)
                        }
                    </div>
                </div>
            `;
        }
    }
    
    /**
     * 참고자료 유형 아이콘 반환
     */
    getReferenceTypeIcon(type) {
        const icons = {
            legal: '⚖️',
            manual: '📖',
            regulation: '📋',
            document: '📄'
        };
        return icons[type] || '📄';
    }
    
    /**
     * 참고자료 유형명 반환
     */
    getReferenceTypeName(type) {
        const names = {
            legal: '법률',
            manual: '매뉴얼',
            regulation: '규정',
            document: '문서'
        };
        return names[type] || '문서';
    }
    
    /**
     * 참고자료 우선순위 클래스 반환
     */
    getReferencePriorityClass(priority) {
        if (priority <= 2) return 'priority-high';
        if (priority <= 4) return 'priority-medium';
        return 'priority-low';
    }
    
    /**
     * 현재 표시 중인 콘텐츠 정보 반환
     */
    getCurrentContent() {
        return this.currentContent;
    }
    
    /**
     * 카테고리 요약 카드 렌더링 (부서 뷰용)
     */
    renderCategorySummaryCard(category) {
        const processCount = dataManager.getProcessesByCategory(category.id).length;
        
        return `
            <div class="category-summary-card" data-category-id="${category.id}">
                <div class="summary-header">
                    <span class="icon icon-list"></span>
                    <h4>${Utils.escapeHtml(category.name)}</h4>
                    <span class="process-count">${processCount}</span>
                </div>
                <div class="summary-description">
                    <div class="summary-text">${Utils.convertNewlinesToBr((category.description || '').substring(0, 100))}${(category.description || '').length > 100 ? '...' : ''}</div>
                </div>
                <div class="summary-footer">
                    <span class="view-details">자세히 보기 →</span>
                </div>
            </div>
        `;
    }
    
    /**
     * 프로세스 요약 카드 렌더링 (카테고리 뷰용)
     */
    renderProcessSummaryCard(process) {
        const stepsCount = process.steps ? process.steps.length : 0;
        
        return `
            <div class="process-summary-card" data-process-id="${process.id}">
                <div class="summary-header">
                    <span class="icon icon-file"></span>
                    <h4>${Utils.escapeHtml(process.title)}</h4>
                    <span class="steps-count">${stepsCount} 단계</span>
                </div>
                <div class="summary-description">
                    <div class="summary-text">${Utils.convertNewlinesToBr((process.description || '').substring(0, 120))}${(process.description || '').length > 120 ? '...' : ''}</div>
                </div>
                <div class="summary-meta">
                    <span><span class="icon icon-calendar"></span> ${Utils.formatDate(process.updatedAt)}</span>
                    ${process.tags && process.tags.length > 0 ? 
                        `<span class="tag-small">${Utils.escapeHtml(process.tags[0])}</span>` : ''
                    }
                </div>
                <div class="summary-footer">
                    <span class="view-details">프로세스 보기 →</span>
                </div>
            </div>
        `;
    }
    
    /**
     * 부서 데이터 내보내기
     */
    exportDepartmentData(departmentId) {
        try {
            const department = dataManager.getDepartmentById(departmentId);
            if (!department) {
                Utils.showNotification('부서를 찾을 수 없습니다.', 'error');
                return;
            }
            
            const categories = dataManager.getCategoriesByDepartment(departmentId);
            const allProcesses = categories.flatMap(cat => dataManager.getProcessesByCategory(cat.id));
            
            const exportData = {
                department: {
                    name: department.name,
                    description: department.description,
                    createdAt: department.createdAt,
                    updatedAt: department.updatedAt
                },
                categories: categories.map(cat => ({
                    name: cat.name,
                    description: cat.description,
                    processCount: dataManager.getProcessesByCategory(cat.id).length
                })),
                processes: allProcesses.map(proc => ({
                    title: proc.title,
                    description: proc.description,
                    category: categories.find(cat => cat.id === proc.categoryId)?.name,
                    stepsCount: proc.steps ? proc.steps.length : 0,
                    tags: proc.tags
                })),
                summary: {
                    totalCategories: categories.length,
                    totalProcesses: allProcesses.length,
                    exportDate: new Date().toISOString()
                }
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `부서_${department.name.replace(/[^a-zA-Z0-9가-힣]/g, '_')}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            Utils.showNotification('부서 정보를 성공적으로 내보냈습니다.', 'success');
            Logger.info(`📤 부서 데이터 내보내기 완료: ${department.name}`);
            
        } catch (error) {
            Logger.error('부서 데이터 내보내기 실패:', error);
            Utils.showNotification('부서 데이터 내보내기 중 오류가 발생했습니다.', 'error');
        }
    }
    
    /**
     * 카테고리 데이터 내보내기
     */
    exportCategoryData(categoryId) {
        try {
            const category = dataManager.getCategoryById(categoryId);
            if (!category) {
                Utils.showNotification('카테고리를 찾을 수 없습니다.', 'error');
                return;
            }
            
            const department = dataManager.getDepartmentById(category.departmentId);
            const processes = dataManager.getProcessesByCategory(categoryId);
            
            const exportData = {
                category: {
                    name: category.name,
                    description: category.description,
                    department: department?.name,
                    createdAt: category.createdAt,
                    updatedAt: category.updatedAt
                },
                processes: processes.map(proc => ({
                    title: proc.title,
                    description: proc.description,
                    steps: proc.steps,
                    tags: proc.tags,
                    legalBasis: proc.legalBasis,
                    outputs: proc.outputs,
                    references: proc.references,
                    updatedAt: proc.updatedAt
                })),
                summary: {
                    totalProcesses: processes.length,
                    exportDate: new Date().toISOString()
                }
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `카테고리_${category.name.replace(/[^a-zA-Z0-9가-힣]/g, '_')}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            Utils.showNotification('카테고리 정보를 성공적으로 내보냈습니다.', 'success');
            Logger.info(`📤 카테고리 데이터 내보내기 완료: ${category.name}`);
            
        } catch (error) {
            Logger.error('카테고리 데이터 내보내기 실패:', error);
            Utils.showNotification('카테고리 데이터 내보내기 중 오류가 발생했습니다.', 'error');
        }
    }
}

// CSS 추가 스타일 (개선된 UI 스타일 + 멀티라인 지원)
const additionalStyles = `
    /* 멀티라인 데이터 표시 개선 */
    .description-content, 
    .definition-content, 
    .step-content {
        line-height: 1.7;
        color: var(--text-secondary);
    }
    
    .business-definition {
        margin-top: 1.5rem;
        padding: 1rem;
        background: #f8f9fa;
        border-left: 4px solid #6c757d;
        border-radius: 4px;
    }
    
    .business-definition h4 {
        margin: 0 0 0.75rem 0;
        color: #495057;
        font-size: 1rem;
    }
    
    /* 멀티라인 리스트 스타일 */
    .multiline-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    
    .multiline-list li {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 6px;
        transition: all 0.2s ease;
    }
    
    .multiline-list li:hover {
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border-color: #007bff;
    }
    
    .list-icon {
        font-size: 1rem;
        flex-shrink: 0;
        margin-top: 0.1rem;
    }
    
    /* 멀티라인 카드 스타일 */
    .multiline-card-item {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 1rem;
        margin-bottom: 0.75rem;
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        transition: all 0.3s ease;
    }
    
    .multiline-card-item:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        border-color: #007bff;
        transform: translateY(-1px);
    }
    
    .card-number {
        background: linear-gradient(135deg, #007bff, #0056b3);
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 0.9rem;
        flex-shrink: 0;
        box-shadow: 0 2px 4px rgba(0,123,255,0.3);
    }
    
    .card-content {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        flex: 1;
    }
    
    .card-icon {
        font-size: 1.1rem;
        flex-shrink: 0;
        margin-top: 0.1rem;
    }
    
    .card-text {
        color: var(--text-secondary);
        line-height: 1.6;
        flex: 1;
    }
    
    /* 프로세스 단계 개선 */
    .step-overview, 
    .step-details {
        margin-bottom: 0.75rem;
    }
    
    .step-overview strong, 
    .step-details strong {
        color: var(--text-primary);
        display: block;
        margin-bottom: 0.5rem;
    }
    
    .step-content {
        padding-left: 1rem;
        border-left: 2px solid #e9ecef;
    }
    /* 주요 업무 내용 스타일 */
    .process-main-content {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        padding: 1.5rem;
        border-radius: var(--border-radius);
        border-left: 4px solid #007bff;
        margin-bottom: 1.5rem;
    }
    
    .main-content-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .main-content-item {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 1rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        border: 1px solid #e9ecef;
    }
    
    .content-number {
        background: #007bff;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 0.9rem;
        flex-shrink: 0;
    }
    
    .content-text {
        color: var(--text-secondary);
        line-height: 1.6;
        flex: 1;
    }
    
    /* 개선된 참고자료 스타일 */
    .references-enhanced {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .reference-item {
        background: white;
        border-radius: 8px;
        padding: 1rem;
        border: 1px solid #e9ecef;
        transition: all 0.2s ease;
    }
    
    .reference-item:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        border-color: #007bff;
    }
    
    .reference-item.priority-high {
        border-left: 4px solid #dc3545;
    }
    
    .reference-item.priority-medium {
        border-left: 4px solid #ffc107;
    }
    
    .reference-item.priority-low {
        border-left: 4px solid #6c757d;
    }
    
    .reference-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
    }
    
    .reference-icon {
        font-size: 1.2rem;
    }
    
    .reference-type {
        font-size: 0.85rem;
        color: #6c757d;
        background: #f8f9fa;
        padding: 0.2rem 0.6rem;
        border-radius: 12px;
        font-weight: 500;
    }
    
    .priority-badge {
        background: #dc3545;
        color: white;
        font-size: 0.75rem;
        padding: 0.2rem 0.5rem;
        border-radius: 10px;
        margin-left: auto;
        font-weight: bold;
    }
    
    .reference-text {
        color: var(--text-secondary);
        line-height: 1.6;
        margin-bottom: 0.5rem;
    }
    
    .reference-link {
        color: #007bff;
        text-decoration: none;
        border-bottom: 1px dotted #007bff;
    }
    
    .reference-link:hover {
        color: #0056b3;
        text-decoration: none;
        border-bottom-style: solid;
    }
    
    .reference-sections {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
        flex-wrap: wrap;
    }
    
    .section-tag {
        background: #e9ecef;
        color: #495057;
        font-size: 0.75rem;
        padding: 0.2rem 0.5rem;
        border-radius: 12px;
        border: 1px solid #dee2e6;
    }
    
    .reference-pages {
        font-size: 0.85rem;
        color: #6c757d;
        margin-top: 0.5rem;
        font-style: italic;
    }
    
    /* 산출물 스타일 개선 */
    .process-outputs .outputs-list li {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f8f9fa;
    }
    
    .output-icon {
        font-size: 1.1rem;
    }
    
    /* 프로세스 헤더 개선 */
    .process-header h2::before {
        content: '⚡';
        margin-right: 0.5rem;
    }
    
    .process-description h3::before,
    .process-main-content h3::before,
    .process-legal h3::before,
    .process-outputs h3::before,
    .process-references h3::before {
        margin-right: 0.5rem;
    }
    
    /* 반응형 디자인 */
    @media (max-width: 768px) {
        .main-content-item {
            flex-direction: column;
            text-align: center;
        }
        
        .content-number {
            align-self: center;
        }
        
        .reference-sections {
            justify-content: center;
        }
    }
    
    .category-cards, .process-cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }
    
    .category-card, .process-card {
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        padding: 1.5rem;
        cursor: pointer;
        transition: var(--transition);
    }
    
    .category-card:hover, .process-card:hover {
        box-shadow: var(--box-shadow-lg);
        transform: translateY(-2px);
        border-color: var(--primary-color);
    }
    
    .card-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
    }
    
    .card-header i {
        color: var(--primary-color);
        font-size: 1.25rem;
    }
    
    .card-header h4 {
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
        margin: 0;
    }
    
    .card-body p {
        color: var(--text-secondary);
        margin-bottom: 1rem;
    }
    
    .card-meta {
        display: flex;
        gap: 1rem;
        font-size: var(--font-size-sm);
        color: var(--text-muted);
    }
    
    .card-meta span {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
    
    .card-tags {
        margin-top: 0.75rem;
    }
    
    .tag, .tag-small {
        display: inline-block;
        background: var(--primary-color);
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: var(--font-size-sm);
        margin-right: 0.5rem;
        margin-bottom: 0.25rem;
    }
    
    .tag-small {
        font-size: 0.75rem;
        padding: 0.125rem 0.375rem;
    }
    
    .recent-updates h3 {
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
        margin-bottom: 1rem;
    }
    
    .recent-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        margin-bottom: 0.5rem;
        cursor: pointer;
        transition: var(--transition);
    }
    
    .recent-item:hover {
        background: var(--surface-color);
        border-color: var(--primary-color);
    }
    
    .recent-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: var(--font-weight-medium);
        color: var(--text-primary);
    }
    
    .recent-path {
        font-size: var(--font-size-sm);
        color: var(--text-muted);
    }
    
    .recent-date {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
    }
    
    .legal-list,
    .outputs-list,
    .references-list {
        list-style-type: disc;
        margin-left: 1.5rem;
        margin-top: 0.75rem;
    }
    
    .legal-list li,
    .outputs-list li,
    .references-list li {
        color: var(--text-secondary);
        margin-bottom: 0.5rem;
        line-height: 1.6;
    }
    
    .process-legal,
    .process-outputs,
    .process-references {
        background: var(--surface-color);
        padding: 1rem;
        border-radius: var(--border-radius);
        border-left: 4px solid var(--accent-color);
    }
    
    .process-legal h3,
    .process-outputs h3,
    .process-references h3 {
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
        margin-bottom: 0.75rem;
    }
    
    .no-data {
        text-align: center;
        padding: 2rem;
        color: var(--text-muted);
        font-style: italic;
    }
    
    @media (max-width: 768px) {
        .category-cards, .process-cards {
            grid-template-columns: 1fr;
        }
        
        .recent-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }
    }
`;

// 스타일 추가
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// 전역 인스턴스 생성
try {
    window.contentRenderer = new ContentRenderer();
    Logger.info('🎨 ContentRenderer 전역 인스턴스 생성 완료');
} catch (error) {
    Logger.error('❌ ContentRenderer 전역 인스턴스 생성 실패:', error);
    throw error;
}