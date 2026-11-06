import type { Options } from '../src/types.js';

import fse from '@zokugun/fs-extra-plus';
import { expect, it } from 'vitest';

import { FIXTURES_DIRECTORY, IS_MACOS, IS_WINDOWS } from './utils/constants.js';
import { exec } from '../src/exec.js';

it('pid is number', async () => {
	const task = exec('echo', ['foo']);

	await task;

	expect(typeof task.pid === 'number').toBe(true);
});

it('exitCode is set correctly', async () => {
	const task = exec('echo', ['foo']);

	expect(task.exitCode).toBe(undefined);

	const result = await task;

	expect(task.exitCode).toBe(0);
	expect(result.fails).toBe(false);
	expect(result.value!.exitCode).toBe(0);
});

it('resolves to stdout', async () => {
	const result = await exec('node', ['-e', "console.log('foo')"]);

	expect(result.fails).toBe(false);
	expect(result.value!.stdout).toBe('foo\n');
	expect(result.value!.stderr).toBe('');
});

it('captures stderr', async () => {
	const result = await exec('node', ['-e', "console.error('some error')"]);

	expect(result.fails).toBe(false);
	expect(result.value!.stderr).toBe('some error\n');
	expect(result.value!.stdout).toBe('');
});

it('non-zero exitCode', async () => {
	const result = await exec('node', ['-e', 'process.exit(1)'], {
		stdio: 'ignore',
	});

	expect(result.fails).toBe(true);
	expect(result.error!.exitCode).toBe(1);
});

it('killed by signal', async () => {
	const result = await exec('node', ['-e', 'process.kill(process.pid, "SIGTERM")']);

	expect(result.fails).toBe(true);

	if(IS_WINDOWS) {
		expect(result.error!.exitCode).toBe(1);
		expect(result.error!.signalCode).toBe(undefined);
	}
	else {
		expect(result.error!.exitCode).toBe(undefined);
		expect(result.error!.signalCode).toBe('SIGTERM');
	}
});

it('non-existent, no shell', async () => {
	const task = exec('definitelyNonExistent');
	const result = await task;

	expect(result.fails).toBe(true);

	if(IS_WINDOWS) {
		expect(result.error!.stderr).toContain(`'definitelyNonExistent' is not recognized as an internal or external command,\r\noperable program or batch file`);
		expect(result.error!.stdout).toBe('');
	}
	else {
		expect(result.error!.error?.message).toBe('spawn definitelyNonExistent ENOENT');
	}
});

it('non-existent, with shell', async () => {
	const task = exec('definitelyNonExistent', null, { shell: true });
	const result = await task;

	expect(result.fails).toBe(true);

	if(IS_WINDOWS) {
		expect(result.error!.stderr).toContain(`'definitelyNonExistent' is not recognized as an internal or external command,\r\noperable program or batch file`);
		expect(result.error!.stdout).toBe('');
	}
	else if(IS_MACOS) {
		expect(result.error!.stderr).toContain('definitelyNonExistent: command not found');
	}
	else {
		expect(result.error!.stderr).toContain('definitelyNonExistent: not found');
	}
});

it('single time at once', async () => {
	const inputs = Array.from({ length: 1 }, (_, index) => `${index}`);
	const results = await Promise.all(inputs.map((input) => exec('node', ['-p', input])));

	expect(results.map((result) => result.value?.stdout.trim())).to.eql(inputs);
});

it('many times at once', async () => {
	const inputs = Array.from({ length: 100 }, (_, index) => `${index}`);
	const results = await Promise.all(inputs.map((input) => exec('node', ['-p', input])));

	expect(results.map((result) => result.value?.stdout.trim())).to.eql(inputs);
});

it.skipIf(process.platform !== 'win32')('double escapes for batch files', async () => {
	const result = await exec(fse.join(FIXTURES_DIRECTORY, 'echo_args.cmd'), ['"&echo INJECTED']);

	expect(result.fails).toBe(false);
	expect(result.value!.stdout).toContain('&echo INJECTED');
	expect(result.value!.stdout.split(/\r?\n/)).not.toContain('INJECTED');
});


it('invalid spawn option', async () => {
	const result = await exec('node', ['-e', "console.log('foo')"], { detached: 'true' } as unknown as Partial<Options>);

	expect(result.fails).toBe(true);
	expect(result.error!.error?.message).toContain('options.detached');
});
