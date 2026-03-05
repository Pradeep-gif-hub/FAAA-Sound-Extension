#!/usr/bin/env node

/**
 * FAA Extension Debug Launcher
 * Automatically opens VS Code with the extension folder and provides debugging instructions
 */

const { spawn } = require('child_process');
const path = require('path');

const extensionPath = __dirname;

console.log('🚀 FAA Sound Extension — Debug Mode Launcher\n');
console.log('=' + '='.repeat(69));
console.log('\n📁 Extension folder:', extensionPath);
console.log('\n🔍 Checking prerequisites...\n');

// Check if sound file exists
const fs = require('fs');
const soundFile = path.join(extensionPath, 'media', 'faaa.mp3');
if (fs.existsSync(soundFile)) {
    console.log('✅ Sound file found: media/faaa.mp3');
} else {
    console.log('❌ ERROR: Sound file NOT found!');
    process.exit(1);
}

// Check if extension.js exists
const extFile = path.join(extensionPath, 'extension.js');
if (fs.existsSync(extFile)) {
    console.log('✅ Extension file found: extension.js');
} else {
    console.log('❌ ERROR: extension.js NOT found!');
    process.exit(1);
}

// Check if package.json exists
const pkgFile = path.join(extensionPath, 'package.json');
if (fs.existsSync(pkgFile)) {
    console.log('✅ Package configuration found: package.json');
} else {
    console.log('❌ ERROR: package.json NOT found!');
    process.exit(1);
}

console.log('\n✅ All prerequisites met!\n');
console.log('=' + '='.repeat(69));
console.log('\n📋 NEXT STEPS:\n');

console.log('1️⃣  VS Code will open with the extension folder');
console.log('   (If it doesn\'t open automatically, run this command:)\n');
console.log('   code "' + extensionPath + '"\n');

console.log('2️⃣  In VS Code, press F5 to start debugging');
console.log('   → This launches the "Extension Development Host"\n');

console.log('3️⃣  A NEW VS Code window will open (the test environment)\n');

console.log('4️⃣  In the NEW window:');
console.log('   • Press Ctrl+` to open a terminal');
console.log('   • Type: wrong_command');
console.log('   • Press Enter\n');

console.log('5️⃣  Check the ORIGINAL VS Code window:');
console.log('   • Go to Debug Console (Ctrl+Shift+Y)');
console.log('   • Look for these logs:\n');
console.log('     🔴 FAA: Error keyword MATCHED');
console.log('     🚨 FAA ALERT TRIGGERED');
console.log('     FAA: Method 1 — Trying native OS audio playback...');
console.log('     ✅ FAA: Native audio playback succeeded\n');

console.log('6️⃣  You should hear the FAA beep! 🔔\n');

console.log('=' . repeat(70));
console.log('\n⚡ QUICK ALTERNATIVE TEST:\n');
console.log('Instead of typing a command, you can:\n');
console.log('1. Press Ctrl+Shift+P in the NEW window');
console.log('2. Type: FAA: Test Alert');
console.log('3. Press Enter');
console.log('→ This triggers a manual test alert immediately!\n');

console.log('=' . repeat(70));
console.log('\n🎯 SUCCESS INDICATORS:\n');
console.log('✅ Audio beep plays');
console.log('✅ Red error notification appears');
console.log('✅ Debug console shows "FAA ALERT TRIGGERED"');
console.log('✅ Multiple indicators appear within 1-2 seconds\n');

console.log('=' . repeat(70));
console.log('\n📖 Full debugging guide available in: DEBUGGING.md\n');

// Launch VS Code
console.log('🚀 Launching VS Code...\n');

try {
    spawn('code.cmd', [extensionPath], {
        detached: true,
        stdio: 'ignore'
    }).unref();
} catch (err) {
    console.error('⚠️  Could not auto-launch VS Code');
    console.log('\nManual launch command:');
    console.log('   code "' + extensionPath + '"\n');
}

console.log('💡 Tip: Save this window for reference while debugging!');
console.log('');
