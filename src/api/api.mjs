const API_BASE_URL = 'http://localhost:8081';

export async function fetchJson(endpoint, opts = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
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