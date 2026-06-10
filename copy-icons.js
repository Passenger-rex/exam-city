import fs from 'fs';

function copyIfValid(srcPath, destPath, fallbackPath) {
  try {
    if (fs.existsSync(srcPath) && fs.statSync(srcPath).size > 0) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Synced ${srcPath} -> ${destPath}`);
    } else if (fallbackPath && fs.existsSync(fallbackPath)) {
      fs.copyFileSync(fallbackPath, destPath);
      console.log(`Fallback synced ${fallbackPath} -> ${destPath}`);
    }
  } catch (err) {
    console.error(`Error copying ${srcPath} -> ${destPath}:`, err);
  }
}

try {
  const masterIcon = 'public/examcity_no_bg.png';
  if (fs.existsSync(masterIcon)) {
    fs.copyFileSync(masterIcon, 'public/favicon.ico');
    fs.copyFileSync(masterIcon, 'public/favicon-96x96.png');
    fs.copyFileSync(masterIcon, 'public/apple-touch-icon.png');
    fs.copyFileSync(masterIcon, 'public/web-app-manifest-192x192.png');
    fs.copyFileSync(masterIcon, 'public/web-app-manifest-512x512.png');
    console.log('✅ Synchronized all output favicons forcefully using examcity_no_bg.png as the master image.');
  } else {
    console.warn(`⚠️ Master icon ${masterIcon} not found in public/ directory.`);
  }

  // 2. Copy site.webmanifest if it exists at root
  copyIfValid('site.webmanifest', 'public/site.webmanifest', null);

  // 3. SVG favicon fallback
  if (fs.existsSync('favicon.svg') && fs.statSync('favicon.svg').size > 0) {
    fs.copyFileSync('favicon.svg', 'public/favicon.svg');
    console.log('Synced custom SVG favicon -> public/favicon.svg');
  }

  console.log('✅ Exam City assets synchronized smoothly.');
} catch (error) {
  console.error('❌ Error in copy-icons script:', error);
}
