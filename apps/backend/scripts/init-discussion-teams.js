/**
 * 初始化讨论团队脚本
 * 将 legacy_person 升级为真实 person，并创建 4 个讨论群组
 *
 * 用法：node scripts/init-discussion-teams.js
 *       node scripts/init-discussion-teams.js --dry-run
 */
'use strict';

const { getDatabase } = require('../src/db/database');
const PersonIdentityService = require('../src/services/personIdentityService');
const SessionService = require('../src/services/sessionService');

const DRY_RUN = process.argv.includes('--dry-run');

// ────────────────────────────────────────────────────────────
// 角色元数据（对应现有 legacy_role_id）
// ────────────────────────────────────────────────────────────
const ROLE_DEFS = [
    {
        legacyRoleId: 'nana_orchestrator',
        displayName: '龙娘小娜',
        description: '协作编排与节奏统筹负责人，擅长让不同人物围绕同一个产品问题形成清晰推进路线。',
        personality: '全局感强、组织力好，能同时照看目标、角色分工和讨论节奏。',
        emotional_style: '稳中带推动力，能在分歧里找到下一步共同动作。',
        voice_style: '像会议主持人一样收束讨论，明确谁负责什么、何时验证。',
        privateNotebook: '小娜'
    },
    {
        legacyRoleId: 'ke_researcher',
        displayName: '猫娘小克',
        description: '研究与资料检索负责人，擅长为产品决策补充外部样本、事实依据和替代路线。',
        personality: '好奇、严谨、证据优先，不轻易把单一观察当成结论。',
        emotional_style: '冷静友好，面对不确定性会标明置信度和还缺什么证据。',
        voice_style: '像研究备忘录一样表达，结论、依据、未知项分得很清楚。',
        privateNotebook: '小克'
    },
    {
        legacyRoleId: 'ji_archivist',
        displayName: '犬娘小吉',
        description: '长期记忆与资料归档负责人，擅长把讨论里的结论、分歧和待办沉淀成可追溯素材。',
        personality: '细心、耐心、重视上下文连续性，会主动发现遗漏和前后矛盾。',
        emotional_style: '温和稳定，先帮团队把信息放稳，再提醒需要补证据的地方。',
        voice_style: '像归档员一样清楚标注来源、时间和结论，少用空泛判断。',
        privateNotebook: '小吉'
    },
    {
        legacyRoleId: 'bing_critic',
        displayName: '蛇娘小冰',
        description: '风险评审与反方校验负责人，擅长提前找出产品、体验和技术方案里的脆弱点。',
        personality: '敏锐、克制、敢唱反调，但目标是让方案更稳而不是否定一切。',
        emotional_style: '清醒有边界，会把担忧说成可处理的问题。',
        voice_style: '短而锋利，优先指出关键风险、触发条件和补救建议。',
        privateNotebook: '小冰'
    },
    {
        legacyRoleId: 'yu_writer',
        displayName: '鸟娘小雨',
        description: '表达整理与文档叙事负责人，擅长把复杂讨论整理成用户能读懂、团队能执行的文字。',
        personality: '敏感、细腻、重视语气和受众，会主动削掉含混或冒犯的表达。',
        emotional_style: '柔和有温度，能把分歧重新组织成可继续协作的话。',
        voice_style: '语言干净，先保留重点，再让语气更自然、更像真实对话。',
        privateNotebook: '小雨'
    },
    {
        legacyRoleId: 'jue_toolsmith',
        displayName: '狼娘小绝',
        description: '工程工具与实现落地负责人，擅长把产品想法拆成可执行的技术动作。',
        personality: '动手快、重视可维护性，遇到含混需求会主动补边界条件。',
        emotional_style: '直接但不粗糙，会把焦虑转成步骤、检查项和可验证结果。',
        voice_style: '偏工程现场口吻，先给方案，再说明风险和验证方式。',
        privateNotebook: '小绝'
    },
    {
        legacyRoleId: '策士阿澄',
        displayName: '策士阿澄',
        description: '站在产品与技术之间做路线统筹的人物，负责把长期愿景拆成当前可推进的协作决策。',
        personality: '战略感强、判断谨慎，习惯先看系统边界，再决定优先级。',
        emotional_style: '沉着、有推进感，能把开放讨论收束成团队愿意执行的共识。',
        voice_style: '表达像决策备忘录，先给判断，再列取舍、证据和下一步。',
        privateNotebook: '阿澄'
    },
    {
        legacyRoleId: 'role_studio_码产通_product_code_bridge',
        displayName: '码产通',
        description: '产品技术桥接负责人，擅长把产品形态、用户流程和代码实现之间的断点翻译清楚。',
        personality: '务实、善于跨语境沟通，会同时关注体验完整性和工程成本。',
        emotional_style: '平衡且耐心，帮助产品判断和技术约束互相听懂。',
        voice_style: '先讲用户价值，再落到接口、状态、数据和验证路径。',
        privateNotebook: '码产通'
    }
];

