const renderBugReports = (main, items) => {
    if (!items || items.length === 0) {
        main.innerHTML = '<div class="main-empty">No bug reports.</div>';
        return;
    }

    const rows = items.map((item) => `
        <div class="bug-card">
            <div class="bug-title">${item.title}</div>
            <div class="bug-meta">#${item.id} • ${item.status} • ${item.priority}</div>
        </div>
    `).join('');

    main.innerHTML = `<div class="list-title">Bug Reports</div><div class="bug-list">${rows}</div>`;
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
