# LiveKit — CLI, credentials, and Agents (Python) — saved documentation (StreetShift)

Fetched: 2026-10-24

Sources (all fetched as markdown via `https://docs.livekit.io/<path>.md`, verbatim below in Part B):
- https://docs.livekit.io/llms.txt (index)
- https://docs.livekit.io/reference/developer-tools/livekit-cli (CLI install incl. Windows)
- https://docs.livekit.io/intro/basics/cli
- https://docs.livekit.io/reference/developer-tools/livekit-cli/projects (`lk cloud auth`, `lk project`, `lk app create`, `lk app env`)
- https://docs.livekit.io/reference/developer-tools/livekit-cli/docs (`lk docs`)
- https://docs.livekit.io/agents/start/voice-ai (Voice AI quickstart, Python)
- https://docs.livekit.io/agents/logic/sessions (AgentSession)
- https://docs.livekit.io/agents/logic/tools/definition (function tools)
- https://docs.livekit.io/agents/logic/external-data (RAG / external data)
- https://docs.livekit.io/agents/server/agent-dispatch, https://docs.livekit.io/agents/server/job
- https://docs.livekit.io/agents/models, /models/llm, /models/llm/anthropic, /models/stt, /models/tts
- https://docs.livekit.io/agents/logic/turns/turn-detector
- https://docs.livekit.io/frontends/authentication/tokens
- GitHub releases: https://github.com/livekit/livekit-cli/releases (latest at fetch time: v2.19.2)
- PyPI versions checked 2026-10-24.

## Part A — StreetShift notes (Windows, no admin) — compiled from the sources

### Installing `lk` on Windows without admin

Official docs command (Part B, livekit-cli page):

```powershell
winget install LiveKit.LiveKitCLI
```

