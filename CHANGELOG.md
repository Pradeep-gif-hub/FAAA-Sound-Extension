# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-03-02

### 🚀 Major Release — FAA Failure Alert Assistant

#### ✨ New Features
- **Real-time Terminal Monitoring** — Hooks into VS Code terminal API to detect failures as they happen
- **30+ Failure Patterns** — Detects errors, exceptions, build failures, npm errors, Python tracebacks, and more
- **Cross-Platform Sound Playback** — Native audio playback on Windows, macOS, and Linux
- **Professional Notifications** — Aviation-themed alert popups with action buttons
- **Configurable Cooldown** — Prevent alert spam with adjustable 5-second cooldown
- **Toggle Commands** — Quick enable/disable via Command Palette

#### ⚙️ Configuration Options
- `faa.enabled` — Enable/disable monitoring
- `faa.cooldownSeconds` — Adjust cooldown period
- `faa.showNotification` — Toggle notification popups
- `faa.playSound` — Toggle sound alerts

#### 🎨 Branding
- New aviation-themed logo
- Professional README with badges and documentation
- Dark theme friendly design

#### 🔧 Technical Improvements
- Migrated from webview-only to native OS audio playback
- Added fallback playback mechanism
- Optimized terminal buffer management
- Added comprehensive error handling

---

## [0.0.1] - Initial scaffold
- Scaffolded VS Code extension to play a sound on terminal/task failure
- Added test scripts and sample sound file `faaah.mp3`

## [1.0.1] - 2026-03-02

### 🛠️ Patch
- Fixed extension icon inclusion and `package.json` icon path
- Updated repository links in `package.json` and `README.md` to `pradeep-gif-hub`
- Repackaged VSIX with updated branding

## [1.0.2] - 2026-03-02

### 🧰 Patch
- Incremented package version to `1.0.2` for Marketplace publishing
- Repackaged VSIX to include `media/faa-logo-128.png`
