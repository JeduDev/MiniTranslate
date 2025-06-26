const { client } = require('../config/db');

async function resetDatabase() {
  try {
    console.log('Dropping admin_requests table if exists...');
    await client.execute('DROP TABLE IF EXISTS admin_requests');
    
    console.log('Dropping users table if exists...');
    await client.execute('DROP TABLE IF EXISTS users');
    
    console.log('Creating users table...');
    await client.execute(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        push_token TEXT,
        role TEXT NOT NULL DEFAULT 'user'
      )
    `);
    
    console.log('Creating admin_requests table...');
    await client.execute(`
      CREATE TABLE admin_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        read TEXT NOT NULL DEFAULT 'false',
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    
    console.log('Database reset successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase(); 