import fs from 'node:fs';
import { basename } from 'node:path';

const SHEBANG_REGEX = /^#!\s*(.+)/;
const SIZE = 150;

export function detectShebang(file: string): string | null {
	const buffer = Buffer.alloc(SIZE);

	let fd: number | null = null;

	try {
		fd = fs.openSync(file, 'r');

		fs.readSync(fd, buffer, 0, SIZE, 0);
	}
	catch {
		// do nothing, we'll just assume it's not a shebang
	}
	finally {
		if(fd !== null) {
			fs.closeSync(fd);
		}
	}

	const match = buffer.toString().match(SHEBANG_REGEX);

	if(match === null) {
		return null;
	}

	const line = match[1].trim();
	const separatorIndex = line.indexOf(' ');
	const path = separatorIndex !== -1 ? line.slice(0, separatorIndex) : line;
	const argument = separatorIndex !== -1 ? line.slice(separatorIndex + 1) : '';
	const binary = basename(path);

	return binary === 'env' ? argument || null : binary;
}
