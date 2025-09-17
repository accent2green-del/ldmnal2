// Quick verification script for browser console
console.log('🧪 Fix Verification Script Started');

// Function to test admin login modal X button
function testAdminLoginModal() {
    console.log('\n=== Testing Admin Login Modal X Button ===');
    
    // Navigate to admin panel
    const adminTab = document.getElementById('admin-panel-tab');
    if (!adminTab) {
        console.log('❌ Admin panel tab not found');
        return;
    }
    
    adminTab.click();
    console.log('✅ Clicked admin panel tab');
    
    setTimeout(() => {
        // Find and click admin login button
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
            const loginBtn = adminPanel.querySelector('button');
            if (loginBtn) {
                console.log('✅ Found admin login button, clicking...');
                loginBtn.click();
                
                setTimeout(() => {
                    const modal = document.getElementById('admin-login-modal');
                    const closeBtn = document.getElementById('admin-modal-close');
                    
                    console.log('🔍 Modal elements check:');
                    console.log('- Modal found:', !!modal);
                    console.log('- Close button found:', !!closeBtn);
                    
                    if (modal && closeBtn) {
                        console.log('🧪 Testing X button...');
                        closeBtn.click();
                        
                        setTimeout(() => {
                            const isVisible = modal.style.display !== 'none' && 
                                            !modal.classList.contains('hidden') &&
                                            window.getComputedStyle(modal).display !== 'none';
                            console.log('🎯 Result:', isVisible ? '❌ Modal still visible' : '✅ Modal closed successfully');
                        }, 500);
                    } else {
                        console.log('❌ Required elements not found');
                    }
                }, 1000);
            } else {
                console.log('❌ Login button not found in admin panel');
            }
        } else {
            console.log('❌ Admin panel not found');
        }
    }, 1000);
}

// Function to test category filtering debug
function testCategoryFilteringDebug() {
    console.log('\n=== Testing Category Filtering Debug ===');
    
    // First ensure we're in admin mode
    if (window.adminManager && window.adminManager.showAddProcessModal) {
        console.log('✅ AdminManager available, testing process modal...');
        
        // Trigger the add process modal to see the debug output
        window.adminManager.showAddProcessModal();
        console.log('🧪 Opened add process modal - check console for debug output');
        
        setTimeout(() => {
            // Test department selection if modal is open
            const deptSelect = document.getElementById('process-department');
            if (deptSelect) {
                console.log('✅ Department select found');
                const options = deptSelect.querySelectorAll('option');
                console.log(`📊 Found ${options.length} department options`);
                
                if (options.length > 1) {
                    // Select the second option (first non-placeholder)
                    options[1].selected = true;
                    deptSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('🔄 Triggered department change - check for debug output above');
                }
            } else {
                console.log('❌ Department select not found');
            }
        }, 1000);
    } else {
        console.log('❌ AdminManager not available or not in admin mode');
        console.log('💡 Try running testAdminLoginModal() first and log in');
    }
}

// Quick data structure check
function checkDataStructure() {
    console.log('\n=== Data Structure Check ===');
    
    if (window.dataManager) {
        const departments = window.dataManager.getDepartments();
        const categories = window.dataManager.getCategories();
        
        console.log(`📊 Total departments: ${departments.length}`);
        console.log(`📊 Total categories: ${categories.length}`);
        
        console.log('\n🏢 Department-Category mapping:');
        departments.forEach(dept => {
            const deptCategories = categories.filter(cat => cat.departmentId === dept.id);
            console.log(`- ${dept.name} (${dept.id}): ${deptCategories.length} categories`);
            deptCategories.forEach(cat => {
                console.log(`  └─ ${cat.name} (${cat.id})`);
            });
        });
    } else {
        console.log('❌ DataManager not available');
    }
}

// Make functions globally available
window.testAdminLoginModal = testAdminLoginModal;
window.testCategoryFilteringDebug = testCategoryFilteringDebug;
window.checkDataStructure = checkDataStructure;

console.log('✅ Verification functions loaded:');
console.log('- testAdminLoginModal()      - Test X button fix');
console.log('- testCategoryFilteringDebug() - Test enhanced debugging');
console.log('- checkDataStructure()       - Check data mapping');
console.log('\n💡 Run checkDataStructure() first to verify data is loaded correctly.');