Per-user variant (no admin; `--scope user` is a standard winget flag — whether this package's installer honors user scope was NOT verified; if winget prompts for elevation, use the zip below):

```powershell
winget install --id LiveKit.LiveKitCLI --scope user
```

Release-zip fallback (no admin, verified asset names exist on the v2.19.2 release page):
- x64: https://github.com/livekit/livekit-cli/releases/download/v2.19.2/lk_2.19.2_windows_amd64.zip
- ARM64: https://github.com/livekit/livekit-cli/releases/download/v2.19.2/lk_2.19.2_windows_arm64.zip
- checksums: https://github.com/livekit/livekit-cli/releases/download/v2.19.2/checksums.txt

```powershell
$dest = "$env:LOCALAPPDATA\Programs\livekit-cli"
New-Item -ItemType Directory -Force $dest | Out-Null
Invoke-WebRequest https://github.com/livekit/livekit-cli/releases/download/v2.19.2/lk_2.19.2_windows_amd64.zip -OutFile "$env:TEMP\lk.zip"
Expand-Archive "$env:TEMP\lk.zip" -DestinationPath $dest -Force
# add to the *user* PATH (no admin needed)
$p = [Environment]::GetEnvironmentVariable("Path","User")
if ($p -notlike "*$dest*") { [Environment]::SetEnvironmentVariable("Path", "$p;$dest", "User") }
# open a new terminal, then:
lk --version
```

### Credentials flow (never hand-type keys)

```powershell
lk cloud auth                 # opens browser, links a LiveKit Cloud project
lk project list               # verify
lk app env -w <DIR>           # reads <DIR>/.env.example, writes <DIR>/.env.local with LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET
lk app env                    # print values to stdout (do not print in shared logs)
lk app create --template agent-starter-python --install --yes agent-py
lk app create --template agent-starter-react  --install --yes frontend
```

Env vars: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`.

### Package versions (PyPI, 2026-10-24)

| Package | Latest |
|---|---|
| livekit-agents | 1.8.9 |
| livekit-plugins-anthropic | 1.8.9 |
| livekit-plugins-silero | 1.8.9 |
| livekit-plugins-turn-detector | 1.8.9 |
| livekit-plugins-deepgram | 1.8.9 |
| livekit-plugins-cartesia | 1.8.9 |
| livekit-api | 1.2.2 |

Note: the moss-hacker-starter pins `livekit-agents[silero,turn-detector]==1.5.16` (see docs/livekit-moss-starter.md). Anthropic plugin install (from the Anthropic page): `uv add "livekit-agents[anthropic]~=1.8"` (see the Anthropic page in Part B for exact usage, e.g. `anthropic.LLM(model=...)`; the plugin reads `ANTHROPIC_API_KEY`). For StreetShift, pass the model from `ANTHROPIC_MODEL_FAST` env instead of hardcoding.

---

# Part B — LiveKit docs pages (verbatim markdown)

<!-- ================================================================ -->
## Page: https://docs.livekit.io/reference/developer-tools/livekit-cli.md

LiveKit docs › Reference › Developer tools › LiveKit CLI › Overview

---

# LiveKit CLI

> Install the LiveKit CLI, set up your coding agent, and find the reference for every command.

## Overview

The LiveKit CLI (`lk`) is the essential developer tool for building, testing, and deploying LiveKit agents. For an introduction to its workflows, see [LiveKit CLI](https://docs.livekit.io/intro/basics/cli.md).

- **[GitHub repository](https://github.com/livekit/livekit-cli)**: Source code and releases for the LiveKit CLI.

## Command reference

| Page | Commands |
| [Project management](https://docs.livekit.io/reference/developer-tools/livekit-cli/projects.md) | `lk cloud`, `lk project`, `lk app` |
| [Skills installation](https://docs.livekit.io/reference/developer-tools/livekit-cli/skills.md) | `lk skills` |
| [Agent development](https://docs.livekit.io/reference/developer-tools/livekit-cli/agent.md) | `lk agent init`, `dev`, `start`, `console` |
| [Agent testing](https://docs.livekit.io/reference/developer-tools/livekit-cli/agent/testing.md) | `lk agent debugger`, `simulate` |
| [Deploy agents](https://docs.livekit.io/reference/developer-tools/livekit-cli/agent/deployment.md) | `lk agent create`, `deploy`, `promote`, `rollback`, `versions`, `delete`, `config`, `dockerfile` |
| [Manage deployed agents](https://docs.livekit.io/reference/developer-tools/livekit-cli/agent/deployment/manage.md) | `lk agent status`, `list`, `logs`, `restart`, `update`, `secrets`, `update-secrets` |
| [Private links](https://docs.livekit.io/reference/developer-tools/livekit-cli/agent/deployment/private-links.md) | `lk agent private-link` |
| [Rooms and participants](https://docs.livekit.io/reference/developer-tools/livekit-cli/rooms.md) | `lk room`, `lk token`, `lk dispatch` |
| [Egress and ingress](https://docs.livekit.io/reference/developer-tools/livekit-cli/egress-ingress.md) | `lk egress`, `lk ingress` |
| [Telephony](https://docs.livekit.io/reference/developer-tools/livekit-cli/telephony.md) | `lk sip`, `lk number` |
| [Load testing](https://docs.livekit.io/reference/developer-tools/livekit-cli/perf.md) | `lk perf` |
| [Docs search](https://docs.livekit.io/reference/developer-tools/livekit-cli/docs.md) | `lk docs` |

Run `lk <command> --help` for any command's options.

## Setup

### Install the CLI

**macOS**:

Install the LiveKit CLI with [Homebrew](https://brew.sh/):

```text
brew install livekit-cli

```

---

**Linux**:

```text
curl -sSL https://get.livekit.io/cli | bash

```

> 💡 **Tip**
> 
> You can also download the latest precompiled binaries [here](https://github.com/livekit/livekit-cli/releases/latest).

---

**Windows**:

```text
winget install LiveKit.LiveKitCLI

```

> 💡 **Tip**
> 
> You can also download the latest precompiled binaries [here](https://github.com/livekit/livekit-cli/releases/latest).

---

**From Source**:

This repo uses [Git LFS](https://git-lfs.github.com/) for embedded video resources. Please ensure git-lfs is installed on your machine before proceeding.

```text
git clone github.com/livekit/livekit-cli
make install

```

### Update the CLI

Update the CLI regularly to get new features and fixes:

**macOS**:

Update the LiveKit CLI with [Homebrew](https://brew.sh/):

```text
brew update && brew upgrade livekit-cli

```

---

**Linux**:

```text
curl -sSL https://get.livekit.io/cli | bash

```

> 💡 **Tip**
> 
> You can also download the latest precompiled binaries [here](https://github.com/livekit/livekit-cli/releases/latest).

---

**Windows**:

```text
winget upgrade LiveKit.LiveKitCLI

```

> 💡 **Tip**
> 
> You can also download the latest precompiled binaries [here](https://github.com/livekit/livekit-cli/releases/latest).

---

**From Source**:

This repo uses [Git LFS](https://git-lfs.github.com/) for embedded video resources. Please ensure git-lfs is installed on your machine before proceeding.

Before updating, make sure you've recently pulled the latest changes from `main`.

```text
make install

```

### Add a project

Link a LiveKit Cloud project, then follow the instructions in your browser:

```shell
lk cloud auth

```

To add a self-hosted server or another project, see [Project management](https://docs.livekit.io/reference/developer-tools/livekit-cli/projects.md).

### Create an agent

Scaffold an agent, talk to it locally, and deploy it to LiveKit Cloud:

```shell
lk agent init my-agent --template agent-starter-python
cd my-agent
lk agent console
lk agent create

```

`lk agent init` also offers to set up your coding agent in the new project. `lk agent create` registers the agent and deploys its first version. After that, run `lk agent deploy` to ship each new version.

### Set up your coding agent

Install LiveKit's [Agent Skills](https://docs.livekit.io/intro/coding-agents.md#agent-skills) and the Docs MCP server into your coding agents. Run it in your project directory, or add `--global` to install for all projects. For options, see [Skills installation](https://docs.livekit.io/reference/developer-tools/livekit-cli/skills.md).

```shell
lk skills install

```

## App templates

The CLI creates apps from first-party templates, with your project credentials already configured. For agent templates, use `lk agent init`:

```shell
lk agent init my-agent --template agent-starter-python
# or: --template agent-starter-node

```

Omit `--template` to choose from a list. For frontends and other apps, use [`lk app create`](https://docs.livekit.io/reference/developer-tools/livekit-cli/projects.md#app-create).

First-party templates:

| **Template Name** | **Language/Framework** | **Description** |
| [agent-starter-python](https://github.com/livekit-examples/agent-starter-python) | Python | A starter project for Python, featuring a simple voice agent implementation |
| [agent-starter-react](https://github.com/livekit-examples/agent-starter-react) | TypeScript/Next.js | A starter app for Next.js, featuring a flexible voice AI frontend |
| [agent-starter-android](https://github.com/livekit-examples/agent-starter-android) | Kotlin/Android | A starter project for Android, featuring a flexible voice AI frontend |
| [agent-starter-swift](https://github.com/livekit-examples/agent-starter-swift) | Swift | A starter project for Swift, featuring a flexible voice AI frontend |
| [agent-starter-flutter](https://github.com/livekit-examples/agent-starter-flutter) | Flutter | A starter project for Flutter, featuring a flexible voice AI frontend |
| [agent-starter-react-native](https://github.com/livekit-examples/agent-starter-react-native) | React Native/Expo | A starter project for Expo, featuring a flexible voice AI frontend |
| [agent-starter-embed](https://github.com/livekit-examples/agent-starter-embed) | TypeScript/Next.js | A starter project for a flexible voice AI that can be embedded in any website |
| [token-server](https://github.com/livekit-examples/token-server-node) | Node.js/TypeScript | A hosted token server to help you prototype your mobile applications faster |
| [meet](https://github.com/livekit-examples/meet) | TypeScript/Next.js | An open source video conferencing app built on LiveKit Components and Next.js |
| [multi-agent-python](https://github.com/livekit-examples/multi-agent-python) | Python | A team of writing coach agents demonstrating multi-agent workflows |
| [outbound-caller-python](https://github.com/livekit-examples/outbound-caller-python) | Python | An agent that makes outbound calls using LiveKit SIP |

- **[LiveKit Template Index](https://github.com/livekit-examples/index)**: Browse all available first-party templates.

## Docs search

Search the docs, fetch pages, and search SDK source code from your terminal, which also gives [coding agents](https://docs.livekit.io/intro/coding-agents.md) up-to-date LiveKit references:

```shell
lk docs search "voice agent quickstart"

```

- **[Docs search reference](https://docs.livekit.io/reference/developer-tools/livekit-cli/docs.md)**: Full command reference for `lk docs`.

---

This document was rendered at 2026-10-24T20:20:05.635Z.
For the latest version of this document, see [https://docs.livekit.io/reference/developer-tools/livekit-cli.md](https://docs.livekit.io/reference/developer-tools/livekit-cli.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).

<!-- ================================================================ -->
## Page: https://docs.livekit.io/intro/basics/cli.md

LiveKit docs › Introduction › Understanding LiveKit › LiveKit CLI

---

# LiveKit CLI

> The essential developer tool for building, testing, and deploying LiveKit agents

## Overview

The LiveKit CLI (`lk`) is the essential developer tool for building agents with LiveKit. Use it to set up your coding agent, scaffold an agent, run and test it locally, and deploy it to LiveKit Cloud. It also manages projects, rooms, and telephony.

- **[GitHub repository](https://github.com/livekit/livekit-cli)**: Source code and releases for the LiveKit CLI.

## Get started

To install the CLI and link a project, see the [CLI setup guide](https://docs.livekit.io/reference/developer-tools/livekit-cli.md#setup).

## Agent workflow

A typical agent goes from template to deployment in a few commands:

```shell
lk agent init my-agent         # Scaffold an agent and set up your coding agent
cd my-agent
lk agent console               # Talk to it locally
lk agent simulate text         # Test it against simulated users
lk agent create                # Deploy it to LiveKit Cloud
lk agent deploy                # Deploy each new version

```

`lk a` is short for `lk agent`.

### Set up your coding agent

`lk agent init` offers to add LiveKit's [Agent Skills](https://docs.livekit.io/intro/coding-agents.md#agent-skills) and the [Docs MCP server](https://docs.livekit.io/reference/developer-tools/docs-mcp.md) to Claude Code, Codex, Cursor, and other coding agents in your new project. For an existing project, run `lk skills install` in its directory, or add `--global` to install for all projects. `lk docs` searches and fetches the LiveKit docs from the terminal.

- **[Skills installation reference](https://docs.livekit.io/reference/developer-tools/livekit-cli/skills.md)**: Install, update, and remove skills with `lk skills`.

- **[Docs search reference](https://docs.livekit.io/reference/developer-tools/livekit-cli/docs.md)**: Search and read the docs with `lk docs`.

### Build and run locally

`lk agent init` scaffolds a Python or Node.js agent from a starter template. `lk agent console` lets you talk to it through your microphone, `lk agent dev` runs it with auto-reload, and `lk agent start` runs it in production mode.

- **[Agent development reference](https://docs.livekit.io/reference/developer-tools/livekit-cli/agent.md)**: Reference for `init`, `dev`, `start`, and `console`.

### Test it

`lk agent debugger` lets a [coding agent](https://docs.livekit.io/intro/coding-agents.md) or script talk to your agent one turn at a time and see the tool calls and errors behind each reply. `lk agent simulate` runs whole conversations against simulated users and scores them.

- **[Agent testing reference](https://docs.livekit.io/reference/developer-tools/livekit-cli/agent/testing.md)**: Reference for `debugger` and `simulate`.

### Deploy to LiveKit Cloud

`lk agent create` registers your agent with LiveKit Cloud and deploys its first version. After that, `lk agent deploy` builds and deploys each new version. Other commands check status, stream logs, manage secrets, and roll back.

- **[Agent deployment reference](https://docs.livekit.io/reference/developer-tools/livekit-cli/agent/deployment.md)**: Reference for deploying and managing agents on LiveKit Cloud.

## Other commands

The CLI also covers the rest of LiveKit:

- [Project management](https://docs.livekit.io/reference/developer-tools/livekit-cli/projects.md): Link LiveKit Cloud projects with `lk cloud auth`, switch projects, and scaffold frontends with `lk app`.
- [Rooms and participants](https://docs.livekit.io/reference/developer-tools/livekit-cli/rooms.md): Manage rooms, create tokens, and dispatch agents.
- [Egress and ingress](https://docs.livekit.io/reference/developer-tools/livekit-cli/egress-ingress.md): Record, stream, and import media.
- [Telephony](https://docs.livekit.io/reference/developer-tools/livekit-cli/telephony.md): Manage SIP trunks, dispatch rules, and phone numbers.
- [Load testing](https://docs.livekit.io/reference/developer-tools/livekit-cli/perf.md): Load test rooms and agents.

---

This document was rendered at 2026-10-24T20:20:06.228Z.
For the latest version of this document, see [https://docs.livekit.io/intro/basics/cli.md](https://docs.livekit.io/intro/basics/cli.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).

<!-- ================================================================ -->
## Page: https://docs.livekit.io/reference/developer-tools/livekit-cli/projects.md

LiveKit docs › Reference › Developer tools › LiveKit CLI › Project management

---

# Project management

> Add, list, and manage the projects the LiveKit CLI uses, and bootstrap apps with project credentials.

## Overview

Use the `lk project` commands to manage LiveKit projects used by the CLI. A project is composed of a URL, API key, and API secret that point to a LiveKit deployment, plus a name to reference the project in the CLI. You can set a default project that is used by other commands when no project is specified.

These commands only edit your local CLI configuration. To create a LiveKit Cloud project, use the [LiveKit Cloud dashboard](https://cloud.livekit.io).

To install the CLI, see [Install the CLI](https://docs.livekit.io/reference/developer-tools/livekit-cli.md#install-the-cli).

```shell
lk project [command [command options]]

```

## LiveKit Cloud projects

Use the `lk cloud` command to authenticate with LiveKit Cloud and link your Cloud-hosted projects to the CLI. LiveKit Cloud automatically generates a new API key for your CLI instance and performs a [project add](#add) for you.

```shell
lk cloud [command [command options]]

```

### Authentication

Authenticate a LiveKit Cloud account to link a single project. The command opens a browser-based flow to sign in to LiveKit Cloud and select a single project. To link multiple projects, run this command multiple times.

```shell
lk cloud auth [options]

```

Options for `cloud auth`:

- `--timeout SECONDS, -t SECONDS`: Number of seconds to attempt authentication before giving up. Default: `900`.
- `--poll-interval SECONDS, -i SECONDS`: Number of seconds between poll requests while waiting. Default: `4`.

#### Examples

Link your LiveKit Cloud account and import a project.

```shell
lk cloud auth

```

### Revoke

Revoke an authorization for an existing project. This revokes the API keys that were issued with `lk cloud auth`, and then performs a [project remove](#remove) for you.

```shell
lk cloud auth --revoke

```

Options for `cloud auth --revoke`:

- `--project PROJECT_NAME`: Name of the project to revoke. Default: default project.

> ⚠️ **Warning**
> 
> Revoking an authorization also revokes the API keys stored in your CLI instance. Any copies of these keys previously made with [`lk app env`](#app-env) or [`lk app create`](#app-create) are also revoked.

## Project subcommands

The following project subcommands are available:

### Add

Add a new project to your CLI instance.

For LiveKit Cloud projects, use the [cloud auth](#cloud-auth) command to link your account and import projects through your browser.

```shell
lk project add PROJECT_NAME --url LIVEKIT_URL --api-key API_KEY --api-secret API_SECRET [--default]

```

Options for `add`:

- `PROJECT_NAME`: Name of the project. Must be unique in your CLI instance.
- `--url URL`: websocket URL of the LiveKit server.
- `--api-key KEY`: Project API key.
- `--api-secret SECRET`: Project API secret.
- `--default`: Set this project as the default. Default: `false`.

#### Examples

Add a self-hosted project and set it as default:

```shell
lk project add my-project \
  --url http://localhost:7880 \
  --api-key <my-api-key> \
  --api-secret <my-api-secret> \
  --default

```

### List

List all configured projects.

```shell
lk project list [options]

```

Options for `list`:

- `--json, -j`: Output as JSON, including API key and secret. Default: `false`.

#### Examples

Human-readable output (current default is marked with `*`):

```shell
lk project list

```

Example output:

```shell
┌──────────────────────┬──────────────────────────────────────────────────┬───────────────┐
│ Name                 │ URL                                              │ API Key       │
├──────────────────────┼──────────────────────────────────────────────────┼───────────────┤
│   dev-local          │ http://localhost:7880                            │ APIxxxxxxxxxx │
│   staging            │ wss://staging-abc123.livekit.cloud               │ APIyyyyyyyyyy │
│ * production         │ wss://production-xyz789.livekit.cloud            │ APIzzzzzzzzzz │
└──────────────────────┴──────────────────────────────────────────────────┴───────────────┘

```

JSON output:

```shell
lk project list --json

```

Example output:

```json
[
  {
    "Name": "dev-local",
    "URL": "http://localhost:7880",
    "APIKey": "APIxxxxxxxxxx",
    "APISecret": "abc123"
  },
  {
    "Name": "staging",
    "URL": "wss://staging-abc123.livekit.cloud",
    "APIKey": "APIyyyyyyyyyy",
    "APISecret": "abc123"
  },
  {
    "Name": "production",
    "URL": "wss://production-xyz789.livekit.cloud",
    "APIKey": "APIzzzzzzzzzz",
    "APISecret": "abc123"
  }
]

```

### Remove

Remove an existing project from your local CLI configuration. This does not affect the project in LiveKit Cloud.

For LiveKit Cloud projects, use the [cloud auth revoke](#cloud-auth-revoke) command to revoke the API keys and remove the project from the CLI.

```shell
lk project remove PROJECT_NAME

```

#### Examples

```shell
lk project remove dev-local

```

### Set-default

Set a project as the default to use with other commands.

```shell
lk project set-default PROJECT_NAME

```

#### Examples

```shell
lk project set-default production

```

List projects to see the current default, change it, then list again:

```shell
lk project list

```

Example output:

```shell
┌──────────────────────┬──────────────────────────────────────────────────┬───────────────┐
│ Name                 │ URL                                              │ API Key       │
├──────────────────────┼──────────────────────────────────────────────────┼───────────────┤
│   dev-local          │ http://localhost:7880                            │ APIxxxxxxxxxx │
│ * staging            │ wss://staging-abc123.livekit.cloud               │ APIyyyyyyyyyy │
│   production         │ wss://production-xyz789.livekit.cloud            │ APIzzzzzzzzzz │
└──────────────────────┴──────────────────────────────────────────────────┴───────────────┘

```

Change the default to `production`:

```shell
lk project set-default production

```

List again to confirm the change:

```shell
lk project list

```

Example output:

```shell
┌──────────────────────┬──────────────────────────────────────────────────┬───────────────┐
│ Name                 │ URL                                              │ API Key       │
├──────────────────────┼──────────────────────────────────────────────────┼───────────────┤
│   dev-local          │ http://localhost:7880                            │ APIxxxxxxxxxx │
│   staging            │ wss://staging-abc123.livekit.cloud               │ APIyyyyyyyyyy │
│ * production         │ wss://production-xyz789.livekit.cloud            │ APIzzzzzzzzzz │
└──────────────────────┴──────────────────────────────────────────────────┴───────────────┘

```

## App commands

Use the `lk app` commands to create an app from a template and fill its environment variables with credentials from `--project` or the [default project](#set-default). For agent templates, use `lk agent init` instead.

```shell
lk app [command [command options]]

```

### Create

Create a new app from a template, with its environment variables filled from your project. For first-party templates, see [App templates](https://docs.livekit.io/reference/developer-tools/livekit-cli.md#app-templates).

```shell
lk app create [options] APP_NAME

```

Options for `app create`:

- `APP_NAME`: Name of the app directory. Prompts if omitted.
- `--template TEMPLATE`: Template name from [list-templates](#app-list-templates). Prompts if neither this nor `--template-url` is set.
- `--template-url URL`: URL of a template repository containing a `taskfile.yaml`. Can't be used with `--template`.
- `--install`: Install dependencies without prompting. Default: `false`.

#### Examples

Create a Next.js voice AI frontend and install its dependencies:

```shell
lk app create --template agent-starter-react --install my-frontend

```

Create an app from your own template repository:

```shell
lk app create --template-url https://github.com/<your-org>/<your-template> my-app

```

### List templates

List the templates available to `lk app create`.

```shell
lk app list-templates [options]

```

Options for `app list-templates`:

- `--json, -j`: Output as JSON. Default: `false`.

#### Examples

```shell
lk app list-templates

```

### Env

Generate environment variables for an existing app. The CLI fills the LiveKit URL and credentials from your project, prompts for any other variables in `.env.example`, and prints the result.

```shell
lk app env [options] [DIR]

```

Options for `app env`:

- `DIR`: App directory. Default: the current directory.
- `--write, -w`: Write to the destination file instead of printing. Merges into an existing file, keeping its values except the LiveKit credentials. Default: `false`.
- `--destination FILE, -d FILE`: File to write to, relative to `DIR`. Default: `.env.local`.
- `--overwrite, -o`: Replace the destination file instead of merging. Default: `false`.
- `--example FILE, -e FILE`: Example file to read variable names from, relative to `DIR`. Default: `.env.example`.

#### Examples

Print the variables for the app in the current directory:

```shell
lk app env

```

Write the variables for the `staging` project to `.env.local` in `my-app`:

```shell
lk app env --project staging --write my-app

```

---

This document was rendered at 2026-10-24T20:20:06.659Z.
For the latest version of this document, see [https://docs.livekit.io/reference/developer-tools/livekit-cli/projects.md](https://docs.livekit.io/reference/developer-tools/livekit-cli/projects.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).

<!-- ================================================================ -->
## Page: https://docs.livekit.io/reference/developer-tools/livekit-cli/docs.md

LiveKit docs › Reference › Developer tools › LiveKit CLI › Docs search

---

# Docs search

> Search and browse LiveKit documentation from the terminal with the lk docs command.

## Overview

The `lk docs` command provides full access to the LiveKit documentation directly from your terminal. It's powered by the [LiveKit Docs MCP server](https://docs.livekit.io/mcp) and supports browsing, searching, fetching pages, code search, and changelog access. To install the CLI, see [Install the CLI](https://docs.livekit.io/reference/developer-tools/livekit-cli.md#install-the-cli).

All commands output markdown by default. Use the `--json` flag on any command for structured JSON output.

## Output modes

Every `lk docs` command supports two output modes:

- **Markdown** (default) — Human-readable output optimized for terminal display and coding agents. More concise and token-efficient.
- **JSON** (`--json`) — Structured output for programmatic use, scripting, and integration with other tools.

```shell
# Markdown (default)
lk docs search "voice agents"

# JSON
lk docs search "voice agents" --json

```

JSON mode is useful when you need to parse results in a script or pipe structured data to another program. The default markdown mode is recommended for interactive use and coding agents, as it's more concise and consumes fewer tokens.

## Commands

The `lk docs` subcommand includes the following commands.

### overview

Get a complete overview of the documentation site with a full table of contents and page descriptions. This is a good starting point for browsing the docs.

```shell
lk docs overview

```

### search

Search the documentation by keyword. Returns page titles, hierarchical placement, and content snippets. Use `lk docs get-page` to fetch the full content of any result.

```shell
lk docs search "voice agents"

```

| Option | Description |
| `--query, -q` | Search query text. Can also be passed as a positional argument. |
| `--page, -p` | Page number for pagination, starting at 0. |
| `--hits-per-page` | Number of results per page (1-50, default 20). |

Search should be used alongside `lk docs overview` for browsing, not as a replacement. The search index covers a large amount of content, so combine search with direct page fetching for best results.

### get-page

Fetch one or more documentation pages and render them as markdown. Accepts relative paths from the docs site or GitHub URLs from public LiveKit repositories.

```shell
# Fetch a single page
lk docs get-page /agents/start/voice-ai

# Fetch multiple pages
lk docs get-page /agents/build/tools /agents/build/vision

# Fetch from a GitHub URL
lk docs get-page https://github.com/livekit/agents/blob/main/README.md

```

> ℹ️ **Note**
> 
> Auto-generated SDK reference pages (such as `/reference/client-sdk-js` or `/reference/python`) are hosted externally and can't be fetched with this command.

### code-search

Search code across public LiveKit GitHub repositories. Use code identifiers like class names, function names, and method calls rather than natural language descriptions.

```shell
# Search across all repos
lk docs code-search "class AgentSession"

# Search a specific repo
lk docs code-search "def on_enter" --repo livekit/agents

# Filter by language and get full file contents
lk docs code-search "@function_tool" --language Python --full-file

```

| Option | Description |
| `--query, -q` | Search term. Use code identifiers, not natural language. |
| `--repo, -r` | Target repository (for example, `livekit/agents`) or `ALL` to search everywhere. Defaults to `ALL`. |
| `--language, -l` | Language filter (for example, `Python`, `TypeScript`). |
| `--scope` | Search scope: `content` (default), `filename`, or `both`. |
| `--limit` | Maximum results to return (1-50, default 20). |
| `--full-file` | Return full file contents instead of snippets. |

### changelog

Get recent releases and changelog entries for a LiveKit SDK or package.

```shell
# By repository ID
lk docs changelog livekit/agents

# By package identifier
lk docs changelog pypi:livekit-agents

# Fetch more releases
lk docs changelog npm:@livekit/components-react --releases 5

```

| Option | Description |
| `--releases` | Number of releases to fetch (1-20, default 2). |
| `--skip` | Number of releases to skip for pagination. |

### list-sdks

List all LiveKit SDK repositories with their package names. Useful for cross-referencing dependencies and finding the right SDK.

```shell
lk docs list-sdks

```

### pricing-info

Get LiveKit Cloud pricing information including plans, feature comparison matrix, inference model pricing, and calculator assumptions.

```shell
lk docs pricing-info

```

### submit-feedback

Submit constructive feedback on the LiveKit documentation. Do not include any personal or proprietary information.

```shell
# General feedback
lk docs submit-feedback "The voice agents quickstart needs a Node.js example"

# Feedback for a specific page
lk docs submit-feedback --page /agents/build/tools "Missing info about error handling"

```

| Option | Description |
| `--page` | The docs page the feedback is about (for example, `/agents/build/tools`). |
| `--feedback, -f` | Feedback text (max 1024 characters). Can also be passed as a positional argument. |

## Typical workflow

A typical workflow for exploring the documentation:

1. Start with an overview of the docs site:

```shell
lk docs overview

```
2. Search for a topic:

```shell
lk docs search "voice agents"

```
3. Fetch a specific page to read the full content:

```shell
lk docs get-page /agents/start/voice-ai

```
4. Search for code examples across LiveKit repositories:

```shell
lk docs code-search "class AgentSession" --repo livekit/agents

```

---

This document was rendered at 2026-10-24T20:20:07.127Z.
For the latest version of this document, see [https://docs.livekit.io/reference/developer-tools/livekit-cli/docs.md](https://docs.livekit.io/reference/developer-tools/livekit-cli/docs.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).

<!-- ================================================================ -->
## Page: https://docs.livekit.io/agents/start/voice-ai.md

LiveKit docs › Build Agents › Get Started › Voice AI quickstart

---

# Voice AI quickstart

> Build and deploy a simple voice assistant in less than 10 minutes.

## Overview

This guide walks you through the setup of your very first voice assistant using LiveKit Agents. In less than 10 minutes, you'll have a voice assistant that you can speak to in your terminal, browser, telephone, or native app.

> 💡 **LiveKit Agent Builder**
> 
> The LiveKit Agent Builder is a quick way to get started with voice agents in your browser, without writing any code. It's perfect for prototyping and exploring ideas, but doesn't have as many features as the full LiveKit Agents SDK. See the [Agent Builder](https://docs.livekit.io/agents/start/builder.md) guide for more details.

### Coding agent support

LiveKit is built for coding agents like [Claude Code](https://claude.com/product/claude-code), [Cursor](https://www.cursor.com/), and [Codex](https://openai.com/codex/). These agents can build agents and frontends with the LiveKit SDKs and manage resources with the [LiveKit CLI](https://docs.livekit.io/reference/developer-tools/livekit-cli.md#install-the-cli). Give your agent LiveKit expertise with [Agent Skills](https://docs.livekit.io/intro/coding-agents.md#agent-skills) and the Docs MCP server, and let it try its changes with the [CLI agent debugger](https://docs.livekit.io/testing/debugger.md). Install the skills and the MCP server for all of your coding agents with one command:

```shell
lk skills install

```

Run it in your project directory, or add `--global` to install for all projects. For Claude Code, you can install the LiveKit plugin instead. For more information, see the [coding agents guide](https://docs.livekit.io/intro/coding-agents.md).

## Starter projects

The simplest way to get your first agent running is with one of the following starter projects. You can create a project from a template with the CLI (see [Quick start with CLI](#setup-with-cli)) or click "Use this template" on GitHub and follow the project's README.

These projects are constructed with best practices, a complete working agent, tests, and an AGENTS.md optimized to turn coding agents like [Claude Code](https://claude.com/product/claude-code) and [Cursor](https://www.cursor.com/) into LiveKit experts.

- **[Python starter project](https://github.com/livekit-examples/agent-starter-python)**: Ready-to-go Python starter project. Clone a repo with all the code you need to get started.

- **[Node.js starter project](https://github.com/livekit-examples/agent-starter-node)**: Ready-to-go Node.js starter project. Clone a repo with all the code you need to get started.

## Requirements

The following sections describe the minimum requirements to get started with LiveKit Agents.

**Python**:

- LiveKit Agents requires Python >= 3.10.
- This guide uses the [uv](https://docs.astral.sh/uv/getting-started/installation/) package manager.

---

**Node.js**:

- LiveKit Agents for Node.js requires Node.js >= 20.
- This guide uses [pnpm](https://pnpm.io/installation) package manager and requires pnpm >= 10.15.0.

### LiveKit Cloud

This guide assumes you have signed up for a free [LiveKit Cloud](https://cloud.livekit.io/) account. LiveKit Cloud includes agent deployment, model inference, and realtime media transport. Create a free project and use the API keys in the following steps to get started.

While this guide assumes LiveKit Cloud, the instructions can be adapted for [self-hosting](https://docs.livekit.io/transport/self-hosting/local.md) the open source LiveKit server instead. For self-hosting in production, set up a [custom deployment](https://docs.livekit.io/deploy/custom/deployments.md) environment, and make the following changes: remove the [enhanced noise cancellation](https://docs.livekit.io/transport/media/noise-cancellation.md) plugin from the agent code, and use [plugins](https://docs.livekit.io/agents/models.md#plugins) for your own AI providers.

### LiveKit CLI

Use the LiveKit CLI to manage LiveKit API keys and deploy your agent to LiveKit Cloud.

1. Install the LiveKit CLI:

**macOS**:

Install the LiveKit CLI with [Homebrew](https://brew.sh/):

```text
brew install livekit-cli

```

---

**Linux**:

```text
curl -sSL https://get.livekit.io/cli | bash

```

> 💡 **Tip**
> 
> You can also download the latest precompiled binaries [here](https://github.com/livekit/livekit-cli/releases/latest).

---

**Windows**:

```text
winget install LiveKit.LiveKitCLI

```

> 💡 **Tip**
> 
> You can also download the latest precompiled binaries [here](https://github.com/livekit/livekit-cli/releases/latest).

---

**From Source**:

This repo uses [Git LFS](https://git-lfs.github.com/) for embedded video resources. Please ensure git-lfs is installed on your machine before proceeding.

```text
git clone github.com/livekit/livekit-cli
make install

```
2. Link your LiveKit Cloud project to the CLI:

```shell
lk cloud auth

```

This opens a browser window to authenticate and link your project to the CLI.

## Quickstart steps

The following sections walk you through the steps to get your first agent running.

### Setup with CLI

The simplest way to get your first agent running is with the LiveKit CLI.

Make sure your project meets all [requirements](#requirements), then run:

**Python**:

```shell
lk agent init my-agent --template agent-starter-python

```

---

**Node.js**:

```shell
lk agent init my-agent --template agent-starter-node

```

The CLI clones the template into the `my-agent` directory, creates an `.env.local` file with your LiveKit credentials, and prints the next steps to run your agent.

> 💡 **Save the chat link**
> 
> Open the link provided by the CLI after the line `"To try your new agent in the web console, visit:"` to speak to your agent in the following step.

Follow the instructions it prints, which guide you through the following steps:

1. **Select a project to use** — If you don't have a default project set, the CLI prompts you to select a project to use.
2. **Change into the project directory** — The project directory is named after your agent.

```shell
cd my-agent

```
3. **Install dependencies** — Install the agent's runtime and plugin dependencies if you did not elect to have them automatically installed during template setup.

**Python**:

```shell
uv sync

```

---

**Node.js**:

```shell
pnpm install

```
4. **Run your agent** — Run your agent in development mode.

```shell
lk agent dev

```

### Speak to your agent

If you opened the Console link provided by the CLI in the previous step, return to your browser and click **Start a session**. Otherwise, you can always find the Console on your project's [Agents dashboard](https://cloud.livekit.io/projects/p_/agents). Use the microphone button to speak to your agent and see its responses in real time, and explore the tool panes to measure your agent's behavior and performance in detail.

## Other options

You can customize your agent by choosing different AI models and by exploring testing and deployment options.

### AI models

Voice agents require one or more [AI models](https://docs.livekit.io/agents/models.md) to provide understanding, intelligence, and speech. LiveKit Agents supports both high-performance STT-LLM-TTS voice pipelines constructed from multiple specialized models, as well as realtime models with direct speech-to-speech capabilities. For help deciding which pipeline fits your use case, see [Pipeline types](https://docs.livekit.io/agents/models/pipelines.md).

**STT-LLM-TTS pipeline**:

Your agent strings together three specialized providers through LiveKit Inference into a high-performance voice pipeline. No additional setup is required.

![Diagram showing STT-LLM-TTS pipeline.](/images/agents/stt-llm-tts-pipeline.svg)

| Component | Model | Alternatives |
| STT | AssemblyAI Universal-3.6 Pro | [STT models](https://docs.livekit.io/agents/models/stt.md) |
| LLM | Gemma 4 31B | [LLM models](https://docs.livekit.io/agents/models/llm.md) |
| TTS | Fish Audio S2.1 Pro | [TTS models](https://docs.livekit.io/agents/models/tts.md) |

---

**Realtime model**:

Your agent uses a single realtime model through LiveKit Inference to provide an expressive and lifelike voice experience. You don't need any additional setup.

![Diagram showing realtime model.](/images/agents/realtime-model.svg)

| Model | Alternatives |
| [OpenAI GPT Realtime 2.1](https://docs.livekit.io/agents/models/realtime/openai.md) | [Realtime models](https://docs.livekit.io/agents/models/realtime.md) |

You can change the AI models used by editing your agent file. Full agent files for STT-LLM-TTS and Realtime models can be found in the [Agent code](#agent-code) section.

### Test and deploy

Use different modes and deployment options to test and deploy your agent.

#### Server startup modes

Start your agent server in development or production modes.

- `console` mode: Run your agent locally in your terminal.
- `dev` mode: Run your agent in development mode for testing and debugging.
- `start` mode: Run your agent in production mode.

To learn more about these modes, see the [Server startup modes](https://docs.livekit.io/agents/server/startup-modes/) reference.

To run your agent in production mode:

```shell
lk agent start

```

#### Connect to Agent Console

Start your agent in `dev` mode to connect it to LiveKit and make it available from anywhere on the internet:

```shell
lk agent dev

```

Use the [Agent Console](https://docs.livekit.io/testing/agent-console.md) to interact with and debug your agent in realtime. Note that you'll need to set the **Agent name**, which should be `my-agent` for this quickstart.

#### Deploy to LiveKit Cloud

Run `lk agent create` from the project directory to register and deploy.

After the deployment completes, you can access your agent in the [Agent Console](https://docs.livekit.io/testing/agent-console.md), or continue to use [console mode](https://docs.livekit.io/agents/server/startup-modes.md#console-mode) as you build and test your agent locally.

## Agent code

Once you have the quickstart running, you can dig into the agent code. For the difference between realtime and chained (STT-LLM-TTS) pipelines, see [AI models](#ai-models). The tabs below show the full files for each pipeline type so you can swap, copy, or adapt them.

**STT-LLM-TTS pipeline**:

** Filename: `agent.py`**

```python
from dotenv import load_dotenv

from livekit import agents
from livekit.agents import AgentServer, AgentSession, Agent, inference, room_io, TurnHandlingOptions
from livekit.plugins import ai_coustics

load_dotenv(".env.local")


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""You are a helpful voice AI assistant.
            You eagerly assist users with their questions by providing information from your extensive knowledge.
            Your responses are concise, to the point, and without any complex formatting or punctuation including emojis, asterisks, or other symbols.
            You are curious, friendly, and have a sense of humor.""",
        )

server = AgentServer()

@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: agents.JobContext):
    session = AgentSession(
        stt=inference.STT(model="assemblyai/universal-3-6-pro", language="en"),
        llm=inference.LLM(model="google/gemma-4-31b-it"),
        tts=inference.TTS(
            model="fishaudio/s2.1-pro",
            voice="fa4c9eb3dccc4806b382b40d61c6b10a",
        ),
        turn_handling=TurnHandlingOptions(
            turn_detection=inference.TurnDetector(),
        ),
    )

    await session.start(
        room=ctx.room,
        agent=Assistant(),
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=ai_coustics.audio_enhancement(model=ai_coustics.EnhancerModel.QUAIL_VF_S),
            ),
        ),
    )

    await session.generate_reply(
        instructions="Greet the user and offer your assistance."
    )


if __name__ == "__main__":
    agents.cli.run_app(server)


```

** Filename: `main.ts`**

```typescript
import {
  type JobContext,
  ServerOptions,
  cli,
  defineAgent,
  inference,
  voice,
} from '@livekit/agents';
import * as aiCoustics from '@livekit/plugins-ai-coustics';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createAgent } from './agent';

dotenv.config({ path: '.env.local' });

export default defineAgent({
  entry: async (ctx: JobContext) => {
    const session = new voice.AgentSession({
      stt: new inference.STT({ model: 'assemblyai/universal-3-6-pro', language: 'en' }),
      llm: new inference.LLM({ model: 'google/gemma-4-31b-it' }),
      tts: new inference.TTS({
        model: 'fishaudio/s2.1-pro',
        voice: 'fa4c9eb3dccc4806b382b40d61c6b10a',
      }),
      turnHandling: {
        turnDetection: new inference.TurnDetector(),
      },
    });

    await session.start({
      agent: createAgent(),
      room: ctx.room,
      inputOptions: {
        noiseCancellation: aiCoustics.audioEnhancement({ model: aiCoustics.EnhancerModel.QuailVfS }),
      },
    });

    await ctx.connect();

    const handle = session.generateReply({
      instructions: 'Greet the user and offer your assistance.',
    });
  },
});

cli.runApp(new ServerOptions({ agent: fileURLToPath(import.meta.url), agentName: 'my-agent' }));

```

** Filename: `agent.ts`**

```typescript
import { voice } from '@livekit/agents';

export function createAgent() {
  return voice.Agent.create({
    instructions: `You are a helpful voice AI assistant.
      You eagerly assist users with their questions by providing information from your extensive knowledge.
      Your responses are concise, to the point, and without any complex formatting or punctuation including emojis, asterisks, or other symbols.
      You are curious, friendly, and have a sense of humor.`,
  });
}

```

---

**Realtime model**:

** Filename: `agent.py`**

```python
from dotenv import load_dotenv

from livekit import agents
from livekit.agents import AgentServer, AgentSession, Agent, inference, room_io
from livekit.plugins import ai_coustics

load_dotenv(".env.local")

class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions="You are a helpful voice AI assistant.")

server = AgentServer()

@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: agents.JobContext):
    session = AgentSession(
        llm=inference.RealtimeModel(
            model="openai/gpt-realtime-2.1",
            voice="marin",
        )
    )

    await session.start(
        room=ctx.room,
        agent=Assistant(),
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=ai_coustics.audio_enhancement(model=ai_coustics.EnhancerModel.QUAIL_VF_S),
            ),
        ),
    )

    await session.generate_reply(
        instructions="Greet the user and offer your assistance. You should start by speaking in English."
    )


if __name__ == "__main__":
    agents.cli.run_app(server)


```

** Filename: `main.ts`**

```typescript
import {
  type JobContext,
  ServerOptions,
  cli,
  defineAgent,
  inference,
  voice,
} from '@livekit/agents';
import * as aiCoustics from '@livekit/plugins-ai-coustics';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createAgent } from './agent';

dotenv.config({ path: '.env.local' });

export default defineAgent({
  entry: async (ctx: JobContext) => {
    const session = new voice.AgentSession({
      llm: new inference.RealtimeModel({
        model: 'openai/gpt-realtime-2.1',
        voice: 'marin',
      }),
    });

    await session.start({
      agent: createAgent(),
      room: ctx.room,
      inputOptions: {
        noiseCancellation: aiCoustics.audioEnhancement({ model: aiCoustics.EnhancerModel.QuailVfS }),
      },
    });

    await ctx.connect();

    await session.generateReply({
      instructions: 'Greet the user and offer your assistance. You should start by speaking in English.',
    });
  },
});

cli.runApp(new ServerOptions({ agent: fileURLToPath(import.meta.url), agentName: 'my-agent' }));

```

** Filename: `agent.ts`**

```typescript
import { voice } from '@livekit/agents';

export function createAgent() {
  return voice.Agent.create({
    instructions: 'You are a helpful voice AI assistant.',
  });
}

```

## Next steps

Follow these guides to bring your voice AI app to life in the real world.

- **[Web and mobile frontends](https://docs.livekit.io/agents/start/frontend.md)**: Put your agent in your pocket with a custom web or mobile app.

- **[Telephony integration](https://docs.livekit.io/agents/start/telephony.md)**: Your agent can place and receive calls with LiveKit's SIP integration.

- **[Testing your agent](https://docs.livekit.io/testing.md)**: Add behavioral tests to fine-tune your agent's behavior.

- **[Building voice agents](https://docs.livekit.io/agents/build.md)**: Comprehensive documentation to build advanced voice AI apps with LiveKit.

- **[Agent server](https://docs.livekit.io/agents/server.md)**: Learn how to manage your agents with agent servers and jobs.

- **[Deploying to LiveKit Cloud](https://docs.livekit.io/agents/ops/deployment.md)**: Learn more about deploying and scaling your agent in production.

- **[AI Models](https://docs.livekit.io/agents/models.md)**: Explore the full list of AI models available with LiveKit Agents.

- **[Recipes](https://docs.livekit.io/reference/recipes.md)**: A comprehensive collection of examples, guides, and recipes for LiveKit Agents.

---

This document was rendered at 2026-10-24T20:20:07.531Z.
For the latest version of this document, see [https://docs.livekit.io/agents/start/voice-ai.md](https://docs.livekit.io/agents/start/voice-ai.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).

<!-- ================================================================ -->
## Page: https://docs.livekit.io/agents/logic/sessions.md

LiveKit docs › Build Agents › Logic & Structure › Agent sessions

---

# Agent session

> How to use AgentSession to orchestrate your voice AI app.

## Overview

The `AgentSession` is the main orchestrator for your voice AI app. The session is responsible for collecting user input, managing the voice pipeline, invoking the LLM, sending the output back to the user, and emits events for observability and control.

Each session requires at least one `Agent` to orchestrate. The agent is responsible for defining the core AI logic - instructions, tools, etc - of your app. The framework supports the design of custom [workflows](https://docs.livekit.io/agents/logic/workflows.md) to orchestrate handoff and delegation between multiple agents.

The following example shows how to begin a simple single-agent session:

**Python**:

```python
from livekit.agents import AgentSession, Agent, inference, room_io, TurnHandlingOptions
from livekit.plugins import noise_cancellation

session = AgentSession(
    stt="assemblyai/universal-3-6-pro:en",
    llm="google/gemma-4-31b-it",
    tts="fishaudio/s2.1-pro:fa4c9eb3dccc4806b382b40d61c6b10a",
    turn_handling=TurnHandlingOptions(
        turn_detection=inference.TurnDetector(),
    ),
)

await session.start(
    room=ctx.room,
    agent=Agent(instructions="You are a helpful voice AI assistant."),
    room_options=room_io.RoomOptions(
        audio_input=room_io.AudioInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    ),
)

```

---

**Node.js**:

```ts
import { voice, inference } from '@livekit/agents';
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';

const session = new voice.AgentSession({
  stt: "assemblyai/universal-3-6-pro:en",
  llm: "google/gemma-4-31b-it",
  tts: "fishaudio/s2.1-pro:fa4c9eb3dccc4806b382b40d61c6b10a",
  turnHandling: {
    turnDetection: new inference.TurnDetector(),
  },
});

await session.start({
  room: ctx.room,
  agent: voice.Agent.create({
    instructions: "You are a helpful voice AI assistant.",
  }),
  inputOptions: {
    noiseCancellation: BackgroundVoiceCancellation(),
  },
});

```

> ℹ️ **Simplified imports**
> 
> In Node.js, the `voice` and `llm` exports are also available directly from `@livekit/agents`, so you can write `import { Agent, AgentSession, tool } from '@livekit/agents'` instead of qualifying them with `voice.` or `llm.`. The namespaced form shown throughout these docs is still supported.

## Lifecycle

An `AgentSession` progresses through several distinct phases during its operation:

- **Initializing**: The session is setting up. During initialization, no audio or video processing occurs yet. Agent state is set to `initializing`.
- **Starting**: The session is started using the `start()` method. It sets up I/O connections, initializes agent activity tracking, and begins forwarding audio and video frames. In this phase, the agent is transitioned into the `listening` state.
- **Running**: The session is actively processing user input and generating agent responses. During this phase, your agent controls the session and can transfer control to other agents. In this phase, the agent transitions between `listening`, `thinking`, and `speaking` states.
- **Closing**: When a session is closed, the cleanup process includes gracefully draining pending speech (if requested), waiting for any queued operations to complete, committing any remaining user transcripts, and closing all I/O connections. The session emits a `close` event and resets internal state.

The following diagram shows the lifecycle of an `AgentSession` using agent states:

```mermaid
stateDiagram-v2
initializing --> listening : session started
listening --> thinking : user input received
thinking --> speaking : response generated
speaking --> listening : response complete
speaking --> listening : interrupted
listening --> initializing : session shutdown requested and states resetnote right of initializing
Session setup in progress
(no media I/O yet)
end notenote right of speaking
Agent outputs synthesized
audio response
end note
```

You can monitor agent state changes via the [`agent_state_changed` event](https://docs.livekit.io/reference/agents/events.md#agent_state_changed).

## Events

`AgentSession` emits events throughout its lifecycle to provide visibility into the conversation flow. For more information, select the event name to see the properties and example code.

| **Event** | **Description** |
| [`agent_state_changed`](https://docs.livekit.io/reference/agents/events.md#agent_state_changed) | Emitted when the agent's state changes (for example, from `listening` to `thinking` or `speaking`). |
| [`user_state_changed`](https://docs.livekit.io/reference/agents/events.md#user_state_changed) | Emitted when the user's state changes (for example, from `listening` to `speaking`). |
| [`user_input_transcribed`](https://docs.livekit.io/reference/agents/events.md#user_input_transcribed) | Emitted when user speech is transcribed to text. |
| [`user_transcription_timeout`](https://docs.livekit.io/reference/agents/events.md#user_transcription_timeout) | Emitted when VAD detects user speech but no transcript arrives within `transcription_timeout`. |
| [`conversation_item_added`](https://docs.livekit.io/reference/agents/events.md#conversation_item_added) | Emitted when a message is added to the conversation history. |
| [`close`](https://docs.livekit.io/reference/agents/events.md#close) | Emitted when the session closes, either gracefully or due to an error. |

## Session options

The `AgentSession` constructor accepts numerous options to configure behavior. The following sections describe the available options grouped by category.

### AI models

Configure the default speech and language models for your agent session. You can override these models for specific agents or tasks. To learn more about models, see the [models](https://docs.livekit.io/agents/models.md) topic.

### Turn detection & interruptions

Turn detection and interruptions are critical for managing conversation flow. You can configure the turn detection mode, turn handling, and interrupt behavior with the `turn_handling` parameter for `AgentSession`. To learn more, see the [Turns overview](https://docs.livekit.io/agents/logic/turns.md) topic.

- [`preemptive_generation`](https://docs.livekit.io/agents/multimodality/audio.md#preemptive-generation): Speculatively begins LLM requests before end-of-turn is detected to reduce response latency. Increases LLM token usage because speculative responses may be discarded. Configured via `turn_handling`. Default: enabled.

### Tools and capabilities

Extend agent capabilities with [tools](https://docs.livekit.io/agents/logic/tools.md):

- `tools`: List of `FunctionTool` or `RawFunctionTool` objects shared by all agents in the session.
- `mcp_servers`: List of MCP (Model Context Protocol) servers providing external tools.
- `max_tool_steps`: Maximum consecutive tool calls per LLM turn. Default: `3`. When the limit is reached, the agent makes one final LLM call with tool use disabled to generate a spoken response summarizing the results so far.

> ℹ️ **Note**
> 
> With the `livekit-agents` [1.4.5 release](https://github.com/livekit/agents/releases/tag/livekit-agents%401.4.5), reaching the `max_tool_steps` limit generates a final reply instead of failing silently.
- `ivr_detection`: Whether to detect if the agent is interacting with an Interactive Voice Response (IVR) system. Default: `False`. To learn more, see [DTMF](https://docs.livekit.io/telephony/features/dtmf.md).

### User interaction

The following parameters control how the session responds to user presence and speech timing.

- **`user_away_timeout`** _(float)_ (optional) - Default: `15.0`: Time in seconds of silence before the framework sets the user state to `away`. Set to `None` to turn off. See [Handling inactive users](#handling-inactive-users) for a complete example.

- **`transcription_timeout`** _(float)_ (optional) - Default: `None`: Time in seconds to wait for a final transcript after VAD detects that the user stopped speaking. If no transcript arrives, the session emits a [`user_transcription_timeout`](https://docs.livekit.io/reference/agents/events.md#user_transcription_timeout) event. Requires both VAD and STT. In Node.js, use `transcriptionTimeout` in milliseconds. See [Handling missing transcripts](#handling-missing-transcripts) for a complete example.

- **`min_consecutive_speech_delay`** _(float)_ (optional) - Default: `0.0`: Minimum delay in seconds between consecutive agent utterances.

#### Handling inactive users

Combine `user_away_timeout` with the [`user_state_changed`](https://docs.livekit.io/reference/agents/events.md#user_state_changed) event to detect when a user has gone idle and respond accordingly. When neither the user nor the agent has spoken for the configured duration, the framework sets the user state to `away` and emits a `user_state_changed` event.

A common pattern is to prompt the user a few times to check if they're still present, then shut down the session if they don't respond. The following example demonstrates each step:

- Set `user_away_timeout` to control how long silence lasts before the user is marked as `away`. The default is 15 seconds.
- Listen for `user_state_changed` and check for `new_state == "away"` to trigger your check-in logic.
- Cancel any pending check-in task if the user speaks or otherwise becomes active again, which changes the state back to `speaking` or `listening`.
- Call `session.shutdown()` (Python) or `ctx.shutdown()` (Node.js) to gracefully end the session after exhausting retries. To learn more, see [Ending the session](https://docs.livekit.io/agents/server/job.md#session-shutdown).

**Python**:

```python
import asyncio
from livekit.agents import (
    Agent, AgentSession, JobContext, UserStateChangedEvent, inference,
)

# ctx is the JobContext from the entrypoint function
session = AgentSession(
    stt=inference.STT("assemblyai/universal-3-6-pro"),
    llm=inference.LLM("openai/gpt-4.1-mini"),
    tts=inference.TTS("fishaudio/s2.1-pro", voice="fa4c9eb3dccc4806b382b40d61c6b10a"),
    user_away_timeout=12.5,  # seconds of silence before "away"
)

inactivity_task: asyncio.Task | None = None

async def check_if_user_present():
    # Prompt the user a few times, then end the session
    for _ in range(3):
        await session.generate_reply(
            instructions="The user has been inactive. Politely check if the user is still present."
        )
        await asyncio.sleep(10)
    session.shutdown()

@session.on("user_state_changed")
def on_user_state_changed(ev: UserStateChangedEvent):
    global inactivity_task
    if ev.new_state == "away":
        inactivity_task = asyncio.create_task(check_if_user_present())
        return

    # User came back (speaking, listening, etc.) — cancel the check-in
    if inactivity_task is not None:
        inactivity_task.cancel()
        inactivity_task = None

await session.start(
    agent=Agent(instructions="You are a helpful assistant."),
    room=ctx.room,
)

```

---

**Node.js**:

```typescript
import { type JobContext, voice, inference, Task, delay } from '@livekit/agents';

// ctx is the JobContext from the entry function
const session = new voice.AgentSession({
  stt: new inference.STT({ model: 'assemblyai/universal-3-6-pro' }),
  llm: new inference.LLM({ model: 'openai/gpt-4.1-mini' }),
  tts: new inference.TTS({ model: 'fishaudio/s2.1-pro', voice: 'fa4c9eb3dccc4806b382b40d61c6b10a' }),
  voiceOptions: {
    userAwayTimeout: 12.5, // seconds of silence before "away"
  },
});

let task: Task<void> | null = null;

const checkIfUserPresent = async (controller: AbortController): Promise<void> => {
  // Prompt the user a few times, then end the session
  for (let i = 0; i < 3; i++) {
    if (controller.signal.aborted) return;
    const reply = await session.generateReply({
      instructions: 'The user has been inactive. Politely check if the user is still present.',
    });
    await reply.waitForPlayout();
    try {
      await delay(10000, { signal: controller.signal });
    } catch {
      return;
    }
  }
  if (!controller.signal.aborted) {
    ctx.shutdown();
  }
};

session.on(voice.AgentSessionEventTypes.UserStateChanged, (event) => {
  if (event.newState === 'away') {
    task = Task.from(checkIfUserPresent);
    return;
  }

  // User came back (speaking, listening, etc.) — cancel the check-in
  if (task) {
    task.cancel();
    task = null;
  }
});

await session.start({
  agent: voice.Agent.create({ instructions: 'You are a helpful assistant.' }),
  room: ctx.room,
});

```

#### Handling missing transcripts

VAD can detect speech that STT never turns into a transcript. This happens when the STT provider fails, when the audio is unintelligible, or when the framework doesn't send audio to STT, for example during acoustic echo cancellation (AEC) warmup. Without a transcript, the agent waits silently for a turn that never completes.

Set `transcription_timeout` and listen for the [`user_transcription_timeout`](https://docs.livekit.io/reference/agents/events.md#user_transcription_timeout) event to recover. The event includes the total duration of speech without a transcript, so you can ignore short sounds such as coughs or door slams and prompt the user to repeat themselves otherwise. This feature requires both VAD and STT.

**Python**:

```python
from livekit.agents import (
    Agent, AgentSession, JobContext, UserTranscriptionTimeoutEvent, inference,
)
from livekit.plugins import silero

# ctx is the JobContext from the entrypoint function
session = AgentSession(
    vad=silero.VAD.load(),
    stt=inference.STT("deepgram/nova-3"),
    llm=inference.LLM("openai/gpt-4.1-mini"),
    tts=inference.TTS("fishaudio/s2.1-pro"),
    transcription_timeout=5.0,  # seconds to wait for a transcript after speech ends
)

@session.on("user_transcription_timeout")
def on_user_transcription_timeout(ev: UserTranscriptionTimeoutEvent):
    # Ignore short sounds that VAD picks up as speech
    if ev.speech_duration < 0.7:
        return

    session.generate_reply(
        instructions="Tell the user you didn't catch that and ask them to repeat it."
    )

await session.start(
    agent=Agent(instructions="You are a helpful assistant."),
    room=ctx.room,
)

```

---

**Node.js**:

```typescript
import { type JobContext, voice, inference } from '@livekit/agents';
import * as silero from '@livekit/agents-plugin-silero';

// ctx is the JobContext from the entry function
const session = new voice.AgentSession({
  vad: await silero.VAD.load(),
  stt: new inference.STT({ model: 'deepgram/nova-3' }),
  llm: new inference.LLM({ model: 'openai/gpt-4.1-mini' }),
  tts: new inference.TTS({ model: 'fishaudio/s2.1-pro' }),
  transcriptionTimeout: 5000, // milliseconds to wait for a transcript after speech ends
});

session.on(voice.AgentSessionEventTypes.UserTranscriptionTimeout, (ev) => {
  // Ignore short sounds that VAD picks up as speech
  if (ev.speechDuration < 700) {
    return;
  }

  session.generateReply({
    instructions: "Tell the user you didn't catch that and ask them to repeat it.",
  });
});

await session.start({
  agent: voice.Agent.create({ instructions: 'You are a helpful assistant.' }),
  room: ctx.room,
});

```

### Text processing

Control how [text](https://docs.livekit.io/agents/multimodality/text.md) is processed:

- `tts_text_transforms`: Transforms to apply to TTS input text. Built-in transforms include `"filter_markdown"` and `"filter_emoji"`, and you can add custom callable transforms. Set to `None` to turn off. When not given, all built-in filters are applied by default. To learn more, see [Text transforms](https://docs.livekit.io/agents/multimodality/text.md#text-transforms).
- `use_tts_aligned_transcript`: Whether to use TTS-aligned transcript as input for the transcription node. Only applies if the TTS supports aligned transcripts. Default: turned off.

### Video sampling

Available in:
- [ ] Node.js
- [x] Python

Control video frame processing:

- `video_sampler`: Custom video sampler, or `None` to disable sampling. When not given, uses `VoiceActivityVideoSampler`.
- `VoiceActivityVideoSampler`: The default sampler. Varies the frame rate based on the session's `user_state`, capturing more frequently while the user is speaking and less frequently during silence. Construct it directly to override the defaults:

- `speaking_fps`: Target frames per second while the user is speaking. Default: `1.0`.
- `silent_fps`: Target frames per second while the user is silent. Set to `0` to drop all frames during silence. Default: `0.3`.

### Other options

`userdata`: Arbitrary per-session user data accessible via `session.userdata`. To learn more, see [Passing state](https://docs.livekit.io/agents/logic/agents-handoffs.md#passing-state).

## rtc_session options

The following optional parameters are available when you define your entrypoint function using the `rtc_session` decorator:

- `agent_name`: Name of agent for agent dispatch. If this is set, the agent must be explicitly dispatched to a room. To learn more, see [Agent dispatch](https://docs.livekit.io/agents/server/agent-dispatch.md).
- `type`: Agent server type determines when a new instance of the agent is created: for each room or for each publisher in a room. To learn more, see [Agent server type](https://docs.livekit.io/agents/server/options.md#servertype).
- `on_session_end`: Callback function to be called when the session ends. To learn more, see [Session reports](https://docs.livekit.io/testing/observability/data.md#session-reports).
- `on_request`: Callback function to be called when a new request is received. To learn more, see [Request handler](https://docs.livekit.io/agents/server/options.md#request-handler).

## RoomIO

Communication between agent and user participants happens using media streams, also known as tracks. For voice AI apps, this is primarily audio, but can include vision. By default, track management is handled by `RoomIO`, a utility class that serves as a bridge between the agent session and the LiveKit room. When an AgentSession is initiated, it automatically creates a `RoomIO` object that enables all room participants to subscribe to available audio tracks.

When starting an `AgentSession`, you can configure how the session interacts with the LiveKit room by passing `room_options` to the `start()` method. These options control media track management, participant linking, and I/O behavior.

### Linked participant

In a session, an agent interacts with a specific _linked participant_. By default, the linked participant is the first participant to join a room. You can manually set or change the linked participant using the following methods:

- Pass the participant identity to the `RoomIO` constructor when creating the session. This requires a custom `RoomIO` object to be created. To learn more, see [Custom RoomIO](#custom-roomio).
- Set `participant_identity` in `RoomOptions` (or `RoomInputOptions` in Node.js). To learn more, see [Participant management](#participant-management).
- Call `RoomIO.set_participant()` within a session to change the linked participant dynamically.

#### Identifying the linked participant

Available in:
- [ ] Node.js
- [x] Python

In the default case, the linked participant is the first participant to join a room. You can identify the linked participant using the `session.room_io.linked_participant` property after starting the session:

**Python**:

```python

await session.start(
    # ... agent, room, room_options, etc.
)

participant = session.room_io.linked_participant

```

### Room options

Configure how the agent interacts with room participants using `RoomOptions`. The following sections describe available options for input and output configuration.

> ℹ️ **Python and Node.js differences**
> 
> In Python, as of the 1.3.1 release, a unified `RoomOptions` class is used to configure both input and output options for the session. In Node.js, `RoomInputOptions` and `RoomOutputOptions` are still supported.

#### In this section

The following sections describe the available room options:

| Component | Description | Use cases |
| [Input options](#input-options) | Configure input options for text, audio, and video. | Enable noise cancellation, pre-connect audio, or configure additional audio input options. Enable video input, add a callback function for text input, or disable text input entirely. |
| [Output options](#output-options) | Configure output options for text and audio. | Set transcription options, disable audio output, or set audio output sample rate, number of channels, and track options. |
| [Participant management](#participant-management) | Configure participant management options. | Configure the types of participants an agent can interact with and set the linked participant for the session. |
| [Clean up options](#clean-up-options) | Configure options for cleaning up session and room. | Close the session when linked participant leaves or automatically delete the room on session end. |

#### Input options

The following sections describe the available input options for [text](#text-input), [audio](#audio-input), and [video](#video-input).

##### Text input options

To enable or turn off text input, set the following parameter to `True` or `False`.

**Python**:

`RoomOptions.text_input`

---

**Node.js**:

`RoomInputOptions.textEnabled`

###### Text input callback

By default, text input interrupts the agent and generates a reply. You can customize this behavior by adding a callback function to handle text input. To learn more, see [Custom handling](https://docs.livekit.io/agents/multimodality/text.md#custom-handling) of text input.

##### Audio input options

To enable or turn off audio input, set the following parameter to `True` or `False`.

**Python**:

`RoomOptions.audio_input`

---

**Node.js**:

`RoomInputOptions.audioEnabled`

Additional options for audio input are available using the `AudioInputOptions` object (Python) or `RoomInputOptions.audioOptions` (Node.js):

- [Noise cancellation](https://docs.livekit.io/transport/media/noise-cancellation.md#agents) options: Reduce background noise in incoming audio.
- [Automatic gain control](https://docs.livekit.io/agents/multimodality/audio.md#agc) options (Python only): Normalize input audio levels. Enabled by default.
- [Pre-connect audio](https://docs.livekit.io/agents/multimodality/audio.md#instant-connect) options (Python Agent SDK only): Buffer audio prior to connection to reduce perceived latency.

For a full list of audio input options, see the reference documentation:

**Python**:

[AudioInputOptions](https://docs.livekit.io/reference/python/livekit/agents/voice/room_io/index.html.md#livekit.agents.voice.room_io.AudioInputOptions)

---

**Node.js**:

[RoomInputOptions.audioOptions](https://docs.livekit.io/reference/agents-js/interfaces/agents.voice.RoomInputOptions.html.md#audiooptions)

##### Video input options

To enable or turn off video input, set the following parameter to `True` or `False`. By default, video input is disabled.

**Python**:

`RoomOptions.video_input`

---

**Node.js**:

`RoomInputOptions.videoEnabled`

#### Output options

The following sections describe the available output options for text and audio.

##### Text output options

To enable or turn off text output, set the following parameter to `True` or `False`. By default, text output is enabled.

**Python**:

`RoomOptions.text_output`

---

**Node.js**:

`RoomOutputOptions.transcriptionEnabled`

###### Transcription options

By default, audio and text output are both enabled and a transcription is emitted in sync with the audio. You can turn off transcriptions or customize this behavior. To learn more, see [Transcriptions](https://docs.livekit.io/agents/multimodality/text.md#transcriptions).

##### Audio output options

To enable or turn off audio output, set the following parameter to `True` or `False`. By default, audio output is enabled.

**Python**:

`RoomOptions.audio_output`

---

**Node.js**:

`RoomOutputOptions.audioEnabled`

For additional audio output options, see the reference documentation:

**Python**:

[AudioOutputOptions](https://docs.livekit.io/reference/python/livekit/agents/voice/room_io/index.html.md#livekit.agents.voice.room_io.AudioOutputOptions)

---

**Node.js**:

[RoomOutputOptions.audioOptions](https://docs.livekit.io/reference/agents-js/interfaces/agents.voice.RoomOutputOptions.html.md#audiooptions)

#### Participant management

Use the following parameters to configure which types of participants your agent can interact with.

- **`participant_kinds`** _(list<rtc.ParticipantKind.ValueType>)_ (optional) - Default: `[rtc.ParticipantKind.PARTICIPANT_KIND_SIP, rtc.ParticipantKind.PARTICIPANT_KIND_STANDARD]`: List of [participant types](https://docs.livekit.io/intro/basics/rooms-participants-tracks/participants.md#types-of-participants) accepted for auto subscription. The list determines which types of participants can be linked to the session. By default, includes `SIP`, `STANDARD`, and `CONNECTOR` participants.

- **`participant_identity`** _(string)_ (optional) - Default: `None`: The participant identity to link to. The linked participant is the one the agent listens and responds to. By default, links to the first participant that joins the room. You can override this in the `RoomIO` constructor or by using `RoomIO.set_participant()`.

#### Clean up options

Use the following parameters to configure cleanup options for session and room.

##### Close when participant leaves

An `AgentSession` is associated with a specific participant in a LiveKit room. This participant is the _linked participant_ for the session. By default, the session automatically closes when the linked participant leaves the room for any of the following reasons:

- `CLIENT_INITIATED`: User initiated the disconnect.
- `ROOM_DELETED`: Delete room API was called.
- `USER_REJECTED`: Call was rejected by the user (for example, the line was busy).

You can leave the session open by turning this behavior off using the following parameter:

**Python**:

`RoomOptions.close_on_disconnect`

---

**Node.js**:

`RoomInputOptions.closeOnDisconnect`

##### Delete room when session ends

Available in:
- [ ] Node.js
- [x] Python

You can automatically delete the room on session end by setting the `delete_room_on_close` parameter to `True`. By default, after the last participant leaves a room, it remains open for a grace period specified by `departure_timeout` set on the [room](https://docs.livekit.io/reference/other/roomservice-api.md#room). Enabling `delete_room_on_close` ensures the room is deleted immediately after the session ends.

- **`delete_room_on_close`** _(bool)_ (optional) - Default: `False`: Whether to delete the room on session end. Default: `False`.

### Example usage

**Python**:

```python
from livekit.agents import room_io
from livekit.plugins import noise_cancellation


room_options=room_io.RoomOptions(
    video_input=True,
    audio_input=room_io.AudioInputOptions(
        noise_cancellation=noise_cancellation.BVC(),
    ),
    text_output=room_io.TextOutputOptions(
        sync_transcription=False,
    ),
    participant_identity="user_123",
)

await session.start(
    agent=my_agent,
    room=room,
    room_options=room_options,
)

```

---

**Node.js**:

In the Node.js Agents framework, room configuration uses separate `inputOptions` and `outputOptions` parameters instead of a unified `RoomOptions` object. For the complete interface definitions and default values, refer to the [RoomIO source code](https://github.com/livekit/agents-js/blob/main/agents/src/voice/room_io/room_io.ts).

When calling `session.start()`, pass `inputOptions` and `outputOptions` as separate parameters:

```typescript
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';

// ... session and agentsetup

await session.start({
  room: ctx.room,
  agent: myAgent,
  inputOptions: {
    textEnabled: true,
    audioEnabled: true,
    videoEnabled: true,
    noiseCancellation: BackgroundVoiceCancellation(),
    participantIdentity: "user_123",
  },
  outputOptions: {
    syncTranscription: false,
  },
});

```

To learn more about publishing audio and video, see the following topics:

- **[Agent speech and audio](https://docs.livekit.io/agents/multimodality/audio.md)**: Add speech, audio, and background audio to your agent.

- **[Vision](https://docs.livekit.io/agents/multimodality/vision.md)**: Give your agent the ability to see images and live video.

- **[Text and transcription](https://docs.livekit.io/agents/multimodality/text.md)**: Send and receive text messages and transcription to and from your agent.

- **[Realtime media](https://docs.livekit.io/transport/media.md)**: Tracks are a core LiveKit concept. Learn more about publishing and subscribing to media.

- **[Camera and microphone](https://docs.livekit.io/transport/media/publish.md)**: Use the LiveKit SDKs to publish audio and video tracks from your user's device.

### Custom RoomIO

For greater control over media sharing in a room, you can create a custom `RoomIO` object. For example, you might want to manually control which input and output devices are used, or to control which participants an agent listens to or responds to.

To replace the default one created in `AgentSession`, create a `RoomIO` object in your entrypoint function and pass it an instance of the `AgentSession` in the constructor. For examples, see the following in the repository:

- **[Push-to-talk](https://docs.livekit.io/agents/logic/turns.md#manual)**: Create a push-to-talk interface with manual turn control.

- **[Toggling audio](https://docs.livekit.io/agents/multimodality/text.md#toggle-audio)**: Toggle audio input and output in a hybrid session.

---

This document was rendered at 2026-10-24T20:20:08.018Z.
For the latest version of this document, see [https://docs.livekit.io/agents/logic/sessions.md](https://docs.livekit.io/agents/logic/sessions.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).

<!-- ================================================================ -->
## Page: https://docs.livekit.io/agents/models.md

LiveKit docs › Build Agents › Models › Overview

---

# Models overview

> Choose the right AI models for your voice agent.

## Overview

Voice agents require one or more AI models to provide understanding, intelligence, and speech. You can choose to use a high-performance STT-LLM-TTS voice pipeline constructed from multiple specialized models, or to use a realtime model with direct speech-to-speech capabilities. For a comparison of these pipeline types and guidance on when to use each one, see [Pipeline types](https://docs.livekit.io/agents/models/pipelines.md).

LiveKit Agents includes support for a wide variety of AI providers, from the largest research companies to emerging startups. You can use LiveKit Inference to access many of these models [directly through LiveKit Cloud](#inference), or you can use the open source [plugins](#plugins) to connect directly to a wider range of model providers.

## LiveKit Inference

LiveKit Inference provides access to many of the best models and providers for voice agents, including STT, LLM, TTS, and realtime models from OpenAI, Google, AssemblyAI, Deepgram, Cartesia, Inworld, and more. LiveKit Inference is included with LiveKit Cloud and doesn't require additional plugins. It's [zero data retention](https://docs.livekit.io/agents/models/inference.md#zero-data-retention) by default, so your prompts, audio, and model outputs are never stored or used to train models.

- **[LiveKit Inference](https://docs.livekit.io/agents/models/inference.md)**: Access STT, LLM, TTS, and realtime models.

## Plugins

LiveKit Agents includes a large ecosystem of open source plugins for a variety of AI providers. Each plugin is designed to support a single provider, but may cover a range of functionality depending on the provider. For instance, the OpenAI plugin includes support for OpenAI language models, speech, transcription, and the GPT-Live and Realtime API speech-to-speech models.

For Python, the plugins are offered as optional dependencies on the base SDK. For instance, to install the SDK with the OpenAI plugin, run the following command:

```shell
uv add "livekit-agents[openai]~=1.8"

```

For Node.js, the plugins are offered as individual packages. For instance, to install the OpenAI plugin, use the following command:

```shell
pnpm add "@livekit/agents-plugin-openai@1.x"

```

Each plugin requires that you have your own account with the provider, as well as an API key or other credentials. You can find authentication instructions in the documentation for each individual plugin.

### OpenAI API compatibility

Many providers have standardized around the OpenAI API format for chat completions and more. Support for a number of these providers is included out-of-the-box with the OpenAI plugin, and you can find specific instructions in the associated documentation. For any provider not included, you can override the API key and base URL at initialization for the LLM, STT, and TTS interfaces in the plugin.

> ❗ **API Mode for OpenAI-Compatible Endpoints**
> 
> When using OpenAI-compatible endpoints (providers with custom `base_url`), confirm you're using the API mode that matches the implementation, as mode choice varies by provider. See [API modes](https://docs.livekit.io/agents/models/llm/openai.md#api-modes) for more information.

**Python**:

```python
from livekit.plugins import openai
import os

session = AgentSession(
   llm=openai.LLM(
      model="model-name", 
      base_url="https://api.provider.com/v1", 
      api_key=os.getenv("PROVIDER_API_KEY")
   ),
    # ... stt, tts, etc ...
)

```

---

**Node.js**:

```typescript
import * as openai from '@livekit/agents-plugin-openai';

const session = new voice.AgentSession({
   llm: openai.LLM({ 
      model: "model-name", 
      baseURL: "https://api.provider.com/v1", 
      apiKey: process.env.PROVIDER_API_KEY
   }),
   // ... stt, tts, etc ...
});

```

### Contributing

The LiveKit Agents plugin framework is extensible and community-driven. Your plugin can integrate with new providers or directly load models for local inference. LiveKit especially welcomes new TTS, STT, and LLM plugins.

To learn more, see the guidelines for contributions to the [Python](https://github.com/livekit/agents/?tab=contributing-ov-file) and [Node.js](https://github.com/livekit/agents-js/?tab=contributing-ov-file) SDKs.

## Usage

Use models with the `AgentSession` class. This class accepts models in the `stt`, `tts`, and `llm` arguments. For LiveKit Inference models, use the `inference` module classes. For plugin models, use the plugin classes directly.

For instance, a simple `AgentSession` built on LiveKit Inference might look like the following:

**Python**:

```python
from livekit.agents import AgentSession, inference

session = AgentSession(
    stt=inference.STT(
        model="deepgram/flux-general",
        language="en"
    ),
    llm=inference.LLM(
        model="google/gemma-4-31b-it",
    ),
    tts="fishaudio/s2.1-pro:fa4c9eb3dccc4806b382b40d61c6b10a",
)

```

---

**Node.js**:

```typescript
import { AgentSession, inference } from '@livekit/agents';

const session = new AgentSession({
    stt: new inference.STT({
        model: "deepgram/flux-general",
        language: "en"
    }),
    llm: new inference.LLM({
        model: "google/gemma-4-31b-it",
    }),
    tts: "fishaudio/s2.1-pro:fa4c9eb3dccc4806b382b40d61c6b10a",
});

```

To use plugins instead, you can configure it like this:

**Python**:

```python
from livekit.agents import AgentSession
from livekit.plugins import openai, cartesia, assemblyai

# Use Responses API (recommended for direct OpenAI usage)
session = AgentSession(
    llm=openai.responses.LLM(model="gpt-5.3-chat-latest"),
    tts=cartesia.TTS(model="sonic-3", voice="9626c31c-bec5-4cca-baa8-f8ba9e84c8bc"),
    stt=assemblyai.STT(language="en"),
)

```

---

**Node.js**:

```typescript
import { AgentSession } from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';
import * as cartesia from '@livekit/agents-plugin-cartesia';
import * as assemblyai from '@livekit/agents-plugin-assemblyai';

const session = new AgentSession({
    llm: new openai.responses.LLM({ model: "gpt-5.3-chat-latest" }),
    tts: new cartesia.TTS({ model: "sonic-3", voice: "9626c31c-bec5-4cca-baa8-f8ba9e84c8bc" }),
    stt: new assemblyai.STT({ language: "en" }),
});

```

You can use a combination of LiveKit Inference and plugins to build your voice agent. Additionally, you can change models during a session to optimize for different use cases or conversation phases. For more information, see [Workflows](https://docs.livekit.io/agents/logic/workflows.md).

## In this section

The following guides cover all models available in LiveKit Agents, both through LiveKit Inference and additional plugins. Refer to these guides for model availability, configuration options, and usage instructions.

- **[LiveKit Inference](https://docs.livekit.io/agents/models/inference.md)**: Access STT, LLM, TTS, and realtime models.

- **[Large language models (LLM)](https://docs.livekit.io/agents/models/llm.md)**: Chat and reasoning models from the largest research companies and emerging startups.

- **[Speech-to-text (STT)](https://docs.livekit.io/agents/models/stt.md)**: Transcription models from providers including Deepgram and AssemblyAI.

- **[Text-to-speech (TTS)](https://docs.livekit.io/agents/models/tts.md)**: Speech models and custom voices from providers including Cartesia and Fish Audio.

- **[Realtime models](https://docs.livekit.io/agents/models/realtime.md)**: Speech-to-speech models including OpenAI GPT Realtime and GPT-Live, Gemini Live, and SpaceXAI Grok Voice, available through LiveKit Inference.

- **[Virtual avatars](https://docs.livekit.io/agents/models/avatar.md)**: Realtime video avatars from providers including Anam and Tavus.

---

This document was rendered at 2026-10-24T20:20:10.291Z.
For the latest version of this document, see [https://docs.livekit.io/agents/models.md](https://docs.livekit.io/agents/models.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).

<!-- ================================================================ -->
## Page: https://docs.livekit.io/agents/models/llm.md

LiveKit docs › Build Agents › Models › LLM › Overview

---

# Large language models (LLM) overview

> Conversational intelligence for your voice agents.

## Overview

The core reasoning, response, and orchestration of your voice agent is powered by an LLM. You can choose between a variety of models to balance performance, accuracy, and cost. In a voice agent, your LLM receives a transcript of the user's speech from an [STT](https://docs.livekit.io/agents/models/stt.md) model, and produces a text response which is turned into speech by a [TTS](https://docs.livekit.io/agents/models/tts.md) model.

You can choose a model served through LiveKit Inference, included with LiveKit Cloud. With LiveKit Inference, your agent runs on LiveKit's infrastructure to minimize latency. No separate provider API key is required, and usage and rate limits are managed through LiveKit Cloud. Use the plugin instead if you prefer to manage billing and rate limits yourself, or need access to a provider not currently available through LiveKit Inference.

### LiveKit Inference

The following models are available in [LiveKit Inference](https://docs.livekit.io/agents/models.md#inference). Refer to the guide for each model for more details on additional configuration options.

> ℹ️ **Recommended for voice agents**
> 
> [Gemma 4 31B](https://docs.livekit.io/agents/models/llm/livekit.md) is the recommended default LLM. It's a latency-optimized, open-weight model served on LiveKit's infrastructure.

A checkmark in the **EU endpoint** column in the following tables means the model has a dedicated EU endpoint, in addition to the global endpoint. To learn more, see [Data residency](https://docs.livekit.io/agents/models/inference.md#data-residency).

#### [DeepSeek](https://docs.livekit.io/agents/models/llm/deepseek.md)

| Model name | Model ID | EU endpoint |
| ---------- | -------- | ------ |
| DeepSeek-V4 Pro | `deepseek-ai/deepseek-v4-pro` |  |
| DeepSeek-V4.1 Flash | `deepseek-ai/deepseek-v4.1-flash` |  |
| DeepSeek-V3 | `deepseek-ai/deepseek-v3` **RETIRED** (retired May 1, 2026; use `openai/gpt-oss-120b`) |  |
| DeepSeek-V3.1 | `deepseek-ai/deepseek-v3.1` **RETIRED** (retired June 17, 2026; use `deepseek-ai/deepseek-v4-pro`) |  |
| DeepSeek-V3.2 | `deepseek-ai/deepseek-v3.2` **RETIRED** (retired March 7, 2026) |  |

#### [Gemini](https://docs.livekit.io/agents/models/llm/gemini.md)

| Model name | Model ID | EU endpoint |
| ---------- | -------- | ------ |
| Gemini 3 Flash | `google/gemini-3-flash-preview` |  |
| Gemini 3.1 Flash Lite | `google/gemini-3.1-flash-lite` | ✓ |
| Gemini 3.1 Pro | `google/gemini-3.1-pro-preview` |  |
| Gemini 3.5 Flash | `google/gemini-3.5-flash` | ✓ |
| Gemini 3.5 Flash Lite | `google/gemini-3.5-flash-lite` | ✓ |
| Gemini 3.8 Flash | `google/gemini-3.8-flash` | ✓ |
| Gemini 4 Argon | `google/gemini-4-argon` |  |
| Gemini 2.5 Flash | `google/gemini-2.5-flash` **DEPRECATED** (retires October 20, 2026; use `google/gemma-4-31b-it`) | ✓ |
| Gemini 2.5 Flash-Lite | `google/gemini-2.5-flash-lite` **DEPRECATED** (retires October 20, 2026; use `google/gemma-4-31b-it`) | ✓ |
| Gemini 3.6 Flash | `google/gemini-3.6-flash` **DEPRECATED** (retires November 19, 2026; use `google/gemini-3.8-flash`) | ✓ |
| Gemini 3.7 Flash | `google/gemini-3.7-flash` **DEPRECATED** (retires January 28, 2027; use `google/gemini-3.8-flash`) | ✓ |
| Gemini 2.0 Flash | `google/gemini-2.0-flash` **RETIRED** (retired February 13, 2026; use `google/gemma-4-31b-it`) |  |
| Gemini 2.0 Flash-Lite | `google/gemini-2.0-flash-lite` **RETIRED** (retired February 13, 2026; use `google/gemma-4-31b-it`) |  |
| Gemini 2.5 Pro | `google/gemini-2.5-pro` **RETIRED** (retired October 10, 2026; use `google/gemini-3.8-flash`) | ✓ |
| Gemini 3 Pro | `google/gemini-3-pro-preview` **RETIRED** (retired March 9, 2026; use `google/gemini-3.1-pro-preview`) |  |

#### [Gemma](https://docs.livekit.io/agents/models/llm/livekit.md)

| Model name | Model ID | EU endpoint |
| ---------- | -------- | ------ |
| Gemma 4 31B | `google/gemma-4-31b-it` | ✓ |

#### [Kimi](https://docs.livekit.io/agents/models/llm/kimi.md)

| Model name | Model ID | EU endpoint |
| ---------- | -------- | ------ |
| Kimi K2.6 | `moonshotai/kimi-k2.6` |  |
| Kimi K2 Instruct | `moonshotai/kimi-k2-instruct` **RETIRED** (retired March 7, 2026) |  |
| Kimi K2.5 | `moonshotai/kimi-k2.5` **RETIRED** (retired July 23, 2026; use `moonshotai/kimi-k2.6`) |  |

#### [OpenAI](https://docs.livekit.io/agents/models/llm/openai.md)

| Model name | Model ID | EU endpoint |
| ---------- | -------- | ------ |
| ChatGPT Latest | `openai/chat-latest` |  |
| GPT-4.1 | `openai/gpt-4.1` | ✓ |
| GPT-4.1 mini | `openai/gpt-4.1-mini` | ✓ |
| GPT-4.1 nano | `openai/gpt-4.1-nano` | ✓ |
| GPT-4o | `openai/gpt-4o` | ✓ |
| GPT-4o mini | `openai/gpt-4o-mini` | ✓ |
| GPT-5 | `openai/gpt-5` | ✓ |
| GPT-5 mini | `openai/gpt-5-mini` | ✓ |
| GPT-5 nano | `openai/gpt-5-nano` | ✓ |
| GPT-5.2 | `openai/gpt-5.2` | ✓ |
| GPT-5.4 | `openai/gpt-5.4` | ✓ |
| GPT-5.4 mini | `openai/gpt-5.4-mini` | ✓ |
| GPT-5.5 | `openai/gpt-5.5` | ✓ |
| GPT-5.6 Luna | `openai/gpt-5.6-luna` | ✓ |
| GPT-5.6 Sol | `openai/gpt-5.6-sol` | ✓ |
| GPT-5.6 Terra | `openai/gpt-5.6-terra` | ✓ |
| GPT-6 Luna | `openai/gpt-6-luna` | ✓ |
| GPT-6 Sol | `openai/gpt-6-sol` | ✓ |
| GPT OSS 120B | `openai/gpt-oss-120b` |  |
| GPT-5.1 | `openai/gpt-5.1` **DEPRECATED** (retires April 1, 2027; use `openai/gpt-6-sol`) | ✓ |
| GPT-5.4 nano | `openai/gpt-5.4-nano` **DEPRECATED** (retires April 1, 2027; use `openai/gpt-6-luna`) | ✓ |
| GPT-5.1 Chat | `openai/gpt-5.1-chat-latest` **RETIRED** (retired June 19, 2026; use `openai/chat-latest`) |  |
| GPT-5.2 Chat | `openai/gpt-5.2-chat-latest` **RETIRED** (retired June 19, 2026; use `openai/chat-latest`) |  |
| GPT-5.3 Chat | `openai/gpt-5.3-chat-latest` **RETIRED** (retired June 19, 2026; use `openai/gpt-6-sol`) |  |

#### [SpaceXAI](https://docs.livekit.io/agents/models/llm/spacexai.md)

| Model name | Model ID | EU endpoint |
| ---------- | -------- | ------ |
| Grok 4.20 | `xai/grok-4.20-0309-non-reasoning` |  |
| Grok 4.20 Reasoning | `xai/grok-4.20-0309-reasoning` |  |
| Grok 4.20 Multi-Agent | `xai/grok-4.20-multi-agent-0309` |  |
| Grok 4.3 | `xai/grok-4.3` |  |
| Grok 4.5 | `xai/grok-4.5` |  |
| Grok 4.6 | `xai/grok-4.6` |  |
| Grok 4.7 | `xai/grok-4.7` |  |
| Grok 4.1 Fast | `xai/grok-4-1-fast-non-reasoning` **RETIRED** (retired August 15, 2026; use `xai/grok-4.3`) |  |
| Grok 4.1 Fast Reasoning | `xai/grok-4-1-fast-reasoning` **RETIRED** (retired August 15, 2026; use `xai/grok-4.3`) |  |

> ⚠️ **Retired models**
> 
> Retired models are no longer accessible. If you're using a retired model, switch to a currently available model.

### Plugins

The LiveKit Agents framework also includes a variety of open source [plugins](https://docs.livekit.io/agents/models.md#plugins) for a wide range of LLM providers. Plugins are especially useful if you need custom or fine-tuned models. These plugins require authentication with the provider yourself, usually via an API key. You are responsible for setting up your own account and managing your own billing and credentials. The plugins are listed below, along with their availability for Python or Node.js.

| Provider | Python | Node.js |
| -------- | ------ | ------- |
| [Amazon Bedrock](https://docs.livekit.io/agents/models/llm/aws.md) | ✓ | — |
| [Anthropic](https://docs.livekit.io/agents/models/llm/anthropic.md) | ✓ | ✓ |
| [Baseten](https://docs.livekit.io/agents/models/llm/baseten.md) | ✓ | — |
| [Google Gemini](https://docs.livekit.io/agents/models/llm/gemini.md) | ✓ | ✓ |
| [Groq](https://docs.livekit.io/agents/models/llm/groq.md) | ✓ | ✓ |
| [LangChain](https://docs.livekit.io/agents/models/llm/langchain.md) | ✓ | — |
| [Mistral AI](https://docs.livekit.io/agents/models/llm/mistralai.md) | ✓ | ✓ |
| [Sarvam](https://docs.livekit.io/agents/models/llm/sarvam.md) | ✓ | — |
| [OpenAI](https://docs.livekit.io/agents/models/llm/openai.md) | ✓ | ✓ |
| [Azure OpenAI](https://docs.livekit.io/agents/models/llm/azure-openai.md) | ✓ | ✓ |
| [Cerebras](https://docs.livekit.io/agents/models/llm/cerebras.md) | ✓ | ✓ |
| [DeepSeek](https://docs.livekit.io/agents/models/llm/deepseek.md) | ✓ | ✓ |
| [Fireworks](https://docs.livekit.io/agents/models/llm/fireworks.md) | ✓ | ✓ |
| [Letta](https://docs.livekit.io/agents/models/llm/letta.md) | ✓ | — |
| [Ollama](https://docs.livekit.io/agents/models/llm/ollama.md) | ✓ | ✓ |
| [OpenRouter](https://docs.livekit.io/agents/models/llm/openrouter.md) | ✓ | — |
| [OVHCloud](https://docs.livekit.io/agents/models/llm/ovhcloud.md) | ✓ | ✓ |
| [Perplexity](https://docs.livekit.io/agents/models/llm/perplexity.md) | ✓ | ✓ |
| [SpaceXAI](https://docs.livekit.io/agents/models/llm/spacexai.md) | ✓ | ✓ |
| [Telnyx](https://docs.livekit.io/agents/models/llm/telnyx.md) | ✓ | ✓ |
| [Together AI](https://docs.livekit.io/agents/models/llm/together.md) | ✓ | ✓ |

Have another provider in mind? LiveKit is open source and welcomes [new plugin contributions](https://docs.livekit.io/agents/models.md#contribute).

## Usage

To set up an LLM in an `AgentSession`, provide the model ID to the `llm` argument. LiveKit Inference manages the connection to the model automatically. Consult the [models list](#inference) for available models.

**Python**:

```python
from livekit.agents import AgentSession, inference

session = AgentSession(
    llm=inference.LLM(model="google/gemma-4-31b-it"),
)

```

---

**Node.js**:

```typescript
import { AgentSession, inference } from '@livekit/agents';

const session = new AgentSession({
    llm: new inference.LLM({ model: "google/gemma-4-31b-it" }),
});

```

### Model parameters

The `LLM` class from the `inference` module lets you configure additional model parameters via `extra_kwargs` (Python) or `modelOptions` (Node.js). For the full parameter reference, see [Inference LLM parameters](https://docs.livekit.io/reference/agents/inference-llm-parameters.md) or your [model's](#inference) documentation. These options can also be [updated at runtime](https://docs.livekit.io/reference/agents/inference-llm-parameters.md#updating-options-at-runtime) without rebuilding the LLM.

## Advanced features

The following sections cover more advanced topics common to all LLM providers. For more detailed reference on individual provider configuration, consult the model reference or plugin documentation for that provider.

### Custom LLM

To create an entirely custom LLM, implement the [LLM node](https://docs.livekit.io/agents/build/nodes.md#llm_node) in your agent.

### Standalone usage

You can use an `LLM` instance as a standalone component with its streaming interface. It expects a [`ChatContext`](https://docs.livekit.io/agents/logic/chat-context.md) object, which contains the conversation history. The return value is a stream of `ChatChunk` objects. This interface is the same across all LLM providers, regardless of their underlying API design:

```python
from livekit.agents import ChatContext
from livekit.plugins import openai

# Use Responses API (recommended for direct OpenAI usage)
llm = openai.responses.LLM(model="gpt-4o-mini")

chat_ctx = ChatContext()
chat_ctx.add_message(role="user", content="Hello, this is a test message!")

async with llm.chat(chat_ctx=chat_ctx) as stream:
    async for chunk in stream:
        print("Received chunk:", chunk.delta)

```

#### Collecting the response

Available in:
- [x] Node.js
- [x] Python

`LLMStream` provides a `collect()` convenience method that awaits the full response and returns a `CollectedResponse` with `text`, `tool_calls` (`toolCalls` in Node.js), `usage`, and `extra` fields. It's useful for background tasks, pre-processing, or any workflow that needs LLM output outside of the voice pipeline, for example, [summarizing conversation history before a handoff](https://docs.livekit.io/agents/logic/agents-handoffs.md#summarizing-context).

The following example shows how to collect a full response and execute any tool calls it contains:

**Python**:

```python
import asyncio

from dotenv import load_dotenv
from livekit.agents import function_tool, inference, llm 

load_dotenv(".env.local")

my_llm = inference.LLM(model="google/gemma-4-31b-it")


@function_tool
async def get_weather(location: str) -> str:
    """Get the current weather for a location.

    Args:
        location: The city name to get weather for.
    """ 
    print(f"  [tool called] get_weather(location={location!r})")
    return f"The weather in {location} is sunny and 72°F."


async def main() -> None:
    tools = [get_weather]
    tool_ctx = llm.ToolContext(tools)

    chat_ctx = llm.ChatContext()
    chat_ctx.add_message(role="system", content="You are a helpful assistant.")
    chat_ctx.add_message(role="user", content="What's the weather in San Francisco?")

    # First LLM call — expect a tool call
    response = await my_llm.chat(chat_ctx=chat_ctx, tools=tools).collect()
    print(f"text: {response.text!r}")
    print(f"tool_calls: {response.tool_calls}")

    # Execute each tool call and add results to context
    for tc in response.tool_calls:
        result = await llm.execute_function_call(tc, tool_ctx)
        chat_ctx.insert(result.fnc_call)
        if result.fnc_call_out:
            chat_ctx.insert(result.fnc_call_out)

    # Second LLM call — expect a final text response
    final = await my_llm.chat(chat_ctx=chat_ctx, tools=tools).collect()
    print(f"final: {final.text!r}")


if __name__ == "__main__":
    asyncio.run(main())

```

---

**Node.js**:

```typescript
import { inference, llm } from '@livekit/agents';
import { z } from 'zod';

const myLlm = new inference.LLM({ model: 'google/gemma-4-31b-it' });

const getWeather = llm.tool({
  name: 'getWeather',
  description: 'Get the current weather for a location.',
  parameters: z.object({
    location: z.string().describe('The city name to get weather for.'),
  }),
  execute: async ({ location }) => `The weather in ${location} is sunny and 72°F.`,
});

const toolCtx = new llm.ToolContext([getWeather]);

const chatCtx = new llm.ChatContext();
chatCtx.addMessage({ role: 'system', content: 'You are a helpful assistant.' });
chatCtx.addMessage({ role: 'user', content: "What's the weather in San Francisco?" });

// First LLM call — expect a tool call
const response = await myLlm.chat({ chatCtx, toolCtx }).collect();
console.log('text:', response.text);
console.log('toolCalls:', response.toolCalls);

// Execute each tool call and add the call and its result to the context
for (const toolCall of response.toolCalls) {
  chatCtx.insert(toolCall);
  chatCtx.insert(await llm.executeToolCall(toolCall, toolCtx));
}

// Second LLM call — expect a final text response
const final = await myLlm.chat({ chatCtx, toolCtx }).collect();
console.log('final:', final.text);

```

### Vision

LiveKit Agents supports image input from URL or from [realtime video frames](https://docs.livekit.io/transport/media.md). Consult your model provider for details on compatible image types, external URL support, and other constraints. For more information, see [Images](https://docs.livekit.io/agents/multimodality/vision/images.md).

## Additional resources

The following resources cover related topics that may be useful for your application.

- **[Workflows](https://docs.livekit.io/agents/logic/workflows.md)**: How to model repeatable, accurate tasks with multiple agents.

- **[Tool definition and usage](https://docs.livekit.io/agents/build/tools.md)**: Let your agents call external tools and more.

- **[Inference pricing](https://livekit.com/pricing/inference)**: The latest pricing information for all models in LiveKit Inference.

- **[Realtime models](https://docs.livekit.io/agents/models/realtime.md)**: Realtime models like OpenAI GPT Realtime, OpenAI GPT-Live, and SpaceXAI Grok Voice.

---

This document was rendered at 2026-10-24T20:20:10.840Z.
For the latest version of this document, see [https://docs.livekit.io/agents/models/llm.md](https://docs.livekit.io/agents/models/llm.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).

<!-- ================================================================ -->
## Page: https://docs.livekit.io/agents/models/llm/anthropic.md

LiveKit docs › Build Agents › Models › LLM › Additional models › Anthropic

---

# Anthropic Claude LLM plugin guide

> How to use the Anthropic Claude LLM plugin for LiveKit Agents.

Available in:
- [x] Node.js
- [x] Python

## Overview

This plugin allows you to use the [Claude API](https://claude.com/platform/api) as an LLM provider for your voice agents.

### Installation

Install the plugin:

**Python**:

```shell
uv add "livekit-agents[anthropic]~=1.8"

```

---

**Node.js**:

```shell
pnpm add @livekit/agents-plugin-anthropic

```

### Authentication

The Anthropic plugin requires an [Anthropic API key](https://console.anthropic.com/account/keys).

Set `ANTHROPIC_API_KEY` in your `.env` file.

### Usage

Use Claude within an `AgentSession` or as a standalone LLM service. For example, you can use this LLM in the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md).

**Python**:

```python
from livekit.plugins import anthropic

session = AgentSession(
    llm=anthropic.LLM(
        model="claude-sonnet-4-6",
        temperature=0.8,
    ),
    # ... tts, stt, vad, turn_handling, etc.
)

```

---

**Node.js**:

```typescript
import { voice } from '@livekit/agents';
import * as anthropic from '@livekit/agents-plugin-anthropic';

const session = new voice.AgentSession({
    llm: new anthropic.LLM({
        model: "claude-sonnet-4-6",
        temperature: 0.8,
    }),
    // ... tts, stt, vad, turnHandling, etc.
});

```

### Parameters

This section describes some of the available parameters. See the plugin reference for [Python](https://docs.livekit.io/reference/python/livekit/plugins/anthropic/index.html.md#livekit.plugins.anthropic.LLM) or [Node.js](https://docs.livekit.io/reference/agents-js/classes/plugins_agents_plugin_anthropic.LLM.html.md) for a complete list of all available parameters.

- **`model`** _(str | ChatModels)_ (optional) - Default: `claude-sonnet-4-6`: Model to use. For a full list of available models and their API IDs, see the [Model options](https://platform.claude.com/docs/en/about-claude/models/overview).

- **`max_tokens`** _(int)_ (optional) - Default: `1024`: The maximum number of tokens to generate before stopping. To learn more, see the [Anthropic API reference](https://platform.claude.com/docs/en/api/messages/create#create.max_tokens).

In Node.js this parameter is called `maxTokens` and defaults to `4096`.

- **`temperature`** _(float)_ (optional) - Default: `1`: Sampling temperature that controls the randomness of the model's output. Higher values make the output more random, while lower values make it more focused and deterministic. Range of valid values can vary by model.

Valid values are between `0` and `1`. To learn more, see the [Anthropic API reference](https://platform.claude.com/docs/en/api/messages/create#create.temperature).

- **`parallel_tool_calls`** _(bool)_ (optional): Controls whether the model can make multiple tool calls in parallel. When enabled, the model can make multiple tool calls simultaneously, which can improve performance for complex tasks.

In Node.js this parameter is called `parallelToolCalls` and defaults to `true`.

- **`tool_choice`** _(ToolChoice | Literal['auto', 'required', 'none'])_ (optional) - Default: `auto`: Controls how the model uses tools. String options are as follows:

- `'auto'`: Let the model decide.
- `'required'`: Force tool usage.
- `'none'`: Disable tool usage.
In Node.js this parameter is called `toolChoice`.

- **`timeout`** _(httpx.Timeout | None)_ (optional) - Default: `httpx.Timeout(5.0, read=30.0)`: Available in:
- [ ] Node.js
- [x] Python

Configures connect, read, write, and pool timeouts on the underlying HTTP client. Increase `read` to accommodate very large contexts or extended thinking budgets. Ignored when `client` parameter is set.

### Provider tools

Available in:
- [ ] Node.js
- [x] Python

Anthropic supports the following [provider tools](https://docs.livekit.io/agents/logic/tools.md#provider-tools) that enable the model to use built-in capabilities executed on the model server. These tools can be used alongside function tools defined in your agent's codebase.

| Tool | Description | Parameters |
| `ComputerUse` | Enable [computer use](https://docs.anthropic.com/en/docs/agents-and-tools/computer-use) to control a desktop environment. | `display_width_px` (default: 1280), `display_height_px` (default: 720), `display_number` (default: 1), `tool_version` |

```python
from livekit.plugins import anthropic

agent = MyAgent(
    llm=anthropic.LLM(model="claude-sonnet-4-6"),
    tools=[anthropic.ComputerUse(display_width_px=1280, display_height_px=720)],  # replace with any supported provider tool
)

```

## Additional resources

The following resources provide more information about using Anthropic with LiveKit Agents.

- **[Anthropic docs](https://docs.anthropic.com/en/docs/intro-to-claude)**: Anthropic Claude docs.

- **[Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md)**: Get started with LiveKit Agents and Anthropic.

---

This document was rendered at 2026-10-24T20:20:11.273Z.
For the latest version of this document, see [https://docs.livekit.io/agents/models/llm/anthropic.md](https://docs.livekit.io/agents/models/llm/anthropic.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).

<!-- ================================================================ -->
## Page: https://docs.livekit.io/agents/models/stt.md

LiveKit docs › Build Agents › Models › STT › Overview

---

# Speech-to-text (STT) models overview

> Models and plugins for realtime transcription in your voice agents.

## Overview

STT models, also known as Automated Speech Recognition (ASR) models, are used for realtime transcription or translation of spoken audio. In voice AI, they form the first of three models in the core pipeline: text is transcribed by an STT model, then processed by an [LLM](https://docs.livekit.io/agents/models/llm.md) model to generate a response which is turned back into speech using a [TTS](https://docs.livekit.io/agents/models/tts.md) model.

You can choose a model served through LiveKit Inference, included with LiveKit Cloud. With LiveKit Inference, your agent runs on LiveKit's infrastructure to minimize latency. No separate provider API key is required, and usage and rate limits are managed through LiveKit Cloud. Use the plugin instead if you prefer to manage billing and rate limits yourself, or need access to a provider not currently available through LiveKit Inference.

### LiveKit Inference

The following models are available in [LiveKit Inference](https://docs.livekit.io/agents/models.md#inference). Refer to the guide for each model for more details on additional configuration options.

A checkmark in the **EU endpoint** column in the following tables means the model has a dedicated EU endpoint, in addition to the global endpoint. To learn more, see [Data residency](https://docs.livekit.io/agents/models/inference.md#data-residency).

#### [AssemblyAI](https://docs.livekit.io/agents/models/stt/assemblyai.md)

| Model name | Model ID | Languages | EU endpoint |
| ---------- | -------- | --------- | ------ |
| Universal-3.6 Pro | `assemblyai/universal-3-6-pro` | `en`, `en-US`, `en-GB`, `en-AU`, `en-CA`, `en-IN`, `en-NZ`, `es`, `es-ES`, `es-MX`, `es-AR`, `es-CO`, `es-CL`, `es-PE`, `es-VE`, `es-EC`, `es-GT`, `es-CU`, `es-BO`, `es-DO`, `es-HN`, `es-PY`, `es-SV`, `es-NI`, `es-CR`, `es-PA`, `es-UY`, `es-PR`, `fr`, `fr-FR`, `fr-CA`, `fr-BE`, `fr-CH`, `de`, `de-DE`, `de-AT`, `de-CH`, `it`, `it-IT`, `it-CH`, `pt`, `pt-BR`, `pt-PT`, `tr`, `nl`, `sv`, `no`, `da`, `fi`, `hi`, `vi`, `ar`, `he`, `ja`, `ur`, `zh`, `ru`, `ko`, `ca`, `gl`, `ro`, `et`, `fa`, `yue`, `af`, `mr`, `zu`, `xh`, `nn` | ✓ |
| Universal-3.5 Pro | `assemblyai/universal-3-5-pro` | `en`, `en-US`, `en-GB`, `en-AU`, `en-CA`, `en-IN`, `en-NZ`, `es`, `es-ES`, `es-MX`, `es-AR`, `es-CO`, `es-CL`, `es-PE`, `es-VE`, `es-EC`, `es-GT`, `es-CU`, `es-BO`, `es-DO`, `es-HN`, `es-PY`, `es-SV`, `es-NI`, `es-CR`, `es-PA`, `es-UY`, `es-PR`, `fr`, `fr-FR`, `fr-CA`, `fr-BE`, `fr-CH`, `de`, `de-DE`, `de-AT`, `de-CH`, `it`, `it-IT`, `it-CH`, `pt`, `pt-BR`, `pt-PT`, `tr`, `nl`, `sv`, `no`, `da`, `fi`, `hi`, `vi`, `ar`, `he`, `ja`, `ur`, `zh` | ✓ |
| Universal-Streaming | `assemblyai/universal-streaming` | `en`, `en-US` | ✓ |
| Universal-Streaming-Multilingual | `assemblyai/universal-streaming-multilingual` | `multi`, `en`, `en-US`, `en-GB`, `en-AU`, `en-CA`, `en-IN`, `en-NZ`, `es`, `es-ES`, `es-MX`, `es-AR`, `es-CO`, `es-CL`, `es-PE`, `es-VE`, `es-EC`, `es-GT`, `es-CU`, `es-BO`, `es-DO`, `es-HN`, `es-PY`, `es-SV`, `es-NI`, `es-CR`, `es-PA`, `es-UY`, `es-PR`, `fr`, `fr-FR`, `fr-CA`, `fr-BE`, `fr-CH`, `de`, `de-DE`, `de-AT`, `de-CH`, `it`, `it-IT`, `it-CH`, `pt`, `pt-BR`, `pt-PT` | ✓ |

#### [Deepgram](https://docs.livekit.io/agents/models/stt/deepgram.md)

| Model name | Model ID | Languages | EU endpoint |
| ---------- | -------- | --------- | ------ |
| Flux | `deepgram/flux-general-en` | `en` | ✓ |
| Flux (Multilingual) | `deepgram/flux-general-multi` | `multi`, `en`, `es`, `fr`, `de`, `hi`, `ru`, `pt`, `ja`, `it`, `nl` | ✓ |
| Nova-3 | `deepgram/nova-3` | `ar`, `ar-AE`, `ar-SA`, `ar-QA`, `ar-KW`, `ar-SY`, `ar-LB`, `ar-PS`, `ar-JO`, `ar-EG`, `ar-SD`, `ar-TD`, `ar-MA`, `ar-DZ`, `ar-TN`, `ar-IQ`, `ar-IR`, `be`, `bn`, `bs`, `bg`, `ca`, `hr`, `cs`, `da`, `da-DK`, `nl`, `nl-BE`, `en`, `en-US`, `en-AU`, `en-GB`, `en-IN`, `en-NZ`, `et`, `fi`, `fr`, `fr-CA`, `de`, `de-CH`, `el`, `he`, `hi`, `hu`, `id`, `it`, `ja`, `kn`, `ko`, `ko-KR`, `lv`, `lt`, `mk`, `ms`, `mr`, `no`, `fa`, `pl`, `pt`, `pt-BR`, `pt-PT`, `ro`, `ru`, `sr`, `sk`, `sl`, `es`, `es-419`, `sv`, `sv-SE`, `tl`, `ta`, `te`, `tr`, `uk`, `ur`, `vi`, `zh`, `zh-CN`, `zh-Hans`, `zh-TW`, `zh-Hant`, `zh-HK`, `multi` | ✓ |
| Nova-3 Medical | `deepgram/nova-3-medical` | `en`, `en-US`, `en-AU`, `en-CA`, `en-GB`, `en-IE`, `en-IN`, `en-NZ` | ✓ |
| Nova-3 Pharma | `deepgram/nova-3-pharma` | `en`, `en-US`, `en-AU`, `en-CA`, `en-GB`, `en-IE`, `en-IN`, `en-NZ` | ✓ |
| Nova-2 | `deepgram/nova-2` | `multi`, `bg`, `ca`, `zh`, `zh-CN`, `zh-Hans`, `zh-TW`, `zh-Hant`, `zh-HK`, `cs`, `da`, `da-DK`, `nl`, `nl-BE`, `en`, `en-US`, `en-AU`, `en-GB`, `en-NZ`, `en-IN`, `et`, `fi`, `fr`, `fr-CA`, `de`, `de-CH`, `el`, `hi`, `hu`, `id`, `it`, `ja`, `ko`, `ko-KR`, `lv`, `lt`, `ms`, `no`, `pl`, `pt`, `pt-BR`, `pt-PT`, `ro`, `ru`, `sk`, `es`, `es-419`, `sv`, `sv-SE`, `th`, `th-TH`, `tr`, `uk`, `vi` | ✓ |
| Nova-2 Conversational AI | `deepgram/nova-2-conversationalai` | `en`, `en-US` | ✓ |
| Nova-2 Medical | `deepgram/nova-2-medical` | `en`, `en-US` | ✓ |
| Nova-2 Phone Call | `deepgram/nova-2-phonecall` | `en`, `en-US` | ✓ |

#### [Cartesia](https://docs.livekit.io/agents/models/stt/cartesia.md)

| Model name | Model ID | Languages | EU endpoint |
| ---------- | -------- | --------- | ------ |
| Ink 2 | `cartesia/ink-2` | `en` | ✓ |
| Ink Whisper | `cartesia/ink-whisper` | `en`, `zh`, `de`, `es`, `ru`, `ko`, `fr`, `ja`, `pt`, `tr`, `pl`, `ca`, `nl`, `ar`, `sv`, `it`, `id`, `hi`, `fi`, `vi`, `he`, `uk`, `el`, `ms`, `cs`, `ro`, `da`, `hu`, `ta`, `no`, `th`, `ur`, `hr`, `bg`, `lt`, `la`, `mi`, `ml`, `cy`, `sk`, `te`, `fa`, `lv`, `bn`, `sr`, `az`, `sl`, `kn`, `et`, `mk`, `br`, `eu`, `is`, `hy`, `ne`, `mn`, `bs`, `kk`, `sq`, `sw`, `gl`, `mr`, `pa`, `si`, `km`, `sn`, `yo`, `so`, `af`, `oc`, `ka`, `be`, `tg`, `sd`, `gu`, `am`, `yi`, `lo`, `uz`, `fo`, `ht`, `ps`, `tk`, `nn`, `mt`, `sa`, `lb`, `my`, `bo`, `tl`, `mg`, `as`, `tt`, `haw`, `ln`, `ha`, `ba`, `jw`, `su`, `yue` |  |

#### [Gemini](https://docs.livekit.io/agents/models/stt/gemini.md)

| Model name | Model ID | Languages | EU endpoint |
| ---------- | -------- | --------- | ------ |
| Gemini 3.5 Transcribe Live | `google/gemini-3.5-transcribe-live` | `en`, `es`, `fr`, `de`, `it`, `pt`, `nl`, `pl`, `tr`, `ru`, `ar`, `hi`, `ja`, `ko`, `zh`, `id`, `th`, `vi`, `sv`, `da`, `no`, `fi`, `cs`, `el`, `he`, `uk` |  |

#### [Inworld](https://docs.livekit.io/agents/models/stt/inworld.md)

| Model name | Model ID | Languages | EU endpoint |
| ---------- | -------- | --------- | ------ |
| Inworld STT 1 | `inworld/inworld-stt-1` | `en`, `en-US` |  |

#### [OpenAI](https://docs.livekit.io/agents/models/stt/openai.md)

| Model name | Model ID | Languages | EU endpoint |
| ---------- | -------- | --------- | ------ |
| GPT-Live Transcribe | `openai/gpt-live-transcribe` | `af`, `ar`, `az`, `be`, `bg`, `bs`, `ca`, `cs`, `cy`, `da`, `de`, `el`, `en`, `es`, `et`, `fa`, `fi`, `fr`, `gl`, `he`, `hi`, `hr`, `hu`, `hy`, `id`, `is`, `it`, `iw`, `ja`, `kk`, `kn`, `ko`, `lt`, `lv`, `mi`, `mk`, `mr`, `ms`, `ne`, `nl`, `no`, `pl`, `pt`, `ro`, `ru`, `sk`, `sl`, `sr`, `sv`, `sw`, `ta`, `th`, `tl`, `tr`, `uk`, `ur`, `vi`, `zh`, `zh-cn`, `zh-tw`, `zh-hk`, `yue`, `cmn`, `fil`, `multi` |  |

#### [Speechmatics](https://docs.livekit.io/agents/models/stt/speechmatics.md)

| Model name | Model ID | Languages | EU endpoint |
| ---------- | -------- | --------- | ------ |
| Speechmatics Linden-1 | `speechmatics/linden-1` | `ar`, `ar_en`, `ba`, `be`, `bg`, `bn`, `ca`, `cmn`, `cmn_en`, `cmn_en_ms_ta`, `cs`, `cy`, `da`, `de`, `el`, `en`, `en_ms`, `en_ta`, `eo`, `es`, `et`, `eu`, `fa`, `fi`, `fr`, `ga`, `gl`, `he`, `hi`, `hr`, `hu`, `ia`, `id`, `it`, `ja`, `ko`, `lt`, `lv`, `mn`, `mr`, `ms`, `mt`, `nl`, `no`, `pl`, `pt`, `ro`, `ru`, `sk`, `sl`, `sv`, `sw`, `ta`, `th`, `tl`, `tr`, `ug`, `uk`, `ur`, `vi`, `yue` | ✓ |
| Speechmatics Enhanced | `speechmatics/enhanced` **RETIRED** (retired October 5, 2026; use `speechmatics/linden-1`) | `ar`, `ar_en`, `ba`, `be`, `bg`, `bn`, `ca`, `cmn`, `cmn_en`, `cmn_en_ms_ta`, `cs`, `cy`, `da`, `de`, `el`, `en`, `en_ms`, `en_ta`, `eo`, `es`, `et`, `eu`, `fa`, `fi`, `fr`, `ga`, `gl`, `he`, `hi`, `hr`, `hu`, `ia`, `id`, `it`, `ja`, `ko`, `lt`, `lv`, `mn`, `mr`, `ms`, `mt`, `nl`, `no`, `pl`, `pt`, `ro`, `ru`, `sk`, `sl`, `sv`, `sw`, `ta`, `th`, `tl`, `tr`, `ug`, `uk`, `ur`, `vi`, `yue` | ✓ |
| Speechmatics Standard | `speechmatics/standard` **RETIRED** (retired October 5, 2026; use `speechmatics/linden-1`) | `ar`, `ar_en`, `ba`, `be`, `bg`, `bn`, `ca`, `cmn`, `cmn_en`, `cmn_en_ms_ta`, `cs`, `cy`, `da`, `de`, `el`, `en`, `en_ms`, `en_ta`, `eo`, `es`, `et`, `eu`, `fa`, `fi`, `fr`, `ga`, `gl`, `he`, `hi`, `hr`, `hu`, `ia`, `id`, `it`, `ja`, `ko`, `lt`, `lv`, `mn`, `mr`, `ms`, `mt`, `nl`, `no`, `pl`, `pt`, `ro`, `ru`, `sk`, `sl`, `sv`, `sw`, `ta`, `th`, `tl`, `tr`, `ug`, `uk`, `ur`, `vi`, `yue` | ✓ |

#### [SpaceXAI](https://docs.livekit.io/agents/models/stt/spacexai.md)

| Model name | Model ID | Languages | EU endpoint |
| ---------- | -------- | --------- | ------ |
| Speech to Text | `xai/stt-1` | `en`, `ar`, `cs`, `da`, `nl`, `fr`, `de`, `hi`, `id`, `it`, `ja`, `ko`, `ms`, `fa`, `pl`, `pt`, `ro`, `ru`, `es`, `sv`, `th`, `tr`, `vi`, `fil`, `mk` | ✓ |
| Speech to Text 2 | `xai/stt-2` | `en`, `ar`, `cs`, `da`, `nl`, `fr`, `de`, `hi`, `id`, `it`, `ja`, `ko`, `ms`, `fa`, `pl`, `pt`, `ro`, `ru`, `es`, `sv`, `th`, `tr`, `vi`, `fil`, `mk` | ✓ |

> ⚠️ **Retired models**
> 
> Retired models are no longer accessible. If you're using a retired model, switch to a currently available model.

### Plugins

The LiveKit Agents framework also includes a variety of open source [plugins](https://docs.livekit.io/agents/models.md#plugins) for a wide range of STT providers. These plugins require authentication with the provider yourself, usually via an API key. You are responsible for setting up your own account and managing your own billing and credentials. The plugins are listed below, along with their availability for Python or Node.js.

| Provider | Python | Node.js |
| -------- | ------ | ------- |
| [Amazon Transcribe](https://docs.livekit.io/agents/models/stt/aws.md) | ✓ | — |
| [AssemblyAI](https://docs.livekit.io/agents/models/stt/assemblyai.md) | ✓ | ✓ |
| [Azure AI Speech](https://docs.livekit.io/agents/models/stt/azure.md) | ✓ | — |
| [Azure OpenAI](https://docs.livekit.io/agents/models/stt/azure-openai.md) | ✓ | — |
| [Baseten](https://docs.livekit.io/agents/models/stt/baseten.md) | ✓ | — |
| [Cartesia](https://docs.livekit.io/agents/models/stt/cartesia.md) | ✓ | — |
| [Clova](https://docs.livekit.io/agents/models/stt/clova.md) | ✓ | — |
| [Deepgram](https://docs.livekit.io/agents/models/stt/deepgram.md) | ✓ | ✓ |
| [ElevenLabs](https://docs.livekit.io/agents/models/stt/elevenlabs.md) | ✓ | ✓ |
| [fal](https://docs.livekit.io/agents/models/stt/fal.md) | ✓ | — |
| [Gemini](https://docs.livekit.io/agents/models/stt/gemini.md) | ✓ | — |
| [Gladia](https://docs.livekit.io/agents/models/stt/gladia.md) | ✓ | — |
| [Gnani](https://docs.livekit.io/agents/models/stt/gnani.md) | ✓ | — |
| [Google Cloud](https://docs.livekit.io/agents/models/stt/google.md) | ✓ | — |
| [Gradium](https://docs.livekit.io/agents/models/stt/gradium.md) | ✓ | — |
| [Groq](https://docs.livekit.io/agents/models/stt/groq.md) | ✓ | — |
| [Inworld](https://docs.livekit.io/agents/models/stt/inworld.md) | ✓ | ✓ |
| [Meta](https://docs.livekit.io/agents/models/stt/meta.md) | ✓ | ✓ |
| [Microsoft AI](https://docs.livekit.io/agents/models/stt/microsoft-ai.md) | ✓ | — |
| [Mistral AI](https://docs.livekit.io/agents/models/stt/mistralai.md) | ✓ | ✓ |
| [Nvidia](https://docs.livekit.io/agents/models/stt/nvidia.md) | ✓ | — |
| [OpenAI](https://docs.livekit.io/agents/models/stt/openai.md) | ✓ | ✓ |
| [OVHCloud](https://docs.livekit.io/agents/models/stt/ovhcloud.md) | ✓ | ✓ |
| [Sarvam](https://docs.livekit.io/agents/models/stt/sarvam.md) | ✓ | ✓ |
| [Simplismart](https://docs.livekit.io/agents/models/stt/simplismart.md) | ✓ | — |
| [SLNG](https://docs.livekit.io/agents/models/stt/slng.md) | ✓ | — |
| [Smallest AI](https://docs.livekit.io/agents/models/stt/smallestai.md) | ✓ | — |
| [Soniox](https://docs.livekit.io/agents/models/stt/soniox.md) | ✓ | ✓ |
| [SpaceXAI](https://docs.livekit.io/agents/models/stt/spacexai.md) | ✓ | ✓ |
| [Speechmatics](https://docs.livekit.io/agents/models/stt/speechmatics.md) | ✓ | — |
| [Spitch](https://docs.livekit.io/agents/models/stt/spitch.md) | ✓ | — |

Have another provider in mind? LiveKit is open source and welcomes [new plugin contributions](https://docs.livekit.io/agents/models.md#contribute).

## Usage

To set up STT in an `AgentSession`, use the `STT` class from the `inference` module. Consult the [models list](#inference) for available models and languages.

**Python**:

```python
from livekit.agents import AgentSession, inference

session = AgentSession(
    stt=inference.STT(
        model="assemblyai/universal-3-6-pro",
        language="en"
    ),
    # ... llm, tts, etc.
)

```

---

**Node.js**:

```typescript
import { AgentSession, inference } from '@livekit/agents';

const session = new AgentSession({
    stt: new inference.STT({
        model: "assemblyai/universal-3-6-pro",
        language: "en"
    }),
    // ... llm, tts, etc.
})

```

### Multilingual transcription

If you don't know the language of the input audio, or expect multiple languages to be used simultaneously, use a Deepgram model that supports `multi`, such as Nova-3. The languages `multi` covers vary by model. See [multilingual transcription](https://docs.livekit.io/agents/models/stt/deepgram.md#multilingual).

**Python**:

```python
from livekit.agents import AgentSession

session = AgentSession(
    stt="deepgram/nova-3:multi",
    # ... llm, tts, etc.
)

```

---

**Node.js**:

```typescript
import { AgentSession } from '@livekit/agents';

const session = new AgentSession({
    stt: "deepgram/nova-3:multi",
    // ... llm, tts, etc.
})

```

### Additional parameters

More configuration options, such as custom vocabulary, are available for each model. To set additional parameters, use the `STT` class from the `inference` module. Consult each model reference for examples and available parameters.

## Advanced features

The following sections cover more advanced topics common to all STT providers. For more detailed reference on individual provider configuration, consult the model reference or plugin documentation for that provider.

### Automatic model selection

If you don't need to use any specific model features, and are only interested in the best model available for a given language, you can specify the language alone with the special model ID `auto`. LiveKit Inference chooses the best model for the given language automatically.

**Python**:

```python
from livekit.agents import AgentSession

session = AgentSession(
    # Use the best available model for Spanish
    stt="auto:es",   
)

```

---

**Node.js**:

```typescript
import { AgentSession } from '@livekit/agents';

const session = new AgentSession({
    // Use the best available model for Spanish
    stt: "auto:es",
})

```

LiveKit Inference supports the following languages. You can pass any of these values using the [`LanguageCode`](#language-codes) type, which accepts ISO 639-1, BCP-47, ISO 639-3, language names, and other common formats.

- `en`: English
- `en-AU`: English (Australia)
- `en-CA`: English (Canada)
- `en-GB`: English (United Kingdom)
- `en-IE`: English (Ireland)
- `en-IN`: English (India)
- `en-NZ`: English (New Zealand)
- `en-US`: English (United States)
- `af`: Afrikaans
- `afr`: afr
- `am`: Amharic
- `amh`: amh
- `ar`: Arabic
- `ar_en`: ar_en
- `ar-AE`: Arabic (United Arab Emirates)
- `ar-DZ`: Arabic (Algeria)
- `ar-EG`: Arabic (Egypt)
- `ar-IQ`: Arabic (Iraq)
- `ar-IR`: Arabic (Iran)
- `ar-JO`: Arabic (Jordan)
- `ar-KW`: Arabic (Kuwait)
- `ar-LB`: Arabic (Lebanon)
- `ar-MA`: Arabic (Morocco)
- `ar-PS`: Arabic (Palestine)
- `ar-QA`: Arabic (Qatar)
- `ar-SA`: Arabic (Saudi Arabia)
- `ar-SD`: Arabic (Sudan)
- `ar-SY`: Arabic (Syria)
- `ar-TD`: Arabic (Chad)
- `ar-TN`: Arabic (Tunisia)
- `ara`: ara
- `as`: Assamese
- `asm`: asm
- `ast`: ast
- `az`: Azerbaijani
- `azj`: azj
- `ba`: Bashkir
- `be`: Belarusian
- `bel`: bel
- `ben`: ben
- `bg`: Bulgarian
- `bn`: Bengali
- `bo`: Tibetan
- `bos`: bos
- `br`: Breton
- `bs`: Bosnian
- `bul`: bul
- `ca`: Catalan
- `cat`: cat
- `ceb`: ceb
- `ces`: ces
- `cmn`: cmn
- `cmn_en`: cmn_en
- `cmn_en_ms_ta`: cmn_en_ms_ta
- `cs`: Czech
- `cy`: Welsh
- `cym`: cym
- `da`: Danish
- `da-DK`: Danish (Denmark)
- `dan`: dan
- `de`: German
- `de-AT`: German (Austria)
- `de-CH`: German (Switzerland)
- `de-DE`: German (Germany)
- `deu`: deu
- `el`: Greek
- `ell`: ell
- `en_ms`: en_ms
- `en_ta`: en_ta
- `eng`: eng
- `eo`: eo
- `es`: Spanish
- `es-419`: Spanish (Latin America)
- `es-AR`: Spanish (Argentina)
- `es-BO`: Spanish (Bolivia)
- `es-CL`: Spanish (Chile)
- `es-CO`: Spanish (Colombia)
- `es-CR`: Spanish (Costa Rica)
- `es-CU`: Spanish (Cuba)
- `es-DO`: Spanish (Dominican Republic)
- `es-EC`: Spanish (Ecuador)
- `es-ES`: Spanish (Spain)
- `es-GT`: Spanish (Guatemala)
- `es-HN`: Spanish (Honduras)
- `es-MX`: Spanish (Mexico)
- `es-NI`: Spanish (Nicaragua)
- `es-PA`: Spanish (Panama)
- `es-PE`: Spanish (Peru)
- `es-PR`: Spanish (Puerto Rico)
- `es-PY`: Spanish (Paraguay)
- `es-SV`: Spanish (El Salvador)
- `es-UY`: Spanish (Uruguay)
- `es-VE`: Spanish (Venezuela)
- `est`: est
- `et`: Estonian
- `eu`: Basque
- `fa`: Farsi
- `fas`: fas
- `ff`: ff
- `fi`: Finnish
- `fil`: Filipino
- `fin`: fin
- `fo`: Faroese
- `fr`: French
- `fr-BE`: French (Belgium)
- `fr-CA`: French (Canada)
- `fr-CH`: French (Switzerland)
- `fr-FR`: French (France)
- `fra`: fra
- `ful`: ful
- `ga`: Irish
- `gl`: Galician
- `gle`: gle
- `glg`: glg
- `gu`: Gujarati
- `guj`: guj
- `ha`: Hausa
- `hau`: hau
- `haw`: Hawaiian
- `he`: Hebrew
- `heb`: heb
- `hi`: Hindi
- `hin`: hin
- `hr`: Croatian
- `hrv`: hrv
- `ht`: Haitian
- `hu`: Hungarian
- `hun`: hun
- `hy`: Armenian
- `hye`: hye
- `ia`: ia
- `ibo`: ibo
- `id`: Indonesian
- `ig`: ig
- `ind`: ind
- `is`: Icelandic
- `isl`: isl
- `it`: Italian
- `it-CH`: Italian (Switzerland)
- `it-IT`: Italian (Italy)
- `ita`: ita
- `iw`: iw
- `ja`: Japanese
- `jav`: jav
- `jpn`: jpn
- `jv`: jv
- `jw`: Javanese
- `ka`: Georgian
- `kan`: kan
- `kat`: kat
- `kaz`: kaz
- `kea`: kea
- `khm`: khm
- `kir`: kir
- `kk`: Kazakh
- `km`: Khmer
- `kn`: Kannada
- `ko`: Korean
- `ko-KR`: Korean (South Korea)
- `kor`: kor
- `ku`: ku
- `kur`: kur
- `ky`: ky
- `la`: Latin
- `lao`: lao
- `lav`: lav
- `lb`: Luxembourgish
- `lg`: lg
- `lin`: lin
- `lit`: lit
- `ln`: Lingala
- `lo`: Lao
- `lt`: Lithuanian
- `ltz`: ltz
- `lug`: lug
- `luo`: luo
- `lv`: Latvian
- `mal`: mal
- `mar`: mar
- `mg`: Malagasy
- `mi`: Maori
- `mk`: Macedonian
- `mkd`: mkd
- `ml`: Malayalam
- `mlt`: mlt
- `mn`: Mongolian
- `mon`: mon
- `mr`: Marathi
- `mri`: mri
- `ms`: Malay
- `msa`: msa
- `mt`: Maltese
- `multi`: multilingual (automatic)
- `my`: Myanmar
- `mya`: mya
- `ne`: Nepali
- `nep`: nep
- `nl`: Dutch
- `nl-BE`: Dutch (Belgium)
- `nld`: nld
- `nn`: Norwegian Nynorsk
- `no`: Norwegian
- `nor`: nor
- `nso`: nso
- `ny`: ny
- `nya`: nya
- `oc`: Occitan
- `oci`: oci
- `or`: or
- `ori`: ori
- `pa`: Punjabi
- `pan`: pan
- `pl`: Polish
- `pol`: pol
- `por`: por
- `ps`: Pashto
- `pt`: Portuguese
- `pt-BR`: Portuguese (Brazil)
- `pt-PT`: Portuguese (Portugal)
- `pus`: pus
- `ro`: Romanian
- `ron`: ron
- `ru`: Russian
- `rus`: rus
- `sa`: Sanskrit
- `sd`: Sindhi
- `si`: Sinhala
- `sk`: Slovak
- `sl`: Slovenian
- `slk`: slk
- `slv`: slv
- `sn`: Shona
- `sna`: sna
- `snd`: snd
- `so`: Somali
- `som`: som
- `spa`: spa
- `sq`: Albanian
- `sr`: Serbian
- `srp`: srp
- `su`: Sundanese
- `sv`: Swedish
- `sv-SE`: Swedish (Sweden)
- `sw`: Swahili
- `swa`: swa
- `swe`: swe
- `ta`: Tamil
- `tam`: tam
- `te`: Telugu
- `tel`: tel
- `tg`: Tajik
- `tgk`: tgk
- `th`: Thai
- `th-TH`: Thai (Thailand)
- `tha`: tha
- `tk`: Turkmen
- `tl`: Tagalog
- `tr`: Turkish
- `tt`: Tatar
- `tur`: tur
- `ug`: ug
- `uk`: Ukrainian
- `ukr`: ukr
- `umb`: umb
- `ur`: Urdu
- `urd`: urd
- `uz`: Uzbek
- `uzb`: uzb
- `vi`: Vietnamese
- `vie`: vie
- `wo`: wo
- `wol`: wol
- `xh`: xh
- `xho`: xho
- `yi`: Yiddish
- `yo`: Yoruba
- `yue`: Cantonese
- `zh`: Chinese
- `zh-cn`: zh-cn
- `zh-CN`: Simplified Chinese (China)
- `zh-Hans`: Simplified Chinese
- `zh-Hant`: Traditional Chinese
- `zh-hk`: zh-hk
- `zh-HK`: Traditional Chinese (Hong Kong)
- `zh-tw`: zh-tw
- `zh-TW`: Traditional Chinese (Taiwan)
- `zho`: zho
- `zu`: zu
- `zul`: zul

### Keyterms

Improve recognition of domain-specific vocabulary, such as names, brands, and technical terms, with a single keyterm set that applies across providers. You can supply static keyterms and enable automatic detection from the live conversation. For details, see [Keyterm management](https://docs.livekit.io/agents/models/stt/keyterms.md).

### Custom STT

To create an entirely custom STT, implement the [STT node](https://docs.livekit.io/agents/build/nodes.md#stt_node) in your agent.

### Standalone usage

You can use an `STT` instance in a standalone fashion, without an `AgentSession`, using the streaming interface. Use `push_frame` to add [realtime audio frames](https://docs.livekit.io/transport/media.md) to the stream, and then consume a stream of `SpeechEvent` events as output.

Here is an example of a standalone STT app:

** Filename: `agent.py`**

```python
import asyncio

from dotenv import load_dotenv

from livekit import agents, rtc
from livekit.agents import AgentServer
from livekit.agents.stt import SpeechEventType, SpeechEvent
from typing import AsyncIterable
from livekit.plugins import (
    deepgram,
)

load_dotenv(".env.local")

server = AgentServer()

@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: agents.JobContext):
    @ctx.room.on("track_subscribed")
    def on_track_subscribed(track: rtc.RemoteTrack):
        print(f"Subscribed to track: {track.name}")

        asyncio.create_task(process_track(track))

    async def process_track(track: rtc.RemoteTrack):
        stt = deepgram.STT(model="nova-2")
        stt_stream = stt.stream()
        audio_stream = rtc.AudioStream(track)

        async with asyncio.TaskGroup() as tg:
            # Create task for processing STT stream
            stt_task = tg.create_task(process_stt_stream(stt_stream))

            # Process audio stream
            async for audio_event in audio_stream:
                stt_stream.push_frame(audio_event.frame)

            # Indicates the end of the audio stream
            stt_stream.end_input()

            # Wait for STT processing to complete
            await stt_task

    async def process_stt_stream(stream: AsyncIterable[SpeechEvent]):
        try:
            async for event in stream:
                if event.type == SpeechEventType.FINAL_TRANSCRIPT:
                    print(f"Final transcript: {event.alternatives[0].text}")
                elif event.type == SpeechEventType.INTERIM_TRANSCRIPT:
                    print(f"Interim transcript: {event.alternatives[0].text}")
                elif event.type == SpeechEventType.START_OF_SPEECH:
                    print("Start of speech")
                elif event.type == SpeechEventType.END_OF_SPEECH:
                    print("End of speech")
        finally:
            await stream.aclose()


if __name__ == "__main__":
    agents.cli.run_app(server)


```

### VAD and StreamAdapter

Some STT providers or models, such as [Whisper](https://github.com/openai/whisper), don't support streaming input. In these cases, your app must determine when a chunk of audio represents a complete segment of speech. You can do this using VAD together with the `StreamAdapter` class.

The following example modifies the previous example to use VAD and `StreamAdapter` to buffer user speech until VAD detects the end of speech:

```python
from livekit import agents, rtc
from livekit.agents import inference
from livekit.plugins import openai

async def process_track(ctx: agents.JobContext, track: rtc.Track):
  whisper_stt = openai.STT()
  vad = inference.VAD(
    model="silero",
    min_speech_duration=0.1,
    min_silence_duration=0.5,
  )
  vad_stream = vad.stream()
  # StreamAdapter buffers audio until VAD emits END_SPEAKING event
  stt = agents.stt.StreamAdapter(whisper_stt, vad_stream)
  stt_stream = stt.stream()
  ...

```

### Speaker diarization

Speaker diarization identifies which speaker is talking when several people share one microphone. STT providers that support diarization label each transcript with a speaker identifier. In Python, you can wrap the STT with `MultiSpeakerAdapter` to detect the primary speaker and suppress or label background speech. To learn more, including the full list of supported providers, see [Speaker diarization](https://docs.livekit.io/agents/models/stt/diarization.md).

### Provider-specific metadata

When you use LiveKit Inference, some STT providers include additional information with each transcript. This information is available in the `metadata` field of each `SpeechData` object in the `alternatives` list (`event.alternatives[0].metadata`). If a provider doesn't include any additional information, the field is `None` (Python) or `undefined` (Node.js).

The following providers populate `metadata` today:

| Provider | Metadata field | Contents |
| [Inworld](https://docs.livekit.io/agents/models/stt/inworld.md#voice-profile) | `metadata["voice_profile"]` | Detected attributes such as age, emotion, pitch, vocal style, accent, and gender. |
| [SpaceXAI](https://docs.livekit.io/agents/models/stt/spacexai.md#metadata) | `metadata["speech_final"]` | Whether the provider has detected the end of the current utterance. |

Any Inference provider that emits per-transcript data populates `metadata`.

To read it, access `metadata` on a transcript alternative. The following example overrides the [STT node](https://docs.livekit.io/agents/build/nodes.md#stt_node) to inspect the metadata on each final transcript. Interim transcripts can also carry metadata, so filter on the event type you need:

**Python**:

```python
from typing import AsyncIterable

from livekit import rtc
from livekit.agents import Agent, ModelSettings, stt


class MyAgent(Agent):
    async def stt_node(
        self, audio: AsyncIterable[rtc.AudioFrame], model_settings: ModelSettings
    ) -> AsyncIterable[stt.SpeechEvent]:
        async for event in Agent.default.stt_node(self, audio, model_settings):
            if event.type == stt.SpeechEventType.FINAL_TRANSCRIPT:
                alt = event.alternatives[0]
                # metadata is None unless the provider emits extra data
                if alt.metadata:
                    voice_profile = alt.metadata.get("voice_profile")
                    print(f"voice profile: {voice_profile}")
            yield event

```

---

**Node.js**:

```typescript
import { stt, voice } from '@livekit/agents';
import type { AudioFrame } from '@livekit/rtc-node';
import { ReadableStream, TransformStream } from 'stream/web';

const agent = voice.Agent.create({
  async sttNode(ctx, audio, modelSettings) {
    const events = await voice.Agent.default.sttNode(ctx.agent, audio, modelSettings);
    if (!events) return null;

    return events.pipeThrough(
      new TransformStream({
        transform(event, controller) {
          if (typeof event !== 'string' && event.type === stt.SpeechEventType.FINAL_TRANSCRIPT) {
            // metadata is typed as Record<string, unknown>, so narrow before use
            const voiceProfile = event.alternatives?.[0]?.metadata?.['voice_profile'];
            if (voiceProfile && typeof voiceProfile === 'object') {
              console.log('voice profile:', voiceProfile);
            }
          }
          controller.enqueue(event);
        },
      }),
    );
  },
});

```

### Language codes

All STT plugins and LiveKit Inference use the `LanguageCode` type for the `language` parameter. `LanguageCode` accepts any common language format and normalizes it automatically to [BCP-47](https://www.rfc-editor.org/info/bcp47). You don't need to look up the specific format each provider expects. Pass any of the following and the framework handles the conversion:

- ISO 639-1: `"en"`, `"es"`, `"fr"`
- BCP-47 with region: `"en-US"`, `"zh-Hans-CN"`
- ISO 639-3: `"eng"`, `"spa"`
- Language names: `"english"`, `"spanish"`
- Underscored variants: `"en_us"` (normalized to `"en-US"`)

For example, all of the following are equivalent:

**Python**:

```python
from livekit.agents import LanguageCode

LanguageCode("english")  # → "en"
LanguageCode("eng")      # → "en"
LanguageCode("en")       # → "en"
LanguageCode("en-US")    # → "en-US"
LanguageCode("en_us")    # → "en-US"

```

`LanguageCode` is a `str` subclass, so you can use it anywhere a string is expected. It also provides properties for extracting parts of the code:

- `.language`: Base ISO 639-1 code (for example, `"en"` from `"en-US"`).
- `.region`: Region subtag, if present (for example, `"US"` from `"en-US"`).
- `.iso`: ISO 639-1 tag with region (for example, `"zh-CN"` from `"cmn-Hans-CN"`).

---

**Node.js**:

```typescript
import { normalizeLanguage } from '@livekit/agents';

normalizeLanguage("english")  // → "en"
normalizeLanguage("eng")      // → "en"
normalizeLanguage("en")       // → "en"
normalizeLanguage("en-US")    // → "en-US"
normalizeLanguage("en_us")    // → "en-US"

```

In Node.js, `LanguageCode` is a branded `string` type. Use `normalizeLanguage()` to convert a plain string to a `LanguageCode`, and the standalone helper functions to extract parts of the code:

- `getBaseLanguage(lang)`: Base ISO 639-1 code (for example, `"en"` from `"en-US"`).
- `getLanguageRegion(lang)`: Region subtag, if present (for example, `"US"` from `"en-US"`).
- `getIsoLanguage(lang)`: ISO 639-1 tag with region (for example, `"zh-CN"` from `"cmn-Hans-CN"`).

## Additional resources

The following resources cover related topics that might be useful for your app.

- **[Text and transcriptions](https://docs.livekit.io/agents/build/text.md)**: Integrate realtime text features into your agent.

- **[Pipeline nodes](https://docs.livekit.io/agents/build/nodes.md)**: Learn how to customize the behavior of your agent by overriding nodes in the voice pipeline.

- **[Inference pricing](https://livekit.com/pricing/inference#stt)**: The latest pricing information for STT models in LiveKit Inference.

---

This document was rendered at 2026-10-24T20:20:11.680Z.
For the latest version of this document, see [https://docs.livekit.io/agents/models/stt.md](https://docs.livekit.io/agents/models/stt.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).

<!-- ================================================================ -->
## Page: https://docs.livekit.io/agents/models/tts.md

LiveKit docs › Build Agents › Models › TTS › Overview

---

# Text-to-speech (TTS) models overview

> Voices and plugins to add realtime speech to your voice agents.

## Overview

Voice agent speech is produced by a TTS model, configured with a voice profile that specifies tone, accent, and other qualitative characteristics of the speech. The TTS model runs on output from an [LLM](https://docs.livekit.io/agents/models/llm.md) model to speak the agent response to the user.

You can choose a voice model served through LiveKit Inference, included with LiveKit Cloud. With LiveKit Inference, your agent runs on LiveKit's infrastructure to minimize latency. No separate provider API key is required, and usage and rate limits are managed through LiveKit Cloud. Use the plugin instead if you prefer to manage billing and rate limits yourself, or need access to a provider not currently available through LiveKit Inference.

## LiveKit Inference

LiveKit Inference provides a curated set of TTS models with managed billing and rate limits. Each model comes with a limited selection of [Suggested voices](#voices), plus a wider selection through each provider's documentation.

### Models

The following models are available in [LiveKit Inference](https://docs.livekit.io/agents/models.md#inference). Refer to the guide for each model for more details on additional configuration options.

A checkmark in the **EU endpoint** column in the following tables means the model has a dedicated EU endpoint, in addition to the global endpoint. To learn more, see [Data residency](https://docs.livekit.io/agents/models/inference.md#data-residency).

#### [Cartesia](https://docs.livekit.io/agents/models/tts/cartesia.md)

| Model name | Model ID | Languages | EU endpoint |
| ---------- | -------- | --------- | ------ |
| Sonic 3 | `cartesia/sonic-3` | `en`, `de`, `es`, `fr`, `ja`, `pt`, `zh`, `hi`, `ko`, `it`, `nl`, `pl`, `ru`, `sv`, `tr`, `tl`, `bg`, `ro`, `ar`, `cs`, `el`, `fi`, `hr`, `ms`, `sk`, `da`, `ta`, `uk`, `hu`, `no`, `vi`, `bn`, `th`, `he`, `ka`, `id`, `te`, `gu`, `kn`, `ml`, `mr`, `pa` | ✓ |
| Sonic 3 (2026-01-12) | `cartesia/sonic-3-2026-01-12` | `en`, `de`, `es`, `fr`, `ja`, `pt`, `zh`, `hi`, `ko`, `it`, `nl`, `pl`, `ru`, `sv`, `tr`, `tl`, `bg`, `ro`, `ar`, `cs`, `el`, `fi`, `hr`, `ms`, `sk`, `da`, `ta`, `uk`, `hu`, `no`, `vi`, `bn`, `th`, `he`, `ka`, `id`, `te`, `gu`, `kn`, `ml`, `mr`, `pa` | ✓ |
| Sonic 3 Latest | `cartesia/sonic-3-latest` | `en`, `de`, `es`, `fr`, `ja`, `pt`, `zh`, `hi`, `ko`, `it`, `nl`, `pl`, `ru`, `sv`, `tr`, `tl`, `bg`, `ro`, `ar`, `cs`, `el`, `fi`, `hr`, `ms`, `sk`, `da`, `ta`, `uk`, `hu`, `no`, `vi`, `bn`, `th`, `he`, `ka`, `id`, `te`, `gu`, `kn`, `ml`, `mr`, `pa` | ✓ |
| Sonic 3.5 | `cartesia/sonic-3.5` | `en`, `de`, `es`, `ja`, `pt`, `zh`, `hi`, `ko`, `nl`, `pl`, `ru`, `sv`, `tr`, `tl`, `bg`, `ro`, `ar`, `cs`, `el`, `fi`, `hr`, `ms`, `sk`, `da`, `ta`, `uk`, `hu`, `no`, `vi`, `bn`, `th`, `he`, `ka`, `id`, `te`, `gu`, `kn`, `ml`, `mr`, `pa` | ✓ |
| Sonic 3.5 (2026-05-04) | `cartesia/sonic-3.5-2026-05-04` | `en`, `de`, `es`, `ja`, `pt`, `zh`, `hi`, `ko`, `nl`, `pl`, `ru`, `sv`, `tr`, `tl`, `bg`, `ro`, `ar`, `cs`, `el`, `fi`, `hr`, `ms`, `sk`, `da`, `ta`, `uk`, `hu`, `no`, `vi`, `bn`, `th`, `he`, `ka`, `id`, `te`, `gu`, `kn`, `ml`, `mr`, `pa` | ✓ |
| Sonic 3.6 | `cartesia/sonic-3.6` | `en`, `fr`, `de`, `es`, `ja`, `pt`, `zh`, `hi`, `it`, `ko`, `nl`, `pl`, `ru`, `sv`, `tr`, `tl`, `bg`, `ro`, `ar`, `cs`, `el`, `fi`, `hr`, `ms`, `sk`, `da`, `ta`, `uk`, `hu`, `no`, `vi`, `bn`, `th`, `he`, `ka`, `id`, `te`, `gu`, `kn`, `ml`, `mr`, `pa`, `or`, `ur` | ✓ |
| Sonic 3.6 (2026-08-27) | `cartesia/sonic-3.6-2026-08-27` | `en`, `fr`, `de`, `es`, `ja`, `pt`, `zh`, `hi`, `it`, `ko`, `nl`, `pl`, `ru`, `sv`, `tr`, `tl`, `bg`, `ro`, `ar`, `cs`, `el`, `fi`, `hr`, `ms`, `sk`, `da`, `ta`, `uk`, `hu`, `no`, `vi`, `bn`, `th`, `he`, `ka`, `id`, `te`, `gu`, `kn`, `ml`, `mr`, `pa`, `or`, `ur` | ✓ |
| Sonic Latest | `cartesia/sonic-latest` | `en`, `de`, `es`, `ja`, `pt`, `zh`, `hi`, `ko`, `nl`, `pl`, `ru`, `sv`, `tr`, `tl`, `bg`, `ro`, `ar`, `cs`, `el`, `fi`, `hr`, `ms`, `sk`, `da`, `ta`, `uk`, `hu`, `no`, `vi`, `bn`, `th`, `he`, `ka`, `id`, `te`, `gu`, `kn`, `ml`, `mr`, `pa` | ✓ |
| Sonic Preview | `cartesia/sonic-preview` | `en`, `fr`, `de`, `es`, `ja`, `pt`, `zh`, `hi`, `it`, `ko`, `nl`, `pl`, `ru`, `sv`, `tr`, `tl`, `bg`, `ro`, `ar`, `cs`, `el`, `fi`, `hr`, `ms`, `sk`, `da`, `ta`, `uk`, `hu`, `no`, `vi`, `bn`, `th`, `he`, `ka`, `id`, `te`, `gu`, `kn`, `ml`, `mr`, `pa`, `or`, `ur` | ✓ |
| Sonic 2 | `cartesia/sonic-2` **DEPRECATED** (retires October 20, 2026; use `cartesia/sonic-3.5`) | `en`, `fr`, `de`, `es`, `pt`, `zh`, `ja`, `ko` | ✓ |
| Sonic 3 (2025-10-27) | `cartesia/sonic-3-2025-10-27` **DEPRECATED** (retires October 20, 2026; use `cartesia/sonic-3.5`) | `en`, `de`, `es`, `fr`, `ja`, `pt`, `zh`, `hi`, `ko`, `it`, `nl`, `pl`, `ru`, `sv`, `tr`, `tl`, `bg`, `ro`, `ar`, `cs`, `el`, `fi`, `hr`, `ms`, `sk`, `da`, `ta`, `uk`, `hu`, `no`, `vi`, `bn`, `th`, `he`, `ka`, `id`, `te`, `gu`, `kn`, `ml`, `mr`, `pa` | ✓ |
| Sonic Turbo | `cartesia/sonic-turbo` **DEPRECATED** (retires October 20, 2026; use `cartesia/sonic-3.5`) | `en`, `fr`, `de`, `es`, `pt`, `zh`, `ja`, `hi`, `ko` | ✓ |
| Sonic | `cartesia/sonic` **RETIRED** (retired June 1, 2026; use `cartesia/sonic-3`) | `en`, `fr`, `de`, `es`, `pt`, `zh`, `ja`, `hi`, `it`, `ko`, `nl`, `pl`, `ru`, `sv`, `tr` | ✓ |

#### [Deepgram](https://docs.livekit.io/agents/models/tts/deepgram.md)

| Model name | Model ID | Languages | EU endpoint |
| ---------- | -------- | --------- | ------ |
| Aura-2 | `deepgram/aura-2` | `en`, `en-US`, `en-PH`, `en-GB`, `en-AU`, `es`, `es-CO`, `es-MX`, `es-ES`, `es-419`, `es-AR`, `nl`, `nl-NL`, `fr`, `fr-FR`, `de`, `de-DE`, `it`, `it-IT`, `ja`, `ja-JP` | ✓ |
| Flux TTS | `deepgram/flux-tts` | `en`, `en-US`, `en-GB`, `en-AU`, `en-IN` | ✓ |
| Aura-1 | `deepgram/aura` **RETIRED** (retired February 13, 2026; use `deepgram/aura-2`) | `en`, `en-US`, `en-IE`, `en-GB` |  |

#### [Fish Audio](https://docs.livekit.io/agents/models/tts/fishaudio.md)

| Model name | Model ID | Languages | EU endpoint |
| ---------- | -------- | --------- | ------ |
| Drama 3 | `fishaudio/drama-3` | `en`, `zh`, `ja`, `de`, `fr`, `es`, `ko`, `ar`, `ru`, `nl`, `it`, `pl`, `pt` |  |
| S2 Pro | `fishaudio/s2-pro` | `en`, `zh`, `ja`, `de`, `fr`, `es`, `ko`, `ar`, `ru`, `nl`, `it`, `pl`, `pt` |  |
| S2.1 Pro | `fishaudio/s2.1-pro` | `en`, `zh`, `ja`, `de`, `fr`, `es`, `ko`, `ar`, `ru`, `nl`, `it`, `pl`, `pt` |  |
| S2.1 Pro Free | `fishaudio/s2.1-pro-free` **RETIRED** (retired September 25, 2026; use `fishaudio/s2.1-pro`) | `en`, `zh`, `ja`, `de`, `fr`, `es`, `ko`, `ar`, `ru`, `nl`, `it`, `pl`, `pt` |  |

#### [Gemini](https://docs.livekit.io/agents/models/tts/gemini.md)

| Model name | Model ID | Languages | EU endpoint |
| ---------- | -------- | --------- | ------ |
| Gemini 3.8 Flash-Lite TTS | `google/gemini-3.8-flash-lite-tts` | `en`, `ace`, `af`, `ak`, `am`, `hy`, `as`, `awa`, `ban`, `bn`, `bjn`, `eu`, `be`, `bho`, `bs`, `bug`, `bg`, `yue`, `ca`, `ceb`, `ckb`, `hne`, `zh`, `hr`, `cs`, `da`, `nl`, `arz`, `et`, `fil`, `fr`, `gl`, `lg`, `ka`, `de`, `el`, `gu`, `ht`, `mn`, `ha`, `he`, `hi`, `hu`, `is`, `ilo`, `id`, `fa`, `it`, `ja`, `jv`, `kam`, `kn`, `ks`, `kk`, `km`, `ki`, `rw`, `kg`, `ko`, `ky`, `lo`, `ln`, `mk`, `mag`, `mai`, `ml`, `mt`, `mni`, `mr`, `min`, `lus`, `ne`, `fuv`, `az`, `nso`, `uz`, `nb`, `no`, `nn`, `ny`, `or`, `pl`, `pt`, `pa`, `ro`, `ru`, `sat`, `sr`, `si`, `sk`, `ps`, `es`, `ar`, `lv`, `ms`, `ta`, `te`, `vi` |  |
| Gemini 3.8 Flash TTS | `google/gemini-3.8-flash-tts` | `en`, `ace`, `af`, `ak`, `am`, `hy`, `as`, `awa`, `ban`, `bn`, `bjn`, `ba`, `eu`, `be`, `bem`, `bho`, `bs`, `bug`, `bg`, `my`, `yue`, `ca`, `ceb`, `ckb`, `hne`, `zh`, `crh`, `hr`, `cs`, `da`, `nl`, `dyu`, `dz`, `arz`, `et`, `fil`, `fi`, `fr`, `gl`, `lg`, `ka`, `de`, `el`, `gn`, `gu`, `ht`, `mn`, `ha`, `he`, `hi`, `hu`, `is`, `ig`, `ilo`, `id`, `fa`, `it`, `ja`, `jv`, `kab`, `kam`, `kn`, `ks`, `kk`, `km`, `ki`, `rw`, `kg`, `ko`, `ky`, `lo`, `ltg`, `ln`, `lt`, `lb`, `mk`, `mag`, `mai`, `ml`, `mt`, `mni`, `mr`, `min`, `lus`, `ne`, `fuv`, `az`, `nso`, `uz`, `nb`, `no`, `nn`, `ny`, `oc`, `or`, `pag`, `pl`, `pt`, `pa`, `ro`, `ru`, `sat`, `sr`, `sd`, `si`, `sk`, `sl`, `so`, `ps`, `st`, `es`, `ar`, `lv`, `ms`, `sw`, `ss`, `sv`, `tg`, `ta`, `te`, `th`, `ti`, `sq`, `ug`, `vi` |  |

#### [Gradium](https://docs.livekit.io/agents/models/tts/gradium.md)

| Model name | Model ID | Languages | EU endpoint |
| ---------- | -------- | --------- | ------ |
| Gradium TTS | `gradium/default` | `en`, `fr`, `de`, `es`, `pt` | ✓ |
| Gradium TTS Beta | `gradium/gradium-tts-beta` | `en`, `fr`, `de`, `es`, `pt` | ✓ |

#### [Inworld](https://docs.livekit.io/agents/models/tts/inworld.md)

| Model name | Model ID | Languages | EU endpoint |
| ---------- | -------- | --------- | ------ |
| Realtime TTS 1.5 Max | `inworld/inworld-tts-1.5-max` | `en`, `zh`, `ja`, `ko`, `ru`, `it`, `es`, `pt`, `fr`, `de`, `pl`, `nl`, `hi`, `he`, `ar` |  |
| Realtime TTS 1.5 Mini | `inworld/inworld-tts-1.5-mini` | `en`, `zh`, `ja`, `ko`, `ru`, `it`, `es`, `pt`, `fr`, `de`, `pl`, `nl`, `hi`, `he`, `ar` |  |
| Realtime TTS 2.0 | `inworld/inworld-tts-2` | `en`, `zh`, `ja`, `ko`, `ru`, `it`, `es`, `pt`, `fr`, `de`, `pl`, `nl`, `hi`, `he`, `ar`, `af`, `sq`, `am`, `hy`, `as`, `az`, `eu`, `be`, `bn`, `bg`, `my`, `yue`, `ca`, `ceb`, `hr`, `cs`, `da`, `yih`, `arz`, `et`, `fil`, `fi`, `gl`, `gbm`, `ka`, `el`, `gu`, `afb`, `ht`, `acw`, `hu`, `is`, `id`, `jv`, `kn`, `kk`, `kok`, `lo`, `lv`, `ayl`, `lt`, `lb`, `mk`, `mai`, `mg`, `ms`, `ml`, `mr`, `mn`, `ars`, `ne`, `uzn`, `nb`, `nn`, `or`, `acx`, `ps`, `fa`, `pms`, `pa`, `ro`, `sr`, `sd`, `si`, `sk`, `sl`, `sw`, `sv`, `ta`, `te`, `th`, `aeb`, `tr`, `uk`, `ur`, `uz`, `vi`, `vro`, `cy` |  |
| Realtime TTS 2.0 Flash | `inworld/inworld-tts-2-flash` | `en`, `zh`, `ja`, `ko`, `ru`, `it`, `es`, `pt`, `fr`, `de`, `pl`, `nl`, `hi`, `he`, `ar`, `af`, `sq`, `am`, `hy`, `as`, `az`, `eu`, `be`, `bn`, `bg`, `my`, `yue`, `ca`, `ceb`, `hr`, `cs`, `da`, `yih`, `arz`, `et`, `fil`, `fi`, `gl`, `gbm`, `ka`, `el`, `gu`, `afb`, `ht`, `acw`, `hu`, `is`, `id`, `jv`, `kn`, `kk`, `kok`, `lo`, `lv`, `ayl`, `lt`, `lb`, `mk`, `mai`, `mg`, `ms`, `ml`, `mr`, `mn`, `ars`, `ne`, `uzn`, `nb`, `nn`, `or`, `acx`, `ps`, `fa`, `pms`, `pa`, `ro`, `sr`, `sd`, `si`, `sk`, `sl`, `sw`, `sv`, `ta`, `te`, `th`, `aeb`, `tr`, `uk`, `ur`, `uz`, `vi`, `vro`, `cy` |  |
| Realtime TTS | `inworld/inworld-tts-1` **RETIRED** (retired June 1, 2026; use `inworld/inworld-tts-1.5-mini`) | `en`, `es`, `fr`, `ko`, `nl`, `zh`, `de`, `it`, `ja`, `pl`, `pt`, `ru`, `hi`, `he`, `ar` |  |
| Realtime TTS Max | `inworld/inworld-tts-1-max` **RETIRED** (retired June 1, 2026; use `inworld/inworld-tts-1.5-max`) | `en`, `es`, `fr`, `ko`, `nl`, `zh`, `de`, `it`, `ja`, `pl`, `pt`, `ru`, `hi`, `he`, `ar` |  |

#### [Rime](https://docs.livekit.io/agents/models/tts/rime.md)

| Model name | Model ID | Languages | EU endpoint |
| ---------- | -------- | --------- | ------ |
| Coda | `rime/coda` | `en`, `es`, `fr`, `de`, `hi`, `ja`, `pt`, `ar` |  |
| Mist v3 | `rime/mistv3` | `en`, `es`, `fr`, `de`, `hi` |  |
| Arcana | `rime/arcana` **RETIRED** (retired August 19, 2026; use `rime/coda`) | `en`, `es`, `fr`, `de`, `hi`, `he`, `ja`, `pt`, `ar` |  |
| Mist | `rime/mist` **RETIRED** (retired October 1, 2026; use `rime/mistv3`) | `en` |  |
| Mist v2 | `rime/mistv2` **RETIRED** (retired October 1, 2026; use `rime/mistv3`) | `en`, `es`, `fr`, `de` |  |

#### [SpaceXAI](https://docs.livekit.io/agents/models/tts/spacexai.md)

| Model name | Model ID | Languages | EU endpoint |
| ---------- | -------- | --------- | ------ |
| Text to Speech | `xai/tts-1` | `auto`, `en`, `ar-EG`, `ar-SA`, `ar-AE`, `bn`, `zh`, `fr`, `de`, `hi`, `id`, `it`, `ja`, `ko`, `pt-BR`, `pt-PT`, `ru`, `es-MX`, `es-ES`, `tr`, `vi` | ✓ |

> ⚠️ **Retired models**
> 
> Retired models are no longer accessible. If you're using a retired model, switch to a currently available model.

### Custom voices

You can create and use custom voices with LiveKit Inference. Upload or record a sample, and LiveKit clones it to all [supported TTS providers](https://docs.livekit.io/agents/models/tts/custom-voices.md#providers) on your plan. You can then use the clone in your agent sessions with any of those providers.

- **[Custom voices](https://docs.livekit.io/agents/models/tts/custom-voices.md)**: Create voice clones from short audio samples.

### Expressive mode

Expressive mode lets the LLM add emotion, pacing, and non-verbal sounds to your agent's speech automatically, using markup that LiveKit renders through the TTS. It's available for supported providers on LiveKit Inference.

- **[Expressive mode](https://docs.livekit.io/agents/models/tts/expressive.md)**: Add emotion, pacing, and non-verbal sounds automatically.

### Suggested voices

The following voices are good choices for overall quality and performance. Each provider has a much larger selection of voices to choose from, which you can find in their documentation. In addition to the voices below, you can choose to use other TTS provider voices through LiveKit Inference.

Click the copy icon to copy the voice ID to use in your agent session.

| Provider | Name | Description | Language | ID |
| -------- | ---- | ----------- | -------- | -------- |
| Cartesia | Blake | Energetic American adult male | `en-US` | `cartesia/sonic-3:a167e0f3-df7e-4d52-a9c3-f949145efdab` |
| Cartesia | Daniela | Calm and trusting Mexican female | `es-MX` | `cartesia/sonic-3:5c5ad5e7-1020-476b-8b91-fdcbe9cc313c` |
| Cartesia | Jacqueline | Confident, young American adult female | `en-US` | `cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc` |
| Cartesia | Robyn | Neutral, mature Australian female | `en-AU` | `cartesia/sonic-3:f31cc6a7-c1e8-4764-980c-60a361443dd1` |
| Deepgram | Apollo | Comfortable, casual male | `en-US` | `deepgram/aura-2:apollo` |
| Deepgram | Athena | Smooth, professional female | `en-US` | `deepgram/aura-2:athena` |
| Deepgram | Odysseus | Calm, professional male | `en-US` | `deepgram/aura-2:odysseus` |
| Deepgram | Theia | Expressive, polite female | `en-AU` | `deepgram/aura-2:theia` |
| Fish Audio | Adrian | Friendly, casual American male | `en-US` | `fishaudio/s2.1-pro:bf322df2096a46f18c579d0baa36f41d` |
| Fish Audio | Ethan | A curious explainer. | `en-US` | `fishaudio/s2.1-pro:536d3a5e000945adb7038665781a4aca` |
| Fish Audio | Hannah | A conversational specialist. | `en-US` | `fishaudio/s2.1-pro:9a9cf47702da476aa4629e2506d4a857` |
| Fish Audio | Jordan | A motivational speaker. | `en-US` | `fishaudio/s2.1-pro:79d0bd3e4e5444b18f7b6d89b5927bf1` |
| Fish Audio | Laura | A confident female narrator. | `en-US` | `fishaudio/s2.1-pro:e3cd384158934cc9a01029cd7d278634` |
| Fish Audio | Sarah | An engaged speaker. | `en-US` | `fishaudio/s2.1-pro:933563129e564b19a115bedd57b7406a` |
| Fish Audio | Selene | A meditative female voice. | `en-US` | `fishaudio/s2.1-pro:b347db033a6549378b48d00acb0d06cd` |
| Gradium | Harper | Modern, confident and friendly American female | `en-US` | `gradium/default:4SZHfMpw-p46Ywgs` |
| Gradium | Sterling | Warm, energetic American male with theatrical flair | `en-US` | `gradium/default:6MFfc37kq0sBjBjy` |
| Gradium | Solène | Bright, warm and enthusiastic French female | `fr-FR` | `gradium/default:YhIHaAfQ0cQPDV9R` |
| Gradium | Marius | Energetic, confident French male | `fr-FR` | `gradium/default:biuhvu17TxVKOcyy` |
| Gradium | Lorena | Warm and lively young German female | `de-DE` | `gradium/default:aBNlTApBeOlVKa23` |
| Gradium | Mats | Sparky, attentive German male | `de-DE` | `gradium/default:Kf5m22mROozoMWj3` |
| Gradium | Vera | Sweet, expressive Castilian Spanish female | `es-ES` | `gradium/default:iTQW2xFICXk8riV4` |
| Gradium | Mateo | Sparky, attentive Peninsular Spanish male | `es-ES` | `gradium/default:sVLgzKMqaptUdaY8` |
| Gradium | Bianca | Bright, welcoming Brazilian female | `pt-BR` | `gradium/default:uCqxlQCKi8sPHwG2` |
| Gradium | Mateus | Warm, friendly Brazilian male | `pt-BR` | `gradium/default:AByHrwi1S-yLzW-s` |
| Rime | Astra | Chipper, upbeat American female | `en-US` | `rime/coda:astra` |
| Rime | Celeste | Chill Gen-Z American female | `en-US` | `rime/coda:celeste` |
| Rime | Luna | Chill but excitable American female | `en-US` | `rime/coda:luna` |
| Inworld | Ashley | Warm, natural American female | `en-US` | `inworld/inworld-tts-1:Ashley` |
| Inworld | Diego | Soothing, gentle Mexican male | `es-MX` | `inworld/inworld-tts-1:Diego ` |
| Inworld | Edward | Fast-talking, emphatic American male | `en-US` | `inworld/inworld-tts-1:Edward` |
| Inworld | Olivia | Upbeat, friendly British female | `en-GB` | `inworld/inworld-tts-1:Olivia` |
| xAI | Ara | Warm, friendly | `en-US` | `xai/tts-1:ara` |
| xAI | Eve | Energetic, upbeat | `en-US` | `xai/tts-1:eve` |
| xAI | Leo | Authoritative, strong | `en-US` | `xai/tts-1:leo` |
| xAI | Rex | Confident, clear | `en-US` | `xai/tts-1:rex` |
| xAI | Sal | Smooth, balanced | `en-US` | `xai/tts-1:sal` |
| xAI | Carina | Soft, empathetic | `en-US` | `xai/tts-1:carina` |
| xAI | Zagan | Powerful, dramatic | `en-US` | `xai/tts-1:zagan` |
| xAI | Helix | Bold, dynamic | `en-US` | `xai/tts-1:helix` |
| xAI | Orion | Rich, cinematic | `en-US` | `xai/tts-1:orion` |
| xAI | Luna | Gentle, patient | `en-US` | `xai/tts-1:luna` |
| xAI | Iris | Friendly, upbeat | `en-US` | `xai/tts-1:iris` |
| xAI | Altair | Elegant, refined | `en-US` | `xai/tts-1:altair` |
| xAI | Zenith | Sharp, focused | `en-US` | `xai/tts-1:zenith` |
| xAI | Perseus | Strong, confident | `en-US` | `xai/tts-1:perseus` |
| xAI | Helios | Upbeat, energetic | `en-US` | `xai/tts-1:helios` |
| xAI | Lux | Grounded, calm | `en-US` | `xai/tts-1:lux` |
| xAI | Kepler | Inventive, forward-thinking | `en-US` | `xai/tts-1:kepler` |
| xAI | Rigel | Precise, professional | `en-US` | `xai/tts-1:rigel` |
| xAI | Cosmo | Bright, curious | `en-US` | `xai/tts-1:cosmo` |
| xAI | Celeste | Compassionate, confident | `en-US` | `xai/tts-1:celeste` |
| xAI | Ursa | Friendly, warm | `en-US` | `xai/tts-1:ursa` |
| xAI | Sirius | Quick-witted, clever | `en-US` | `xai/tts-1:sirius` |
| xAI | Lumen | Warm, articulate | `en-US` | `xai/tts-1:lumen` |
| xAI | Castor | Charismatic, down-to-earth | `en-US` | `xai/tts-1:castor` |
| xAI | Naksh | Warm, thoughtful | `en-US` | `xai/tts-1:naksh` |
| xAI | Atlas | Confident, commanding | `en-US` | `xai/tts-1:atlas` |

## Plugins

The LiveKit Agents framework includes open source [plugins](https://docs.livekit.io/agents/models.md#plugins) for a wide range of TTS providers. Use a plugin when you need provider-specific features not available through Inference, want to manage billing directly, or need a provider not currently in Inference. Plugins require your own API key and account.

| Provider | Python | Node.js |
| -------- | ------ | ------- |
| [Amazon Polly](https://docs.livekit.io/agents/models/tts/aws.md) | ✓ | — |
| [AsyncAI](https://docs.livekit.io/agents/models/tts/asyncai.md) | ✓ | — |
| [Azure AI Speech](https://docs.livekit.io/agents/models/tts/azure.md) | ✓ | — |
| [Azure OpenAI](https://docs.livekit.io/agents/models/tts/azure-openai.md) | ✓ | — |
| [Baseten](https://docs.livekit.io/agents/models/tts/baseten.md) | ✓ | — |
| [Bland](https://docs.livekit.io/agents/models/tts/bland.md) | ✓ | — |
| [Camb.ai](https://docs.livekit.io/agents/models/tts/cambai.md) | ✓ | — |
| [Cartesia](https://docs.livekit.io/agents/models/tts/cartesia.md) | ✓ | ✓ |
| [Deepgram](https://docs.livekit.io/agents/models/tts/deepgram.md) | ✓ | ✓ |
| [ElevenLabs](https://docs.livekit.io/agents/models/tts/elevenlabs.md) | ✓ | ✓ |
| [Fish Audio](https://docs.livekit.io/agents/models/tts/fishaudio.md) | ✓ | — |
| [Gemini](https://docs.livekit.io/agents/models/tts/gemini.md) | ✓ | — |
| [Gnani](https://docs.livekit.io/agents/models/tts/gnani.md) | ✓ | — |
| [Google Cloud](https://docs.livekit.io/agents/models/tts/google.md) | ✓ | — |
| [Gradium](https://docs.livekit.io/agents/models/tts/gradium.md) | ✓ | — |
| [Groq](https://docs.livekit.io/agents/models/tts/groq.md) | ✓ | — |
| [Hume](https://docs.livekit.io/agents/models/tts/hume.md) | ✓ | — |
| [Inworld](https://docs.livekit.io/agents/models/tts/inworld.md) | ✓ | ✓ |
| [Kokoro](https://docs.livekit.io/agents/models/tts/kokoro.md) | ✓ | — |
| [LMNT](https://docs.livekit.io/agents/models/tts/lmnt.md) | ✓ | — |
| [Microsoft AI](https://docs.livekit.io/agents/models/tts/microsoft-ai.md) | ✓ | — |
| [MiniMax](https://docs.livekit.io/agents/models/tts/minimax.md) | ✓ | — |
| [Mistral AI](https://docs.livekit.io/agents/models/tts/mistralai.md) | ✓ | ✓ |
| [Murf AI](https://docs.livekit.io/agents/models/tts/murf.md) | ✓ | — |
| [Neuphonic](https://docs.livekit.io/agents/models/tts/neuphonic.md) | ✓ | ✓ |
| [Nvidia](https://docs.livekit.io/agents/models/tts/nvidia.md) | ✓ | — |
| [OpenAI](https://docs.livekit.io/agents/models/tts/openai.md) | ✓ | ✓ |
| [Resemble AI](https://docs.livekit.io/agents/models/tts/resemble.md) | ✓ | ✓ |
| [Respeecher](https://docs.livekit.io/agents/models/tts/respeecher.md) | ✓ | — |
| [Rime](https://docs.livekit.io/agents/models/tts/rime.md) | ✓ | ✓ |
| [Sarvam](https://docs.livekit.io/agents/models/tts/sarvam.md) | ✓ | ✓ |
| [Simplismart](https://docs.livekit.io/agents/models/tts/simplismart.md) | ✓ | — |
| [SLNG](https://docs.livekit.io/agents/models/tts/slng.md) | ✓ | — |
| [Smallest AI](https://docs.livekit.io/agents/models/tts/smallestai.md) | ✓ | — |
| [Soniox](https://docs.livekit.io/agents/models/tts/soniox.md) | ✓ | ✓ |
| [SpaceXAI](https://docs.livekit.io/agents/models/tts/spacexai.md) | ✓ | — |
| [Speechify](https://docs.livekit.io/agents/models/tts/speechify.md) | ✓ | — |
| [Speechmatics](https://docs.livekit.io/agents/models/tts/speechmatics.md) | ✓ | — |
| [Spitch](https://docs.livekit.io/agents/models/tts/spitch.md) | ✓ | — |

Have another provider in mind? LiveKit is open source and welcomes [new plugin contributions](https://docs.livekit.io/agents/models.md#contribute).

## TTS Usage

To set up TTS in an `AgentSession`, provide a descriptor with both the desired model and voice. LiveKit Inference manages the connection to the model automatically. Consult the [Suggested voices](#voices) list for suggested voices, or view the model reference for more voices.

**Python**:

```python
from livekit.agents import AgentSession, inference

session = AgentSession(
    tts=inference.TTS(
        model="fishaudio/s2.1-pro",
        voice="fa4c9eb3dccc4806b382b40d61c6b10a",
        language="en",
    ),
    # ... llm, stt, etc.
)

```

---

**Node.js**:

```typescript
import { AgentSession, inference } from '@livekit/agents';

const session = new AgentSession({
    tts: new inference.TTS({
        model: "fishaudio/s2.1-pro",
        voice: "fa4c9eb3dccc4806b382b40d61c6b10a",
        language: "en",
    }),
    // ... llm, stt, etc.
})

```

### Additional parameters

More configuration options, such as custom pronunciation, are available for each model. To set additional parameters, use the `TTS` class from the `inference` module. Consult each model reference for examples and available parameters.

### Language codes

All TTS plugins and LiveKit Inference use the `LanguageCode` type for the `language` parameter. `LanguageCode` accepts any common language format and normalizes it automatically to [BCP-47](https://www.rfc-editor.org/info/bcp47). You don't need to look up the specific format each provider expects — pass any of the following and the framework handles the conversion:

- ISO 639-1: `"en"`, `"es"`, `"fr"`
- BCP-47 with region: `"en-US"`, `"zh-Hans-CN"`
- ISO 639-3: `"eng"`, `"spa"`
- Language names: `"english"`, `"spanish"`
- Underscored variants: `"en_us"` (normalized to `"en-US"`)

For example, all of the following are equivalent:

**Python**:

```python
from livekit.agents import LanguageCode

LanguageCode("english")  # → "en"
LanguageCode("eng")      # → "en"
LanguageCode("en")       # → "en"
LanguageCode("en-US")    # → "en-US"
LanguageCode("en_us")    # → "en-US"

```

`LanguageCode` is a `str` subclass, so you can use it anywhere a string is expected. It also provides properties for extracting parts of the code:

- `.language`: Base ISO 639-1 code (e.g., `"en"` from `"en-US"`).
- `.region`: Region subtag, if present (e.g., `"US"` from `"en-US"`).
- `.iso`: ISO 639-1 tag with region (e.g., `"zh-CN"` from `"cmn-Hans-CN"`).

---

**Node.js**:

```typescript
import { normalizeLanguage } from '@livekit/agents';

normalizeLanguage("english")  // → "en"
normalizeLanguage("eng")      // → "en"
normalizeLanguage("en")       // → "en"
normalizeLanguage("en-US")    // → "en-US"
normalizeLanguage("en_us")    // → "en-US"

```

In Node.js, `LanguageCode` is a branded `string` type. Use `normalizeLanguage()` to convert a plain string to a `LanguageCode`, and the standalone helper functions to extract parts of the code:

- `getBaseLanguage(lang)`: Base ISO 639-1 code (e.g., `"en"` from `"en-US"`).
- `getLanguageRegion(lang)`: Region subtag, if present (e.g., `"US"` from `"en-US"`).
- `getIsoLanguage(lang)`: ISO 639-1 tag with region (e.g., `"zh-CN"` from `"cmn-Hans-CN"`).

### Custom TTS

To create an entirely custom TTS, implement the [TTS node](https://docs.livekit.io/agents/build/nodes.md#tts_node) in your agent.

### Standalone TTS

You can use a `TTS` instance as a standalone component by creating a stream. Use `push_text` to add text to the stream, and then consume a stream of `SynthesizedAudio` to publish as [realtime audio](https://docs.livekit.io/transport/media.md) to another participant.

Here is an example of a standalone TTS app:

** Filename: `agent.py`**

```python
import asyncio
from livekit import agents, rtc
from livekit.agents import AgentServer
from livekit.agents.tts import SynthesizedAudio
from livekit.plugins import cartesia
from typing import AsyncIterable


server = AgentServer()

@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: agents.JobContext):
    text_stream: AsyncIterable[str] = ... # you need to provide a stream of text
    audio_source = rtc.AudioSource(44100, 1)

    track = rtc.LocalAudioTrack.create_audio_track("agent-audio", audio_source)
    await ctx.room.local_participant.publish_track(track)

    tts = cartesia.TTS(model="sonic-english")
    tts_stream = tts.stream()

    # create a task to consume and publish audio frames
    asyncio.create_task(send_audio(tts_stream))

    # push text into the stream, TTS stream will emit audio frames along with events
    # indicating sentence (or segment) boundaries.
    async for text in text_stream:
        tts_stream.push_text(text)
    tts_stream.end_input()

    async def send_audio(audio_stream: AsyncIterable[SynthesizedAudio]):
        async for a in audio_stream:
            await audio_source.capture_frame(a.audio.frame)

if __name__ == "__main__":
    agents.cli.run_app(server)

```

## Additional resources

The following resources cover related topics that may be useful for your application.

- **[Agent speech docs](https://docs.livekit.io/agents/build/audio.md)**: Explore the speech capabilities and features of LiveKit Agents.

- **[Pipeline nodes](https://docs.livekit.io/agents/build/nodes.md)**: Learn how to customize the behavior of your agent by overriding nodes in the voice pipeline.

- **[Inference pricing](https://livekit.com/pricing/inference#tts)**: The latest pricing information for TTS models in LiveKit Inference.

---

This document was rendered at 2026-10-24T20:20:12.142Z.
For the latest version of this document, see [https://docs.livekit.io/agents/models/tts.md](https://docs.livekit.io/agents/models/tts.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).

<!-- ================================================================ -->
## Page: https://docs.livekit.io/agents/logic/tools/definition.md

LiveKit docs › Build Agents › Logic & Structure › Tool definition & use › Function tools

---

# Function tools

> How to design and register custom tools for your agent.

## Overview

The LLM has access to any tools you add to your agent class. This page covers how to define them, call HTTP APIs, use RunContext, handle speech and interruptions, add tools dynamically, and surface errors.

## Tool definition

**Python**:

Add tools to your agent class with the `@function_tool` decorator.

```python
from typing import Any
from livekit.agents import function_tool, Agent, RunContext

class MyAgent(Agent):
    @function_tool()
    async def lookup_weather(
        self,
        context: RunContext,
        location: str,
    ) -> dict[str, Any]:
        """Look up weather information for a given location.

        Args:
            location: The location to look up weather information for.
        """

        return {"weather": "sunny", "temperature_f": 70}

```

---

**Node.js**:

Add tools to your agent class with the `llm.tool` function. This example uses [Zod](https://zod.dev) to make it easy to provide a typed, annotated tool definition.

```typescript
import { voice, llm } from '@livekit/agents';
import { z } from 'zod';

const agent = voice.Agent.create({
  instructions: 'You are a helpful assistant.',
  tools: [
    llm.tool({
      name: 'lookupWeather',
      description: 'Look up weather information for a given location.',
      parameters: z.object({
        location: z.string().describe("The location to look up weather information for.")
      }),
      execute: async ({ location }, { ctx }) => {
        return { weather: "sunny", temperatureF: 70 };
      },
    }),
  ],
});


```

You can also define the tool parameters as a [JSON schema](https://json-schema.org/). For example, the tool in the example above can be defined as follows:

```typescript
parameters: {
  type: "object",
  properties: {
    location: {
      type: "string",
      description: "The location to look up weather information for."
    }
  }
}

```

When using Zod, `parameters` must be a `z.object({...})` — other top-level types like `z.discriminatedUnion()` aren't supported because LLM tool-calling APIs require a JSON object. Use optional or nullable fields within the object to model variant behavior. If you use OpenAI with strict mode, prefer `.nullable()` over `.optional()`.

> 💡 **Best practices**
> 
> A good tool definition is key to reliable tool use from your LLM. Be specific about what the tool does, when it should or should not be used, what the arguments are for, and what type of return value to expect.

> ℹ️ **Note**
> 
> In Node.js, `tool`, `Agent`, and the other `voice` / `llm` exports are available directly from `@livekit/agents` (for example `import { Agent, tool } from '@livekit/agents'`), so the `voice.` / `llm.` prefixes are optional. The namespaced form shown throughout these docs works too.

### Decorator parameters

Tool decorators transform regular functions into tools the LLM can call. The `@function_tool` decorator in Python and `llm.tool()` function in Node.js accept optional parameters to control how a tool is presented to the LLM and when it's available:

**Python**:

| Parameter | Type | Default | Description |
| `name` | `str` | `None` | Override the tool name sent to the LLM. Defaults to the function name. |
| `description` | `str` | `None` | Override the tool description sent to the LLM. Defaults to the function docstring. |
| `raw_schema` | `dict` | `None` | A raw JSON function-calling schema. See [Creating tools from raw schema](#creating-tools-from-raw-schema). |
| `flags` | `ToolFlag` | `ToolFlag.NONE` | Behavior flags that control when the tool is available. See [Tool flags](#tool-flags). |

---

**Node.js**:

| Parameter | Type | Default | Description |
| `name` | `string` | — | The tool name sent to the LLM. Required. |
| `description` | `string` | — | The tool description sent to the LLM. Required. |
| `parameters` | `ZodSchema` or `JSONSchema` | — | Schema for the tool's input parameters. |
| `execute` | `Function` | — | The function called when the LLM invokes the tool. |
| `flags` | `number` | `ToolFlag.NONE` | Behavior flags that control when the tool is available. See [Tool flags](#tool-flags). |

### Tool flags

Tool flags control how a tool behaves at runtime. Set them using the `flags` parameter.

| Flag | Description |
| `NONE` | Default. No special behavior. |
| `IGNORE_ON_ENTER` | Excludes the tool from any `generate_reply` calls made inside the agent's `on_enter` method. |
| `CANCELLABLE` | Lets the LLM cancel the tool while it's running. See [Cancellation](https://docs.livekit.io/agents/logic/tools/async.md#cancellation). |

`IGNORE_ON_ENTER` is useful for tools that shouldn't be called during the agent's initial greeting. For example, a "confirm address" tool should not be available until the user has actually provided an address:

**Python**:

```python
from livekit.agents import Agent, RunContext, function_tool
from livekit.agents.llm.tool_context import ToolFlag


class AddressAgent(Agent):
    def __init__(self):
        super().__init__(
            instructions="You help users provide their address.",
        )

    async def on_enter(self) -> None:
        self.session.generate_reply(
            instructions="Ask the user to provide their address."
        )

    @function_tool(flags=ToolFlag.IGNORE_ON_ENTER)
    async def confirm_address(self, ctx: RunContext) -> None:
        """Confirm the address provided by the user."""
        # This tool is NOT available during on_enter,
        # preventing the LLM from confirming before the user speaks.
        ...

```

---

**Node.js**:

```typescript
import { voice, llm } from '@livekit/agents';
import { z } from 'zod';

const addressAgent = voice.Agent.create({
  instructions: 'You help users provide their address.',
  tools: [
    llm.tool({
      name: 'confirmAddress',
      description: 'Confirm the address provided by the user.',
      flags: llm.ToolFlag.IGNORE_ON_ENTER,
      execute: async (_, { ctx }) => {
        // This tool is NOT available during onEnter,
        // preventing the LLM from confirming before the user speaks.
      },
    }),
  ],
  onEnter(ctx) {
    ctx.session.generateReply({
      instructions: 'Ask the user to provide their address.',
    });
  },
});

```

> ℹ️ **Note**
> 
> In Node.js, the `tools: [ ... ]` array syntax is preferred and is required for Toolsets and provider tools. For backward compatibility, function tools can also use the legacy object syntax (`tools: { lookupWeather: llm.tool({ ... }) }`); in that form, the object key supplies the tool name internally.

### Tool IDs

Available in:
- [x] Node.js
- [x] Python

Every tool has a stable `id` property that uniquely identifies it. For function tools, the ID defaults to the function name or the explicit `name` parameter:

**Python**:

```python
@function_tool()
async def lookup_weather(context: RunContext, location: str) -> str:
    """Look up weather for a location."""
    return "sunny"

lookup_weather.id  # "lookup_weather"

@function_tool(name="get_weather")
async def my_func(context: RunContext, location: str) -> str:
    return "sunny"

my_func.id  # "get_weather"

```

---

**Node.js**:

```typescript
const lookupWeather = llm.tool({
  name: 'lookupWeather',
  description: 'Look up weather for a location.',
  parameters: z.object({
    location: z.string(),
  }),
  execute: async ({ location }) => {
    return 'sunny';
  },
});

lookupWeather.id; // "lookupWeather"

```

For `FunctionTool` in Node.js, `id === name`. Provider tools also expose IDs so they can be added, removed, and tracked consistently. Use `agent.toolCtx.hasTool(id)` to check whether a tool is currently available. Tool names must be unique across an agent's tool context; registering two different function tools with the same name raises an error.

Tool IDs are used for deduplication when calling `update_tools()` or `updateTools()`. IDs also enable tracking tool changes in conversation history through [`AgentConfigUpdate`](#tracking-configuration-changes).

### Arguments

Tool arguments are automatically inferred from the function signature. Parameter names and type hints are sent to the LLM as part of the tool schema.

To provide additional information about arguments beyond the type hints, include it in the tool description or use `raw_schema` for full control over the [argument schema](#creating-tools-from-raw-schema).

### Return value

The tool return value is automatically converted to a string before being sent to the LLM. The LLM generates a new reply or additional tool calls based on the return value. Return `None` or nothing at all to complete the tool silently without requiring a reply from the LLM.

You can use the return value to initiate a [handoff](https://docs.livekit.io/agents/logic/agents-handoffs.md#tool-handoff) to a different Agent within a workflow. Optionally, you can return a tool result to the LLM as well. The tool call and subsequent LLM reply are completed prior to the handoff.

In Python, return a tuple that includes both the `Agent` instance and the result. If there is no tool result, you can return the new `Agent` instance by itself.

In Node.js, return an instance of `llm.handoff`, which specifies the new `Agent` instance and the tool's return value, if any.

When a handoff occurs, prompt the LLM to inform the user:

**Python**:

```python
@function_tool()
async def my_tool(context: RunContext):
    return SomeAgent(), "Transferring the user to SomeAgent"

```

---

**Node.js**:

```typescript
const myTool = llm.tool({
  name: 'myTool',
  description: 'Example tool that hands off to another agent',
  execute: async (_, { ctx }) => {
    return llm.handoff({
      agent: createSomeAgent(),
      returns: 'Transferring the user to SomeAgent',
    });
  },
});

```

### Structured output

Some LLMs can return structured JSON payloads that define behavior like TTS style separately from the spoken text.

In this example, the LLM streams a JSON object that has both TTS style directives and a spoken response. The TTS style is applied once per message and the spoken response is stripped out for downstream processing. The example contains two code blocks: the format of the JSON and the parsing logic, and an implementation example in an agent workflow.

> 💡 **Tip**
> 
> This example uses a `cast` for the LLM and TTS instances. It's specifically built to work with OpenAI (or OpenAI-compatible) APIs. Read more in the [OpenAI Structured Outputs docs](https://developers.openai.com/docs/guides/structured-outputs).

#### Core components: Definition and parsing

This code block has two components: the `ResponseEmotion` schema definition and the `process_structured_output` parsing function.

- `ResponseEmotion`: Defines the structure of the JSON object, with both the TTS style directives (`voice_instructions`) and the spoken `response`.
- `process_structured_output`: Incrementally parses the JSON object, optionally applies a callback for TTS style directives, and only streams the spoken `response`.

```python
class ResponseEmotion(TypedDict):
    voice_instructions: Annotated[
        str,
        Field(..., description="Concise TTS directive for tone, emotion, intonation, and speed"),
    ]
    response: str

async def process_structured_output(
    text: AsyncIterable[str],
    callback: Optional[Callable[[ResponseEmotion], None]] = None,
) -> AsyncIterable[str]:
    last_response = ""
    acc_text = ""
    async for chunk in text:
        acc_text += chunk
        try:
            resp: ResponseEmotion = from_json(acc_text, allow_partial="trailing-strings")
        except ValueError:
            continue

        if callback:
            callback(resp)

        if not resp.get("response"):
            continue

        new_delta = resp["response"][len(last_response) :]
        if new_delta:
            yield new_delta
        last_response = resp["response"]

```

#### Agent method implementation

This agent implementation example overrides default behavior with custom logic using the LLM and TTS nodes: [`llm_node`](https://docs.livekit.io/agents/build/nodes.md#llm_node) and [`tts_node`](https://docs.livekit.io/agents/build/nodes.md#tts_node).

- `llm_node`: Casts the LLM instance to the OpenAI type, streams the output using the `ResponseEmotion` schema, and parses it into structured JSON.
- `tts_node`: Processes the streamed JSON with a callback that applies the TTS style directives (`voice_instructions`), then streams the audio from the `response`.

```python
async def llm_node(
    self, chat_ctx: ChatContext, tools: list[FunctionTool], model_settings: ModelSettings
):
    # not all LLMs support structured output, so we need to cast to the specific LLM type
    llm = cast(openai.LLM, self.llm)
    tool_choice = model_settings.tool_choice if model_settings else NOT_GIVEN
    async with llm.chat(
        chat_ctx=chat_ctx,
        tools=tools,
        tool_choice=tool_choice,
        response_format=ResponseEmotion,
    ) as stream:
        async for chunk in stream:
            yield chunk

async def tts_node(self, text: AsyncIterable[str], model_settings: ModelSettings):
    instruction_updated = False

    def output_processed(resp: ResponseEmotion):
        nonlocal instruction_updated
        if resp.get("voice_instructions") and resp.get("response") and not instruction_updated:
            # when the response isn't empty, we can assume voice_instructions is complete.
            # (if the LLM sent the fields in the right order)
            instruction_updated = True
            logger.info(
                f"Applying TTS instructions before generating response audio: "
                f'"{resp["voice_instructions"]}"'
            )

            tts = cast(openai.TTS, self.tts)
            tts.update_options(instructions=resp["voice_instructions"])

    # process_structured_output strips the TTS instructions and only synthesizes the verbal part
    # of the LLM output
    return Agent.default.tts_node(
        self, process_structured_output(text, callback=output_processed), model_settings
    )

```

### RunContext

Tools include support for a special `context` argument. This contains access to the current `session`, `function_call`, `speech_handle`, and `userdata`. Consult the documentation on [speech](https://docs.livekit.io/agents/build/audio.md) and [state within workflows](https://docs.livekit.io/agents/logic/workflows.md) for more information about how to use these features.

### Using speech in tool calls

You can generate agent speech from within a tool using `session.say()` or `session.generate_reply()` like normal. Use `ctx.wait_for_playout()` to wait for any pre-tool speech to finish.

**Python**:

```python
@function_tool()
async def process_order(self, context: RunContext, order_id: str):
    """Process an order and notify the user."""

    # Generate speech and await it
    await self.session.generate_reply(
        instructions=f"Processing order {order_id}. This may take a moment."
    )

    # Now perform the actual order processing
    result = await process_order_internal(order_id)
    return result

```

---

**Node.js**:

```typescript
const processOrder = llm.tool({
  name: 'processOrder',
  description: 'Process an order and notify the user.',
  parameters: z.object({
    orderId: z.string(),
  }),
  execute: async ({ orderId }, { ctx }) => {
    // Notify the user and wait for speech to finish
    await ctx.session.generateReply({
      instructions: `Processing order ${orderId}. This may take a moment.`,
    });

    // Now perform the actual order processing
    const result = await processOrderInternal(orderId);
    return result;
  },
});

```

### Interruptions

By default, tools can be interrupted if the user speaks. A tool continues running in the background until it returns; interrupting the agent doesn't cancel the work.

A tool that finishes before the interruption keeps both the call and the result in the chat history, so the model doesn't call it again on the next turn. Recording the result doesn't prompt a reply, so the agent doesn't speak.

An interrupted agent handoff never takes effect, and the two SDKs record the interruption differently. Python keeps the call and answers it with an error. Node.js removes the call from the chat history. In neither case does the agent switch.

This default works for most tools. For a tool that blocks the agent's turn (for example, a tool whose result the agent must wait for before responding), you can either handle the interruption by canceling in-flight work when the user speaks, or prevent the interruption by keeping the tool running and the agent engaged for actions that can't be rolled back.

> 💡 **Tip**
> 
> For work that takes more than a few seconds, don't block the turn at all. Use an [async tool](https://docs.livekit.io/agents/logic/tools/async.md) so the agent can keep talking and send progress updates while the tool runs.

#### Handle interruptions

To regain control when the user interrupts so you can cancel your in-flight work instead of letting it finish: in Python, call `speech_handle.wait_if_not_interrupted()` to wait for your task, then check `speech_handle.interrupted` to decide whether to return the result or cancel it. In Node.js, use the `abortSignal` passed to `execute`, which is aborted when the tool is interrupted. Forward it to your async work so the work is cancelled too. Both approaches suit a short, read-only lookup whose result the agent needs before it can respond, such as checking an order status or account balance:

**Python**:

```python
import asyncio

from livekit.agents import Agent, RunContext, function_tool


class MyAgent(Agent):
    def __init__(self) -> None:
        super().__init__(instructions="You are a voice agent.")

    @function_tool
    async def get_order_status(self, order_id: str, run_ctx: RunContext) -> str | None:
        """Look up the status of an order when the user asks about it.

        Args:
            order_id: The ID of the order to look up.
        """
        # Start the lookup and wait for it to finish or be interrupted
        wait_for_result = asyncio.ensure_future(self._lookup_order(order_id))
        await run_ctx.speech_handle.wait_if_not_interrupted([wait_for_result])

        if run_ctx.speech_handle.interrupted:
            # The user spoke first: cancel the lookup and skip the reply by returning None.
            # Returning None records an empty result for the call and asks for no reply.
            wait_for_result.cancel()
            return None

        # The lookup finished without interruption: return its result to the LLM
        return wait_for_result.result()

    async def _lookup_order(self, order_id: str) -> str:
        # Simulate a short lookup, such as a database or API query
        await asyncio.sleep(2)
        return f"Order {order_id} shipped and arrives tomorrow"

```

---

**Node.js**:

```typescript
const getOrderStatus = llm.tool({
  name: 'getOrderStatus',
  description: 'Look up the status of an order when the user asks about it.',
  parameters: z.object({ orderId: z.string() }),
  execute: async ({ orderId }, { abortSignal }) => {
    // The abortSignal is aborted if the user interrupts. Forwarding it to
    // fetch cancels the request instead of letting it run to completion.
    const response = await fetch(
      `https://api.example.com/orders/${encodeURIComponent(orderId)}`,
      { signal: abortSignal },
    );
    return await response.json();
  },
});

```

In Python, because the work isn't canceled for you, cancel it explicitly when an interruption occurs, as the example does before returning `None`. Otherwise the lookup runs to completion in the background after the tool has returned `None`, and produces a result that can no longer reach the agent. In Node.js, the `abortSignal` is always provided, so you don't need to guard it with `if (abortSignal)`. It's currently aborted only on the main voice pipeline. Tool calls on other paths receive a signal that never aborts.

#### Prevent interruptions

If your tool takes external actions that can't be rolled back, disable interruptions by calling `run_ctx.disallow_interruptions()` (Python) or `ctx.disallowInterruptions()` (Node.js) at the start of your tool so user speech won't interrupt the agent's task.

For best practices on providing feedback to the user during long-running tool calls, see the section on [user feedback](https://docs.livekit.io/agents/build/external-data.md#user-feedback) in the External data and RAG guide.

To play a pre-synthesized hold message (such as "let me check that for you") while a tool executes, see [Using cached TTS in a tool call](https://docs.livekit.io/agents/multimodality/audio/customization.md#cached-tts-in-tools). This avoids TTS latency during tool execution and lets you cancel the message early if the external API returns quickly.

### Calling HTTP APIs

Most tools call an external HTTP API to fetch data or trigger actions. In Python, use the shared `aiohttp` session described below. In Node.js, use the built-in `fetch` API.

#### Best practices

Keep these recommendations in mind when calling external APIs from tools:

- **Reuse the shared HTTP session (Python).** Call `utils.http_context.http_session()` to get a shared session that's bound to the job, pools and reuses connections across calls, and closes automatically when the job ends. Outside a job context (tests or scripts), it raises `RuntimeError`. Wrap that code in `async with utils.http_context.open():` or pass your own session. (Node.js needs no equivalent: the global `fetch` already reuses connections.)
- **Disable interruptions for mutating calls.** By default, tools can be [interrupted](#interruptions) by user speech. For read-only requests this is fine, because a completed lookup keeps its result in the chat history. But if your tool writes data (placing an order, scheduling an appointment, sending a message), an interruption can leave the operation partially complete with no way to roll back. Call `context.disallow_interruptions()` (Python) or `ctx.disallowInterruptions()` (Node.js) at the start of any tool that mutates external state.
- **Raise `ToolError` on failure.** This returns the error message to the LLM so it can inform the user rather than crashing the tool. See [error handling](#error-handling) for more details.
- **Store credentials in environment variables.** For APIs that require authentication, pass headers to your request and load API keys from environment variables rather than hard-coding them.
- **Set timeouts.** External services can be slow or unresponsive. Set explicit timeouts on your HTTP requests to avoid blocking the agent indefinitely. See the section on [user feedback](https://docs.livekit.io/agents/build/external-data.md#user-feedback) for ways to keep the user informed during long-running calls.

#### Example: Fetching data from an API

The following example defines a tool that fetches a realtime stock quote from an external API. The tool takes a ticker symbol as input, makes a GET request, and returns structured data to the LLM:

**Python**:

```python
from livekit.agents import Agent, RunContext, function_tool, utils
from livekit.agents.llm import ToolError

class StockAgent(Agent):
    def __init__(self):
        super().__init__(
            instructions="You are a helpful stock market assistant.",
        )

    @function_tool()
    async def get_stock_price(
        self,
        context: RunContext,
        symbol: str,
    ) -> dict:
        """Get the current stock price for a given ticker symbol.

        Args:
            symbol: The stock ticker symbol, for example AAPL or GOOGL.
        """
        url = f"https://livekit-stock-api.vercel.app/api/quote?symbol={symbol}"
        session = utils.http_context.http_session()
        async with session.get(url) as response:
            if response.status != 200:
                raise ToolError(f"Could not fetch stock price for {symbol}.")
            data = await response.json()
            return {
                "symbol": data["symbol"],
                "price": data["price"],
                "volume": data["volume"],
                "latest_trading_day": data["latestTradingDay"],
            }

```

---

**Node.js**:

```typescript
import { voice, llm } from '@livekit/agents';
import { z } from 'zod';

const stockAgent = voice.Agent.create({
  instructions: 'You are a helpful stock market assistant.',
  tools: [
    llm.tool({
      name: 'getStockPrice',
      description: 'Get the current stock price for a given ticker symbol.',
      parameters: z.object({
        symbol: z.string().describe('The stock ticker symbol, for example AAPL or GOOGL.'),
      }),
      execute: async ({ symbol }) => {
        const url = `https://livekit-stock-api.vercel.app/api/quote?symbol=${encodeURIComponent(symbol)}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new llm.ToolError(`Could not fetch stock price for ${symbol}.`);
        }
        const data = await response.json();
        return {
          symbol: data.symbol,
          price: data.price,
          volume: data.volume,
          latestTradingDay: data.latestTradingDay,
        };
      },
    }),
  ],
});

```

#### Example: Mutating an external API

When a tool performs a write operation such as placing an order or updating a record, disable interruptions to prevent partial execution:

**Python**:

```python
@function_tool()
async def place_order(
    self,
    context: RunContext,
    item: str,
    quantity: int,
) -> str:
    """Place an order for an item.

    Args:
        item: The item to order.
        quantity: The number of items to order.
    """
    # Prevent user speech from interrupting this tool mid-request
    context.disallow_interruptions()

    session = utils.http_context.http_session()
    async with session.post(
        "https://api.example.com/orders",
        json={"item": item, "quantity": quantity},
        headers={"Authorization": f"Bearer {os.environ['API_KEY']}"},
    ) as response:
        if response.status != 201:
            raise ToolError("Failed to place order. Please try again.")
        data = await response.json()
        return f"Order {data['order_id']} placed successfully."

```

---

**Node.js**:

```typescript
const placeOrder = llm.tool({
  name: 'placeOrder',
  description: 'Place an order for an item.',
  parameters: z.object({
    item: z.string().describe('The item to order.'),
    quantity: z.number().describe('The number of items to order.'),
  }),
  execute: async ({ item, quantity }, { ctx }) => {
    // Prevent user speech from interrupting this tool mid-request
    ctx.disallowInterruptions();

    const response = await fetch('https://api.example.com/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_KEY}`,
      },
      body: JSON.stringify({ item, quantity }),
    });
    if (!response.ok) {
      throw new llm.ToolError('Failed to place order. Please try again.');
    }
    const data = await response.json();
    return `Order ${data.orderId} placed successfully.`;
  },
});

```

### Adding tools dynamically

You can exercise more control over the tools available by setting the `tools` argument directly.

To share a tool between multiple agents, define it outside of their class and then provide it to each. The `RunContext` is especially useful for this purpose to access the current session, agent, and state.

Tools set in the `tools` value are available alongside any registered within the class using the `@function_tool` decorator.

**Python**:

```python
from livekit.agents import function_tool, Agent, RunContext

@function_tool()
async def lookup_user(
    context: RunContext,
    user_id: str,
) -> dict:
    """Look up a user's information by ID."""

    return {"name": "John Doe", "email": "john.doe@example.com"}


class AgentA(Agent):
    def __init__(self):
        super().__init__(
            tools=[lookup_user],
            # ...
        )


class AgentB(Agent):
    def __init__(self):
        super().__init__(
            tools=[lookup_user],
            # ...
        )

```

---

**Node.js**:

```typescript
import { voice, llm } from '@livekit/agents';
import { z } from 'zod';

const lookupUser = llm.tool({
  name: 'lookupUser',
  description: 'Look up a user\'s information by ID.',
  parameters: z.object({
    userId: z.string(),
  }),
  execute: async ({ userId }, { ctx }) => {
    return { name: "John Doe", email: "john.doe@example.com" };
  },
});

const agentA = voice.Agent.create({
  tools: [lookupUser],
  // ...
});

const agentB = voice.Agent.create({
  tools: [lookupUser],
  // ...
});

```

Use `agent.update_tools()` (Python) or `agent.updateTools()` (Node.js) to update available tools after creating an agent. This replaces _all_ tools, including those registered automatically within the agent class. To reference existing tools before replacement, access `agent.tools` in Python or `agent.toolCtx.tools` in Node.js:

**Python**:

```python
# add a tool
await agent.update_tools(agent.tools + [tool_a])

# remove a tool
await agent.update_tools([t for t in agent.tools if t.id != tool_a.id])

# replace all tools
await agent.update_tools([tool_a, tool_b])

```

---

**Node.js**:

```typescript
// add a tool
await agent.updateTools([...agent.toolCtx.tools, toolA])

// remove a tool
await agent.updateTools(agent.toolCtx.tools.filter((t) => t.id !== 'toolA'))

// replace all tools
await agent.updateTools([toolA, toolB])

```

### Creating tools programmatically

To create a tool on the fly, use `function_tool` as a function rather than as a decorator. You must supply a name, description, and callable function. This is useful to compose specific tools based on the same underlying code or load them from external sources such as a database or Model Context Protocol (MCP) server.

In the following example, the app has a single function to set any user profile field but gives the agent one tool per field for improved reliability:

**Python**:

```python
from livekit.agents import function_tool, RunContext

class Assistant(Agent):
    def _set_profile_field_func_for(self, field: str):
        async def set_value(context: RunContext, value: str):
            # custom logic to set input
            return f"field {field} was set to {value}"

        return set_value

    def __init__(self):
        super().__init__(
            tools=[
                function_tool(self._set_profile_field_func_for("phone"),
                              name="set_phone_number",
                              description="Call this function when user has provided their phone number."),
                function_tool(self._set_profile_field_func_for("email"),
                              name="set_email",
                              description="Call this function when user has provided their email."),
                # ... other tools ...
            ],
            # instructions, etc ...
        )

```

---

**Node.js**:

```typescript
import { voice, llm } from '@livekit/agents';
import { z } from 'zod';

function createSetProfileFieldTool(name: string, field: string) {
  return llm.tool({
    name,
    description: `Call this function when user has provided their ${field}.`,
    parameters: z.object({
      value: z.string().describe(`The ${field} value to set`),
    }),
    execute: async ({ value }, { ctx }) => {
      // custom logic to set input
      return `field ${field} was set to ${value}`;
    },
  });
}

const assistant = voice.Agent.create({
  tools: [
    createSetProfileFieldTool('setPhoneNumber', 'phone number'),
    createSetProfileFieldTool('setEmail', 'email'),
    // ... other tools ...
  ],
  // instructions, etc ...
});

```

### Creating tools from raw schema

For advanced use cases, you can create tools directly from a [raw function calling schema](https://developers.openai.com/docs/guides/function-calling?api-mode=responses). This is useful when integrating with existing function definitions, loading tools from external sources, or working with schemas that don't map cleanly to Python function signatures.

Use the `raw_schema` parameter in the `@function_tool` decorator to provide the full function schema:

**Python**:

```python
from livekit.agents import function_tool, RunContext

raw_schema = {
    "type": "function",
    "name": "get_weather",
    "description": "Get weather for a given location.",
    "parameters": {
        "type": "object",
        "properties": {
            "location": {
                "type": "string",
                "description": "City and country e.g. New York"
            }
        },
        "required": [
            "location"
        ],
        "additionalProperties": False
    }
}

@function_tool(raw_schema=raw_schema)
async def get_weather(raw_arguments: dict[str, object], context: RunContext):
    location = raw_arguments["location"]

    # Your implementation here
    return f"The weather of {location} is ..."

```

---

**Node.js**:

```typescript
import { voice, llm } from '@livekit/agents';

const rawSchema = {
  type: 'object',
  properties: {
    location: {
      type: 'string',
      description: 'City and country e.g. New York'
    }
  },
  required: ['location'],
  additionalProperties: false
};

const getWeather = llm.tool({
  name: 'getWeather',
  description: 'Get weather for a given location.',
  parameters: rawSchema,
  execute: async ({ location }, { ctx }) => {
    // Your implementation here
    return `The weather of ${location} is ...`;
  },
});

```

When using raw schemas, function parameters are passed to your handler as a dictionary named `raw_arguments`. You can extract values from this dictionary using the parameter names defined in your schema.

You can also create tools programmatically using `function_tool` as a function with raw schemas:

**Python**:

```python
from livekit.agents import function_tool

def create_database_tool(table_name: str, operation: str):
    schema = {
        "type": "function",
        "name": f"{operation}_{table_name}",
        "description": f"Perform {operation} operation on {table_name} table",
        "parameters": {
            "type": "object",
            "properties": {
                "record_id": {
                    "type": "string",
                    "description": f"ID of the record to {operation}"
                }
            },
            "required": ["record_id"]
        }
    }

    async def handler(raw_arguments: dict[str, object], context: RunContext):
        record_id = raw_arguments["record_id"]
        # Perform database operation
        return f"Performed {operation} on {table_name} for record {record_id}"

    return function_tool(handler, raw_schema=schema)

# Create tools dynamically
user_tools = [
    create_database_tool("users", "read"),
    create_database_tool("users", "update"),
    create_database_tool("users", "delete")
]

class DataAgent(Agent):
    def __init__(self):
        super().__init__(
            instructions="You are a database assistant.",
            tools=user_tools,
        )

```

---

**Node.js**:

```typescript
import { voice, llm } from '@livekit/agents';
import { z } from 'zod';

function createDatabaseTool(name: string, tableName: string, operation: string) {
  return llm.tool({
    name,
    description: `Perform ${operation} operation on ${tableName} table`,
    parameters: z.object({
      recordId: z.string().describe(`ID of the record to ${operation}`),
    }),
    execute: async ({ recordId }, { ctx }) => {
      // Perform database operation
      return `Performed ${operation} on ${tableName} for record ${recordId}`;
    },
  });
}

// Create tools dynamically
const dataAgent = voice.Agent.create({
  instructions: 'You are a database assistant.',
  tools: [
    createDatabaseTool('readUsers', 'users', 'read'),
    createDatabaseTool('updateUsers', 'users', 'update'),
    createDatabaseTool('deleteUsers', 'users', 'delete'),
  ],
});

```

## Toolsets

To bundle related tools under a single ID and add or remove them as a group, use a [Toolset](https://docs.livekit.io/agents/logic/tools/toolsets.md). Python also includes the built-in [MCPToolset](https://docs.livekit.io/agents/logic/tools/mcp.md) and beta `ToolSearchToolset` and `ToolProxyToolset` for [dynamic tool discovery](https://docs.livekit.io/agents/logic/tools/toolsets.md#dynamic-tool-discovery), which are built on this primitive.

## Tracking configuration changes

Available in:
- [x] Node.js
- [x] Python

When an agent starts with configured tools or instructions, or when you update an agent's tools or instructions at runtime, an `AgentConfigUpdate` is automatically added to the conversation history. This record includes:

- **`instructions`**: The updated instructions, if changed.
- **`tools_added` / `toolsAdded`**: Names of any tools that were added.
- **`tools_removed` / `toolsRemoved`**: Names of any tools that were removed.

**Python**:

```python
# Tool changes are tracked automatically
await agent.update_tools([new_tool_a, new_tool_b])

# Instruction changes are also tracked
await agent.update_instructions("You are now a support agent.")

```

---

**Node.js**:

```typescript
// Tool changes are tracked automatically
await agent.updateTools([newToolA, newToolB]);

// Instruction changes are also tracked
await agent.updateInstructions('You are now a support agent.');

```

This gives the LLM visibility into configuration changes, which is useful in [multi-agent workflows](https://docs.livekit.io/agents/logic/workflows.md) where agents switch and have different tool sets. For example, after the calls above, the conversation history includes records like:

**Python**:

```python
# agent.chat_ctx.items
[
    ChatMessage(role="user", content=["What's the weather?"]),
    ChatMessage(role="assistant", content=["Let me check..."]),
    AgentConfigUpdate(
        tools_added=["new_tool_a", "new_tool_b"],
        tools_removed=["old_tool"],
    ),
    AgentConfigUpdate(
        instructions="You are now a support agent.",
    ),
]

```

---

**Node.js**:

```typescript
const configUpdates = session.history.items.filter(
  (item) => item.type === 'agent_config_update',
);

for (const item of configUpdates) {
  console.log(item.toolsAdded, item.toolsRemoved, item.instructions);
}

```

To exclude configuration updates when copying or serializing conversation history, use `exclude_config_update` (Python) or `excludeConfigUpdate` (Node.js):

**Python**:

```python
ctx_copy = chat_ctx.copy(exclude_config_update=True)

```

---

**Node.js**:

```typescript
const ctxCopy = chatCtx.copy({ excludeConfigUpdate: true });

```

## Error handling

Raise the `ToolError` exception to return an error to the LLM in place of a response. You can include a custom message to describe the error and/or recovery options.

**Python**:

```python
@function_tool()
async def lookup_weather(
    self,
    context: RunContext,
    location: str,
) -> dict:
    if location == "mars":
        raise ToolError("This location is coming soon. Please join our mailing list to stay updated.")
    else:
        return {"weather": "sunny", "temperature_f": 70}

```

---

**Node.js**:

```typescript
import { llm } from '@livekit/agents';
import { z } from 'zod';

const lookupWeather = llm.tool({
  name: 'lookupWeather',
  description: 'Look up weather information for a location',
  parameters: z.object({
    location: z.string().describe('The location to get weather for'),
  }),
  execute: async ({ location }, { ctx }) => {
    if (location === "mars") {
      throw new llm.ToolError("This location is coming soon. Please join our mailing list to stay updated.");
    }
    return { weather: "sunny", temperatureF: 70 };
  },
});

```

If a tool raises an unexpected exception, the framework returns a generic internal-error message to the LLM instead, so server-side details don't leak into the conversation. It still logs the original error for you to debug.

If the LLM calls a tool with arguments that fail parsing or schema validation, the framework forwards the failure to the LLM as a `ToolError`, including the tool name and the validator's message. The LLM can correct the call and retry without any handling on your part.

---

This document was rendered at 2026-10-24T20:20:08.482Z.
For the latest version of this document, see [https://docs.livekit.io/agents/logic/tools/definition.md](https://docs.livekit.io/agents/logic/tools/definition.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).

<!-- ================================================================ -->
## Page: https://docs.livekit.io/agents/logic/external-data.md

LiveKit docs › Build Agents › Logic & Structure › External data & RAG

---

# External data and RAG

> Best practices for adding context and taking external actions.

## Overview

Your agent can connect to external data sources to retrieve information, store data, or take other actions. In general, you can install any Python package or add custom code to the agent to use any database or API that you need.

For instance, your agent might need to:

- Load a user's profile information from a database before starting a conversation.
- Search a private knowledge base for information to accurately answer user queries.
- Perform read/write/update operations on a database or service such as a calendar.
- Store conversation history or other data to a remote server.

This guide covers best practices and techniques for job initialization, retrieval-augmented generation (RAG), tool calls, and other techniques to connect your agent to external data sources and other systems.

## Initial context

By default, each `AgentSession` begins with an empty [chat context](https://docs.livekit.io/agents/logic/chat-context.md). You can load user or task-specific data into the agent's context before connecting to the room and starting the session. For instance, this agent greets the user by name based on the [job metadata](https://docs.livekit.io/agents/server/job.md#metadata).

**Python**:

```python
from livekit import agents
from livekit.agents import AgentServer, Agent, ChatContext, AgentSession

class Assistant(Agent):
    def __init__(self, chat_ctx: ChatContext) -> None:
        super().__init__(chat_ctx=chat_ctx, instructions="You are a helpful voice AI assistant.")

server = AgentServer()

@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: agents.JobContext):
    # Simple lookup, but you could use a database or API here if needed
    metadata = json.loads(ctx.job.metadata)
    user_name = metadata["user_name"]

    session = AgentSession(
        # ... stt, llm, tts, vad, turn_detection, etc.
    )
    
    initial_ctx = ChatContext()
    initial_ctx.add_message(role="assistant", content=f"The user's name is {user_name}.")

    await session.start(
        room=ctx.room,
        agent=Assistant(chat_ctx=initial_ctx),
        # ... room_options, etc.
    )

    await session.generate_reply(
        instructions="Greet the user by name and offer your assistance."
    )

