# FAA Sound Extension — Complete Debug Guide

## 🎯 Quick Overview

Your VS Code extension should automatically play an FAA warning sound when terminal errors are detected. The issue was likely in audio playback on Windows.

## ✅ What I Fixed

### 1. **Improved Windows Audio Playback**
   - Replaced complex `mciSendString` with simpler **Windows Media Player COM Object** approach
   - Added direct `wmplayer.exe` fallback
   - Added better error logging for troubleshooting

### 2. **Enhanced Error Detection Logging**
   - Now shows exactly which error pattern matched  
   - Displays the exact terminal output that triggered detection
   - Better cooldown messages

### 3. **Better Fallback Chain**
   - **Method 1**: Native OS audio (Windows Media Player COM / afplay / Linux player)
   - **Method 2**: Windows Media Player (wmplayer.exe) direct launch
   - **Method 3**: Webview fallback (embedded HTML5 audio)

### 4. **Comprehensive Console Logging**
   - Visual separators (=====) for alert events
   - Sound file existence checks
   - Platform detection
   - Process execution details

---

## 🚀 Step-by-Step Testing Guide

### **Phase 1: Test Audio Playback in Isolation**

1. **Open your VS Code extension folder:**
   ```powershell
   cd c:\Users\pawas\OneDrive\Documents\GitHub\FAAA-Sound-Extension
   ```

2. **Run the audio playback test:**
   ```powershell
   node test_audio_playback.js
   ```
   
   **What to expect:**
   - You should hear **beeping sounds** from at least one test
   - Console output shows which method(s) work
   - If you hear beeps, audio playback is **NOT the problem**

3. **Interpret results:**
   - ✅ If beeps play: Audio works, move to Phase 2
   - ❌ If no beeps: Check Windows speakers and volume

---

### **Phase 2: Launch Extension in Debug Mode**

1. **Open the extension folder in VS Code:**
   ```powershell
   code c:\Users\pawas\OneDrive\Documents\GitHub\FAAA-Sound-Extension
   ```

2. **Press `F5` to start debugging**
   - VS Code will open a new "Extension Development Host" window
   - Console tab shows extension logs

3. **Open the Debug Console** (in the original VS Code window, not the extension host)
   - View → Debug Console (or Ctrl+Shift+Y)
   - You should see logs starting with `🚨 FAA —`

4. **Expected logs during activation:**
   ```
   🚨 FAA — Failure Alert Assistant: Extension activate() called
   FAA: Configuration loaded — isEnabled: true
   FAA: Registered onDidWriteTerminalData listener
   FAA: Sound file found at: C:\path\to\media\faaa.mp3
   FAA: Activation complete — monitoring terminals
   ```

---

### **Phase 3: Test the Extension with Terminal Commands**

**In the Extension Development Host window:**

1. **Create a new terminal** (Ctrl+``)

2. **Verify terminal detection** by checking the debug console
   - You should see logs like:
   ```
   FAA: Terminal data received from "powershell"
   ```

3. **Test with a command that fails:**
   ```powershell
   wrong_command
   ```
   
   **Expected result:**
   ```
   The term 'wrong_command' is not recognized...
   ```
   
   **Expected logs in debug console:**
   ```
   FAA: Terminal output snippet: "The term 'wrong_command' is not recognized..."
   🔴 FAA: Error keyword MATCHED pattern #XX (...) in: "...not recognized..."
   
   🚨 FAA ALERT TRIGGERED
   FAA: Sound setting enabled — initiating audio playback...
   FAA: Method 1 — Trying native OS audio playback...
   FAA: Spawning audio command: powershell — ...
   ✅ FAA: Native audio playback succeeded
   ```

4. **You should hear the FAA beep!**

---

### **Phase 4: Test Configuration Settings**

In the Extension Development Host, open **Settings** (Ctrl+,) and search for "FAA":

```json
{
  "faa.enabled": true,
  "faa.playSound": true,
  "faa.showNotification": true,
  "faa.cooldownSeconds": 5
}
```

**Test scenarios:**

1. **Disable sound (faa.playSound = false):**
   - See in console: "Sound playback disabled in settings"
   - No audio, but notification shows

2. **Disable notifications (faa.showNotification = false):**
   - Audio plays, no popup notification

3. **Extend cooldown (faa.cooldownSeconds = 30):**
   - Multiple errors within 30 seconds only trigger once

