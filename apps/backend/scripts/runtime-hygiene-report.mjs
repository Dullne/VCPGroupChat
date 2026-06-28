#!/usr/bin/env node

import { stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Database from 'better-sqlite3';

const scriptFile = fileURLToPath(import.meta.url);
const backendDir = dirname(dirname(scriptFile));
const defaultDbPath = resolve(backendDir, 'data/groupchat.db');

export const SMOKE_TITLE_PREFIXES = [
    'ephemeral detail smoke',
    'stream-smoke-',
    'latency-smoke-',
    'disabled-model-smoke-',
    'memory-fix-smoke',
    'Codex full smoke'
];

function hasKnownSmokePrefix(title = '') {
    return SMOKE_TITLE_PREFIXES.some(prefix => String(title || '').startsWith(prefix));
}

export function classifySessionCleanupCandidate(row) {
    const dependentCount =
        Number(row?.message_count || 0)
        + Number(row?.ephemeral_role_count || 0)
        + Number(row?.synthesis_count || 0)
        + Number(row?.reflection_count || 0)
        + Number(row?.memory_candidate_count || 0);

    if (dependentCount > 0) {
        return {
            safe: false,
            action: 'keep',
            reason: `has dependent records: ${dependentCount}`
        };
    }

    if (!hasKnownSmokePrefix(row?.title)) {
        return {
            safe: false,
            action: 'keep',
            reason: 'title is not a known smoke prefix'
        };
    }

    return {
        safe: true,
        action: 'prune_empty_smoke_session',
        reason: 'empty known-smoke session'
    };
}

export function collectSessionRows(db) {
    return db.prepare(`
        SELECT
            s.id,
            s.title,
            s.created_at,
            COUNT(DISTINCT m.id) AS message_count,
            COUNT(DISTINCT er.id) AS ephemeral_role_count,
            COUNT(DISTINCT rs.id) AS synthesis_count,
            COUNT(DISTINCT sr.id) AS reflection_count,
            COUNT(DISTINCT mc.id) AS memory_candidate_count
        FROM sessions s
        LEFT JOIN session_messages m ON m.session_id = s.id
        LEFT JOIN ephemeral_roles er ON er.session_id = s.id
        LEFT JOIN round_syntheses rs ON rs.session_id = s.id
        LEFT JOIN session_reflections sr ON sr.session_id = s.id
        LEFT JOIN memory_candidates mc ON mc.session_id = s.id
        GROUP BY s.id
        ORDER BY s.created_at DESC
    `).all();
}

export async function buildReport(options = {}) {
    const dbPath = options.dbPath || defaultDbPath;
    await stat(dbPath);
    const db = new Database(dbPath, {
        readonly: true,
        fileMustExist: true,
        timeout: Number(options.timeoutMs || 5000)
    });

    try {
        const sessions = collectSessionRows(db).map(row => ({
            ...row,
            cleanup: classifySessionCleanupCandidate(row)
        }));
        return {
            db_path: dbPath,
            session_count: sessions.length,
            empty_smoke_session_candidates: sessions.filter(row => row.cleanup.safe),
            blocked_empty_or_smoke_sessions: sessions.filter(row => !row.cleanup.safe && (
                Number(row.message_count || 0) === 0 || hasKnownSmokePrefix(row.title)
            ))
        };
    } finally {
        db.close();
    }
}

function renderText(report) {
    const lines = [
        `db: ${report.db_path}`,
        `sessions: ${report.session_count}`,
        `empty smoke candidates: ${report.empty_smoke_session_candidates.length}`,
        ''
    ];

    for (const row of report.empty_smoke_session_candidates) {
        lines.push(`${row.id} | ${row.title} | ${row.created_at}`);
    }

    return lines.join('\n');
}

export async function main(argv = process.argv.slice(2)) {
    const formatIndex = argv.indexOf('--format');
    const dbArgIndex = argv.indexOf('--db');
    const report = await buildReport({
        dbPath: dbArgIndex >= 0 ? resolve(argv[dbArgIndex + 1]) : defaultDbPath
    });

    if (formatIndex >= 0 && argv[formatIndex + 1] === 'text') {
        console.log(renderText(report));
        return;
    }

    console.log(JSON.stringify(report, null, 2));
}

const isCli = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isCli) {
    main().catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
}
