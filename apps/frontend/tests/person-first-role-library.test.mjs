import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const read = relativePath => readFileSync(join(repoRoot, relativePath), 'utf8');

const selectors = read('js/core/selectors-managed-profile-members.js');
assert.match(
    selectors,
    /group_person_members_by_profile_id/,
    'managed profile membership reads group person buckets'
);
assert.match(selectors, /person_id/, 'managed profile selectors expose person ids');

const index = read('index.html');
assert.match(index, /title="人物与模板">人物与模板</, 'primary workspace nav names the mixed catalog as people and templates');
assert.match(index, /aria-label="人物与模板筛选"/, 'catalog filter console names the surface as people and templates');
assert.match(index, /aria-label="按状态筛选人物与运行时角色"/, 'status filter aria label distinguishes people from runtime roles');
assert.match(index, /人物通讯录优先/, 'role library copy leads with people as the primary product catalog');
assert.match(index, /人物通讯录 \/ 模板目录/, 'role library kicker names people and templates rather than a generic address book');
assert.match(index, /<h4>外部模板目录<\/h4>/, 'template section label names external templates rather than external roles');
assert.match(index, /<h4>当前可用运行时角色<\/h4>/, 'runtime section label names available runtime roles explicitly');
const staleContactCopyPattern = new RegExp([
    ['AI Address', 'Book'].join(' '),
    ['角色库是', '混合目录'].join(''),
    ['正在读取角色库', '混合目录'].join(''),
    ['角色库是', '联系人', '总表'].join(''),
    ['团队是', '角色', '池'].join(''),
    ['先找角色，再决定导入、进团队，还是进', '当前群组'].join('')
].join('|'));
assert.doesNotMatch(index, staleContactCopyPattern, 'role library copy no longer presents templates and runtime roles as direct contacts');

const groupAdd = read('js/core/role-library-group-action-add.js');
assert.match(groupAdd, /person-members/, 'group add uses person membership endpoint');
assert.doesNotMatch(
    groupAdd,
    /\/group-profiles\/\$\{encodeURIComponent\(profile\.id\)\}\/members/,
    'group add has no legacy runtime fallback'
);

const groupRemove = read('js/core/role-library-group-action-remove.js');
assert.match(groupRemove, /person-members/, 'group remove uses person membership endpoint');
assert.doesNotMatch(
    groupRemove,
    /\/group-profiles\/\$\{encodeURIComponent\(profile\.id\)\}\/members/,
    'group remove has no legacy runtime fallback'
);

const groupMove = read('js/core/role-library-group-action-move.js');
assert.match(groupMove, /resolvePersonIdentityForRoleAction/, 'group move resolves the selected row to a person');
assert.match(groupMove, /person-members\/\$\{encodeURIComponent\(personIdentity\.id\)\}\/order/, 'group move uses person membership order endpoint');
assert.doesNotMatch(
    groupMove,
    /\/group-profiles\/\$\{encodeURIComponent\(profile\.id\)\}\/members/,
    'group move has no legacy runtime fallback'
);

assert.equal(
    existsSync(join(repoRoot, 'js/ui/role-library-runtime-import-item-actions.js')),
    false,
    'external template cards no longer expose direct import-to-core actions'
);
assert.equal(
    existsSync(join(repoRoot, 'js/core/role-library-import-current-action.js')),
    false,
    'role library no longer carries direct template-to-runtime import action code'
);
assert.equal(
    existsSync(join(repoRoot, 'js/core/role-library-import-new-profile-action.js')),
    false,
    'role library no longer carries legacy create-profile import action code'
);

const runtimeActions = read('js/ui/role-library-runtime-session-role-core-actions.js');
assert.match(runtimeActions, /person_identity/, 'runtime role actions inspect person identity before team or group add');
assert.match(runtimeActions, /不是长期人物/, 'runtime-only rows explain why they cannot join product pools');
assert.match(runtimeActions, /runtime_binding_status/, 'person rows check runtime binding status before product membership actions');
assert.match(runtimeActions, /先绑定运行时/, 'runtime-missing people ask for runtime binding before team or group actions');

const sessionRoleList = read('js/ui/role-library-runtime-session-roles.js');
assert.match(sessionRoleList, /getWorkspaceTeamMemberPoolCoreRoles/, 'role library renders person-first candidates from persons');
assert.match(sessionRoleList, /人物通讯录/, 'role library has a first-class people address book section');
assert.match(sessionRoleList, /运行时角色/, 'role library keeps runtime roles as execution/binding section');
const roleBadges = read('js/ui/role-library-runtime-role-badges.js');
assert.match(roleBadges, /role\.source === 'person'/, 'role library badges distinguish person cards from runtime roles');
assert.match(roleBadges, /runtime_binding_status/, 'role library badges show person runtime binding status');

