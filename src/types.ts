import type { ChildProcess, SpawnOptions as ProcessSpawnOptions } from 'node:child_process';
import type { Readable } from 'node:stream';
import type { Failure, Result, Success } from '@zokugun/xtry';

export type Command<O extends Partial<Options> = {}> = {
	<N extends Partial<Options> = {}>(args?: readonly string[] | null, options?: N): Subprocess<ExecOutput<MergeOptions<O, N>>>;
	toCwdFirst(): (cwd: string, ...args: string[]) => Subprocess<ExecOutput<O>>;
	toFlatArgs(): (...args: string[]) => Subprocess<ExecOutput<O>>;
	withOptions<N extends Partial<Options>>(options: N): Command<MergeOptions<O, N>>;
}

export type ExecFailure = {
	args: readonly string[];
	canceled: boolean;
	cwd?: string;
	command: string;
	durationMs: number;
	error?: Error;
	exitCode?: number;
	merged?: string;
	pipedFrom?: Subprocess;
	signalCode?: string;
	stderr?: string;
	stdout?: string;
}

export type ExecOutput<O> =
	| OptionHandlerResult<O, 'onSuccess', Success<ExecSuccess>>
	| OptionHandlerResult<O, 'onFailure', Failure<ExecFailure>>;

export type ExecResult = Result<ExecSuccess, ExecFailure>;

export type ExecSuccess = {
	args: readonly string[];
	command: string;
	cwd: string;
	durationMs: number;
	error?: undefined;
	exitCode: number;
	merged: string;
	pipedFrom?: Subprocess;
	stderr: string;
	stdout: string;
};

export type KillSignal = Parameters<ChildProcess['kill']>[0];

export type MergeOptions<Base, Overrides> = Omit<Base, keyof Overrides> & Overrides;

export type OptionHandlerResult<O, K extends 'onSuccess' | 'onFailure', Fallback> = K extends keyof O
	? NonNullable<O[K]> extends (...args: never[]) => infer R ? unknown extends R ? Fallback : Awaited<R> : Fallback
	: Fallback;

export type Options = Omit<ProcessSpawnOptions, 'cwd' | 'env' | 'stdio'> & Readonly<Partial<{
	cwd?: string;
	env: Readonly<Partial<Record<string, string>>>;
	localDir: string;
	onSuccess: (value: Success<ExecSuccess>) => unknown;
	onFailure: (error: Failure<ExecFailure>) => unknown;
	preferLocal: boolean;
	signal: AbortSignal;
	stderr: StdioOption;
	stdin: ExecResult | StdinOption | Subprocess;
	stdio: readonly [StdinOption, ...readonly StdioOption[]] | SpawnOptions['stdio'];
	stdout: StdioOption;
}>>;

export type SpawnOptions = { cwd: string } & Omit<ProcessSpawnOptions, 'cwd'>;

export type StdinOption = StdioOption | Readable | { readonly string?: string };
export type StdioOption = Readonly<Exclude<SpawnOptions['stdio'], undefined>[number]>;

export type Subprocess<R = ExecResult> = AsyncIterable<string> & PromiseLike<R> & {
	get aborted(): boolean;
	get error(): Error | undefined;
	get exitCode(): number | undefined;
	get failed(): boolean;
	kill: (signal?: KillSignal) => boolean;
	get killed(): boolean;
	get pid(): number | undefined;
	pipe: <O extends Partial<Options> = {}>(command: string, args?: readonly string[], options?: O) => Subprocess<ExecOutput<O>>;
	get process(): ChildProcess | undefined;
	get signalCode(): string | undefined;
};
