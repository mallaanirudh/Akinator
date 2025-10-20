import { Client } from 'pg';

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    // Add these options for better connection handling
    connectionTimeoutMillis: 10000,
    query_timeout: 10000,
  });

  try {
    console.log('🔄 Attempting to connect to Supabase...');
    await client.connect();
    console.log('✅ Connected to Supabase successfully!');
    
    // Test query
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL version:', result.rows[0].version);
    
    // Check if we can create tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`📋 Existing tables: ${tables.rows.length}`);
    
    await client.end();
    console.log('🔌 Connection closed.');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('💡 Tips:');
    console.log('   - Check your DATABASE_URL in .env file');
    console.log('   - Verify Supabase project is active');
    console.log('   - Check if your IP is whitelisted in Supabase');
  }
}

testConnection();