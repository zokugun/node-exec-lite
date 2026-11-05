import type { SpawnOptions } from '../../types.js';

import path from 'node:path';

import { detectShebang } from './detectShebang.js';
import { resolveCommand } from './resolveCommand.js';

const IS_BATCH_FILE_REGEX = /\.(?:bat|cmd)$/i;
const IS_EXECUTABLE_REGEX = /\.(?:com|exe)$/i;
const IS_WINDOWS = process.platform === 'win32';
const META_CHARS_REGEX = /([ !"%&()*,;<>?[\]^`|])/g;

export function normalizeCommand(command: string, args: readonly string[], options: SpawnOptions): { args: readonly string[]; command: string; options: SpawnOptions } {
	if(['node', 'node.exe'].includes(command.toLowerCase())) {
		command = process.execPath;
		args = [...process.execArgv.filter((flag) => !flag.startsWith('--inspect')), ...args];
	}

	if(options.shell === true || !IS_WINDOWS) {
		return {
			command,
			args,
			options,
		};
	}

	let file = resolveCommand(command, options);

	if(file !== null) {
		const shebang = detectShebang(file);

		if(shebang !== null) {
			args = [file, ...args];
			command = shebang;

			file = resolveCommand(command, options);
		}
	}

	if(file !== null && IS_EXECUTABLE_REGEX.test(file)) {
		return {
			command,
			args,
			options,
		};
	}

	const needsDoubleEscape = file !== null && IS_BATCH_FILE_REGEX.test(file);
	const normalizedCommand = path.normalize(command).replace(META_CHARS_REGEX, '^$1');
	const normalizedArgs: string[] = [];

	for(let arg of args) {
		arg = arg.replace(/(?=(\\+?))\1(?:"|$)/g, '$1$1\\"');
		arg = `"${arg}"`;
		arg = arg.replace(META_CHARS_REGEX, '^$1');

		if(needsDoubleEscape) {
			arg = arg.replace(META_CHARS_REGEX, '^$1');
		}

		normalizedArgs.push(arg);
	}

	return {
		command: options.env?.comspec ?? 'cmd.exe',
		args: ['/d', '/s', '/c', `"${[normalizedCommand, ...normalizedArgs].join(' ')}"`],
		options: { ...options, windowsVerbatimArguments: true },
	};
}
