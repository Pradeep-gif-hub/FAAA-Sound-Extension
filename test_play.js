const cp = require('child_process');
const path = require('path');
const fs = require('fs');

const workspaceRoot = path.resolve(__dirname);
const filename = process.argv[2] || 'faaah.mp3';
const filePath = path.join(workspaceRoot, filename);

if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(2);
}

const plat = process.platform;
console.log('Attempting to play:', filePath, 'on', plat);

if (plat === 'win32') {
  // Use start to open default player (works for mp3)
  cp.exec(`start "" "${filePath}"`, (err, out, errOut) => {
    if (err) {
      console.error('Failed to start file:', err);
      process.exit(1);
    }
    console.log('Playback started (Windows start).');
    process.exit(0);
  });
} else {
  // try common players on mac/linux
  const players = ['afplay', 'paplay', 'mpg123', 'mplayer', 'ffplay -nodisp -autoexit'];
  const tryPlayer = (i) => {
    if (i >= players.length) {
      console.error('No audio player found. Install one (afplay/paplay/mpg123/mplayer/ffplay).');
      process.exit(1);
    }
    const cmd = `${players[i]} "${filePath}"`;
    cp.exec(cmd, (err) => {
      if (!err) {
        console.log('Playback started with', players[i]);
        process.exit(0);
      }
      tryPlayer(i + 1);
    });
  };
  tryPlayer(0);
}