```

---

**Node.js**:

```typescript
import { voice, llm, defineAgent, type JobContext } from '@livekit/agents';

function createAssistant(chatCtx: llm.ChatContext) {
  return voice.Agent.create({
    chatCtx,
    instructions: 'You are a helpful voice AI assistant.',
  });
}

export default defineAgent({
  entry: async (ctx: JobContext) => {
    // Simple lookup, but you could use a database or API here if needed
    const metadata = JSON.parse(ctx.job.metadata);
    const userName = metadata.user_name;

    const session = new voice.AgentSession({
      // ... stt, llm, tts, vad, turnDetection, etc.
    });
    
    const initialCtx = llm.ChatContext.empty();
    initialCtx.addMessage({
      role: 'assistant',
      content: `The user's name is ${userName}.`,
    });

    await session.start({
      room: ctx.room,
      agent: createAssistant(initialCtx),
      // ... inputOptions, outputOptions, etc.
    });

    await session.generateReply({
      instructions: 'Greet the user by name and offer your assistance.',
    });
  },
});

```

> 💡 **Load time optimizations**
> 
> If your agent requires external data in order to start, the following tips can help minimize the impact to the user experience:
> 
> 1. For static data (not user-specific) load it in the [prewarm function](https://docs.livekit.io/agents/server/options.md#prewarm)
> 2. Send user specific data in the [job metadata](https://docs.livekit.io/agents/server/job.md#metadata), [room metadata](https://docs.livekit.io/transport/data/state/room-metadata.md), or [participant attributes](https://docs.livekit.io/transport/data/state/participant-attributes.md) rather than loading it in the entrypoint.
> 3. If you must make a network call in the entrypoint, do so before `ctx.connect()`. This ensures your frontend doesn't show the agent participant before it is listening to incoming audio.

## Tool calls

To achieve the highest degree of precision or take external actions, you can offer the LLM a choice of [tools](https://docs.livekit.io/agents/build/tools.md) to use in its response. These tools can be as generic or as specific as needed for your use case.

For instance, define tools for `search_calendar`, `create_event`, `update_event`, and `delete_event` to give the LLM complete access to the user's calendar. Use [participant attributes](https://docs.livekit.io/transport/data/state/participant-attributes.md) or [job metadata](https://docs.livekit.io/agents/server/job.md#metadata) to pass the user's calendar ID and access tokens to the agent.

- **[Tool definition and use](https://docs.livekit.io/agents/build/tools.md)**: Guide to defining and using custom tools in LiveKit Agents.

## Add context during conversation

You can use the [on_user_turn_completed node](https://docs.livekit.io/agents/build/nodes.md#on_user_turn_completed) to perform a RAG lookup based on the user's most recent turn, prior to the LLM generating a response. This method can be highly performant as it avoids the extra round-trips involved in tool calls, but it's only available for STT-LLM-TTS pipelines that have access to the user's turn in text form. Additionally, the results are only as good as the accuracy of the search function you implement.

For instance, you can use vector search to retrieve additional context relevant to the user's query and inject it into the chat context for the next LLM generation. Here is a simple example:

**Python**:

```python
from livekit.agents import ChatContext, ChatMessage

