import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const THUMB_DIR = 'thumbs';
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

const SIZE_PRESETS = {
  thumbnail: { width: 150, height: 150, fit: 'cover' },
  small: { width: 300, height: 300, fit: 'inside' },
  medium: { width: 600, height: 600, fit: 'inside' },
  large: { width: 1200, height: 1200, fit: 'inside' },
};

export const optimizeImage = async (inputPath, options = {}) => {
  const format = options.format || 'webp';
  const quality = options.quality || 80;
  const width = options.width || null;
  const height = options.height || null;

  const ext = path.extname(inputPath);
  const base = path.basename(inputPath, ext);
  const dir = path.dirname(inputPath);
  const outputName = `${base}.${format}`;
  const outputPath = path.join(dir, outputName);

  let pipeline = sharp(inputPath);

  if (width || height) {
    pipeline = pipeline.resize(width, height, { fit: 'inside', withoutEnlargement: true });
  }

  if (format === 'webp') {
    pipeline = pipeline.webp({ quality });
  } else if (format === 'jpeg' || format === 'jpg') {
    pipeline = pipeline.jpeg({ quality });
  } else if (format === 'png') {
    pipeline = pipeline.png({ quality });
  }

  await pipeline.toFile(outputPath);
  const stats = fs.statSync(outputPath);

  return { path: outputPath, name: outputName, size: stats.size, format };
};

export const generateThumbnails = async (inputPath, presets = ['thumbnail', 'small', 'medium']) => {
  const baseDir = path.dirname(inputPath);
  const thumbDir = path.join(baseDir, THUMB_DIR);
  ensureDir(thumbDir);

  const results = {};
  for (const name of presets) {
    const preset = SIZE_PRESETS[name];
    if (!preset) continue;
    const output = path.join(thumbDir, `${name}_${path.basename(inputPath)}.webp`);
    await sharp(inputPath)
      .resize(preset.width, preset.height, { fit: preset.fit, withoutEnlargement: true })
      .webp({ quality: 70 })
      .toFile(output);
    results[name] = output;
  }
  return results;
};

export const getImageSizes = async (inputPath) => {
  const meta = await sharp(inputPath).metadata();
  return { width: meta.width, height: meta.height, format: meta.format, size: meta.size };
};

export const imageToDataUri = async (inputPath, maxWidth = 50) => {
  const data = await sharp(inputPath)
    .resize(maxWidth, null, { fit: 'inside' })
    .webp({ quality: 30 })
    .toBuffer();
  return `data:image/webp;base64,${data.toString('base64')}`;
};
