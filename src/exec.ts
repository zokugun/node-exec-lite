import type { ExecOutput, Options, Subprocess } from './types.js';

import { ExecProcess } from './exec-process.js';

function exec<O extends Partial<Options> = {}>(command: string, args?: readonly string[] | null, options?: O & Partial<Options>): Subprocess<ExecOutput<O>> {
	const subprocess = new ExecProcess(command, args, options as Partial<Options> | undefined);

	subprocess.spawn();

	return subprocess as unknown as Subprocess<ExecOutput<O>>;
}

export {
	type Options,
	type Subprocess,
	exec,
}
