// scripts/generate-icon.js
// Run with: npm run icon
// Generates resources/icon.png, resources/icon.ico, docs/icon.png, build/icon.png, build/icon.ico

const sharp = require('sharp')
const fs = require('fs')

const SVG = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1d1530"/>
      <stop offset="100%" stop-color="#0b0915"/>
    </linearGradient>
    <radialGradient id="glowGrad" cx="50%" cy="50%" r="55%">
      <stop offset="0%" stop-color="rgba(124,92,191,0.28)"/>
      <stop offset="100%" stop-color="rgba(124,92,191,0)"/>
    </radialGradient>
    <linearGradient id="boltGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#c8b8f0"/>
    </linearGradient>
    <filter id="boltGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur"/>
    </filter>
  </defs>
  <!-- Dark purple-black rounded square background -->
  <rect width="512" height="512" rx="96" ry="96" fill="url(#bgGrad)"/>
  <!-- Radial purple glow centered behind the bolt -->
  <rect width="512" height="512" rx="96" ry="96" fill="url(#glowGrad)"/>
  <!-- Bolt soft glow layer (blurred duplicate) -->
  <path d="M 285 100 L 185 272 L 252 272 L 212 415 L 328 242 L 258 242 Z"
        fill="rgba(157,125,232,0.5)" filter="url(#boltGlow)"/>
  <!-- Bolt solid (white to soft lavender gradient) -->
  <path d="M 285 100 L 185 272 L 252 272 L 212 415 L 328 242 L 258 242 Z"
        fill="url(#boltGrad)"/>
  <!-- Subtle purple border -->
  <rect width="512" height="512" rx="96" ry="96"
        fill="none" stroke="rgba(157,125,232,0.18)" stroke-width="2"/>
</svg>`

async function main() {
  const svgBuf = Buffer.from(SVG)

  // 512x512 source PNG → resources, docs, and build
  await sharp(svgBuf).resize(512, 512).png().toFile('resources/icon.png')
  fs.copyFileSync('resources/icon.png', 'docs/icon.png')
  fs.copyFileSync('resources/icon.png', 'build/icon.png')
  console.log('  resources/icon.png (512x512)')
  console.log('  docs/icon.png')
  console.log('  build/icon.png')

  // Multi-size ICO — png-to-ico is ESM, use dynamic import
  // It accepts a single PNG path and auto-generates 16/32/48/256 sizes
  const { default: pngToIco } = await import('png-to-ico')
  const ico = await pngToIco('resources/icon.png')
  fs.writeFileSync('resources/icon.ico', ico)
  fs.copyFileSync('resources/icon.ico', 'build/icon.ico')
  console.log('  resources/icon.ico (16/32/48/64/128/256)')
  console.log('  build/icon.ico')

  console.log('Done.')
}

main().catch(err => { console.error(err); process.exit(1) })
