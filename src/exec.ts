import type { Options, ResultMode, Subprocess } from './types.js';

import { ExecProcess } from './exec-process.js';

function exec<M extends ResultMode = 'result'>(command: string, args?: readonly string[] | null, options?: Partial<Options<M>>): Subprocess<M> {
	const subprocess = new ExecProcess(command, args, options);

	subprocess.spawn();

	return subprocess as unknown as Subprocess<M>;
}

export {
	type Options,
	type ResultMode,
	type Subprocess,
	exec,
}
