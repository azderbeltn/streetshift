# Factory Droid SDK (TypeScript) and droid exec (headless)

Fetched: 2026-10-24. Pages saved verbatim from Factory's Markdown endpoints (listed in https://docs.factory.ai/llms.txt; docs now live at docs.factory.com).

Sources:
- https://docs.factory.com/sdk/typescript.md (Droid TypeScript SDK)
- https://docs.factory.com/droid-exec/overview.md (Droid Exec, headless CLI, output formats incl. stream-json)
- https://docs.factory.com/autonomy-and-safety/auto-run.md (Autonomy levels)
- https://docs.factory.com/autonomy-and-safety/permission-rules.md (allow / ask / block rules)
- https://docs.factory.com/autonomy-and-safety/sandbox.md (OS-level filesystem/network sandbox)
- https://docs.factory.com/droid-cli/cli-reference.md (all CLI flags)
- https://docs.factory.com/droid-cli/quickstart.md (install, incl. Windows)
- Python SDK (not saved): https://docs.factory.com/sdk/python.md

## Key facts (summary by the saver; verify against verbatim pages below)
- npm package: `@factory/droid-sdk` (Node 18+). Import Node APIs from `@factory/droid-sdk/node`: `run`, `createSession`, `resumeSession`, `listModels`, `listSessions`, `DroidMessageType`, `AutonomyLevel`, `ReasoningEffort`, `ToolConfirmationOutcome`, `ToolConfirmationType`. Zod 3 (`zod@^3.24.0`) for structured output / SDK MCP tools.
- The SDK spawns the `droid` CLI from PATH (or `execPath` option). So the CLI must be installed: Windows `irm https://app.factory.ai/cli/windows | iex` (PowerShell, per-user), or `npm install -g droid`.
- Auth: env `FACTORY_API_KEY` (read by default), or pass `apiKey` to `run()` / `createSession()` / `resumeSession()`. Windows: `$env:FACTORY_API_KEY = "fk-..."`.
- One-shot: `const result = await run(prompt, opts)`; check `result.success`, read `result.text`.
- Streaming: `const session = await createSession({ cwd, autonomyLevel, disabledToolIds, permissionHandler })`; `for await (const m of session.stream(prompt))` narrow on `m.type` (`DroidMessageType.Assistant` etc.); always `await session.close()`.
- Scoping: `cwd` (working dir), `autonomyLevel` (`Off|Low|Medium|High`), `disabledToolIds` (e.g. `['Execute']`), `permissionHandler` returning `ToolConfirmationOutcome.ProceedOnce|ProceedAlways|Cancel`, permission rules (allow/ask/block), and the sandbox page for kernel-enforced filesystem/network limits.
- Headless CLI: `droid exec "<prompt>" --auto low|medium|high -o text|json|stream-json|stream-jsonrpc|acp --cwd <path>`; default is read-only. `stream-json` = one JSON event per line.


---

<!-- ===== SOURCE: https://docs.factory.com/sdk/typescript.md ===== -->

# [Saved page] https://docs.factory.com/sdk/typescript.md

# Droid TypeScript SDK

Use the Factory Droid SDK for TypeScript to build custom agents, workflows, and product integrations.

The Droid SDK lets you run the same agent harness that powers Factory's CLI, desktop application, and web platform from your own code. It manages conversation context, tool execution, permissions, streaming, model selection, and multi-step execution.

Your application decides when Droid runs, which tools and models it can use, and what happens to the result.

## Overview

The TypeScript SDK can start Droid as a Node.js subprocess or connect to an existing daemon. It provides one-shot runs, persistent sessions, streaming, model and session discovery, and in-process MCP tools.

### Choose an API

| Goal                                    | API               |
| --------------------------------------- | ----------------- |
| Run one prompt and get the final result | `run()`           |
| Keep context across prompts             | `createSession()` |
| Continue a saved session                | `resumeSession()` |
| Discover selectable models              | `listModels()`    |
| Find saved sessions                     | `listSessions()`  |

Start with `run()` for one prompt. Use a session when later prompts need the
same conversation history.

### What you can build

Invoke Droid when a pull request opens, a support ticket is escalated, an incident is created, or scheduled repository maintenance is due. The agent does not need a chat interface.

## Install and authenticate

Install the public npm package:

```bash
npm install @factory/droid-sdk
```

If your code imports Zod for structured output or SDK MCP tools, use Zod 3:

```bash
npm install zod@^3.24.0
```

Import Node.js APIs from `@factory/droid-sdk/node`. Browser and daemon clients
are available from the root entrypoint. This guide covers the high-level public
API; the exported TypeScript declarations define the complete compile-time API.

The SDK requires Node.js 18 or later.

By default, the SDK starts the `droid` CLI from `PATH`. Pass `execPath` to use a
different `droid` executable.

Set an API key:

```bash
export FACTORY_API_KEY="your-key"
```

The SDK reads `FACTORY_API_KEY` from the process environment by default. You
can also pass `apiKey` to `run()`, `createSession()`, or `resumeSession()`.

## Quick start

### Run one prompt

```typescript
import { run } from '@factory/droid-sdk/node';

const result = await run('Summarize this repository.');

if (!result.success) {
  throw new Error(result.error?.message ?? `Run failed: ${result.subtype}`);
}

console.log(result.text);
```

`run()` creates a session, consumes its complete message stream, returns the
terminal `DroidResult`, and closes the session.

### Continue a conversation

```typescript
import { createSession, DroidMessageType } from '@factory/droid-sdk/node';

const session = await createSession();

try {
  for await (const message of session.stream('What does this project do?')) {
    if (message.type === DroidMessageType.Assistant) {
      console.log(message.text);
    }
  }

  for await (const message of session.stream('What should I test first?')) {
    if (message.type === DroidMessageType.Assistant) {
      console.log(message.text);
    }
  }
} finally {
  await session.close();
}
```

In the above example, the second prompt uses context from the first turn.
Remember to close sessions that your code creates.

## Core concepts

### Session

A session holds conversation history, settings, and a working directory. Create
one with `createSession()` or load a saved session with `resumeSession()`.

### Turn

A turn starts when you send one prompt with `session.stream()`. A session can
run one turn at a time.

### Stream message

`session.stream()` returns an async iterable of complete messages. Narrow each
message by its `type`. Messages can report user input, assistant output, tool
activity, hooks, errors, and a terminal `DroidResult`.

### Result

