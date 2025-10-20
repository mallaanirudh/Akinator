import net from 'net';

function testPort() {
  return new Promise((resolve) => {
    const client = new net.Socket();
    const timeout = 10000;
    
    client.setTimeout(timeout);
    
    client.connect(6543, 'aws-1-us-east-1.pooler.supabase.com', () => {
      console.log(' Can reach Supabase server on port 6543');
      client.destroy();
      resolve(true);
    });
    
    client.on('error', (err) => {
      console.log(' Cannot reach Supabase server:', err.message);
      resolve(false);
    });
    
    client.on('timeout', () => {
      console.log(' Connection timeout - server not responding');
      client.destroy();
      resolve(false);
    });
  });
}

testPort();