async def on_user_turn_completed(
    self, turn_ctx: ChatContext, new_message: ChatMessage,
) -> None:
    # RAG function definition omitted for brevity
    rag_content = await my_rag_lookup(new_message.text_content)
    turn_ctx.add_message(
        role="assistant", 
        content=f"Additional information relevant to the user's next message: {rag_content}"
    )

```

---

**Node.js**:

```typescript
import { voice } from '@livekit/agents';

const agent = voice.Agent.create({
  instructions: 'You are a helpful assistant.',
  async onUserTurnCompleted(ctx, chatCtx, newMessage) {
    // RAG function definition omitted for brevity
    const ragContent = await myRagLookup(newMessage.textContent);
    chatCtx.addMessage({
      role: 'assistant',
      content: `Additional information relevant to the user's next message: ${ragContent}`,
    });
  },
});

```

## User feedback

It's important to provide users with direct feedback about status updates, for example, to explain a delay or failure. Here are a few example use cases:

- When an operation takes more than a few hundred milliseconds.
- When performing write operations such as sending an email or scheduling a meeting.
- When the agent is unable to perform an operation.

The following section describes various techniques to provide this feedback to the user.

> 💡 **Async tools**
> 
> For tools that run in the background with built-in progress updates, see [async tools](https://docs.livekit.io/agents/logic/tools/async.md). `AsyncToolset` handles progress delivery and reply timing automatically, without the manual `generate_reply()` pattern shown below.

### Verbal status updates

Use [Agent speech](https://docs.livekit.io/agents/build/speech.md) to provide verbal feedback to the user during a long-running tool call or other operation.

In the following example, the agent speaks a status update only if the call takes longer than a specified timeout. The update is dynamically generated based on the query, and could be extended to include an estimate of the remaining time or other information.

**Python**:

```python
import asyncio
from livekit.agents import function_tool, RunContext

