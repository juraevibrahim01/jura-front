import {
    Button,
    initButtonListeners
} from '../../shared/ui/Button/Button.mjs';

import {
    getTestKey
} from '../../api/testkeysapi.mjs';


// ======================================================
// Рендер списка тест-кейсов
// ======================================================

const renderTestCases = (main, items) => {

    // Если тест-кейсов нет
    if (!items || items.length === 0) {

        main.innerHTML = `
            <div class="main-empty">

                <div class="main-empty-content">
                    <h2>No test cases found</h2>

                    <p>
                        There are no test cases available
                        for this project.
                    </p>
                </div>

                <div class="main-empty-add-test-case"></div>

            </div>
        `;

        return;
    }


    // ==================================================
    // Создаём карточки тест-кейсов
    // ==================================================

    const rows = items
        .map((item) => {

            return `
                <div
                    class="tc-card"
                    data-test-case-id="${item.id}"
                >

                    <div class="tc-title">
                        ${item.name}
                    </div>

                    <div class="tc-meta">
                        #${item.id} • ${item.status ?? ''}
                    </div>

                </div>
            `;
        })
        .join('');


    // ==================================================
    // Рендерим список
    // ==================================================

    main.innerHTML = `
        <div class="list-title">

            <h2>
                Test Cases
            </h2>

            ${Button}

        </div>

        <div class="tc-list">
            ${rows}
        </div>
    `;


    // Инициализация кнопок
    initButtonListeners();


    // ==================================================
    // Получаем все карточки
    // ==================================================

    const testCaseCards =
        main.querySelectorAll('.tc-card');

    testCaseCards.forEach((card) => {

        card.addEventListener('click', () => {

            const projectId =
                localStorage.getItem(
                    'activeProjectId'
                );


            const testCaseId =
                card.dataset.testCaseId;


            if (!projectId || !testCaseId) {

                console.error(
                    'Project ID or Test Case ID is missing'
                );

                return;
            }


            const url =
                `/test-case.html?projectId=${encodeURIComponent(projectId)}&testCaseId=${encodeURIComponent(testCaseId)}`;


            window.open(
                url,
                '_blank'
            );

        });

    });
};


// ======================================================
// Рендер панели Test Cases
// ======================================================

export const renderTestCasesPanel = async (
    main,
    loadTestCases
) => {

    if (!main) {
        return;
    }


    // Показываем первоначальный Loading
    main.innerHTML = `
        <div class="main-loading">
            Loading...
        </div>
    `;


    try {

        // Получаем список Test Cases
        const items =
            await loadTestCases();


        // Рендерим список
        renderTestCases(
            main,
            items
        );

    } catch (error) {

        console.error(
            'Error loading test cases:',
            error
        );


        main.innerHTML = `
            <div class="main-error">
                Failed to load test cases
            </div>
        `;

    }

};


// ======================================================
// Рендер модального окна Test Case
// ======================================================

export const renderTestKeys = (
    testCaseData
) => {

    // Проверяем данные
    if (!testCaseData) {

        console.error(
            'Test case data is empty'
        );

        return;
    }


    // Удаляем старую модалку
    const oldModal =
        document.getElementById(
            'testCaseModal'
        );


    if (oldModal) {
        oldModal.remove();
    }


    // ==================================================
    // HTML модального окна
    // ==================================================

    const modalHTML = `
        <div
            id="testCaseModal"
            class="test-case-modal"
        >

            <!-- Overlay -->
            <div class="test-case-modal-overlay"></div>


            <!-- Modal -->
            <div class="test-case-modal-content">


                <!-- Header -->
                <div class="test-case-modal-header">

                    <div>

                        <h2>
                            ${testCaseData.name ?? ''}
                        </h2>

                        <span>
                            #${testCaseData.id ?? ''}
                        </span>

                    </div>


                    <button
                        id="closeTestCaseModal"
                        class="test-case-modal-close"
                    >
                        ×
                    </button>

                </div>


                <!-- Body -->
                <div class="test-case-modal-body">


                    <!-- Date -->
                    <div class="test-case-field">

                        <div class="test-case-label">
                            Date
                        </div>

                        <div class="test-case-value">
                            ${testCaseData.date ?? ''}
                        </div>

                    </div>


                    <!-- Module -->
                    <div class="test-case-field">

                        <div class="test-case-label">
                            Module
                        </div>

                        <div class="test-case-value">
                            ${testCaseData.module ?? ''}
                        </div>

                    </div>


                    <!-- Precondition -->
                    <div class="test-case-field">

                        <div class="test-case-label">
                            Precondition
                        </div>

                        <div class="test-case-value">
                            ${testCaseData.precondition ?? ''}
                        </div>

                    </div>


                    <!-- Steps -->
                    <div class="test-case-field">

                        <div class="test-case-label">
                            Steps
                        </div>

                        <div
                            class="test-case-value test-case-text"
                        >
                            ${testCaseData.steps ?? ''}
                        </div>

                    </div>


                    <!-- Expected Result -->
                    <div class="test-case-field">

                        <div class="test-case-label">
                            Expected Result
                        </div>

                        <div
                            class="test-case-value test-case-text"
                        >
                            ${testCaseData.expectation_res ?? ''}
                        </div>

                    </div>


                    <!-- Actual Result -->
                    <div class="test-case-field">

                        <div class="test-case-label">
                            Actual Result
                        </div>

                        <div
                            class="test-case-value test-case-text"
                        >
                            ${testCaseData.actual_res ?? ''}
                        </div>

                    </div>


                    <!-- Comment -->
                    <div class="test-case-field">

                        <div class="test-case-label">
                            Comment
                        </div>

                        <div
                            class="test-case-value test-case-text"
                        >
                            ${testCaseData.comment ?? ''}
                        </div>

                    </div>


                </div>

            </div>

        </div>
    `;


    // ==================================================
    // Добавляем Modal в body
    // ==================================================

    document.body.insertAdjacentHTML(
        'beforeend',
        modalHTML
    );


    // ==================================================
    // Получаем элементы
    // ==================================================

    const modal =
        document.getElementById(
            'testCaseModal'
        );


    const closeButton =
        document.getElementById(
            'closeTestCaseModal'
        );


    const overlay =
        modal.querySelector(
            '.test-case-modal-overlay'
        );


    // ==================================================
    // Закрытие по кнопке
    // ==================================================

    closeButton.addEventListener(
        'click',
        () => {
            modal.remove();
        }
    );


    // ==================================================
    // Закрытие по overlay
    // ==================================================

    overlay.addEventListener(
        'click',
        () => {
            modal.remove();
        }
    );

};