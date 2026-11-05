import type { ChildProcess } from 'node:child_process';
import type { Readable } from 'node:stream';
import type { ExecFailure, ExecResult, ExecSuccess, KillSignal, Options, Subprocess } from './types.js';

import { spawn } from 'node:child_process';
import readline from 'node:readline';
import { err, ok } from '@zokugun/xtry';

import { exec } from './exec.js';
import { normalizeCommand } from './utils/command/normalizeCommand.js';
import { normalizeOptions } from './utils/normalizeOptions.js';
import { combineStreams } from './utils/stream/combineStreams.js';
import { readStream, StreamContext } from './utils/stream/readStream.js';

export class ExecProcess implements Subprocess {
	protected _aborted: boolean = false;
	protected _args: readonly string[];
	protected _command: string;
	protected _failed: boolean = false;
	protected _options: Partial<Options>;
	protected _process?: ChildProcess;
	protected _processClosed: Promise<void>;
	protected _resolveClose?: () => void;
	protected _signal?: AbortSignal;
	protected _start?: bigint;
	protected _streamErr?: Readable;
	protected _streamOut?: Readable;
	protected _thrownError?: Error;

	public constructor(command: string, args?: readonly string[] | null, options?: Partial<Options>) { // {{{
		this._options = {
			timeout: undefined,
			windowsHide: true,
			...options,
		};
		this._command = command;
		this._args = args ?? [];
		this._processClosed = new Promise<void>((resolve) => {
			this._resolveClose = resolve;
		});
	} // }}}

	public get aborted(): boolean { // {{{
		return this._aborted;
	} // }}}

	public get error(): Error | undefined { // {{{
		return this._thrownError;
	} // }}}

	public get exitCode(): number | undefined { // {{{
		return this._process?.exitCode ?? undefined;
	} // }}}

	public get failed(): boolean { // {{{
		return this._failed;
	} // }}}

	public get killed(): boolean { // {{{
		return this._process?.killed === true;
	} // }}}

	public get pid(): number | undefined { // {{{
		return this._process?.pid;
	} // }}}

	public get process(): ChildProcess | undefined { // {{{
		return this._process;
	} // }}}

	public get signalCode(): string | undefined { // {{{
		return this._process?.signalCode ?? undefined;
	} // }}}

	public kill(signal?: KillSignal): boolean { // {{{
		return this._process?.kill(signal) === true;
	} // }}}

	public pipe(command: string, args?: readonly string[], options?: Partial<Options>): Subprocess { // {{{
		return exec(command, args, {
			...options,
			stdin: this,
		});
	} // }}}

	public spawn(): void { // {{{
		this._start = process.hrtime.bigint();

		// const options = { ...this._options };
		// const cwd = options.cwd ?? process.cwd();
		// const signals: AbortSignal[] = [];

		this.reset();

		// if(options.timeout !== undefined) {
		// 	signals.push(AbortSignal.timeout(options.timeout));
		// }

		// if(options.signal !== undefined) {
		// 	signals.push(options.signal);
		// }

		// if(signals.length > 0) {
		// 	// eslint-disable-next-line no-multi-assign
		// 	options.signal = this._signal = combineSignals(signals);
		// }

		// options.env = computeEnv(options.env, options.preferLocal ?? false, options.localDir ?? cwd);

		// console.log(options.stdout)
		// console.log(this._options)
		const normalizedOptions = normalizeOptions(this._options);

		if(normalizedOptions.signal) {
			this._signal = normalizedOptions.signal;
		}

		const { command: spawnCommand, args: spawnArgs, options: spawnOptions } = normalizeCommand(this._command, this._args, normalizedOptions);

		// console.log(spawnOptions)

		let task: ChildProcess;

		try {
			task = spawn(spawnCommand, spawnArgs, spawnOptions);
		}
		catch(error) {
			if(error instanceof Error) {
				this._thrownError = error;
			}
			else {
				this._thrownError = new Error(String(error));
			}

			return;
		}

		if(task.stderr) {
			this._streamErr = task.stderr;
		}

		if(task.stdout) {
			this._streamOut = task.stdout;
		}

		this._process = task;
		task.once('error', this.onError.bind(this));
		task.once('close', this.onClose.bind(this));

		if(task.stdin) {
			const { stdin } = this._options;

			if(typeof stdin === 'string') {
				task.stdin.end(stdin);
			}
			else if(typeof stdin === 'object' && stdin !== null && 'process' in stdin) {
				stdin.process?.stdout?.pipe(task.stdin);
			}
		}
	} // }}}

