import type { ChildProcess, SpawnOptions as ProcessSpawnOptions } from 'node:child_process';
import type { Result } from '@zokugun/xtry';

// export type ErrorResult = {
// 	all?: string;
// 	command: string;
// 	durationMs: number;
// 	error?: Error;
// 	exitCode?: number;
// 	fails: true;
// 	isCanceled: boolean;
// 	pipedFrom?: ExecResult;
// 	stderr?: string;
// 	stdout?: string;
// };

// export type ErrorResult = { fails: true } & ExecError;

export type ExecFailure = {
	all?: string;
	canceled: boolean;
	command: string;
	durationMs: number;
	error?: Error;
	exitCode?: number;
	pipedFrom?: ExecResult;
	signalCode?: string;
	stderr?: string;
	stdout?: string;
};

// export type ExecResult = ErrorResult | SuccessResult;
export type ExecResult = Result<ExecSuccess, ExecFailure>;

export type ExecSuccess = {
	all: string;
	command: string;
	durationMs: number;
	error?: undefined;
	exitCode: number;
	// fails: false;
	pipedFrom?: ExecResult;
	stderr: string;
	stdout: string;
};

export type KillSignal = Parameters<ChildProcess['kill']>[0];

export type Options = Omit<ProcessSpawnOptions, 'cwd' | 'env' | 'stdio'> & Readonly<Partial<{
	cwd?: string;
	env: Readonly<Partial<Record<string, string>>>;
	localDir: string;
	preferLocal: boolean;
	signal: AbortSignal;
	stderr: StdioOption;
	stdin: ExecResult | StdinOption | Subprocess;
	stdio: readonly [StdinOption, ...readonly StdioOption[]] | SpawnOptions['stdio'];
	stdout: StdioOption;
}>>;

export type SpawnOptions = { cwd: string } & Omit<ProcessSpawnOptions, 'cwd'>;

export type StdinOption = StdioOption | { readonly string?: string };
export type StdioOption = Readonly<Exclude<SpawnOptions['stdio'], undefined>[number]>;

export type Subprocess = AsyncIterable<string> & PromiseLike<ExecResult> & {
	get aborted(): boolean;
	get error(): Error | undefined;
	get exitCode(): number | undefined;
	get failed(): boolean;
	kill: (signal?: KillSignal) => boolean;
	get killed(): boolean;
	get pid(): number | undefined;
	pipe: (command: string, args?: readonly string[], options?: Partial<Options>) => Subprocess;
	get process(): ChildProcess | undefined;
	get signalCode(): string | undefined;
};
