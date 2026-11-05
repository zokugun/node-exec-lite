import { setTimeout } from 'node:timers/promises';
import { expect, it } from 'vitest';

import { exec } from '../src/exec.js';

export const MULTIBYTE_STR = '.\u{1F984}.';

it('stdout=ignore', async () => {
	const result = await exec(
		'node',
		[
			'-e',
			'console.log("foobar"); setTimeout(() => { console.error("quxbaz"); }, 0);',
		],
		{
			stdout: 'ignore',
		},
	);

	expect(result.fails).toBe(false);
	expect(result.value!.stdout).toBe('');
	expect(result.value!.stderr).toContain('quxbaz');
	expect(result.value!.all).toContain('quxbaz');
	expect(result.value!.exitCode).toBe(0);
});

it('stderr=ignore', async () => {
	const result = await exec(
		'node',
		[
			'-e',
			'console.log("foobar"); setTimeout(() => { console.error("quxbaz"); }, 0);',
		],
		{
			stderr: 'ignore',
		},
	);

	expect(result.fails).toBe(false);
	expect(result.value!.stdout).toContain('foobar');
	expect(result.value!.stderr).toBe('');
	expect(result.value!.all).toContain('foobar');
	expect(result.value!.exitCode).toBe(0);
});

it('stdout=ignore,stderr=ignore', async () => {
	const result = await exec(
		'node',
		[
			'-e',
			'console.log("foobar"); setTimeout(() => { console.error("quxbaz"); }, 0);',
		],
		{
			stdout: 'ignore',
			stderr: 'ignore',
		},
	);

	expect(result.fails).toBe(false);
	expect(result.value!.stdout).toBe('');
	expect(result.value!.stderr).toBe('');
	expect(result.value!.all).toBe('');
	expect(result.value!.exitCode).toBe(0);
});

it('multibyte sequences', async () => {
	const subprocess = exec(
		'node',
		[
			'-e',
			'process.stdin.pipe(process.stdout);',
		],
	);

	const { stdin } = subprocess.process!;

	stdin!.write(MULTIBYTE_STR.slice(0, 3));

	await setTimeout(100);

	stdin!.end(MULTIBYTE_STR.slice(3));

	const result = await subprocess;

	expect(result.fails).toBe(false);

	expect(result.value!.stdout).toContain(MULTIBYTE_STR);
	expect(result.value!.all).toContain(MULTIBYTE_STR);
});
