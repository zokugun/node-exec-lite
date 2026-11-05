import type { Readable } from 'node:stream';

import { PassThrough } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export function combineStreams(streams: Readable[]): Readable {
	let streamCount = streams.length;

	const combined = new PassThrough();

	if(streamCount === 0) {
		combined.end();

		return combined;
	}

	const maybeEmitEnd = (): void => {
		streamCount -= 1;

		if(streamCount === 0) {
			combined.end();
		}
	};

	for(const stream of streams) {
		pipeline(stream, combined, { end: false })
			.then(maybeEmitEnd)
			.catch(maybeEmitEnd);
	}

	return combined;
}
