const bcrypt = require('bcrypt');

async function main() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password hash generated. Replace the placeholder hash in seed.sql with:');
  console.log(hash);
}

main().catch(console.error);