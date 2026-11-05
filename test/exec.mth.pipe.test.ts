import { expect, it } from 'vitest';

import { exec } from '../src/exec.js';

it.skipIf(process.platform === 'win32')('pipe correctly pipes output', async () => {
	const echoTask = exec('echo', ['foo\nbar']);
	const grepTask = echoTask.pipe('grep', ['foo']);
	const result = await grepTask;

	expect(result.fails).toBe(false);
	expect(result.value!.stderr).toBe('');
	expect(result.value!.stdout).toBe('foo\n');
	expect(result.value!.exitCode).toBe(0);
	expect(echoTask.exitCode).toBe(0);
	expect(grepTask.exitCode).toBe(0);
});

it.skipIf(process.platform !== 'win32')('pipe correctly pipes output', async () => {
	const echoProc = exec('node', ['-e', "console.log('foo')"]);
	const grepProc = echoProc.pipe('findstr', ['f']);
	const result = await grepProc;

	expect(result.fails).toBe(false);
	expect(result.value!.stderr).toBe('');
	expect(result.value!.stdout).toBe('foo\n');
	expect(result.value!.exitCode).toBe(0);
	expect(echoProc.exitCode).toBe(0);
	expect(grepProc.exitCode).toBe(0);
});
