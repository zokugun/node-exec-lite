import { expect, it } from 'vitest';

import { exec } from '../src/exec.js';

it.skipIf(process.platform === 'win32')('times out after defined timeout (ms)', async () => {
	const task = exec('sleep', ['0.2'], { timeout: 100 });
	const result = await task;

	expect(task.killed).toBe(true);
	expect(task.process!.signalCode).toBe('SIGTERM');

	expect(result.fails).toBe(true);
	expect(result.error!.canceled).toBe(true);
	expect(result.error!.error!.message).toBe('The operation was aborted');
});

it.skipIf(process.platform !== 'win32')('times out after defined timeout (ms)', async () => {
	const task = exec('ping', ['127.0.0.1', '-n', '2'], { timeout: 100 });
	const result = await task;

	expect(task.killed).toBe(true);
	expect(task.process!.signalCode).toBe('SIGTERM');

	expect(result.fails).toBe(true);
	expect(result.error!.canceled).toBe(true);
	expect(result.error!.error!.message).toBe('The operation was aborted');
});
