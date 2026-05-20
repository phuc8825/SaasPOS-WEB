
const bcrypt = require('bcrypt');

async function main() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);
  console.log('\n=== BCRYPT HASH FOR seed.sql ===');
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  console.log('\nReplace the placeholder hash in seed.sql with the above value.\n');
}

main().catch(console.error);