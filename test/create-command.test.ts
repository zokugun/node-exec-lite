import { expect, it } from 'vitest';

import { createCommand } from '../src/create-command.js';

it('supports reusable command invocation forms', async () => {
	const repository = process.cwd();
	const command = createCommand('node', ['-e', 'process.stdout.write(process.argv.slice(1).join(" ") + "|" + process.cwd())'], { resultMode: 'merged' });

	const arrayResult = await command(['init', '--initial-branch=main'], { cwd: repository });

	const flatCommand = command.withOptions({ cwd: repository }).toFlatArgs();
	const configuredResult = await flatCommand('init', '--initial-branch=main');

	const cwdCommand = command.toCwdFirst();
	const cwdResult = await cwdCommand(repository, 'init', '--initial-branch=main');

	expect(arrayResult).toContain('init --initial-branch=main');
	expect(arrayResult).toContain(repository);
	expect(arrayResult).to.eql(configuredResult);
	expect(configuredResult).to.eql(cwdResult);
});

it('toCwdFirst', async () => {
	const repository = process.cwd();
	const command = createCommand('node', ['-e', 'process.stdout.write(process.cwd())'], { resultMode: 'merged' }).toCwdFirst();

	expect(await command(repository)).toBe(repository);
});
