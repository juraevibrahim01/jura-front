import { createBugreport } from '../../api/bagreportapi.mjs';
import { createBugReportModal } from '../../entities/BugReport/BugReport.mjs';

const renderBugReports = (main, items) => {
    if (!items || items.length === 0) {
        main.innerHTML =
            `<div class="panel-header"><div class="list-title">Bug Reports</div><button id="openCreateBugReport" class="btn-primary">Create Bug Report</button></div><div class="main-empty">No bug reports.</div>`;
        // attach create button handler
        const emptyOpen = main.querySelector('#openCreateBugReport');
        if (emptyOpen) emptyOpen.addEventListener('click', () => openCreateModal(main));
        return;
    }

    const rows = items.map((item) => `
        <div class="bug-card" data-bugreport-id="${item.id}">
            <div class="bug-title">${item.title}</div>
            <div class="bug-meta">#${item.id} • ${item.status} • ${item.priority}</div>    
        </div>
    `).join('');

    main.innerHTML =
        `<div class="panel-header"><div class="list-title">Bug Reports</div><button id="openCreateBugReport" class="btn-primary">Create Bug Report</button></div>
        <div class="bug-list">${rows}</div>`
    ;

    // Получаем все багрепорты
    const bugreportCards = main.querySelectorAll('.bug-card');

    bugreportCards.forEach((card) => {
        card.addEventListener('click', () => {

            const projectID = localStorage.getItem('activeProjectId');
            const bugreportID = card.dataset.bugreportId;

            if (!projectID || !bugreportID) {
                console.error('Project ID or Test bugreport ID is missing');
                return;
            }
                
            const url = `/bugreport.html?projectId=${encodeURIComponent(projectID)}&tickets=${encodeURIComponent(bugreportID)}`;

            window.open(url, '_blank');
        })                              
        // Open create modal button handler
        const openBtn = main.querySelector('#openCreateBugReport');
        if (openBtn) {
            openBtn.addEventListener('click', () => openCreateModal(main));
        }
};

export const renderBugReportsPanel = async (main, loadBugReports) => {
    if (!main) return;
    main.innerHTML = '<div class="main-loading">Loading...</div>';

    try {
        const items = await loadBugReports();
        renderBugReports(main, items);
    } catch (err) {
        main.innerHTML = '<div class="main-error">Failed to load bug reports</div>';
    }
    // Refresh list when a new bugreport is created elsewhere
    const onCreated = async () => {
        try {
            const items = await loadBugReports();
            renderBugReports(main, items);
        } catch (err) {
            console.error('Failed to refresh bug reports', err);
        }
    };
    window.addEventListener('bugreports:created', onCreated);
};


// ---------------- modal helpers ----------------
async function openCreateModal(main) {
    if (document.getElementById('bugReportModal')) return;
    document.body.insertAdjacentHTML('beforeend', createBugReportModal());

    const modal = document.getElementById('bugReportModal');
    const closeBtn = document.getElementById('closeBugReportModal');
    const cancelBtn = document.getElementById('cancelBugReportModal');
    const form = document.getElementById('bugReportForm');

    const closeModal = () => {
        if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const projectId = localStorage.getItem('activeProjectId');
            const userId = localStorage.getItem('userId') || '1';

            const payload = {
                projectId,
                userId,
                Date: new Date().toISOString(),
                Name: (document.getElementById('bugReportName') || {}).value || '',
                Module: (document.getElementById('bugReportModule') || {}).value || '',
                Precondition: (document.getElementById('bugReportPrecondition') || {}).value || '',
                Steps: (document.getElementById('bugReportSteps') || {}).value || '',
                ExpectationRes: (document.getElementById('bugReportExpectation') || {}).value || '',
                ActualRes: (document.getElementById('bugReportActual') || {}).value || '',
                Comment: (document.getElementById('bugReportComment') || {}).value || ''
            };

            try {
                // determine category/subcategory from localStorage for the active project
                const projectID = payload.projectId || localStorage.getItem('activeProjectId');
                const categoryId = projectID ? localStorage.getItem(`activeCategoryId_${projectID}`) : null;
                const subcategoryId = (projectID && categoryId) ? localStorage.getItem(`activeSubcategoryId_${projectID}_${categoryId}`) : null;

                const req = {
                    projectId: projectID,
                    categoryId: categoryId || payload.categoryId,
                    subcategoryId: subcategoryId || payload.subcategoryId,
                    userId: payload.userId,
                    title: (document.getElementById('bugReportTitle') || {}).value || payload.Name || '',
                    priority: (document.getElementById('bugReportPriority') || {}).value || 'Medium',
                    severity: (document.getElementById('bugReportSeverity') || {}).value || 'Normal',
                    environment: (document.getElementById('bugReportEnvironment') || {}).value || payload.Precondition || '',
                    steps: (document.getElementById('bugReportSteps') || {}).value || payload.Steps || '',
                    expected_result: (document.getElementById('bugReportExpected') || {}).value || payload.ExpectationRes || '',
                    actual_result: (document.getElementById('bugReportActual') || {}).value || payload.ActualRes || '',
                    attachments: []
                };

                const res = await createBugreport(req);
                if (res) {
                    closeModal();
                    // notify app to refresh lists
                    window.dispatchEvent(new CustomEvent('bugreports:created', { detail: res }));
                } else {
                    console.error('Failed to create bug report');
                }
            } catch (err) {
                console.error('Error creating bug report', err);
            }
        });
    }
}
