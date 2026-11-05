import { expect, it } from 'vitest';

import { exec } from '../src/exec.js';
import { IS_WINDOWS } from './utils/constants.js';

it('gets correct output', async () => {
	const task = exec('node', ['-e', "console.log('foo'); console.log('bar');"]);

	const lines: string[] = [];

	for await(const line of task) {
		lines.push(line);
	}

	expect(lines).toEqual(['foo', 'bar']);
});

it.each(['ignore', 'inherit'] as const)('completes with stdio=%s', async (stdio) => {
	const task = exec('node', ['-e', ''], { stdio });
	const lines: string[] = [];

	for await(const line of task) {
		lines.push(line);
	}

	expect(lines).toEqual([]);
	expect(task.exitCode).toBe(0);
});

it('with non-zero exitCode', async () => {
	const task = exec('node', ['-e', 'process.exit(1)'], {
		stdio: 'ignore',
	});

	// eslint-disable-next-line ts/naming-convention, ts/no-unused-vars
	for await(const _line of task) {
		// no output streams
	}

	expect(task.failed).toBe(true);
	expect(task.exitCode).toBe(1);
});

it('gets output but exit non-zero', async () => {
	const task = exec('node', ['-e', "console.log('foo'); process.exit(1);"]);
	const lines: string[] = [];

	for await(const line of task) {
		lines.push(line);
	}

	expect(lines).toEqual(['foo']);
	expect(task.failed).toBe(true);
	expect(task.exitCode).toBe(1);
});

it('killed by signal', async () => {
	const task = exec('node', ['-e', 'process.kill(process.pid, "SIGTERM")']);

	// eslint-disable-next-line ts/naming-convention, ts/no-unused-vars
	for await(const _line of task) {
		// no output streams
	}

	expect(task.failed).toBe(true);

	if(IS_WINDOWS) {
		expect(task.exitCode).toBe(1);
		expect(task.signalCode).toBe(undefined);
	}
	else {
		expect(task.exitCode).toBe(undefined);
		expect(task.signalCode).toBe('SIGTERM');
	}
});

it('non-existent error', async () => {
	const task = exec('definitelyNonExistent');
	const lines: string[] = [];

	for await(const line of task) {
		lines.push(line)
	}

	expect(task.failed).toBe(true);

	if(IS_WINDOWS) {
		expect(lines).to.eql([`'definitelyNonExistent' is not recognized as an internal or external command,`, 'operable program or batch file.']);
	}
	else {
		expect(task.error?.message).toBe('spawn definitelyNonExistent ENOENT');
	}
});
