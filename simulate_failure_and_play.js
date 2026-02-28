const cp = require('child_process');
const path = require('path');

const testPlay = path.join(__dirname, 'test_play.js');
const plat = process.platform;
let cmd;

if (plat === 'win32') {
  cmd = 'powershell -NoProfile -Command "exit 1"';
} else {
  cmd = 'bash -c "exit 1"';
}

console.log('Running failing command to simulate error:', cmd);
cp.exec(cmd, (err, stdout, stderr) => {
  const code = (err && typeof err.code === 'number') ? err.code : 0;
  console.log('Failing command exit code:', code);
  if (code !== 0) {
    console.log('Detected failure — invoking test_play.js to play sound');
    const child = cp.spawn(process.execPath, [testPlay], { stdio: 'inherit' });
    child.on('exit', (c) => {
      console.log('test_play.js exited with', c);
      process.exit(0);
    });
  } else {
    console.log('No failure detected — nothing to do.');
    process.exit(0);
  }
});
