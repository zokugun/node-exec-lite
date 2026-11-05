import type { EnvLike, EnvPathInfo } from './types.js';

export function getPathFromEnv(env: EnvLike): EnvPathInfo {
	for(const key in env) {
		if(key.toLowerCase() !== 'path') {
			continue;
		}

		const value = env[key];

		if(!value) {
			return {
				key: 'PATH',
				value: '',
			};
		}

		return { key, value };
	}

	return {
		key: 'PATH',
		value: '',
	};
}
