[@zokugun/picoexec](https://github.com/zokugun/node-picoexec)
==========================================================

[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![NPM Version](https://img.shields.io/npm/v/@zokugun/picoexec?color=brightgreen)](https://www.npmjs.com/package/@zokugun/picoexec)
[![NodeJS Version](https://img.shields.io/badge/node.js-%3E%3D%2018.20-green)](#requirements)
[![Modules](https://img.shields.io/badge/modules-ESM%20%7C%20CJS-green)](#requirements)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-f87171?logo=kofi&logoColor=white)](https://ko-fi.com/daiyam)
[![Liberapay](https://img.shields.io/badge/Liberapay-facc15?logo=liberapay&logoColor=black)](https://liberapay.com/daiyam/donate)
[![PayPal](https://img.shields.io/badge/PayPal-5277C3?logo=paypal&logoColor=white)](https://paypal.me/daiyam99)

> Run external commands and manage their output easily. You get simple success or failure objects containing exit codes, execution time, and all captured text from standard output and error streams.

Features
--------

- **Process Management**: Spawn and manage external commands with a clean API.
- **Result Types**: Get structured success and failure objects for every run.
- **Unified Output**: Combines stdout and stderr into a single stream for easier logging.
- **Windows Normalization**: Automatically handles `cmd.exe` and path escaping for Windows.
- **Automated Resolution**: Locate binaries automatically using PATH and file extensions.
- **Process Piping**: Chain multiple commands together to pass data between them.
- **Abort Support**: Cancel running processes using standard abort signals.
- **Exit Tracking**: Capture precise exit codes and signal codes from tasks.
- **Execution Timing**: Measure the exact duration of a command in milliseconds.

Installation
------------

```bash
npm add @zokugun/picoexec
```

Requirements
------------

- **Node.js**: `v18.20` or higher
- **Modules**: ECMAScript Modules (`ESM`) or CommonJS (`CJS`)

Quick Start
-----------

### 1. Basic Execution

Run a command and wait for the final output. Use this when you only need the end result.

```typescript
import { exec } from '@zokugun/picoexec';

async function runSimpleCommand(): Promise<void> {
   const result = await exec('echo', ['hello world']);

   if(result.fails) {
      console.error(`Failed with exit code: ${result.value.exitCode}`);

      return;
   }

   const { stdout } = result.value;

   console.log(`Output: ${stdout}`);
}
```

### 2. Streaming Output

Iterate over the process output in real-time.

```typescript
import { exec } from '@zokugun/picoexec';

async function runPipedCommands(): Promise<void> {
   const task = exec('npm', ['install']);

   for await(const line of task) {
      console.log(`Log: ${line}`);
   }

   if(task.failed) {
      console.error(`Failed with exit code: ${task.exitCode}`);
   }
}
```

### 3. Piping Processes

Chain multiple commands together using the `.pipe()` method. The output of the first process is passed as the input to the second.

```typescript
import { exec } from '@zokugun/picoexec';

async function runPipedCommands(): Promise<void> {
   const result = await exec('cat', ['package.json']).pipe('grep', ['dependencies']);

   if(result.fails) {
      console.log('Pipeline failed');

      return;
   }

   console.log(`Filtered output: ${result.value.stdout}`);
}

await runPipedCommands();
```

API Reference
-------------

### Functions

#### `exec`

```typescript
export function exec(
   command: string,
   args?: readonly string[] | null,
   options?: Partial<Options>,
): Subprocess;
```

Spawns a child process and returns a `Subprocess` instance. The process starts immediately on return.

**Caveats:**

- `exec` does not throw. Errors surface through the `fails` flag of the `Result`.
- On Windows, batch files (`.bat`, `.cmd`) are wrapped in `cmd.exe` with verbatim argument handling.

---

### Classes

#### `ExecProcess`

```typescript
class ExecProcess implements Subprocess { ... }
```

The class behind every subprocess returned by `exec`. You rarely need to construct it directly — use `exec()` instead.

**Key properties:**

| Property      | Type                        | Description                                            |
| ------------- | --------------------------- | ------------------------------------------------------ |
| `.aborted`    | `boolean`                   | True if the process was aborted via signal             |
| `.error`      | `Error \| undefined`        | The error that caused failure, if any                  |
| `.exitCode`   | `number \| undefined`       | Exit code after the process closes                     |
| `.failed`     | `boolean`                   | True if exit code is non-zero or a signal was received |
| `.killed`     | `boolean`                   | True if `kill()` was called                            |
| `.pid`        | `number \| undefined`       | OS process ID                                          |
| `.process`    | `ChildProcess \| undefined` | The raw Node.js child process handle                   |
| `.signalCode` | `string \| undefined`       | Signal code that terminated the process                |

**Key methods:**

| Method                            | Returns      | Description                                                       |
| --------------------------------- | ------------ | ----------------------------------------------------------------- |
| `.kill(signal?)`                  | `boolean`    | Sends a signal to the process. Returns false if no handle exists. |
| `.pipe(command, args?, options?)` | `Subprocess` | Chains another command, piping this stdout into its stdin.        |
| `.spawn()`                        | `void`       | Starts the process. Called automatically by `exec()`.             |

---

### Types

#### `ExecResult`

A discriminated union wrapping success or failure:

```typescript
type ExecResult = Result<ExecSuccess, ExecFailure>;
```

---

#### `ExecSuccess`

Returned when the process exits with code 0 and no error occurred.

```typescript
type ExecSuccess = {
   all: string;        // combined stdout + stderr
   command: string;
   durationMs: number;
   exitCode: number;
   stdout: string;
   stderr: string;
};
```

---

#### `ExecFailure`

Returned when the process errors, exits non-zero, or gets killed.

```typescript
type ExecFailure = {
   all?: string;
   canceled: boolean;  // true if aborted via signal
   command: string;
   durationMs: number;
   error?: Error;
   exitCode?: number;
   signalCode?: string;
   stderr?: string;
   stdout?: string;
};
```

---

#### `Subprocess`

The shape returned by `exec()`. It is:

- A **promise-like** — resolves to `ExecResult` when awaited.
- An **async iterable** — yields lines from stdout + stderr.
- A **live handle** — inspect `.exitCode`, `.pid`, etc. at any time after spawn.

```typescript
type Subprocess = AsyncIterable<string> & PromiseLike<ExecResult> & { ... };
```

---

#### `Options`

Extended `SpawnOptions` with extra fields:

| Field               | Type                                  | Default              | Description                           |
| ------------------- | ------------------------------------- | -------------------- | ------------------------------------- |
| `cwd`               | `string`                              | `process.cwd()`      | Working directory                     |
| `env`               | `Record<string, string>`              | inherited + computed | Environment variables                 |
| `localDir`          | `string`                              | `cwd`                | Directory to resolve local paths from |
| `preferLocal`       | `boolean`                             | `false`              | Prepends `node_modules/.bin` to PATH  |
| `signal`            | `AbortSignal`                         | none                 | Abort signal for cancellation         |
| `stdin`             | `string \| Subprocess \| { process }` | `pipe`               | Input source                          |
| `stdio`             |                                       | none                 | Standard I/O configurations.          |
| `stdout` / `stderr` | `StdioOption`                         | none                 | Stream configuration                  |
| `timeout`           | `number`                              | none                 | Auto-abort after N milliseconds       |

Contributions
-------------

Contributions are most welcome. Please:

- Open issues and feature requests under the repository discussions.
- Follow the [`CONTRIBUTING.md`](./CONTRIBUTING.md).

Donations
---------

Support this project by becoming a financial contributor.

<table>
   <tr>
      <td><img src="https://raw.githubusercontent.com/daiyam/assets/master/icons/256/funding_kofi.png" alt="Ko-fi" width="80px" height="80px"></td>
      <td><a href="https://ko-fi.com/daiyam" target="_blank">ko-fi.com/daiyam</a></td>
   </tr>
   <tr>
      <td><img src="https://raw.githubusercontent.com/daiyam/assets/master/icons/256/funding_liberapay.png" alt="Liberapay" width="80px" height="80px"></td>
      <td><a href="https://liberapay.com/daiyam/donate" target="_blank">liberapay.com/daiyam/donate</a></td>
   </tr>
   <tr>
      <td><img src="https://raw.githubusercontent.com/daiyam/assets/master/icons/256/funding_paypal.png" alt="PayPal" width="80px" height="80px"></td>
      <td><a href="https://paypal.me/daiyam99" target="_blank">paypal.me/daiyam99</a></td>
   </tr>
</table>

License
-------

Copyright &copy; 2026-present Baptiste Augrain

Licensed under the [MIT license](https://opensource.org/licenses/MIT).
