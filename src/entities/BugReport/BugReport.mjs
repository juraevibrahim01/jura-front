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

                            <label for="bugReportTitle">
                                Title *
                            </label>

                            <input
                                type="text"
                                id="bugReportTitle"
                                name="title"
                                required
                                placeholder="Bug report title"
                            />

                        </div>

                        <div class="form-group">

                            <label for="bugReportPriority">
                                Priority
                            </label>

                            <select id="bugReportPriority" name="priority">
                                <option value="Low">Low</option>
                                <option value="Medium" selected>Medium</option>
                                <option value="High">High</option>
                            </select>

                        </div>

                        <div class="form-group">

                            <label for="bugReportSeverity">
                                Severity
                            </label>

                            <select id="bugReportSeverity" name="severity">
                                <option value="Minor">Minor</option>
                                <option value="Normal" selected>Normal</option>
                                <option value="Critical">Critical</option>
                            </select>

                        </div>

                        <div class="form-group">

                            <label for="bugReportEnvironment">
                                Environment
                            </label>

                            <textarea
                                id="bugReportEnvironment"
                                name="environment"
                                placeholder="Environment / Precondition"
                            ></textarea>

                        </div>

                        <div class="form-group">

                            <label for="bugReportSteps">
                                Steps *
                            </label>

                            <textarea
                                id="bugReportSteps"
                                name="steps"
                                required
                                placeholder="Steps to reproduce the bug"
                            ></textarea>

                        </div>

                        <div class="form-group">

                            <label for="bugReportExpected">
                                Expected Result *
                            </label>

                            <textarea
                                id="bugReportExpected"
                                name="expected_result"
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
                                name="actual_result"
                                required
                                placeholder="Actual result"
                            ></textarea>

                        </div>

                        <div class="form-group">

                            <label for="bugReportAttachments">
                                Attachments
                            </label>

                            <input
                                type="text"
                                id="bugReportAttachments"
                                name="attachments"
                                placeholder="Attachment URLs or comma-separated list"
                            />

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