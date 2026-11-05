import fse from '@zokugun/fs-extra-plus';
import { expect, it } from 'vitest';

import { exec } from '../src/exec.js';
import { getPathFromEnv } from '../src/utils/env/getPathFromEnv.js';
import { FIXTURES_DIRECTORY } from './utils/constants.js';

const PATH = getPathFromEnv(process.env)
	.value
	.split(fse.delimiter)
	.filter((path) => !path.includes(fse.join('node_modules', '.bin')))
	.join(fse.delimiter);

const ENV = { Path: undefined, PATH };

it('=false', async () => {
	const result = await exec(
		'node',
		['-e', 'console.log(process.env.PATH)'],
		{
			preferLocal: false,
			env: ENV,
		},
	);

	expect(result.fails).toBe(false);
	expect(result.value!.stdout).not.toMatch(fse.join(process.cwd(), 'node_modules', '.bin'));
});

it('=true', async () => {
	const result = await exec(
		'node',
		['-e', 'console.log(process.env.PATH)'],
		{
			preferLocal: true,
			env: ENV,
		},
	);

	expect(result.fails).toBe(false);
	expect(result.value!.stdout).toMatch(fse.join(process.cwd(), 'node_modules', '.bin'));
});

it('with-cwd', async () => {
	const result = await exec(
		'node',
		['-e', 'console.log(process.env.PATH)'],
		{
			preferLocal: true,
			cwd: FIXTURES_DIRECTORY,
			env: ENV,
		},
	);

	expect(result.fails).toBe(false);

	// Adds ./node_modules/.bin relative to cwd
	expect(result.value!.stdout).toMatch(fse.join(FIXTURES_DIRECTORY, 'node_modules', '.bin'));

	// Also adds from root of repository, two directories up from fixtures
	const repoRootDir = fse.join(FIXTURES_DIRECTORY, '..');

	expect(result.value!.stdout).toMatch(fse.join(repoRootDir, 'node_modules', '.bin'));
});

it('with-localDir', async () => {
	const result = await exec(
		'node',
		['-e', 'console.log(process.env.PATH)'],
		{
			preferLocal: true,
			localDir: FIXTURES_DIRECTORY,
			env: ENV,
		},
	);

	expect(result.fails).toBe(false);

	// Adds ./node_modules/.bin relative to cwd
	expect(result.value!.stdout).toMatch(fse.join(FIXTURES_DIRECTORY, 'node_modules', '.bin'));

	// Also adds from root of repository, two directories up from fixtures
	const repoRootDir = fse.join(FIXTURES_DIRECTORY, '..');

	expect(result.value!.stdout).toMatch(fse.join(repoRootDir, 'node_modules', '.bin'));
});
