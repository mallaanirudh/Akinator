import { Client } from 'pg';

async function testConnection() {
  console.log('🚀 Starting connection test...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });

  try {
    console.log('1. Attempting to connect...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    console.log('2. Testing basic query...');
    const result = await client.query('SELECT version()');
    console.log('✅ Query successful!');
    
    console.log('3. Database version:', result.rows[0].version);
    
    await client.end();
    console.log('🎉 All tests passed! Ready for Prisma.');
    
  } catch (error) {
    console.log('❌ Connection failed!');
    console.log('Error message:', error.message);
    console.log('Error code:', error.code);
    
    // Common solutions based on error
    if (error.message.includes('password authentication')) {
      console.log('\n💡 SOLUTION: Reset your password in Supabase dashboard → Settings → Database');
    } else if (error.message.includes('does not exist')) {
      console.log('\n💡 SOLUTION: Check your project reference in the connection string');
    } else if (error.message.includes('timeout')) {
      console.log('\n💡 SOLUTION: Network issue - try different internet connection');
    } else {
      console.log('\n💡 Check if Supabase project is active and not paused');
    }
  }
}

testConnection();