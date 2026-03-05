#!/usr/bin/env node

/**
 * FAA Audio Playback Test Script
 * Tests all audio playback methods on Windows independently
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const soundFile = path.join(__dirname, 'media', 'faaa.mp3');

console.log('🔧 FAA Audio Playback Test\n');
console.log('Platform:', process.platform);
console.log('Sound file:', soundFile);
console.log('Sound file exists:', fs.existsSync(soundFile));
if (fs.existsSync(soundFile)) {
    console.log('Sound file size:', fs.statSync(soundFile).size, 'bytes\n');
}

// Test 1: PowerShell with WMP COM object
function testPowershellWMP() {
    return new Promise((resolve) => {
        console.log('\n📢 Test 1: PowerShell + Windows Media Player COM Object');
        console.log('=' + '='.repeat(59));

        if (os.platform() !== 'win32') {
            console.log('⏭️  Skipped (not Windows)');
            resolve();
            return;
        }

        const escapedPath = soundFile.replace(/"/g, '\\"');
        const psCommand = `$mp = New-Object -ComObject WMPlayer.OCX; $mp.URL = "${escapedPath}"; while ($mp.playState -ne 3) { Start-Sleep -Milliseconds 100 }`;

        const child = spawn('powershell', [
            '-NoProfile',
            '-ExecutionPolicy', 'Bypass',
            '-Command',
            psCommand
        ], {
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true
        });

        let stderr = '';
        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('error', (err) => {
            console.error('❌ Error:', err.message);
            resolve();
        });

        child.on('exit', (code) => {
            if (code === 0) {
                console.log('✅ Success! WMP COM object played audio (exit code 0)');
            } else {
                console.log(`⚠️  Exit code: ${code}`);
                if (stderr) console.error('Error output:', stderr.slice(0, 200));
            }
            resolve();
        });

        setTimeout(() => {
            console.log('⏱️  Test timed out (30s) - process may still be playing');
            child.kill();
            resolve();
        }, 30000);
    });
}

// Test 2: wmplayer.exe direct launch
function testWmplayer() {
    return new Promise((resolve) => {
        console.log('\n📢 Test 2: wmplayer.exe Direct Launch');
        console.log('=' + '='.repeat(59));

        if (os.platform() !== 'win32') {
            console.log('⏭️  Skipped (not Windows)');
            resolve();
            return;
        }

        const child = spawn('wmplayer.exe', [soundFile], {
            stdio: 'ignore',
            detached: true,
            windowsHide: true
        });

        child.on('error', (err) => {
            console.warn('⚠️  wmplayer.exe not found or error:', err.message);
            resolve();
        });

        child.unref();
        console.log('✅ wmplayer.exe spawned (detached)');
        console.log('Listen for audio playback in the background for ~3 seconds...');

        setTimeout(() => {
            resolve();
        }, 3500);
    });
}

// Test 3: PowerShell mciSendString (old method)
function testMciSendString() {
    return new Promise((resolve) => {
        console.log('\n📢 Test 3: PowerShell + mciSendString (Legacy Method)');
        console.log('=' + '='.repeat(59));

        if (os.platform() !== 'win32') {
            console.log('⏭️  Skipped (not Windows)');
            resolve();
            return;
        }

        const normalizedPath = soundFile.replace(/\\/g, '\\\\');
        const psCommand = [
            'Add-Type @"',
            'using System; using System.Runtime.InteropServices; using System.Text;',
            'public class FAAWinMM {',
            '  [DllImport("winmm.dll")] public static extern int mciSendString(string cmd, StringBuilder buf, int bufSize, IntPtr cb);',
            '}',
            '"@;',
            `[FAAWinMM]::mciSendString('open "${normalizedPath}" type mpegvideo alias faaAlert', $null, 0, [IntPtr]::Zero);`,
            "[FAAWinMM]::mciSendString('play faaAlert wait', $null, 0, [IntPtr]::Zero);",
            "[FAAWinMM]::mciSendString('close faaAlert', $null, 0, [IntPtr]::Zero)"
        ].join('\n');

        console.log('Executing complex PowerShell command...');

        const child = spawn('powershell', [
            '-NoProfile',
            '-ExecutionPolicy', 'Bypass',
            '-Command',
            psCommand
        ], {
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true
        });

        let stderr = '';
        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('error', (err) => {
            console.error('❌ Error:', err.message);
            resolve();
        });

        child.on('exit', (code) => {
            if (code === 0) {
                console.log('✅ mciSendString completed (exit code 0)');
            } else {
                console.log(`⚠️  Exit code: ${code}`);
                if (stderr) console.error('Error output:', stderr.slice(0, 300));
            }
            resolve();
        });

        setTimeout(() => {
            console.log('⏱️  Test timed out (10s)');
            child.kill();
            resolve();
        }, 10000);
    });
}

// Test 4: Check if afplay exists (macOS)
function testAfplay() {
    return new Promise((resolve) => {
        console.log('\n📢 Test 4: afplay (macOS) / Linux players');
        console.log('=' . repeat(60));

        if (process.platform !== 'darwin' && process.platform !== 'linux') {
            console.log('⏭️  Skipped (macOS/Linux only)');
            resolve();
            return;
        }

        const cmd = process.platform === 'darwin' ? 'afplay' : 'paplay';
        const child = spawn(cmd, [soundFile], {
            stdio: 'ignore'
        });

        child.on('error', (err) => {
            console.warn(`⚠️  ${cmd} not found:`, err.message);
            resolve();
        });

        child.on('exit', (code) => {
            if (code === 0) {
                console.log(`✅ ${cmd} played audio successfully`);
            }
            resolve();
        });

        setTimeout(() => {
            console.log(`⏱️  ${cmd} test timed out`);
            resolve();
        }, 5000);
    });
}

// Run all tests
async function runTests() {
    console.log('\nStarting audio playback tests...\n');
    console.log('⚠️  IMPORTANT: Listen for a brief beeping sound during each test\n');

    await testPowershellWMP();
    await testWmplayer();
    await testMciSendString();
    await testAfplay();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed');
    console.log('='.repeat(60));
    console.log('\nResults:');
    console.log('- If you heard a beep during any test, that method works!');
    console.log('- The extension will try methods in order until one succeeds.');
    console.log('\nNext step: Run the extension in debug mode (F5)');
}

runTests().catch(console.error);
