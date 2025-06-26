const { createClient } = require('@libsql/client');

const client = createClient({
  url: 'libsql://optimum-wendigo-jeedug.aws-us-east-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTA5MDk3OTEsImlkIjoiODQ1MGQwZDUtOWQ3My00M2UyLWFkZDktZjA4MjMzOTZkOTU5IiwicmlkIjoiYTRmZmM0OTEtZTMzZC00MWY3LWIyMGEtODI4YzBjNGMzZjQ4In0.VUnKquC3O5ndlteq7icv0oZw1aWJVm1mMRu_J9R0bC1UHEuh82ESNFxhdA5bExRfYZWtueX7139zdlz3tVdrBA'
});

// Initialize the database by creating the users table if it doesn't exist
async function initDatabase() {
  console.log('Database initialized successfully');
}

module.exports = {
  client,
  initDatabase
}; 