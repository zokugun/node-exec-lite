import fse from '@zokugun/fs-extra-plus';
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

it.skipIf(process.platform === 'win32')('preserves leading ./ so cwd-local binary is run, not PATH lookup', async () => {
	const dirResult = await fse.makeTempDirAsync({
		prefix: 'tinyexec-relpath-',
		defer: true,
	});

	expect(dirResult.fails).toBe(false);

	const { path, remove } = dirResult.value!;
	const scriptPath = fse.join(path, 'mytool');

	fse.writeFileSync(scriptPath, '#!/bin/sh\necho local\n');
	fse.chmodSync(scriptPath, 0o755);

	const result = await exec('./mytool', [], {
		cwd: path,
		env: { PATH: '/usr/bin:/bin' },
	});

	expect(result.fails).toBe(false);
	expect(result.value!.exitCode).toBe(0);
	expect(result.value!.stdout).toBe('local\n');

	await remove();
});

it.skipIf(process.platform !== 'win32')('preserves leading ./ so cwd-local binary is run, not PATH lookup', async () => {
	const dirResult = await fse.makeTempDirAsync({
		prefix: 'tinyexec-relpath-',
		defer: true,
	});

	expect(dirResult.fails).toBe(false);

	const { path, remove } = dirResult.value!;
	const scriptPath = fse.join(path, 'mytool.cmd');

	fse.writeFileSync(scriptPath, '@echo local\r\n');

	const result = await exec('./mytool.cmd', [], { cwd: path });

	expect(result.fails).toBe(false);
	expect(result.value!.exitCode).toBe(0);
	expect(result.value!.stdout).toBe('local\r\n');

	await remove();
});
