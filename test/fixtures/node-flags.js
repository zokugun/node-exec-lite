#!/usr/bin/env node

import { exec } from '../../lib/esm/index.mjs';

await exec('node', ['-p', 'process.execArgv'], { stdout: 'inherit' });
