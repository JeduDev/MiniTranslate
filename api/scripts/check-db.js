const { client } = require('../config/db');

async function checkDatabase() {
  try {
    console.log('Checking users table...');
    const result = await client.execute('SELECT * FROM users');
    console.log('Users in database:', JSON.stringify(result.rows, null, 2));
    console.log(`Total users: ${result.rows.length}`);
    process.exit(0);
  } catch (error) {
    console.error('Error checking database:', error);
    process.exit(1);
  }
}

checkDatabase(); 