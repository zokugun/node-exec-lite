import { expect, it } from 'vitest';

import { createCommand } from '../src/create-command.js';

it('supports reusable command invocation forms', async () => {
	const repository = process.cwd();
	const command = createCommand('node', ['-e', 'process.stdout.write(process.argv.slice(1).join(" ") + "|" + process.cwd())']);

	const arrayResult = await command(['init', '--initial-branch=main'], { cwd: repository });

	const flatCommand = command.withOptions({ cwd: repository }).toFlatArgs();
	const configuredResult = await flatCommand('init', '--initial-branch=main');

	const cwdCommand = command.toCwdFirst();
	const cwdResult = await cwdCommand(repository, 'init', '--initial-branch=main');

	expect(arrayResult.value!.merged).toContain('init --initial-branch=main');
	expect(arrayResult.value!.merged).toContain(repository);
	expect(arrayResult.value!.merged).to.eql(configuredResult.value!.merged);
	expect(configuredResult.value!.merged).to.eql(cwdResult.value!.merged);
});

it('toCwdFirst', async () => {
	const repository = process.cwd();
	const command = createCommand('node', ['-e', 'process.stdout.write(process.cwd())']).toCwdFirst();

	expect((await command(repository)).value!.stdout).toBe(repository);
});

it('preserves handler return types in configured commands', async () => {
	const command = createCommand('node', ['-e', "console.log('foo')"], {
		onSuccess: (success) => success.value.stdout,
		onFailure: (failure) => failure.error?.exitCode?.toString() ?? '',
	});

	const result = await command();

	const configured = await command.withOptions({
		onSuccess: (success) => success.value.exitCode,
		onFailure: (failure) => failure.error?.exitCode ?? -1,
	})();

	expect(result).toBe('foo\n');
	expect(configured).toBe(0);
});
