import { fetchJson } from './api.mjs';

const PROJECTS_STORAGE_KEY = 'projects';

const saveProjectsToStorage = (projects) => {
    try {
        const normalized = Array.isArray(projects)
            ? projects
                .map((project) => ({
                    id: Number(project?.id),
                    name: String(project?.name || '')
                }))
                .filter((project) => project.id && project.name)
            : [];

        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
    } catch (err) {
        return [];
    }
};

export const getProjects = async () => {
    const response = await fetchJson(`/projects`, {
        method: 'GET',
        headers: {
            'X-User-UserID': '1',
            'X-User-Email': 'juraevibrahim01@gmail.com'
        }
    });

    const projects = Array.isArray(response?.projects) ? response.projects : [];
    saveProjectsToStorage(projects);
    return projects;
};

export const getProjectMetrics = async (projectId) => {
    const metrics = await fetchJson(`/project/${projectId}`, {
        method: 'GET',
        headers: {
            'X-User-UserID': '1',
            'X-User-Email': 'juraevibrahim01@gmail.com'
        }
    });

    try {
        const storageProjects = JSON.parse(localStorage.getItem(PROJECTS_STORAGE_KEY) || '[]');
        const projectName = metrics?.project_name || (storageProjects.find((project) => Number(project.id) === Number(projectId))?.name || 'Project');

        const nextList = storageProjects.some((project) => Number(project.id) === Number(projectId))
            ? storageProjects
            : [...storageProjects, { id: Number(projectId), name: projectName }];

        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(nextList));
    } catch (err) {
        // ignore storage errors
    }

    return metrics;
};


