#!/usr/bin/env node

import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import Database from 'better-sqlite3';

import { buildReport } from './runtime-hygiene-report.mjs';

export function assertPruneAllowed(options = {}) {
    if (options.env?.GROUPCHAT_RUNTIME_PRUNE !== '1') {
        throw new Error('GROUPCHAT_RUNTIME_PRUNE=1 is required for runtime pruning');
    }
    if (!options.confirm) {
        throw new Error('--confirm-empty-smoke-sessions is required for runtime pruning');
    }
    return true;
}

function deleteEmptySmokeSessions(db, candidates) {
    const deleteSession = db.prepare('DELETE FROM sessions WHERE id = ?');
    const deleted = [];
    const tx = db.transaction(rows => {
        for (const row of rows) {
            const result = deleteSession.run(row.id);
            if (result.changes === 1) {
                deleted.push(row.id);
            }
        }
    });

    tx(candidates);
    return deleted;
}

export async function prune(options = {}) {
    if (options.dryRun === false) {
        assertPruneAllowed({
            env: options.env || process.env,
            confirm: options.confirm
        });
    }

    const report = await buildReport({ dbPath: options.dbPath });
    const candidates = report.empty_smoke_session_candidates;
    if (options.dryRun !== false) {
        return {
            dry_run: true,
            candidate_count: candidates.length,
            candidate_ids: candidates.map(row => row.id)
        };
    }

    const db = new Database(report.db_path, {
        timeout: Number(options.timeoutMs || 5000)
    });
    try {
        return {
            dry_run: false,
            deleted_ids: deleteEmptySmokeSessions(db, candidates)
        };
    } finally {
        db.close();
    }
}

export async function main(argv = process.argv.slice(2), env = process.env) {
    const dbArgIndex = argv.indexOf('--db');
    const result = await prune({
        dbPath: dbArgIndex >= 0 ? resolve(argv[dbArgIndex + 1]) : undefined,
        dryRun: !argv.includes('--write'),
        confirm: argv.includes('--confirm-empty-smoke-sessions'),
        env
    });
    console.log(JSON.stringify(result, null, 2));
}

const isCli = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isCli) {
    main().catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
}
