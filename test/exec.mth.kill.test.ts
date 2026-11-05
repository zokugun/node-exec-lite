import { expect, it } from 'vitest';

import { exec } from '../src/exec.js';

it.skipIf(process.platform === 'win32')('kill terminates the process', async () => {
	const task = exec('sleep', ['5']);
	const result = task.kill();

	expect(result).toBe(true);
	expect(task.killed).toBe(true);
	expect(task.aborted).toBe(false);
});

it.skipIf(process.platform !== 'win32')('kill terminates the process', async () => {
	const task = exec('ping', ['127.0.0.1', '-n', '2']);
	const result = task.kill();

	expect(result).toBe(true);
	expect(task.killed).toBe(true);
	expect(task.aborted).toBe(false);
});