---

### **Phase 5: Test Manual Alert Command**

1. **Open Command Palette** (Ctrl+Shift+P)
2. **Run command:** `FAA: Test Alert`
3. **Expected:**
   - Alert notification pops up
   - FAA beep plays
   - Console shows: `🚨 FAA ALERT TRIGGERED: This is a test alert!`

---

### **Phase 6: Test Other Error Patterns**

Try these commands to test different error detection patterns:

```powershell
# Test 1: Python exception
python -c "import this"

# Test 2: npm error
npm err fakeerror

# Test 3: Build failure
exit 1

# Test 4: Compilation error
Write-Error "Compilation failed"

# Test 5: Non-existent module
node -e "require('nonexistent-module')"
```

Each should trigger the alert!

---

## 🔧 Troubleshooting

### Problem: No audio plays
**Debug steps:**
1. Check console shows: "FAA: Method 1 — Trying native OS audio playback..."
2. Check sound file exists: `media/faaa.mp3` (should be ~50KB)
3. Run: `node test_audio_playback.js`
4. Check Windows volume mixer is not muted
5. Check speaker connection

### Problem: Extension doesn't activate
**Check:**
1. No errors in Debug Console
2. Menu bar shows "Extension Development Host" (means VS Code extension is running)
3. Try refreshing extension (Ctrl+R in debug window)

### Problem: Terminal errors not detected
**Debug:**
1. Look for `FAA: Terminal output snippet:` in console
2. If you don't see it, `onDidWriteTerminalData` might not be available
3. Check VS Code version (requires 1.93+)

### Problem: Alerts trigger too frequently
**Solution:**
1. Increase `faa.cooldownSeconds` in settings (default 5 seconds)
2. This prevents spam from multiple error lines

---

## 📋 Complete Configuration Reference

These settings control the extension behavior:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `faa.enabled` | bool | true | Master enable/disable switch |
| `faa.playSound` | bool | true | Play audio alert |
| `faa.showNotification` | bool | true | Show popup notification |
| `faa.cooldownSeconds` | number | 5 | Wait before next alert (1-60) |

---

## 🐛 Reading Console Logs Effectively

### Log Symbols
- `🚨` = Alert triggered
- `✅` = Success
- `⚠️` = Warning
- `❌` = Error
- `🔴` = Problem detected
- `📢` = Test phase
- `🎵` = Audio playback attempt

### Log Levels
- **Activation logs**: Show when extension starts
- **Terminal logs**: Show terminal output detected  
- **Alert logs**: Show when failure detected + playback attempted
- **Error logs**: Show the problem if something fails

---

## ✨ Advanced: Custom Error Patterns

Want to detect custom errors? Edit the `FAILURE_PATTERNS` array in `extension.js`:

```javascript
const FAILURE_PATTERNS = [
    /\berror\b/i,
    /\bfailed\b/i,
    /your-custom-pattern/i,  // ← Add custom patterns
    // ... more patterns
];
```

Use `i` flag for case-insensitive matching.

---

## 📝 Common Commands to Test

```powershell
# Trigger immediately
wrong_commandxxxxxxx

# Python error
python -c "raise Exception('test')"

# Node.js error  
node -e "throw new Error('test')"

# Command not found
fakecmd arg1 arg2

# Permission denied
icacls "C:\" /deny %USERNAME%:F

# Non-zero exit
powershell -Command "exit 99"
```

---

## 💾 Files Modified

- **extension.js**: Enhanced audio playback + better logging
- **test_audio_playback.js**: New test utility
- **package.json**: Already configured (no changes needed)

---

## 🎯 Success Criteria

Extension is working when:
1. ✅ You hear a beep when running `wrong_command` in terminal
2. ✅ Console shows "Error keyword MATCHED" + "FAA ALERT TRIGGERED"
3. ✅ Red error notification popup appears
4. ✅ All three happen within 1-2 seconds of the error

---

## 📞 If Still Having Issues

1. **Check console for error messages** (Debug Console in VS Code)
2. **Run `node test_audio_playback.js`** to verify audio works
3. **Verify sound file exists**: `media/faaa.mp3`
4. **Check VS Code version**: Needs 1.93.0+ (View → About)
5. **Try test alert command**: Ctrl+Shift+P → "FAA: Test Alert"