A normally completed turn ends with a `DroidResult`. `run()` consumes the stream and returns that same result type. See [Streaming and results](#streaming-and-results) for result handling, errors, token usage, and cancellation.

### Ownership and cleanup

Cleanup depends on how the session was created.

| API               | Cleanup                          |
| ----------------- | -------------------------------- |
| `run()`           | Closes its session automatically |
| `createSession()` | Call `await session.close()`     |
| `resumeSession()` | Call `await session.close()`     |

Use `finally` blocks so cleanup also runs after an error.

## Sessions

Use a session when prompts need shared conversation history. A session owns its working directory, settings, and one active turn at a time.

### Create and use a session

```typescript
import { createSession, DroidMessageType } from '@factory/droid-sdk/node';

const session = await createSession({
  cwd: process.cwd(),
});

async function send(prompt: string) {
  for await (const message of session.stream(prompt)) {
    if (message.type === DroidMessageType.Assistant) {
      console.log(message.text);
    }
  }
}

try {
  await send('What does this project do?');
  await send('What should I test first?');
} finally {
  await session.close();
}
```

The second turn uses context from the first. `cwd` defaults to `process.cwd()`. Model and reasoning defaults come from Droid settings.

### Customize the system prompt

Set `systemPrompt` when creating a session. A string replaces Droid's default
behavioral prompt:

```typescript
const session = await createSession({
  systemPrompt: 'Act as a focused dependency-analysis agent.',
});
```

To keep Droid's default prompt and append instructions:

```typescript
const session = await createSession({
  systemPrompt: {
    type: 'preset',
    preset: 'droid',
    append: 'Prioritize security findings and cite relevant files.',
  },
});
```

`systemPrompt` is available with `run()`, `createSession()`, and
`droid.sessions.create()`. It is set at session creation and preserved when the
session is resumed or forked.

### Resume a saved session

```typescript
import { DroidMessageType, resumeSession } from '@factory/droid-sdk/node';

async function continueSession(sessionId: string) {
  const session = await resumeSession(sessionId);

  try {
    for await (const message of session.stream(
      'Continue from the last conversation.'
    )) {
      if (message.type === DroidMessageType.Assistant) {
        console.log(message.text);
      }
    }
  } finally {
    await session.close();
  }
}
```

`resumeSession()` restores the saved conversation, working directory, and session settings. It does not accept `cwd`, `modelId`, or reasoning options.

Resume options can provide new permission and AskUser handlers, disabled tools, MCP servers, an abort signal, and observability sinks.

### Read session state

Each handle exposes its ID, current working directory, and current settings.

```typescript
console.log(session.id);
console.log(session.cwd);
console.log(session.settings.modelId);
console.log(session.settings.reasoningEffort);
console.log(session.settings.interactionMode);
```

`settings` is read-only. The SDK updates `settings` and `cwd` when Droid reports a change.

### Update session settings

Use `updateSettings()` for changes that should apply to later turns in the current session.

```typescript
import { AutonomyLevel, ReasoningEffort } from '@factory/droid-sdk/node';

await session.updateSettings({
  modelId: 'model-id',
  reasoningEffort: ReasoningEffort.High,
  autonomyLevel: AutonomyLevel.Low,
  disabledToolIds: ['Execute'],
});
```

Updatable settings include:

- model and reasoning effort
- interaction mode and autonomy level
- spec-mode model settings
- tool availability overrides

Interaction mode controls whether Droid operates normally in Auto mode or produces a read-only plan in Spec mode. Autonomy level controls which actions require approval while Droid is in Auto mode. Tool availability overrides can enable, disable, or restrict the tools available to the session.

Use `enterSpecMode()` to enter Spec mode. Return to Auto mode with
`updateSettings({ interactionMode: DroidInteractionMode.Auto })`.

The updated values are available through `session.settings`.

### Rename a session

Use `rename()` after the first turn to replace the generated title.

```typescript
await session.rename({ title: 'Authentication review' });
```

### List saved sessions

`listSessions()` reads local Droid session storage. It does not start Droid or
call the Factory API.

List sessions for the current working directory:

```typescript
import { listSessions } from '@factory/droid-sdk/node';

const sessions = await listSessions({ limit: 10 });

for (const session of sessions) {
  console.log(session.id, session.title, session.modifiedTime);
}
```

List sessions across all working directories:

```typescript
const sessions = await listSessions({
  fetchOutsideCWD: true,
  limit: 10,
});
```

Results are sorted by `modifiedTime`, newest first. Each item includes its ID, title, owner, message count, creation time, modification time, and working directory when available.

### What persists

Droid saves the session data needed to continue later.

| Restored from the saved session | Attach again when resuming |
| ------------------------------- | -------------------------- |
| Conversation history            | Permission handler         |
| Working directory               | AskUser handler            |
| Title                           | SDK MCP servers            |
| Session settings                | Observability sinks        |
|                                 | Abort signal               |

Session settings include model, reasoning, Auto or Spec interaction mode,
autonomy, spec-mode model settings, tool availability overrides, and the
custom system prompt.

Handlers, observability sinks, abort signals, and SDK MCP servers are runtime objects. Droid cannot serialize them with the session, so attach them again when calling `resumeSession()`. They do not need to be the same object instances or implementations used when the session was created.

### Close sessions safely

Call `close()` in `finally` when your code creates or resumes a session.
Closing releases the subprocess, subscriptions, and SDK-owned MCP servers.

```typescript
const session = await createSession();

try {
  // Use the session.
} finally {
  await session.close();
}
```

## Streaming and results

Each call to `session.stream()` starts one turn and returns an async iterable.

By default, it yields complete messages and ends with a terminal `DroidResult`.

### Complete messages

```typescript
for await (const message of session.stream('Find the failing test.')) {
  switch (message.type) {
    case DroidMessageType.Assistant:
      console.log(message.text);
      break;
    case DroidMessageType.ToolCall:
      console.log(`Tool: ${message.name}`);
      break;
    case DroidMessageType.Result:
      console.log(message.subtype);
      break;
  }
}
```

Default message types:

| Type          | Purpose                              |
| ------------- | ------------------------------------ |
| `assistant`   | Complete assistant message           |
| `user`        | User message recorded by the session |
| `tool_call`   | Complete tool request                |
| `tool_result` | Complete tool result                 |
| `hook`        | Hook execution                       |
| `error`       | Runtime error event                  |
| `result`      | Terminal `DroidResult`               |

### Partial events

Enable partial events only when the application needs live text, thinking, tool progress, token usage, or state updates.

```typescript
for await (const event of session.stream('Explain the test failure.', {
  includePartialMessages: true,
})) {
  if (event.type === DroidMessageType.AssistantTextDelta) {
    process.stdout.write(event.text);
  }
}
```

Partial streams can also include thinking deltas, tool-call deltas, tool
progress, token updates, permission results, settings changes, working-state
changes, and MCP status.

### Handle the result

`DroidResult` is a discriminated union. Check `subtype` or `success` before using the response.

```typescript
const result = await run('Run the test suite.');

switch (result.subtype) {
  case 'success':
    console.log(result.text);
    break;
  case 'interrupted':
    console.log('The run was interrupted.');
    break;
  case 'error_during_execution':
  case 'error_structured_output':
    console.error(
      result.structuredOutputError?.message ??
        result.error?.message ??
        'Unknown error'
    );
    break;
}
```

| Subtype                   | Meaning                                           |
| ------------------------- | ------------------------------------------------- |
| `success`                 | The turn completed successfully                   |
| `interrupted`             | The turn was cancelled or permission declined     |
| `error_during_execution`  | Droid could not complete the requested work       |
| `error_structured_output` | Structured-output generation or validation failed |

Every result includes:

```typescript
console.log(result.sessionId);
console.log(result.durationMs);
console.log(result.turnCount);
console.log(result.messages);
console.log(result.text);
console.log(result.tokenUsage);
```

`run()` returns the terminal result directly. When consuming `session.stream()`, handle the message whose type is `DroidMessageType.Result`.

### Token and context usage

`DroidResult.tokenUsage` reports raw token counts for the current SDK turn and,
when available, the Factory Service Credits (FSC) charged for that turn. One
turn is one `run()` or `session.stream()` call. This is not the session's
lifetime total.

```typescript
if (result.tokenUsage) {
  console.log(`input: ${result.tokenUsage.inputTokens}`);
  console.log(`output: ${result.tokenUsage.outputTokens}`);
  console.log(`cache read: ${result.tokenUsage.cacheReadTokens}`);
  console.log(`cache created: ${result.tokenUsage.cacheCreationTokens}`);
  if (result.tokenUsage.factoryCredits !== undefined) {
    console.log(`Factory Service Credits: ${result.tokenUsage.factoryCredits}`);
  }
}
```

| Field                 | What it measures during the turn                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `inputTokens`         | Provider-reported input across model calls, which can include instructions, tools, conversation history, and the latest message |
| `outputTokens`        | Output generated across model calls, not only the final visible response                                                        |
| `cacheReadTokens`     | Input tokens reused from the prompt cache                                                                                       |
| `cacheCreationTokens` | Input tokens written to the prompt cache                                                                                        |
| `thinkingTokens`      | Reasoning tokens reported separately when available                                                                             |
| `factoryCredits`      | Factory Service Credits charged, when available                                                                                 |

One turn can make several model calls while Droid uses tools. Their usage is combined in the result, along with usage from delegated work. Earlier conversation can be counted again when it is included as input to a later turn. Cached input is also reported through the separate cache fields. `tokenUsage` is `null` when usage is unavailable.

Partial streams can emit `DroidMessageType.TokenUsageUpdate`. Unlike the per-turn result, these events contain cumulative committed usage for the session.

`getContextStats()` measures current context occupancy, not cumulative token usage:

```typescript
const stats = await session.getContextStats();

console.log(stats.used, stats.remaining, stats.limit, stats.accuracy);
```

| Field       | Meaning                                                                                               |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| `used`      | Estimated tokens currently occupied by prompts, tools, instructions, and conversation history         |
| `limit`     | Active model's maximum input window; unresolved model IDs fall back to the effective compaction limit |
| `remaining` | `Math.max(0, limit - used)`                                                                           |
| `accuracy`  | Currently `estimated`, because Droid approximates tokens from character counts                        |

`remaining` estimates room in the model's input window. It does not
necessarily mean tokens remaining before compaction. Droid can compact at a
lower configured threshold, commonly 250,000 tokens, even when the active
model's input window is larger.

### Errors

An error event and a thrown exception mean different things:

- An `error` message reports a runtime problem during the turn. A terminal `DroidResult` normally follows and describes the final outcome.
- A failed `DroidResult` means the stream completed, but the requested work or structured output failed.
- A thrown exception means the SDK operation itself could not finish, such as an abort, connection failure, protocol error, or concurrent stream attempt.

Handle stream exceptions around the iteration:

```typescript
try {
  for await (const message of session.stream('Run the tests.')) {
    if (message.type === DroidMessageType.Error) {
      console.error(message.message);
    }
  }
} catch (error) {
  console.error('The stream could not finish:', error);
}
```

`run()` follows the same distinction: agent failures are returned as failed results, while setup, transport, protocol, and abort failures are thrown.

### Stream concurrency

One session handle can have one active stream. Starting another active stream
throws `ConcurrentStreamError`.

### Cancellation and interruption

Use an abort signal to cancel one turn:

```typescript
const controller = new AbortController();

setTimeout(
  () => controller.abort(new Error('Timed out after 5 seconds')),
  5_000
);

for await (const message of session.stream('Perform a long review.', {
  abortSignal: controller.signal,
})) {
  // Handle messages.
}
```

The stream interrupts the active turn and throws the abort reason.

Use `session.interrupt()` when another part of the application needs to stop
the active turn:

```typescript
await session.interrupt();
```

The stream normally continues to a terminal result with subtype `interrupted`.
The session remains available for later prompts.

Breaking out of the stream also interrupts the active turn:

```typescript
for await (const message of session.stream('Investigate every failing test.')) {
  if (message.type === DroidMessageType.Assistant) {
    console.log(message.text);

    // Interrupt this turn instead of merely hiding its remaining output.
    break;
  }
}
```

Breaking out of the loop before the turn finishes sends an interrupt request
to Droid. This cancels the remaining model and tool work for that turn. The
session remains open and can accept another prompt, but this loop does not
receive the interrupted turn's terminal `DroidResult`.

A session-level abort signal passed to `createSession()` closes the entire
session when aborted.

## Models

Model IDs are strings because availability depends on the account,
organization policy, and daemon configuration. Omit `modelId` to use the Droid
default.

### Discover available models

Use `listModels()` to inspect the models available to the current account and
project before creating a session.

```typescript
import { listModels } from '@factory/droid-sdk/node';

const models = await listModels();

for (const model of models) {
  console.log(model.id, model.defaultReasoningEffort);
}
```

`listModels()` starts a one-shot Droid process, requests the model catalog
without creating a session, and closes the process before returning.

Disabled models are hidden by default. Include them when building a model
picker or explaining why a model cannot be selected:

```typescript
const models = await listModels({ includeDisabled: true });

for (const model of models) {
  const status = model.disabled
    ? `disabled: ${model.disabledReason}`
    : 'available';

  console.log(model.displayName, status);
}
```

Applications connected to a Droid daemon can request the same catalog:

```typescript
const models = await droid.models.list({
  includeDisabled: true,
});
```

Both APIs return `ModelInfo[]`. The catalog includes built-in and configured
custom models after applying feature flags, region availability, and
organization policy. Custom endpoint and credential configuration is never
returned.

| Field                       | Meaning                                        |
| --------------------------- | ---------------------------------------------- |
| `id`                        | Value accepted by `modelId`                    |
| `displayName`               | Full display name                              |
| `shortDisplayName`          | Compact display name                           |
| `modelProvider`             | Model provider                                 |
| `supportedReasoningEfforts` | Reasoning levels accepted by the model         |
| `defaultReasoningEffort`    | Reasoning level used when none is supplied     |
| `isCustom`                  | Whether the model is user-configured           |
| `disabled`                  | Whether policy prevents selecting the model    |
| `disabledReason`            | Explanation when `disabled` is `true`          |
| `noImageSupport`            | Whether image input is unavailable             |
| `supportsImageGeneration`   | Whether the model can generate images          |

Optional fields provide the model tier, token multiplier, classification, and
display badges.

### Select a model

Pass a configured model ID when creating a session or running one prompt.

```typescript
import {
  createSession,
  DroidMessageType,
  ReasoningEffort,
} from '@factory/droid-sdk/node';

const session = await createSession({
  modelId: 'model-id',
  reasoningEffort: ReasoningEffort.High,
});

try {
  for await (const message of session.stream('Review this repository.')) {
    if (message.type === DroidMessageType.Assistant) {
      console.log(message.text);
    }
  }
} finally {
  await session.close();
}
```

For an existing session, call `updateSettings()`:

```typescript
await session.updateSettings({
  modelId: 'model-id',
  reasoningEffort: ReasoningEffort.High,
});
```

Set `reasoningEffort` only to a level supported by the selected model. Omit it
to use the model's configured default.

### Use the Factory Router

Set `modelId` to `"auto"` to let Factory choose a model for each turn.

```typescript
import { run } from '@factory/droid-sdk/node';

const result = await run('Find the cause of the failing tests.', {
  modelId: 'auto',
});

if (!result.success) {
  throw new Error(result.error?.message ?? `Run failed: ${result.subtype}`);
}

console.log(result.text);
```

The selected model can change between turns. Choose a fixed model ID when runs must use the same model.

### Configure mode-specific models

The primary model handles normal turns. The spec-mode model handles turns in
spec mode.

```typescript
import {
  createSession,
  DroidInteractionMode,
  ReasoningEffort,
} from '@factory/droid-sdk/node';

const session = await createSession({
  modelId: 'auto',
  interactionMode: DroidInteractionMode.Spec,
  specModeModelId: 'model-id',
  specModeReasoningEffort: ReasoningEffort.High,
});

try {
  for await (const _message of session.stream(
    'Draft an implementation plan.'
  )) {
    // Consume messages.
  }
} finally {
  await session.close();
}
```

You can also choose the model when entering spec mode:

```typescript
await session.enterSpecMode({
  specModeModelId: 'model-id',
  specModeReasoningEffort: ReasoningEffort.High,
});
```

### Use a custom model

Configure custom models in `~/.factory/settings.json`. See [Model Independence](/model-independence/byok) for provider, credential, and model settings.

After configuration, pass the custom model ID anywhere the SDK accepts `modelId`. The ID uses `custom:` followed by the configured `model` value.

```typescript
import { run } from '@factory/droid-sdk/node';

const result = await run('Summarize this repository.', {
  modelId: 'custom:gpt-4o-mini',
});

if (!result.success) {
  throw new Error(result.error?.message ?? `Run failed: ${result.subtype}`);
}

console.log(result.text);
```

## Inputs and outputs

Pass images, documents, or an output schema in the options for the turn that should use them. Both `run()` and `session.stream()` accept these options.

### Images and documents

```typescript
const result = await run('Describe this image.', {
  images: [
    {
      type: 'base64',
      data: base64Png,
      mediaType: 'image/png',
    },
  ],
});
```

`data` contains the base64-encoded image bytes. Supported media types are `image/jpeg`, `image/png`, `image/gif`, and `image/webp`.

#### Documents

```typescript
const result = await run('Summarize this document.', {
  files: [
    {
      type: 'text',
      mediaType: 'text/plain',
      data: report,
      name: 'report.txt',
    },
  ],
});
```

Document inputs support:

| Source       | `type`   | `mediaType`       | `data`                        |
| ------------ | -------- | ----------------- | ----------------------------- |
| Plain text   | `text`   | `text/plain`      | The document text             |
| PDF document | `base64` | `application/pdf` | Base64-encoded PDF file bytes |

`name` is optional for both forms. Attach content through `data`; a filesystem path by itself is not a document upload.

### Structured output

Use `outputFormat` when another system needs a JSON object that follows a schema.

```typescript
import { OutputFormatType, run } from '@factory/droid-sdk/node';

const result = await run('Return the repository name and test command.', {
  outputFormat: {
    type: OutputFormatType.JsonSchema,
    schema: {
      type: 'object',
      properties: {
        repository: { type: 'string' },
        testCommand: { type: 'string' },
      },
      required: ['repository', 'testCommand'],
      additionalProperties: false,
    },
  },
});

if (!result.success) {
  throw new Error(
    result.structuredOutputError?.message ??
      result.error?.message ??
      `Structured output failed (${result.subtype}).`
  );
}

if (!result.structuredOutput) {
  throw new Error('No structured output was returned.');
}

console.log(JSON.stringify(result.structuredOutput, null, 2));
```

Invalid or missing schema output normally produces a failed result with subtype `error_structured_output`; `structuredOutputError` contains the available validation details.

`structuredOutput` is typed as `unknown`, because a JSON Schema does not provide a TypeScript runtime validator. Check that it is present and validate or narrow its shape before reading fields or passing it to another system. A successful result can still omit structured output, so do not use `result.success` as the only check.

## Permissions and user input

### Autonomy

Autonomy controls which actions require approval in Auto mode.

```typescript
import { AutonomyLevel } from '@factory/droid-sdk/node';

const session = await createSession({
  autonomyLevel: AutonomyLevel.Off,
});
```

| Level    | Behavior                                |
| -------- | --------------------------------------- |
| `Off`    | Ask before every action                 |
| `Low`    | Allow file edits and read-only commands |
| `Medium` | Allow reversible commands               |
| `High`   | Allow commands without approval prompts |

When omitted, Droid uses the configured default. Autonomy does not select Auto or Spec mode; `interactionMode` does that.

### Permission handler

Use `permissionHandler` to approve or reject requests that reach the client.
The handler may be synchronous or asynchronous.

```typescript
import {
  ToolConfirmationOutcome,
  ToolConfirmationType,
} from '@factory/droid-sdk/node';

const session = await createSession({
  autonomyLevel: AutonomyLevel.Off,
  permissionHandler({ toolUses, options }) {
    const createsOnly =
      toolUses.length > 0 &&
      toolUses.every((use) => use.details.type === ToolConfirmationType.Create);

    const desired = createsOnly
      ? ToolConfirmationOutcome.ProceedOnce
      : ToolConfirmationOutcome.Cancel;

    const offered = options.find((option) => option.value === desired);
    if (!offered) throw new Error(`Outcome not offered: ${desired}`);

    return desired;
  },
});
```

`toolUses` describes the pending actions. `options` contains the outcomes available for this request. Return one of those values. Common outcomes are:

| Outcome         | Effect                                  |
| --------------- | --------------------------------------- |
| `ProceedOnce`   | Approve this request                    |
| `ProceedAlways` | Approve and persist the applicable rule |
| `Cancel`        | Reject the request                      |

The available outcomes vary by request. Returning an unavailable value, throwing from the handler, or omitting the handler cancels the request.

### AskUser handler

`askUserHandler` answers questions Droid asks during a turn. Connect it to a form, prompt, or other application UI.

```typescript
const result = await run('Ask me which environment to deploy.', {
  askUserHandler({ questions }) {
    return {
      answers: questions.map((question) => ({
        index: question.index,
        question: question.question,
        answer: question.options[0] ?? 'none',
      })),
    };
  },
});
```

Each answer must copy the question's `index` and `question`. To decline the questionnaire:

```typescript
return { cancelled: true, answers: [] };
```

Without a handler, AskUser requests are declined.

### Tool controls

Disable tools when creating, resuming, or updating a session:

```typescript
const session = await createSession({
  disabledToolIds: ['Execute'],
});

await session.updateSettings({
  disabledToolIds: ['Execute', 'Edit'],
});
```

Tool IDs are strings. Use `listTools()` to inspect the tools available to the current session.

```typescript
const tools = await session.listTools();

for (const tool of tools) {
  console.log(tool.id, tool.allowed);
}
```

#### Discover tool schemas

Set `includeSchemas` to include JSON Schemas for tool inputs, results, and
progress updates. Use `toolIds` to return only the tools you need.

```typescript
const tools = await session.listTools({
  includeSchemas: true,
  toolIds: ['Read', 'Edit', 'Execute'],
});

for (const tool of tools) {
  console.log(tool.id, tool.source);
  console.log('input:', tool.schemas.input);
  console.log('result:', tool.schemas.result?.content);
  console.log('parsed result:', tool.schemas.result?.parsedContent);
  console.log('progress:', tool.schemas.progress);
}
```

| Field                          | Meaning                                                                    |
| ------------------------------ | -------------------------------------------------------------------------- |
| `source`                       | Broad tool origin: `native`, `mcp`, or `connector`; use `id` for identity |
| `schemas.input`                | JSON Schema for arguments accepted by the tool                             |
| `schemas.result.content`       | JSON Schema for content returned when the tool finishes                    |
| `schemas.result.parsedContent` | JSON Schema for parsed result content, when declared                       |
| `schemas.progress`             | JSON Schema for structured updates emitted while the tool runs             |

With `includeSchemas: true`, `schemas` and `schemas.input` are guaranteed on
every returned tool. `source`, `result`, `parsedContent`, and `progress`
remain optional because tools only include the metadata they declare. An older
Droid that omits requested schemas throws `ProtocolError` with instructions to
update Droid.

The public SDK provides subtractive `disabledToolIds`. It does not expose a
restrictive allowlist.

## Extensions

Use the extension that matches the job:

| Extension            | Use it for                                       |
| -------------------- | ------------------------------------------------ |
| Skills               | Reusable instructions and supporting files       |
| SDK MCP tools        | In-process TypeScript functions exposed to Droid |
| External MCP servers | Tools provided by another process or service     |
| Hooks                | Commands that run at defined lifecycle events    |

### Skills

List the skills available to the session:

```typescript
const { skills } = await session.listSkills();

for (const skill of skills) {
  console.log(skill.name, skill.enabled);
}
```

Enable or disable a skill at the user or project level:

```typescript
import { SettingsLevel } from '@factory/droid-sdk/node';

await session.setSkillDisabled({
  skillName: 'skill-name',
  disabled: true,
  settingsLevel: SettingsLevel.Project,
});
```

Skills can come from project, personal, built-in, or automation settings.

### In-process MCP tools

Use `tool()` to define an in-process TypeScript function with a Zod input schema.
The SDK and Droid CLI must use compatible Factory protocol versions.

```typescript
import { z } from 'zod';
import {
  createSdkMcpServer,
  createSession,
  tool,
} from '@factory/droid-sdk/node';

const server = createSdkMcpServer({
  name: 'review-tools',
  tools: [
    tool(
      'lookup_owner',
      'Returns the owner of a file',
      { path: z.string() },
      ({ path }) => `Owner for ${path}: platform-team`
    ),
  ],
});

const session = await createSession({
  mcpServers: [server],
});

try {
  for await (const _message of session.stream(
    'Find the owner of src/index.ts.'
  )) {
    // Consume messages.
  }
} finally {
  await session.close();
}
```

The SDK starts an authenticated loopback MCP server and closes it with the session.
Tool calls still follow the session's autonomy and permission rules.
Attach SDK MCP servers again when resuming a saved session because they are runtime objects, not persisted session data.

### External MCP servers

Pass external MCP configuration when creating or resuming a session:

```typescript
const session = await createSession({
  mcpServers: [
    {
      name: 'docs',
      type: 'http',
      url: 'https://example.com/mcp',
      headers: [],
    },
  ],
});
```

Supported session configuration:

| Transport     | `type` field | Required configuration |
| ------------- | ------------ | ---------------------- |
| Local process | Omit         | `command` and `args`   |
| HTTP          | `http`       | `url` and `headers`    |
| SSE           | `sse`        | `url` and `headers`    |

Inspect server status and discovered tools:

```typescript
try {
  const { servers, summary } = await session.listMcpServers();
  const tools = await session.listMcpTools();

  console.log(servers, summary, tools);
} finally {
  await session.close();
}
```

`addMcpServer()`, `removeMcpServer()`, and `toggleMcpServer()` change the user's Droid configuration.
Use `authenticateMcpServer({ serverName })` when a server requires authentication.

### Hooks

Hooks run shell commands at defined lifecycle events.
Configure them in `.factory/hooks.json`:

```json
{
  "PreToolUse": [
    {
      "matcher": "Execute",
      "hooks": [
        {
          "type": "command",
          "command": "echo before Execute"
        }
      ]
    }
  ]
}
```

Hooks can run before or after tools, when prompts are submitted, when notifications arrive, during compaction, and when sessions or subagents stop.

Hook events are available in the stream:

```typescript
for await (const message of session.stream('Run the tests.')) {
  if (message.type === DroidMessageType.Hook) {
    console.log(message.status, message.command);
  }
}
```

The SDK exposes hook schemas and stream events, but it does not provide a programmatic hook-registration API.

## Session lifecycle

Fork, compact, and rewind return ready successor sessions and retire the source wrapper.

### Fork

`fork()` creates a new session from the current conversation.

```typescript
const forked = await session.fork();
```

### Compact

`compact()` summarizes older conversation history and returns the successor in `session`.

```typescript
const { session: compacted, removedCount } = await forked.compact();
```

### Rewind

`rewind()` returns the conversation to an earlier message and can restore or delete files.

```typescript
const {
  session: rewound,
  restoredCount,
  deletedCount,
} = await compacted.rewind({
  messageId,
  filesToRestore,
  filesToDelete,
  forkTitle: 'Before the failed change',
});
```

### Successor ownership

After a successful replacement, active operations on the source wrapper throw
`SessionReplacedError`. Its `id`, `settings`, and `cwd` remain readable, and
`close()` is a no-op. The persisted source session can still be loaded later
with `resumeSession(sourceId)`.

Do not replace a session while it has an active stream.

## Spec mode

Spec mode lets Droid inspect the codebase and propose a plan without changing files. Start a session in Spec mode or switch an existing session with `enterSpecMode()`:

```typescript
const session = await createSession({
  interactionMode: DroidInteractionMode.Spec,
});

// Or switch an existing Auto session.
await session.enterSpecMode();
```

`enterSpecMode()` can also set the model used for planning:

```typescript
await session.enterSpecMode({
  specModeModelId: 'model-id',
  specModeReasoningEffort: ReasoningEffort.High,
});
```

### Leave without approving a plan

Call `updateSettings()` to return the session to Auto mode without approving a
plan or starting implementation:

```typescript
import { DroidInteractionMode } from '@factory/droid-sdk/node';

// Return to Auto mode without approving or implementing the plan.
await session.updateSettings({
  interactionMode: DroidInteractionMode.Auto,
});
```

Changing the interaction mode does not select a `ToolConfirmationOutcome` or
approve an `ExitSpecMode` permission request.

`updateSettings()` is available on Node `DroidSession` handles returned by
`createSession()`, `resumeSession()`, and replacement operations such as
`fork()`, `compact()`, and `rewind()`. Daemon clients use
`droid.sessions.updateSettings()`.

### Approve a plan

When the plan is ready, Droid sends an `ExitSpecMode` permission request. Its
details contain the plan. Unlike changing the interaction mode with
`updateSettings()`, approving it with `ProceedOnce` accepts the completed plan,
returns to Auto mode, and continues implementation in the same session:

```typescript
import {
  AutonomyLevel,
  createSession,
  DroidInteractionMode,
  DroidMessageType,
  ToolConfirmationOutcome,
  ToolConfirmationType,
} from '@factory/droid-sdk/node';

const session = await createSession({
  interactionMode: DroidInteractionMode.Auto,
  autonomyLevel: AutonomyLevel.Low,
  permissionHandler({ toolUses }) {
    const request = toolUses.find(
      ({ details }) => details.type === ToolConfirmationType.ExitSpecMode
    );

    if (request?.details.type === ToolConfirmationType.ExitSpecMode) {
      console.log(request.details.plan);

      return ToolConfirmationOutcome.ProceedOnce;
    }

    return ToolConfirmationOutcome.Cancel;
  },
});

try {
  await session.enterSpecMode();

  for await (const message of session.stream('Plan and update README.md.')) {
    if (message.type === DroidMessageType.Result) {
      console.log(message.subtype);
    }
  }
} finally {
  await session.close();
}
```

The handler can be asynchronous. An interactive application should display the plan and wait for the user's decision before returning.

Return `Cancel` to reject the plan. The turn ends with an `interrupted` result, and the session remains available for another prompt.

Some `ExitSpecMode` requests offer `ProceedNewSession` variants. Return one of those offered values to hand implementation to a new session. Return only values present in the request's `options`.

## Observability and advanced APIs

### Observability

```typescript
import { run } from '@factory/droid-sdk/node';

const result = await run('Check the repository status.', {
  observability: {
    logger: {
      log(event) {
        console.log(event.level, event.name, event.attributes);
      },
    },
  },
});

if (!result.success) {
  throw new Error(result.error?.message ?? `Run failed: ${result.subtype}`);
}
```

Pass `logger`, `metrics`, or `tracing` sinks through `observability`.
Sink methods must not throw.
The SDK excludes prompts, messages, tool inputs, raw output, and stack traces from observability events.
Process startup emits telemetry before the first turn, and `close()` emits a request log.
To verify turn-specific logs, snapshot the count after creating the session and check it before closing.

### Raw notifications

Use `onNotification()` only when `session.stream()` does not expose the event you need:

```typescript
const unsubscribe = session.onNotification(
  (notification) => console.log(notification.type),
  { type: 'settings_updated' }
);

unsubscribe();
```

## Examples

| Example | Demonstrates |
| --- | --- |
| <a href="https://github.com/Factory-AI/droid-sdk-typescript/blob/main/examples/node/multi-turn-session.ts">Multi-turn session</a> | Keep context across prompts |
| <a href="https://github.com/Factory-AI/droid-sdk-typescript/blob/main/examples/node/init-metadata.ts">Initialization metadata</a> | Read session metadata after initialization |
| <a href="https://github.com/Factory-AI/droid-sdk-typescript/blob/main/examples/node/session-settings.ts">Session settings</a> | Read and update active-session settings |
| <a href="https://github.com/Factory-AI/droid-sdk-typescript/blob/main/examples/node/rename-session.ts">Rename a session</a> | Change a saved session's title |
| <a href="https://github.com/Factory-AI/droid-sdk-typescript/blob/main/examples/node/list-sessions.ts">List sessions</a> | Discover saved sessions |
| <a href="https://github.com/Factory-AI/droid-sdk-typescript/blob/main/examples/node/model-discovery.ts">Model discovery</a> | Discover selectable and disabled models |
| <a href="https://github.com/Factory-AI/droid-sdk-typescript/blob/main/examples/node/session-stream.ts">Session stream</a> | Consume complete stream messages |
| <a href="https://github.com/Factory-AI/droid-sdk-typescript/blob/main/examples/node/result-metadata.ts">Result metadata</a> | Inspect terminal result metadata |
| <a href="https://github.com/Factory-AI/droid-sdk-typescript/blob/main/examples/node/abort-session-stream.ts">Abort a stream</a> | Cancel a turn with an abort signal |
| <a href="https://github.com/Factory-AI/droid-sdk-typescript/blob/main/examples/node/interrupt-session.ts">Interrupt a session</a> | Request interruption during a turn |
| <a href="https://github.com/Factory-AI/droid-sdk-typescript/blob/main/examples/node/image-attachment.ts">Image attachment</a> | Send a local image with a prompt |
| <a href="https://github.com/Factory-AI/droid-sdk-typescript/blob/main/examples/node/structured-output.ts">Structured output</a> | Validate model output against a schema |
| <a href="https://github.com/Factory-AI/droid-sdk-typescript/blob/main/examples/node/permission-handler.ts">Permission handler</a> | Respond to tool permission requests |
| <a href="https://github.com/Factory-AI/droid-sdk-typescript/blob/main/examples/node/ask-user-elicitation.ts">AskUser handler</a> | Answer questions from Droid |
| <a href="https://github.com/Factory-AI/droid-sdk-typescript/blob/main/examples/node/tool-controls.ts">Tool controls</a> | Restrict and configure native tools |
| <a href="https://github.com/Factory-AI/droid-sdk-typescript/blob/main/examples/node/enter-spec-mode.ts">Enter Spec mode</a> | Plan before implementation |
| <a href="https://github.com/Factory-AI/droid-sdk-typescript/blob/main/examples/node/sdk-mcp-tool.ts">SDK MCP tool</a> | Define an in-process MCP tool |
| <a href="https://github.com/Factory-AI/droid-sdk-typescript/blob/main/examples/node/hook-execution.ts">Hook execution</a> | Observe configured hook events |
| <a href="https://github.com/Factory-AI/droid-sdk-typescript/blob/main/examples/node/observability.ts">Observability</a> | Capture SDK logs and telemetry |

## API reference

### Entrypoint

Import functions, classes, enums, and types from `@factory/droid-sdk/node`.

### Functions

| API                                  | Returns                      |
| ------------------------------------ | ---------------------------- |
| `run(prompt, options?)`              | `Promise<DroidResult>`       |
| `createSession(options?)`            | `Promise<DroidSession>`      |
| `resumeSession(sessionId, options?)` | `Promise<DroidSession>`      |
| `listSessions(options?)`             | `Promise<SessionMetadata[]>` |
| `listModels(options?)`               | `Promise<ModelInfo[]>`       |
| `createSdkMcpServer(options)`        | `SdkMcpServer`               |
| `tool(...)`                          | `DroidTool`                  |

### `DroidSession`

| Member                    | Purpose                                      |
| ------------------------- | -------------------------------------------- |
| `id`                      | Session ID                                   |
| `cwd`                     | Live working directory                       |
| `settings`                | Live read-only settings                      |
| `stream()`                | Run one turn                                 |
| `interrupt()`             | Stop the active turn                         |
| `updateSettings()`        | Update session settings                      |
| `enterSpecMode()`         | Change to spec mode                          |
| `listTools()`             | List normalized tools                        |
| `listSkills()`            | List skills                                  |
| `setSkillDisabled()`      | Enable or disable a skill                    |
| `addMcpServer()`          | Add an MCP server                            |
| `removeMcpServer()`       | Remove an MCP server                         |
| `toggleMcpServer()`       | Enable or disable an MCP server              |
| `listMcpServers()`        | List MCP servers                             |
| `listMcpTools()`          | List MCP tools                               |
| `authenticateMcpServer()` | Start MCP authentication                     |
| `getContextStats()`       | Read context usage                           |
| `getRewindInfo()`         | Inspect rewindable file changes              |
| `rewind()`                | Create a rewound successor                   |
| `compact()`               | Create a compacted successor                 |
| `fork()`                  | Create a forked successor                    |
| `rename()`                | Change the session title                     |
| `onNotification()`        | Subscribe to raw notifications               |
| `close()`                 | Close the session and owned resources        |

### Stream types

| Type                 | Purpose                                           |
| -------------------- | ------------------------------------------------- |
| `DroidStreamMessage` | Complete messages returned by the default stream  |
| `DroidStreamEvent`   | Complete messages plus partial events             |
| `DroidResult`        | Terminal result returned by `run()`               |
| `DroidMessageType`   | Runtime constants for narrowing stream messages   |
| `TokenUsage`         | Token counts and optional Factory Service Credits |
| `ModelInfo`          | Model catalog entry returned by discovery APIs    |

`session.stream()` yields `DroidStreamMessage` by default and `DroidStreamEvent` when `includePartialMessages` is `true`.

### Result states

| Subtype                   | `success` | `interrupted` | Meaning                   |
| ------------------------- | --------- | ------------- | ------------------------- |
| `success`                 | `true`    | `false`       | Turn completed            |
| `interrupted`             | `false`   | `true`        | Turn was stopped          |
| `error_during_execution`  | `false`   | `false`       | Runtime failure           |
| `error_structured_output` | `false`   | `false`       | Structured-output failure |

Every result includes `sessionId`, `durationMs`, `tokenUsage`, `messages`, `text`, and `turnCount`.
Check `success` before using successful output.

### Main enums

| Enum                   | Values                                                                           |
| ---------------------- | -------------------------------------------------------------------------------- |
| `AutonomyLevel`        | `Off`, `Low`, `Medium`, `High`                                                   |
| `DroidInteractionMode` | `Auto`, `Spec`                                                                   |
| `ReasoningEffort`      | `None`, `Dynamic`, `Off`, `Minimal`, `Low`, `Medium`, `High`, `ExtraHigh`, `Max` |
| `OutputFormatType`     | `JsonSchema`                                                                     |

Model IDs and tool IDs are strings rather than closed enums.

### Main errors

| Error                     | Meaning                                       |
| ------------------------- | --------------------------------------------- |
| `ConcurrentStreamError`   | A session handle already has an active stream |
| `SessionReplacedError`    | A source wrapper was replaced                 |
| `SessionReplacementError` | Successor loading or rollback failed          |
| `DroidClientError`        | Base client error                             |
| `ConnectionError`         | Droid process connection failed               |
| `TimeoutError`            | A request timed out                           |
| `ProtocolError`           | Protocol or API response failed               |
| `SessionError`            | Base session error                            |
| `SessionNotFoundError`    | Saved session was not found                   |
| `InvalidSessionCwdError`  | Saved working directory is invalid            |
| `ProcessExitError`        | Droid subprocess exited unexpectedly          |

## Known limitations

- New-session spec handoff IDs require raw notification inspection.
- SDK MCP tools require compatible protocol versions in the npm package and
  Droid CLI.

<RelatedLinks>
  <RelatedLink href='/sdk/python' title='Python SDK'>
    Build asyncio integrations with the Droid SDK.
  </RelatedLink>
  <RelatedLink href='/droid-exec/overview' title='Droid Exec'>
    Run Droid non-interactively from the command line.
  </RelatedLink>
</RelatedLinks>


---

<!-- ===== SOURCE: https://docs.factory.com/droid-exec/overview.md ===== -->

# [Saved page] https://docs.factory.com/droid-exec/overview.md

# Droid Exec (Headless)

Non-interactive execution mode for CI/CD pipelines and automation scripts.

Droid Exec is Factory's headless execution mode designed for automation workflows. Unlike the interactive CLI, `droid exec` runs as a one-shot command that completes a task and exits, making it ideal for CI/CD pipelines, shell scripts, and batch processing.

<Tip>
  Start from a recipe: [lint autofix](/droid-exec/recipes/lint-autofix), [organize imports](/droid-exec/recipes/organize-imports), [error message refactors](/droid-exec/recipes/error-messages), [dependency and secret scanning](/droid-exec/recipes/dependency-secret-scan), or [daily docs and tests](/droid-exec/recipes/daily-docs-tests).
</Tip>

## Summary and goals

Droid Exec is a one-shot task runner: it produces readable logs (and structured artifacts when requested), keeps mutations and command execution opt-in so runs are secure by default, fails fast on permission violations with clear errors, and composes simply for batch and parallel work.

<CardGroup cols={2}>
  <Card title="Non-Interactive" icon="terminal">
    Single run execution that writes to stdout/stderr for CI/CD integration
  </Card>
  <Card title="Secure by Default" icon="lock">
    Read-only by default with explicit opt-in for mutations via autonomy levels
  </Card>
  <Card title="Composable" icon="puzzle">
    Designed for shell scripting, parallel execution, and pipeline integration
  </Card>
  <Card title="Clean Output" icon="file-export">
    Structured output formats and artifacts for automated processing
  </Card>
</CardGroup>

## Execution model

Each run is a single non-interactive pass that writes to stdout/stderr. By default the run is read-only: Droid can read files and run read-only commands, but can't edit anything. Add `--auto` to allow edits and commands, with risk tiers gating what can run.

Options (run `droid exec --help` for the full list, examples, and available models):

```text
Usage: droid exec [options] [prompt]

-o, --output-format <format>   text|json|stream-json|stream-jsonrpc|acp
--input-format <format>        stream-jsonrpc for multi-turn sessions
-f, --file <path>              Read prompt from file
--auto <level>                 Autonomy level: low|medium|high
--skip-permissions-unsafe      Skip all permission prompts (unsafe)
--disable-builtin-skills       Disable Factory-provided builtin skills
-s, --session-id <id>          Continue an existing session
--fork <id>                    Fork a session into a new session
-m, --model <id>               Model ID to use
-r, --reasoning-effort <level> Reasoning effort (defaults per model)
--spec-model <id>              Model ID for spec mode
--spec-reasoning-effort <lvl>  Reasoning effort for spec mode
--use-spec                     Start in spec mode
--only-tools <ids>             Use only these tools
--add-tools <ids>              Add tools to the default set
--remove-tools <ids>           Remove tools from the allowed set
--list-tools                   List tools for the selected model and exit
--cwd <path>                   Working directory path
--settings <path>              Settings file merged for this run only
-w, --worktree [name]          Run in a git worktree
--tag <spec>                   Session tag (name or JSON, repeatable)
--log-group-id <id>            Log group ID for filtering logs
--append-system-prompt <text>  Append text to the system prompt
--append-system-prompt-file <path>
                               Append a file to the system prompt
--mission                      Run in mission mode
--worker-model <id>            Model for mission workers
--worker-reasoning-effort <l>  Reasoning effort for mission workers
--validator-model <id>         Model for mission validators
--validator-reasoning-effort <l>
                               Reasoning effort for mission validators
```

Use any [available model ID](/models) with `--model` or `--spec-model`. For custom models, see [Custom Models (BYOK)](/model-independence/byok).

For multi-turn sessions, use `--input-format stream-jsonrpc` with a matching `--output-format stream-jsonrpc` and drive the session over [raw JSON-RPC](#build-custom-flows-on-raw-json-rpc). The older `stream-json` input mode still parses but is deprecated and prints a warning.

## Installation

<Steps>
  <Step title="Install the Droid CLI">
    **macOS/Linux:** `curl -fsSL https://app.factory.ai/cli | sh`

**Homebrew:** `brew install --cask droid`

**Windows:** `irm https://app.factory.ai/cli/windows | iex`

**npm:** `npm install -g droid`
  </Step>

  <Step title="Get Factory API Key">
    Generate your API key from the <a href="https://app.factory.ai/settings/api-keys">Factory Settings Page</a>
  </Step>

  <Step title="Set Environment Variable">
    Export your API key as an environment variable:
    ```bash
    export FACTORY_API_KEY=fk-...
    ```
  </Step>
</Steps>

## Quickstart

### Direct prompt

```bash
droid exec "analyze code quality"
droid exec "fix the bug in src/main.js" --auto low
```

### From file

```bash
droid exec -f prompt.md
```

### Pipe

```bash
echo "summarize repo structure" | droid exec
```

### Session continuation

```bash
droid exec --session-id <session-id> "continue with next steps"
```

## Autonomy levels

Droid exec uses tiered autonomy to control what operations can run without manual confirmation. It starts read-only by default; use explicit flags when an automation needs to modify files, install dependencies, or touch external systems.

<ComparisonTable label='Choosing an autonomy level'>

| Mode | Allows | Blocks or limits | Best for |
| :--- | :----- | :--------------- | :------- |
| Default, no flags | Read-only file inspection, directory listing, process and environment inspection, and git read operations such as `git status`, `git log`, and `git diff`. | File edits, package installs, git writes, system changes, and deployments. | Analysis, planning, architecture review, security review, and reports. |
| `--auto low` | Low-risk project file creation and edits. | System modifications, package installs, remote writes, and production changes. | Documentation updates, formatting, adding comments, and simple local edits. |
| `--auto medium` | Low-risk actions plus common local development operations such as trusted package installs, builds, tests, `git commit`, `git checkout`, and `git pull`. | `git push`, sudo commands, production changes, and sensitive or irreversible operations. | Local development, dependency updates, test fixes, and CI preparation. |
| `--auto high` | High-risk automation including remote writes, deployments, database migrations, and commands that may access sensitive data, subject to Droid's remaining hard safety checks. | Extreme destructive operations such as `sudo rm -rf /` and system-wide unsafe changes. | CI/CD pipelines, staging deployments, and fully automated workflows in controlled environments. |
| `--skip-permissions-unsafe` | Skips all permission prompts. | Command blocks still apply. Cannot be combined with `--auto` flags. Use only where the environment is disposable. | Throwaway containers, ephemeral CI runners, and temporary VMs. |

</ComparisonTable>

Examples:

```bash
# Analyze and plan without making changes
droid exec "List the files an OAuth2 migration of the auth module touches"

# Allow simple file edits
droid exec --auto low "add JSDoc comments to all exported functions"

# Allow normal local development operations
droid exec --auto medium "install deps, run tests, and fix failing checks"

# Allow deployment-oriented automation in a controlled environment
droid exec --auto high "fix the bug, run tests, commit, and push the branch"
```

<Warning>
  `--skip-permissions-unsafe` skips all permission prompts, but command blocks still apply.
  Only use it in completely isolated environments such as Docker containers,
  throwaway VMs, or ephemeral CI runners that are destroyed after the job.
</Warning>

The Droid CLI needs a glibc-based Linux image, such as Debian or Ubuntu. It doesn't run on Alpine.

```bash
# In a disposable Docker container
docker run --rm -e FACTORY_API_KEY -v "$PWD:/workspace" -w /workspace \
  debian:stable-slim sh -c '
  apt-get update && apt-get install -y curl ca-certificates git &&
  curl -fsSL https://app.factory.ai/cli | sh &&
  ~/.local/bin/droid exec --skip-permissions-unsafe \
    "Install system dependencies and run the integration tests"
'
```

### Fail-fast behavior

If Droid tries an action above the current autonomy level, `droid exec` stops at that action, prints an error to stderr, and exits non-zero. Edits Droid made before that point stay in the working tree, so check `git status` or discard them before you retry at a higher level.

### Command policy in automation

[Permission rules](/autonomy-and-safety/permission-rules) can allow commands, require
approval, or block them. A one-shot run cannot collect an interactive approval, so an
effective `ask` is not cleared merely by using `--auto high`. A matching block has no
approval path, including under `--skip-permissions-unsafe`.

Before running an automation, validate and preview its command policy from the relevant
repository:

```bash
droid rules check
droid rules check --command 'git push origin main' --json
```

The preview does not execute the command or evaluate every runtime check. A successful
check can report `block`; inspect the decision rather than treating exit code `0` as an
allow verdict.

Legacy `commandAllowlist`, `commandDenylist`, and `commandBlocklist` settings are
deprecated but remain respected for backward compatibility. Use `permissionRules` for
new automation policy and review [migration guidance](/autonomy-and-safety/permission-rules#migrate-legacy-command-lists)
before removing existing restrictions.

## Output formats and artifacts

Choose an output format with `-o, --output-format`:

- `text` (default): Droid's final response, for logs or redirecting to a file.
- `json`: one JSON object when the run ends.
- `stream-json`: one JSON event per line while the run progresses.
- `stream-jsonrpc`: the full JSON-RPC protocol, for [custom integrations](#build-custom-flows-on-raw-json-rpc).

### text (default)

```bash
$ droid exec --auto low "Create hello.py that prints hello world"
Created hello.py, which prints "hello world" when you run it.
```

### json

The result arrives as one line. It's formatted here for reading:

```bash
$ droid exec -o json "Summarize this repository in one sentence"
{
  "type": "result",
  "subtype": "success",
  "is_error": false,
  "duration_ms": 5657,
  "num_turns": 1,
  "result": "A TypeScript monorepo with an API and a UI package.",
  "session_id": "8af22e0a-d222-42c6-8c7e-7a059e391b0b",
  "usage": {
    "input_tokens": 4,
    "output_tokens": 18,
    "cache_read_input_tokens": 13528,
    "cache_creation_input_tokens": 17913,
    "factory_credits": 36947,
    "ttft_ms": 2609
  }
}
```

Use JSON when a script needs the result text, the session ID for a follow-up run, or token usage:

```bash
out=$(droid exec -o json "Summarize this repository in one sentence")
echo "$out" | jq -r .result
droid exec -s "$(echo "$out" | jq -r .session_id)" "Now list its packages"
```

### stream-json

Each line is an event: `system` (session start, with the working directory, model, and tools), `message`, `tool_call`, `tool_result`, and a final `completion` with the response text and usage. Use it to show progress in build logs or to record which tools ran:

```bash
droid exec -o stream-json --auto medium "Fix the failing test" \
  | jq -r 'select(.type == "tool_call") | .toolName'
```

### Build custom flows on raw JSON-RPC

For custom integrations, you can run Droid as a long-lived subprocess and drive the full JSON-RPC control surface over stdin/stdout:

```bash
droid exec --input-format stream-jsonrpc --output-format stream-jsonrpc \
  --auto low
```

Each stdin line is one JSON-RPC request. Each stdout line is a JSON-RPC response, a request from Droid, or a notification. Your client:

- spawns `droid exec` in the project directory with the flags it needs
- writes newline-delimited requests, each with a unique `id`
- reads stdout line by line and matches responses by `id`
- handles timeouts, process cleanup, and session persistence

The core methods and events:

<PropertyList>
  <Property name='droid.initialize_session'>
    Start a new session; a client calls this (or `droid.load_session` to resume
    an existing session) first.
  </Property>
  <Property name='droid.add_user_message'>
    Send a turn to the session.
  </Property>
  <Property name='droid.session_notification'>
    Event stream your client handles: assistant text deltas, tool events, token
    usage, errors, and turn completion.
  </Property>
  <Property name='droid.request_permission'>
    Server-to-client request your client must answer; `droid.ask_user` arrives
    the same way.
  </Property>
</PropertyList>

Further session methods interrupt work, update settings, manage MCP servers/tools, inspect context, fork sessions, or compact history.

Teams use this to build their own agent UIs in web, desktop, or IDE apps, job runners and orchestrators that queue and resume sessions, policy layers that approve or audit permission requests, and bridges from Droid events into a message bus or telemetry pipeline.

To disable Factory-provided builtin skills, set `disableBuiltinSkills` when initializing or loading the session:

```json
{"jsonrpc":"2.0","id":"1","method":"droid.initialize_session","params":{"machineId":"my-machine","cwd":"/workspace","disableBuiltinSkills":true}}
{"jsonrpc":"2.0","id":"2","method":"droid.load_session","params":{"sessionId":"session-123","disableBuiltinSkills":true}}
```

In stream JSON-RPC mode, use the request field instead of the `--disable-builtin-skills` CLI flag. The TypeScript SDK exposes the same option through `createSession({ disableBuiltinSkills: true })` and `resumeSession(sessionId, { disableBuiltinSkills: true })`.

For protocol reference and implementation patterns, see the low-level client and process transport in the [TypeScript SDK](/sdk/typescript).

Prefer an SDK when possible:

- **TypeScript**: [`@factory/droid-sdk`](/sdk/typescript) for Node.js apps, streaming, multi-turn sessions, structured output, permissions, tool controls, and SDK-backed MCP tools
- **Python**: [`droid-sdk`](/sdk/python) for asyncio apps, streaming, direct client control, notifications, permissions, and typed event handling

### Write artifacts

For a report, redirect `text` output to a file. The run stays read-only:

```bash
droid exec "List the direct dependencies and what each one does" > deps.md
```

When the pipeline needs a structured file, ask Droid to write it, which needs `--auto low`. Then check the file before you use it:

```bash
droid exec --auto low "Write deps.json: an array of {name, version, usedIn}
for each direct dependency"
jq -e 'type == "array"' deps.json
```

## Working directory

Use `--cwd` to run Droid in another directory, such as one package of a monorepo. Pass an absolute path:

```bash
droid exec --cwd "$PWD/packages/api" "Map this package's internal modules"
```

Use `-w, --worktree [name]` to run the task inside an isolated [git worktree](/droid-cli/cli-reference#git-worktrees) on its own branch. This is useful for fanning out parallel `droid exec` jobs against the same repo without file conflicts:

```bash
droid exec --worktree codemod-a --auto medium "apply codemod A" & a=$!
droid exec --worktree codemod-b --auto medium "apply codemod B" & b=$!
wait "$a"; status_a=$?
wait "$b"; status_b=$?
[ "$status_a" -eq 0 ] && [ "$status_b" -eq 0 ]
```

Clean worktrees are auto-removed on exit; dirty ones are preserved so you can review and push the work.

## Models and reasoning effort

Choose a model with `-m` and adjust reasoning with `-r`. Valid reasoning levels depend on the model. See [Factory-Managed Inference](/models) for available models.

```bash
droid exec -m claude-opus-5-5 -r medium -f plan.md
```

Use `--use-spec` to start in specification mode, where the agent plans before executing:

```bash
droid exec --use-spec --auto low "refactor the auth module"
```

You can also use a different model for the spec phase:

```bash
droid exec --use-spec --spec-model claude-opus-5-5 --auto medium \
  "implement feature X"
```

### Tool controls

List the tools available for a model at the current autonomy level:

```bash
droid exec --list-tools
droid exec -m claude-opus-5-5 --auto low --list-tools -o json
```

Select tools by name, such as `Read` or `Execute`, or by MCP server with `MCP:<server>` or `MCP:<server>/<tool>`. Separate entries with commas or spaces:

```bash
# Use only these tools
droid exec --only-tools Read,Grep,Glob,LS "Map the auth module"

# Allow edits but no shell commands
droid exec --auto low --remove-tools Execute "Add JSDoc to src/api"

# Add every tool from a configured MCP server
droid exec --add-tools MCP:linear "Summarize my open issues"
```

An unknown tool name fails the run before Droid starts.

### Skill controls

Use `--disable-builtin-skills` when an interactive or non-interactive session should expose only skills supplied outside the Droid CLI:

```bash
# Start the interactive TUI without builtin skills
droid --disable-builtin-skills

# Run one non-interactive session without builtin skills
droid exec --disable-builtin-skills "analyze this repository"
```

This removes Factory-provided builtin skills while preserving user, project, plugin, automation, mission, runtime, and dynamically supplied skills. For an interactive launch, the restriction remains active when you create, resume, or switch sessions. It is also inherited by child sessions, including subagents and mission workers.

<Note>
  The flag is not supported in Agent Client Protocol (ACP) mode. Use it with standard `droid` or `droid exec`, or set `disableBuiltinSkills` on `droid.initialize_session` and `droid.load_session` requests in stream JSON-RPC mode.
</Note>

### Custom models

You can configure custom models to use with droid exec by adding them to your `~/.factory/settings.json` file:

```json
{
  "customModels": [
    {
      "model": "my-codex-model",
      "displayName": "My Custom Model",
      "baseUrl": "https://api.openai.com/v1",
      "apiKey": "${OPENAI_API_KEY}",
      "provider": "openai"
    }
  ]
}
```

To use a custom model, use the `custom:` prefix followed by the display name (with spaces replaced by dashes) and the index:

```bash
droid exec --model "custom:My-Custom-Model-0" "analyze this codebase"
```

If you have multiple custom models configured:

```json
{
  "customModels": [
    {
      "model": "moonshotai/kimi-k2-instruct-0905",
      "displayName": "Kimi K2 [Groq]",
      "baseUrl": "https://api.groq.com/openai/v1",
      "apiKey": "${GROQ_API_KEY}",
      "provider": "generic-chat-completion-api",
      "maxOutputTokens": 16384
    },
    {
      "model": "openai/gpt-oss-20b",
      "displayName": "GPT-OSS-20B [OpenRouter]",
      "baseUrl": "https://openrouter.ai/api/v1",
      "apiKey": "YOUR_OPENROUTER_KEY",
      "provider": "generic-chat-completion-api",
      "maxOutputTokens": 32000
    }
  ]
}
```

You would reference them as:

- `--model "custom:Kimi-K2-[Groq]-0"`
- `--model "custom:GPT-OSS-20B-[OpenRouter]-1"`

The index corresponds to the position in the `customModels` array (0-based).

<Note>
Reasoning effort (`-r` / `--reasoning-effort`) does not apply to custom models; it is controlled by the model and provider you configure.
</Note>

## Sessions, tagging, and logs

Forking lets you branch off an existing session without disturbing the original; the new run starts from the forked session's history and is assigned a fresh session ID.

```bash
# Continue a session in-place
droid exec --session-id <session-id> "next steps"

# Branch off a session into a new run
droid exec --fork <session-id> --auto low "try an alternative refactor"
```

Use `--tag` to attach searchable labels to a run. The flag is repeatable and accepts either a plain name or a JSON object for structured metadata. Pair it with `--log-group-id` to bucket logs from related runs together for easier filtering and aggregation downstream.

```bash
droid exec \
  --tag release-v2 \
  --tag '{"name":"team","value":"platform"}' \
  --log-group-id ci-nightly \
  --auto low "run nightly checks and write report.md"
```

## Customizing the system prompt

Use `--append-system-prompt` to append additional text to the end of the system prompt for a single run, or `--append-system-prompt-file` to append the contents of a file. Both flags can be combined and are useful for injecting project-specific guidance, style guides, or invariants without modifying global settings.

```bash
droid exec \
  --append-system-prompt "Always prefer functional React components." \
  --auto low "review src/components for class-based components"

droid exec \
  --append-system-prompt-file ./docs/style-guide.md \
  --auto low "lint prose in README.md against the style guide"
```

## Mission Mode

Mission Mode runs `droid exec` as a multi-agent orchestrator that plans work, delegates to worker agents, and validates results. Enable it with `--mission` and optionally select dedicated models and reasoning effort levels for the worker and validator roles. Mission Mode requires `--auto high` or `--skip-permissions-unsafe` because the orchestrator needs high autonomy to manage workers.

```bash
droid exec --mission \
  --worker-model claude-opus-5-5 \
  --worker-reasoning-effort medium \
  --validator-model gpt-6-sol \
  --validator-reasoning-effort medium \
  --auto high \
  "ship the new billing webhook end-to-end"
```

### Mission Mode flags

<PropertyList>
  <Property name='--mission'>
    Run in Mission Mode (multi-agent orchestration).
  </Property>
  <Property name='--worker-model <id>'>
    Model ID used by mission worker agents.
  </Property>
  <Property name='--worker-reasoning-effort <level>'>
    Reasoning effort for mission workers.
  </Property>
  <Property name='--validator-model <id>'>
    Model ID used by mission validator agents.
  </Property>
  <Property name='--validator-reasoning-effort <level>'>
    Reasoning effort for mission validators.
  </Property>
</PropertyList>

The top-level `-m, --model` and `-r, --reasoning-effort` flags still apply to the orchestrator itself; the worker and validator overrides only affect the agents the orchestrator spawns.

## Batch and parallel patterns

One run per file, with bounded concurrency:

```bash
# Refactor TypeScript files, 4 at a time
find src -name '*.ts' -print0 | xargs -0 -P 4 -I {} \
  droid exec --auto low "Refactor {} to use modern TypeScript patterns"
```

One read-only run per package, in parallel, each writing its own report:

```bash
pids=()
for dir in packages/ui packages/models apps/web; do
  droid exec --cwd "$PWD/$dir" \
    "Summarize the main risks in this package" > "$dir/report.md" &
  pids+=("$!")
done
failed=0
for pid in "${pids[@]}"; do wait "$pid" || failed=1; done
[ "$failed" -eq 0 ]
```

Chunked inputs, for a list too long for one prompt:

```bash
# Review a large diff 50 files at a time, one report per chunk
chunks=$(mktemp -d)
git diff --name-only origin/main...HEAD | split -l 50 - "$chunks/"
for f in "$chunks"/*; do
  [ -e "$f" ] || continue
  files=$(tr '\n' ' ' < "$f")
  droid exec "Review these changed files: $files" > "review-${f##*/}.md"
done
rm -r "$chunks"
```

A GitHub Actions matrix that runs one read-only analysis per directory and uploads each report:

```yaml title=".github/workflows/droid-cleanup-analysis.yml"
name: Droid cleanup analysis

on:
  schedule:
    - cron: '0 1 * * 0' # Sundays at 01:00 UTC
  workflow_dispatch:

permissions:
  contents: read

jobs:
  analyze:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    strategy:
      matrix:
        module: [components, services, utils, hooks]
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false

      - name: Install Droid CLI
        run: |
          curl -fsSL https://app.factory.ai/cli | sh
          echo "$HOME/.local/bin" >> "$GITHUB_PATH"

      - name: Find dead code
        env:
          FACTORY_API_KEY: ${{ secrets.FACTORY_API_KEY }}
          MODULE: ${{ matrix.module }}
        run: |
          droid exec --cwd "$GITHUB_WORKSPACE/src/$MODULE" \
            "Find unused exports, dead code, and deprecated patterns.
          Respond with a Markdown list of cleanup recommendations." \
            > cleanup-report.md

      - uses: actions/upload-artifact@v7
        with:
          name: cleanup-${{ matrix.module }}
          path: cleanup-report.md
```

For full workflows that edit code and open pull requests, see the [recipes](/droid-exec/recipes/dependency-secret-scan).

<Note>
  Pull request review, security review, and PR description fill already ship as a packaged action, [`Factory-AI/droid-action`](https://github.com/Factory-AI/droid-action), so you do not need to script those flows around `droid exec`. See [Automated Code Review](/software-factory/code-review-ci) to set it up.
</Note>

## More examples

License headers:

```bash
git ls-files '*.ts' | xargs -P 4 -I {} droid exec --auto low \
  "Add the Apache-2.0 license header to {} if it's missing"
```

API contract drift (read-only):

```bash
droid exec "Compare the operations in openapi.yaml to the TypeScript
client methods and list any mismatches" > drift.md
```

Blocking calls audit (read-only):

```bash
droid exec "Find synchronous child_process calls, such as execSync,
and suggest an async replacement for each" > child-process-audit.md
```

## Exit behavior

`droid exec` exits `0` when the run completes and non-zero when it stops early, for example on a permission stop, an invalid flag, or an API error. Treat non-zero as a failure in CI.

Exit `0` means Droid finished, not that the task succeeded. Check the result with your own tools, such as tests, a linter, or `jq` on an artifact.

## Best practices

- Start read-only and redirect the output to a file. Use `--auto low` only when Droid must edit files.
- Commit and push in your own script steps instead of giving Droid `--auto high`.
- Check every change with a deterministic tool before you commit it.
- Use `--skip-permissions-unsafe` only in disposable environments.
- In a monorepo, pass an absolute `--cwd` to run in one package.

<RelatedLinks>
  <RelatedLink href="/missions/running-cli" title="Running in the CLI">
    Orchestrate multi-agent missions from the command line.
  </RelatedLink>
  <RelatedLink href="/software-factory/code-review-ci" title="Automated Code Review">
    Wire Droid Exec into GitHub Actions for automated PR review.
  </RelatedLink>
</RelatedLinks>


---

<!-- ===== SOURCE: https://docs.factory.com/autonomy-and-safety/auto-run.md ===== -->

# [Saved page] https://docs.factory.com/autonomy-and-safety/auto-run.md

# Autonomy Level

Choose Off, Low, Medium, or High to control what Droid can do without repeated confirmations.

Autonomy Level sets the highest-risk work Droid can run without pausing for approval. It is separate from interaction mode: Normal Mode executes work, while Spec Mode plans before implementation.

## Choose a level

Execute commands and MCP tools have a risk level (`low`, `medium`, or `high`). For shell commands, [permission rules](/autonomy-and-safety/permission-rules) can allow execution, require approval, or block execution before autonomy fallback. Commands with no policy match run automatically when their risk is at or below your Autonomy Level. Sandbox checks can require separate approval.

| Autonomy Level | What can run without approval                           | Examples                                                               |
| -------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Off**        | Built-in read tools and commands allowed by policy      | `Read`, `LS`, `ls`, `pwd`, `git status`                                |
| **Low**        | File edits plus low-risk commands and MCP tools         | `Edit`, `Create`, `rg`, showing logs                                   |
| **Medium**     | Everything from Low plus reversible workspace changes   | `npm install`, `pip install`, `git commit`, `mv`, `cp`, build tooling  |
| **High**       | High-risk actions unless safety checks require approval | `docker compose up`, `git push` if allowed, migrations, custom scripts |

Droid still streams output and highlights file changes at every level.

## How approvals work

Autonomy Level controls automatic approval, not which tools are available. Tool policy, MCP configuration, model support, and organization controls can still restrict tools.

{/* sweep-allow: term-bullets */}

- **Normal vs. Spec Mode**: In Normal Mode, Autonomy Level controls approvals. Spec Mode is read-only planning; after approval, Droid exits Spec Mode and returns to Normal Mode for implementation.
- **File changes**: Low or higher lets Droid create, edit, and patch files without asking first.
- **Commands and MCP tools**: Droid compares the tool risk level to your Autonomy Level. If the risk is higher, it asks before continuing.
- **Command policy**: An effective `allow` skips command approval, `ask` requires it even at High, and `block` rejects the command with no approval path. Deprecated command lists still participate for backward compatibility.
- **Safety checks**: Built-in runtime safeguards can require approval for recognized destructive operations. [Sandbox](/autonomy-and-safety/sandbox) read, write, and network checks can also prompt separately. An allow rule grants permission; it does not prove a command is read-only.
- **Allow always**: Choosing an "always allow" option raises the current Autonomy Level to the level required by that prompt. Sandbox "allow always" options instead persist the allowed path or domain.
- **Spec approval**: When approving a Spec Mode plan, choose **Proceed with implementation** to continue with manual approvals, or choose an available Low, Medium, or High option for implementation. Organization Maximum Autonomy Level can hide higher options.

## Permission rules

Use `permissionRules` in [Settings](/droid-cli/settings#permission-rules) for new command policy. Rules match exact, ordered command arguments and include positive and negative examples. See [Permission rules](/autonomy-and-safety/permission-rules) to create, test, and preview them.

After rule IDs are resolved across settings sources, matching blocks take precedence over requests for approval, which take precedence over allows. Commands with no match fall back to session approvals and the active Autonomy Level. Organization and project definitions with the same ID follow [rule source precedence](/autonomy-and-safety/permission-rules#understand-scope-and-precedence).

`--skip-permissions-unsafe` skips all permission prompts, but command blocks still apply.

## Command allowlists, denylists, and blocklists

`commandAllowlist`, `commandDenylist`, and `commandBlocklist` are **deprecated, not removed**. Existing lists remain respected for backward compatibility. Use `permissionRules` for new configuration; immediate migration is not required.

The replacement decisions are `allow`, `ask`, and `block`, respectively. A native rule can replace a custom legacy restriction from the same settings source, while restrictions from other sources remain effective. Review [migration and coexistence](/autonomy-and-safety/permission-rules#migrate-legacy-command-lists) before changing existing policy.

<Warning>
  Command rules are not operating-system isolation. Prefixes do not cover every
  equivalent command spelling or inspect arbitrary script behavior. Use
  [sandboxing](/autonomy-and-safety/sandbox), managed hooks, and least-privilege
  credentials for additional protection.
</Warning>

## Change the level

- Press <Kbd keys='Ctrl+L' /> to cycle `Off → Low → Medium → High → Off`. Organization policy can cap the highest available level.
- Press <Kbd keys='Shift+Tab' /> to switch between Normal Mode and Spec Mode.
- Set a default in `/settings` for future sessions.
- Change Autonomy Level before implementation, from the [Spec Mode](/autonomy-and-safety/specification-mode) approval dialog, or any time after leaving Spec Mode.

## Where Autonomy Level applies

{/* sweep-allow: term-bullets */}

- **Interactive CLI**: `droid` uses the session's current Autonomy Level. `droid "<prompt>"` starts the same interactive CLI with an initial prompt, so the first task uses your configured default. See the [CLI reference](/droid-cli/cli-reference).
- **Factory App**: Factory App sessions use the same Normal, Spec, Mission, and Autonomy Level controls as CLI sessions.
- **Droid Exec**: `droid exec` is read-only by default. Use `--auto low`, `--auto medium`, or `--auto high` for non-interactive runs that need edits, local development commands, or broader automation. See [Droid Exec](/droid-exec/overview).
- **Custom Droids (Subagents)**: Task-launched subagents inherit the parent session's Autonomy Level by default, or use the **Subagent autonomy level** setting (`inherit`, `off`, `low`, `medium`, `high`) when configured, always clamped to the organization's Maximum Autonomy Level. In Spec Mode they are read-only. Organization and Droid tool policy can still restrict them. See [Custom Droids](/harness/subagents).
- **Factory Missions**: Missions orchestration requires High autonomy or `--skip-permissions-unsafe` (unsafe: skips permission prompts, but not effective command blocks; use only in isolated sandboxes), and admins can restrict who can start Missions. See [Factory Missions](/missions/overview).

## Enterprise Controls

Enterprise admins can set organization-wide autonomy boundaries with organization-managed settings. See [Enterprise Controls & Managed Settings](/enterprise/hierarchical-settings-and-org-control).

- **Default Autonomy Level** sets the starting level for new sessions.
- **Maximum Autonomy Level** caps how high members can raise autonomy. If the maximum is Medium, High is unavailable in the CLI.

These controls layer with permission rules, legacy command lists, MCP restrictions, sandbox settings, and Missions access controls.

## Use it safely

- Start new or high-stakes work with Off or Low until you trust the plan.
- Match the minimum level to the work: use Low for file edits and generated reports, Medium when the run must install dependencies, build, test, or make local commits, and High for pushes, deployments, Task-launched subagents, Missions, or other orchestration.
- Add defense in depth with [blocking hooks](/harness/hooks), permission rules, MCP restrictions, least-privilege credentials, and isolated runners.
- For CI workflows, choose the lowest `droid exec --auto` level that allows the workflow to complete. See [Automated Code Review](/software-factory/code-review-ci) and [Droid Exec](/droid-exec/overview).
- If you spot a suspect command, interrupt, provide guidance, and resume at the Autonomy Level that fits the remaining risk.

<RelatedLinks>
  <RelatedLink href='/autonomy-and-safety/specification-mode' title='Interaction Modes'>
    Understand Normal, Spec, and Mission Mode and how they relate to autonomy.
  </RelatedLink>
  <RelatedLink href='/harness/hooks' title='Hooks'>
    Enforce deterministic policy and validation at every tool call.
  </RelatedLink>
  <RelatedLink href='/autonomy-and-safety/permission-rules' title='Permission rules'>
    Define and test command approval policy.
  </RelatedLink>
  <RelatedLink href='/autonomy-and-safety/sandbox' title='Sandbox'>
    Add filesystem and network isolation.
  </RelatedLink>
</RelatedLinks>


---

<!-- ===== SOURCE: https://docs.factory.com/autonomy-and-safety/permission-rules.md ===== -->

# [Saved page] https://docs.factory.com/autonomy-and-safety/permission-rules.md

# Permission rules

Allow, require approval for, or block shell commands with tested rules and preview policy decisions before execution.

Permission rules control whether matching shell commands run without command approval, require approval, or are blocked. Each rule specifies an ordered command prefix and examples that verify its matching behavior.

<Note>
  Permission rules replace the **deprecated** `commandAllowlist`, `commandDenylist`, and
  `commandBlocklist` settings. Existing lists remain respected for backward compatibility;
  you do not need to remove them to upgrade. Use `permissionRules` for new policies.
  Before migrating, review [how rules and legacy lists interact](#migrate-legacy-command-lists).
</Note>

Before migrating, confirm that permission rules are enabled for your organization and supported by your Droid version. Checking a rules file validates its contents; it does not enable rule enforcement. If the **Permission Rules** section is unavailable in Enterprise Controls, contact [support@factory.com](mailto:support@factory.com) before replacing existing managed lists.

## Choose a decision

| Decision | What happens when it wins |
| :------- | :----------------------- |
| `allow` | The command runs without the command-approval prompt. Other controls, including hooks and sandbox restrictions, still apply. |
| `ask` | Droid requires approval in normal permission-checked execution, even at High autonomy. This is not a hard prohibition: `--skip-permissions-unsafe` skips confirmations. |
| `block` | Droid rejects the command with no approval path, including when permission prompts are skipped. |

`--skip-permissions-unsafe` skips all permission prompts, but command blocks still apply.
This includes effective `block` rules and legacy `commandBlocklist` restrictions.

If no policy matches, normal session approvals, autonomy, and risk handling decide what happens next. The preview reports this as `no-match`; it is not a rule decision you can configure.

## Create a rule

Add `permissionRules` to your [settings file](/droid-cli/settings):

- Use `~/.factory/settings.json` for personal rules.
- Use `<project>/.factory/settings.json` for shared project rules.
- Use a nested `.factory/settings.json` for folder rules.
- Use `settings.local.json` alongside any of these files for local overrides.
- Use [Enterprise Controls](/enterprise/hierarchical-settings-and-org-control#manage-permission-rules) for organization policy.

Project and folder rules require workspace trust. The location of a rule determines its scope; an ID such as `project/git-push` is a naming convention, not a scope selector.

This example requires approval before commands starting with `git push`:

```json title="settings.json"
{
  "permissionRules": {
    "version": 1,
    "rules": [
      {
        "id": "project/git-push",
        "decision": "ask",
        "reason": "Review remote Git changes before pushing.",
        "match": { "prefix": ["git", "push"] },
        "tests": {
          "match": ["git push origin main"],
          "noMatch": ["git status", "git log --oneline"]
        }
      }
    ]
  }
}
```

The rule matches that command spelling, not every way to push. For example, `git -C /repo push` has a different argument order. Test the forms your team uses.

### Rule fields

The container requires `version: 1` and a `rules` array. Each rule has these fields:

| Field | Required | Meaning |
| :---- | :------- | :------ |
| `id` | Yes | A non-empty, stable identifier. IDs must be unique within one source. The `builtin/` prefix is reserved. |
| `decision` | Yes | `allow`, `ask`, or `block`. |
| `match.prefix` | Yes | A non-empty ordered array of exact tokens. A nested non-empty array supplies alternatives at one position. |
| `tests.match` | Yes | One or more full command strings this rule must match. |
| `tests.noMatch` | Yes | One or more full command strings this rule must not match. |
| `reason` | No | A non-empty explanation of the rule's purpose. |
| `enabled` | No | Defaults to `true`. A disabled rule does not decide commands but still suppresses lower-priority definitions with the same ID. |

Unknown rule fields are rejected. Both test arrays are required, including on disabled rules, although disabled rules do not run their examples.

## Match command arguments

Prefixes match exact, case-sensitive argument tokens in order. Additional arguments may follow. They are not regular expressions or shell glob patterns: `"*"` is a literal token, not a wildcard.

For `["git", "status"]`:

| Command | Matches the prefix? |
| :------ | :------------------ |
| `git status` | Yes |
| `git status --short` | Yes |
| `git "status"` | Yes |
| `git statusx` | No |
| `GIT status` | No |
| `git -C /repo status` | No |
| `/usr/bin/git status` | No |

To match alternatives at one position, use a nested array. This allow rule covers the listed Git subcommands:

```json
{
  "id": "project/git-inspect",
  "decision": "allow",
  "match": { "prefix": ["git", ["status", "diff", "log"]] },
  "tests": {
    "match": ["git status --short", "git log --oneline"],
    "noMatch": [
      "git push",
      "git -C /repo status",
      "/usr/bin/git status",
      "git status > status.txt"
    ]
  }
}
```

<Warning>
  An allow rule grants permission; it does not prove that a command is read-only.
  Trailing arguments are unrestricted, and some command options can write files or
  invoke other programs. Review the full scope of a prefix before allowing it.
</Warning>

### Shell syntax and chained commands

Native allow rules require a command that Droid can parse with sufficient confidence. Expansions, redirects, and unsupported shell forms can prevent an allow decision even when the visible prefix looks right. That does not automatically block the command; it can fall back to normal approval handling.

Ask and block rules can also match invocations extracted from supported shell wrappers and command substitutions. This does not guarantee detection of every equivalent spelling or every action performed inside a script.

For a chain or pipeline, allowing one command does not authorize an unrelated second command. Runtime policy can combine allow rules for different segments and has limited handling for neutral output filters. An individual allow rule's positive examples are stricter: that one rule must cover every executable segment in the example.

## Test and preview without executing

Every enabled rule must pass its embedded examples to become active. These tests check matching only; they never execute the example commands.

Validate the rules in your resolved settings:

```bash
droid rules check
```

Preview the effective command-policy decision:

```bash
droid rules check --command 'git push origin main'
droid rules check --command 'git push origin main' --json
```

The JSON report includes rule sources and competing matches. Use it to investigate an unexpected decision, a skipped rule, or a higher-priority definition.

<Note>
  Preview covers command policy only, not hooks, sandbox permissions, autonomy, or
  session approvals. An `allow` preview is not a guarantee that every execution check
  will pass. Without `--file`, preview follows the active policy engine, so a client
  still using legacy policy can validate rules without using them for its decision.
</Note>

### Check a standalone file

Use a standalone file to test a proposed rule set before adding it to settings:

```json title="rules.json"
{
  "version": 1,
  "rules": [
    {
      "id": "project/npm-publish",
      "decision": "block",
      "match": { "prefix": ["npm", "publish"] },
      "tests": {
        "match": ["npm publish", "npm publish --tag next"],
        "noMatch": ["npm pack"]
      }
    }
  ]
}
```

```bash
droid rules check --file rules.json --command 'npm publish' --json
```

`--file` accepts a `{version, rules}` object or a bare rule array. It rejects a full `settings.json` wrapper and does not load built-ins or other settings. After applying a file's rules, check resolved settings again in the actual repository.

The example blocks the exact `npm publish` prefix. It does not match `/usr/bin/npm publish` or `npm --registry https://registry.example.com publish`; do not treat it as a complete prohibition on package publication.

Exit code `0` means the check succeeded, even when the preview decision is `block`. Invalid rules or failed examples produce exit code `1`. In automation, inspect the decision rather than treating a successful check as permission to run.

## Understand scope and precedence

Rule resolution has two stages:

1. **Resolve IDs.** Higher-priority valid definitions claim repeated IDs in this order: Org, Runtime, Folder, Project, User. Within a folder's settings, `settings.local.json` precedes `settings.json`. A valid disabled definition still claims its ID.
2. **Evaluate the surviving policy.** Rules with different IDs accumulate. Matching `block` decisions take precedence over `ask`, which takes precedence over `allow`. If nothing matches, normal approval handling applies.

For example, an org allow and a project block with different IDs result in a block. If they use the same ID, the org definition shadows the project definition before matching.

An empty rules array does not erase inherited rules. Disabling a rule suppresses lower-priority definitions with the same ID; deleting it removes that suppression. Plugins and dynamic configuration are not authoring sources for native permission rules.

### Invalid rules and skipped sources

<Warning>
  Invalid rules do not become a block-all policy. A malformed rule or one whose
  examples fail is skipped. Valid siblings still participate, and a valid
  lower-priority definition with the same ID can become effective.
</Warning>

Duplicate IDs within one source, an unsupported container version, or an invalid container can cause that entire source to be skipped. Untrusted project and folder rules are excluded. Run `droid rules check` after hand-editing settings and review its diagnostics.

The managed-settings save path rejects invalid definitions and failing examples before saving. Runtime reads tolerate bad entries so one invalid rule does not discard unrelated valid rules.

## Migrate legacy command lists

The three legacy list settings are **deprecated, not removed**. They remain respected for backward compatibility. Use rules for new policies; immediate migration is not required.

| Legacy setting | Replacement decision |
| :------------- | :------------------- |
| `commandAllowlist` | `allow` |
| `commandDenylist` | `ask`, not `block` |
| `commandBlocklist` | `block` |

### How rules and legacy lists coexist

There is no automatic rewrite of your settings files. Recognized default entries are handled by built-in rules or runtime safeguards; custom legacy entries remain compatibility inputs.

For a command the engine can parse with sufficient confidence, a matching native rule can replace a custom legacy deny or block decision from the **same settings source**. Unmatched commands retain the legacy restriction. Adding an allow rule alongside a legacy block is therefore not necessarily additive.

Restrictions from other sources remain effective. A user rule does not remove an org legacy restriction. `settings.json` and `settings.local.json` are different sources, even within the same scope; a restriction present in another source still participates.

<Steps>
  <Step title="Inventory existing policy">
    Confirm rule availability for the clients you use. Identify custom list entries and
    their owning sources. Keep a rollback copy; do not delete default lists wholesale.
  </Step>
  <Step title="Write and test rules">
    Translate the intended permissions into narrow prefixes, stable IDs, and positive
    and negative examples. Include the argument order, paths, and shell forms your team
    uses. Validate a standalone rules file first.
  </Step>
  <Step title="Apply rules at the intended source">
    Add the tested rules to the owning settings source. Review same-source replacement
    before placing an allow next to an existing restriction.
  </Step>
  <Step title="Verify effective policy before removing entries">
    Run `droid rules check` in the trusted repository and relevant nested folders.
    Preview permitted and prohibited commands with `--json`. Remove only deliberately
    replaced legacy entries after confirming coverage and client availability.
  </Step>
</Steps>

## Keep command policy separate from isolation

Permission rules govern shell commands submitted through Execute. They do not set permissions for every tool, inspect arbitrary program behavior, or replace operating-system isolation.

Use [sandboxing](/autonomy-and-safety/sandbox), [managed hooks](/harness/hooks#org-managed-hooks), and least-privilege credentials for additional protection. A matching block cannot be approved, but a prefix rule alone is not a guarantee against every way to perform an operation.

<RelatedLinks>
  <RelatedLink href='/droid-cli/settings' title='Settings'>
    Choose where to store personal and project policy.
  </RelatedLink>
  <RelatedLink href='/autonomy-and-safety/auto-run' title='Autonomy Levels'>
    Set approval behavior for commands without a policy match.
  </RelatedLink>
  <RelatedLink href='/enterprise/hierarchical-settings-and-org-control' title='Enterprise Controls'>
    Manage organization rules and inherited policy.
  </RelatedLink>
  <RelatedLink href='/droid-cli/cli-reference#check-permission-rules' title='CLI reference'>
    Review rule-check options and exit codes.
  </RelatedLink>
</RelatedLinks>


---

<!-- ===== SOURCE: https://docs.factory.com/autonomy-and-safety/sandbox.md ===== -->

# [Saved page] https://docs.factory.com/autonomy-and-safety/sandbox.md

# Sandbox

OS-level sandboxing isolates Droid from your filesystem and network using kernel-enforced policies.

OS-level sandboxes let users set filesystem and network boundaries for Droid. All shell commands initiated by Droid run in a separate process that is limited to the filesystem and network boundaries configured by users and enforced at the OS kernel level.

## How OS-level isolation works

The sandbox enforces its filesystem and network boundaries with the same operating-system primitives the OS uses to confine untrusted software, so a blocked read, write, or connection is denied by the kernel rather than relying on Droid to police itself:

{/* sweep-allow: term-bullets */}

- **macOS**: Seatbelt (the built-in macOS sandbox) profiles restrict filesystem and process access.
- **Linux and WSL2**: [bubblewrap](https://github.com/containers/bubblewrap) with a seccomp filter provides the same confinement.
- **Network (all platforms)**: outbound traffic is routed through an HTTP/SOCKS filtering proxy that permits only the allowed domains (Factory's own domains and WorkOS authentication domains are always allowed).

Because the sandbox relies on these host primitives, it blocks rather than running without isolation when they are unavailable.

## Isolation modes

The `sandbox.mode` setting selects *what* is placed inside the OS boundary. Both modes enforce the same default policies and configuration; they differ only in scope.

| Aspect                            | `per-command` (default)                         | `whole-process`                      |
| --------------------------------- | ----------------------------------------------- | ------------------------------------ |
| **Runs inside the OS sandbox**    | Each shell command and its child processes      | The entire Droid process             |
| **MCP servers, hooks, subagents** | Wrapped or checked against your policy per call | Isolated inside the process boundary |
| **Main Droid process**            | Not isolated                                    | Isolated                             |
| **If isolation is unavailable**   | The affected command or hook is blocked         | Droid refuses to start               |

- **`per-command`** runs each Droid-initiated action through the sandbox individually. Shell commands (and their child processes) are confined at the OS level; other tools are mediated by policy checks before each call. The main Droid process itself is not isolated.
- **`whole-process`** launches the entire Droid process inside the OS sandbox, so the main process and everything it spawns (MCP transports, subagents) is isolated too. Its own network requests (not just those from the Execute tool) are filtered against `allowedDomains`, with interactive domain prompts in TUI mode. If the sandbox cannot be established at startup (unsupported platform or a failed isolation check), Droid refuses to start rather than running unsandboxed.

## Enable and configure the sandbox

Set `sandbox.enabled` to `true` in your settings to turn on the sandbox:

```jsonc
{
  "sandbox": {
    "enabled": true,
  },
}
```

Once enabled, the default policies below apply immediately. No other configuration is required to start. Settings resolve across the hierarchy (org > project > user), so you can enable the sandbox for yourself (user settings), a repository (project settings), or everyone (organization settings).

### Default access policies

| Resource        | Default policy                                                                                                            | Configurable via                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **File reads**  | Allow all. Only explicit `denyRead` entries are blocked.                                                                  | `sandbox.filesystem.denyRead`                                   |
| **File writes** | Deny all except **CWD** (current working directory). Additional paths can be allowed. `denyWrite` overrides `allowWrite`. | `sandbox.filesystem.allowWrite`, `sandbox.filesystem.denyWrite` |
| **Network**     | Deny all except Factory's own domains and WorkOS authentication domains (always allowed by default). Additional domains must be explicitly allowed.         | `sandbox.network.allowedDomains`                                |

### Full settings reference

```jsonc
{
  "sandbox": {
    "enabled": true,
    // Isolation scope: "per-command" (default) or "whole-process"
    "mode": "per-command",
    "filesystem": {
      // Additional writable paths beyond CWD (which is always writable)
      "allowWrite": ["/tmp/build-output", "~/.config"],
      // Deny writes to specific subpaths even if parent is in allowWrite
      "denyWrite": ["/tmp/build-output/cache/locks", "~/.config/secrets"],
      // Block reads to specific paths (everything else is readable)
      "denyRead": ["~/.aws/credentials", "~/.ssh/id_rsa"],
    },
    "network": {
      // Only these domains are reachable (Factory's own domains and WorkOS authentication domains always included)
      "allowedDomains": ["github.com", "*.npmjs.org"],
    },
  },
}
```

Settings merge across the hierarchy (org > project > user). `denyWrite`/`denyRead` use union merge: org denies cannot be removed downstream.

### Organization controls

- Org-level `denyWrite`/`denyRead` settings cannot be overridden by user **Allow always**.
- The violation prompt shows `(organization policy)` when the deny comes from org settings.
- Admins can set the sandbox isolation mode (`per-command` or `whole-process`) org-wide from [Enterprise Controls & Managed Settings](/enterprise/hierarchical-settings-and-org-control).

## Coverage and enforcement

With the sandbox enabled, a tool runs only if the sandbox can check everything it might do against your filesystem and network rules. Tools whose actions can't be checked are blocked.

| Surface | Enforcement |
| :------ | :---------- |
| File tools | `Read`, `Edit`, `Create`, `LS`, `Grep`, `Glob`, and `ApplyPatch` are checked before every operation, enforcing `denyRead` for reads and `allowWrite` plus `denyWrite` for writes. |
| Execute tool | Shell commands run inside the OS sandbox, with network traffic routed through a filtering proxy for domain-level control. |
| FetchUrl and WebSearch | Network access is checked against `sandbox.network.allowedDomains`. |
| MCP tools | Filesystem and network requests are checked; locally launched servers receive a minimal environment (ambient host environment variables are dropped, keeping only a safe operational allowlist plus keys set in `mcp.json`). |
| Subagents (Task tool) | Delegated subagents inherit the parent sandbox policy. |
| Hooks | Hook commands (`PreToolUse`, `PostToolUse`, and the rest) are wrapped by the sandbox and run with the same proxy and runtime environment as the Execute tool; if the sandbox cannot be established, the hook is blocked instead of running on the host. |

### When something is blocked

**Interactive permission prompts (TUI mode):**

- Sandbox violations interrupt the agent loop with a TUI prompt, even at Auto (High) autonomy.
- Options: **Allow once**, **Allow always** (persists to settings), **Deny**. For `denyRead`/`denyWrite` violations, "Remove from deny list" replaces "Allow always".
- Execute network violations show a real-time domain prompt with a 60s auto-deny timeout.

**Non-interactive mode (`droid exec`):**

- Sandbox violations are auto-denied without prompting: no hang, no user interaction required.
- The agent receives a denial message and reports it in the output.

**Allow-always persistence:**

- Choosing **Allow always** saves the exception to your user settings (for example, adding a domain to `allowedDomains` or a path to `allowWrite`) so it won't prompt again.
- Changes take effect immediately in the current session.

**TUI indicators:**

- `SANDBOX` status indicator in the footer when the sandbox is enabled.
- "Sandbox Violation" prompt with violation details (path, domain, reason).

## Security limitations

Sandboxing reduces the impact of a mistake or a prompt-injection attack, but it does not eliminate risk:

{/* sweep-allow: term-bullets */}

- **Allowed network egress can still leak data.** Every domain in `allowedDomains` is a channel through which data the agent can read might leave. Keep the allowlist as narrow as your workflow permits.
- **A writable path can still be modified.** The sandbox limits *where* writes land, not *what* is written within the allowed paths, including your own project code under the working directory.
- **Your settings files are protected.** Sandboxed tool processes cannot write to Droid's own configuration files (for example `settings.json`), so they cannot silently change sandbox policy.

Treat the sandbox as defense in depth alongside [Autonomy Level](/autonomy-and-safety/auto-run) approvals and human review, not as a hard boundary around untrusted code. To evaluate code you do not trust, run Droid inside a container or a dedicated virtual machine.

<RelatedLinks>
  <RelatedLink href='/droid-cli/settings' title='Settings'>
    Where `sandbox.*` lives.
  </RelatedLink>
  <RelatedLink href='/enterprise/hierarchical-settings-and-org-control' title='Enterprise Controls & Managed Settings'>
    How org policy merges with user settings.
  </RelatedLink>
  <RelatedLink href='/enterprise/security' title='Security'>
    Broader security model for the Droid CLI.
  </RelatedLink>
  <RelatedLink href='/autonomy-and-safety/auto-run' title='Autonomy Level'>
    Approval tiers that complement sandboxing as defense in depth.
  </RelatedLink>
</RelatedLinks>


---

<!-- ===== SOURCE: https://docs.factory.com/droid-cli/cli-reference.md ===== -->

# [Saved page] https://docs.factory.com/droid-cli/cli-reference.md

# Droid CLI Reference

Complete reference for the Droid CLI, including commands and flags

## Installation

**macOS/Linux:** `curl -fsSL https://app.factory.ai/cli | sh`

**Homebrew:** `brew install --cask droid`

**Windows:** `irm https://app.factory.ai/cli/windows | iex`

**npm:** `npm install -g droid`

The Droid CLI operates in two modes:

- **Interactive (`droid`)** - Chat-first REPL with slash commands
- **Non-interactive (`droid exec`)** - Single-shot execution for automation and scripting

### Installing a specific version

Pin a version when upgrades must be reviewed and applied intentionally, such as in CI runners,
provisioned development environments, or other reproducible systems.

#### npm

Specify an exact package version:

```bash
npm install -g droid@0.174.0
```

The binaries published through npm have auto-updates disabled at build time, so the installed
version remains pinned. To upgrade, install the new version explicitly with npm.

#### Built-in updater

After installing Droid through the standalone installer, select a version with:

```bash
droid update --version 0.174.0
```

This command can also roll back to an older version. Use `droid update --check` to check for an
available update without installing it.

<Note>
  Standalone installations enable automatic updates by default. After selecting a version, follow
  the [auto-update guidance](#auto-updates) to keep it pinned.
</Note>

#### Direct binary download

Release binaries and their SHA256 checksums use the following paths:

```text
https://downloads.factory.ai/factory-cli/releases/<version>/<platform>/<arch>/<binary>
https://downloads.factory.ai/factory-cli/releases/<version>/<platform>/<arch>/<binary>.sha256
```

- `<platform>`: `linux`, `darwin`, or `windows`
- `<arch>`: `x64`, `arm64`, or `x64-baseline`
- `<binary>`: `droid` on Linux and macOS, or `droid.exe` on Windows

For example, download and verify the Linux x64 binary:

```bash
VERSION=0.174.0
BASE_URL="https://downloads.factory.ai/factory-cli/releases/${VERSION}/linux/x64"

curl -fsSLO "${BASE_URL}/droid"
curl -fsSLO "${BASE_URL}/droid.sha256"
echo "$(awk '{print $1}' droid.sha256)  droid" | sha256sum --check
chmod +x droid
```

Move the verified binary to a directory on `PATH`. The download URL layout is an implementation
detail, so always pin a version and verify its checksum.

## Droid CLI commands

| Command                              | Description                                                            | Example                                        |
| :----------------------------------- | :--------------------------------------------------------------------- | :--------------------------------------------- |
| `droid`                              | Start interactive REPL                                                 | `droid`                                        |
| `droid "query"`                      | Start REPL with initial prompt                                         | `droid "explain this project"`                 |
| `droid --resume [sessionId]`         | Resume a session (defaults to last modified). Alias: `-r`              | `droid --resume`                               |
| `droid --fork <sessionId>`           | Fork and resume a session in a new copy                                | `droid --fork session-abc123`                  |
| `droid exec "query"`                 | Execute task without interactive mode                                  | `droid exec "summarize src/auth"`              |
| `droid exec -f prompt.md`            | Load prompt from file                                                  | `droid exec -f .factory/prompts/review.md`     |
| `cat file \| droid exec`             | Process piped content                                                  | `git diff \| droid exec "draft release notes"` |
| `droid exec -s <id> "query"`         | Resume existing session in exec mode                                   | `droid exec -s session-123 "continue"`         |
| `droid exec --list-tools`            | List available tools, then exit                                        | `droid exec --list-tools`                      |
| `droid search "query"`               | Search across local sessions (messages, documents, tool results). Alias: `droid find` | `droid search "auth bug"`                      |
| `droid rules check`                 | Validate permission rules and optionally preview command policy | `droid rules check --command 'git push origin main'` |
| `droid mcp add <name> <url>`         | Add an MCP server                                                      | `droid mcp add api https://api.example.com/mcp --type http`  |
| `droid mcp remove <name>`            | Remove an MCP server                                                   | `droid mcp remove linear`                      |
| `droid plugin install <plugin>`      | Install a plugin. Alias: `droid plugin i`                              | `droid plugin install droid-control@factory-plugins` |
| `droid plugin uninstall <plugin>`    | Uninstall a plugin. Alias: `droid plugin remove`                       | `droid plugin uninstall droid-control@factory-plugins` |
| `droid plugin update <plugin>`       | Update a plugin to the latest version                                  | `droid plugin update droid-control@factory-plugins` |
| `droid plugin list`                  | List installed plugins                                                 | `droid plugin list`                            |
| `droid plugin marketplace`           | Manage plugin marketplaces                                             | `droid plugin marketplace`                     |
| `droid computer register [name]`     | Register this computer for Remote Control      | `droid computer register laptop`               |
| `droid computer remove`              | Remove this computer's Remote Control registration                                | `droid computer remove`                        |
| `droid computer list`                | List available computers                                         | `droid computer list`                          |
| `droid computer ssh <name>`          | SSH into a registered computer                                    | `droid computer ssh laptop`                    |
| `droid computer port-forward <name> <mappings...>` | Forward local ports to a computer over the relay        | `droid computer port-forward laptop 8080:80`   |
| `droid daemon`                       | Run the Factory daemon server                                          | `droid daemon`                                 |
| `droid daemon --remote-control`       | Connect this computer through [Remote Control](/remote-control). Alias: `--remote-access` | `droid daemon --remote-control`                |
| `droid update`                       | Manually update the CLI to latest version                              | `droid update`                                 |

## Check permission rules

Use `droid rules check` to validate [permission rules](/autonomy-and-safety/permission-rules),
run their embedded matching examples, and preview a decision without executing a command.

```bash
droid rules check
droid rules check --command 'git push origin main'
droid rules check --file rules.json --command 'npm publish' --json
```

| Option | Behavior |
| :----- | :------- |
| `--file <path>` | Check a standalone `{version, rules}` object or bare rule array. Does not load built-ins or other settings. A full `settings.json` wrapper is not accepted. |
| `--command <shell-command>` | Preview the policy decision for a non-empty command. Quote it so your shell passes it as one argument. |
| `--json` | Print the report as one JSON object, including rule diagnostics and, when requested, decision and match details. |

Without `--file`, the checker validates resolved settings. A command preview follows the
active policy engine; validating rules does not enable enforcement on a client still
using legacy policy.

Exit code `0` means the check succeeded, even if the preview says `block`. Invalid rules
or failed examples produce exit code `1`. Preview covers command policy only, not
hooks, sandbox permissions, autonomy, or session approvals.

The `commandAllowlist`, `commandDenylist`, and `commandBlocklist` settings are deprecated
but remain respected for backward compatibility. Use `permissionRules` for new policy;
see [migration guidance](/autonomy-and-safety/permission-rules#migrate-legacy-command-lists).

## Droid CLI flags

Customize droid's behavior with command-line flags:

| Flag                              | Description                                                        | Example                                                      |
| :-------------------------------- | :----------------------------------------------------------------- | :----------------------------------------------------------- |
| `-f, --file <path>`               | Read prompt from a file                                            | `droid exec -f plan.md`                                      |
| `-m, --model <id>`                | Select a specific [model ID](/models)                              | `droid exec -m claude-opus-5-5`                              |
| `-s, --session-id <id>`           | Continue an existing session                                       | `droid exec -s session-abc123`                               |
| `--auto <level>`                  | Set [autonomy level](#autonomy-levels) (`low`, `medium`, `high`)   | `droid exec --auto medium "run tests"`                       |
| `--only-tools <ids>`              | Use only these tools: names such as `Read`, or `MCP:<server>[/<tool>]` (comma or space separated) | `droid exec --only-tools Read,Grep,Glob,LS`                  |
| `--add-tools <ids>`               | Add tools to the default set (same selectors as `--only-tools`)    | `droid exec --add-tools MCP:linear`                          |
| `--remove-tools <ids>`            | Remove tools from the allowed set (same selectors as `--only-tools`) | `droid exec --auto low --remove-tools Execute`               |
| `--disable-builtin-skills`        | Disable Factory-provided builtin skills in interactive or exec sessions while preserving other skill sources | `droid --disable-builtin-skills` |
| `--list-tools`                    | Print available tools and exit                                     | `droid exec --list-tools`                                    |
| `-o, --output-format <format>`    | Output format (`text`, `json`, `stream-json`, `stream-jsonrpc`)    | `droid exec -o json "document API"`                          |
| `--input-format <format>`         | Input format for multi-turn sessions. Use `stream-jsonrpc`; the older `stream-json` mode is deprecated. Must match `--output-format`. | `droid exec --input-format stream-jsonrpc -o stream-jsonrpc` |
| `-r, --resume [sessionId]`        | Resume a previous session. In interactive mode, `-r` is `--resume`; in `droid exec`, `-r` is `--reasoning-effort`. | `droid -r`                                                   |
| `-r, --reasoning-effort <level>`  | Override reasoning effort; valid levels are model-dependent (see [/models](/models)). In `droid exec`, `-r` maps to this flag. | `droid exec -r high "debug flaky test"`                      |
| `--spec-model <id>`               | Use a different [model ID](/models) for specification planning     | `droid exec --spec-model claude-opus-5-5`                    |
| `--spec-reasoning-effort <level>` | Override reasoning effort for spec mode                            | `droid exec --use-spec --spec-reasoning-effort high`         |
| `--use-spec`                      | Start in specification mode (plan before executing)                | `droid exec --use-spec "add user profiles"`                  |
| `--skip-permissions-unsafe`       | Skip all permission prompts; command blocks still apply (unsafe) | `droid exec --skip-permissions-unsafe`                       |
| `--cwd <path>`                    | Execute from a specific working directory (use an absolute path)   | `droid exec --cwd "$PWD/service" --auto medium "run tests"`      |
| `-w, --worktree [name]`           | Run the session in an isolated [git worktree](#git-worktrees)      | `droid --worktree fix-bug`                                   |
| `--tag <spec>`                    | Session tag (name or JSON, repeatable)                             | `droid exec --tag code-review`                               |
| `--log-group-id <id>`             | Log group ID for filtering logs                                    | `droid exec --log-group-id grp-123`                          |
| `--fork <id>`                     | Fork and resume an existing session into a new copy                | `droid exec --fork session-abc123`                           |
| `--mission`                       | Run `droid exec` in [Mission Mode](/missions/overview) (multi-agent orchestration). Requires `--auto high` or `--skip-permissions-unsafe`. | `droid exec --mission --auto high -f mission.md`             |
| `--worker-model <id>`             | Model used for mission worker agents                               | `droid exec --mission --worker-model claude-opus-5-5`      |
| `--worker-reasoning-effort <level>` | Reasoning effort for mission worker agents (model-dependent; see [/models](/models)) | `droid exec --mission --worker-reasoning-effort medium`      |
| `--validator-model <id>`          | Model used for mission validator agents                            | `droid exec --mission --validator-model gpt-6-sol`     |
| `--validator-reasoning-effort <level>` | Reasoning effort for mission validator agents                  | `droid exec --mission --validator-reasoning-effort high`     |
| `--append-system-prompt <text>`   | Append custom text to the end of the system prompt                 | `droid --append-system-prompt "Always run tests."`           |
| `--append-system-prompt-file <path>` | Append the contents of a file to the end of the system prompt   | `droid --append-system-prompt-file .factory/system.md`       |
| `--settings <path>`               | Apply a [settings](/droid-cli/settings) file merged on top of the normal settings hierarchy, for this process only | `droid exec --settings ./runtime-settings.json`              |
| `-v, --version`                   | Display CLI version                                                | `droid -v`                                                   |
| `-h, --help`                      | Show help information                                              | `droid --help`                                               |

<Tip>
  Use `--output-format json` for scripting and automation, so you can parse droid's responses
  programmatically.
</Tip>

<Note>
  `--output-format` controls how `droid exec` serializes results. To change how Droid writes
  responses in an interactive CLI session, use [output styles](/droid-cli/output-styles).
</Note>

## Autonomy levels

`droid exec` uses tiered autonomy to control what operations the agent can perform. Only raise access when the environment is safe.

| Level                       | Intended for             | Notable allowances                                            |
| :-------------------------- | :----------------------- | :------------------------------------------------------------ |
| _(default)_                 | Read-only reconnaissance | File reads, git diffs, environment inspection                 |
| `--auto low`                | Safe edits               | Create/edit files, run formatters, non-destructive commands   |
| `--auto medium`             | Local development        | Install dependencies, build/test, local git commits           |
| `--auto high`               | CI/CD & orchestration    | Git push, deploy scripts, long-running operations             |
| `--skip-permissions-unsafe` | Isolated sandboxes only  | Skips all permission prompts; command blocks still apply |

**Examples:**

```bash
# Default (read-only)
droid exec "Analyze the auth system and create a plan"

# Low autonomy - safe edits
droid exec --auto low "Add JSDoc comments to all functions"

# Medium autonomy - development work
droid exec --auto medium "Install deps, run tests, fix issues"

# High autonomy - deployment
droid exec --auto high "Run tests, commit, and push changes"
```

<Warning>
  `--skip-permissions-unsafe` skips all permission prompts, but command blocks still apply.
  Use **only** in isolated, disposable
  environments such as throwaway containers. See [Permission rules](/autonomy-and-safety/permission-rules).
</Warning>

## Model IDs

Use any [available model ID](/models) with `-m, --model` or `--spec-model`. For custom models, see [Custom Models (BYOK)](/model-independence/byok).

`droid exec --model` and `--spec-model` also accept provider [tier aliases](/software-factory/code-review-ci#advanced-model-overrides) such as `openai-latest-balanced`, which follow Factory's recommended model for that provider and tier as new models ship.

### Legacy models

When a newer version of a model is available to you, `/model` lists the older one in a collapsed **Legacy Models** section. Selecting a legacy model asks you to **Switch to latest** or **Keep using legacy**. Keeping it adds the model to `legacyModelOverrides` in your user `settings.json`, and Droid stops asking about it.

When Droid starts, it moves saved default models (including spec mode, subagent, mission, and compaction models) from a legacy model to its newer version, unless the model is in `legacyModelOverrides`. A model passed to `droid exec --model` runs as named.

## Interactive mode features

### Keyboard shortcuts

The interactive REPL supports a rich set of keyboard shortcuts for navigation, overlays, and input control:

| Shortcut | Action |
| :------- | :----- |
| <Kbd keys='Ctrl+C' /> | Cancel the current operation / interrupt the agent. Press twice quickly to exit |
| <Kbd keys='Ctrl+Z' /> | Suspend the process (Unix only). Resume with `fg` |
| <Kbd keys='Ctrl+O' /> | Toggle the detailed transcript view (full message details) |
| <Kbd keys='Ctrl+T' /> | Toggle the Mission Control overlay (orchestrator sessions only) |
| <Kbd keys='Ctrl+N' /> | Cycle through available models (when typing in chat input) |
| <Kbd keys='Ctrl+L' /> | Cycle through autonomy levels (when typing in chat input) |
| <Kbd keys='Ctrl+Y' /> | Toggle the `/btw` scroll view (side-question history) |
| <Kbd keys='Ctrl+J' /> | Toggle the changelog display (dismiss / restore) |
| <Kbd keys='Alt+E' /> | Toggle the approval details view (Option+E on macOS) |
| <Kbd keys='Ctrl+V' /> | Paste an image from the clipboard as an attachment |
| <Kbd>Tab</Kbd> | Cycle through the model's available reasoning-effort levels |
| <Kbd keys='Shift+Tab' /> | Toggle Normal Mode and Spec Mode |
| <Kbd>@</Kbd> | File path autocomplete: typing `@` triggers fuzzy file search |
| <Kbd>Up</Kbd> / <Kbd>Down</Kbd> | Navigate input history (cycle through previously submitted messages) |
| Double <Kbd>Escape</Kbd> | Second press clears the input draft; a third Escape opens the rewind menu |
| <Kbd>?</Kbd> | Open the scrollable keyboard shortcuts pane (when the input is empty); close it with <Kbd>Esc</Kbd> |
| <Kbd keys='Ctrl+/' /> | Open the keyboard shortcuts pane (works even when the input has content) |
| <Kbd keys='Ctrl+A' /> | Move the cursor to the start of the line |
| <Kbd keys='Ctrl+W' /> | Delete the word before the cursor |
| <Kbd keys='Ctrl+K' /> | Delete from the cursor to the end of the line |
| <Kbd keys='Ctrl+U' /> | Delete from the cursor to the start of the line |
| <Kbd keys='Ctrl+D' /> | Clear all attached images, or forward-delete the next character if none attached |
| <Kbd keys='Ctrl+F' /> | Open the fork tree for the highlighted session (in the `/sessions` list view) |
| <Kbd keys='Ctrl+R' /> | Rename the highlighted session (in the `/sessions` list view) |
| <Kbd keys='Ctrl+X' /> | Archive the highlighted session (in the `/sessions` list view); restores it on the Archived tab |
| <Kbd keys='Alt+Up' /> | Scroll the transcript up (navigate any turn) |
| <Kbd keys='Alt+Down' /> | Scroll the transcript down (navigate any turn) |
| <Kbd keys='Alt+PageUp' /> | Scroll the transcript up to the previous user turn |
| <Kbd keys='Alt+PageDown' /> | Scroll the transcript down to the next user turn |
| <Kbd>Escape</Kbd> | Close the active pane, overlay, or menu |
| <Kbd keys='Shift+Enter' /> | Insert a newline in the chat input (multiline editing) |
| <Kbd>!</Kbd> | Toggle [bash mode](#bash-mode) (when the input is empty) |

<Tip>
  Run `/terminal-setup` once to configure your terminal so <Kbd keys='Shift+Enter' /> reliably produces a newline
  in the chat input.
</Tip>

### Bash mode

Press <Kbd>!</Kbd> when the input is empty to toggle bash mode. In bash mode, commands execute directly in your shell without AI interpretation, useful for quick operations like checking `git status` or running `npm test`.

{/* sweep-allow: term-bullets */}

- **Toggle on:** Press <Kbd>!</Kbd> (when input is empty)
- **Execute commands:** Type any shell command and press <Kbd>Enter</Kbd>
- **Toggle off:** Press <Kbd>Esc</Kbd> to return to normal AI chat mode

The prompt changes from `>` to `$` when bash mode is active.

### Mermaid diagram rendering

Droid automatically renders Mermaid diagram code blocks as ASCII art directly in the terminal, with no external viewer or browser required. When a response contains a fenced ```` ```mermaid ```` block of a supported diagram type, the diagram is drawn inline in the transcript.

**Supported diagram types:**

- `flowchart` (and `graph`)
- `sequenceDiagram`
- `stateDiagram`
- `classDiagram`
- `erDiagram`

Unsupported diagram types (for example `gantt`, `pie`, `mindmap`, `timeline`, `journey`, `gitGraph`) fall back to displaying the raw Mermaid source and a link to view the diagram externally.

### Markdown and math rendering

Droid renders supported inline Markdown styles in responses, including formatting inside
table cells. It also converts inline and display TeX into Unicode math for terminal output.

Use `\(...\)` or `$...$` for inline math. Use `\[...\]` or `$$...$$` for display math.
A completed code fence labeled `latex`, `math`, or `tex` also renders as display math:

````text
```latex
\frac{a}{b}
```
````

### Slash commands

Available when running `droid` in interactive mode. Type the command at the prompt:

| Command                       | Description                                                    |
| :---------------------------- | :------------------------------------------------------------- |
| `/account`                    | Open Factory account settings in browser                       |
| `/archive`                    | Archive the current session (restore it from the `/sessions` Archived tab) |
| `/billing`                    | View and manage billing settings                               |
| `/btw <question>`             | Ask a side question without polluting the main transcript     |
| `/bug [title]`                | Create a bug report with session data and logs                 |
| `/clear`                      | Clear conversation context, keep current model & autonomy      |
| `/commands`                   | Manage custom slash commands                                   |
| `/compress [prompt]`          | Compress session and move to new one with summary              |
| `/context`                    | Show context window usage breakdown with progress bar          |
| `/copy`                       | Copy prompts, responses, turn ranges, or session ID            |
| `/cost`                       | Show usage statistics                                          |
| `/create-skill`               | Create a reusable skill from current session                   |
| `/cd <path>`                  | Change session working directory (alias for `/cwd`)             |
| `/cwd <path>`                 | Change session working directory                               |
| `/diagnostics`                | Show settings configuration errors                             |
| `/droids`                     | Manage custom droids                                           |
| `/missions`                   | Enter Mission Mode                                             |
| `/fast`                       | Enable fast mode for current model (`/fast off` to disable)    |
| `/favorite`                   | Mark current session as a favorite                             |
| `/fork`                       | Copy current session into a new session; you stay in the original and get a `droid --resume <id>` command for the fork |
| `/help`                       | Show available slash commands                                  |
| `/hooks`                      | Manage lifecycle hooks                                         |
| `/ide`                        | Configure IDE integrations                                     |
| `/install-code-review`        | Set up automated code review                                   |
| `/install-slack-app`          | Install/connect Slack integration                              |
| `/language <locale>`          | Switch TUI display language                                    |
| `/limits`                     | Manage token usage limits and overage preferences              |
| `/login`                      | Sign in to Factory                                             |
| `/logout`                     | Sign out of Factory                                            |
| `/mcp`                        | Manage Model Context Protocol servers                          |
| `/model`                      | Switch AI model mid-session                                    |
| `/new`                        | Start a fresh session, reset model & autonomy to defaults      |
| `/plugins`                    | Manage plugins and marketplaces                                |
| `/quit`                       | Exit droid (alias: `exit`, or press <Kbd keys='Ctrl+C' />)     |
| `/readiness-fix`              | Fix failing agent readiness signals from latest report         |
| `/readiness-report`           | Generate readiness report                                      |
| `/rename`                     | Rename current session                                         |
| `/review`                     | Start AI-powered code review workflow                          |
| `/rewind-conversation`        | Undo recent changes in the session                             |
| `/sessions`                   | List and select previous sessions                              |
| `/settings`                   | Configure application settings                                 |
| `/setup-incident-response`    | Set up Slack auto-run for incident-response channel            |
| `/share`                      | Share session with organization                                |
| `/skills`                     | Manage and invoke skills                                       |
| `/stats [period]`             | Show usage statistics (supports relative periods, date ranges) |
| `/status`                     | Show current droid status and configuration                    |
| `/statusline`                 | Configure custom status line                                   |
| `/terminal-setup`             | Configure terminal keybindings for <Kbd keys='Shift+Enter' />  |
| `/themes`                     | Choose a color theme                                           |
| `/tree`                       | Browse and resume branches in the current session's fork tree  |

Slash commands stay usable while the agent is running: read-only and settings commands open right away over the live stream, commands that modify the conversation or session (such as `/new`, `/clear`, `/compress`) ask for confirmation before stopping the current run, and `/model`, `/fast`, and `/archive` apply only between turns. `/fork` also runs immediately: it copies the session in the background and keeps you in the original session, so there is nothing to interrupt.

Archiving hides a session from your session lists without deleting any data. Restore an archived session anytime from the Archived tab in `/sessions` (where <Kbd keys='Ctrl+X' /> restores instead of archiving), or send a new message in the archived session to restore it automatically.

For detailed information on slash commands, see the [interactive mode documentation](/droid-cli/quickstart#useful-slash-commands).

### Git worktrees

Use `-w, --worktree [name]` to run a session inside a native [git worktree](https://git-scm.com/docs/git-worktree) so you can work on multiple branches of the same repository in parallel without file conflicts. This flag is available on both `droid` (interactive) and `droid exec`.

By default, Droid creates worktrees under the [`worktreeDirectory` setting](/droid-cli/settings#infrastructure), which defaults to `~/.factory/worktrees`. Each worktree uses the path `<root>/<8-character group>/<repository name>/` and has its own checkout and dedicated branch.

**Branch naming:**

- **`--worktree`** (no value): Creates/reuses a worktree on a branch named `<current-branch>-wt`.
- **`--worktree <name>`**: Uses `<name>` as the branch. If the branch already exists, it is checked out in the worktree; otherwise it is created from `HEAD`.
- If the target branch is already checked out in another worktree, the command fails with a clear error.

**Examples:**

```bash
# Interactive: derive branch from current branch (creates <current>-wt)
droid --worktree

# Interactive: explicit branch name
droid -w fix-auth-bug "start debugging the login flow"

# Headless: isolate an automated task on its own branch
droid exec --worktree refactor-tests --auto medium "migrate jest suites to vitest"

# Run two parallel sessions on the same repo, each on its own branch
droid --worktree feature-a &
droid --worktree feature-b &
```

**Session lifecycle:**

- **Interactive mode**: The worktree persists after the session ends so you can resume work, inspect changes, or push the branch.
- **`droid exec` mode**: On exit, a clean worktree (no uncommitted changes) is removed automatically; a dirty worktree is preserved and its path is printed so you can review the work.
- The underlying git branch is **never deleted** by Droid; only the worktree directory is removed during cleanup.

<Note>
  When `--worktree` is active, Droid operates entirely inside the worktree directory. Run follow-up
  commands (tests, builds, installs) from that directory rather than the original repo root. Fresh
  worktrees may not have dependencies installed yet (for example `node_modules`); set them up if
  builds or tests fail with missing-module errors.
</Note>

### Subcommand flags

In addition to the global flags above, several `droid` subcommands accept their own flags.

#### `droid update` flags

| Flag                      | Description                                        | Example                      |
| :------------------------ | :------------------------------------------------- | :--------------------------- |
| `-c, --check`             | Check for updates without installing               | `droid update --check`       |
| `-v, --version <version>` | Update to or roll back to a specific version       | `droid update -v 0.174.0`    |

#### `droid search` flags

| Flag                  | Description                                                              | Example                                  |
| :-------------------- | :----------------------------------------------------------------------- | :--------------------------------------- |
| `--kind <kind>`       | Filter by entry kind: `message_text`, `document`, `tool_use`, `tool_result`, or `all` | `droid search "auth" --kind document`    |
| `--limit-sessions <n>` | Maximum number of sessions to return                                    | `droid search "auth" --limit-sessions 5` |
| `--limit-hits <n>`    | Maximum number of matches per kind per session                           | `droid search "auth" --limit-hits 3`     |
| `--context-chars <n>` | Number of characters of context shown around each match                  | `droid search "auth" --context-chars 200`|
| `--json`              | Emit results as JSON                                                     | `droid search "auth" --json`             |
| `--reindex`           | Drop the search cache and rebuild the local index                        | `droid search "auth" --reindex`          |

#### `droid mcp add` flags

| Flag                       | Description                                                              | Example                                                          |
| :------------------------- | :----------------------------------------------------------------------- | :--------------------------------------------------------------- |
| `--type <type>`            | Server transport: `http` (streamable HTTP), `sse` (legacy HTTP+SSE), or `stdio` (local) | `droid mcp add api https://api.example.com/mcp --type http`      |
| `--env <KEY=VALUE>`        | Set an environment variable for a stdio server (repeatable)              | `droid mcp add gh "gh-mcp" --type stdio --env GH_TOKEN=$GH_TOKEN`|
| `--header <KEY: VALUE>`    | Add an HTTP header for a remote server (repeatable)                      | `droid mcp add api https://api.example.com/mcp --type http --header "Authorization: Bearer $TOKEN"` |

#### `droid plugin` flags

| Flag                  | Description                                                              | Example                                                  |
| :-------------------- | :----------------------------------------------------------------------- | :------------------------------------------------------- |
| `-s, --scope <scope>` | Installation scope: `user` (default) or `project`                        | `droid plugin install droid-control@factory-plugins --scope project` |

#### `droid computer register` flags

| Flag         | Description                                              | Example                              |
| :----------- | :------------------------------------------------------- | :----------------------------------- |
| `-y, --yes`  | Skip interactive prompts and accept registration defaults | `droid computer register laptop -y`  |

### MCP command reference

The `/mcp` slash command opens an interactive manager UI for browsing and managing MCP servers.

**Quick start:** Type `/mcp` and select **"Add from Registry"** to browse 40+ pre-configured servers (Linear, Sentry, Notion, Stripe, Vercel, and more). Select a server, authenticate if required, and you're ready to go.

**CLI commands** for scripting and automation:

```bash
droid mcp add <name> <url> --type http    # Add HTTP (streamable) server
droid mcp add <name> <url> --type sse     # Add legacy HTTP+SSE server
droid mcp add <name> "<command>"          # Add stdio server
droid mcp remove <name>                   # Remove a server
```

See [MCP Configuration](/harness/mcp) for the full registry list, CLI options (`--env`, `--header`), configuration files, and how user vs project config layering works.

## Authentication

1. Generate an API key in the <a href="https://app.factory.ai/settings/api-keys">Factory API keys settings</a>
2. Set the environment variable:

<CodeGroup>

```bash macOS/Linux
export FACTORY_API_KEY=fk-...
```

```powershell Windows (PowerShell)
$env:FACTORY_API_KEY="fk-..."
```

```cmd Windows (CMD)
set FACTORY_API_KEY=fk-...
```

</CodeGroup>

**Persist the variable** in your shell profile (`~/.bashrc`, `~/.zshrc`, or PowerShell `$PROFILE`) for long-term use.

<Warning>
  Never commit API keys to source control. Use environment variables or secure secret management.
</Warning>

## Auto-updates

Standalone Droid installations check for and install CLI updates automatically. Run `droid update`
to trigger an update on demand.

To keep a standalone installation pinned, disable its in-process updater:

```bash
export FACTORY_DROID_AUTO_UPDATE_ENABLED=false
```

With this variable set, automatic updates are disabled and `droid update` does not install another
version. Set it in the environment that launches every Droid process, including `droid daemon`.

The npm distribution has auto-updates disabled at build time and does not require this variable.
Running `droid update` from an npm installation reports that auto-update is unavailable. Setting
`FACTORY_DROID_AUTO_UPDATE_ENABLED=true` explicitly overrides the npm build default.

Enterprise administrators can disable CLI auto-updates for all organization members with the
`disableAutoUpdate` organization setting. See the [release notes](/changelog/release-notes) and
[organization controls](/enterprise/hierarchical-settings-and-org-control).

<Tip>
  Pin the CLI and disable auto-updates in reproducible environments. For local developer
  installations, leave auto-updates enabled to receive fixes and security updates.
</Tip>

## Exit codes

| Code | Meaning                       |
| :--- | :---------------------------- |
| `0`  | Success                       |
| `1`  | General runtime error         |
| `2`  | Invalid CLI arguments/options |

## Common workflows

### Code review

Interactive review inside a Droid session:

```text
> /review
```

Non-interactive review through `droid exec`:

```bash
# Analysis only
droid exec "Review this PR for security issues"

# With modifications
droid exec --auto low "Review code and add missing type hints"
```

See the [Local Code Review documentation](/software-factory/code-review) for detailed guidance on review types, workflows, and best practices.

### Testing and debugging

```bash
# Investigation
droid exec "Analyze failing tests and explain root cause"

# Fix and verify
droid exec --auto medium "Fix failing tests and run test suite"
```

### Refactoring

```bash
# Planning
droid exec "Create refactoring plan for auth module"

# Execution
droid exec --auto low --use-spec "Refactor auth module"
```

### Parallel sessions on one repo

```bash
# Work on two branches of the same repo at the same time, each in its own worktree
droid --worktree feature-a &
droid --worktree feature-b &

# Fan out headless tasks across branches without clobbering each other's files
droid exec -w migration-step-1 --auto medium "apply codemod A" &
droid exec -w migration-step-2 --auto medium "apply codemod B" &
wait
```

See [Git worktrees](#git-worktrees) for details.

### CI/CD integration

```yaml
# GitHub Actions example
- name: Run Droid Analysis
  env:
    FACTORY_API_KEY: ${{ secrets.FACTORY_API_KEY }}
  run: |
    droid exec --auto medium -f .github/prompts/deploy.md
```

<RelatedLinks>
  <RelatedLink href='/models' title='Available Models'>
    Model IDs and reasoning options.
  </RelatedLink>
  <RelatedLink href='/harness/custom-slash-commands' title='Custom commands'>
    Create your own shortcuts.
  </RelatedLink>
  <RelatedLink href='/harness/subagents' title='Custom droids'>
    Build specialized agents.
  </RelatedLink>
  <RelatedLink href='/harness/mcp' title='MCP configuration'>
    External tool integration.
  </RelatedLink>
</RelatedLinks>


---

<!-- ===== SOURCE: https://docs.factory.com/droid-cli/quickstart.md ===== -->

# [Saved page] https://docs.factory.com/droid-cli/quickstart.md

# Droid CLI Quickstart

Install the Droid CLI, start an interactive terminal session, and delegate your first reviewable coding task.

Use this quickstart to install the Droid CLI, start an interactive terminal session, and delegate a first scoped task. You will see how Droid reads your codebase, proposes changes, and waits for review before editing.

## Before you begin

Make sure you have:

<Checklist>
  <ChecklistItem status="pass">A terminal open in a code project</ChecklistItem>
  <ChecklistItem status="neutral">
    A Git repository (recommended for the full workflow demonstration)
  </ChecklistItem>
</Checklist>

## Step 1: Install and start Droid

**macOS/Linux:** `curl -fsSL https://app.factory.ai/cli | sh`

**Homebrew:** `brew install --cask droid`

**Windows:** `irm https://app.factory.ai/cli/windows | iex`

**npm:** `npm install -g droid`

<Note>
  **Linux users:** Ensure `xdg-utils` is installed for proper functionality. Install with: `sudo apt-get install xdg-utils`
</Note>

Then navigate to your project and start the Droid CLI.

<Terminal title="bash" command={`cd /path/to/your/project
droid`} />

<DocsSurfacePreview surface="cli" caption="Droid CLI starts in your terminal with modes, autonomy, MCP status, and prompt composer visible." />

You'll see Droid's welcome screen in a full-screen terminal interface. If prompted, sign in via your browser to connect to Factory's development agent.

## Step 2: understand your codebase

Start by asking Droid to map the project before it edits anything:

```text
> analyze this codebase and explain the overall architecture
```

```text
> where are the main entry points, test commands, and code conventions?
```

Droid reads the files it needs, summarizes the architecture, and identifies the checks it should run before making changes.

## Step 3: run your first reviewable change

Ask for one small, verifiable change:

```text
> add structured logging to the app entry point and replace the existing console calls
```

Droid will:

1. Inspect the current implementation.
2. Propose a plan when the task needs one.
3. Show the exact diff.
4. Wait for approval before editing.
5. Run the relevant validators when you ask it to finish the task.

Review the diff and run the relevant tests before accepting the change. This propose-and-approve loop is how you keep control as you delegate more work.

## Step 4: pick a goal to go deeper

<CardGroup cols={2}>
  <Card title="Implement larger features" icon="diagram-project" href="/autonomy-and-safety/specification-mode">
    Use Specification Mode so Droid writes a plan before it starts a multi-step implementation.
  </Card>
  <Card title="Review and harden changes" icon="shield-check" href="/software-factory/code-review">
    Review pull requests and local diffs for correctness, security, and edge cases.
  </Card>
  <Card title="Automate headless work" icon="terminal" href="/droid-exec/overview">
    Move repeatable workflows into Droid Exec for scripts, CI, scheduled jobs, and pull request checks.
  </Card>
  <Card title="Coordinate multi-step work" icon="sitemap" href="/missions/overview">
    Use Factory Missions when a task needs planning, delegation, validation, and checkpoints.
  </Card>
</CardGroup>

## Step 5: handle version control

Droid makes Git operations conversational and intelligent:

```text
> review my uncommitted changes and suggest improvements before I commit
```

```text
> create a well-structured commit with a descriptive message following our team conventions
```

## Essential controls

Here are the key interactions you'll use daily:

| Action            | What it does                                          | How to use                                   |
| ----------------- | ----------------------------------------------------- | -------------------------------------------- |
| Send message      | Submit a task or question                             | Type and press <Kbd>Enter</Kbd>                     |
| Multi-line input  | Write longer prompts                                  | <Kbd keys='Shift+Enter' /> for new lines               |
| Approve changes   | Accept proposed modifications                         | Accept change in the TUI                     |
| Reject changes    | Decline proposed modifications                        | Reject change in the TUI                     |
| Switch modes      | Toggle between modes                                  | <Kbd keys='Shift+Tab' />                               |
| Bash mode         | Run shell commands directly without AI interpretation | Press <Kbd>!</Kbd> on an empty input; <Kbd>Esc</Kbd> to return |
| Transcript view   | Toggle detailed transcript with full message details  | <Kbd keys='Ctrl+O' />                                   |
| Mission Control   | Toggle Mission Control overlay (orchestrator sessions)| <Kbd keys='Ctrl+T' />                                   |
| Close overlay     | Dismiss the active overlay or menu                    | <Kbd>Escape</Kbd>                                   |
| Scroll transcript | Navigate through previous turns                       | <Kbd keys='Alt+Up' /> / <Kbd keys='Alt+Down' />                    |
| View shortcuts    | Open the keyboard shortcuts pane (<Kbd>Esc</Kbd> to close) | Press <Kbd>?</Kbd>                                  |
| Exit session      | Leave droid                                           | <Kbd keys='Ctrl+C' /> or type `exit`                   |

### Useful slash commands

Quick shortcuts to common actions:

| Command | What it does |
| :------ | :----------- |
| `/review` | Start the code review workflow ([learn more](/software-factory/code-review)). |
| `/settings` | Configure Droid behavior, models, output style, and preferences. |
| `/model` | Switch between AI models mid-session. |
| `/sessions` | List and resume previous sessions. |
| `/fork` | Copy the current session into a new session. You stay in the original; the receipt prints a `droid --resume <id>` command to open the fork elsewhere. |
| `/compress` | Compress the current session to free up context. |
| `/missions` | Open the Missions menu to launch multi-agent projects. |
| `/droids` | Manage custom Droids (specialized subagents). |
| `/skills` | Manage prompt-based skills (reusable procedures). |
| `/hooks` | Manage tool execution hooks for lifecycle automation. |
| `/plugins` | Manage plugins and marketplaces. |
| `/mcp` | Manage Model Context Protocol servers. |
| `/account` | Open your Factory account settings in the browser. |
| `/billing` | View and manage your billing settings. |
| `/help` | See all available commands. |

[Learn how to create custom slash commands →](/harness/custom-slash-commands)

<RelatedLinks>
  <RelatedLink href='/software-factory/wiki/overview' title='AutoWiki'>
    Turns a repository into browsable architecture and setup documentation.
  </RelatedLink>
  <RelatedLink href='/software-factory/code-review' title='Local Code Review'>
    Starts `/review` for uncommitted changes, commits, and branch diffs.
  </RelatedLink>
  <RelatedLink href='/agent-readiness/overview' title='Agent Readiness'>
    Scores whether a repository is ready for larger autonomous work.
  </RelatedLink>
  <RelatedLink href='/harness/agents-md' title='AGENTS.md'>
    Teaches Droid repository-specific conventions before it edits code.
  </RelatedLink>
</RelatedLinks>
