const { execSync } = require('child_process');

// On Linux x64 environments (e.g. Vercel, Render), ensure the native Rollup binary is installed
if (process.platform === 'linux' && process.arch === 'x64') {
  try {
    require.resolve('@rollup/rollup-linux-x64-gnu');
    console.log('[ensure-rollup] Found @rollup/rollup-linux-x64-gnu in environment.');
  } catch (err) {
    console.log('[ensure-rollup] Installing @rollup/rollup-linux-x64-gnu@4.63.5 for Vercel/Linux...');
    try {
      execSync('npm install --no-save @rollup/rollup-linux-x64-gnu@4.63.5', { stdio: 'inherit' });
      console.log('[ensure-rollup] Successfully installed @rollup/rollup-linux-x64-gnu.');
    } catch (installErr) {
      console.warn('[ensure-rollup] Installation warning:', installErr.message);
    }
  }
} else if (process.platform === 'linux' && process.arch === 'arm64') {
  try {
    require.resolve('@rollup/rollup-linux-arm64-gnu');
    console.log('[ensure-rollup] Found @rollup/rollup-linux-arm64-gnu in environment.');
  } catch (err) {
    console.log('[ensure-rollup] Installing @rollup/rollup-linux-arm64-gnu@4.63.5 for Linux arm64...');
    try {
      execSync('npm install --no-save @rollup/rollup-linux-arm64-gnu@4.63.5', { stdio: 'inherit' });
    } catch (installErr) {
      console.warn('[ensure-rollup] Installation warning:', installErr.message);
    }
  }
} else {
  // Local development on Windows or macOS
  console.log(`[ensure-rollup] Platform ${process.platform}-${process.arch} active.`);
}
