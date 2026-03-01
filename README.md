<div align="center">

# 🚨 FAA — Failure Alert Assistant

### Aviation-Themed Terminal Failure Detection for VS Code

[![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-blue?style=for-the-badge&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=PradeepAwasthi.faa-failure-alert-assistant)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-orange?style=for-the-badge)](CHANGELOG.md)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=for-the-badge)]()

<br>

```
  ╔═══════════════════════════════════════╗
  ║         🚨 F A A 🚨                   ║
  ║     FAILURE ALERT ASSISTANT           ║
  ║                                       ║
  ║  🔊 Sound  •  📢 Alerts  •  ⚡ Fast   ║
  ╚═══════════════════════════════════════╝
```

<br>

**Never miss a terminal failure again!**

FAA automatically monitors all VS Code terminals and plays an alert sound + shows a notification whenever errors, exceptions, or build failures are detected.

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔊 **Automatic Sound Alerts** | Plays `faaa.mp3` when failures are detected |
| 📢 **Visual Notifications** | Shows professional popup alerts with failure details |
| 🎯 **Smart Detection** | Monitors 30+ failure patterns including errors, exceptions, build failures |
| ⏱️ **Cooldown System** | 5-second cooldown prevents alert spam |
| 🖥️ **Cross-Platform** | Works on Windows, macOS, and Linux |
| 🔧 **Configurable** | Enable/disable sound, notifications, adjust cooldown |
| 🛫 **Aviation Theme** | Professional, dark-theme friendly design |

---

## 🎬 How It Works

```
┌──────────────────────────────────────────────────────────────┐
│                     VS Code Terminal                          │
│                                                               │
│  $ npm run build                                              │
│  > building...                                                │
│  > ERROR: Module not found                        ← DETECTED! │
│  > Build failed                                   ← DETECTED! │
│                                                               │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   FAA Engine    │
                    │  Pattern Match  │
                    └────────┬────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼                               ▼
    ┌──────────────────┐            ┌──────────────────┐
    │  🔊 Play Sound   │            │  📢 Show Alert   │
    │   (faaa.mp3)     │            │   Notification   │
    └──────────────────┘            └──────────────────┘
```

---

## 🎯 Detected Failure Patterns

FAA monitors terminal output for these patterns (case-insensitive):

| Category | Patterns |
|----------|----------|
| **General Errors** | `error`, `failed`, `failure`, `exception` |
| **Stack Traces** | `traceback`, `stack trace`, `unhandled exception` |
| **Exit Codes** | `exit code 1`, `exit code 2`, etc. |
| **Build Failures** | `build failed`, `compilation error`, `compiler error` |
| **NPM/Node** | `npm error`, `npm err!`, `cannot find module`, `module not found` |
| **Python** | `python exception`, `traceback`, `syntax error` |
| **System** | `permission denied`, `access denied`, `command not found` |
| **Tests** | `test failed`, `assertion failed` |
| **C/C++/Rust** | `gcc error`, `clang error`, `cargo error`, `make error`, `segmentation fault` |
| **Network** | `connection refused`, `timeout error` |

---

## 📦 Installation

### Method 1: VS Code Marketplace

1. Open VS Code
2. Press `Ctrl+Shift+X` (or `Cmd+Shift+X` on macOS)
3. Search for **"FAA Failure Alert Assistant"**
4. Click **Install**

### Method 2: Install from VSIX

