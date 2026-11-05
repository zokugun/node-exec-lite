import type { Readable } from 'node:stream';

export type StreamContext = {
	all: string;
};

export async function readStream(stream: Readable, context: StreamContext): Promise<string> {
	let output = '';

	try {
		for await(const chunk of stream) {
			output += String(chunk);
			context.all += String(chunk);
		}
	}
	catch {
		// suppress errors, child process probably failed to spawn
	}

	return output;
}
