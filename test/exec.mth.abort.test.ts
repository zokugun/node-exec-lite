import { expect, it } from 'vitest';

import { exec } from '../src/exec.js';

it.skipIf(process.platform === 'win32')('signal can be used to abort execution', async () => {
	const controller = new AbortController();
	const task = exec('sleep', ['4'], { signal: controller.signal });

	controller.abort();

	const result = await task;

	expect(task.aborted).toBe(true);
	expect(task.killed).toBe(true);
	expect(result.fails).toBe(true);
	expect(result.error!.stderr).toBe('');
	expect(result.error!.stdout).toBe('');
});

it.skipIf(process.platform !== 'win32')('signal can be used to abort execution', async () => {
	const controller = new AbortController();
	const task = exec('ping', ['127.0.0.1', '-n', '2'], { signal: controller.signal });

	controller.abort();

	const result = await task;

	expect(task.aborted).toBe(true);
	expect(task.killed).toBe(true);
	expect(result.fails).toBe(true);
	expect(result.error!.stderr).toBe('');
	expect(result.error!.stdout).toBe('');
});
