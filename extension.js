const vscode = require('vscode');
const cp = require('child_process');
const path = require('path');
const fs = require('fs');

let webviewPanel = null;

function activate(context) {
  console.log('FAA SOUND: activated');

  const play = async () => {
    try {
      const file = locateSoundFile();
      if (!file) {
        console.warn('FAA SOUND: no sound file found (set "faaSound.file" or place faa-sound.wav in workspace root)');
        return;
      }
      await playSoundFileInWebview(context, file);
    } catch (err) {
      console.error('FAA SOUND play error:', err);
    }
  };

  const termClose = vscode.window.onDidCloseTerminal((t) => {
    try {
      const status = t.exitStatus;
      if (status && typeof status.code === 'number' && status.code !== 0) {
        play();
      }
    } catch (e) {
      // ignore if API not present
    }
  });

  const taskEnd = vscode.tasks.onDidEndTaskProcess((e) => {
    if (typeof e.exitCode === 'number' && e.exitCode !== 0) {
      play();
    }
  });

  context.subscriptions.push(termClose, taskEnd);
}

function locateSoundFile() {
  const config = vscode.workspace.getConfiguration('faaSound');
  const rel = config.get('file') || 'faaah.mp3';

  // workspace root
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length) {
    const candidate = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, rel);
    if (fs.existsSync(candidate)) return candidate;
  }

  // extension folder
  const extCandidate = path.join(__dirname, rel);
  if (fs.existsSync(extCandidate)) return extCandidate;

  // absolute path fallback
  if (fs.existsSync(rel)) return path.resolve(rel);

  return null;
}

async function playSoundFileInWebview(context, file) {
  // Create or reveal a hidden webview panel used to play audio inside VS Code
  try {
    const fileUri = vscode.Uri.file(file);
    const webview = getOrCreateWebview(context);
    const webviewUri = webview.webview.asWebviewUri(fileUri);
    webview.webview.html = getWebviewContent(String(webviewUri));
  } catch (err) {
    console.error('playSoundFileInWebview error:', err);
  }
}

function getOrCreateWebview(context) {
  if (webviewPanel) return webviewPanel;
  webviewPanel = vscode.window.createWebviewPanel(
    'faaSoundPlayer',
    'FAA Sound Player',
    { viewColumn: vscode.ViewColumn.Active, preserveFocus: true },
    {
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );

  // keep panel alive in background (will not take focus because preserveFocus=true)
  context.subscriptions.push(webviewPanel);
  return webviewPanel;
}

function getWebviewContent(audioSrc) {
  return `<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; media-src 'self' ${audioSrc}; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body>
    <audio id="faaAudio" src="${audioSrc}" autoplay></audio>
    <script>
      const a = document.getElementById('faaAudio');
      function tryPlay(){
        a.currentTime = 0;
        const p = a.play();
        if (p && p.then) p.catch(()=>{});
      }
      tryPlay();
      // in case autoplay blocked, retry a few times
      let tries = 0;
      const iv = setInterval(()=>{ tries++; tryPlay(); if(tries>5) clearInterval(iv); }, 500);
    </script>
  </body>
</html>`;
}

function deactivate() {}

module.exports = { activate, deactivate };
