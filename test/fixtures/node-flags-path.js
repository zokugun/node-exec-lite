#!/usr/bin/env node

import process from 'node:process';
import { exec } from '../../lib/esm/index.mjs';

await exec(process.execPath, ['-p', 'process.execArgv'], { stdout: 'inherit' });
