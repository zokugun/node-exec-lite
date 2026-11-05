import type { EnvLike } from './types.js';

import { addNodeBinToPath } from './addNodeBinToPath.js';
import { getPathFromEnv } from './getPathFromEnv.js';

export function computeEnv(env: Readonly<EnvLike> | undefined, preferLocal: boolean, localDir: string): Readonly<EnvLike> {
	const computedEnv = {
		...process.env,
		...env,
	};

	if(!preferLocal) {
		return computedEnv;
	}

	const pathEnvInfo = addNodeBinToPath(localDir, getPathFromEnv(computedEnv));

	computedEnv[pathEnvInfo.key] = pathEnvInfo.value;

	return computedEnv;
}
