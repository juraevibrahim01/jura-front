import { Button, initButtonListeners } from '../../shared/ui/Button/Button.mjs';
import { getTestKey } from '../../api/testkeysapi.mjs';


// Отрендерить список тест-кейсов или пустое сообщение
const renderTestCases = (main, items) => {
    if (!items || items.length === 0) {
        // Если тест-кейсов нет → показать пустое состояние с кнопкой "Добавить"
        main.innerHTML = `
            <div class="main-empty">
                <div class="main-empty-content">
                    <h2>No test cases found</h2>
                    <p>There are no test cases available for this project.</p>
                </div>
                <div class="main-empty-add-test-case"></div>
            </div>
            `;   
        return;
    }
    // Если тест-кейсы есть → отрендерить список с ID для клика
    const rows = items.map((item) => `
        <div class="tc-card" data-test-case-id="${item.id}">
            <div class="tc-title">${item.name}</div>
            <div class="tc-meta">#${item.id} • ${item.status}</div>
        </div>
    `).join('');


    main.innerHTML = `
        <div class="list-title">
            <h2>Test Cases</h2>
            ${Button}
        </div>
        <div class="tc-list">${rows}</div>
    `;

    initButtonListeners();
    
    // Добавить обработчик клика на каждый тест-кейс для загрузки его деталей
    const testCaseCards = main.querySelectorAll('.tc-card');
    testCaseCards.forEach((card) => {
        card.addEventListener('click', async () => {
            const project_id = localStorage.getItem("activeProjectId");
            const testCaseId = Number(card.dataset.testCaseId);
            if (testCaseId) {
                try {
                    const testCaseData = await getTestKey(project_id, testCaseId);
                    renderTestKeys(testCaseData.test_key);
                } catch (error) {
                    console.error('Error loading test case:', error);
                }
            }
        });
    });
};

// Отрендерить панель с тест-кейсами
export const renderTestCasesPanel = async (main, loadTestCases) => {
    if (!main) return;
    main.innerHTML = '<div class="main-loading">Loading...</div>';

    try {
        // Загрузить тест-кейсы (без query параметра)
        const items = await loadTestCases();
        renderTestCases(main, items);
    } catch (err) {
        main.innerHTML = '<div class="main-error">Failed to load test cases</div>';
    }
};

// Отрендить модальное для тест кейса
export const renderTestKeys = (testCaseData) => {
    if (!testCaseData) {
        const tclist = document.getElementsByClassName(".tc-list");
        tclist.innerHTML = '<div class="main-loading">Loading...</div>';
    } else {
        const oldModal = document.getElementById('testCaseModal');
            if (oldModal) {
                    oldModal.remove();
                }

        try {
            const modalHTML = `
                <div id="testCaseModal" class="test-case-modal">
                    <div class="test-case-modal-overlay"></div>

                    <div class="test-case-modal-content">

                        <div class="test-case-modal-header">
                            <div>
                                <h2>${testCaseData.name}</h2>
                                <span>#${testCaseData.id}</span>
                            </div>

                            <button 
                                id="closeTestCaseModal"
                                class="test-case-modal-close"
                            >
                                ×
                            </button>
                        </div>

                        <div class="test-case-modal-body">

                            <div class="test-case-field">
                                <div class="test-case-label">Date</div>
                                <div class="test-case-value">
                                    ${testCaseData.date}
                                </div>
                            </div>

                            <div class="test-case-field">
                                <div class="test-case-label">Module</div>
                                <div class="test-case-value">
                                    ${testCaseData.module}
                                </div>
                            </div>

                            <div class="test-case-field">
                                <div class="test-case-label">Precondition</div>
                                <div class="test-case-value">
                                    ${testCaseData.precondition}
                                </div>
                            </div>

                            <div class="test-case-field">
                                <div class="test-case-label">Steps</div>
                                <div class="test-case-value test-case-text">
                                    ${testCaseData.steps}
                                </div>
                            </div>

                            <div class="test-case-field">
                                <div class="test-case-label">Expected Result</div>
                                <div class="test-case-value test-case-text">
                                    ${testCaseData.expectation_res}
                                </div>
                            </div>

                            <div class="test-case-field">
                                <div class="test-case-label">Actual Result</div>
                                <div class="test-case-value test-case-text">
                                    ${testCaseData.actual_res}
                                </div>
                            </div>

                            <div class="test-case-field">
                                <div class="test-case-label">Comment</div>
                                <div class="test-case-value test-case-text">
                                    ${testCaseData.comment}
                                </div>
                            </div>

                        </div>

                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);

            const modal = document.getElementById('testCaseModal');

            const closeButton = document.getElementById('closeTestCaseModal');

            const overlay = modal.querySelector('.test-case-modal-overlay');

            closeButton.addEventListener('click', () => {
                modal.remove();
            });

            overlay.addEventListener('click', () => {
                modal.remove();
            });

            console.log('Modal создан');
        } catch (err) {
            console.log(err);
        }
    }
};