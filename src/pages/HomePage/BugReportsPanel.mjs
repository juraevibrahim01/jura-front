const renderBugReports = (main, items) => {
    if (!items || items.length === 0) {
        main.innerHTML =
            `<div class="main-empty">No bug reports.</div>`;
        return;
    }

    const rows = items.map((item) => `
        <div class="bug-card" data-bugreport-id="${item.id}">
            <div class="bug-title">${item.title}</div>
            <div class="bug-meta">#${item.id} • ${item.status} • ${item.priority}</div>    
        </div>
    `).join('');

    main.innerHTML =
        `<div class="list-title">Bug Reports</div>
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
    });
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
};
