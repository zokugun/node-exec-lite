import { Readable } from 'node:stream';
import { expect, it } from 'vitest';

import { ExecProcess } from '../src/exec-process.js';
import { exec } from '../src/exec.js';

it('supports stdin passed as a string', async () => {
	let result = await exec('node', ['-e', 'process.stdin.pipe(process.stdout)'], {	stdin: 'foo\nbar' });

	expect(result.value!.stdout).toBe('foo\nbar');
	expect(result.value!.stderr).toBe('');
	expect(result.value!.exitCode).toBe(0);

	// ensuring that empty string doesn’t cause issues
	result = await exec('node', ['-e', "process.stdout.write(String(fs.readFileSync(0,'utf8').length))"], { stdin: '' });

	expect(result.value!.stdout).toBe('0');
	expect(result.value!.stderr).toBe('');
	expect(result.value!.exitCode).toBe(0);
});

it('supports stdin passed as a readable stream', async () => {
	const stdin = Readable.from(['foo', 'bar']);
	const result = await exec('node', ['-e', 'process.stdin.pipe(process.stdout)'], { stdin });

	expect(result.value!.stdout).toBe('foobar');
	expect(result.value!.stderr).toBe('');
	expect(result.value!.exitCode).toBe(0);
});

it('supports stdin passed as another process (Result)', async () => {
	const task = exec('node', ['-e', "process.stdout.write('foo\\nbar')"]);
	const result = await exec('node', ['-e', 'process.stdin.pipe(process.stdout)'], { stdin: task });

	expect(result.value!.stdout).toBe('foo\nbar');
	expect(result.value!.stderr).toBe('');
	expect(result.value!.exitCode).toBe(0);
	expect(result.value!.pipedFrom).toBe(task);
});

it('supports stdin passed as another process (ExecProcess)', async () => {
	const task = new ExecProcess('node', ['-e', "process.stdout.write('foo\\nbar')"]);

	task.spawn();

	const result = await exec('node', ['-e', 'process.stdin.pipe(process.stdout)'], { stdin: task });

	expect(result.value!.stdout).toBe('foo\nbar');
	expect(result.value!.stderr).toBe('');
	expect(result.value!.exitCode).toBe(0);
});

it('missing stdin - timeout', async () => {
	const result = await exec('node', ['-e', "process.stdout.write('foo\\nbar');process.stdin.pipe(process.stdout);"], { timeout: 1000 });

	expect(result.error!.canceled).toBe(true);
	expect(result.error!.stdout).toBe('foo\nbar');
	expect(result.error!.stderr).toBe('');
});
