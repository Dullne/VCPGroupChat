import { buildEphemeralRoleCreatePayload } from './ephemeral-role-create-payload.js';
import { finalizeEphemeralRoleCreation } from './ephemeral-role-create-postprocess.js';

export function createEphemeralRoleCreateAction(deps) {
    const {
        getDom,
        getActiveSession,
        getLatestRoleDraft,
        setLatestRoleDraft,
        setLatestRoleDraftMeta,
        setAdvancedRoleEditorExpanded,
        fetchJson,
        showToast,
        reloadActiveSessionAndRoles,
        renderAll,
        defaultSharedNotebook
    } = deps;

    let isCreating = false;

    return async function createEphemeralRole() {
        if (isCreating) {
            return;
        }
        const activeSession = getActiveSession();
        if (!activeSession?.id) {
            showToast('请先创建会话', 'warning');
            return;
        }

        const dom = getDom();
        const latestRoleDraft = getLatestRoleDraft();
        const formData = new FormData(dom.ephemeralRoleForm);
        const name = String(formData.get('name') || '').trim();
        if (!name) {
            showToast('人物名称不能为空', 'warning');
            return;
        }

        const payload = buildEphemeralRoleCreatePayload({
            formData,
            name,
            latestRoleDraft,
            defaultSharedNotebook
        });

        isCreating = true;
        dom.ephemeralRoleSubmit.disabled = true;
        try {
            await fetchJson(`/api/group-chat/sessions/${encodeURIComponent(activeSession.id)}/ephemeral-roles`, {
            method: 'POST',
            body: payload
        });

        finalizeEphemeralRoleCreation({
            dom,
            name,
            setLatestRoleDraft,
            setLatestRoleDraftMeta,
            setAdvancedRoleEditorExpanded
        });
        await reloadActiveSessionAndRoles();
        renderAll();
        } finally {
            isCreating = false;
            dom.ephemeralRoleSubmit.disabled = false;
        }
    };
}
