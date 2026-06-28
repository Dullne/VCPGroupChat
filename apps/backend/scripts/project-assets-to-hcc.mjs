#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Database from 'better-sqlite3';

const scriptFile = fileURLToPath(import.meta.url);
const backendDir = dirname(dirname(scriptFile));
const projectRoot = dirname(backendDir);
const defaultDbPath = resolve(backendDir, 'data/groupchat.db');
const DEFAULT_PARENT_TASK_ID = 68;

function normalizeText(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeConversationPolicy(value) {
    const normalized = normalizeText(value).toLowerCase();
    if (normalized === 'decision') {
        return 'decision';
    }
    if (normalized === 'project') {
        return 'project';
    }
    return 'casual';
}

function asObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value
        : {};
}

function asArray(value) {
    return Array.isArray(value) ? value.filter(Boolean) : [];
}

function parseJson(value, fallback) {
    try {
        return JSON.parse(value);
    } catch (error) {
        return fallback;
    }
}

function readJsonField(row, field, fallback) {
    if (row[field] && typeof row[field] === 'string') {
        return parseJson(row[field], fallback);
    }
    return row[field] ?? fallback;
}

function normalizeSynthesisRow(row) {
    if (!row) {
        return null;
    }
    return {
        id: row.id,
        session_id: row.session_id,
        round_index: Number(row.round_index || 0),
        conversation_policy: normalizeConversationPolicy(row.conversation_policy),
        consensus_state: row.consensus_state || '',
        source_message_ids: readJsonField(row, 'source_message_ids_json', []),
        participant_states: readJsonField(row, 'participant_states_json', []),
        memory_deposition: readJsonField(row, 'memory_deposition_json', {}),
        project_assets: readJsonField(row, 'project_assets_json', {}),
        created_at: row.created_at,
        updated_at: row.updated_at
    };
}

function collectRecommendedTasks(projectAssets) {
    return [
        ...asArray(projectAssets.recommended_tasks),
        ...asArray(projectAssets.tasks)
    ];
}

function taskSourceMessageIds(task, synthesis) {
    const ids = asArray(task.source_message_ids).map(normalizeText).filter(Boolean);
    if (ids.length > 0) {
        return ids;
    }
    return asArray(synthesis.source_message_ids).map(normalizeText).filter(Boolean);
}

function buildTaskBody({ synthesis, projectAssets, task, sourceMessageIds }) {
    const lines = [
        `Source synthesis: ${synthesis.id}`,
        `Session: ${synthesis.session_id}`,
        `Round: ${synthesis.round_index}`,
        `Conversation policy: ${normalizeConversationPolicy(synthesis.conversation_policy)}`,
        `Confirmed by: ${normalizeText(projectAssets.confirmed_by) || '<unknown>'}`,
        `Source messages: ${sourceMessageIds.join(', ') || '<none>'}`
    ];

    const content = normalizeText(task.content || task.description || task.body);
    if (content) {
        lines.push('', content);
    }

    const decisionTitles = asArray(projectAssets.decisions)
        .map(item => normalizeText(item.title || item.content))
        .filter(Boolean);
    if (decisionTitles.length > 0) {
        lines.push('', 'Related decisions:');
        for (const decision of decisionTitles) {
            lines.push(`- ${decision}`);
        }
    }

    return lines.join('\n');
}

