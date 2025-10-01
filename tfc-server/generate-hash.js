const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'test123';
  const saltRounds = 10;
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}`);
    
    // Verify the hash
    const isMatch = await bcrypt.compare(password, hash);
    console.log(`Verification: ${isMatch}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

generateHash();