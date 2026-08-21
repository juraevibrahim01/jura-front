import { getBugReport } from "../../api/bagreportapi.mjs";

// ======================================================
// Получаем main
// ======================================================

const main =
    document.getElementById(
        'bugReportPage'
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

const bugReportId =
    params.get('tickets');

// ======================================================
// Проверяем параметры
// ======================================================

if (!projectId || !bugReportId) {
    main.innerHTML = `
        <div class="main-error">

            <h2>
                Bug Report not found
            </h2>

            <p>
                Project ID or Bug Report ID is missing.
            </p>

        </div>
    `;

} else {

    loadBugReport();

}

// ======================================================
// Получение Bug Report
// ======================================================

async function loadBugReport() {

    try {

        const response =
            await getBugReport(
                projectId,
                Number(bugReportId)
            );

        console.log(
            'Bug Report response:',
            response
        );

        if (
            !response ||
            !response.tickets
        ) {

            throw new Error(
                'Bug Report not found'
            );

        }

        renderBugReport(
            response.tickets
        );

    } catch (error) {
        console.error(
            'Error loading Bug Report:',
            error
        );

        main.innerHTML = `
            <div class="main-error">
                <h2>
                    Failed to load Bug Report
                </h2>
                <p>
                    Please try again later.
                </p>
            </div>
        `;

    }

}


// ======================================================
// Рендер Bug Report
// ======================================================

function renderBugReport(bugReport) {

    console.log(bugReport);
    main.innerHTML = `

        <div class="bug-report-page">

            <div class="bug-report-page-header">

                <div>

                    <span class="bug-report-id">
                        #${bugReport.id ?? ''}
                    </span>

                    <h2>
                        ${bugReport.title ?? ''}
                    </h2>

                </div>

            </div>


            <div class="bug-report-body">


                <div class="bug-report-field">

                    <div class="bug-report-label">
                        Date
                    </div>

                    <div class="bug-report-value">
                        ${
                            bugReport.created_at
                                ? new Date(
                                    bugReport.date
                                ).toLocaleDateString()
                                : ''
                        }
                    </div>

                </div>


                <div class="bug-report-field">

                    <div class="bug-report-label">
                        Module
                    </div>

                    <div class="bug-report-value">
                        ${bugReport.module ?? ''}
                    </div>

                </div>


                <div class="bug-report-field">

                    <div class="bug-report-label">
                        Precondition
                    </div>

                    <div class="bug-report-value">
                        ${bugReport.environment ?? ''}
                    </div>

                </div>


                <div class="bug-report-field">

                    <div class="bug-report-label">
                        Steps
                    </div>

                    <div class="bug-report-value">
                        ${bugReport.steps ?? ''}
                    </div>

                </div>


                <div class="bug-report-field">

                    <div class="bug-report-label">
                        Expected Result
                    </div>

                    <div class="bug-report-value">
                        ${bugReport.expectation_result ?? ''}
                    </div>

                </div>


                <div class="bug-report-field">

                    <div class="bug-report-label">
                        Actual Result
                    </div>

                    <div class="bug-report-value">
                        ${bugReport.actual_result ?? ''}
                    </div>

                </div>


                <div class="bug-report-field">

                    <div class="bug-report-label">
                        Comment
                    </div>

                    <div class="bug-report-value">
                        ${bugReport.comment ?? ''}
                    </div>

                </div>


            </div>

        </div>

    `;

}