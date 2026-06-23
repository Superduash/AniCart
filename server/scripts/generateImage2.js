const sharp = require('sharp');

const out = 'temp_upload_large_2.png';

sharp({
  create: {
    width: 1920,
    height: 1280,
    channels: 3,
    background: { r: 101, g: 151, b: 201 },
  },
})
  .png()
  .toFile(out)
  .then(() => console.log('Generated', out))
  .catch((err) => {
    console.error('Error generating image:', err);
    process.exit(1);
  });
