// Test the actual API login endpoint
const http = require('http');

async function testLoginAPI() {
  const postData = JSON.stringify({
    username: 'testuser',
    email: 'testuser',
    password: 'test123'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('🔄 Testing login API endpoint...');
  console.log('URL: http://localhost:5000/api/auth/login');
  console.log('Body:', postData);
  console.log('');

  const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
    console.log('');

    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Response Body:');
      try {
        const jsonData = JSON.parse(data);
        console.log(JSON.stringify(jsonData, null, 2));
        
        if (res.statusCode === 200) {
          console.log('\n✅ LOGIN SUCCESSFUL!');
          console.log('Token:', jsonData.token);
        } else {
          console.log('\n❌ LOGIN FAILED');
          console.log('Error:', jsonData.message);
        }
      } catch (e) {
        console.log(data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request Error:', error.message);
  });

  req.write(postData);
  req.end();
}

testLoginAPI();
