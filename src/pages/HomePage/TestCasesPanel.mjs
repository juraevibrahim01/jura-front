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
            const testCaseId = card.getAttribute('data-test-case-id');
            if (testCaseId) {
                try {
                    // Загрузить детали конкретного тест-кейса (будет query параметр)
                    const testCaseData = await getTestKey(project_id, testCaseId);
                    console.log('Test case data:', testCaseData);
                    // TODO: Показать детали в модалке
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
