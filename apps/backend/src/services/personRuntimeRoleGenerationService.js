const {
    buildPersonRuntimeRoleImportPayload
} = require('./personRuntimeRolePayload');
const { createHttpError } = require('./httpError');

async function generatePersonRuntimeRole({
    personId,
    overrides = {},
    personIdentityService,
    vcpCoreClient
}) {
    const person = personIdentityService.getPerson(personId);
    if (!person) {
        throw createHttpError(404, 'person not found');
    }

    const template = person.source_template_id
        ? personIdentityService.getRoleTemplate(person.source_template_id)
        : null;
    const importPayload = buildPersonRuntimeRoleImportPayload({
        person,
        template,
        overrides
    });
    const importedRole = await vcpCoreClient.importRole(importPayload);
    if (!importedRole?.id) {
        throw createHttpError(502, 'core role import did not return a role id', { role: importedRole });
    }

    const updatedPerson = personIdentityService.bindPersonRuntimeRole(person.id, {
        role_id: importedRole.id,
        role_name: importedRole.name || importPayload.name
    });

    return {
        person: updatedPerson,
        runtime_role: importedRole
    };
}

module.exports = {
    generatePersonRuntimeRole
};
