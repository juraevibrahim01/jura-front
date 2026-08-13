const renderTestCases = (main, items) => {
    if (!items || items.length === 0) {
        main.innerHTML = '<div class="main-empty">No test cases.</div>';
        return;
    }

    const rows = items.map((item) => `
        <div class="tc-card">
            <div class="tc-title">${item.title}</div>
            <div class="tc-meta">#${item.id} • ${item.status}</div>
        </div>
    `).join('');

    main.innerHTML = `<div class="list-title">Test Cases</div><div class="tc-list">${rows}</div>`;
};

export const renderTestCasesPanel = async (main, loadTestCases) => {
    if (!main) return;
    main.innerHTML = '<div class="main-loading">Loading...</div>';

    try {
        const items = await loadTestCases();
        renderTestCases(main, items);
    } catch (err) {
        main.innerHTML = '<div class="main-error">Failed to load test cases</div>';
    }
};
