const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const svgPath = path.join(__dirname, '..', 'media', 'faa-logo.svg');
    const outPath = path.join(__dirname, '..', 'media', 'faa-logo-128.png');
    if (!fs.existsSync(svgPath)) throw new Error('SVG not found: ' + svgPath);
    await sharp(svgPath)
      .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ quality: 90 })
      .toFile(outPath);
    console.log('Wrote PNG:', outPath);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();