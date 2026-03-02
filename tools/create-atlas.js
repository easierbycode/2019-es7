#!/usr/bin/env node
/**
 * Evil Invaders Atlas Creator (CLI)
 * Creates game_asset.png + game_asset.json (or custom name)
 * Uses professional MaxRects packer (better than the browser row packer)
 * 
 * Setup once:
 *   cd /path/to/2019-es7
 *   npm init -y
 *   npm install free-tex-packer-core commander
 *   mkdir -p tools assets/sprites   # put your loose sprites here
 */

const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');
const texturePacker = require('free-tex-packer-core');

program
  .name('create-atlas')
  .description('Create sprite atlas PNG + JSON for Evil Invaders')
  .option('-i, --input <dir>', 'Folder with loose sprites (.png/.gif/.jpg)', './assets/sprites')
  .option('-o, --output <dir>', 'Output folder for atlas', './assets')
  .option('-n, --atlasName <name>', 'Base name (without extension)', 'game_asset')
  .option('-w, --maxWidth <num>', 'Max atlas width', '2048')
  .option('-p, --padding <num>', 'Padding between sprites', '4')
  .option('--no-rotation', 'Disable sprite rotation')
  .option('--trim', 'Enable trimming transparent edges', true)
  .parse(process.argv);

const opts = program.opts();

async function main() {
  const inputDir = path.resolve(opts.input);
  const outputDir = path.resolve(opts.output);
  const atlasName = opts.atlasName;

  console.log(`🚀 Creating atlas "${atlasName}" from ${inputDir}`);

  let files;
  try {
    files = await fs.readdir(inputDir);
  } catch (e) {
    console.error(`❌ Input dir not found: ${inputDir}`);
    console.error('   Create it and put your sprites inside (soliderA0.gif etc.)');
    process.exit(1);
  }

  const images = [];
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (['.png', '.gif', '.jpg', '.jpeg'].includes(ext)) {
      const fullPath = path.join(inputDir, file);
      const buffer = await fs.readFile(fullPath);
      images.push({
        path: file,           // becomes frame key in JSON (e.g. soliderA0.gif)
        contents: buffer
      });
    }
  }

  if (images.length === 0) {
    console.error('❌ No sprite images found in input directory.');
    process.exit(1);
  }

  console.log(`📦 Found ${images.length} sprites → Packing...`);

  const packerOptions = {
    textureName: atlasName,
    width: parseInt(opts.maxWidth),
    height: 2048,
    fixedSize: false,
    padding: parseInt(opts.padding),
    allowRotation: !opts.noRotation,
    allowTrim: opts.trim,
    detectIdentical: true,
    exporter: "json",                 // produces exact TexturePacker JSON format
    removeFileExtension: false,       // keep .gif / .png in frame names
    prependFolderName: false,
    scale: 1,
    alphaThreshold: 0
  };

  texturePacker(images, packerOptions, async (packedFiles, error) => {
    if (error) {
      console.error('❌ Packing failed:', error);
      return;
    }

    await fs.mkdir(outputDir, { recursive: true });

    for (const file of packedFiles) {
      const outPath = path.join(outputDir, file.name);
      await fs.writeFile(outPath, file.buffer);
      console.log(`✅ Saved \( {file.name}  ( \){(file.buffer.length / 1024).toFixed(1)} KB)`);
    }

    console.log('\n🎉 ATLAS CREATED SUCCESSFULLY!');
    console.log(`   ${path.join(outputDir, atlasName + '.png')}`);
    console.log(`   ${path.join(outputDir, atlasName + '.json')}`);
    console.log('\nNow run the level editor → Load Game Directory → Atlas tab will see it.');
    console.log('Or just Save All in the editor — it will live-patch everything.');
  });
}

main().catch(err => {
  console.error('💥 Fatal error:', err.message);
  process.exit(1);
});