import { hashPassword } from '../lib/crypto.js';

const pw = process.argv[2];
if (!pw || pw.length < 10) {
  console.error('Usage: npm run hash-password -- "a-password-of-10+-characters"');
  process.exit(1);
}
console.log(`ADMIN_PASSWORD_HASH=${hashPassword(pw)}`);
