import type { Command, Options, ResultMode, Subprocess } from './types.js';

import { exec } from './exec.js';

function createCommand<M extends ResultMode = 'result'>(command: string, args: readonly string[] | null = [], options: Partial<Options<M>> = {}): Command<M> {
	const create = (options: Partial<Options<M>>): Command<M> => {
		const run = ((runArgs, runOptions): Subprocess<M> => {
			return exec(command, [...(args ?? []), ...(runArgs ?? [])], {
				...options,
				...runOptions,
			}) as Subprocess<M>;
		}) as Command<M>;

		run.withOptions = (overrides) => create({ ...options, ...overrides });
		run.toCwdFirst = () => ((cwd, ...runArgs) => run(runArgs, { cwd }));
		run.toFlatArgs = () => ((...runArgs) => run(runArgs));

		return run;
	};

	return create(options);
}

export {
	type Command,
	type Options,
	type ResultMode,
	type Subprocess,
	createCommand,
}
