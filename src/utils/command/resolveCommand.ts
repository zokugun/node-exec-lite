import type { SpawnOptions } from '../../types.js';

import fs from 'node:fs';
import path from 'node:path';

import { getPathFromEnv } from '../env/getPathFromEnv.js';

const CACHE = Object.create(null) as Record<string, string | null>;
const DEFAULT_PATH_EXT = ['.EXE', '.CMD', '.BAT', '.COM'];

export function resolveCommand(command: string, options: SpawnOptions): string | null {
	const cwd = options.cwd ?? process.cwd();
	const env = options.env ?? process.env;
	const pathEnv = getPathFromEnv(env).value;
	const key = `${command}%%%%${pathEnv}`;

	if(CACHE[key] !== undefined) {
		return CACHE[key];
	}

	const parts = command.includes('/') || command.includes('\\') ? [''] : [cwd, ...pathEnv.split(path.delimiter)];
	let pathExt = env.PATHEXT ? env.PATHEXT.split(path.delimiter) : DEFAULT_PATH_EXT;

	if(command.includes('.') && pathExt[0] !== '') {
		pathExt = ['', ...pathExt];
	}

	for(const part of parts) {
		const unquoted = part.startsWith('"') && part.endsWith('"') && part.length > 1 ? part.slice(1, -1) : part;
		const dest = path.resolve(cwd, unquoted, command);

		for (const ext of [...pathExt, '']) {
			const destWithExt = dest + ext;

			try {
				if (fs.statSync(destWithExt).isFile()) {
					CACHE[key] = destWithExt;

					return destWithExt;
				}
			}
			catch {
				// do nothing, it didn't exist
			}
		}
	}

	CACHE[key] = null;

	return null;
}