// ────────────────────────────────────────────────────────────
// 群组定义（invite_only = 按需响应）
// ────────────────────────────────────────────────────────────
const BASE_PROMPT_HEADER = `这是一个多角色专家讨论室。现在是{{Date}}{{time}}。
规则：只在被@点名或话题明确属于自己职责时发言；发言简洁直接；允许用完整角色名点名交接，如 @龙娘小娜、@猫娘小克。`;

const GROUPS = [
    {
        id: 'group_product_decision',
        name: '产品决策室',
        team_id: 'team_default',
        mode: 'invite_only',
        mode_options: {},
        invite_prompt: '接下来请 {{role_name}} 就产品问题给出你的判断或建议，保持简洁。',
        group_prompt: `${BASE_PROMPT_HEADER}
当前群组聚焦：产品功能取舍、优先级排序、用户价值判断。
团队共享记忆：{{公共日记本}}。
工具：{{VarDailyNoteCreate}}`,
        members: [
            { roleId: 'nana_orchestrator', roleName: '龙娘小娜', order: 10 },
            { roleId: 'ke_researcher',     roleName: '猫娘小克', order: 20 },
            { roleId: 'bing_critic',       roleName: '蛇娘小冰', order: 30 },
            { roleId: '策士阿澄',          roleName: '策士阿澄', order: 40 }
        ]
    },
    {
        id: 'group_tech_review',
        name: '技术评审室',
        team_id: 'team_default',
        mode: 'invite_only',
        mode_options: {},
        invite_prompt: '接下来请 {{role_name}} 就技术方案进行评审，指出风险或改进建议。',
        group_prompt: `${BASE_PROMPT_HEADER}
当前群组聚焦：架构评审、代码质量、技术风险、实现路径。
团队共享记忆：{{公共日记本}}。
工具：{{VarDailyNoteCreate}}`,
        members: [
            { roleId: 'jue_toolsmith',     roleName: '狼娘小绝', order: 10 },
            { roleId: 'bing_critic',       roleName: '蛇娘小冰', order: 20 },
            { roleId: 'ji_archivist',      roleName: '犬娘小吉', order: 30 },
            { roleId: 'role_studio_码产通_product_code_bridge', roleName: '码产通', order: 40 }
        ]
    },
    {
        id: 'group_creative_narrative',
        name: '创意叙事室',
        team_id: 'team_default',
        mode: 'invite_only',
        mode_options: {},
        invite_prompt: '接下来请 {{role_name}} 从创意或叙事角度给出想法，保持开放和生动。',
        group_prompt: `${BASE_PROMPT_HEADER}
当前群组聚焦：内容创作、角色叙事、世界观构建、表达优化。
团队共享记忆：{{公共日记本}}。
工具：{{VarDailyNoteCreate}}`,
        members: [
            { roleId: 'yu_writer',         roleName: '鸟娘小雨', order: 10 },
            { roleId: 'ke_researcher',     roleName: '猫娘小克', order: 20 },
            { roleId: 'nana_orchestrator', roleName: '龙娘小娜', order: 30 }
        ]
    },
    {
        id: 'group_open_forum',
        name: '全团队开放讨论',
        team_id: 'team_default',
        mode: 'invite_only',
        mode_options: {},
        invite_prompt: '接下来请 {{role_name}} 发言，可以自由表达立场、补充信息或提出问题。',
        group_prompt: `${BASE_PROMPT_HEADER}
当前群组聚焦：开放议题，任何成员均可从自己职责视角切入。
团队共享记忆：{{公共日记本}}。
工具：{{VarDailyNoteCreate}}`,
        members: [
            { roleId: 'nana_orchestrator', roleName: '龙娘小娜', order: 10 },
            { roleId: 'ke_researcher',     roleName: '猫娘小克', order: 20 },
            { roleId: 'ji_archivist',      roleName: '犬娘小吉', order: 30 },
            { roleId: 'bing_critic',       roleName: '蛇娘小冰', order: 40 },
            { roleId: 'yu_writer',         roleName: '鸟娘小雨', order: 50 },
            { roleId: 'jue_toolsmith',     roleName: '狼娘小绝', order: 60 },
            { roleId: '策士阿澄',          roleName: '策士阿澄', order: 70 },
            { roleId: 'role_studio_码产通_product_code_bridge', roleName: '码产通', order: 80 }
        ]
    }
];

