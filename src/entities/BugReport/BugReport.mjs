// ----------------------- bug reports -----------------------

export const BugReports = (bugReports = []) => {

    if (
        !Array.isArray(bugReports) ||
        bugReports.length === 0
    ) {
        return `
            <div class="bug-reports-list bug-reports-list_empty">

                <div class="bug-report bug-report_empty">

                    <span>
                        No bug reports yet
                    </span>

                </div>

            </div>
        `;
    }

    const cards = bugReports
        .map((bugReport) => `
            <button
                type="button"
                class="bug-report"
                data-bug-report-id="${bugReport.id}"
            >
                <div class="bug-report_top">

                    <span class="bug-report_id">
                        #${bugReport.id}
                    </span>

                    <span class="bug-report_date">
                        ${
                            bugReport.date
                                ? new Date(
                                    bugReport.date
                                ).toLocaleDateString()
                                : ''
                        }
                    </span>

                </div>


                <h4 class="bug-report_title">
                    ${bugReport.name ?? ''}
                </h4>

                <p class="bug-report_module">
                    ${bugReport.module ?? ''}
                </p>

            </button>

        `)
        .join('');

    return `
        <div class="bug-reports-list">

            ${cards}

        </div>
    `;
};

// ----------------------- create bug report modal -----------------------

export const createBugReportModal = () => {

    return `

        <div
            id="bugReportModal"
            class="modal-overlay"
        >

            <div class="modal-content">

                <div class="modal-header">

                    <h2>
                        Create New Bug Report
                    </h2>

                    <button
                        type="button"
                        class="modal-close"
                        id="closeBugReportModal"
                    >
                        ×
                    </button>

                </div>


                <div class="modal-body">


                    <form id="bugReportForm">


                        <div class="form-group">

                            <label for="bugReportName">
                                Name *
                            </label>

                            <input
                                type="text"
                                id="bugReportName"
                                name="Name"
                                required
                                placeholder="Bug report name"
                            />

                        </div>

                        <div class="form-group">

                            <label for="bugReportModule">
                                Module *
                            </label>

                            <input
                                type="text"
                                id="bugReportModule"
                                name="Module"
                                required
                                placeholder="Module name"
                            />

                        </div>

                        <div class="form-group">

                            <label for="bugReportPrecondition">
                                Precondition
                            </label>

                            <textarea
                                id="bugReportPrecondition"
                                name="Precondition"
                                placeholder="Precondition"
                            ></textarea>

                        </div>

                        <div class="form-group">

                            <label for="bugReportSteps">
                                Steps *
                            </label>

                            <textarea
                                id="bugReportSteps"
                                name="Steps"
                                required
                                placeholder="Steps to reproduce the bug"
                            ></textarea>

                        </div>

                        <div class="form-group">

                            <label for="bugReportExpectation">
                                Expected Result *
                            </label>

                            <textarea
                                id="bugReportExpectation"
                                name="ExpectationRes"
                                required
                                placeholder="Expected result"
                            ></textarea>

                        </div>

                        <div class="form-group">

                            <label for="bugReportActual">
                                Actual Result *
                            </label>

                            <textarea
                                id="bugReportActual"
                                name="ActualRes"
                                required
                                placeholder="Actual result"
                            ></textarea>

                        </div>

                        <div class="form-group">

                            <label for="bugReportComment">
                                Comment
                            </label>

                            <textarea
                                id="bugReportComment"
                                name="Comment"
                                placeholder="Comment"
                            ></textarea>

                        </div>

                        <div class="form-actions">

                            <button
                                type="submit"
                                class="btn-primary"
                            >
                                Create Bug Report
                            </button>

                            <button
                                type="button"
                                class="btn-secondary"
                                id="cancelBugReportModal"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
};