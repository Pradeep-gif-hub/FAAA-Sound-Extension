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

/** @type {Map<number, string>} */
const terminalBuffers = new Map();

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
    /\bclang\s*error\b/i
];

// ============================================
// ACTIVATION
// ============================================

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('🚨 FAA — Failure Alert Assistant: Activated');

    // Load configuration
    loadConfiguration();

    // Register configuration change listener
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('faa')) {
                loadConfiguration();
            }
        })
    );

    // Register terminal data listener (for terminal output monitoring)
    context.subscriptions.push(
        vscode.window.onDidWriteTerminalData((event) => {
            if (!isEnabled) return;
            handleTerminalData(context, event);
        })
    );

    // Register terminal close listener (for exit codes)
    context.subscriptions.push(
        vscode.window.onDidCloseTerminal((terminal) => {
            if (!isEnabled) return;
            handleTerminalClose(context, terminal);
            // Clean up buffer
            terminalBuffers.delete(terminal.processId || 0);
        })
    );

    // Register task end listener
    context.subscriptions.push(
        vscode.tasks.onDidEndTaskProcess((event) => {
            if (!isEnabled) return;
            if (typeof event.exitCode === 'number' && event.exitCode !== 0) {
                triggerAlert(context, `Task "${event.execution.task.name}" failed with exit code ${event.exitCode}`);
            }
        })
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('faa.testAlert', () => {
            triggerAlert(context, 'This is a test alert from FAA!');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('faa.toggleEnabled', () => {
            isEnabled = !isEnabled;
            const status = isEnabled ? 'enabled' : 'disabled';
            vscode.window.showInformationMessage(`🚨 FAA — Failure Alert Assistant is now ${status}`);
        })
    );

    // Show activation message
    vscode.window.setStatusBarMessage('🚨 FAA — Monitoring terminals for failures...', 5000);
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
    const terminalId = event.terminal.processId || Date.now();
    
    // Get or create buffer for this terminal
    let buffer = terminalBuffers.get(terminalId) || '';
    buffer += event.data;
    
    // Keep buffer at reasonable size (last 2000 chars)
    if (buffer.length > 2000) {
        buffer = buffer.slice(-2000);
    }
    terminalBuffers.set(terminalId, buffer);

    // Check for failure patterns
    const text = event.data;
    for (const pattern of FAILURE_PATTERNS) {
        if (pattern.test(text)) {
            // Extract the matching line for context
            const lines = text.split(/[\r\n]+/);
            const matchingLine = lines.find(line => pattern.test(line)) || text.slice(0, 100);
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
        if (exitStatus && typeof exitStatus.code === 'number' && exitStatus.code !== 0) {
            triggerAlert(context, `Terminal exited with code ${exitStatus.code}`);
        }
    } catch (e) {
        // Ignore if API not available
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
        console.log('FAA: Alert suppressed (cooldown active)');
        return;
    }
    
    lastAlertTime = now;
    console.log(`🚨 FAA Alert: ${message}`);

    // Play sound
    if (shouldPlaySound()) {
        playAlertSound(context);
    }

    // Show notification
    if (shouldShowNotification()) {
        showAlertNotification(message);
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
        console.warn('FAA: No sound file available');
        return;
    }

    try {
        // Try native playback first
        const played = await playNativeSound(soundFile);
        
        if (!played) {
            // Fallback to webview-based playback
            await playWebviewSound(context, soundFile);
        }
    } catch (err) {
        console.error('FAA: Sound playback error:', err);
        // Try webview as last resort
        try {
            await playWebviewSound(context, soundFile);
        } catch (webviewErr) {
            console.error('FAA: Webview sound playback failed:', webviewErr);
        }
    }
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

        if (platform === 'win32') {
            // Windows: Use PowerShell with Windows Media Player
            const escapedPath = soundFile.replace(/'/g, "''");
            command = 'powershell';
            args = [
                '-NoProfile',
                '-NonInteractive',
                '-Command',
                `Add-Type -AssemblyName PresentationCore; $player = New-Object System.Windows.Media.MediaPlayer; $player.Open([Uri]"${escapedPath}"); $player.Play(); Start-Sleep -Milliseconds 3000`
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
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
        }

        if (!command) {
            resolve(false);
            return;
        }

        try {
            const child = spawn(command, args, {
                stdio: 'ignore',
                detached: true,
                windowsHide: true
            });

            child.on('error', () => {
                resolve(false);
            });

            child.unref();
            resolve(true);
        } catch (err) {
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