const modeRenderer = read('js/ui/workspace-renderers-mode.js');
assert.match(modeRenderer, /title:\s*'人物与模板'/, 'workspace mode title names the mixed catalog as people and templates');
assert.doesNotMatch(modeRenderer, /title:\s*'角色库'/, 'workspace mode title no longer labels the mixed catalog as a role library');

const modalViewToggle = read('js/ui/modal-view-toggle.js');
assert.match(modalViewToggle, /library:\s*'人物与模板'/, 'modal view toggle uses the people-and-templates label');

const i18n = read('js/core/i18n.js');
assert.match(i18n, /"人物与模板":\s*"People & Templates"/, 'i18n exposes the people-and-templates label');
assert.match(i18n, /"人物与模板筛选":\s*"People & Templates Filters"/, 'i18n exposes the people-and-templates filter label');
assert.match(i18n, /"按状态筛选人物与运行时角色":\s*"Filter people and runtime roles by status"/, 'i18n exposes explicit status-filter wording for people and runtime roles');
assert.doesNotMatch(i18n, /"角色库筛选":\s*"Role Library Filters"/, 'i18n no longer exposes the stale role-library filter label');
assert.match(i18n, /"外部模板目录":\s*"External Template Catalog"/, 'i18n exposes template-catalog wording for external sources');
assert.match(i18n, /"当前可用运行时角色":\s*"Currently Available Runtime Roles"/, 'i18n exposes runtime-role wording for the current-session section');
assert.match(i18n, /"当前没有可用的外部模板目录。?":\s*"No external template catalogs are available\.?"/, 'i18n empty state no longer says external role directories');
assert.match(i18n, /"搜索运行时角色名 \/ 标签 \/ 描述 \/ 来源":\s*"Search runtime role name \/ tag \/ description \/ source"/, 'runtime-role search placeholder is explicit about runtime roles');
assert.match(i18n, /"当前会话暂无运行时角色":\s*"No runtime roles in the current session yet"/, 'runtime empty state names runtime roles explicitly');
assert.match(i18n, /"当前没有可展示运行时角色。":\s*"No runtime roles to display\."/, 'runtime empty state no longer says generic roles');
assert.match(i18n, /"当前筛选条件下没有匹配的可用运行时角色。":\s*"No available runtime roles match the current filters\."/, 'runtime filter-empty state names available runtime roles explicitly');
assert.match(i18n, /可在人物与模板中执行长期化/, 'temporary-role promotion copy points to the people-and-templates surface');
const staleRolePoolCopyPattern = new RegExp([
    ['角色库是', '联系人', '总表'].join(''),
    ['团队是', '角色', '池'].join(''),
    ['底层角色', '池'].join(''),
    ['暂时没有可用的群聊容器，请先到“团队”里创建一个角色', '池'].join(''),
    '点击“加入这个团队”，把角色放进当前团队成员池'
].join('|'));
assert.doesNotMatch(
    i18n,
    staleRolePoolCopyPattern,
    'i18n table does not keep stale role-pool user-facing copy'
);

const temporaryRolePostprocess = read('js/core/ephemeral-role-create-postprocess.js');
assert.match(temporaryRolePostprocess, /可在人物与模板中执行长期化/, 'temporary-role postprocess copy uses the people-and-templates label');

const importSourceList = read('js/ui/role-library-runtime-import-sources.js');
assert.match(importSourceList, /当前没有可用的外部模板目录/, 'external-source empty state uses template-catalog wording');

const productModuleFlow = read('PRODUCT_MODULE_FLOW.md');
assert.doesNotMatch(productModuleFlow, /\bRole Library\b/, 'product module flow no longer presents the mixed catalog as Role Library');
assert.doesNotMatch(productModuleFlow, /角色库模板创建人物|发起群聊\/角色库加入/, 'product module flow uses people-and-templates wording in key user paths');

const cognitivePlan = read('COGNITIVE_ROLE_CHAT_PLAN.md');
assert.doesNotMatch(cognitivePlan, /Open Role Library|Role Library shows|Current Role Library|built from Role Library data/, 'cognitive plan no longer narrates the surface as Role Library');

console.log('person-first-role-library.test.mjs passed');