export function buildHccTaskSpecsFromSynthesis(synthesis, options = {}) {
    const normalizedPolicy = normalizeConversationPolicy(synthesis?.conversation_policy);
    if (!['project', 'decision'].includes(normalizedPolicy)) {
        throw new Error('only project or decision syntheses can create hcc tasks');
    }

    const projectAssets = asObject(synthesis?.project_assets);
    if (projectAssets.confirmed !== true) {
        throw new Error('project_assets must be confirmed before creating hcc tasks');
    }

    const tasks = collectRecommendedTasks(projectAssets);
    if (tasks.length === 0) {
        throw new Error('confirmed project_assets contain no recommended_tasks');
    }

    const parentTaskId = Number(options.parentTaskId || DEFAULT_PARENT_TASK_ID);
    if (!Number.isInteger(parentTaskId) || parentTaskId <= 0) {
        throw new Error(`parentTaskId must be a positive integer, got ${options.parentTaskId}`);
    }

    return tasks.map((task, index) => {
        const title = normalizeText(task.title || task.name || task.content);
        if (!title) {
            throw new Error(`recommended task at index ${index} is missing title`);
        }

        const sourceMessageIds = taskSourceMessageIds(task, synthesis);
        const body = buildTaskBody({
            synthesis,
            projectAssets,
            task,
            sourceMessageIds
        });
        const teamRole = normalizeText(task.team_role || task.teamRole || task.role);
        const args = [
            'task',
            'create',
            '--title',
            title,
            '--body',
            body,
            '--parent',
            String(parentTaskId)
        ];
        if (teamRole) {
            args.push('--team-role', teamRole);
        }

        return {
            title,
            body,
            team_role: teamRole || null,
            source_message_ids: sourceMessageIds,
            args
        };
    });
}

export function readSynthesisFromDb(options = {}) {
    const dbPath = options.dbPath || defaultDbPath;
    const db = new Database(dbPath, { readonly: true, fileMustExist: true });
    try {
        let row = null;
        if (options.synthesisId) {
            row = db.prepare('SELECT * FROM round_syntheses WHERE id = ?').get(options.synthesisId);
        } else if (options.sessionId && options.roundIndex !== undefined) {
            row = db.prepare(`
                SELECT *
                FROM round_syntheses
                WHERE session_id = ?
                  AND round_index = ?
            `).get(options.sessionId, Number(options.roundIndex));
        } else {
            throw new Error('provide --synthesis ID or --session SESSION_ID --round N');
        }
        if (!row) {
            throw new Error('round synthesis not found');
        }
        return normalizeSynthesisRow(row);
    } finally {
        db.close();
    }
}

export function executeHccTaskSpecs(specs, options = {}) {
    if (!options.write) {
        return {
            dry_run: true,
            commands: specs.map(spec => ['hcc', ...spec.args])
        };
    }
    if (options.env?.GROUPCHAT_HCC_CREATE !== '1') {
        throw new Error('GROUPCHAT_HCC_CREATE=1 is required when using --write');
    }

    const created = [];
    for (const spec of specs) {
        const result = spawnSync('hcc', spec.args, {
            cwd: options.cwd || projectRoot,
            env: options.env || process.env,
            encoding: 'utf8'
        });
        if (result.status !== 0) {
            throw new Error(`hcc task create failed: ${result.stderr || result.stdout || result.status}`);
        }
        created.push({
            title: spec.title,
            output: String(result.stdout || '').trim()
        });
    }
    return {
        dry_run: false,
        created
    };
}

function readArgValue(argv, name) {
    const index = argv.indexOf(name);
    return index >= 0 ? argv[index + 1] : '';
}

export function parseArgs(argv = process.argv.slice(2)) {
    return {
        dbPath: readArgValue(argv, '--db') || defaultDbPath,
        synthesisId: readArgValue(argv, '--synthesis'),
        sessionId: readArgValue(argv, '--session'),
        roundIndex: readArgValue(argv, '--round'),
        parentTaskId: Number(readArgValue(argv, '--parent') || DEFAULT_PARENT_TASK_ID),
        write: argv.includes('--write')
    };
}

export function buildBacklogPlan(options = {}) {
    const synthesis = readSynthesisFromDb(options);
    const specs = buildHccTaskSpecsFromSynthesis(synthesis, {
        parentTaskId: options.parentTaskId
    });
    return {
        synthesis_id: synthesis.id,
        session_id: synthesis.session_id,
        round_index: synthesis.round_index,
        task_count: specs.length,
        specs
    };
}

export async function main(argv = process.argv.slice(2), env = process.env) {
    const options = parseArgs(argv);
    const plan = buildBacklogPlan(options);
    const result = executeHccTaskSpecs(plan.specs, {
        write: options.write,
        env,
        cwd: projectRoot
    });
    console.log(JSON.stringify({
        ...plan,
        result
    }, null, 2));
}

const isCli = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isCli) {
    main().catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
}
