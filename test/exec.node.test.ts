import getNode from 'get-node';
import { expect, it } from 'vitest';

import { FIXTURES_DIRECTORY } from './utils/constants.js';
import { exec } from '../src/exec.js';

it('keeps flags', async () => {
	const result = await exec('node', ['--jitless', 'node-flags.js'], { cwd: FIXTURES_DIRECTORY });

	expect(result.fails).toBe(false);
	expect(result.value!.stdout).toContain('--jitless');
});

it('doesnt keep flags', async () => {
	const result = await exec('node', ['--jitless', 'node-flags-path.js'], { cwd: FIXTURES_DIRECTORY });

	expect(result.fails).toBe(false);
	expect(result.value!.stdout).not.toContain('--jitless');
});

it('doesnt keep inspect flags', async () => {
	const result = await exec('node', ['--jitless', '--inspect-port=8091', 'node-flags.js'], { cwd: FIXTURES_DIRECTORY });

	expect(result.fails).toBe(false);
	expect(result.value!.stdout).toContain('--jitless');
	expect(result.value!.stdout).not.toContain('--inspect-port=8091');
});

it('keeps version', async () => {
	const { path: nodePath } = await getNode('20.17.0');

	expect(nodePath).to.not.eql(process.execPath);

	const result = await exec(nodePath, ['node-version.js'], { cwd: FIXTURES_DIRECTORY });

	expect(result.fails).toBe(false);
	expect(result.value!.stdout).toContain('v20.17.0');
});

it.skipIf(process.platform !== 'win32')('keeps flags, node.exe', async () => {
	const result = await exec('node.exe', ['--jitless', 'node-flags.js'], { cwd: FIXTURES_DIRECTORY });

	expect(result.fails).toBe(false);
	expect(result.value!.stdout).toContain('--jitless');
});

it.skipIf(process.platform !== 'win32')('keeps flags, NODE', async () => {
	const result = await exec('NODE', ['--jitless', 'node-flags.js'], { cwd: FIXTURES_DIRECTORY });

	expect(result.fails).toBe(false);
	expect(result.value!.stdout).toContain('--jitless');
});
