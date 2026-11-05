import type { Options, Subprocess } from './types.js';

import { ExecProcess } from './exec-process.js';

export function exec(command: string, args?: readonly string[] | null, options?: Partial<Options>): Subprocess {
	const subprocess = new ExecProcess(command, args, options);

	subprocess.spawn();

	return subprocess;
}