	// eslint-disable-next-line ts/explicit-member-accessibility
	async *[Symbol.asyncIterator](): AsyncIterator<string> { // {{{
		const handle = this._process;

		if(!handle) {
			return;
		}

		const streams: Readable[] = [];

		if(this._streamErr) {
			streams.push(this._streamErr);
		}
		if(this._streamOut) {
			streams.push(this._streamOut);
		}

		const streamCombined = combineStreams(streams);
		const rl = readline.createInterface({ input: streamCombined });

		for await(const chunk of rl) {
			// eslint-disable-next-line ts/no-unnecessary-type-conversion
			yield chunk.toString();
		}

		await this._processClosed;

		handle.removeAllListeners();

		// if(this._thrownError) {
		// 	return err(toExecError(this._thrownError));
		// }

		// if (
		// 	this._options?.throwOnError &&
		// 	((this.exitCode !== 0 && this.exitCode !== undefined) ||
		// 		this.signalCode !== null)
		// ) {
		// 	throw new NonZeroExitError(this, undefined, this._command, this._args);
		// }
		if(this._thrownError || (this.exitCode !== 0 && this.exitCode !== undefined) || this.signalCode !== undefined) {
			this._failed = true;
		}
	} // }}}

	// eslint-disable-next-line ts/promise-function-async
	public then<TResult1 = ExecResult, TResult2 = never>(onfulfilled?: ((value: ExecResult) => PromiseLike<TResult1> | TResult1) | null, onrejected?: ((reason: unknown) => PromiseLike<TResult2> | TResult2) | null): Promise<TResult1 | TResult2> { // {{{
		return this.toResult().then(onfulfilled, onrejected);
	} // }}}

	protected onClose(): void { // {{{
		if(this._resolveClose) {
			this._resolveClose();
		}
	} // }}}

	protected onError(error: Error): void { // {{{
		if(error.name === 'AbortError' && (!(error.cause instanceof Error) || error.cause.name !== 'TimeoutError')) {
			this._aborted = true;

			return;
		}

		this._thrownError = error;
	} // }}}

	protected reset(): void { // {{{
		this._aborted = false;
		this._process = undefined;
		this._processClosed = new Promise<void>((resolve) => {
			this._resolveClose = resolve;
		});
		this._signal = undefined;
		this._streamErr = undefined;
		this._streamOut = undefined;
		this._thrownError = undefined;
	} // }}}

	protected toFailure(error: Error): ExecFailure { // {{{
		this._failed = true;

		const result: ExecFailure = {
			all: '',
			canceled: this._signal?.aborted ?? false,
			command: this._command,
			durationMs: Number(process.hrtime.bigint() - this._start!) / 1e6,
			error,
			exitCode: this.exitCode,
			signalCode: this.signalCode,
		};

		return result;
	} // }}}

	protected async toResult(): Promise<ExecResult> { // {{{
		if(this._thrownError) {
			return err(this.toFailure(this._thrownError));
		}

		const task = this._process;

		if(!task) {
			return err(this.toFailure(new Error('No process was started')));
		}

		const context: StreamContext = { all: '' };

		const [stdout, stderr] = await Promise.all([
			this._streamOut ? readStream(this._streamOut, context) : '',
			this._streamErr ? readStream(this._streamErr, context) : '',
		]);

		await this._processClosed;

		const { stdin } = this._options;

		if(stdin && typeof stdin !== 'string') {
			await stdin;
		}

		task.removeAllListeners();

		if(this._thrownError) {
			return err(this.toFailure(this._thrownError));
		}

		const result: ExecSuccess = {
			all: context.all,
			command: this._command,
			durationMs: Number(process.hrtime.bigint() - this._start!) / 1e6,
			exitCode: this.exitCode!,
			stderr,
			stdout,
		};

		if(this._options.stdin instanceof ExecProcess) {
			// result.pipedFrom = this._options.stdin;
		}

		// if (this._options.throwOnError &&
		// 	((this.exitCode !== 0 && this.exitCode !== undefined) ||
		// 		this.signalCode !== null)
		// ) {
		// 	// throw new NonZeroExitError(this, result, this._command, this._args);
		// 	return toErrorResult(this._thrownError);
		// }
		if((this.exitCode !== 0 && this.exitCode !== undefined) || this.signalCode !== undefined) {
			this._failed = true;

			const failure = result as unknown as ExecFailure;

			failure.signalCode = this.signalCode;

			return err(failure);
		}

		return ok(result);
	} // }}}
}
