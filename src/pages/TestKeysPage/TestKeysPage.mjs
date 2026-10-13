import { getTestKey } from '../../api/testkeysapi.mjs';


// ======================================================
// Получаем main
// ======================================================

const main =
    document.getElementById(
        'testCasePage'
    );


// ======================================================
// Получаем параметры URL
// ======================================================

const params =
    new URLSearchParams(
        window.location.search
    );


const projectId =
    params.get('projectId');


const testCaseId =
    params.get('testCaseId');

const categoryId =
    params.get('categoryId')
        || (projectId ? localStorage.getItem(`activeCategoryId_${projectId}`) : null);

const subcategoryId =
    params.get('subcategoryId')
        || (projectId && categoryId ? localStorage.getItem(`activeSubcategoryId_${projectId}_${categoryId}`) : null);

// ======================================================
// Проверяем параметры
// ======================================================

if (!projectId || !testCaseId) {

    main.innerHTML = `
        <div class="main-error">

            <h2>
                Test Case not found
            </h2>

            <p>
                Project ID or Test Case ID is missing.
            </p>

        </div>
    `;

} else {

    loadTestCase();

}


// ======================================================
// Получение Test Case
// ======================================================

async function loadTestCase() {

    try {

        const response =
            await getTestKey(
                projectId,
                Number(testCaseId),
                subcategoryId,
                categoryId
            );


        console.log(
            'Test Case response:',
            response
        );

        const testCase =
            response?.test_key
                ?? response?.data?.test_key
                ?? response?.data
                ?? response;


        if (
            !testCase
        ) {

            throw new Error(
                'Test Case not found'
            );

        }


        renderTestCase(
            testCase
        );


    } catch (error) {

        console.error(
            'Error loading Test Case:',
            error
        );


        main.innerHTML = `
            <div class="main-error">

                <h2>
                    Failed to load Test Case
                </h2>

                <p>
                    Please try again later.
                </p>

            </div>
        `;

    }

}


// ======================================================
// Нормализация ответа API
// ======================================================

function normalizeTestCase(testCase) {

    if (!testCase || typeof testCase !== 'object') {
        return {};
    }

    return {
        id: testCase.id ?? testCase.ID ?? testCase.test_case_id ?? testCase.testCaseId ?? '',
        name: testCase.name ?? testCase.Name ?? testCase.title ?? '',
        date: testCase.date ?? testCase.Date ?? testCase.created_at ?? testCase.createdAt ?? '',
        module: testCase.module ?? testCase.Module ?? '',
        precondition: testCase.precondition ?? testCase.Precondition ?? '',
        steps: testCase.steps ?? testCase.Steps ?? '',
        expectation_res: testCase.expectation_res ?? testCase.ExpectationRes ?? testCase.expected_result ?? testCase.ExpectedResult ?? '',
        actual_res: testCase.actual_res ?? testCase.ActualRes ?? testCase.actual_result ?? testCase.ActualResult ?? '',
        comment: testCase.comment ?? testCase.Comment ?? '',
        status: testCase.status ?? testCase.Status ?? ''
    };

}


// ======================================================
// Рендер Test Case
// ======================================================

function renderTestCase(testCase) {

    const normalizedTestCase = normalizeTestCase(testCase);

    main.innerHTML = `

        <div class="test-case-page">

            <div class="test-case-page-header">

                <div>

                    <span class="test-case-id">
                        #${normalizedTestCase.id ?? ''}
                    </span>

                    <h2>
                        ${normalizedTestCase.name ?? ''}
                    </h2>

                </div>

            </div>


            <div class="test-case-body">


                <div class="test-case-field">

                    <div class="test-case-label">
                        Date
                    </div>

                    <div class="test-case-value">
                        ${
                            normalizedTestCase.date
                                ? new Date(
                                    normalizedTestCase.date
                                ).toLocaleDateString()
                                : ''
                        }
                    </div>

                </div>


                <div class="test-case-field">

                    <div class="test-case-label">
                        Module
                    </div>

                    <div class="test-case-value">
                        ${normalizedTestCase.module ?? ''}
                    </div>

                </div>


                <div class="test-case-field">

                    <div class="test-case-label">
                        Precondition
                    </div>

                    <div class="test-case-value">
                        ${normalizedTestCase.precondition ?? ''}
                    </div>

                </div>


                <div class="test-case-field">

                    <div class="test-case-label">
                        Steps
                    </div>

                    <div class="test-case-value">
                        ${normalizedTestCase.steps ?? ''}
                    </div>

                </div>


                <div class="test-case-field">

                    <div class="test-case-label">
                        Expected Result
                    </div>

                    <div class="test-case-value">
                        ${normalizedTestCase.expectation_res ?? ''}
                    </div>

                </div>


                <div class="test-case-field">

                    <div class="test-case-label">
                        Actual Result
                    </div>

                    <div class="test-case-value">
                        ${normalizedTestCase.actual_res ?? ''}
                    </div>

                </div>


                <div class="test-case-field">

                    <div class="test-case-label">
                        Comment
                    </div>

                    <div class="test-case-value">
                        ${normalizedTestCase.comment ?? ''}
                    </div>

                </div>


            </div>

        </div>

    `;

}