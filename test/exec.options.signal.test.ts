import { expect, it } from 'vitest';

import { exec } from '../src/exec.js';

export const MULTIBYTE_STR = '.\u{1F984}.';

it('aborted', async () => {
	const result = await exec('node', null, { signal: AbortSignal.abort() });

	expect(result.fails).toBe(true);
	expect(result.error!.signalCode).toBe('SIGTERM');
});
