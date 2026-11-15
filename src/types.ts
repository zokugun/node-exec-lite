import type { ChildProcess, SpawnOptions as ProcessSpawnOptions } from 'node:child_process';
import type { Result } from '@zokugun/xtry';

export type ExecFailure = {
	args: readonly string[];
	canceled: boolean;
	cwd?: string;
	command: string;
	durationMs: number;
	error?: Error;
	exitCode?: number;
	merged?: string;
	pipedFrom?: ExecResult;
	signalCode?: string;
	stderr?: string;
	stdout?: string;
}

export type ResultMode = 'merged' | 'result';

export type ExecResult<M extends ResultMode = 'result'> = M extends 'merged' ? string : Result<ExecSuccess, ExecFailure>;

export type ExecSuccess = {
	args: readonly string[];
	command: string;
	cwd: string;
	durationMs: number;
	error?: undefined;
	exitCode: number;
	merged: string;
	pipedFrom?: ExecResult;
	stderr: string;
	stdout: string;
};

export type KillSignal = Parameters<ChildProcess['kill']>[0];

export type Options<M extends ResultMode = ResultMode> = Omit<ProcessSpawnOptions, 'cwd' | 'env' | 'stdio'> & Readonly<Partial<{
	cwd?: string;
	env: Readonly<Partial<Record<string, string>>>;
	localDir: string;
	preferLocal: boolean;
	resultMode: M;
	signal: AbortSignal;
	stderr: StdioOption;
	stdin: ExecResult | StdinOption | Subprocess<ResultMode>;
	stdio: readonly [StdinOption, ...readonly StdioOption[]] | SpawnOptions['stdio'];
	stdout: StdioOption;
}>>;

export type SpawnOptions = { cwd: string } & Omit<ProcessSpawnOptions, 'cwd'>;

export type StdinOption = StdioOption | { readonly string?: string };
export type StdioOption = Readonly<Exclude<SpawnOptions['stdio'], undefined>[number]>;

export type Subprocess<M extends ResultMode = 'result'> = AsyncIterable<string> & PromiseLike<ExecResult<M>> & {
	get aborted(): boolean;
	get error(): Error | undefined;
	get exitCode(): number | undefined;
	get failed(): boolean;
	kill: (signal?: KillSignal) => boolean;
	get killed(): boolean;
	get pid(): number | undefined;
	pipe: <N extends ResultMode = 'result'>(command: string, args?: readonly string[], options?: Partial<Options> & { resultMode?: N }) => Subprocess<N>;
	get process(): ChildProcess | undefined;
	get signalCode(): string | undefined;
};
