const toId = (value) => String(value ?? '');

const normalizeTree = (nodes = []) => (Array.isArray(nodes) ? nodes : []).map((node) => ({
    id: toId(node?.id),
    name: String(node?.name || 'Unnamed'),
    children: normalizeTree(node?.children),
    meta: node?.meta || {}
})).filter((node) => node.id);

const findNodeById = (nodes, targetId) => {
    for (const node of nodes) {
        if (toId(node.id) === toId(targetId)) return node;
        if (node.children?.length) {
            const found = findNodeById(node.children, targetId);
            if (found) return found;
        }
    }
    return null;
};

const getPathToNode = (nodes, targetId, parents = []) => {
    for (const node of nodes) {
        const nextParents = [...parents, toId(node.id)];
        if (toId(node.id) === toId(targetId)) return nextParents;
        if (node.children?.length) {
            const found = getPathToNode(node.children, targetId, nextParents);
            if (found) return found;
        }
    }
    return null;
};

export const createTreeState = ({ mode = 'accordion', selectedId = null, expandedIds = [] } = {}) => ({
    mode,
    selectedId: selectedId ? toId(selectedId) : null,
    expandedIds: new Set((Array.isArray(expandedIds) ? expandedIds : []).map((id) => toId(id)))
});

export const syncExpandedToActiveId = (nodes, activeId, expandedIds = new Set()) => {
    const next = new Set(expandedIds);
    const activePath = getPathToNode(nodes, activeId, []);

    if (Array.isArray(activePath) && activePath.length > 1) {
        activePath.forEach((id) => next.add(toId(id)));
    }

    return next;
};

export const renderTreeMenu = ({
    container,
    nodes,
    state,
    onSelect,
    onToggle,
    onNodeClick,
    mode = 'accordion'
}) => {
    if (!container) return null;

    const safeNodes = normalizeTree(nodes);
    const treeState = state || createTreeState({ mode });
    treeState.mode = mode;

    const root = document.createElement('div');
    root.className = 'tree-menu';
    root.setAttribute('role', 'tree');

    const renderNode = (node, level = 0) => {
        const item = document.createElement('div');
        const nodeId = toId(node.id);
        const hasChildren = Array.isArray(node.children) && node.children.length > 0;
        const isExpanded = treeState.expandedIds.has(nodeId);
        const isSelected = treeState.selectedId === nodeId;

        item.className = hasChildren ? 'submenu-item category-item' : 'submenu-subitem';
        item.setAttribute('role', 'treeitem');
        item.setAttribute('aria-expanded', hasChildren ? String(isExpanded) : 'false');
        item.setAttribute('aria-level', String(level + 1));
        if (isSelected) item.setAttribute('aria-current', 'page');

        const chevron = document.createElement('span');
        chevron.className = hasChildren ? 'category-chevron' : 'subcategory-chevron';
        chevron.textContent = hasChildren ? (isExpanded ? '▼' : '▶') : '•';
        if (!hasChildren) chevron.style.visibility = 'hidden';
        item.appendChild(chevron);

        const label = document.createElement('span');
        label.className = hasChildren ? 'category-text' : 'subcategory-text';
        label.textContent = node.name;
        item.appendChild(label);

        if (hasChildren) {
            item.classList.toggle('active-sub', isSelected);
            item.addEventListener('click', (event) => {
                event.preventDefault();

                if (treeState.mode === 'accordion') {
                    const nextExpanded = !isExpanded;
                    if (nextExpanded) {
                        treeState.expandedIds.forEach((expandedId) => {
                            if (expandedId !== nodeId) treeState.expandedIds.delete(expandedId);
                        });
                    }
                    if (nextExpanded) {
                        treeState.expandedIds.add(nodeId);
                    } else {
                        treeState.expandedIds.delete(nodeId);
                    }
                } else {
                    if (isExpanded) treeState.expandedIds.delete(nodeId);
                    else treeState.expandedIds.add(nodeId);
                }

                if (typeof onToggle === 'function') onToggle(node, { expanded: !isExpanded, state: treeState });
                if (typeof onNodeClick === 'function') onNodeClick(node, { expanded: !isExpanded, state: treeState });
                renderTreeMenu({ container, nodes: safeNodes, state: treeState, onSelect, onToggle, onNodeClick, mode });
            });
        } else {
            item.classList.toggle('active-subcategory', isSelected);
            item.addEventListener('click', () => {
                treeState.selectedId = nodeId;
                if (typeof onSelect === 'function') onSelect(node, treeState);
                if (typeof onNodeClick === 'function') onNodeClick(node, { selected: true, state: treeState });
                renderTreeMenu({ container, nodes: safeNodes, state: treeState, onSelect, onToggle, onNodeClick, mode });
            });
        }

        if (hasChildren) {
            const childrenWrap = document.createElement('div');
            childrenWrap.className = 'submenu-subcategories';
            if (isExpanded) {
                childrenWrap.style.display = 'flex';
                childrenWrap.setAttribute('role', 'group');
                const children = node.children.map((child) => renderNode(child, level + 1));
                children.forEach((child) => childrenWrap.appendChild(child));
            } else {
                childrenWrap.style.display = 'none';
            }
            item.appendChild(childrenWrap);
        }

        return item;
    };

    safeNodes.forEach((node) => {
        root.appendChild(renderNode(node));
    });

    container.innerHTML = '';
    container.appendChild(root);

    return treeState;
};

export const buildTreeBranch = (nodes, activeId, mode = 'accordion') => {
    const normalized = normalizeTree(nodes);
    const state = createTreeState({ mode, selectedId: activeId || null });
    const activePath = getPathToNode(normalized, activeId, []);

    if (Array.isArray(activePath) && activePath.length > 1) {
        activePath.forEach((id) => state.expandedIds.add(toId(id)));
    }

    return { nodes: normalized, state };
};

export const getLeafNodeId = (node) => toId(node?.id || node?.value || node?.key || '');

export const isNodeLeaf = (node) => !Array.isArray(node?.children) || node.children.length === 0;

export default {
    createTreeState,
    syncExpandedToActiveId,
    renderTreeMenu,
    buildTreeBranch,
    getLeafNodeId,
    isNodeLeaf,
    normalizeTree
};