@function_tool()
async def search_knowledge_base(
    self,
    context: RunContext,
    query: str,
) -> str:
    # Send a verbal status update to the user after a short delay
    async def _speak_status_update(delay: float = 0.5):
        await asyncio.sleep(delay)
        await context.session.generate_reply(instructions=f"""
            You are searching the knowledge base for \"{query}\" but it is taking a little while.
            Update the user on your progress, but be very brief.
        """)
    
    status_update_task = asyncio.create_task(_speak_status_update(0.5))

    # Perform search (function definition omitted for brevity)
    result = await _perform_search(query)
    
    # Cancel status update if search completed before timeout
    status_update_task.cancel()
    
    return result

```

---

**Node.js**:

```typescript
import { llm, Task } from '@livekit/agents';
import { z } from 'zod';

const searchKnowledgeBase = llm.tool({
  name: 'searchKnowledgeBase',
  description: 'Search the knowledge base for information',
  parameters: z.object({
    query: z.string(),
  }),
  execute: async ({ query }, { ctx, abortSignal }) => {
    // Send a verbal status update to the user after a short delay
    const speakStatusUpdate = async (controller: AbortController) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!controller.signal.aborted) {
        ctx.session.generateReply({
          instructions: `You are searching the knowledge base for "${query}" but it is taking a little while. Update the user on your progress, but be very brief.`,
        });
      }
    };

    const statusUpdateTask = Task.from(speakStatusUpdate);

		// Perform search (function definition omitted for brevity)
		const result = await performSearch(query);
		
		// Cancel status update if search completed before timeout
		statusUpdateTask.cancel()
		
		return result;
  },
});

