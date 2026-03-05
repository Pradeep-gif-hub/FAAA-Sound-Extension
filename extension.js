/**
 * FAA — Failure Alert Assistant
 * VS Code Extension for Terminal Failure Detection
 * 
 * Author: Pradeep Kumar Awasthi
 * Instrumentation & Control Engineering
 * Dr. B.R. Ambedkar National Institute of Technology Jalandhar
 */

const vscode = require('vscode');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ============================================
// CONFIGURATION & STATE
// ============================================

/** @type {vscode.WebviewPanel | null} */
let audioWebviewPanel = null;

/** @type {number} */
let lastAlertTime = 0;

/** @type {boolean} */
let isEnabled = true;

/** @type {Map<string, string>} Terminal name -> buffered output */
const terminalBuffers = new Map();

/** @type {number} Auto-increment terminal counter for unique IDs */
let terminalIdCounter = 0;

// Failure detection patterns (case-insensitive)
const FAILURE_PATTERNS = [
    /\berror\b/i,
    /\bfailed\b/i,
    /\bfailure\b/i,
    /\bexception\b/i,
    /\btraceback\b/i,
    /exit\s*code\s*[1-9]\d*/i,
    /\btask\s*failed?\b/i,
    /\bbuild\s*failed?\b/i,
    /\bnpm\s*err(?:or)?!?\b/i,
    /\bpython\s*exception\b/i,
    /\bcompil(?:er|ation)\s*error\b/i,
    /\bsyntax\s*error\b/i,
    /\bruntime\s*error\b/i,
    /\bfatal\s*error\b/i,
    /\bunhandled\s*exception\b/i,
    /\bsegmentation\s*fault\b/i,
    /\bstack\s*trace\b/i,
    /\bcannot\s*find\s*module\b/i,
    /\bmodule\s*not\s*found\b/i,
    /\bcommand\s*not\s*found\b/i,
    /\bpermission\s*denied\b/i,
    /\baccess\s*denied\b/i,
    /\bconnection\s*refused\b/i,
    /\btimeout\s*error\b/i,
    /\bassertion\s*failed\b/i,
    /\btest\s*failed\b/i,
    /\bcargo\s*error\b/i,
    /\bmake\s*error\b/i,
    /\bgcc\s*error\b/i,
    /\bclang\s*error\b/i,
    /is not recognized as (?:an|the name of)/i,
    /\bnot recognized\b/i,
    /\bcannot be loaded\b/i,
    /\bno such file or directory\b/i
];

// Regex to strip ANSI escape sequences from terminal data
const ANSI_ESCAPE_RE = /\x1b(?:\[[0-9;]*[a-zA-Z]|\].*?(?:\x07|\x1b\\))|[\x00-\x08\x0b\x0c\x0e-\x1f]/g;

/**
 * Strip ANSI escape codes and control characters from a string.
 * Terminal data contains cursor movement, color codes, etc.
 * @param {string} text
 * @returns {string}
 */
function stripAnsi(text) {
    return text.replace(ANSI_ESCAPE_RE, '');
}

