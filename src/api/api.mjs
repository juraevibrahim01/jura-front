const API_BASE_URL = 'https://jura-1-llep.onrender.com';

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