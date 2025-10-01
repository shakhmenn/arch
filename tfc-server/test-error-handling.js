async function testErrorHandling() {
  console.log('Testing error handling scenarios...');
  
  try {
    // Test 1: Invalid login credentials
    console.log('\n1. Testing invalid login credentials...');
    const invalidLoginResponse = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: '+79161111111',
        password: 'wrongpassword'
      })
    });
    
    const invalidLoginData = await invalidLoginResponse.json();
    console.log('Invalid login response:', invalidLoginData);
    console.log('Status:', invalidLoginResponse.status);
    
    // Test 2: Invalid phone format
    console.log('\n2. Testing invalid phone format...');
    const invalidPhoneResponse = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: 'invalid-phone',
        password: 'test123'
      })
    });
    
    const invalidPhoneData = await invalidPhoneResponse.json();
    console.log('Invalid phone response:', invalidPhoneData);
    console.log('Status:', invalidPhoneResponse.status);
    
    // Test 3: Missing required fields
    console.log('\n3. Testing missing required fields...');
    const missingFieldsResponse = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: '+79161111111'
        // missing password
      })
    });
    
    const missingFieldsData = await missingFieldsResponse.json();
    console.log('Missing fields response:', missingFieldsData);
    console.log('Status:', missingFieldsResponse.status);
    
    // Test 4: Non-existent endpoint
    console.log('\n4. Testing non-existent endpoint...');
    const notFoundResponse = await fetch('http://localhost:3001/api/nonexistent');
    console.log('Non-existent endpoint status:', notFoundResponse.status);
    
    // Test 5: Unauthorized access to protected endpoint
    console.log('\n5. Testing unauthorized access...');
    const unauthorizedResponse = await fetch('http://localhost:3001/metrics/dashboard');
    const unauthorizedData = await unauthorizedResponse.json();
    console.log('Unauthorized access response:', unauthorizedData);
    console.log('Status:', unauthorizedResponse.status);
    
    // Test 6: Invalid token
    console.log('\n6. Testing invalid token...');
    const invalidTokenResponse = await fetch('http://localhost:3001/metrics/dashboard', {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    
    const invalidTokenData = await invalidTokenResponse.json();
    console.log('Invalid token response:', invalidTokenData);
    console.log('Status:', invalidTokenResponse.status);
    
    console.log('\n✓ Error handling tests completed');
    
  } catch (error) {
    console.error('Error during testing:', error.message);
  }
}

testErrorHandling();