// ────────────────────────────────────────────────────────────
// 主逻辑
// ────────────────────────────────────────────────────────────
function main() {
    const db = getDatabase();
    const personSvc = new PersonIdentityService(db);
    const sessionSvc = new SessionService(db);

    console.log(`[init-discussion-teams] DRY_RUN=${DRY_RUN}`);

    // 1. 升级 legacy_person → real person（或已存在 real person 则复用）
    const personMap = {};  // legacyRoleId → person_id
    for (const def of ROLE_DEFS) {
        const legacy = personSvc.getPersonByLegacyRoleId(def.legacyRoleId);
        const isLegacy = legacy?.identity_kind === 'legacy_person';

        if (!legacy) {
            if (DRY_RUN) {
                console.log(`[dry-run] would create person for ${def.displayName}`);
                personMap[def.legacyRoleId] = `person_${def.legacyRoleId}`;
            } else {
                const p = personSvc.createPerson({
                    display_name: def.displayName,
                    legacy_role_id: def.legacyRoleId,
                    identity_kind: 'person',
                    description: def.description,
                    personality: def.personality,
                    emotional_style: def.emotional_style,
                    voice_style: def.voice_style,
                    memory: { privateNotebook: def.privateNotebook }
                });
                personMap[def.legacyRoleId] = p.id;
                console.log(`created person: ${p.id} (${def.displayName})`);
            }
        } else if (isLegacy) {
            // 将 legacy_person 升级为 real person
            if (DRY_RUN) {
                console.log(`[dry-run] would upgrade legacy_person ${legacy.id} → real person (${def.displayName})`);
                personMap[def.legacyRoleId] = legacy.id;
            } else {
                db.prepare(`
                    UPDATE persons
                    SET identity_kind = 'person',
                        description   = CASE WHEN TRIM(description)='' THEN ? ELSE description END,
                        personality   = CASE WHEN TRIM(personality)=''  THEN ? ELSE personality END,
                        emotional_style = CASE WHEN TRIM(emotional_style)='' THEN ? ELSE emotional_style END,
                        voice_style   = CASE WHEN TRIM(voice_style)=''  THEN ? ELSE voice_style END,
                        memory_json   = CASE WHEN memory_json='{}' OR memory_json IS NULL
                                             THEN ?
                                             ELSE memory_json END,
                        updated_at    = ?
                    WHERE id = ?
                `).run(
                    def.description,
                    def.personality,
                    def.emotional_style,
                    def.voice_style,
                    JSON.stringify({ privateNotebook: def.privateNotebook }),
                    new Date().toISOString(),
                    legacy.id
                );
                personMap[def.legacyRoleId] = legacy.id;
                console.log(`upgraded: ${legacy.id} (${def.displayName}) → real person`);
            }
        } else {
            // 已是 real person，直接复用
            personMap[def.legacyRoleId] = legacy.id;
            console.log(`reuse: ${legacy.id} (${def.displayName})`);
        }
    }

    // 2. 创建 group profiles（已存在则跳过）
    for (const grp of GROUPS) {
        const existing = db.prepare('SELECT id FROM group_profiles WHERE id=?').get(grp.id);
        if (existing) {
            console.log(`skip (exists): ${grp.id} | ${grp.name}`);
            continue;
        }

        if (DRY_RUN) {
            console.log(`[dry-run] would create group: ${grp.id} | ${grp.name} | ${grp.members.length} members`);
            continue;
        }

        // 插入 group_profile
        const now = new Date().toISOString();
        db.prepare(`
            INSERT INTO group_profiles
            (id, team_id, name, description, mode, invite_prompt, mode_options_json, group_prompt, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            grp.id,
            grp.team_id,
            grp.name,
            '',
            grp.mode,
            grp.invite_prompt,
            JSON.stringify(grp.mode_options),
            grp.group_prompt,
            now
        );

        // 插入成员（group_profile_members）
        let order = 0;
        for (const m of grp.members) {
            order += 10;
            db.prepare(`
                INSERT OR IGNORE INTO group_profile_members (profile_id, role_id, role_name, role_order, enabled)
                VALUES (?, ?, ?, ?, 1)
            `).run(grp.id, m.roleId, m.roleName, m.order || order);
        }

        // 插入 person 成员（group_person_members）
        let pOrder = 0;
        for (const m of grp.members) {
            pOrder += 10;
            const personId = personMap[m.roleId];
            if (!personId) continue;
            db.prepare(`
                INSERT OR IGNORE INTO group_person_members
                (profile_id, person_id, person_name, group_alias, member_order, enabled, speaking_policy_json, legacy_role_id)
                VALUES (?, ?, ?, ?, ?, 1, '{}', ?)
            `).run(grp.id, personId, m.roleName, m.roleName, m.order || pOrder, m.roleId);
        }

        console.log(`created group: ${grp.id} | ${grp.name} | ${grp.members.length} members`);
    }

    console.log('\n[init-discussion-teams] done.');
    console.log('personMap:', JSON.stringify(personMap, null, 2));
}

main();
