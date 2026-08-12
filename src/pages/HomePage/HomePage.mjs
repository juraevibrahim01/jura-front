import { TestKeys, TestCaseModal, getTestKeys, getTestKey } from "../../entities/test_keys/TestKeys.mjs";
import { Button } from "../../shared/ui/Button/Button.mjs";

// -------------------------------- HomePage ------------------------------------------------------
export const homePage = `
    <section class="home-page">
        <div class="home-page-status">
            <div class="home-page-status_title">Total</div>
            <span class="home-page-status_value" id="totalCount">0</span>
        </div>

        <div class="home-page-search">
            <input type="text" class="home-page-search_input" placeholder="Search test cases...">
        </div>

        <section class="home-page-test-cases" id="testCasesContainer">
            <div class="test-cases-loading">Loading test cases...</div>

            <div class="home-page-test-cases_not-found">
                <h3>No test cases found.</h3>
                <p>Create your first test case to get started.</p>
                <div class="home-page-test-cases_not-found_button">
                    ${Button}
                </div>
            </div>
        </section>
    </section>
    <div id="modals-container"></div>
`;

export const initHomePage = async () => {
    const testCasesContainer = document.getElementById('testCasesContainer');
    const totalCountElement = document.getElementById('totalCount');
    const modalsContainer = document.getElementById('modals-container');

    if (!testCasesContainer || !totalCountElement || !modalsContainer) {
        return;
    }

    try {
        // Load test cases from API
        const testCases = await getTestKeys();

        // Update total count
        totalCountElement.textContent = testCases.length || 0;

        // Render test cases
        const testCasesHTML = TestKeys(testCases);
        testCasesContainer.innerHTML = testCasesHTML;

        // Setup event listeners for cards
        const cards = testCasesContainer.querySelectorAll('.test-case[data-test-case-id]');

        const openTestCaseModal = async (testCaseId) => {
            try {
                const testCase = await getTestKey(testCaseId);

                if (!testCase) {
                    console.error('Test case not found');
                    return;
                }

                modalsContainer.innerHTML = TestCaseModal(testCase);

                const modal = document.getElementById('testCaseModal');
                const closeButton = modal.querySelector('.modal-close');
                const overlay = modal;

                const closeModal = () => {
                    modal.remove();
                };

                closeButton.addEventListener('click', closeModal);
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        closeModal();
                    }
                });

                const closeOnEscape = (e) => {
                    if (e.key === 'Escape') {
                        closeModal();
                        document.removeEventListener('keydown', closeOnEscape);
                    }
                };

                document.addEventListener('keydown', closeOnEscape);
            } catch (error) {
                console.error('Error opening test case modal:', error);
            }
        };

        cards.forEach((card) => {
            card.addEventListener('click', () => {
                openTestCaseModal(Number(card.dataset.testCaseId));
            });
        });
    } catch (error) {
        console.error('Error initializing home page:', error);
        testCasesContainer.innerHTML = `
            <div class="test-cases-error">
                <p>Failed to load test cases. Please try again later.</p>
            </div>
        `;
    }
};


