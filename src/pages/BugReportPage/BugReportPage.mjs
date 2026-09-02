import { getBugReport } from '../../api/bagreportapi.mjs';

const main = document.getElementById('bugReportPage');

const renderBugReport = (bugReport) => {
    const created = bugReport.created_at ?? bugReport.date ?? bugReport.createdAt ?? '';
    const createdDisplay = created ? new Date(created).toLocaleString() : '';

    main.innerHTML = `
        <div class="bug-report-page">
            <div class="bug-report-page-header">
                <div>
                    <span class="bug-report-id">#${bugReport.id ?? ''}</span>
                    <h2>${bugReport.title ?? ''}</h2>
                </div>
            </div>

            <div class="bug-report-body">
                <div class="bug-report-field">
                    <div class="bug-report-label">Created At</div>
                    <div class="bug-report-value">${createdDisplay}</div>
                </div>

                <div class="bug-report-field">
                    <div class="bug-report-label">Priority</div>
                    <div class="bug-report-value">${bugReport.priority ?? ''}</div>
                </div>

                <div class="bug-report-field">
                    <div class="bug-report-label">Severity</div>
                    <div class="bug-report-value">${bugReport.severity ?? ''}</div>
                </div>

                <div class="bug-report-field">
                    <div class="bug-report-label">Environment</div>
                    <div class="bug-report-value">${bugReport.environment ?? ''}</div>
                </div>

                <div class="bug-report-field">
                    <div class="bug-report-label">Steps</div>
                    <div class="bug-report-value">${bugReport.steps ?? ''}</div>
                </div>

                <div class="bug-report-field">
                    <div class="bug-report-label">Expected Result</div>
                    <div class="bug-report-value">${bugReport.expected_result ?? bugReport.expectation_result ?? ''}</div>
                </div>

                <div class="bug-report-field">
                    <div class="bug-report-label">Actual Result</div>
                    <div class="bug-report-value">${bugReport.actual_result ?? ''}</div>
                </div>

                <div class="bug-report-field">
                    <div class="bug-report-label">Attachments</div>
                    <div class="bug-report-value">${Array.isArray(bugReport.attachments) ? bugReport.attachments.join(', ') : (bugReport.attachments || '')}</div>
                </div>

            </div>
        </div>
    `;
};

const load = async () => {
    if (!main) return;

    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('projectId');
    const ticketId = params.get('tickets');

    if (!projectId || !ticketId) {
        main.innerHTML = '<div class="bug-report-page">Missing projectId or tickets in query string.</div>';
        return;
    }

    try {
        const response = await getBugReport(projectId, ticketId);
        if (!response) {
            main.innerHTML = '<div class="bug-report-page">Bugreport not found.</div>';
            return;
        }

        // API may return the ticket object directly or wrapped
        const bugReport = response?.ticket ?? response?.data ?? response;
        renderBugReport(bugReport);
    } catch (err) {
        console.error('Error loading bugreport:', err);
        main.innerHTML = '<div class="bug-report-page">Error loading bugreport.</div>';
    }
};

load();