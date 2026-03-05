# FAA — Failure Alert Assistant

**Real-time terminal failure detection for VS Code.**
Sound alerts + notifications whenever errors, exceptions, or build failures occur.

[![VS Code](https://img.shields.io/badge/VS%20Code-1.93%2B-blue)](https://code.visualstudio.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Features

- **Audio + visual alerts** on terminal failures
- **34 detection patterns** — errors, exceptions, build failures, permission issues, and more
- **Cross-platform** — Windows (`winmm`), macOS (`afplay`), Linux (`paplay`/`mpg123`)
- **Configurable cooldown** to prevent alert fatigue
- **Zero configuration** — works out of the box

## Install

**Marketplace:** Extensions (`Ctrl+Shift+X`) → search `FAA Failure Alert Assistant` → Install

**Manual:** `code --install-extension FAA-1.0.2.vsix`

## Commands

`Ctrl+Shift+P` →

| Command | Description |
|---------|-------------|
| `FAA: Test Alert` | Trigger a test sound + notification |
| `FAA: Toggle Enabled` | Enable / disable monitoring |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `faa.enabled` | `true` | Enable monitoring |
| `faa.cooldownSeconds` | `5` | Min seconds between alerts |
| `faa.showNotification` | `true` | Show popup notification |
| `faa.playSound` | `true` | Play alert sound |

## How It Works

1. Listens to terminal output via `onDidWriteTerminalData`
2. Strips ANSI escape codes from raw terminal data
3. Matches cleaned text against failure patterns (regex)
4. Triggers alert if cooldown has elapsed — plays sound + shows notification

## Troubleshooting

| Platform | Requirement |
|----------|-------------|
| Windows | Built-in (`winmm.dll`) |
| macOS | Built-in (`afplay`) |
| Linux | `sudo apt install pulseaudio-utils` or `mpg123` |

If no sound plays, run `FAA: Test Alert` from the Command Palette and check the Debug Console (`Ctrl+Shift+Y`) for logs prefixed with `FAA:`.

## Author

**Pradeep Kumar Awasthi**
Instrumentation & Control Engineering, Dr. B.R. Ambedkar NIT Jalandhar
[GitHub](https://github.com/pradeep-gif-hub)

## License

[MIT](LICENSE)
