const API_BASE_URL = 'http://localhost:8081';
const PROJECTS_STORAGE_KEY = 'projects';

async function fetchJson(url, opts = {}) {
    try {
        const res = await fetch(`${API_BASE_URL}${url}`, opts);
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(text || res.statusText || 'Network error');
        }
        return await res.json();
    } catch (err) {
        throw new Error(err.message || 'Fetch failed');
    }
}

export const getTestCases = async (projectId) => {
    const response = await fetchJson(`/projects/${projectId}/test-cases`, {
        method: 'GET',
        headers: {
            'X-User-UserID': '1',
            'X-User-Email': 'juraevibrahim01@gmail.com'
        }
    });

    const sourceItems = Array.isArray(response?.test_keys) ? response.test_keys : [];

    const items = sourceItems.map((item) => ({
        id: item?.id ?? 0,
        title: item?.name || 'Untitled test case',
        status: item?.status || 'Unknown'
    }));

    try {
        const stored = JSON.parse(localStorage.getItem(PROJECTS_STORAGE_KEY) || '[]');
        const projectExists = stored.some((project) => Number(project.id) === Number(projectId));

        if (!projectExists) {
            stored.push({ id: Number(projectId), name: `Project ${projectId}` });
            localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(stored));
        }
    } catch (err) {
        // ignore storage errors
    }

    return items;
};
