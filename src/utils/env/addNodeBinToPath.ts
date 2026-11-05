import type { EnvPathInfo } from './types.js';

import path from 'node:path';

export function addNodeBinToPath(cwd: string, { value, key }: EnvPathInfo): EnvPathInfo {
	const parts = value.split(path.delimiter);

	const nodeBinPaths: string[] = [];

	let currentPath = cwd;
	let lastPath: string;

	do {
		nodeBinPaths.push(path.resolve(currentPath, 'node_modules', '.bin'));
		lastPath = currentPath;
		currentPath = path.dirname(currentPath);
	}
	while(currentPath !== lastPath);

	nodeBinPaths.push(path.dirname(process.execPath));

	const newValue = nodeBinPaths.concat(parts).join(path.delimiter);

	return {
		key,
		value: newValue,
	};
}