```

For more information, see the following article:

- **[Agent speech](https://docs.livekit.io/agents/build/speech.md)**: Explore the speech capabilities and features of LiveKit Agents.

For fixed phrases like "let me check that for you," you can avoid TTS latency entirely by pre-synthesizing the audio once and replaying it from cache. See [Using cached TTS in a tool call](https://docs.livekit.io/agents/multimodality/audio/customization.md#cached-tts-in-tools) for a complete example that also shows how to cancel the hold message early if the API returns quickly.

### "Thinking" sounds

Add [background audio](https://docs.livekit.io/agents/multimodality/audio/background-audio.md) to play a "thinking" sound automatically when tool calls are ongoing. This can be useful to provide a more natural feel to the agent's responses.

**Python**:

```python
from livekit.agents import AgentServer, BackgroundAudioPlayer, AudioConfig, BuiltinAudioClip

server = AgentServer()

@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: agents.JobContext):
    session = AgentSession(
        # ... stt, llm, tts, vad, turn_detection, etc.
    )

    await session.start(
        room=ctx.room,
        # ... agent, etc.
    )

    background_audio = BackgroundAudioPlayer(
        thinking_sound=[
            AudioConfig(BuiltinAudioClip.KEYBOARD_TYPING, volume=0.8),
            AudioConfig(BuiltinAudioClip.KEYBOARD_TYPING2, volume=0.7),
        ],
    )
    await background_audio.start(room=ctx.room, agent_session=session)

```

---

**Node.js**:

```typescript
import { type JobContext, defineAgent, log, voice } from '@livekit/agents';


export default defineAgent({
  entry: async (ctx: JobContext) => {
    const logger = log();

    await ctx.connect();
    logger.info('Connected to room');

    const agent = voice.Agent.create({
      instructions: 'You are a helpful assistant',
      // ... tools, etc.
    });

    const session = new voice.AgentSession({
      // ... stt, llm, tts, vad, turn_detection, etc.
    });
    await session.start({ agent, room: ctx.room });

    const backgroundAudio = new voice.BackgroundAudioPlayer({
      thinkingSound: [
        { source: voice.BuiltinAudioClip.KEYBOARD_TYPING, volume: 0.8, probability: 0.6 },
        { source: voice.BuiltinAudioClip.KEYBOARD_TYPING2, volume: 0.7, probability: 0.4 },
      ],
    });

    await backgroundAudio.start({ room: ctx.room, agentSession: session });

    // Play another audio file at any time using the play method:
    // backgroundAudio.play('filepath.ogg');
  },
});

