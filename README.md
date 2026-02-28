
# FAA SOUND

FAA SOUND is a lightweight VS Code extension that plays a configurable audio file when a terminal command or task exits with a non-zero exit code. It is intended to provide an audible alert for failed runs.

Author: Pradeep Kuamr Awasthi

Features
- Plays a workspace audio file when a terminal or task fails.
- Configurable sound filename via `faaSound.file` (default: `faaah.mp3`).
- Activates at startup so failures are audible immediately.

Installation
1. Open the extension folder in VS Code.
2. Press `F5` to run in an Extension Development Host while developing.

Configuration
- `faaSound.file` (string): Path to sound file relative to the workspace root. Default: `faaah.mp3`.

Testing
1. Ensure `faaah.mp3` (or your chosen file) is placed in the workspace root.
2. In the Extension Development Host, open the integrated terminal and run a failing command. Example (Windows PowerShell):

```powershell
powershell -NoProfile -Command "exit 1"
```

The extension should detect the non-zero exit and play the configured audio file.

Packaging & Publishing
1. Install `vsce` (if not installed):

```powershell
npm install -g vsce
```

2. Create a publisher on https://marketplace.visualstudio.com/manage and obtain a Personal Access Token (PAT).
3. Login with `vsce login <publisher>` and provide the PAT when prompted.
4. From the extension folder run:

```powershell
npx vsce package
npx vsce publish
```

Notes and Recommendations
- WAV files are recommended for the built-in PowerShell `Media.SoundPlayer` on Windows. MP3 files will open via the default player as a fallback.
- Ensure one of the common audio players is available on macOS/Linux (`afplay`, `paplay`, `mpg123`, `mplayer`, or `ffplay`).

License
This project is licensed under the MIT License — see the `LICENSE` file for details.
