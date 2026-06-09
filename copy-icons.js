import fs from 'fs';

try {
  fs.copyFileSync('public/examcity_no_bg.png', 'public/favicon-96x96.png');
  fs.copyFileSync('public/examcity_no_bg.png', 'public/apple-touch-icon.png');
  fs.copyFileSync('public/examcity_no_bg.png', 'public/web-app-manifest-192x192.png');
  fs.copyFileSync('public/examcity_no_bg.png', 'public/web-app-manifest-512x512.png');
  console.log('✅ Exam City favicon and manifest touch icons have been synced with the brand logo.');
} catch (error) {
  console.error('❌ Error syncing brand logo to favicons:', error);
}
