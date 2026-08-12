async function fetchJson(url, opts = {}) {
    try {
        const res = await fetch(url, opts);
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(text || res.statusText || 'Network error');
        }
        return await res.json();
    } catch (err) {
        // Rethrow so callers can handle, but also allow fallback below
        throw new Error(err.message || 'Fetch failed');
    }
}

// Attempt fetch; if it fails (no backend), return demo/mock data so UI can still function.
const withFallback = async (url, fallbackFn) => {
    try {
        return await fetchJson(url);
    } catch (err) {
        return fallbackFn();
    }
};

export const getProjects = async () => {
    return withFallback('/projects', () => (
        [
            { id: 1, name: 'AlifShop' },
            { id: 2, name: 'Humo' }
        ]
    ));
};

export const getProjectMetrics = async (projectId) => {
    return withFallback(`/projects/${projectId}/metrics`, () => ({
        project_id: projectId,
        project_name: projectId === 1 ? 'AlifShop' : 'Humo',
        bug_reports_count: projectId === 1 ? 35 : 12,
        test_cases_count: projectId === 1 ? 120 : 40
    }));
};

export const getBugReports = async (projectId) => {
    return withFallback(`/projects/${projectId}/bug-reports`, () => (
        [
            { id: 101, title: 'Не открывается каталог', status: 'Open', priority: 'High' },
            { id: 102, title: 'Ошибка при добавлении товара', status: 'In Progress', priority: 'Medium' }
        ]
    ));
};

export const getTestCases = async (projectId) => {
    return withFallback(`/projects/${projectId}/test-cases`, () => (
        [
            { id: 501, title: 'Проверка открытия каталога', status: 'Passed' },
            { id: 502, title: 'Проверка добавления товара в корзину', status: 'Failed' }
        ]
    ));
};