// ============================================
// ACTIVATION
// ============================================

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('🚨 FAA — Failure Alert Assistant: Extension activate() called');
    console.log('FAA: Extension path:', context.extensionPath);

    // Load configuration
    loadConfiguration();
    console.log('FAA: Configuration loaded — isEnabled:', isEnabled);

    // Register configuration change listener
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('faa')) {
                loadConfiguration();
                console.log('FAA: Configuration reloaded — isEnabled:', isEnabled);
            }
        })
    );

    // Register terminal data listener (for terminal output monitoring)
    if (typeof vscode.window.onDidWriteTerminalData === 'function') {
        context.subscriptions.push(
            vscode.window.onDidWriteTerminalData((event) => {
                if (!isEnabled) return;
                handleTerminalData(context, event);
            })
        );
        console.log('FAA: Registered onDidWriteTerminalData listener');
    } else {
        console.warn('FAA: vscode.window.onDidWriteTerminalData is NOT available in this VS Code version');
        vscode.window.showWarningMessage('FAA: Terminal data monitoring unavailable. Upgrade VS Code to 1.93+.');
    }

    // Register terminal close listener (for exit codes)
    context.subscriptions.push(
        vscode.window.onDidCloseTerminal((terminal) => {
            if (!isEnabled) return;
            console.log('FAA: Terminal closed:', terminal.name);
            handleTerminalClose(context, terminal);
            // Clean up buffer using terminal name
            terminalBuffers.delete(terminal.name);
        })
    );

    // Register task end listener
    context.subscriptions.push(
        vscode.tasks.onDidEndTaskProcess((event) => {
            if (!isEnabled) return;
            console.log('FAA: Task ended:', event.execution.task.name, 'exitCode:', event.exitCode);
            if (typeof event.exitCode === 'number' && event.exitCode !== 0) {
                triggerAlert(context, `Task "${event.execution.task.name}" failed with exit code ${event.exitCode}`);
            }
        })
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('faa.testAlert', () => {
            console.log('FAA: Test alert command triggered');
            triggerAlert(context, 'This is a test alert from FAA!');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('faa.toggleEnabled', () => {
            isEnabled = !isEnabled;
            const status = isEnabled ? 'enabled' : 'disabled';
            console.log('FAA: Toggled —', status);
            vscode.window.showInformationMessage(`🚨 FAA — Failure Alert Assistant is now ${status}`);
        })
    );

    // Verify sound file exists at activation
    const soundFile = getSoundFilePath(context);
    if (soundFile) {
        console.log('FAA: Sound file found at:', soundFile);
    } else {
        console.error('FAA: WARNING — No sound file found! Check media/faaa.mp3');
    }

    // Show activation message
    vscode.window.setStatusBarMessage('🚨 FAA — Monitoring terminals for failures...', 5000);
    console.log('FAA: Activation complete — monitoring terminals');
}

// ============================================
// CONFIGURATION
// ============================================

function loadConfiguration() {
    const config = vscode.workspace.getConfiguration('faa');
    isEnabled = config.get('enabled', true);
}

/**
 * @returns {number}
 */
function getCooldownMs() {
    const config = vscode.workspace.getConfiguration('faa');
    const seconds = config.get('cooldownSeconds', 5);
    return seconds * 1000;
}

/**
 * @returns {boolean}
 */
function shouldShowNotification() {
    const config = vscode.workspace.getConfiguration('faa');
    return config.get('showNotification', true);
}

/**
 * @returns {boolean}
 */
function shouldPlaySound() {
    const config = vscode.workspace.getConfiguration('faa');
    return config.get('playSound', true);
}

// ============================================
// TERMINAL DATA MONITORING
// ============================================

/**
 * @param {vscode.ExtensionContext} context
 * @param {vscode.TerminalDataWriteEvent} event
 */
function handleTerminalData(context, event) {
    // Use terminal name as buffer key (processId is a Thenable, not sync)
    const terminalKey = event.terminal.name || `terminal-${++terminalIdCounter}`;

    // Get or create buffer for this terminal
    let buffer = terminalBuffers.get(terminalKey) || '';
    buffer += event.data;

    // Keep buffer at reasonable size (last 2000 chars)
    if (buffer.length > 2000) {
        buffer = buffer.slice(-2000);
    }
    terminalBuffers.set(terminalKey, buffer);

    // Strip ANSI escape codes before pattern matching
    const cleanText = stripAnsi(event.data);

    // Skip empty or whitespace-only data
    if (!cleanText.trim()) return;

    console.log(`FAA: Terminal "${terminalKey}" — received ${cleanText.length} chars (clean)`);
    console.log(`FAA: Terminal output snippet: "${cleanText.slice(0, 150)}..."`);

    // Check for failure patterns
    for (let i = 0; i < FAILURE_PATTERNS.length; i++) {
        const pattern = FAILURE_PATTERNS[i];
        if (pattern.test(cleanText)) {
            // Extract the matching line for context
            const lines = cleanText.split(/[\r\n]+/);
            const matchingLine = lines.find(line => pattern.test(line)) || cleanText.slice(0, 100);
            console.log(`🔴 FAA: Error keyword MATCHED pattern #${i} (${pattern.toString()}) in: "${matchingLine.trim().slice(0, 120)}"`);
            triggerAlert(context, `Failure detected: ${matchingLine.trim().slice(0, 80)}`);
            break;
        }
    }
}

/**
 * @param {vscode.ExtensionContext} context
 * @param {vscode.Terminal} terminal
 */
function handleTerminalClose(context, terminal) {
    try {
        const exitStatus = terminal.exitStatus;
        console.log('FAA: Terminal close event for', JSON.stringify(terminal.name), '— exitStatus:', exitStatus ? exitStatus.code : 'N/A');
        if (exitStatus && typeof exitStatus.code === 'number' && exitStatus.code !== 0) {
            triggerAlert(context, `Terminal exited with code ${exitStatus.code}`);
        }
    } catch (e) {
        console.warn('FAA: Error reading terminal exit status:', e.message);
    }
}

// ============================================
// ALERT SYSTEM
// ============================================

/**
 * @param {vscode.ExtensionContext} context
 * @param {string} message
 */
function triggerAlert(context, message) {
    const now = Date.now();
    const cooldown = getCooldownMs();

    // Check cooldown
    if (now - lastAlertTime < cooldown) {
        const remaining = Math.ceil((cooldown - (now - lastAlertTime)) / 1000);
        console.log(`FAA: Alert suppressed (cooldown active) — next allowed in ${remaining}s (last alert was ${Math.ceil((now - lastAlertTime) / 1000)}s ago)`);
        return;
    }

    lastAlertTime = now;
    console.log(`\n${'='.repeat(60)}\n🚨 FAA ALERT TRIGGERED\n${'-'.repeat(60)}\nMessage: ${message}\nTime: ${new Date().toLocaleTimeString()}\n${'='.repeat(60)}\n`);

    // Play sound
    if (shouldPlaySound()) {
        console.log('FAA: Sound setting enabled — initiating audio playback...');
        playAlertSound(context);
    } else {
        console.log('FAA: ⚠️ Sound playback disabled in settings (faa.playSound = false)');
    }

    // Show notification
    if (shouldShowNotification()) {
        console.log('FAA: Notification setting enabled — showing alert popup...');
        showAlertNotification(message);
    } else {
        console.log('FAA: ⚠️ Notification disabled in settings (faa.showNotification = false)');
    }
}

/**
 * @param {string} message
 */
function showAlertNotification(message) {
    const title = '🚨 FAA ALERT — TERMINAL FAILURE DETECTED';
    
    vscode.window.showErrorMessage(
        `${title}\n\n${message}`,
        'Dismiss',
        'Disable FAA'
    ).then((selection) => {
        if (selection === 'Disable FAA') {
            isEnabled = false;
            vscode.window.showInformationMessage('FAA has been disabled. Use "FAA: Toggle Enabled" to re-enable.');
        }
    });
}

// ============================================
// SOUND PLAYBACK
// ============================================

/**
 * Get the path to the alert sound file
 * @param {vscode.ExtensionContext} context
 * @returns {string | null}
 */
function getSoundFilePath(context) {
    // Primary location: media/faaa.mp3 in extension folder
    const extensionPath = context.extensionPath;
    const primaryPath = path.join(extensionPath, 'media', 'faaa.mp3');
    
    if (fs.existsSync(primaryPath)) {
        return primaryPath;
    }

    // Fallback: root of extension folder
    const fallbackPath = path.join(extensionPath, 'faaa.mp3');
    if (fs.existsSync(fallbackPath)) {
        return fallbackPath;
    }

    // Legacy fallback: faaah.mp3
    const legacyPath = path.join(extensionPath, 'faaah.mp3');
    if (fs.existsSync(legacyPath)) {
        return legacyPath;
    }

    console.warn('FAA: Sound file not found');
    return null;
}

/**
 * @param {vscode.ExtensionContext} context
 */
async function playAlertSound(context) {
    const soundFile = getSoundFilePath(context);

    if (!soundFile) {
        console.error('🔴 FAA: No sound file found — cannot play alert');
        return;
    }

    console.log('🎵 FAA: Attempting to play sound file:', soundFile);
    console.log('FAA: Sound file readable:', fs.accessSync(soundFile, fs.constants.R_OK) === undefined);

    try {
        // Try Method 1: Native playback (Windows Media Player / afplay / Linux players)
        console.log('FAA: Method 1 — Trying native OS audio playback...');
        const nativePlayed = await playNativeSound(soundFile);
        
        if (nativePlayed) {
            console.log('✅ FAA: Native audio playback succeeded');
            return;
        }

        console.log('⚠️ FAA: Native playback failed, trying Method 2 (Windows Media Player)...');
        const wmplayed = await playWindowsMediaPlayer(soundFile);
        if (wmplayed) {
            console.log('✅ FAA: Windows Media Player playback succeeded');
            return;
        }

        console.log('⚠️ FAA: Windows Media Player failed, trying Method 3 (Webview)...');
        await playWebviewSound(context, soundFile);
        console.log('✅ FAA: Webview playback initiated');
        
    } catch (err) {
        console.error('🔴 FAA: Sound playback error:', err.message);
        console.error('FAA: Stack trace:', err.stack);
        // Try webview as absolute last resort
        try {
            console.log('FAA: Final fallback — trying webview...');
            await playWebviewSound(context, soundFile);
        } catch (webviewErr) {
            console.error('🔴 FAA: All playback methods failed:', webviewErr.message);
        }
    }
}

/**
 * Play sound using Windows Media Player directly
 * @param {string} soundFile
 * @returns {Promise<boolean>}
 */
function playWindowsMediaPlayer(soundFile) {
    return new Promise((resolve) => {
        if (os.platform() !== 'win32') {
            resolve(false);
            return;
        }

        try {
            console.log('FAA: Attempting wmplayer.exe execution...');
            const child = spawn('wmplayer.exe', [soundFile], {
                stdio: 'ignore',
                detached: true,
                windowsHide: true
            });

            child.on('error', (err) => {
                console.warn('FAA: wmplayer.exe error:', err.message);
                resolve(false);
            });

            child.unref();
            console.log('FAA: wmplayer.exe process spawned');
            
            // Give it time to start
            setTimeout(() => resolve(true), 500);
            
        } catch (err) {
            console.warn('FAA: Failed to spawn wmplayer.exe:', err.message);
            resolve(false);
        }
    });
}

/**
 * Play sound using native OS commands
 * @param {string} soundFile
 * @returns {Promise<boolean>}
 */
function playNativeSound(soundFile) {
    return new Promise((resolve) => {
        const platform = os.platform();
        let command;
        let args = [];

        console.log('FAA: playNativeSound — platform:', platform, 'file:', soundFile);
        console.log('FAA: Sound file exists:', fs.existsSync(soundFile));
        console.log('FAA: Sound file size:', fs.statSync(soundFile).size, 'bytes');

        if (platform === 'win32') {
            // Windows: Use PowerShell with Windows Media Player COM object (more reliable)
            command = 'powershell';
            
            // Method 1: Windows Media Player COM object
            const escapedPath = soundFile.replace(/"/g, '\"');
            args = [
                '-NoProfile',
                '-ExecutionPolicy', 'Bypass',
                '-Command',
                `$mp = New-Object -ComObject WMPlayer.OCX; $mp.URL = "${escapedPath}"; while ($mp.playState -ne 3) { Start-Sleep -Milliseconds 100 }`
            ];
        } else if (platform === 'darwin') {
            // macOS: Use afplay
            command = 'afplay';
            args = [soundFile];
        } else {
            // Linux: Try multiple players in order
            const players = ['paplay', 'aplay', 'mpg123', 'mpg321', 'play', 'ffplay'];

            for (const player of players) {
                try {
                    const result = require('child_process').spawnSync('which', [player]);
                    if (result.status === 0) {
                        command = player;
                        if (player === 'ffplay') {
                            args = ['-nodisp', '-autoexit', soundFile];
                        } else {
                            args = [soundFile];
                        }
                        console.log('FAA: Linux audio player found:', player);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
        }

        if (!command) {
            console.warn('FAA: No suitable audio command found for platform:', platform);
            resolve(false);
            return;
        }

        console.log('FAA: Spawning audio command:', command, '—', args.join(' '));

        try {
            let isResolved = false;
            
            const child = spawn(command, args, {
                stdio: ['ignore', 'pipe', 'pipe'],
                detached: true,
                windowsHide: true
            });

            let stdoutOutput = '';
            let stderrOutput = '';
            
            child.stdout.on('data', (data) => {
                stdoutOutput += data.toString();
            });
            
            child.stderr.on('data', (data) => {
                stderrOutput += data.toString();
                console.log('FAA: Audio process stderr:', data.toString().slice(0, 100));
            });

            child.on('error', (err) => {
                console.error('🔴 FAA: Audio spawn error:', err.message);
                if (!isResolved) {
                    isResolved = true;
                    resolve(false);
                }
            });

            child.on('exit', (code) => {
                console.log('FAA: Audio process exit code:', code);
                if (code !== 0) {
                    console.warn('FAA: Audio process WARNING:', stderrOutput.slice(0, 200));
                }
                if (!isResolved) {
                    isResolved = true;
                    resolve(true); // Consider it successful if process ran, even if exit code is non-zero
                }
            });

            child.unref();
            
            // Set timeout to resolve after 5 seconds (audio should have started by then)
            setTimeout(() => {
                if (!isResolved) {
                    isResolved = true;
                    console.log('FAA: Audio playback timeout reached - resolving as success');
                    resolve(true);
                }
            }, 5000);
            
        } catch (err) {
            console.error('🔴 FAA: Failed to spawn audio process:', err.message);
            resolve(false);
        }
    });
}

/**
 * Play sound using VS Code webview (fallback method)
 * @param {vscode.ExtensionContext} context
 * @param {string} soundFile
 */
async function playWebviewSound(context, soundFile) {
    try {
        const fileUri = vscode.Uri.file(soundFile);
        
        if (!audioWebviewPanel) {
            audioWebviewPanel = vscode.window.createWebviewPanel(
                'faaAudioPlayer',
                'FAA Audio',
                { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [
                        vscode.Uri.file(path.dirname(soundFile)),
                        vscode.Uri.file(context.extensionPath)
                    ]
                }
            );

            audioWebviewPanel.onDidDispose(() => {
                audioWebviewPanel = null;
            });
        }

        const audioUri = audioWebviewPanel.webview.asWebviewUri(fileUri);
        
        audioWebviewPanel.webview.html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; media-src ${audioWebviewPanel.webview.cspSource} vscode-resource: https:; script-src 'unsafe-inline';">
    <style>
        body {
            background: #1e1e1e;
            color: #d4d4d4;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
        }
        .alert-icon {
            font-size: 48px;
            margin-bottom: 16px;
            animation: pulse 1s ease-in-out infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        h1 { color: #ff6b6b; margin: 0 0 8px 0; font-size: 18px; }
        p { opacity: 0.7; font-size: 12px; margin: 0; }
    </style>
</head>
<body>
    <div class="alert-icon">🚨</div>
    <h1>FAA ALERT</h1>
    <p>Playing alert sound...</p>
    <audio id="alertAudio" autoplay>
        <source src="${audioUri}" type="audio/mpeg">
    </audio>
    <script>
        const audio = document.getElementById('alertAudio');
        audio.play().catch(e => console.log('Autoplay blocked:', e));
        
        // Retry playback
        let retries = 0;
        const retry = setInterval(() => {
            if (retries++ > 3) {
                clearInterval(retry);
                return;
            }
            audio.currentTime = 0;
            audio.play().catch(() => {});
        }, 500);
        
        // Close panel after playback
        audio.onended = () => {
            clearInterval(retry);
        };
    </script>
</body>
</html>`;

    } catch (err) {
        console.error('FAA: Webview sound error:', err);
    }
}

// ============================================
// DEACTIVATION
// ============================================

function deactivate() {
    if (audioWebviewPanel) {
        audioWebviewPanel.dispose();
        audioWebviewPanel = null;
    }
    terminalBuffers.clear();
    console.log('FAA — Failure Alert Assistant: Deactivated');
}

module.exports = { activate, deactivate };
