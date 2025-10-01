async function testAPI() {
  try {
    console.log('Testing login API...');
    const loginResponse = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: '+79161111111',
        password: 'test123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }
    
    const token = loginData.access_token;
    console.log('Login successful, token received');
    
    console.log('\nTesting metrics dashboard API...');
    const dashboardResponse = await fetch('http://localhost:3001/metrics/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const dashboardData = await dashboardResponse.json();
    console.log('Dashboard response status:', dashboardResponse.status);
    console.log('Dashboard data:', JSON.stringify(dashboardData, null, 2));
    
  } catch (error) {
    console.error('API Test Error:', error.message);
  }
}

testAPI();