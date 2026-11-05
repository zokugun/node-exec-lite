import type { Options, SpawnOptions } from '../types.js';

import path from 'node:path';

import { computeEnv } from './env/computeEnv.js';
import { combineSignals } from '../combineSignals.js';

export function normalizeOptions(options: Options): SpawnOptions {
	const {
		cwd,
		env,
		preferLocal,
		signal,
		stderr,
		stdin,
		stdio: stdioOption,
		stdout,
		...restOptions
	} = options;

	const spawnOptions = restOptions as SpawnOptions;

	spawnOptions.cwd = path.resolve(cwd ?? process.cwd());
	spawnOptions.env = computeEnv(env, preferLocal ?? false, options.localDir ?? spawnOptions.cwd);

	const signals: AbortSignal[] = [];

	if(options.timeout !== undefined) {
		signals.push(AbortSignal.timeout(options.timeout));
	}

	if(signal !== undefined) {
		signals.push(signal);
	}

	if(signals.length > 0) {
		spawnOptions.signal = combineSignals(signals);
	}

	const stdio = stdioOption ?? [undefined, stdout, stderr];

	if(Array.isArray(stdio) && !(typeof stdin === 'string' || (typeof stdin === 'object' && stdin !== null && 'process' in stdin))) {
		stdio[0] = 'pipe';
	}

	spawnOptions.stdio = stdio as SpawnOptions['stdio'];

	return spawnOptions;
}
