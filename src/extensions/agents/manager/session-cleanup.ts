import { readdirSync, statSync, unlinkSync } from "node:fs"
import { join, resolve } from "node:path"

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Remove `.jsonl` session files in `sessionDir` whose mtime is older than 7 days.
 *
 * `protectedFiles` are left untouched so the currently active session (and any
 * other explicitly guarded files) are never deleted. Errors are logged and
 * swallowed — cleanup should never crash a running session.
 */
export function cleanupOldSessionFiles(
	sessionDir: string,
	protectedFiles?: string | string[],
	now: Date = new Date(),
): void {
	const protectedSet = new Set<string>(
		(protectedFiles === undefined
			? []
			: Array.isArray(protectedFiles)
				? protectedFiles
				: [protectedFiles]
		).map((p) => resolve(p)),
	)

	let entries: string[]
	try {
		entries = readdirSync(sessionDir)
	} catch (err) {
		const code = (err as NodeJS.ErrnoException).code
		if (code === "ENOENT") return
		console.warn(
			`[session-cleanup] failed to read ${sessionDir}: ${err instanceof Error ? err.message : String(err)}`,
		)
		return
	}

	const cutoff = now.getTime() - SEVEN_DAYS_MS
	for (const entry of entries) {
		if (!entry.endsWith(".jsonl")) continue

		const fullPath = resolve(join(sessionDir, entry))
		if (protectedSet.has(fullPath)) continue

		let mtime: number
		try {
			mtime = statSync(fullPath).mtime.getTime()
		} catch (err) {
			console.warn(
				`[session-cleanup] failed to stat ${fullPath}: ${err instanceof Error ? err.message : String(err)}`,
			)
			continue
		}

		if (mtime >= cutoff) continue

		try {
			unlinkSync(fullPath)
			console.log(`[session-cleanup] removed old session file: ${fullPath}`)
		} catch (err) {
			console.warn(
				`[session-cleanup] failed to remove ${fullPath}: ${err instanceof Error ? err.message : String(err)}`,
			)
		}
	}
}