1. Download `FAA-1.0.0.vsix` from [Releases](https://github.com/pradeep-gif-hub/FAA-Sound-Extension/releases)
2. Open VS Code
3. Press `Ctrl+Shift+P` → Type **"Extensions: Install from VSIX..."**
4. Select the downloaded `.vsix` file
5. Reload VS Code

### Method 3: Build from Source

```bash
# Clone the repository
git clone https://github.com/pradeep-gif-hub/FAA-Sound-Extension.git
cd FAA-Sound-Extension

# Install dependencies
npm install

# Package the extension
npx vsce package

# Install the generated .vsix file
code --install-extension FAA-1.0.0.vsix
```

---

## ⚙️ Configuration

Open VS Code Settings (`Ctrl+,`) and search for **"FAA"**:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `faa.enabled` | boolean | `true` | Enable/disable FAA failure detection |
| `faa.cooldownSeconds` | number | `5` | Cooldown period between consecutive alerts (1-60 seconds) |
| `faa.showNotification` | boolean | `true` | Show notification popup when failure is detected |
| `faa.playSound` | boolean | `true` | Play alert sound when failure is detected |

### Example `settings.json`:

```json
{
  "faa.enabled": true,
  "faa.cooldownSeconds": 5,
  "faa.showNotification": true,
  "faa.playSound": true
}
```

---

## 🎮 Commands

Access via Command Palette (`Ctrl+Shift+P`):

| Command | Description |
|---------|-------------|
| **FAA: Test Alert** | Trigger a test alert to verify sound and notification |
| **FAA: Toggle Enabled** | Enable or disable FAA monitoring |

---

## 🏗️ Architecture

```
FAA-Sound-Extension/
├── extension.js          # Main extension logic
├── package.json          # Extension manifest
├── media/
│   ├── faaa.mp3         # Alert sound file
│   └── faa-logo.svg     # Extension logo
├── .vscodeignore        # Files excluded from package
├── README.md            # This file
├── CHANGELOG.md         # Version history
└── LICENSE              # MIT License
```

### Core Components

1. **Terminal Data Listener** — Hooks into `vscode.window.onDidWriteTerminalData` to monitor real-time terminal output
2. **Pattern Matcher** — Uses regex patterns to detect 30+ failure types
3. **Cooldown Manager** — Prevents alert spam with configurable cooldown
4. **Sound Player** — Cross-platform audio playback (native OS commands + webview fallback)
5. **Notification System** — Professional VS Code notifications with action buttons

---

## 🖼️ Screenshots

### Alert Notification
```
┌───────────────────────────────────────────────────────────┐
│ 🚨 FAA ALERT — TERMINAL FAILURE DETECTED                  │
│                                                           │
│ Failure detected: ERROR: Cannot find module 'express'     │
│                                                           │
│                              [ Dismiss ]  [ Disable FAA ] │
└───────────────────────────────────────────────────────────┘
```

### Status Bar Activation
```
🚨 FAA — Monitoring terminals for failures...
```

---

## 🔧 Troubleshooting

### Sound Not Playing?

**Windows:**
- Ensure Windows Media Player components are installed
- Check system volume is not muted

**macOS:**
- FAA uses `afplay` which is built into macOS
- Check system volume settings

**Linux:**
- Install one of: `paplay`, `aplay`, `mpg123`, `ffplay`
- Example: `sudo apt install pulseaudio-utils` (for paplay)

### Too Many Alerts?

- Increase cooldown: `faa.cooldownSeconds`: `10`
- Disable notifications: `faa.showNotification`: `false`
- Use **FAA: Toggle Enabled** to temporarily disable

---

## 🗺️ Future Roadmap

- [ ] 🎵 Custom sound file support
- [ ] 🎨 Custom notification themes
- [ ] 📊 Failure statistics dashboard
- [ ] 🔗 Integration with CI/CD tools
- [ ] 📱 Mobile push notifications
- [ ] 🤖 AI-powered error explanations
- [ ] 🌐 Slack/Discord webhook support

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/FAA-Sound-Extension.git`
3. **Create** a feature branch: `git checkout -b feature/amazing-feature`
4. **Make** your changes
5. **Test** thoroughly in VS Code Extension Development Host (`F5`)
6. **Commit** your changes: `git commit -m 'Add amazing feature'`
7. **Push** to your branch: `git push origin feature/amazing-feature`
8. **Open** a Pull Request

### Development Setup

```bash
# Install dependencies
npm install

# Open in VS Code
code .

# Press F5 to launch Extension Development Host
# Make changes and test in the new VS Code window
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

<div align="center">

**Pradeep Kumar Awasthi**

*Instrumentation & Control Engineering*

**Dr. B.R. Ambedkar National Institute of Technology Jalandhar**

[![GitHub](https://img.shields.io/badge/GitHub-pradeep--gif--hub-181717?style=for-the-badge&logo=github)](https://github.com/pradeep-gif-hub)

</div>

---

<div align="center">

### ⭐ If FAA saves your debugging time, consider giving it a star! ⭐

Made with ❤️ for developers who need a little extra alert when things go wrong.

**🚨 FAA — Because failures shouldn't go unnoticed! 🚨**

</div>
