async function testTaskCreation() {
  try {
    console.log('🔐 Testing login...');
    const loginResponse = await fetch('http://localhost:3000/auth/login', {
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
    console.log('Login response status:', loginResponse.status);
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginData);
      return;
    }
    
    const token = loginData.access_token;
    console.log('✅ Login successful, user:', loginData.user.name);
    
    console.log('\n📝 Testing task creation...');
    const taskResponse = await fetch('http://localhost:3000/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Test Task from API',
        description: 'This is a test task created via API',
        type: 'PERSONAL',
        priority: 'MEDIUM',
        taskType: 'FEATURE',
        estimatedHours: 2
      })
    });
    
    const taskData = await taskResponse.json();
    console.log('Task creation response status:', taskResponse.status);
    console.log('Task creation response:', JSON.stringify(taskData, null, 2));
    
    if (taskResponse.ok) {
      console.log('✅ Task created successfully!');
    } else {
      console.error('❌ Task creation failed:', taskData);
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testTaskCreation();