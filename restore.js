const { execSync } = require('child_process');
try {
  execSync('git restore .', { stdio: 'inherit' });
  console.log('Restored successfully');
} catch (e) {
  console.error('Failed to restore', e);
}
