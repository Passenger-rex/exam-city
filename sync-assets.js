import fs from 'fs';
import path from 'path';

function fillEmptyOrCopy(srcPath, destPath, fallbackSrc) {
  try {
    // Ensure destination directory exists
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Check if srcPath exists and is non-empty
    if (fs.existsSync(srcPath) && fs.statSync(srcPath).size > 0) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Synced: ${srcPath} -> ${destPath}`);
    } else {
      // Use fallback
      if (fs.existsSync(fallbackSrc)) {
        fs.copyFileSync(fallbackSrc, destPath);
        console.log(`🔄 Copied fallback brand-icon: ${fallbackSrc} -> ${destPath}`);
        
        // Also update the source path so the workspace doesn't have empty placeholder files
        fs.copyFileSync(fallbackSrc, srcPath);
        console.log(`📁 Saved valid brand-icon back to workspace: ${srcPath}`);
      } else {
        console.error(`❌ Fallback source ${fallbackSrc} not found!`);
      }
    }
  } catch (err) {
    console.error(`❌ Error in fillEmptyOrCopy (${srcPath} -> ${destPath}):`, err);
  }
}

try {
  const masterBrandIcon = 'public/examcity_no_bg.png';
  
  if (!fs.existsSync(masterBrandIcon)) {
    console.error(`❌ Master brand icon not found at ${masterBrandIcon}!`);
    process.exit(0);
  }

  // 1. Ensure the empty/placeholder image files in root are filled and copied to public/
  fillEmptyOrCopy('apple-touch-icon.png', 'public/apple-touch-icon.png', masterBrandIcon);
  fillEmptyOrCopy('favicon-32x32.png', 'public/favicon-32x32.png', masterBrandIcon);
  fillEmptyOrCopy('favicon-16x16.png', 'public/favicon-16x16.png', masterBrandIcon);
  fillEmptyOrCopy('android-chrome-192x192.png', 'public/android-chrome-192x192.png', masterBrandIcon);
  fillEmptyOrCopy('android-chrome-512x512.png', 'public/android-chrome-512x512.png', masterBrandIcon);
  
  // 2. Sync the root favicon.ico (built by the user) to the public/ folder
  fillEmptyOrCopy('favicon.ico', 'public/favicon.ico', masterBrandIcon);

  // 3. Process site.webmanifest
  const rootManifestPath = 'site.webmanifest';
  const publicManifestPath = 'public/site.webmanifest';

  if (fs.existsSync(rootManifestPath)) {
    let manifestData = {};
    try {
      const content = fs.readFileSync(rootManifestPath, 'utf8');
      manifestData = JSON.parse(content);
    } catch (e) {
      console.warn('⚠️ Could not parse root site.webmanifest, creating clean manifest instead.');
    }

    // Ensure metadata name and short name are filled
    if (!manifestData.name) {
      manifestData.name = "Exam City";
    }
    if (!manifestData.short_name) {
      manifestData.short_name = "ExamCity";
    }
    
    // Ensure all target icons and keys exist beautifully
    if (!manifestData.icons || manifestData.icons.length === 0) {
      manifestData.icons = [
        {
          "src": "/android-chrome-192x192.png",
          "sizes": "192x192",
          "type": "image/png"
        },
        {
          "src": "/android-chrome-512x512.png",
          "sizes": "512x512",
          "type": "image/png"
        }
      ];
    }
    
    if (!manifestData.theme_color) manifestData.theme_color = "#ffffff";
    if (!manifestData.background_color) manifestData.background_color = "#ffffff";
    if (!manifestData.display) manifestData.display = "standalone";

    // Write back nicely to both root and public so both are completely up-to-date
    const prettifiedManifest = JSON.stringify(manifestData, null, 2);
    fs.writeFileSync(rootManifestPath, prettifiedManifest, 'utf8');
    fs.writeFileSync(publicManifestPath, prettifiedManifest, 'utf8');
    console.log('✅ Generated and synced site.webmanifest successfully!');
  } else {
    // Create one if it somehow got deleted
    const defaultManifest = {
      "name": "Exam City",
      "short_name": "ExamCity",
      "icons": [
        {
          "src": "/android-chrome-192x192.png",
          "sizes": "192x192",
          "type": "image/png"
        },
        {
          "src": "/android-chrome-512x512.png",
          "sizes": "512x512",
          "type": "image/png"
        }
      ],
      "theme_color": "#ffffff",
      "background_color": "#ffffff",
      "display": "standalone"
    };
    const prettifiedDefault = JSON.stringify(defaultManifest, null, 2);
    fs.writeFileSync(rootManifestPath, prettifiedDefault, 'utf8');
    fs.writeFileSync(publicManifestPath, prettifiedDefault, 'utf8');
    console.log('✅ Created default site.webmanifest at root and public/.');
  }
} catch (error) {
  console.error('❌ General error in sync-assets.js:', error);
}
