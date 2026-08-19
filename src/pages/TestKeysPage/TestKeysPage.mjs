import {
    getTestKey
} from '../../api/testkeysapi.mjs';


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
                Number(testCaseId)
            );


        console.log(
            'Test Case response:',
            response
        );


        if (
            !response ||
            !response.test_key
        ) {

            throw new Error(
                'Test Case not found'
            );

        }


        renderTestCase(
            response.test_key
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
// Рендер Test Case
// ======================================================

function renderTestCase(testCase) {

    main.innerHTML = `

        <div class="test-case-page">

            <div class="test-case-page-header">

                <div>

                    <span class="test-case-id">
                        #${testCase.id ?? ''}
                    </span>

                    <h2>
                        ${testCase.name ?? ''}
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
                            testCase.date
                                ? new Date(
                                    testCase.date
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
                        ${testCase.module ?? ''}
                    </div>

                </div>


                <div class="test-case-field">

                    <div class="test-case-label">
                        Precondition
                    </div>

                    <div class="test-case-value">
                        ${testCase.precondition ?? ''}
                    </div>

                </div>


                <div class="test-case-field">

                    <div class="test-case-label">
                        Steps
                    </div>

                    <div class="test-case-value">
                        ${testCase.steps ?? ''}
                    </div>

                </div>


                <div class="test-case-field">

                    <div class="test-case-label">
                        Expected Result
                    </div>

                    <div class="test-case-value">
                        ${testCase.expectation_res ?? ''}
                    </div>

                </div>


                <div class="test-case-field">

                    <div class="test-case-label">
                        Actual Result
                    </div>

                    <div class="test-case-value">
                        ${testCase.actual_res ?? ''}
                    </div>

                </div>


                <div class="test-case-field">

                    <div class="test-case-label">
                        Comment
                    </div>

                    <div class="test-case-value">
                        ${testCase.comment ?? ''}
                    </div>

                </div>


            </div>

        </div>

    `;

}