```

For a complete example, see the following:

- **[Background audio](https://docs.livekit.io/agents/multimodality/audio/background-audio.md)**: Guide to playing background audio in your agent.

- **[Background audio](https://github.com/livekit/agents-js/blob/main/examples/src/background_audio.ts)**: Guide to using background audio in your agent in Node.js.

### Frontend UI

If your app includes a frontend, you can add custom UI to represent the status of the agent's operations. For instance, present a popup for a long-running operation that the user can optionally cancel:

**Python**:

```python
from livekit.agents import get_job_context
import json
import asyncio

@function_tool()
async def perform_deep_search(
    self,
    context: RunContext,
    summary: str,
    query: str,
) -> str:
    """
    Initiate a deep internet search that will reference many external sources to answer the given query. This may take 1-5 minutes to complete.

    Summary: A user-friendly summary of the query
    Query: the full query to be answered
    """
    async def _notify_frontend(query: str):
        room = get_job_context().room
        response = await room.local_participant.perform_rpc(
            destination_identity=next(iter(room.remote_participants)),
            # frontend method that shows a cancellable popup
            # (method definition omitted for brevity, see RPC docs)
            method='start_deep_search',
            payload=json.dumps({
                "summary": summary,
                "estimated_completion_time": 300,
            }),
            # Allow the frontend a long time to return a response
            response_timeout=500,
        )
        # In this example the frontend has a Cancel button that returns "cancelled"
        # to stop the task
        if response == "cancelled":
            deep_search_task.cancel()

    notify_frontend_task = asyncio.create_task(_notify_frontend(query))

    # Perform deep search (function definition omitted for brevity)
    deep_search_task = asyncio.create_task(_perform_deep_search(query))

    try:
        result = await deep_search_task
    except asyncio.CancelledError:
        result = "Search cancelled by user"
    finally:
        notify_frontend_task.cancel()
        return result

```

---

**Node.js**:

```typescript
import { llm, Task, getJobContext } from '@livekit/agents';
import { z } from 'zod';

const performDeepSearch = llm.tool({
  name: 'performDeepSearch',
  description: 'Initiate a deep internet search that will reference many external sources to answer the given query. This may take 1-5 minutes to complete.',
  parameters: z.object({
    summary: z.string(),
    query: z.string(),
  }),
  execute: async ({ summary, query }, { ctx }) => {
    // Notify frontend with cancellable popup
    const notifyFrontend = async (controller: AbortController) => {
      const room = getJobContext().room;
      const participant = Array.from(room.remoteParticipants.values())[0]!;
      
      const response = await room.localParticipant!.performRpc({
        destinationIdentity: participant.identity,
        // frontend method that shows a cancellable popup
        // (method definition omitted for brevity, see RPC docs)
        method: 'start_deep_search',
        payload: JSON.stringify({
          summary,
          estimated_completion_time: 300,
        }),
        // Allow the frontend a long time to return a response
        responseTimeout: 500000,
      });
      
      // In this example the frontend has a Cancel button that returns "cancelled"
      // to stop the task
      if (response === "cancelled") {
        deepResearchTask.cancel();
      }
    };

    const notifyTask = Task.from(notifyFrontend);

    // Perform deep search (function definition omitted for brevity)
    const deepResearchTask = Task.from((controller) => performDeepSearch(query, controller));
      
    let result = "";
    try {
			result = await deepResearchTask.result;
    } catch (error) {
      result = "Search cancelled by user";
    } finally {
	    notifyTask.cancel();
	    return result;
    }
  },
});

```

For more information and examples, see the following articles:

- **[Web and mobile frontends](https://docs.livekit.io/agents/start/frontend.md)**: Guide to building a custom web or mobile frontend for your agent.

- **[RPC](https://docs.livekit.io/transport/data/rpc.md)**: Learn how to use RPC to communicate with your agent from the frontend.

## Fine-tuned models

Sometimes the best way to get the most relevant results is to fine-tune a model for your specific use case. You can explore the available [LLM plugins](https://docs.livekit.io/agents/models/llm.md#plugins) to find a provider that supports fine-tuning, or use [Ollama](https://docs.livekit.io/agents/models/llm/ollama.md) to integrate a custom model.

## External services

Many providers offer services to provide memory or other capabilities to your agents. Some suggested services that work well with LiveKit Agents include:

- **[Letta plugin](https://docs.livekit.io/agents/models/llm/letta.md)**: Build and deploy stateful AI agents that maintain memory and context across long-running conversations.

- **[AgentMail](https://docs.agentmail.to/integrate-livekit-agents)**: Give your agents their own email inboxes.

- **[LlamaIndex](https://www.llamaindex.ai/)**: Framework for connecting custom data to LLMs.

- **[Mem0](https://mem0.ai)**: Self-improving memory layer for AI agents.

## Additional examples

The following examples show how to implement RAG and other techniques:

- **[LlamaIndex RAG](https://github.com/livekit/agents/tree/main/examples/voice_agents/llamaindex-rag)**: A voice AI agent that uses LlamaIndex for RAG to answer questions from a knowledge base.

---

This document was rendered at 2026-10-24T20:20:09.010Z.
For the latest version of this document, see [https://docs.livekit.io/agents/logic/external-data.md](https://docs.livekit.io/agents/logic/external-data.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).

<!-- ================================================================ -->
## Page: https://docs.livekit.io/agents/server/agent-dispatch.md

LiveKit docs › Build Agents › Agent Server › Agent dispatch

---

# Agent dispatch

> Specifying how and when your agents are assigned to rooms.

## Dispatching agents

Dispatch is the process of assigning an agent to a room. LiveKit server manages this process as part of the [Server lifecycle](https://docs.livekit.io/agents/server/lifecycle.md). LiveKit optimizes dispatch for high concurrency and low latency, typically supporting hundreds of thousands of new connections per second with a max dispatch time under 150 ms.

Explicit dispatch is the recommended approach for most applications. It gives you full control over when and how agents join rooms and lets you pass job-specific metadata to each agent session.

## Dispatch name

The dispatch name is a unique identifier for an agent. Explicit dispatch uses it to route jobs to the right agent. It's the value of `agent_name` (Python) or `agentName` (Node.js) on `@server.rtc_session()` or `ServerOptions`.

The dispatch name is distinct from the agent's **display name** (`Participant.name`), which is set by the `name` parameter in `req.accept()` and shown to other participants in the room. The dispatch name targets the agent. The display name labels it. See [Request handler](https://docs.livekit.io/agents/server/options.md#request-handler) for setting the display name.

When you scaffold an agent with [`lk agent init`](https://docs.livekit.io/reference/developer-tools/livekit-cli/agent.md#init), the AGENT-NAME you provide becomes the dispatch name in the generated source. To change it later, edit the source code and redeploy.

To set the dispatch name in your server configuration:

**Python**:

In Python, set the agent name in the `@server.rtc_session` decorator:

```python
@server.rtc_session(agent_name="test-agent")
async def my_agent(ctx: JobContext):
    # Agent entrypoint code...

```

---

**Node.js**:

```ts
const opts = new ServerOptions({
  //...
  agentName: "test-agent",
});

```

With `agent_name` set, the agent is only assigned to rooms when explicitly dispatched using one of the following methods.

## Deployments

By default, dispatching an agent targets the `production` deployment. If an agent has [non-production deployments](https://docs.livekit.io/deploy/agents/deployments.md) (for example, `staging`), use the `deployment` parameter to route the dispatch to a specific deployment. On the worker side, registration is automatic: LiveKit Cloud sets `LIVEKIT_AGENT_DEPLOYMENT` on each deployment's containers, and the SDK registers under (`agent_name`, `deployment`). To learn more, see [Deployment environment variable](https://docs.livekit.io/agents/server/options.md#deployment-env-var).

To route a session to a specific deployment, use `deployment` with `agent_name` when you dispatch an agent:

- **Dispatch via API**: `CreateAgentDispatchRequest` accepts a `deployment` field alongside `agent_name`.
- **Dispatch via token**: `RoomAgentDispatch` (inside `RoomConfiguration.agents`) accepts a `deployment` field alongside `agent_name`.
- **SIP**: room agent dispatch on a SIP rule passes `deployment` through the same `RoomAgentDispatch` field.

For example, dispatch to the `staging` deployment from a token using the CLI:

```shell
lk token create --join --open meet --agent test-agent --deployment staging

```

If your app uses the [sandbox token server](https://docs.livekit.io/frontends/build/authentication/development-token-server.md) or the `useSession` hook in a client SDK, pass `deployment` as an optional argument.

## Dispatch via API

You can explicitly dispatch an agent to a room using the `AgentDispatchService` [API](https://docs.livekit.io/reference/agents/agent-dispatch-service-api.md).

**LiveKit CLI**:

```shell
lk dispatch create \
  --agent-name test-agent \
  --room my-room \
  --metadata '{"user_id": "12345"}'

```

---

**Node.js**:

```ts
import { LiveKitAPI } from 'livekit-server-sdk';

const roomName = 'my-room';
const agentName = 'test-agent';

async function createExplicitDispatch() {
  const api = new LiveKitAPI();

  // create a dispatch request for an agent named "test-agent" to join "my-room"
  const dispatch = await api.agentDispatch.createDispatch(roomName, agentName, {
    metadata: '{"user_id": "12345"}',
    // deployment: 'staging', // Optional; empty = production
  });
  console.log('created dispatch', dispatch);

  const dispatches = await api.agentDispatch.listDispatch(roomName);
  console.log(`there are ${dispatches.length} dispatches in ${roomName}`);
}

```

---

**Python**:

```python
import asyncio
from livekit import api

room_name = "my-room"
agent_name = "test-agent"

async def create_explicit_dispatch():
    async with api.LiveKitAPI() as lkapi:
        dispatch = await lkapi.agent_dispatch.create_dispatch(
            api.CreateAgentDispatchRequest(
                agent_name=agent_name,
                room=room_name,
                metadata='{"user_id": "12345"}',
                # deployment="staging",  # Optional; empty = production
            )
        )
        print("created dispatch", dispatch)

        dispatches = await lkapi.agent_dispatch.list_dispatch(room_name)
        print(f"there are {len(dispatches)} dispatches in {room_name}")

asyncio.run(create_explicit_dispatch())

```

---

**Ruby**:

```ruby
require "livekit"

room_name = "my-room"
agent_name = "test-agent"

lkapi = LiveKit::LiveKitAPI.new

dispatch = lkapi.agent_dispatch.create_dispatch(
  room_name,
  agent_name,
  metadata: '{"user_id": "12345"}',
  # deployment: "staging", # Optional; empty = production
)

puts "successfully dispatched agent #{dispatch.agent_name} to #{dispatch.room}"

```

---

**Go**:

```go
func createAgentDispatch() {
	api, err := lksdk.NewLiveKitAPI()
	if err != nil {
		panic(err)
	}

	req := &livekit.CreateAgentDispatchRequest{
		Room:      "my-room",
		AgentName: "test-agent",
		Metadata:  "{\"user_id\": \"12345\"}",
		// Deployment: "staging", // Optional; empty = production
	}
	dispatch, err := api.AgentDispatch().CreateDispatch(context.Background(), req)
	if err != nil {
		panic(err)
	}
	fmt.Printf("Dispatch created: %v\n", dispatch)
}

```

---

**Kotlin**:

```kotlin
import io.livekit.server.LiveKitAPI

val roomName = "my-room"
val agentName = "test-agent"

fun createExplicitDispatch() {
    val api = LiveKitAPI.createClient()
    val response = api.agentDispatch.createDispatch(
        room = roomName,
        agentName = agentName,
        metadata = """{"user_id": "12345"}""",
    ).execute().body()
    if (response != null) {
        println("successfully dispatched agent ${response.agentName} to ${response.room}")
    } else {
        println("failed to create dispatch")
    }
}

```

---

**Rust**:

```rust
use livekit_api::services::LiveKitApi;
use livekit_protocol::CreateAgentDispatchRequest;

let api = LiveKitApi::new("https://my-livekit-host")?;
let dispatch = api
    .agent_dispatch()
    .create_dispatch(CreateAgentDispatchRequest {
        room: "my-room".to_string(),
        agent_name: "test-agent".to_string(),
        metadata: "{\"user_id\": \"12345\"}".to_string(),
        ..Default::default()
    })
    .await?;
println!("created dispatch {:?}", dispatch);

let dispatches = api.agent_dispatch().list_dispatch("my-room").await?;
println!("there are {} dispatches in my-room", dispatches.len());

```

The room, `my-room`, is automatically created during dispatch if it doesn't already exist, and the agent server assigns `test-agent` to it.

### Job metadata

Explicit dispatch allows you to pass metadata to the agent, available in the `JobContext`. This is useful for including details such as the user's ID, name, or phone number.

The metadata field is a string, limited to 512 KiB. LiveKit recommends using JSON to pass structured data.

The [examples](#via-api) in the previous section demonstrate how to pass job metadata during dispatch.

For information on consuming job metadata in an agent, see the following guide:

- **[Job metadata](https://docs.livekit.io/agents/server/job.md#metadata)**: Learn how to consume job metadata in an agent.

## Dispatch from inbound SIP calls

Agents can be explicitly dispatched for inbound SIP calls. [SIP dispatch rules](https://docs.livekit.io/telephony/accepting-calls/dispatch-rule.md) can define one or more agents using the `room_config.agents` field.

LiveKit recommends explicit agent dispatch for SIP inbound calls rather than automatic agent dispatch as it allows multiple agents within a single project.

## Dispatch via access token

You can include one or more agent dispatch entries in a participant's access token. When the first participant connects and creates the room, LiveKit dispatches the specified agents.

> ℹ️ **Applied on room creation only**
> 
> Agent dispatch from the token only occurs when the room is first created. If the room already exists, the token's dispatch configuration is ignored. Use a unique room name per session or [dispatch via API](#via-api) for more control.

The following example creates a token that dispatches the `test-agent` agent to the `my-room` room:

**LiveKit CLI**:

The following example assumes the environment variables `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` are set:

```shell
lk token create \
  --identity "my-participant" \
  --room "my-room" \
  --agent "test-agent" \
  --join

```

---

**Node.js**:

```ts
import { RoomAgentDispatch, RoomConfiguration } from '@livekit/protocol';
import { AccessToken } from 'livekit-server-sdk';

const roomName = 'my-room';
const agentName = 'test-agent';

async function createTokenWithAgentDispatch(): Promise<string> {
  const at = new AccessToken();
  at.identity = 'my-participant';
  at.addGrant({ roomJoin: true, room: roomName });
  at.roomConfig = new RoomConfiguration({
    agents: [
      new RoomAgentDispatch({
        agentName: agentName,
        metadata: '{"user_id": "12345"}',
        // deployment: 'staging', // Optional; empty = production
      }),
    ],
  });
  return await at.toJwt();
}

```

---

**Python**:

```python
from livekit.api import (
  AccessToken,
  RoomAgentDispatch,
  RoomConfiguration,
  VideoGrants,
)

room_name = "my-room"
agent_name = "test-agent"

def create_token_with_agent_dispatch() -> str:
    token = (
        AccessToken()
        .with_identity("my_participant")
        .with_grants(VideoGrants(room_join=True, room=room_name))
        .with_room_config(
            RoomConfiguration(
                agents=[
                    RoomAgentDispatch(
                        agent_name="test-agent",
                        metadata='{"user_id": "12345"}',
                        # deployment="staging",  # Optional; empty = production
                    )
                ],
            ),
        )
        .to_jwt()
    )
    return token

```

---

**Ruby**:

```ruby
require "livekit"

roomName = "my-room"
agentName = "test-agent"

def create_token_with_agent_dispatch(roomName:, agentName:)
  token = LiveKit::AccessToken.new(
    api_key: ENV["LIVEKIT_API_KEY"],
    api_secret: ENV["LIVEKIT_API_SECRET"],
    identity: "my-participant",
  )
  token.video_grant = LiveKit::VideoGrant.new(roomJoin: true, room: roomName)
  token.room_config = LiveKit::Proto::RoomConfiguration.new(
    agents: [
      LiveKit::Proto::RoomAgentDispatch.new(
        agent_name: agentName,
        metadata: '{"user_id": "12345"}',
        # deployment: "staging", # Optional; empty = production
      ),
    ],
  )
  token.to_jwt
end

```

---

**Go**:

```go
func createTokenWithAgentDispatch() (string, error) {
	at := auth.NewAccessToken(
		os.Getenv("LIVEKIT_API_KEY"),
		os.Getenv("LIVEKIT_API_SECRET"),
	).
		SetIdentity("my-participant").
		SetName("Participant Name").
		SetVideoGrant(&auth.VideoGrant{
			Room:     "my-room",
			RoomJoin: true,
		}).
		SetRoomConfig(&livekit.RoomConfiguration{
			Agents: []*livekit.RoomAgentDispatch{
				{
					AgentName: "test-agent",
					Metadata:  "{\"user_id\": \"12345\"}",
					// Deployment: "staging", // Optional; empty = production
				},
			},
		})

	return at.ToJWT()
}

```

---

**Kotlin**:

```kotlin
import io.livekit.server.AccessToken
import io.livekit.server.RoomJoin
import io.livekit.server.RoomName
import livekit.LivekitAgentDispatch
import livekit.LivekitRoom.RoomConfiguration

val roomName = "my-room"
val agentName = "test-agent"

fun createTokenWithAgentDispatch(): String {
    val token = AccessToken(
        System.getenv("LIVEKIT_API_KEY")!!,
        System.getenv("LIVEKIT_API_SECRET")!!,
    )
    token.identity = "my-participant"
    token.addGrants(RoomJoin(true), RoomName(roomName))
    token.roomConfiguration = RoomConfiguration.newBuilder()
        .addAgents(
            LivekitAgentDispatch.RoomAgentDispatch.newBuilder()
                .setAgentName(agentName)
                .setMetadata("""{"user_id": "12345"}""")
                // .setDeployment("staging") // Optional; empty = production
                .build(),
        )
        .build()
    return token.toJwt()
}

```

---

**Rust**:

```rust
use livekit_api::access_token::{AccessToken, VideoGrants};
use livekit_protocol::{RoomAgentDispatch, RoomConfiguration};

fn create_token_with_agent_dispatch() -> Result<String, Box<dyn std::error::Error>> {
    let token = AccessToken::with_api_key(
        &std::env::var("LIVEKIT_API_KEY")?,
        &std::env::var("LIVEKIT_API_SECRET")?,
    )
    .with_identity("my-participant")
    .with_grants(VideoGrants { room_join: true, room: "my-room".to_string(), ..Default::default() })
    .with_room_config(RoomConfiguration {
        agents: vec![RoomAgentDispatch {
            agent_name: "test-agent".to_string(),
            metadata: "{\"user_id\": \"12345\"}".to_string(),
            ..Default::default()
        }],
        ..Default::default()
    })
    .to_jwt()?;
    Ok(token)
}

```

## Automatic agent dispatch

> 🔥 **Caution**
> 
> Automatic dispatch is not recommended for most applications. It dispatches an agent to every new room, regardless of whether one is needed, and doesn't support passing metadata to the agent session. Use one of the explicit dispatch methods described in this topic instead.

When `agent_name` is not set, an agent is automatically dispatched to each new room. This can be useful for simple prototypes where every room requires the same agent.

---

This document was rendered at 2026-10-24T20:20:09.421Z.
For the latest version of this document, see [https://docs.livekit.io/agents/server/agent-dispatch.md](https://docs.livekit.io/agents/server/agent-dispatch.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).

<!-- ================================================================ -->
## Page: https://docs.livekit.io/agents/server/job.md

LiveKit docs › Build Agents › Agent Server › Job lifecycle

---

# Job lifecycle

> Learn more about the entrypoint function and how to end and clean up LiveKit sessions.

## Lifecycle

When an [agent server](https://docs.livekit.io/agents/server.md) accepts a job request from LiveKit Cloud, it starts a new process and runs your agent code inside. Each job runs in a separate process to isolate agents from each other. If a session instance crashes, it doesn't affect other agents running on the same agent server. The job runs until all standard and SIP participants leave the room, or you explicitly shut it down.

## Entrypoint

The entrypoint is executed as the main function of the process for each new job run by the agent server, effectively handing control over to your code. You should load any necessary app-specific data and then execute your agent's logic.

> ℹ️ **Defining the entrypoint function**
> 
> In Python, the entrypoint function is decorated with `@server.rtc_session()`. In Node.js, the entrypoint function is defined as a property of the default export of the agent file.

> ⚠️ **Default entrypoint file path**
> 
> The default Dockerfile template generated by the LiveKit CLI assumes your agent entrypoint file is at `src/agent.py` (Python) or references the `start` script in `package.json` (Node.js). If you restructure your project, update your Dockerfile and startup command to match. See [Builds and Dockerfiles](https://docs.livekit.io/deploy/agents/builds.md) for details.

You can use the entrypoint function and Agents Framework without creating an `AgentSession`. This lets you take advantage of the framework's job context and lifecycle to build a programmatic participant that's automatically dispatched to rooms. To learn more, see [Server lifecycle](https://docs.livekit.io/agents/server/lifecycle.md).

> ℹ️ **Controlling connection**
> 
> If you use `AgentSession`, it connects to LiveKit automatically when started. If you're not using `AgentSession`, or if you need to control the precise timing or method of connection (for example, to enable [end-to-end encryption](https://docs.livekit.io/transport/encryption/agents.md)), use the `JobContext` [connect method](https://docs.livekit.io/reference/python/livekit/agents/index.html.md#livekit.agents.JobContext.connect).

### Connection options

Available in:
- [ ] Node.js
- [x] Python

`single_peer_connection` determines whether the agent uses a single `RTCPeerConnection` for both publishing and subscribing instead of separate connections. It defaults to `None` (separate connections). Pass it as a keyword argument to `ctx.connect()`, set to `True` to use a single peer connection:

```python
@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):
    await ctx.connect(single_peer_connection=True)

```

### Examples

This example shows a simple entrypoint function that processes incoming audio tracks and publishes a text message to the room.

**Python**:

```python
async def do_something(track: rtc.RemoteAudioTrack):
    audio_stream = rtc.AudioStream(track)
    async for event in audio_stream:
        # Do something here to process event.frame
        pass
    await audio_stream.aclose()

@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):
    # an rtc.Room instance from the LiveKit Python SDK
    room = ctx.room

    # set up listeners on the room before connecting
    @room.on("track_subscribed")
    def on_track_subscribed(track: rtc.Track, *_):
        if track.kind == rtc.TrackKind.KIND_AUDIO:
            asyncio.create_task(do_something(track))

    # connect to room
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # when connected, room.local_participant represents the agent
    await room.local_participant.send_text('hello world', topic='hello-world')

    # iterate through currently connected remote participants
    for rp in room.remote_participants.values():
        print(rp.identity)

```

---

**Node.js**:

```typescript
async function doSomething(track: RemoteTrack) {
  for await (const frame of new AudioStream(track)) {
    // do something with the frame
  }
}

export default defineAgent({
  entry: async (ctx: JobContext) => {
    // an rtc.Room instance from the LiveKit Node.js SDK
    const room = ctx.room;

    // set up listeners on the room before connecting
    room.on(RoomEvent.TrackSubscribed, async (track: RemoteTrack) => {
      if (track.kind === TrackKind.KIND_AUDIO) {
        doSomething(track);
      }
    });

    await ctx.connect(undefined, AutoSubscribe.AUDIO_ONLY);

    // when connected, room.localParticipant represents the agent
    await room.localParticipant?.sendText('hello world', {
      topic: 'hello-world',
    });

    // iterate through currently connected remote participants
    for (const rp of ctx.room.remoteParticipants.values()) {
      console.log(rp.identity);
    }
  },
});

```

Working examples of LiveKit Agents for Node.js are available in the [repository](https://github.com/livekit/agents-js/tree/main/examples/src).

- **[Echo Agent](https://github.com/livekit/agents/blob/main/examples/primitives/echo-agent.py)**: This programmatic participant example demonstrates how to subscribe to audio tracks and play them back to the room.

For more LiveKit Agents examples, see the [GitHub repository](https://github.com/livekit/agents/tree/main/examples).

### Publishing and receiving tracks

To learn more about publishing and receiving tracks, see the following topics.

- **[Media tracks](https://docs.livekit.io/transport/media.md)**: Use the microphone, speaker, cameras, and screen share with your agent.

- **[Realtime text and data](https://docs.livekit.io/transport/data.md)**: Use text and data channels to communicate with your agent.

- **[Processing raw media tracks](https://docs.livekit.io/transport/media/raw-tracks.md)**: Use server-side SDKs to read, process, and publish raw media tracks and files.

### Participant entrypoint function

A participant entrypoint is a callback that runs once for every participant in the room. Register it on `JobContext` to execute per-participant logic, such as looking up user data, subscribing to specific tracks, or running a long-lived task scoped to that participant, without creating an `AgentSession`.

The callback runs for participants already in the room when you call `ctx.connect()`, and for every new participant that joins after. You can register multiple entrypoints and they run concurrently for each participant.

> ℹ️ **Register before connecting**
> 
> Call `add_participant_entrypoint` (Python) or `addParticipantEntrypoint` (Node.js) before `ctx.connect()`. If you register an entrypoint after the connection is established, it fires only for participants who join afterward, not for participants already in the room.

**Python**:

```python
@server.rtc_session()
async def entrypoint(ctx: JobContext):
    async def greet_participant(ctx: JobContext, p: rtc.RemoteParticipant):
        # Access participant identity, attributes, and metadata
        logger.info(f"participant joined: {p.identity}")

        # Filter out participants you don't need to handle
        if p.identity == "some-service-bot":
            return

        # Run participant-scoped work
        await ctx.room.local_participant.send_text(
            f"Hello, {p.identity}!", topic="greeting"
        )

    async def track_participant_audio(ctx: JobContext, p: rtc.RemoteParticipant):
        # Multiple entrypoints run concurrently for each participant
        logger.info(f"tracking audio for {p.identity}")
        await asyncio.sleep(60)

    # Register entrypoints before connecting
    ctx.add_participant_entrypoint(entrypoint_fnc=greet_participant)
    ctx.add_participant_entrypoint(entrypoint_fnc=track_participant_audio)

    await ctx.connect(auto_subscribe=AutoSubscribe.SUBSCRIBE_ALL)

```

---

**Node.js**:

```typescript
export default defineAgent({
  entry: async (ctx: JobContext) => {
    const greetParticipant = async (ctx: JobContext, p: RemoteParticipant) => {
      // Access participant identity, attributes, and metadata
      console.log(`participant joined: ${p.identity}`);

      // Filter out participants you don't need to handle
      if (p.identity === 'some-service-bot') {
        return;
      }

      // Run participant-scoped work
      await ctx.room.localParticipant?.sendText(
        `Hello, ${p.identity}!`, { topic: 'greeting' }
      );
    };

    const trackParticipantAudio = async (ctx: JobContext, p: RemoteParticipant) => {
      // Multiple entrypoints run concurrently for each participant
      console.log(`tracking audio for ${p.identity}`);
      await new Promise((resolve) => setTimeout(resolve, 60_000));
    };

    // Register entrypoints before connecting
    ctx.addParticipantEntrypoint(greetParticipant);
    ctx.addParticipantEntrypoint(trackParticipantAudio);

    await ctx.connect(undefined, AutoSubscribe.SUBSCRIBE_ALL);
  },
});

```

In Python, `add_participant_entrypoint` accepts a `kind` parameter to restrict which participant types trigger the callback. By default, entrypoints run for standard, SIP, and connector participants. To run only for SIP participants, for example, pass `kind=rtc.ParticipantKind.PARTICIPANT_KIND_SIP`.

## Adding custom fields to agent logs

Available in:
- [ ] Node.js
- [x] Python

Each job outputs JSON-formatted logs that include the user transcript, turn detection data, job ID, process ID, and more. You can include custom fields in the logs using `ctx.log_context_fields` for additional diagnostic context.

The following example adds worker ID and room name to the logs:

```python
@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):
    ctx.log_context_fields = {
      "worker_id": ctx.worker_id,
      "room_name": ctx.room.name,
    }

```

To learn more, see the reference documentation for [JobContext.log_context_fields](https://docs.livekit.io/reference/python/livekit/agents/index.html.md#livekit.agents.JobContext.log_context_fields).

## Passing data to a job

You can customize a job with user or job-specific data using either job metadata, room metadata, or participant attributes.

### Job metadata

Job metadata is a freeform string field defined in the [dispatch request](https://docs.livekit.io/agents/server/agent-dispatch.md#via-api) and consumed in the entrypoint function. Use JSON or similar structured data to pass complex information.

Job metadata is limited to 512 KiB. For payloads that exceed this limit, see [Reference large data by ID](https://docs.livekit.io/transport/data/state/room-metadata.md#reference-large-data-by-id).

The following example assumes your agent dispatch request includes the `user_id`, `user_name`, and `user_phone` fields in the metadata. You can access this data in the entrypoint function:

**Python**:

```python
import json

@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):
    metadata = json.loads(ctx.job.metadata)
    user_id = metadata["user_id"]
    user_name = metadata["user_name"]
    user_phone = metadata["user_phone"]
    # ...

```

---

**Node.js**:

```typescript
export default defineAgent({
  entry: async (ctx: JobContext) => {
    const metadata = JSON.parse(ctx.job.metadata);
    const userId = metadata.user_id;
    const userName = metadata.user_name;
    const userPhone = metadata.user_phone;
    // ...
  },
});

```

For more information on dispatch, see the following article:

- **[Agent dispatch](https://docs.livekit.io/agents/server/agent-dispatch.md#via-api)**: Learn how to dispatch an agent with custom metadata.

### Room metadata and participant attributes

You can also use properties such as the room's name, metadata, and participant attributes to customize agent behavior.

> 💡 **Telephony use case**
> 
> For outbound calling agents, use `wait_for_participant` with the SIP participant's `identity` to confirm they've joined the room before starting the agent session. For a complete example including call failure handling and voicemail detection, see [Handling call outcomes](https://docs.livekit.io/telephony/making-calls/outbound-calls.md#call-outcomes).

Here's an example showing how to access various properties:

**Python**:

```python
@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):
  # connect to the room
  await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

  # wait for the first participant to arrive
  participant = await ctx.wait_for_participant()

  # customize behavior based on the participant
  print(f"connected to room {ctx.room.name} with participant {participant.identity}")

  # inspect the current value of the attribute
  language = participant.attributes.get("user.language")

  # listen to when the attribute is changed
  @ctx.room.on("participant_attributes_changed")
  def on_participant_attributes_changed(changed_attrs: dict[str, str], p: rtc.Participant):
      if p == participant:
        language = p.attributes.get("user.language")
        print(f"participant {p.identity} changed language to {language}")

```

---

**Node.js**:

```typescript
export default defineAgent({
  entry: async (ctx: JobContext) => {
    // connect to the room
    await ctx.connect(undefined, AutoSubscribe.AUDIO_ONLY);

    // wait for the first participant to arrive
    const participant = await ctx.waitForParticipant();

    // customize behavior based on the participant
    console.log(`connected to room ${ctx.room.name} with participant ${participant.identity}`);

    // inspect the current value of the attribute
    let language = participant.attributes['user.language'];

    // listen to when the attribute is changed
    ctx.room.on(
      'participantAttributesChanged',
      (changedAttrs: Record<string, string>, p: Participant) => {
        if (p === participant) {
          language = p.attributes['user.language'];
          console.log(`participant ${p.identity} changed language to ${language}`);
        }
      },
    );
  },
});

```

For more information, see the following topics:

- **[Room metadata](https://docs.livekit.io/transport/data/state/room-metadata.md)**: Learn how to set and use room metadata.

- **[Participant attributes & metadata](https://docs.livekit.io/transport/data/state/participant-attributes.md)**: Learn how to set and use participant attributes and metadata.

## Ending the session

Close the session and disconnect the agent from the room using the `shutdown()` method. This method waits for queued operations to complete, commits any remaining user transcripts, and closes all I/O connections. If the `drain` parameter is `True`, the session gracefully drains pending speech before closing.

Other participants in the LiveKit room can continue. Your [shutdown hooks](#post-processing-and-cleanup) run after the `shutdown` function.

**Python**:

In Python, use the `session.shutdown()` method to gracefully close the session and disconnect the agent from the room.

```python
# Graceful shutdown with draining
session.shutdown(drain=True)

# Or immediate close
await session.aclose()

```

---

**Node.js**:

In Node.js, use the `ctx.shutdown()` method to close the session and disconnect the agent from the room.

```typescript
export default defineAgent({
  entry: async (ctx: JobContext) => {
    // do some work...

    // Graceful shutdown with draining
    ctx.shutdown(drain=true);

    // Or immediate close
    await ctx.aclose();
  },
});

```

The difference between `shutdown()` and `aclose()` is as follows:

- `agent_session.shutdown()`: Takes an optional `drain` parameter that allows you to shutdown gracefully and drain pending speech before closing. It's a non-blocking call that executes in the background. The shutdown operations happen asynchronously while your code continues executing.
- `agent_session.aclose()`: Executes the shutdown operation immediately. It's an awaitable method (async) that pauses the current coroutine execution until the close operation is finished. Your code doesn't proceed until `aclose()` completes.

After you shutdown the session, you can delete the room if it's no longer needed.

### Delete the room

You can configure the agent session to automatically delete the room on session end by setting the `delete_room_on_close` parameter to `True`. To learn more, see [Delete room when session ends](https://docs.livekit.io/agents/logic/sessions.md#delete_room_on_close).

Alternatively, you can delete the room manually. If the session should end for everyone, use the server API [deleteRoom](https://docs.livekit.io/intro/basics/rooms-participants-tracks/rooms.md#delete-a-room) to end the session. This disconnects all participants from the room.

When the room is removed from the server, a `disconnected` [room event](https://docs.livekit.io/intro/basics/rooms-participants-tracks/webhooks-events.md#sdk-events) is emitted.

**Python**:

```python
async def entrypoint(ctx: JobContext):
    # do some work
    ...

    await ctx.delete_room()

```

---

**Node.js**:

```typescript
import { LiveKitAPI } from 'livekit-server-sdk';

export default defineAgent({
  entry: async (ctx: JobContext) => {
    // do some work...

    const api = new LiveKitAPI();
    await api.room.deleteRoom(ctx.job.room.name);
  },
});

```

## Post-processing and cleanup

After a session ends, you can perform post-processing or cleanup tasks using shutdown hooks. For example, you might want to save user state in a database.

**Python**:

```python
async def entrypoint(ctx: JobContext):
    async def my_shutdown_hook():
        # save user state
        ...
    ctx.add_shutdown_callback(my_shutdown_hook)

```

---

**Node.js**:

```typescript
export default defineAgent({
  entry: async (ctx: JobContext) => {
    ctx.addShutdownCallback(() => {
      // save user state...
    });
  },
});

```

> ℹ️ **Note**
> 
> Shutdown hooks should complete within a short amount of time. By default, the framework waits 10 seconds before forcefully terminating the process. You can adjust this timeout using the `shutdown_process_timeout` parameter in [agent server options](https://docs.livekit.io/agents/server/options.md).

---

This document was rendered at 2026-10-24T20:20:09.912Z.
For the latest version of this document, see [https://docs.livekit.io/agents/server/job.md](https://docs.livekit.io/agents/server/job.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).

<!-- ================================================================ -->
## Page: https://docs.livekit.io/agents/logic/turns/turn-detector.md

LiveKit docs › Build Agents › Logic & Structure › Turn detection & interruptions › Turn detector

---

# LiveKit turn detector

> Audio-based end-of-turn detection for voice AI.

## Overview

The LiveKit turn detector improves end-of-turn detection in voice AI apps by adding signals on top of voice activity detection (VAD).

Traditional VAD models are effective at determining the presence or absence of speech, but without understanding the meaning of speech they can provide a poor user experience. For instance, a user might say "I need to think about that for a moment" and then take a long pause. The user has more to say but a VAD-only system interrupts them anyway. A turn detector model can predict that they have more to say and wait for them to finish before responding.

## Audio turn detector

LiveKit's `TurnDetector` is an audio model that encodes user audio directly, capturing both _what_ is said and _how_ it's said. By combining semantic understanding with acoustic cues like intonation, pitch, and rhythm, it reaches state-of-the-art end-of-turn accuracy without relying on a transcript.

The following capture shows two sessions running side by side on the same audio. The text model is tricked by the mid-turn pauses and commits the turn early, while the audio model waits for the true end of turn:

**Turn detection comparison** (interactive timeline, not available in text):

[Listen to the audio sample](https://static.livekit.io/audio/docs/turns/eot-flight-booking.mp3).

- The audio end-of-turn model commits the user's turn at: 6.41s.
- The text (STT-based) end-of-turn model commits the turn at: 2.76s, 4.88s, 6.40s.

Transcript chunks (arrival time → text):

- 2.53s: "Hi. I'd like to book a flight"
- 4.85s: "from Dublin to New York."
- 6.14s: "This Friday."

The detector comes in two versions:

- **`v1`**: the full model, served on LiveKit Inference in every region. Highest accuracy. Included at no extra cost for agents deployed to LiveKit Cloud. For self-hosted agents, usage beyond a monthly development allowance is billed per request on the Ship and Scale plans. On the Build plan, the session falls back to `v1-mini` at the limit by default. To learn more, see [Audio turn detection](https://docs.livekit.io/deploy/admin/quotas-and-limits.md#audio-turn-detection) on the Quotas and limits page.
- **`v1-mini`**: a lightweight version that runs locally on CPU, free to use in any context.

By default, if the full model is unavailable, the session falls back to `v1-mini` for the rest of the session. See [Fallback to the mini model](#audio-fallback).

### Installation

The audio turn detector is built into the Agents SDK: `livekit-agents` 1.6.1 or later for Python, and `@livekit/agents` 1.4.7 or later for Node.js. No separate plugin or extra is required.

### Usage

Initialize your `AgentSession` with `TurnDetector`. `AgentSession` provides the required VAD automatically, and the model is selected based on your environment (see [Default model selection](#audio-default-model)).

**Python**:

```python
from livekit.agents import AgentSession, TurnHandlingOptions, inference

