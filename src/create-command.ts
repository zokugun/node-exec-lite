import type { Command, MergeOptions, Options, Subprocess } from './types.js';

import { exec } from './exec.js';

function createCommand<O extends Partial<Options> = {}>(command: string, args: readonly string[] | null = [], options: O & Partial<Options> = {} as O & Partial<Options>): Command<O> {
	const create = <C extends Partial<Options>>(currentOptions: C): Command<C> => {
		const run = ((runArgs, runOptions) => {
			return exec(command, [...(args ?? []), ...(runArgs ?? [])], {
				...currentOptions,
				...runOptions,
			});
		}) as unknown as Command<C>;

		run.withOptions = <N extends Partial<Options>>(overrides: N) => create<MergeOptions<C, N>>({ ...currentOptions, ...overrides } as MergeOptions<C, N>);
		run.toCwdFirst = () => ((cwd, ...runArgs) => run(runArgs, { cwd })) as unknown as ReturnType<Command<C>['toCwdFirst']>;
		run.toFlatArgs = () => ((...runArgs) => run(runArgs)) as unknown as ReturnType<Command<C>['toFlatArgs']>;

		return run;
	};

	return create(options);
}

export {
	type Command,
	type Options,
	type Subprocess,
	createCommand,
}
