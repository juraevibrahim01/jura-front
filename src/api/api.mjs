export async function fetchJson(url, opts = {}) {
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