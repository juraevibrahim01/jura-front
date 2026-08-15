import { fetchJson } from './api.mjs';

const PROJECTS_STORAGE_KEY = 'projects';

export const getBugReports = async (projectId) => {
    const response = await fetchJson("/projects/", `${projectId}/bug-reports`, {
        method: 'GET',
        headers: {
            'X-User-UserID': '1',
            'X-User-Email': 'juraevibrahim01@gmail.com'
        }
    });

    const items = Array.isArray(response?.bug_reports)
        ? response.bug_reports
        : Array.isArray(response?.items)
            ? response.items
            : [];

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