session = AgentSession(
    turn_handling=TurnHandlingOptions(
        turn_detection=inference.TurnDetector(),
    ),
    # ... stt, tts, llm, etc.
)

```

---

**Node.js**:

```typescript
import { inference, voice } from '@livekit/agents';

const session = new voice.AgentSession({
  turnHandling: {
    turnDetection: new inference.TurnDetector(),
  },
  // ... stt, tts, llm, etc.
});

```

To pin a specific version instead of relying on auto-selection, pass `version`:

**Python**:

```python
turn_detection=inference.TurnDetector(version="v1-mini")

```

---

**Node.js**:

```typescript
turnDetection: new inference.TurnDetector({ version: 'v1-mini' }),

```

See the [Voice AI quickstart](https://docs.livekit.io/agents/start/voice-ai.md) for a complete example.

> ℹ️ **Note**
> 
> Some STT models, such as [Deepgram Flux](https://docs.livekit.io/agents/models/stt/deepgram.md), include built-in end-of-turn detection. No special configuration is needed to use them alongside the audio turn detector: the configured turn detector takes precedence, and the session uses end-of-turn signals from the STT only when you set `turn_detection="stt"`.

### Parameters

The following parameters are available on the `TurnDetector` constructor:

- **`version`** _(Literal['v1', 'v1-mini'])_ (optional): Selects the model version. `v1` is the full model served on LiveKit Inference while `v1-mini` runs locally on CPU. When omitted, the version is selected automatically based on your environment. See [Default model selection](#audio-default-model).

- **`unlikely_threshold`** _(float | dict[str, float])_ (optional): Override the model's confidence threshold for ending a turn. Accepts a scalar (applied to every language) or a dict keyed by language code. Unmapped languages keep the calibrated default for the active model. See [Custom thresholds](#audio-custom-thresholds). In Node.js, this parameter is called `unlikelyThreshold`.

- **`local_fallback`** _(bool)_ (optional) - Default: `True`: Available in:
- [ ] Node.js
- [x] Python

Whether the full `v1` model can fall back to the local `v1-mini` model when requests to LiveKit Inference fail. To learn how errors and timeouts behave either way, see [Fallback to the mini model](#audio-fallback).

### Endpointing defaults

By default, the session waits between `0.5` and `3.0` seconds after speech to confirm the end of a turn. When you use the audio turn detector, the model provides a confident end-of-turn signal, so the session commits sooner with shorter [endpointing](https://docs.livekit.io/agents/logic/turns.md#endpointing-configuration) delays:

| Option | Default | With audio turn detector |
| `min_delay` | `0.5` seconds | `0.3` seconds |
| `max_delay` | `3.0` seconds | `2.5` seconds |

Override either value through [`EndpointingOptions`](https://docs.livekit.io/reference/agents/turn-handling-options.md#endpointingoptions). If the model doesn't return a prediction within about a second, the agent commits the turn anyway, and by default, a timeout on the full `v1` model triggers a [fallback to `v1-mini`](#audio-fallback) for the rest of the session.

The audio turn detector requires VAD, and the VAD's `min_silence_duration` must be at least `0.25` seconds (250 ms). A lower value raises a `ValueError` when the session starts. The Silero VAD default of `0.55` seconds already satisfies this.

### Supported languages

The audio turn detector supports 14 languages: English, Arabic, German, Spanish, French, Hindi, Indonesian, Italian, Japanese, Korean, Dutch, Portuguese, Turkish, and Chinese.

When STT is enabled, the detector uses the language it reports to apply the right per-language threshold. To force a specific language, configure the [STT model](https://docs.livekit.io/agents/models/stt.md) with that language. The `language` parameter accepts any format supported by [`LanguageCode`](https://docs.livekit.io/agents/models/stt.md#language-codes). For example, to set Spanish:

**Python**:

```python
session = AgentSession(
    turn_handling=TurnHandlingOptions(
        turn_detection=inference.TurnDetector(),
    ),
    stt=inference.STT(language="es"),
    # ... tts, llm, etc.
)

```

---

**Node.js**:

```typescript
const session = new voice.AgentSession({
  turnHandling: {
    turnDetection: new inference.TurnDetector(),
  },
  stt: new inference.STT({ language: 'es' }),
  // ... tts, llm, etc.
});

```

When no STT is configured (for example, with a realtime model), the detector defaults to English thresholds.

### Custom thresholds

Each language has a calibrated `unlikely_threshold` that determines how confident the model must be before considering the user's turn complete. Lower values make the detector more eager to respond while higher values make it more patient.

Override the threshold globally with a scalar:

**Python**:

```python
inference.TurnDetector(unlikely_threshold=0.5)

```

---

**Node.js**:

```typescript
new inference.TurnDetector({ unlikelyThreshold: 0.5 });

```

Or override per language (unmapped languages keep the default):

**Python**:

```python
inference.TurnDetector(
    unlikely_threshold={
        "en": 0.5,
        "ja": 0.6,
    }
)

```

---

**Node.js**:

```typescript
new inference.TurnDetector({
  unlikelyThreshold: {
    en: 0.5,
    ja: 0.6,
  },
});

```

The two models ship with different calibrated defaults. When the session falls back from `v1` to `v1-mini` mid-session, your override is rescaled to preserve its relationship to the calibrated defaults of the active model.

### Realtime model usage

Because the audio turn detector doesn't depend on a transcript, you can use it with a realtime model without adding an STT plugin. You still need to disable the realtime model's built-in turn detection so the two systems don't conflict.

**Python**:

```python
from livekit.agents import AgentSession, TurnHandlingOptions, inference
from livekit.plugins import openai

session = AgentSession(
    turn_handling=TurnHandlingOptions(
        turn_detection=inference.TurnDetector(),
    ),
    llm=openai.realtime.RealtimeModel(
        voice="alloy",
        # Disable the model's built-in turn detection to use
        # the LiveKit audio turn detector instead
        turn_detection=None,
    ),
)

```

---

**Node.js**:

```typescript
import { inference, voice } from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';

const session = new voice.AgentSession({
  turnHandling: {
    turnDetection: new inference.TurnDetector(),
  },
  llm: new openai.realtime.RealtimeModel({
    voice: 'alloy',
    // Disable the model's built-in turn detection to use
    // the LiveKit audio turn detector instead
    turnDetection: null,
  }),
});

```

### Default model selection

When you don't set the `version` parameter, the detector picks a version based on your environment:

| Environment | Default version |
| Agent deployed to LiveKit Cloud | `v1` (full model) |
| Local development (`dev` mode) with LiveKit Cloud credentials | `v1` (full model) |
| Self-hosted agent in production (`start` command) | `v1-mini` (runs locally) |

To use the full model in a self-hosted agent, or to pin one version in every environment, set `version` explicitly (for example, to `"v1"`). The full model authenticates with your LiveKit Cloud project's API key and secret (`LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`). Self-hosted or local usage of the full model counts toward a monthly development allowance. To learn more, see [Audio turn detection](https://docs.livekit.io/deploy/admin/quotas-and-limits.md#audio-turn-detection) on the Quotas and limits page.

If you don't pass `turn_detection` to `AgentSession` at all, the session uses a `TurnDetector` by default, unless your LLM is a realtime model that provides its own server-side turn detection.

When `v1-mini` runs (in a self-hosted agent started with `start`, or after a fallback), it executes in a shared CPU process. Use compute-optimized instances (such as AWS c6i or c7i) rather than burstable instances (such as AWS t3 or t4g) to avoid inference timeouts from CPU credit limits.

### Fallback to the mini model

When the full `v1` model is active, the detector watches for prediction timeouts and for errors from LiveKit Inference, such as a failed connection or a request rejected because the project reached its usage limit. If either occurs, the session does the following:

1. Logs a warning (once per session).
2. Emits a default probability (`1.0`) for any in-flight prediction so the current turn isn't blocked.
3. Swaps to `v1-mini` for the rest of the session.
4. Rescales any custom `unlikely_threshold` to preserve its relationship to the mini model's calibrated defaults.

The fallback is sticky for the lifetime of the session. The next session starts fresh and attempts the full model again. In Python, set `local_fallback=False` to turn off the fallback. If LiveKit Inference then returns an error or the connection fails, turn detection stops for the rest of the session, and the session ends each user turn after the [endpointing delay](#audio-endpointing). With the fallback turned off, a prediction timeout ends only the current turn, and the next turn uses the full model again.

If `v1-mini` isn't available (for example, the binary failed to load), the detector emits the default probability for each turn and retries on the next turn. The full model is also retried on each new session.

### Benchmarks

LiveKit benchmarks the audio turn detector against other end-of-turn models using [eot-bench](https://github.com/livekit/eot-bench), an open source harness that simulates the live turn-taking decisions a production voice agent makes against natural, task-oriented conversations. See the repository for the current methodology and results.

For a deeper look at the model architecture and evaluation approach, see the [LiveKit blog](https://livekit.com/blog/solving-end-of-turn-detection).

## Text turn detector

> 🔥 **Deprecated**
> 
> The text turn detector is deprecated and slated for removal in version 2.0 of the LiveKit Agents SDK. Use the [audio turn detector](#audio-turn-detector) for new agents. It remains available for cases where you can't use LiveKit Inference and need a fully open-weights, self-contained option, but no longer receives feature work.

The text turn detector is an open-weights language model that adds conversational context as an additional signal to VAD using transcripts from your STT pipeline.

For more general information about the model, read about it on the [LiveKit blog](https://blog.livekit.io/improved-end-of-turn-model-cuts-voice-ai-interruptions-39/).

### Requirements

The text turn detector is designed for use inside an `AgentSession` and also requires an [STT model](https://docs.livekit.io/agents/models/stt.md). If you're using a realtime model, you must include a separate STT model to use this detector.

LiveKit recommends also using the [Silero VAD plugin](https://docs.livekit.io/agents/logic/turns/vad.md) for maximum performance, but you can rely on your STT plugin's endpointing instead if you prefer.

The model is deployed globally on LiveKit Cloud, and agents deployed there automatically use this optimized inference service.

For custom agent deployments, the model runs locally on the CPU in a shared process and requires <`500` MB of RAM. Use compute-optimized instances (such as AWS c6i or c7i) rather than burstable instances (such as AWS t3 or t4g) to avoid inference timeouts due to CPU credit limits.

### Installation

Install the plugin.

**Python**:

Install the plugin from PyPI:

```shell
uv add "livekit-agents[turn-detector]~=1.8"

```

---

**Node.js**:

Install the plugin from npm:

```shell
pnpm install @livekit/agents-plugin-livekit

```

### Usage

Initialize your `AgentSession` with the `MultilingualModel` and an STT model. These examples use LiveKit Inference for STT, but more options [are available](https://docs.livekit.io/agents/models/stt.md).

**Python**:

```python
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from livekit.agents import AgentSession, inference, TurnHandlingOptions

session = AgentSession(
    turn_handling=TurnHandlingOptions(
        turn_detection=MultilingualModel(),
    ),
    stt=inference.STT(language="multi"),
    # ... vad, stt, tts, llm, etc.
)

```

---

**Node.js**:

```typescript
import { voice, inference } from '@livekit/agents';
import * as livekit from '@livekit/agents-plugin-livekit';

const session = new voice.AgentSession({
  stt: new inference.STT({ language: 'multi' }),
  turnHandling: {
    turnDetection: new livekit.turnDetector.MultilingualModel(),
  },
  // ... vad, stt, tts, llm, etc.
});

```

### Parameters

The text turn detector itself has no configuration, but you can configure the following endpointing parameters in the turn handling options passed to the `AgentSession`. To learn more, see [EndpointingOptions](https://docs.livekit.io/reference/agents/turn-handling-options.md#endpointingoptions).

- **`mode`** _(Literal['dynamic', 'fixed'])_ (optional) - Default: `fixed`: Endpointing timing behavior. The endpointing delay is the time the agent waits before terminating the users's turn.

- `"fixed"` - Use the configured `min_delay` and `max_delay` values to determine the endpointing delay.
- `"dynamic"` - Adapt the delay within the `min_delay` and `max_delay` range based on session pause statistics (exponential moving average of between-utterance and between-turn pauses). Suits most conversations.

- **`min_delay`** _(float)_ (optional) - Default: `0.5 seconds`: Minimum time (in seconds) to wait since the last detected speech to declare the user's turn to be complete.

With [dynamic endpointing](https://docs.livekit.io/reference/agents/turn-handling-options.md#dynamic-endpointing), this is the lower bound. The agent might use a longer effective delay when session pause statistics suggest slower turn-taking.

- In VAD mode, this effectively behaves like `max(VAD silence, min_delay)`.
- In STT mode, this is applied _after_ the STT end-of-speech signal, and therefore in addition to the STT provider's endpointing delay.

- **`max_delay`** _(float)_ (optional) - Default: `3.0 seconds`: Maximum time (in seconds) the agent waits before terminating the turn. This prevents the agent from waiting indefinitely for the user to continue speaking.

With [dynamic endpointing](https://docs.livekit.io/reference/agents/turn-handling-options.md#dynamic-endpointing), this is the upper bound. The agent might use a shorter effective delay when session pause statistics suggest faster turn-taking.

- **`alpha`** _(float)_ (optional) - Default: `0.9`: Exponential moving average (EMA) coefficient for [dynamic endpointing](https://docs.livekit.io/reference/agents/turn-handling-options.md#dynamic-endpointing). Higher values give more weight to accumulated history, so the learned delay adapts more slowly. Lower values react faster to recent pauses. Only applies when `mode` is `"dynamic"`.

> ℹ️ **Note**
> 
> When you use the [audio turn detector](https://docs.livekit.io/agents/logic/turns/turn-detector.md#audio-turn-detector), any `min_delay` and `max_delay` values you don't set default to `0.3` and `2.5` seconds instead of `0.5` and `3.0`. The model provides a confident end-of-turn signal, so the agent can commit sooner. See [Endpointing defaults](https://docs.livekit.io/agents/logic/turns/turn-detector.md#audio-endpointing).

> ℹ️ **Time units**
> 
> In Node.js, `min_delay` and `max_delay` are in milliseconds (for example, `500` and `3000`). Python uses seconds (for example, `0.5` and `3.0`).

### Supported languages

The `MultilingualModel` supports English and 13 other languages. The model relies on your [STT model](https://docs.livekit.io/agents/models/stt.md) to report the language of the user's speech. To set the language to a fixed value, configure the STT model with a specific language. The `language` parameter accepts any format supported by [`LanguageCode`](https://docs.livekit.io/agents/models/stt.md#language-codes). For example, to force the model to use Spanish:

**Python**:

```python
session = AgentSession(
    turn_handling=TurnHandlingOptions(
        turn_detection=MultilingualModel(),
    ),
    stt=inference.STT(language="es"),
    # ... vad, stt, tts, llm, etc.
)

```

---

**Node.js**:

```typescript
import { voice, inference } from '@livekit/agents';
import * as livekit from '@livekit/agents-plugin-livekit';

const session = new voice.AgentSession({
  stt: new inference.STT({ language: 'es' }),
  turnHandling: {
    turnDetection: new livekit.turnDetector.MultilingualModel(),
  },
  // ... vad, stt, tts, llm, etc.
});

```

The model currently supports English, Spanish, French, German, Italian, Portuguese, Dutch, Chinese, Japanese, Korean, Indonesian, Turkish, Russian, and Hindi.

### Realtime model usage

Realtime models like the OpenAI Realtime API produce user transcripts after the end of the turn, rather than incrementally while the user speaks. The text turn detector requires live STT results to operate, so you must provide an STT plugin to the `AgentSession` to use it with a realtime model. This incurs extra cost for the STT model.

You must also disable the realtime model's built-in turn detection so it doesn't conflict with the LiveKit turn detector. The following example demonstrates how to do this with the OpenAI Realtime API:

**Python**:

```python
from livekit.agents import AgentSession, TurnHandlingOptions
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from livekit.plugins import deepgram, openai, silero

session = AgentSession(
    turn_handling=TurnHandlingOptions(
        turn_detection=MultilingualModel(),
    ),
    vad=silero.VAD.load(),
    stt=deepgram.STT(),
    # OpenAI Realtime API
    llm=openai.realtime.RealtimeModel(
        voice="alloy",
        # Disable the model's built-in turn detection to use
        # the LiveKit turn detector instead
        turn_detection=None,
        input_audio_transcription=None,  # use Deepgram STT instead
    ),
)

```

---

**Node.js**:

```typescript
import { voice } from '@livekit/agents';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as livekit from '@livekit/agents-plugin-livekit';
import * as openai from '@livekit/agents-plugin-openai';
import * as silero from '@livekit/agents-plugin-silero';

const session = new voice.AgentSession({
  turnHandling: {
    turnDetection: new livekit.turnDetector.MultilingualModel(),
  },
  vad: await silero.VAD.load(),
  stt: new deepgram.STT(),
  // OpenAI Realtime API
  llm: new openai.realtime.RealtimeModel({
    voice: 'alloy',
    // Disable the model's built-in turn detection to use
    // the LiveKit turn detector instead
    turnDetection: null,
    inputAudioTranscription: null, // use Deepgram STT instead
  }),
});

```

### Benchmarks

The following data shows the expected performance of the text turn detector model.

#### Runtime performance

The size on disk and typical CPU inference time for the text turn detector model is as follows:

| Model | Base Model | Size on Disk | Per Turn Latency |
| Multilingual | [Qwen2.5-0.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct) | 396 MB | ~50-160 ms |

#### Detection accuracy

The following tables show accuracy metrics for the text turn detector model in each supported language.

- **True positive** means the model correctly identifies the user has finished speaking.
- **True negative** means the model correctly identifies the user will continue speaking.

| Language | True Positive Rate | True Negative Rate |
| Hindi | 99.4% | 96.30% |
| Korean | 99.3% | 94.50% |
| French | 99.3% | 88.90% |
| Portuguese | 99.4% | 87.40% |
| Indonesian | 99.3% | 89.40% |
| Russian | 99.3% | 88.00% |
| English | 99.3% | 87.00% |
| Chinese | 99.3% | 86.60% |
| Japanese | 99.3% | 88.80% |
| Italian | 99.3% | 85.10% |
| Spanish | 99.3% | 86.00% |
| German | 99.3% | 87.80% |
| Turkish | 99.3% | 87.30% |
| Dutch | 99.3% | 88.10% |

### Resources

The following resources cover the open-weights text turn detector:

- **[Plugin reference](https://docs.livekit.io/reference/python/livekit/plugins/turn_detector/index.html.md)**: Reference for the `livekit-plugins-turn-detector` package.

- **[GitHub repo](https://github.com/livekit/agents/tree/main/livekit-plugins/livekit-plugins-turn-detector)**: View the source or contribute to the text turn detector plugin.

- **[LiveKit Model License](https://huggingface.co/livekit/turn-detector/blob/main/LICENSE)**: LiveKit Model License used for the text turn detector and the `v1-mini` model.

## Additional resources

- **[Audio turn detector deep dive](https://livekit.com/blog/solving-end-of-turn-detection)**: Model architecture, benchmarks, and evaluation methodology on the LiveKit blog.

- **[Evaluation harness](https://github.com/livekit/eot-bench)**: Open source harness for benchmarking end-of-turn models under production endpointing policies.

- **[Evaluation datasets](https://huggingface.co/datasets/livekit/eot-evals)**: Open source English and multilingual end-of-turn test datasets on Hugging Face.

---

This document was rendered at 2026-10-24T20:20:12.598Z.
For the latest version of this document, see [https://docs.livekit.io/agents/logic/turns/turn-detector.md](https://docs.livekit.io/agents/logic/turns/turn-detector.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).

<!-- ================================================================ -->
## Page: https://docs.livekit.io/frontends/authentication/tokens.md

LiveKit docs › Agent Frontends › Reference › Tokens & grants

---

# Access tokens & grants

> Reference documentation for access tokens, grants, and permissions.

## Overview

For a LiveKit SDK to successfully connect to the server, it must pass an access token with the request. This token encodes the identity of a participant, name of the room, capabilities (for example, publishing audio, video, or data), and permissions (for example, permission to moderate a room). Access tokens are JWT-based and signed with your API secret to prevent forgery.

> 🔥 **Don't put PII in identity or room name**
> 
> Participant identity and room name are recorded in logs and traces throughout LiveKit and its infrastructure, and aren't removed by [PII redaction](https://docs.livekit.io/testing/observability/pii-redaction.md). Don't put personally identifiable information (such as real names, phone numbers, or email addresses) in these fields. Use an opaque identifier such as a UUID, and map it to user data in your own backend.

Access tokens also carry an expiration time, after which the server rejects connections with that token. Expiration time only impacts the initial connection, and not subsequent reconnects. To learn more, see [Token refresh](#token-refresh).

For guidance on generating tokens in your frontend or backend, see:

- **[Authentication overview](https://docs.livekit.io/frontends/build/authentication.md)**: Learn about `TokenSource` and the recommended authentication workflows.

- **[Custom token generation](https://docs.livekit.io/frontends/build/authentication/custom.md)**: Create tokens programmatically with server SDKs.

## Access token structure

Access tokens are JWTs that contain participant identity, room information, and permissions. When decoded, a token's payload includes standard JWT fields and LiveKit-specific grants.

The following example shows the decoded body of a join token:

```json
{
  "exp": 1621657263,
  "iss": "APIMmxiL8rquKztZEoZJV9Fb",
  "sub": "myidentity",
  "nbf": 1619065263,
  "video": {
    "room": "myroom",
    "roomJoin": true
  },
  "metadata": ""
}

```

| field | description |
| `exp` | Expiration time of token |
| `iss` | API key used to issue this token |
| `sub` | Unique identity for the participant |
| `nbf` | Start time that the token becomes valid |
| `video` | Video grant, including room permissions (see below) |
| `metadata` | Participant metadata |
| `attributes` | Participant attributes (key/value pairs of strings) |
| `sip` | SIP grant |

## Grants and permissions

Grants define what a participant can do in a room or with LiveKit services. Tokens can include video grants, SIP grants, and room configurations.

### Video grant

Room permissions are specified in the `video` field of a decoded join token.

This field may contain one or more of the following properties:

| field | type | description |
| `roomCreate` | boolean | Permission to create or delete rooms |
| `roomList` | boolean | Permission to list available rooms |
| `roomJoin` | boolean | Permission to join a room |
| `roomAdmin` | boolean | Permission to moderate a room |
| `roomRecord` | boolean | Permission to use Egress service |
| `ingressAdmin` | boolean | Permission to use Ingress service |
| `room` | string | Name of the room, required if join or admin is set |
| `canPublish` | boolean | Allow participant to publish tracks |
| `canPublishData` | boolean | Allow participant to publish data to the room |
| `canPublishSources` | string | Requires `canPublish` to be true. When set, only listed sources can be published. (camera, microphone, screen_share, screen_share_audio) |
| `canSubscribe` | boolean | Allow participant to subscribe to tracks |
| `canUpdateOwnMetadata` | boolean | Allow participant to update its own metadata |
| `hidden` | boolean | Hide participant from others in the room |
| `kind` | string | [Type of participant](https://docs.livekit.io/intro/basics/rooms-participants-tracks/participants.md#types-of-participants) (standard, ingress, egress, sip, agent, or connector). This field is typically set by LiveKit internals. |
| `destinationRoom` | string | Name of the room a participant can be [forwarded](https://docs.livekit.io/intro/basics/rooms-participants-tracks/participants.md#forwardparticipant) to. |

#### Creating a subscribe-only token

This example shows how to create a token where the participant can only subscribe (and not publish) into the room:

```json
{
  ...
  "video": {
    "room": "myroom",
    "roomJoin": true,
    "canSubscribe": true,
    "canPublish": false,
    "canPublishData": false
  }
}

```

#### Creating a camera-only token

This example shows how to create a token where the participant can publish camera tracks, but disallow other sources:

```json
{
  ...
  "video": {
    "room": "myroom",
    "roomJoin": true,
    "canSubscribe": true,
    "canPublish": true,
    "canPublishSources": ["camera"]
  }
}

```

### SIP grant

To interact with the SIP service, permission must be granted in the `sip` field of the JWT.

This field may contain the following properties:

| field | type | description |
| `admin` | boolean | Permission to manage SIP trunks and dispatch rules. |
| `call` | boolean | Permission to make SIP calls via `CreateSIPParticipant`. |

#### Creating a token with SIP grants

This example shows how to create a token where the participant can manage SIP trunks and dispatch rules, and make SIP calls:

**Node.js**:

```typescript
import { AccessToken, SIPGrant, VideoGrant } from 'livekit-server-sdk';

const roomName = 'name-of-room';
const participantName = 'user-name';

const at = new AccessToken('api-key', 'secret-key', {
  identity: participantName,
});

const sipGrant: SIPGrant = { 
  admin: true,
  call: true,
};  

const videoGrant: VideoGrant = { 
  room: roomName,
  roomJoin: true,
};  

at.addGrant(sipGrant);
at.addGrant(videoGrant);

const token = await at.toJwt();
console.log('access token', token);

```

---

**Python**:

```python
from livekit import api
import os

token = api.AccessToken(os.environ['LIVEKIT_API_KEY'],
                        os.environ['LIVEKIT_API_SECRET']) \
    .with_identity("identity") \
    .with_name("name") \
    .with_grants(api.VideoGrants(
        room_join=True,
        room="my-room")) \
    .with_sip_grants(api.SIPGrants(
        admin=True,
        call=True)).to_jwt()

```

---

**Ruby**:

```ruby
require 'livekit'

token = LiveKit::AccessToken.new(api_key: 'yourkey', api_secret: 'yoursecret')
token.identity = 'participant-identity'
token.name = 'participant-name'

token.video_grant=(LiveKit::VideoGrant.from_hash(roomJoin: true,
                                                 room: 'room-name'))
token.sip_grant=(LiveKit::SIPGrant.from_hash(admin: true, call: true))

puts token.to_jwt

```

---

**Go**:

```go
import (
  "time"

  "github.com/livekit/protocol/auth"
)

func getJoinToken(apiKey, apiSecret, room, identity string) (string, error) {

  at := auth.NewAccessToken(apiKey, apiSecret)

  videoGrant := &auth.VideoGrant{
    RoomJoin:     true,
    Room:         room,
  }

  sipGrant := &auth.SIPGrant{
    Admin:     true,
    Call:      true,
  }

  at.SetSIPGrant(sipGrant).
    SetVideoGrant(videoGrant).
    SetIdentity(identity).
    SetValidFor(time.Hour)

  return at.ToJWT()
}

```

---

**Kotlin**:

```kotlin
import io.livekit.server.AccessToken
import io.livekit.server.RoomJoin
import io.livekit.server.RoomName
import io.livekit.server.SIPAdmin
import io.livekit.server.SIPCall

val token = AccessToken(System.getenv("LIVEKIT_API_KEY"), System.getenv("LIVEKIT_API_SECRET"))
token.identity = "participant-identity"
token.name = "participant-name"

token.addGrants(RoomJoin(true), RoomName("room-name"))
token.addSIPGrants(SIPAdmin(true), SIPCall(true))

println(token.toJwt())

```

---

**Rust**:

```rust
use livekit_api::access_token;
use std::env;

fn create_token() -> Result<String, access_token::AccessTokenError> {
    let api_key = env::var("LIVEKIT_API_KEY").expect("LIVEKIT_API_KEY is not set");
    let api_secret = env::var("LIVEKIT_API_SECRET").expect("LIVEKIT_API_SECRET is not set");

    let token = access_token::AccessToken::with_api_key(&api_key, &api_secret)
        .with_identity("rust-bot")
        .with_name("Rust Bot")
        .with_grants(access_token::VideoGrants {
             room_join: true,
             room: "my-room".to_string(),
             ..Default::default()
        })
        .with_sip_grants(access_token::SIPGrants {
            admin: true,
            call: true
        })
        .to_jwt();
    return token
}

```

### Room configuration

You can create an access token for a user that includes room configuration options. The configuration is applied only when the room is first created. If the room already exists, LiveKit ignores the configuration in the token. This is useful for [explicitly dispatching an agent](https://docs.livekit.io/agents/server/agent-dispatch.md) when the room is created.

For the full list of `RoomConfiguration` fields, see [RoomConfiguration](https://docs.livekit.io/reference/server/server-apis.md#roomconfiguration).

#### Creating a token with room configuration

**Node.js**:

For a full example of explicit agent dispatch, see the [example](https://github.com/livekit/node-sdks/blob/main/examples/agent-dispatch/index.ts) in GitHub.

```typescript
import { AccessToken, VideoGrant } from 'livekit-server-sdk';
import { RoomAgentDispatch, RoomConfiguration } from '@livekit/protocol';

const roomName = 'name-of-room';
const participantName = 'user-name';
const agentName = 'my-agent';

const at = new AccessToken('api-key', 'secret-key', {
  identity: participantName,
});

const videoGrant: VideoGrant = { 
  room: roomName,
  roomJoin: true,
};  

at.addGrant(videoGrant);
at.roomConfig = new RoomConfiguration({
  agents: [
    new RoomAgentDispatch({
      agentName,
      metadata: "test-metadata",
      // deployment: "staging", // Optional; empty = production
    })
  ]
});

const token = await at.toJwt();
console.log('access token', token);

```

---

**Python**:

For a full example of explicit agent dispatch, see the [example](https://github.com/livekit/python-sdks/blob/main/examples/agent_dispatch.py) in GitHub.

```python
from livekit import api
import os

token = api.AccessToken(os.environ['LIVEKIT_API_KEY'],
                        os.environ['LIVEKIT_API_SECRET']) \
    .with_identity("identity") \
    .with_name("name") \
    .with_grants(api.VideoGrants(
        room_join=True,
        room="my-room")) \
        .with_room_config(
            api.RoomConfiguration(
                agents=[
                    api.RoomAgentDispatch(
                        agent_name="my-agent", metadata="test-metadata"
                    )
                ],
            ),
        ).to_jwt()

```

---

**Ruby**:

```ruby
require 'livekit'

token = LiveKit::AccessToken.new(api_key: 'yourkey', api_secret: 'yoursecret')
token.identity = 'participant-identity'
token.name = 'participant-name'

token.video_grant=(LiveKit::VideoGrant.new(roomJoin: true,
                                           room: 'room-name'))
token.room_config=(LiveKit::Proto::RoomConfiguration.new(
    max_participants: 10,
    agents: [LiveKit::Proto::RoomAgentDispatch.new(
      agent_name: "my-agent",
      metadata: "test-metadata",
    )]
  )
)

puts token.to_jwt

```

---

**Go**:

```go
import (
  "time"

  "github.com/livekit/protocol/auth"
  "github.com/livekit/protocol/livekit"
)

func getJoinToken(apiKey, apiSecret, room, identity string) (string, error) {

  at := auth.NewAccessToken(apiKey, apiSecret)

  videoGrant := &auth.VideoGrant{
    RoomJoin:     true,
    Room:         room,
  }

  roomConfig := &livekit.RoomConfiguration{
    Agents: []*livekit.RoomAgentDispatch{{
      AgentName: "my-agent",
      Metadata:  "test-metadata",
      // Deployment: "staging", // Optional; empty = production
    }},
  }

  at.SetVideoGrant(videoGrant).
    SetRoomConfig(roomConfig).
    SetIdentity(identity).
    SetValidFor(time.Hour)

  return at.ToJWT()
}

```

---

**Kotlin**:

```kotlin
import io.livekit.server.AccessToken
import io.livekit.server.RoomJoin
import io.livekit.server.RoomName
import livekit.LivekitAgentDispatch
import livekit.LivekitRoom.RoomConfiguration

val token = AccessToken(System.getenv("LIVEKIT_API_KEY"), System.getenv("LIVEKIT_API_SECRET"))
token.identity = "participant-identity"
token.name = "participant-name"

token.addGrants(RoomJoin(true), RoomName("room-name"))

token.roomConfiguration = with(RoomConfiguration.newBuilder()) {
    maxParticipants = 10
    addAgents(
        LivekitAgentDispatch.RoomAgentDispatch.newBuilder()
            .setAgentName("my-agent")
            .setMetadata("test-metadata")
            .build()
    )
    build()
}

println(token.toJwt())

```

---

**Rust**:

```rust
use livekit_api::access_token;
use livekit_protocol::{RoomAgentDispatch, RoomConfiguration};
use std::env;

fn create_token() -> Result<String, access_token::AccessTokenError> {
    let api_key = env::var("LIVEKIT_API_KEY").expect("LIVEKIT_API_KEY is not set");
    let api_secret = env::var("LIVEKIT_API_SECRET").expect("LIVEKIT_API_SECRET is not set");

    let token = access_token::AccessToken::with_api_key(&api_key, &api_secret)
        .with_identity("rust-bot")
        .with_name("Rust Bot")
        .with_grants(access_token::VideoGrants {
             room_join: true,
             room: "my-room".to_string(),
             ..Default::default()
        })
        .with_room_config(RoomConfiguration {
            agents: vec![RoomAgentDispatch {
                agent_name: "my-agent".to_string(),
                metadata: "test-metadata".to_string(),
                // deployment: "staging".to_string(), // Optional; empty = production
                ..Default::default()
            }],
            ..Default::default()
        })
        .to_jwt();
    return token
}

```

## Token lifecycle

Tokens have a lifecycle that includes refresh and permission updates during a session.

### Token refresh

LiveKit server proactively issues refreshed tokens to connected clients, ensuring they can reconnect if disconnected. Refreshed tokens expire after 10 minutes or the remaining lifetime of the original token, whichever is longer. This lets clients with long-lived tokens reconnect successfully after extended network drops.

Tokens are also automatically refreshed when there are changes to a participant's name, permissions, or metadata.

### Token revocation

When a participant's permissions are updated or they are removed from a room, their existing token is automatically revoked. This prevents the participant from using an old, cached token to reconnect with outdated permissions.

> ℹ️ **Cloud-only feature**
> 
> Token revocation is only available on LiveKit Cloud. For [self-hosted deployments](#self-hosted), see the following section.

Token revocation works by tracking the token's not-before (`nbf`) timestamp. When permissions change or a participant is removed, the server sets a revocation cutoff and rejects reconnections from tokens whose `nbf` is earlier than it. By default, the cutoff is the server's current time, with a one-minute buffer to allow for clock differences.

This security feature ensures:

- Removed participants can't rejoin with their existing token while the revocation is in effect.
- Permission revocations take effect immediately, even for reconnections.
- Participants must request a new token to reconnect.

Because revocation is evaluated per token against its `nbf` value, and LiveKit [refreshes tokens](#token-refresh) automatically during a session, a participant can hold a refreshed token whose `nbf` is more recent than the one you revoked. With the default one-minute buffer, a token issued within about a minute of the removal still passes the check, so the participant can rejoin until that token expires. To reject a rejoin strictly, pass an explicit `revoke_token_ts` when you call `RemoveParticipant`.

You can also revoke the token of a participant who has already left the room by calling `RemoveParticipant` with their identity. By default, the API returns a `participant does not exist` error, but the token is still revoked. Pass `revoke_token_ts` to set the revocation cutoff to a specific moment (for example, an event in your own app's timeline) and receive a successful response instead.

On LiveKit Cloud, a revocation stays in effect for 10 minutes after the `RemoveParticipant` or `UpdateParticipant` call. After that, LiveKit accepts the revoked token again if it hasn't expired. Tokens issued without an explicit time-to-live (TTL) default to 6 hours in most server SDKs (10 minutes in Ruby), so to make sure a removed participant can't rejoin, issue tokens with a TTL of 10 minutes or less, for example `ttl: '10m'` in Node.js or `SetValidFor(10 * time.Minute)` in Go. A short TTL doesn't disconnect participants who are already connected. LiveKit refreshes their tokens every 5 minutes.

To learn more, see [Remove participant](https://docs.livekit.io/intro/basics/rooms-participants-tracks/participants.md#removeparticipant) and [Setting an explicit revocation cutoff](https://docs.livekit.io/intro/basics/rooms-participants-tracks/participants.md#removeparticipant-revoke-token-ts).

#### Self-hosted deployments

For self-hosted deployments, removing a participant or updating their permissions doesn't invalidate the participant's existing token. To prevent a participant from rejoining the same room or using a token with outdated permissions, generate access tokens with a short Time-To-Live (TTL).

When you remove a participant, do not generate a new token for the same participant via your application's backend.

### Updating permissions

A participant's permissions can be updated at any time, even after they've already connected. This is useful in applications where the participant's role could change during the session, such as in a participatory livestream.

It's possible to issue a token with `canPublish: false` initially, and then update it to `canPublish: true` during the session. Permissions can be changed with the [`UpdateParticipant`](https://docs.livekit.io/intro/basics/rooms-participants-tracks/participants.md#updating-participant-permissions) server API.

---

This document was rendered at 2026-10-24T20:20:13.000Z.
For the latest version of this document, see [https://docs.livekit.io/frontends/reference/tokens-grants.md](https://docs.livekit.io/frontends/reference/tokens-grants.md).

To explore all LiveKit documentation, see [llms.txt](https://docs.livekit.io/llms.txt).
