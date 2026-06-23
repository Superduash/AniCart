const sharp = require('sharp');

const out = 'temp_upload_large.png';

sharp({
  create: {
    width: 1920,
    height: 1280,
    channels: 3,
    background: { r: 100, g: 150, b: 200 },
  },
})
  .png()
  .toFile(out)
  .then(() => console.log('Generated', out))
  .catch((err) => {
    console.error('Error generating image:', err);
    process.exit(1);
  });
