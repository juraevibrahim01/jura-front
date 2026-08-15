// ----------------------- test keys -----------------------
export const TestKeys = (testCases = []) => {
    if (!Array.isArray(testCases) || testCases.length === 0) {
        return `
            <div class="test-cases-list test-cases-list_empty">
                <div class="test-case test-case_empty">
                    <span>No test cases yet</span>
                </div>
            </div>
        `;
    }

    const cards = testCases.map((testCase) => `
        <button
            type="button"
            class="test-case"
            data-test-case-id="${testCase.id}"
        >
            <div class="test-case_top">
                <span class="test-case_id">#${testCase.id}</span>
                <span class="test-case_date">${new Date(testCase.date).toLocaleDateString()}</span>
            </div>
            <h4 class="test-case_title">${testCase.name}</h4>
            <p class="test-case_module">${testCase.module}</p>
        </button>
    `).join('');

    return `
        <div class="test-cases-list">
            ${cards}
        </div>
    `;
};

// ----------------------- test case modal -----------------------
export const TestCaseModal = (testCase) => {
    if (!testCase) {
        return '';
    }

    return `
        <div class="modal-overlay" id="testCaseModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${testCase.test_key.name}</h2>
                    <button type="button" class="modal-close" aria-label="Close">×</button>
                </div>
                <div class="modal-body">
                    <div class="modal-meta">
                        <div class="modal-meta_item">
                            <span class="modal-meta_label">Module</span>
                            <span class="modal-meta_value">${testCase.test_key.module}</span>
                        </div>
                        <div class="modal-meta_item">
                            <span class="modal-meta_label">Date</span>
                            <span class="modal-meta_value">${new Date(testCase.test_key.date).toLocaleDateString()}</span>
                        </div>
                    </div>
                    
                    <div class="modal-section">
                        <h3 class="modal-section_title">Precondition</h3>
                        <p class="modal-section_content">${testCase.test_key.precondition}</p>
                    </div>
                    
                    <div class="modal-section">
                        <h3 class="modal-section_title">Steps</h3>
                        <p class="modal-section_content">${testCase.test_key.steps}</p>
                    </div>
                    
                    <div class="modal-section">
                        <h3 class="modal-section_title">Expected Result</h3>
                        <p class="modal-section_content">${testCase.test_key.expectation_res}</p>
                    </div>
                    
                    <div class="modal-section">
                        <h3 class="modal-section_title">Actual Result</h3>
                        <p class="modal-section_content">${testCase.test_key.actual_res}</p>
                    </div>
                    
                    <div class="modal-section">
                        <h3 class="modal-section_title">Comment</h3>
                        <p class="modal-section_content">${testCase.test_key.comment}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
};


export const createTestKeyModal = () => {
    return `
        <div id="testKeyModal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Create New Test Case</h2>
                    <button type="button" class="modal-close" id="closeModal">×</button>
                </div>
                <div class="modal-body">
                    <form id="testKeyForm">
                        <div class="form-group">
                            <label for="testKeyName">Name *</label>
                            <input type="text" id="testKeyName" name="Name" required placeholder="Test case name" />
                        </div>
                        
                        <div class="form-group">
                            <label for="testKeyModule">Module *</label>
                            <input type="text" id="testKeyModule" name="Module" required placeholder="Module name" />
                        </div>
                        
                        <div class="form-group">
                            <label for="testKeyPrecondition">Precondition *</label>
                            <textarea id="testKeyPrecondition" name="Precondition" required placeholder="Precondition"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="testKeySteps">Steps *</label>
                            <textarea id="testKeySteps" name="Steps" required placeholder="Steps"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="testKeyExpectation">Expected Result *</label>
                            <textarea id="testKeyExpectation" name="ExpectationRes" required placeholder="Expected result"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="testKeyActual">Actual Result</label>
                            <textarea id="testKeyActual" name="ActualRes" placeholder="Actual result"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="testKeyComment">Comment</label>
                            <textarea id="testKeyComment" name="Comment" placeholder="Comment"></textarea>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">Create Test Case</button>
                            <button type="button" class="btn-secondary" id="cancelModal">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
};
